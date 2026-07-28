# Daily Work AI Studio

一个面向日常零碎工作、自媒体生产和 AI agent 协作的可扩展仓库。它把长期协作规则、官方 Agent Skills、可测试脚本和媒体工程分开管理，并以 Windows 本地电脑与远程 Linux 服务器为一等运行环境。当前覆盖：

- Codex 协作与浏览器操作
- ZenMux 聊天、图片生成、原生视频生成、视频理解和任务查询
- Remotion 参数化竖屏视频、预览、静帧和成片渲染
- FFmpeg/FFprobe 媒体检查
- GitHub Actions 质量检查、Remotion 冒烟渲染和依赖更新

## 设计

```text
daily-work/
├── AGENTS.md                 # 所有 agent 都应遵循的长期仓库规则
├── .agents/skills/           # 项目级官方 skills + 跨工具 creator-workflow
├── apps/video/               # Remotion 可控视频工程
├── tools/
│   ├── zenmux/               # ZenMux CLI、轮询、下载和测试
│   ├── media/                # FFprobe 检查
│   └── ops/                  # 环境 doctor
├── projects/                 # 可提交的 brief、prompt、props 和 manifest
├── work/                     # 临时文件，默认忽略
├── outputs/                  # 大型生成物和渲染物，默认忽略
└── scripts/                  # 跨平台核心 + Windows/Linux 初始化入口
```

这里刻意以 Node.js/TypeScript 为主：Remotion 本身就在这一生态，Node 24 又原生提供 `fetch`、文件流和测试所需能力。等某类工作确实依赖 Python 生态时，再增加独立的 Python workspace，避免一开始维护两套环境。

## 环境

必需：

- Node.js 24+
- pnpm 11（锁定 11.9.0）
- Git

推荐：

- FFmpeg（包含 `ffprobe`），用于视频理解前的可选压缩和最终媒体检查
- Windows/Linux 桌面环境中的 Chrome 或 Edge，用于接管正在使用的浏览器
- Playwright CLI 自带浏览器，用于无需个人登录态的隔离自动化

Linux 服务器还应安装 FFmpeg、Playwright 系统库和 Noto CJK 字体。完整依赖矩阵见 [Windows 与 Linux 环境初始化](docs/environment-setup.md)。

## 初始化

Windows：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\bootstrap-windows.ps1 -InstallSystemDeps
```

Ubuntu/Debian Linux：

```bash
bash scripts/bootstrap-linux.sh --install-system-deps --with-browser
```

系统依赖已经准备好时，两边都可以直接运行：

```text
pnpm bootstrap
```

初始化会创建 `.env`。只在本机或服务器上编辑它并填入 `ZENMUX_API_KEY`；需要查询余额、配额或费用时再填 `ZENMUX_MANAGEMENT_KEY`。不要把真实密钥发给 agent，也不要提交 `.env`。

## 常用操作

### ZenMux

先看实时模型目录和命令帮助：

```powershell
pnpm zenmux models
pnpm zenmux image --help
pnpm zenmux video --help
pnpm zenmux understand --help
```

验证图片请求但不计费：

```powershell
pnpm zenmux image --prompt "极简未来感的 AI 工作台，竖屏海报" --size 1024x1536 --dry-run
```

生成图片：

```powershell
pnpm zenmux image --prompt "极简未来感的 AI 工作台，竖屏海报" --out outputs/demo/poster.png
```

提交并等待原生视频任务：

```powershell
pnpm zenmux video --prompt "清晨阳光穿过书桌，镜头缓慢推进" --ratio 9:16 --duration 5 --out outputs/demo/clip.mp4
```

如果终端超时，使用已经返回的 job ID 查询，不要重新提交：

```powershell
pnpm zenmux video-status <job-id> --out outputs/demo/clip.mp4
```

理解本地视频：

```powershell
pnpm zenmux understand --input work/input.mp4 --prompt "按时间线总结画面、对白、转场和可剪辑亮点" --out outputs/demo/analysis.md
```

大视频可在理解前创建压缩副本；原视频不会被修改：

```powershell
pnpm zenmux understand --input work/input.mp4 --prompt "生成详细课程笔记" --compress balanced --out outputs/demo/analysis.md

pnpm zenmux understand --input work/input.mp4 --prompt "生成详细课程笔记" --compress strong --compressed-out work/input-for-understanding.mp4 --out outputs/demo/analysis.md
```

`--compress` 默认是 `none`，可选档位如下：

| 档位       | 画面上限  | 帧率上限 | 视频 CRF | 音频                | 适合场景                 |
| ---------- | --------- | -------- | -------- | ------------------- | ------------------------ |
| `light`    | 1920×1080 | 25 fps   | 24       | AAC 96k，最多双声道 | 画面细节或运动较多       |
| `balanced` | 1280×720  | 15 fps   | 26       | AAC 64k，单声道     | 通用视频理解，建议优先用 |
| `strong`   | 960×540   | 10 fps   | 28       | AAC 48k，单声道     | 课件、访谈和超大输入     |

压缩不会放大分辨率或提高源帧率。未指定 `--compressed-out` 时，副本保存到 `work/zenmux-compressed/<原文件名>-<档位>.mp4`；若目标已存在，命令会停止而不是覆盖。`--dry-run` 不调用 ZenMux API，但选择压缩时仍会执行本地转码并写入副本。

本地文件默认最多内联 50 MB，这一限制在压缩完成后检查。CRF 档位不保证固定文件大小；若副本仍超限，可选更强档位、明确提高 `--max-local-mb`，或改用可访问 URL，避免把超大 Base64 请求留在内存中。

### 浏览器

浏览器操作统一使用微软官方 Playwright CLI 和项目中的 `playwright-cli` skill。查看命令：

```powershell
pnpm browser --help
```

在 Windows 或 Linux 桌面环境中接管已经打开并登录的 Chrome：

```powershell
# 先在 Chrome 打开 chrome://inspect/#remote-debugging
# 启用 “Allow remote debugging for this browser instance”
pnpm browser attach --cdp=chrome -s=work-chrome
pnpm browser -s=work-chrome snapshot
```

完成后只断开 Agent，不关闭正在使用的 Chrome：

```powershell
pnpm browser -s=work-chrome detach
```

无需现有登录态时，让 CLI 打开隔离会话：

```powershell
pnpm browser open https://example.com
pnpm browser snapshot
pnpm browser screenshot --filename=outputs/browser/example.png
pnpm browser close
```

隔离会话首次使用会自动下载浏览器，也可以提前安装：

```powershell
pnpm browser:install
```

显式调试端口、Playwright Extension、会话命名、安全边界和排错步骤见 [浏览器自动化指南](docs/browser-automation.md)。
远程无桌面 Linux 使用 `open` 创建 headless 会话，不使用 `attach --cdp=chrome`。

### Remotion

启动 Studio：

```powershell
pnpm video:studio
```

快速渲染低分辨率静帧：

```powershell
pnpm video:smoke
```

使用示例 props 渲染：

```powershell
pnpm --filter @daily-work/video exec remotion render DailyBrief ../../outputs/videos/example.mp4 --props=./examples/daily-brief.json
```

可在 `apps/video/src/Root.tsx` 中扩展新 composition；业务文案和节奏优先写入 props JSON。Linux 初始化会安装 Noto CJK 字体，确保中文模板与 Windows 的渲染结果一致。Remotion 的许可会随主体规模和自动化用途而变化，商用或团队扩大前请重新核对[官方许可](https://www.remotion.dev/license)。

### 媒体检查

```powershell
pnpm media:probe -- outputs/demo/clip.mp4 --expect-ratio 9:16 --expect-duration 5
```

## Agent Skills

仓库安装的是项目级副本，便于审阅和版本化：

- ZenMux：`zenmux-context`、`zenmux-setup`、`zenmux-usage`
- Remotion：官方完整 skills 集，包括 create、markup、render、captions、docs、upgrade 和 Mediabunny
- Playwright：微软官方 `playwright-cli`，负责快照、交互、会话、调试和接管现有浏览器
- 本仓库：`creator-workflow`，负责把研究、生成、合成和 QA 串起来

项目 skills 已提交到 Git，克隆仓库后无需联网重新安装。验证当前副本：

```powershell
pnpm skills:check
```

只有明确准备审阅第三方变更时才更新：

```powershell
pnpm skills:update
```

更新命令要求 `.agents/skills` 和 `skills-lock.json` 没有未提交修改，然后拉取最新的 ZenMux skills、全部 Remotion skills，并从锁定的本地 `@playwright/cli` 重新生成 Playwright skill。完成后会运行 `skills:check`；仍应检查 Git diff 再决定是否提交。第三方 skill 是可执行指令，不应无审查地自动信任。

Playwright skill 不跟随 GitHub `main` 分支，而由锁定的 `@playwright/cli` 包生成，避免 CLI 与 skill 版本错配；升级 CLI 依赖后运行 `pnpm skills:update` 即可刷新。

## 项目工作流

1. 从 `projects/_template/` 复制一个新项目目录。
2. 在 `brief.md` 写清受众、平台、画幅、时长和验收标准。
3. 把 prompt、props 和人工可编辑的内容提交到 Git。
4. 把大文件、中间生成物和成片放到 `outputs/<slug>/`。
5. 在 `manifest.json` 记录模型、参数、请求 ID 和输出路径。
6. 运行静帧、媒体探测和 `pnpm check`，再交付或发布。

更完整的边界和扩展方式见 [环境初始化](docs/environment-setup.md)、[浏览器自动化指南](docs/browser-automation.md)、[docs/architecture.md](docs/architecture.md) 与 [docs/security-and-cost.md](docs/security-and-cost.md)。

## 自动化

- `pnpm check`：skill 结构、格式、lint、类型检查和单元测试
- `.github/workflows/ci.yml`：每次 push/PR 在 Windows 与 Ubuntu 上执行质量检查
- `.github/workflows/remotion-smoke.yml`：Remotion 变更或手动触发时生成静帧 artifact
- Dependabot：每周检查 npm/pnpm 与 GitHub Actions 依赖

当前 API 和 skill 设计基于 2026-07-26 的 [ZenMux 官方 Skills](https://zenmux.ai/docs/guide/zenmux-skills.html)、[ZenMux 多模态文档](https://zenmux.ai/docs/guide/advanced/multimodal.html)、[Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills)和 [Playwright CLI](https://playwright.dev/agent-cli/installation)。模型目录和参数会变化，应优先使用官方 skill 与实时文档。
