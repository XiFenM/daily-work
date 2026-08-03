# 处理流程

## 数据位置

```text
projects/algorithm-interview-course/       可版本控制的项目事实、Prompt 和正式笔记
work/algorithm-interview-course/incoming/  用户上传并保留不动的原始素材；映射状态记录在 source-catalog
work/algorithm-interview-course/compressed/视频理解用压缩副本
work/algorithm-interview-course/prompts/   为单次调用渲染后的 Prompt
outputs/algorithm-interview-course/
  understanding/raw/                       视频理解原始输出与响应 JSON
  understanding/normalized/                通过本地结构和证据门禁的规范化 JSON
  understanding/retries/                   有明确原因的重试输出
  reports/                                 可再生成的中间报告
```

`work/` 和 `outputs/` 都被 Git 忽略。原始课程素材需要另行备份，不能把 Git 忽略当作备份。

## 阶段 1：素材盘点与映射

1. 对上传文件做只读清点，不移动或覆盖原件。
2. 计算 SHA-256，识别重复文件。
3. 使用 FFprobe 记录视频时长、画面尺寸、编码和音轨。
4. 按以下顺序映射课次：
   - 文件名中的课次编号；
   - 标题关键词；
   - 实际时长作为辅助证据；
   - 必要时查看开头画面、字幕或语音。
5. 时长不能作为唯一匹配依据。低置信度或一对多映射进入人工复核。
6. 将结果写入 `inputs/source-catalog.json` 和 `progress.json`。

目录中的 `01-01`、`06-08`、`07-03`、`09-10` 没有给出时长，不能预设它们一定是视频或文本。

## 阶段 2：代表性课次校准

课程按章节顺序推进；每一章扩大调用前，先从本章选择能暴露新结构风险的代表课完成校准。跨课程预先识别的三个校准点是：

- `01-03`：方法论型讲解，已在第一章完成；
- `03-01`：代码、边界和不变量，已在第三章完成；
- `09-05`：长时长、公式与状态转移，到达第九章时校准。

不需要为了按章处理而提前调用未来章节；例如第二章先用实验、公式和多对象最密集的 `02-04` 校准 v1.3 证据结构，再处理本章其余课次。如果上传文件不完整，则从已到位素材中选最接近的代表课。校准项包括：

- 时间戳准确性；
- 代码/OCR 可靠性；
- 复杂度和正确性论证是否充分；
- 非题解课程是否被错误套模板；
- 中文笔记的可读性和长度；
- 单次成本、响应稳定性和模型输入限制。

只有当前批次的新结构校准通过后才扩大该批次范围。第九章已使用 `09-05` 完成 v1.6 校准并据此处理本章其余视频。

## 阶段 3：视频证据抽取

1. 从 `prompts/video-evidence-v1.7.template.md` 渲染当前课次专用 Prompt。v1.2 在 v1.1 基础上增加多复杂度结论、公式和实验结构；v1.3 进一步收紧时间上限、对象结构、正确性方法和关系候选字段；v1.4 为代码密集课程增加解法—代码—状态模型引用、区间/指针/窗口语义和分阶段正确性义务；v1.5 进一步要求顶层只能是 JSON 对象，并补充递归契约、候选域、选择—递归—撤销和访问标记生命周期规则；v1.6 为动态规划课程增加递归/记忆化/自底向上/空间压缩版本分离、状态定义与转移、初始化与遍历顺序、0-1 背包二维/一维语义、LIS/LCS/最短路与具体解恢复的证据规则；v1.7 为贪心课程增加候选排序与 tie-break、区间端点语义、循环不变量、交换论证/领先性证明义务、贪心选择性质与最优子结构区分、规则级反例边界及与动态规划的对照。历史调用继续保留原 Prompt 与哈希，渲染脚本仍支持显式选择 v1.3、v1.4、v1.5、v1.6 或 v1.7。
2. 本地视频先结合大小与画面可读性评估是否压缩：超过 50 MB 时默认尝试 `balanced`，副本写到明确的课次路径；远低于上限且无需降质时可以 `--compress none` 直接使用原片。无论哪种方式都必须先 `--dry-run`，且不得覆盖原片。
3. 原片永不覆盖；已有压缩副本先校验哈希和参数，不静默重建。manifest 使用 `requestMedia`、`requestMediaBytes` 和 `requestMediaSha256` 区分正式调用实际使用的是 `source` 还是 `derivative`，只有衍生副本才列入 generation outputs。
4. 调用示例：

```bash
ZENMUX_BASE_URL="https://zenmux.dev/api/v1" pnpm zenmux understand \
  --input "work/algorithm-interview-course/incoming/9-5 0-1背包问题_慕课网.mp4" \
  --prompt-file "work/algorithm-interview-course/prompts/09-05-video-evidence-v1.6.md" \
  --model "<live-video-capable-model>" \
  --extra-file "projects/algorithm-interview-course/configs/zenmux-json-object-extra.json" \
  --compress balanced \
  --compressed-out "work/algorithm-interview-course/compressed/09-05-balanced.mp4" \
  --out "outputs/algorithm-interview-course/understanding/raw/09-05.json"
```

模型必须从实时目录中确认支持 `video` 或适用的 `file` 输入。仓库 CLI 会把本地文件整体读入内存并编码为 Base64，默认上限 50 MB；不要仅靠大幅提高 `--max-local-mb` 处理超大文件。

`configs/zenmux-json-object-extra.json` 要求模型返回 JSON object，但它只保证 JSON 语法，不代替本地 schema 门禁。第二章校准时，`google/gemini-3.6-flash` 对完整课程 schema 的 `json_schema` 请求因嵌套深度和受支持关键字限制返回 HTTP 400，因此当前组合使用：

1. `response_format: {"type": "json_object"}` 约束输出为 JSON；
2. v1.7 Prompt 明确所有必填对象、枚举、视频时长上限、顶层对象边界、解法—代码—状态模型引用关系，以及动态规划和贪心的状态、转移、遍历/排序顺序、正确性与复杂度证据边界；
3. `normalize-lesson-evidence.mjs` 严格检查课次 ID、时长、证据引用、时间边界、对象形状、跨对象引用和正确性方法；v1.4 及以后版本的循环不变量还必须具有初始化、保持、终止和后置条件证据；v1.6 在第 9 章额外要求 `intermediate`/`optimized` 或含代码的解法绑定含变量/区域与转移的状态模型，但允许只被描述或否定且无代码的 `baseline`/`alternative`/`observation` 不补造状态；v1.7 在第 10 章延续状态门禁，并要求 `correctness.completeness` 显式区分完整、部分和不适用：交换论证、领先性、循环不变量或归纳证明只有全部直接证据义务齐全时才能标记 `complete`，否则必须标记 `partial`。v1.7 的 `not_applicable` 方法与完整度必须在所有章节一致；纯结语且没有算法结构时必须使用 `not_applicable/not_applicable`；
4. `validate-project.mjs` 对 manifest、规范化证据、笔记和关系图做跨文件对账。

`build-response-format.mjs` 只用于评估某个供应商是否能无损表达 canonical schema；遇到供应商不支持的多类型 union 时会明确失败，不会静默选择其中一种类型生成有损 schema。

规范化示例：

```bash
node projects/algorithm-interview-course/scripts/normalize-lesson-evidence.mjs \
  --input "outputs/algorithm-interview-course/understanding/raw/09-05.json" \
  --response "outputs/algorithm-interview-course/understanding/raw/09-05.json.response.json" \
  --out "outputs/algorithm-interview-course/understanding/normalized/09-05.json" \
  --lesson "09-05" \
  --chapter "09" \
  --asset-id "asset:video-09-05" \
  --duration "<ffprobe-seconds>" \
  --prompt-version "video-evidence-v1.6"
```

每一次尝试都必须写入 `manifest.json` 的 `attempts`，包括 HTTP、网络和本地门禁失败；得到模型响应的尝试同时写入 `generations` 并标记 `accepted` 或 `rejected`。成功课次可使用 `register-understanding.mjs` 登记请求 ID、模型、输入输出、Prompt/压缩哈希和 token 用量。CLI 本身不会自动修改 manifest。

`register-understanding.mjs` 只接受已完成人工 QA 的结果：人工核对代码关键 token、区间/指针/窗口/回溯/动态规划/贪心状态语义、初始化、遍历或排序方向、tie-break、端点语义、证明完整度和关键时间戳后，必须显式传入 `--qa-reviewed true`；省略该参数或传入其他值都会拒绝注册，不会写入 manifest/progress。项目验收还会要求所有已接受的 v1.4/v1.5/v1.6/v1.7 尝试都具有 `validation.qaStatus: "completed"`，并要求每份状态为 `lessonNote: "completed"` 的笔记同时具有 `qa: "completed"`。

代码验证状态分成两层：Prompt 与 normalizer 要求模型抽取结果中的 `codeArtifacts[].verification` 固定为 `not_run`，防止模型把课程现场运行或平台 Accepted 冒充本项目验证；人工 QA 若随后确实在本机完成语法编译或代表性测试，可以把 **normalized 证据**中的状态提升为 `compiled` 或 `tested`，并在正式笔记中记录脚手架、覆盖范围与未验证项。不得只依据视频画面提升本地验证状态。

## 阶段 4：文本证据与单课笔记

1. 对映射到当前课次的配套文本做段落级索引。
2. 使用 `lesson-synthesis-v1.template.md` 合并视频证据、文本证据和少量先修 lesson card。
3. 正式笔记写入 `notes/lessons/<lesson-id>.md`。
4. 每个重要结论标记来源：
   - `[视频 00:12:34]`
   - `[文本 asset-id §段落]`
   - `[整理推导]`
   - `[补充说明]`
5. 来源冲突时并列记录，不擅自替老师裁决。

## 阶段 5：关系裁决与章节校准

1. 目录推断出的关系一律以 `provisional` 开始。
2. 当前课只检索全课程目录、当前章摘要、直接先修的 lesson card 和 3–8 个候选关联课，避免把全部长笔记塞入上下文。
3. 使用 `relationship-extraction-v1.template.md` 判断关系方向、类型、强度和证据。
4. `prerequisite_of` 必须保持无环；仅相邻不代表硬先修。
5. 每章完成后使用 `chapter-synthesis-v1.template.md`：
   - 合并同义概念；
   - 统一复杂度和模式命名；
   - 删除重复或过强的边；
   - 识别后课对前课的扩展、修正或对照。

## 阶段 6：质量检查与最终交付

- 课次数量、素材数量、输出数量和 manifest 记录对账。
- 对每课抽查时间戳、题目约束、复杂度、代码来源和不确定项。
- 检查术语、LeetCode 题名和中英文命名的一致性，但保留原始目录标题。
- 对屏幕代码，只有通过本地编译/测试后才能标记为“已验证”。
- 生成章节综述、题型簇索引、算法模板索引、易混淆概念对照和全课程复习路线。
- 每章结束运行 `node projects/algorithm-interview-course/scripts/validate-project.mjs`，对账课次、素材、规范化证据、manifest、正式笔记、关系边与概念证据引用。

## 最终完成状态

全课程 70 节课已经走完阶段 1–6：

- 67 个视频完成 SHA-256、FFprobe 和画面抽样，`06-08`、`07-03`、`09-10` 三篇文本完成哈希与段落证据校验；
- 67 个视频完成 ZenMux 视频理解、规范化证据、本地结构门禁和人工证据 QA，3 篇文本完成本地规范化证据；
- 70 份单课笔记、11 份章节综述和 1 份全课程综合已经完成；
- 概念词表含 150 个已验证节点；关系图含 97 条边，其中 96 条已验证、1 条待确认；
- 原始响应、失败尝试、规范化证据、请求 ID、Prompt、输入选择和已知 token 用量均审计到 `manifest.json`；
- 全部 67 个视频实测总时长为 66,665.61756 秒，约 18:31:06；3 篇文本教程没有视频时长，因此项目总时长字段保持未知。

最终 manifest 对账为 81 次尝试、78 次到达服务端并产出 generation、63 个 accepted attempt、11 个 rejected attempt 和 7 次 transport failure。第一章 4 个成功 generation 产生于 attempt 审计结构启用之前；加上它们后，67 个视频各有 1 个正式 accepted 结果。被拒绝或传输失败的尝试均保留审计记录，不参与正式笔记综合。

第十一章 11-01 在用户明确授权上传后，以 13,098,626 B 原片进行 1 次正式理解调用：模型 `google/gemini-3.6-flash`，请求 ID `82e83d77452344108d9a09a1b643a1b6`，合计 27,062 tokens；因为原片低于 50 MB 门槛，未使用压缩衍生文件，也没有重试。结语没有算法、代码或复杂度内容，规范化结构保持 `not_applicable/not_applicable`；人工 QA 纠正画面标题为“玩儿转算法面试”，将公司题型概括和课程维护计划限定为录制时观点，并确认本课没有重新定义 online judge 机制。

课程级交付物位于 `notes/course-synthesis.md`。它只在主知识地图中使用已验证关系，将唯一 provisional 关系单独列出，并明确区分课程直接内容与编辑综合。
