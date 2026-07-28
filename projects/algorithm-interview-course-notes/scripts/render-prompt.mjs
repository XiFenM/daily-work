import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const lessonId = process.argv[2];
if (!lessonId) {
  throw new Error("Usage: node render-prompt.mjs <lesson-id>");
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectDirectory, "../..");
const outline = JSON.parse(
  await readFile(join(projectDirectory, "inputs/course-outline.json"), "utf8"),
);
const inventory = JSON.parse(
  await readFile(join(projectDirectory, "inputs/media-inventory.json"), "utf8"),
);
const lessons = outline.chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({
    ...lesson,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    contentType: lesson.contentType ?? outline.defaultContentType,
  })),
);
const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
if (lessonIndex === -1) {
  throw new Error(`Unknown lesson ID: ${lessonId}`);
}

const lesson = lessons[lessonIndex];
const inventoryItem = inventory.items.find(
  (item) => item.lessonId === lessonId,
);
if (!inventoryItem) {
  throw new Error(`No inventory item found for lesson ${lessonId}.`);
}

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "unknown";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  const base = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  return hours > 0 ? `${String(hours).padStart(2, "0")}:${base}` : base;
};

const neighborOutline = lessons
  .slice(Math.max(0, lessonIndex - 2), lessonIndex + 3)
  .filter((neighbor) => neighbor.id !== lesson.id)
  .map(
    (neighbor) =>
      `${neighbor.id} ${neighbor.title}（${neighbor.contentType === "article" ? "文章" : "视频"}）`,
  )
  .join("；");
const templateName =
  lesson.contentType === "article"
    ? "article-understanding.md"
    : "lesson-understanding.md";
const template = await readFile(
  join(projectDirectory, "prompts", templateName),
  "utf8",
);
const replacements = {
  course_title: outline.courseTitle,
  chapter_id: lesson.chapterId,
  chapter_title: lesson.chapterTitle,
  lesson_id: lesson.id,
  lesson_title: lesson.title,
  declared_duration: lesson.declaredDuration ?? "unknown",
  actual_duration: formatDuration(inventoryItem.actualDurationSeconds),
  neighbor_outline: neighborOutline || "无",
};

let rendered = template;
for (const [key, value] of Object.entries(replacements)) {
  rendered = rendered.replaceAll(`{{${key}}}`, value);
}
if (lesson.contentType === "article") {
  const article = await readFile(
    join(repositoryRoot, inventoryItem.path),
    "utf8",
  );
  rendered += `\n# 待分析文章全文\n\n<article>\n${article}\n</article>\n`;
}
const unresolved = [...rendered.matchAll(/\{\{([^}]+)\}\}/gu)].map(
  (match) => match[1],
);
if (unresolved.length > 0) {
  throw new Error(`Unresolved prompt placeholders: ${unresolved.join(", ")}`);
}

const outputPath = join(
  repositoryRoot,
  "work/algorithm-interview-course-notes/prompts",
  `${lesson.id}.md`,
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, rendered, "utf8");
process.stdout.write(
  `${JSON.stringify(
    {
      lessonId: lesson.id,
      contentType: lesson.contentType,
      inputPath: inventoryItem.path,
      promptPath: outputPath.slice(repositoryRoot.length + 1),
      notePath: `projects/algorithm-interview-course-notes/notes/lessons/${lesson.id}.md`,
      actualDuration: formatDuration(inventoryItem.actualDurationSeconds),
    },
    null,
    2,
  )}\n`,
);
