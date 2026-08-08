import { existsSync } from "node:fs";
import { join } from "node:path";

export interface DetectionResult {
  claude: boolean;
  opencode: boolean;
}

export function detectClaudeCode(projectDir: string): boolean {
  return existsSync(join(projectDir, ".claude")) || existsSync(join(projectDir, "CLAUDE.md"));
}

export function detectOpenCode(projectDir: string): boolean {
  return existsSync(join(projectDir, ".opencode")) || existsSync(join(projectDir, "opencode.json"));
}

export function detectTargets(
  projectDir: string,
  overrides: { claude?: boolean; opencode?: boolean },
): DetectionResult {
  if (overrides.claude !== undefined || overrides.opencode !== undefined) {
    return {
      claude: overrides.claude ?? false,
      opencode: overrides.opencode ?? false,
    };
  }

  const claude = detectClaudeCode(projectDir);
  const opencode = detectOpenCode(projectDir);

  if (!claude && !opencode) {
    return { claude: true, opencode: true };
  }

  return { claude, opencode };
}
