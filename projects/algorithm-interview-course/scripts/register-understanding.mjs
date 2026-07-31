import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(projectRoot, "../..");

const parseArguments = (argumentsList) => {
  const parsed = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${argument}`);
    }
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    parsed[argument.slice(2)] = value;
    index += 1;
  }
  return parsed;
};

const argumentsMap = parseArguments(process.argv.slice(2));
for (const requiredArgument of ["lesson", "prompt", "compressed"]) {
  if (!argumentsMap[requiredArgument]) {
    throw new Error(`Specify --${requiredArgument} <value>.`);
  }
}

const lessonId = argumentsMap.lesson;
const qaReviewedValue = argumentsMap["qa-reviewed"];
if (qaReviewedValue !== "true") {
  throw new Error(
    "Registration requires an explicit --qa-reviewed true after manual QA.",
  );
}
const toRepositoryPath = (path) =>
  relative(repositoryRoot, resolve(path)).replaceAll("\\", "/");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const sha256 = async (path) =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

const manifestPath = resolve(projectRoot, "manifest.json");
const progressPath = resolve(projectRoot, "progress.json");
const catalogPath = resolve(projectRoot, "inputs/source-catalog.json");
const rawPath = resolve(
  repositoryRoot,
  `outputs/algorithm-interview-course/understanding/raw/${lessonId}.json`,
);
const responsePath = `${rawPath}.response.json`;
const normalizedPath = resolve(
  repositoryRoot,
  `outputs/algorithm-interview-course/understanding/normalized/${lessonId}.json`,
);
const promptPath = resolve(argumentsMap.prompt);
const compressedPath = resolve(argumentsMap.compressed);

const [manifest, progress, catalog, response, normalized, compressedStat] =
  await Promise.all([
    readJson(manifestPath),
    readJson(progressPath),
    readJson(catalogPath),
    readJson(responsePath),
    readJson(normalizedPath),
    stat(compressedPath),
  ]);

const asset = catalog.items.find(
  (item) =>
    item.kind === "video" &&
    Array.isArray(item.lessonIds) &&
    item.lessonIds.includes(lessonId),
);
if (!asset) {
  throw new Error(`No cataloged video asset for ${lessonId}.`);
}
if (!response.id || normalized.provenance?.requestId !== response.id) {
  throw new Error(
    `${lessonId} normalized provenance does not match the API response.`,
  );
}
if (normalized.lessonId !== lessonId) {
  throw new Error(`Normalized evidence belongs to ${normalized.lessonId}.`);
}

manifest.schemaVersion ??= 2;
manifest.attempts ??= [];
manifest.generations ??= [];
const lessonAttempts = manifest.attempts.filter(
  (attempt) => attempt.lessonId === lessonId,
);
const attemptNumber =
  argumentsMap["attempt-number"] === undefined
    ? Math.max(0, ...lessonAttempts.map((attempt) => attempt.attemptNumber)) + 1
    : Number.parseInt(argumentsMap["attempt-number"], 10);
if (!Number.isInteger(attemptNumber) || attemptNumber <= 0) {
  throw new Error("--attempt-number must be a positive integer.");
}
const attemptId =
  argumentsMap["attempt-id"] ??
  `${lessonId}-understanding-${String(attemptNumber).padStart(3, "0")}`;
if (manifest.attempts.some((attempt) => attempt.attemptId === attemptId)) {
  throw new Error(`Attempt already exists: ${attemptId}`);
}
if (
  manifest.generations.some(
    (generation) => generation.requestId === response.id,
  )
) {
  throw new Error(`Generation already exists: ${response.id}`);
}

const promptVersion =
  normalized.provenance?.promptVersion ?? argumentsMap["prompt-version"];
if (!promptVersion) {
  throw new Error("The normalized document is missing promptVersion.");
}
const createdAt =
  typeof response.created === "number"
    ? new Date(response.created * 1000).toISOString()
    : new Date().toISOString();
const promptSha256 = await sha256(promptPath);
const compressedSha256 = await sha256(compressedPath);
const responseFormat = argumentsMap["response-format"] ?? "json_object";
const baseUrl = argumentsMap["base-url"] ?? "https://zenmux.dev/api/v1";
const usage = response.usage ?? {};
const usageRecord = {
  promptTokens: usage.prompt_tokens ?? null,
  completionTokens: usage.completion_tokens ?? null,
  reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? null,
  totalTokens: usage.total_tokens ?? null,
};

manifest.attempts.push({
  attemptId,
  lessonId,
  attemptNumber,
  attemptedAt: createdAt,
  outcome: "accepted",
  provider: "zenmux",
  model: response.model ?? normalized.provenance?.model ?? null,
  baseUrl,
  promptVersion,
  promptSha256,
  responseFormat,
  requestId: response.id,
  transport: {
    status: "completed",
    httpStatus: 200,
    failurePhase: null,
    requestMayHaveReachedServer: true,
  },
  validation: {
    status: "passed",
    validator: "normalize-lesson-evidence.mjs",
    errors: [],
    qaStatus: "completed",
  },
  eligibleForSynthesis: true,
  billingStatus: "reported_by_usage",
  retryOfAttemptId: lessonAttempts.at(-1)?.attemptId ?? null,
});

const requestConfigPath =
  responseFormat === "json_object"
    ? "projects/algorithm-interview-course/configs/zenmux-json-object-extra.json"
    : null;
manifest.generations.push({
  kind: "understanding",
  attemptId,
  lessonId,
  outcome: "accepted",
  eligibleForSynthesis: true,
  provider: "zenmux",
  model: response.model ?? normalized.provenance?.model ?? null,
  createdAt,
  requestId: response.id,
  inputs: [
    asset.path,
    toRepositoryPath(promptPath),
    ...(requestConfigPath ? [requestConfigPath] : []),
  ],
  outputs: [
    toRepositoryPath(compressedPath),
    toRepositoryPath(rawPath),
    toRepositoryPath(responsePath),
    toRepositoryPath(normalizedPath),
  ],
  parameters: {
    baseUrl,
    promptVersion,
    promptSha256,
    responseFormat,
    compression: argumentsMap.compression ?? "balanced",
    compressedBytes: compressedStat.size,
    compressedSha256,
    sourceSha256: asset.sha256,
    maxLocalMb: Number(argumentsMap["max-local-mb"] ?? 50),
    attemptNumber,
    usage: usageRecord,
  },
  notes: `单次调用成功；严格本地门禁核对 ${Math.round(
    asset.media.durationSeconds * 1000,
  )} ms 时长、证据引用、对象结构与代码 verification 后通过；人工代码/OCR QA 已完成。`,
});

progress.lessons[lessonId] ??= structuredClone(progress.defaultLessonState);
const lessonState = progress.lessons[lessonId];
lessonState.videoEvidence = "completed";
lessonState.qa = "completed";
const updatedLessonAttempts = [...lessonAttempts, manifest.attempts.at(-1)];
lessonState.understandingAttempts = updatedLessonAttempts.length;
lessonState.rejectedAttempts = updatedLessonAttempts.filter(
  (attempt) => attempt.outcome === "rejected",
).length;
lessonState.transportFailures = updatedLessonAttempts.filter((attempt) =>
  ["http_error", "network_error"].includes(attempt.outcome),
).length;
lessonState.acceptedAttemptId = attemptId;
progress.summary.understoodLessons = Object.values(progress.lessons).filter(
  (state) =>
    state.videoEvidence === "completed" || state.textEvidence === "completed",
).length;
progress.updatedAt = createdAt;

await Promise.all([
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
  writeFile(progressPath, `${JSON.stringify(progress, null, 2)}\n`, "utf8"),
]);

process.stdout.write(
  `${JSON.stringify({
    lessonId,
    attemptId,
    requestId: response.id,
    promptSha256,
    compressedSha256,
    compressedBytes: compressedStat.size,
    totalTokens: usageRecord.totalTokens,
    qaStatus: lessonState.qa,
  })}\n`,
);
