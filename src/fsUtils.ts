import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type FileAction = "created" | "updated" | "unchanged";

export interface WriteResult {
  action: FileAction;
  path: string;
}

function ensureDirFor(absPath: string): void {
  mkdirSync(dirname(absPath), { recursive: true });
}

export function writeTextFile(absPath: string, content: string): WriteResult {
  ensureDirFor(absPath);
  const existed = existsSync(absPath);
  if (existed) {
    const current = readFileSync(absPath, "utf8");
    if (current === content) {
      return { action: "unchanged", path: absPath };
    }
  }
  writeFileSync(absPath, content, "utf8");
  return { action: existed ? "updated" : "created", path: absPath };
}

export function readJsonFile<T>(absPath: string): T | undefined {
  if (!existsSync(absPath)) return undefined;
  const raw = readFileSync(absPath, "utf8").trim();
  if (raw === "") return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`No se pudo leer ${absPath} como JSON válido: ${(err as Error).message}`);
  }
}

export function writeJsonFile(absPath: string, data: unknown): WriteResult {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  return writeTextFile(absPath, content);
}

interface ClaudeHookHandler {
  type: string;
  command: string;
  timeout?: number;
  [key: string]: unknown;
}

interface ClaudeHookGroup {
  matcher?: string;
  hooks: ClaudeHookHandler[];
}

interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookGroup[]>;
  [key: string]: unknown;
}

export interface MergeClaudeHookOptions {
  matcher?: string;
  timeout?: number;
}

export function mergeClaudeHook(
  settingsPath: string,
  event: string,
  hookCommand: string,
  opts: MergeClaudeHookOptions = {},
): WriteResult {
  const { matcher, timeout = 60 } = opts;
  const settings: ClaudeSettings = readJsonFile<ClaudeSettings>(settingsPath) ?? {};
  settings.hooks ??= {};
  settings.hooks[event] ??= [];
  const groups = settings.hooks[event];

  const alreadyPresent = groups.some(
    (group) => group.hooks?.some((handler) => handler.command === hookCommand),
  );

  if (alreadyPresent) {
    return { action: "unchanged", path: settingsPath };
  }

  const newGroup: ClaudeHookGroup = { hooks: [{ type: "command", command: hookCommand, timeout }] };
  if (matcher !== undefined) {
    newGroup.matcher = matcher;
  }
  groups.push(newGroup);

  return writeJsonFile(settingsPath, settings);
}

export function mergeClaudeStopHook(settingsPath: string, hookCommand: string, timeout = 60): WriteResult {
  return mergeClaudeHook(settingsPath, "Stop", hookCommand, { timeout });
}

// No matcher: fires for both "manual" (/compact) and "auto" (context-window-full) triggers.
export function mergeClaudePreCompactHook(settingsPath: string, hookCommand: string, timeout = 10): WriteResult {
  return mergeClaudeHook(settingsPath, "PreCompact", hookCommand, { timeout });
}

interface OpencodeAgentDef {
  mode: "primary" | "subagent" | "all";
  [key: string]: unknown;
}

interface OpencodePermission {
  bash?: Record<string, string>;
  [key: string]: unknown;
}

interface OpencodeConfig {
  agent?: Record<string, OpencodeAgentDef>;
  permission?: OpencodePermission;
  [key: string]: unknown;
}

export function mergeOpencodeAgent(configPath: string, agentName: string, agentDef: OpencodeAgentDef): WriteResult {
  const config: OpencodeConfig = readJsonFile<OpencodeConfig>(configPath) ?? {};
  config.agent ??= {};

  const existing = config.agent[agentName];
  if (existing && JSON.stringify(existing) === JSON.stringify(agentDef)) {
    return { action: "unchanged", path: configPath };
  }

  config.agent[agentName] = agentDef;
  return writeJsonFile(configPath, config);
}

// Merges deny/allow patterns into opencode.json's top-level permission.bash map.
// Only fills in patterns that are not already present (by key) so a user's own
// customizations to an existing pattern are never clobbered; re-running is a no-op.
export function mergeOpencodeBashPermission(
  configPath: string,
  patterns: Record<string, string>,
): WriteResult {
  const config: OpencodeConfig = readJsonFile<OpencodeConfig>(configPath) ?? {};
  config.permission ??= {};
  config.permission.bash ??= {};
  const bash = config.permission.bash;

  let changed = false;
  for (const [pattern, decision] of Object.entries(patterns)) {
    if (!(pattern in bash)) {
      bash[pattern] = decision;
      changed = true;
    }
  }

  if (!changed) {
    return { action: "unchanged", path: configPath };
  }

  return writeJsonFile(configPath, config);
}
