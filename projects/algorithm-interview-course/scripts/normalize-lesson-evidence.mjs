import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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
for (const requiredArgument of ["input", "response", "out"]) {
  if (!argumentsMap[requiredArgument]) {
    throw new Error(`Specify --${requiredArgument} <path>.`);
  }
}

const readJson = async (path) =>
  JSON.parse(await readFile(resolve(path), "utf8"));
const rawEvidence = await readJson(argumentsMap.input);
const apiResponse = await readJson(argumentsMap.response);
const promptVersion =
  argumentsMap["prompt-version"] ??
  rawEvidence.provenance?.promptVersion ??
  "unknown";
const strictExtraction = promptVersion === "video-evidence-v1.3";

if (strictExtraction) {
  for (const field of [
    "schemaVersion",
    "lessonId",
    "chapterId",
    "titleObserved",
    "contentKind",
    "actualDurationSeconds",
    "timeline",
    "learningObjectives",
    "concepts",
    "problem",
    "solutionProgression",
    "codeArtifacts",
    "correctness",
    "complexity",
    "complexityAnalyses",
    "formulaArtifacts",
    "experiments",
    "examples",
    "edgeCases",
    "implementationPitfalls",
    "interviewPlaybook",
    "relationCandidates",
    "evidence",
    "uncertainties",
    "provenance",
  ]) {
    if (!Object.hasOwn(rawEvidence, field)) {
      throw new Error(`Strict extraction is missing top-level field ${field}.`);
    }
  }

  if (argumentsMap.lesson && rawEvidence.lessonId !== argumentsMap.lesson) {
    throw new Error(
      `Raw lessonId ${rawEvidence.lessonId} does not match ${argumentsMap.lesson}.`,
    );
  }
  if (argumentsMap.chapter && rawEvidence.chapterId !== argumentsMap.chapter) {
    throw new Error(
      `Raw chapterId ${rawEvidence.chapterId} does not match ${argumentsMap.chapter}.`,
    );
  }
  if (argumentsMap.duration) {
    const expectedDuration = Number(argumentsMap.duration);
    if (
      !Number.isFinite(rawEvidence.actualDurationSeconds) ||
      Math.abs(rawEvidence.actualDurationSeconds - expectedDuration) > 0.001
    ) {
      throw new Error(
        `Raw duration ${rawEvidence.actualDurationSeconds} does not match ${expectedDuration}.`,
      );
    }
  }

  for (const field of [
    "learningObjectives",
    "examples",
    "edgeCases",
    "implementationPitfalls",
    "interviewPlaybook",
  ]) {
    if (!Array.isArray(rawEvidence[field])) {
      throw new Error(`Strict extraction field ${field} must be an array.`);
    }
    for (const item of rawEvidence[field]) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        typeof item.statement !== "string" ||
        typeof item.sourceClass !== "string" ||
        !Array.isArray(item.evidenceIds)
      ) {
        throw new Error(`Strict extraction has invalid item in ${field}.`);
      }
    }
  }

  for (const concept of rawEvidence.concepts) {
    if (
      !concept ||
      (concept.definition !== null && typeof concept.definition !== "string")
    ) {
      throw new Error("Strict extraction has an invalid concept definition.");
    }
  }
}
const normalized = structuredClone(rawEvidence);

const allowedContentKinds = new Set([
  "interview_strategy",
  "concept",
  "experiment",
  "problem_walkthrough",
  "anecdote",
  "conclusion",
  "mixed",
  "unknown",
]);
const contentKindAliases = new Map([
  ["conceptual_guide", "interview_strategy"],
  ["conceptual-guide", "interview_strategy"],
  ["guide", "interview_strategy"],
]);

normalized.contentKind =
  argumentsMap["content-kind"] ??
  contentKindAliases.get(normalized.contentKind) ??
  normalized.contentKind;
if (!allowedContentKinds.has(normalized.contentKind)) {
  throw new Error(`Unsupported contentKind: ${normalized.contentKind}`);
}

const normalizeEvidenceIds = (value) => [
  ...new Set(Array.isArray(value) ? value.filter(Boolean) : []),
];

const normalizeSourcedStatement = (item) => {
  if (typeof item === "string") {
    return {
      statement: item,
      sourceClass: "editorial_inference",
      evidenceIds: [],
    };
  }
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("A sourced statement must be a string or object.");
  }
  const statement = item.statement ?? item.advice ?? item.text;
  if (typeof statement !== "string" || statement.length === 0) {
    throw new Error("A sourced statement is missing statement text.");
  }
  return {
    statement,
    sourceClass: item.sourceClass ?? "editorial_inference",
    evidenceIds: normalizeEvidenceIds(item.evidenceIds),
  };
};

for (const field of [
  "learningObjectives",
  "examples",
  "edgeCases",
  "implementationPitfalls",
  "interviewPlaybook",
]) {
  normalized[field] = (normalized[field] ?? []).map(normalizeSourcedStatement);
}

const conceptRoleAliases = new Map([["mentioned", "mentions"]]);
normalized.concepts = (normalized.concepts ?? []).map((concept) => ({
  ...concept,
  role: conceptRoleAliases.get(concept.role) ?? concept.role,
  evidenceIds: normalizeEvidenceIds(concept.evidenceIds),
}));

normalized.correctness ??= { method: "unknown", claims: [] };
normalized.correctness.claims = (normalized.correctness.claims ?? []).map(
  normalizeSourcedStatement,
);
const allowedCorrectnessMethods = new Set([
  "not_applicable",
  "loop_invariant",
  "recursive_contract",
  "induction",
  "state_transition",
  "exchange_argument",
  "experimental_validation",
  "other",
  "unknown",
]);
if (!allowedCorrectnessMethods.has(normalized.correctness.method)) {
  throw new Error(
    `Unsupported correctness.method: ${normalized.correctness.method}`,
  );
}
if (
  normalized.problem === null &&
  normalized.correctness.claims.length === 0 &&
  normalized.correctness.method === "unknown"
) {
  normalized.correctness.method = "not_applicable";
}

normalized.complexityAnalyses ??= [];
normalized.formulaArtifacts ??= [];
normalized.experiments ??= [];

const timestampFromText = (value) => {
  if (typeof value !== "string") return undefined;
  const match = value.match(/(?:^|[^0-9])([0-9]{1,2}):([0-9]{2})(?:[^0-9]|$)/);
  if (!match) return undefined;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
};

const evidenceForTimestamp = (milliseconds) => {
  if (milliseconds === undefined) return [];
  const matchingEvidence = (normalized.evidence ?? []).find(
    (evidence) =>
      typeof evidence.startMs === "number" &&
      typeof evidence.endMs === "number" &&
      evidence.startMs <= milliseconds &&
      evidence.endMs >= milliseconds,
  );
  return matchingEvidence ? [matchingEvidence.id] : [];
};

const basisAliases = new Map([
  ["teacher_explicit", "explicit_in_lesson"],
  ["explicit", "explicit_in_lesson"],
]);
normalized.relationCandidates = (normalized.relationCandidates ?? []).map(
  (candidate) => {
    const basis =
      basisAliases.get(candidate.basis) ??
      candidate.basis ??
      "editorial_hypothesis";
    const evidenceIds = normalizeEvidenceIds(candidate.evidenceIds);
    if (evidenceIds.length === 0 && basis === "explicit_in_lesson") {
      evidenceIds.push(
        ...evidenceForTimestamp(timestampFromText(candidate.rationale)),
      );
    }
    return {
      from: candidate.from,
      to: candidate.to,
      type: candidate.type,
      status: "provisional",
      rationale: candidate.rationale,
      confidence:
        typeof candidate.confidence === "number"
          ? candidate.confidence
          : basis === "explicit_in_lesson"
            ? 0.9
            : 0.7,
      basis,
      evidenceIds,
    };
  },
);

if (argumentsMap.lesson) {
  normalized.lessonId = argumentsMap.lesson;
}
if (argumentsMap.chapter) {
  normalized.chapterId = argumentsMap.chapter;
}
if (argumentsMap.duration) {
  const duration = Number(argumentsMap.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("--duration must be a positive number of seconds.");
  }
  normalized.actualDurationSeconds = duration;
}

normalized.provenance = {
  model: apiResponse.model ?? normalized.provenance?.model ?? null,
  requestId: apiResponse.id ?? null,
  promptVersion: promptVersion,
  generatedAt:
    typeof apiResponse.created === "number"
      ? new Date(apiResponse.created * 1000).toISOString()
      : null,
};

const requireArray = (value, field) => {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
};

const allowedSourceClasses = new Set([
  "course_direct",
  "course_text",
  "editorial_inference",
  "supplemental",
]);
const validateSourcedStatements = (items, field) => {
  requireArray(items, field);
  for (const item of items) {
    if (
      !item ||
      typeof item.statement !== "string" ||
      !allowedSourceClasses.has(item.sourceClass) ||
      !Array.isArray(item.evidenceIds) ||
      (item.sourceClass === "course_direct" && item.evidenceIds.length === 0)
    ) {
      throw new Error(`Invalid sourced statement in ${field}.`);
    }
  }
};

for (const field of [
  "learningObjectives",
  "examples",
  "edgeCases",
  "implementationPitfalls",
  "interviewPlaybook",
]) {
  validateSourcedStatements(normalized[field], field);
}
validateSourcedStatements(normalized.correctness.claims, "correctness.claims");

requireArray(normalized.complexityAnalyses, "complexityAnalyses");
const allowedComplexityMeasures = new Set([
  "time",
  "auxiliary_space",
  "stack_space",
  "operation_count",
]);
const allowedComplexityNotations = new Set([
  "O",
  "Theta",
  "Omega",
  "none",
  "unknown",
]);
const allowedComplexityCases = new Set([
  "worst",
  "average",
  "best",
  "amortized",
  "expected",
  "empirical",
  "unspecified",
]);
for (const analysis of normalized.complexityAnalyses) {
  if (
    !analysis ||
    typeof analysis.id !== "string" ||
    typeof analysis.subject !== "string" ||
    !allowedComplexityMeasures.has(analysis.measure) ||
    !allowedComplexityNotations.has(analysis.notation) ||
    !allowedComplexityCases.has(analysis.case) ||
    !allowedSourceClasses.has(analysis.normalizationSourceClass) ||
    !Array.isArray(analysis.variables) ||
    !Array.isArray(analysis.derivationSteps) ||
    !Array.isArray(analysis.assumptions) ||
    !Array.isArray(analysis.evidenceIds)
  ) {
    throw new Error(
      `Invalid complexity analysis: ${analysis?.id ?? "unknown"}`,
    );
  }
  if (
    analysis.normalizationSourceClass === "course_direct" &&
    analysis.evidenceIds.length === 0
  ) {
    throw new Error(
      `Complexity analysis ${analysis.id} is course_direct without evidence.`,
    );
  }
  for (const variable of analysis.variables) {
    if (
      !variable ||
      typeof variable.symbol !== "string" ||
      !Array.isArray(variable.evidenceIds)
    ) {
      throw new Error(`Invalid variable in ${analysis.id}.`);
    }
  }
  if (analysis.costModel !== null) {
    validateSourcedStatements([analysis.costModel], `${analysis.id}.costModel`);
  }
  validateSourcedStatements(
    analysis.derivationSteps,
    `${analysis.id}.derivationSteps`,
  );
  validateSourcedStatements(analysis.assumptions, `${analysis.id}.assumptions`);
  validateSourcedStatements([analysis.conclusion], `${analysis.id}.conclusion`);
}

requireArray(normalized.formulaArtifacts, "formulaArtifacts");
for (const formula of normalized.formulaArtifacts) {
  if (
    !formula ||
    typeof formula.id !== "string" ||
    !["formula", "recurrence", "summation", "inequality", "table"].includes(
      formula.kind,
    ) ||
    !["shown_in_video", "reconstructed"].includes(formula.sourceKind) ||
    !Array.isArray(formula.variables) ||
    !["complete", "partial", "uncertain"].includes(formula.completeness) ||
    !Array.isArray(formula.ocrUncertainties) ||
    !Array.isArray(formula.evidenceIds)
  ) {
    throw new Error(`Invalid formula artifact: ${formula?.id ?? "unknown"}`);
  }
}

requireArray(normalized.experiments, "experiments");
for (const experiment of normalized.experiments) {
  if (
    !experiment ||
    typeof experiment.id !== "string" ||
    typeof experiment.subject !== "string" ||
    !experiment.setup ||
    !Array.isArray(experiment.measurements) ||
    !Array.isArray(experiment.limitations) ||
    !Array.isArray(experiment.evidenceIds)
  ) {
    throw new Error(`Invalid experiment: ${experiment?.id ?? "unknown"}`);
  }
  validateSourcedStatements([experiment.purpose], `${experiment.id}.purpose`);
  if (experiment.theoreticalExpectation !== null) {
    validateSourcedStatements(
      [experiment.theoreticalExpectation],
      `${experiment.id}.theoreticalExpectation`,
    );
  }
  if (experiment.observation !== null) {
    validateSourcedStatements(
      [experiment.observation],
      `${experiment.id}.observation`,
    );
  }
  validateSourcedStatements(
    experiment.limitations,
    `${experiment.id}.limitations`,
  );
  for (const measurement of experiment.measurements) {
    if (!measurement || !Array.isArray(measurement.evidenceIds)) {
      throw new Error(`Invalid measurement in ${experiment.id}.`);
    }
  }
}

const evidenceIds = new Set();
const durationToleranceMs = strictExtraction ? 0 : 1000;
const validateTimestamp = (value, field) => {
  if (value !== null && (!Number.isInteger(value) || value < 0)) {
    throw new Error(`${field} must be a non-negative integer or null.`);
  }
};
for (const segment of normalized.timeline ?? []) {
  validateTimestamp(segment.startMs, `Timeline ${segment.topic} startMs`);
  validateTimestamp(segment.endMs, `Timeline ${segment.topic} endMs`);
  if (
    typeof segment.startMs === "number" &&
    typeof segment.endMs === "number" &&
    segment.startMs > segment.endMs
  ) {
    throw new Error(`Timeline segment "${segment.topic}" is inverted.`);
  }
  if (
    typeof normalized.actualDurationSeconds === "number" &&
    typeof segment.endMs === "number" &&
    segment.endMs >
      normalized.actualDurationSeconds * 1000 + durationToleranceMs
  ) {
    throw new Error(`Timeline segment "${segment.topic}" exceeds duration.`);
  }
}
for (const evidence of normalized.evidence ?? []) {
  if (
    !evidence ||
    typeof evidence.id !== "string" ||
    evidenceIds.has(evidence.id)
  ) {
    throw new Error("Evidence IDs must be present and unique.");
  }
  evidenceIds.add(evidence.id);
  validateTimestamp(evidence.startMs, `Evidence ${evidence.id} startMs`);
  validateTimestamp(evidence.endMs, `Evidence ${evidence.id} endMs`);
  if (
    typeof evidence.startMs === "number" &&
    typeof evidence.endMs === "number" &&
    evidence.startMs > evidence.endMs
  ) {
    throw new Error(`Evidence ${evidence.id} has an inverted time range.`);
  }
  if (
    argumentsMap["asset-id"] &&
    evidence.assetId !== argumentsMap["asset-id"]
  ) {
    throw new Error(
      `Evidence ${evidence.id} has assetId ${evidence.assetId}; expected ${argumentsMap["asset-id"]}.`,
    );
  }
  if (
    typeof normalized.actualDurationSeconds === "number" &&
    typeof evidence.endMs === "number" &&
    evidence.endMs >
      normalized.actualDurationSeconds * 1000 + durationToleranceMs
  ) {
    throw new Error(`Evidence ${evidence.id} exceeds the media duration.`);
  }
}

const referencedEvidenceIds = [];
const collectEvidenceIds = (value, path = "root") => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      collectEvidenceIds(value[index], `${path}[${index}]`);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Object.hasOwn(value, "sourceClass")) {
    if (
      typeof value.statement !== "string" ||
      !allowedSourceClasses.has(value.sourceClass) ||
      !Array.isArray(value.evidenceIds) ||
      (value.sourceClass === "course_direct" && value.evidenceIds.length === 0)
    ) {
      throw new Error(`Invalid sourced statement at ${path}.`);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "evidence") continue;
    if (key === "evidenceIds" && Array.isArray(child)) {
      referencedEvidenceIds.push(...child);
    } else {
      collectEvidenceIds(child, `${path}.${key}`);
    }
  }
};
collectEvidenceIds(normalized);

const missingEvidenceIds = [
  ...new Set(referencedEvidenceIds.filter((id) => !evidenceIds.has(id))),
];
if (missingEvidenceIds.length > 0) {
  throw new Error(
    `Unknown evidence references: ${missingEvidenceIds.join(", ")}`,
  );
}

const allowedRelationTypes = new Set([
  "prerequisite_of",
  "recommended_before",
  "extends",
  "revisits",
  "applies",
  "contrasts_with",
  "alternative_to",
  "same_pattern_as",
  "same_problem_family_as",
]);
for (const relation of normalized.relationCandidates) {
  if (
    typeof relation.from !== "string" ||
    typeof relation.to !== "string" ||
    !allowedRelationTypes.has(relation.type) ||
    relation.status !== "provisional" ||
    !["explicit_in_lesson", "editorial_hypothesis"].includes(relation.basis) ||
    typeof relation.confidence !== "number" ||
    relation.confidence < 0 ||
    relation.confidence > 1
  ) {
    throw new Error(`Invalid relation candidate: ${JSON.stringify(relation)}`);
  }
}

for (const codeArtifact of normalized.codeArtifacts ?? []) {
  if (codeArtifact.verification !== "not_run") {
    throw new Error(
      "Video extraction code artifacts must have verification=not_run.",
    );
  }
}

const outputPath = resolve(argumentsMap.out);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

process.stdout.write(
  `${JSON.stringify({
    outputPath,
    lessonId: normalized.lessonId,
    evidenceCount: evidenceIds.size,
    relationCount: normalized.relationCandidates.length,
    requestId: normalized.provenance.requestId,
  })}\n`,
);
