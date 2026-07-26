import { spawnSync } from "node:child_process";

const pnpmExecPath = process.env.npm_execpath;
const pnpm = pnpmExecPath
  ? { command: process.execPath, prefix: [pnpmExecPath], shell: false }
  : {
      command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      prefix: [],
      shell: process.platform === "win32",
    };
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
  console.log(`Installing project skills from ${source}...`);
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
      cwd: process.cwd(),
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
    cwd: process.cwd(),
    env: { ...process.env, DISABLE_TELEMETRY: "1" },
    shell: pnpm.shell,
    stdio: "inherit",
  },
);

if (playwrightResult.status !== 0) {
  process.exit(playwrightResult.status ?? 1);
}
