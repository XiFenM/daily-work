# 视频压缩格式说明

此目录保存课程原视频的视频理解衍生副本。所有 `*.mp4` 文件均为可重新生成的大型媒体，不纳入 Git；本说明以及此目录未来产生的 Markdown/JSON 过程记录可以纳入版本控制。

## 当前使用的压缩档位

本课程生成的正式压缩副本统一采用 ZenMux 工具的 `balanced` 档位，文件名为 `<课次>-balanced.mp4`。实际编码规则定义在 [`tools/zenmux/src/video-compression.ts`](../../../tools/zenmux/src/video-compression.ts)：

- 容器：MP4，启用 `+faststart`；
- 视频编码：H.264（`libx264`），`preset=medium`、`CRF=26`、High profile、`yuv420p`；
- 画面：按原始宽高比缩放到不超过 1280×720，不放大较小源；需要缩放时使用 Lanczos；
- 帧率：最高 15 fps，低帧率源保持原帧率；
- GOP：约 10 秒，即 `round(有效帧率 × 10)`；
- 音频编码：AAC，目标码率 64 kbit/s（`-b:a 64k`），最多单声道；没有音轨时允许仅保留视频；
- 流选择：第一条视频流和可选的第一条音频流；不复制字幕或其他数据流；
- 覆盖策略：永不覆盖原片，也不覆盖已存在的压缩文件。

67 个规范命名的 `*-balanced.mp4` 已逐一通过 FFprobe 复核，均为 H.264 High 1280×720、15 fps、`yuv420p`，音频为 AAC 44.1 kHz 单声道。第 1–10 章实际参与请求的 66 个副本，其大小与 SHA-256 均与 [`projects/algorithm-interview-course/manifest.json`](../../../projects/algorithm-interview-course/manifest.json) 一致；11-01 的正式请求使用原片。点号开头的 `.tmp.mp4` 是一次中断遗留的无效临时文件，不属于规范副本，也不纳入 Git。

## 生成方式

通过项目 CLI 生成，不直接手写临时 FFmpeg 命令：

```bash
pnpm zenmux understand --input "<原视频>" \
  --compress balanced \
  --compressed-out work/algorithm-interview-course/compressed/<课次>-balanced.mp4 \
  <其他理解参数>
```

CLI 会先读取源视频尺寸、帧率和声道数，再按上述上限构造 FFmpeg 参数。正式调用前应先使用 `--dry-run`；原视频低于上传门槛且无需降质时，也可以选择 `--compress none`，例如 11-01 的正式理解请求直接使用原片，其 balanced 文件仅是本地衍生副本。
