import { z } from "zod";
import { redactLargePayloads } from "./files.js";

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
type ChatStreamDeltaHandler = (content: string) => void;

export class ZenMuxHttpError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  public constructor(status: number, body: unknown) {
    const safeBody = redactLargePayloads(body);
    const detail =
      typeof safeBody === "object" && safeBody !== null
        ? JSON.stringify(safeBody)
        : String(safeBody);
    super(`ZenMux request failed with HTTP ${status}: ${detail}`);
    this.name = "ZenMuxHttpError";
    this.status = status;
    this.body = safeBody;
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

  public async chatStream(
    payload: Record<string, unknown>,
    onDelta?: ChatStreamDeltaHandler,
  ): Promise<ChatResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.#headers({ Accept: "text/event-stream" }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new ZenMuxHttpError(
        response.status,
        await this.#readResponseBody(response),
      );
    }
    if (!response.body) {
      throw new Error("ZenMux streaming response has no body.");
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    const eventDataLines: string[] = [];
    let lineBuffer = "";
    let content = "";
    let id = response.headers.get("x-generation-id") ?? undefined;
    let created: number | undefined;
    let model: string | undefined;
    let usage: unknown;
    let finishReason: unknown = null;

    const flushEvent = (): void => {
      if (eventDataLines.length === 0) return;
      const data = eventDataLines.splice(0).join("\n");
      if (data === "[DONE]") return;

      let chunk: unknown;
      try {
        chunk = JSON.parse(data);
      } catch (error) {
        throw new Error(`Invalid ZenMux SSE data: ${data.slice(0, 200)}`, {
          cause: error,
        });
      }
      if (typeof chunk !== "object" || chunk === null) return;
      const record = chunk as Record<string, unknown>;
      if (typeof record.id === "string") id = record.id;
      if (typeof record.created === "number") created = record.created;
      if (typeof record.model === "string") model = record.model;
      if (record.usage !== undefined && record.usage !== null) {
        usage = record.usage;
      }
      const choices = Array.isArray(record.choices) ? record.choices : [];
      const choice =
        typeof choices[0] === "object" && choices[0] !== null
          ? (choices[0] as Record<string, unknown>)
          : undefined;
      if (!choice) return;
      if (choice.finish_reason !== undefined && choice.finish_reason !== null) {
        finishReason = choice.finish_reason;
      }
      const delta =
        typeof choice.delta === "object" && choice.delta !== null
          ? (choice.delta as Record<string, unknown>)
          : undefined;
      if (typeof delta?.content === "string") {
        content += delta.content;
        onDelta?.(delta.content);
      }
    };

    const processLine = (rawLine: string): void => {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      if (line === "") {
        flushEvent();
        return;
      }
      if (line.startsWith("data:")) {
        eventDataLines.push(line.slice(5).trimStart());
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);
    }
    lineBuffer += decoder.decode();
    if (lineBuffer) processLine(lineBuffer);
    flushEvent();

    return chatResponseSchema.parse({
      id,
      object: "chat.completion",
      created,
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: finishReason,
        },
      ],
      usage,
      streamed: true,
    });
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
      headers: this.#headers(init.headers),
    });

    const body = await this.#readResponseBody(response);

    if (!response.ok) {
      throw new ZenMuxHttpError(response.status, body);
    }

    return body;
  }

  #headers(headers?: HeadersInit): HeadersInit {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.#apiKey}`,
      "Content-Type": "application/json",
      ...headers,
    };
  }

  async #readResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return text;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
