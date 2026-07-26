import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { Command } from "commander";
import { ZenMuxClient, type VideoJob } from "./client.js";
import {
  downloadToFile,
  inputFilename,
  isRemoteInput,
  redactLargePayloads,
  saveImageResponse,
  toDataUrl,
  writeJson,
} from "./files.js";

type JsonRecord = Record<string, unknown>;

const program = new Command()
  .name("zenmux")
  .description("Safe, scriptable ZenMux media and multimodal operations")
  .showHelpAfterError();

const parseJsonObject = (value: string): JsonRecord => {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("--extra must be a JSON object.");
  }
  return parsed as JsonRecord;
};

const requiredModel = (
  commandValue: string | undefined,
  environmentName: string,
): string => {
  const model = commandValue || process.env[environmentName];
  if (!model) {
    throw new Error(
      `Specify --model or set ${environmentName}. Use "pnpm zenmux models" to inspect the live catalog.`,
    );
  }
  return model;
};

const requireApiKey = (): string => {
  const key = process.env.ZENMUX_API_KEY;
  if (!key) {
    throw new Error(
      "ZENMUX_API_KEY is not set. Add it to .env locally; do not paste it into chat.",
    );
  }
  return key;
};

const createClient = (): ZenMuxClient =>
  new ZenMuxClient({
    apiKey: requireApiKey(),
    baseUrl: process.env.ZENMUX_BASE_URL,
  });

const printJson = (value: unknown): void => {
  process.stdout.write(
    `${JSON.stringify(redactLargePayloads(value), null, 2)}\n`,
  );
};

const dryRunOrClient = (
  dryRun: boolean,
  endpoint: string,
  payload: JsonRecord,
): ZenMuxClient | undefined => {
  if (dryRun) {
    printJson({ endpoint, payload });
    return undefined;
  }
  return createClient();
};

program
  .command("models")
  .description("List the live ZenMux model catalog")
  .option("-o, --out <path>", "also save the response as JSON")
  .action(async ({ out }: { out?: string }) => {
    const response = await createClient().listModels();
    printJson(response);
    if (out) {
      await writeJson(out, response);
    }
  });

program
  .command("chat")
  .description("Send a text chat-completion request")
  .requiredOption("-p, --prompt <text>", "user prompt")
  .option("-m, --model <slug>", "provider/model slug")
  .option("-s, --system <text>", "optional system message")
  .option("-o, --out <path>", "save response text")
  .option("--extra <json>", "additional request fields", parseJsonObject, {})
  .option("--dry-run", "print the request without calling the API", false)
  .action(
    async (options: {
      prompt: string;
      model?: string;
      system?: string;
      out?: string;
      extra: JsonRecord;
      dryRun: boolean;
    }) => {
      const messages = [
        ...(options.system
          ? [{ role: "system", content: options.system }]
          : []),
        { role: "user", content: options.prompt },
      ];
      const payload = {
        ...options.extra,
        model: requiredModel(options.model, "ZENMUX_CHAT_MODEL"),
        messages,
      };
      const client = dryRunOrClient(
        options.dryRun,
        `${process.env.ZENMUX_BASE_URL ?? "https://zenmux.ai/api/v1"}/chat/completions`,
        payload,
      );
      if (!client) return;

      const response = await client.chat(payload);
      const text = response.choices[0]?.message.content ?? "";
      process.stdout.write(`${text}\n`);
      if (options.out) {
        const outputPath = resolve(options.out);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, `${text}\n`, "utf8");
        await writeJson(`${outputPath}.response.json`, response);
      }
    },
  );

program
  .command("image")
  .description("Generate one or more images and save them locally")
  .requiredOption("-p, --prompt <text>", "image prompt")
  .option("-m, --model <slug>", "provider/model slug")
  .option("-o, --out <path>", "output image path", "outputs/images/image.png")
  .option("--size <size>", "image size", "1024x1024")
  .option("--quality <quality>", "low, medium, high, or auto", "auto")
  .option("--format <format>", "png, jpeg, or webp", "png")
  .option("-n, --count <number>", "number of images", "1")
  .option("--extra <json>", "additional request fields", parseJsonObject, {})
  .option("--dry-run", "print the request without calling the API", false)
  .action(
    async (options: {
      prompt: string;
      model?: string;
      out: string;
      size: string;
      quality: string;
      format: string;
      count: string;
      extra: JsonRecord;
      dryRun: boolean;
    }) => {
      const payload = {
        ...options.extra,
        model: requiredModel(options.model, "ZENMUX_IMAGE_MODEL"),
        prompt: options.prompt,
        n: Number.parseInt(options.count, 10),
        size: options.size,
        quality: options.quality,
        output_format: options.format,
      };
      const client = dryRunOrClient(
        options.dryRun,
        `${process.env.ZENMUX_BASE_URL ?? "https://zenmux.ai/api/v1"}/images/generations`,
        payload,
      );
      if (!client) return;

      const response = await client.generateImage(payload);
      const paths = await saveImageResponse(response, options.out);
      await writeJson(`${resolve(options.out)}.response.json`, response);
      paths.forEach((path) => console.log(path));
    },
  );

const appendMedia = async (
  content: JsonRecord[],
  type: "image_url" | "video_url" | "audio_url",
  input: string | undefined,
  role: string,
): Promise<void> => {
  if (!input) return;
  const url = isRemoteInput(input) ? input : await toDataUrl(input);
  content.push({ type, role, [type]: { url } });
};

program
  .command("video")
  .description(
    "Submit a native ZenMux video job, poll it, and download the result",
  )
  .requiredOption("-p, --prompt <text>", "video prompt")
  .option("-m, --model <slug>", "provider/model slug")
  .option("-o, --out <path>", "output video path", "outputs/videos/video.mp4")
  .option("--resolution <value>", "for example 720p", "720p")
  .option("--ratio <value>", "for example 16:9 or 9:16", "9:16")
  .option("--duration <seconds>", "video duration in seconds", "5")
  .option("--seed <number>", "generation seed", "-1")
  .option("--reference-image <path-or-url>", "reference image")
  .option("--first-frame <path-or-url>", "first frame image")
  .option("--last-frame <path-or-url>", "last frame image")
  .option("--reference-video <path-or-url>", "reference video")
  .option("--reference-audio <path-or-url>", "reference audio")
  .option("--generate-audio", "ask the provider to generate audio", false)
  .option("--return-last-frame", "return the generated last frame", false)
  .option(
    "--extra <json>",
    "additional native request fields",
    parseJsonObject,
    {},
  )
  .option("--no-wait", "submit and return the job ID without polling")
  .option("--dry-run", "print the request without calling the API", false)
  .action(
    async (options: {
      prompt: string;
      model?: string;
      out: string;
      resolution: string;
      ratio: string;
      duration: string;
      seed: string;
      referenceImage?: string;
      firstFrame?: string;
      lastFrame?: string;
      referenceVideo?: string;
      referenceAudio?: string;
      generateAudio: boolean;
      returnLastFrame: boolean;
      extra: JsonRecord;
      wait: boolean;
      dryRun: boolean;
    }) => {
      const content: JsonRecord[] = [{ type: "text", text: options.prompt }];
      await appendMedia(
        content,
        "image_url",
        options.referenceImage,
        "reference_image",
      );
      await appendMedia(
        content,
        "image_url",
        options.firstFrame,
        "first_frame",
      );
      await appendMedia(content, "image_url", options.lastFrame, "last_frame");
      await appendMedia(
        content,
        "video_url",
        options.referenceVideo,
        "reference_video",
      );
      await appendMedia(
        content,
        "audio_url",
        options.referenceAudio,
        "reference_audio",
      );

      const payload = {
        ...options.extra,
        model: requiredModel(options.model, "ZENMUX_VIDEO_MODEL"),
        content,
        resolution: options.resolution,
        ratio: options.ratio,
        duration: Number.parseInt(options.duration, 10),
        seed: Number.parseInt(options.seed, 10),
        generate_audio: options.generateAudio,
        return_last_frame: options.returnLastFrame,
      };
      const client = dryRunOrClient(
        options.dryRun,
        `${process.env.ZENMUX_VIDEO_BASE_URL ?? "https://zenmux.ai/api/v1"}/videos`,
        payload,
      );
      if (!client) return;

      const submitted = await client.submitVideo(payload);
      console.error(`job=${submitted.id} status=${submitted.status}`);
      await writeJson(`${resolve(options.out)}.job.json`, submitted);
      if (!options.wait) {
        printJson(submitted);
        return;
      }

      const job = await waitForVideo(client, submitted.id);
      await saveVideoJob(job, options.out);
    },
  );

program
  .command("video-status")
  .description("Query an existing native video job and optionally download it")
  .argument("<job-id>", "existing ZenMux video job ID")
  .option("-o, --out <path>", "download a succeeded video to this path")
  .action(async (jobId: string, options: { out?: string }) => {
    const job = await createClient().getVideo(jobId);
    printJson(job);
    if (options.out && job.status === "succeeded") {
      await saveVideoJob(job, options.out);
    }
  });

program
  .command("understand")
  .description(
    "Analyze an image, audio file, PDF, or video through chat completions",
  )
  .requiredOption("-i, --input <path-or-url>", "media input")
  .requiredOption("-p, --prompt <text>", "analysis prompt")
  .option("-m, --model <slug>", "multimodal provider/model slug")
  .option("-o, --out <path>", "save response text")
  .option("--max-local-mb <number>", "maximum local file size to inline", "50")
  .option("--extra <json>", "additional request fields", parseJsonObject, {})
  .option("--dry-run", "print the request without calling the API", false)
  .action(
    async (options: {
      input: string;
      prompt: string;
      model?: string;
      out?: string;
      maxLocalMb: string;
      extra: JsonRecord;
      dryRun: boolean;
    }) => {
      const fileData = await toDataUrl(
        options.input,
        Number.parseFloat(options.maxLocalMb) * 1024 * 1024,
      );
      const payload = {
        ...options.extra,
        model: requiredModel(options.model, "ZENMUX_UNDERSTAND_MODEL"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: options.prompt },
              {
                type: "file",
                file: {
                  filename: inputFilename(options.input),
                  file_data: fileData,
                },
              },
            ],
          },
        ],
      };
      const client = dryRunOrClient(
        options.dryRun,
        `${process.env.ZENMUX_BASE_URL ?? "https://zenmux.ai/api/v1"}/chat/completions`,
        payload,
      );
      if (!client) return;

      const response = await client.chat(payload);
      const text = response.choices[0]?.message.content ?? "";
      process.stdout.write(`${text}\n`);
      if (options.out) {
        const outputPath = resolve(options.out);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, `${text}\n`, "utf8");
        await writeJson(`${outputPath}.response.json`, response);
      }
    },
  );

async function waitForVideo(
  client: ZenMuxClient,
  jobId: string,
): Promise<VideoJob> {
  const pollIntervalMs = Number.parseInt(
    process.env.ZENMUX_POLL_INTERVAL_MS ?? "15000",
    10,
  );
  const timeoutMs = Number.parseInt(
    process.env.ZENMUX_VIDEO_TIMEOUT_MS ?? "900000",
    10,
  );
  return client.waitForVideo(jobId, {
    pollIntervalMs,
    timeoutMs,
    onStatus: (job) =>
      console.error(
        `${new Date().toISOString()} job=${job.id} status=${job.status}`,
      ),
  });
}

async function saveVideoJob(job: VideoJob, output: string): Promise<void> {
  const videoUrl = job.content?.video_url;
  if (!videoUrl) {
    throw new Error(`Video job ${job.id} succeeded without content.video_url.`);
  }
  const outputPath = await downloadToFile(videoUrl, output);
  await writeJson(`${resolve(output)}.job.json`, job);
  console.log(outputPath);

  if (job.content?.last_frame_url) {
    const frameExtension =
      extname(new URL(job.content.last_frame_url).pathname) || ".jpg";
    const framePath = resolve(
      dirname(outputPath),
      `${basename(outputPath, extname(outputPath))}-last-frame${frameExtension}`,
    );
    console.log(await downloadToFile(job.content.last_frame_url, framePath));
  }
}

await program.parseAsync();
