# 算法面试课程笔记

## 当前状态

课程全部素材已盘点并与 70 个课次完成编号映射；第一至十章已经完成证据抽取、正式笔记、章节综述和关系校准。

- 课程规模：11 章、70 个课次
- 素材：67 个视频、3 个 Markdown 文本，另有 1 个已忽略的 `.DS_Store`
- 课次映射：70/70
- 已完成详细单课笔记：69/70
- 已完成章节综述：10/11
- 已完成视频理解：66/67
- 已完成文本证据：3/3
- 第一章实测时长：1:05:54.88
- 第二章实测时长：1:47:08.537
- 第三章实测时长：2:08:20.520
- 第四章实测时长：1:50:43.927
- 第五章实测时长：1:27:17.480
- 第六章视频实测时长：1:50:28.165261
- 第七章视频实测时长：1:22:50.921088
- 第八章视频实测时长：2:36:02.322086
- 第九章视频实测时长：3:33:51.545125
- 第十章视频实测时长：0:45:37.440

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

## 第四章

- [章节综述：查找表相关问题](chapters/04.md)
- [04-01 set 的使用 Intersection of Two Arrays](lessons/04-01.md)
- [04-02 map 的使用 Intersection of Two Arrays II](lessons/04-02.md)
- [04-03 set 和 map 不同底层实现的区别](lessons/04-03.md)
- [04-04 使用查找表的经典问题 Two Sum](lessons/04-04.md)
- [04-05 灵活选择键值 4Sum II](lessons/04-05.md)
- [04-06 灵活选择键值 Number of Boomerangs](lessons/04-06.md)
- [04-07 查找表和滑动窗口 Contain Duplicate II](lessons/04-07.md)
- [04-08 二分搜索树底层实现的顺序性 Contain Duplicate III](lessons/04-08.md)

第四章的统一解题主线是：

`写出查询谓词 → 选择 key/value → 明确查找表所代表的输入范围 → 决定 query/insert/erase 顺序 → 根据精确查询或范围查询选择无序/有序结构 → 声明复杂度成本假设`

## 第五章

- [章节综述：在链表中穿针引线](chapters/05.md)
- [05-01 链表，在节点间穿针引线 Reverse Linked List](lessons/05-01.md)
- [05-02 测试你的链表程序](lessons/05-02.md)
- [05-03 设立链表的虚拟头结点 Remove Linked List Elements](lessons/05-03.md)
- [05-04 复杂的穿针引线 Swap Nodes in Pairs](lessons/05-04.md)
- [05-05 不仅仅是穿针引线 Delete Node in a Linked List](lessons/05-05.md)
- [05-06 链表与双指针 Remove Nth Node Form End of List](lessons/05-06.md)

第五章的统一解题主线是：

`定义指针语义 → 画出局部结构 → 覆盖边之前保存后继入口 → 按依赖顺序重连 → 推进状态 → 验证头/尾/空链表边界 → 构造、打印、释放并测试`

## 第六章

- [章节综述：栈，队列，优先队列](chapters/06.md)
- [06-01 栈的基础应用 Valid Parentheses](lessons/06-01.md)
- [06-02 栈和递归的紧密关系 Binary Tree Preorder, Inorder and Postorder Traversal](lessons/06-02.md)
- [06-03 运用栈模拟递归](lessons/06-03.md)
- [06-04 队列的典型应用 Binary Tree Level Order Traversal](lessons/06-04.md)
- [06-05 BFS 和图的最短路径 Perfect Squares](lessons/06-05.md)
- [06-06 优先队列](lessons/06-06.md)
- [06-07 优先队列相关的算法问题 Top K Frequent Elements](lessons/06-07.md)
- [06-08 两种关于 Top K 问题求解思路的套路](lessons/06-08.md)

第六章的统一解题主线是：

`先定义“待处理对象”的优先顺序 → 选择栈、FIFO 队列或优先队列 → 明确容器中每个元素的状态语义 → 按 LIFO、分层或堆顶边界推进 → 对图状态去重 → 用复杂度和输入契约选择 Top K 策略`

## 第七章

- [章节综述：二叉树和递归](chapters/07.md)
- [07-01 二叉树天然的递归结构](lessons/07-01.md)
- [07-02 一个简单的二叉树问题引发的血案 Invert Binary Tree](lessons/07-02.md)
- [07-03 不会翻转二叉树的大神](lessons/07-03.md)
- [07-04 注意递归的终止条件 Path Sum](lessons/07-04.md)
- [07-05 定义递归问题 Binary Tree Paths](lessons/07-05.md)
- [07-06 稍复杂的递归逻辑 Path Sum III](lessons/07-06.md)
- [07-07 二分搜索树中的问题 Lowest Common Ancestor of a Binary Search Tree](lessons/07-07.md)

第七章的统一解题主线是：

`定义递归函数的输入与返回语义 → 写清空节点或叶子节点终止条件 → 把当前树拆成左右子树问题 → 组合返回值或原地修改结果 → 用反例检查路径边界 → 必要时利用 BST 顺序性排除整棵子树`

## 第八章

- [章节综述：递归和回溯法](chapters/08.md)
- [08-01 树形问题 Letter Combinations of a Phone Number](lessons/08-01.md)
- [08-02 什么是回溯](lessons/08-02.md)
- [08-03 排列问题 Permutations](lessons/08-03.md)
- [08-04 组合问题 Combinations](lessons/08-04.md)
- [08-05 回溯法解决组合问题的优化](lessons/08-05.md)
- [08-06 二维平面上的回溯法 Word Search](lessons/08-06.md)
- [08-07 flood fill 算法，一类经典问题 Number of Islands](lessons/08-07.md)
- [08-08 回溯法是经典人工智能的基础 N Queens](lessons/08-08.md)

第八章的统一解题主线是：

`定义递归契约、部分解与候选域 → 判断完整解 → 选择并更新约束状态 → 递归探索 → 按状态生命周期撤销或永久保留 → 用覆盖性与剪枝安全性证明正确`

## 第九章

- [章节综述：动态规划基础](chapters/09.md)
- [09-01 什么是动态规划](lessons/09-01.md)
- [09-02 第一个动态规划问题 Climbing Stairs](lessons/09-02.md)
- [09-03 发现重叠子问题 Integer Break](lessons/09-03.md)
- [09-04 状态的定义和状态转移 House Robber](lessons/09-04.md)
- [09-05 0-1 背包问题](lessons/09-05.md)
- [09-06 0-1 背包问题的优化和变种](lessons/09-06.md)
- [09-07 面试中的 0-1 背包问题 Partition Equal Subset Sum](lessons/09-07.md)
- [09-08 LIS 问题 Longest Increasing Subsequence](lessons/09-08.md)
- [09-09 LCS，最短路，求动态规划的具体解以及更多](lessons/09-09.md)
- [09-10 动态规划的经典问题](lessons/09-10.md)

第九章的统一解题主线是：

`定义子问题与状态语义 → 写出转移和边界 → 识别重叠子问题与最优子结构 → 选择记忆化或自底向上顺序 → 在不破坏依赖的前提下压缩空间 → 记录决策以恢复具体解 → 用状态数 × 单状态转移成本分析复杂度`

## 第十章

- [章节综述：贪心算法](chapters/10.md)
- [10-01 贪心基础 Assign Cookies](lessons/10-01.md)
- [10-02 贪心算法与动态规划的关系 Non-overlapping Intervals](lessons/10-02.md)
- [10-03 贪心选择性质的证明](lessons/10-03.md)

第十章的统一解题主线是：

`明确目标与可行性 → 提出局部选择规则 → 主动寻找最小反例 → 定义排序与扫描状态 → 用交换论证证明一次选择安全 → 证明剩余问题闭包 → 重复选择并核对端点、复杂度与工程契约`

## 导航

- [课程目录](../course-outline.md)
- [处理流程](../workflow.md)
- [关系图数据](relationships.json)
- [概念词表](concepts.json)
- [单课笔记模板](lessons/_template.md)
- [章节综述模板](chapters/_template.md)
- [当前视频证据 Prompt](../prompts/video-evidence-v1.7.template.md)
- [生成与调用清单](../manifest.json)
- [处理进度](../progress.json)
