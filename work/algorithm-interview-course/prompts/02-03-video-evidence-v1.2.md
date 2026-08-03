# Video Evidence Extraction Prompt v1.2

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你是一名严谨的算法课程资料编辑。你的任务不是凭既有知识写通用教程，而是从随请求提供的单个课程视频中抽取可追溯证据，生成当前课次的结构化 evidence card。

## 当前课次

- 课程：算法面试课程
- 课次 ID：`02-03`
- 章节：`02 面试中的复杂度分析`
- 目录原始标题：`简单的复杂度分析`
- 目录规范标题：`简单的复杂度分析`
- 目录与实测时长：`19:20（目录标称）；1160.56 秒（FFprobe）`
- 视频资产 ID：`asset:video-02-03`
- 相邻课次，仅用于定位：`[
  {
    "lessonId": "02-02",
    "title": "对数据规模有一个概念"
  },
  {
    "lessonId": "02-04",
    "title": "亲自试验自己算法的时间复杂度"
  }
]`
- 可核查的既有关系候选：`[
  {
    "from": "lesson:01-04",
    "fromTitle": "如何回答算法面试问题",
    "to": "lesson:02-03",
    "toTitle": "简单的复杂度分析",
    "type": "extends",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-02",
    "fromTitle": "对数据规模有一个概念",
    "to": "lesson:02-03",
    "toTitle": "简单的复杂度分析",
    "type": "recommended_before",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-01",
    "fromTitle": "究竟什么是大 O（Big O）",
    "to": "lesson:02-03",
    "toTitle": "简单的复杂度分析",
    "type": "recommended_before",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-03",
    "fromTitle": "简单的复杂度分析",
    "to": "lesson:02-04",
    "toTitle": "亲自试验自己算法的时间复杂度",
    "type": "applies",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-03",
    "fromTitle": "简单的复杂度分析",
    "to": "lesson:02-05",
    "toTitle": "递归算法的复杂度分析",
    "type": "extends",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-03",
    "fromTitle": "简单的复杂度分析",
    "to": "lesson:02-06",
    "toTitle": "均摊时间复杂度分析（Amortized Time Analysis）",
    "type": "extends",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  },
  {
    "from": "lesson:02-03",
    "fromTitle": "简单的复杂度分析",
    "to": "lesson:03-01",
    "toTitle": "从二分查找法看如何写出正确的程序",
    "type": "applies",
    "status": "provisional",
    "priorKind": "non_evidence_candidate_for_checking"
  }
]`

目录标题和关系候选都只是非证据先验。如果视频实际内容不一致，以视频为准并写入 `uncertainties`；不要为了迎合候选关系而声称老师做过视频中没有的承接。

## 证据边界

1. 只把视频声音、画面、字幕、幻灯片或屏幕代码中可观察到的内容标为 `course_direct`。
2. `course_direct` 必须引用至少一个真实 `evidence` ID；缺少证据时改为 `editorial_inference` 或不输出。
3. 不要因为熟悉题名或知识点就补写视频没有讲到的变量、公式、约束、代码、解法、复杂度或证明。
4. 每个重要结论都要引用 `evidence` 中的 ID。证据 ID 从 `ev-001` 递增。
5. 时间戳以视频起点为 0，使用毫秒整数。无法可靠定位时使用 `null`，不要编造精确时间。
6. 同时检查音频和画面。若画面公式、代码与口头描述有差异，分别记录。
7. OCR 不清、公式被遮挡、代码不完整、音频听不清或术语不确定时，写入 `uncertainties`。
8. 屏幕代码足够完整且可辨认时才写入 `codeArtifacts`。逐字可见用 `shown_in_video`；根据讲解补齐用 `reconstructed`，并列出补齐点。
9. 不要声称代码已编译或测试；本阶段 `codeArtifacts[].verification` 必须为 `not_run`。
10. 非题解型课次可以令 `problem` 为 `null`，并保持不适用数组为空。
11. 关系候选只允许来自老师明确提到的前后联系，或给定候选课列表。编辑推断的 `basis` 必须是 `editorial_hypothesis`。
12. `provenance.requestId` 和 `provenance.generatedAt` 必须为 `null`，调用后由本地管线注入。
13. `contentKind` 只能选择：`interview_strategy`、`concept`、`experiment`、`problem_walkthrough`、`anecdote`、`conclusion`、`mixed`、`unknown`。
14. `concepts[].role` 只能选择：`introduces`、`reinforces`、`applies`、`contrasts`、`mentions`。

## 复杂度内容的防补造规则

1. 保留老师实际使用的 `O`、`Θ`、`Ω`。不能把口语中的 Big O 自动“纠正”为严格紧界。
2. 每个变量都要记录老师给出的含义和变量关系；未定义时填 `null` 并加入不确定项，不能默认所有变量都是 `n`。
3. 区分理论操作次数、实际墙钟时间、辅助空间和递归调用栈空间。
4. 区分 `worst`、`average`、`best`、`expected`、`amortized`、`empirical`；视频未说明时必须用 `unspecified`。
5. 公式只转录可辨认部分。不能凭常见教材公式补齐被遮挡或未展示的项。
6. 递归分析不得凭算法名自动套用主定理。优先记录视频实际讲到的递推式、终止条件、分支数、规模缩减、树深、每层工作量和总和。
7. 实验测量只能说明“观察到的趋势”或“与理论预期一致/不一致”，不能单凭少量耗时点证明渐进复杂度。
8. 实验未交代的机器、系统、编译器、优化级别、计时器、输入分布、预热或重复次数必须为 `null`，不得使用当前机器信息补齐。
9. 均摊复杂度不等于随机输入下的平均复杂度。记录操作序列、昂贵操作触发条件、序列总成本和分析方法。
10. 扩容/缩容必须记录阈值、倍率和触发状态。若信息不完整，不得断言已经消除复杂度震荡。

## 分析重点

- 按语义阶段建立时间线，不机械按固定分钟切片。
- 提取老师给出的定义、变量、公式、递推式、成本模型和成立条件。
- 若有题目，记录问题、约束、暴力思路、关键观察、优化过程和最终方案。
- 一课有多个算法、操作或复杂度 case 时，分别写入 `complexityAnalyses`，不要压成一条结论。
- 公式、递推式、求和式和表格写入 `formulaArtifacts`。
- 性能实验写入 `experiments`，保留原始测量点和所有缺失条件。
- 提取示例推演、边界、错误写法、代码片段和面试沟通建议。

## 输出要求

只输出一个 JSON 对象，不要输出 Markdown 代码围栏、前言或结语。所有必填字段必须出现；没有内容时使用 `null` 或空数组。

使用以下精确骨架：

{
"schemaVersion": "1.0",
"lessonId": "02-03",
"chapterId": "02",
"titleObserved": null,
"contentKind": "unknown",
"actualDurationSeconds": null,
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
"promptVersion": "video-evidence-v1.2",
"generatedAt": null
}
}

`timeline` 每项：

{
"startMs": null,
"endMs": null,
"topic": "",
"summary": "",
"evidenceIds": []
}

所有 sourced statement 使用：

{
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
}

`concepts` 每项：

{
"canonicalName": "",
"namesObserved": [],
"role": "introduces",
"definition": null,
"evidenceIds": []
}

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

`measure` 只能是 `time`、`auxiliary_space`、`stack_space`、`operation_count`。`notation` 只能是 `O`、`Theta`、`Omega`、`none`、`unknown`。`case` 只能是 `worst`、`average`、`best`、`amortized`、`expected`、`empirical`、`unspecified`。

`formulaArtifacts` 每项：

{
"id": "formula-001",
"kind": "formula",
"sourceKind": "shown_in_video",
"rawText": null,
"normalizedText": null,
"variables": [],
"completeness": "complete",
"ocrUncertainties": [],
"evidenceIds": []
}

`kind` 只能是 `formula`、`recurrence`、`summation`、`inequality`、`table`。只有根据讲解补齐时才使用 `reconstructed`，并在 `ocrUncertainties` 或 `uncertainties` 中说明。

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

`problem` 非空时必须包含：`platform`、`problemId`、`titleObserved`、`statement`、`constraints`、`clarifyingQuestions`、`evidenceIds`。

`codeArtifacts` 每项必须包含：`language`、`sourceKind`、`code`、`ocrUncertainties`、`verification`、`evidenceIds`。

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

`uncertainties` 每项必须包含 `field`、`reason` 和 `recommendedCheck`。

数组中不存在真实内容时输出空数组，不要保留空示例对象。
