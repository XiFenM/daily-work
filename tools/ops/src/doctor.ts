import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { release } from "node:os";
import { Command } from "commander";

type Level = "ok" | "warn" | "fail";

interface Check {
  level: Level;
  name: string;
  detail: string;
}

const program = new Command()
  .name("doctor")
  .description("Check the local daily-work environment")
  .option("--strict", "treat optional warnings as failures", false);

const commandVersion = (
  command: string,
  args = ["--version"],
): string | null => {
  if (command === "pnpm") {
    const version =
      process.env.npm_config_user_agent?.match(/pnpm\/([^\s]+)/)?.[1];
    if (version) return version;
  }

  const result = spawnSync(command, args, {
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) return null;
  return (result.stdout || result.stderr).trim().split(/\r?\n/)[0] ?? null;
};

program.action(({ strict }: { strict: boolean }) => {
  const checks: Check[] = [];
  checks.push({
    level: "ok",
    name: "Platform",
    detail: `${process.platform}/${process.arch} ${release()}`,
  });
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    level: nodeMajor >= 24 ? "ok" : "fail",
    name: "Node.js",
    detail: process.version,
  });

  for (const [name, command, required] of [
    ["pnpm", "pnpm", true],
    ["Git", "git", true],
    ["FFmpeg", "ffmpeg", false],
    ["FFprobe", "ffprobe", false],
  ] as const) {
    const version = commandVersion(command);
    checks.push({
      level: version ? "ok" : required ? "fail" : "warn",
      name,
      detail: version ?? "not found on PATH",
    });
  }

  if (process.platform === "linux") {
    const cjkFont = commandVersion("fc-match", [
      "--format=%{family}",
      "Noto Sans CJK SC",
    ]);
    checks.push({
      level: cjkFont?.includes("Noto Sans CJK") ? "ok" : "warn",
      name: "CJK font",
      detail: cjkFont?.includes("Noto Sans CJK")
        ? cjkFont
        : "Noto Sans CJK is missing; install fonts-noto-cjk",
    });
  }

  checks.push({
    level: existsSync(resolve("node_modules")) ? "ok" : "fail",
    name: "Dependencies",
    detail: existsSync(resolve("node_modules"))
      ? "node_modules is present"
      : "run pnpm install",
  });
  const playwrightCliEntry = resolve(
    "node_modules",
    "@playwright",
    "cli",
    "playwright-cli.js",
  );
  const playwrightCliVersion = existsSync(playwrightCliEntry)
    ? commandVersion(process.execPath, [playwrightCliEntry, "--version"])
    : null;
  checks.push({
    level: playwrightCliVersion ? "ok" : "fail",
    name: "Playwright CLI",
    detail:
      playwrightCliVersion ?? "not found; run pnpm install from the repo root",
  });
  checks.push({
    level: existsSync(resolve(".env")) ? "ok" : "warn",
    name: ".env",
    detail: existsSync(resolve(".env"))
      ? "local environment file is present"
      : "copy .env.example to .env",
  });

  for (const [name, variable] of [
    ["ZenMux API", "ZENMUX_API_KEY"],
    ["ZenMux management", "ZENMUX_MANAGEMENT_KEY"],
  ] as const) {
    checks.push({
      level: process.env[variable] ? "ok" : "warn",
      name,
      detail: process.env[variable]
        ? `${variable} is set`
        : `${variable} is not set`,
    });
  }

  for (const skill of [
    "creator-workflow",
    "zenmux-context",
    "zenmux-setup",
    "zenmux-usage",
    "remotion-best-practices",
    "remotion-docs",
    "playwright-cli",
  ]) {
    const found = existsSync(resolve(".agents", "skills", skill, "SKILL.md"));
    checks.push({
      level: found ? "ok" : "fail",
      name: `Skill ${skill}`,
      detail: found ? "installed" : "missing; run pnpm skills:install",
    });
  }

  const icons: Record<Level, string> = { ok: "✓", warn: "!", fail: "✗" };
  for (const check of checks) {
    console.log(`${icons[check.level]} ${check.name}: ${check.detail}`);
  }

  const hasFailure = checks.some((check) => check.level === "fail");
  const hasWarning = checks.some((check) => check.level === "warn");
  if (hasFailure || (strict && hasWarning)) {
    process.exitCode = 1;
  }
});

await program.parseAsync();
