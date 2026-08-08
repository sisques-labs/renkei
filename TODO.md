# TODO — Renkei

Huecos identificados tras la v1 (gate de revisión + checks deterministas +
guardrails + memoria/estado). No implementar sin discutir prioridad primero.

## Prioridad alta — higiene de ingeniería del propio Renkei

- [ ] Tests automatizados (vitest o `node:test`) para los generadores
      (`src/generators/*.ts`, `src/fsUtils.ts`) y los scripts standalone
      (`templates/*.mjs`: review-gate, approve, guardrails, precompact-reminder).
      Hoy todo se verifica a mano en carpetas scratch — una regresión en
      `fsUtils.ts` no la detectaría nada automáticamente.
- [ ] CI (GitHub Actions): build + tests en cada push/PR.

## Observabilidad y evals

- [ ] Registrar en algún log local las decisiones del gate: aprobaciones y
      rechazos de `renkei-reviewer`, cuándo salta el guardrail, resultado de
      los checks deterministas. Sin esto no hay forma de saber si el harness
      está funcionando de verdad.
- [ ] Mecanismo de evals para medir la calidad de las revisiones de
      `renkei-reviewer` a lo largo del tiempo (falsos positivos/negativos).

## El "ratchet" como mecanismo de primera clase

- [ ] Hoy añadir un patrón nuevo al deny-list de guardrails requiere editar
      el código fuente de Renkei y reinstalar. Diseñar algo tipo
      `renkei guardrail add "<patrón>"` para que un equipo, tras un
      incidente real, pueda extenderlo sin tocar Renkei.
- [ ] Explorar lo mismo para personalizar `checks.json` (comandos extra más
      allá de lint/test/build/typecheck).

## Sandbox real

- [ ] Los guardrails son un deny-list, no aislamiento real. Evaluar si
      merece la pena un sandbox de verdad (contenedor/VM) o si el
      deny-list pragmático es suficiente para el caso de uso.

## Distribución / DX

- [ ] Publicar en npm para poder usar `npx renkei init` sin clonar el repo.
- [ ] Permitir elegir qué features instalar (hoy es todo o nada).
- [ ] Revisar periódicamente si opencode añade un hook equivalente al
      `Stop` de Claude Code para poder hacer el gate igual de duro allí.
