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
- **Checks deterministas (`.renkei/checks.json`)** — antes de invocar al
  revisor LLM (que cuesta tokens y no es determinista), Renkei detecta si el
  `package.json` del proyecto destino tiene scripts `lint`, `test`, `build`
  o `typecheck` y los guarda como comandos a correr primero. En Claude Code,
  el hook `Stop` los ejecuta antes de mirar siquiera `.renkei/review.json`:
  si alguno falla, bloquea el turno de inmediato con la salida del comando,
  sin gastar una ronda de revisión. En opencode esto también se genera (por
  si se quiere invocar manualmente o desde una convención en `AGENTS.md`),
  pero no hay un hook que lo fuerce.
- **Guardrails ("sandbox-lite")** — una lista de patrones de comandos Bash
  claramente destructivos (`rm -rf /`, force-push a `main`/`master`,
  `curl | sh`, `mkfs`, `dd` a un device, fork bombs, `chmod -R 777 /`,
  `sudo rm -rf`, etc.).
  - En **Claude Code** es un hook `PreToolUse` real
    (`.claude/hooks/renkei-guardrails.mjs`, filtrado a la tool `Bash`) que
    bloquea (`exit 2`) la llamada si el comando matchea el deny-list.
  - En **opencode** se traduce a patrones en el `permission.bash` de nivel
    superior de `opencode.json`.
  - **Importante**: esto no es un sandbox ni una barrera de seguridad real.
    Es un matching pragmático por substring/regex sobre un puñado de
    patrones conocidos, pensado para frenar accidentes, no para contener a
    un atacante. Se puede evitar trivialmente y no reemplaza la prudencia
    del propio agente ni del desarrollador.
- **`.renkei/memory.md`** — memoria persistente del proyecto: un archivo
  markdown de bajo nivel tecnológico (sin base de datos ni índice de
  búsqueda) pensado para que tanto Claude Code como opencode lo lean y
  editen con sus herramientas normales de archivo. Se crea una vez con unas
  secciones de partida (decisiones de arquitectura, convenciones, errores
  conocidos) y `renkei init` nunca vuelve a tocarlo — es el propio agente
  quien va añadiendo entradas con el tiempo. Se commitea junto al resto del
  proyecto.
- **`.renkei/state.json`** — externalización del estado de la tarea en
  curso (`currentTask`, `plan`, `progress`, `updatedAt`), para que un
  agente pueda retomar un trabajo largo o multi-paso tras un reseteo o
  compactación de contexto, o desde una sesión nueva, sin tener que
  re-derivar todo desde cero. Igual que `memory.md`, se crea una sola vez
  con contenido por defecto y `renkei init` no lo vuelve a sobrescribir; es
  estado efímero de trabajo, así que se ignora en git.
  - Claude Code además recibe un hook `PreCompact`
    (`.claude/hooks/renkei-precompact-reminder.mjs`) que, antes de que el
    contexto se compacte, imprime un recordatorio para mantener
    `state.json` al día. Es puramente informativo: nunca bloquea la
    compactación (ver "Limitaciones conocidas").

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
- Que `.renkei/state.json` se mantenga al día es una convención que debe
  seguir el propio agente, no algo que Renkei pueda forzar. El hook
  `PreCompact` de Claude Code solo imprime un recordatorio antes de
  compactar; según la documentación de hooks, `PreCompact` sí puede
  bloquear la compactación (`exit 2`), pero bloquear una compactación
  automática que está recuperándose de un error de límite de contexto ya
  devuelto por la API hace que ese error se propague y la petición falle,
  y aunque bloqueara sin ese riesgo, el mensaje solo se le muestra al
  usuario, no llega al modelo. Por eso el hook nunca bloquea (siempre
  `exit 0`) y es puramente informativo.
