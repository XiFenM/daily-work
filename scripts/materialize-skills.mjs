import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tool = resolve(root, ".agent-skills", "tools", "materialize_skills.py");
const forwarded = process.argv.slice(2);
const allowed = new Set(["--check", "--dry-run"]);

if (
  forwarded.some((argument) => !allowed.has(argument)) ||
  new Set(forwarded).size !== forwarded.length ||
  (forwarded.includes("--check") && forwarded.includes("--dry-run"))
) {
  console.error(
    "Usage: node scripts/materialize-skills.mjs [--check | --dry-run]",
  );
  process.exit(2);
}

const candidates = process.env.DAILY_WORK_PYTHON
  ? [{ command: process.env.DAILY_WORK_PYTHON, prefix: [] }]
  : process.platform === "win32"
    ? [
        { command: "py", prefix: ["-3"] },
        { command: "python3", prefix: [] },
        { command: "python", prefix: [] },
      ]
    : [
        { command: "python3", prefix: [] },
        { command: "python", prefix: [] },
      ];

const environment = {
  ...process.env,
  PYTHONDONTWRITEBYTECODE: "1",
  PYTHONUTF8: "1",
};
const python = candidates.find(({ command, prefix }) => {
  const probe = spawnSync(command, [...prefix, "--version"], {
    cwd: root,
    env: environment,
    shell: false,
    encoding: "utf8",
  });
  const version = `${probe.stdout ?? ""}${probe.stderr ?? ""}`.trim();
  return probe.status === 0 && /^Python 3\./.test(version);
});

if (!python) {
  console.error(
    "Python 3 is required to materialize Skills. Set DAILY_WORK_PYTHON to an exact interpreter path.",
  );
  process.exit(1);
}

const result = spawnSync(
  python.command,
  [...python.prefix, tool, "--repo", root, ...forwarded],
  {
    cwd: root,
    env: environment,
    shell: false,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
