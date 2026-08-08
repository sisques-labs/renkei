import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { WriteResult } from "../fsUtils.js";

interface StateFile {
  currentTask: string | null;
  plan: string[];
  progress: string[];
  updatedAt: string | null;
}

const DEFAULT_STATE: StateFile = {
  currentTask: null,
  plan: [],
  progress: [],
  updatedAt: null,
};

/**
 * Create-if-missing, never-overwrite generator: once .renkei/state.json exists,
 * the agent may have updated it with a different shape/whitespace to reflect real
 * task progress, so subsequent `renkei init` runs must leave it completely untouched.
 * Deliberately does not go through writeJsonFile/writeTextFile's diff-and-rewrite path.
 */
export function generateStateFile(projectDir: string): WriteResult {
  const path = join(projectDir, ".renkei", "state.json");

  if (existsSync(path)) {
    return { action: "unchanged", path };
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(DEFAULT_STATE, null, 2)}\n`, "utf8");
  return { action: "created", path };
}
