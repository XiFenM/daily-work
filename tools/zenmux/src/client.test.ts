import { describe, expect, it, vi } from "vitest";
import { ZenMuxClient, ZenMuxHttpError } from "./client.js";

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("ZenMuxClient", () => {
  it("sends bearer authentication and parses an image response", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        created: 1,
        output_format: "png",
        data: [{ b64_json: "aGVsbG8=" }],
      }),
    );
    const client = new ZenMuxClient({
      apiKey: "test-secret",
      fetchImpl,
    });

    const response = await client.generateImage({
      model: "openai/gpt-image-2",
      prompt: "test",
    });

    expect(response.data).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://zenmux.ai/api/v1/images/generations",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-secret",
        }),
      }),
    );
  });

  it("polls the same video job until it succeeds", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "job-1", status: "queued" }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "job-1",
          status: "succeeded",
          content: { video_url: "https://example.com/result.mp4" },
        }),
      );
    const client = new ZenMuxClient({ apiKey: "test", fetchImpl });

    const result = await client.waitForVideo("job-1", {
      pollIntervalMs: 1,
      timeoutMs: 1_000,
      sleep: async () => undefined,
    });

    expect(result.status).toBe("succeeded");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("surfaces provider error bodies", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ error: { message: "bad model" } }, 400),
      );
    const client = new ZenMuxClient({ apiKey: "test", fetchImpl });

    await expect(client.listModels()).rejects.toBeInstanceOf(ZenMuxHttpError);
  });
});
