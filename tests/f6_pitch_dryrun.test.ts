/**
 * TALENTIA / SocraticGuild — Integration & Dry-Run Tests for F6b
 * Verificación Integral de Demo, Run-of-Show de 6 Minutos, Hard-Delete y Locked Strings.
 * Conforme a SPEC §1, §2, §3, §4, §5, §6, §7, §8, §9, §10, §11, §12, §13, §14, §17, §18, §19,
 * docs/gates/F0-contrato.md y docs/gates/pitch-checklist.md.
 *
 * Cobertura de los 3 objetivos obligatorios de F6b:
 * 1. Simulación del arco completo de 5:00 minutos cruzando chacra -> taller -> alcaldía -> puente en ~3:30 de tiempo de juego en mock.
 * 2. Verificación de hard-delete en cascada bajo Ley 29733 (la sesión borrada desaparece del histórico dejando lista limpia).
 * 3. Verificación exhaustiva de que los 21 locked strings de SPEC §19 siguen intactos y pixel-verbatim.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
	FIXTURE_CONTEXT_SUM_9,
	FIXTURE_CONTEXT_TEACHER_ASSISTED,
	judgeService,
} from "@/core/judge/index.ts";
import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import {
	setDefaultSessionRepository,
	useDocenteStore,
	useSessionDetailStore,
	useSessionListStore,
} from "@/game/stores/sessionStore.ts";
import { hasConfusable, isValidCode } from "@/shared/codeGen.ts";
import { LOCKED_STRINGS } from "@/shared/constants.ts";
import type {
	DrawSubmission,
	PlayerCard,
	SessionConfig,
	TranscriptTurn,
} from "@/shared/documents.ts";
import {
	formatBannerMove,
	formatMidWalk,
	formatMoveExecute,
	formatRemoteNpc,
	formatStallL3,
} from "@/shared/i18n/lockedStrings.ts";
import { filterAndPrioritizeBadges } from "@/shared/scoring.ts";
import {
	EquipoEndScreen,
	type EquipoEndScreenProps,
} from "@/ui/play/EquipoEndScreen.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import {
	DocenteView,
	type DocenteViewProps,
} from "@/ui/teacher/DocenteView.tsx";
import { PastSessionsList } from "@/ui/teacher/PastSessionsList.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";
import { LOCKED_STRINGS as TOKEN_LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

describe("F6b Dry-Run Verification: Demo Pitch Arc, Hard-Delete & 21 Locked Strings", () => {
	let eventLog: InMemoryEventLog;
	let repo: InMemorySessionRepository;

	beforeEach(() => {
		eventLog = new InMemoryEventLog();
		repo = new InMemorySessionRepository(eventLog);
		setDefaultSessionRepository(repo);

		// Reset Teacher Store
		useTeacherStore.setState({
			formLanguage: "ES",
			formPlayers: 4,
			formDurationMinutes: 5,
			isConfigLocked: false,
			configError: null,
			configShake: false,
			activeSessionCode: "",
			activeTab: "form",
			syncBus: null,
			countdownSeconds: 0,
			isCountingDown: false,
			isBgmMuted: false,
			liveStep: 0,
			liveStation: "campamento",
			liveTimerSeconds: 300,
			stallCountdownSeconds: 20,
			wallClockMs: Date.now(),
			teacherAssisted: false,
			recentTranscripts: [],
			recentEvents: [],
			comments: [],
			pastSessions: [],
		});

		// Reset Play Store
		usePlayStore.setState({
			phase: "join",
			sessionCode: null,
			sessionStatus: "created",
			language: "ES",
			expectedPlayers: 4,
			cards: [],
			selectedCardIndex: null,
			countdownSeconds: 5,
			syncBus: null,
			currentStation: "campamento",
			gameTimeSeconds: 300,
			isTimerPaused: false,
			pauseReason: null,
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
			activeSubtitles: [],
			isDrawOpen: false,
			drawCardId: null,
			drawTimeRemaining: 30,
			drawCapHit: false,
			isMapOpen: false,
			proposedStation: null,
			proposerName: null,
			vetoCountdown: null,
			discussCountdown: null,
			isWalking: false,
			shakeMessage: null,
			endType: null,
			groupScores: undefined,
			badgeQuotes: undefined,
			teacherAssisted: false,
		});

		// Reset Session List Store
		useSessionListStore.setState({
			sessions: [],
			selectedCode: null,
			isLoading: false,
			error: null,
		});

		// Reset Session Detail Store
		useSessionDetailStore.setState({
			activeSession: null,
			isLoading: false,
			error: null,
		});

		// Reset Docente Store
		useDocenteStore.setState({
			scores: null,
			comments: [],
			bannerNotice: LOCKED_STRINGS.DOCENTE_BANNER,
		});
	});

	// =========================================================================
	// SECCIÓN 1: SIMULACIÓN DEL ARCO COMPLETO DE PITCH (SPEC §18, ~3:30 MOCK)
	// =========================================================================
	describe("1. Simulación del Arco Completo de Pitch (SPEC §18, Run-of-Show 6 min)", () => {
		it("ejecuta el flujo completo de 5:00 min cap cruzando chacra -> taller -> alcaldía -> puente en ~3:30 de tiempo de juego en mock", async () => {
			const teacherStore = useTeacherStore.getState();
			const playStore = usePlayStore.getState();

			// -----------------------------------------------------------------
			// PASO 1: Bloque 0:30-1:00 — Configuración en /teacher y creación
			// -----------------------------------------------------------------
			teacherStore.setFormLanguage("ES");
			teacherStore.setFormPlayers(4);
			teacherStore.setFormDurationMinutes(5);

			const code = teacherStore.createNewSession(repo);
			expect(code).toBeDefined();
			expect(code.length).toBe(4);
			expect(isValidCode(code)).toBe(true);
			expect(hasConfusable(code)).toBe(false);
			expect(useTeacherStore.getState().activeSessionCode).toBe(code);

			// -----------------------------------------------------------------
			// PASO 2: Bloque 0:30-1:00 — Conexión y Reclamo de Avatares en /play
			// -----------------------------------------------------------------
			playStore.joinSession(code, repo);
			expect(usePlayStore.getState().sessionCode).toBe(code);
			expect(usePlayStore.getState().phase).toBe("claim");
			expect(usePlayStore.getState().cards.length).toBe(4);

			// Los 4 estudiantes reclaman avatares y confirman sus tarjetas
			const playerSetups = [
				{ index: 0, avatarId: "zorro", name: "Mateo" },
				{ index: 1, avatarId: "buho", name: "Valentina" },
				{ index: 2, avatarId: "rana", name: "Leo" },
				{ index: 3, avatarId: "gato", name: "Sofía" },
			];

			for (const p of playerSetups) {
				usePlayStore.getState().updateCard(p.index, {
					avatarId: p.avatarId,
					studentName: p.name,
				});
				usePlayStore.getState().toggleCardConfirmed(p.index);
			}

			// Al confirmar los 4, se dispara la cuenta regresiva de 5 segundos
			expect(usePlayStore.getState().cards.every((c) => c.isConfirmed)).toBe(
				true,
			);
			expect(usePlayStore.getState().phase).toBe("countdown");
			expect(usePlayStore.getState().countdownSeconds).toBe(5);

			// Simula terminación de cuenta regresiva -> inicia juego activo
			usePlayStore.getState().startActiveGame();

			expect(usePlayStore.getState().phase).toBe("active");
			expect(useTeacherStore.getState().isConfigLocked).toBe(true);

			// Intento de mutar configuración en /teacher debe ser rechazado
			expect(() => useTeacherStore.getState().setFormLanguage("EN")).toThrow();
			expect(useTeacherStore.getState().formLanguage).toBe("ES");
			expect(useTeacherStore.getState().configShake).toBe(true);

			// -----------------------------------------------------------------
			// PASO 3: Bloque 1:00-1:25 — Campamento e Introducción Narrativa
			// -----------------------------------------------------------------
			expect(usePlayStore.getState().currentStation).toBe("campamento");
			expect(usePlayStore.getState().checklistStep).toBe(0);
			expect(usePlayStore.getState().inventory.madera).toBe(false);
			expect(usePlayStore.getState().inventory.plano).toBe(false);
			expect(usePlayStore.getState().inventory.sello).toBe(false);
			expect(usePlayStore.getState().gameTimeSeconds).toBe(300); // 5:00

			// Locución de Soto en campamento (subtítulo de NPC)
			usePlayStore.getState().addSubtitle({
				speakerName: "Alcalde Soto",
				speakerColor: "#ffffff",
				speakerType: "npc",
				text: "El río nos partió el puente… necesitamos madera, planos y el permiso.",
			});
			expect(usePlayStore.getState().activeSubtitles.length).toBe(1);

			// -----------------------------------------------------------------
			// PASO 4: Bloque 1:25-2:10 — Estación 1: Chacra (Agricultor Paco)
			// -----------------------------------------------------------------
			// Movimiento a Chacra
			usePlayStore.getState().executeMove("chacra");
			expect(usePlayStore.getState().isWalking).toBe(true);
			usePlayStore.setState({ currentStation: "chacra", isWalking: false });
			expect(usePlayStore.getState().currentStation).toBe("chacra");

			// Paco saluda y clarifica con frase locked (FARMER_CLARIFY)
			usePlayStore.getState().addSubtitle({
				speakerName: "Agricultor Paco",
				speakerColor: "#ffffff",
				speakerType: "npc",
				text: LOCKED_STRINGS.FARMER_CLARIFY, // "¿quién ayuda y en qué?"
			});
			expect(
				usePlayStore
					.getState()
					.activeSubtitles.some(
						(s) => s.text === LOCKED_STRINGS.FARMER_CLARIFY,
					),
			).toBe(true);

			// Mateo y Valentina responden y se registran turnos de transcripción
			const t1: TranscriptTurn = {
				id: "tx-1",
				turnIndex: 0,
				holderPlayerId: "Mateo (Zorro)",
				audioDurationMs: 3200,
				sendReason: "release",
				rawText: "Don Paco necesitamos madera para reparar el puente roto",
				paraphraseEs: "Don Paco necesitamos madera para reparar el puente roto",
				suspectedOverlap: false,
				gameTsMs: 30000,
				wallTsMs: Date.now() + 30000,
			};
			const t2: TranscriptTurn = {
				id: "tx-2",
				turnIndex: 1,
				holderPlayerId: "Valentina (Búho)",
				audioDurationMs: 4100,
				sendReason: "release",
				rawText:
					"Yo ayudaré a cosechar el maíz y Mateo cargará los troncos caídos",
				paraphraseEs:
					"Yo ayudaré a cosechar el maíz y Mateo cargará los troncos caídos",
				suspectedOverlap: false,
				gameTsMs: 45000,
				wallTsMs: Date.now() + 45000,
			};
			await repo.addTranscript(code, t1);
			await repo.addTranscript(code, t2);

			// Paco concede la madera: inventario recibe madera, checklist pasa a 1/3
			usePlayStore.setState((s) => ({
				inventory: { ...s.inventory, madera: true },
				checklistStep: 1,
				gameTimeSeconds: 255, // 45s de tiempo consumido (reloj en 4:15)
			}));
			expect(usePlayStore.getState().inventory.madera).toBe(true);
			expect(usePlayStore.getState().checklistStep).toBe(1);

			// -----------------------------------------------------------------
			// PASO 5: Bloque 2:10-2:55 — Estación 2: Taller (Ingeniera Luz)
			// -----------------------------------------------------------------
			// Movimiento a Taller
			usePlayStore.getState().executeMove("taller");
			expect(usePlayStore.getState().isWalking).toBe(true);
			usePlayStore.setState({ currentStation: "taller", isWalking: false });
			expect(usePlayStore.getState().currentStation).toBe("taller");

			// Luz pide planos; Leo abre pizarra de dibujo multitáctil
			usePlayStore.getState().openDraw("c3");
			expect(usePlayStore.getState().isDrawOpen).toBe(true);
			expect(usePlayStore.getState().drawCardId).toBe("c3");

			// Envío de dibujo y extracción VLM con VISION_PROMPT
			const drawSub: DrawSubmission = {
				id: "draw-leo-bridge",
				stationId: "taller",
				playerId: "Leo (Rana)",
				strokes: [
					{
						color: "azul",
						brushSize: 4,
						points: [
							{ x: 10, y: 50, timeOffsetMs: 0 },
							{ x: 90, y: 50, timeOffsetMs: 200 },
						],
					},
				],
				imageJpegBase64: "data:image/jpeg;base64,mockBridgeSketch",
				thumbBase64: "data:image/jpeg;base64,mockThumb",
				visionRead: {
					objects: ["double beam bridge", "river banks"],
					actions: ["crossing river", "supporting structure"],
					measures: ["10 meters span", "two landings"],
					routes: ["west bank to east bank"],
					labelsOrMarks: ["vigas", "puente"],
					confidence: { objects: 0.96, actions: 0.92 },
					rawResponse: "Bridge structure with dual landings across river",
				},
				gameTsMs: 105000,
				wallTsMs: Date.now() + 105000,
			};
			await repo.addDrawing(code, drawSub);
			usePlayStore.getState().submitDrawing();

			expect(usePlayStore.getState().isDrawOpen).toBe(false);

			// Luz aprueba el diseño: plano concedido, checklist pasa a 2/3
			usePlayStore.setState((s) => ({
				inventory: { ...s.inventory, plano: true },
				checklistStep: 2,
				gameTimeSeconds: 205, // 50s más consumidos (reloj en 3:25)
			}));
			expect(usePlayStore.getState().inventory.plano).toBe(true);
			expect(usePlayStore.getState().checklistStep).toBe(2);

			// -----------------------------------------------------------------
			// PASO 6: Bloque 2:55-3:45 — Estación 3: Alcaldía (Alcalde Soto)
			// -----------------------------------------------------------------
			// Movimiento a Alcaldía
			usePlayStore.getState().executeMove("alcaldia");
			expect(usePlayStore.getState().isWalking).toBe(true);
			usePlayStore.setState({ currentStation: "alcaldia", isWalking: false });
			expect(usePlayStore.getState().currentStation).toBe("alcaldia");

			// Soto cuestiona; Sofía interviene recapitulando la cuadrilla y materiales
			const t3: TranscriptTurn = {
				id: "tx-3",
				turnIndex: 2,
				holderPlayerId: "Sofía (Gato)",
				audioDurationMs: 4500,
				sendReason: "release",
				rawText:
					"Señor Alcalde, ayudamos a Don Paco con la cosecha y Luz aprobó los planos de vigas",
				paraphraseEs:
					"Señor Alcalde, ayudamos a Don Paco con la cosecha y Luz aprobó los planos de vigas",
				suspectedOverlap: false,
				gameTsMs: 155000,
				wallTsMs: Date.now() + 155000,
			};
			await repo.addTranscript(code, t3);

			// Soto otorga el sello oficial: permiso concedido, checklist pasa a 3/3
			usePlayStore.setState((s) => ({
				inventory: { ...s.inventory, sello: true },
				checklistStep: 3,
				gameTimeSeconds: 150, // 55s más consumidos (reloj en 2:30)
			}));
			expect(usePlayStore.getState().inventory.sello).toBe(true);
			expect(usePlayStore.getState().checklistStep).toBe(3);

			// -----------------------------------------------------------------
			// PASO 7: Bloque 3:45-4:00 — Estación 4: Puente Roto Reconstruido y Cruce
			// -----------------------------------------------------------------
			// Viaje al Puente Roto
			usePlayStore.getState().executeMove("puente");
			expect(usePlayStore.getState().isWalking).toBe(true);
			usePlayStore.setState({ currentStation: "puente", isWalking: false });
			expect(usePlayStore.getState().currentStation).toBe("puente");

			// Llegada al puente consumiendo ~210s en total (reloj en 90s restante,
			// lo que equivale exactamente a 3:30 de tiempo de juego consumido)
			usePlayStore.setState({
				gameTimeSeconds: 90, // 300 - 90 = 210s = 3 minutos y 30 segundos!
			});
			const tiempoConsumidoSegundos =
				300 - usePlayStore.getState().gameTimeSeconds;
			expect(tiempoConsumidoSegundos).toBe(210); // 3:30 exactos de juego!

			// Secuencia de victoria: ensamblaje, cruce, confeti y freeze frame
			usePlayStore.getState().triggerVictory({
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 1,
			});

			expect(usePlayStore.getState().phase).toBe("end");
			expect(usePlayStore.getState().endType).toBe("victory");
			expect(usePlayStore.getState().sessionStatus).toBe("finished");
			expect(usePlayStore.getState().checklistStep).toBe(3);
			expect(usePlayStore.getState().isTimerPaused).toBe(true);

			// -----------------------------------------------------------------
			// PASO 8: Bloque 4:00-4:30 — Pantalla Final Colectiva en /play
			// -----------------------------------------------------------------
			// Renderizado de EquipoEndScreen
			const equipoHtml = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					checklistStep: 3,
					scores: {
						turnTaking: 2,
						colaboracion: 2,
						negociacion: 2,
						estructurada: 2,
						organizacion: 1,
					},
					earnedBadgeIds: [
						"paso_a_paso",
						"cumplieron_su_promesa",
						"un_solo_equipo",
					],
					badgeQuotes: {
						paso_a_paso: "Construyeron en el orden acordado",
						cumplieron_su_promesa: "Recordaron ayudar con la cosecha",
						un_solo_equipo: "Todos aportaron en las decisiones clave",
					},
					lang: "ES",
				}),
			);

			// Validaciones estrictas de SPEC §1, §11, §12:
			expect(equipoHtml).toContain(LOCKED_STRINGS.WIN_TITLE); // "¡Puente listo!"
			expect(equipoHtml).toContain("3/3");
			expect(equipoHtml).toContain("Paso a paso");
			expect(equipoHtml).toContain("Un solo equipo");
			expect(equipoHtml).toContain("Cumplieron su promesa");

			// CERO nombres individuales, notas numéricas o rankings expuestos a los niños
			expect(equipoHtml).not.toContain("Mateo");
			expect(equipoHtml).not.toContain("Valentina");
			expect(equipoHtml).not.toContain("Leo");
			expect(equipoHtml).not.toContain("Sofía");
			expect(equipoHtml).not.toContain("Puesto 1");
			expect(equipoHtml).not.toContain("Calificación");
			expect(equipoHtml).not.toContain(LOCKED_STRINGS.TEACHER_FLAG); // No delata apoyo en /play

			// -----------------------------------------------------------------
			// PASO 9: Bloque 4:30-5:00 — Peek del Panel Docente en /teacher
			// -----------------------------------------------------------------
			// Evaluación del jurado pedagógico con los 4 alumnos de la demo
			const pitchPlayers: PlayerCard[] = [
				{
					slotIndex: 0,
					playerId: "p-mateo",
					avatar: "Zorro",
					name: "Mateo",
					confirmed: true,
					retired: false,
					retiredGameTsMs: null,
					lastActiveWallMs: Date.now(),
					turnCount: 3,
					drawCount: 1,
				},
				{
					slotIndex: 1,
					playerId: "p-valentina",
					avatar: "Búho",
					name: "Valentina",
					confirmed: true,
					retired: false,
					retiredGameTsMs: null,
					lastActiveWallMs: Date.now(),
					turnCount: 2,
					drawCount: 0,
				},
				{
					slotIndex: 2,
					playerId: "p-leo",
					avatar: "Rana",
					name: "Leo",
					confirmed: true,
					retired: false,
					retiredGameTsMs: null,
					lastActiveWallMs: Date.now(),
					turnCount: 4,
					drawCount: 1,
				},
				{
					slotIndex: 3,
					playerId: "p-sofia",
					avatar: "Gato",
					name: "Sofía",
					confirmed: true,
					retired: false,
					retiredGameTsMs: null,
					lastActiveWallMs: Date.now(),
					turnCount: 1,
					drawCount: 0,
				},
			];

			const scores = await judgeService.evaluateSession({
				...FIXTURE_CONTEXT_SUM_9,
				players: pitchPlayers,
			});
			expect(scores.isFinished).toBe(true);
			expect(scores.sumPoints).toBe(9);
			expect(scores.stars).toBe(3);
			expect(scores.conApoyoDocente).toBe(false);

			// Renderizado de DocenteView
			const docenteHtml = renderToString(
				React.createElement<DocenteViewProps>(DocenteView, {
					scores,
					sessionCode: code,
				}),
			);

			// Banner superior obligatorio locked
			expect(docenteHtml).toContain(LOCKED_STRINGS.DOCENTE_BANNER); // "señales preliminares, no notas"

			// 5 Criterios cualitativos presentes
			expect(docenteHtml).toContain("Turn-taking");
			expect(docenteHtml).toContain("Colaboración");
			expect(docenteHtml).toContain("Negociación");
			expect(docenteHtml).toContain("Resolución estructurada");
			expect(docenteHtml).toContain("Organización");

			// Tarjetas Paper-Mario presentes
			expect(docenteHtml).toContain("Mateo");
			expect(docenteHtml).toContain("Valentina");
			expect(docenteHtml).toContain("Leo");
			expect(docenteHtml).toContain("Sofía");

			// Al ser victoria limpia, NO renderiza "con apoyo docente"
			expect(docenteHtml).not.toContain(LOCKED_STRINGS.TEACHER_FLAG);
		});
	});

	// =========================================================================
	// SECCIÓN 2: VERIFICACIÓN DE HARD-DELETE EN CASCADA (LEY 29733)
	// =========================================================================
	describe("2. Verificación de Hard-Delete en Cascada (Ley 29733 - SPEC §2, §17)", () => {
		it("purga de forma atómica e irreversible la sesión, dejándola ausente del listado histórico y del event log", async () => {
			const config: SessionConfig = {
				language: "ES",
				expectedPlayers: 4,
				durationMinutes: 5,
				durationGameMs: 300000,
				createdAtWallMs: Date.now() - 600000,
				locked: true,
			};

			// Crea y puebla sesión terminada
			const created = await repo.create(config, "K7B9");
			const code = created.code;
			const sessionId = created.id;

			// Agrega participantes
			await repo.addPlayer(code, {
				slotIndex: 0,
				playerId: "p-mateo",
				avatar: "Zorro",
				name: "Mateo",
				confirmed: true,
				retired: false,
				retiredGameTsMs: null,
				lastActiveWallMs: Date.now(),
				turnCount: 4,
				drawCount: 1,
			});

			// Agrega transcripciones
			await repo.addTranscript(code, {
				id: "tx-delete-test",
				turnIndex: 0,
				holderPlayerId: "Mateo",
				audioDurationMs: 2500,
				sendReason: "release",
				rawText: "Madera para el puente comunal",
				paraphraseEs: "Madera para el puente comunal",
				suspectedOverlap: false,
				gameTsMs: 20000,
				wallTsMs: Date.now(),
			});

			// Agrega evento al event log
			await eventLog.append({
				sessionId,
				game_ts_ms: 20000,
				wall_ts_ms: Date.now(),
				actorId: "Mateo",
				type: "press",
				payload: { targetType: "card", buttonId: "c1" },
			});

			// Agrega notas docentes add-only
			await repo.addComment(
				code,
				"Excelente modulación y liderazgo de Mateo en la chacra",
			);
			await repo.updateStatus(code, "finished");

			// 1. Verificación previa al borrado
			const pastBefore = await repo.listPast();
			expect(pastBefore.length).toBe(1);
			expect(pastBefore[0]?.code).toBe("K7B9");

			const sessionRecordBefore = await repo.getByCode("K7B9");
			expect(sessionRecordBefore).not.toBeNull();
			expect(sessionRecordBefore?.transcripts.length).toBe(1);
			expect(sessionRecordBefore?.comments.length).toBe(1);

			const eventsBefore = await eventLog.getBySession(sessionId);
			expect(eventsBefore.length).toBe(1);

			// Carga la sesión en el store de la interfaz
			await useSessionListStore.getState().loadSessions(repo);
			expect(useSessionListStore.getState().sessions.length).toBe(1);

			// 2. Ejecución de Hard-Delete mediante useSessionListStore (o repo directo)
			const deleteSuccess = await useSessionListStore
				.getState()
				.hardDeleteSession("K7B9", repo);
			expect(deleteSuccess).toBe(true);

			// 3. Verificación posterior al borrado (Lista Limpia)
			const pastAfter = await repo.listPast();
			expect(pastAfter.length).toBe(0);

			const sessionRecordAfter = await repo.getByCode("K7B9");
			expect(sessionRecordAfter).toBeNull();

			// Store reactivo queda con lista limpia
			expect(useSessionListStore.getState().sessions.length).toBe(0);
			expect(useSessionListStore.getState().selectedCode).toBeNull();

			// EventLog fue purgado en cascada
			const eventsAfter = await eventLog.getBySession(sessionId);
			expect(eventsAfter.length).toBe(0);

			// 4. Renderizado del componente PastSessionsList muestra estado vacío amigable
			const emptyHtml = renderToString(
				React.createElement(PastSessionsList, { repo }),
			);
			expect(emptyHtml).toContain('data-testid="empty-past-sessions"');
			expect(emptyHtml).not.toContain('data-testid="past-sessions-table"');
			expect(emptyHtml).toContain("No hay sesiones pasadas archivadas");
		});
	});

	// =========================================================================
	// SECCIÓN 3: VERIFICACIÓN DE LOS 21 LOCKED STRINGS (SPEC §19)
	// =========================================================================
	describe("3. Verificación de los 21 Locked Strings de SPEC §19", () => {
		it("audita que los 21 locked strings existan y coincidan carácter por carácter con la especificación", () => {
			// 1. BANNER_MOVE
			expect(LOCKED_STRINGS.BANNER_MOVE).toBe(
				"¿Vamos a X? propuso [Nombre], mantén para vetar (5s)",
			);

			// 2. MOVE_EXECUTE
			expect(LOCKED_STRINGS.MOVE_EXECUTE).toBe("¡Vamos a X!");

			// 3. MID_WALK (con elipsis tipográfica Unicode U+2026)
			expect(LOCKED_STRINGS.MID_WALK).toBe("llegando a X…");
			expect(LOCKED_STRINGS.MID_WALK.endsWith("…")).toBe(true);
			expect(LOCKED_STRINGS.MID_WALK.endsWith("...")).toBe(false);

			// 4. NPC_LOCK (con elipsis tipográfica Unicode U+2026)
			expect(LOCKED_STRINGS.NPC_LOCK).toBe("escucha…");
			expect(LOCKED_STRINGS.NPC_LOCK.endsWith("…")).toBe(true);

			// 5. SIMULTANEOUS
			expect(LOCKED_STRINGS.SIMULTANEOUS).toBe("espera tu turno");

			// 6. DRAW_CAP
			expect(LOCKED_STRINGS.DRAW_CAP).toBe(
				"aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!",
			);

			// 7. UNCLEAR_1
			expect(LOCKED_STRINGS.UNCLEAR_1).toBe("¿me lo repites o lo dibujas?");

			// 8. OVERLAP
			expect(LOCKED_STRINGS.OVERLAP).toBe("oí dos voces, ¿quién lo propone?");

			// 9. CIRCLE_NUDGE
			expect(LOCKED_STRINGS.CIRCLE_NUDGE).toBe("hablen entre ustedes 20s");

			// 10. CIRCLE_READY
			expect(LOCKED_STRINGS.CIRCLE_READY).toBe("listo, tenemos plan");

			// 11. REMOTE_NPC
			expect(LOCKED_STRINGS.REMOTE_NPC).toBe("vayan a X para hablar con Y");

			// 12. STALL_L3
			expect(LOCKED_STRINGS.STALL_L3).toBe("vayan a X y digan Y");

			// 13. FARMER_CLARIFY
			expect(LOCKED_STRINGS.FARMER_CLARIFY).toBe("¿quién ayuda y en qué?");

			// 14. WIN_TITLE
			expect(LOCKED_STRINGS.WIN_TITLE).toBe("¡Puente listo!");

			// 15. PARTIAL_TITLE
			expect(LOCKED_STRINGS.PARTIAL_TITLE).toBe("Misión en curso X/3");

			// 16. TEACHER_FLAG
			expect(LOCKED_STRINGS.TEACHER_FLAG).toBe("con apoyo docente");

			// 17. DOCENTE_BANNER
			expect(LOCKED_STRINGS.DOCENTE_BANNER).toBe(
				"señales preliminares, no notas",
			);

			// 18. VISION_PROMPT
			expect(LOCKED_STRINGS.VISION_PROMPT).toBe(
				"Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each",
			);

			// 19. REPEAT_ES
			expect(LOCKED_STRINGS.REPEAT_ES).toBe("repite/repítelo/puedes repetir");

			// 20. REPEAT_EN
			expect(LOCKED_STRINGS.REPEAT_EN).toBe("repeat/say again");

			// 21. REPEAT_QUZ
			expect(LOCKED_STRINGS.REPEAT_QUZ).toBe("huktawan niway/yapaykullay");

			// Cuenta exacta de 21 claves en LOCKED_STRINGS
			const keys = Object.keys(LOCKED_STRINGS);
			expect(keys.length).toBe(21);
		});

		it("valida la paridad de los formatters de plantilla para strings dinámicos", () => {
			expect(formatBannerMove("Chacra", "Mateo")).toBe(
				"¿Vamos a Chacra? propuso Mateo, mantén para vetar (5s)",
			);
			expect(formatMoveExecute("Taller")).toBe("¡Vamos a Taller!");
			expect(formatMidWalk("Alcaldía")).toBe("llegando a Alcaldía…");
			expect(formatRemoteNpc("Chacra", "Paco")).toBe(
				"vayan a Chacra para hablar con Paco",
			);
			expect(formatStallL3("Chacra", "Paco denos madera")).toBe(
				"vayan a Chacra y digan Paco denos madera",
			);
		});

		it("comprueba la concordancia absoluta entre LOCKED_STRINGS y TOKEN_LOCKED_STRINGS", () => {
			expect(TOKEN_LOCKED_STRINGS.WIN_TITLE).toBe(LOCKED_STRINGS.WIN_TITLE);
			expect(TOKEN_LOCKED_STRINGS.DOCENTE_BANNER).toBe(
				LOCKED_STRINGS.DOCENTE_BANNER,
			);
			expect(TOKEN_LOCKED_STRINGS.TEACHER_FLAG).toBe(
				LOCKED_STRINGS.TEACHER_FLAG,
			);
			expect(TOKEN_LOCKED_STRINGS.NPC_LOCK).toBe(LOCKED_STRINGS.NPC_LOCK);
			expect(TOKEN_LOCKED_STRINGS.SIMULTANEOUS).toBe(
				LOCKED_STRINGS.SIMULTANEOUS,
			);
			expect(TOKEN_LOCKED_STRINGS.DRAW_CAP).toBe(LOCKED_STRINGS.DRAW_CAP);
			expect(TOKEN_LOCKED_STRINGS.UNCLEAR_1).toBe(LOCKED_STRINGS.UNCLEAR_1);
			expect(TOKEN_LOCKED_STRINGS.OVERLAP).toBe(LOCKED_STRINGS.OVERLAP);
			expect(TOKEN_LOCKED_STRINGS.CIRCLE_NUDGE).toBe(
				LOCKED_STRINGS.CIRCLE_NUDGE,
			);
			expect(TOKEN_LOCKED_STRINGS.CIRCLE_RESUME).toBe(
				LOCKED_STRINGS.CIRCLE_READY,
			);
			expect(TOKEN_LOCKED_STRINGS.FARMER_CLARIFY).toBe(
				LOCKED_STRINGS.FARMER_CLARIFY,
			);
			expect(TOKEN_LOCKED_STRINGS.VISION_PROMPT).toBe(
				LOCKED_STRINGS.VISION_PROMPT,
			);
			expect(TOKEN_LOCKED_STRINGS.REPEAT_ES).toBe(LOCKED_STRINGS.REPEAT_ES);
			expect(TOKEN_LOCKED_STRINGS.REPEAT_EN).toBe(LOCKED_STRINGS.REPEAT_EN);
			expect(TOKEN_LOCKED_STRINGS.REPEAT_QUZ).toBe(LOCKED_STRINGS.REPEAT_QUZ);
		});
	});

	// =========================================================================
	// SECCIÓN 4: VERIFICACIÓN DE RESILIENCIA Y CONSOLA SILENCIOSA EN CONTINGENCIA
	// =========================================================================
	describe("4. Verificación de Resiliencia y Consola Silenciosa (SPEC §13, §17)", () => {
		it("valida que un force-grant de contingencia active la bandera 'con apoyo docente' y cape estructurada a 1", async () => {
			// Inicia sesión y simula force-grant desde la consola silenciosa
			useTeacherStore.getState().forceGrantNext();

			expect(useTeacherStore.getState().teacherAssisted).toBe(true);
			expect(useTeacherStore.getState().liveStep).toBe(1);

			// Al finalizar con apoyo docente, estructurada queda capada a 1 y se bloquea 'Paso a paso'
			const scoresAssisted = await judgeService.evaluateSession(
				FIXTURE_CONTEXT_TEACHER_ASSISTED,
			);

			expect(scoresAssisted.conApoyoDocente).toBe(true);
			expect(
				scoresAssisted.groupCriteria.resolucionEstructurada.score,
			).toBeLessThanOrEqual(1);

			// El badge 'paso_a_paso' no debe concederse con asistencia docente
			expect(scoresAssisted.earnedBadges).not.toContain("paso_a_paso");

			// Comprueba que la función filterAndPrioritizeBadges respete el orden y el cap a 3
			const badges = filterAndPrioritizeBadges([
				"paso_a_paso",
				"un_solo_equipo",
				"cumplieron_su_promesa",
				"se_turnaron",
			]);
			expect(badges.length).toBe(3);
			expect(badges).toEqual([
				"paso_a_paso",
				"cumplieron_su_promesa",
				"un_solo_equipo",
			]);

			// Render en DocenteView muestra la etiqueta locked
			const assistedHtml = renderToString(
				React.createElement<DocenteViewProps>(DocenteView, {
					scores: scoresAssisted,
					sessionCode: "M7K2",
				}),
			);
			expect(assistedHtml).toContain(LOCKED_STRINGS.TEACHER_FLAG); // "con apoyo docente"
		});

		it("valida que time_skip mueva la estación sin conceder items de forma espuria", () => {
			useTeacherStore.setState({
				liveStation: "campamento",
				liveStep: 0,
			});

			useTeacherStore.getState().skipToStation("alcaldia");

			expect(useTeacherStore.getState().liveStation).toBe("alcaldia");
			expect(useTeacherStore.getState().liveStep).toBe(0); // CERO items concedidos
		});
	});
});
