# 10-01 人工校准与正式笔记 QA

## 范围

- 课次：`10-01 贪心基础 Assign Cookies`
- 原片：`work/algorithm-interview-course/incoming/10-1 贪心基础 Assign Cookies_慕课网.mp4`
- 压缩片：`work/algorithm-interview-course/compressed/10-01-balanced.mp4`
- 原始模型证据：`outputs/algorithm-interview-course/understanding/raw/10-01.json`
- 规范化证据：`outputs/algorithm-interview-course/understanding/normalized/10-01.json`
- 正式笔记：`projects/algorithm-interview-course/notes/lessons/10-01.md`
- 本地视觉预审：`work/algorithm-interview-course/qa/chapter10-review/10-01/local-evidence.md`
- 检查日期：2026-08-03

## 外部理解结果

- 模型：`google/gemini-3.6-flash`
- Request ID：`7fc63eaef2f04f309d9b8fbf4ae8a815`
- Prompt：`video-evidence-v1.7`
- Prompt tokens：`74,673`
- Completion tokens：`8,982`，其中 reasoning `4,246`
- Total tokens：`83,655`
- Audio tokens：`18,375`
- 原始 raw 与 response sidecar 均保持不变。

## 视觉与时间线复核

- 人工查看 4 张 10 秒间隔联系表、初始 12 格联系表和 23 张原片定向帧。
- 课程结构确认：00:00–00:27 引入；00:27–02:49 题面；02:49–06:16 贪心动画；06:16–10:16 C++ 实现；10:16–10:40 复杂度口述；10:40–12:15.440 为 Is Subsequence 练习与下节预告。
- 题面两组示例、`g(i)`/`s(j)` 含义、降序排序方向和完整代码均回到原片核对。
- 末尾 392 Is Subsequence 只展示题面与示例，没有屏幕代码；正式笔记未补造解法。

## 人工校准项

### Tie-break

- 屏幕只使用 `greater<int>()` 降序排序，没有稳定排序或第二关键字。
- 相同需求的孩子和相同尺寸的饼干在本题可行性关系下可互换。
- 规范化证据保留 tie-break 不确定项，没有把未展示规则写成课程内容。

### 正确性完整度

- 方法保持 `exchange_argument`。
- 完整度保持 `partial`。
- 课程直接证据只覆盖贪心选择和“最大饼干仍不足则跳过孩子”的局部安全性。
- 正式笔记中的完整交换步骤明确标为 `editorial_inference`，没有回写成课程原话。

### 复杂度

- 课程原式：扫描 `O(n)`、排序与总体 `O(n log n)`。
- 编辑规范化：`O(|g| log |g| + |s| log |s|)`，不假设两个数组等长。
- `complexityAnalyses[0].expressionObserved` 保留课程原式；`expressionNormalized` 与 `normalizationSourceClass` 分别记录精确表达和 `editorial_inference`。
- 课程没有直接给出辅助空间，因此顶层 `complexity.space` 与解法 `spaceComplexity` 均保持 `null`；没有把原地排序错误等同于课程直接给出的 `O(1)`。

## 屏幕代码复核

逐 token 确认：

- 函数签名为 `findContentChildren(vector<int>& g, vector<int>& s)`；
- 两个数组均用 `greater<int>()` 降序排序；
- `si=0, gi=0, res=0`；
- 条件为 `s[si] >= g[gi]`；
- 成功分支执行 `res++`, `si++`, `gi++`；
- 失败分支只执行 `gi++`；
- 循环条件同时检查孩子与饼干边界；
- 最终返回 `res`。

代码副作用与工程风险已在正式笔记中保留：

1. 非 const 引用与原地排序会改变两个输入 vector；
2. 屏幕未显式包含 `std::greater` 的规范头文件 `<functional>`；
3. `int` 指针与 `vector::size_type` 比较产生两条 `-Wsign-compare`。

## 本地代码验证

文件：

- `screen-exact-compile.cpp`：屏幕代码最小编译外壳；
- `code-test.cpp`：屏幕核心加测试驱动和暴力最大匹配 oracle。

结果：

| 检查 | 结果 |
| --- | --- |
| 9 组代表输入 | 全部通过 |
| 固定种子 `0x1001` 的 10,000 组随机输入 | 与暴力 oracle 全部一致 |
| AddressSanitizer | 通过 |
| UndefinedBehaviorSanitizer | 通过 |
| `-Wall -Wextra -pedantic` | 编译运行成功，2 条 sign-compare 警告 |
| 追加 `-Werror` | 仅因上述 2 条警告失败 |
| 在线评测 | 未运行 |

规范化证据中的 `code-001.verification` 已由 `not_run` 提升为 `tested`。

## 正式笔记检查

- frontmatter 课次、章节、标题、内容类型、模型与状态完整。
- 使用原片实测时长 `735.440 s`，明确大纲差值 `3.440 s`。
- 来源标签区分 `course_direct`、`visual_direct`、`editorial_inference`、`supplemental`。
- 覆盖题面、示例、排序必要性、指针状态、两个转移、终止条件、完整代码、证明边界、复杂度、本地测试、工程风险、扩展题和面试表达。
- 笔记只引用 `ev-001` 至 `ev-006`，全部存在于 normalized；`code-001` 与 `state-001` 引用均存在。
- 未将 Is Subsequence 登记为本课解法或代码产物。
- 未提前虚构 10-02、10-03 的具体结论。

## 自动检查

- canonical JSON Schema：通过。
- evidence ID 引用：通过（6 个 evidence，48 处引用）。
- timeline 时间边界：通过。
- solution → code/state 跨对象引用：通过。
- v1.7 normalizer 专项测试：42/42 通过。
- 正式笔记 Prettier：通过。
- `git diff --check`（限定本课两个正式文件）：通过。

## 文件哈希

- normalized：`28668bb794d13b3bbeeeec2fbfbc9adca12cf61a1f9355af1091eba3ad85edc8`
- 正式笔记：`18f5773e77f99936c3201537a5985edb4c1a9749e09c125aeceaf7118f361aa4`
- local-evidence：`609b9d933aa70e50e723bf273243d234a5cdb30b83d397a2e2770e00c0665a47`

## 结论

- 视觉证据、音频理解、本地代码测试与正式笔记已经对齐。
- 课程结论、编辑推导和本地补充没有混层。
- 10-01 单课产物可进入父任务的 manifest/progress 登记与章级交叉 QA。
