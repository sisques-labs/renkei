import { readFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../templatesPath.js";
import { writeTextFile, mergeClaudeStopHook, type WriteResult } from "../fsUtils.js";

const FRONTMATTER = `---
name: renkei-reviewer
description: Independent reviewer. Invoke after implementing a change and before reporting a coding task as done; it inspects the current diff and must approve it via .renkei/scripts/approve.mjs.
tools: Bash, Read, Grep, Glob
model: inherit
---

`;

export function generateClaudeReviewer(projectDir: string): WriteResult[] {
  const body = readFileSync(join(TEMPLATES_DIR, "reviewer-instructions.md"), "utf8");
  const agentFile = writeTextFile(join(projectDir, ".claude", "agents", "renkei-reviewer.md"), FRONTMATTER + body);

  const hookContent = readFileSync(join(TEMPLATES_DIR, "review-gate.mjs"), "utf8");
  const hookPath = join(projectDir, ".claude", "hooks", "renkei-review-gate.mjs");
  const hookFile = writeTextFile(hookPath, hookContent);
  chmodSync(hookPath, 0o755);

  const settingsPath = join(projectDir, ".claude", "settings.json");
  const hookMerge = mergeClaudeStopHook(
    settingsPath,
    'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/renkei-review-gate.mjs"',
  );

  return [agentFile, hookFile, hookMerge];
}
