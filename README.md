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
├── .agent-skills/            # 固定到已审阅提交的中央 Skill 子模块
├── .agent-skills.json        # version 2 选择与宿主映射
├── .agent-skills-config/     # 本仓库事实、路由和保护边界
├── .agents/skills/           # materializer 生成的本地发现视图（不手改）
├── apps/video/               # 固定 Remotion 4.0.499 的可控视频工程
├── tools/
│   ├── zenmux/               # ZenMux CLI、轮询、下载和测试
│   ├── media/                # FFprobe 检查
│   └── ops/                  # 环境 doctor
├── projects/managed/         # creator-workflow 管理的项目
├── work/managed/             # creator-workflow 管理的临时文件
├── outputs/managed/          # creator-workflow 管理的生成物和渲染物
├── publications/             # 受管理的发布材料（实际发布需另行授权）
└── scripts/                  # 跨平台核心 + Windows/Linux 初始化入口
```

业务工具仍以 Node.js/TypeScript 为主。Python 只用于运行中央仓库中仅依赖标准库的 Skill materializer，不构成第二套业务 workspace。

## 环境

必需：

- Node.js 24+
- pnpm 11（锁定 11.9.0）
- Git
- 可用的 Python 3 解释器；可用 `DAILY_WORK_PYTHON` 显式指定

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
pnpm zenmux image --prompt-file projects/managed/demo/prompts/poster.txt --size 1024x1536 --dry-run
```

生成图片：

```powershell
pnpm zenmux image --prompt-file projects/managed/demo/prompts/poster.txt --out outputs/managed/demo/poster.png
```

提交并等待原生视频任务：

```powershell
pnpm zenmux video --prompt-file projects/managed/demo/prompts/video.txt --ratio 9:16 --duration 5 --out outputs/managed/demo/clip.mp4
```

如果终端超时，使用已经返回的 job ID 查询，不要重新提交：

```powershell
pnpm zenmux video-status <job-id> --out outputs/managed/demo/clip.mp4
```

上面的命令是直接 CLI 用法。受管 `creator-workflow` 的状态观察只允许查询原 `unknown` 操作的同一
job ID，不开放下载目标；下载或重试必须作为新的、单独预览和授权的操作。最后一帧只有显式提供
`--last-frame-out <path>` 时才会保存，默认不会按远端 URL 猜测文件名。

理解本地视频：

```powershell
pnpm zenmux understand --input work/managed/demo/input.mp4 --prompt-file projects/managed/demo/prompts/understand.txt --out outputs/managed/demo/analysis.md
```

大视频可在理解前创建压缩副本；原视频不会被修改：

```powershell
pnpm zenmux understand --input work/managed/demo/input.mp4 --prompt-file projects/managed/demo/prompts/notes.txt --compress balanced --compressed-out work/managed/demo/input-balanced.mp4 --out outputs/managed/demo/analysis.md

pnpm zenmux understand --input work/managed/demo/input.mp4 --prompt-file projects/managed/demo/prompts/notes.txt --compress strong --compressed-out work/managed/demo/input-for-understanding.mp4 --out outputs/managed/demo/analysis.md
```

`--compress` 默认是 `none`，可选档位如下：

| 档位       | 画面上限  | 帧率上限 | 视频 CRF | 音频                | 适合场景                 |
| ---------- | --------- | -------- | -------- | ------------------- | ------------------------ |
| `light`    | 1920×1080 | 25 fps   | 24       | AAC 96k，最多双声道 | 画面细节或运动较多       |
| `balanced` | 1280×720  | 15 fps   | 26       | AAC 64k，单声道     | 通用视频理解，建议优先用 |
| `strong`   | 960×540   | 10 fps   | 28       | AAC 48k，单声道     | 课件、访谈和超大输入     |

压缩不会放大分辨率或提高源帧率。直接使用 CLI 且未指定 `--compressed-out` 时，副本保存到 `work/zenmux-compressed/<原文件名>-<档位>.mp4`。当前受管 `creator-workflow` 理解路由固定为不压缩；如需压缩，先把本地压缩作为独立操作预览并将衍生文件显式放到 `work/managed/<slug>/`，再把其摘要绑定为后续理解输入。若目标已存在，命令会停止而不是覆盖。`--dry-run` 不调用 ZenMux API，但选择压缩时仍会执行本地转码并写入副本。

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
pnpm browser screenshot --filename=outputs/managed/browser/example.png
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
pnpm --filter @daily-work/video exec remotion render DailyBrief ../../outputs/managed/videos/example.mp4 --props=./examples/daily-brief.json
```

可在 `apps/video/src/Root.tsx` 中扩展新 composition；业务文案和节奏优先写入 props JSON。Linux 初始化会安装 Noto CJK 字体，确保中文模板与 Windows 的渲染结果一致。Remotion 的许可会随主体规模和自动化用途而变化，商用或团队扩大前请重新核对[官方许可](https://www.remotion.dev/license)。

### 媒体检查

```powershell
pnpm media:probe outputs/managed/demo/clip.mp4 --expect-ratio 9:16 --expect-duration 5
```

## Agent Skills

Skill 来源固定在中央 `.agent-skills` 子模块的已审阅提交；`.agent-skills.json` 选择 version 2 能力，`.agent-skills-config/` 保存 daily-work 的事实、路由、managed roots 和保护路径。materializer 只把所选 Skill 生成到本地 `.agents/skills/`，不会联网拉取、更新子模块或改写中央来源。

- ZenMux：`zenmux-context`、`zenmux-setup`、`zenmux-usage`
- Remotion：唯一顶层入口 `remotion-best-practices`，由它聚合所需细分规则；仓库中的 `apps/video/` 继续固定 Remotion 4.0.499
- Playwright：微软官方 `playwright-cli`，负责快照、交互、会话、调试和接管现有浏览器
- Creator：`creator-workflow` 中央通用核心负责工作流与审计，仓库配置层负责 daily-work 的允许路由和路径边界

新 clone 先初始化子模块，再生成本地视图：

```text
git submodule update --init --recursive
pnpm skills:dry-run
pnpm skills:sync
pnpm skills:check
```

`skills:dry-run` 预览配置结果，`skills:sync` 从当前固定提交生成副本，`skills:check` 验证来源、配置、上下文与生成副本一致。三者都不会把中央子模块推进到新提交。

升级 Skill 时，在中央仓库完成审阅与验证，再显式更新本仓库的子模块指针并重新运行以上三项。不要手改 `.agents/skills/`，也不要把“同步”当成自动升级。第三方 Skill 具有可执行指令的权限，中央提交和消费配置都必须进入代码审查。

## 项目工作流

1. 让 `creator-workflow` 从 `projects/_template/` 在 `projects/managed/<slug>/` 建立项目。
2. 在 `brief.md` 写清受众、平台、画幅、时长和验收标准。
3. 把 prompt、props 和人工可编辑的内容提交到 Git。
4. 中间文件放到 `work/managed/<slug>/`，大文件与成片放到 `outputs/managed/<slug>/`，发布材料放到 `publications/`。
5. 在 `manifest.json` 记录模型、参数、请求 ID 和输出路径。
6. 运行静帧、媒体探测和 `pnpm check`，再交付；发布、上传或发送需要对具体目标的单独授权。

历史课程目录 `projects/algorithm-interview-course/`、`work/algorithm-interview-course/`、`outputs/algorithm-interview-course/`，PathNote 现有 `.pathnote/` 受控工具链和 `publications/ai-workbench-four-layers/` 草稿，以及 `apps/video/` 都不由上述 managed roots 接管；除非任务明确针对它们，否则保持原样。

更完整的边界和扩展方式见 [环境初始化](docs/environment-setup.md)、[浏览器自动化指南](docs/browser-automation.md)、[docs/architecture.md](docs/architecture.md) 与 [docs/security-and-cost.md](docs/security-and-cost.md)。

## 自动化

- `pnpm check`：skill 结构、格式、lint、类型检查和单元测试
- `.github/workflows/ci.yml`：每次 push/PR 在 Windows 与 Ubuntu 上执行质量检查
- `.github/workflows/remotion-smoke.yml`：Remotion 变更或手动触发时生成静帧 artifact
- Dependabot：每周检查 npm/pnpm 与 GitHub Actions 依赖

当前 API 和 skill 设计已在 2026-08-12 对照 [ZenMux 官方 Skills](https://zenmux.ai/docs/guide/zenmux-skills.html)、[ZenMux 多模态文档](https://zenmux.ai/docs/guide/advanced/multimodal.html)、[Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills)和 [Playwright CLI](https://playwright.dev/agent-cli/installation)。模型目录和参数会变化，应优先使用官方 skill 与实时文档。
