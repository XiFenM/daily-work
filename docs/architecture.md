# 架构与扩展原则

## 四个边界

| 层               | 负责什么                               | 不负责什么                |
| ---------------- | -------------------------------------- | ------------------------- |
| `AGENTS.md`      | 仓库长期规则、安全边界、验证命令       | 某个供应商的完整 API 文档 |
| `.agents/skills` | 可复用工作流、官方产品知识、agent 路由 | 持久密钥和大型输出        |
| `tools`          | 确定性 API 调用、轮询、下载、检查      | 创意判断和平台发布        |
| `apps`           | 可预览、可参数化、可渲染的媒体工程     | 一次性下载和草稿          |

这种拆分让规则保持稳定，让易变的供应商知识由官方 skill 更新，让计费调用通过可测试脚本执行。

## 平台边界

`scripts/bootstrap.mjs` 是 Windows 与 Linux 共用的初始化核心，只处理 Node workspace、`.env`、skills 和 doctor。`bootstrap-windows.ps1` 与 `bootstrap-linux.sh` 处理系统包、Shell 和权限差异，再调用同一个核心入口。

业务工具必须通过 `pnpm` scripts 暴露，内部路径使用 Node.js `path` API。Windows 盘符、PowerShell、`apt-get`、`chmod`、SSH tunnel 等平台细节只出现在对应初始化脚本或文档中。CI 同时在 Windows 与 Ubuntu 上执行 `pnpm check`，Remotion 冒烟渲染在 Ubuntu 上验证 headless 和 Linux 字体。

## 为什么不用一个万能脚本

浏览器、生成模型和 Remotion 的失败模式不同：

- 浏览器任务依赖页面状态、登录态和人工可见反馈。
- 图片/视频生成是远端计费任务，需要请求记录、异步状态和防重复提交。
- Remotion 是本地确定性渲染，需要 props、静帧和媒体 QA。

把它们硬塞进一个进程会弱化重试和审计边界。`creator-workflow` 负责调度；浏览器使用微软官方 Playwright CLI，供应商 API 和媒体检查保留独立的本地 CLI。

## 推荐扩展方式

- 新供应商：增加 `tools/<provider>`，提供 `--dry-run`、结构验证、请求 ID 和结果落盘。
- 新媒体模板：在 `apps/video` 新增 composition 和 props schema。
- 新重复流程：用 skill-creator 初始化 `.agents/skills/<workflow>`，保持 SKILL.md 简短，把细节放入 `references/`。
- 新外部系统：需要实时私有数据或写操作时优先使用官方 connector/MCP；只读、可重复的公开数据才写本地脚本。
- 新浏览器流程：先让 Agent 通过 `playwright-cli` 快照和交互；只有相同步骤稳定重复出现并需要 CI 时，才固化为 Playwright 测试。
- Python 任务：仅在确有依赖时增加 `pyproject.toml` 和独立工具目录，不把 Python 包混进 Node 安装流程。

## 数据生命周期

`projects/` 保存可复用的人类输入和元数据；`work/` 保存临时素材；`outputs/` 保存可重新生成的大文件。需要长期保留的大型素材应迁移到对象存储或 LFS，并在 manifest 中保存 URI 与校验值。
