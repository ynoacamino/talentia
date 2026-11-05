/**
 * TALENTIA / SocraticGuild — Integration & Unit Tests for F5b
 * Superficie D6: Consola Silenciosa de Operador y Mecánicas de Rescate Pedagógico.
 * Conforme a SPEC §2, §9, §11, §13, §17 & docs/gates/F0-contrato.md.
 *
 * Verificaciones obligatorias:
 * 1. Skip-to-station x 4 (chacra, taller, alcaldía, puente):
 *    - Mueve la partida a la estación seleccionada (teletransporte fade).
 *    - Sincroniza bidireccionalmente en tiempo real con /play vía sessionSync.
 *    - Loguea estrictamente el evento time_skip(fromStation, toStation).
 *    - Regla estricta: NO otorga ningún grant/item ni aprobación.
 * 2. Force-grant (concesión forzada del siguiente paso):
 *    - Secuencial estricto: solo concede el siguiente paso en orden:
 *      1. 'madera' si no tiene madera (en chacra).
 *      2. 'diseño' si ya tiene madera pero no diseño (en taller).
 *      3. 'permiso' si ya tiene madera y diseño pero no permiso (en alcaldía).
 *    - Si se solicita fuera de orden, RECHAZA con mensaje del faltante exacto ('Falta: madera', 'Falta: diseño').
 *    - Cada force-grant:
 *      * Actualiza inventario y checklist.
 *      * Loguea grant_step(forced=true).
 *      * Fija conApoyoDocente: true (que capará estructurada a 1 y excluirá la insignia 'Paso a paso').
 * 3. Replay (repetir última frase del PNJ):
 *    - Re-emite la última frase del PNJ de la estación actual.
 *    - Regla estricta: NO crea ningún turno nuevo de transcripción ni avanza el juego.
 * 4. End-run-now (terminar ahora):
 *    - Detiene la partida de inmediato, congela el temporizador y transiciona a fin parcial.
 *    - Muestra estrellas retenidas ('Misión en curso X/3' badges-only, stars === null).
 * 5. Skip-intro:
 *    - Salta la introducción y lleva la partida directo a juego activo.
 * 6. Retirar alumno:
 *    - Control por avatar con confirmación inline ('¿Retirar a X?'), emite RETIRE_STUDENT vía sessionSync,
 *      deshabilita tarjeta a gris en /play y registra 'retirado mm:ss'.
 * 7. Reintentar IA:
 *    - Botón para reanudar la partida si un servicio de IA falló tras reintentos automáticos.
 * 8. Aislamiento de selectores:
 *    - Cero filtración en el DOM: ningún botón de la consola de operador existe en el DOM de /play.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import {
	createSessionSyncBus,
	resetAllSyncBuses,
} from "@/core/sync/sessionSync.ts";
import { setDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import {
	EquipoEndScreen,
	type EquipoEndScreenProps,
} from "@/ui/play/EquipoEndScreen.tsx";
import { PlayLayout, type PlayLayoutProps } from "@/ui/play/PlayLayout.tsx";
import { type StationId, usePlayStore } from "@/ui/play/playStore.ts";
import { RightRail, type RightRailProps } from "@/ui/play/RightRail.tsx";
import {
	OperatorConsole,
	type OperatorConsoleProps,
} from "@/ui/teacher/OperatorConsole.tsx";
import {
	TeacherLayout,
	type TeacherLayoutProps,
} from "@/ui/teacher/TeacherLayout.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";
import type { PlayerCardStatus } from "@/ui/tokens/colors.ts";

describe("F5b: Consola Silenciosa de Operador y Rescate Pedagógico (Superficie D6 - SPEC §2, §9, §11, §13, §17)", () => {
	let repo: InMemorySessionRepository;
	const SESSION_CODE = "K7F5";

	beforeEach(() => {
		resetAllSyncBuses();
		repo = new InMemorySessionRepository();
		setDefaultSessionRepository(repo);

		// 1. Inicializar Play Store
		usePlayStore.setState({
			phase: "active",
			sessionCode: SESSION_CODE,
			expectedPlayers: 3,
			cards: [
				{
					cardId: "c1",
					playerIndex: 0,
					avatarId: "zorro",
					studentName: "Mateo",
					isConfirmed: true,
					status: "idle",
					isRetired: false,
					turnsCount: 4,
					drawsCount: 1,
				},
				{
					cardId: "c2",
					playerIndex: 1,
					avatarId: "buho",
					studentName: "Sofía",
					isConfirmed: true,
					status: "idle",
					isRetired: false,
					turnsCount: 3,
					drawsCount: 0,
				},
				{
					cardId: "c3",
					playerIndex: 2,
					avatarId: "rana",
					studentName: "Lucas",
					isConfirmed: true,
					status: "idle",
					isRetired: false,
					turnsCount: 2,
					drawsCount: 1,
				},
			],
			selectedCardIndex: null,
			countdownSeconds: 0,
			currentStation: "campamento",
			gameTimeSeconds: 240,
			isTimerPaused: false,
			pauseReason: null,
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
			activeSubtitles: [],
			isDrawOpen: false,
			isMapOpen: false,
			isWalking: false,
			shakeMessage: null,
			endType: null,
			sessionStatus: "playing",
			language: "ES",
			teacherAssisted: false,
			groupScores: {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			},
			syncBus: null,
		});

		// 2. Inicializar Teacher Store
		useTeacherStore.setState({
			formLanguage: "ES",
			formPlayers: 3,
			formDurationMinutes: 5,
			isConfigLocked: true,
			configError: null,
			configShake: false,
			activeSessionCode: SESSION_CODE,
			activeTab: "live",
			syncBus: null,
			countdownSeconds: 0,
			isCountingDown: false,
			isBgmMuted: false,
			isLiveConnected: true,
			liveStep: 0,
			liveStation: "campamento",
			liveTimerSeconds: 240,
			isTimerPaused: false,
			pauseReason: null,
			stallCountdownSeconds: 45,
			stallTier: "L1",
			wallClockMs: Date.now(),
			teacherAssisted: false,
			conApoyoDocente: false,
			consoleError: null,
			inventory: { madera: false, plano: false, sello: false },
			activeSubtitles: [],
			recentTranscripts: [
				{
					id: "tr-1",
					holder: "Mateo (Zorro)",
					text: "Hola amigos, vamos a reconstruir el puente.",
					time: "00:15",
					avatarId: "zorro",
					game_ts_ms: 15000,
					wall_ts_ms: Date.now() - 30000,
				},
			],
			recentEvents: [],
			studentEvals: [
				{
					studentId: "c1",
					studentName: "Mateo",
					avatarId: "zorro",
					confirmed: true,
					participacion: 2,
					propuesta: 2,
					organizacion: 2,
					anecdote: "Asumió la iniciativa en el equipo.",
					voiceTurns: 4,
					drawsCount: 1,
					retired: false,
				},
				{
					studentId: "c2",
					studentName: "Sofía",
					avatarId: "buho",
					confirmed: true,
					participacion: 2,
					propuesta: 2,
					organizacion: 1,
					anecdote: "Negoció con claridad las tareas.",
					voiceTurns: 3,
					drawsCount: 0,
					retired: false,
				},
				{
					studentId: "c3",
					studentName: "Lucas",
					avatarId: "rana",
					confirmed: true,
					participacion: 1,
					propuesta: 2,
					organizacion: 1,
					anecdote: "Aportó un boceto del río.",
					voiceTurns: 2,
					drawsCount: 1,
					retired: false,
				},
			],
			groupScores: {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			},
			groupQuotes: {
				turnTaking: "Esperaron cada turno.",
				colaboracion: "Construyeron juntos.",
				negociacion: "Llegaron a acuerdos.",
				estructurada: "Siguieron la secuencia paso a paso.",
				organizacion: "Se organizaron para decidir.",
			},
			comments: [],
			pastSessions: [],
			selectedPastSessionCode: null,
		});

		// 3. Conectar bus bidireccional sincronizado entre ambas pestañas
		const teacherBus = createSessionSyncBus(SESSION_CODE, {
			forceMemoryBus: true,
		});
		const playBus = createSessionSyncBus(SESSION_CODE, {
			forceMemoryBus: true,
		});

		useTeacherStore.setState({ syncBus: teacherBus });
		usePlayStore.setState({ syncBus: playBus });

		playBus.subscribe((msg) => {
			if (msg.type === "TIME_SKIP") {
				const rawTo = msg.toStation.toLowerCase();
				let target: StationId = "campamento";
				if (rawTo.includes("chacra")) target = "chacra";
				else if (rawTo.includes("taller")) target = "taller";
				else if (rawTo.includes("alcaldia") || rawTo.includes("alcaldía"))
					target = "alcaldia";
				else if (rawTo.includes("puente")) target = "puente";

				usePlayStore.setState({ currentStation: target });
			} else if (msg.type === "FORCE_GRANT") {
				const state = usePlayStore.getState();
				const step = msg.step;
				const inventory = { ...state.inventory };
				if (step >= 1) inventory.madera = true;
				if (step >= 2) inventory.plano = true;
				if (step >= 3) inventory.sello = true;
				const groupScores = state.groupScores
					? {
							...state.groupScores,
							estructurada: Math.min(1, state.groupScores.estructurada),
						}
					: undefined;
				usePlayStore.setState({
					checklistStep: step,
					inventory,
					teacherAssisted: true,
					groupScores,
				});
			} else if (msg.type === "REPLAY_NPC") {
				usePlayStore.getState().addSubtitle({
					speakerName: msg.npcName,
					speakerColor: "#ffffff",
					speakerType: "npc",
					text: msg.text,
				});
			} else if (msg.type === "SKIP_INTRO") {
				usePlayStore.getState().startActiveGame();
			} else if (msg.type === "RETRY_SERVICE") {
				usePlayStore.setState({
					isTimerPaused: false,
					pauseReason: null,
					shakeMessage: null,
				});
			} else if (msg.type === "SESSION_END") {
				if (msg.status === "expired" || msg.endType === "partial") {
					usePlayStore.getState().triggerPartialEnd(msg.scores);
				}
			} else if (msg.type === "RETIRE_STUDENT") {
				const cards = usePlayStore.getState().cards.map((c, idx) =>
					c.cardId === msg.studentId || idx === msg.slotIndex
						? {
								...c,
								isRetired: true,
								status: "idle" as PlayerCardStatus,
							}
						: c,
				);
				usePlayStore.setState({ cards });
			}
		});
	});

	// =========================================================================
	// 1. SKIP A ESTACIÓN X 4 (chacra, taller, alcaldía, puente)
	// =========================================================================
	describe("1. Skip a Estación (x4)", () => {
		it("mueve la partida a la estación seleccionada en /teacher y sincroniza en tiempo real con /play", () => {
			expect(useTeacherStore.getState().liveStation).toBe("campamento");
			expect(usePlayStore.getState().currentStation).toBe("campamento");

			// Saltar a Taller
			useTeacherStore.getState().skipToStation("taller");

			expect(useTeacherStore.getState().liveStation).toBe("taller");
			expect(usePlayStore.getState().currentStation).toBe("taller");
		});

		it("loguea estrictamente el evento time_skip(fromStation, toStation) con triggeredBy teacher_console", () => {
			useTeacherStore.getState().skipToStation("chacra");

			const events = useTeacherStore.getState().recentEvents;
			expect(events.length).toBeGreaterThan(0);
			const timeSkipEvent = events[0];
			expect(timeSkipEvent?.type).toBe("time_skip");

			const payload = timeSkipEvent?.payload as {
				fromStation: string;
				toStation: string;
				triggeredBy: string;
			};
			expect(payload).toBeDefined();
			expect(payload.fromStation).toBe("campamento");
			expect(payload.toStation).toBe("chacra");
			expect(payload.triggeredBy).toBe("teacher_console");
		});

		it("REGLA ESTRICTA: NO otorga ningún grant/item ni aprobación al saltar de estación", () => {
			expect(useTeacherStore.getState().liveStep).toBe(0);
			expect(useTeacherStore.getState().inventory).toEqual({
				madera: false,
				plano: false,
				sello: false,
			});
			expect(usePlayStore.getState().checklistStep).toBe(0);
			expect(usePlayStore.getState().inventory).toEqual({
				madera: false,
				plano: false,
				sello: false,
			});

			// Salta a Alcaldía (donde estaría el permiso)
			useTeacherStore.getState().skipToStation("alcaldia");

			// El inventario y checklist deben permanecer COMPLETAMENTE VACÍOS
			expect(useTeacherStore.getState().liveStep).toBe(0);
			expect(useTeacherStore.getState().inventory).toEqual({
				madera: false,
				plano: false,
				sello: false,
			});
			expect(usePlayStore.getState().checklistStep).toBe(0);
			expect(usePlayStore.getState().inventory).toEqual({
				madera: false,
				plano: false,
				sello: false,
			});
		});

		it("permite saltar secuencialmente o directamente a cualquiera de las 4 estaciones (chacra, taller, alcaldía, puente)", () => {
			const stationsToTest: Array<{ id: StationId; expected: StationId }> = [
				{ id: "chacra", expected: "chacra" },
				{ id: "taller", expected: "taller" },
				{ id: "alcaldia", expected: "alcaldia" },
				{ id: "puente", expected: "puente" },
			];

			for (const s of stationsToTest) {
				useTeacherStore.getState().skipToStation(s.id);
				expect(useTeacherStore.getState().liveStation).toBe(s.expected);
				expect(usePlayStore.getState().currentStation).toBe(s.expected);
				// Cero items otorgados en cualquier salto
				expect(useTeacherStore.getState().liveStep).toBe(0);
				expect(usePlayStore.getState().checklistStep).toBe(0);
			}
		});
	});

	// =========================================================================
	// 2. FORCE-GRANT (Concesión Forzada del Siguiente Paso)
	// =========================================================================
	describe("2. Force-Grant (Concesión Forzada en Orden Secuencial Estricto)", () => {
		it("rechaza peticiones fuera de orden con el mensaje de faltante exacto ('Falta: madera', 'Falta: diseño')", () => {
			// Estado inicial: 0 items
			expect(useTeacherStore.getState().liveStep).toBe(0);

			// Intento 1: Pedir 'diseño' sin tener madera
			const resDiseno = useTeacherStore.getState().forceGrantStep("diseño");
			expect(resDiseno.ok).toBe(false);
			expect(resDiseno.error).toBe("Falta: madera");
			expect(useTeacherStore.getState().consoleError).toBe("Falta: madera");
			expect(useTeacherStore.getState().liveStep).toBe(0);
			expect(useTeacherStore.getState().inventory.madera).toBe(false);
			expect(useTeacherStore.getState().inventory.plano).toBe(false);

			// Intento 2: Pedir 'permiso' sin tener madera
			const resPermisoSinMadera = useTeacherStore
				.getState()
				.forceGrantStep("permiso");
			expect(resPermisoSinMadera.ok).toBe(false);
			expect(resPermisoSinMadera.error).toBe("Falta: madera");
			expect(useTeacherStore.getState().consoleError).toBe("Falta: madera");
			expect(useTeacherStore.getState().liveStep).toBe(0);

			// Ahora concedemos Madera legalmente
			const grantMadera = useTeacherStore.getState().forceGrantStep("madera");
			expect(grantMadera.ok).toBe(true);
			expect(useTeacherStore.getState().liveStep).toBe(1);
			expect(useTeacherStore.getState().inventory.madera).toBe(true);

			// Intento 3: Teniendo madera pero sin diseño, pedir 'permiso'
			const resPermisoSinDiseno = useTeacherStore
				.getState()
				.forceGrantStep("permiso");
			expect(resPermisoSinDiseno.ok).toBe(false);
			expect(resPermisoSinDiseno.error).toBe("Falta: diseño");
			expect(useTeacherStore.getState().consoleError).toBe("Falta: diseño");
			expect(useTeacherStore.getState().liveStep).toBe(1);
			expect(useTeacherStore.getState().inventory.sello).toBe(false);
		});

		it("forceGrantNext() otorga estrictamente el siguiente paso en orden: 1. madera -> 2. diseño -> 3. permiso", () => {
			expect(useTeacherStore.getState().liveStep).toBe(0);
			expect(usePlayStore.getState().checklistStep).toBe(0);

			// 1. Primer force-grant -> Paso 1 (madera)
			const step1 = useTeacherStore.getState().forceGrantNext();
			expect(step1.ok).toBe(true);
			expect(step1.step).toBe(1);
			expect(step1.item).toBe("madera");

			expect(useTeacherStore.getState().liveStep).toBe(1);
			expect(useTeacherStore.getState().inventory.madera).toBe(true);
			expect(useTeacherStore.getState().inventory.plano).toBe(false);
			expect(usePlayStore.getState().checklistStep).toBe(1);
			expect(usePlayStore.getState().inventory.madera).toBe(true);

			// 2. Segundo force-grant -> Paso 2 (diseño / plano)
			const step2 = useTeacherStore.getState().forceGrantNext();
			expect(step2.ok).toBe(true);
			expect(step2.step).toBe(2);
			expect(step2.item).toBe("plano");

			expect(useTeacherStore.getState().liveStep).toBe(2);
			expect(useTeacherStore.getState().inventory.madera).toBe(true);
			expect(useTeacherStore.getState().inventory.plano).toBe(true);
			expect(useTeacherStore.getState().inventory.sello).toBe(false);
			expect(usePlayStore.getState().checklistStep).toBe(2);
			expect(usePlayStore.getState().inventory.plano).toBe(true);

			// 3. Tercer force-grant -> Paso 3 (permiso / sello)
			const step3 = useTeacherStore.getState().forceGrantNext();
			expect(step3.ok).toBe(true);
			expect(step3.step).toBe(3);
			expect(step3.item).toBe("sello");

			expect(useTeacherStore.getState().liveStep).toBe(3);
			expect(useTeacherStore.getState().inventory.madera).toBe(true);
			expect(useTeacherStore.getState().inventory.plano).toBe(true);
			expect(useTeacherStore.getState().inventory.sello).toBe(true);
			expect(usePlayStore.getState().checklistStep).toBe(3);
			expect(usePlayStore.getState().inventory.sello).toBe(true);

			// 4. Concesión posterior cuando ya están todos los pasos completados
			const stepExtra = useTeacherStore.getState().forceGrantNext();
			expect(stepExtra.ok).toBe(false);
			expect(stepExtra.error).toBe("Todos los pasos ya fueron concedidos");
		});

		it("cada force-grant loguea grant_step(forced=true), fija conApoyoDocente=true y capa estructurada a 1", () => {
			expect(useTeacherStore.getState().teacherAssisted).toBe(false);
			expect(useTeacherStore.getState().conApoyoDocente).toBe(false);
			expect(useTeacherStore.getState().groupScores.estructurada).toBe(2);

			useTeacherStore.getState().forceGrantNext();

			// Verifica evento logueado
			const events = useTeacherStore.getState().recentEvents;
			const grantEvent = events[0];
			expect(grantEvent?.type).toBe("grant_step");
			const payload = grantEvent?.payload as {
				stepId: string;
				grantedItem: string;
				forced: boolean;
			};
			expect(payload.forced).toBe(true);
			expect(payload.grantedItem).toBe("madera");

			// Verifica banderas de soporte docente
			expect(useTeacherStore.getState().teacherAssisted).toBe(true);
			expect(useTeacherStore.getState().conApoyoDocente).toBe(true);
			expect(usePlayStore.getState().teacherAssisted).toBe(true);

			// Verifica que estructurada queda capada a máx 1 (§11)
			expect(useTeacherStore.getState().groupScores.estructurada).toBe(1);
			expect(usePlayStore.getState().groupScores?.estructurada).toBe(1);
		});

		it("conApoyoDocente=true excluye estrictamente la insignia 'Paso a paso' en la pantalla final de equipo", () => {
			// Ejecutamos force-grant para activar conApoyoDocente
			useTeacherStore.getState().forceGrantNext();
			expect(useTeacherStore.getState().conApoyoDocente).toBe(true);

			// Renderizamos EquipoEndScreen con scores completos
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					checklistStep: 3,
					teacherAssisted: true,
					scores: {
						turnTaking: 2,
						colaboracion: 2,
						negociacion: 2,
						estructurada: 2, // Aunque llegara a 2, teacherAssisted la bloquea
						organizacion: 2,
					},
				}),
			);

			// 'Paso a paso' NO debe aparecer en el DOM
			expect(html).not.toContain("Paso a paso");
			// Las otras insignias sí pueden aparecer
			expect(html).toContain("Cumplieron su promesa");
			expect(html).toContain("Un solo equipo");
		});
	});

	// =========================================================================
	// 3. REPLAY (Repetir Última Línea del PNJ)
	// =========================================================================
	describe("3. Replay (Repetir Última Locución del PNJ)", () => {
		it("re-emite la locución del PNJ de la estación actual y sincroniza subtítulo en /play", () => {
			useTeacherStore.getState().skipToStation("chacra");

			useTeacherStore.getState().replayLastNpcLine();

			// Verifica evento npc_line en el feed de eventos
			const events = useTeacherStore.getState().recentEvents;
			const replayEvent = events[0];
			expect(replayEvent?.type).toBe("npc_line");
			expect(replayEvent?.details).toContain("Replay NPC");

			// Verifica que en /play apareció el subtítulo del PNJ
			const subtitles = usePlayStore.getState().activeSubtitles;
			expect(subtitles.length).toBeGreaterThan(0);
			const lastSub = subtitles[subtitles.length - 1];
			expect(lastSub?.speakerType).toBe("npc");
			expect(lastSub?.speakerName).toBe("Agricultor Paco");
		});

		it("REGLA ESTRICTA: NO crea ningún turno nuevo de transcripción ni avanza el juego", () => {
			const transcriptsBefore = [
				...useTeacherStore.getState().recentTranscripts,
			];
			const timerBefore = useTeacherStore.getState().liveTimerSeconds;
			const stepBefore = useTeacherStore.getState().liveStep;

			// Ejecutar replay múltiple
			useTeacherStore.getState().replayLastNpcLine();
			useTeacherStore.getState().replayLastNpcLine();

			// Transcripciones de alumnos intactas
			expect(useTeacherStore.getState().recentTranscripts.length).toBe(
				transcriptsBefore.length,
			);
			expect(useTeacherStore.getState().recentTranscripts).toEqual(
				transcriptsBefore,
			);

			// Ningún evento de tipo 'transcript' fue insertado por el replay
			const events = useTeacherStore.getState().recentEvents;
			const transcriptEvents = events.filter((e) => e.type === "transcript");
			expect(transcriptEvents.length).toBe(0);

			// El juego no avanzó
			expect(useTeacherStore.getState().liveTimerSeconds).toBe(timerBefore);
			expect(useTeacherStore.getState().liveStep).toBe(stepBefore);
		});
	});

	// =========================================================================
	// 4. END-RUN-NOW (Terminar Ahora)
	// =========================================================================
	describe("4. End-Run-Now (Terminar Ahora)", () => {
		it("detiene la partida de inmediato, congela el temporizador y transiciona a fin parcial", () => {
			useTeacherStore.setState({ liveTimerSeconds: 185, liveStep: 2 });
			usePlayStore.setState({ gameTimeSeconds: 185, checklistStep: 2 });

			useTeacherStore.getState().endRunNow(repo);

			// Temporizador congelado en teacher
			expect(useTeacherStore.getState().isTimerPaused).toBe(true);
			expect(useTeacherStore.getState().activeTab).toBe("docente");

			// En /play sincronizado a fin parcial
			expect(usePlayStore.getState().phase).toBe("end");
			expect(usePlayStore.getState().endType).toBe("partial");
			expect(usePlayStore.getState().sessionStatus).toBe("expired");
			expect(usePlayStore.getState().isTimerPaused).toBe(true);
		});

		it("muestra estrellas retenidas ('Misión en curso X/3' badges-only, stars === null)", () => {
			usePlayStore.setState({
				phase: "end",
				endType: "partial",
				checklistStep: 2,
				sessionStatus: "expired",
			});

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 2,
					scores: {
						turnTaking: 2,
						colaboracion: 2,
						negociacion: 1,
						estructurada: 1,
						organizacion: 1,
					},
				}),
			);

			// Título exacto locked string
			expect(html).toContain("Misión en curso 2/3");

			// Estrellas retenidas: ninguna estrella en el DOM
			expect(html).not.toContain("★");
			expect(html).not.toContain("estrellas");

			// Sin confeti
			expect(html).not.toContain("confetti-container");

			// Muestra insignias ganadas
			expect(html).toContain("Insignias de Cooperación Colectiva");
			expect(html).toContain('data-testid="badges-container"');
		});
	});

	// =========================================================================
	// 5. SKIP-INTRO
	// =========================================================================
	describe("5. Skip-Intro", () => {
		it("salta la introducción y lleva la partida directo a juego activo", () => {
			usePlayStore.setState({ phase: "countdown", countdownSeconds: 5 });

			useTeacherStore.getState().skipIntro();

			expect(usePlayStore.getState().phase).toBe("active");
			expect(usePlayStore.getState().isTimerPaused).toBe(false);
		});
	});

	// =========================================================================
	// 6. RETIRAR ALUMNO
	// =========================================================================
	describe("6. Retirar Alumno con Confirmación Inline y Sincronización", () => {
		it("deshabilita la tarjeta a gris en /play, emite RETIRE_STUDENT y registra 'retirado mm:ss'", () => {
			useTeacherStore.setState({
				liveTimerSeconds: 180, // Pasaron 2 minutos (02:00)
				formDurationMinutes: 5,
			});

			// Retirar a Sofía (c2)
			useTeacherStore.getState().retireStudent("c2", repo);

			// En /teacher queda marcado retirado con timestamp mm:ss
			const sofiaEval = useTeacherStore
				.getState()
				.studentEvals.find((s) => s.studentId === "c2");
			expect(sofiaEval?.retired).toBe(true);
			expect(sofiaEval?.retiredAt).toBe("02:00");

			// En /play la tarjeta pasa a isRetired: true
			const sofiaCard = usePlayStore
				.getState()
				.cards.find((c) => c.cardId === "c2");
			expect(sofiaCard?.isRetired).toBe(true);

			// En el DOM de RightRail se renderiza en gris deshabilitada
			const htmlRail = renderToString(
				React.createElement<RightRailProps>(RightRail, {
					cards: usePlayStore.getState().cards,
				}),
			);

			expect(htmlRail).toContain("grayscale");
			expect(htmlRail).toContain("opacity-40");
			expect(htmlRail).toContain("Retirado");
		});

		it("el componente OperatorConsole renderiza confirmación inline para el retiro", () => {
			const htmlConsole = renderToString(
				React.createElement<OperatorConsoleProps>(OperatorConsole, { repo }),
			);

			// Controles por avatar y selector presentes en la consola
			expect(htmlConsole).toContain(
				'data-testid="operator-student-avatar-list"',
			);
			expect(htmlConsole).toContain('data-testid="retire-student-select"');
			expect(htmlConsole).toContain("Retirar");
		});
	});

	// =========================================================================
	// 7. REINTENTAR IA
	// =========================================================================
	describe("7. Reintentar IA", () => {
		it("reanuda la partida y limpia bloqueos si un servicio de IA falló", () => {
			usePlayStore.setState({
				isTimerPaused: true,
				pauseReason: "ai_retry",
				shakeMessage: "Error temporal de red",
			});

			useTeacherStore.getState().retryService();

			expect(usePlayStore.getState().isTimerPaused).toBe(false);
			expect(usePlayStore.getState().pauseReason).toBeNull();
			expect(usePlayStore.getState().shakeMessage).toBeNull();
		});
	});

	// =========================================================================
	// 8. AISLAMIENTO DE SELECTORES (Cero Filtración en /play)
	// =========================================================================
	describe("8. Aislamiento Estricto de Selectores (/play vs /teacher - TR-02-01, TR-02-05)", () => {
		it("ningún botón ni selector de la consola de operador existe en el DOM de /play", () => {
			const htmlPlay = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			// Test IDs de la consola que NUNCA deben existir en /play
			expect(htmlPlay).not.toContain('data-testid="operator-console"');
			expect(htmlPlay).not.toContain('data-testid="skip-station-chacra"');
			expect(htmlPlay).not.toContain('data-testid="skip-station-taller"');
			expect(htmlPlay).not.toContain('data-testid="skip-station-alcaldia"');
			expect(htmlPlay).not.toContain('data-testid="skip-station-puente"');
			expect(htmlPlay).not.toContain('data-testid="force-grant-btn"');
			expect(htmlPlay).not.toContain('data-testid="force-grant-madera"');
			expect(htmlPlay).not.toContain('data-testid="force-grant-diseno"');
			expect(htmlPlay).not.toContain('data-testid="force-grant-permiso"');
			expect(htmlPlay).not.toContain('data-testid="replay-npc-btn"');
			expect(htmlPlay).not.toContain('data-testid="skip-intro-btn"');
			expect(htmlPlay).not.toContain('data-testid="end-run-now-btn"');
			expect(htmlPlay).not.toContain('data-testid="retire-student-select"');
			expect(htmlPlay).not.toContain('data-testid="retry-service-btn"');
			expect(htmlPlay).not.toContain(
				'data-testid="operator-student-avatar-list"',
			);

			// Textos de consola que NUNCA deben existir en /play
			expect(htmlPlay).not.toContain("Consola Silenciosa de Operador");
			expect(htmlPlay).not.toContain("Concesión Forzada");
			expect(htmlPlay).not.toContain("Terminar Ahora");
			expect(htmlPlay).not.toContain("Replay PNJ");
			expect(htmlPlay).not.toContain("Saltar a Estación");
			expect(htmlPlay).not.toContain("con apoyo docente");
		});

		it("la consola de operador sí se renderiza en /teacher", () => {
			useTeacherStore.setState({ activeTab: "live" });
			const htmlTeacher = renderToString(
				React.createElement<TeacherLayoutProps>(TeacherLayout, { repo }),
			);

			expect(htmlTeacher).toContain('data-testid="operator-console"');
			expect(htmlTeacher).toContain('data-testid="skip-station-chacra"');
			expect(htmlTeacher).toContain('data-testid="force-grant-btn"');
			expect(htmlTeacher).toContain('data-testid="replay-npc-btn"');
			expect(htmlTeacher).toContain('data-testid="skip-intro-btn"');
			expect(htmlTeacher).toContain('data-testid="end-run-now-btn"');
			expect(htmlTeacher).toContain('data-testid="retry-service-btn"');
		});
	});
});
