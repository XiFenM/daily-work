import { copyFileSync, existsSync } from "node:fs";
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
const withBrowser = process.argv.includes("--with-browser");
const withBrowserDeps = process.argv.includes("--with-browser-deps");

const run = (args) => {
  const result = spawnSync(pnpm.command, [...pnpm.prefix, ...args], {
    cwd: root,
    shell: pnpm.shell,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runGit = (args) => {
  const result = spawnSync("git", args, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const checkPython = () => {
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
  return candidates.some(({ command, prefix }) => {
    const result = spawnSync(command, [...prefix, "--version"], {
      cwd: root,
      shell: false,
      encoding: "utf8",
    });
    const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    return result.status === 0 && /^Python 3\./.test(version);
  });
};

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 24) {
  console.error(
    `Node.js 24+ is required; current version is ${process.version}.`,
  );
  process.exit(1);
}

if (withBrowserDeps && process.platform !== "linux") {
  console.error("--with-browser-deps is only supported on Linux.");
  process.exit(1);
}

if (!checkPython()) {
  console.error(
    "Python 3 is required to materialize central Skills. Set DAILY_WORK_PYTHON to an exact interpreter path.",
  );
  process.exit(1);
}

console.log(
  `Bootstrapping ${process.platform}/${process.arch} with ${process.version}.`,
);

const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  copyFileSync(resolve(root, ".env.example"), envPath);
  console.log(
    "Created .env from .env.example. Add secrets locally before API calls.",
  );
}

runGit(["submodule", "update", "--init", "--recursive"]);
run(["install"]);
run(["skills:sync"]);
run(["skills:check"]);

if (withBrowserDeps) {
  run(["browser:install", "--with-deps"]);
} else if (withBrowser) {
  run(["browser:install"]);
}

run(["repo:doctor"]);
