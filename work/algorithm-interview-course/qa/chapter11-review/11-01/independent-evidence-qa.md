# 11-01 正式理解结果独立证据 QA

- 复核范围：正式 raw、response envelope、calibrated normalized、课程大纲/素材登记、`169.880 s` 本地媒体、12 帧联系表和片尾抽帧。
- 外部调用：无；未调用 ZenMux、语音转写服务或其他网络 API。
- 写入边界：未修改 raw、normalized、manifest、progress、课程笔记或其他被 Git 跟踪的文件；本报告位于被忽略的 `work/`。
- 总体结论：**通过（PASS）**。初检发现 4 项必须校准内容；父任务已在 calibrated normalized 中全部修正并由本报告复验关闭。时长、分段、证据引用、纯结语结构、响应元数据、归因边界和片尾画面均通过。

## 独立核验边界

本次可以直接独立核实 JSON 结构、时间戳、媒体时长、画面文字、片尾状态、响应元数据和 raw→normalized 的编辑差异。受“不得调用外部 API”约束且本机没有可用的本地 ASR，音频语义没有生成第二份独立逐字稿；因此对口述内容的审核分为两层：

1. 核对 raw 模型观察与 normalized 是否一致、是否超出该观察；
2. 即使讲师确实说过，也检查它是否只是讲师观点、录制时计划或无统计支持的概括，避免正式笔记把它升级为当前普遍事实。

本报告不会把缺少独立逐字稿的音频句子写成“已逐字确认”。

## 复核快照

初检时的文件如下；哈希用于保留“发现问题时”的审计快照。

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `outputs/algorithm-interview-course/understanding/raw/11-01.json` | `5,867 B` | `d94c4291cd656842d2809e3f36f232daf7ae4c6ac7447c977faa3ea8005d4828` |
| `outputs/algorithm-interview-course/understanding/raw/11-01.json.response.json` | `817 B` | `2816e1af76687298f7177980bae1a6a8192614611e52f8866abe99a75edceb54` |
| `outputs/algorithm-interview-course/understanding/normalized/11-01.json` | `7,018 B` | `c91fd41bf01d9bc13ed44aa4cec9d886113eb6ccea630f414d4e2d5426fd488f` |

父任务关闭 4 项校准后的 normalized 为 `7,069 B`，SHA-256：
`153e1b083fa82301f9150e5750f83ee8bc0938ee517efa2c72cbad955b749959`。下文先记录初检发现，再记录最终复验结果。

响应链可对账：

- response ID / normalized request ID：`82e83d77452344108d9a09a1b643a1b6`
- 模型：`google/gemini-3.6-flash`
- `created=1785730071`：`2026-08-03T04:07:51.000Z`，与 normalized `generatedAt` 一致
- 用量：prompt `23,109`、completion `3,953`、其中 reasoning `2,006`，total `27,062`
- finish reason：`stop`
- 外部搜索和工具调用：均为 `0`

response envelope 对正文和 reasoning 做了本地脱敏占位，正式 raw 保存了解析后的 JSON 对象；两者元数据一致。

## 时长、时间线和证据 ID：通过

| 项目 | 结果 |
| --- | --- |
| 源片 FFprobe 时长 | `169.880 s`（`169880 ms`） |
| raw / normalized `actualDurationSeconds` | `169.88` |
| 大纲标称时长 | `165 s`（`02:45`） |
| 实测相对大纲 | `+4.880 s` |
| 时间线 | `0–41000–86000–113000–150000–169880 ms` |
| 相邻段 | 全部连续；无空隙、无重叠 |
| 证据 ID | `ev-001`～`ev-005` 唯一且全部被引用 |
| 越界/未知引用 | `0` |

5 个 evidence 的 `startMs/endMs` 均满足 `0 <= start < end <= 169880`，每段 locator 与秒级边界相符。最后一段 locator 写到 `02:49`，而精确媒体终点是 `02:49.880`；这是秒级显示精度，不构成越界。

本地静音检测显示音频约从 `165.604 s` 起进入持续 `4.227 s` 的片尾静音，直到媒体结束；这与 `ev-005` 将最后约 20 秒描述为“致谢/祝福 + 片尾声明画面”相容，但静音检测只验证信号边界，不验证所说语句的文本。

## 纯结语结构：通过

正式结果没有把短结语强行套成算法题：

- `contentKind = conclusion`
- `problem = null`
- `solutionProgression = []`
- `codeArtifacts = []`
- `stateModels = []`
- `correctness = not_applicable / not_applicable`，claims/obligations 均为空
- 顶层时间和空间复杂度均为 `null`
- `complexityAnalyses`、`formulaArtifacts`、`experiments`、`examples`、`edgeCases`、`implementationPitfalls` 均为空
- `relationCandidates = []`，没有因为“总结整门课”就建立与所有课次的虚假关系边

这一轮廓与 v1.7 对非题解结语的要求一致。

## 5 段证据逐项复核

| 证据 | 时间 | 当前主题 | 独立 QA |
| --- | ---: | --- | --- |
| `ev-001` | `00:00–00:41` | 课程难度与基础 | 结构合理；正式笔记应保留“讲师强调/课程观点”的来源语气，不把“大多数面试”写成独立统计事实 |
| `ev-002` | `00:41–01:26` | LeetCode 与公司面试题 | 初检要求收窄；“各大公司均重度参考”含全称量词和强因果/参考关系，当前课程没有给统计范围。最终版本已修正 |
| `ev-003` | `01:26–01:53` | 不止追求 Accepted | 表述与 raw 观察一致；设计、实现、优化三层建议可保留 |
| `ev-004` | `01:53–02:30` | 课程维护与分类认知 | 初检要求增加录制时边界；后续维护是当时的计划/承诺，不是已独立核实的当前状态。最终版本已修正 |
| `ev-005` | `02:30–02:49.880` | 致谢、祝福、片尾声明 | 音视频组合合理；独立片尾抽帧确认最终画面是素材来源/版权声明，并非黑帧或截断 |

初检时 5 条 evidence 的 `sourceType` 全是 `video_combined`。联系表证明大部分时段画面只是静态课程标题，无法视觉支撑 `ev-001`～`ev-004` 的口述主张；因此本报告要求把这四段校准为 `video_audio`，只让同时包含致谢音频和片尾声明画面的 `ev-005` 保持 `video_combined`。最终版本已按此执行。

## 表述强弱专项审查

### 1. “各大公司均重度参考 LeetCode”：不得写成普遍事实

raw 的 `ev-002` 已是模型概括而非逐字稿，使用了“国内外公司的算法面试题都重度参考了 LeetCode 题目模型”；timeline 又写成“各大公司的面试题均重度参考 LeetCode 题型”。这里有三层风险：

1. “各大公司/国内外公司”没有可审查的样本范围；
2. “都/均”是全称量词；
3. “重度参考”容易被理解为公司直接从平台取题或题库存在事实关系，本课没有提供这类外部证据。

初检 normalized 已正确新增 uncertainty，说明这只是讲师在结语中的概括性判断，不能当作本项目验证过的事实；但当时 timeline 和 evidence observation 本身仍保留强措辞。因此仅添加 uncertainty 还不够，本报告要求 normalized 和正式笔记都显式归因，建议表述为：

> 讲师在录制时概括性地表示，国内外公司的算法面试题与 LeetCode 题型有较强联系，并建议用 LeetCode 练习；本课没有给出统计范围。

不要写成“各大公司都从 LeetCode 出题”“所有公司重度参考 LeetCode”或任何当前招聘市场的客观结论。

### 2. “课程会持续维护并添加新内容”：只能作为录制时计划

raw 使用“承诺本课程会持续维护与更新”，timeline 使用“本课程会持续维护并添加新内容”。这不能证明截至当前日期课程仍在维护，也不能证明后续内容实际已经加入。

初检 normalized 已新增相应 uncertainty，但当时主叙述仍缺时间边界。本报告要求统一为：

> 讲师在视频录制时表示，课程后续计划继续维护并增加内容；本项目没有核查当前课程页面或实际更新状态。

正式笔记不得省略“录制时”“计划/表示”等限定词。

### 3. 在线 OJ 机制定义：normalized 已正确关闭

raw 把“在线测评平台”定义为“提交代码并自动判题的在线评测系统”，但 `ev-003` 只支撑讲师提到在线 OJ、Accepted 以及不要止步于 Accepted，没有证据表明本结语重新解释了自动判题机制。

normalized 已将概念校准为“在线判题系统”、`definition: null`，并添加 uncertainty。这一处理正确，是**已关闭项**；正式笔记不要重新从 raw 导入该定义。如需解释 OJ 机制，应引用其他课次的直接证据或明确标成编辑补充。

### 4. “大多数面试重在基础”：可保留，但必须保留来源属性

`ev-001` 和 interview playbook 将“多数算法面试侧重基础、难题由基础问题加约束演化”标为 `course_direct`，没有伪装成编辑推导。正式笔记应继续使用“讲师强调/课程认为”表述；不要借 `confidence: 0.95` 把提取置信度误解为对招聘市场事实真实性的 `95%` 证明。

## 联系表、标题和片尾

- 两份联系表的主体抽帧均是白底静态课程页，清晰显示课程标题、作者 `liuyubobobo` 和慕课网标识；没有代码、公式、题面或算法演示。
- 画面标题精确文字是 **“玩儿转算法面试”**。raw 保留模型原始输出“玩转算法面试”；初检 normalized 也漏掉“儿”，最终 calibrated normalized 已修正为与画面逐字一致。
- `168.5 s` 独立尾帧显示“声明”及素材来源/版权联系方式，支持 `ev-005` 的视觉部分。
- 12 帧主体联系表本身没有包含最后版权页；片尾结论来自另一次临近结尾抽帧，正式 QA 记录应保持这两个证据来源的区别。

## raw → normalized 编辑差异

除 provenance 外，normalized 对 raw 做了三类有意校准：

1. 把 raw 的“在线测评平台”/自动判题定义改为“在线判题系统”、`definition: null`；
2. 新增公司题库概括、课程维护时效、OJ 定义边界三条 uncertainties；
3. 从 response envelope 回填 request ID 和生成时间。

这些初始校准方向正确。父任务随后又在 calibrated normalized 中修正标题、两条主时间线/observation 的归因与时效表述，并调整证据模态。raw 继续作为模型原始输出保留，没有被回写覆盖，处理边界正确。

## 必须校准项

| 优先级 | 位置 | 必须动作 | 状态与复验结果 |
| --- | --- | --- | --- |
| P0 | `titleObserved` | `玩转算法面试` → `玩儿转算法面试` | **已关闭**：与联系表可见标题逐字一致 |
| P0 | `timeline[1]`、`ev-002`、后续笔记 | 把公司/LeetCode 关系明确限定为讲师录制时的概括性观点；移除或收窄“各大公司均”“都重度参考”等无范围全称量词 | **已关闭**：改为“讲师在录制时……表示”“广泛参考”，observation 明确“该概括属于课程观点”，uncertainty 保留 |
| P0 | `timeline[3]`、`ev-004`、后续笔记 | 把“持续维护”限定为录制时表示的后续计划；不得暗示当前仍维护或已实际更新 | **已关闭**：timeline 与 observation 均加入“录制时”“计划”，uncertainty 保留 |
| P0 | `evidence[0..3].sourceType` | `video_combined` → `video_audio`；`ev-005` 保持 `video_combined` | **已关闭**：最终类型依次为 audio/audio/audio/audio/combined |

已关闭但必须防回归：OJ definition 保持 `null`；纯结语空算法结构保持不变；不新增关系边、复杂度、代码或算法例子。

## 最终判断

4 项必须校准均已关闭，最终 normalized 可以进入正式笔记综合，无需重新调用外部模型。复验结果：

- `169880 ms` 全覆盖，5 段连续且无重叠/空隙；所有 evidence ID 唯一、存在、被引用且不越界。
- 标题、证据模态、公司/LeetCode 归因、维护计划时间边界和 OJ 定义边界均符合本报告要求。
- Prettier 与 `git diff --check` 通过。
- 项目 validator 当前只报告共享进度中的 verified 关系数仍为 `93`、实际为 `96`；这是并行关系集成的计数漂移，与 11-01 证据内容无关。

本轮没有再次上传视频，也没有产生第二次计费请求。
