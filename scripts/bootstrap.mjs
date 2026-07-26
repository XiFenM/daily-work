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

run(["install"]);
run(["skills:install"]);

if (withBrowserDeps) {
  run(["browser:install", "--with-deps"]);
} else if (withBrowser) {
  run(["browser:install"]);
}

run(["doctor"]);
