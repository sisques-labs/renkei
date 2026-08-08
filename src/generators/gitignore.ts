import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextFile, type WriteResult } from "../fsUtils.js";

// .renkei/review.json and .renkei/state.json are ephemeral working state (review
// verdicts, in-flight task progress) -- not durable project knowledge like
// .renkei/memory.md, which is meant to be committed and must stay out of this list.
const ENTRIES = [".renkei/review.json", ".renkei/state.json"];

export function ensureRenkeiGitignore(projectDir: string): WriteResult {
  const path = join(projectDir, ".gitignore");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = existing.split("\n").map((line) => line.trim());

  const missing = ENTRIES.filter((entry) => !lines.includes(entry));
  if (missing.length === 0) {
    return { action: "unchanged", path };
  }

  const addition = missing.map((entry) => `${entry}\n`).join("");
  const next = existing === "" ? addition : `${existing.replace(/\s*$/, "")}\n${addition}`;
  return writeTextFile(path, next);
}
