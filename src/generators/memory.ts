import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { WriteResult } from "../fsUtils.js";

const MEMORY_TEMPLATE = `# Memoria del proyecto (Renkei)

Notas persistentes entre sesiones. Léelas antes de emprender trabajo no trivial;
añade una entrada cuando aprendas algo que valga la pena recordar (una decisión,
una convención, un error ya conocido). No borres entradas antiguas salvo que ya
no apliquen — esto es un registro acumulativo, no un scratchpad.

## Decisiones de arquitectura

## Convenciones del proyecto

## Errores conocidos / gotchas
`;

/**
 * Create-if-missing, never-overwrite generator: once .renkei/memory.md exists,
 * it may contain real notes an agent has appended that don't match this template
 * anymore, so subsequent `renkei init` runs must leave it completely untouched
 * (no diff-and-rewrite, unlike writeTextFile).
 */
export function generateMemoryFile(projectDir: string): WriteResult {
  const path = join(projectDir, ".renkei", "memory.md");

  if (existsSync(path)) {
    return { action: "unchanged", path };
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, MEMORY_TEMPLATE, "utf8");
  return { action: "created", path };
}
