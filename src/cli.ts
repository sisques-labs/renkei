#!/usr/bin/env node
import { Command } from "commander";
import { relative } from "node:path";
import { runInit } from "./commands/init.js";

const program = new Command();

program
  .name("renkei")
  .description(
    "Instala un gate de revisión cruzada y convenciones compartidas para Claude Code y opencode.",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Detecta Claude Code y/o opencode en el proyecto actual e instala el harness de Renkei.")
  .option("--claude", "Instala solo para Claude Code")
  .option("--opencode", "Instala solo para opencode")
  .option("--cwd <path>", "Directorio del proyecto destino", process.cwd())
  .action((opts: { claude?: boolean; opencode?: boolean; cwd: string }) => {
    const explicit = Boolean(opts.claude || opts.opencode);
    try {
      const report = runInit({
        cwd: opts.cwd,
        claude: explicit ? Boolean(opts.claude) : undefined,
        opencode: explicit ? Boolean(opts.opencode) : undefined,
      });

      for (const result of report.results) {
        console.log(`${result.action.padEnd(9)} ${relative(report.projectDir, result.path)}`);
      }

      const targetNames = [
        report.targets.claude ? "Claude Code" : null,
        report.targets.opencode ? "opencode" : null,
      ].filter(Boolean);

      console.log(`\nRenkei instalado para: ${targetNames.join(" + ")}`);
    } catch (err) {
      console.error((err as Error).message);
      process.exitCode = 1;
    }
  });

program.parse();
