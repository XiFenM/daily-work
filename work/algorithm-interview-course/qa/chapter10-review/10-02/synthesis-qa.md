# 10-02 人工校准与正式笔记 QA

- 校准时间（UTC）：`2026-08-03T02:45:28Z`
- 外部调用/素材上传：无
- 正式笔记：`projects/algorithm-interview-course/notes/lessons/10-02.md`
- 校准证据：`outputs/algorithm-interview-course/understanding/normalized/10-02.json`

## 必查结论

- 两份 `codeArtifacts.verification` 均为 `tested`。
- `memo[i]` 已校准为“必须以排序后 `intervals[i]` 结尾”；正式笔记保留屏幕注释原文并显式解释其宽泛表述与实际转移的差异。
- 模型臆造的反向区间澄清问题已从 normalized 删除；笔记只说明不得凭空增加课程未提出的预处理。
- Greedy 正确性保持 `partial`，并登记 `greedy_choice`、`exchange_step` 两项待证义务；没有用测试结果替代 10-03 的形式化证明。
- 已记录 9 个代表用例、111,111 个穷举 oracle 输入、ASan/UBSan 通过、15 条屏幕算法严格类型告警及缺少显式 `<algorithm>`。
- DP 与 greedy 排序比较器、端点 `>=` 语义、空输入、状态、转移、答案和复杂度来源边界均已复核。

## 自动检查

- JSON Schema Draft 2020-12：PASS。
- normalized evidence 引用：PASS，92 次引用均落在本课 10 个 evidence ID 中。
- 笔记 evidence 引用：PASS，共使用本课全部 10 个 evidence ID。
- Prettier：PASS。
- C++17 ASan/UBSan：PASS。
- 代表用例：`9/9` PASS。
- 穷举 oracle：DP `111111/111111`、greedy `111111/111111` PASS。

## 内容哈希

- normalized：`6268b444de2ed4b2fb5e9d87ab2deeb54ac3cadd4873c25805649dadc71fffec`
- 正式笔记：`6186e3f80ccf30c49d58fbcddd92eb23d403d5c5983d4007e953e6103d4b2867`
- 测试外壳：`c88284517a9084b0ded52e2fba0e4b9ec7b6db457e305c13ac9e2dc023bc6327`

## 未在本子任务修改

未修改 manifest、progress、concepts、relationships、README、章综述或其他课次文件；未提交 Git。
