#!/usr/bin/env bash

set -Eeuo pipefail

# This script targets Ubuntu/Debian based AutoDL instances. Its defaults can be
# overridden without editing the file, for example:
#   GIT_USER_NAME="Your Name" GIT_USER_EMAIL="you@example.com" ./init-autodl-env.sh

readonly GIT_USER_NAME="${GIT_USER_NAME:-XiFenM}"
readonly GIT_USER_EMAIL="${GIT_USER_EMAIL:-yinjieshen411@gmail.com}"
readonly V2RAYA_HTTP_PORT="${V2RAYA_HTTP_PORT:-20171}"
readonly V2RAYA_SOCKS_PORT="${V2RAYA_SOCKS_PORT:-20170}"
readonly PROXY_HOST="${PROXY_HOST:-127.0.0.1}"
readonly HTTP_PROXY_URL="http://${PROXY_HOST}:${V2RAYA_HTTP_PORT}"
readonly SOCKS_PROXY_URL="socks5h://${PROXY_HOST}:${V2RAYA_SOCKS_PORT}"
readonly LOCAL_BIN="${HOME}/.local/bin"
readonly BASHRC_FILE="${BASHRC_FILE:-${HOME}/.bashrc}"
readonly CODEX_INSTALL_URL="https://chatgpt.com/codex/install.sh"
readonly NETWORK_TEST_URL="https://api.openai.com/v1/models"

TEMP_DIR=""

log() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$*"
}

warn() {
  printf '\033[1;33m警告: %s\033[0m\n' "$*" >&2
}

die() {
  printf '\033[1;31m错误: %s\033[0m\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
    rm -rf -- "${TEMP_DIR}"
  fi
}
trap cleanup EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "缺少命令 '$1'。请先安装它再重新运行脚本。"
}

as_root() {
  if (( EUID == 0 )); then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    die "安装系统软件需要 root 权限，但当前用户不是 root，且系统中没有 sudo。"
  fi
}

download() {
  local url="$1"
  local output="$2"

  curl --fail --location --show-error --silent \
    --retry 3 --retry-delay 2 \
    "$url" --output "$output"
}

install_vscode_cli() {
  local vscode_platform
  local archive

  log "[1/5] 安装 VS Code CLI"

  mkdir -p -- "$LOCAL_BIN"
  if [[ -x "${LOCAL_BIN}/code" ]]; then
    printf '已安装: %s\n' "$("${LOCAL_BIN}/code" version 2>/dev/null | head -n 1 || printf '%s' "${LOCAL_BIN}/code")"
    return
  fi

  case "$(uname -m)" in
    x86_64 | amd64)
      vscode_platform="cli-alpine-x64"
      ;;
    aarch64 | arm64)
      vscode_platform="cli-alpine-arm64"
      ;;
    *)
      die "暂不支持当前 CPU 架构: $(uname -m)"
      ;;
  esac

  archive="${TEMP_DIR}/vscode-cli.tar.gz"
  download "https://code.visualstudio.com/sha/download?build=stable&os=${vscode_platform}" "$archive"
  tar -xzf "$archive" -C "$TEMP_DIR"
  [[ -f "${TEMP_DIR}/code" ]] || die "VS Code CLI 压缩包中未找到 code 可执行文件。"
  install -m 0755 "${TEMP_DIR}/code" "${LOCAL_BIN}/code"
  printf '安装完成: %s\n' "${LOCAL_BIN}/code"
}

install_v2raya() {
  local key_file="${TEMP_DIR}/v2raya.asc"
  local source_file="${TEMP_DIR}/v2raya.list"

  log "[2/5] 安装 v2rayA、v2ray 和 tmux"

  require_command apt-get
  download "https://apt.v2raya.org/key/public-key.asc" "$key_file"
  printf '%s\n' \
    'deb [signed-by=/etc/apt/keyrings/v2raya.asc] https://apt.v2raya.org/ v2raya main' \
    >"$source_file"

  as_root install -d -m 0755 /etc/apt/keyrings
  as_root install -m 0644 "$key_file" /etc/apt/keyrings/v2raya.asc
  as_root install -m 0644 "$source_file" /etc/apt/sources.list.d/v2raya.list
  as_root apt-get update
  as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y git v2raya v2ray tmux
}

configure_git() {
  log "[3/5] 设置 Git 身份"
  require_command git
  git config --global user.name "$GIT_USER_NAME"
  git config --global user.email "$GIT_USER_EMAIL"
  printf 'user.name  = %s\nuser.email = %s\n' "$GIT_USER_NAME" "$GIT_USER_EMAIL"
}

configure_bashrc() {
  local start_marker='# >>> AutoDL environment >>>'
  local end_marker='# <<< AutoDL environment <<<'
  local new_bashrc="${TEMP_DIR}/bashrc"

  log "[4/5] 写入 Shell 环境变量"

  touch "$BASHRC_FILE"
  awk -v start="$start_marker" -v end="$end_marker" '
    $0 == start { in_block = 1; next }
    $0 == end   { in_block = 0; next }
    !in_block   { print }
  ' "$BASHRC_FILE" >"$new_bashrc"

  # Keep this as a managed block so rerunning the script updates rather than
  # duplicates the proxy settings.
  cat >>"$new_bashrc" <<EOF

${start_marker}
export PATH="\$HOME/.local/bin:\$PATH"
export HTTP_PROXY="${HTTP_PROXY_URL}"
export HTTPS_PROXY="${HTTP_PROXY_URL}"
export ALL_PROXY="${SOCKS_PROXY_URL}"
export NO_PROXY="localhost,127.0.0.1,::1"

export http_proxy="\$HTTP_PROXY"
export https_proxy="\$HTTPS_PROXY"
export all_proxy="\$ALL_PROXY"
export no_proxy="\$NO_PROXY"
${end_marker}
EOF

  chmod --reference="$BASHRC_FILE" "$new_bashrc"
  mv -- "$new_bashrc" "$BASHRC_FILE"

  # The current script will not reload .bashrc, so export the same values for
  # the connectivity test and Codex installer below.
  export PATH="${LOCAL_BIN}:${PATH}"
  export HTTP_PROXY="$HTTP_PROXY_URL" HTTPS_PROXY="$HTTP_PROXY_URL"
  export ALL_PROXY="$SOCKS_PROXY_URL" NO_PROXY="localhost,127.0.0.1,::1"
  export http_proxy="$HTTP_PROXY" https_proxy="$HTTPS_PROXY"
  export all_proxy="$ALL_PROXY" no_proxy="$NO_PROXY"

  printf '已更新: %s\n' "$BASHRC_FILE"
}

wait_for_v2raya() {
  local reply
  local v2raya_command='v2raya'

  if (( EUID != 0 )); then
    v2raya_command='sudo v2raya'
  fi

  log "[5/5] 等待 v2rayA 配置，然后安装 Codex CLI"
  cat <<EOF
请在另一个 SSH 窗口中用 tmux 持久运行 v2rayA：

  tmux new-session -s v2raya
  ${v2raya_command}

用 Ctrl-b d 脱离 tmux 会话，然后打开 v2rayA Web UI（默认端口 2017）完成节点导入、启动和代理端口配置。
本脚本预期 HTTP 代理为 ${HTTP_PROXY_URL}，SOCKS5 代理为 ${SOCKS_PROXY_URL}。
配置完成后回到本窗口输入 done；输入 skip 可暂不安装 Codex，之后重新运行本脚本即可继续。
EOF

  if [[ ! -t 0 ]]; then
    warn "当前不是交互式终端，无法等待 v2rayA 配置信号；已跳过 Codex 安装。"
    return 1
  fi

  while true; do
    if ! read -r -p '> ' reply; then
      warn "输入已关闭，已跳过 Codex 安装。"
      return 1
    fi
    case "${reply,,}" in
      done)
        return 0
        ;;
      skip)
        warn "已按用户要求跳过 Codex 安装。"
        return 1
        ;;
      *)
        printf '请输入 done 或 skip。\n'
        ;;
    esac
  done
}

test_proxy_connectivity() {
  local http_code

  log "通过 v2rayA 测试 OpenAI 网络连通性"
  http_code="$(curl --silent --show-error \
    --proxy "$HTTP_PROXY_URL" \
    --connect-timeout 10 --max-time 30 \
    --output /dev/null --write-out '%{http_code}' \
    "$NETWORK_TEST_URL")" || die "无法通过 ${HTTP_PROXY_URL} 连接 OpenAI；请检查 v2rayA 节点、代理端口和连接状态。"

  [[ "$http_code" != "000" ]] || die "OpenAI 连接未返回 HTTP 响应，请检查 v2rayA 配置。"
  printf '网络连通正常（OpenAI API 返回 HTTP %s；未登录时通常为 401）。\n' "$http_code"
}

install_codex_cli() {
  local installer="${TEMP_DIR}/install-codex.sh"

  log "安装 Codex CLI"
  download "$CODEX_INSTALL_URL" "$installer"
  sh "$installer"

  hash -r
  command -v codex >/dev/null 2>&1 || die "安装器已运行，但当前 PATH 中未找到 codex。请重新登录 Shell 后检查。"
  printf 'Codex CLI 安装完成: %s\n' "$(command -v codex)"
  codex --version
}

main() {
  require_command curl
  require_command tar
  require_command awk
  require_command install

  TEMP_DIR="$(mktemp -d)"

  install_vscode_cli
  install_v2raya
  configure_git
  configure_bashrc

  if wait_for_v2raya; then
    test_proxy_connectivity
    install_codex_cli
  fi

  log "初始化流程结束"
  printf '新开的 Bash 会自动加载环境变量；当前终端可运行: source %q\n' "$BASHRC_FILE"
}

main "$@"
