import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["--import", "tsx", "tools/zenmux/src/cli.ts", ...process.argv.slice(2)],
  {
    env: {
      ...process.env,
      NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? "1",
    },
    stdio: "inherit",
  },
);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.once("SIGINT", () => forwardSignal("SIGINT"));
process.once("SIGTERM", () => forwardSignal("SIGTERM"));

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => {
    if (signal) {
      resolve(1);
      return;
    }
    resolve(code ?? 1);
  });
});

process.exitCode = exitCode;
