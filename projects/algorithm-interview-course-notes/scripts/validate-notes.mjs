import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const notesDirectory = join(projectDirectory, "notes/lessons");
const outline = JSON.parse(
  await readFile(join(projectDirectory, "inputs/course-outline.json"), "utf8"),
);
const inventory = JSON.parse(
  await readFile(join(projectDirectory, "inputs/media-inventory.json"), "utf8"),
);
const relationModel = JSON.parse(
  await readFile(join(projectDirectory, "inputs/relation-model.json"), "utf8"),
);
const lessons = outline.chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({
    ...lesson,
    chapterId: chapter.id,
    contentType: lesson.contentType ?? outline.defaultContentType,
  })),
);
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const inventoryById = new Map(
  inventory.items.map((item) => [item.lessonId, item]),
);
const allowedRelationTypes = new Set(Object.keys(relationModel.relationTypes));
const allowedEvidenceSources = new Set(
  Object.keys(relationModel.evidenceSources),
);
const requestedIds = process.argv.slice(2);
const noteIds =
  requestedIds.length > 0
    ? requestedIds
    : (await readdir(notesDirectory))
        .filter((name) => /^\d+-\d+\.md$/u.test(name))
        .map((name) => name.replace(/\.md$/u, ""));
const requiredVideoHeadings = [
  "## 一句话定位",
  "## 学习目标",
  "## 时间线",
  "## 详细笔记",
  "## 问题与解法",
  "## 正确性与不变量",
  "## 复杂度",
  "## 面试视角",
  "## 易错点与边界测试",
  "## 与其他课程的联系候选",
  "## 复习清单",
  "## 不确定项",
  "## 覆盖自检",
];
const requiredArticleHeadings = [
  "## 一句话定位",
  "## 核心问题与结论",
  "## 论证或内容结构",
  "## 算法、复杂度或实践建议",
  "## 面试与学习启示",
  "## 易误解之处",
  "## 与其他课程的联系候选",
  "## 复习问题",
  "## 不确定项",
  "## 覆盖自检",
];

const results = [];

for (const lessonId of noteIds.sort((left, right) =>
  left.localeCompare(right, undefined, { numeric: true }),
)) {
  const issues = [];
  const lesson = lessonById.get(lessonId);
  const inventoryItem = inventoryById.get(lessonId);
  if (!lesson || !inventoryItem) {
    issues.push("Lesson is missing from the outline or media inventory.");
  }

  let note;
  try {
    note = await readFile(join(notesDirectory, `${lessonId}.md`), "utf8");
  } catch (error) {
    issues.push(`Cannot read note: ${error.message}`);
    results.push({ lessonId, issues });
    continue;
  }

  if (!note.startsWith("---\n")) {
    issues.push("Note must begin with a YAML front matter delimiter.");
  }
  const frontMatterMatch = note.match(/^---\n([\s\S]*?)\n---\n/u);
  if (!frontMatterMatch) {
    issues.push("YAML front matter is missing or malformed.");
  } else {
    const frontMatter = Object.fromEntries(
      frontMatterMatch[1]
        .split("\n")
        .map((line) => line.match(/^([^:]+):\s*"?([^"\n]*)"?$/u))
        .filter(Boolean)
        .map((match) => [match[1].trim(), match[2].trim()]),
    );
    if (frontMatter.lessonId !== lessonId) {
      issues.push(
        `Front matter lessonId is ${frontMatter.lessonId ?? "missing"}.`,
      );
    }
    if (!new Set(["draft", "reviewed"]).has(frontMatter.analysisStatus)) {
      issues.push("analysisStatus must be draft or reviewed.");
    }
  }

  const requiredHeadings =
    lesson?.contentType === "article"
      ? requiredArticleHeadings
      : requiredVideoHeadings;
  for (const heading of requiredHeadings) {
    if (!note.includes(heading)) {
      issues.push(`Missing required heading: ${heading}`);
    }
  }

  const maximumTimestamp = inventoryItem?.actualDurationSeconds;
  if (maximumTimestamp !== null && maximumTimestamp !== undefined) {
    for (const match of note.matchAll(/(?<!\d)(\d{2}):([0-5]\d)(?!\d)/gu)) {
      const timestampSeconds = Number(match[1]) * 60 + Number(match[2]);
      if (timestampSeconds > maximumTimestamp + 2) {
        issues.push(
          `Timestamp ${match[0]} exceeds the video duration ${maximumTimestamp}s.`,
        );
      }
    }
  }

  const jsonBlocks = [...note.matchAll(/```json\s*([\s\S]*?)```/gu)];
  let relationPayload;
  for (const block of jsonBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      if (parsed.lessonId === lessonId) relationPayload = parsed;
    } catch (error) {
      issues.push(`Invalid JSON block: ${error.message}`);
    }
  }
  if (!relationPayload) {
    issues.push("Missing machine-readable relation JSON for this lesson.");
  } else {
    for (const concept of relationPayload.concepts ?? []) {
      if (!new Set(["introduces", "deepens", "applies"]).has(concept.role)) {
        issues.push(`Invalid concept role: ${concept.role}`);
      }
      if (!allowedEvidenceSources.has(concept.evidenceSource)) {
        issues.push(
          `Invalid concept evidence source: ${concept.evidenceSource}`,
        );
      }
    }
    for (const relation of relationPayload.relationCandidates ?? []) {
      if (!allowedRelationTypes.has(relation.type)) {
        issues.push(`Invalid relation type: ${relation.type}`);
      }
      if (!allowedEvidenceSources.has(relation.evidenceSource)) {
        issues.push(
          `Invalid relation evidence source: ${relation.evidenceSource}`,
        );
      }
      if (!new Set(["high", "medium", "low"]).has(relation.confidence)) {
        issues.push(`Invalid relation confidence: ${relation.confidence}`);
      }
      if (
        relation.type === "prerequisite_for" &&
        relation.evidenceSource === "outline_structural"
      ) {
        issues.push(
          "prerequisite_for cannot be supported only by outline_structural evidence.",
        );
      }
    }
  }

  results.push({
    lessonId,
    contentType: lesson?.contentType ?? null,
    status: issues.length === 0 ? "valid" : "invalid",
    issues,
  });
}

const summary = {
  checked: results.length,
  valid: results.filter((result) => result.issues.length === 0).length,
  invalid: results.filter((result) => result.issues.length > 0).length,
};
process.stdout.write(`${JSON.stringify({ summary, results }, null, 2)}\n`);
if (summary.invalid > 0) process.exitCode = 1;
