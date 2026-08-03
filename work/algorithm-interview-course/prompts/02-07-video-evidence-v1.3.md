# Video Evidence Extraction Prompt v1.3

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你是一名严谨的算法课程证据编辑。只分析随请求提供的这一段视频，不凭课程名、题名或常识补写视频之外的内容。输出当前课次的结构化 evidence card。

## 当前课次与硬边界

- 课程：算法面试课程
- 课次 ID：`02-07`
- 章节：`02 面试中的复杂度分析`
- 目录原始标题：`避免复杂度的震荡`
- 目录规范标题：`避免复杂度的震荡`
- 目录与 FFprobe 时长：`11:25（目录标称）；689.888 秒（FFprobe）`
- **视频实测总时长：`689.888` 秒，即 `689888` 毫秒**
- 视频资产 ID：`asset:video-02-07`
- 相邻课次，仅用于定位：`[
  {
    "lessonId": "02-06",
    "title": "均摊时间复杂度分析（Amortized Time Analysis）"
  }
]`
- 可核查的关系候选：`[
  {
    "from": "lesson:02-06",
    "fromTitle": "均摊时间复杂度分析（Amortized Time Analysis）",
    "to": "lesson:02-07",
    "toTitle": "避免复杂度的震荡",
    "type": "applies",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  }
]`

目录标题和关系候选都是非证据先验。视频内容不一致时，以视频为准并写入 `uncertainties`。

### 时间戳硬约束

1. 所有 `timeline[].startMs/endMs` 和 `evidence[].startMs/endMs` 都以当前视频起点为 0。
2. **任何时间戳都不得大于 `689888`。**
3. 压缩副本保持原时长；不得使用其他版本课程、网页播放器或记忆中的时间轴。
4. 无法可靠定位时填 `null`，不要猜测。
5. 输出前必须检查最后一个 `endMs <= 689888`。

## 证据与来源规则

1. 只把视频音频、画面、幻灯片、字幕或屏幕代码中可观察到的内容标为 `course_direct`。
2. `course_direct` 必须引用至少一个真实 `evidence` ID；否则改为 `editorial_inference` 或不输出。
3. 每个重要结论都引用 `ev-001`、`ev-002` 等证据 ID。
4. 画面与口述冲突时分别记录。OCR、公式、代码或音频不清时写入 `uncertainties`。
5. 屏幕代码完整可辨时才写入 `codeArtifacts`；不得为了完整性补写隐藏代码。
6. `codeArtifacts[].verification` 固定为 `not_run`。
7. `correctness.method` 只能是 `not_applicable`、`loop_invariant`、`recursive_contract`、`induction`、`state_transition`、`exchange_argument`、`experimental_validation`、`other`、`unknown`。
8. 非题解课允许 `problem: null`，不强行生成题面、解法或证明。
9. `provenance.requestId`、`provenance.generatedAt` 固定为 `null`，由本地管线注入。
10. 关系候选由课程明确承接或给定候选提出；编辑推断使用 `editorial_hypothesis`。

## 复杂度防补造规则

1. 保留老师实际使用的 `O`、`Θ`、`Ω`，不能擅自把口语 Big O 改成严格紧界。
2. 每个变量都记录视频给出的含义；未定义时填 `null` 并记录不确定项，不能默认都是 `n`。
3. 区分理论操作次数、墙钟时间、辅助空间和递归栈空间。
4. 区分 `worst`、`average`、`best`、`expected`、`amortized`、`empirical`；未说明用 `unspecified`。
5. 公式只转录可辨部分，不能用教材记忆补齐。
6. 递归分析不得凭算法名自动套主定理；记录实际出现的递推式、终止条件、分支、规模缩减、树深、每层工作量和总和。
7. 少量实验数据不能证明渐进复杂度，只能描述观察趋势。
8. 实验未交代的硬件、系统、编译器、优化、计时器、预热、重复次数和输入分布填 `null`，不得用当前机器补齐。
9. 均摊复杂度不等于随机输入的平均复杂度；记录操作序列、昂贵操作触发条件、序列总成本和方法。
10. 扩缩容必须记录阈值、倍率和触发状态；信息不全时不能断言已消除震荡。

## 输出总结构

只输出一个标准 JSON 对象，不要 Markdown 代码围栏、前言或结语。缺少内容时使用 `null` 或空数组，不保留空示例对象。

{
"schemaVersion": "1.0",
"lessonId": "02-07",
"chapterId": "02",
"titleObserved": null,
"contentKind": "unknown",
"actualDurationSeconds": 689.888,
"timeline": [],
"learningObjectives": [],
"concepts": [],
"problem": null,
"solutionProgression": [],
"codeArtifacts": [],
"correctness": {
"method": "unknown",
"claims": []
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
"promptVersion": "video-evidence-v1.3",
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

`learningObjectives`、`examples`、`edgeCases`、`implementationPitfalls`、`interviewPlaybook`、`correctness.claims` 以及下文所有 sourced statement 都只能使用：

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

`definition` 只能是字符串或 `null`，不能是 sourced statement 对象。`role` 只能是 `introduces`、`reinforces`、`applies`、`contrasts`、`mentions`。

`evidence` 只能使用：

{
"id": "ev-001",
"sourceType": "video_combined",
"startMs": null,
"endMs": null,
"assetId": "asset:video-02-07",
"locator": null,
"observation": "",
"confidence": 0.0
}

不得使用 `timestampMs`、`content` 等替代字段。`sourceType` 只能是 `video_audio`、`video_visual`、`video_combined`、`text`、`editorial_inference`。

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

`variables` 必须是对象数组，不能是字符串数组。`kind` 只能是 `formula`、`recurrence`、`summation`、`inequality`、`table`；`sourceKind` 只能是 `shown_in_video`、`reconstructed`。

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

`purpose` 必须是 sourced statement。`theoreticalExpectation`、`observation` 为 sourced statement 或 `null`。`limitations` 是 sourced statement 数组，不能使用普通字符串。

## 其他精确结构

`problem` 非空时必须包含：`platform`、`problemId`、`titleObserved`、`statement`、`constraints`、`clarifyingQuestions`、`evidenceIds`。

`codeArtifacts` 每项：

{
"language": null,
"sourceKind": "shown_in_video",
"code": "",
"ocrUncertainties": [],
"verification": "not_run",
"evidenceIds": []
}

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

`status` 固定为 `provisional`；`basis` 只能是 `explicit_in_lesson`、`editorial_hypothesis`。
不得复制候选上下文中的 `fromTitle`、`toTitle`、`priorKind`，也不得添加其他字段。

`uncertainties` 每项：

{
"field": "",
"reason": "",
"recommendedCheck": ""
}

输出前再次检查：

- JSON 可解析；
- 所有 `course_direct` 都有证据；
- 所有证据 ID 存在；
- 所有 evidence 使用 `assetId: "asset:video-02-07"`；
- 所有时间戳不超过 `689888`；
- 所有代码 `verification` 为 `not_run`。
