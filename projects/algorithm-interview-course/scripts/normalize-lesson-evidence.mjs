import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const canonicalSchema = await readJson(
  fileURLToPath(
    new URL("../schemas/lesson-evidence.schema.json", import.meta.url),
  ),
);
const schemaValidator = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: true,
});
addFormats(schemaValidator);
const validateCanonicalSchema = schemaValidator.compile(canonicalSchema);
const assertCanonicalSchema = (value, phase) => {
  if (validateCanonicalSchema(value)) return;
  const details = (validateCanonicalSchema.errors ?? [])
    .map(
      (error) =>
        `${error.instancePath || "/"} ${error.message ?? error.keyword}`,
    )
    .join("; ");
  throw new Error(`${phase} evidence failed canonical schema: ${details}`);
};
const promptVersion =
  argumentsMap["prompt-version"] ??
  rawEvidence.provenance?.promptVersion ??
  "unknown";
const strictV13 = promptVersion === "video-evidence-v1.3";
const strictV14 = promptVersion === "video-evidence-v1.4";
const strictV15 = promptVersion === "video-evidence-v1.5";
const strictV14OrLater = strictV14 || strictV15;
const strictExtraction = strictV13 || strictV14OrLater;
if (
  strictExtraction &&
  rawEvidence.provenance?.promptVersion !== promptVersion
) {
  throw new Error(
    `Raw promptVersion ${rawEvidence.provenance?.promptVersion ?? "missing"} does not match ${promptVersion}.`,
  );
}
if (strictV14OrLater) {
  assertCanonicalSchema(rawEvidence, "Raw");
}

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const assertExactKeys = (value, expectedKeys, path) => {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object.`);
  }
  const expected = new Set(expectedKeys);
  const missing = expectedKeys.filter((key) => !Object.hasOwn(value, key));
  const extra = Object.keys(value).filter((key) => !expected.has(key));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${path} has invalid fields; missing=[${missing.join(",")}], extra=[${extra.join(",")}].`,
    );
  }
};

const assertStringArray = (value, path) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${path} must be an array of strings.`);
  }
};

const assertIdArray = (value, pattern, path, { nonEmpty = false } = {}) => {
  if (
    !Array.isArray(value) ||
    (nonEmpty && value.length === 0) ||
    value.some((item) => typeof item !== "string" || !pattern.test(item)) ||
    new Set(value).size !== value.length
  ) {
    throw new Error(`${path} must contain unique, valid IDs.`);
  }
};

const evidenceIdPattern = /^ev-[0-9]{3,}$/;
const solutionIdPattern = /^solution-[0-9]{3,}$/;
const codeIdPattern = /^code-[0-9]{3,}$/;
const stateIdPattern = /^state-[0-9]{3,}$/;
const rawSourceClasses = new Set([
  "course_direct",
  "course_text",
  "editorial_inference",
  "supplemental",
]);

const assertRawSourcedStatement = (value, path) => {
  assertExactKeys(value, ["statement", "sourceClass", "evidenceIds"], path);
  if (
    typeof value.statement !== "string" ||
    value.statement.length === 0 ||
    !rawSourceClasses.has(value.sourceClass)
  ) {
    throw new Error(`${path} is not a valid sourced statement.`);
  }
  assertIdArray(value.evidenceIds, evidenceIdPattern, `${path}.evidenceIds`, {
    nonEmpty: value.sourceClass === "course_direct",
  });
};

if (strictExtraction) {
  const requiredTopLevelFields = [
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
  ];
  if (strictV14OrLater) {
    requiredTopLevelFields.splice(
      requiredTopLevelFields.indexOf("correctness"),
      0,
      "stateModels",
    );
  }
  for (const field of requiredTopLevelFields) {
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

  if (strictV14OrLater) {
    assertExactKeys(rawEvidence, requiredTopLevelFields, "root");
    if (rawEvidence.schemaVersion !== "1.0") {
      throw new Error(`${promptVersion} requires schemaVersion 1.0.`);
    }

    if (rawEvidence.problem !== null) {
      assertExactKeys(
        rawEvidence.problem,
        [
          "platform",
          "problemId",
          "titleObserved",
          "statement",
          "constraints",
          "clarifyingQuestions",
          "evidenceIds",
        ],
        "problem",
      );
      for (const field of [
        "platform",
        "problemId",
        "titleObserved",
        "statement",
      ]) {
        if (
          rawEvidence.problem[field] !== null &&
          typeof rawEvidence.problem[field] !== "string"
        ) {
          throw new Error(`problem.${field} must be a string or null.`);
        }
      }
      assertStringArray(rawEvidence.problem.constraints, "problem.constraints");
      assertStringArray(
        rawEvidence.problem.clarifyingQuestions,
        "problem.clarifyingQuestions",
      );
      assertIdArray(
        rawEvidence.problem.evidenceIds,
        evidenceIdPattern,
        "problem.evidenceIds",
        { nonEmpty: true },
      );
    }

    if (!Array.isArray(rawEvidence.solutionProgression)) {
      throw new Error("solutionProgression must be an array.");
    }
    for (const [index, solution] of rawEvidence.solutionProgression.entries()) {
      const path = `solutionProgression[${index}]`;
      assertExactKeys(
        solution,
        [
          "id",
          "stage",
          "idea",
          "timeComplexity",
          "spaceComplexity",
          "limitations",
          "codeArtifactIds",
          "stateModelIds",
          "evidenceIds",
        ],
        path,
      );
      if (!solutionIdPattern.test(solution.id)) {
        throw new Error(`${path}.id is invalid.`);
      }
      if (
        !new Set([
          "baseline",
          "observation",
          "intermediate",
          "optimized",
          "alternative",
        ]).has(solution.stage) ||
        typeof solution.idea !== "string" ||
        solution.idea.length === 0
      ) {
        throw new Error(`${path} has an invalid stage or idea.`);
      }
      for (const field of ["timeComplexity", "spaceComplexity"]) {
        if (solution[field] !== null && typeof solution[field] !== "string") {
          throw new Error(`${path}.${field} must be a string or null.`);
        }
      }
      assertStringArray(solution.limitations, `${path}.limitations`);
      assertIdArray(
        solution.codeArtifactIds,
        codeIdPattern,
        `${path}.codeArtifactIds`,
      );
      assertIdArray(
        solution.stateModelIds,
        stateIdPattern,
        `${path}.stateModelIds`,
      );
      assertIdArray(
        solution.evidenceIds,
        evidenceIdPattern,
        `${path}.evidenceIds`,
        { nonEmpty: true },
      );
    }

    if (!Array.isArray(rawEvidence.codeArtifacts)) {
      throw new Error("codeArtifacts must be an array.");
    }
    for (const [index, artifact] of rawEvidence.codeArtifacts.entries()) {
      const path = `codeArtifacts[${index}]`;
      assertExactKeys(
        artifact,
        [
          "id",
          "solutionStageId",
          "language",
          "sourceKind",
          "completeness",
          "code",
          "ocrUncertainties",
          "verification",
          "evidenceIds",
        ],
        path,
      );
      if (
        !codeIdPattern.test(artifact.id) ||
        (artifact.solutionStageId !== null &&
          !solutionIdPattern.test(artifact.solutionStageId)) ||
        (artifact.language !== null && typeof artifact.language !== "string") ||
        artifact.sourceKind !== "shown_in_video" ||
        !new Set(["complete", "partial", "uncertain"]).has(
          artifact.completeness,
        ) ||
        typeof artifact.code !== "string" ||
        artifact.code.length === 0 ||
        artifact.verification !== "not_run"
      ) {
        throw new Error(`${path} is invalid.`);
      }
      assertStringArray(artifact.ocrUncertainties, `${path}.ocrUncertainties`);
      assertIdArray(
        artifact.evidenceIds,
        evidenceIdPattern,
        `${path}.evidenceIds`,
        { nonEmpty: true },
      );
    }

    if (!Array.isArray(rawEvidence.stateModels)) {
      throw new Error("stateModels must be an array.");
    }
    for (const [index, stateModel] of rawEvidence.stateModels.entries()) {
      const path = `stateModels[${index}]`;
      assertExactKeys(
        stateModel,
        [
          "id",
          "solutionStageId",
          "kind",
          "variables",
          "regions",
          "invariant",
          "transitions",
          "termination",
          "evidenceIds",
        ],
        path,
      );
      if (
        !stateIdPattern.test(stateModel.id) ||
        (stateModel.solutionStageId !== null &&
          !solutionIdPattern.test(stateModel.solutionStageId)) ||
        !new Set([
          "search_interval",
          "partition",
          "two_pointer",
          "sliding_window",
          "other",
        ]).has(stateModel.kind)
      ) {
        throw new Error(`${path} has an invalid ID, link, or kind.`);
      }
      if (!Array.isArray(stateModel.variables)) {
        throw new Error(`${path}.variables must be an array.`);
      }
      for (const [variableIndex, variable] of stateModel.variables.entries()) {
        const variablePath = `${path}.variables[${variableIndex}]`;
        assertExactKeys(
          variable,
          ["symbol", "role", "meaning", "updateRule", "evidenceIds"],
          variablePath,
        );
        if (
          typeof variable.symbol !== "string" ||
          typeof variable.role !== "string" ||
          typeof variable.meaning !== "string" ||
          (variable.updateRule !== null &&
            typeof variable.updateRule !== "string")
        ) {
          throw new Error(`${variablePath} is invalid.`);
        }
        assertIdArray(
          variable.evidenceIds,
          evidenceIdPattern,
          `${variablePath}.evidenceIds`,
          { nonEmpty: true },
        );
      }
      if (!Array.isArray(stateModel.regions)) {
        throw new Error(`${path}.regions must be an array.`);
      }
      for (const [regionIndex, region] of stateModel.regions.entries()) {
        const regionPath = `${path}.regions[${regionIndex}]`;
        assertExactKeys(
          region,
          ["notation", "meaning", "evidenceIds"],
          regionPath,
        );
        if (
          typeof region.notation !== "string" ||
          typeof region.meaning !== "string"
        ) {
          throw new Error(`${regionPath} is invalid.`);
        }
        assertIdArray(
          region.evidenceIds,
          evidenceIdPattern,
          `${regionPath}.evidenceIds`,
          { nonEmpty: true },
        );
      }
      if (stateModel.invariant !== null) {
        assertRawSourcedStatement(stateModel.invariant, `${path}.invariant`);
      }
      if (!Array.isArray(stateModel.transitions)) {
        throw new Error(`${path}.transitions must be an array.`);
      }
      for (const [
        transitionIndex,
        transition,
      ] of stateModel.transitions.entries()) {
        const transitionPath = `${path}.transitions[${transitionIndex}]`;
        assertExactKeys(
          transition,
          ["condition", "updates", "preserves", "evidenceIds"],
          transitionPath,
        );
        if (
          typeof transition.condition !== "string" ||
          typeof transition.updates !== "string"
        ) {
          throw new Error(`${transitionPath} is invalid.`);
        }
        if (transition.preserves !== null) {
          assertRawSourcedStatement(
            transition.preserves,
            `${transitionPath}.preserves`,
          );
        }
        assertIdArray(
          transition.evidenceIds,
          evidenceIdPattern,
          `${transitionPath}.evidenceIds`,
          { nonEmpty: true },
        );
      }
      if (stateModel.termination !== null) {
        assertRawSourcedStatement(
          stateModel.termination,
          `${path}.termination`,
        );
      }
      assertIdArray(
        stateModel.evidenceIds,
        evidenceIdPattern,
        `${path}.evidenceIds`,
        { nonEmpty: true },
      );
    }

    assertExactKeys(
      rawEvidence.correctness,
      ["method", "claims", "stateModelIds", "obligations"],
      "correctness",
    );
    if (!Array.isArray(rawEvidence.correctness.claims)) {
      throw new Error("correctness.claims must be an array.");
    }
    rawEvidence.correctness.claims.forEach((claim, index) =>
      assertRawSourcedStatement(claim, `correctness.claims[${index}]`),
    );
    assertIdArray(
      rawEvidence.correctness.stateModelIds,
      stateIdPattern,
      "correctness.stateModelIds",
    );
    if (!Array.isArray(rawEvidence.correctness.obligations)) {
      throw new Error("correctness.obligations must be an array.");
    }
    for (const [
      index,
      obligation,
    ] of rawEvidence.correctness.obligations.entries()) {
      const path = `correctness.obligations[${index}]`;
      assertExactKeys(
        obligation,
        ["phase", "statement", "sourceClass", "evidenceIds"],
        path,
      );
      if (
        !new Set([
          "initialization",
          "preservation",
          "termination",
          "postcondition",
          "boundary_safety",
        ]).has(obligation.phase)
      ) {
        throw new Error(`${path}.phase is invalid.`);
      }
      assertRawSourcedStatement(
        {
          statement: obligation.statement,
          sourceClass: obligation.sourceClass,
          evidenceIds: obligation.evidenceIds,
        },
        path,
      );
    }

    if (!Array.isArray(rawEvidence.evidence)) {
      throw new Error("evidence must be an array.");
    }
    for (const [index, evidence] of rawEvidence.evidence.entries()) {
      const path = `evidence[${index}]`;
      assertExactKeys(
        evidence,
        [
          "id",
          "sourceType",
          "startMs",
          "endMs",
          "assetId",
          "locator",
          "observation",
          "confidence",
        ],
        path,
      );
      if (
        !evidenceIdPattern.test(evidence.id) ||
        !new Set([
          "video_audio",
          "video_visual",
          "video_combined",
          "text",
          "editorial_inference",
        ]).has(evidence.sourceType) ||
        (evidence.assetId !== null && typeof evidence.assetId !== "string") ||
        (evidence.locator !== null && typeof evidence.locator !== "string") ||
        typeof evidence.observation !== "string" ||
        evidence.observation.length === 0 ||
        typeof evidence.confidence !== "number" ||
        evidence.confidence < 0 ||
        evidence.confidence > 1
      ) {
        throw new Error(`${path} is invalid.`);
      }
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
  !strictV14OrLater &&
  normalized.problem === null &&
  normalized.correctness.claims.length === 0 &&
  normalized.correctness.method === "unknown"
) {
  normalized.correctness.method = "not_applicable";
}

if (strictV14OrLater) {
  const uniqueIds = (items, path) => {
    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`${path} IDs must be unique.`);
    }
    return new Set(ids);
  };

  const solutionIds = uniqueIds(
    normalized.solutionProgression,
    "solutionProgression",
  );
  const codeIds = uniqueIds(normalized.codeArtifacts, "codeArtifacts");
  const stateIds = uniqueIds(normalized.stateModels, "stateModels");
  const codeById = new Map(
    normalized.codeArtifacts.map((artifact) => [artifact.id, artifact]),
  );
  const stateById = new Map(
    normalized.stateModels.map((stateModel) => [stateModel.id, stateModel]),
  );
  const solutionById = new Map(
    normalized.solutionProgression.map((solution) => [solution.id, solution]),
  );

  for (const solution of normalized.solutionProgression) {
    for (const codeId of solution.codeArtifactIds) {
      const artifact = codeById.get(codeId);
      if (!artifact) {
        throw new Error(`${solution.id} references unknown code ${codeId}.`);
      }
      if (artifact.solutionStageId !== solution.id) {
        throw new Error(
          `${solution.id} and ${codeId} do not reference each other.`,
        );
      }
    }
    for (const stateId of solution.stateModelIds) {
      const stateModel = stateById.get(stateId);
      if (!stateModel) {
        throw new Error(`${solution.id} references unknown state ${stateId}.`);
      }
    }
  }

  for (const artifact of normalized.codeArtifacts) {
    if (
      artifact.solutionStageId !== null &&
      !solutionIds.has(artifact.solutionStageId)
    ) {
      throw new Error(
        `${artifact.id} references unknown solution ${artifact.solutionStageId}.`,
      );
    }
    if (
      artifact.solutionStageId !== null &&
      !solutionById
        .get(artifact.solutionStageId)
        .codeArtifactIds.includes(artifact.id)
    ) {
      throw new Error(
        `${artifact.id} is missing from ${artifact.solutionStageId}.codeArtifactIds.`,
      );
    }
  }

  for (const stateModel of normalized.stateModels) {
    if (
      stateModel.solutionStageId !== null &&
      !solutionIds.has(stateModel.solutionStageId)
    ) {
      throw new Error(
        `${stateModel.id} references unknown solution ${stateModel.solutionStageId}.`,
      );
    }
    if (
      stateModel.solutionStageId !== null &&
      !solutionById
        .get(stateModel.solutionStageId)
        .stateModelIds.includes(stateModel.id)
    ) {
      throw new Error(
        `${stateModel.id} is missing from ${stateModel.solutionStageId}.stateModelIds.`,
      );
    }
  }

  for (const stateId of normalized.correctness.stateModelIds) {
    if (!stateIds.has(stateId)) {
      throw new Error(`correctness references unknown state ${stateId}.`);
    }
  }

  if (normalized.correctness.method === "loop_invariant") {
    if (normalized.correctness.stateModelIds.length === 0) {
      throw new Error("loop_invariant requires a linked state model.");
    }
    const linkedStates = normalized.correctness.stateModelIds.map((stateId) =>
      stateById.get(stateId),
    );
    if (
      !linkedStates.some(
        (stateModel) =>
          stateModel.invariant?.sourceClass === "course_direct" &&
          stateModel.invariant.evidenceIds.length > 0,
      )
    ) {
      throw new Error("loop_invariant requires an evidence-backed invariant.");
    }
    const requiredPhases = [
      "initialization",
      "preservation",
      "termination",
      "postcondition",
    ];
    for (const phase of requiredPhases) {
      const hasDirectObligation = normalized.correctness.obligations.some(
        (candidate) =>
          candidate.phase === phase &&
          candidate.sourceClass === "course_direct" &&
          candidate.evidenceIds.length > 0,
      );
      if (!hasDirectObligation) {
        throw new Error(
          `loop_invariant requires a course_direct ${phase} obligation.`,
        );
      }
    }
  }

  if (
    normalized.correctness.method === "state_transition" &&
    (normalized.correctness.stateModelIds.length === 0 ||
      !normalized.correctness.stateModelIds.some(
        (stateId) => stateById.get(stateId).transitions.length > 0,
      ))
  ) {
    throw new Error(
      "state_transition requires a linked state model with transitions.",
    );
  }

  if (
    normalized.correctness.method === "not_applicable" &&
    (normalized.correctness.stateModelIds.length > 0 ||
      normalized.correctness.obligations.length > 0)
  ) {
    throw new Error(
      "not_applicable correctness cannot include states or obligations.",
    );
  }
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
const evidenceById = new Map();
const durationToleranceMs = strictExtraction ? 0 : 1000;
const validateTimestamp = (value, field) => {
  if (value !== null && (!Number.isInteger(value) || value < 0)) {
    throw new Error(`${field} must be a non-negative integer or null.`);
  }
};
const timestampExceedsDuration = (value) =>
  typeof normalized.actualDurationSeconds === "number" &&
  typeof value === "number" &&
  value > normalized.actualDurationSeconds * 1000 + durationToleranceMs;
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
    timestampExceedsDuration(segment.startMs) ||
    timestampExceedsDuration(segment.endMs)
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
  evidenceById.set(evidence.id, evidence);
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
    timestampExceedsDuration(evidence.startMs) ||
    timestampExceedsDuration(evidence.endMs)
  ) {
    throw new Error(`Evidence ${evidence.id} exceeds the media duration.`);
  }
}

const referencedEvidenceIds = [];
const directCourseEvidenceTypes = new Set([
  "video_audio",
  "video_visual",
  "video_combined",
]);
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
    if (value.sourceClass === "course_direct") {
      for (const evidenceId of value.evidenceIds) {
        const supportingEvidence = evidenceById.get(evidenceId);
        if (
          supportingEvidence &&
          !directCourseEvidenceTypes.has(supportingEvidence.sourceType)
        ) {
          throw new Error(
            `course_direct statement at ${path} references non-video evidence ${evidenceId}.`,
          );
        }
      }
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

if (strictExtraction) {
  assertCanonicalSchema(normalized, "Normalized");
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
