# Renkei (連携)

Del japonés *renkei*: coordinación, colaboración e interconexión entre partes.

Renkei es un **agent harness**: no reemplaza a Claude Code ni a opencode, les
instala convenciones y un gate de revisión compartidos, escribiendo la
configuración en los sitios donde cada uno la lee. Ambos agentes ganan la
misma disciplina sin que tengas que orquestarlos desde fuera.

## Qué instala `renkei init`

- **`AGENTS.md`** — instrucciones compartidas (estándar leído nativamente por
  ambas herramientas) que explican la regla de revisión.
- **Subagente `renkei-reviewer`** — un revisor independiente que inspecciona
  el diff actual y debe aprobarlo antes de dar una tarea por terminada.
  - Claude Code: `.claude/agents/renkei-reviewer.md`
  - opencode: `.opencode/prompt/renkei-reviewer.md` + entrada en `opencode.json`
- **Gate de revisión**:
  - En **Claude Code** es un hook `Stop` real
    (`.claude/hooks/renkei-review-gate.mjs`) que bloquea (`exit 2`) que el
    agente termine su turno si hay cambios sin revisar o sin aprobar.
  - En **opencode** es una convención (vía `AGENTS.md`): opencode no expone
    todavía un hook equivalente para bloquear el fin de una tarea, así que
    el cumplimiento depende de que el agente primario siga la instrucción.
- **`.renkei/scripts/approve.mjs`** — script que usa `renkei-reviewer` para
  registrar su veredicto (`approve`/`reject`) en `.renkei/review.json`,
  ligado a una huella del diff actual (`git diff HEAD` + `git status
  --porcelain`) para que una aprobación no sirva si el código vuelve a
  cambiar.

## Uso

```bash
node dist/cli.js init                # autodetecta .claude/ y/o opencode.json
node dist/cli.js init --claude        # fuerza solo Claude Code
node dist/cli.js init --opencode      # fuerza solo opencode
node dist/cli.js init --cwd otra/ruta # instala en otro proyecto
```

Si no se detecta ninguno de los dos y no se fuerza nada, instala para ambos
por defecto.

El comando es idempotente: puedes correrlo tantas veces como quieras, solo
reescribe lo que cambió.

## Desarrollo

```bash
npm install
npm run build   # compila src/ -> dist/
```

## Limitaciones conocidas (v1)

- El gate solo se enforce de forma dura en Claude Code. En opencode es una
  convención documentada en `AGENTS.md`, no una barrera técnica.
- La huella del diff se basa en `git diff HEAD` + `git status --porcelain`;
  un archivo nuevo sin trackear que cambie de contenido sin cambiar su
  estado en `git status` (caso raro) no invalidaría una aprobación previa.
- Requiere que el proyecto sea un repositorio git; si no lo es, el gate de
  Claude Code no bloquea nada (no hay nada que pueda inspeccionar).
