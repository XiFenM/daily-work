import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const normalizerPath = resolve(
  scriptDirectory,
  "normalize-lesson-evidence.mjs",
);

const sourced = (statement) => ({
  statement,
  sourceClass: "course_direct",
  evidenceIds: ["ev-001"],
});

const makeV14Fixture = () => ({
  schemaVersion: "1.0",
  lessonId: "03-01",
  chapterId: "03",
  titleObserved: "二分查找",
  contentKind: "problem_walkthrough",
  actualDurationSeconds: 930.52,
  timeline: [
    {
      startMs: 0,
      endMs: 930520,
      topic: "二分查找",
      summary: "使用闭区间实现二分查找。",
      evidenceIds: ["ev-001"],
    },
  ],
  learningObjectives: [sourced("理解搜索区间定义。")],
  concepts: [
    {
      canonicalName: "binary search",
      namesObserved: ["二分查找"],
      role: "introduces",
      definition: "在有序数组中缩小搜索区间。",
      evidenceIds: ["ev-001"],
    },
  ],
  problem: {
    platform: null,
    problemId: null,
    titleObserved: null,
    statement: "在有序数组中查找目标值。",
    constraints: ["数组有序"],
    clarifyingQuestions: [],
    evidenceIds: ["ev-001"],
  },
  solutionProgression: [
    {
      id: "solution-001",
      stage: "optimized",
      idea: "每次排除一半搜索区间。",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
      limitations: [],
      codeArtifactIds: ["code-001"],
      stateModelIds: ["state-001"],
      evidenceIds: ["ev-001"],
    },
  ],
  codeArtifacts: [
    {
      id: "code-001",
      solutionStageId: "solution-001",
      language: "cpp",
      sourceKind: "shown_in_video",
      completeness: "complete",
      code: "while (l <= r) { /* shown code */ }",
      ocrUncertainties: [],
      verification: "not_run",
      evidenceIds: ["ev-001"],
    },
  ],
  stateModels: [
    {
      id: "state-001",
      solutionStageId: "solution-001",
      kind: "search_interval",
      variables: [
        {
          symbol: "l",
          role: "left boundary",
          meaning: "闭区间左端点",
          updateRule: "排除左半区间时更新为 mid + 1",
          evidenceIds: ["ev-001"],
        },
      ],
      regions: [
        {
          notation: "[l, r]",
          meaning: "目标仍可能存在的闭区间",
          evidenceIds: ["ev-001"],
        },
      ],
      invariant: sourced("每轮开始时，目标若存在则位于 [l, r]。"),
      transitions: [
        {
          condition: "arr[mid] < target",
          updates: "l = mid + 1",
          preserves: sourced("排除不可能包含目标的左半区间"),
          evidenceIds: ["ev-001"],
        },
      ],
      termination: sourced("l > r 时搜索区间为空。"),
      evidenceIds: ["ev-001"],
    },
  ],
  correctness: {
    method: "loop_invariant",
    claims: [sourced("边界更新保持搜索区间语义。")],
    stateModelIds: ["state-001"],
    obligations: [
      {
        phase: "initialization",
        ...sourced("初始化后的区间覆盖完整数组。"),
      },
      {
        phase: "preservation",
        ...sourced("每个分支只排除不可能包含目标的部分。"),
      },
      {
        phase: "termination",
        ...sourced("循环在搜索区间为空时结束。"),
      },
      {
        phase: "postcondition",
        ...sourced("返回 -1 表示搜索区间内不存在目标。"),
      },
    ],
  },
  complexity: {
    time: "O(log n)",
    space: "O(1)",
    assumptions: ["数组支持随机访问"],
    evidenceIds: ["ev-001"],
  },
  complexityAnalyses: [],
  formulaArtifacts: [],
  experiments: [],
  examples: [],
  edgeCases: [],
  implementationPitfalls: [],
  interviewPlaybook: [],
  relationCandidates: [],
  evidence: [
    {
      id: "ev-001",
      sourceType: "video_combined",
      startMs: 0,
      endMs: 930520,
      assetId: "asset:video-03-01",
      locator: null,
      observation: "画面和讲解展示闭区间二分查找。",
      confidence: 0.99,
    },
  ],
  uncertainties: [],
  provenance: {
    model: "test/model",
    requestId: null,
    promptVersion: "video-evidence-v1.4",
    generatedAt: null,
  },
});

const runNormalizer = async (raw, promptVersion = "video-evidence-v1.4") => {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "lesson-evidence-test-"),
  );
  const inputPath = resolve(temporaryDirectory, "raw.json");
  const responsePath = resolve(temporaryDirectory, "response.json");
  const outputPath = resolve(temporaryDirectory, "normalized.json");
  await Promise.all([
    writeFile(inputPath, JSON.stringify(raw), "utf8"),
    writeFile(
      responsePath,
      JSON.stringify({
        id: "request-test",
        model: "test/model",
        created: 1,
      }),
      "utf8",
    ),
  ]);

  try {
    const result = spawnSync(
      process.execPath,
      [
        normalizerPath,
        "--input",
        inputPath,
        "--response",
        responsePath,
        "--out",
        outputPath,
        "--lesson",
        "03-01",
        "--chapter",
        "03",
        "--asset-id",
        "asset:video-03-01",
        "--duration",
        "930.52",
        "--prompt-version",
        promptVersion,
      ],
      { encoding: "utf8" },
    );
    const normalized =
      result.status === 0
        ? JSON.parse(await readFile(outputPath, "utf8"))
        : undefined;
    return { ...result, normalized };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
};

describe("normalize-lesson-evidence video-evidence-v1.4", () => {
  it("accepts a linked, evidence-backed loop invariant", async () => {
    const result = await runNormalizer(makeV14Fixture());

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.method).toBe("loop_invariant");
    expect(result.normalized.stateModels).toHaveLength(1);
  });

  it("applies the same strict gate to video-evidence-v1.5", async () => {
    const fixture = makeV14Fixture();
    fixture.provenance.promptVersion = "video-evidence-v1.5";

    const result = await runNormalizer(fixture, "video-evidence-v1.5");

    expect(result.status).toBe(0);
    expect(result.normalized.provenance.promptVersion).toBe(
      "video-evidence-v1.5",
    );
  });

  it("accepts reuse of an unchanged state model by a later solution", async () => {
    const fixture = makeV14Fixture();
    fixture.solutionProgression.push({
      id: "solution-002",
      stage: "optimized",
      idea: "只替换中点计算公式，搜索区间语义不变。",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
      limitations: [],
      codeArtifactIds: [],
      stateModelIds: ["state-001"],
      evidenceIds: ["ev-001"],
    });

    const result = await runNormalizer(fixture);

    expect(result.status).toBe(0);
    expect(result.normalized.solutionProgression[1].stateModelIds).toEqual([
      "state-001",
    ]);
  });

  it("rejects a timestamp one millisecond beyond the media duration", async () => {
    const fixture = makeV14Fixture();
    fixture.evidence[0].endMs = 930521;

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("exceeds the media duration");
  });

  it("rejects a start timestamp beyond duration when endMs is null", async () => {
    const fixture = makeV14Fixture();
    fixture.evidence[0].startMs = 930521;
    fixture.evidence[0].endMs = null;

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("exceeds the media duration");
  });

  it("rejects loop_invariant without an invariant", async () => {
    const fixture = makeV14Fixture();
    fixture.stateModels[0].invariant = null;

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("evidence-backed invariant");
  });

  it("rejects an editorial invariant for loop_invariant", async () => {
    const fixture = makeV14Fixture();
    fixture.stateModels[0].invariant = {
      statement: "这是编辑补出的不变量。",
      sourceClass: "editorial_inference",
      evidenceIds: [],
    };

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("evidence-backed invariant");
  });

  it("accepts multiple direct obligations for the same phase", async () => {
    const fixture = makeV14Fixture();
    fixture.correctness.obligations.push({
      phase: "preservation",
      ...sourced("另一个分支同样保持搜索区间语义。"),
    });

    const result = await runNormalizer(fixture);

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.obligations).toHaveLength(5);
  });

  it("rejects a dangling solution-to-code reference", async () => {
    const fixture = makeV14Fixture();
    fixture.solutionProgression[0].codeArtifactIds = ["code-999"];

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("references unknown code code-999");
  });

  it("rejects code without evidence", async () => {
    const fixture = makeV14Fixture();
    fixture.codeArtifacts[0].evidenceIds = [];

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must contain unique, valid IDs");
  });

  it("rejects extra fields in strict code artifacts", async () => {
    const fixture = makeV14Fixture();
    fixture.codeArtifacts[0].inventedField = true;

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must NOT have additional properties");
  });

  it("rejects course_direct statements backed only by editorial evidence", async () => {
    const fixture = makeV14Fixture();
    fixture.evidence[0].sourceType = "editorial_inference";

    const result = await runNormalizer(fixture);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("references non-video evidence ev-001");
  });

  it("rejects a CLI prompt-version override that disagrees with raw provenance", async () => {
    const fixture = makeV14Fixture();

    const result = await runNormalizer(fixture, "video-evidence-v1.3");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("does not match video-evidence-v1.3");
  });

  it("keeps a legacy v1.3 document valid without v1.4 fields", async () => {
    const fixture = makeV14Fixture();
    delete fixture.stateModels;
    fixture.solutionProgression = [];
    fixture.codeArtifacts = [];
    fixture.problem = null;
    fixture.correctness = { method: "unknown", claims: [] };
    fixture.provenance.promptVersion = "video-evidence-v1.3";

    const result = await runNormalizer(fixture, "video-evidence-v1.3");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.method).toBe("not_applicable");
    expect(result.normalized).not.toHaveProperty("stateModels");
  });
});
