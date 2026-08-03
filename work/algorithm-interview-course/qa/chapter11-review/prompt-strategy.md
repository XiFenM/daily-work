# 第 11 章 Prompt / 归一化策略评估

- 评估日期：2026-08-03
- 评估范围：`video-evidence-v1.7`、提示词渲染器、证据归一化脚本、canonical schema、归一化测试，以及 `11-01 结语` 的本地媒体特性。
- 外部调用：无；本次没有调用 ZenMux 或其他网络 API。
版本控制：评估者未修改任何被 Git 跟踪的文件；报告、联系表和合成测试样例均位于被忽略的 `work/`。

## 决策

**第 11 章直接复用 `video-evidence-v1.7`，当前不新增 v1.8。**

理由如下：

1. v1.7 已原生允许 `contentKind: "conclusion"`、`problem: null`，并明确规定非题解课不得强行生成题面、解法或证明。
2. schema 1.0 已能表达结语课所需的空算法结构：`solutionProgression`、`codeArtifacts`、`stateModels`、复杂度分析、公式和实验都可以为空。
3. v1.7 已提供正确的不适用表达：`correctness.method` 与 `correctness.completeness` 同时为 `not_applicable`。
4. 使用真实 `11-01` 元数据构造的结语型证据卡，已通过 v1.7 的 raw schema、归一化和 normalized schema 检查。
5. 第 11 章只有一节 169.880 秒的短结语，未引入新的算法结构；为它新增版本会扩大渲染、normalizer、schema、项目校验、测试和文档的兼容面，收益不足。

不要直接修改已使用过的 v1.7 模板来加入第 11 章规则。历史调用保存了 Prompt 与哈希；修改同名模板会让同一个版本号对应两种语义。如果真实模型输出证明 v1.7 确实无法稳定处理结语，再新增 v1.8，而不是回改 v1.7。

## 第 11 章素材特性

`11-01` 是第 11 章唯一课次。

| 项目 | 本地结果 |
| --- | --- |
| 文件 | `work/algorithm-interview-course/incoming/11-1 结语_慕课网.mp4` |
| SHA-256 | `414cf80d449bd24e71cfb35bc4957d6f3baf6092eee4da484f31f0a2935c860a` |
| 大纲标称时长 | 165 秒（02:45） |
| FFprobe 实测时长 | 169.880 秒（02:49.880），比目录多 4.880 秒 |
| 文件大小 | 13,098,626 B（12.492 MiB） |
| 视频 | H.264 High，1920×1080，25 fps，yuv420p |
| 音频 | AAC-LC，44.1 kHz，双声道 |
| 压缩 | 不需要；原片显著低于 50 MB 工作流门槛 |

12 点抽帧的主体均是稳定的课程总标题页“玩儿转算法面试”；片尾版权页正常。画面没有算法演示、代码或公式，因此本课是**以音频为主要证据源**的非技术结语。纯视觉预检不能替代对语音内容的正式理解，正式提取仍应按音频划分时间线并逐条绑定证据。

## v1.7 兼容性结论

| 部件 | 结论 | 说明 |
| --- | --- | --- |
| Prompt v1.7 | 可直接使用 | 支持 `conclusion`、非题解课和空算法结构；虽包含与本课无关的 DP/贪心专项规则，但不会改变输出 schema |
| `render-video-prompt.mjs` | 可使用 | 素材登记后已成功渲染 `11-01`，注入了 `169.88`、`169880` 和 `asset:video-11-01`，没有未解析占位符 |
| schema 1.0 | 可直接使用 | `contentKind` 枚举含 `conclusion`；`problem` 可为 null；v1.7 要求 correctness 的完整字段 |
| normalizer | 基本兼容，有一处通用门禁需收紧 | 结语型合成样例通过；原实现只在第 10 章检查 `not_applicable` 两字段一致性，导致第 11 章错误组合可能漏放行 |
| tests | 基础覆盖已有，需补第 11 章语义覆盖 | 原有测试虽然接受“非算法课”，fixture 仍是第 10 章且 `contentKind` 不是 `conclusion`，不足以证明第 11 章路径 |
| project validator | 素材登记后需同步聚合时长 | `course-outline.json` 已将第 11 章更新为 169.88 秒时，`project.json` 也必须同步；否则总时长恰好相差 4.88 秒 |

渲染后的 v1.7 Prompt 为 28,178 B。它比只为结语定制的提示词长，但单节课程只调用一次，且现有版本能复用完整的严格结构与证据门禁；目前不值得为了减少约 20 KB 的无关规则引入新版本。

## 期望的 `11-01` 输出轮廓

正式响应应以视频事实为准，但在确认视频确为纯结语且没有算法材料时，最低语义轮廓应为：

```json
{
  "lessonId": "11-01",
  "chapterId": "11",
  "contentKind": "conclusion",
  "problem": null,
  "solutionProgression": [],
  "codeArtifacts": [],
  "stateModels": [],
  "correctness": {
    "method": "not_applicable",
    "completeness": "not_applicable",
    "claims": [],
    "stateModelIds": [],
    "obligations": []
  },
  "complexity": {
    "time": null,
    "space": null,
    "assumptions": [],
    "evidenceIds": []
  },
  "complexityAnalyses": [],
  "formulaArtifacts": [],
  "experiments": []
}
```

其余字段仍必须存在。建议按以下方式提取：

- `timeline`：按音频中的收束、回顾、建议、告别等真实段落划分；不要因视频很短就只放一个覆盖全片的笼统段落，也不要虚构过细分段。
- `learningObjectives`：本课若没有新的教学目标，可为空。
- `concepts`：只有音频明确回顾具体概念时才记录，通常使用 `reinforces` 或 `mentions`，不要把全课程目录自动复制进来。
- `interviewPlaybook`：老师明确给出的后续练习、面试准备或学习建议可放在这里，并逐条引用 `video_audio` 证据。
- `examples`、`edgeCases`、`implementationPitfalls`：没有直接内容时为空，不为了“笔记详细”而补算法例子。
- `relationCandidates`：只有老师明确回指某一课，或提供了可审查的编辑候选时才输出；“结语总结整门课”本身不等于与所有课建立关系边。
- `evidence`：以 `video_audio` 为主；静态标题页可单独作为 `video_visual` 证据。所有时间戳不得超过 169880 ms。
- `titleObserved`：画面主体观察到的是“玩儿转算法面试”，目录标题“结语”只是先验；字段应按视频真实可观察内容填写或保留 null。

## 最小改动清单

### P0：进入正式调用前必须完成

1. 登记 `asset:video-11-01`，并在 outline 中写入 `actualDurationSeconds: 169.88`、`contentKind: "video"` 和对应 `assetRefs`。检查期间该修复已由共享工作区中的并发任务写入待提交改动。
2. 将项目聚合总时长同步增加 4.880 秒。检查时 `course-outline.json` 已更新而 `project.json` 尚未同步，`validate-project.mjs` 因此报告总时长不一致。
3. 将 v1.7 的 `not_applicable` 方法/完整度一致性检查移出“仅第 10 章”分支，作为所有 strict-v1.7 文档的通用门禁。检查期间该修复及第 11 章回归用例已由并发任务加入待提交改动。
4. 渲染 `11-01-video-evidence-v1.7.md`，确认资产 ID、实测时长、模型 ID 和所有占位符均正确后再调用。当前本地 smoke test 已通过。

### P1：建议增加的质量门禁

1. 对“纯非算法结语”增加语义门禁：当 `contentKind === "conclusion"`，并且 `problem === null`、解法/代码/状态/正确性主张均为空时，要求 correctness 两字段都为 `not_applicable`。目前 `unknown/unknown` 仍可通过 schema 和 normalizer；它结构合法，但对明确不涉及算法正确性的结语不够准确。
2. 把跨章节的 v1.7 通用测试从 `greedy gates` 测试组中单列，避免以后误以为结语门禁只属于第 10 章。
3. 为 renderer 增加最小 smoke test：渲染 `11-01` 后断言无 `{{...}}`、实测时长为 169.88/169880、资产为 `asset:video-11-01`、相邻课次为“无”、Prompt provenance 为 v1.7。
4. 正式模型响应进入笔记前做人工音频交叉 QA：核对所有建议的措辞、时间戳、是否误造算法结构，以及是否把目录/课程记忆当成视频证据。

## 测试建议

归一化测试至少覆盖：

1. 接受第 11 章 `contentKind: "conclusion"`、空算法结构、`not_applicable/not_applicable`。
2. 拒绝 `not_applicable/unknown`。
3. 拒绝 `unknown/not_applicable`。
4. 建议拒绝纯结语的 `unknown/unknown`；如果暂不自动拒绝，必须在人工 QA 清单中明确拦截。
5. 保持 v1.6 文档无需 `correctness.completeness`，证明新门禁没有破坏旧版本。
6. 保持第 10 章现有贪心完整/部分证明、state model、tie-break 等全部回归。

本次本地验证记录：

- 修改前 normalizer 测试：42/42 通过。
- 使用 11-01 合成结语卡执行 v1.7 normalizer：通过；`contentKind=conclusion`，算法结构为空，正确性为成对 `not_applicable`。
- 修改前实测：第 11 章 `method=not_applicable`、`completeness=unknown` 曾被错误放行，证明通用一致性门禁确有必要。
- 并发门禁修复加入后 normalizer 测试：43/43 通过。
- 并发修复后仍可观察到纯结语的 `unknown/unknown` 被放行，故列为 P1 质量建议。
- 素材登记前 renderer 明确失败：`No cataloged video asset for 11-01.`；登记后渲染成功，输出无未解析占位符。
- `validate-project.mjs` 在检查时只剩项目聚合总时长相差 4.880 秒的问题；应在同步 `project.json` 后重跑。

最终验收建议执行：

```bash
pnpm exec vitest run projects/algorithm-interview-course/scripts/normalize-lesson-evidence.test.mjs
node projects/algorithm-interview-course/scripts/validate-project.mjs
pnpm check
```

其中 `pnpm check` 是全仓库验证，耗时和覆盖面都大于本报告的局部只读检查。

## 如果将来确实需要 v1.8

只有出现以下证据之一才建议升级：

- 正式 v1.7 调用持续把结语幻觉成题解、代码或复杂度，且一次重试与人工 QA 仍不能可靠修正；
- 未来新增多节访谈、结语或纯叙事课程，需要稳定、可复用的非技术内容抽取规则；
- 需要显著缩短 Prompt，并将算法专项规则按内容类型路由。

届时不能只复制一份模板。至少必须同时修改：

1. 新建 `video-evidence-v1.8.template.md`，更新模板内标题与 provenance，并加入非技术结语规则。
2. 在 `render-video-prompt.mjs` 的 allowlist 和错误信息中加入 v1.8；是否改默认版本要单独决定。
3. 在 `normalize-lesson-evidence.mjs` 增加 `strictV18`，并把它纳入 strict extraction 与 v1.4+ 通用门禁。否则 v1.8 会被当成非严格版本，跳过 raw canonical schema、Prompt 版本一致性和精确时间门禁。
4. 在 schema 的 Prompt 版本条件中让 v1.8 继续要求 `stateModels`、解法引用字段和完整 correctness 字段。
5. 在 `validate-project.mjs` 的需完成人工 QA 版本集合中加入 v1.8。否则被接受的 v1.8 尝试可能不会被要求 `qaStatus: completed`。
6. 增加 v1.8 的正反测试、renderer smoke test、历史版本兼容测试，并更新 workflow 文档。
7. 在 manifest 中记录新 Prompt 路径、哈希和实际版本；历史 v1.7 记录保持不变。

这组联动成本也是本次选择复用 v1.7、而不是为单节结语新增版本的主要原因。
