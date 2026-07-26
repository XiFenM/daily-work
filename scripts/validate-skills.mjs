import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".agents", "skills");
const failures = [];

if (!existsSync(root)) {
  console.error("Missing .agents/skills.");
  process.exit(1);
}

const skillDirectories = readdirSync(root, { withFileTypes: true }).filter(
  (entry) => entry.isDirectory(),
);

for (const directory of skillDirectories) {
  const skillPath = join(root, directory.name, "SKILL.md");
  if (!existsSync(skillPath)) {
    failures.push(`${directory.name}: missing SKILL.md`);
    continue;
  }

  const content = readFileSync(skillPath, "utf8");
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const name = frontmatter?.[1].match(
    /^name:\s*["']?([^"'\r\n]+)["']?\s*$/m,
  )?.[1];
  const description = frontmatter?.[1].match(/^description:\s*(.+)$/m)?.[1];

  if (!frontmatter) {
    failures.push(`${directory.name}: invalid or missing YAML frontmatter`);
  }
  if (!name || name !== directory.name) {
    failures.push(`${directory.name}: frontmatter name must match directory`);
  }
  if (!description || description.includes("TODO")) {
    failures.push(`${directory.name}: missing usable description`);
  }
  if (content.includes("[TODO")) {
    failures.push(`${directory.name}: unresolved TODO placeholder`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${skillDirectories.length} project skills.`);
