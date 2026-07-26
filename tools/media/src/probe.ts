import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { Command } from "commander";

interface ProbeStream {
  codec_name?: string;
  codec_type?: string;
  duration?: string;
  height?: number;
  r_frame_rate?: string;
  sample_rate?: string;
  width?: number;
}

interface ProbeResult {
  format?: {
    duration?: string;
    format_long_name?: string;
    format_name?: string;
    size?: string;
  };
  streams?: ProbeStream[];
}

const program = new Command()
  .name("media:probe")
  .description(
    "Inspect a media file with FFprobe and validate basic expectations",
  )
  .argument("<file>", "audio or video file")
  .option(
    "--expect-ratio <ratio>",
    "expected width:height ratio, for example 9:16",
  )
  .option("--expect-duration <seconds>", "expected duration")
  .option(
    "--duration-tolerance <seconds>",
    "allowed duration difference",
    "0.25",
  )
  .option("--raw", "print the complete FFprobe JSON", false);

program.action(
  (
    file: string,
    options: {
      expectRatio?: string;
      expectDuration?: string;
      durationTolerance: string;
      raw: boolean;
    },
  ) => {
    const absolutePath = resolve(file);
    const result = spawnSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-print_format",
        "json",
        absolutePath,
      ],
      { encoding: "utf8" },
    );

    if (result.error || result.status !== 0) {
      const reason = result.error?.message || result.stderr || "unknown error";
      throw new Error(
        `FFprobe failed: ${reason}\nInstall FFmpeg and ensure ffprobe is on PATH.`,
      );
    }

    const probe = JSON.parse(result.stdout) as ProbeResult;
    if (options.raw) {
      process.stdout.write(`${JSON.stringify(probe, null, 2)}\n`);
      return;
    }

    const streams = probe.streams ?? [];
    const video = streams.find((stream) => stream.codec_type === "video");
    const audio = streams.find((stream) => stream.codec_type === "audio");
    const duration = Number.parseFloat(probe.format?.duration ?? "0");
    const summary = {
      path: absolutePath,
      format: probe.format?.format_name,
      durationSeconds: duration,
      sizeBytes: Number.parseInt(probe.format?.size ?? "0", 10),
      video: video
        ? {
            codec: video.codec_name,
            width: video.width,
            height: video.height,
            frameRate: video.r_frame_rate,
          }
        : null,
      audio: audio
        ? {
            codec: audio.codec_name,
            sampleRate: audio.sample_rate,
          }
        : null,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

    const failures: string[] = [];
    if (options.expectRatio) {
      if (!video?.width || !video.height) {
        failures.push("expected a video stream, but none was found");
      } else {
        const [expectedWidth, expectedHeight] = options.expectRatio
          .split(":")
          .map(Number);
        if (
          !expectedWidth ||
          !expectedHeight ||
          Math.abs(
            video.width / video.height - expectedWidth / expectedHeight,
          ) > 0.01
        ) {
          failures.push(
            `expected ratio ${options.expectRatio}, got ${video.width}:${video.height}`,
          );
        }
      }
    }

    if (options.expectDuration) {
      const expected = Number.parseFloat(options.expectDuration);
      const tolerance = Number.parseFloat(options.durationTolerance);
      if (Math.abs(duration - expected) > tolerance) {
        failures.push(
          `expected duration ${expected}s ±${tolerance}s, got ${duration}s`,
        );
      }
    }

    if (failures.length > 0) {
      throw new Error(failures.join("; "));
    }
  },
);

await program.parseAsync();
