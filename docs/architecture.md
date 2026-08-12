# 架构与扩展原则

## 边界

| 层                                      | 负责什么                                                   | 不负责什么                       |
| --------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `AGENTS.md`                             | 仓库长期规则、安全边界、验证命令                           | 某个供应商的完整 API 文档        |
| `.agent-skills/` + `.agent-skills.json` | 固定中央来源提交，按 version 2 选择 Skill 与宿主           | 仓库密钥、业务产物、自动跟随上游 |
| `.agent-skills-config/`                 | daily-work 的事实、允许路由、managed roots、模板和保护路径 | 改写中央通用工作流               |
| `.agents/skills/`                       | materializer 生成的本地发现视图                            | 人工编辑或版本升级来源           |
| `tools/` 与 `apps/`                     | 确定性 API 调用、轮询、检查和可渲染媒体工程                | 创意判断和未经授权的平台发布     |

这种拆分让通用能力在中央仓库统一升级，让 daily-work 只维护可审查的配置差异。生成视图可以删除后重建；中央子模块指针和 version 2 配置才是 Git 中的权威来源。

## Skill 生命周期

中央 `.agent-skills` 子模块必须固定到已有且已审阅的提交。`pnpm skills:dry-run` 预览 materialize，`pnpm skills:sync` 从当前提交生成 `.agents/skills/`，`pnpm skills:check` 校验中央提交、配置摘要、生成上下文和副本内容一致。这些命令不会 fetch、更新子模块或选择更新版本。

`creator-workflow` 采用“中央通用核心 + 仓库配置层”：

- 中央核心定义状态机、receipt、逐操作授权、恢复语义和通用路由协议；
- `.agent-skills-config/creator-workflow.json` 声明 daily-work 的已跟踪事实、profile、允许命令、参数、effects、managed roots 和保护路径；
- materializer 把配置事实与所需 Skill 摘要写入生成上下文；来源、配置或依赖 Skill 发生漂移后，运行时必须拒绝继续使用旧上下文。

Remotion 的唯一顶层入口是 `remotion-best-practices`。它在中央侧聚合细分规则；daily-work 不向 agent 暴露一组可任意选择的 Remotion 顶层 Skill，也不因 Skill 迁移升级 `apps/video/` 中固定的 Remotion 4.0.499 运行时。

## 平台边界

`scripts/bootstrap.mjs` 是 Windows 与 Linux 共用的初始化核心，负责 Node workspace、`.env`、子模块就绪检查、materialize、Skill 一致性和 doctor。materializer 使用中央仓库的 Python 标准库脚本；它不引入 daily-work 的第二套业务依赖。`bootstrap-windows.ps1` 与 `bootstrap-linux.sh` 处理系统包、Shell 和权限差异，再调用同一个核心入口。

业务工具必须通过 `pnpm` scripts 暴露，内部路径使用 Node.js `path` API。Windows 盘符、PowerShell、`apt-get`、`chmod`、SSH tunnel 等平台细节只出现在对应初始化脚本或文档中。CI 同时在 Windows 与 Ubuntu 上执行一致性与质量检查；Remotion 冒烟渲染继续在 Ubuntu 上验证 headless 和 Linux 字体。

## 为什么不用一个万能脚本

浏览器、生成模型和 Remotion 的失败模式不同：

- 浏览器任务依赖页面状态、登录态和人工可见反馈；
- 图片/视频生成是远端计费任务，需要请求记录、异步状态和防重复提交；
- Remotion 是本地确定性渲染，需要 props、静帧和媒体 QA。

`creator-workflow` 只负责受约束的调度与审计。浏览器继续使用微软官方 Playwright CLI，供应商 API 和媒体检查继续使用独立的本地 CLI。daily-work 的 package route 使用 `package-script-v2`：参数类型与常量、输入路径及摘要、精确或可推导输出、供应商/模型/数量/请求边界都由配置机械绑定。图片、理解和等待式视频生成只开放当前能完整绑定的最小参数集；视频状态路由只绑定原 unknown 操作的 receipt/job ID 进行观察，不提供自由输出路径。每个远端写入或计费调用都必须对应具体 route、输入、目标和授权；超时或未知结果先观察原 receipt/job，不能把观察结果当成自动重试许可。

## 推荐扩展方式

- 新供应商：增加 `tools/<provider>` 和受测试的 package script，提供 `--dry-run`、结构验证、请求 ID 和结果落盘；再在仓库配置层显式加入最小 route。
- 新媒体模板：在明确解除冻结并单独评审运行时影响后，才在 `apps/video` 新增 composition 和 props schema。
- 新通用流程：在中央 `agent-skills` 仓库用 skill-creator 创建或升级 Skill；daily-work 只更新子模块指针和配置选择。
- 新仓库差异：优先补充 `.agent-skills-config/` 的事实、profile、模板或保护路径，不复制和改写中央核心。
- 新外部系统：需要实时私有数据或写操作时优先使用官方 connector/MCP；只读、可重复的公开数据才写本地脚本。
- 新浏览器流程：先让 Agent 通过 `playwright-cli` 快照和交互；只有相同步骤稳定重复出现并需要 CI 时，才固化为 Playwright 测试。
- Python 业务任务：仅在确有依赖时增加 `pyproject.toml` 和独立工具目录，不把 Python 包混进 Node 安装流程。

## 数据生命周期与冻结边界

creator-workflow 只管理 `projects/managed/`、`work/managed/`、`outputs/managed/` 与 `publications/`。其中项目输入与元数据可提交；临时素材和可重新生成的大文件按忽略规则处理；需要长期保留的大型素材应迁移到对象存储或 LFS，并在 manifest 中保存 URI 与校验值。

以下现有内容不因本次迁移而被接管或重写：

- `projects/algorithm-interview-course/`、`work/algorithm-interview-course/`、`outputs/algorithm-interview-course/`；
- `.pathnote/` 受控工具链与 `publications/ai-workbench-four-layers/` 现有草稿；
- 固定 Remotion 4.0.499 的 `apps/video/`。

需要迁移或升级这些路径时，必须另开明确任务，先验证基线，再限定目标范围。
