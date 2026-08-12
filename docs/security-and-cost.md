# 密钥、外部操作与费用

## 密钥

- 只在本机 `.env` 或安全的 CI secret 中保存密钥。
- 不在命令参数、日志、截图、prompt、manifest 或 issue 中保存密钥。
- 使用独立的 ZenMux API Key 与 Management Key，并按用途设置最小权限。
- 怀疑泄露时立即在供应商控制台撤销，不只是在 Git 历史中删除。

## 计费调用

- 图片和视频命令先支持 `--dry-run`，用于检查模型、尺寸和请求体。
- `zenmux understand --dry-run` 不调用外部 API；若同时指定 `--compress`，仍会运行本地 FFmpeg 并创建不覆盖原片的压缩副本。
- 一次明确生成请求只授权与该 route、模型、输入摘要和输出位置对应的一次提交；不得扩展到其他模型、输入或目标。
- 视频任务要保存 job ID；轮询超时不代表任务失败。
- 结果为 unknown 或超时后，先凭原 receipt/job ID 做非计费、非破坏性的只读观察；观察不能修改原结果，也不能自动触发提交。
- 重试是新的计费操作。即使原任务失败，也必须取得针对本次重试的单独授权，避免重复计费。
- 需要成本归因时，通过 `zenmux-usage` 和 Management Key 查询 generation ID。

## 浏览器

- 浏览器自动化使用微软官方 Playwright CLI。无需登录态时使用隔离会话；只有任务确实需要时才接管正在使用的 Chrome。
- 连接当前 Chrome 时，远程调试权限等同于对已打开网页和登录态的控制权。调试端点只允许本机访问，不暴露到局域网或公网。
- Agent 不读取、打印、导出或持久化 Cookie、Token 和登录 localStorage。除非用户明确要求，不运行 `state-save`。
- 接管外部 Chrome 后使用 `detach`，不得使用 `close-all`、`kill-all` 或 `delete-data` 影响用户浏览器和数据。
- 不自动提交表单、发布内容、发送消息或购买。外部写授权必须绑定具体操作和目标；前一步、其他目标或之前任务的授权不能复用。
- 详细流程见 [browser-automation.md](browser-automation.md)。

## 中央 Skill 与配置

`.agent-skills` 子模块中的中央 Skill 与脚本具有 agent 权限；`.agent-skills-config/` 决定本仓库暴露哪些事实、命令和 effects。更新子模块指针或配置后检查：

- 是否新增 shell 命令、网络端点或外部写操作；
- 是否要求输出或持久化密钥；
- 是否修改全局配置；
- 是否引入与本仓库规则冲突的自动重试或发布行为。

materializer 必须从固定且干净的中央提交生成上下文；来源、配置或所需 Skill 漂移后，不得继续运行旧上下文。仓库的 `AGENTS.md` 安全规则和 creator-workflow 配置边界优先于第三方 Skill 中较宽松的建议。

历史课程目录、PathNote 受控工具链与现有草稿、以及固定 Remotion 4.0.499 的 `apps/video/` 是保护范围，不因 Skill 同步而改写。
