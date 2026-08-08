import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeJsonFile, type WriteResult } from "../fsUtils.js";

// Deterministic checks that should fail fast, before spending a renkei-reviewer
// round on the LLM: whichever of these the target project's package.json defines.
const CHECK_SCRIPTS = ["lint", "test", "build", "typecheck"] as const;

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export function generateChecksConfig(projectDir: string): WriteResult {
  const pkgPath = join(projectDir, "package.json");
  const commands: string[] = [];

  if (existsSync(pkgPath)) {
    let pkg: PackageJson | undefined;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;
    } catch {
      pkg = undefined;
    }

    const scripts = pkg?.scripts ?? {};
    for (const name of CHECK_SCRIPTS) {
      if (Object.prototype.hasOwnProperty.call(scripts, name)) {
        commands.push(`npm run ${name}`);
      }
    }
  }

  const dest = join(projectDir, ".renkei", "checks.json");
  return writeJsonFile(dest, { commands });
}
