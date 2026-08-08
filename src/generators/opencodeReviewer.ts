import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../templatesPath.js";
import { writeTextFile, mergeOpencodeAgent, type WriteResult } from "../fsUtils.js";

export function generateOpencodeReviewer(projectDir: string): WriteResult[] {
  const body = readFileSync(join(TEMPLATES_DIR, "reviewer-instructions.md"), "utf8");
  const promptFile = writeTextFile(join(projectDir, ".opencode", "prompt", "renkei-reviewer.md"), body);

  const configPath = join(projectDir, "opencode.json");
  const agentMerge = mergeOpencodeAgent(configPath, "renkei-reviewer", {
    mode: "subagent",
    description:
      "Independent reviewer that must approve pending changes before a coding task is reported done.",
    prompt: "{file:./.opencode/prompt/renkei-reviewer.md}",
    permission: { edit: "deny", bash: "allow" },
  });

  return [promptFile, agentMerge];
}
