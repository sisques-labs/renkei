#!/usr/bin/env node
// Renkei Stop hook for Claude Code: blocks finishing a turn until the renkei-reviewer
// subagent has approved the current diff. Exit code 2 tells Claude Code to keep going.
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

function run(cmd) {
  return execSync(cmd, { cwd: projectDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
}

function statusIgnoringRenkeiState(raw) {
  return raw
    .split("\n")
    .filter((line) => !line.includes(".renkei/review.json"))
    .join("\n");
}

let diff;
let status;
try {
  diff = run("git diff HEAD");
  status = statusIgnoringRenkeiState(run("git status --porcelain"));
} catch {
  // Not a git repo, or git unavailable: nothing we can enforce, let Claude stop.
  process.exit(0);
}

if (diff.trim() === "" && status.trim() === "") {
  // No pending changes at all, nothing for renkei-reviewer to look at.
  process.exit(0);
}

const currentHash = createHash("sha256").update(diff).update(" ").update(status).digest("hex");
const reviewPath = join(projectDir, ".renkei", "review.json");

if (!existsSync(reviewPath)) {
  console.error(
    "Renkei: pending changes have not been reviewed yet. Invoke the renkei-reviewer subagent, " +
      "then have it run node .renkei/scripts/approve.mjs before finishing.",
  );
  process.exit(2);
}

let review;
try {
  review = JSON.parse(readFileSync(reviewPath, "utf8"));
} catch {
  console.error("Renkei: .renkei/review.json is not valid JSON. Invoke renkei-reviewer again.");
  process.exit(2);
}

if (review.diffHash !== currentHash) {
  console.error(
    "Renkei: the diff changed since the last review. Invoke the renkei-reviewer subagent again " +
      "on the current changes before finishing.",
  );
  process.exit(2);
}

if (review.approved !== true) {
  console.error(
    `Renkei: renkei-reviewer rejected these changes: ${review.notes || "(no notes)"}. ` +
      "Address the feedback and request another review before finishing.",
  );
  process.exit(2);
}

process.exit(0);
