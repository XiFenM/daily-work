# 10-02 独立交叉 QA

- 复核范围：raw、normalized、正式笔记、逐帧/定点画面、本地证据、测试报告与测试外壳。
- 外部调用：无。
- 正式文件修改：无；本报告只记录独立复核结论。
- 总体结论：核心算法、时间线、端点语义、两套比较器、DP 状态校准、测试结果与“贪心证明仍为 partial”的边界均正确；发现 3 项内容/来源边界修正和 1 项 QA 元数据漂移，建议修正后再关闭本课质量门。

## 需修正项

### P2：声称保留的屏幕注释并非逐字原文

- `targeted/715s.jpg` 与 `local-evidence.md` 中的屏幕原文是：

  ```cpp
  // memo[i]表示使用intervals[0...i]的区间能构成的最长不重叠区间序列
  ```

- 正式笔记第 157、254 行及 normalized 的 `code-001.code` 均漏掉“能”字，却分别使用了“屏幕代码注释写作”“保留屏幕状态注释原貌”以及 `sourceKind: shown_in_video`。
- 此处不影响算法语义，但会破坏“原貌/视频所示代码”的转录可信度。建议补回“能”。
- 同一代码块还把屏幕中无花括号的单语句 `for`/`if` 改成了带花括号的等价格式；greedy 的外层 `for` 也有同类格式化。若目标是逐 token 转录，应恢复屏幕语法；若只要求语义等价，建议明确标注为“按等价格式排版的屏幕代码转录”，不要称为完整原貌。

### P2：`solution-003.spaceComplexity` 的 `O(1)` 缺少统计口径

- normalized 第 162 行把 greedy 阶段空间直接写为 `O(1)`；课程证据 `ev-009` 只直接支持时间 `O(n log n)`。
- 同一 normalized 顶层 `complexity.space` 已正确写成 `O(1) scan state (excluding std::sort internals)`，正式笔记也正确区分“扫描显式状态”和 `std::sort` 内部栈。
- 建议把阶段字段同步改成带限定的扫描状态表达，或在无法表达口径时置空。否则读者容易把它误读为整个排序算法的、课程直接给出的严格常数辅助空间。

### P3：tie-break 被称为“稳定的次级规则”容易误导

- 正式笔记第 315 行写“终点相同时按起点升序只是稳定的次级规则”。比较器本身完全正确：greedy 以 `end` 升序为主键，以 `start` 升序为次键。
- 但 `std::sort` 不是稳定排序；次键只能确定主键相同时的进一步顺序，完全相同的区间仍为等价元素。建议改成“次级排序规则”或“主键并列时的次键”，避免与 stable sort 混淆。
- 第 150 行“相同起点时再按终点升序，使顺序确定”也可一并收窄为“进一步确定次序”；完全相同区间仍无需区分。

### P3：当前正式笔记与既有 QA 记录发生漂移

- `synthesis-qa.md` 记录的正式笔记 SHA-256 为 `dc6388ad6b6645d557450661468415bf49393f4a78ffe958a4f6059bcbe1f8bc`；当前文件为 `d2303ffc0454fed081416d6702d533da2d7d802f362897bcb0754f73ff91a8ef`。
- 既有 QA 写着 Prettier PASS，但当前独立执行检查为 FAIL。差异仅是第一张 Markdown 表的“来源”表头及分隔行宽度未与较长单元格对齐；两张表的结构仍有效，没有丢列。
- 建议在上述内容修正后重新格式化、复跑 QA，并更新最终哈希，避免旧报告对新文件作出失效背书。

## 已核实通过

### 时间线与证据

- normalized 共 9 段：`0–16000`、`16000–144000`、`144000–239000`、`239000–319000`、`319000–732000`、`732000–760000`、`760000–828000`、`829000–1030000`、`1030000–1078680` 毫秒。
- 每段均满足 `startMs < endMs`，无重叠；`ev-007` 与 `ev-008` 之间保留 1 秒转场空隙，结尾与实际时长 `1078.68s` 一致。
- Schema Draft 2020-12 验证通过；92 次 `evidenceIds` 引用全部落在本课 10 个 evidence ID 中。正式笔记显式使用 `ev-001` 至 `ev-010` 全部 ID。

### `memo[i]`、比较器与端点条件

- 正式笔记和 normalized 已正确把代码真实状态校准为“必须以排序后 `intervals[i]` 结尾”，并明确说明屏幕宽泛注释不能解释成无条件前缀最优；代码没有 `memo[i-1]` 继承项，最终必须取 `max_i memo[i]`。
- DP 比较器核实为 `start` 升序、`end` 升序次键；greedy 比较器核实为 `end` 升序、`start` 升序次键。
- 两份实现的兼容条件均为 `current.start >= previous.end`；这与题面明确的 `[1,2]` 和 `[2,3]` 不重叠一致。
- 空输入提前返回、DP 初值、双层前驱转移、greedy 的 `res/pre` 更新及最终 `n-res` 均与画面和本地外壳一致。

### 复杂度来源边界

- 暴力 `O(2^n * n)`、DP 时间 `O(n^2)`、greedy 时间 `O(n log n)` 均有课程直接证据。
- DP 辅助空间 `O(n)` 与 greedy 扫描显式状态 `O(1)` 属于代码推导；正式笔记已正确标成编辑推导，并对 `std::sort` 内部空间作了限定。
- 除上述 `solution-003.spaceComplexity` 字段未同步限定外，没有发现把本地推导冒充课程口述的情况。

### `ev-010` 与本地验证

- `ev-010` 使用 `editorial_inference` 作为 schema 允许的非视频证据容器，时间和素材字段为 `null`，locator 指向 `test-report.md`；所有实验结论在下游均标为 `supplemental`，来源边界清楚。
- 独立重新编译运行结果：9 个代表用例与 111,111 个长度 `0..5` 的完整小规模输入全部通过，DP/greedy 均与子集 oracle 一致；ASan/UBSan 无报告。
- 严格告警独立复现 17 条：课程屏幕算法 15 条（DP 10、greedy 5），测试 oracle 2 条。缺少显式 `<algorithm>` 与 `int`/`size_t` 风险记录准确。
- 测试只支持“覆盖范围内未发现反例”，没有被当作任意输入上的形式化证明。

### 正确性完整度与 Markdown 表

- `correctness.completeness` 保持 `partial`；`greedy_choice` 与 `exchange_step` 两项义务仍为编辑性待证内容，并明确交给 10-03，边界正确。
- 正式笔记两张 Markdown 表逐行列数一致：第一张 4 列、第二张 3 列；竖线转义正确。当前 Prettier 失败属于对齐格式问题，不是表结构损坏。

## 独立检查摘要

```text
schema=PASS evidence_refs=92 evidence_ids=10 timeline_segments=9 timeline_end_ms=1078680
representative=9 exhaustive=111111 universe=10 status=PASS
ASan/UBSan=PASS
strict_warnings=17 total / 15 screen implementations
markdown_table_columns=PASS (4 columns, 3 columns)
prettier=FAIL (10-02.md first table alignment only)
```

当前哈希：

```text
normalized a52e66798de1819e03d68331451e0860514a104a4ca0592e1ef75b63d794dd1a
note       d2303ffc0454fed081416d6702d533da2d7d802f362897bcb0754f73ff91a8ef
harness    c88284517a9084b0ded52e2fba0e4b9ec7b6db457e305c13ac9e2dc023bc6327
```

## 父任务修正与复核闭环

独立审校提出的四项问题均已处理：

1. 屏幕注释两处补回逐字原文中的“能”，normalized `code-001` 同步；
2. `solution-003.spaceComplexity` 改为只统计显式扫描状态并排除 `std::sort` 内部空间；
3. “稳定的次级规则”改为“主键并列时的次级排序规则”，明确不表示 stable sort；
4. 正式笔记重新运行 Prettier，表格格式通过。

最新结果：

- normalized SHA-256：`6268b444de2ed4b2fb5e9d87ab2deeb54ac3cadd4873c25805649dadc71fffec`；
- 正式笔记 SHA-256：`6186e3f80ccf30c49d58fbcddd92eb23d403d5c5983d4007e953e6103d4b2867`；
- Schema、证据引用、9 + 111,111 oracle、ASan/UBSan、Prettier、项目验收与 `pnpm check` 全部通过。
