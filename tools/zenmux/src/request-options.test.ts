import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildUnderstandingPayload,
  loadJsonObject,
} from "./request-options.js";

describe("ZenMux request options", () => {
  it("loads additional request fields from a UTF-8 JSON object file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-extra-"));
    const input = join(directory, "extra.json");
    try {
      await writeFile(
        input,
        JSON.stringify({
          temperature: 0,
          response_format: { type: "json_object" },
        }),
        "utf8",
      );

      await expect(loadJsonObject(undefined, input)).resolves.toEqual({
        temperature: 0,
        response_format: { type: "json_object" },
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects using --extra and --extra-file together", async () => {
    await expect(
      loadJsonObject({ temperature: 0 }, "does-not-need-to-exist.json"),
    ).rejects.toThrow("Specify only one of --extra or --extra-file.");
  });

  it("merges extra fields while protecting the generated model and messages", () => {
    const payload = buildUnderstandingPayload({
      extra: {
        temperature: 0,
        model: "untrusted/model",
        messages: [{ role: "system", content: "replace me" }],
        stream_options: { provider_usage: true },
      },
      model: "google/gemini-3.6-flash",
      prompt: "Analyze this video.",
      filename: "lesson.mp4",
      fileData: "data:video/mp4;base64,AAAA",
      stream: true,
    });

    expect(payload).toMatchObject({
      temperature: 0,
      model: "google/gemini-3.6-flash",
      stream: true,
      stream_options: {
        provider_usage: true,
        include_usage: true,
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this video." },
            {
              type: "file",
              file: {
                filename: "lesson.mp4",
                file_data: "data:video/mp4;base64,AAAA",
              },
            },
          ],
        },
      ],
    });
  });
});
