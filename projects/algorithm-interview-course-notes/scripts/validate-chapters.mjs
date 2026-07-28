import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const chaptersDirectory = join(projectDirectory, "notes/chapters");
const outline = JSON.parse(
  await readFile(join(projectDirectory, "inputs/course-outline.json"), "utf8"),
);
const relationModel = JSON.parse(
  await readFile(join(projectDirectory, "inputs/relation-model.json"), "utf8"),
);
const chapterById = new Map(
  outline.chapters.map((chapter) => [chapter.id, chapter]),
);
const allowedRelationTypes = new Set(Object.keys(relationModel.relationTypes));
const allowedEvidenceSources = new Set(
  Object.keys(relationModel.evidenceSources),
);
const requestedIds = process.argv.slice(2);
const chapterIds =
  requestedIds.length > 0
    ? requestedIds
    : (await readdir(chaptersDirectory))
        .filter((name) => /^\d+\.md$/u.test(name))
        .map((name) => name.replace(/\.md$/u, ""));
const requiredHeadings = [
  "## 本章解决什么问题",
  "## 概念与方法演进",
  "## 题型识别与决策表",
  "## 方法对照",
  "## 章节级正确性框架",
  "## 面试表达模板",
  "## 易错点与反例",
  "## 章内练习路线",
  "## 未解决问题",
  "## 已验证关系",
];
const results = [];

for (const chapterId of chapterIds.sort(
  (left, right) => Number(left) - Number(right),
)) {
  const issues = [];
  const chapter = chapterById.get(chapterId);
  if (!chapter) issues.push("Chapter is missing from the course outline.");
  let note;
  try {
    note = await readFile(join(chaptersDirectory, `${chapterId}.md`), "utf8");
  } catch (error) {
    issues.push(`Cannot read chapter note: ${error.message}`);
    results.push({ chapterId, issues });
    continue;
  }

  for (const heading of requiredHeadings) {
    if (!note.includes(heading)) issues.push(`Missing heading: ${heading}`);
  }
  for (const lesson of chapter?.lessons ?? []) {
    if (!note.includes(`\`${lesson.id}\``)) {
      issues.push(`Chapter synthesis does not cite lesson ${lesson.id}.`);
    }
  }

  const jsonBlocks = [...note.matchAll(/```json\s*([\s\S]*?)```/gu)];
  let relationPayload;
  for (const block of jsonBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      if (parsed.chapterId === chapterId) relationPayload = parsed;
    } catch (error) {
      issues.push(`Invalid JSON block: ${error.message}`);
    }
  }
  if (!relationPayload) {
    issues.push("Missing machine-readable chapter relation JSON.");
  } else {
    for (const edge of relationPayload.acceptedEdges ?? []) {
      if (!allowedRelationTypes.has(edge.type)) {
        issues.push(`Invalid relation type: ${edge.type}`);
      }
      if (!allowedEvidenceSources.has(edge.evidenceSource)) {
        issues.push(`Invalid evidence source: ${edge.evidenceSource}`);
      }
      if (!new Set(["high", "medium"]).has(edge.confidence)) {
        issues.push(`Accepted edge has invalid confidence: ${edge.confidence}`);
      }
      if (!Array.isArray(edge.evidence) || edge.evidence.length === 0) {
        issues.push(
          `Accepted edge ${edge.id ?? "<missing-id>"} has no evidence.`,
        );
      }
      if (
        edge.type === "prerequisite_for" &&
        edge.evidenceSource === "outline_structural"
      ) {
        issues.push(
          `Accepted edge ${edge.id ?? "<missing-id>"} uses outline-only prerequisite evidence.`,
        );
      }
    }
  }
  results.push({
    chapterId,
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
