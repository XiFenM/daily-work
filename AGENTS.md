# Daily Work AI Studio

本仓库是人与 AI agent 协作处理日常工作和自媒体生产的长期工作台。优先交付可复用的源文件、脚本和验证证据，不只交付一次性结果。

## 开始任务

1. 阅读本文件和与任务最相关的项目 skill；`.agents/skills/` 是由中央 `.agent-skills` 子模块按 version 2 配置生成的本地视图，不是手工维护的副本。
2. 多步骤自媒体任务使用 `creator-workflow`。通用流程在中央核心中，仓库事实、允许路由、managed roots 和保护路径在 `.agent-skills-config/creator-workflow.json` 中配置。
3. ZenMux 相关事实先使用 `zenmux-context`；配置使用 `zenmux-setup`；用量查询使用 `zenmux-usage`。
4. Remotion 的唯一顶层入口是 `remotion-best-practices`；需要的细分规则由该 skill 内部聚合，不直接选择其他 Remotion skill。
5. API、模型名、参数或第三方产品行为可能变化时，查阅最新官方文档。
6. Windows 与 Linux 都是支持环境。优先调用 `package.json` 中的 `pnpm` scripts 和 Node.js 工具，不把 PowerShell、盘符、反斜杠或仅 Linux 可用的命令硬编码进跨平台逻辑。
7. 新增系统级步骤时，同时更新 `scripts/bootstrap-windows.ps1`、`scripts/bootstrap-linux.sh` 和 `docs/environment-setup.md`；Shell 专用命令必须分别提供两种系统的写法。

## 安全与费用

- 不得要求用户在聊天中粘贴 API key、Cookie、Token 或浏览器会话。
- 密钥只能从根目录 `.env` 或当前进程环境变量读取，不得提交、打印或写入 manifest。
- 即使第三方 skill 建议写入 shell 启动文件，也不要自动修改全局 shell 配置。
- 生成类 API 可能计费。每次计费操作都需要与具体操作、模型和输入对应的授权；意图不明确或调试请求体时先使用 `--dry-run`。
- 异步视频任务超时或结果未知后，先用原 job ID/receipt 做只读查询，不得直接重复提交；重试是新的计费操作，需要单独授权。
- 默认不发布内容、不发送消息、不上传文件；每次外部写操作都需要对具体目标的明确授权，先前授权不得扩展到其他目标或后续操作。

## 文件与产物

- creator-workflow 管理的持久项目：`projects/managed/<slug>/`，从 `projects/_template/` 创建。
- creator-workflow 管理的临时文件：`work/managed/<slug>/`。
- creator-workflow 管理的大型生成与渲染结果：`outputs/managed/<slug>/`。
- 受管理的发布材料：`publications/`；发布仍属于外部写操作，必须另行授权。
- Remotion 公共素材：`apps/video/public/`。
- 保留输入素材，创建衍生文件，不覆盖原件。
- 在项目 `manifest.json` 中记录模型、参数、请求或任务 ID、输入和输出路径；不得记录密钥或大段 base64。
- 历史课程目录 `projects/algorithm-interview-course/`、`work/algorithm-interview-course/`、`outputs/algorithm-interview-course/`，PathNote 的 `.pathnote/` 受控工具链与现有 `publications/ai-workbench-four-layers/` 草稿，以及固定为 Remotion 4.0.499 的 `apps/video/` 均不属于本次 managed roots；没有针对对应路径的明确迁移或升级任务时不得改写。

## 浏览器操作

- 浏览器操作使用项目安装的微软官方 `playwright-cli` 及 `playwright-cli` skill。先执行 `snapshot`，优先使用快照中的 ref 操作元素。
- 用户要求操作正在使用的 Chrome 或任务需要现有登录态时，先让用户在 `chrome://inspect/#remote-debugging` 中允许当前实例远程调试，再用 `pnpm browser attach --cdp=chrome -s=work-chrome` 连接。
- 接管外部浏览器后，结束时使用 `pnpm browser -s=work-chrome detach`；不要对用户的 Chrome 执行 `close`、`close-all`、`kill-all` 或 `delete-data`。
- 无需现有登录态的可重复任务使用 `pnpm browser open <url>` 创建隔离会话；只有需要本地安装浏览器时才运行 `pnpm browser:install`。
- 不读取、打印或保存 Cookie、Token、localStorage 登录凭证；除非用户明确要求，不执行 `state-save`。需要保存状态时只能写入被 Git 忽略的 `work/`。
- 发布、发送、购买、删除或最终提交表单属于外部写操作，只在用户明确授权的范围内执行。
- 不绕过验证码、访问控制或网站限制。
- 详细连接流程与排错见 `docs/browser-automation.md`。

## ZenMux

- 统一通过 `pnpm zenmux` 调用，不在临时脚本中重复实现鉴权、轮询和落盘。
- 新请求先运行对应命令的 `--help`；新模型或新参数先用 `--dry-run`。
- 使用 `pnpm zenmux models` 检查实时模型目录。
- 图片响应和视频任务元数据要与输出文件一起保存。
- creator-workflow 只开放机械绑定的最小 ZenMux 路由：图片 prompt、数量、格式、输出与计费边界必须精确对应；理解任务固定为不压缩、非流式和 50 MB 本地上限；视频路由等待完成并只接受 prompt、模型、时长、画幅、分辨率、seed 与精确输出；状态查询只能观察原 unknown 操作的 job ID/receipt，不能借查询路由写文件或触发重试。
- managed 图片输出必须使用与 `--format` 完全一致的 `.png`、`.jpeg` 或 `.webp` 扩展名。参考媒体、任意 `extra`、压缩、no-wait、生成音频和最后一帧下载不属于当前 managed 路由；只有任务明确要求并单独满足既有授权与费用规则时，才能直接调用对应 CLI 选项。

## Remotion

- 文案、颜色、场景和节奏通过 props/schema 暴露，不把活动内容硬编码进通用组件。
- 仅使用 `useCurrentFrame()` 驱动动画，不使用 CSS transition 或 CSS animation。
- 先预览，再渲染代表性静帧，最后渲染成片。
- 1080 像素宽画面中，关键文字左右至少保留 80 像素安全区。
- 字体栈必须包含 Linux 可安装的 `Noto Sans CJK SC`，不得只依赖 Windows 或 macOS 系统字体。

## 验证

- 代码改动：`pnpm check`
- Skill 配置预检：`pnpm skills:dry-run`
- Skill 生成/一致性：`pnpm skills:sync` / `pnpm skills:check`
- 环境诊断：`pnpm repo:doctor`
- Remotion 静帧：`pnpm video:smoke`
- 音视频元数据：`pnpm media:probe <file>`
- 交付时说明已验证项、未验证项、输出绝对路径和外部调用情况。
