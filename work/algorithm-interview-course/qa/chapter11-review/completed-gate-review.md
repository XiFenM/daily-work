# `project.status === completed` 完成态门禁只读审查

- 审查对象：`projects/algorithm-interview-course/scripts/validate-project.mjs`
- 审查方式：静态代码审查 + `/private/tmp/algorithm-completed-gate-review.*` 中的隔离项目副本反例测试
- 外部调用：无
- 写入边界：未修改校验脚本、project、progress、manifest、catalog、outline、笔记或其他被 Git 跟踪的文件
- 当前正向结论：现有完成态项目 **PASS**，不会误判当前 `70` 课、`67` 视频、`3` 文本、`70` 份 normalized、`70` 份单课笔记、`11` 份章综述和课程总综述
- 剩余结论：初检与复测发现的所有阻塞漏洞均已由父任务并行修复，并由本报告在隔离副本中复验关闭；当前没有剩余阻塞项

## 版本与基线

初始完成态门禁快照：

```text
SHA-256  3a336d19f898c4b3e2f6acfcc3b9cc2b394ea6fdcd3c48b9115af7f22fafd520
bytes     21,438
```

父任务修补并完成 accepted-attempt 复验后的快照：

```text
SHA-256  8b974873ebd62c5f28778f93230a46fed45c4d34dad264125eac7eb65df6fb5d
```

当前真实项目正向执行结果：

```text
status=ok
lessons=70
catalogedAssets=70
normalizedLessons=70
manifestAttempts=81
manifestGenerations=78
acceptedAttempts=63
rejectedAttempts=11
transportFailures=7
completedLessonNotes=70
chapterNotes=11
verifiedRelationshipEdges=96
concepts=150
```

4 个早期视频 `01-01`～`01-04` 是没有 attempt 记录的 legacy generation；其余 `63` 个视频课都有 accepted attempt。修补版只允许这 4 个 legacy 视频缺少 `acceptedAttemptId`，不会因此误伤现有数据。

## Findings

### P1：允许把真实 MP4 视频在 catalog 中改标为 text，并同步降低 67/3 计数：已关闭

第一次修补已经限制 `asset.kind` 只能为 `video | text`，但当时媒介类型的唯一权威仍是可同时修改的 catalog，尚未把 kind 与资产路径、`media` 元数据或项目固定预期拆分交叉核对。

隔离反例：

1. 把 `asset:video-11-01.kind` 从 `video` 改为合法枚举 `text`，但保留真实 `.mp4` 路径和视频媒体元数据；
2. 把 11-01 progress 改为 text 状态：media/video evidence 为 `not-applicable`，text evidence 为 `completed`；
3. 把 summary 的 video/text/probed 从 `67/3/67` 同步改为 `66/4/66`。

第一次修补仍返回 `status=ok`。因此当时：

- 当前真实 `67/3` 正向不会被误判；
- 但门禁不能阻止 catalog 与 summary 一起漂移成 `66/4`；
- 一个有正式视频请求、MP4 路径和视频元数据的课可以被降级成 text，从而跳过媒体探测和 manifest request 门禁。

最终修补对 catalog kind 加入项目级结构约束：

- video 必须使用 `asset:video-`、MP4 路径/原始文件名，包含有效 `media.durationSeconds`，并且不属于 unknown-duration lesson；
- text 必须使用 `asset:text-`、Markdown 路径/原始文件名，不得携带 `media`，并且必须属于 outline 的 unknown-duration lesson 集合。

将 11-01 从 video 改为 text、同步 progress/summary 后的同一反例现在失败：

```text
Completed project text asset asset:video-11-01 has inconsistent media metadata.
```

当前 `67 video / 3 text` 的正向与反向校验都已覆盖，本项关闭。

## 初检漏洞与修补闭环

### 1. 章综述只计数，不核对章 ID：已关闭

初始反例将 `notes/chapters/11.md` 改名为 `99.md`，总数仍为 11，旧门禁错误 PASS。

修补版建立 outline chapter ID 集合并与章文件名精确比对，同时逐章读取、要求非空且 `note_status: reviewed`。该漏洞已关闭。

### 2. lesson/chapter/course-synthesis 只检查存在：已关闭

初始反例把 `11-01.md` 或 `course-synthesis.md` 清空为 `0 B`，旧门禁错误 PASS。

修补版要求：

- 每份单课笔记和章综述可读、trim 后至少 `1000` 字符、状态为 reviewed；
- course synthesis 可读、至少 `1000` 字符、状态为 reviewed，并包含预期的 10 个一级编号节。

修补后 0 B 的 11-01 笔记明确失败：

```text
Completed lesson 11-01 note is unexpectedly empty.
Completed lesson 11-01 note is not marked reviewed.
```

当前最短单课笔记约 `7,497` 字符、最短章综述约 `9,883` 字符、课程总综述约 `35,820` 字符，`1000` 字符阈值不会误伤现有文件。

### 3. outline assetRefs 与 catalog 映射未双向对账：已关闭

初始门禁只统计 catalog 中每课被引用一次，以下反例都曾错误 PASS：

- 11-01 outline `assetRefs` 改指 10-03；
- asset 10-03 同时映射 10-03 和 11-01，asset 11-01 变为 orphan；每课表面计数仍可伪装为 1。

修补版现在要求：

- catalog 资产数等于课次数；
- 每个 asset 只映射一个 lesson；
- 每个 lesson 只映射一个 asset；
- outline `assetRefs` 与 catalog `lessonIds` 双向一致；
- kind 限于 video/text。

shared + orphan 反例现已失败，并同时报告多映射、孤儿资产和反向引用错误。

### 4. manifest request 只做全局 Set membership：已关闭

初始门禁只检查 normalized provenance request ID 是否出现在任意 generation 中。隔离反例交换 10-03 与 11-01 的 normalized output 路径，并交换两份 normalized 的 provenance request ID，旧门禁错误 PASS。

修补版现在把视频课同时绑定到：

- 当前 normalized 的精确输出路径；
- 当前 catalog 源资产路径必须出现在 generation inputs；
- generation lessonId 若存在则必须等于当前课；
- outcome/eligible 若存在则必须为 accepted/true；
- 对有 attempt 的课，progress acceptedAttemptId、attempt、generation、request ID 和 lesson ID 必须形成同一链。

请求交换反例现已失败，10-03 和 11-01 均报告 manifest request 与 accepted attempt 绑定错误。

### 5. 删除现代课 acceptedAttemptId 可绕过：已关闭

第一次修补只在 `acceptedAttemptId` “若存在”时验证。删除现代 11-01 的该字段后曾错误 PASS。

最终修补改为：只要该课在 manifest 中有 attempt 记录，就必须存在字符串类型的 acceptedAttemptId 并精确绑定；仅无 attempt 的 legacy 视频允许缺省。删除 11-01 acceptedAttemptId 现已失败：

```text
Completed video lesson 11-01 has attempts but no acceptedAttemptId.
Completed video lesson 11-01 accepted attempt is not bound to its manifest generation.
```

## 覆盖矩阵

| 要求 | 正向结果 | 反例结果 | 当前判断 |
| --- | --- | --- | --- |
| 70 个 outline/progress lesson ID 精确一致 | PASS | 缺/多 progress lesson 会失败 | 已覆盖 |
| 70 份 normalized | PASS | 移除 11-01 normalized 会失败并报告 manifest、证据和计数错误 | 已覆盖 |
| 70 份正式单课笔记 | PASS | 缺文件或 0 B 文件会失败 | 已覆盖 |
| 11 份章综述 | PASS | 缺章、错误章 ID、空章会失败 | 已覆盖 |
| `notes/course-synthesis.md` | PASS | 缺失、空文件、非 reviewed、缺结构节会失败 | 已覆盖 |
| 每课一一素材映射 | PASS | 0 映射、多映射、orphan、outline/catalog 不互指均失败 | 已覆盖 |
| video 工作流状态 | 67 课 PASS | media/video/text 状态错会失败 | 已覆盖 |
| text 工作流状态 | 3 课 PASS | 06-08 text 状态错会失败 | 已覆盖 |
| common lesson 状态 | 70 课 PASS | source/note/relation/qa 未完成会失败 | 已覆盖 |
| manifest request 存在 | 67 视频 PASS | request null/未知会失败 | 已覆盖 |
| manifest request 属于当前课/资产 | PASS | 10-03/11-01 交换会失败 | 已覆盖 |
| modern acceptedAttemptId | 63 课 PASS | 删除或跨课引用会失败 | 已覆盖 |
| legacy 无 attempt | 4 课 PASS | 通过 source input + normalized output + provenance request 绑定 | 已兼容 |
| 固定 `67 video / 3 text` 防漂移 | 当前正向 PASS | 自洽改成 `66/4` 会因资产 ID、扩展名、媒体元数据和 unknown-duration 规则失败 | 已覆盖 |

## 初始门禁原本已能正确拦截的情况

以下并非修补后才具备；初始新增门禁已经正确失败：

- 缺少 11-01 单课笔记；
- 缺少 11 章文件；
- 缺少 course-synthesis；
- 缺少 normalized；
- 某课 catalog 映射数为 0；
- video 或 text evidence 状态不一致；
- normalized provenance request ID 为 null；
- progress summary 与实际 70/11/96 等计数不一致。

## 最终建议

修补版已经从“完成数量核对”提升为对关键对象身份、素材双向映射、媒介分类、工作流状态、正式文稿状态和 manifest 请求链的完整交叉验证。当前真实项目正向通过，4 个 legacy 视频请求没有被误伤；所有构造的关键反例均被拦截。就本次指定范围而言，完成态门禁可以通过审查，没有剩余阻塞项。
