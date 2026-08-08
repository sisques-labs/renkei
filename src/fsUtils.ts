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

export function mergeClaudeStopHook(settingsPath: string, hookCommand: string, timeout = 60): WriteResult {
  const settings: ClaudeSettings = readJsonFile<ClaudeSettings>(settingsPath) ?? {};
  settings.hooks ??= {};
  settings.hooks.Stop ??= [];

  const alreadyPresent = settings.hooks.Stop.some((group) =>
    group.hooks?.some((handler) => handler.command === hookCommand),
  );

  if (alreadyPresent) {
    return { action: "unchanged", path: settingsPath };
  }

  settings.hooks.Stop.push({
    hooks: [{ type: "command", command: hookCommand, timeout }],
  });

  return writeJsonFile(settingsPath, settings);
}

interface OpencodeAgentDef {
  mode: "primary" | "subagent" | "all";
  [key: string]: unknown;
}

interface OpencodeConfig {
  agent?: Record<string, OpencodeAgentDef>;
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
