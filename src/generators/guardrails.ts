import { readFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../templatesPath.js";
import { writeTextFile, mergeClaudeHook, mergeOpencodeBashPermission, type WriteResult } from "../fsUtils.js";

// Mirrors the deny-list in templates/guardrails.mjs, expressed as opencode
// permission.bash patterns (glob-ish, per opencode's own matching). Kept
// separate because opencode's pattern syntax isn't a JS regex.
const OPENCODE_DENY_PATTERNS: Record<string, string> = {
  "rm -rf /*": "deny",
  "rm -rf ~*": "deny",
  "sudo rm -rf*": "deny",
  "git push --force*main*": "deny",
  "git push --force*master*": "deny",
  "git push -f*main*": "deny",
  "git push -f*master*": "deny",
  "curl*|*sh*": "deny",
  "curl*|*bash*": "deny",
  "wget*|*sh*": "deny",
  "wget*|*bash*": "deny",
  "mkfs*": "deny",
  "dd*of=/dev/*": "deny",
  "chmod -R 777 /*": "deny",
};

export function generateClaudeGuardrails(projectDir: string): WriteResult[] {
  const hookContent = readFileSync(join(TEMPLATES_DIR, "guardrails.mjs"), "utf8");
  const hookPath = join(projectDir, ".claude", "hooks", "renkei-guardrails.mjs");
  const hookFile = writeTextFile(hookPath, hookContent);
  chmodSync(hookPath, 0o755);

  const settingsPath = join(projectDir, ".claude", "settings.json");
  const hookMerge = mergeClaudeHook(
    settingsPath,
    "PreToolUse",
    'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/renkei-guardrails.mjs"',
    { matcher: "Bash" },
  );

  return [hookFile, hookMerge];
}

export function generateOpencodeGuardrails(projectDir: string): WriteResult {
  const configPath = join(projectDir, "opencode.json");
  return mergeOpencodeBashPermission(configPath, OPENCODE_DENY_PATTERNS);
}
