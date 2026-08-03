# 第 10 章综述独立事实 QA

## 最终结论

- 结论：**通过（PASS）**。
- 阻塞问题：`0`。
- 必须修正项：`0`；审校中发现的问题均已在正式文件中修正并完成复验。
- 外部调用：本次独立 QA **未调用任何外部 API，也未上传素材**。
- 写入边界：未修改章综述、单课笔记、normalized、manifest、progress、关系图或其他正式文件；只新增本报告。

## 对照范围

- 章综述：`projects/algorithm-interview-course/notes/chapters/10.md`
- 规范化证据：
  - `outputs/algorithm-interview-course/understanding/normalized/10-01.json`
  - `outputs/algorithm-interview-course/understanding/normalized/10-02.json`
  - `outputs/algorithm-interview-course/understanding/normalized/10-03.json`
- 三份本地证据：
  - `work/algorithm-interview-course/qa/chapter10-review/10-01/local-evidence.md`
  - `work/algorithm-interview-course/qa/chapter10-review/10-02/local-evidence.md`
  - `work/algorithm-interview-course/understanding/10-03/local-evidence.md`
- 代码 QA：10-01 `qa-report.md`，10-02 `test-report.md`、`synthesis-qa.md` 与两课独立交叉 QA。
- 对账文件：`manifest.json`、`progress.json`、`notes/relationships.json`、Prompt v1.7 模板及 normalizer 专项测试。

## 逐项核对结果

### 1. 时长与媒介数字：通过

| 课次 | 原片实测时长 | 章综述 | 结果 |
| --- | ---: | ---: | --- |
| 10-01 | `735.440 s` | `12:15.440` | 一致 |
| 10-02 | `1,078.680 s` | `17:58.680` | 一致 |
| 10-03 | `923.320 s` | `15:23.320` | 一致 |

- 合计 `2,737.440 s = 00:45:37.440`，正确。
- 大纲合计 `2,729 s = 00:45:29`，实测多 `8.440 s`，正确。
- 原片大小合计 `271,251,763 B`；balanced 合计 `39,835,075 B`；总体缩小 `85.3144%`，章综述写“约 `85.31%`”正确。
- 三份 balanced 均低于 50 MB，H.264/AAC 探测结果与媒体盘点一致。

### 2. 复杂度及来源边界：通过

- 10-01：课程直接给出扫描线性、排序及总体 `O(n log n)`；编辑规范化为 `O(G log G + S log S)`。具体降序循环每轮必定 `gi++`，因此扫描紧上界已同步收紧为 `O(G)`。课程没有直接给出空间结论，normalized 保持 `space = null`，章综述没有再把 `O(1)` 冒充课程结论。
- 10-02：暴力 `O(2^n * n)`、DP 时间 `O(n^2)`、greedy 时间 `O(n log n)`均有课程直接证据。DP 的 `O(n)` 表空间与 greedy 的 `O(1)` 显式扫描状态均被明确标为代码/编辑推导；后者排除 `std::sort` 内部空间。
- 10-03：没有代码和独立复杂度讲解，顶层时间、空间均保持 `null`；章综述没有从 10-02 移植成本课结论。

### 3. 代码工件与本地 QA 数字：通过

- 工件数：10-01 为 `1`，10-02 为 `2`，10-03 为 `0`；共 `3` 个 `complete + tested` 屏幕 C++ 工件。
- 10-01：`9` 组代表用例、`10,000` 组随机 oracle、ASan/UBSan 全部通过；严格构建为 `2` 条 sign-compare；缺显式 `<functional>`。
- 10-02：两份实现均通过 `9` 组代表用例和 `111,111` 组完整小规模穷举 oracle；ASan/UBSan 通过；屏幕算法代码共 `15` 条类型告警（DP `10`、greedy `5`）；缺显式 `<algorithm>`。
- 章综述明确说明有限测试不等于一般性证明，也没有把本地通过写成在线平台 Accepted。

### 4. 状态、端点、比较器与证明完整度：通过

- 10-02 的屏幕注释已按原文补回“能构成”；章综述同时保留其宽泛表述，并把真实状态校准为“以 `intervals[i]` 结尾”。最终答案 `max_i memo[i]`、端点条件 `start >= previous.end`、空输入和返回 `n - kept` 均正确。
- DP 比较器为 `start` 升序、`end` 升序次键；greedy 比较器为 `end` 升序、`start` 升序次键。章综述未把次键误写成 stable sort。
- 10-01：`method = exchange_argument`、`completeness = partial`。
- 10-02：`method = state_transition`、`completeness = partial`；greedy 的完整交换证明明确留到 10-03。
- 10-03：`method = exchange_argument`、`completeness = partial`。章综述正确限定为一步交换引理，并明确列出量词、相等结束时间、端点语义、剩余问题闭包、重复交换/归纳和终止后置条件等缺口。

### 5. 反例与课程覆盖边界：通过

- 0-1 背包反例：容量 `5`，单位价值贪心得 `16`，合法最优组合得 `22`，正确。
- Perfect Squares：`12 = 9+1+1+1` 为 4 项，`12 = 4+4+4` 为 3 项，正确。
- 392 Is Subsequence 的边界已正确写为“展示题名、题面和两组示例，但没有题解或代码”；不再与只有题名级信息的 MST、最短路混同。
- MST、最短路没有被扩写为 Prim、Kruskal、Dijkstra、BFS、边权前提、复杂度或证明。

### 6. 外部理解记录与 token：通过

| 课次 | Request ID | Total tokens |
| --- | --- | ---: |
| 10-01 | `7fc63eaef2f04f309d9b8fbf4ae8a815` | `83,655` |
| 10-02 | `fa98a9315c5d4cd2835b45716a6cf342` | `119,741` |
| 10-03 | `b34946d6e9474ecdabe3cbc83c82f3c0` | `100,141` |

- 合计 `83,655 + 119,741 + 100,141 = 303,537`，正确。
- manifest 中三课各只有一次正式 accepted attempt，均为 HTTP 200、`requestMayHaveReachedServer = true`、`billingStatus = reported_by_usage`，没有本地门禁导致的重复正式调用。
- 三课均记录 `https://zenmux.dev/api/v1`、`google/gemini-3.6-flash`、JSON object、Prompt/源片/压缩片哈希和用量。
- 本地 `ch10-models.json` 是一次成功模型目录响应，包含 `148` 个模型条目，支持章综述的网络说明。

### 7. 跨课关系：通过

当前关系图中与第 10 章直接相关的 5 条边均为 `verified`，且章综述描述一致：

| 关系 | 类型 | 复核结论 |
| --- | --- | --- |
| `10-01 → 10-02` | `extends` | 双侧预告/承接证据充分 |
| `10-02 → 10-03` | `extends` | 目标侧证据已覆盖 `ev-005–ev-009` 的区间证明段 |
| `09-05 → 10-03` | `revisits` | 同一 `16 vs 22` 反例被原样回访；类型与 rationale 一致 |
| `09-08 → 10-02` | `same_pattern_as` | 固定结尾状态、枚举前驱、全表取最大一致 |
| `06-05 → 10-03` | `contrasts_with` | BFS 系统搜索与错误最大平方数贪心形成对照 |

跨课“同模式/回访/对照”均已加入 `editorial_inference` 来源层，不再伪装为讲师直接声明课号关系。

### 8. Markdown、引用与项目门禁：通过

- 章综述共有 5 张 Markdown 表，逐行列数分别为 `4 / 2 / 3 / 5 / 4`，均无丢列或错列。
- 章综述与三份单课笔记的 Prettier 检查通过。
- 章综述所用课次链接均存在；所有显式 evidence ID 均存在。10-03 的交换、矛盾收束、A/O 模板和 MST/最短路已分别绑定正确的 `ev-006–008`、`ev-009`、`ev-010` 区间。
- Prompt v1.7 模板 SHA-256：`a66874d624250f84454b33e30d1b5f1f86890affb4bae21b079d9e8cc0f34dc3`，与章综述一致。
- normalizer 专项测试：`42/42` 通过。
- `validate-project.mjs`：`status = ok`；`69` 份 normalized、`69` 份单课笔记、`10` 份章综述、`93` 条 verified 关系与 progress/manifest 已对账。
- `pnpm check`：skills、全仓 Prettier、ESLint、四个 workspace typecheck 全部通过；Vitest `60/60` 通过。

## 审校中发现并已修正的轨迹

以下均已复验关闭，不再是剩余问题：

1. 移除 10-01/10-02 将编辑性空间口径写成课程 `O(1)` 的错误归因。
2. 把 10-01 具体扫描上界由正确但宽松的 `O(G+S)` 收紧为 `O(G)`，并同步 normalized。
3. 修正 10-03 交换段证据 ID：规则/反设、交换、大小 `k` 收束、A/O 模板和 MST/最短路分别落到正确证据。
4. 补回 10-02 屏幕注释漏掉的“能”字，并保留注释与真实状态之间的语义差异。
5. 把 DP 的信息压缩从“无丢弃”改为“同一结尾只保留最优长度，仍保留每个结尾状态”。
6. 把 392 的“题名级”错误收窄为“题面和示例已展示，但无题解/代码”。
7. 为跨课模式、回访与对照补齐编辑推断来源标签。
8. 将 `09-05 → 10-03` 从与 rationale 不一致的 `contrasts_with` 调整为 `revisits`；补足 `10-02 → 10-03` 目标侧证明证据。
9. 收窄 Assign Cookies 已处理前缀与 10-03“一步交换”的表述，避免把相对剩余资源或当前步骤误写成全局结论。
10. 修复 Markdown 表格格式及 progress 的章数/verified 关系数漂移，最终门禁通过。

## 最终哈希

```text
chapter-10.md  e52cb9874b628627c04b1b5a95b9d7351578c58234033ec4241257ecc0d574f4
10-01 normalized  28668bb794d13b3bbeeeec2fbfbc9adca12cf61a1f9355af1091eba3ad85edc8
10-02 normalized  6268b444de2ed4b2fb5e9d87ab2deeb54ac3cadd4873c25805649dadc71fffec
10-03 normalized  2e8b69ce8759deefaa822cc7e19943ea1ad8a1a2f885fab32040b3d771970848
relationships.json  d358e70d0f4e7145ad389ace1193de1341e613a5d7d3dabdb8477312cd3d8461
progress.json       680d9daa536daffbb4c840f0c4dd90ab67bcff30823abad4d953f8ba11816b96
manifest.json       0e254580eb3ed07ad14bfe5ab1f33789833757df24833837a43ca9d64f100ba7
```

第 10 章综述在当前版本可以进入提交阶段。
