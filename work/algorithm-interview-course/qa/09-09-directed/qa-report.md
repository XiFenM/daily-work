# 09-09 最终视频响应独立 QA

## 结论

**最终响应可作为时间线与画面事实底稿，但需要补足状态模型并收紧术语/算法边界；已完成。**

LCS、Dijkstra 方程、LIS 重构、背包重构和课程结尾均与原片一致。主要校准项是 LCS 基线、英文术语、Dijkstra 分类边界、一维空间压缩的适用条件，以及空缺的三个状态模型。

第一次响应因结束时间边界不合格被拒绝；本报告只审核最终接受 raw。

## 媒体核对

- 原片：1264.767710s，1920×1080，25fps。
- balanced：1264.767710s，1280×720，15fps。
- 时长完全一致。
- 从原片提取 35 个定向帧，从 balanced 提取 8 个对应帧。
- LCS 定义/公式/递归树、Dijkstra 页面、LIS 数组与背包二维表/红色追溯箭头均可清楚核对。

## LCS 术语

画面中文标题“最长公共子序列”正确；英文副标题写作 `Longest Common Sequence (LCS)`。标准术语是 `Longest Common Subsequence`。

normalized 保留 `Sequence` 作为 observed name，同时在 canonical definition 和笔记中使用标准术语，并明确不是 Longest Common Substring。

## LCS 状态与公式

画面直接定义：

```text
LCS(m,n) = S1[0...m] 与 S2[0...n] 的最长公共子序列长度
```

并给相等/不等两分支。画面没有写空前缀基线，原始 `complete` 不合适。已改为 `partial`，新增 `state-001`：

- 二维前缀区域；
- 相等走对角并加 1；
- 不等删除一个末字符取最大；
- `m<0 || n<0 -> 0` 编辑基线；
- 状态只保存长度、不自动保存具体序列的不变量。

示例 `ABCD` 与 `AEBD` 的递归树得到长度 3，一条具体 LCS 为 `ABD`。

## Dijkstra 表述边界

课程页标题直接写“dijkstra 单源最短路径算法也是动态规划”，并给：

```text
shortestPath(x) = min(shortestPath(a) + w(a->x))
```

该页展示最短路最优性关系，但没有给：

- 源点基线；
- 候选前驱集合；
- 非负边权前提；
- 松弛；
- 贪心定点顺序；
- 完整实现。

因此 formula-002 改为 `partial`。normalized 和笔记保留“课程从 DP 视角联系”的事实，同时明确标准 Dijkstra 依赖非负边权，执行策略通常归入贪心；不把幻灯片标题扩写成无争议算法分类。

## LIS 具体解重构

画面复用：

```text
nums = [10,9,2,5,3,7,101,18]
memo = [1,1,1,2,2,3,4,4]
```

并演示得到 `[2,3,7,101]`。新增 `state-002`，形式化前驱条件：

```text
j < cursor
nums[j] < nums[cursor]
memo[j] = memo[cursor] - 1
```

同时记录多解和平局边界。

## 0-1 背包具体解重构

画面表格为重量 `[1,2,3]`、价值 `[6,10,12]`、容量 5，最终值 22；红色箭头对应选择编号 1、2。

新增 `state-003`：

- 二维 DP 格语义；
- 不选时向上一行同容量移动；
- 选择时记录物品并扣除重量；
- 平局可选任一保持最优值的分支；
- 越过首行或容量归零时终止。

## 一维空间优化的限定

课程强调一维压缩后不能反向重构。该结论已收紧为：只保留一维**值数组**且不保存额外轨迹时，不能沿原二维历史直接回溯。

若另存父指针/决策、做第二遍重算或保存检查点，仍可能兼顾较小值空间与方案输出。因此不能写成所有一维方案理论上绝对无法输出解。

## 代码与复杂度

本课没有完整代码：

- LCS 三种实现均留作练习；
- Dijkstra 只给状态/方程；
- LIS/背包只演示表/数组追溯。

因此 codeArtifacts 保持空，验证不适用；顶层 complexity 与 complexityAnalyses 保持空/null。

笔记中标准 LCS 记忆化/二维 DP `O(MN)` 只作 editorial inference，明确实现假设，不写回课程直接事实。

## 关系校准

本课内容直接复用 LIS 与背包，但没有说稳定课次 ID。拆为两条候选：

- `09-08 -> 09-09`：LIS 状态数组到具体序列；
- `09-07 -> 09-09`：背包二维表到具体物品与空间压缩取舍。

均保持 `provisional/editorial_hypothesis`，待共享图双侧审核。

## 完成项

- raw SHA-256 保持 `aac496e02dd8dcb0fc686e3f64c5a0d14cf6258a115058aea68a5b8a48b2c9f6`。
- normalized SHA-256：`ee819be485315f63c671108b73ce3587fb062273c718bc2f7360663b6cf33c1e`。
- canonical Schema：通过。
- evidence 引用与 state 所属关系：通过。
- Prettier：通过。
- 详细笔记：`projects/algorithm-interview-course/notes/lessons/09-09.md`，reviewed。
