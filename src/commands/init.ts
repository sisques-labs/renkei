import { resolve } from "node:path";
import { detectTargets, type DetectionResult } from "../detect.js";
import { upsertAgentsMdSection } from "../generators/agentsMd.js";
import { ensureRenkeiGitignore } from "../generators/gitignore.js";
import { writeApproveScript } from "../generators/scripts.js";
import { generateClaudeReviewer } from "../generators/claudeReviewer.js";
import { generateOpencodeReviewer } from "../generators/opencodeReviewer.js";
import { generateMemoryFile } from "../generators/memory.js";
import { generateStateFile } from "../generators/state.js";
import { generatePreCompactHook } from "../generators/precompact.js";
import type { WriteResult } from "../fsUtils.js";

export interface InitOptions {
  cwd?: string;
  claude?: boolean;
  opencode?: boolean;
}

export interface InitReport {
  projectDir: string;
  targets: DetectionResult;
  results: WriteResult[];
}

export function runInit(options: InitOptions = {}): InitReport {
  const projectDir = resolve(options.cwd ?? process.cwd());
  const targets = detectTargets(projectDir, { claude: options.claude, opencode: options.opencode });

  if (!targets.claude && !targets.opencode) {
    throw new Error("No se detectó Claude Code ni opencode, y no se forzó ninguno con --claude/--opencode.");
  }

  const results: WriteResult[] = [];

  results.push(upsertAgentsMdSection(projectDir));
  results.push(ensureRenkeiGitignore(projectDir));
  results.push(writeApproveScript(projectDir));
  results.push(generateMemoryFile(projectDir));
  results.push(generateStateFile(projectDir));

  if (targets.claude) {
    results.push(...generateClaudeReviewer(projectDir));
    results.push(...generatePreCompactHook(projectDir));
  }
  if (targets.opencode) {
    results.push(...generateOpencodeReviewer(projectDir));
  }

  return { projectDir, targets, results };
}
