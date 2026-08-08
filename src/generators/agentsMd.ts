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

Before invoking \`renkei-reviewer\`, deterministic checks (lint/test/build, from
\`.renkei/checks.json\`) run first and block on failure, so review rounds aren't
spent on problems a script could have caught. Separately, a small guardrail
blocks a handful of clearly destructive Bash patterns (e.g. \`rm -rf /\`, force
push to main); it is not a sandbox or a substitute for care.

## Project memory

\`.renkei/memory.md\` is durable, git-committed project knowledge that survives across
sessions and context resets. Consult it before starting non-trivial work. Append a
short entry when you make an architectural decision, hit a non-obvious gotcha, or
establish a convention worth remembering. Don't remove existing entries unless they
no longer apply -- it's a cumulative log, not a scratchpad.

## Task state externalization

For work that touches several files or spans multiple steps, keep \`.renkei/state.json\`
updated with the current task, a short plan, and progress so far. This lets the work
resume cleanly after a context reset/compaction or from a fresh session, instead of
having to re-derive everything from scratch.
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
