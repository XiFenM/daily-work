import { spawnSync } from "node:child_process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectDirectory, "../..");
const sourceDirectory = resolve(
  process.argv[2] ??
    join(repositoryRoot, "work/algorithm-interview-course-notes/source-videos"),
);
const outlinePath = join(projectDirectory, "inputs/course-outline.json");
const inventoryPath = join(projectDirectory, "inputs/media-inventory.json");
const collator = new Intl.Collator("zh-CN", { numeric: true });

const toRepositoryPath = (absolutePath) =>
  relative(repositoryRoot, absolutePath).split(sep).join("/");

const probeVideo = (absolutePath) => {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-print_format",
      "json",
      absolutePath,
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );

  if (result.error || result.status !== 0) {
    const reason = result.error?.message || result.stderr || "unknown error";
    throw new Error(`FFprobe failed for ${absolutePath}: ${reason}`);
  }

  const probe = JSON.parse(result.stdout);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const audio = probe.streams?.find((stream) => stream.codec_type === "audio");

  return {
    format: probe.format?.format_name ?? null,
    durationSeconds: Number.parseFloat(probe.format?.duration ?? "0"),
    sizeBytes: Number.parseInt(probe.format?.size ?? "0", 10),
    video: video
      ? {
          codec: video.codec_name ?? null,
          width: video.width ?? null,
          height: video.height ?? null,
          frameRate: video.r_frame_rate ?? null,
        }
      : null,
    audio: audio
      ? {
          codec: audio.codec_name ?? null,
          sampleRate: audio.sample_rate ?? null,
          channels: audio.channels ?? null,
        }
      : null,
  };
};

const outline = JSON.parse(await readFile(outlinePath, "utf8"));
const lessons = outline.chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({
    ...lesson,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    contentType: lesson.contentType ?? outline.defaultContentType,
  })),
);
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const directoryEntries = (
  await readdir(sourceDirectory, { withFileTypes: true })
)
  .filter((entry) => entry.isFile())
  .sort((left, right) => collator.compare(left.name, right.name));

const items = [];
const anomalies = [];
const seenIds = new Set();

for (const entry of directoryEntries) {
  const idMatch = entry.name.match(/^(\d+-\d+)(?:\s|$)/u);
  const extension = extname(entry.name).toLowerCase();
  const absolutePath = join(sourceDirectory, entry.name);

  if (!idMatch) {
    anomalies.push({
      type: "unmatched_filename",
      path: toRepositoryPath(absolutePath),
      detail: "Filename does not begin with a lesson ID.",
    });
    continue;
  }

  const lessonId = idMatch[1];
  const lesson = lessonById.get(lessonId);
  if (seenIds.has(lessonId)) {
    anomalies.push({
      type: "duplicate_lesson_id",
      lessonId,
      path: toRepositoryPath(absolutePath),
    });
  }
  seenIds.add(lessonId);

  const contentType = extension === ".mp4" ? "video" : "article";
  const fileStats = await stat(absolutePath);
  const fileTitle = entry.name
    .replace(/\.(?:mp4|md)$/iu, "")
    .replace(/^\d+-\d+\s*/u, "")
    .replace(/_慕课网$/u, "");
  const media = contentType === "video" ? probeVideo(absolutePath) : null;

  if (!lesson) {
    anomalies.push({
      type: "unexpected_lesson_id",
      lessonId,
      path: toRepositoryPath(absolutePath),
    });
  } else if (lesson.contentType !== contentType) {
    anomalies.push({
      type: "content_type_mismatch",
      lessonId,
      expected: lesson.contentType,
      actual: contentType,
    });
  }

  if (media && (!media.video || !media.audio)) {
    anomalies.push({
      type: "missing_stream",
      lessonId,
      videoPresent: Boolean(media.video),
      audioPresent: Boolean(media.audio),
    });
  }

  const durationDeltaSeconds =
    media && lesson?.declaredDurationSeconds !== null
      ? Number(
          (media.durationSeconds - lesson.declaredDurationSeconds).toFixed(3),
        )
      : null;
  if (durationDeltaSeconds !== null && Math.abs(durationDeltaSeconds) > 5) {
    anomalies.push({
      type: "duration_mismatch",
      lessonId,
      declaredDurationSeconds: lesson.declaredDurationSeconds,
      actualDurationSeconds: media.durationSeconds,
      deltaSeconds: durationDeltaSeconds,
    });
  }

  items.push({
    lessonId,
    order: lesson?.order ?? null,
    chapterId: lesson?.chapterId ?? null,
    expectedTitle: lesson?.title ?? null,
    fileTitle,
    contentType,
    path: toRepositoryPath(absolutePath),
    sizeBytes: fileStats.size,
    declaredDurationSeconds: lesson?.declaredDurationSeconds ?? null,
    actualDurationSeconds: media?.durationSeconds ?? null,
    durationDeltaSeconds,
    status: contentType === "video" ? "probed" : "matched",
    media,
  });
}

for (const lesson of lessons) {
  if (!seenIds.has(lesson.id)) {
    anomalies.push({
      type: "missing_lesson_content",
      lessonId: lesson.id,
      expectedTitle: lesson.title,
    });
  }
}

const videoItems = items.filter((item) => item.contentType === "video");
const articleItems = items.filter((item) => item.contentType === "article");
const inventory = {
  version: 1,
  scannedAt: new Date().toISOString(),
  sourceDirectory: toRepositoryPath(sourceDirectory),
  summary: {
    expectedLessons: lessons.length,
    discoveredFiles: directoryEntries.length,
    matchedItems: items.length,
    videos: videoItems.length,
    articles: articleItems.length,
    totalBytes: items.reduce((total, item) => total + item.sizeBytes, 0),
    totalVideoDurationSeconds: Number(
      videoItems
        .reduce((total, item) => total + (item.actualDurationSeconds ?? 0), 0)
        .toFixed(3),
    ),
    anomalyCount: anomalies.length,
  },
  anomalies,
  items,
};

await writeFile(
  inventoryPath,
  `${JSON.stringify(inventory, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(inventory.summary, null, 2)}\n`);

const fatalTypes = new Set([
  "unmatched_filename",
  "duplicate_lesson_id",
  "unexpected_lesson_id",
  "content_type_mismatch",
  "missing_stream",
  "missing_lesson_content",
]);
if (anomalies.some((anomaly) => fatalTypes.has(anomaly.type))) {
  process.exitCode = 1;
}
