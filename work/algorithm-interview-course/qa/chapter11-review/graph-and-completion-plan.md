# 第 11 章知识图谱与全课程收口计划

## 结论

第 11 章可以在不新增 Prompt 版本和 schema 的前提下完成。正式 `11-01` normalized 已经给出足够证据，可安全复用 3 个既有概念，并登记 3 条高价值跨课关系；不应因为它是结语而连接全部章节。

若按本报告建议登记，最终图谱应为：

- 概念节点：`150`（不新增节点，只更新 3 个既有节点的引用）；
- 关系边：`97`（现有 `94` + 新增 `3`）；
- verified 边：`96`（现有 `93` + 新增 `3`）；
- provisional 边：仍为 `1`，即 `edge:outline:01-03:01-04`，不得进入主知识地图。

本报告只读检查正式文件和 ignored 证据产物；没有修改任何 tracked 文件，也没有调用外部 API。

## 正式证据基线

- lesson：`11-01`
- request ID：`82e83d77452344108d9a09a1b643a1b6`
- model：`google/gemini-3.6-flash`
- Prompt：`video-evidence-v1.7`
- 实测时长：`169.880 s`（`02:49.880`），比目录 `02:45` 多 `4.880 s`
- 原片 SHA-256：`414cf80d449bd24e71cfb35bc4957d6f3baf6092eee4da484f31f0a2935c860a`
- usage：prompt `23,109`、completion `3,953`、reasoning `2,006`、total `27,062` tokens
- 正式结构：`contentKind=conclusion`、`problem=null`、解法/代码/状态为空、correctness 为成对 `not_applicable`、时间和空间复杂度均为 `null`

五段证据为：

| evidence | 时间 | 可登记事实 |
| --- | --- | --- |
| `11-01:ev-001` | 00:00–00:41 | 算法面试重基础；难题往往由基础题增加条件演化 |
| `11-01:ev-002` | 00:41–01:26 | 推荐 LeetCode 作为面试向算法练习平台 |
| `11-01:ev-003` | 01:26–01:53 | 不应止于 Accepted，要继续思考设计、实现与优化 |
| `11-01:ev-004` | 01:53–02:30 | 课程持续维护；应形成题目分类和基本思考模式 |
| `11-01:ev-005` | 02:30–02:49.880 | 致谢与求职祝福 |

视觉画面长期保持课程总标题页，因此语义应以音频结合证据为主；不能从静态标题页补造算法、代码或全课程逐章回顾。

## 概念词表更新

### 应更新的既有节点

1. `concept:algorithm-interview-preparation-scope`

   - `lessonRefs` 加 `11-01`。
   - `evidenceRefs` 加 `11-01:ev-001`、`11-01:ev-004`。
   - 原定义已经覆盖“基础优先”，无需改写；ev-004 进一步证明课程目标是形成分类认知和基本思考模式。

2. `concept:online-judge`

   - `lessonRefs` 加 `11-01`。
   - `evidenceRefs` 加 `11-01:ev-002`、`11-01:ev-003`。
   - 不应把 `LeetCode` 加成 `Online Judge` 的同义词；它是具体平台实例，不是一般概念的 alias。

3. `pattern:learning-practice-loop`

   - `lessonRefs` 加 `11-01`。
   - `evidenceRefs` 加 `11-01:ev-002`、`11-01:ev-003`、`11-01:ev-004`。
   - 现有“理解思想—适量实践—复盘、避免机械刷题”的定义与结语完全一致，无需新增重复节点。

### 不建议登记

- 不新增 `concept:leetcode`：现有 `concept:online-judge` 已容纳平台实例和使用边界。
- 不新增“课程持续维护”概念：它是课程运营承诺，不是可迁移算法知识。
- 不把 `ev-003` 绑定到 `interview-skill:observable-reasoning`：本课要求深入思考，但没有直接要求把推理口头表达给面试官。
- 不把 `ev-003` 绑定到 `pattern:bottleneck-optimization`：本课只问是否还能优化，没有明确定位主导复杂度的瓶颈。
- 不新增题目、算法、数据结构节点；本课没有相应内容。

## 建议登记的跨课边

### 1. 结语回访准备范围

```text
id: edge:video:11-01:01-03
from: lesson:11-01
to: lesson:01-03
type: revisits
strength: strong
status: verified
confidence: 0.99
```

理由：`01-03` 建立“基础优先、使用 LeetCode、平衡学习与做题”的准备框架；`11-01` 在结语中逐项回访基础、LeetCode、超越 Accepted 和分类思考，形成明确首尾闭环。

建议证据：

- `01-03:ev-005`（基础算法与数据结构范围）
- `01-03:ev-008`（推荐 LeetCode）
- `01-03:ev-010`（学习与做题平衡）
- `11-01:ev-001`、`ev-002`、`ev-003`、`ev-004`

### 2. 结语回访宏观解题流程

```text
id: edge:video:11-01:01-04
from: lesson:11-01
to: lesson:01-04
type: revisits
strength: strong
status: verified
confidence: 0.98
```

理由：`01-04` 把算法作答拆成试验/基线、设计与优化、实际实现和工程边界；`11-01:ev-003` 用“设计—实现—继续优化”压缩回访同一流程。

建议证据：

- `01-04:ev-003`、`ev-005`、`ev-006`
- `11-01:ev-003`

### 3. 从第一次 Accepted 延伸到超越 Accepted

```text
id: edge:video:03-03:11-01
from: lesson:03-03
to: lesson:11-01
type: extends
strength: strong
status: verified
confidence: 0.99
```

理由：`03-03` 完整演示 LeetCode Run、Submit 和 Accepted；结语明确补充“Accepted 不是终点”，要求继续审视设计、实现和优化。这是从平台工作流到学习质量标准的直接延伸。

建议证据：

- `03-03:ev-007`、`03-03:ev-008`
- `11-01:ev-002`、`11-01:ev-003`

### 不应建立的边

- 不因目录相邻建立 `10-03 → 11-01`：当前关系 schema 没有结构性 `precedes`，相邻也不构成先修、扩展或应用。
- 不把 `11-01` 与第 2–10 章每章各连一条边：视频没有逐章回顾，批量连接会把“结语”误写成全课程内容证据。
- 不连 `11-01 → 07-03`：本课没有讨论软件工程价值、协作体验或用户中心工程。
- normalized 的 `relationCandidates` 为空并不阻止章级人工关系校准，但人工新增边必须同时引用两端正式 evidence；上述三条满足这一要求。

## 全部 tracked 更新清单

### A. 第 11 章完成必改

| 路径 | 必要更新 |
| --- | --- |
| `course-outline.json` | `11-01` 写入 `actualDurationSeconds=169.88`、`contentKind=video`、`assetRefs`；章和课程已知时长同步为 `169.88` 与 `66665.61756`。 |
| `course-outline.md` | 第 11 章显示实测 `00:02:49.880`（表格可舍入为 `00:02:50`）；总已知视频时长更新为 `≥18:31:05.61756`；删除“以后写回”措辞。 |
| `inputs/source-catalog.json` | 登记 `asset:video-11-01` 的路径、哈希、字节、媒体元数据、映射和视觉 QA；scope 变为 `chapters-01-11`。 |
| `manifest.json` | 追加 `11-01-understanding-001` attempt 与 generation；登记 request ID、原片请求媒体、Prompt/媒体哈希、raw/response/normalized 路径、27,062 tokens 和 QA 状态。 |
| `progress.json` | 将 `11-01` 的 videoEvidence、lessonNote、relationshipReview、qa 全部置为 completed；记录 1 次 accepted attempt；更新全部汇总计数。 |
| `project.json` | `knownDurationSeconds=66665.61756`；在课程级综合产物和总验收完成后把 status 从 `in-progress` 改为 `completed`。`durationSeconds` 可继续为 `null`，因为三篇文本没有视频时长。 |
| `notes/lessons/11-01.md` | 新建非题解结语笔记；保持 problem/代码/复杂度/正确性不适用边界，重点整理基础、LeetCode、超越 Accepted、分类思考和课程维护。 |
| `notes/chapters/11.md` | 新建章节综述。只综合本课结语，不把编辑生成的全课程知识地图冒充为讲师在 169.88 秒中逐章讲过。 |
| `notes/concepts.json` | 更新上述 3 个既有节点；节点总数保持 150。 |
| `notes/relationships.json` | 新增上述 3 条 verified 边；保留并隔离 1 条既有 provisional 边。 |
| `notes/index.md` | 进度改为 70/70、11/11、67/67；增加第 11 章综述与 11-01 链接、实测时长和课程级综合入口。 |
| `README.md` | 增加第 11 章链接与最终计数，删除“下一步处理第十一章”，写明课程已完成及剩余已知边界。 |
| `brief.md` | 当前输入改为全部 67 视频 + 3 文本完成；已知时长更新；成功标准只在实际验收后逐项勾选。 |
| `workflow.md` | “当前停止点”改成完成状态，记录第 11 章单次调用与 27,062 tokens、直接使用 12.492 MiB 原片、非题解 QA；补全课程级综合与最终门禁。 |
| `knowledge-model.md` | 删除“除第 1、2 章外仍是候选”的过时表述；把第 11 章的实际闭环内容写为基础—实践—复盘入口，记录最终图谱只使用 verified 边。 |

### B. 本章预检暴露、应与同一收口提交的工具改动

| 路径 | 原因 |
| --- | --- |
| `scripts/normalize-lesson-evidence.mjs` | v1.7 的 `correctness.method/completeness` 成对 `not_applicable` 一致性必须适用于第 11 章，而不能只在第 10 章分支检查。 |
| `scripts/normalize-lesson-evidence.test.mjs` | 增加 11-01 conclusion 的接受与错误组合拒绝回归。 |
| `scripts/register-understanding.mjs` | 11-01 原片只有 12.492 MiB，无需二次压缩；注册器应能把原片标为 request media，而不把它错误登记为 compressed 派生输出，并允许写入结语专用 notes。 |

### C. 全课程真正完结所需的新 tracked 产物

建议新增 `notes/course-synthesis.md`，使用已有 `course-synthesis-v1.template.md`，至少包含模板规定的十部分：课程总览、六层能力模型、知识地图、题型簇、算法模板、正确性/复杂度框架、易混淆概念、四条复习路线、面试答题框架和待确认项。

第 11 章综述不能替代它：前者以 `11-01` 为课程事实来源，后者以 70 份笔记、11 份章综述、概念词表和 verified 关系图为编辑综合来源。

同时应在 `README.md` 和 `notes/index.md` 链接该文件。

### D. 强烈建议补的最终完成门禁

`scripts/validate-project.mjs` 当前主要验证“各文件彼此自洽”，并不保证项目绝对完成；例如进度汇总若都写成 69，它可以接受少一个课次、一个资产和一个 normalized 的状态。

建议在 `project.status === "completed"` 时额外强制：

1. outline、progress lesson keys、已映射 lesson 集合完全相等且都是 70；
2. 所有 70 节均有 normalized，所有正式笔记存在且 QA completed；
3. 67 个视频 evidence completed，3 个文本 evidence completed；
4. 11 份章节综述存在；
5. `notes/course-synthesis.md` 存在；
6. catalog 覆盖全部 lesson，且无重复或缺失映射；
7. completed 状态下不存在 `not-started`；
8. verified 关系数、概念 evidence 引用和 manifest 输出路径继续对账。

若本轮不修改 validator，这些条件必须作为人工验收证据逐项记录，不能仅以当前脚本退出码宣称全课程完成。

### E. 默认不需要修改

- `prompts/video-evidence-v1.7.template.md`：已原生支持 `contentKind=conclusion`。
- `schemas/lesson-evidence.schema.json`：已支持空问题/解法/代码/状态以及 `not_applicable`。
- `scripts/render-video-prompt.mjs`：v1.7 已能渲染 11-01。
- 不新增 v1.8；除非真实输出持续把结语幻觉成题解，而本次正式 normalized 没有出现该问题。
- `prompts/course-synthesis-v1.template.md` 可直接复用，无需为第 11 章改版。

## ignored 证据产物（必须保留但不提交）

- 原片：`work/algorithm-interview-course/incoming/11-1 结语_慕课网.mp4`
- rendered Prompt：`work/algorithm-interview-course/prompts/11-01-video-evidence-v1.7.md`
- raw 与 response：`outputs/algorithm-interview-course/understanding/raw/11-01.json*`
- normalized：`outputs/algorithm-interview-course/understanding/normalized/11-01.json`
- 联系表、关键帧、人工 QA、调用准备与本报告：`work/algorithm-interview-course/qa/chapter11-review/`

原片直接作为请求媒体，不应同时伪造一个 compressed 输出路径。

## 最终计数目标

### Progress

| 字段 | 最终值 |
| --- | ---: |
| expectedLessons | 70 |
| knownDurationLessons | 67 |
| discoveredAssets | 70 |
| discoveredVideos | 67 |
| discoveredTexts | 3 |
| catalogedAssets | 70 |
| mappedLessons | 70 |
| hashVerifiedLessons | 70 |
| probedLessons | 67 |
| understoodLessons | 70 |
| synthesizedLessons | 70 |
| verifiedLessons | 70 |
| synthesizedChapters | 11 |
| verifiedRelationshipEdges | 96（若采用本报告三条边） |

### Manifest（11-01 单次 accepted 注册后）

| 项目 | 当前 | 最终 |
| --- | ---: | ---: |
| attempts | 80 | 81 |
| generations | 77 | 78 |
| accepted attempts | 62 | 63 |
| rejected attempts | 11 | 11 |
| HTTP errors | 5 | 5 |
| network errors | 2 | 2 |

### 内容与图谱

| 项目 | 最终值 |
| --- | ---: |
| 正式单课笔记 | 70 |
| 章节综述 | 11 |
| normalized lessons | 70 |
| cataloged assets | 70 |
| 概念节点 | 150 |
| 关系总边数 | 97 |
| verified edges | 96 |
| provisional edges | 1 |
| 课程已知视频时长 | 66,665.61756 s（18:31:05.61756） |

若关系编辑最终不采用全部三条建议，`verifiedRelationshipEdges` 和关系总数必须按实际文件重算，而不能机械写 96/97。

## 全课程完结验收清单

### 素材与调用审计

- [ ] 70 个素材全部有哈希、课次映射和媒介/文本元数据；无重复、无缺课。
- [ ] 67 个视频全部 FFprobe 完成；3 篇文本的无视频时长状态明确。
- [ ] 11-01 原片哈希与调用前一致；没有无必要的有损派生。
- [ ] 每次外部尝试（包括失败）均进 manifest；11-01 request ID、Prompt 哈希、媒体哈希和 27,062 tokens 对账。
- [ ] raw、response、normalized 与 manifest 路径存在；无 orphan artifact。

### 单课与章节质量

- [ ] 70 份单课笔记、11 份章节综述全部存在，frontmatter 和 note status 正确。
- [ ] 每课重要结论都有 evidence 或明确的 editorial/supplemental 标签。
- [ ] 屏幕代码 verification 与真实本地验证一致；11-01 无代码，标记不适用。
- [ ] 11-01 不生成题目、解法、复杂度或正确性证明；`not_applicable` 配对正确。
- [ ] 第 11 章综述没有把全课程编辑总结冒充为结语原话。

### 概念与关系

- [ ] 3 个概念节点更新后所有 `11-01:ev-*` 引用存在。
- [ ] 新关系均引用两端 evidence，方向和类型符合现有语义。
- [ ] 不因相邻或“结语”身份批量造边。
- [ ] 主知识地图只使用 verified 边。
- [ ] `edge:outline:01-03:01-04` 作为唯一 provisional 单列；不得伪装为已验证。
- [ ] `prerequisite_of` 子图无环；对称关系无反向重复。

### 课程级交付

- [ ] `notes/course-synthesis.md` 完成模板要求的十部分，并链接到 lesson ID。
- [ ] 至少提供按章节、按题型、按薄弱能力、按冲刺四条复习路线。
- [ ] 题型簇、算法模板、复杂度/正确性框架和易混淆对照覆盖全课程，而非只覆盖第 11 章。
- [ ] README、index、brief、workflow、outline、project、progress 的状态和计数一致。
- [ ] `project.status` 只在上述产物和检查全部完成后改为 `completed`。

### 自动与人工门禁

- [ ] v1.7 normalizer 专项测试全过。
- [ ] `node projects/algorithm-interview-course/scripts/validate-project.mjs` 通过。
- [ ] `pnpm check` 通过。
- [ ] 所有新增/修改 Markdown 通过 Prettier；所有 JSON 可解析。
- [ ] `git diff --check` 通过，tracked diff 不包含 `work/`、`outputs/`、密钥或原始媒体。
- [ ] 人工复核 11-01 五段时间线、用词强度、概念合并和三条关系证据。

## 推荐收口顺序

1. 先完成人工音频 QA，并用 `register-understanding.mjs` 登记 11-01 attempt/generation。
2. 写 `notes/lessons/11-01.md`，再校准 3 个概念与 3 条关系。
3. 写 `notes/chapters/11.md`，更新 progress 与课程级状态文件。
4. 基于 11 份章综述和 verified 图生成 `notes/course-synthesis.md`。
5. 更新 README/index/brief/workflow/knowledge-model，最后才设置 `project.status=completed`。
6. 执行局部 schema/normalizer 检查、项目一致性验证、全仓 `pnpm check` 和最终人工交叉 QA。
