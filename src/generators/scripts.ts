import { readFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../templatesPath.js";
import { writeTextFile, type WriteResult } from "../fsUtils.js";

export function writeApproveScript(projectDir: string): WriteResult {
  const content = readFileSync(join(TEMPLATES_DIR, "approve.mjs"), "utf8");
  const dest = join(projectDir, ".renkei", "scripts", "approve.mjs");
  const result = writeTextFile(dest, content);
  chmodSync(dest, 0o755);
  return result;
}
