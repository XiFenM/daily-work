# 09-07 最终视频响应独立 QA

## 结论

**响应可接受，但 normalized 需要人工校准；已完成校准，无需重新调用模型。**

最终时间线、题面、0-1 背包转化、递推式、两份代码和扩展题列表与视频一致。主要修正项是题面 OCR 杂词、空间复杂度来源等级、约束页运算量的错误归纳，以及课程一维初始化的精确状态语义。

前两次响应均因结束时间边界不合格被拒绝；本报告只审核最终接受的 raw。

## 媒体核对

- 原片：1654.653968s，1920×1080，25fps。
- balanced：1654.666667s，1280×720，15fps。
- 时长差约 0.012699s。
- 人工检查既有联系表，并从原片提取 22 个定向帧、从压缩片提取 5 个对应帧。
- 题面、公式、约束页、记忆化代码、一维代码及 5 道扩展题标题均可辨认。
- balanced 片的关键代码 token、比较符号、循环方向和表格数字未因压缩丢失。

## 题面与建模

通过：

- LeetCode 416；
- 非空正整数数组；
- 示例 `[1,5,11,5] -> true`、`[1,2,3,5] -> false`；
- 目标容量 `C=sum/2`；
- 等和划分转为能否恰好填满 0-1 背包。

已修正题面中的 OCR 杂词 `fountain`。

## 状态与递推

画面直接写出：

```text
F(i,c) = F(i-1,c) || F(i-1,c-w(i))
```

normalized 已补全：

- 自顶向下缓存的 `[0...index]` 索引口径；
- `-1/0/1` 三态语义；
- `sum==0` 与失败基线；
- 自底向上一维数组的初始化转移；
- 容量倒序保持上一轮状态的不变量；
- 最终从 `memo[C]` 读取答案。

## 一维初始化的特殊性

屏幕代码为：

```cpp
memo[j] = (nums[0] == j);
```

因正整数前提，`memo[0]` 为 false。该数组不是通常的“任意子集可达”表，而是从包含首元素的子集开始扩张。

对本题最终判定仍正确：任何等分方案的两半中必有一半包含 `nums[0]`，且该半总和仍为 `C`。这一性质已通过穷举对拍验证，并写入 normalized 的状态不变量、正确性与 uncertainty。

复用为通用 subset-sum 时建议改为 `memo[0]=true`。

## 复杂度校准

画面直接写出：

```text
O(n * sum / 2) = O(n * sum)
```

因此时间复杂度保留 `course_direct`。

空间复杂度没有在画面中直接写出：

- 二维缓存 `O(n*C)=O(n*sum)`；
- 一维数组 `O(C)=O(sum)`。

两者均由分配尺寸可靠推得，已降为 `editorial_inference`；无来源分类的 solution/top-level 空间字段保持 null。

约束页同时展示 `n<=200` 与 `100*10000=100万`。模型曾错误写成 `200*10000=1,000,000`。normalized 已改为保留课程原始估算，并说明若同时代入上界应为 2,000,000，仍属百万级。

## 代码核对与验证

两份 normalized 核心类与最终画面逐 token 对齐。

严格构建：

```text
Apple clang 17
C++17
-Wall -Wextra -Wpedantic -Werror
-fsanitize=address,undefined
```

原码在 `int i < nums.size()` 处因符号性比较无法通过 `-Werror`。只加入 `-Wno-sign-compare` 后两份均编译成功，算法代码未修改。

每份通过 6 个代表性断言；另枚举长度 1...6、值域 1...5 的全部 19,530 个数组，与暴力子集枚举对拍。两份均 19,530/19,530 一致，ASan/UBSan 无报错。

因此两项 `verification` 均从 `not_run` 提升为 `tested`。工程复用时应把索引改为 `size_t` 或安全转换长度；视频原码保持不变。

## 扩展题范围

定向帧确认课程依次出现：

- 322 Coin Change；
- 377 Combination Sum IV；
- 474 Ones and Zeroes；
- 139 Word Break；
- 494 Target Sum。

本课只作题型/沟通拓展，没有逐题给出完整实现。笔记只按画面深度摘要，不补造代码。

## 关系校准

本课内容明显应用前一课的 0-1 背包空间压缩，但没有说出稳定课次 ID `09-06`。关系保持 `provisional/editorial_hypothesis`，等待双侧审核。

## 完成项

- raw SHA-256 保持 `982cea6d8fef18b756eb4ec5598f61e0d4d748e367eb0bf10173cdd518734d44`。
- normalized SHA-256：`fd350ffbf91c9221e07e6c26df6aff0faee63dadbca794f57b9aa152e36ad652`。
- canonical Schema：通过。
- evidence 引用与 code/state/solution 所属关系：通过。
- Prettier：通过。
- 详细笔记：`projects/algorithm-interview-course/notes/lessons/09-07.md`，reviewed。
