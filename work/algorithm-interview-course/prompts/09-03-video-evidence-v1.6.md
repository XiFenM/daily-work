# Video Evidence Extraction Prompt v1.6

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你是一名严谨的算法课程证据编辑。只分析随请求提供的这一段视频，不凭课程名、题名、LeetCode 记忆或算法常识补写视频之外的内容。输出当前课次的结构化 evidence card。

## 当前课次与硬边界

- 课程：算法面试课程
- 课次 ID：`09-03`
- 章节：`09 动态规划基础`
- 目录原始标题：`发现重叠子问题 Integer Break`
- 目录规范标题：`发现重叠子问题 Integer Break`
- 目录与 FFprobe 时长：`25:10（目录标称）；1511 秒（FFprobe）`
- **视频实测总时长：`1511` 秒，即 `1511000` 毫秒**
- 视频资产 ID：`asset:video-09-03`
- 相邻课次，仅用于定位：`[
  {
    "lessonId": "09-02",
    "title": "第一个动态规划问题 Climbing Stairs"
  },
  {
    "lessonId": "09-04",
    "title": "状态的定义和状态转移 House Robber"
  }
]`
- 可核查的关系候选：`[
  {
    "from": "lesson:09-02",
    "fromTitle": "第一个动态规划问题 Climbing Stairs",
    "to": "lesson:09-03",
    "toTitle": "发现重叠子问题 Integer Break",
    "type": "extends",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:09-03",
    "fromTitle": "发现重叠子问题 Integer Break",
    "to": "lesson:09-04",
    "toTitle": "状态的定义和状态转移 House Robber",
    "type": "extends",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  }
]`

目录标题、相邻课次和关系候选都是非证据先验。视频内容不一致时，以视频为准并写入 `uncertainties`。

### 时间戳硬约束

1. 所有 `timeline[].startMs/endMs` 和 `evidence[].startMs/endMs` 都以当前视频起点为 0。
2. **任何时间戳都不得大于 `1511000`。**
3. 压缩副本保持原时长；不得使用其他版本课程、网页播放器或记忆中的时间轴。
4. 无法可靠定位时填 `null`，不要猜测。
5. 输出前必须检查最后一个 `endMs <= 1511000`。

## 证据、题面与代码规则

1. 只把视频音频、画面、幻灯片、字幕或屏幕代码中可观察到的内容标为 `course_direct`。
2. `course_direct` 必须引用至少一个真实 `evidence` ID；否则改为 `editorial_inference` 或不输出。
3. 每个重要结论都引用 `ev-001`、`ev-002` 等证据 ID。
4. 画面与口述冲突时分别记录。OCR、公式、代码或音频不清时写入 `uncertainties`。
5. 题目平台、编号、输入有序性、值域、正负性、原地要求、稳定性、索引基数、唯一解等约束，只能在视频明确出现时写入；不能根据题名或记忆补齐。
6. 同一道题的不同解法必须分别写入 `solutionProgression`，并让复杂度、代码和状态模型链接到对应解法，不能合并成一个笼统结论。
7. 屏幕代码完整可辨时用 `completeness: "complete"`；可辨片段可以用 `"partial"`；关键字符不确定时用 `"uncertain"`。不得为了完整性补写隐藏代码。
8. `<`、`<=`、`>`、`>=`、`+1`、`-1`、初始化边界、数组下标和返回值都是关键 token。看不清时必须写入 `ocrUncertainties`，不能猜测。
9. `codeArtifacts[].sourceKind` 固定为 `shown_in_video`，`verification` 固定为 `not_run`。
10. 非题解课允许 `problem: null`，不强行生成题面、解法或证明。
11. `provenance.requestId`、`provenance.generatedAt` 固定为 `null`，由本地管线注入。
12. 关系候选由课程明确承接或给定候选提出；编辑推断使用 `editorial_hypothesis`。

## 状态、不变量与正确性规则

1. 二分查找必须记录视频实际使用的搜索区间开闭语义、左右边界初值、循环条件、分支更新和退出后的含义；不得把 `[l, r]` 与 `[l, r)` 两种定义混写。
2. partition 必须记录各区域的边界和语义，以及扫描指针每种分支如何改变区域。
3. 双指针必须记录每个指针指向什么、为何移动某一侧，以及移动后保留的候选空间或性质。
4. 滑动窗口必须记录窗口开闭语义、扩张和收缩条件、窗口内维护的统计量或查找结构，以及窗口保持的性质。
5. 递归或回溯必须记录视频实际定义的函数契约、当前部分解、候选域、基本情况与规模缩减；若画面出现“选择 → 递归 → 撤销”，把三步分别写入状态转移，不能只写“使用回溯”。
6. 对访问标记必须说明其生命周期：当前路径内使用后恢复、整次搜索永久保留，或视频没有说明。路径内恢复与全局去重不得混写；某条成功分支直接返回而没有执行恢复时，要按真实控制流记录。
7. 排列、组合、网格路径、flood fill 与约束搜索不能因为都使用递归而自动视为同一算法；候选边界、是否允许复用、访问状态是否恢复及剪枝条件都必须来自视频。
8. `stateModels` 只记录视频可观察到的变量、区域、转移和不变量。若老师没有正式表述不变量，`invariant` 可以为 `null`，不能用教材知识补写。
9. `correctness.method: "loop_invariant"` 只能在至少一个状态模型包含有证据的不变量，并且视频给出初始化、保持、终止和后置条件论证时使用；否则使用 `state_transition`、`unknown` 或其他真实匹配的方法，并记录不确定项。
10. `correctness.method: "recursive_contract"` 只能在视频说明递归函数的输入/返回语义、基本情况、递归推进和结果组合方式时使用；否则使用 `state_transition` 或 `unknown`，不得用算法常识补齐证明义务。
11. `correctness.method: "state_transition"` 只能在 `correctness.stateModelIds` 至少引用一个状态模型，并且被引用模型的 `transitions` 非空时使用；如果视频没有提供可记录的状态转移，就使用 `unknown`，不要把空转移模型标成 `state_transition`。
12. `correctness.method` 只能是 `not_applicable`、`loop_invariant`、`recursive_contract`、`induction`、`state_transition`、`exchange_argument`、`experimental_validation`、`other`、`unknown`。

## 动态规划专项证据规则

1. 递归穷举、带记忆化的自顶向下解法、自底向上的动态规划、空间压缩版本和其他替代解法必须分别建立 `solutionProgression` 项。不得把后一个版本的状态、代码、复杂度或正确性结论写到前一个版本；只在视频明确说明状态语义完全不变时才可复用状态模型。
2. 第 9 章中 `stage` 为 `intermediate` 或 `optimized` 的 `solutionProgression` 项，以及任何 `codeArtifactIds` 非空的解法项，都必须引用至少一个 `stateModels` 项。被解法引用的状态模型必须含有至少一个有证据的变量或区域，并至少含有一个有证据的转移。只被描述或否定、没有屏幕代码的 `baseline`、`alternative`、`observation` 可以保留空 `stateModelIds`，不能为通过门禁而补造状态；若视频仅提到算法名且不足以形成解法阶段，则不要创建虚假的解法项。
3. 动态规划状态必须记录视频实际给出的语义，而不是只写 `dp[i]` 或“最优解”：状态数组或函数名、每个维度/参数代表什么、索引或容量的有效域、值表示计数/最值/可达性/选择/前驱中的哪一种、初始状态、转移依赖和最终答案从哪里读取。未说明的部分保留 `null` 或写入 `uncertainties`。
4. 用 `stateModels.kind: "other"` 表达动态规划或记忆化状态。把数组/函数及下标、容量、物品编号、前驱或选择记录放入 `variables`；把已求解与未求解状态域、前缀、容量区间或表格区域放入 `regions`；把基本情况或初始化、状态转移、遍历/递归推进和答案提取分别写入 `transitions` 或 `termination`，并引用对应画面或口述证据。
5. 必须区分“数学状态定义”“递推式”和“代码中的数组下标”。如果视频从 1 基物品编号改成 0 基数组、用 `i-1` 访问原数组、扩大表格一行/一列或平移容量下标，要逐项记录，不能把不同约定合并。
6. 记忆化解法必须记录缓存的键、未计算哨兵值、命中缓存时的控制流，以及缓存的是当前状态结果还是某个子问题结果；只有视频确实展示这些细节时才写。递归树中出现重复节点不自动证明代码已经记忆化。
7. 自底向上解法必须记录初始化、状态计算顺序和每个状态读取的依赖。循环方向只有在画面或口述可见时才能写；不要根据常见模板补出从小到大、从大到小或对角线顺序。
8. 0-1 背包必须分别记录物品前缀与容量两个维度、选/不选分支的适用条件、价值与重量数组的索引约定，以及每件物品最多使用一次的来源。二维表、滚动数组和一维数组是不同实现版本，分别绑定代码和空间复杂度。
9. 一维背包必须精确记录容量循环的方向、边界和所读取的数组版本。若视频说明容量倒序用于保留“上一物品层”的值，把它写入状态转移；若容量正序会在同一轮复用刚更新的值，也只能按视频表述记录。不得仅凭代码题型自动把正序解释为完全背包，也不得把 0-1、完全、多重背包混为一谈。
10. LIS、LCS、网格最短路等问题必须分别记录状态维度、候选前驱/相邻状态、比较条件的严格性（如 `<` 与 `<=`）、边界初始化和答案位置。视频只列举问题而未展开时，保留为概念或关系证据，不能补造完整递推式与复杂度。
11. “求最优值/可行性”和“恢复一组具体解”是两个不同任务。只有视频展示前驱、选择表或回溯路径时，才记录具体解恢复；记录恢复起点、每步依据、终止条件、是否需要反转及并列最优解如何处理。不能从只有数值 DP 的代码推断出恢复方法。
12. “重叠子问题”“最优子结构”或“无后效性”是适用性概念，不等同于当前实现的完整正确性证明。`correctness.method: "induction"` 只在视频给出基本情况、归纳/保持步骤和最终状态含义时使用，并用 `initialization`、`preservation`、`postcondition` 三类直接证据义务记录；否则使用 `state_transition`、`unknown` 或其他真实匹配的方法。
13. 动态规划的复杂度必须绑定到具体解法，并尽量记录视频实际给出的来源：状态数、每个状态枚举的转移数、初始化成本、表格尺寸和递归栈。不能仅凭出现两层循环就补写 `O(n²)`，也不能把空间压缩自动描述为时间优化。
14. 表格、递推式、状态转移方程或恢复指针清晰可辨时写入 `formulaArtifacts`；公式中的下标范围、`max/min`、逻辑或、条件分支、正负无穷哨兵和初始化值都是关键 token，看不清时使用 `partial/uncertain` 并写入 `ocrUncertainties`。
15. 屏幕同时出现多份实现时，先按函数名、注释、时间段和解法阶段分开，再提取代码；不得把递归版、记忆化版和迭代版的片段拼成一份“完整”代码。

## 复杂度防补造规则

1. 顶层 `complexity` 永远必须是对象，不能返回 `null`。若视频没有给出摘要复杂度，使用 `{"time":null,"space":null,"assumptions":[],"evidenceIds":[]}`；详细结论仍写入 `complexityAnalyses`。
2. 保留老师实际使用的 `O`、`Θ`、`Ω`，不能擅自把口语 Big O 改成严格紧界。
3. 每个变量都记录视频给出的含义；未定义时填 `null` 并记录不确定项，不能默认都是 `n`。
4. 区分理论操作次数、墙钟时间、辅助空间和递归栈空间。
5. 区分 `worst`、`average`、`best`、`expected`、`amortized`、`empirical`；未说明用 `unspecified`。
6. 公式只转录可辨部分，不能用教材记忆补齐。
7. 递归分析不得凭算法名自动套主定理；记录实际出现的递推式、终止条件、分支、规模缩减、树深、每层工作量和总和。
8. 少量实验数据不能证明渐进复杂度，只能描述观察趋势。
9. 实验未交代的硬件、系统、编译器、优化、计时器、预热、重复次数和输入分布填 `null`，不得用当前机器补齐。
10. 均摊复杂度不等于随机输入的平均复杂度；记录操作序列、昂贵操作触发条件、序列总成本和方法。
11. 每个解法的复杂度必须与该解法的证据绑定，不能把优化解法的复杂度写到基线解法上。
12. 动态规划的时间复杂度若由“状态数量 × 单状态转移成本”得到，要分别记录两部分及其变量含义；视频没有给出推导时不得自行补齐。
13. 记忆化递归的缓存空间、递归栈空间与自底向上表格空间应分别记录；一维压缩只在视频明确说明时改写对应解法的辅助空间结论。

## 输出总结构

只输出一个标准 JSON 对象，不要 Markdown 代码围栏、前言或结语。**响应的第一个非空白字符必须是 `{`，最后一个非空白字符必须是 `}`；禁止把对象包装在 `[]` 数组中。**缺少内容时使用 `null` 或空数组，不保留空示例对象。

{
"schemaVersion": "1.0",
"lessonId": "09-03",
"chapterId": "09",
"titleObserved": null,
"contentKind": "unknown",
"actualDurationSeconds": 1511,
"timeline": [],
"learningObjectives": [],
"concepts": [],
"problem": null,
"solutionProgression": [],
"codeArtifacts": [],
"stateModels": [],
"correctness": {
"method": "unknown",
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
"experiments": [],
"examples": [],
"edgeCases": [],
"implementationPitfalls": [],
"interviewPlaybook": [],
"relationCandidates": [],
"evidence": [],
"uncertainties": [],
"provenance": {
"model": "google/gemini-3.6-flash",
"requestId": null,
"promptVersion": "video-evidence-v1.6",
"generatedAt": null
}
}

`contentKind` 只能是 `interview_strategy`、`concept`、`experiment`、`problem_walkthrough`、`anecdote`、`conclusion`、`mixed`、`unknown`。

## 通用对象的精确结构

`timeline`：

{
"startMs": null,
"endMs": null,
"topic": "",
"summary": "",
"evidenceIds": []
}

`learningObjectives`、`examples`、`edgeCases`、`implementationPitfalls`、`interviewPlaybook`、`correctness.claims`，以及下文标为 sourced statement 的对象都只能使用：

{
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
}

不得使用 `advice`、`pitfall`、`solution`、`text` 或普通字符串代替 sourced statement。

`concepts`：

{
"canonicalName": "",
"namesObserved": [],
"role": "introduces",
"definition": null,
"evidenceIds": []
}

`definition` 只能是字符串或 `null`。`role` 只能是 `introduces`、`reinforces`、`applies`、`contrasts`、`mentions`。

`evidence`：

{
"id": "ev-001",
"sourceType": "video_combined",
"startMs": null,
"endMs": null,
"assetId": "asset:video-09-03",
"locator": null,
"observation": "",
"confidence": 0.0
}

不得使用 `timestampMs`、`content` 等替代字段。`sourceType` 只能是 `video_audio`、`video_visual`、`video_combined`、`text`、`editorial_inference`。

## 题面、解法、代码和状态的精确结构

`problem` 非空时：

{
"platform": null,
"problemId": null,
"titleObserved": null,
"statement": null,
"constraints": [],
"clarifyingQuestions": [],
"evidenceIds": []
}

`constraints` 和 `clarifyingQuestions` 都是字符串数组。`problem.evidenceIds` 必须覆盖题意及所有写入的约束；没有视频证据的约束不要写。

`solutionProgression` 每项：

{
"id": "solution-001",
"stage": "baseline",
"idea": "",
"timeComplexity": null,
"spaceComplexity": null,
"limitations": [],
"codeArtifactIds": [],
"stateModelIds": [],
"evidenceIds": []
}

`stage` 只能是 `baseline`、`observation`、`intermediate`、`optimized`、`alternative`。`limitations` 是字符串数组。每项必须有证据；没有口述复杂度时对应字段填 `null`。

`codeArtifacts` 每项：

{
"id": "code-001",
"solutionStageId": null,
"language": null,
"sourceKind": "shown_in_video",
"completeness": "complete",
"code": "",
"ocrUncertainties": [],
"verification": "not_run",
"evidenceIds": []
}

`solutionStageId` 必须引用存在的解法或为 `null`。`ocrUncertainties` 应精确指出不清楚的行、关键 token 或被遮挡部分。

`stateModels` 每项：

{
"id": "state-001",
"solutionStageId": null,
"kind": "other",
"variables": [
{
"symbol": "",
"role": "",
"meaning": "",
"updateRule": null,
"evidenceIds": []
}
],
"regions": [
{
"notation": "",
"meaning": "",
"evidenceIds": []
}
],
"invariant": null,
"transitions": [
{
"condition": "",
"updates": "",
"preserves": null,
"evidenceIds": []
}
],
"termination": null,
"evidenceIds": []
}

`kind` 只能是 `search_interval`、`partition`、`two_pointer`、`sliding_window`、`other`。`invariant`、`transitions[].preserves` 和 `termination` 是 sourced statement 或 `null`。变量、区域和转移每项都必须引用证据。若后一个解法只改变中点计算等代码细节、状态语义完全不变，可以复用前一个解法的状态模型；此时 `solutionStageId` 指首次定义该状态模型的解法，所有复用它的解法都在自己的 `stateModelIds` 中列出该 ID。

`correctness`：

{
"method": "unknown",
"claims": [],
"stateModelIds": [],
"obligations": [
{
"phase": "initialization",
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
}
]
}

`phase` 只能是 `initialization`、`preservation`、`termination`、`postcondition`、`boundary_safety`。同一阶段可以有多个义务（例如不同分支各自的保持性）。使用 `loop_invariant` 时，四个阶段 `initialization`、`preservation`、`termination`、`postcondition` 都必须有直接视频证据；状态模型的 `invariant` 本身也必须是 `course_direct` 且引用视频证据。使用 `state_transition` 时，`stateModelIds` 必须引用至少一个 `transitions` 非空的状态模型；若无法从视频中提取任何转移，则必须使用 `unknown`。

## 复杂度、公式和实验的精确结构

`complexityAnalyses` 每项：

{
"id": "cx-001",
"subject": "",
"measure": "time",
"notation": "O",
"case": "unspecified",
"expressionObserved": null,
"expressionNormalized": null,
"normalizationSourceClass": "course_direct",
"variables": [
{
"symbol": "",
"meaning": null,
"domainOrRelationship": null,
"evidenceIds": []
}
],
"costModel": null,
"derivationSteps": [],
"assumptions": [],
"conclusion": {
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
},
"evidenceIds": []
}

- `measure`：`time`、`auxiliary_space`、`stack_space`、`operation_count`
- `notation`：`O`、`Theta`、`Omega`、`none`、`unknown`
- `case`：`worst`、`average`、`best`、`amortized`、`expected`、`empirical`、`unspecified`
- `costModel` 为 sourced statement 或 `null`
- `derivationSteps`、`assumptions` 的每项都是 sourced statement
- `conclusion` 必须是 sourced statement

`formulaArtifacts` 每项：

{
"id": "formula-001",
"kind": "formula",
"sourceKind": "shown_in_video",
"rawText": null,
"normalizedText": null,
"variables": [
{
"symbol": "",
"meaning": null,
"domainOrRelationship": null,
"evidenceIds": []
}
],
"completeness": "complete",
"ocrUncertainties": [],
"evidenceIds": []
}

`variables` 必须是对象数组。`kind` 只能是 `formula`、`recurrence`、`summation`、`inequality`、`table`；`sourceKind` 只能是 `shown_in_video`、`reconstructed`。
复杂度或公式变量在视频明确区分变量职责时，可额外使用可选字段 `"role": "..."`；没有明确职责时省略或填 `null`。

`experiments` 每项：

{
"id": "experiment-001",
"subject": "",
"purpose": {
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
},
"setup": {
"language": null,
"compilerOrRuntime": null,
"optimization": null,
"operatingSystem": null,
"hardware": null,
"timer": null,
"warmup": null,
"repetitions": null,
"inputGeneration": null
},
"measurements": [
{
"inputDescription": null,
"inputSize": null,
"observedValue": null,
"unit": null,
"evidenceIds": []
}
],
"theoreticalExpectation": null,
"observation": null,
"limitations": [],
"evidenceIds": []
}

每个 `experiments[]` 对象自身必须包含 `evidenceIds` 数组，即使其 `purpose`、`measurements`、`observation` 已分别带证据，也不能省略这个顶层字段。`purpose` 必须是 sourced statement。`theoreticalExpectation`、`observation` 为 sourced statement 或 `null`。`limitations` 是 sourced statement 数组。

## 关系与不确定项

`relationCandidates` 每项：

{
"from": "lesson:00-00",
"to": "lesson:00-00",
"type": "extends",
"status": "provisional",
"rationale": "",
"confidence": 0.0,
"basis": "explicit_in_lesson",
"evidenceIds": []
}

`status` 固定为 `provisional`；`basis` 只能是 `explicit_in_lesson`、`editorial_hypothesis`。不得复制候选上下文中的 `fromTitle`、`toTitle`、`priorKind`，也不得添加其他字段。

`uncertainties` 每项：

{
"field": "",
"reason": "",
"recommendedCheck": ""
}

输出前再次检查：

- JSON 可解析；
- 所有顶层字段和精确对象字段都存在且没有额外字段；
- 所有 `course_direct` 都有证据；
- 所有 ID 唯一，solution/code/state 引用都指向存在对象；
- 所有证据 ID 存在；
- 所有 evidence 使用 `assetId: "asset:video-09-03"`；
- 所有时间戳不超过 `1511000`；
- 所有代码 `verification` 为 `not_run`；
- `loop_invariant` 的状态模型和四阶段义务齐全。
- 第 9 章每个 `intermediate`/`optimized` 或含代码的解法都引用含变量/区域与转移的状态模型；无代码且仅被描述/否定的基线、替代和观察阶段没有被迫补造状态；
- 递归、记忆化、自底向上和空间压缩版本没有混用状态、代码或复杂度；
- 背包的一维/二维实现、容量遍历方向和物品复用语义均来自视频证据；
- 使用 `induction` 时，基本情况、归纳/保持步骤和最终状态含义都有直接证据。
