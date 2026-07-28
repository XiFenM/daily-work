import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const chapterId = process.argv[2];
if (!chapterId) {
  throw new Error("Usage: node render-chapter-prompt.mjs <chapter-id>");
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectDirectory, "../..");
const outline = JSON.parse(
  await readFile(join(projectDirectory, "inputs/course-outline.json"), "utf8"),
);
const state = JSON.parse(
  await readFile(join(projectDirectory, "processing-state.json"), "utf8"),
);
const chapter = outline.chapters.find((item) => item.id === chapterId);
if (!chapter) {
  throw new Error(`Unknown chapter ID: ${chapterId}`);
}

const incomplete = chapter.lessons.filter(
  (lesson) => state.lessons[lesson.id]?.status !== "reviewed",
);
if (incomplete.length > 0) {
  throw new Error(
    `Chapter ${chapterId} has unreviewed lessons: ${incomplete
      .map((lesson) => lesson.id)
      .join(", ")}`,
  );
}

const noteSections = [];
for (const lesson of chapter.lessons) {
  const notePath = join(projectDirectory, "notes/lessons", `${lesson.id}.md`);
  const note = await readFile(notePath, "utf8");
  noteSections.push(
    `\n<lesson-note id="${lesson.id}" path="projects/algorithm-interview-course-notes/notes/lessons/${lesson.id}.md">\n${note}\n</lesson-note>`,
  );
}

const template = await readFile(
  join(projectDirectory, "prompts/chapter-synthesis.md"),
  "utf8",
);
const rendered = template
  .replaceAll("{{chapter_id}}", chapter.id)
  .replaceAll("{{chapter_title}}", chapter.title)
  .replaceAll("{{lesson_notes}}", noteSections.join("\n"));
const unresolved = [...rendered.matchAll(/\{\{([^}]+)\}\}/gu)].map(
  (match) => match[1],
);
if (unresolved.length > 0) {
  throw new Error(`Unresolved prompt placeholders: ${unresolved.join(", ")}`);
}

const outputPath = join(
  repositoryRoot,
  "work/algorithm-interview-course-notes/prompts",
  `chapter-${chapter.id}.md`,
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, rendered, "utf8");
process.stdout.write(
  `${JSON.stringify(
    {
      chapterId: chapter.id,
      lessonIds: chapter.lessons.map((lesson) => lesson.id),
      promptPath: outputPath.slice(repositoryRoot.length + 1),
      notePath: `projects/algorithm-interview-course-notes/notes/chapters/${chapter.id}.md`,
    },
    null,
    2,
  )}\n`,
);
