import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  VIDEO_COMPRESSION_PRESETS,
  buildFfmpegArguments,
  defaultCompressedOutputPath,
  fitVideoDimensions,
  parseVideoCompressionLevel,
  resolveCompressionRequest,
} from "./video-compression.js";

const optionValue = (args: string[], option: string): string | undefined => {
  const index = args.indexOf(option);
  return index >= 0 ? args[index + 1] : undefined;
};

describe("ZenMux video compression", () => {
  it("exposes stable compression presets", () => {
    expect(VIDEO_COMPRESSION_PRESETS).toEqual({
      light: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 25,
        crf: 24,
        audioBitrate: "96k",
        maxAudioChannels: 2,
      },
      balanced: {
        maxWidth: 1280,
        maxHeight: 720,
        maxFrameRate: 15,
        crf: 26,
        audioBitrate: "64k",
        maxAudioChannels: 1,
      },
      strong: {
        maxWidth: 960,
        maxHeight: 540,
        maxFrameRate: 10,
        crf: 28,
        audioBitrate: "48k",
        maxAudioChannels: 1,
      },
    });
  });

  it("validates compression levels", () => {
    expect(parseVideoCompressionLevel("none")).toBe("none");
    expect(parseVideoCompressionLevel("balanced")).toBe("balanced");
    expect(() => parseVideoCompressionLevel("extreme")).toThrow(
      /none, light, balanced, strong/,
    );
  });

  it("derives a Unicode-safe output path without replacing the input", () => {
    const input = resolve("work", "课程 视频.mp4");
    expect(defaultCompressedOutputPath(input, "strong")).toBe(
      resolve("work", "zenmux-compressed", "课程 视频-strong.mp4"),
    );
    expect(resolveCompressionRequest({ input, level: "strong" })).toEqual({
      inputPath: input,
      outputPath: resolve("work", "zenmux-compressed", "课程 视频-strong.mp4"),
      level: "strong",
    });
  });

  it("rejects unsafe or inapplicable compression combinations", () => {
    expect(
      resolveCompressionRequest({ input: "work/video.mp4", level: "none" }),
    ).toBeUndefined();
    expect(() =>
      resolveCompressionRequest({
        input: "work/video.mp4",
        level: "none",
        output: "work/copy.mp4",
      }),
    ).toThrow(/--compressed-out requires/);
    expect(() =>
      resolveCompressionRequest({
        input: "https://example.com/video.mp4",
        level: "light",
      }),
    ).toThrow(/local video file/);
    expect(() =>
      resolveCompressionRequest({
        input: "data:video/mp4;base64,AAAA",
        level: "light",
      }),
    ).toThrow(/local video file/);
    expect(() =>
      resolveCompressionRequest({
        input: "work/video.mp4",
        level: "strong",
        output: "work/video.mp4",
      }),
    ).toThrow(/never overwritten/);
    expect(() =>
      resolveCompressionRequest({
        input: "work/video.mp4",
        level: "strong",
        output: "work/video.webm",
      }),
    ).toThrow(/\.mp4 filename/);
  });

  it("fits dimensions inside a preset without upscaling", () => {
    expect(fitVideoDimensions(1920, 1080, 1280, 720)).toEqual({
      width: 1280,
      height: 720,
    });
    expect(fitVideoDimensions(640, 360, 1280, 720)).toEqual({
      width: 640,
      height: 360,
    });
    expect(fitVideoDimensions(1080, 1920, 1280, 720)).toEqual({
      width: 404,
      height: 720,
    });
  });

  it("builds shell-safe strong compression arguments", () => {
    const inputPath = resolve("work", "中文 source video.mp4");
    const outputPath = resolve("work", "中文 output video.mp4");
    const args = buildFfmpegArguments({
      inputPath,
      outputPath,
      level: "strong",
      source: {
        width: 1920,
        height: 1080,
        frameRate: 25,
        audioChannels: 2,
      },
    });

    expect(optionValue(args, "-i")).toBe(inputPath);
    expect(args.at(-1)).toBe(outputPath);
    expect(optionValue(args, "-vf")).toBe("scale=960:540:flags=lanczos,fps=10");
    expect(optionValue(args, "-c:v")).toBe("libx264");
    expect(optionValue(args, "-crf")).toBe("28");
    expect(optionValue(args, "-pix_fmt")).toBe("yuv420p");
    expect(optionValue(args, "-g")).toBe("100");
    expect(optionValue(args, "-c:a")).toBe("aac");
    expect(optionValue(args, "-b:a")).toBe("48k");
    expect(optionValue(args, "-ac")).toBe("1");
    expect(optionValue(args, "-movflags")).toBe("+faststart");
    expect(args).toContain("0:a:0?");
  });

  it("does not add scale or fps filters for a smaller, slower source", () => {
    const args = buildFfmpegArguments({
      inputPath: resolve("work", "small.mp4"),
      outputPath: resolve("work", "small-light.mp4"),
      level: "light",
      source: {
        width: 640,
        height: 360,
        frameRate: 8,
        audioChannels: 1,
      },
    });

    expect(args).not.toContain("-vf");
    expect(optionValue(args, "-g")).toBe("80");
    expect(optionValue(args, "-ac")).toBe("1");
  });
});
