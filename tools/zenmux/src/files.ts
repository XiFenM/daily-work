import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, parse, resolve } from "node:path";
import { lookup } from "mime-types";
import type { ImageResponse } from "./client.js";

export const isRemoteInput = (value: string): boolean =>
  /^(https?:\/\/|data:)/i.test(value);

export const inputFilename = (value: string): string => {
  if (!isRemoteInput(value)) {
    return basename(value);
  }
  try {
    return basename(new URL(value).pathname) || "input.bin";
  } catch {
    return "input.bin";
  }
};

export async function toDataUrl(
  input: string,
  maxBytes = 50 * 1024 * 1024,
): Promise<string> {
  if (isRemoteInput(input)) {
    return input;
  }
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new Error("The local input byte limit must be greater than 0.");
  }

  const absolutePath = resolve(input);
  const fileStats = await stat(absolutePath);
  if (fileStats.size > maxBytes) {
    throw new Error(
      `${input} is ${(fileStats.size / 1024 / 1024).toFixed(1)} MB; ` +
        `the local input limit is ${(maxBytes / 1024 / 1024).toFixed(1)} MB. ` +
        "For videos, choose a stronger --compress level; otherwise use a hosted URL or raise --max-local-mb intentionally.",
    );
  }

  const buffer = await readFile(absolutePath);
  const mime = lookup(absolutePath) || "application/octet-stream";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function redactLargePayloads(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactLargePayloads);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        redactLargePayloads(nested),
      ]),
    );
  }
  if (typeof value === "string" && value.startsWith("data:")) {
    const separator = value.indexOf(",");
    const header = separator >= 0 ? value.slice(0, separator) : "data:";
    const payloadLength = separator >= 0 ? value.length - separator - 1 : 0;
    return `${header},<redacted:${payloadLength} chars>`;
  }
  if (typeof value === "string" && value.length > 2_000) {
    return `<redacted:${value.length} chars>`;
  }
  return value;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  const absolutePath = resolve(path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(
    absolutePath,
    `${JSON.stringify(redactLargePayloads(value), null, 2)}\n`,
    "utf8",
  );
}

export async function downloadToFile(
  url: string,
  outputPath: string,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  }
  const absolutePath = resolve(outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await response.arrayBuffer()));
  return absolutePath;
}

const indexedOutputPath = (
  requestedPath: string,
  index: number,
  total: number,
  extension: string,
): string => {
  const parsed = parse(requestedPath);
  const resolvedExtension = parsed.ext || `.${extension}`;
  const suffix = total > 1 ? `-${index + 1}` : "";
  return resolve(parsed.dir, `${parsed.name}${suffix}${resolvedExtension}`);
};

export async function saveImageResponse(
  response: ImageResponse,
  requestedPath: string,
): Promise<string[]> {
  const format =
    response.output_format ??
    extname(requestedPath).replace(/^\./, "") ??
    "png";
  const outputs: string[] = [];

  for (const [index, image] of response.data.entries()) {
    const outputPath = indexedOutputPath(
      requestedPath,
      index,
      response.data.length,
      format || "png",
    );
    await mkdir(dirname(outputPath), { recursive: true });

    if (image.b64_json) {
      await writeFile(outputPath, Buffer.from(image.b64_json, "base64"));
    } else if (image.url) {
      await downloadToFile(image.url, outputPath);
    } else {
      throw new Error(
        `Image result ${index + 1} has neither b64_json nor url.`,
      );
    }
    outputs.push(outputPath);
  }

  return outputs;
}
