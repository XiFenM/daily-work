# 第十章媒体盘点与派生 QA

- 生成时间（UTC）：`2026-08-03T02:25:11Z`
- 范围：`10-01`～`10-03`
- 外部调用：无
- 原片处理：仅只读；压缩前后复算 SHA-256，三份原片哈希均未变化
- 派生预设：项目 `balanced`（最大 `1280×720`、最大 `15 fps`、H.264 High / CRF 26、AAC `64 kbps`、单声道、faststart）
- 联系表：每课按全片均匀采样 12 帧，`4×3` 排列，输出尺寸 `1920×810`

## 汇总结论

| 项目 | 结果 |
| --- | ---: |
| 原片总大小 | `271,251,763 B`（`258.686 MiB`） |
| balanced 总大小 | `39,835,075 B`（`37.990 MiB`） |
| 总体缩小 | `85.3144%` |
| 原片实测总时长 | `2,737.440000 s`（`00:45:37.440`） |
| 大纲标称总时长 | `2,729 s`（`00:45:29`） |
| 实测相对大纲 | `+8.440000 s` |
| balanced 实测总时长 | `2,737.466667 s` |
| balanced 相对原片总时长 | `+0.026667 s` |

三份 balanced 副本均小于 50 MB，均含可读 H.264 视频流与 AAC 音轨。直接 FFprobe 与项目自带 `pnpm media:probe` 的校验结果一致。

## 10-01 贪心基础 Assign Cookies

### 原片

- 路径：`work/algorithm-interview-course/incoming/10-1 贪心基础 Assign Cookies_慕课网.mp4`
- 大小：`70,420,069 B`（`67.158 MiB`）
- SHA-256：`da05d874197a77d960bfec11cb5caf029a700a33ccea51ca31053fd077d01ceb`
- 实测时长：`735.440000 s`；大纲 `732 s`，差值 `+3.440000 s`
- 视频：H.264 High，`1920×1080`，`25 fps`，`yuv420p`，16:9
- 音频：AAC-LC，`44.1 kHz`，双声道

### balanced 副本

- 路径：`work/algorithm-interview-course/compressed/10-01-balanced.mp4`
- 大小：`10,623,327 B`（`10.131 MiB`）；相对原片缩小 `84.9143%`
- SHA-256：`d88a55eb916ae6ba06e7f460fc3685ee0944c0e1179f0d6b6a5fc4bc0c451dc4`
- 实测时长：`735.466667 s`；相对原片 `+0.026667 s`
- 视频：H.264 High，`1280×720`，`15 fps`，`yuv420p`
- 音频：AAC-LC，`44.1 kHz`，单声道

### 画面与映射 QA

- 联系表：`work/algorithm-interview-course/qa/chapter10-review/10-01/contact-sheet-12.jpg`
- 12 帧清晰覆盖“简单贪心算法问题”、LeetCode 455 `Assign Cookies` 题面、按尺寸排序后的匹配演示、双数组指针代码，以及末尾 `Is Subsequence` 扩展题。
- 文件名、课程大纲与视频画面一致，确认映射为 `10-01`。
- 子任务执行者与 root 均已视觉复核通过。

## 10-02 贪心算法与动态规划的关系 Non-overlapping Intervals

### 原片

- 路径：`work/algorithm-interview-course/incoming/10-2 贪心算法与动态规划的关系 Non-overlapping Intervals_慕课网.mp4`
- 大小：`115,535,100 B`（`110.183 MiB`）
- SHA-256：`a3aa18d639c2c74a65234547509f229ab6640d0b08909fe2391bc8f1deb673a8`
- 实测时长：`1,078.680000 s`；大纲 `1,078 s`，差值 `+0.680000 s`
- 视频：H.264 High，`1920×1080`，`25 fps`，`yuv420p`，16:9
- 音频：AAC-LC，`44.1 kHz`，双声道

### balanced 副本

- 路径：`work/algorithm-interview-course/compressed/10-02-balanced.mp4`
- 大小：`18,137,840 B`（`17.298 MiB`）；相对原片缩小 `84.3010%`
- SHA-256：`fc2c8dbb38ce79eb563d8079db5022469e851fc14850be67a5220e5abd402c4a`
- 实测时长：`1,078.666667 s`；相对原片 `-0.013333 s`
- 视频：H.264 High，`1280×720`，`15 fps`，`yuv420p`
- 音频：AAC-LC，`44.1 kHz`，单声道

### 画面与映射 QA

- 联系表：`work/algorithm-interview-course/qa/chapter10-review/10-02/contact-sheet-12.jpg`
- 12 帧清晰覆盖 LeetCode 435 `Non-overlapping Intervals` 题面、暴力/动态规划提示、区间结构与比较器代码、最长不重叠区间序列状态，以及按结束时间排序的贪心实现。
- 文件名、课程大纲与视频画面一致，确认映射为 `10-02`。
- 子任务执行者与 root 均已视觉复核通过。

## 10-03 贪心选择性质的证明

### 原片

- 路径：`work/algorithm-interview-course/incoming/10-3 贪心选择性质的证明_慕课网.mp4`
- 大小：`85,296,594 B`（`81.345 MiB`）
- SHA-256：`98210ef085e150bf003ef1749e34c8e41a023e7d88b501666dc7ee89b81065fc`
- 实测时长：`923.320000 s`；大纲 `919 s`，差值 `+4.320000 s`
- 视频：H.264 High，`1920×1080`，`25 fps`，`yuv420p`，16:9
- 音频：AAC-LC，`44.1 kHz`，双声道

### balanced 副本

- 路径：`work/algorithm-interview-course/compressed/10-03-balanced.mp4`
- 大小：`11,073,908 B`（`10.561 MiB`）；相对原片缩小 `87.0172%`
- SHA-256：`9b79c79b8bfb992e07bfdf7f460d02545cf066de6112f58219f8eddd80310134`
- 实测时长：`923.333333 s`；相对原片 `+0.013333 s`
- 视频：H.264 High，`1280×720`，`15 fps`，`yuv420p`
- 音频：AAC-LC，`44.1 kHz`，单声道

### 画面与映射 QA

- 联系表：`work/algorithm-interview-course/qa/chapter10-review/10-03/contact-sheet-12.jpg`
- 12 帧清晰覆盖“贪心选择性质”、0-1 背包的单位价值贪心反例、无法构造反例后的反证/替换证明、最优解中替换首个选择而不损害后续选择的论证，以及最小生成树/最短路径扩展题。
- 本课明确回访第九章 `09-05` 的 0-1 背包，用作“局部单位价值最大并不保证全局最优”的反例；不要把这条回访错误归入 `10-02`。
- 文件名、课程大纲与视频画面一致，确认映射为 `10-03`。
- 子任务执行者与 root 均已视觉复核通过。

## 验证记录

- 原片 FFprobe：三份均为 MP4 容器、H.264 High 1080p/25fps、AAC-LC 44.1kHz 双声道。
- balanced FFprobe：三份均为 MP4 容器、H.264 High 720p/15fps、AAC-LC 44.1kHz 单声道。
- `pnpm media:probe`：三份 balanced 副本均通过；初次沙箱内运行因 `tsx` IPC 权限受限失败，按流程在获批的沙箱外本地校验后成功。
- 原片哈希在派生前后完全相同；未覆盖或改写原片。
- 未修改 `projects/algorithm-interview-course/` 下的 manifest、progress、catalog 或其他共享跟踪文件。
