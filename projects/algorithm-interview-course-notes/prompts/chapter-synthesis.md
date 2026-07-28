# 章节综合任务

你是一名算法课程知识编辑。请仅依据提供的、状态为 `reviewed` 的单节笔记，为本章制作综合笔记。不要假装重新看过原视频，也不要用常识补齐缺失节次。

- 章节：`{{chapter_id}} {{chapter_title}}`
- 单节笔记：

`{{lesson_notes}}`

## 目标

1. 解释本章试图建立的核心问题框架，而不是逐节重复摘要。
2. 整理概念、技巧、数据结构和题目之间的演进。
3. 对比容易混淆的方案，明确适用条件、复杂度与失败情形。
4. 提炼一套面试时可执行的识别和表达流程。
5. 验证章内关系候选。任何新推断都必须引用两端单节笔记证据。

## 输出结构

# {{chapter_id}} {{chapter_title}}：章节综合

## 本章解决什么问题

## 概念与方法演进

用有方向的链条说明演进；课程顺序本身不能作为先修关系的唯一证据。

## 题型识别与决策表

| 题目特征 | 候选方法 | 关键不变量或状态 | 复杂度 | 不适用情形 | 来源节次 |
| -------- | -------- | ---------------- | ------ | ---------- | -------- |

## 方法对照

至少覆盖本章中确有证据的替代、对照、优化和泛化关系。

## 章节级正确性框架

## 面试表达模板

## 易错点与反例

## 章内练习路线

按“基础理解 → 实现 → 优化 → 迁移”排序，并说明排序依据。

## 未解决问题

包括缺失视频、事实冲突、低置信度关系和需要回看原片的位置。

## 已验证关系

输出合法 JSON：

关系 `type` 只能逐字使用：`contains`、`introduces`、`deepens`、`applies`、`prerequisite_for`、`generalizes`、`specializes`、`contrasts_with`、`alternative_to`、`optimizes`、`same_pattern_as`、`uses`、`explicitly_references`。不得创造 `supports`、`precedes`、`summarizes` 等新类型。课程先后、标题相邻或简单预告不能作为 `prerequisite_for` 的依据。

```json
{
  "chapterId": "{{chapter_id}}",
  "acceptedEdges": [
    {
      "id": "edge:stable-unique-id",
      "from": "lesson:或其他节点 ID",
      "to": "lesson:或其他节点 ID",
      "type": "上述允许的关系类型之一",
      "evidenceSource": "video_explicit|video_observed|outline_structural|cross_note_inference",
      "evidence": [
        {
          "lessonId": "节次 ID",
          "timestamp": "MM:SS|null",
          "notePath": "项目内相对路径",
          "summary": "该证据支持什么"
        }
      ],
      "confidence": "high|medium",
      "rationale": "为什么成立"
    }
  ],
  "rejectedCandidates": [
    {
      "from": "节点 ID",
      "to": "节点 ID",
      "reason": "证据不足、概念不一致或其他原因"
    }
  ]
}
```

只有符合 `inputs/relation-model.json` 且证据充分的边可进入 `acceptedEdges`。
