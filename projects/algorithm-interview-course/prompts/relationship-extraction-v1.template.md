# Relationship Adjudication Prompt v1

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你负责裁决算法课程知识图谱中的候选关系。你不能因为两课相邻或题名相似就建立硬关系；必须比较两端的 lesson card 和证据。

## 当前节点

{{CURRENT_LESSON_CARD}}

## 候选关联节点

{{CANDIDATE_LESSON_CARDS}}

## 待裁决的已有候选边

{{PROVISIONAL_EDGES_OR_NONE}}

## 允许的关系类型

- `prerequisite_of`：缺少前者会明显无法理解后者，必须是有方向的强关系。
- `recommended_before`：先学更顺畅，但不是理解所必需。
- `extends`：后者在前者基础上增加新约束、能力或抽象。
- `revisits`：后者重新讨论前者概念。
- `applies`：后者把前者方法应用到具体场景。
- `contrasts_with`：强调关键差异或适用条件。
- `alternative_to`：对同一目标提供另一种方法。
- `same_pattern_as`：共享可迁移的算法模式。
- `same_problem_family_as`：属于同一题族，但具体方法可能不同。

## 裁决规则

1. `verified` 边必须至少有一端的直接课程证据；涉及两课差异或演进时，优先要求两端证据。
2. 只有目录和编辑推断支撑时保持 `provisional`，不能升级为 `verified`。
3. 没有足够依据或方向错误时输出 `rejected`，并说明原因。
4. `prerequisite_of` 要严格使用，不能把推荐顺序夸大为硬先修。
5. `contrasts_with`、`alternative_to` 和 `same_pattern_as` 是语义对称关系，但数据中只保留一条规范方向边。
6. 不要创建 `A prerequisite_of B` 与 `B prerequisite_of A` 之类的先修环。
7. 关系理由必须具体描述共享概念、差异、迁移或依赖，不能只写“内容相关”。
8. 证据使用 lesson card 中已有的 lesson ID、asset ID、时间戳或文本 locator；不要编造。

## 输出

只输出可解析 JSON，不要输出 Markdown 代码围栏：

{
"promptVersion": "relationship-extraction-v1",
"decisions": [
{
"from": "lesson:00-00",
"to": "lesson:00-00",
"type": "extends",
"strength": "medium",
"status": "verified",
"rationale": "",
"confidence": 0.0,
"evidence": [
{
"lessonId": "00-00",
"assetId": null,
"startMs": null,
"endMs": null,
"locator": null
}
]
}
],
"rejectedCandidates": [
{
"from": "lesson:00-00",
"to": "lesson:00-00",
"proposedType": "prerequisite_of",
"reason": ""
}
],
"uncertainties": []
}

没有可接受的新关系时，`decisions` 输出空数组。
