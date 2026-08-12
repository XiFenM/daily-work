import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadToFile,
  inputFilename,
  redactLargePayloads,
  saveImageResponse,
  saveVideoJob,
  toDataUrl,
} from "./files.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ZenMux file helpers", () => {
  it("redacts data URLs before printing or persisting metadata", () => {
    expect(
      redactLargePayloads({ file_data: "data:video/mp4;base64,AAAA" }),
    ).toEqual({
      file_data: "data:video/mp4;base64,<redacted:4 chars>",
    });
  });

  it("removes URL credentials, query parameters, and fragments from metadata", () => {
    expect(
      redactLargePayloads({
        content: {
          video_url:
            "https://media-user:media-pass@example.com/video.mp4?token=secret#download",
        },
      }),
    ).toEqual({
      content: {
        video_url: "https://example.com/video.mp4",
      },
    });
  });

  it("does not expose a signed URL when a download fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("denied", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadToFile(
        "https://user:password@example.com/result.mp4?token=secret#preview",
        "unused.mp4",
      ),
    ).rejects.toThrow(
      "Download failed with HTTP 403: https://example.com/result.mp4",
    );
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

  it("rejects an incomplete image response before creating any outputs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-images-"));
    const output = join(directory, "nested", "image.png");
    try {
      await expect(
        saveImageResponse(
          { data: [{ b64_json: "aGVsbG8=" }], output_format: "png" },
          output,
          2,
        ),
      ).rejects.toThrow(/2 were requested.*No image outputs were written/);
      await expect(access(join(directory, "nested"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not download a returned last frame without an exact output path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-video-"));
    const output = join(directory, "result.mp4");
    const videoUrl = "https://cdn.example.com/result.mp4?token=video-secret";
    const frameUrl =
      "https://frame-user:frame-pass@cdn.example.com/frame.jpg?token=frame-secret#preview";
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("video-bytes", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await saveVideoJob(
        {
          id: "job-1",
          status: "succeeded",
          content: { video_url: videoUrl, last_frame_url: frameUrl },
        },
        output,
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(videoUrl);
      await expect(
        access(join(directory, "result-last-frame.jpg")),
      ).rejects.toMatchObject({ code: "ENOENT" });
      const metadata = await readFile(`${output}.job.json`, "utf8");
      expect(metadata).toContain("https://cdn.example.com/result.mp4");
      expect(metadata).toContain("https://cdn.example.com/frame.jpg");
      expect(metadata).not.toMatch(
        /video-secret|frame-secret|frame-user|frame-pass|#preview/,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("downloads a returned last frame only to the explicitly selected path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-video-frame-"));
    const output = join(directory, "result.mp4");
    const frameOutput = join(directory, "chosen", "exact-frame.webp");
    const videoUrl = "https://cdn.example.com/result.mp4?token=video-secret";
    const frameUrl = "https://cdn.example.com/frame.jpg?token=frame-secret";
    const fetchMock = vi.fn<typeof fetch>(
      async (input) =>
        new Response(
          String(input) === frameUrl ? "frame-bytes" : "video-bytes",
          {
            status: 200,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const outputs = await saveVideoJob(
        {
          id: "job-2",
          status: "succeeded",
          content: { video_url: videoUrl, last_frame_url: frameUrl },
        },
        output,
        frameOutput,
      );

      expect(outputs).toEqual([output, frameOutput]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(1, videoUrl);
      expect(fetchMock).toHaveBeenNthCalledWith(2, frameUrl);
      await expect(readFile(frameOutput, "utf8")).resolves.toBe("frame-bytes");
      await expect(
        access(join(directory, "result-last-frame.jpg")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fails before downloading when an explicitly requested last frame is absent", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zenmux-video-missing-"));
    const output = join(directory, "result.mp4");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        saveVideoJob(
          {
            id: "job-3",
            status: "succeeded",
            content: { video_url: "https://cdn.example.com/result.mp4" },
          },
          output,
          join(directory, "frame.jpg"),
        ),
      ).rejects.toThrow(/without content\.last_frame_url/);
      expect(fetchMock).not.toHaveBeenCalled();
      await expect(access(output)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
