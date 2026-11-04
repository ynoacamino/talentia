# F0-gate.md — Informe de Gate de Fase 0 (Contrato y Trazabilidad)

> **Fase:** F0 — Contrato y trazabilidad (sin código producto)  
> **Fecha:** 2026-11-04  
> **Orquestador:** Antigravity  
> **Veredicto Final:** **GO** (2× PASS: Auditor-SOLID PASS, Auditor-QA PASS)

---

## 1. Veredicto del Gate: **GO**

Ambos auditores independientes han emitido veredictos aprobatorios (**PASS**) sin reservas tras una ronda inicial de observaciones y corrección inmediata por el Builder F0a.

- **Auditor-SOLID F0:** **PASS** (Informe archivado en transcripción; interfaces segregadas, tipado estricto con 0 `any` / 0 `unknown`, puertos desacoplados `ISessionRepository`, `IEventLogPort`, `IJudgeService`, inmutabilidad y funciones puras formalizadas).
- **Auditor-QA F0:** **PASS** (21/21 locked strings de `SPEC.md §19` verificados verbatim carácter por carácter, consistencia cruzada 100% entre contrato y matriz de trazabilidad, lista explícita OUT con justificación `SPEC-supersede`, `bun run check` y `bun test` en verde).

---

## 2. Entregables Verificados

| Entregable                   | Ruta                                                                                          | Estado       | Resumen                                                                                                                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrato Formal y Wireframes | [`docs/gates/F0-contrato.md`](file:///home/ynoacamino/dev/talentia/docs/gates/F0-contrato.md) | **APROBADO** | Alcance D1-D7, wireframes ASCII para `/play` y `/teacher`, contratos TS completos (`SessionConfig`, `SessionRecord`, `SessionSummary`, `JudgeScores`, `JudgeEvaluationContext`, `Comment`, 18 `EventType`), máquina de estados, reglas de `borrar sesión` (cascada física) e inmutabilidad add-only. |
| Matriz de Trazabilidad y OUT | [`docs/gates/F0-trace.md`](file:///home/ynoacamino/dev/talentia/docs/gates/F0-trace.md)       | **APROBADO** | Mapeo exhaustivo bullet a bullet de `docs/SPEC.md` (§2, §11, §12, §13, §17, §19) a superficies D1-D7, fases F0-F6 y tipos de prueba. Lista OUT formal de `project.md §5, §6` (sequía, sociograma, Validar/Corregir/Descartar, longitudinal, CNEB).                                                   |
| Reporte de Gate              | [`docs/gates/F0-gate.md`](file:///home/ynoacamino/dev/talentia/docs/gates/F0-gate.md)         | **EMITIDO**  | Autorización formal de paso de fase F0 → F1.                                                                                                                                                                                                                                                         |

---

## 3. Evidencia de Verificación Técnica

### 3.1 Comprobación de Biome y TypeScript (`bun run check`)

```bash
$ biome check --write && tsc -b
Checked 82 files in 34ms. No fixes applied.
```

- Código de salida: `0` (Limpio, 0 errores de formateo, 0 errores de tipado).

### 3.2 Comprobación de Pruebas Unitarias (`bun test`)

```bash
bun test v1.4.0 (34cbb9a40)

tests/board.test.ts:
✓ BoardGraph > avanza y cuenta vueltas en loop [0.16ms]
✓ BoardGraph > classic loop tiene 24 casillas y cierra [0.10ms]

tests/dialogue.test.ts:
✓ dialogue registry inyectable > registra y recupera scripts + audio stub [0.07ms]

tests/minigames.test.ts:
✓ minigame factory > define + registra minijuegos intercambiables [0.05ms]

tests/npcs.test.ts:
✓ npc factory > defineNpc aplica defaults y validateNpc detecta script faltante [0.08ms]
✓ npc factory > validateNpc pasa con diálogo y sprite registrados [0.03ms]
✓ npc system > follow se acerca al jugador y greet saluda con cooldown [3.22ms]

tests/tiles.test.ts:
✓ tile effects > star cobra 10 y da estrella; sin monedas solo avisa [0.72ms]
✓ tile effects > trap no deja monedas negativas [0.32ms]
✓ tile effects > playTurn mueve, cae en star (tile 6) y aplica efecto [0.51ms]

tests/items.test.ts:
✓ items > moneda-extra suma 5 [0.49ms]
✓ items > roba-monedas quita al más rico [0.50ms]
✓ items > teleport-star lleva a casilla star [0.35ms]

 13 pass
 0 fail
 28 expect() calls
Ran 13 tests across 6 files. [49.00ms]
```

- Código de salida: `0` (13/13 tests verdes).

---

## 4. Autorización y Siguiente Paso

Se autoriza formalmente la ejecución del protocolo de commit + push para el cierre de la Fase F0:

- Commit convencional: `feat(docs-ui-f0): trazabilidad contrato + gate GO`
- Push a rama remota y verificación con `git status -sb`.
- Apertura inmediata de la **Fase F1 (Diseño UI/UX + tokens Tailwind v4 + layouts + i18n)**.
