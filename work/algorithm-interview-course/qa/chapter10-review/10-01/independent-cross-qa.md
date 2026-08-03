# 10-01 独立交叉审校

## 结论

- 结论：**通过（PASS）**。
- 阻塞问题：0。
- 实质性事实错误：0。
- 可选精度改进：1（排序后扫描可给出更紧的 `O(G)` 上界；当前 `O(G + S)` 仍是正确上界，不影响总复杂度）。
- 本次未修改 normalized、正式笔记、raw evidence 或其他正式文件；只新增本报告。

## 对照材料

- `outputs/algorithm-interview-course/understanding/raw/10-01.json`
- `outputs/algorithm-interview-course/understanding/raw/10-01.json.response.json`
- `outputs/algorithm-interview-course/understanding/normalized/10-01.json`
- `projects/algorithm-interview-course/notes/lessons/10-01.md`
- `work/algorithm-interview-course/qa/chapter10-review/10-01/local-evidence.md`
- `work/algorithm-interview-course/qa/chapter10-review/10-01/qa-report.md`
- `work/algorithm-interview-course/qa/chapter10-review/10-01/code-test.cpp`
- `work/algorithm-interview-course/qa/chapter10-review/10-01/screen-exact-compile.cpp`
- 原片关键帧 `frame-0575s.jpg`、`frame-0615s.jpg`、`frame-0634s.jpg`、`frame-0650s.jpg`、`frame-0675s.jpg`、`frame-0730s.jpg`

当前正式文件哈希与既有 QA 报告一致：

- normalized：`28a7a5555a639225f25925b221c30728ca5e0b320a98cbc18fbe31b9735003ea`
- 正式笔记：`9c9ab72e5f39bafef0dc1623e9b9366785ec2039eba00796f202a743f7e81809`

## 重点核对结果

| 核对项 | 结果 | 独立复核说明 |
| --- | --- | --- |
| 降序排序与指针语义 | 通过 | 屏幕代码、raw `ev-003/004`、normalized state model 与笔记一致：`g`、`s` 均用 `greater<int>()` 降序；`gi` 指当前最大需求，`si` 指当前最大剩余饼干。 |
| 成功/失败更新 | 通过 | 成功分支为 `res++`, `si++`, `gi++`；失败分支只有 `gi++`。屏幕关键帧 06:34 附近可直接读出，未与升序对偶写法混淆。 |
| 失败分支理由 | 通过 | `s[si]` 已是最大剩余饼干；若仍小于 `g[gi]`，后续更小饼干不可能满足该孩子，因此保留饼干、跳过孩子。课程理由与编辑解释分层清楚。 |
| 交换论证标注 | 通过 | normalized 保持 `method=exchange_argument`、`completeness=partial`；正式笔记明确把九步完整交换论证标为 `editorial_inference`，没有伪装为讲师逐项证明。交换步骤本身成立。 |
| 双输入规模复杂度 | 通过 | 课程原式保留为 `O(n log n)`；normalized 顶层和 solution 均校准为 `O(|g| log |g| + |s| log |s|)`，并明确双规模是编辑规范化。raw 中统一 `n` 的表达没有被错误冒充为双规模原话。 |
| 空间复杂度 | 通过 | raw/校准输入中的无证据 `O(1)` 已被 normalized 同时从顶层 `complexity.space` 和 `solutionProgression[].spaceComplexity` 改为 `null`；笔记只把实现相关排序栈作为 supplemental 讨论。 |
| tie-break | 通过 | 屏幕只给 `greater<int>()`，无稳定排序或第二关键字；normalized uncertainty 与笔记都保留“相等值可互换”，未补造 tie-break。 |
| 输入原地排序 | 通过 | 函数参数是非 `const` 引用，两个 `std::sort` 会重排调用方的 `g`、`s`；笔记已明确提醒。 |
| `<functional>` | 通过 | 屏幕关键帧只显示 `<iostream>`、`<vector>`、`<algorithm>`；笔记将缺少 `<functional>` 正确标为 supplemental 可移植性风险，没有改写屏幕代码。 |
| 编译告警 | 通过 | 本机重新编译屏幕复写版：普通严格警告恰为 2 条 `-Wsign-compare`；加入 `-Werror` 后恰因这 2 条失败，与笔记一致。 |
| 392 边界 | 通过 | 10:50 帧已进入 `392. Is Subsequence` 标题，11:15 与 12:10 帧均只显示题面和两个示例；正式笔记未虚构代码、完整解法或证明。normalized 将其放在 10:40–12:15.440 的练习/预告段，和 raw `ev-006` 一致。 |

## 可选精度改进

### P3：扫描界可由 `O(G + S)` 收紧为 `O(G)`

当前 normalized 与正式笔记把排序后的扫描写成 `O(G + S)`。这不是错误：它是由两个指针单调前进得到的合法线性上界。

但对屏幕中的这个具体循环，每一次迭代都必然执行一次 `gi++`，而 `si++` 只会与同一次迭代中的 `gi++` 同时发生，因此循环迭代数最多为 `G`，更紧的扫描界是 `O(G)`。无论保留 `O(G + S)` 还是收紧为 `O(G)`，总体仍为：

```text
O(G log G + S log S)
```

所以此项不阻塞交付；若正文继续使用“精确”一词，可考虑在后续整理时收紧扫描子项。

## 独立复现实验

- 原片媒体探测：`735.440 s`，H.264 1920×1080、25 fps，AAC 44.1 kHz；与笔记时长一致。
- 已有测试二进制复跑：`9 directed + 10000 randomized oracle cases passed`。
- 重新用 ASan + UBSan 编译并执行测试：通过，仍输出 9 组定向与 10,000 组随机 oracle 全部一致。
- 屏幕复写版普通严格编译：成功，2 条 `-Wsign-compare`。
- 屏幕复写版 `-Werror`：失败，且仅报告上述 2 条符号位比较错误。
- 正式笔记引用的 evidence 集合为 `ev-001` 至 `ev-006`，与 normalized 中的 6 个 evidence ID 完全对应；`code-001`、`state-001` 均存在。

## 最终判断

10-01 的 raw 证据、人工校准 normalized、正式笔记、屏幕代码和本地测试结果相互一致。重点风险均已被正确保留或分层标注；除扫描子项存在一个不影响正确性与总复杂度的可选收紧外，无需返工。

## 父任务收束记录

- 已采纳可选精度改进：利用循环每轮必执行 `gi++`，把扫描子项从宽松的 `O(G + S)` 收紧为 `O(G)`；总时间不变。
- normalized assumption、complexity derivation、正式笔记与章综述已同步。
- 最新 normalized SHA-256：`28668bb794d13b3bbeeeec2fbfbc9adca12cf61a1f9355af1091eba3ad85edc8`。
- 最新正式笔记 SHA-256：`18f5773e77f99936c3201537a5985edb4c1a9749e09c125aeceaf7118f361aa4`。
- 最终项目验收、Prettier、`pnpm check` 与 60 项测试均通过。
