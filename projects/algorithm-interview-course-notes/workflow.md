# 处理工作流

## 总体策略

本项目分三层处理，避免把 70 节课程内容一次性塞入上下文：

1. **单节事实层**：每个视频或文章单独理解，输出详细笔记和候选关系；视频证据带时间戳，文章证据带段落定位。
2. **章节综合层**：只读取同章已经质检的单节笔记，整理概念演进、方法对照和章内关系。
3. **全课图谱层**：读取所有章节综合与必要的单节证据，生成跨章复习路线和知识关系图。

后两层不能改写第一层的事实。发现矛盾时应记录冲突并回查视频，而不是自动选一个说法。

## 状态流转

视频按以下顺序推进：

`awaiting_video` → `matched` → `probed` → `understood` → `reviewed`

- `awaiting_video`：只有大纲信息。
- `matched`：已把唯一的视频文件匹配到 lesson ID。
- `probed`：已记录 FFprobe 元数据并确认音视频可读取。
- `understood`：已有模型输出、原始响应和 manifest 记录。
- `reviewed`：格式、时间戳、内容覆盖与关系候选通过人工或代理复核。

章节内所有已确认课程达到 `reviewed` 后，才进入章节综合。整套课程完成后再生成全课综合。

文章使用 `matched` → `understood` → `reviewed`，不运行 FFprobe 或视频压缩。

## 视频到达后的预检

1. 扫描用户上传的视频，不依赖自然排序猜测顺序。
2. 优先用文件名中的 `1-1`、`2-3` 等编号匹配；标题只作为第二证据。
3. 对无法唯一匹配、重复编号或目录外视频列出冲突，不发起理解调用。
4. 对每个匹配视频运行：

   ```bash
   pnpm media:probe -- <video-path>
   ```

5. 将实际时长与大纲时长比较。差异明显时标记待核验，不能静默接受。
6. 根据实际文件大小和画面特点选择理解输入：
   - 课件、代码讲解通常从 `balanced` 开始；
   - 小字代码无法辨认时使用 `light`；
   - 文件仍超过内联限制时才考虑 `strong` 或提高明确的大小限制。

压缩副本放在 `work/algorithm-interview-course-notes/compressed/`，不覆盖原视频。

## 单节理解

使用 `prompts/lesson-understanding.md`，在调用前替换其中的占位符。先对第一节代表性视频运行 `--dry-run` 检查请求，再进行一次实际调用：

```bash
pnpm zenmux understand \
  --input "<video-path>" \
  --prompt "<rendered-prompt>" \
  --compress balanced \
  --compressed-out "work/algorithm-interview-course-notes/compressed/<lesson-id>.mp4" \
  --out "projects/algorithm-interview-course-notes/notes/lessons/<lesson-id>.md"
```

命令会在笔记旁保存原始响应 JSON。每次实际调用还必须向 `manifest.json` 追加 `understanding` 记录。

不要批量并发提交全部 70 节。先用一节验证格式、可读性、成本和时间戳质量，再按章小批量处理。

## 章节和全课综合

- 章节综合输入：本章全部已复核的单节笔记，加 `prompts/chapter-synthesis.md`。
- 全课综合输入：11 份章节综合、`notes/knowledge-graph.json` 和必要的单节证据，加 `prompts/course-synthesis.md`。
- 综合阶段发现的新关系先作为候选写入，只有证据完整后才进入知识图谱。

## 质检

单节质检至少检查：

- 视频 ID、标题和文件是否匹配；
- 时间线是否覆盖开头、中段和结尾，时间戳是否落在实际时长内；
- 是否把讲师内容和分析推断分开；
- 题目条件、算法步骤、复杂度和边界是否自洽；
- 是否有不受证据支持的跨视频断言；
- 机器可读的关系候选是否符合 `inputs/relation-model.json`。

项目级质检检查 70 节覆盖率、11 章覆盖率、重复概念归一化、孤立节点、冲突关系和未解决的不确定项。
