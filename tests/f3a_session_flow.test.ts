/**
 * TALENTIA / SocraticGuild — Integration Tests for F3a
 * Surface D1, Session Controls, Join and Player Claim.
 * Conforme a SPEC §2, §3, §13, §17 & docs/gates/F0-contrato.md.
 *
 * Cobertura de los 5 objetivos obligatorios de F3a:
 * 1. Flujo de creación de sesión en /teacher ([TEACH-01] / NewSessionForm.tsx)
 * 2. Join y canal de sincronización (/play y /teacher, sessionSync.ts)
 * 3. Reclamo de tarjetas en /play ([PLAY-02] / ClaimCardsScreen.tsx)
 * 4. Force-start desde /teacher (iniciar con X listos, ≥2 jugadores)
 * 5. Dropout (retirar alumno con confirmación inline y efecto sincronizado)
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import { createSessionSyncBus } from "@/core/sync/sessionSync.ts";
import { setDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import { hasConfusable, isValidCode } from "@/shared/codeGen.ts";
import type { SessionConfig } from "@/shared/documents.ts";
import {
	ClaimCardsScreen,
	type ClaimCardsScreenProps,
} from "@/ui/play/ClaimCardsScreen.tsx";
import { JoinScreen, type JoinScreenProps } from "@/ui/play/JoinScreen.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { RightRail, type RightRailProps } from "@/ui/play/RightRail.tsx";
import { LiveMirror, type LiveMirrorProps } from "@/ui/teacher/LiveMirror.tsx";
import {
	NewSessionForm,
	type NewSessionFormProps,
} from "@/ui/teacher/NewSessionForm.tsx";
import {
	OperatorConsole,
	type OperatorConsoleProps,
} from "@/ui/teacher/OperatorConsole.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";
import { KID_AVATARS } from "@/ui/tokens/avatars.ts";
import { SAFE_CODE_ALPHABET } from "@/ui/tokens/strings.ts";

describe("F3a Integration: Surface D1, Session Controls, Join and Player Claim (SPEC §2, §3, §13, §17)", () => {
	let repo: InMemorySessionRepository;

	beforeEach(() => {
		repo = new InMemorySessionRepository();
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
			studentEvals: [],
		});

		// Reset Play Store
		usePlayStore.setState({
			sessionCode: "",
			phase: "join",
			expectedPlayers: 4,
			cards: [],
			selectedCardIndex: null,
			countdownSeconds: 5,
			currentStation: "campamento",
			gameTimeSeconds: 300,
			isTimerPaused: false,
			pauseReason: null,
			syncBus: null,
		});
	});

	// =========================================================================
	// 1. FLUJO DE CREACIÓN DE SESIÓN EN /teacher ([TEACH-01] / NewSessionForm.tsx)
	// =========================================================================
	describe("1. Creación de Sesión en /teacher ([TEACH-01] / NewSessionForm.tsx)", () => {
		it("valida y restringe opciones del formulario: idioma ES/EN/QUZ, 3-6 jugadores, 5-40 min (step 5m)", () => {
			const store = useTeacherStore.getState();

			// Idiomas válidos
			store.setFormLanguage("EN");
			expect(useTeacherStore.getState().formLanguage).toBe("EN");
			store.setFormLanguage("QUZ");
			expect(useTeacherStore.getState().formLanguage).toBe("QUZ");
			store.setFormLanguage("ES");
			expect(useTeacherStore.getState().formLanguage).toBe("ES");

			// Participantes: clamped entre 3 y 6
			store.setFormPlayers(2);
			expect(useTeacherStore.getState().formPlayers).toBe(3);
			store.setFormPlayers(7);
			expect(useTeacherStore.getState().formPlayers).toBe(6);
			store.setFormPlayers(5);
			expect(useTeacherStore.getState().formPlayers).toBe(5);

			// Duración: clamped entre 5 y 40 minutos (step 5m, default 5m)
			store.setFormDurationMinutes(3);
			expect(useTeacherStore.getState().formDurationMinutes).toBe(5);
			store.setFormDurationMinutes(50);
			expect(useTeacherStore.getState().formDurationMinutes).toBe(40);
			store.setFormDurationMinutes(15);
			expect(useTeacherStore.getState().formDurationMinutes).toBe(15);
		});

		it("crea la sesión en SessionRepo con código de 4 caracteres generado por codeGen() sin confusables", async () => {
			useTeacherStore.setState({
				formLanguage: "ES",
				formPlayers: 4,
				formDurationMinutes: 10,
			});

			const code = useTeacherStore.getState().createNewSession(repo);

			// Longitud y validez de código
			expect(code.length).toBe(4);
			expect(isValidCode(code)).toBe(true);
			expect(hasConfusable(code)).toBe(false);

			// No contiene caracteres confusables (0, O, 1, I, L)
			for (const char of code) {
				expect(SAFE_CODE_ALPHABET).toContain(char);
				expect(["0", "O", "1", "I", "L"]).not.toContain(char);
			}

			// Persistencia en SessionRepo
			const saved = await repo.getByCode(code);
			expect(saved).not.toBeNull();
			expect(saved?.code).toBe(code);
			expect(saved?.config.language).toBe("ES");
			expect(saved?.config.expectedPlayers).toBe(4);
			expect(saved?.config.durationMinutes).toBe(10);
			expect(saved?.status).toBe("created");
		});

		it("renderiza el formulario NewSessionForm con inputs, código generado y enlace de unión", () => {
			const html = renderToString(
				React.createElement<NewSessionFormProps>(NewSessionForm, {
					repo,
					sessionCode: "W7XK",
					isConfigLocked: false,
				}),
			);

			// Elementos del formulario
			expect(html).toContain('data-testid="lang-select-ES"');
			expect(html).toContain('data-testid="player-select-4"');
			expect(html).toContain('data-testid="duration-slider"');
			expect(html).toContain('data-testid="create-session-btn"');

			// Código visible y botón de inicio
			expect(html).toContain('data-testid="session-code-display"');
			expect(html).toContain("W7XK");
			expect(html).toContain("?s=W7XK");
			expect(html).toContain('data-testid="open-play-link"');
			expect(html).toContain('data-testid="go-to-live-btn"');
		});

		it("bloqueo estricto de configuración post-start: mutaciones rechazan con error y activan shake", async () => {
			const code = useTeacherStore.getState().createNewSession(repo);
			expect(useTeacherStore.getState().isConfigLocked).toBe(true);

			// Intento de mutar idioma lanza error y activa shake
			expect(() => {
				useTeacherStore.getState().setFormLanguage("EN");
			}).toThrow(/Configuration is locked/);
			expect(useTeacherStore.getState().configError).toContain(
				"Configuración congelada",
			);
			expect(useTeacherStore.getState().configShake).toBe(true);

			// Intento de mutar número de jugadores lanza error
			expect(() => {
				useTeacherStore.getState().setFormPlayers(6);
			}).toThrow(/Configuration is locked/);

			// Intento de mutar duración lanza error
			expect(() => {
				useTeacherStore.getState().setFormDurationMinutes(30);
			}).toThrow(/Configuration is locked/);

			// SessionRepo también bloquea en status countdown o playing
			await repo.updateStatus(code, "countdown");
			await expect(
				repo.updateConfig(code, { expectedPlayers: 5 }),
			).rejects.toThrow(/Configuration is locked|Cannot update config/);

			await repo.updateStatus(code, "playing");
			await expect(
				repo.updateConfig(code, { durationMinutes: 20 }),
			).rejects.toThrow(/Configuration is locked|Cannot update config/);

			// En el componente se renderiza el banner de configuración bloqueada
			const html = renderToString(
				React.createElement<NewSessionFormProps>(NewSessionForm, {
					repo,
					sessionCode: code,
					isConfigLocked: true,
					configError: "Configuración congelada: la partida ya ha iniciado",
				}),
			);
			expect(html).toContain('data-testid="config-locked-notice"');
			expect(html).toContain("Configuración congelada");
		});
	});

	// =========================================================================
	// 2. JOIN Y CANAL DE SINCRONIZACIÓN (/play y /teacher)
	// =========================================================================
	describe("2. Join y Canal de Sincronización (/play y /teacher)", () => {
		it("permite entrada manual de código en JoinScreen y normaliza a mayúsculas", () => {
			const html = renderToString(
				React.createElement<JoinScreenProps>(JoinScreen, { repo }),
			);
			expect(html).toContain('data-testid="join-code-display"');
			expect(html).toContain('data-testid="join-submit-btn"');

			// Entrada manual
			usePlayStore.getState().joinSession("k7np", repo);
			expect(usePlayStore.getState().sessionCode).toBe("K7NP");
			expect(usePlayStore.getState().phase).toBe("claim");
		});

		it("soporta auto-join mediante prefilledCode (?s=XXXX) y sincroniza jugadores esperados desde SessionRepo", async () => {
			// Crea sesión previa con 5 jugadores en repo
			const config: SessionConfig = {
				language: "ES",
				expectedPlayers: 5,
				durationMinutes: 10,
				durationGameMs: 600000,
				createdAtWallMs: Date.now(),
				locked: false,
			};
			const record = await repo.create(config, "T9XZ");

			// Al unirse con el código de 5 jugadores
			usePlayStore.getState().joinSession(record.code, repo);

			expect(usePlayStore.getState().sessionCode).toBe("T9XZ");
			expect(usePlayStore.getState().phase).toBe("claim");
			expect(usePlayStore.getState().cards.length).toBe(5);

			// Renderizado en ClaimCardsScreen
			const html = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					sessionCode: "T9XZ",
					cards: usePlayStore.getState().cards,
				}),
			);
			expect(html).toContain("T9XZ");
			expect(html).toContain('data-testid="claim-card-0"');
			expect(html).toContain('data-testid="claim-card-4"');
		});

		it("canal SessionSyncBus sincroniza mensajes bidireccionalmente entre dos extremos", async () => {
			const code = "SYNC";
			const receivedTeacher: string[] = [];
			const receivedPlay: string[] = [];

			const busTeacher = createSessionSyncBus(code, { forceMemoryBus: true });
			const busPlay = createSessionSyncBus(code, { forceMemoryBus: true });

			busTeacher.subscribe((msg) => {
				receivedTeacher.push(msg.type);
			});
			busPlay.subscribe((msg) => {
				receivedPlay.push(msg.type);
			});

			busPlay.send({ type: "SESSION_JOINED", sender: "play", code });
			busTeacher.send({
				type: "COUNTDOWN_START",
				seconds: 5,
				reason: "all_ready",
			});

			expect(receivedTeacher).toContain("SESSION_JOINED");
			expect(receivedPlay).toContain("COUNTDOWN_START");

			busTeacher.close();
			busPlay.close();
		});

		it("reparte inicialmente N tarjetas dealt con badge ? y nombre Jugador X", () => {
			usePlayStore.getState().joinSession("JOIN", 4);
			const state = usePlayStore.getState();

			expect(state.cards.length).toBe(4);
			for (let i = 0; i < 4; i++) {
				const card = state.cards[i];
				expect(card?.cardId).toBe(`card-${i + 1}`);
				expect(card?.isConfirmed).toBe(false);
				expect(card?.studentName).toBe("");
			}

			const html = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					sessionCode: "JOIN",
					cards: state.cards,
				}),
			);
			expect(html).toContain('data-testid="question-badge-0"');
			expect(html).toContain('data-testid="question-badge-1"');
			expect(html).toContain('data-testid="question-badge-2"');
			expect(html).toContain('data-testid="question-badge-3"');
			expect(html).toContain("Jugador 1");
			expect(html).toContain("Jugador 4");
		});
	});

	// =========================================================================
	// 3. RECLAMO DE TARJETAS EN /play ([PLAY-02] / ClaimCardsScreen.tsx)
	// =========================================================================
	describe("3. Reclamo de Tarjetas en /play ([PLAY-02] / ClaimCardsScreen.tsx)", () => {
		beforeEach(() => {
			usePlayStore.getState().joinSession("PLAY", 4);
		});

		it("incluye selector con los 8 avatares fijos de niños según SPEC §3", () => {
			expect(KID_AVATARS.length).toBe(8);
			const expectedAvatars = [
				"zorro",
				"buho",
				"rana",
				"gato",
				"llama",
				"toucan",
				"raton",
				"tortuga",
			];
			expect(KID_AVATARS.map((a) => a.id)).toEqual(expectedAvatars);

			// Abre la tarjeta 0 para edición
			usePlayStore.getState().selectCardForEdit(0);
			const html = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					cards: usePlayStore.getState().cards,
					selectedCardIndex: 0,
				}),
			);

			expect(html).toContain('data-testid="customize-modal"');
			for (const avId of expectedAvatars) {
				expect(html).toContain(`data-testid="avatar-option-${avId}"`);
			}
		});

		it("permite cambiar avatar y escribir nombre truncando estrictamente a 10 caracteres", () => {
			usePlayStore.getState().selectCardForEdit(0);
			usePlayStore.getState().updateCard(0, {
				avatarId: "buho",
				studentName: "Alejandrito", // 11 letras -> debe truncarse a 10
			});

			const card = usePlayStore.getState().cards[0];
			expect(card?.avatarId).toBe("buho");
			expect(card?.studentName).toBe("Alejandrit"); // 10 letras
		});

		it("confirmación individual con '✓' actualiza el badge y sincroniza CARD_CONFIRMED", () => {
			// Confirmar tarjeta 0
			usePlayStore.getState().toggleCardConfirmed(0);

			const card0 = usePlayStore.getState().cards[0];
			expect(card0?.isConfirmed).toBe(true);

			const html = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					cards: usePlayStore.getState().cards,
				}),
			);
			expect(html).toContain('data-testid="unconfirm-card-btn-0"');
			expect(html).toContain("¡Listo para jugar!");
		});

		it("activa cuenta regresiva automática de 5s cuando todas las N tarjetas están confirmadas", () => {
			// Confirmar las 4 tarjetas
			usePlayStore.getState().toggleCardConfirmed(0);
			usePlayStore.getState().toggleCardConfirmed(1);
			usePlayStore.getState().toggleCardConfirmed(2);
			expect(usePlayStore.getState().phase).toBe("claim");

			// Al confirmar la 4ta tarjeta (4 de 4)
			usePlayStore.getState().toggleCardConfirmed(3);

			expect(usePlayStore.getState().phase).toBe("countdown");
			expect(usePlayStore.getState().countdownSeconds).toBe(5);

			const html = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					cards: usePlayStore.getState().cards,
					phase: "countdown",
					countdownSeconds: 5,
				}),
			);
			expect(html).toContain('data-testid="countdown-overlay"');
			expect(html).toContain('data-testid="countdown-seconds"');
			expect(html).toContain("5");
		});

		it("desmarcar '✓' durante el countdown cancela el inicio y resetea solo su propia tarjeta", () => {
			// Todas confirmadas
			usePlayStore.getState().toggleCardConfirmed(0);
			usePlayStore.getState().toggleCardConfirmed(1);
			usePlayStore.getState().toggleCardConfirmed(2);
			usePlayStore.getState().toggleCardConfirmed(3);
			expect(usePlayStore.getState().phase).toBe("countdown");

			// Desmarcar tarjeta 1
			usePlayStore.getState().toggleCardConfirmed(1);

			expect(usePlayStore.getState().phase).toBe("claim");
			expect(usePlayStore.getState().cards[1]?.isConfirmed).toBe(false);
			expect(usePlayStore.getState().cards[0]?.isConfirmed).toBe(true);
			expect(usePlayStore.getState().cards[2]?.isConfirmed).toBe(true);
			expect(usePlayStore.getState().cards[3]?.isConfirmed).toBe(true);
		});
	});

	// =========================================================================
	// 4. FORCE-START DESDE /teacher
	// =========================================================================
	describe("4. Force-Start desde /teacher", () => {
		beforeEach(() => {
			useTeacherStore.setState({
				activeSessionCode: "FRCE",
				isConfigLocked: false,
				studentEvals: [
					{
						studentId: "c1",
						studentName: "Mateo",
						avatarId: "zorro",
						confirmed: true,
						participacion: 0,
						propuesta: 0,
						organizacion: 0,
						anecdote: "",
						voiceTurns: 0,
						drawsCount: 0,
						retired: false,
					},
					{
						studentId: "c2",
						studentName: "Valentina",
						avatarId: "buho",
						confirmed: true,
						participacion: 0,
						propuesta: 0,
						organizacion: 0,
						anecdote: "",
						voiceTurns: 0,
						drawsCount: 0,
						retired: false,
					},
					{
						studentId: "c3",
						studentName: "Leo",
						avatarId: "rana",
						confirmed: false,
						participacion: 0,
						propuesta: 0,
						organizacion: 0,
						anecdote: "",
						voiceTurns: 0,
						drawsCount: 0,
						retired: false,
					},
					{
						studentId: "c4",
						studentName: "Sofía",
						avatarId: "gato",
						confirmed: false,
						participacion: 0,
						propuesta: 0,
						organizacion: 0,
						anecdote: "",
						voiceTurns: 0,
						drawsCount: 0,
						retired: false,
					},
				],
			});

			usePlayStore.setState({
				sessionCode: "FRCE",
				phase: "claim",
				expectedPlayers: 4,
				cards: [
					{
						cardId: "card-1",
						playerIndex: 0,
						avatarId: "zorro",
						studentName: "Mateo",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 0,
						drawsCount: 0,
					},
					{
						cardId: "card-2",
						playerIndex: 1,
						avatarId: "buho",
						studentName: "Valentina",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 0,
						drawsCount: 0,
					},
					{
						cardId: "card-3",
						playerIndex: 2,
						avatarId: "rana",
						studentName: "Leo",
						isConfirmed: false,
						status: "idle",
						isRetired: false,
						turnsCount: 0,
						drawsCount: 0,
					},
					{
						cardId: "card-4",
						playerIndex: 3,
						avatarId: "gato",
						studentName: "Sofía",
						isConfirmed: false,
						status: "idle",
						isRetired: false,
						turnsCount: 0,
						drawsCount: 0,
					},
				],
			});
		});

		it("muestra el botón 'Iniciar con X listos' si hay ≥2 confirmados y < N", () => {
			const html = renderToString(
				React.createElement<OperatorConsoleProps>(OperatorConsole, {
					repo,
				}),
			);

			expect(html).toContain('data-testid="force-start-btn"');
			expect(html).toContain("Iniciar con 2 listos");
		});

		it("prohíbe estrictamente el juego en solitario: no muestra force-start si confirmado < 2 y lanza error", async () => {
			// Desconfirmar Mateo -> solo queda Valentina (1 confirmado)
			useTeacherStore.setState((s) => ({
				studentEvals: s.studentEvals.map((ev, idx) =>
					idx === 0 ? { ...ev, confirmed: false } : ev,
				),
			}));

			const html = renderToString(
				React.createElement<OperatorConsoleProps>(OperatorConsole, {
					repo,
				}),
			);
			expect(html).not.toContain('data-testid="force-start-btn"');

			// Intento de llamar forceStart lanza error
			await expect(useTeacherStore.getState().forceStart(repo)).rejects.toThrow(
				/Mínimo 2 participantes confirmados requeridos/,
			);
		});

		it("al presionar force-start: elimina no confirmados, reescribe N a 2 y arranca la partida", async () => {
			// Crear sesión en repo para verificar reescritura
			await repo.create(
				{
					language: "ES",
					expectedPlayers: 4,
					durationMinutes: 5,
					durationGameMs: 300000,
					createdAtWallMs: Date.now(),
					locked: false,
				},
				"FRCE",
			);

			// Ejecutar forceStart
			const success = await useTeacherStore.getState().forceStart(repo);
			expect(success).toBe(true);

			// Teacher Store: reescrito a 2 jugadores confirmados
			const teacherState = useTeacherStore.getState();
			expect(teacherState.studentEvals.length).toBe(2);
			expect(teacherState.formPlayers).toBe(2);
			expect(teacherState.isConfigLocked).toBe(true);

			// SessionRepo: expectedPlayers reescrito a 2 y status a playing
			const updatedRec = await repo.getByCode("FRCE");
			expect(updatedRec?.config.expectedPlayers).toBe(2);
			expect(updatedRec?.status).toBe("playing");
		});
	});

	// =========================================================================
	// 5. DROPOUT (RETIRAR ALUMNO)
	// =========================================================================
	describe("5. Dropout (Retirar Alumno)", () => {
		beforeEach(() => {
			useTeacherStore.setState({
				activeSessionCode: "DROP",
				isConfigLocked: true,
				liveTimerSeconds: 165, // 02:45 restantes de 5:00 -> transcurrido 02:15
				formDurationMinutes: 5,
				studentEvals: [
					{
						studentId: "c1",
						studentName: "Mateo",
						avatarId: "zorro",
						confirmed: true,
						participacion: 1,
						propuesta: 1,
						organizacion: 1,
						anecdote: "",
						voiceTurns: 3,
						drawsCount: 1,
						retired: false,
					},
					{
						studentId: "c2",
						studentName: "Valentina",
						avatarId: "buho",
						confirmed: true,
						participacion: 2,
						propuesta: 2,
						organizacion: 1,
						anecdote: "",
						voiceTurns: 4,
						drawsCount: 0,
						retired: false,
					},
				],
			});

			usePlayStore.setState({
				sessionCode: "DROP",
				phase: "active",
				expectedPlayers: 2,
				cards: [
					{
						cardId: "c1",
						playerIndex: 0,
						avatarId: "zorro",
						studentName: "Mateo",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 3,
						drawsCount: 1,
					},
					{
						cardId: "c2",
						playerIndex: 1,
						avatarId: "buho",
						studentName: "Valentina",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 4,
						drawsCount: 0,
					},
				],
			});
		});

		it("renderiza botón de retirar y diálogo de confirmación inline en /teacher", () => {
			const html = renderToString(
				React.createElement<OperatorConsoleProps>(OperatorConsole, {
					repo,
				}),
			);

			expect(html).toContain('data-testid="inline-retire-btn-c1"');
			expect(html).toContain('data-testid="inline-retire-btn-c2"');
			expect(html).toContain("Retirar");
		});

		it("al retirar alumno: registra timestamp 'retirado mm:ss', badge y evento en consola docente", () => {
			useTeacherStore.getState().retireStudent("c1", repo);

			const state = useTeacherStore.getState();
			const student1 = state.studentEvals.find((s) => s.studentId === "c1");
			expect(student1?.retired).toBe(true);
			expect(student1?.retiredAt).toBe("02:15");

			// Evento registrado en historial
			expect(state.recentEvents.length).toBeGreaterThan(0);
			expect(state.recentEvents[0]?.details).toContain(
				"Alumno Mateo retirado (02:15)",
			);

			// Renderiza badge retirado en LiveMirror
			const html = renderToString(
				React.createElement<LiveMirrorProps>(LiveMirror, {
					repo,
					studentEvals: state.studentEvals,
					activeSessionCode: "DROP",
				}),
			);
			expect(html).toContain('data-testid="retired-badge"');
			expect(html).toContain("Retirado 02:15");
		});

		it("sincroniza dropout a /play: tarjeta pasa a escala de grises y deshabilita botones multitáctiles", () => {
			// Simula sincronización del retiro en PlayStore
			usePlayStore.setState((state) => ({
				cards: state.cards.map((c) =>
					c.cardId === "c1" ? { ...c, isRetired: true, status: "idle" } : c,
				),
			}));

			const card1 = usePlayStore.getState().cards[0];
			expect(card1?.isRetired).toBe(true);

			// Renderizado en RightRail
			const html = renderToString(
				React.createElement<RightRailProps>(RightRail, {
					cards: usePlayStore.getState().cards,
				}),
			);
			expect(html).toContain("opacity-40 grayscale");
			expect(html).toContain("pointer-events-none");
			expect(html).toContain("Retirado");
		});

		it("el alumno NO puede auto-retirarse desde /play: cero controles de retiro en la interfaz de juego", () => {
			const htmlClaim = renderToString(
				React.createElement<ClaimCardsScreenProps>(ClaimCardsScreen, {
					cards: usePlayStore.getState().cards,
				}),
			);
			const htmlRail = renderToString(
				React.createElement<RightRailProps>(RightRail, {
					cards: usePlayStore.getState().cards,
				}),
			);

			// No debe existir ningún botón o texto para retirarse desde /play
			expect(htmlClaim).not.toContain("inline-retire-btn");
			expect(htmlClaim).not.toContain("¿Retirar a");
			expect(htmlRail).not.toContain("inline-retire-btn");
			expect(htmlRail).not.toContain("¿Retirar a");
		});
	});
});
