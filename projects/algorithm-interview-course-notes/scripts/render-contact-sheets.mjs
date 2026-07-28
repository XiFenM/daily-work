import { spawn } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const selectors = process.argv.slice(2);
if (selectors.length === 0) {
  throw new Error(
    "Usage: node render-contact-sheets.mjs <lesson-id|chapter:N> [...selectors]",
  );
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
const lessonIds = new Set(
  outline.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => lesson.id),
  ),
);
const selectedIds = new Set();

for (const selector of selectors) {
  if (selector.startsWith("chapter:")) {
    const chapterId = selector.slice("chapter:".length);
    const chapter = outline.chapters.find((item) => item.id === chapterId);
    if (!chapter) throw new Error(`Unknown chapter selector: ${selector}`);
    for (const lesson of chapter.lessons) selectedIds.add(lesson.id);
  } else {
    if (!lessonIds.has(selector)) {
      throw new Error(`Unknown lesson ID: ${selector}`);
    }
    selectedIds.add(selector);
  }
}

const exists = (path) =>
  access(path)
    .then(() => true)
    .catch(() => false);
const run = (command, args) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: ["ignore", "ignore", "inherit"],
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });

const outputDirectory = join(
  repositoryRoot,
  "outputs/algorithm-interview-course-notes/reports/contact-sheets",
);
await mkdir(outputDirectory, { recursive: true });

for (const item of inventory.items) {
  if (!selectedIds.has(item.lessonId) || item.contentType !== "video") continue;
  const outputPath = join(outputDirectory, `${item.lessonId}.jpg`);
  if (await exists(outputPath)) {
    process.stdout.write(`[skip] ${item.lessonId}\n`);
    continue;
  }
  const duration = item.actualDurationSeconds;
  if (!(typeof duration === "number" && duration > 0)) {
    throw new Error(`Missing duration for ${item.lessonId}.`);
  }
  const interval = Math.max(1, duration / 8);
  const filter = [
    `fps=1/${interval}`,
    "scale=480:-2",
    "tile=4x2:padding=8:margin=8:color=white",
  ].join(",");
  process.stdout.write(`[render] ${item.lessonId}\n`);
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-n",
    "-i",
    item.path,
    "-vf",
    filter,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outputPath,
  ]);
}
