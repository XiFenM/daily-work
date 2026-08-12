#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
required_pnpm="11.9.0"
install_system_deps=false
with_browser=false
check_only=false

usage() {
  cat <<'EOF'
Usage: bash scripts/bootstrap-linux.sh [options]

Options:
  --install-system-deps  Install Git and FFmpeg with apt-get (Debian/Ubuntu).
  --with-browser        Install the Playwright browser and Linux OS dependencies.
  --check-only          Validate prerequisites without changing the repository.
  --help                Show this help.
EOF
}

while (($# > 0)); do
  case "$1" in
    --install-system-deps)
      install_system_deps=true
      ;;
    --with-browser)
      with_browser=true
      ;;
    --check-only)
      check_only=true
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

run_as_root() {
  if ((EUID == 0)); then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "Root privileges are required for system packages; install sudo or run as root." >&2
    exit 1
  fi
}

if [[ "$install_system_deps" == true ]]; then
  if command -v apt-get >/dev/null 2>&1; then
    run_as_root apt-get update
    run_as_root apt-get install -y ca-certificates git ffmpeg fontconfig fonts-noto-cjk python3
  else
    echo "Automatic system package installation currently supports Debian/Ubuntu only." >&2
    echo "Install Git, FFmpeg, fontconfig, and a Simplified Chinese font, then rerun without --install-system-deps." >&2
    exit 1
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 24+ is required. Install it first; see docs/environment-setup.md." >&2
  exit 1
fi

node_version="$(node --version)"
node_major="${node_version#v}"
node_major="${node_major%%.*}"
if ((node_major < 24)); then
  echo "Node.js 24+ is required; current version is $node_version." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Git is required. Install it or rerun with --install-system-deps on Debian/Ubuntu." >&2
  exit 1
fi

python_command="${DAILY_WORK_PYTHON:-}"
if [[ -z "$python_command" ]]; then
  python_command="$(command -v python3 || true)"
fi
if [[ -z "$python_command" ]] || ! python_version="$("$python_command" --version 2>&1)" || [[ "$python_version" != Python\ 3.* ]]; then
  echo "Python 3 is required to materialize central Skills; see docs/environment-setup.md." >&2
  exit 1
fi
export DAILY_WORK_PYTHON="$python_command"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Warning: FFmpeg is not installed; final audio/video QA will be unavailable." >&2
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm_command=(pnpm)
  pnpm_version="$(pnpm --version)"
  pnpm_major="${pnpm_version%%.*}"
  if ((pnpm_major < 11)); then
    if ! command -v npx >/dev/null 2>&1; then
      echo "pnpm 11+ is required; current version is $pnpm_version and npx is unavailable." >&2
      exit 1
    fi
    echo "Warning: global pnpm is too old; using pnpm@$required_pnpm through npx." >&2
    pnpm_command=(npx --yes "pnpm@$required_pnpm")
    pnpm_version="$required_pnpm"
  fi
elif command -v npx >/dev/null 2>&1; then
  echo "Warning: global pnpm was not found; using pnpm@$required_pnpm through npx." >&2
  pnpm_command=(npx --yes "pnpm@$required_pnpm")
  pnpm_version="$required_pnpm"
else
  echo "npm/npx is missing from the Node.js installation." >&2
  exit 1
fi

echo "Linux environment"
echo "  OS:     $(uname -srm)"
echo "  Node:   $node_version"
echo "  pnpm:   $pnpm_version"
echo "  Git:    $(git --version)"
echo "  Python: $python_version"
if command -v ffmpeg >/dev/null 2>&1; then
  echo "  FFmpeg: $(ffmpeg -version 2>/dev/null | sed -n '1p')"
else
  echo "  FFmpeg: not installed"
fi

if [[ "$check_only" == true ]]; then
  exit 0
fi

cd "$repo_root"
bootstrap_args=(bootstrap)
if [[ "$with_browser" == true ]]; then
  bootstrap_args+=(-- --with-browser-deps)
fi

"${pnpm_command[@]}" "${bootstrap_args[@]}"

if [[ -f .env ]]; then
  chmod 600 .env
fi
