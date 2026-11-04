# F1-gate.md — Informe de Gate de Fase 1 (Diseño UI/UX + Tokens + Layouts + i18n)

> **Fase:** F1 — Diseño tokens, layouts clicables, i18n 1:1 y funciones de dominio  
> **Fecha:** 2026-11-04  
> **Orquestador:** Antigravity  
> **Veredicto Final:** **GO** (2× PASS: Auditor-SOLID PASS, Auditor-QA PASS)

---

## 1. Veredicto del Gate: **GO**

Ambos auditores independientes han emitido veredictos aprobatorios (**PASS**) definitivos:

- **Auditor-SOLID F1:** **PASS** (7/7 observaciones subsanadas: lógica de scoring delegada a `starsFor` y `badgePriority`, unificación de `codeGen`, rúbricas tipadas vía `tDocente`, soporte dinámico de 8 avatares y estaciones en `LiveMirror`, contrato de insignia `cumplieron_su_promesa`, desacoplamiento mediante contratos de props opcionales y eliminación total de botones de debug/operador en `/play`).
- **Auditor-QA F1:** **PASS** (86/86 pruebas unitarias e integración en verde, `bun run check` limpio en 124 archivos, 21/21 locked strings verificados verbatim carácter por carácter, 5 capturas Playwright generadas en `docs/gates/F1-*.png`, 0 fugas de UI docente en `/play` y responsive verificado en 1280×800 y 1920×1080).

---

## 2. Entregables Verificados de Fase F1

| Entregable                   | Rutas / Componentes                                                                                                                                                                                                         | Estado       | Resumen                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens de Diseño Tailwind v4 | `src/ui/tokens/` (`colors.ts`, `avatars.ts`, `badges.ts`, `strings.ts`), `src/index.css`                                                                                                                                    | **APROBADO** | Paleta Paper-Mario de 8 avatares infantiles + borde blanco para NPCs, anillos de estado de tarjeta (`idle`, `recording`, `locked`, `speaking`, `drawing`, `npc_lock`, `walk`), 5 colores de dibujo, animación de confeti y pop de estrellas.                                                                                                                                                                                      |
| Router de Cliente            | `src/ui/router/index.tsx`, `src/app/App.tsx`, `src/ui/screens/WelcomeScreen.tsx`                                                                                                                                            | **APROBADO** | Ruteo cliente SPA para `/play` y `/teacher`, bienvenida en `/`, soporte para parámetro `?s=XXXX`.                                                                                                                                                                                                                                                                                                                                 |
| Layouts `/play`              | `src/ui/play/` (`JoinScreen.tsx`, `ClaimCardsScreen.tsx`, `ActivePlayView.tsx`, `RightRail.tsx`, `Minimap.tsx`, `ChecklistBar.tsx`, `DrawingOverlay.tsx`, `ZoomMapOverlay.tsx`, `SubtitlesView.tsx`, `EquipoEndScreen.tsx`) | **APROBADO** | Claim de tarjetas con 8 avatares y countdown 5s; vista activa con diorama ~70%, riel derecho táctil, minimapa circular ~100px, checklist de 3 pasos e inventario madera/plano/sello, pizarra de dibujo con plantilla y auto-envío 30s, zoom mapa con veto 5s y votación 20s, pantalla final de victoria (`¡Puente listo!`, 3★, ≤3 badges con cita, 3/3) y fin parcial (`Misión en curso X/3`). Cero nombres o notas individuales. |
| Layouts `/teacher`           | `src/ui/teacher/` (`TeacherLayout.tsx`, `NewSessionForm.tsx`, `LiveMirror.tsx`, `OperatorConsole.tsx`, `DocenteView.tsx`, `CommentThread.tsx`, `PastSessionsList.tsx`)                                                      | **APROBADO** | Formulario con código seguro sin confusables; espejo en vivo de solo lectura; consola silenciosa con saltos, concesión forzada, replay PNJ, retirar alumno; DocenteView con banner `señales preliminares, no notas`, 5 criterios y tarjetas Paper-Mario; hilo de comentarios add-only; lista histórica con confirmación de borrado en cascada y control de silencio de BGM exclusivo.                                             |
| Internacionalización 1:1     | `src/shared/i18n/` (`lockedStrings.ts`, `types.ts`, `t.ts`, `dictionaries/es.ts`, `en.ts`, `quz.ts`)                                                                                                                        | **APROBADO** | Diccionarios 1:1 en Español, Inglés y Quechua Sureño. DocenteView fijado permanentemente en Español. 21 locked strings inmutables.                                                                                                                                                                                                                                                                                                |
| Funciones Puras de Dominio   | `src/shared/scoring.ts`, `src/shared/codeGen.ts`                                                                                                                                                                            | **APROBADO** | `calculateStars` / `starsFor` (0-4=1★, 5-7=2★, 8-10=3★, null si no finalizado); `filterAndPrioritizeBadges` / `badgePriority` (máx 3, orden de desempate); `codeGen` (4 caracteres alfanuméricos sin `0, O, 1, I, L`).                                                                                                                                                                                                            |
| Capturas de Evidencia QA     | `docs/gates/F1-*.png`                                                                                                                                                                                                       | **APROBADO** | `F1-teacher-new-session.png`, `F1-play-claim-cards.png`, `F1-play-active.png`, `F1-teacher-docente.png`, `F1-play-equipo-end.png`.                                                                                                                                                                                                                                                                                                |

---

## 3. Evidencia Técnica

### 3.1 Comprobación de Biome y TypeScript (`bun run check`)

```bash
$ biome check --write && tsc -b
Checked 124 files in 72ms. No fixes applied.
```

- Código de salida: `0` (124 archivos limpios, 0 errores, 0 warnings).

### 3.2 Comprobación de Pruebas Unitarias e Integración (`bun test`)

```bash
bun test v1.4.0 (34cbb9a40)

tests/board.test.ts: 2 pass
tests/dialogue.test.ts: 1 pass
tests/minigames.test.ts: 1 pass
tests/npcs.test.ts: 3 pass
tests/tiles.test.ts: 3 pass
tests/items.test.ts: 3 pass
tests/scoring.test.ts: 13 pass
tests/codeGen.test.ts: 5 pass
tests/i18n.test.ts: 32 pass
tests/f1a_tokens_layouts.test.ts: 23 pass

 86 pass
 0 fail
 11,769 expect() calls
Ran 86 tests across 10 files. [115.00ms]
```

- Código de salida: `0` (86/86 tests aprobados).

---

## 4. Autorización y Cierre de Fase F1

Se autoriza formalmente la ejecución del protocolo de commit + push para el cierre de la Fase F1:

- Commit convencional: `feat(docs-ui-f1): diseno tokens layouts e i18n + gate GO`
- Push a rama remota y verificación con `git status -sb`.
- Apertura de la **Fase F2 (Contratos datos/eventos/stores)**.
