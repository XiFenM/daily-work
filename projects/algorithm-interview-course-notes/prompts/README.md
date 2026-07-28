# Prompt 使用说明

所有模板都把大纲信息视为“定位上下文”，不能把标题扩写成视频事实。

## 占位符

- `{{course_title}}`：课程名称
- `{{chapter_id}}`、`{{chapter_title}}`：章节编号与名称
- `{{lesson_id}}`、`{{lesson_title}}`：节次编号与标题
- `{{declared_duration}}`：大纲时长；未知时写 `unknown`
- `{{actual_duration}}`：FFprobe 得到的实际时长
- `{{neighbor_outline}}`：前后相邻节次的 ID 和标题，只用于寻找候选联系
- `{{lesson_notes}}`：章节综合所需的已复核单节笔记
- `{{chapter_notes}}`：全课综合所需的已复核章节笔记

模板渲染后保存在项目内或 `work/algorithm-interview-course-notes/`，不要把密钥、base64 视频或私有浏览器状态写入 prompt。

## 调用顺序

1. `lesson-understanding.md`：每个视频独立调用一次。
2. `article-understanding.md`：每篇课程文章单独处理一次。
3. `lesson-review.md`：对原始内容、原始响应和单节笔记做复核；发现事实问题时回到原内容。
4. `chapter-synthesis.md`：本章所有单节笔记复核后调用。
5. `course-synthesis.md`：所有章节完成后调用。

关系候选只是一种检索线索。进入 `notes/knowledge-graph.json` 前，必须按 `inputs/relation-model.json` 验证证据。
