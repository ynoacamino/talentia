# PLAN.md — Gestión Documental UI (TALENTIA / SocraticGuild)

> Orquestación-driven + Modelo V. El orquestador **nunca codea**. Solo delega a subagentes, evalúa gates y autoriza avance de fase.

## 0. Decisión de contrato

**Fuente única de verdad para demo: `docs/SPEC.md` (FINAL, 2026-11-04).** No se creará ningún SPEC adicional de agente. Toda referencia anterior queda eliminada de este plan.

- Contrato: `docs/SPEC.md §2, §11-13, §17, §19` + `docs/ARCHITECTURE.md` (stack) + `project.md` solo como visión subordinada.
- **Conflicto resuelto:** `project.md §5` dice "Sequía de la chacra", `SPEC.md §1` bloquea "bridge only". **Manda SPEC.md.** Nada de chacra-sequía se construye.
- **Conflicto resuelto 2:** `project.md §6` pide sociograma, Validar/Corregir/Descartar, longitudinal, CNEB. SPEC demo solo permite comment add-only + `borrar sesión` + banner `señales preliminares, no notas`. **Manda SPEC.md.** Eso queda OUT.

---

## 1. Síntesis de fuentes

### 1.1 `project.md` (visión, no contrato demo)

- 3-6 niños, 1 dispositivo, mundo cooperativo, telemetría silenciosa, Human-in-the-Loop, sin rankings individuales, ES/EN/QUZ, Ley 29733.

### 1.2 `docs/SPEC.md` (contrato demo FINAL, manda)

- Slice: `chacra→taller→alcaldía→puente`, 5:00 default, 3-6 jugadores (pitch 3-4), finish requerido para estrellas.
- Rutas: `/play` (kids, cero teacher UI) + `/teacher` (operator: new session → code 4-char sin `0/O/1/I/L` → live → console → Docente → past). Misma sesión backend vía WebSocket. Proyección solo tab `/play`.
- Claim: N cards → avatar picker 8 fijos (`Zorro,Búho,Rana,Gato,Llama,Tucán,Ratón,Tortuga`, dupes ok) → 1× STT + freetype edit → `✓`. Auto-countdown 5s. Force-start ≥2. Min 2, solo prohibido. Dropout solo `retirar` en teacher.
- Docente inmutable: judge 5×0-2 grupo + 3×0-2 por alumno + quotes ES + stars `0-4=1★,5-7=2★,8-10=3★` + badges (max 3, prioridad `Paso a paso>Cumplieron su promesa>Un solo equipo>Se turnaron>Se organizaron`) + comments add-only + `borrar sesión` hard-delete.
- Equipo público: bridge art + stars + ≤3 badges + 1 línea conductual + `X/3` o `¡Puente listo!`. Cero nombres/números/rankings.
- Event log cerrado 17 tipos con `game_ts_ms+wall_ts_ms`. Sin audio crudo.
- Locked strings §19 obligatorios verbatim.

### 1.3 `docs/ARCHITECTURE.md` (stack vigente)

- `bun` only. `src/core` (koota world) + `src/game` headless testeable `bun test` + `src/render` R3F billboards + `src/ui` DOM + `src/app`. Biome+tsc en `bun run check`. Commits convencionales.

---

## 2. Alcance D1-D7 (solo superficie documental)

No se toca 3D gameplay, NPC brains, GM, STT/TTS/VLM salvo por contratos:

| ID  | Superficie                                                                                                                                                             | SPEC origen | Ruta       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| D1  | New session form (lang ES/EN/QUZ, players 3-6, duración 5-40 step 5) + code display + `?s=XXXX`                                                                        | §2          | `/teacher` |
| D2  | Past sessions list (code/fecha/lang/players/stars) + detail (Docente+transcript/draws)                                                                                 | §2          | `/teacher` |
| D3  | Equipo end screen (stars/badges/X/3 o `¡Puente listo!`+confetti)                                                                                                       | §11         | `/play`    |
| D4  | Docente view (5 criterios + per-student cards + banner + counts)                                                                                                       | §11         | `/teacher` |
| D5  | Comment thread add-only (text+ts, sin edit/delete) + `borrar sesión` con confirm                                                                                       | §2,§11      | `/teacher` |
| D6  | Live mirror read-only (misma 3D+checklist+captions, transcript last 20, event feed, timer+stall+wall debug, card status) + console silenciosa + `retirar`/`reintentar` | §13         | `/teacher` |
| D7  | Privacy boundary: `/play` cero teacher UI, proyección solo `/play`, mute BGM solo teacher                                                                              | §2,§4,§13   | ambas      |

Fuera de alcance: sociograma, Validar/Corregir/Descartar, CNEB, longitudinal, multi-device, offline.

---

## 3. Régimen de orquestación (obligatorio)

### 3.1 Rol Orquestador — lo que SÍ / NO hace

- **SÍ:** lee specs, redacta tareas atómicas, lanza `subagent`, define criterios de aceptación por fase, evalúa reportes de auditores, decide `GO / NO-GO`, archiva gates en `docs/gates/`.
- **NO:** `edit/write/shell` para implementar producto, ni `execute` con código de producto. Tampoco toma screenshots para implementar; solo exige las capturas del Auditor-QA como evidencia. Violación = abortar fase y re-lanzar builders. Excepción: `write` solo para `PLAN.md` y reportes de gate en `docs/gates/`.

### 3.2 Subagentes por fase (fijo, no negociable)

Por cada fase `Fn` el orquestador lanza **en este orden estricto**:

1. **Builder(s)** — `agent: general` (1-2 en paralelo, por superficie D). Único con permiso de escritura de código.
2. **Auditor-SOLID** — `agent: general`, solo lectura. Verifica §5.1. Veredicto `PASS/FAIL` con citas `path:line`.
3. **Auditor-QA** — `agent: general`, ejecuta `bun test`, `bun run check`, tests integración y E2E Playwright MCP + capturas + checks visuales §5.3. Veredicto `PASS/FAIL` con logs.

Regla de gate: **los 2 auditores deben dar PASS + commit pusheado (§4.1) para avanzar.** Si uno falla → builders corrigen en misma fase, re-auditoría completa de ambos. Prohibido "pasar con deuda a la siguiente fase". Prohibido avanzar sin `git push` verificado. Prohibido solapar `Fn+1` antes del `GO` de `Fn`.

### 3.3 Modelo V — mapeo izquierda↔derecha

```
V-IZQ (construcción)                    V-DER (verificación, mismo N)
F0 Requisitos/trazabilidad SPEC     <->  F0R Revisión de contrato + trazabilidad
F1 Diseño tokens/layouts/i18n       <->  F1R Snapshot + Playwright visual + a11y
F2 Contratos datos/eventos/stores   <->  F2R Unit (bun test) + contract tests
F3 D1+D2+D5 (sesiones/past/delete)  <->  F3R Integración API+WS + E2E teacher flow
F4 D3+D4 (Equipo+Docente)           <->  F4R E2E judge→UI + locked-strings test
F5 D6 (mirror+console+privacidad)   <->  F5R E2E aislamiento rutas + veto tests
F6 Hardening/fiabilidad             <->  F6R Chaos/retry/delete + pitch dry-run
```

---

## 4. Criterios globales de aceptación (Definition of Done por fase)

Cada fase requiere TODOS:

- [ ] Entregables listados en su sección existen y `bun run check` (biome+tsc) verde.
- [ ] Auditor-SOLID PASS (checklist §5.1, 0 violaciones `FAIL`).
- [ ] Auditor-QA PASS: unit ≥ umbral fase + integración + E2E Playwright PASS + screenshots adjuntas (§5.3) + checks visuales PASS.
- [ ] Trazabilidad SPEC §19: ningún locked string alterado (grep de auditor).
- [ ] Reporte de gate archivado en `docs/gates/Fn-gate.md` por el orquestador.
- [ ] **Commit + push por fase obligatorio (ver §4.1). Sin esto el gate es NO-GO aunque todo lo anterior pase.**

### 4.1 Protocolo commit + push por fase (obligatorio, no negociable)

Al cerrar cada fase `Fn` con veredicto `GO` (2× PASS), el orquestador ordena a **un solo builder** ejecutar la secuencia de cierre. Ninguna fase se considera terminada sin commit pusheado:

1. `bun run check` final verde + `bun test` verde (evidencia pegada en `docs/gates/Fn-gate.md`).
2. `git status --short` limpio salvo archivos intencionales de la fase + `docs/gates/Fn-*`.
3. `git add` solo del scope de la fase (prohibido `git add -A` indiscriminado si hay restos de otra fase).
4. Commit convencional obligatorio:
   - Formato: `feat(docs-ui-fn): <qué cierra> + gate GO`
   - Ejemplos: `feat(docs-ui-f0): trazabilidad contrato + gate GO`, `feat(docs-ui-f3): sesiones/past/delete + gate GO`.
   - Debe referenciar `docs/gates/Fn-gate.md` en el cuerpo.
5. `git push origin <rama>` inmediatamente después del commit. Verificar con `git status -sb` (sin `ahead`) y/o `git log origin/<rama>..HEAD` vacío.
6. Si el push falla (red, hook, commitlint): no se avanza a `Fn+1`. Se corrige en la misma fase y se repite auditoría mínima (QA smoke + visual si hubo cambios UI).
7. Prohibido acumular 2 fases en 1 commit. Prohibido pushear con gate `NO-GO` o con algún auditor en `FAIL`.

El prompt de cierre que el orquestador envía al builder es:

> "Cierre Fn: ejecuta `bun run check` + `bun test`, adjunta evidencia en `docs/gates/Fn-gate.md`, haz `git add` del scope Fn, commit `feat(docs-ui-fn): ... + gate GO` y `git push`. Reporta SHA + `git status -sb`. Sin push verificado no hay GO."

---

## 5. Checklists de auditoría (copiar en cada prompt de auditor)

### 5.1 Auditor-SOLID (cita `path:line` por hallazgo)

- **S:** cada componente/store una sola razón de cambio (UI ≠ fetch ≠ judge-mapping). `DocenteView` no calcula stars.
- **O:** extensible sin modificar (nuevo badge/criterio = data, no `if` en vista).
- **L:** vistas intercambiables por contrato (mock store pasa mismos props).
- **I:** props mínimas, sin `any`/`unknown` filtrado, sin pasar session entera si solo necesita `code`.
- **D:** depende de abstracciones (`SessionRepo`, `EventLogPort`), no de `fetch`/SQLite directo en `.tsx`.
- Extra: sin lógica de GM/judge en UI; stars/badges son función pura testeada; sin teacher-edit de scores (inmutabilidad §11).

### 5.2 Auditor-QA — pirámide obligatoria

- **Unit (`bun test`):** stores puros, `starsFor(sum)`, `badgePriority()`, `codeGen` (sin confusables), `addComment` (append-only), `hardDelete` cascade, parsers de eventos.
- **Integración:** WS session join `?s=XXXX`, lock de config post-start, force-start ≥2, `retirar` gris + `retirado mm:ss`, timer pausa en TTS/draw.
- **E2E Playwright MCP:** flujos §5.3. Reintentos 3× visibles (`reintentando…` + `reintentar`), nunca degradado silencioso.
- **Visual/estilo (dentro de QA):** cutouts Paper-Mario (kids borde color + name tag 10-char, NPCs borde blanco), layout SPEC §12/§13 (3D ~70%, rail derecha con anillos, checklist + log/plano/sello, timer top-left, minimapa ~100px, captions 2 líneas 6s), cero counters visibles blocked/overlap, Equipo sin nombres/números, i18n 1:1 + Docente siempre ES, todo touch+click, `mute` solo teacher.
- Umbrales: F2 ≥80% líneas en `src/game/stores|src/shared` tocado; F3-F6 E2E 100% PASS en Chrome/Edge 10" 5-touch emulado.

### 5.3 Playwright MCP + screenshots (por fase, el orquestador las exige al QA)

Comandos MCP a usar por Auditor-QA: `browser_navigate`, `browser_snapshot`/`screenshot`, `browser_click/type/press_key`, `browser_handle_dialog` (para `borrar sesión`), `browser_resize` (1280×800 + 1920×1080 proyector).
Capturas mínimas por fase (guardar en `docs/gates/Fn-*.png`):

- F1: `/teacher` new-session, `/play` claim cards, tokens light.
- F3: past-list con 3 sesiones, past-detail con transcript+thumb, diálogo `borrar sesión`, comment añadido.
- F4: Equipo `¡Puente listo!` 3★ + Equipo `Misión en curso 2/3`, Docente full (5 criterios + 2 alumnos + banner).
- F5: live mirror lado a lado `/play` vs `/teacher` (probar que console no aparece en `/play`), timer rojo <60s.
- F6: estado `reintentando…`, post-`reintentar`, sesión borrada (lista sin código).

---

## 6. Fases detalladas (prompts listos para `subagent`)

### FASE 0 — Contrato y trazabilidad (sin código producto)

**Objetivo:** fijar contrato directo desde `docs/SPEC.md` + matriz de trazabilidad. No se genera ningún SPEC intermedio.
**Builders (2 en paralelo):**

- `B0a Contrato`: prompt → "Lee `docs/SPEC.md` §2,11-13,17,19 + `project.md` §6,8 + `docs/ARCHITECTURE.md`. Produce `docs/gates/F0-contrato.md` con: alcance D1-D7, wireframes ASCII por ruta, contratos TS (`SessionConfig, SessionRecord, JudgeScores, Comment`), máquina de estados sesión, reglas `borrar sesión`, thread add-only, tabla locked-strings verbatim. No toques `src/`."
- `B0b Trazabilidad`: prompt → "Produce `docs/gates/F0-trace.md`: cada bullet SPEC §2,11,13,17,19 → D-id → fase Fn → tipo test. Marca `project.md §6 sociograma/Validar` como OUT con justificación SPEC-supersede."
  **Aceptación F0 (GO solo si):** contrato sin contradecir SPEC.md, locked strings idénticos (diff), OUT list explícita, 2 auditores PASS.
  **QA F0:** `grep` locked strings, revisión cruzada B0a↔B0b. Sin Playwright aún.
  **Gate output:** `docs/gates/F0-contrato.md` + `docs/gates/F0-trace.md` + `docs/gates/F0-gate.md`.

### FASE 1 — Diseño UI/UX + tokens (sin lógica)

**Objetivo:** layouts clicables + tokens + i18n 1:1.
**Builders:**

- `B1a Design-tokens+layout`: Tailwind v4 tokens (color borde kid/NPC, anillos estado, tipografía captions, badges/estrellas), layouts `/play` (3D placeholder + rail + checklist + minimapa + captions) y `/teacher` (form + code + past-list + live skeleton + Docente skeleton) con datos mock. Respeta ARCHITECTURE `src/ui` fuera de Canvas.
- `B1b i18n`: diccionarios ES/EN/QUZ 1:1 para D1-D7 + Docente-fijo-ES + locked strings como constantes no traducibles.
  **Aceptación:** navegación `/play`↔`/teacher` sin backend, strings §19 pixel-verbatim, responsive 10" y 1080p, a11y foco/contraste.
  **QA:** Playwright snapshot 6 vistas + screenshots F1 + a11y scan. Unit: `starsFor`, `badgePriority` como puras (adelanto F2 permitido).

### FASE 2 — Contratos datos/eventos/stores

**Objetivo:** tipos + stores + repo que el resto consumirá. Último momento barato para cambiar API.
**Builders:**

- `B2a Contracts`: `src/shared/documents.ts` (`SessionConfig{lang,expected,durationMin}`, `SessionRecord{config,transcripts,drawings+thumbs,visionReads,events,scores,comments}`, `Comment{text,wall_ts}`, 17 `EventType`), `SessionRepo` port (`list/get/create/comment/delete`), `EventLog` append-only con dual-ts.
- `B2b Stores`: zustand mirrors (`useSessionList, useSessionDetail, useDocente`) solo espejos, verdad en repo; `addComment` append-only (sin update/delete), `hardDelete` cascada, `codeGen` 4-char sin confusables.
  **Aceptación:** `bun test` ≥80% en tocado, 0 `any`, 0 fetch directo en stores, codeGen 1000 muestras sin `0/O/1/I/L`, delete borra draws+thumbs+vision+events+scores+comments (test con fixture).
  **QA:** unit + contract tests + `bun run check`. Sin E2E aún salvo smoke.

### FASE 3 — D1+D2+D5 (sesiones, past, comments, delete)

**Objetivo:** flujo teacher completo sin judge real (mocks).
**Builders:**

- `B3a New+join`: form validado (3-6, 5-40 step5, ES/EN/QUZ), lock post-start, code display + `?s=XXXX`, WS join misma session, claim N cards mock, force-start ≥2 + countdown 3s/5s, `retirar` con confirm.
- `B3b Past+comments+delete`: lista (code/fecha/lang/players/stars), detail (Docente mock + transcript/draws thumbs), comment box add-only, `borrar sesión` confirm + `browser_handle_dialog` + parent-request = delete.
  **Aceptación (Given/When/Then):** teacher crea ES/4/5:00 → code válido → `/play?s=CODE` une; force-start con 2/4 confirmados reescribe N=2; comment aparece con ts y no es editable (botón edit ausente en DOM); delete elimina y lista refresca; config bloqueada mid-run (intento = shake, test).
  **QA:** integración WS + E2E teacher flow + screenshots F3.

### FASE 4 — D3+D4 (Equipo + Docente, corazón pedagógico)

**Objetivo:** render fiel del judge (mock → luego real).
**Builders:**

- `B4a Equipo`: `¡Puente listo!`+confetti+stars pop+≤3 badges+quote conductual idioma run+X/3 vs `Misión en curso X/3` badges-only sin stars; cero nombres/números; `con apoyo docente` solo si forced (test).
- `B4b Docente`: stars + 5 criterios 0-2 con quote + cards alumno (avatar+nombre+3×0-2+anécdota+counts) + banner + thread; scores inmutables (intento edit = ausente en DOM).
  **Aceptación:** fixture judge `sum=9→3★`, `>3 badges→top3 por prioridad`, quotes ES aunque run EN/QUZ (paráfrasis, nunca verbatim no-ES), estructurada capada a 1 si forced.
  **QA:** E2E `judge_scores` fixture→UI + locked-strings grep + screenshots F4. Unit `starsFor/badgePriority/cap`.

### FASE 5 — D6 (mirror, console, privacidad)

**Objetivo:** operador puede rescatar sin filtrar a proyección.
**Builders:**

- `B5a Mirror`: 3D view-only + checklist+inventario + captions + transcript last20 + event feed + timer/stall/wall debug + card status. Sin input en mirror.
- `B5b Console`: skip-to-station×4 (fade, `time_skip`, grants nothing), force-grant next-only, replay, end-run-now, skip-intro, `retirar`, `reintentar`. Todo logueado. Test de aislamiento: selectores console ausentes en `/play`.
  **Aceptación:** skip no otorga grants; force-grant fuera de orden rechazado con missing exacto; replay no crea turno; walk `llegando a X…`; proyección tab `/play` nunca muestra `/teacher`.
  **QA:** E2E aislamiento + veto + screenshots F5 lado a lado.

### FASE 6 — Hardening + pitch dry-run

**Objetivo:** demo que no se cae el día 5.
**Builders:**

- `B6a Reliability`: 3× retry backoff STT/LLM/TTS/VLM/judge con `reintentando…`/`reintentar`, bloqueo visible si agota, serial queue GM, dual-ts everywhere.
- `B6b Pitch-pack`: run-of-show 6-min (§18 SPEC), checklist proyector/mic/Chrome, deck clips ES/EN/QUZ fuera de app, `docs/gates/pitch-checklist.md`.
  **Aceptación:** kill de 1 intento STT → auto-retry y continúa; kill total → `reintentar` docente reanuda sin scores degradados; delete→lista limpia; dry-run 5:00 cruza ~3-4 en mock.
  **QA:** chaos tests + E2E completo + screenshots F6 + validación visual confetti/win sin romper privacidad.

---

## 7. Plantillas de prompts de orquestación (usar verbatim)

**Builder:**

> "Eres builder Fn. Lee `docs/SPEC.md` §[..] + `docs/ARCHITECTURE.md` (+ `project.md` solo como visión, no como contrato). Implementa SOLO [D..] en [paths]. Stack bun+React+zustand+Tailwind, headless en `src/game`, vista en `src/ui`. No toques [OUT]. Entrega archivos + `bun run check` verde. Criterios: [pegar aceptación Fn]."

**Auditor-SOLID:**

> "Eres auditor SOLID Fn. Solo lectura. Verifica checklist §5.1 sobre diff Fn. Por cada violación cita `path:line` + principio + fix sugerido. Veredicto PASS/FAIL. Sin escribir código."

**Auditor-QA (unit + integración + e2e + visual):**

> "Eres auditor QA Fn. Ejecuta `bun test`, `bun run check`, integración y E2E Playwright MCP (§5.3) + capturas §5.3 en `docs/gates/` + checks visuales §5.2. Verifica locked strings verbatim. Veredicto PASS/FAIL con logs. Si FAIL, lista casos mínimos de repro."

---

## 8. Trazabilidad mínima (ampliar en F0)

| SPEC                       | D     | Fase  | Test               |
| -------------------------- | ----- | ----- | ------------------ |
| §2 code/config/lock        | D1    | F3    | E2E join+lock      |
| §2 past/detail/delete      | D2,D5 | F3    | E2E delete+comment |
| §11 Equipo/stars/badges    | D3    | F4    | E2E fixture+shots  |
| §11 Docente/immutable      | D4,D5 | F4    | DOM-edit-ausente   |
| §13 mirror/console/retirar | D6    | F5    | aislamiento        |
| §17 17 eventos dual-ts     | D1-D6 | F2,F6 | contract           |
| §19 locked strings         | todas | todas | grep               |

---

## 9. Riesgos + mitigación

- QUZ TTS/STT frágil → clips pre-grabados al final del pitch (SPEC §14), nunca en ruta crítica.
- Un dispositivo + proyector → share-tab `/play` ensayado F5/F6; `/teacher` jamás en espejo.
- Orquestador que codea → gate inválido; todo avance requiere 2 PASS archivados + push verificado.
- `project.md` vs SPEC → manda SPEC; cualquier pedido de sociograma/CNEB se rechaza como OUT en F0.

---

## 10. Orden de ejecución para el orquestador (ahora)

1. Lanzar B0a+B0b en paralelo (`subagent general`).
2. Lanzar Auditor-SOLID + Auditor-QA sobre F0.
3. Publicar `docs/gates/F0-gate.md` con GO/NO-GO.
4. Con GO → commit + push `feat(docs-ui-f0): ... + gate GO` (§4.1), verificar `git status -sb` sin `ahead`.
5. Solo con push verificado → F1…F6 secuenciales, nunca solapadas, cada una con Builder→2 auditorías→gate→commit+push.
6. Cierre: `docs/gates/FINAL.md` + screenshots pitch + commit+push final + `FINAL for demo` tag.
