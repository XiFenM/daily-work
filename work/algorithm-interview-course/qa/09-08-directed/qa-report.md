# 09-08 最终视频响应独立 QA

## 结论

**响应主体可接受；经公式、复杂度和代码验证校准后可进入最终笔记。**

题面、暴力复杂度、`LIS(i)` 状态、两组数组演示、完整 C++ 核心类、`O(n log n)` 拓展标题和 Wiggle 练习均与视频一致。

## 媒体核对

- 原片：1512.083447s，1920×1080，25fps。
- balanced：1512.083447s，1280×720，15fps。
- 时长完全一致。
- 从原片提取 23 个定向帧，从 balanced 提取 7 个对应帧。
- 状态公式、数组数字、反例、代码比较符号与循环边界在压缩片中均清晰可读。

## 题面与状态

通过：

- 子序列不要求连续；
- 严格上升；
- 最长具体序列可有多个，长度唯一；
- `LIS(i)` 表示以 `nums[i]` 结尾的最长上升子序列长度。

normalized 已补入外层循环不变量：完成 `i` 后，`memo[0...i]` 分别是对应末端的精确最优长度。

## 公式完整性

画面写出：

```text
LIS(i) = max_{j<i}(1 + LIS(j) if nums[i] > nums[j])
```

公式未显式覆盖“没有合法前驱”的情况。代码和手算表用 `memo` 全 1 初始化补齐 `LIS(i)>=1`。

因此 `formula-001.completeness` 从 `complete` 改为 `partial`；笔记使用完整编辑归一化公式：

```text
LIS(i) = max(1, max_{j<i, nums[j]<nums[i]}(1+LIS(j)))
```

## 反例与结果提取

定向画面确认：

```text
nums = [10,15,20,11,9,101]
memo = [1,2,3,2,1,4]
```

它直接否定 memo 单调假设，也说明不能找到第一个较小元素就停止。最终答案必须是全表最大值，不能只返回 `memo[n-1]`。

## 复杂度校准

现有 evidence observation 明确记录课程指出 `O(n^2)` 时间，保留 `course_direct`。

`O(n)` 空间只可由长度为 n 的 memo 数组推得；没有直接口述/画面文字定位，已改为 `editorial_inference`，top-level 与 solution 空间字段保持 null。

`O(n log n)` 只有标题与方向说明，没有代码、证明或重构，保持 alternative/课程范围提示。

## 代码核对与验证

视频 include 区被折叠；测试翻译单元补入最小 `<algorithm>`、`<vector>`、断言与输出头文件，核心类不改。

严格 `-Werror` 在两个 `int i < nums.size()` 处报告符号性比较；抑制这一单项告警后，在 Apple clang 17、C++17、ASan/UBSan 下通过。

代表性测试 7 个：空数组、课程主例、另一标准混合例、全相等、严格递减、负数上升、课程反例。

另枚举长度 0...7、值域 -2...2 的全部 97,656 个数组，与暴力枚举所有子序列对拍；97,656/97,656 一致，sanitizer 无报错。

`code-001.verification` 从 `not_run` 提升为 `tested`。

## 关系校准

`09-08 -> 09-09` 的课程内稳定 ID 没有直接口述；ev-007 只谈 `O(n log n)`，不能支撑 LCS 预告。关系证据改回 LIS 状态本身并保持 `provisional/editorial_hypothesis`，由 09-09 的 LIS 重构内容提供双侧支持。

## 完成项

- raw SHA-256 保持 `e3c86bc6a87a8e5113bbaf62ff4fed293023944ec488b55a12791212ec2101ff`。
- normalized SHA-256：`9a7548bc89c43b8aa16c23b654112be59ff21678ad907f4f7007ec967857e02d`。
- canonical Schema：通过。
- evidence 引用与 state/code/solution 所属关系：通过。
- Prettier：通过。
- 详细笔记：`projects/algorithm-interview-course/notes/lessons/09-08.md`，reviewed。
