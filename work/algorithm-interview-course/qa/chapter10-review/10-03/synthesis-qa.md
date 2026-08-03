# 10-03 人工校准与正式笔记 QA

- 校准时间（UTC）：`2026-08-03T02:54:10Z`
- 正式理解 request ID：`b34946d6e9474ecdabe3cbc83c82f3c0`
- 正式笔记：`projects/algorithm-interview-course/notes/lessons/10-03.md`
- 校准证据：`outputs/algorithm-interview-course/understanding/normalized/10-03.json`
- 本地预审：`work/algorithm-interview-course/understanding/10-03/local-evidence.md`
- 本轮人工校准新增外部调用/素材上传：无；只使用已经取得的 raw/normalized 与本地抽帧。

## 必查结论

- `correctness.method` 保持 `exchange_argument`，`correctness.completeness` 固定为 `partial`。
- 课程已经完成实质性的一步交换：定义最早结束选择 `i`，令最优解当前选择 `j`，用 `i` 替换 `j` 不影响后续可行选择，并保持大小 `k`。
- 没有把一步交换提升成整体算法完整证明。normalized 与笔记同时列出缺失的任意步骤量词、剩余子问题最优结构、重复交换/归纳和最终 postcondition。
- `f(j)>f(i)` 的严格不等式已逐帧确认；`f(j)=f(i)`、排序 tie-break、区间开闭与端点相接语义均保留为未覆盖边界。
- 0-1 背包反例复核为：容量 5，`(w,v)=(1,6),(2,10),(3,12)`；单位价值贪心选前两件得 16，选择后两件可得 22。
- Perfect Squares 反例复核为：`12=9+1+1+1` 需要 4 项，而 `12=4+4+4` 只需 3 项；结论只否定“最大平方数优先”规则。
- 最小生成树、最短路径只保留为题名级 `mentions`；没有补写 Prim、Kruskal、Dijkstra、BFS、边权条件、证明或复杂度。
- `codeArtifacts` 与 `stateModels` 均为空。本课没有代码，代码编译、运行、样例、oracle 与 Sanitizer 测试全部为不适用。

## 人工视觉复核

- 全片每 5 秒抽帧，形成 `21` 张 3×3 联系表。
- 证明段约 `06:24–11:59` 每 1 秒抽帧，形成 `21` 张 4×4 联系表。
- 关键画面起点：
  - `01:05`：0-1 背包；
  - `02:05`：279 Perfect Squares；
  - `06:24`：最大互不重叠区间问题；
  - `06:29`：最早结束贪心规则；
  - `06:44`：本次选择 `i`；
  - `07:50`：最优解当前选择 `j` 与 `f(j)>f(i)`；
  - `08:18`：交换不影响后续选择；
  - `10:34`：仍得到大小为 `k` 的解；
  - `10:50`：矛盾与贪心选择性质结论；
  - `11:12`：`A` 替代 `O` 的通用模板；
  - `12:49` 后：最小生成树、最短路径题名。

## 自动检查

- JSON 语法：PASS。
- Canonical Schema Draft 2020-12：PASS。
- normalized evidence：`10` 个 evidence ID，`60` 次引用全部可解析。
- 时间边界：PASS；所有 evidence 均位于 `0...923320 ms`。
- 正式笔记 evidence 引用：PASS；`ev-001...ev-010` 全部使用，无未知或遗漏 ID。
- 关系候选：`3` 条，均保持 `provisional/editorial_hypothesis`，没有越权升级共享关系图。
- Prettier：PASS。
- `git diff --check`：PASS。

## 项目级验证的待集成项

运行 `validate-project.mjs` 时，10-03 raw/response 因尚未登记 manifest 被报告为 orphan，progress 计数也尚未包含本课；同时检测到父任务正在生成的第十章综述和关系数量变化。这些是本子任务被明确禁止修改的共享集成状态，不是 normalized Schema、引用或笔记内容错误。父任务登记 manifest/progress 并完成章节合并后需重新运行项目级验证。

## 内容哈希

- normalized：`750a30adc196eeb90e20ffbcdb6b71dda1542c4a547ec48ad2750d16fff8e620`
- 正式笔记：`8fa7b3f83616ee46c779ee86a1afe4db878f537602302ad90f7bd409f0c53956`

## 未在本子任务修改

未修改 manifest、progress、concepts、relationships、README、章综述、其他课次笔记或 raw API 响应；未提交 Git。
