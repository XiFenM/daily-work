# 09-02 人工 QA 报告

## 范围

- 课次：`09-02 第一个动态规划问题 Climbing Stairs`
- 原片：`work/algorithm-interview-course/incoming/9-2 第一个动态规划问题 Climbing Stairs_慕课网.mp4`
- 实测时长：`842.680 s`
- 规范化证据：`outputs/algorithm-interview-course/understanding/normalized/09-02.json`
- 正式笔记：`projects/algorithm-interview-course/notes/lessons/09-02.md`
- 检查日期：2026-08-03

## 视觉与内容复核

- 检查了初始联系表、`contact-35s.jpg` 和覆盖全部章节边界的定向帧。
- 题面明确保证 `n>0`；代码递归内部使用 `n=0` 状态，基本值为 1。
- 三版屏幕代码分别为纯递归、`vector<int> memo` 记忆化、自底向上填表；关键 token、初始化与循环方向均回到原片核对。
- 课后练习确认为 LeetCode 120 `Triangle` 和 64 `Minimum Path Sum`。
- Minimum Path Sum 结尾确实追问移除“非负”或“只能右/下”限制会有什么影响。
- 没有可见证据证明课程直接衔接 Integer Break，因此 `09-02 → 09-03` 关系降为编辑性候选。

## 代码复核

编译选项：`clang++ -std=c++11 -Wall -Wextra -pedantic`。

| 代码       | 代表测试          | 结果     | 规范化状态 |
| ---------- | ----------------- | -------- | ---------- |
| `code-001` | `n=1,2,3,5,10`    | 全部通过 | `tested`   |
| `code-002` | `n=1,2,3,5,10,45` | 全部通过 | `tested`   |
| `code-003` | `n=1,2,3,5,10,45` | 全部通过 | `tested`   |

屏幕 DP 在公开契约 `n>0` 下通过；若扩展接口至 `n=0`，会写越界。该事项作为扩展边界记录，没有把公开题解误判为失败。

## 证据与复杂度结论

- 本课没有直接口述渐进时间或空间复杂度；normalized 保持 `null`。
- 笔记中的纯递归 `O(2^n)`、记忆化/DP `O(n)` 及空间分析均标为 `editorial_inference`。
- 课程没有展示滚动变量空间压缩。

## 修改边界与未验证项

- raw 响应、原片和压缩片未修改。
- 仅修订 normalized 的状态模型、正确性义务、验证状态、关系证据与边界说明。
- 未进行 LeetCode 提交，未测试整数溢出后的行为或其他编译器。

## 自动校验

- canonical JSON Schema：通过。
- normalized 证据 ID 引用与时间上限检查：通过。
- 正式笔记 Prettier：通过。
- `git diff --check`：通过。
- 项目级 `validate-project.mjs` 已运行；当前仅因第九章 10 课尚在并行登记，报告 raw 尚未写入 manifest，以及 progress/章节综述/关系数量尚未回填。没有报告本课 schema、证据引用或笔记错误。
