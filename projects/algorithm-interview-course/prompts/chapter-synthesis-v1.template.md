# Chapter Synthesis Prompt v1

> 这是模板，不要把未替换的 `<PLACEHOLDER>` 直接发送给模型。

你是一名算法课程主编。请基于本章已经过证据整理的单课笔记、概念词表和已裁决关系，生成章节综述。不要重新猜测原视频内容。

## 章节

- 章节 ID：`{{CHAPTER_ID}}`
- 标题：`{{CHAPTER_TITLE}}`

## 单课笔记

{{LESSON_NOTES}}

## 概念词表子集

{{CONCEPT_GLOSSARY}}

## 已裁决关系子图

{{VERIFIED_RELATIONSHIP_SUBGRAPH}}

## 编辑规则

1. 只综合已提供的笔记和关系，不把常识写成课程事实。
2. 重要结论链接到相关课次 ID；必要时保留视频时间戳或文本定位。
3. 统一同义术语，但保留老师使用过的别名。
4. 明确区分硬先修、推荐顺序、扩展、应用、对照和替代方案。
5. 比较算法时必须说明输入条件、数据结构、复杂度和正确性条件的差异。
6. 不要按课次机械复述；围绕本章要解决的核心问题重组。
7. 指出定义或结论在后续课次中的扩展、修正或限制。
8. 若关系仍是 `provisional`，只能放入“待确认关系”，不得写成定论。

## 输出结构

输出 Markdown：

---

chapter_id: "{{CHAPTER_ID}}"
title: "{{CHAPTER_TITLE}}"
note_status: "draft"
prompt_version: "chapter-synthesis-v1"
generated_at: "{{GENERATED_AT}}"
---

# 第 {{CHAPTER_ID}} 章 {{CHAPTER_TITLE}}

## 本章解决什么问题

## 推荐学习顺序

说明每一步的学习目的，不只列编号。

## 核心概念图

用紧凑的文本树或 Mermaid 表示；只包含已确认关系。

## 题型与算法模板

## 关键对照

优先使用对照表。

## 常见错误

## 课次之间的递进关系

## 与其他章节的桥梁

## 章节复习清单

## 待确认关系与不确定项
