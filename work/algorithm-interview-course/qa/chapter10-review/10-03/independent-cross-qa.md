# 10-03 独立交叉 QA

- 复核范围：raw、calibrated normalized、正式笔记、本地视觉预审、证明段 1 秒联系表、全片联系表、synthesis QA，以及当前跨课关系登记结果。
- 外部调用：无。
- 正式文件修改：无；本报告只记录独立复核结论。
- 总体结论：没有发现 P1/P2 级事实或证明边界错误。10 个 calibrated 证据段、两组反例、一步交换结论、`partial` 缺口、端点/tie 边界、无代码状态以及 MST/最短路覆盖边界均正确。发现 2 项正式产物的 P3 一致性问题，以及 2 项非正式 QA 记录漂移。

## Findings

### P3：00:45 的直接反例原则没有归入 `ev-001`

- `contact-002.jpg` 的 `00:45–01:04` 画面直接写着“如果无法使用贪心算法，举出反例即可”，该时间落在 calibrated `ev-001`（`0–65000 ms`）内。
- normalized 的 `timeline[0]` 和 `ev-001.observation` 只记录标题、直观定义与难导性，没有记录这条直接出现的反例原则。
- 正式笔记第 77 行复述“寻找一个反例即可否定它”，却引用 `ev-002–ev-004`，没有引用最直接的 `ev-001`；第 64 行对 `ev-001` 的内容摘要也只写“标题与直观定义”。
- 事实本身正确，且后续两个反例与 `ev-004` 的证明转折也能辅助支撑；问题仅是证据定位不够精确。建议在 `ev-001` 的 observation/timeline summary 中补入该画面，并在正文对应句加入 `ev-001`。

### P3：`06-05 → 10-03` 的关系类型在正式笔记与共享关系图中不一致

- normalized `relationCandidates` 与正式笔记第 424 行均把该关系写为 `revisits`；这有充分依据，因为 06-05 本身也展示了同一个 `n=12`、`9+1+1+1` 对 `4+4+4` 的贪心反例。
- 当前 `notes/relationships.json` 把同一对课次登记为 `contrasts_with`、`strong/verified`，理由侧重“06-05 的 BFS 系统搜索”与“10-03 的错误单路径贪心”的方法对照。
- 两种语义都成立，强度 `strong` 也有跨课直接证据支持；不一致发生在关系类型而非事实或强度。建议统一 canonical type，或在正式笔记中明确写成“回访同题，同时形成 BFS 与错误贪心的对照；共享图按 `contrasts_with` 登记”。
- 其余关系强度核对通过：`09-05 → 10-03` 是同一容量 5、三物品、16/22 反例，`strong` 合理；`10-02 → 10-03` 有 10-02 结尾的直接预告，集成后提升到 `strong/verified` 合理。normalized 在只看 10-03 本课证据时仍保留 `provisional/editorial_hypothesis`，属于证据作用域差异，不是矛盾。

### QA 记录漂移：区间问题的关键画面实际已在 06:20 出现

- `local-evidence.md` 与 `synthesis-qa.md` 把区间问题关键画面起点写为 `06:24`。
- 全片 5 秒联系表 `contact-009.jpg` 在 `06:20.000` 已清楚显示“给定一组区间，问最多保留多少个区间……”；`06:30` 才进一步出现最早结束规则。
- 因而 normalized 与正式笔记采用 `06:20–06:44` 的 `ev-005` 边界是合理的，需要修正的是本地预审/QA 的关键帧描述。证明段 1 秒抽帧从约 `06:24` 开始，解释了该记录为何晚了约 4 秒。

### QA 记录漂移：项目登记状态已经变化

- `synthesis-qa.md` 第 51 行记录 10-03 当时尚未登记 manifest/progress；当前 manifest 与 progress 已包含 10-03，当前项目验证也不再报告 10-03 orphan。
- 当前验证只报告两个共享集成计数尚未同步：`chapter summaries` 报告 9、实际 10；`verified edges` 报告 88、实际 93。
- 同理，synthesis QA 中“三条候选未升级共享关系图”是当时的操作边界；当前共享关系图已存在三条经跨课证据复核的 strong/verified 边。该文件若作为历史校准记录可以保留；若作为最终当前状态报告，应刷新这一节。
- normalized 与正式笔记哈希仍与 synthesis QA 完全一致，因此上述变化不表示正式内容未经复核。

## 已核实通过

### 10 个证据分段

- calibrated normalized 将 raw 的 7 个粗段细化为 10 段，连续覆盖 `0...923320 ms`：

  ```text
  0–65000
  65000–125000
  125000–190000
  190000–380000
  380000–404000
  404000–470000
  470000–634000
  634000–672000
  672000–769000
  769000–923320
  ```

- 全部分段满足 `startMs < endMs`，相邻段无重叠、无空隙，末端等于实测时长 `923.320s`。
- raw 中宽泛的区间证明段 `380000–672000` 被正确拆成问题/规则、反设、交换、矛盾收束四段；后两段对应通用模板和结课总结。
- 除前述 `ev-001` 内容覆盖不完整外，主题与画面边界均吻合。

### 16/22 与 4/3 两组反例

- 0-1 背包画面数据核实为容量 5，三件物品 `(w,v)=(1,6),(2,10),(3,12)`，单位价值为 `6,5,4`。按单位价值先取前两件得到 `6+10=16`；后两件重量 `2+3=5`、价值 `10+12=22`，构成严格更优可行解。
- 屏幕直接显示贪心结果 16；22 可由画面数据独立演算，raw 的组合音视频证据也直接报告最优 22。正式笔记同时标出 course/visual/editorial 边界，处理正确。
- Perfect Squares 核实为 `12=9+1+1+1` 共 4 项，而 `12=4+4+4` 共 3 项。笔记只否定“每次取最大平方数”这一具体规则，没有扩张成所有贪心或所有 Perfect Squares 方法均失败。

### 一步交换结论与 `partial` 缺口

- 画面顺序核实为：定义当前最早结束的 `i`；反设该选择所得解至多 `k-1`；引入最优解当前选择 `j`；写出 `f(j)>f(i)`；用 `i` 替换 `j` 且不影响后续选择；在 `10:34` 明确得到大小仍为 `k` 的解；随后以矛盾收束。
- normalized 和正式笔记都把课程已完成内容限定为“一步交换/存在一个采用当前贪心选择的最优解”，没有冒充整个迭代算法的完整证明。
- `correctness.method=exchange_argument`、`completeness=partial` 正确。缺失义务记录完整：任意步骤量词、剩余实例与最优子结构、重复交换或归纳、终止后的整体 postcondition。
- normalized 中 `postcondition` obligation 的文字明确限定为“课程的一步结论”，正式笔记又单列整体 postcondition 未闭合，因此没有把局部结论和全局结论静默混同。

### 端点与 tie 语义

- 画面只写 `f(j)>f(i)`，未覆盖 `f(j)=f(i)`；normalized、uncertainties 和正式笔记均保留该 tie 缺口。
- 10-03 没有定义区间开闭，也没有重述端点相接是否冲突；正式笔记没有把 10-02 的 `>=` 偷渡成本课直接证据，只作为跨课前提说明。
- 编辑补全使用 `f(g)<=f(o)`、剩余实例与重复交换时均明确标为 `editorial_inference`，来源边界正确。

### 无代码、复杂度与图算法边界

- `codeArtifacts=[]`、`stateModels=[]`、`experiments=[]`；本课没有代码。正式笔记没有声称编译、测试、LeetCode Accepted、oracle 或 Sanitizer 状态。
- 顶层时间/空间复杂度均为 `null`。笔记只以编辑推导方式说明“若采用排序加扫描”可为 `O(n log n)`，没有冒充课程直接复杂度。
- 最小生成树和最短路径的 concept role 均为 `mentions`、definition 为 `null`。笔记没有补造 Prim、Kruskal、Dijkstra、BFS、边权前提、证明或复杂度，也没有由题名建立未经支持的强算法关系。

### 结构与格式验证

- Canonical Schema Draft 2020-12：PASS。
- normalized：10 个 evidence ID，60 次 `evidenceIds` 引用全部可解析。
- 正式笔记：`ev-001...ev-010` 全部使用，无未知 ID。
- Markdown 表：三张表列数分别稳定为 4、4、3。
- Prettier：normalized、正式笔记、local evidence、synthesis QA 全部 PASS。
- `git diff --check`：PASS。
- 当前内容哈希与 synthesis QA 记录一致：

  ```text
  normalized 2e8b69ce8759deefaa822cc7e19943ea1ad8a1a2f885fab32040b3d771970848
  note       fdf82070cfdaed0bd2593f6afb5b4cea6daa2bb1dde95ce67ac9fe468204f476
  ```

## 父任务修正与复核闭环

- `ev-001` 已补充 00:45 画面的直接反例判否原则，时间线摘要与正式笔记引用同步到 `ev-001–ev-004`。
- 正式笔记现明确区分两层关系语义：单课 normalized 将 `06-05 → 10-03` 视作题目回访候选；共享关系图用 `contrasts_with / verified` 表达 BFS 与错误单路径贪心的对照。
- 既有 synthesis QA 中关于 orphan、progress 与共享关系未集成的描述已经由父任务完成：manifest、progress、概念和 5 条第十章相关 verified 边全部登记。
- 06:20 的 calibrated `ev-005` 保持为正式区间段起点；旧 QA 中 06:24 仅是一个抽帧检查点，不再作为段落边界。
- 最新 normalized SHA-256：`750a30adc196eeb90e20ffbcdb6b71dda1542c4a547ec48ad2750d16fff8e620`。
- 最新正式笔记 SHA-256：`8fa7b3f83616ee46c779ee86a1afe4db878f537602302ad90f7bd409f0c53956`。
- Schema、全部证据引用、Prettier、项目验收、`pnpm check` 与 60 项测试均通过。

## 独立检查摘要

```text
schema=PASS refs=60 ids=10 timeline=10 end=923320
codeArtifacts=0 stateModels=0 experiments=0
correctness=exchange_argument/partial
examples=PASS (16<22; 4>3)
tables=PASS (4, 4, 3 columns)
prettier=PASS
git_diff_check=PASS
project_validator=current shared-count drift only (9/10 chapter summaries; 88/93 verified edges)
```
