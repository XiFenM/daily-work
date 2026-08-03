# 10-02 本地视觉证据预审

- 课次：`10-02 贪心算法与动态规划的关系 Non-overlapping Intervals`
- 视频：`work/algorithm-interview-course/compressed/10-02-balanced.mp4`
- 实测时长：`1078.666667 s`（原片 `1078.680000 s`）
- 外部调用/素材上传：无
- 正式项目文件修改：无
- 证据方法：全片每 5 秒取 1 帧，共 `216` 帧；组成 `14` 张 `4×4` 联系表；另从原片取 `34` 张定点全分辨率帧。
- 证据目录：`dense-5s/`、`sheets-5s/`、`targeted/`

## 映射与题面

- 画面标题为 `435. Non-overlapping Intervals`，与大纲和文件名一致。
- 目标原始表述：给定一组区间，最少删除多少个区间，使剩余区间互不重叠。
- 随后把目标等价改写为：最多保留多少个互不重叠区间；最终答案均为 `n - 最多保留数`。
- 输入前提：每个区间满足 `start < end`。
- 端点语义是本课的关键边界：`[1,2]` 和 `[2,3]` 不算重叠；两份代码都用 `current.start >= previous.end`，因此端点相接可以同时保留。
- 题面示例：
  - `[[1,2],[2,3],[3,4],[1,3]] -> 1`
  - `[[1,2],[1,2],[1,2]] -> 2`

关键帧：`targeted/45s.jpg`（端点语义）、`targeted/130s.jpg`（两例）、`targeted/170s.jpg`（最大保留数改写）。

## 解法演进

1. 暴力：枚举所有子区间组合，再判断是否互不重叠；屏幕直接给出 `O((2^n) * n)`。
2. 动态规划：课程明确类比最长上升子序列；先排序，再求最长不重叠区间序列。
3. 贪心：关注“每次选择中，每个区间的结尾很重要”；结尾越早，给后续区间留下的空间越大。于是按结束时间排序，每次保留当前可选且结束最早的区间。

关键帧：`targeted/205s.jpg`（暴力与直接复杂度）、`targeted/300s.jpg`（LIS 类比）、`targeted/780s.jpg`（贪心规则）。

## 动态规划屏幕代码

### 排序比较器（逐 token）

```cpp
bool compare(const Interval &a, const Interval &b) {
  if (a.start != b.start)
    return a.start < b.start;
  return a.end < b.end;
}
```

即按 `start` 升序；`start` 相同时按 `end` 升序。证据见 `targeted/470s.jpg` 与 `targeted/715s.jpg` 上方代码。

### 状态、转移与答案

屏幕注释原文为：

```cpp
// memo[i]表示使用intervals[0...i]的区间能构成的最长不重叠区间序列
```

但按实际转移，`memo[i]` 的精确定义应是“以排序后 `intervals[i]` 结尾的最长不重叠区间序列长度”，而不只是前缀最优值。否则代码没有 `memo[i-1]` 的继承项。这个“注释表述较宽、代码语义更窄”的差异应在正式笔记中说明。

```cpp
vector<int> memo(intervals.size(), 1);
for (int i = 1; i < intervals.size(); i++)
  for (int j = 0; j < i; j++)
    if (intervals[i].start >= intervals[j].end)
      memo[i] = max(memo[i], 1 + memo[j]);

int res = 0;
for (int i = 0; i < memo.size(); i++)
  res = max(res, memo[i]);

return intervals.size() - res;
```

- 初值：每个单独区间均能构成长度 1 的序列。
- 转移：若 `i` 的起点不早于 `j` 的终点，则可以把 `i` 接在以 `j` 结尾的序列后。
- 汇总：`res = max_i memo[i]`；返回删除数 `n - res`。
- 空输入：函数开头直接 `return 0`，不会创建空 `memo` 后误读。
- 最完整屏幕证据：`targeted/715s.jpg`。

## 贪心屏幕代码

### 排序比较器（逐 token）

```cpp
bool compare(const Interval &a, const Interval &b) {
  if (a.end != b.end)
    return a.end < b.end;
  return a.start < b.start;
}
```

即按 `end` 升序；`end` 相同时按 `start` 升序。证据见 `targeted/830s.jpg`。

### 扫描状态与答案

```cpp
int res = 1;
int pre = 0;
for (int i = 1; i < intervals.size(); i++)
  if (intervals[i].start >= intervals[pre].end) {
    res++;
    pre = i;
  }

return intervals.size() - res;
```

- `res`：已保留的互不重叠区间数。
- `pre`：上一个被保留区间在结束时间排序结果中的下标。
- 接纳条件仍是 `>=`，与题面的端点相接语义一致。
- 空输入同样先 `return 0`，因此 `res = 1` 与 `pre = 0` 只在非空输入上执行。
- 最完整屏幕证据：`targeted/1020s.jpg`。

## 复杂度直接性

- 暴力 `O((2^n) * n)` 是屏幕直接证据。
- 画面没有直接展示 DP/贪心的最终复杂度文字；以下为对屏幕代码的编辑性推导，正式笔记必须标成推导而不是讲师原话：
  - DP：排序 `O(n log n)`，双层转移 `O(n^2)`，最终 `O(n^2)` 时间、`O(n)` DP 数组空间。
  - 贪心：排序 `O(n log n)`，线性扫描 `O(n)`，最终 `O(n log n)` 时间；扫描变量为 `O(1)`，若计入标准库排序内部栈则实现相关。

## 代码可移植性与边界

- 屏幕文件顶部只可见 `#include <iostream>` 与 `#include <vector>`，但代码使用 `sort` 和 `max`；标准 C++ 应显式补 `#include <algorithm>`。测试外壳只增加了这个必需头文件，没有改变核心算法 token。
- 两份代码都混用 `int` 下标/结果与 `vector::size_type`，严格告警下有 signed/unsigned 比较和 `size_t -> int` 收窄告警；在题目通常规模内不影响结果，但属于值得记录的工程性风险。
- 相同起点、相同终点、重复区间、负坐标、端点相接、嵌套区间与空输入均已纳入本地测试。

## 本地验证结论

- 两份屏幕实现均通过 9 组代表用例。
- 对端点集合 `{-2,-1,0,1,2}` 形成的 10 种合法区间，穷举所有长度 `0..5` 的有序区间列表（允许重复），共 `111111` 例；以子集枚举为 oracle，DP 与 greedy 全部一致。
- AddressSanitizer + UndefinedBehaviorSanitizer：通过。
- 严格告警：屏幕算法代码相关 `15` 条（DP `10`、greedy `5`），均为 signed/unsigned 或 `size_t -> int` 收窄；另有 oracle 自身 2 条索引转换告警。
- 测试外壳：`test-harness.cpp`，SHA-256 `c88284517a9084b0ded52e2fba0e4b9ec7b6db457e305c13ac9e2dc023bc6327`。
- 详细测试记录：`test-report.md`。
