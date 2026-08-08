#!/usr/bin/env node
// Renkei review gate: records the reviewer subagent's verdict for the current diff.
// Usage: node .renkei/scripts/approve.mjs <approve|reject> "notes"
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const verdict = process.argv[2];
const notes = process.argv[3] ?? "";

if (verdict !== "approve" && verdict !== "reject") {
  console.error('Usage: node .renkei/scripts/approve.mjs <approve|reject> "notes"');
  process.exit(1);
}

function statusIgnoringRenkeiState(raw) {
  return raw
    .split("\n")
    .filter((line) => !line.includes(".renkei/review.json"))
    .join("\n");
}

function diffFingerprint() {
  try {
    const diff = execSync("git diff HEAD", { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
    const status = statusIgnoringRenkeiState(execSync("git status --porcelain", { encoding: "utf8" }));
    return createHash("sha256").update(diff).update(" ").update(status).digest("hex");
  } catch {
    return "no-git";
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const renkeiDir = dirname(scriptDir);
const reviewPath = join(renkeiDir, "review.json");

mkdirSync(renkeiDir, { recursive: true });
writeFileSync(
  reviewPath,
  JSON.stringify(
    {
      diffHash: diffFingerprint(),
      approved: verdict === "approve",
      notes,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`Renkei review recorded: ${verdict}`);
