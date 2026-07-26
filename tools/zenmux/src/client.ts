import { z } from "zod";

const imageDatumSchema = z
  .object({
    b64_json: z.string().optional(),
    revised_prompt: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

export const imageResponseSchema = z
  .object({
    created: z.number().optional(),
    data: z.array(imageDatumSchema).min(1),
    output_format: z.string().optional(),
  })
  .passthrough();

export const videoJobSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    model: z.string().optional(),
    content: z
      .object({
        video_url: z.string().optional(),
        last_frame_url: z.string().optional(),
      })
      .passthrough()
      .optional(),
    error: z
      .object({
        code: z.union([z.string(), z.number()]).optional(),
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const chatResponseSchema = z
  .object({
    id: z.string().optional(),
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                content: z.union([z.string(), z.null()]),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export type ImageResponse = z.infer<typeof imageResponseSchema>;
export type VideoJob = z.infer<typeof videoJobSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;

type FetchLike = typeof fetch;

export class ZenMuxHttpError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  public constructor(status: number, body: unknown) {
    const detail =
      typeof body === "object" && body !== null
        ? JSON.stringify(body)
        : String(body);
    super(`ZenMux request failed with HTTP ${status}: ${detail}`);
    this.name = "ZenMuxHttpError";
    this.status = status;
    this.body = body;
  }
}

export interface ZenMuxClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface WaitForVideoOptions {
  pollIntervalMs: number;
  timeoutMs: number;
  onStatus?: (job: VideoJob) => void;
  sleep?: (milliseconds: number) => Promise<void>;
}

export class ZenMuxClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: FetchLike;

  public constructor(options: ZenMuxClientOptions) {
    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? "https://zenmux.ai/api/v1").replace(
      /\/+$/,
      "",
    );
    this.#fetch = options.fetchImpl ?? fetch;
  }

  public listModels(): Promise<unknown> {
    return this.#request("/models", { method: "GET" });
  }

  public async chat(payload: Record<string, unknown>): Promise<ChatResponse> {
    const response = await this.#request("/chat/completions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return chatResponseSchema.parse(response);
  }

  public async generateImage(
    payload: Record<string, unknown>,
  ): Promise<ImageResponse> {
    const response = await this.#request("/images/generations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return imageResponseSchema.parse(response);
  }

  public async submitVideo(
    payload: Record<string, unknown>,
  ): Promise<VideoJob> {
    const response = await this.#request("/videos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return videoJobSchema.parse(response);
  }

  public async getVideo(jobId: string): Promise<VideoJob> {
    const response = await this.#request(
      `/videos/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
      },
    );
    return videoJobSchema.parse(response);
  }

  public async waitForVideo(
    jobId: string,
    options: WaitForVideoOptions,
  ): Promise<VideoJob> {
    const startedAt = Date.now();
    const sleep =
      options.sleep ??
      ((milliseconds: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

    while (Date.now() - startedAt <= options.timeoutMs) {
      const job = await this.getVideo(jobId);
      options.onStatus?.(job);

      if (job.status === "succeeded") {
        return job;
      }
      if (["failed", "cancelled", "canceled"].includes(job.status)) {
        const reason = job.error?.message ?? "unknown provider error";
        throw new Error(`Video job ${job.id} ${job.status}: ${reason}`);
      }

      await sleep(options.pollIntervalMs);
    }

    throw new Error(
      `Timed out waiting for video job ${jobId}. Query the same job ID before retrying.`,
    );
  }

  async #request(path: string, init: RequestInit): Promise<unknown> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const text = await response.text();
    let body: unknown = text;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      throw new ZenMuxHttpError(response.status, body);
    }

    return body;
  }
}
