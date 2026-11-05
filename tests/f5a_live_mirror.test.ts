/**
 * TALENTIA / SocraticGuild — Integration & Unit Tests for F5a
 * Superficie D6 (Espejo en Vivo / LiveMirror) y Privacidad D7 (Aislamiento Estricto de Rutas).
 * Conforme a SPEC §2, §4, §10, §12, §13, §17 + docs/gates/F0-contrato.md y docs/gates/F0-trace.md.
 *
 * Verificaciones obligatorias:
 * 1. Renderizado del espejo en /teacher ([TEACH-02] / LiveMirror.tsx):
 *    - Réplica 3D view-only idéntica a /play (sin controles ni inputs en el diorama).
 *    - Checklist sincronizado (3 pasos: chacra, taller, alcaldía) + inventario compartido (madera, plano, sello).
 *    - Captions inferiores activos (2 líneas, punto de color niños / blanco NPC, 6s expiración).
 *    - Debug de temporizadores:
 *      - Reloj de juego mm:ss con flash de pausa y alerta roja visual cuando quedan < 60 segundos.
 *      - Cuenta regresiva de atasco/stall (L1 45s, L2 90s, L3 150s).
 *      - Reloj de pared (wall_ts_ms).
 * 2. Feeds de telemetría:
 *    - Feed diarizado de los últimos 20 turnos de transcripción (last20) en orden cronológico con timestamps duales.
 *    - Feed en vivo de eventos de telemetría (18 closed log types) con timestamps duales.
 * 3. Estado de participantes interactivo:
 *    - claimed, confirmed, speaking, drawing, retired (con badge 'retirado mm:ss').
 *    - Flujo inline de confirmación y ejecución de retiro.
 * 4. Control de Mute BGM exclusivo en el header docente:
 *    - Botón presente en /teacher y alternancia de estado.
 *    - Ausente en /play.
 * 5. Aislamiento absoluto de rutas (D7):
 *    - CERO selectores, términos o componentes de LiveMirror o consola docente en el DOM de /play.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import { setDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import { ActivePlayView } from "@/ui/play/ActivePlayView.tsx";
import { PlayLayout, type PlayLayoutProps } from "@/ui/play/PlayLayout.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { LiveMirror, type LiveMirrorProps } from "@/ui/teacher/LiveMirror.tsx";
import {
	TeacherLayout,
	type TeacherLayoutProps,
} from "@/ui/teacher/TeacherLayout.tsx";
import {
	type MirrorEvent,
	type MirrorTranscript,
	type StudentEvaluation,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";

describe("F5a: Live Mirror y Aislamiento Estricto de Rutas (Superficie D6 & D7)", () => {
	let repo: InMemorySessionRepository;

	beforeEach(() => {
		repo = new InMemorySessionRepository();
		setDefaultSessionRepository(repo);

		// Reset Teacher Store a valores canónicos
		useTeacherStore.setState({
			activeSessionCode: "F5AA",
			activeTab: "live",
			formDurationMinutes: 5,
			liveTimerSeconds: 215, // 03:35
			isTimerPaused: false,
			pauseReason: null,
			stallCountdownSeconds: 45,
			stallTier: "L1",
			wallClockMs: 1730715345000,
			liveStep: 2,
			liveStation: "taller",
			inventory: {
				madera: true,
				plano: true,
				sello: false,
			},
			isBgmMuted: false,
			teacherAssisted: false,
			isCountingDown: false,
			countdownSeconds: 0,
			activeSubtitles: [
				{
					id: "sub-npc",
					speakerName: "Alcalde Soto",
					speakerColor: "#ffffff",
					speakerType: "npc",
					text: "¡El río nos partió el puente! Debemos unirnos para cruzarlo.",
					expiresAt: Date.now() + 6000,
				},
				{
					id: "sub-kid",
					speakerName: "Mateo",
					speakerColor: "#38bdf8",
					speakerType: "kid",
					text: "Yo ayudo a cargar los tablones de madera con Paco.",
					expiresAt: Date.now() + 6000,
				},
			],
			studentEvals: [
				{
					studentId: "c1",
					studentName: "Mateo",
					avatarId: "zorro",
					confirmed: true,
					status: "confirmed",
					participacion: 2,
					propuesta: 2,
					organizacion: 1,
					anecdote: "Propuso usar los troncos caídos.",
					voiceTurns: 6,
					drawsCount: 2,
					retired: false,
				},
				{
					studentId: "c2",
					studentName: "Valentina",
					avatarId: "buho",
					confirmed: true,
					status: "speaking",
					participacion: 2,
					propuesta: 1,
					organizacion: 2,
					anecdote: "Coordinó la votación hacia el taller.",
					voiceTurns: 5,
					drawsCount: 1,
					retired: false,
				},
				{
					studentId: "c3",
					studentName: "Leo",
					avatarId: "rana",
					confirmed: true,
					status: "drawing",
					participacion: 1,
					propuesta: 2,
					organizacion: 1,
					anecdote: "Dibujó el plano de vigas transversales.",
					voiceTurns: 4,
					drawsCount: 2,
					retired: false,
				},
				{
					studentId: "c4",
					studentName: "Sofía",
					avatarId: "gato",
					confirmed: false,
					status: "claimed",
					participacion: 0,
					propuesta: 0,
					organizacion: 0,
					anecdote: "",
					voiceTurns: 1,
					drawsCount: 0,
					retired: false,
				},
			],
			recentTranscripts: [
				{
					id: "t1",
					holder: "Mateo (Zorro)",
					text: "Paco, necesitamos madera para reparar el puente roto.",
					time: "00:45",
					avatarId: "zorro",
					game_ts_ms: 45000,
					wall_ts_ms: 1730715345000,
				},
				{
					id: "t2",
					holder: "Paco (PNJ)",
					text: "Claro, pero ¿quién ayuda y en qué en mis surcos?",
					time: "00:52",
					avatarId: "paco",
					game_ts_ms: 52000,
					wall_ts_ms: 1730715352000,
				},
				{
					id: "t3",
					holder: "Valentina (Búho)",
					text: "¡Trato hecho! Ahora vamos al taller de la Ingeniera Luz.",
					time: "01:25",
					avatarId: "buho",
					game_ts_ms: 85000,
					wall_ts_ms: 1730715385000,
				},
			],
			recentEvents: [
				{
					id: "e1",
					type: "press",
					actor: "Mateo",
					details: "Hold talk button (2.8s)",
					time: "00:43",
					game_ts_ms: 43000,
					wall_ts_ms: 1730715343000,
				},
				{
					id: "e2",
					type: "grant_step",
					actor: "Agricultor Paco",
					details: "Item madera concedido (F2)",
					time: "01:15",
					game_ts_ms: 75000,
					wall_ts_ms: 1730715375000,
				},
				{
					id: "e3",
					type: "move_execute",
					actor: "Equipo",
					details: "Marcha hacia Taller completada",
					time: "01:36",
					game_ts_ms: 96000,
					wall_ts_ms: 1730715396000,
				},
			],
		});

		// Reset Play Store
		usePlayStore.setState({
			phase: "active",
			sessionCode: "F5AA",
			sessionStatus: "playing",
			language: "ES",
			currentStation: "taller",
			gameTimeSeconds: 215,
			isTimerPaused: false,
			checklistStep: 2,
			inventory: {
				madera: true,
				plano: true,
				sello: false,
			},
			cards: [
				{
					cardId: "c1",
					playerIndex: 0,
					avatarId: "zorro",
					studentName: "Mateo",
					isConfirmed: true,
					status: "idle",
					isRetired: false,
					turnsCount: 6,
					drawsCount: 2,
				},
				{
					cardId: "c2",
					playerIndex: 1,
					avatarId: "buho",
					studentName: "Valentina",
					isConfirmed: true,
					status: "speaking",
					isRetired: false,
					turnsCount: 5,
					drawsCount: 1,
				},
			],
		});
	});

	// =========================================================================
	// 1. RÉPLICA 3D VIEW-ONLY, CHECKLIST E INVENTARIO COMPARTIDO
	// =========================================================================
	describe("1. Réplica 3D View-Only, Checklist e Inventario Compartido (D6, SPEC §10, §12, §13)", () => {
		it("renderiza el diorama como réplica 3D estricta en modo de solo lectura (sin controles ni inputs)", () => {
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					activeSessionCode: "F5AA",
				}),
			);

			// Contenedor principal del diorama
			expect(html).toContain('data-testid="live-mirror-diorama"');

			// Clase view-only obligatoria que desactiva interacción
			expect(html).toContain("pointer-events-none");
			expect(html).toContain("select-none");

			// Elementos del diorama idénticos a /play
			expect(html).toContain("~~ Río Caudaloso ~~");
			expect(html).toContain("Taller");
			expect(html).toContain("Ingeniera Luz");
			expect(html).toContain("Hablando con:");

			// Asegura que dentro del diorama NO haya inputs ni botones interactivos
			// Extraemos el bloque interno del diorama
			const dioramaMatch = html.match(
				/<div[^>]*data-testid="live-mirror-diorama"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*data-testid="mirror-participants"/,
			);
			expect(dioramaMatch).not.toBeNull();
			const dioramaContent = dioramaMatch?.[1] ?? "";

			// CERO botones interactivos dentro del diorama 3D
			expect(dioramaContent).not.toContain("<button");
			expect(dioramaContent).not.toContain("<input");
			expect(dioramaContent).not.toContain("<textarea");
		});

		it("renderiza el checklist sincronizado de 3 pasos (chacra, taller, alcaldía) con marcas de avance", () => {
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					liveStep: 2,
					activeSessionCode: "F5AA",
				}),
			);

			expect(html).toContain('data-testid="mirror-checklist"');
			expect(html).toContain("1 Conseguir madera (chacra)");
			expect(html).toContain("2 Aprobar diseño (taller)");
			expect(html).toContain("3 Permiso (alcaldía)");

			// Paso 1 y 2 completados con check ✓
			expect(html).toContain("1 Conseguir madera (chacra) ✓");
			expect(html).toContain("2 Aprobar diseño (taller) ✓");
			// Paso 3 pendiente con círculo ○
			expect(html).toContain("3 Permiso (alcaldía) ○");
		});

		it("renderiza el inventario compartido único para el grupo (madera, plano, sello)", () => {
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					liveStep: 2,
					inventory: { madera: true, plano: true, sello: false },
				}),
			);

			expect(html).toContain('data-testid="mirror-inventory"');
			expect(html).toContain('data-testid="inventory-madera"');
			expect(html).toContain('data-testid="inventory-plano"');
			expect(html).toContain('data-testid="inventory-sello"');

			// Íconos y etiquetas presentes
			expect(html).toContain("🪵");
			expect(html).toContain("Madera");
			expect(html).toContain("📐");
			expect(html).toContain("Plano");
			expect(html).toContain("📜");
			expect(html).toContain("Sello");

			// Madera y Plano obtenidos
			expect(html).toContain("Madera obtenida");
			expect(html).toContain("Plano obtenido");
			// Sello pendiente
			expect(html).toContain("Sello pendiente");
		});

		it("renderiza los captions inferiores activos (máximo 2 líneas, punto color niños / blanco NPC)", () => {
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					activeSubtitles: [
						{
							id: "sub-npc",
							speakerName: "Alcalde Soto",
							speakerColor: "#ffffff",
							speakerType: "npc",
							text: "¡El río nos partió el puente! Debemos unirnos para cruzarlo.",
							expiresAt: Date.now() + 6000,
						},
						{
							id: "sub-kid",
							speakerName: "Mateo",
							speakerColor: "#38bdf8",
							speakerType: "kid",
							text: "Yo ayudo a cargar los tablones de madera con Paco.",
							expiresAt: Date.now() + 6000,
						},
					],
				}),
			);

			expect(html).toContain('data-testid="mirror-captions"');
			expect(html).toContain('data-testid="caption-item-sub-npc"');
			expect(html).toContain('data-testid="caption-item-sub-kid"');

			// Dot blanco para NPC
			expect(html).toContain('data-testid="caption-dot-sub-npc"');
			expect(html).toContain("background-color:#ffffff");

			// Dot coloreado para niño (#38bdf8)
			expect(html).toContain('data-testid="caption-dot-sub-kid"');
			expect(html).toContain("background-color:#38bdf8");

			// Texto de frases
			expect(html).toContain("Alcalde Soto:");
			expect(html).toContain(
				"¡El río nos partió el puente! Debemos unirnos para cruzarlo.",
			);
			expect(html).toContain("Mateo:");
			expect(html).toContain(
				"Yo ayudo a cargar los tablones de madera con Paco.",
			);
		});
	});

	// =========================================================================
	// 2. DEBUG DE TEMPORIZADORES: ALERTA ROJA <60s, PAUSA, STALL TIERS Y WALL
	// =========================================================================
	describe("2. Debug de Temporizadores (SPEC §10, §13)", () => {
		it("muestra el reloj de juego formateado mm:ss y activa alerta roja visual cuando quedan < 60 segundos", () => {
			// Partida con 45 segundos restantes (< 60s)
			const htmlUrgent = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					liveTimerSeconds: 45,
				}),
			);

			expect(htmlUrgent).toContain('data-testid="live-timer-container"');
			expect(htmlUrgent).toContain('data-testid="live-game-timer"');
			expect(htmlUrgent).toContain("00:45");

			// Alerta visual roja activa
			expect(htmlUrgent).toContain('data-testid="timer-red-alert"');
			expect(htmlUrgent).toContain('data-urgent="true"');
			expect(htmlUrgent).toContain("border-red-500");
			expect(htmlUrgent).toContain("bg-red-950/80");
			expect(htmlUrgent).toContain("animate-pulse");

			// Partida con tiempo normal (180 segundos = 03:00)
			const htmlNormal = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					liveTimerSeconds: 180,
				}),
			);
			expect(htmlNormal).toContain("03:00");
			expect(htmlNormal).not.toContain('data-testid="timer-red-alert"');
			expect(htmlNormal).not.toContain('data-urgent="true"');
		});

		it("muestra el flash animado de pausa durante interrupciones o dibujo con motivo opcional", () => {
			const htmlPaused = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					liveTimerSeconds: 150,
					isTimerPaused: true,
					pauseReason: "dibujo",
				}),
			);

			expect(htmlPaused).toContain('data-testid="timer-pause-flash"');
			expect(htmlPaused).toContain("Pausa (dibujo)");
			expect(htmlPaused).toContain("animate-pulse");
		});

		it("muestra la cuenta regresiva de atasco/stall con tiers explícitos (L1 45s, L2 90s, L3 150s)", () => {
			// Stall en L1
			const htmlL1 = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					stallTier: "L1",
					stallCountdownSeconds: 45,
				}),
			);
			expect(htmlL1).toContain('data-testid="stall-timer-container"');
			expect(htmlL1).toContain('data-testid="stall-tier"');
			expect(htmlL1).toContain("L1 (45s)");
			expect(htmlL1).toContain('data-testid="stall-countdown"');
			expect(htmlL1).toContain("45s");

			// Stall en L2
			const htmlL2 = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					stallTier: "L2",
					stallCountdownSeconds: 90,
				}),
			);
			expect(htmlL2).toContain("L2 (90s)");
			expect(htmlL2).toContain("90s");

			// Stall en L3
			const htmlL3 = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					stallTier: "L3",
					stallCountdownSeconds: 150,
				}),
			);
			expect(htmlL3).toContain("L3 (150s)");
			expect(htmlL3).toContain("150s");
		});

		it("muestra el reloj de pared de depuración con timestamp dual (wall_ts_ms y hora local)", () => {
			const fixedWallMs = 1730715345000;
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					wallClockMs: fixedWallMs,
				}),
			);

			expect(html).toContain('data-testid="wall-clock"');
			expect(html).toContain(`data-wall-ms="${fixedWallMs}"`);
			expect(html).toContain('data-testid="wall-clock-time"');
			expect(html).toContain('data-testid="wall-clock-ms"');
			expect(html).toContain(`(${fixedWallMs})`);
		});
	});

	// =========================================================================
	// 3. FEEDS DE TELEMETRÍA Y TIMESTAMPS DUALES (LAST 20 TRANSCRIPTS & EVENTS)
	// =========================================================================
	describe("3. Feeds de Telemetría con Timestamps Duales (D6, SPEC §5, §17)", () => {
		it("muestra el feed de transcripciones diarizadas limitado a los últimos 20 turnos en orden cronológico", () => {
			// Generar 25 transcripciones
			const sampleTranscripts: MirrorTranscript[] = [];
			for (let i = 1; i <= 25; i++) {
				sampleTranscripts.push({
					id: `tr-${i}`,
					holder: `Alumno ${i}`,
					text: `Intervención número ${i} para el equipo`,
					time: `00:${i.toString().padStart(2, "0")}`,
					avatarId: "zorro",
					game_ts_ms: i * 1000,
					wall_ts_ms: 1730715300000 + i * 1000,
				});
			}

			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					recentTranscripts: sampleTranscripts,
				}),
			);

			expect(html).toContain('data-testid="transcript-feed"');

			// La primera intervención tr-1 debe quedar fuera del corte (slice -20)
			expect(html).not.toContain('data-testid="transcript-item-tr-1"');
			expect(html).not.toContain('data-testid="transcript-item-tr-5"');

			// Las últimas 20 (tr-6 a tr-25) deben estar presentes
			expect(html).toContain('data-testid="transcript-item-tr-6"');
			expect(html).toContain('data-testid="transcript-item-tr-25"');
		});

		it("cada fila de transcripción incluye timestamps duales auditables (game_ts_ms y wall_ts_ms)", () => {
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					recentTranscripts: [
						{
							id: "t-dual",
							holder: "Mateo (Zorro)",
							text: "Llegamos a la chacra de Paco.",
							time: "00:45",
							avatarId: "zorro",
							game_ts_ms: 45000,
							wall_ts_ms: 1730715345000,
						},
					],
				}),
			);

			expect(html).toContain('data-testid="transcript-item-t-dual"');
			expect(html).toContain('data-testid="transcript-holder-t-dual"');
			expect(html).toContain("Mateo (Zorro)");

			// Timestamps duales
			expect(html).toContain('data-testid="transcript-game-ts-t-dual"');
			expect(html).toContain('data-game-ts="45000"');
			expect(html).toContain("Juego: 00:45");

			expect(html).toContain('data-testid="transcript-wall-ts-t-dual"');
			expect(html).toContain('data-wall-ts="1730715345000"');
			expect(html).toContain("Pared:");
		});

		it("muestra el log de eventos cerrado (SPEC §17) con tipo, actor, detalle y timestamps duales", () => {
			const closedEvents: MirrorEvent[] = [
				{
					id: "ev-press",
					type: "press",
					actor: "Mateo",
					details: "Pulsó botón de hablar (2.1s)",
					time: "00:30",
					game_ts_ms: 30000,
					wall_ts_ms: 1730715330000,
				},
				{
					id: "ev-grant",
					type: "grant_step",
					actor: "Agricultor Paco",
					details: "Concedió ítem madera",
					time: "01:10",
					game_ts_ms: 70000,
					wall_ts_ms: 1730715370000,
				},
				{
					id: "ev-skip",
					type: "time_skip",
					actor: "Operador",
					details: "Salto a estación taller",
					time: "01:20",
					game_ts_ms: 80000,
					wall_ts_ms: 1730715380000,
				},
			];

			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					recentEvents: closedEvents,
				}),
			);

			expect(html).toContain('data-testid="event-feed"');

			// Fila 1: press
			expect(html).toContain('data-testid="event-item-ev-press"');
			expect(html).toContain('data-testid="event-type-ev-press"');
			expect(html).toContain("press");
			expect(html).toContain('data-testid="event-game-ts-ev-press"');
			expect(html).toContain('data-game-ts="30000"');
			expect(html).toContain('data-testid="event-wall-ts-ev-press"');
			expect(html).toContain('data-wall-ts="1730715330000"');

			// Fila 2: grant_step
			expect(html).toContain('data-testid="event-type-ev-grant"');
			expect(html).toContain("grant_step");
			expect(html).toContain("Concedió ítem madera");

			// Fila 3: time_skip
			expect(html).toContain('data-testid="event-type-ev-skip"');
			expect(html).toContain("time_skip");
			expect(html).toContain("Salto a estación taller");
		});
	});

	// =========================================================================
	// 4. ESTADO DE PARTICIPANTES Y BADGE 'RETIRADO MM:SS'
	// =========================================================================
	describe("4. Estado de Participantes y Dropout (D6, SPEC §3, §4, §13)", () => {
		it("despliega estados interactivos diferenciados: claimed, confirmed, speaking, drawing, retired", () => {
			const evals: StudentEvaluation[] = [
				{
					studentId: "c1",
					studentName: "Mateo",
					avatarId: "zorro",
					confirmed: true,
					status: "confirmed",
					participacion: 2,
					propuesta: 2,
					organizacion: 1,
					anecdote: "",
					voiceTurns: 6,
					drawsCount: 2,
					retired: false,
				},
				{
					studentId: "c2",
					studentName: "Valentina",
					avatarId: "buho",
					confirmed: true,
					status: "speaking",
					participacion: 2,
					propuesta: 1,
					organizacion: 2,
					anecdote: "",
					voiceTurns: 5,
					drawsCount: 1,
					retired: false,
				},
				{
					studentId: "c3",
					studentName: "Leo",
					avatarId: "rana",
					confirmed: true,
					status: "drawing",
					participacion: 1,
					propuesta: 2,
					organizacion: 1,
					anecdote: "",
					voiceTurns: 4,
					drawsCount: 2,
					retired: false,
				},
				{
					studentId: "c4",
					studentName: "Sofía",
					avatarId: "gato",
					confirmed: false,
					status: "claimed",
					participacion: 0,
					propuesta: 0,
					organizacion: 0,
					anecdote: "",
					voiceTurns: 1,
					drawsCount: 0,
					retired: false,
				},
				{
					studentId: "c5",
					studentName: "Lucas",
					avatarId: "llama",
					confirmed: true,
					status: "retired",
					participacion: 1,
					propuesta: 0,
					organizacion: 0,
					anecdote: "",
					voiceTurns: 2,
					drawsCount: 0,
					retired: true,
					retiredAt: "01:45",
				},
			];

			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					studentEvals: evals,
				}),
			);

			expect(html).toContain('data-testid="mirror-participants"');

			// c1: Confirmed
			expect(html).toContain('data-testid="mirror-student-c1"');
			expect(html).toContain('data-testid="mirror-status-confirmed-c1"');
			expect(html).toContain("Listo ✓");

			// c2: Speaking
			expect(html).toContain('data-testid="mirror-student-c2"');
			expect(html).toContain('data-testid="mirror-status-speaking-c2"');
			expect(html).toContain("Hablando 🎙️");

			// c3: Drawing
			expect(html).toContain('data-testid="mirror-student-c3"');
			expect(html).toContain('data-testid="mirror-status-drawing-c3"');
			expect(html).toContain("Dibujando 🎨");

			// c4: Claimed
			expect(html).toContain('data-testid="mirror-student-c4"');
			expect(html).toContain('data-testid="mirror-status-claimed-c4"');
			expect(html).toContain("Esperando");

			// c5: Retired con badge 'retirado mm:ss'
			expect(html).toContain('data-testid="mirror-student-c5"');
			expect(html).toContain('data-testid="retired-badge"');
			expect(html).toContain("Retirado 01:45");
			expect(html).toContain("grayscale");
		});

		it("al ejecutar retiro vía retireStudent: calcula tiempo mm:ss, marca retirado y emite evento", () => {
			useTeacherStore.setState({
				formDurationMinutes: 5,
				liveTimerSeconds: 155, // 5:00 - 02:35 = 02:25 transcurridos
			});

			useTeacherStore.getState().retireStudent("c1", repo);

			const state = useTeacherStore.getState();
			const c1 = state.studentEvals.find((s) => s.studentId === "c1");
			expect(c1?.retired).toBe(true);
			expect(c1?.retiredAt).toBe("02:25");

			// Evento emitido al append-only log con timestamps duales
			const lastEv = state.recentEvents[0];
			expect(lastEv).toBeDefined();
			expect(lastEv?.type).toBe("press");
			expect(lastEv?.details).toContain("Alumno Mateo retirado (02:25)");
			expect(lastEv?.game_ts_ms).toBe(145000); // 145 segundos transcurridos
			expect(lastEv?.wall_ts_ms).toBeGreaterThan(0);

			// Renderiza el badge retirado mm:ss
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					studentEvals: state.studentEvals,
				}),
			);
			expect(html).toContain('data-testid="retired-badge"');
			expect(html).toContain("Retirado 02:25");
		});
	});

	// =========================================================================
	// 5. CONTROL DE MUTE BGM EXCLUSIVO EN HEADER DOCENTE (D7, SPEC §4, §13)
	// =========================================================================
	describe("5. Control de Mute BGM Exclusivo en Header Docente (SPEC §4, §13)", () => {
		it("el botón Mute BGM reside exclusivamente en el header de /teacher y conmuta su estado", () => {
			const htmlTeacher = renderToString(
				React.createElement<TeacherLayoutProps>(TeacherLayout, { repo }),
			);

			// Botón presente en /teacher
			expect(htmlTeacher).toContain('data-testid="bgm-mute-btn"');
			expect(htmlTeacher).toContain("BGM Activo");

			// Alternar estado a silenciado
			useTeacherStore.getState().toggleBgmMute();
			const state = useTeacherStore.getState();
			expect(state.isBgmMuted).toBe(true);

			const htmlTeacherMuted = renderToString(
				React.createElement<TeacherLayoutProps>(TeacherLayout, { repo }),
			);
			expect(htmlTeacherMuted).toContain("BGM Silenciado");
		});

		it("el control de Mute BGM está ESTRICTAMENTE AUSENTE en /play", () => {
			const htmlPlay = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);
			expect(htmlPlay).not.toContain('data-testid="bgm-mute-btn"');
			expect(htmlPlay).not.toContain("BGM Activo");
			expect(htmlPlay).not.toContain("BGM Silenciado");
		});
	});

	// =========================================================================
	// 6. AISLAMIENTO ESTRICTO DE RUTAS (D7, SPEC §2, §4, §12, §13)
	// =========================================================================
	describe("6. Aislamiento Estricto de Rutas (Superficie D7, SPEC §2, §12, §13)", () => {
		it("garantiza la AUSENCIA TOTAL de selectores de LiveMirror y de consola docente en el DOM de /play", () => {
			const htmlActive = renderToString(React.createElement(ActivePlayView));
			const htmlLayout = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			const playDOMs = [htmlActive, htmlLayout];

			for (const dom of playDOMs) {
				// Selectores de LiveMirror ausentes
				expect(dom).not.toContain('data-testid="live-mirror"');
				expect(dom).not.toContain('data-testid="live-mirror-diorama"');
				expect(dom).not.toContain('data-testid="live-timer-container"');
				expect(dom).not.toContain('data-testid="timer-red-alert"');
				expect(dom).not.toContain('data-testid="timer-pause-flash"');
				expect(dom).not.toContain('data-testid="stall-timer-container"');
				expect(dom).not.toContain('data-testid="stall-tier"');
				expect(dom).not.toContain('data-testid="stall-countdown"');
				expect(dom).not.toContain('data-testid="wall-clock"');
				expect(dom).not.toContain('data-testid="mirror-participants"');
				expect(dom).not.toContain('data-testid="mirror-captions"');
				expect(dom).not.toContain('data-testid="transcript-feed"');
				expect(dom).not.toContain('data-testid="event-feed"');
				expect(dom).not.toContain('data-testid="force-start-btn"');
				expect(dom).not.toContain('data-testid="teacher-countdown"');

				// Selectores de Consola Docente ausentes
				expect(dom).not.toContain('data-testid="operator-console"');
				expect(dom).not.toContain('data-testid="force-grant-btn"');
				expect(dom).not.toContain('data-testid="replay-npc-btn"');
				expect(dom).not.toContain('data-testid="skip-intro-btn"');
				expect(dom).not.toContain('data-testid="end-run-btn"');
				expect(dom).not.toContain('data-testid="retry-ia-btn"');
				expect(dom).not.toContain('data-testid="retire-student-select"');
				expect(dom).not.toContain('data-testid="confirm-retire-btn"');
				expect(dom).not.toContain('data-testid="inline-retire-btn"');
			}
		});

		it("garantiza la AUSENCIA TOTAL de términos y textos reservados de la consola docente en el DOM de /play", () => {
			const htmlActive = renderToString(React.createElement(ActivePlayView));
			const htmlLayout = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			const reservedTeacherTerms = [
				"Espejo en Vivo",
				"3D solo lectura",
				"Consola Silenciosa",
				"Consola Docente",
				"Pestaña Privada",
				"NO Proyectar en Aula",
				"con apoyo docente",
				"señales preliminares, no notas",
				"Saltar a Estación",
				"Concesión Forzada",
				"Replay PNJ",
				"Terminar Ahora",
				"Saltar Intro",
				"Reintentar IA",
				"Nudge L1",
				"Feed de Transcripciones",
				"Log de Eventos",
				"Participantes Activos",
			];

			for (const term of reservedTeacherTerms) {
				expect(htmlActive).not.toContain(term);
				expect(htmlLayout).not.toContain(term);
			}
		});
	});
});
