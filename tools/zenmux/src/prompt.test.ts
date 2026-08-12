import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadPrompt } from "./prompt.js";

let fixtureRoot: string | undefined;

afterEach(async () => {
  if (fixtureRoot) {
    await rm(fixtureRoot, { force: true, recursive: true });
    fixtureRoot = undefined;
  }
});

describe("loadPrompt", () => {
  it("keeps the existing inline prompt input", async () => {
    await expect(loadPrompt("inline prompt", undefined)).resolves.toBe(
      "inline prompt",
    );
  });

  it("reads a UTF-8 prompt file without interpreting its contents", async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), "daily-work-zenmux-prompt-"));
    const promptPath = resolve(fixtureRoot, "中文 prompt.txt");
    await writeFile(promptPath, "第一行\nsecond line\n", "utf8");

    await expect(loadPrompt(undefined, promptPath)).resolves.toBe(
      "第一行\nsecond line\n",
    );
  });

  it("rejects a missing prompt source", async () => {
    await expect(loadPrompt(undefined, undefined)).rejects.toThrow(
      "Specify exactly one of --prompt or --prompt-file.",
    );
  });

  it("rejects ambiguous inline and file prompt sources", async () => {
    await expect(loadPrompt("inline prompt", "prompt.txt")).rejects.toThrow(
      "Specify exactly one of --prompt or --prompt-file.",
    );
  });
});
