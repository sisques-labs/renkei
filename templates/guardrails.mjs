#!/usr/bin/env node
// Renkei guardrails: a PreToolUse hook (matcher: Bash) for Claude Code that blocks
// a small deny-list of clearly catastrophic shell commands. This is NOT a sandbox
// or a security boundary -- it's a pragmatic, substring/regex-based safety net
// against a handful of "oops" patterns. It can be bypassed trivially by anyone
// who wants to; it exists to catch accidents, not attackers.
//
// Any parsing error falls back to allowing the command (exit 0): a missed
// guardrail is preferable to breaking normal development work.
import { readFileSync } from "node:fs";

// Keep the deny-list in one place so it's easy to extend later.
const DENY_PATTERNS = [
  { name: "rm -rf /", re: /\brm\s+(-\w*\s+)*-\w*[rR]\w*f\w*(\s+-\w*)*\s+\/(\s|$)/ },
  { name: "rm -rf /*", re: /\brm\s+(-\w*\s+)*-\w*[rR]\w*f\w*(\s+-\w*)*\s+\/\*(\s|$)/ },
  { name: "rm -rf ~", re: /\brm\s+(-\w*\s+)*-\w*[rR]\w*f\w*(\s+-\w*)*\s+~(\s|\/|$)/ },
  { name: "rm -rf * (root-ish)", re: /\brm\s+(-\w*\s+)*-\w*[rR]\w*f\w*(\s+-\w*)*\s+\*\s*$/ },
  { name: "sudo rm -rf", re: /\bsudo\s+rm\s+(-\w*\s+)*-\w*[rR]\w*f\w*/ },
  { name: "force push to main/master", re: /\bgit\s+push\s+.*(--force|-f)\b.*\b(main|master)\b/ },
  { name: "force push to main/master (reversed args)", re: /\bgit\s+push\s+.*\b(main|master)\b.*(--force|-f)\b/ },
  { name: "curl | sh", re: /\bcurl\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/ },
  { name: "wget | sh", re: /\bwget\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/ },
  { name: "mkfs", re: /\bmkfs(\.\w+)?\b/ },
  { name: "dd to a device", re: /\bdd\b[^\n]*\bof=\/dev\/\w+/ },
  { name: "fork bomb", re: /:\(\)\s*\{\s*:\s*\|\s*:\s*&?\s*\}\s*;\s*:/ },
  { name: "chmod -R 777 /", re: /\bchmod\s+(-\w*\s+)*-\w*[rR]\w*(\s+-\w*)*\s+0*777\s+\/(\s|$)/ },
];

function findDenyMatch(command) {
  if (typeof command !== "string" || command.trim() === "") return undefined;
  for (const pattern of DENY_PATTERNS) {
    if (pattern.re.test(command)) return pattern;
  }
  return undefined;
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const raw = readStdin();

if (!raw || raw.trim() === "") {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

try {
  if (payload?.tool_name !== "Bash") {
    process.exit(0);
  }

  const command = payload?.tool_input?.command;
  const match = findDenyMatch(command);

  if (match) {
    console.error(
      `Renkei guardrails: blocked a Bash command matching a known-destructive pattern (${match.name}).\n` +
        `Command: ${command}\n` +
        "This is a lightweight guardrail, not a sandbox -- if this command is actually intended, " +
        "run it manually outside Claude Code.",
    );
    process.exit(2);
  }

  process.exit(0);
} catch {
  // Anything unexpected in the payload shape: fail open.
  process.exit(0);
}
