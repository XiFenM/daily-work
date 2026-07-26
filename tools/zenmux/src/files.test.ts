import { describe, expect, it } from "vitest";
import { inputFilename, redactLargePayloads } from "./files.js";

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
});
