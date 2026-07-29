import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectRoot, "../..");

const parseArguments = (argumentsList) => {
  const parsed = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${argument}`);
    }
    const key = argument.slice(2);
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    parsed[key] = value;
    index += 1;
  }
  return parsed;
};

const argumentsMap = parseArguments(process.argv.slice(2));
const lessonId = argumentsMap.lesson;
if (!lessonId) {
  throw new Error("Specify --lesson <lesson-id>, for example --lesson 01-03.");
}

const modelId =
  argumentsMap.model ?? process.env.ZENMUX_UNDERSTAND_MODEL ?? undefined;
if (!modelId) {
  throw new Error(
    "Specify --model <provider/model> or set ZENMUX_UNDERSTAND_MODEL.",
  );
}

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const outline = await readJson(resolve(projectRoot, "course-outline.json"));
const catalog = await readJson(
  resolve(projectRoot, "inputs", "source-catalog.json"),
);
const relationshipGraph = await readJson(
  resolve(projectRoot, "notes", "relationships.json"),
);
const lessonsById = new Map(
  outline.chapters.flatMap((outlineChapter) =>
    outlineChapter.lessons.map((outlineLesson) => [
      outlineLesson.id,
      outlineLesson,
    ]),
  ),
);

const chapter = outline.chapters.find((candidateChapter) =>
  candidateChapter.lessons.some((lesson) => lesson.id === lessonId),
);
const lesson = chapter?.lessons.find(
  (candidateLesson) => candidateLesson.id === lessonId,
);
if (!chapter || !lesson) {
  throw new Error(`Unknown lesson ID: ${lessonId}`);
}

const videoAsset = catalog.items.find(
  (asset) =>
    asset.kind === "video" &&
    Array.isArray(asset.lessonIds) &&
    asset.lessonIds.includes(lessonId),
);
if (!videoAsset) {
  throw new Error(`No cataloged video asset for ${lessonId}.`);
}

const lessonIndex = chapter.lessons.findIndex(
  (candidateLesson) => candidateLesson.id === lessonId,
);
const neighboringLessons = [
  chapter.lessons[lessonIndex - 1],
  chapter.lessons[lessonIndex + 1],
]
  .filter(Boolean)
  .map((candidateLesson) => ({
    lessonId: candidateLesson.id,
    title: candidateLesson.titleNormalized,
  }));

const candidateRelationships = relationshipGraph.edges
  .filter(
    (edge) =>
      edge.from === `lesson:${lessonId}` || edge.to === `lesson:${lessonId}`,
  )
  .map((edge) => ({
    from: edge.from,
    fromTitle:
      lessonsById.get(edge.from.replace("lesson:", ""))?.titleNormalized ??
      null,
    to: edge.to,
    toTitle:
      lessonsById.get(edge.to.replace("lesson:", ""))?.titleNormalized ?? null,
    type: edge.type,
    status: edge.status,
    priorKind: "non_evidence_candidate_for_checking",
  }));

const expectedDuration = lesson.durationText
  ? `${lesson.durationText}（目录标称）；${videoAsset.media?.durationSeconds ?? "未知"} 秒（FFprobe）`
  : `目录未知；${videoAsset.media?.durationSeconds ?? "未知"} 秒（FFprobe）`;

const replacements = {
  LESSON_ID: lesson.id,
  CHAPTER_ID: chapter.id,
  CHAPTER_TITLE: chapter.title,
  TITLE_RAW: lesson.titleRaw,
  TITLE_NORMALIZED: lesson.titleNormalized,
  EXPECTED_DURATION_OR_UNKNOWN: expectedDuration,
  ACTUAL_DURATION_SECONDS: String(videoAsset.media?.durationSeconds ?? "null"),
  ACTUAL_DURATION_MS: String(
    typeof videoAsset.media?.durationSeconds === "number"
      ? Math.round(videoAsset.media.durationSeconds * 1000)
      : "null",
  ),
  VIDEO_ASSET_ID: videoAsset.assetId,
  NEIGHBOR_LESSONS:
    neighboringLessons.length > 0
      ? JSON.stringify(neighboringLessons, null, 2)
      : "无",
  CANDIDATE_RELATED_LESSONS:
    candidateRelationships.length > 0
      ? JSON.stringify(candidateRelationships, null, 2)
      : "无",
  MODEL_ID: modelId,
};

const templatePath = resolve(
  projectRoot,
  "prompts",
  "video-evidence-v1.3.template.md",
);
let renderedPrompt = await readFile(templatePath, "utf8");
for (const [key, value] of Object.entries(replacements)) {
  renderedPrompt = renderedPrompt.replaceAll(`{{${key}}}`, value);
}

const unresolvedPlaceholders =
  renderedPrompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
if (unresolvedPlaceholders.length > 0) {
  throw new Error(
    `Unresolved placeholders: ${[...new Set(unresolvedPlaceholders)].join(", ")}`,
  );
}

const outputPath = resolve(
  repositoryRoot,
  argumentsMap.out ??
    `work/algorithm-interview-course/prompts/${lessonId}-video-evidence-v1.3.md`,
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderedPrompt, "utf8");

process.stdout.write(`${outputPath}\n`);
