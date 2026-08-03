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

const makeV16DpFixture = () => {
  const fixture = makeV14Fixture();
  fixture.lessonId = "09-05";
  fixture.chapterId = "09";
  fixture.titleObserved = "0-1 背包问题";
  fixture.timeline[0] = {
    startMs: 0,
    endMs: 930520,
    topic: "0-1 背包状态定义与转移",
    summary: "定义二维状态并从选与不选两个分支得到转移。",
    evidenceIds: ["ev-001"],
  };
  fixture.learningObjectives = [sourced("理解 0-1 背包的状态与转移。")];
  fixture.concepts = [
    {
      canonicalName: "0-1 knapsack dynamic programming",
      namesObserved: ["0-1 背包"],
      role: "introduces",
      definition: "每件物品最多选择一次的背包状态模型。",
      evidenceIds: ["ev-001"],
    },
  ];
  fixture.problem = {
    platform: null,
    problemId: null,
    titleObserved: "0-1 背包问题",
    statement: "从若干物品中选择总重量不超过容量的组合。",
    constraints: ["每件物品最多选择一次"],
    clarifyingQuestions: [],
    evidenceIds: ["ev-001"],
  };
  fixture.solutionProgression[0] = {
    id: "solution-001",
    stage: "baseline",
    idea: "用物品前缀和容量定义二维状态。",
    timeComplexity: "O(nC)",
    spaceComplexity: "O(nC)",
    limitations: [],
    codeArtifactIds: ["code-001"],
    stateModelIds: ["state-001"],
    evidenceIds: ["ev-001"],
  };
  fixture.codeArtifacts[0] = {
    ...fixture.codeArtifacts[0],
    code: "dp[i][c] = max(dp[i - 1][c], v[i] + dp[i - 1][c - w[i]]);",
  };
  fixture.stateModels[0] = {
    id: "state-001",
    solutionStageId: "solution-001",
    kind: "other",
    variables: [
      {
        symbol: "dp[i][c]",
        role: "state value",
        meaning: "考虑前 i 件物品且容量为 c 时的最大价值",
        updateRule: "比较不选第 i 件与选择第 i 件的结果",
        evidenceIds: ["ev-001"],
      },
    ],
    regions: [
      {
        notation: "0 <= i <= n, 0 <= c <= C",
        meaning: "二维状态表的有效物品前缀与容量范围",
        evidenceIds: ["ev-001"],
      },
    ],
    invariant: null,
    transitions: [
      {
        condition: "w[i] <= c",
        updates: "dp[i][c] = max(dp[i - 1][c], v[i] + dp[i - 1][c - w[i]])",
        preserves: null,
        evidenceIds: ["ev-001"],
      },
    ],
    termination: sourced("最终从 dp[n][C] 读取答案。"),
    evidenceIds: ["ev-001"],
  };
  fixture.correctness = {
    method: "state_transition",
    claims: [sourced("每个状态比较选择与不选择当前物品。")],
    stateModelIds: ["state-001"],
    obligations: [],
  };
  fixture.complexity = {
    time: "O(nC)",
    space: "O(nC)",
    assumptions: ["n 为物品数，C 为背包容量"],
    evidenceIds: ["ev-001"],
  };
  fixture.evidence[0] = {
    ...fixture.evidence[0],
    assetId: "asset:video-09-05",
    observation: "画面和讲解展示二维 0-1 背包状态及选与不选转移。",
  };
  fixture.provenance.promptVersion = "video-evidence-v1.6";
  return fixture;
};

const makeV17GreedyFixture = () => {
  const fixture = makeV14Fixture();
  fixture.lessonId = "10-02";
  fixture.chapterId = "10";
  fixture.titleObserved = "贪心算法与动态规划的关系";
  fixture.timeline[0] = {
    startMs: 0,
    endMs: 930520,
    topic: "按区间终点排序并证明贪心选择",
    summary: "按右端点升序处理区间，并用交换论证说明首个选择。",
    evidenceIds: ["ev-001"],
  };
  fixture.learningObjectives = [sourced("区分贪心选择性质与最优子结构。")];
  fixture.concepts = [
    {
      canonicalName: "greedy exchange argument",
      namesObserved: ["交换论证"],
      role: "introduces",
      definition: "把某个最优解的首个选择替换为贪心选择。",
      evidenceIds: ["ev-001"],
    },
  ];
  fixture.problem = {
    platform: null,
    problemId: null,
    titleObserved: "区间选择",
    statement: "选择尽可能多的不重叠区间。",
    constraints: ["端点相等时可以衔接"],
    clarifyingQuestions: [],
    evidenceIds: ["ev-001"],
  };
  fixture.solutionProgression[0] = {
    id: "solution-001",
    stage: "optimized",
    idea: "按右端点升序扫描，接受与已选前缀不冲突的区间。",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    limitations: ["视频未给出相同右端点的二级排序键"],
    codeArtifactIds: ["code-001"],
    stateModelIds: ["state-001"],
    evidenceIds: ["ev-001"],
  };
  fixture.codeArtifacts[0] = {
    ...fixture.codeArtifacts[0],
    code: "sort(intervals.begin(), intervals.end(), byEnd); if (start >= end) { end = finish; }",
  };
  fixture.stateModels[0] = {
    id: "state-001",
    solutionStageId: "solution-001",
    kind: "other",
    variables: [
      {
        symbol: "intervals",
        role: "candidate_order",
        meaning: "按右端点升序排列的候选；相同右端点的 tie-break 未说明",
        updateRule: null,
        evidenceIds: ["ev-001"],
      },
      {
        symbol: "end",
        role: "feasibility_frontier",
        meaning: "已选前缀最后一个区间的右端点",
        updateRule: "接受候选后更新为该候选的右端点",
        evidenceIds: ["ev-001"],
      },
    ],
    regions: [
      {
        notation: "intervals[0..i)",
        meaning: "已经扫描并决定接受或跳过的候选前缀",
        evidenceIds: ["ev-001"],
      },
    ],
    invariant: null,
    transitions: [
      {
        condition: "candidate.start >= end",
        updates: "接受候选并令 end = candidate.end",
        preserves: null,
        evidenceIds: ["ev-001"],
      },
    ],
    termination: sourced("扫描完全部候选后返回已选择区间数。"),
    evidenceIds: ["ev-001"],
  };
  fixture.correctness = {
    method: "exchange_argument",
    completeness: "complete",
    claims: [sourced("可把一个最优解的首区间换成最早结束区间。")],
    stateModelIds: ["state-001"],
    obligations: [
      {
        phase: "greedy_choice",
        ...sourced("当前贪心选择是右端点最小的可行区间。"),
      },
      {
        phase: "exchange_step",
        ...sourced("替换最优解的首区间不会减少后续可选空间。"),
      },
      {
        phase: "optimal_substructure",
        ...sourced("首区间确定后，剩余区间构成同类最优子问题。"),
      },
      {
        phase: "postcondition",
        ...sourced("重复替换可得到与贪心选择序列一致的最优解。"),
      },
    ],
  };
  fixture.complexity = {
    time: "O(n log n)",
    space: "O(1)",
    assumptions: ["排序成本主导线性扫描"],
    evidenceIds: ["ev-001"],
  };
  fixture.uncertainties = [
    {
      field: "solution-001.candidateOrder.tieBreak",
      reason: "视频未说明相同右端点的二级排序键或稳定性。",
      recommendedCheck: "人工复核比较器完整画面。",
    },
  ];
  fixture.evidence[0] = {
    ...fixture.evidence[0],
    assetId: "asset:video-10-02",
    observation: "画面和讲解展示按右端点排序、线性扫描与交换论证。",
  };
  fixture.provenance.promptVersion = "video-evidence-v1.7";
  return fixture;
};

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
        raw.lessonId,
        "--chapter",
        raw.chapterId,
        "--asset-id",
        raw.evidence[0].assetId,
        "--duration",
        String(raw.actualDurationSeconds),
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

describe("normalize-lesson-evidence video-evidence-v1.6 DP gates", () => {
  it("accepts an evidence-backed dynamic-programming state and transition", async () => {
    const result = await runNormalizer(
      makeV16DpFixture(),
      "video-evidence-v1.6",
    );

    expect(result.status).toBe(0);
    expect(result.normalized.provenance.promptVersion).toBe(
      "video-evidence-v1.6",
    );
    expect(result.normalized.stateModels[0].kind).toBe("other");
  });

  it("rejects a coded chapter 09 baseline without a linked state model", async () => {
    const fixture = makeV16DpFixture();
    fixture.solutionProgression[0].stateModelIds = [];
    fixture.stateModels = [];
    fixture.correctness = {
      method: "unknown",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("requires a linked state model");
  });

  it.each(["baseline", "alternative", "observation"])(
    "accepts a described, uncoded %s stage without a state model",
    async (stage) => {
      const fixture = makeV16DpFixture();
      fixture.solutionProgression[0].stage = stage;
      fixture.solutionProgression[0].codeArtifactIds = [];
      fixture.solutionProgression[0].stateModelIds = [];
      fixture.codeArtifacts = [];
      fixture.stateModels = [];
      fixture.correctness = {
        method: "unknown",
        claims: [],
        stateModelIds: [],
        obligations: [],
      };

      const result = await runNormalizer(fixture, "video-evidence-v1.6");

      expect(result.status).toBe(0);
      expect(result.normalized.solutionProgression[0].stateModelIds).toEqual(
        [],
      );
    },
  );

  it.each(["intermediate", "optimized"])(
    "rejects an uncoded %s stage without a state model",
    async (stage) => {
      const fixture = makeV16DpFixture();
      fixture.solutionProgression[0].stage = stage;
      fixture.solutionProgression[0].codeArtifactIds = [];
      fixture.solutionProgression[0].stateModelIds = [];
      fixture.codeArtifacts = [];
      fixture.stateModels = [];
      fixture.correctness = {
        method: "unknown",
        claims: [],
        stateModelIds: [],
        obligations: [],
      };

      const result = await runNormalizer(fixture, "video-evidence-v1.6");

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("requires a linked state model");
    },
  );

  it("rejects a linked DP state without a variable or region", async () => {
    const fixture = makeV16DpFixture();
    fixture.stateModels[0].variables = [];
    fixture.stateModels[0].regions = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("state variable or region");
  });

  it("rejects a linked DP state without a transition", async () => {
    const fixture = makeV16DpFixture();
    fixture.stateModels[0].transitions = [];
    fixture.correctness = {
      method: "unknown",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("evidence-backed transition");
  });

  it("rejects induction without direct base, step, and result obligations", async () => {
    const fixture = makeV16DpFixture();
    fixture.correctness.method = "induction";
    fixture.correctness.obligations = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "induction requires a course_direct initialization obligation",
    );
  });

  it("accepts induction with direct base, step, and result obligations", async () => {
    const fixture = makeV16DpFixture();
    fixture.correctness.method = "induction";
    fixture.correctness.obligations = [
      {
        phase: "initialization",
        ...sourced("容量或物品前缀为空时，基本状态成立。"),
      },
      {
        phase: "preservation",
        ...sourced("假设较小物品前缀的状态正确，转移比较选与不选。"),
      },
      {
        phase: "postcondition",
        ...sourced("完成全部物品后，dp[n][C] 表示所求最大价值。"),
      },
    ];

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.method).toBe("induction");
  });
});

describe("normalize-lesson-evidence video-evidence-v1.7 greedy gates", () => {
  it("accepts a complete, evidence-backed exchange argument", async () => {
    const result = await runNormalizer(
      makeV17GreedyFixture(),
      "video-evidence-v1.7",
    );

    expect(result.status).toBe(0);
    expect(result.normalized.correctness).toMatchObject({
      method: "exchange_argument",
      completeness: "complete",
    });
  });

  it("accepts a partial exchange argument when the course omits proof obligations", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.completeness = "partial";
    fixture.correctness.obligations = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.completeness).toBe("partial");
  });

  it("rejects a complete exchange argument without an exchange step", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.obligations = fixture.correctness.obligations.filter(
      (obligation) => obligation.phase !== "exchange_step",
    );

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "exchange_argument completeness=complete requires a course_direct exchange_step obligation",
    );
  });

  it("rejects an editorial exchange step in an otherwise complete proof", async () => {
    const fixture = makeV17GreedyFixture();
    const exchangeStep = fixture.correctness.obligations.find(
      (obligation) => obligation.phase === "exchange_step",
    );
    exchangeStep.sourceClass = "editorial_inference";
    exchangeStep.evidenceIds = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "exchange_argument completeness=complete requires a course_direct exchange_step obligation",
    );
  });

  it("accepts a complete stays-ahead proof with all direct obligations", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.method = "stays_ahead";
    fixture.correctness.obligations = [
      {
        phase: "initialization",
        ...sourced("空前缀时贪心与任意可行解处于同一位置。"),
      },
      {
        phase: "prefix_dominance",
        ...sourced("每个长度相同的前缀中，贪心前缀的结束位置不更晚。"),
      },
      {
        phase: "preservation",
        ...sourced("加入下一个选择后，领先关系继续成立。"),
      },
      {
        phase: "termination",
        ...sourced("候选耗尽时前缀比较覆盖完整选择序列。"),
      },
      {
        phase: "postcondition",
        ...sourced("因此任意可行解都不能选择比贪心更多的区间。"),
      },
    ];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.method).toBe("stays_ahead");
  });

  it("rejects a complete stays-ahead proof without prefix dominance", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.method = "stays_ahead";
    fixture.correctness.obligations = [
      {
        phase: "initialization",
        ...sourced("空前缀时两者相同。"),
      },
      {
        phase: "preservation",
        ...sourced("加入选择后性质保持。"),
      },
      {
        phase: "termination",
        ...sourced("扫描结束时停止。"),
      },
      {
        phase: "postcondition",
        ...sourced("贪心解达到最优。"),
      },
    ];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "stays_ahead completeness=complete requires a course_direct prefix_dominance obligation",
    );
  });

  it("rejects completeness=complete for state transition alone", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.method = "state_transition";

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "correctness.completeness=complete is unsupported for state_transition",
    );
  });

  it("rejects unknown completeness when algorithmic material exists", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.completeness = "unknown";

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "must mark correctness.completeness as complete or partial",
    );
  });

  it("rejects disagreement between not_applicable method and completeness", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.completeness = "not_applicable";

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "must agree on not_applicable under video-evidence-v1.7",
    );
  });

  it("accepts matching not_applicable values for a chapter 11 conclusion", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.lessonId = "11-01";
    fixture.chapterId = "11";
    fixture.contentKind = "conclusion";
    fixture.problem = null;
    fixture.solutionProgression = [];
    fixture.codeArtifacts = [];
    fixture.stateModels = [];
    fixture.complexity = {
      time: null,
      space: null,
      assumptions: [],
      evidenceIds: [],
    };
    fixture.complexityAnalyses = [];
    fixture.formulaArtifacts = [];
    fixture.experiments = [];
    fixture.correctness = {
      method: "not_applicable",
      completeness: "not_applicable",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness.completeness).toBe("not_applicable");
  });

  it("rejects unknown correctness for a pure chapter 11 conclusion", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.lessonId = "11-01";
    fixture.chapterId = "11";
    fixture.contentKind = "conclusion";
    fixture.problem = null;
    fixture.solutionProgression = [];
    fixture.codeArtifacts = [];
    fixture.stateModels = [];
    fixture.correctness = {
      method: "unknown",
      completeness: "unknown",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };
    fixture.complexity = {
      time: null,
      space: null,
      assumptions: [],
      evidenceIds: [],
    };
    fixture.complexityAnalyses = [];
    fixture.formulaArtifacts = [];
    fixture.experiments = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "pure conclusion without algorithmic material must use not_applicable",
    );
  });

  it("rejects mismatched not_applicable values for a chapter 11 conclusion", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.lessonId = "11-01";
    fixture.chapterId = "11";
    fixture.contentKind = "conclusion";
    fixture.problem = null;
    fixture.solutionProgression = [];
    fixture.codeArtifacts = [];
    fixture.stateModels = [];
    fixture.correctness = {
      method: "unknown",
      completeness: "not_applicable",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "must agree on not_applicable under video-evidence-v1.7",
    );
  });

  it("rejects a coded greedy solution without a linked state model", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.solutionProgression[0].stateModelIds = [];
    fixture.stateModels = [];
    fixture.correctness = {
      method: "unknown",
      completeness: "partial",
      claims: [],
      stateModelIds: [],
      obligations: [],
    };

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("requires a linked state model");
  });

  it("rejects a linked chapter 10 state without a transition", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.correctness.completeness = "partial";
    fixture.correctness.obligations = [];
    fixture.stateModels[0].transitions = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("evidence-backed transition");
  });

  it("rejects an ordered greedy solution without a candidate_order variable", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.stateModels[0].variables[0].role = "candidate_list";

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("lacks a candidate_order state variable");
  });

  it("rejects candidate ordering that omits both tie-break semantics and uncertainty", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.stateModels[0].variables[0].meaning = "按右端点升序排列的候选";
    fixture.uncertainties = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "neither records tie-break semantics nor a tie-break uncertainty",
    );
  });

  it("accepts explicit start/end tie-break wording from observed C++ comparators", async () => {
    const fixture = makeV17GreedyFixture();
    fixture.stateModels[0].variables[0].meaning =
      "按 end 升序（若 end 相同则按 start 升序）排序后的区间数组";
    fixture.uncertainties = [];

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).toBe(0);
  });

  it("rejects a v1.7 document that omits correctness completeness", async () => {
    const fixture = makeV17GreedyFixture();
    delete fixture.correctness.completeness;

    const result = await runNormalizer(fixture, "video-evidence-v1.7");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("completeness");
  });

  it("keeps v1.6 documents valid without correctness completeness", async () => {
    const fixture = makeV16DpFixture();

    const result = await runNormalizer(fixture, "video-evidence-v1.6");

    expect(result.status).toBe(0);
    expect(result.normalized.correctness).not.toHaveProperty("completeness");
  });
});
