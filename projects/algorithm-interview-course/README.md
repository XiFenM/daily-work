# 算法面试视频课程归纳

本项目用于把 11 章、70 个课次的视频与配套文本整理为可追溯的详细笔记和跨课知识图谱。

## 入口

- [项目简报](brief.md)
- [完整课程目录](course-outline.md)
- [处理流程](workflow.md)
- [知识关系模型](knowledge-model.md)
- [笔记索引](notes/index.md)
- [处理进度](progress.json)
- [调用清单](manifest.json)
- [项目一致性校验脚本](scripts/validate-project.mjs)

## 数据边界

- `projects/algorithm-interview-course/`：提交 Prompt、正式笔记、结构化元数据和关系图。
- `work/algorithm-interview-course/`：放原始视频、文本、压缩副本和临时 Prompt；Git 忽略。
- `outputs/algorithm-interview-course/`：放原始模型输出和可再生成报告；Git 忽略。

## 当前状态

70 个课程素材已完成盘点与课次编号映射。第一至四章共 27 个视频已完成哈希、媒体探测、画面抽样、ZenMux 视频理解、正式单课笔记、章节综述、概念归并和关系校准。

- [第一章章节综述](notes/chapters/01.md)
- [第二章章节综述](notes/chapters/02.md)
- [第三章章节综述](notes/chapters/03.md)
- [第四章章节综述](notes/chapters/04.md)
- [第一章单课笔记入口](notes/index.md#第一章)
- [第二章单课笔记入口](notes/index.md#第二章)
- [第三章单课笔记入口](notes/index.md#第三章)
- [第四章单课笔记入口](notes/index.md#第四章)
- 已完成详细单课笔记 27/70、章节综述 4/11、视频理解 27/67。
- 第二章 7 节均取得 1 个通过本地门禁的结果；`02-04` 的首次生成被拒绝，结构化输出校准期间另有 5 次 HTTP 400 和 2 次网络失败。所有尝试、Prompt、输入输出、请求 ID、哈希与已知 token 用量见 [manifest.json](manifest.json)。
- 第三章 8 节均一次取得可用结果；本章启用 v1.4 证据结构，增加解法、代码和状态模型的双向引用，并把人工代码/OCR QA 设为正式笔记的强制门禁。
- 第四章 8 节均取得通过门禁的结果；共 11 次到达服务端的调用，其中 `04-02` 两次结构不合格、`04-08` 一次状态模型不合格，失败响应均留档且不参与综合。人工 QA 另校正了 `04-05` 的数量级换算和 `04-06` 的代码 OCR 漏行。
- 下一步按课程顺序处理第五章。

运行 `node projects/algorithm-interview-course/scripts/validate-project.mjs` 可检查课次、素材、证据、manifest、笔记、关系和概念引用是否一致。
