#!/usr/bin/env node
// Renkei PreCompact hook for Claude Code: best-effort reminder to keep
// .renkei/state.json up to date before context gets compacted away.
//
// PreCompact *can* block compaction (exit code 2), but this hook deliberately
// never does: blocking an auto-compact that is recovering from an
// already-returned context-limit error makes that error surface and the
// current request fail (see the Claude Code hooks docs). On top of that,
// PreCompact's own non-blocking output (stdout/stderr on exit 0) is only
// written to the debug log, never shown to the model -- there is no
// documented channel where this hook's message reaches Claude directly.
// So this is purely a best-effort nudge (visible to a human via --debug, or
// to the user's terminal if compaction is later blocked for other reasons)
// and it always exits 0.
console.error(
  "Renkei: antes de compactar, si esta tarea es larga o multi-paso, asegúrate de que " +
    "`.renkei/state.json` refleja el estado actual (tarea, plan, progreso).",
);
process.exit(0);
