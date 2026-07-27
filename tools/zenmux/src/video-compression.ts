import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname, extname, parse, resolve } from "node:path";
import { isRemoteInput } from "./files.js";

export const VIDEO_COMPRESSION_LEVELS = [
  "none",
  "light",
  "balanced",
  "strong",
] as const;

export type VideoCompressionLevel = (typeof VIDEO_COMPRESSION_LEVELS)[number];
export type ActiveVideoCompressionLevel = Exclude<
  VideoCompressionLevel,
  "none"
>;

export interface VideoCompressionPreset {
  maxWidth: number;
  maxHeight: number;
  maxFrameRate: number;
  crf: number;
  audioBitrate: string;
  maxAudioChannels: number;
}

export const VIDEO_COMPRESSION_PRESETS: Record<
  ActiveVideoCompressionLevel,
  VideoCompressionPreset
> = {
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
};

export interface VideoSourceInfo {
  width: number;
  height: number;
  frameRate?: number;
  audioChannels?: number;
}

export interface ResolvedCompressionRequest {
  inputPath: string;
  outputPath: string;
  level: ActiveVideoCompressionLevel;
}

export interface CompressionResult extends ResolvedCompressionRequest {
  inputBytes: number;
  outputBytes: number;
  source: VideoSourceInfo;
}

interface ProbeStream {
  codec_type?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  channels?: number;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
}

interface ProbeOutput {
  streams?: ProbeStream[];
}

interface ProcessOutput {
  stdout: string;
  stderr: string;
}

const formatMegabytes = (bytes: number): string =>
  `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function parseVideoCompressionLevel(
  value: string,
): VideoCompressionLevel {
  if ((VIDEO_COMPRESSION_LEVELS as readonly string[]).includes(value)) {
    return value as VideoCompressionLevel;
  }
  throw new Error(
    `Invalid compression level "${value}". Choose one of: ${VIDEO_COMPRESSION_LEVELS.join(
      ", ",
    )}.`,
  );
}

export function defaultCompressedOutputPath(
  input: string,
  level: ActiveVideoCompressionLevel,
): string {
  const source = parse(input);
  return resolve("work", "zenmux-compressed", `${source.name}-${level}.mp4`);
}

export function resolveCompressionRequest(options: {
  input: string;
  level: VideoCompressionLevel;
  output?: string;
}): ResolvedCompressionRequest | undefined {
  if (options.level === "none") {
    if (options.output) {
      throw new Error(
        "--compressed-out requires --compress light, balanced, or strong.",
      );
    }
    return undefined;
  }

  if (isRemoteInput(options.input)) {
    throw new Error(
      "Video compression only supports a local video file; URLs and data URLs are already remote inputs.",
    );
  }

  const inputPath = resolve(options.input);
  const outputPath = options.output
    ? resolve(options.output)
    : defaultCompressedOutputPath(options.input, options.level);
  const comparableInput =
    process.platform === "win32" ? inputPath.toLowerCase() : inputPath;
  const comparableOutput =
    process.platform === "win32" ? outputPath.toLowerCase() : outputPath;

  if (comparableInput === comparableOutput) {
    throw new Error(
      "The compressed output must differ from the input; the original video is never overwritten.",
    );
  }
  if (extname(outputPath).toLowerCase() !== ".mp4") {
    throw new Error("--compressed-out must use an .mp4 filename.");
  }

  return { inputPath, outputPath, level: options.level };
}

export function fitVideoDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(`Invalid video dimensions: ${width}x${height}.`);
  }

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  const evenWidth = Math.max(2, Math.floor((width * scale) / 2) * 2);
  const evenHeight = Math.max(2, Math.floor((height * scale) / 2) * 2);
  return { width: evenWidth, height: evenHeight };
}

const parseFrameRate = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const [numeratorText, denominatorText = "1"] = value.split("/");
  const numerator = Number.parseFloat(numeratorText ?? "");
  const denominator = Number.parseFloat(denominatorText);
  const frameRate = numerator / denominator;
  return Number.isFinite(frameRate) && frameRate > 0 ? frameRate : undefined;
};

const displayDimensions = (
  stream: ProbeStream,
): { width: number; height: number } | undefined => {
  if (!stream.width || !stream.height) return undefined;
  const rotationValue =
    stream.side_data_list?.find((data) => data.rotation !== undefined)
      ?.rotation ?? Number.parseFloat(stream.tags?.rotate ?? "0");
  const normalizedRotation =
    (((Number.isFinite(rotationValue) ? rotationValue : 0) % 360) + 360) % 360;
  const swapsDimensions =
    normalizedRotation === 90 || normalizedRotation === 270;
  return swapsDimensions
    ? { width: stream.height, height: stream.width }
    : { width: stream.width, height: stream.height };
};

const runCapturedProcess = (
  command: string,
  args: string[],
): Promise<ProcessOutput> =>
  new Promise((resolveProcess, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      reject(
        new Error(
          `Could not start ${command}: ${error.message}. Install FFmpeg and ensure ${command} is on PATH.`,
        ),
      );
    });
    child.once("close", (code) => {
      if (code === 0) {
        resolveProcess({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${command} exited with code ${code ?? "unknown"}: ${stderr.trim() || "no error output"}`,
          ),
        );
      }
    });
  });

export async function probeLocalVideo(
  inputPath: string,
): Promise<VideoSourceInfo> {
  const { stdout } = await runCapturedProcess("ffprobe", [
    "-v",
    "error",
    "-show_streams",
    "-print_format",
    "json",
    inputPath,
  ]);
  const probe = JSON.parse(stdout) as ProbeOutput;
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const dimensions = video ? displayDimensions(video) : undefined;
  if (!video || !dimensions) {
    throw new Error(
      `${inputPath} does not contain a readable video stream. Compression is only available for local videos.`,
    );
  }
  const audio = probe.streams?.find((stream) => stream.codec_type === "audio");
  return {
    ...dimensions,
    frameRate:
      parseFrameRate(video.avg_frame_rate) ??
      parseFrameRate(video.r_frame_rate),
    audioChannels: audio?.channels,
  };
}

export function buildFfmpegArguments(options: {
  inputPath: string;
  outputPath: string;
  level: ActiveVideoCompressionLevel;
  source: VideoSourceInfo;
}): string[] {
  const preset = VIDEO_COMPRESSION_PRESETS[options.level];
  const dimensions = fitVideoDimensions(
    options.source.width,
    options.source.height,
    preset.maxWidth,
    preset.maxHeight,
  );
  const filters: string[] = [];
  if (
    dimensions.width !== options.source.width ||
    dimensions.height !== options.source.height
  ) {
    filters.push(
      `scale=${dimensions.width}:${dimensions.height}:flags=lanczos`,
    );
  }
  if (
    options.source.frameRate &&
    options.source.frameRate > preset.maxFrameRate
  ) {
    filters.push(`fps=${preset.maxFrameRate}`);
  }

  const effectiveFrameRate = Math.min(
    options.source.frameRate ?? preset.maxFrameRate,
    preset.maxFrameRate,
  );
  const targetAudioChannels = options.source.audioChannels
    ? Math.min(options.source.audioChannels, preset.maxAudioChannels)
    : preset.maxAudioChannels;

  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "warning",
    "-stats",
    "-n",
    "-i",
    options.inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    ...(filters.length > 0 ? ["-vf", filters.join(",")] : []),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    String(preset.crf),
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-g",
    String(Math.max(1, Math.round(effectiveFrameRate * 10))),
    "-c:a",
    "aac",
    "-b:a",
    preset.audioBitrate,
    "-ac",
    String(targetAudioChannels),
    "-movflags",
    "+faststart",
    options.outputPath,
  ];
}

const runFfmpeg = (args: string[]): Promise<void> =>
  new Promise((resolveProcess, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    let stderrTail = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      process.stderr.write(chunk);
      stderrTail = `${stderrTail}${chunk}`.slice(-16_000);
    });
    child.once("error", (error) => {
      reject(
        new Error(
          `Could not start ffmpeg: ${error.message}. Install FFmpeg and ensure ffmpeg is on PATH.`,
        ),
      );
    });
    child.once("close", (code) => {
      if (code === 0) {
        resolveProcess();
      } else {
        reject(
          new Error(
            `FFmpeg exited with code ${code ?? "unknown"}: ${stderrTail.trim() || "no error output"}`,
          ),
        );
      }
    });
  });

const assertOutputDoesNotExist = async (outputPath: string): Promise<void> => {
  try {
    await access(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  throw new Error(
    `Compressed output already exists: ${outputPath}. Choose another --compressed-out path to avoid overwriting it.`,
  );
};

export async function compressLocalVideo(
  request: ResolvedCompressionRequest,
): Promise<CompressionResult> {
  await assertOutputDoesNotExist(request.outputPath);
  const source = await probeLocalVideo(request.inputPath);
  const inputStats = await stat(request.inputPath);
  await mkdir(dirname(request.outputPath), { recursive: true });
  const outputName = parse(request.outputPath).name;
  const temporaryOutputPath = resolve(
    dirname(request.outputPath),
    `.${outputName}-${randomUUID()}.tmp.mp4`,
  );

  console.error(
    `Compressing local video (${request.level}): ${request.inputPath}`,
  );
  console.error(`Compressed copy: ${request.outputPath}`);
  try {
    await runFfmpeg(
      buildFfmpegArguments({
        ...request,
        outputPath: temporaryOutputPath,
        source,
      }),
    );
    try {
      await copyFile(
        temporaryOutputPath,
        request.outputPath,
        fsConstants.COPYFILE_EXCL,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(
          `Compressed output appeared while encoding: ${request.outputPath}. It was left untouched; choose another --compressed-out path.`,
          { cause: error },
        );
      }
      throw error;
    }
  } finally {
    await rm(temporaryOutputPath, { force: true });
  }

  const outputStats = await stat(request.outputPath);
  const reductionPercent =
    inputStats.size > 0 ? (1 - outputStats.size / inputStats.size) * 100 : 0;
  const sizeChange =
    reductionPercent >= 0
      ? `${reductionPercent.toFixed(1)}% smaller`
      : `${Math.abs(reductionPercent).toFixed(1)}% larger`;
  console.error(
    `Compression complete: ${formatMegabytes(inputStats.size)} -> ${formatMegabytes(
      outputStats.size,
    )} (${sizeChange}).`,
  );

  return {
    ...request,
    inputBytes: inputStats.size,
    outputBytes: outputStats.size,
    source,
  };
}
