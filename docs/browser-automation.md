# Playwright CLI 浏览器自动化

仓库统一使用微软官方 `@playwright/cli` 和项目级 `playwright-cli` skill。Agent 通过页面快照获得稳定的元素 ref，再执行点击、输入、选择、上传、截图、网络检查或 Trace。旧的自制截图脚本已移除。

## 选择连接方式

| 场景                                         | 方式                                 | 是否复用当前登录态 |
| -------------------------------------------- | ------------------------------------ | ------------------ |
| 操作正在使用的 Chrome                        | `attach --cdp=chrome`                | 是                 |
| 页面依赖 SSO、2FA 或浏览器扩展               | `attach --extension=chrome`          | 是                 |
| 自动化公开页面或做可重复测试                 | `open`                               | 否，默认隔离       |
| 调试单独启动的 Chrome、Electron 或远程浏览器 | `attach --cdp=http://127.0.0.1:9222` | 取决于该调试实例   |

日常登录态操作首选按浏览器通道连接。它不要求记住端口，也不需要重启当前 Chrome。

## 首次准备

项目 skills 已随仓库提交。从仓库根目录安装依赖并验证 skills：

```powershell
pnpm install
pnpm skills:check
pnpm doctor
pnpm browser --help
```

`@playwright/cli` 固定为项目依赖，因此 Agent 应使用 `pnpm browser <command>`，不要依赖机器上的全局版本。只有创建隔离浏览器会话时才可能需要下载浏览器：

```powershell
pnpm browser:install
```

Linux 服务器首次安装浏览器时应同时安装系统库：

```bash
pnpm browser:install --with-deps
```

## 推荐流程：接管当前 Chrome

### 1. 在 Chrome 允许远程调试

1. 保持需要操作的 Chrome 和页面打开。
2. 在地址栏进入 `chrome://inspect/#remote-debugging`。
3. 启用 **Allow remote debugging for this browser instance**。
4. 只在你信任当前 Agent 任务时保持该选项开启。

此流程适用于 Windows 和带桌面环境的 Linux，并且要求 Chrome 与 Agent 在同一台机器上。无桌面的远程 Linux 服务器应使用后文的 headless 流程。

### 2. 建立命名会话

在仓库根目录运行：

```powershell
pnpm browser attach --cdp=chrome -s=work-chrome
```

Edge 对应：

```powershell
pnpm browser attach --cdp=msedge -s=work-edge
```

支持的通道包括 `chrome`、`chrome-beta`、`chrome-dev`、`chrome-canary`、`msedge`、`msedge-beta`、`msedge-dev` 和 `msedge-canary`。

### 3. 让 Agent 识别并操作页面

先查看标签页和当前页面快照：

```powershell
pnpm browser -s=work-chrome tab-list
pnpm browser -s=work-chrome snapshot
```

快照会为可操作元素分配类似 `e15` 的 ref。后续使用 ref，避免依赖容易变化的 CSS：

```powershell
pnpm browser -s=work-chrome click e15
pnpm browser -s=work-chrome fill e21 "需要输入的内容"
pnpm browser -s=work-chrome press Enter
pnpm browser -s=work-chrome screenshot --filename=outputs/browser/current.png
```

页面跳转、弹窗或明显状态变化后重新执行 `snapshot`，不要长期复用旧 ref。可用以下命令辅助排错：

```powershell
pnpm browser -s=work-chrome console error
pnpm browser -s=work-chrome requests
pnpm browser -s=work-chrome tracing-start
# 执行操作
pnpm browser -s=work-chrome tracing-stop
```

### 4. 仅断开，不关闭 Chrome

任务结束时：

```powershell
pnpm browser -s=work-chrome detach
```

`detach` 会结束 CLI 会话，但保留外部 Chrome 及其标签页。接管用户浏览器时不要运行 `close`、`close-all`、`kill-all` 或 `delete-data`。

## 备用流程：Playwright Extension

当页面依赖当前浏览器扩展、复杂 SSO 或 2FA 时，可以安装微软官方 Playwright Extension，然后连接：

```powershell
pnpm browser attach --extension=chrome -s=work-chrome
pnpm browser -s=work-chrome snapshot
pnpm browser -s=work-chrome detach
```

扩展连接同样能访问当前标签页和登录态，因此安全边界与 CDP 接管相同。

## 备用流程：显式 CDP 端口

显式端口适合单独的调试实例、Electron 或远程浏览器，不适合在 Chrome 已经启动后临时给默认实例补参数。

Chrome 136 起，`--remote-debugging-port` 对默认用户数据目录不再生效；必须同时使用非默认 `--user-data-dir`。这会创建独立浏览器资料，默认不会带上日常 Chrome 的登录态。

Windows PowerShell 示例：

```powershell
$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chromePath = $chromeCandidates |
  Where-Object { Test-Path -LiteralPath $_ } |
  Select-Object -First 1

if (-not $chromePath) {
  throw "未找到 chrome.exe"
}

$debugProfile = Join-Path $env:LOCALAPPDATA "daily-work\chrome-cdp-profile"
Start-Process -FilePath $chromePath -ArgumentList @(
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=9222",
  "--user-data-dir=$debugProfile"
)
```

验证端点只监听本机并连接：

```powershell
Invoke-RestMethod http://127.0.0.1:9222/json/version |
  Select-Object Browser, webSocketDebuggerUrl

pnpm browser attach --cdp=http://127.0.0.1:9222 -s=debug-chrome
pnpm browser -s=debug-chrome snapshot
pnpm browser -s=debug-chrome detach
```

Linux 桌面环境中的独立调试实例：

```bash
debug_profile="$HOME/.cache/daily-work/chrome-cdp-profile"
mkdir -p "$debug_profile"

google-chrome \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir="$debug_profile"
```

另一个终端中验证并连接：

```bash
curl --fail --silent http://127.0.0.1:9222/json/version
pnpm browser attach --cdp=http://127.0.0.1:9222 -s=debug-chrome
pnpm browser -s=debug-chrome snapshot
pnpm browser -s=debug-chrome detach
```

不要把调试地址设置为 `0.0.0.0`，不要做公网端口映射，也不要关闭防火墙来暴露 9222。远程机器应通过 SSH tunnel 连接其本机端口，而不是直接公开 CDP。

## 隔离会话

不需要个人登录态时使用隔离会话：

```powershell
pnpm browser -s=research open https://example.com
pnpm browser -s=research snapshot
pnpm browser -s=research screenshot --filename=outputs/browser/example.png
pnpm browser -s=research close
```

默认 profile 只在会话期间保留。只有明确需要跨重启复用时才使用 `--persistent`，并将自定义 profile 放在被 Git 忽略的 `work/`：

```powershell
pnpm browser -s=research open https://example.com --profile=work/browser-profiles/research
```

## 远程 Linux 服务器

无桌面服务器的默认工作流是让 Playwright CLI 启动 headless 浏览器：

```bash
pnpm browser -s=research open https://example.com
pnpm browser -s=research snapshot
pnpm browser -s=research screenshot --filename=outputs/browser/example.png
pnpm browser -s=research close
```

注意：

- 服务器上的 `localhost` 指服务器本身，不能直接连接笔记本上的 Chrome。
- `attach --cdp=chrome` 只适合同机桌面 Chrome。
- 如果浏览器运行在另一台机器，使用 SSH tunnel 或受控浏览器服务，并通过 `attach --cdp=http://127.0.0.1:<local-port>` 连接。
- SSH tunnel 应把远端 CDP 转发到本机回环地址；不要在防火墙上公开 CDP 端口。
- 需要观察 headless 会话时可运行 `pnpm browser show`，再通过 SSH 转发 CLI 输出的本地 dashboard 端口。

Linux 系统依赖和初始化命令见 [environment-setup.md](environment-setup.md)。

## Agent 操作约定

1. 先判断是否需要当前登录态；不需要时使用隔离会话。
2. 接管当前浏览器前，确认用户已开启远程调试。
3. 使用有语义的命名会话，避免多个任务互相操作标签页。
4. 先 `snapshot`，再使用 ref 操作；页面变化后重新快照。
5. 不调用 Cookie 读取命令，不用 `eval` 提取凭证，不把登录状态写入仓库。
6. 发布、发送、购买、删除和最终提交表单只在用户明确授权的范围内执行。
7. 将可交付截图、PDF、Trace 和录像写入 `outputs/<project>/`；临时快照留在被忽略的 `.playwright-cli/` 或 `work/`。
8. 接管的浏览器用 `detach`；CLI 自己打开的隔离浏览器才用 `close`。

## 常见问题

### `attach --cdp=chrome` 找不到浏览器

- 确认当前运行的是受支持的 Chrome/Edge 通道。
- 再次访问 `chrome://inspect/#remote-debugging`，确认已允许当前实例远程调试。
- 执行 `pnpm browser list` 检查是否已有同名会话。
- 若企业策略禁用了远程调试，改用组织允许的方式，不尝试绕过策略。

### 页面有登录态但 Agent 看不到标签页

- 确认连接的是正确浏览器通道和会话。
- 用 `tab-list` 查看所有标签页，再用 `tab-select <index>` 选择。
- 页面依赖扩展时改用 Playwright Extension 连接。

### CLI 命令失去响应

先查看会话：

```powershell
pnpm browser list
```

只清理 CLI 自己创建的隔离会话。对于接管的外部浏览器，优先 `detach`；不要用 `kill-all` 处理用户正在使用的 Chrome。

## 官方资料

- [Playwright CLI 安装](https://playwright.dev/agent-cli/installation)
- [连接已有浏览器](https://playwright.dev/agent-cli/commands/attach)
- [会话与监控面板](https://playwright.dev/agent-cli/sessions)
- [Chrome 远程调试安全变更](https://developer.chrome.com/blog/remote-debugging-port)
