# 09-05 首次视频响应独立 QA

## 结论

建议：**响应可接受，但 normalized 不能原样定稿；无需重新调用模型，完成下列局部证据校正即可。**

主体时间线、题面、贪心反例、状态定义、递推式、记忆化代码、二维表初始化与循环均与原片一致。主要问题是若干模型推导被写成了 `course_direct`，以及一处复杂度观察文本有重复 `O(`。

## 人工校准完成情况

以下校准已经落实到 normalized，raw 与 API response 保持不变：

- 题面证据补入 `ev-003`，明确“每件物品放或不放”的来源；
- 暴力空间复杂度清空，`ev-003` 的重复 `O(` 已修正；
- top-down 与 bottom-up 的 solution 复杂度均清空；
- DP 时间/空间分别按两种实现保留为 `editorial_inference` 分析；
- 递归深度限制从 solution 直接内容中移除；
- bottom-up 的 stage 从 `optimized` 改为 `alternative`；
- `state-001` 只描述 top-down memo，新增 `state-002` 描述 bottom-up table；
- correctness 的“选/不选覆盖完整性”降为编辑归纳；
- 两条相邻课关系均降为 `provisional/editorial_hypothesis`；
- 两段代码保持 `tested`。

最终 normalized SHA-256：`91dfc2d78cab7c139b36e01eb56f3e1d60f3d72deafd146136ad74de283eed17`。

最终结果已通过 canonical Schema、全部 evidence 引用、code/state/solution 所属关系、复杂度直接性门禁与 Prettier 检查，可接受进入后续笔记阶段。

## 媒体核对

- 原片：`1957.920000s`，1920×1080，25fps，AAC 双声道。
- balanced：`1957.933333s`，1280×720，15fps，AAC 单声道。
- 时长差：约 `0.013333s`。
- 已检查既有 12 帧联系表。
- 已从原片提取 24 个定向帧，并在 70、190、300、590、1080、1600、1940 秒核对压缩片对应帧。
- 题面、公式、表格数字及关键代码 token 在压缩片中均清晰可读。

## 逐项核对

### 题面

通过。70 秒画面直接展示：容量 `C`，`n` 种不同物品，编号 `0...n-1`，重量 `w(i)`、价值 `v(i)`，在不超过容量的前提下最大化总价值。

需校正：`problem.constraints` 中“每件物品最多选择一次（放或不放）”目前只引用 `ev-002`；这一点在 150–190 秒的暴力解法画面/`ev-003` 才直接出现，应补 `ev-003`，不要只用题面帧支撑。

### 暴力复杂度

通过。150–190 秒画面直接写出每件物品放或不放，以及 `O((2^n)*n)`。

需校正：`ev-003.observation` 写成 `O(O((2^n)*n))`，多了一层 `O(`；应改为 `O((2^n)*n)` 或规范化 `O(2^n * n)`。

未充分支持：`solution-001.spaceComplexity = O(n)` 没有对应的复杂度分析项，定向画面只直接显示时间复杂度。若没有精确口述证据，应置 `null` 或标为编辑推导。

### 贪心反例

通过。画面直接给出：

- 容量 `5`；
- 重量 `[1,2,3]`；
- 价值 `[6,10,12]`；
- `v/w = [6,5,4]`；
- 按单位价值从高到低选前两件得到 `16`；
- 选择重量 2 和 3 的两件得到 `22`。

这足以否定“按单位价值排序”对 0-1 背包的普遍正确性。

### 状态与递推式

通过。500–590 秒画面直接出现：

- `F(n,C)` 的语义；
- 不选：`F(i-1,c)`；
- 选：`v(i) + F(i-1,c-w(i))`；
- 取二者最大值。

`F(i,c)` 对应考虑 `[0...i]` 的口径还可由屏幕代码注释和 `bestValue(..., index, c)` 交叉确认。

需校正：`correctness.claims[0]` 中“无遗漏地覆盖所有有效组合”是对二分选择的正确性归纳，不是画面上的直接证明文字。建议保留结论但把 `sourceClass` 改为 `editorial_inference`；课程直接部分只写“教师列出选/不选两支并取最大值”。

### 自顶向下记忆化

通过。关键 token 与最终屏幕一致：

- 基线：`index < 0 || c <= 0`；
- 命中缓存：`memo[index][c] != -1`；
- 不选分支先递归 `index-1,c`；
- 仅在 `c >= w[index]` 时计算选取分支；
- 写回 `memo[index][c] = res`；
- 二维缓存为 `n × (C+1)`，初值 `-1`；
- 返回 `bestValue(..., n-1, C)`。

`solution-003.limitations` 中“受限于系统递归深度”更像常规工程分析；当前 `ev-006` 观察并未记录教师明确口述，建议移至编辑说明或删除。

### 自底向上二维 DP

通过。表格与代码一致：

- 示例表为 3 行、6 列，最终 `memo[2][5] = 22`；
- 第 0 行：`memo[0][j] = (j >= w[0] ? v[0] : 0)`；
- 外层 `i = 1; i < n; i++`；
- 内层 `j = 0; j <= C; j++`；
- 先继承 `memo[i-1][j]`；
- 若 `j >= w[i]`，比较 `v[i] + memo[i-1][j-w[i]]`；
- 答案为 `memo[n-1][C]`。

`solution-004.stage = optimized` 容易暗示它比记忆化版本具有更优渐进复杂度。视频本段展示的是自底向上的另一实现；若课程没有称其为优化，建议使用 `alternative` 或 `intermediate`。

### 动态规划复杂度

不能按当前证据直接定为课程明示：

- 画面能看到 `n × (C+1)` 表和两层循环，因此 `O(n*C)` 时间、`O(n*C)` 表空间在算法上可编辑推导；
- 但 `cx-002`、`cx-003` 的 `expressionObserved` 均为 `null`；
- `ev-006`、`ev-008` 的 observation 只记录代码/缓存/二维 DP，没有记录教师口述复杂度；
- 所检查的定向画面没有出现 `O(n*C)` 文字。

按 v1.6 的防补造规则，在没有精确口述定位前：

1. 不应将 `cx-002`/`cx-003.normalizationSourceClass` 标为 `course_direct`；
2. 顶层 `complexity` 不应引用 `ev-006`/`ev-008` 作为课程明示复杂度；
3. `solution-003`/`solution-004` 的复杂度字段应置空，或在支持编辑推导的最终笔记层明确标作 `editorial_inference`；
4. 若后续能补出教师明确说出 `O(n*C)` 的秒级口述定位，则可恢复为课程直接内容，并把原始口径填入 `expressionObserved`。

本 QA 环境无法直接消费本地音频内容，因此没有把“可能存在但未定位的口述”当成已核验直接证据。

## 代码编译与测试

两段 normalized 代码均逐字作为测试文件主体，没有补 `<algorithm>` 或修改算法代码；只追加了最小 `main` 外壳。

编译条件：

```text
Apple clang 17
-std=c++17 -Wall -Wextra -Wpedantic -Werror
-fsanitize=address,undefined
```

每段代码均通过以下 5 个代表性测试：

1. 课程示例 `{1,2,3}/{6,10,12}, C=5 -> 22`；
2. 同组物品 `C=3 -> 16`；
3. `C=0 -> 0`；
4. 空物品 -> `0`；
5. 单个物品重于容量 -> `0`。

结果：两段均编译成功，10/10 断言通过，ASan/UBSan 无报错。normalized 中两项 `verification` 已由 `not_run` 提升为 `tested`，并重新通过 canonical JSON Schema。

可移植性说明：屏幕代码使用 `std::max`，却未显式 `#include <algorithm>`。它在当前 Apple clang 环境中因传递包含而通过，但严格可移植代码应显式包含 `<algorithm>`；若添加，必须标作编辑修复，而不是声称视频画面已有该头文件。

## 其他非阻断问题

- `09-04 -> 09-05` 的 `basis: explicit_in_lesson` 证据不足：`ev-001` 只记录一般性回顾，没有明确引用 House Robber 或稳定课次 ID。建议改为 `editorial_hypothesis`，等待双侧审核。
- `09-05 -> 09-06` 的 rationale 声称末尾预告下一课，但 `ev-008.observation` 未记录该口述。正式升级前应补精确口述定位，否则降为目录/编辑关系。
- raw/normalized 的 `uncertainties` 为空不合适；至少应记录 DP 复杂度直接性和 `<algorithm>` 的可移植性边界。

## 独立复核（正式笔记前）

本轮重新读取最终 normalized，并独立复核题面、贪心反例、闭区间状态 `[0...i]`、选择 / 不选择转移、top-down 与 bottom-up 状态拆分、二维表第一行和答案位置。既有校准结论成立，无需改动 raw。

两份测试源重新以以下条件编译运行：

```text
Apple clang 17
-std=c++17 -Wall -Wextra -Wpedantic -Werror
-fsanitize=address,undefined
```

真实结果：

```text
code-001: 5 representative tests passed
code-002: 5 representative tests passed
ASan/UBSan: no error
```

复核确认：

- `F(i,c)` 的 `[0...i]` 是包含 `i` 的闭区间，共 `i+1` 件物品；
- 选取分支读取 `F(i-1,c-w[i])`，保证第 `i` 件最多使用一次；
- top-down 与 bottom-up 分别引用各自 state model；
- DP `O(n*C)` 时间和 `O(n*C)` 表空间保持 `editorial_inference`；
- 暴力 `O(n*2^n)` 为课程直接结论；
- 两份代码 `tested` 与实际运行结果一致；
- 原片未显式包含 `<algorithm>` 的可移植性边界继续保留；
- 两条相邻课关系继续保持 provisional/editorial_hypothesis。

最终正式笔记已据此区分课程直接内容、视觉直接内容、编辑推导与项目测试，不把本地测试写成 LeetCode 提交。
