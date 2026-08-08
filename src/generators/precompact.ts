import { readFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../templatesPath.js";
import { writeTextFile, mergeClaudePreCompactHook, type WriteResult } from "../fsUtils.js";

/**
 * Installs a best-effort Claude Code PreCompact hook that reminds the model to
 * keep .renkei/state.json current before context gets compacted. Non-blocking
 * by design -- see templates/precompact-reminder.mjs for why.
 */
export function generatePreCompactHook(projectDir: string): WriteResult[] {
  const hookContent = readFileSync(join(TEMPLATES_DIR, "precompact-reminder.mjs"), "utf8");
  const hookPath = join(projectDir, ".claude", "hooks", "renkei-precompact-reminder.mjs");
  const hookFile = writeTextFile(hookPath, hookContent);
  chmodSync(hookPath, 0o755);

  const settingsPath = join(projectDir, ".claude", "settings.json");
  const hookMerge = mergeClaudePreCompactHook(
    settingsPath,
    'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/renkei-precompact-reminder.mjs"',
  );

  return [hookFile, hookMerge];
}
