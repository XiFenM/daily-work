import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pnpmExecPath = process.env.npm_execpath;
const pnpm = pnpmExecPath
  ? { command: process.execPath, prefix: [pnpmExecPath], shell: false }
  : {
      command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      prefix: [],
      shell: process.platform === "win32",
    };

const skillStatus = spawnSync(
  "git",
  ["status", "--porcelain", "--", ".agents/skills", "skills-lock.json"],
  {
    cwd: root,
    encoding: "utf8",
  },
);

if (skillStatus.error || skillStatus.status !== 0) {
  console.error(
    skillStatus.error?.message ||
      skillStatus.stderr ||
      "Unable to inspect the project skill worktree.",
  );
  process.exit(skillStatus.status ?? 1);
}

if (skillStatus.stdout.trim()) {
  console.error(
    "Project skills have uncommitted changes. Review and commit, stash, or revert them before updating:",
  );
  console.error(skillStatus.stdout.trimEnd());
  process.exit(1);
}

const common = [
  "dlx",
  "skills@latest",
  "add",
  "--agent",
  "codex",
  "--copy",
  "--yes",
];

const installs = [
  [
    "ZenMux/skills",
    "--skill",
    "zenmux-context",
    "zenmux-setup",
    "zenmux-usage",
  ],
  ["remotion-dev/skills", "--skill", "*"],
];

for (const [source, ...selection] of installs) {
  console.log(`Updating project skills from ${source}...`);
  const result = spawnSync(
    pnpm.command,
    [
      ...pnpm.prefix,
      ...common.slice(0, 3),
      source,
      ...selection,
      ...common.slice(3),
    ],
    {
      cwd: root,
      env: { ...process.env, DISABLE_TELEMETRY: "1" },
      shell: pnpm.shell,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Installing the Playwright skill matching the local CLI...");
const playwrightResult = spawnSync(
  pnpm.command,
  [...pnpm.prefix, "exec", "playwright-cli", "install", "--skills=agents"],
  {
    cwd: root,
    env: { ...process.env, DISABLE_TELEMETRY: "1" },
    shell: pnpm.shell,
    stdio: "inherit",
  },
);

if (playwrightResult.status !== 0) {
  process.exit(playwrightResult.status ?? 1);
}

console.log("Validating updated project skills...");
const validationResult = spawnSync(
  pnpm.command,
  [...pnpm.prefix, "skills:check"],
  {
    cwd: root,
    shell: pnpm.shell,
    stdio: "inherit",
  },
);

if (validationResult.status !== 0) {
  process.exit(validationResult.status ?? 1);
}

console.log(
  "Project skills updated. Review .agents/skills and skills-lock.json before committing.",
);
