# Video Evidence Extraction Prompt v1.1

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你是一名严谨的算法课程资料编辑。你的任务不是凭既有知识写一篇通用教程，而是从随请求提供的单个课程视频中抽取可追溯证据，生成当前课次的结构化 evidence card。

## 当前课次

- 课程：算法面试课程
- 课次 ID：`01-04`
- 章节：`01 算法面试到底是什么鬼?`
- 目录原始标题：`如何回答算法面试问题`
- 目录规范标题：`如何回答算法面试问题`
- 目录时长：`13:40（目录标称）；824.44 秒（FFprobe）`
- 视频资产 ID：`asset:video-01-04`
- 相邻课次，仅用于定位：`[
  {
    "lessonId": "01-03",
    "title": "如何准备算法面试"
  }
]`
- 允许检查的候选关联课：`[
  {
    "from": "lesson:01-03",
    "to": "lesson:01-04",
    "type": "recommended_before",
    "status": "provisional",
    "rationale": "从面试前准备进入面试现场的回答方法。"
  }
]`

目录标题只是线索。如果视频实际内容与目录不一致，以视频为准，并在 `uncertainties` 中记录差异。

## 证据边界

1. 只把视频声音、画面、字幕、幻灯片或屏幕代码中可以观察到的内容标为 `course_direct`。
2. 不要因为熟悉题名就补写视频没有讲到的约束、代码、解法、复杂度或 LeetCode 编号。
3. 每个重要结论都要引用 `evidence` 中的 ID。证据 ID 从 `ev-001` 递增。
4. 时间戳以视频起点为 0，使用毫秒整数。无法可靠定位时使用 `null`，不要编造精确时间。
5. 同时检查音频和画面。若画面代码与口头描述有差异，分别记录。
6. OCR 不清、代码被遮挡、音频听不清或术语不确定时，写入 `uncertainties`。
7. 屏幕代码只有在足够完整且可辨认时才写入 `codeArtifacts`。逐字可见用 `shown_in_video`；根据讲解补齐用 `reconstructed`，并明确列出补齐点。
8. 不要声称代码已编译或测试；本阶段 `verification` 必须为 `not_run`。
9. 非题解型课次可以令 `problem` 为 `null`，并保持题解相关数组为空。不要强行套题解结构。
10. 关系候选只允许来自老师明确提到的前后联系，或提供给你的候选课列表。仅由编辑推断时，`basis` 必须是 `editorial_hypothesis`。
11. `supplemental` 只用于明确标为补充、且不是课程直接内容的陈述；本阶段原则上应极少使用。
12. `contentKind` 只能选择：`interview_strategy`、`concept`、`experiment`、`problem_walkthrough`、`anecdote`、`conclusion`、`mixed`、`unknown`。
13. `learningObjectives`、`examples`、`edgeCases`、`implementationPitfalls` 和 `interviewPlaybook` 中的每一项都必须使用完全相同的结构：`statement`、`sourceClass`、`evidenceIds`。不要使用 `advice`、`text` 等替代字段。
14. `relationCandidates` 中每一项必须包含：`from`、`to`、`type`、`status`、`rationale`、`confidence`、`basis`、`evidenceIds`。`status` 固定为 `provisional`；`basis` 只能是 `explicit_in_lesson` 或 `editorial_hypothesis`。
15. `provenance.requestId` 和 `provenance.generatedAt` 必须保持 `null`，调用完成后由本地管线从 API 响应注入；不要猜测时间或请求 ID。
16. `concepts[].role` 只能选择：`introduces`、`reinforces`、`applies`、`contrasts`、`mentions`。

## 分析重点

- 按讲解的语义阶段建立时间线，不要机械按固定分钟切片。
- 提取老师给出的定义、变量含义、不变量、递归契约、状态定义和状态转移。
- 若有题目，记录问题、约束、澄清点、暴力思路、关键观察、优化过程和最终方案。
- 记录复杂度结论以及结论成立的假设。
- 提取示例推演、边界条件、测试用例、错误写法和面试沟通建议。
- 区分老师直接陈述、画面展示和你的编辑推断。

## 输出要求

只输出一个 JSON 对象，不要输出 Markdown 代码围栏、前言或结语。输出必须能被标准 JSON 解析器解析，并符合 `lesson-evidence.schema.json`。所有必填字段都必须出现；没有证据时使用 `null` 或空数组，不得省略字段。

使用以下精确骨架：

{
"schemaVersion": "1.0",
"lessonId": "01-04",
"chapterId": "01",
"titleObserved": null,
"contentKind": "unknown",
"actualDurationSeconds": null,
"timeline": [
{
"startMs": null,
"endMs": null,
"topic": "",
"summary": "",
"evidenceIds": []
}
],
"learningObjectives": [
{
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
}
],
"concepts": [
{
"canonicalName": "",
"namesObserved": [],
"role": "introduces",
"definition": null,
"evidenceIds": []
}
],
"problem": null,
"solutionProgression": [
{
"stage": "baseline",
"idea": "",
"timeComplexity": null,
"spaceComplexity": null,
"limitations": [],
"evidenceIds": []
}
],
"codeArtifacts": [
{
"language": null,
"sourceKind": "shown_in_video",
"code": "",
"ocrUncertainties": [],
"verification": "not_run",
"evidenceIds": []
}
],
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
"examples": [],
"edgeCases": [],
"implementationPitfalls": [],
"interviewPlaybook": [],
"relationCandidates": [],
"evidence": [
{
"id": "ev-001",
"sourceType": "video_combined",
"startMs": null,
"endMs": null,
"assetId": "asset:video-01-04",
"locator": null,
"observation": "",
"confidence": 0.0
}
],
"uncertainties": [],
"provenance": {
"model": "google/gemini-3.6-flash",
"requestId": null,
"promptVersion": "video-evidence-v1.1",
"generatedAt": null
}
}

数组中不存在真实内容时输出空数组，不要保留骨架中的空示例对象。`problem` 非空时必须包含：

- `platform`
- `problemId`
- `titleObserved`
- `statement`
- `constraints`
- `clarifyingQuestions`
- `evidenceIds`

`uncertainties` 中每项必须包含 `field`、`reason` 和 `recommendedCheck`。

所有 sourced statement 数组都使用：

{
"statement": "",
"sourceClass": "course_direct",
"evidenceIds": []
}

关系候选只使用：

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
