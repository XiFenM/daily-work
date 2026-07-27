import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inputFilename, redactLargePayloads, toDataUrl } from "./files.js";

describe("ZenMux file helpers", () => {
  it("redacts data URLs before printing or persisting metadata", () => {
    expect(
      redactLargePayloads({ file_data: "data:video/mp4;base64,AAAA" }),
    ).toEqual({
      file_data: "data:video/mp4;base64,<redacted:4 chars>",
    });
  });

  it("derives a filename from a URL", () => {
    expect(inputFilename("https://example.com/a/video.mp4")).toBe("video.mp4");
  });

  it("passes remote inputs through without reading a local file", async () => {
    const input = "https://example.com/video.mp4";
    await expect(toDataUrl(input, 1)).resolves.toBe(input);
  });

  it("checks the local size limit before encoding a data URL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-files-"));
    const input = join(directory, "tiny.mp4");
    try {
      await writeFile(input, Buffer.from([0, 1, 2]));
      await expect(toDataUrl(input, 3)).resolves.toBe(
        "data:video/mp4;base64,AAEC",
      );
      await expect(toDataUrl(input, 2)).rejects.toThrow(
        /stronger --compress level/,
      );
      await expect(toDataUrl(input, 0)).rejects.toThrow(/greater than 0/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
