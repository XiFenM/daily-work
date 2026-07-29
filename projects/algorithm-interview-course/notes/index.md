# 算法面试课程笔记

## 当前状态

课程全部素材已盘点并与 70 个课次完成编号映射；第一至三章已经完成视频理解、正式笔记、章节综述和关系校准。

- 课程规模：11 章、70 个课次
- 素材：67 个视频、3 个 Markdown 文本，另有 1 个已忽略的 `.DS_Store`
- 课次映射：70/70
- 已完成详细单课笔记：19/70
- 已完成章节综述：3/11
- 已完成视频理解：19/67
- 第一章实测时长：1:05:54.88
- 第二章实测时长：1:47:08.537
- 第三章实测时长：2:08:20.520

## 第一章

- [章节综述：算法面试到底是什么鬼？](chapters/01.md)
- [01-01 算法面试不仅仅是正确的回答问题](lessons/01-01.md)
- [01-02 算法面试只是面试的一部分](lessons/01-02.md)
- [01-03 如何准备算法面试](lessons/01-03.md)
- [01-04 如何回答算法面试问题](lessons/01-04.md)

第一章的统一解题闭环是：

`条件 → 用例 → 暴力基线 → 规模判断 → 瓶颈 → 优化 → 实现 → 验证`

## 第二章

- [章节综述：面试中的复杂度分析](chapters/02.md)
- [02-01 究竟什么是大 O（Big O）](lessons/02-01.md)
- [02-02 对数据规模有一个概念](lessons/02-02.md)
- [02-03 简单的复杂度分析](lessons/02-03.md)
- [02-04 亲自试验自己算法的时间复杂度](lessons/02-04.md)
- [02-05 递归算法的复杂度分析](lessons/02-05.md)
- [02-06 均摊时间复杂度分析（Amortized Time Analysis）](lessons/02-06.md)
- [02-07 避免复杂度的震荡](lessons/02-07.md)

第二章的统一分析闭环是：

`定义规模 → 选基本操作 → 计数 → 化简 → 声明情形 → 补空间 → 核对规模 → 必要时实测`

## 第三章

- [章节综述：数组中的问题其实最常见](chapters/03.md)
- [03-01 从二分查找法看如何写出正确的程序](lessons/03-01.md)
- [03-02 改变变量定义，依然可以写出正确的算法](lessons/03-02.md)
- [03-03 在 LeetCode 上解决第一个问题 Move Zeros](lessons/03-03.md)
- [03-04 即使简单的问题，也有很多优化的思路](lessons/03-04.md)
- [03-05 三路快排 partition 思路的应用 Sort Color](lessons/03-05.md)
- [03-06 对撞指针 Two Sum II - Input Array is Sorted](lessons/03-06.md)
- [03-07 滑动窗口 Minimum Size Subarray Sum](lessons/03-07.md)
- [03-08 在滑动窗口中做记录 Longest Substring Without Repeating Characters](lessons/03-08.md)

第三章的统一解题主线是：

`定义变量/区间语义 → 写出状态不变量 → 从暴力基线识别重复工作 → 用 partition、双指针或滑动窗口缩小未知区域 → 维护答案与边界`

## 导航

- [课程目录](../course-outline.md)
- [处理流程](../workflow.md)
- [关系图数据](relationships.json)
- [概念词表](concepts.json)
- [单课笔记模板](lessons/_template.md)
- [章节综述模板](chapters/_template.md)
- [当前视频证据 Prompt](../prompts/video-evidence-v1.4.template.md)
- [生成与调用清单](../manifest.json)
- [处理进度](../progress.json)
