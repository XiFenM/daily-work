import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const loadPrompt = async (
  prompt: string | undefined,
  promptFile: string | undefined,
): Promise<string> => {
  if ((prompt === undefined) === (promptFile === undefined)) {
    throw new Error("Specify exactly one of --prompt or --prompt-file.");
  }
  if (prompt !== undefined) {
    return prompt;
  }
  return readFile(resolve(promptFile!), "utf8");
};
