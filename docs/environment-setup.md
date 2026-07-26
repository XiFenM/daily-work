# Windows 与 Linux 环境初始化

仓库使用同一套 Node.js、pnpm workspace、CLI 参数、`.env` 和产物目录。平台专用脚本只负责检查或安装系统依赖，随后都调用 `scripts/bootstrap.mjs` 完成一致的初始化。

## 支持范围

| 环境                       | 支持级别    | 典型用途                                          |
| -------------------------- | ----------- | ------------------------------------------------- |
| Windows 10/11 + PowerShell | 一等支持    | 本地创作、接管正在使用的 Chrome、Remotion Studio  |
| Ubuntu/Debian Linux        | 一等支持    | 远程 headless 浏览器、批量生成、Remotion 渲染、CI |
| 其他 Linux 发行版          | Node 层支持 | 需要自行安装 FFmpeg、CJK 字体和 Playwright 系统库 |

统一要求：

- Node.js 24 或更高版本
- pnpm 11；仓库锁定版本为 11.9.0
- Git
- FFmpeg 与 FFprobe
- Linux 渲染中文时安装 Noto CJK 字体

如果没有全局 pnpm，两个初始化脚本会通过 `npx pnpm@11.9.0` 完成本次初始化。为了后续直接运行所有 `pnpm` 命令，仍建议安装项目锁定版本：

```text
npm install --global pnpm@11.9.0
```

## Windows

### 已安装系统依赖

从仓库根目录执行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\bootstrap-windows.ps1
```

脚本会：

1. 验证 Node.js 24+、pnpm、Git 和 FFmpeg；
2. 在缺少全局 pnpm 时临时使用锁定版本；
3. 创建本地 `.env`；
4. 安装 workspace 依赖和项目 skills；
5. 运行 `pnpm doctor`。

### 首次配置新 Windows 机器

安装缺少的 Node.js LTS、Git 和 FFmpeg：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\bootstrap-windows.ps1 -InstallSystemDeps
```

系统包通过 `winget` 安装。安装 Node.js 后若当前终端仍找不到 `node`，重新打开 PowerShell 再运行一次。

同时预装 Playwright 隔离浏览器：

```powershell
.\scripts\bootstrap-windows.ps1 -InstallSystemDeps -WithBrowser
```

只检查，不改变仓库：

```powershell
.\scripts\bootstrap-windows.ps1 -CheckOnly
```

## Ubuntu/Debian Linux

先从 [Node.js 官方下载页](https://nodejs.org/en/download/)安装 Node.js 24。若使用 nvm：

```bash
nvm install 24
nvm use 24
npm install --global pnpm@11.9.0
```

### 已安装系统依赖

```bash
bash scripts/bootstrap-linux.sh
```

### 首次配置远程服务器

以下命令会通过 `apt-get` 安装 Git、FFmpeg、fontconfig 和 Noto CJK 字体，并安装 Playwright 浏览器及其 Linux 系统库：

```bash
bash scripts/bootstrap-linux.sh --install-system-deps --with-browser
```

请提前预留服务器磁盘空间。在最小 Debian 12 环境的实测中，Git、FFmpeg、fontconfig 和 Noto CJK 等系统包约下载 262 MB、安装后约占 839 MB；Playwright 浏览器缓存和项目 `node_modules` 还会另外占用空间。不同发行版和版本的实际体积会变化，建议首次安装前至少保留数 GB 可用空间。

需要 `root` 或免交互可用的 `sudo`。生产服务器不允许脚本使用 sudo 时，由管理员提前安装系统包，然后执行：

```bash
bash scripts/bootstrap-linux.sh
pnpm browser:install
```

只检查：

```bash
bash scripts/bootstrap-linux.sh --check-only
```

## 统一核心入口

系统依赖准备好后，Windows 与 Linux 都可以直接使用：

```text
pnpm bootstrap
pnpm doctor
pnpm check
```

安装 Playwright 浏览器：

```text
# Windows，或 Linux 已有浏览器系统库
pnpm bootstrap -- --with-browser

# Linux，同时安装 Playwright 系统库
pnpm bootstrap -- --with-browser-deps
```

`--with-browser-deps` 只允许在 Linux 使用，并可能调用系统包管理器。

## Linux 服务器运行模式

### 浏览器

无桌面服务器使用 Playwright CLI 的默认 headless 会话：

```bash
pnpm browser -s=research open https://example.com
pnpm browser -s=research snapshot
pnpm browser -s=research screenshot --filename=outputs/browser/example.png
pnpm browser -s=research close
```

`attach --cdp=chrome` 只连接与 Agent 同一台机器上的桌面 Chrome。远程 Linux 没有桌面浏览器时，不要使用该模式；应使用 CLI 启动的 headless 浏览器，或通过 SSH tunnel 连接一个明确授权的远程 CDP 端点。不得公开 9222 到公网。

### Remotion

服务器不需要打开 Studio 即可渲染：

```bash
pnpm video:smoke
pnpm video:render
```

Linux 初始化安装 `fonts-noto-cjk`，模板的字体栈优先使用 `Noto Sans CJK SC`，以避免中文缺字。Windows 使用系统自带的微软雅黑作为回退。

如需在本地查看远程 Studio：

1. 在服务器运行 `pnpm video:studio`；
2. 根据终端显示的端口建立 SSH tunnel；
3. 在本机浏览器打开转发后的 `127.0.0.1` 地址。

不要把 Studio 或 CDP 端口直接暴露到公网。

### 文件与密钥

- Windows 与 Linux 都从仓库根目录 `.env` 读取 ZenMux 密钥。
- 不提交 `.env`；远程服务器使用仅当前用户可读的权限：`chmod 600 .env`。
- 输入临时文件放 `work/`，输出放 `outputs/`，项目元数据放 `projects/`。
- 在两台机器之间同步源码时排除 `.env`、`node_modules/`、`work/` 和 `outputs/`；大型产物单独通过对象存储、`scp` 或 `rsync` 传输。

## 跨平台命令约定

后续 Agent 应优先运行 package scripts，而不是直接调用带平台差异的可执行文件：

```text
pnpm zenmux ...
pnpm browser ...
pnpm media:probe ...
pnpm video:smoke
pnpm video:render
pnpm check
```

路径通过 Node.js `path` API 解析。文档示例中的 `/` 可同时用于 Node CLI 的 Windows 和 Linux 路径；Shell 自身的复制、权限、服务管理和 SSH 命令才按平台分别书写。

## 迁移或升级检查

每次在新机器部署或升级 Node、Playwright、Remotion 后执行：

```text
pnpm install --frozen-lockfile
pnpm skills:install
pnpm doctor
pnpm check
pnpm video:smoke
```

Playwright 升级后重新运行浏览器安装；远程服务器还应检查磁盘空间、可用内存、字体和 FFmpeg：

```bash
pnpm browser:install --dry-run
ffmpeg -version
ffprobe -version
fc-match "Noto Sans CJK SC"
```
