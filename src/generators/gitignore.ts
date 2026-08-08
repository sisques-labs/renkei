import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextFile, type WriteResult } from "../fsUtils.js";

const ENTRY = ".renkei/review.json";

export function ensureRenkeiGitignore(projectDir: string): WriteResult {
  const path = join(projectDir, ".gitignore");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";

  if (existing.split("\n").some((line) => line.trim() === ENTRY)) {
    return { action: "unchanged", path };
  }

  const next = existing === "" ? `${ENTRY}\n` : `${existing.replace(/\s*$/, "")}\n${ENTRY}\n`;
  return writeTextFile(path, next);
}
