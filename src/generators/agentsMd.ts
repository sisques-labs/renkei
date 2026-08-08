import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextFile, type WriteResult } from "../fsUtils.js";

const START = "<!-- renkei:start -->";
const END = "<!-- renkei:end -->";

const BLOCK = `${START}
## Renkei review gate

Before you consider any code change complete, the \`renkei-reviewer\` subagent must
review your diff and approve it:

1. Finish your implementation.
2. Invoke the \`renkei-reviewer\` subagent on the current changes.
3. If it rejects your changes, fix the issues and request another review round.
4. Only report the task as done after \`renkei-reviewer\` has approved the current diff.

In Claude Code this is enforced automatically by a Stop hook. In opencode this is a
convention the primary agent must follow explicitly, since opencode does not yet
expose an equivalent hard gate.
${END}`;

export function upsertAgentsMdSection(projectDir: string): WriteResult {
  const path = join(projectDir, "AGENTS.md");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";

  let next: string;
  const markerRegex = new RegExp(`${START}[\\s\\S]*?${END}`);

  if (markerRegex.test(existing)) {
    next = existing.replace(markerRegex, BLOCK);
  } else if (existing.trim() === "") {
    next = `# AGENTS.md\n\n${BLOCK}\n`;
  } else {
    next = `${existing.replace(/\s*$/, "")}\n\n${BLOCK}\n`;
  }

  return writeTextFile(path, next);
}
