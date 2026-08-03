import { access, readdir, readFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectRoot, "../..");

const readJson = async (path) =>
  JSON.parse(await readFile(resolve(projectRoot, path), "utf8"));

const [outline, project, progress, catalog, manifest, relationships, concepts] =
  await Promise.all([
    readJson("course-outline.json"),
    readJson("project.json"),
    readJson("progress.json"),
    readJson("inputs/source-catalog.json"),
    readJson("manifest.json"),
    readJson("notes/relationships.json"),
    readJson("notes/concepts.json"),
  ]);

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const chapters = new Map();
const lessons = new Map();
for (const chapter of outline.chapters ?? []) {
  check(!chapters.has(chapter.id), `Duplicate chapter ID: ${chapter.id}`);
  chapters.set(chapter.id, chapter);
  for (const lesson of chapter.lessons ?? []) {
    check(!lessons.has(lesson.id), `Duplicate lesson ID: ${lesson.id}`);
    lessons.set(lesson.id, lesson);
  }
}
check(
  lessons.size === project.expectedLessons,
  `Outline has ${lessons.size} lessons; expected ${project.expectedLessons}.`,
);

const knownDurationSeconds = (outline.chapters ?? []).reduce(
  (total, chapter) => total + (chapter.knownDurationSeconds ?? 0),
  0,
);
check(
  Math.abs(knownDurationSeconds - project.knownDurationSeconds) < 0.01,
  `Project duration ${project.knownDurationSeconds} does not match chapter total ${knownDurationSeconds}.`,
);

const assets = new Map();
for (const item of catalog.items ?? []) {
  check(!assets.has(item.assetId), `Duplicate asset ID: ${item.assetId}`);
  assets.set(item.assetId, item);
  check(
    /^[a-f0-9]{64}$/.test(item.sha256),
    `Invalid SHA-256 for ${item.assetId}.`,
  );
  for (const lessonId of item.lessonIds ?? []) {
    check(
      lessons.has(lessonId),
      `${item.assetId} references unknown lesson ${lessonId}.`,
    );
  }
}

const normalizedDirectory = resolve(
  repositoryRoot,
  "outputs/algorithm-interview-course/understanding/normalized",
);
const normalizedFiles = (await readdir(normalizedDirectory))
  .filter((name) => name.endsWith(".json"))
  .sort();
const normalizedByLesson = new Map();
const evidenceIndex = new Map();

const collectEvidenceIds = (value, result = []) => {
  if (Array.isArray(value)) {
    for (const item of value) collectEvidenceIds(item, result);
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    if (key === "evidenceIds" && Array.isArray(child)) {
      result.push(...child);
    } else if (key !== "evidence") {
      collectEvidenceIds(child, result);
    }
  }
  return result;
};

for (const filename of normalizedFiles) {
  const evidenceDocument = JSON.parse(
    await readFile(resolve(normalizedDirectory, filename), "utf8"),
  );
  const lessonId = evidenceDocument.lessonId;
  check(lessons.has(lessonId), `${filename} has unknown lesson ${lessonId}.`);
  check(
    !normalizedByLesson.has(lessonId),
    `Duplicate normalized evidence for ${lessonId}.`,
  );
  normalizedByLesson.set(lessonId, evidenceDocument);

  const localEvidenceIds = new Set();
  for (const evidence of evidenceDocument.evidence ?? []) {
    check(
      !localEvidenceIds.has(evidence.id),
      `${lessonId} has duplicate evidence ID ${evidence.id}.`,
    );
    localEvidenceIds.add(evidence.id);
    evidenceIndex.set(`${lessonId}:${evidence.id}`, evidence);
    check(
      evidence.startMs === null ||
        evidence.endMs === null ||
        evidence.startMs <= evidence.endMs,
      `${lessonId}:${evidence.id} has an inverted time range.`,
    );
    check(
      evidence.endMs === null ||
        evidenceDocument.actualDurationSeconds === null ||
        evidence.endMs <= evidenceDocument.actualDurationSeconds * 1000 + 1000,
      `${lessonId}:${evidence.id} exceeds the media duration.`,
    );
  }

  for (const evidenceId of collectEvidenceIds(evidenceDocument)) {
    check(
      localEvidenceIds.has(evidenceId),
      `${lessonId} references missing evidence ${evidenceId}.`,
    );
  }
}

const attemptIds = new Set();
const attemptRequestIds = new Set();
const attemptsById = new Map();
const attemptsByLesson = new Map();
const allowedAttemptOutcomes = new Set([
  "accepted",
  "rejected",
  "http_error",
  "network_error",
]);
for (const attempt of manifest.attempts ?? []) {
  check(
    typeof attempt.attemptId === "string" && attempt.attemptId.length > 0,
    "Manifest attempt is missing attemptId.",
  );
  check(
    !attemptIds.has(attempt.attemptId),
    `Duplicate manifest attempt ID: ${attempt.attemptId}`,
  );
  attemptIds.add(attempt.attemptId);
  attemptsById.set(attempt.attemptId, attempt);
  check(
    lessons.has(attempt.lessonId),
    `${attempt.attemptId} references unknown lesson ${attempt.lessonId}.`,
  );
  const lessonAttempts = attemptsByLesson.get(attempt.lessonId) ?? [];
  lessonAttempts.push(attempt);
  attemptsByLesson.set(attempt.lessonId, lessonAttempts);
  check(
    allowedAttemptOutcomes.has(attempt.outcome),
    `${attempt.attemptId} has unsupported outcome ${attempt.outcome}.`,
  );
  if (attempt.requestId !== null) {
    check(
      typeof attempt.requestId === "string" && attempt.requestId.length > 0,
      `${attempt.attemptId} has an invalid requestId.`,
    );
    check(
      !attemptRequestIds.has(attempt.requestId),
      `Duplicate attempt request ID: ${attempt.requestId}`,
    );
    attemptRequestIds.add(attempt.requestId);
  }
  if (attempt.outcome === "accepted") {
    check(
      attempt.validation?.status === "passed",
      `${attempt.attemptId} is accepted without passed validation.`,
    );
    if (
      new Set([
        "video-evidence-v1.4",
        "video-evidence-v1.5",
        "video-evidence-v1.6",
        "video-evidence-v1.7",
      ]).has(attempt.promptVersion)
    ) {
      check(
        attempt.validation?.qaStatus === "completed",
        `${attempt.attemptId} is an accepted ${attempt.promptVersion} attempt without completed QA.`,
      );
    }
    check(
      attempt.eligibleForSynthesis === true,
      `${attempt.attemptId} is accepted but not eligible for synthesis.`,
    );
    check(
      typeof attempt.requestId === "string",
      `${attempt.attemptId} is accepted without a request ID.`,
    );
  } else {
    check(
      attempt.eligibleForSynthesis === false,
      `${attempt.attemptId} failed but is eligible for synthesis.`,
    );
    if (attempt.outcome === "rejected") {
      check(
        attempt.validation?.status === "failed",
        `${attempt.attemptId} is rejected without failed validation.`,
      );
      check(
        typeof attempt.requestId === "string",
        `${attempt.attemptId} is rejected without a request ID.`,
      );
    } else {
      check(
        attempt.validation?.status === "not_run",
        `${attempt.attemptId} has a transport failure but validation ran.`,
      );
    }
  }
}

const requestIds = new Set();
const generationsByRequestId = new Map();
const generationsByAttemptId = new Map();
const manifestOutputPaths = new Set();
for (const generation of manifest.generations ?? []) {
  check(
    !requestIds.has(generation.requestId),
    `Duplicate manifest request ID: ${generation.requestId}`,
  );
  requestIds.add(generation.requestId);
  generationsByRequestId.set(generation.requestId, generation);
  if (generation.attemptId) {
    check(
      !generationsByAttemptId.has(generation.attemptId),
      `Duplicate generation attempt ID: ${generation.attemptId}.`,
    );
    generationsByAttemptId.set(generation.attemptId, generation);
    const attempt = attemptsById.get(generation.attemptId);
    check(
      Boolean(attempt),
      `Generation ${generation.requestId} references missing attempt ${generation.attemptId}.`,
    );
    check(
      attempt?.requestId === generation.requestId,
      `Generation ${generation.requestId} does not match its attempt request ID.`,
    );
    check(
      attempt?.outcome === generation.outcome,
      `Generation ${generation.requestId} outcome does not match its attempt.`,
    );
  }

  for (const pathOrUrl of [
    ...(generation.inputs ?? []),
    ...(generation.outputs ?? []),
  ]) {
    if (/^https?:\/\//.test(pathOrUrl)) continue;
    if ((generation.outputs ?? []).includes(pathOrUrl)) {
      manifestOutputPaths.add(pathOrUrl);
    }
    try {
      await access(resolve(repositoryRoot, pathOrUrl));
    } catch {
      errors.push(
        `Manifest request ${generation.requestId} references missing path ${pathOrUrl}.`,
      );
    }
  }

  const normalizedPath = (generation.outputs ?? []).find((path) =>
    path.includes("/understanding/normalized/"),
  );
  if (normalizedPath) {
    const lessonId = basename(normalizedPath, ".json");
    const evidenceDocument = normalizedByLesson.get(lessonId);
    check(
      evidenceDocument?.provenance?.requestId === generation.requestId,
      `${lessonId} provenance request ID does not match the manifest.`,
    );
    check(
      evidenceDocument?.provenance?.model === generation.model,
      `${lessonId} provenance model does not match the manifest.`,
    );
    check(
      evidenceDocument?.provenance?.promptVersion ===
        generation.parameters?.promptVersion,
      `${lessonId} prompt version does not match the manifest.`,
    );
  }
  if (generation.outcome === "accepted") {
    check(
      generation.eligibleForSynthesis === true,
      `Accepted generation ${generation.requestId} is not eligible for synthesis.`,
    );
    check(
      Boolean(normalizedPath),
      `Accepted generation ${generation.requestId} has no normalized output.`,
    );
  }
  if (generation.outcome === "rejected") {
    check(
      generation.eligibleForSynthesis === false,
      `Rejected generation ${generation.requestId} is eligible for synthesis.`,
    );
    check(
      !normalizedPath,
      `Rejected generation ${generation.requestId} has a normalized output.`,
    );
  }
}

for (const attempt of manifest.attempts ?? []) {
  const generation = generationsByAttemptId.get(attempt.attemptId);
  if (attempt.outcome === "accepted" || attempt.outcome === "rejected") {
    check(
      Boolean(generation),
      `${attempt.attemptId} produced a model response but has no generation record.`,
    );
  } else {
    check(
      !generation,
      `${attempt.attemptId} is a transport failure but has a generation record.`,
    );
  }
}

for (const artifactDirectory of ["raw", "retries"]) {
  const absoluteDirectory = resolve(
    repositoryRoot,
    `outputs/algorithm-interview-course/understanding/${artifactDirectory}`,
  );
  for (const filename of await readdir(absoluteDirectory)) {
    if (!filename.endsWith(".json")) continue;
    const artifactPath = relative(
      repositoryRoot,
      resolve(absoluteDirectory, filename),
    ).replaceAll("\\", "/");
    check(
      manifestOutputPaths.has(artifactPath),
      `Orphan understanding artifact is not in the manifest: ${artifactPath}.`,
    );
  }
}

const completedLessons = Object.entries(progress.lessons ?? {})
  .filter(([, state]) => state.lessonNote === "completed")
  .map(([lessonId]) => lessonId);
for (const lessonId of completedLessons) {
  const lessonState = progress.lessons[lessonId];
  try {
    await access(resolve(projectRoot, `notes/lessons/${lessonId}.md`));
  } catch {
    errors.push(`Completed lesson ${lessonId} has no formal note.`);
  }
  check(
    lessonState.qa === "completed",
    `Completed lesson ${lessonId} does not have completed QA.`,
  );
  check(
    normalizedByLesson.has(lessonId),
    `Completed video lesson ${lessonId} has no normalized evidence.`,
  );
}
check(
  completedLessons.length === progress.summary.synthesizedLessons,
  `Progress reports ${progress.summary.synthesizedLessons} synthesized lessons; found ${completedLessons.length}.`,
);
check(
  normalizedByLesson.size === progress.summary.understoodLessons,
  `Progress reports ${progress.summary.understoodLessons} understood lessons; found ${normalizedByLesson.size}.`,
);
for (const [lessonId, state] of Object.entries(progress.lessons ?? {})) {
  if (state.videoEvidence === "completed") {
    check(
      normalizedByLesson.has(lessonId),
      `Completed video evidence ${lessonId} has no normalized document.`,
    );
    const lessonAttempts = attemptsByLesson.get(lessonId) ?? [];
    if (lessonAttempts.length > 0) {
      check(
        lessonAttempts.some((attempt) => attempt.outcome === "accepted"),
        `Completed video evidence ${lessonId} has no accepted attempt.`,
      );
    }
  }
  if (state.understandingAttempts !== undefined) {
    const lessonAttempts = attemptsByLesson.get(lessonId) ?? [];
    check(
      state.understandingAttempts === lessonAttempts.length,
      `${lessonId} reports ${state.understandingAttempts} attempts; found ${lessonAttempts.length}.`,
    );
    check(
      state.rejectedAttempts ===
        lessonAttempts.filter((attempt) => attempt.outcome === "rejected")
          .length,
      `${lessonId} rejected attempt count does not match the manifest.`,
    );
    check(
      state.transportFailures ===
        lessonAttempts.filter((attempt) =>
          ["http_error", "network_error"].includes(attempt.outcome),
        ).length,
      `${lessonId} transport failure count does not match the manifest.`,
    );
  }
}

const chapterNotes = (
  await readdir(resolve(projectRoot, "notes/chapters"))
).filter((name) => /^\d{2}\.md$/.test(name));
const chapterNoteIds = new Set(
  chapterNotes.map((filename) => basename(filename, ".md")),
);
check(
  chapterNotes.length === progress.summary.synthesizedChapters,
  `Progress reports ${progress.summary.synthesizedChapters} chapter summaries; found ${chapterNotes.length}.`,
);

const edgeIds = new Set();
let verifiedRelationshipEdges = 0;
for (const edge of relationships.edges ?? []) {
  check(!edgeIds.has(edge.id), `Duplicate relationship edge ID: ${edge.id}`);
  edgeIds.add(edge.id);
  check(
    relationships.allowedTypes.includes(edge.type),
    `${edge.id} has unsupported type ${edge.type}.`,
  );
  check(
    lessons.has(edge.from.replace("lesson:", "")),
    `${edge.id} has unknown source.`,
  );
  check(
    lessons.has(edge.to.replace("lesson:", "")),
    `${edge.id} has unknown target.`,
  );
  if (edge.status === "verified") {
    verifiedRelationshipEdges += 1;
    check(edge.evidence.length > 0, `${edge.id} is verified without evidence.`);
  }
  for (const item of edge.evidence ?? []) {
    const evidenceDocument = normalizedByLesson.get(item.lessonId);
    if (!evidenceDocument) continue;
    check(
      item.endMs === null ||
        item.endMs <= evidenceDocument.actualDurationSeconds * 1000 + 1000,
      `${edge.id} evidence exceeds ${item.lessonId} duration.`,
    );
  }
}
check(
  verifiedRelationshipEdges === progress.summary.verifiedRelationshipEdges,
  `Progress reports ${progress.summary.verifiedRelationshipEdges} verified edges; found ${verifiedRelationshipEdges}.`,
);

const conceptIds = new Set();
for (const concept of concepts.concepts ?? []) {
  check(!conceptIds.has(concept.id), `Duplicate concept ID: ${concept.id}`);
  conceptIds.add(concept.id);
  for (const lessonId of concept.lessonRefs ?? []) {
    check(
      lessons.has(lessonId),
      `${concept.id} references unknown lesson ${lessonId}.`,
    );
  }
  for (const evidenceRef of concept.evidenceRefs ?? []) {
    check(
      evidenceIndex.has(evidenceRef),
      `${concept.id} references missing evidence ${evidenceRef}.`,
    );
  }
}

if (project.status === "completed") {
  const outlineLessonIds = new Set(lessons.keys());
  const outlineUnknownDurationLessonIds = new Set(
    outline.unknownDurationLessonIds ?? [],
  );
  const progressLessonIds = new Set(Object.keys(progress.lessons ?? {}));
  check(
    assets.size === outlineLessonIds.size,
    `Completed project has ${assets.size} catalog assets; expected ${outlineLessonIds.size}.`,
  );
  for (const asset of assets.values()) {
    check(
      new Set(["video", "text"]).has(asset.kind),
      `Completed project asset ${asset.assetId} has unsupported kind ${asset.kind}.`,
    );
    check(
      (asset.lessonIds ?? []).length === 1,
      `Completed project asset ${asset.assetId} must map to exactly one lesson.`,
    );
    const mappedLessonId = asset.lessonIds?.[0];
    check(
      lessons.get(mappedLessonId)?.assetRefs?.length === 1 &&
        lessons.get(mappedLessonId)?.assetRefs?.[0] === asset.assetId,
      `Completed project asset ${asset.assetId} is not reciprocally referenced by its outline lesson.`,
    );
    if (asset.kind === "video") {
      check(
        asset.assetId.startsWith("asset:video-") &&
          /\.mp4$/i.test(asset.originalFilename ?? "") &&
          /\.mp4$/i.test(asset.path ?? "") &&
          asset.media?.format === "mp4" &&
          Number.isFinite(asset.media?.durationSeconds) &&
          asset.media.durationSeconds > 0 &&
          !outlineUnknownDurationLessonIds.has(mappedLessonId),
        `Completed project video asset ${asset.assetId} has inconsistent media metadata.`,
      );
    }
    if (asset.kind === "text") {
      check(
        asset.assetId.startsWith("asset:text-") &&
          /\.md$/i.test(asset.originalFilename ?? "") &&
          /\.md$/i.test(asset.path ?? "") &&
          asset.media === undefined &&
          outlineUnknownDurationLessonIds.has(mappedLessonId),
        `Completed project text asset ${asset.assetId} has inconsistent media metadata.`,
      );
    }
  }
  check(
    progressLessonIds.size === outlineLessonIds.size &&
      [...outlineLessonIds].every((lessonId) =>
        progressLessonIds.has(lessonId),
      ),
    "Completed project progress lessons do not exactly match the outline.",
  );
  check(
    normalizedByLesson.size === outlineLessonIds.size,
    `Completed project has ${normalizedByLesson.size} normalized lessons; expected ${outlineLessonIds.size}.`,
  );
  check(
    completedLessons.length === outlineLessonIds.size,
    `Completed project has ${completedLessons.length} lesson notes; expected ${outlineLessonIds.size}.`,
  );
  check(
    chapterNotes.length === (outline.chapters ?? []).length,
    `Completed project has ${chapterNotes.length} chapter notes; expected ${(outline.chapters ?? []).length}.`,
  );
  check(
    chapterNoteIds.size === chapters.size &&
      [...chapters.keys()].every((chapterId) => chapterNoteIds.has(chapterId)),
    "Completed project chapter notes do not exactly match the outline chapter IDs.",
  );

  const lessonAssetCounts = new Map(
    [...outlineLessonIds].map((lessonId) => [lessonId, 0]),
  );
  const assetKindByLesson = new Map();
  for (const asset of assets.values()) {
    for (const lessonId of asset.lessonIds ?? []) {
      lessonAssetCounts.set(
        lessonId,
        (lessonAssetCounts.get(lessonId) ?? 0) + 1,
      );
      assetKindByLesson.set(lessonId, asset.kind);
    }
  }
  for (const lessonId of outlineLessonIds) {
    const lesson = lessons.get(lessonId);
    const outlineAssetRefs = lesson?.assetRefs ?? [];
    const catalogAssetRefs = [...assets.values()]
      .filter((asset) => (asset.lessonIds ?? []).includes(lessonId))
      .map((asset) => asset.assetId)
      .sort();
    check(
      lessonAssetCounts.get(lessonId) === 1,
      `Completed project lesson ${lessonId} must map to exactly one catalog asset.`,
    );
    check(
      outlineAssetRefs.length === 1 &&
        outlineAssetRefs[0] === catalogAssetRefs[0] &&
        assets.get(outlineAssetRefs[0])?.lessonIds?.includes(lessonId),
      `Completed project lesson ${lessonId} assetRefs do not match the catalog mapping.`,
    );
    try {
      const lessonNote = await readFile(
        resolve(projectRoot, `notes/lessons/${lessonId}.md`),
        "utf8",
      );
      check(
        lessonNote.trim().length >= 1000,
        `Completed lesson ${lessonId} note is unexpectedly empty.`,
      );
      check(
        /^note_status:\s*["']?reviewed["']?\s*$/m.test(lessonNote),
        `Completed lesson ${lessonId} note is not marked reviewed.`,
      );
    } catch {
      errors.push(`Completed lesson ${lessonId} note is not readable.`);
    }
    const state = progress.lessons?.[lessonId];
    check(
      state?.sourceMapping === "mapped" &&
        state?.lessonNote === "completed" &&
        state?.relationshipReview === "completed" &&
        state?.qa === "completed",
      `Completed project lesson ${lessonId} has an unfinished workflow state.`,
    );
    if (assetKindByLesson.get(lessonId) === "video") {
      check(
        state?.mediaProbe === "completed" &&
          state?.videoEvidence === "completed" &&
          state?.textEvidence === "not-applicable",
        `Completed video lesson ${lessonId} has inconsistent evidence state.`,
      );
      const provenanceRequestId =
        normalizedByLesson.get(lessonId)?.provenance?.requestId;
      const generation = generationsByRequestId.get(provenanceRequestId);
      const sourceAsset = assets.get(outlineAssetRefs[0]);
      const expectedNormalizedPath = `outputs/algorithm-interview-course/understanding/normalized/${lessonId}.json`;
      check(
        typeof provenanceRequestId === "string" &&
          Boolean(generation) &&
          (generation.lessonId === undefined ||
            generation.lessonId === lessonId) &&
          (generation.inputs ?? []).includes(sourceAsset?.path) &&
          (generation.outputs ?? []).includes(expectedNormalizedPath) &&
          (generation.outcome === undefined ||
            generation.outcome === "accepted") &&
          (generation.eligibleForSynthesis === undefined ||
            generation.eligibleForSynthesis === true),
        `Completed video lesson ${lessonId} has no manifest-backed request ID.`,
      );
      const lessonAttempts = attemptsByLesson.get(lessonId) ?? [];
      if (lessonAttempts.length > 0) {
        check(
          typeof state?.acceptedAttemptId === "string",
          `Completed video lesson ${lessonId} has attempts but no acceptedAttemptId.`,
        );
        const acceptedAttempt = attemptsById.get(state.acceptedAttemptId);
        check(
          generation?.attemptId === state.acceptedAttemptId &&
            acceptedAttempt?.lessonId === lessonId &&
            acceptedAttempt?.requestId === provenanceRequestId &&
            acceptedAttempt?.outcome === "accepted" &&
            acceptedAttempt?.eligibleForSynthesis === true,
          `Completed video lesson ${lessonId} accepted attempt is not bound to its manifest generation.`,
        );
      }
    }
    if (assetKindByLesson.get(lessonId) === "text") {
      check(
        state?.mediaProbe === "not-applicable" &&
          state?.videoEvidence === "not-applicable" &&
          state?.textEvidence === "completed",
        `Completed text lesson ${lessonId} has inconsistent evidence state.`,
      );
    }
    check(
      !Object.values(state ?? {}).includes("not-started"),
      `Completed project lesson ${lessonId} still contains not-started state.`,
    );
  }

  for (const chapterId of chapters.keys()) {
    try {
      const chapterNote = await readFile(
        resolve(projectRoot, `notes/chapters/${chapterId}.md`),
        "utf8",
      );
      check(
        chapterNote.trim().length >= 1000,
        `Completed chapter ${chapterId} note is unexpectedly empty.`,
      );
      check(
        /^note_status:\s*["']?reviewed["']?\s*$/m.test(chapterNote),
        `Completed chapter ${chapterId} note is not marked reviewed.`,
      );
    } catch {
      errors.push(`Completed chapter ${chapterId} note is not readable.`);
    }
  }

  const videoAssetCount = [...assets.values()].filter(
    (asset) => asset.kind === "video",
  ).length;
  const textAssetCount = [...assets.values()].filter(
    (asset) => asset.kind === "text",
  ).length;
  const expectedSummary = {
    expectedLessons: outlineLessonIds.size,
    knownDurationLessons: outline.knownDurationLessonCount,
    discoveredAssets: assets.size,
    discoveredVideos: videoAssetCount,
    discoveredTexts: textAssetCount,
    catalogedAssets: assets.size,
    mappedLessons: outlineLessonIds.size,
    hashVerifiedLessons: outlineLessonIds.size,
    probedLessons: videoAssetCount,
    understoodLessons: normalizedByLesson.size,
    synthesizedLessons: completedLessons.length,
    verifiedLessons: [...progressLessonIds].filter(
      (lessonId) => progress.lessons[lessonId]?.qa === "completed",
    ).length,
    synthesizedChapters: chapterNotes.length,
    verifiedRelationshipEdges,
  };
  for (const [field, expectedValue] of Object.entries(expectedSummary)) {
    check(
      progress.summary?.[field] === expectedValue,
      `Completed project progress.${field} is ${progress.summary?.[field]}; expected ${expectedValue}.`,
    );
  }
  const expectedUnknownDurationLessons = outlineUnknownDurationLessonIds;
  const reportedUnknownDurationLessons = new Set(
    progress.summary?.unknownDurationLessons ?? [],
  );
  check(
    expectedUnknownDurationLessons.size ===
      reportedUnknownDurationLessons.size &&
      [...expectedUnknownDurationLessons].every((lessonId) =>
        reportedUnknownDurationLessons.has(lessonId),
      ),
    "Completed project unknown-duration lessons do not match the outline.",
  );

  try {
    const courseSynthesis = await readFile(
      resolve(projectRoot, "notes/course-synthesis.md"),
      "utf8",
    );
    check(
      courseSynthesis.trim().length >= 1000,
      "Completed project course synthesis is unexpectedly empty.",
    );
    check(
      /^note_status:\s*["']?reviewed["']?\s*$/m.test(courseSynthesis),
      "Completed project course synthesis is not marked reviewed.",
    );
    for (let section = 1; section <= 10; section += 1) {
      check(
        new RegExp(`^## ${section}\\. `, "m").test(courseSynthesis),
        `Completed project course synthesis is missing section ${section}.`,
      );
    }
  } catch {
    errors.push(
      "Completed project has no readable notes/course-synthesis.md file.",
    );
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify(
      {
        status: "ok",
        lessons: lessons.size,
        catalogedAssets: assets.size,
        normalizedLessons: normalizedByLesson.size,
        manifestAttempts: (manifest.attempts ?? []).length,
        manifestGenerations: manifest.generations.length,
        acceptedAttempts: (manifest.attempts ?? []).filter(
          (attempt) => attempt.outcome === "accepted",
        ).length,
        rejectedAttempts: (manifest.attempts ?? []).filter(
          (attempt) => attempt.outcome === "rejected",
        ).length,
        transportFailures: (manifest.attempts ?? []).filter((attempt) =>
          ["http_error", "network_error"].includes(attempt.outcome),
        ).length,
        completedLessonNotes: completedLessons.length,
        chapterNotes: chapterNotes.length,
        verifiedRelationshipEdges,
        concepts: concepts.concepts.length,
      },
      null,
      2,
    )}\n`,
  );
}
