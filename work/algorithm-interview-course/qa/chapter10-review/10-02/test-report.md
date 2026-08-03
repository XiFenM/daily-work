# 10-02 屏幕代码测试报告

## 范围

- 被测实现：屏幕中的 DP 与 greedy 两份 `eraseOverlapIntervals`。
- 最小补全：加入标准要求的 `#include <algorithm>`，并以 namespace 隔离同名 `compare`/`Solution`；核心比较器、循环、状态、转移、返回表达式保持屏幕 token。
- 测试源：`test-harness.cpp`。

## 代表用例

共 9 组，全部通过：空输入、单区间、端点相接、两组题面示例、嵌套区间、负坐标连续相接、乱序输入、`INT_MIN/INT_MAX` 边界坐标。

## 穷举 oracle

- 区间端点：`{-2,-1,0,1,2}`。
- 合法区间全集：所有 `start < end`，共 10 种。
- 输入空间：长度 `0..5` 的全部有序列表，允许重复区间。
- 总例数：`1 + 10 + 10^2 + 10^3 + 10^4 + 10^5 = 111111`。
- Oracle：枚举每个输入的所有子集，逐对判断 `a.end <= b.start || b.end <= a.start`，取得最大兼容子集，再返回 `n - kept`。
- 结果：DP `111111/111111` 一致；greedy `111111/111111` 一致。

程序最终输出：

```text
representative=9 exhaustive=111111 universe=10 status=PASS
```

## Sanitizer

编译选项：

```text
-std=c++17 -O1 -g -fsanitize=address,undefined -fno-omit-frame-pointer
```

结果：进程正常退出；ASan/UBSan 无报告。

## 编译告警

严格告警选项：

```text
-std=c++17 -O0 -g -Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion
```

结果：成功编译，共 17 条告警。其中 15 条来自屏幕实现：

- DP：10 条。包括 `int < vector::size_type`、以 `int` 索引 vector 时的 signedness 转换、`intervals.size() - res` 从 `size_t` 收窄到 `int`。
- Greedy：5 条，类别相同。
- 测试 oracle：2 条 `int` 到 vector 下标类型转换，不属于课程屏幕代码。

未发现逻辑错误、内存越界或未定义行为。工程化改写可统一使用 `size_t` 下标，并在确认题目规模后显式转换返回值；正式笔记应保留“屏幕原码”和“工程建议”的来源边界。
