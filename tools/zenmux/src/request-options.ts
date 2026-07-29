import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type JsonRecord = Record<string, unknown>;

export const parseJsonObject = (value: string): JsonRecord => {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("--extra must be a JSON object.");
  }
  return parsed as JsonRecord;
};

export const loadJsonObject = async (
  inlineValue: JsonRecord | undefined,
  filePath: string | undefined,
): Promise<JsonRecord> => {
  if (inlineValue && filePath) {
    throw new Error("Specify only one of --extra or --extra-file.");
  }
  if (filePath) {
    return parseJsonObject(await readFile(resolve(filePath), "utf8"));
  }
  return inlineValue ?? {};
};

export const addStreamingOptions = (
  payload: JsonRecord,
  stream: boolean,
): JsonRecord => {
  if (!stream) return payload;
  const existing =
    typeof payload.stream_options === "object" &&
    payload.stream_options !== null &&
    !Array.isArray(payload.stream_options)
      ? (payload.stream_options as JsonRecord)
      : {};
  return {
    ...payload,
    stream: true,
    stream_options: { ...existing, include_usage: true },
  };
};

export const buildUnderstandingPayload = ({
  extra,
  model,
  prompt,
  filename,
  fileData,
  stream,
}: {
  extra: JsonRecord;
  model: string;
  prompt: string;
  filename: string;
  fileData: string;
  stream: boolean;
}): JsonRecord =>
  addStreamingOptions(
    {
      ...extra,
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              file: {
                filename,
                file_data: fileData,
              },
            },
          ],
        },
      ],
    },
    stream,
  );
