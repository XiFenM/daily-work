import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const cliPath = fileURLToPath(new URL("./cli.ts", import.meta.url));
const tsxCliPath = fileURLToPath(
  new URL("../../../node_modules/tsx/dist/cli.mjs", import.meta.url),
);
let fixtureRoot: string | undefined;

afterEach(async () => {
  if (fixtureRoot) {
    await rm(fixtureRoot, { force: true, recursive: true });
    fixtureRoot = undefined;
  }
});

const runDryRun = async (
  command: "image" | "video",
  extraArguments: string[] = [],
) => {
  fixtureRoot = await mkdtemp(join(tmpdir(), "daily-work-zenmux-cli-"));
  const promptPath = join(fixtureRoot, "prompt.txt");
  await writeFile(promptPath, `${command} prompt from file`, "utf8");

  return spawnSync(
    process.execPath,
    [
      tsxCliPath,
      cliPath,
      command,
      "--prompt-file",
      promptPath,
      "--model",
      `test/${command}`,
      ...extraArguments,
      "--dry-run",
    ],
    { encoding: "utf8" },
  );
};

describe("ZenMux prompt-file generation commands", () => {
  it("loads an image prompt from a file without requiring credentials", async () => {
    const result = await runDryRun("image");

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      payload: {
        model: "test/image",
        prompt: "image prompt from file",
      },
    });
  });

  it("accepts an image output extension that exactly matches the format", async () => {
    const result = await runDryRun("image", [
      "--format",
      "jpeg",
      "--out",
      "outputs/managed/demo/image.jpeg",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      payload: { output_format: "jpeg" },
    });
  });

  it("rejects a mismatched image extension before dispatch", async () => {
    const result = await runDryRun("image", [
      "--format",
      "webp",
      "--out",
      "outputs/managed/demo/image.png",
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "--out must end with .webp when --format is webp.",
    );
  });

  it("rejects an unsupported image format before dispatch", async () => {
    const result = await runDryRun("image", [
      "--format",
      "jpg",
      "--out",
      "outputs/managed/demo/image.jpg",
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("--format must be png, jpeg, or webp.");
  });

  it("loads a video prompt from a file without requiring credentials", async () => {
    const result = await runDryRun("video");

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      payload: {
        model: "test/video",
        content: [{ type: "text", text: "video prompt from file" }],
      },
    });
  });

  it("requests a last frame when an exact last-frame output is selected", async () => {
    const result = await runDryRun("video", [
      "--last-frame-out",
      "outputs/managed/demo/exact-frame.webp",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      payload: {
        return_last_frame: true,
      },
    });
  });

  it("rejects an exact last-frame output that cannot be fulfilled in no-wait mode", async () => {
    const result = await runDryRun("video", [
      "--last-frame-out",
      "outputs/managed/demo/exact-frame.webp",
      "--no-wait",
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "--last-frame-out cannot be used with --no-wait.",
    );
  });
});
