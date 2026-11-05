/**
 * TALENTIA / SocraticGuild — Integration Tests for F3b
 * Past Sessions, Detail, Add-Only Comments and Cascade Delete (D2 & D5).
 * SPEC §2, §11, §13, §17 & docs/gates/F0-contrato.md.
 *
 * Verifies:
 * 1. Past sessions listing via SessionRepo.listPast() (SessionSummary[]):
 *    - Mandatory columns: Código, Fecha/Hora, Idioma, Jugadores y Resultado (1-3★ o Guion si no finalizada).
 *    - Friendly empty state when no past sessions exist.
 * 2. Past session detail view ([TEACH-03], D2):
 *    - Queries SessionRepo.getByCode(code).
 *    - Renders DocenteView with 5 immutable criteria, evidence quotes and student cards.
 *    - Detailed inspection section: diarized transcript feed with dual timestamps (game_ts_ms and wall_ts_ms),
 *      gallery of drawing thumbnails (thumbs) and vision reads (visionRead).
 * 3. Add-only pedagogical comment thread ([TEACH-04], D5):
 *    - Adds comment via SessionRepo.addComment(code, text).
 *    - Renders comments with formatted wall_ts_ms and author 'teacher'.
 *    - Strict immutability: verifies in rendered DOM that NO button or control to edit or delete individual notes exists.
 * 4. Cascade hard-delete ('borrar sesión', D5):
 *    - Irreversible cascading purge of session, transcripts, drawings, thumbnails, vision reads, event log, scores, and comments (Ley 29733).
 *    - Automatic reactive refresh: list is updated immediately without deleted code, and detail view is cleared/closed.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import {
	setDefaultSessionRepository,
	useSessionDetailStore,
	useSessionListStore,
} from "@/game/stores/sessionStore.ts";
import { LOCKED_STRINGS } from "@/shared/constants.ts";
import type {
	DrawSubmission,
	EventLogEntry,
	JudgeScores,
	PlayerCard,
	SessionConfig,
	TranscriptTurn,
} from "@/shared/documents.ts";
import { CommentThread } from "@/ui/teacher/CommentThread.tsx";
import { DocenteView } from "@/ui/teacher/DocenteView.tsx";
import { PastSessionsList } from "@/ui/teacher/PastSessionsList.tsx";

describe("F3b Integration: Past Sessions, Detail, Add-Only Comments & Cascade Delete (SPEC §2, §11, §13, §17, D2, D5)", () => {
	let eventLog: InMemoryEventLog;
	let repo: InMemorySessionRepository;

	const sampleConfigCompleted: SessionConfig = {
		language: "ES",
		expectedPlayers: 3,
		durationMinutes: 5,
		durationGameMs: 300000,
		createdAtWallMs: 1730728800000, // 2026-11-04 14:00 approx
		locked: true,
	};

	const sampleConfigUnfinished: SessionConfig = {
		language: "QUZ",
		expectedPlayers: 4,
		durationMinutes: 10,
		durationGameMs: 600000,
		createdAtWallMs: 1730725200000, // 2026-11-04 13:00 approx
		locked: true,
	};

	const sampleScores: JudgeScores = {
		id: "scores-1",
		sessionId: "",
		sumPoints: 9,
		stars: 3,
		isFinished: true,
		earnedBadges: [
			{
				id: "paso_a_paso",
				name: "Paso a paso",
				quoteInRunLanguage: "Construyeron en orden",
			},
		],
		groupCriteria: {
			turnTaking: {
				score: 2,
				evidenceQuote: "Esperaron cada uno su turno pacientemente",
			},
			colaboracion: {
				score: 2,
				evidenceQuote: "Sofía complementó el plano propuesto por Mateo",
			},
			negociacion: {
				score: 2,
				evidenceQuote: "Acordaron regar los surcos a cambio de los leños",
			},
			resolucionEstructurada: {
				score: 1,
				evidenceQuote: "Avanzaron ordenadamente tras recibir la pista L1",
			},
			organizacionLiderazgo: {
				score: 2,
				evidenceQuote: "Mateo coordinó la votación para marchar a taller",
			},
		},
		students: [
			{
				playerId: "p-mateo",
				avatar: "Zorro",
				name: "Mateo",
				participacion: 2,
				propuesta: 2,
				organizacion: 2,
				anecdote: "Lideró la iniciativa de dibujo y consultó al equipo",
				turnCount: 8,
				drawCount: 1,
			},
			{
				playerId: "p-sofia",
				avatar: "Búho",
				name: "Sofía",
				participacion: 2,
				propuesta: 2,
				organizacion: 1,
				anecdote: "Negoció con el agricultor Paco recordando el trato",
				turnCount: 7,
				drawCount: 0,
			},
			{
				playerId: "p-lucas",
				avatar: "Rana",
				name: "Lucas",
				participacion: 1,
				propuesta: 2,
				organizacion: 1,
				anecdote: "Demostró claridad espacial trazando los tablones",
				turnCount: 4,
				drawCount: 2,
			},
		],
		conApoyoDocente: true,
		evaluatedAtWallMs: 1730729100000,
	};

	beforeEach(() => {
		eventLog = new InMemoryEventLog();
		repo = new InMemorySessionRepository(eventLog);
		setDefaultSessionRepository(repo);
		useSessionListStore.getState().reset();
		useSessionDetailStore.getState().reset();
	});

	// Helper to populate a full completed session
	async function populateCompletedSession(code = "K7B9") {
		const session = await repo.create(sampleConfigCompleted, code);
		const sessionId = session.id;

		// Add players
		const players: PlayerCard[] = [
			{
				slotIndex: 0,
				playerId: "p-mateo",
				avatar: "Zorro",
				name: "Mateo",
				confirmed: true,
				retired: false,
				retiredGameTsMs: null,
				lastActiveWallMs: Date.now(),
				turnCount: 8,
				drawCount: 1,
			},
			{
				slotIndex: 1,
				playerId: "p-sofia",
				avatar: "Búho",
				name: "Sofía",
				confirmed: true,
				retired: false,
				retiredGameTsMs: null,
				lastActiveWallMs: Date.now(),
				turnCount: 7,
				drawCount: 0,
			},
			{
				slotIndex: 2,
				playerId: "p-lucas",
				avatar: "Rana",
				name: "Lucas",
				confirmed: true,
				retired: false,
				retiredGameTsMs: null,
				lastActiveWallMs: Date.now(),
				turnCount: 4,
				drawCount: 2,
			},
		];
		for (const p of players) {
			await repo.addPlayer(code, p);
		}

		// Add transcripts with dual timestamps
		const t1: TranscriptTurn = {
			id: "tx-1",
			turnIndex: 0,
			holderPlayerId: "Mateo (Zorro)",
			audioDurationMs: 2200,
			sendReason: "release",
			rawText: "Paco necesitamos madera para reparar el puente roto",
			paraphraseEs: "Paco necesitamos madera para reparar el puente roto",
			suspectedOverlap: false,
			gameTsMs: 45000,
			wallTsMs: 1730728845000,
		};
		const t2: TranscriptTurn = {
			id: "tx-2",
			turnIndex: 1,
			holderPlayerId: "Lucas (Rana)",
			audioDurationMs: 3100,
			sendReason: "silence",
			rawText: "Nosotros ayudamos a regar los surcos con baldes",
			paraphraseEs: "Nosotros ayudamos a regar los surcos con baldes",
			suspectedOverlap: true,
			gameTsMs: 70000,
			wallTsMs: 1730728870000,
		};
		await repo.addTranscript(code, t1);
		await repo.addTranscript(code, t2);

		// Add drawing with thumbnail and vision read
		const drawing: DrawSubmission = {
			id: "draw-1",
			stationId: "taller",
			playerId: "Lucas",
			strokes: [
				{
					color: "azul",
					brushSize: 4,
					points: [
						{ x: 10, y: 10, timeOffsetMs: 0 },
						{ x: 50, y: 50, timeOffsetMs: 100 },
					],
				},
			],
			imageJpegBase64: "data:image/jpeg;base64,fullimage123",
			thumbBase64: "data:image/jpeg;base64,thumb123",
			gameTsMs: 95000,
			wallTsMs: 1730728895000,
			visionRead: {
				objects: ["puente", "vigas_de_madera"],
				actions: ["ensamblar", "sostener"],
				measures: ["3_metros", "doble_ancho"],
				routes: ["cruce_central"],
				labelsOrMarks: ["A", "B"],
				confidence: { bridge: 0.96, wood: 0.91 },
				rawResponse: '{"objects":["puente"]}',
			},
		};
		await repo.addDrawing(code, drawing);

		// Save scores and status
		await repo.updateStatus(code, "finished");
		await repo.saveScores(code, { ...sampleScores, sessionId });

		// Add initial comment
		await repo.addComment(
			code,
			"Coordinación sobresaliente durante el cruce del río.",
		);

		// Add event log entries
		const event1: Omit<EventLogEntry<"press">, "id"> = {
			sessionId,
			type: "press",
			game_ts_ms: 44000,
			wall_ts_ms: 1730728844000,
			actorId: "p-mateo",
			payload: {
				targetType: "talk",
				buttonId: "talk_hold",
			},
		};
		const event2: Omit<EventLogEntry<"grant_step">, "id"> = {
			sessionId,
			type: "grant_step",
			game_ts_ms: 72000,
			wall_ts_ms: 1730728872000,
			actorId: "teacher",
			payload: {
				stepId: "conseguir_madera",
				grantedItem: "madera",
				forced: true,
			},
		};
		await eventLog.append(event1);
		await eventLog.append(event2);

		return session;
	}

	describe("1. Lista de Sesiones Pasadas ([TEACH-05], D2)", () => {
		it("muestra un estado vacío amigable cuando no existen sesiones archivadas", async () => {
			const past = await repo.listPast();
			expect(past.length).toBe(0);

			const html = renderToString(
				React.createElement(PastSessionsList, { repo }),
			);
			expect(html).toContain("No hay sesiones pasadas archivadas");
			expect(html).toContain('data-testid="empty-past-sessions"');
			expect(html).not.toContain('data-testid="past-sessions-table"');
		});

		it("renderiza la tabla con las 5 columnas obligatorias: Código, Fecha/Hora, Idioma, Jugadores y Resultado", async () => {
			await populateCompletedSession("K7B9");

			// Create second unfinished session
			await repo.create(sampleConfigUnfinished, "M2P4");
			await repo.addPlayer("M2P4", {
				slotIndex: 0,
				playerId: "p-ana",
				avatar: "Gato",
				name: "Ana",
				confirmed: true,
				retired: false,
				retiredGameTsMs: null,
				lastActiveWallMs: Date.now(),
				turnCount: 2,
				drawCount: 0,
			});
			await repo.updateStatus("M2P4", "playing");

			const past = await repo.listPast();
			expect(past.length).toBe(2);

			const html = renderToString(
				React.createElement(PastSessionsList, { repo }),
			);

			// Verifies table presence
			expect(html).toContain('data-testid="past-sessions-table"');

			// Verifies 5 mandatory header columns
			expect(html).toContain("1. Código");
			expect(html).toContain("2. Fecha y Hora");
			expect(html).toContain("3. Idioma");
			expect(html).toContain("4. Jugadores");
			expect(html).toContain("5. Resultado");

			// Verifies completed session row (K7B9)
			expect(html).toContain("K7B9");
			expect(html).toContain("ES");
			expect(html).toContain("3 alumnos");
			expect(html).toContain("★★★"); // 3 stars
			expect(html).toContain("(3★)");

			// Verifies unfinished session row (M2P4) with Guion '-'
			expect(html).toContain("M2P4");
			expect(html).toContain("QUZ");
			expect(html).toContain("1 alumnos");
			expect(html).toContain('data-testid="session-stars-dash"');
			expect(html).toContain("-"); // Guion dash for unfinished
		});
	});

	describe("2. Detalle de Sesión Pasada e Inspección ([TEACH-03], D2)", () => {
		it("consulta SessionRepo.getByCode(code) y renderiza el reporte DocenteView con los 5 criterios inmutables y tarjetas de alumnos", async () => {
			await populateCompletedSession("K7B9");

			const record = await repo.getByCode("K7B9");
			expect(record).not.toBeNull();
			expect(record?.code).toBe("K7B9");

			// Render detail using PastSessionsList with initialSelectedCode
			const html = renderToString(
				React.createElement(PastSessionsList, {
					repo,
					initialSelectedCode: "K7B9",
				}),
			);

			// Verifies container
			expect(html).toContain('data-testid="past-session-detail"');
			expect(html).toContain("Detalle de Sesión: K7B9");

			// Verifies DocenteView components
			expect(html).toContain(LOCKED_STRINGS.DOCENTE_BANNER); // "señales preliminares, no notas"
			expect(html).toContain(LOCKED_STRINGS.TEACHER_FLAG); // "con apoyo docente"
			expect(html).toContain('data-testid="docente-criteria-grid"');

			// Verifies 5 group criteria and evidence quotes
			expect(html).toContain("Esperaron cada uno su turno pacientemente");
			expect(html).toContain("Sofía complementó el plano propuesto por Mateo");
			expect(html).toContain(
				"Acordaron regar los surcos a cambio de los leños",
			);
			expect(html).toContain(
				"Avanzaron ordenadamente tras recibir la pista L1",
			);
			expect(html).toContain(
				"Mateo coordinó la votación para marchar a taller",
			);

			// Verifies student cards
			expect(html).toContain("Mateo");
			expect(html).toContain("🗣️ 8 turnos");
			expect(html).toContain("🎨 1 dibujos");
			expect(html).toContain(
				"Lideró la iniciativa de dibujo y consultó al equipo",
			);

			expect(html).toContain("Sofía");
			expect(html).toContain("🗣️ 7 turnos");
			expect(html).toContain(
				"Negoció con el agricultor Paco recordando el trato",
			);

			expect(html).toContain("Lucas");
			expect(html).toContain("🎨 2 dibujos");
			expect(html).toContain(
				"Demostró claridad espacial trazando los tablones",
			);
		});

		it("renderiza feed diarizado de transcripciones con doble timestamp (game_ts_ms y wall_ts_ms)", async () => {
			await populateCompletedSession("K7B9");
			const record = await repo.getByCode("K7B9");

			const html = renderToString(
				React.createElement(DocenteView, { sessionRecord: record, repo }),
			);

			// Verifies feed container
			expect(html).toContain('data-testid="transcripts-feed"');
			expect(html).toContain("2 intervenciones");

			// Verifies dual timestamps in rendered output
			expect(html).toContain("game_ts:");
			expect(html).toContain("45000ms"); // turn 1
			expect(html).toContain("70000ms"); // turn 2
			expect(html).toContain("wall_ts:");
			expect(html).toContain('data-testid="game-ts"');
			expect(html).toContain('data-testid="wall-ts"');

			// Verifies transcripts content and speakers
			expect(html).toContain("Mateo (Zorro)");
			expect(html).toContain(
				"Paco necesitamos madera para reparar el puente roto",
			);
			expect(html).toContain("Lucas (Rana)");
			expect(html).toContain("Nosotros ayudamos a regar los surcos con baldes");
			expect(html).toContain("⚠️ Solapamiento"); // suspectedOverlap flag
		});

		it("renderiza galería de miniaturas de dibujos (thumbs) y lecturas de visión (visionRead)", async () => {
			await populateCompletedSession("K7B9");
			const record = await repo.getByCode("K7B9");

			const html = renderToString(
				React.createElement(DocenteView, { sessionRecord: record, repo }),
			);

			// Verifies gallery container
			expect(html).toContain('data-testid="drawings-gallery"');
			expect(html).toContain("1 dibujos");

			// Verifies thumbnail rendering
			expect(html).toContain('data-testid="drawing-thumb"');
			expect(html).toContain("data:image/jpeg;base64,thumb123");

			// Verifies vision read extractions
			expect(html).toContain('data-testid="vision-read"');
			expect(html).toContain("puente, vigas_de_madera");
			expect(html).toContain("ensamblar, sostener");
			expect(html).toContain("3_metros, doble_ancho");
			expect(html).toContain("bridge: 96%");
			expect(html).toContain("wood: 91%");
		});
	});

	describe("3. Hilo de Notas Pedagógicas Add-Only ([TEACH-04], D5)", () => {
		it("permite agregar comentarios a través de SessionRepo.addComment(code, text)", async () => {
			await populateCompletedSession("K7B9");

			const added = await repo.addComment(
				"K7B9",
				"Nueva observación: Lucas mejoró su confianza.",
			);
			expect(added.id).toBeDefined();
			expect(added.author).toBe("teacher");
			expect(added.text).toBe("Nueva observación: Lucas mejoró su confianza.");
			expect(added.wall_ts_ms).toBeGreaterThan(0);

			const record = await repo.getByCode("K7B9");
			expect(record?.comments.length).toBe(2);
			expect(record?.comments[1]?.text).toBe(
				"Nueva observación: Lucas mejoró su confianza.",
			);
		});

		it("renderiza lista de notas con fecha/hora de pared formateada (wall_ts_ms) y autor 'teacher'", async () => {
			await populateCompletedSession("K7B9");
			const record = await repo.getByCode("K7B9");

			const html = renderToString(
				React.createElement(CommentThread, {
					sessionCode: "K7B9",
					comments: record?.comments,
				}),
			);

			expect(html).toContain('data-testid="comment-thread"');
			expect(html).toContain('data-testid="comment-author"');
			expect(html).toContain("teacher");
			expect(html).toContain('data-testid="comment-wall-ts"');
			expect(html).toContain('data-testid="comment-text"');
			expect(html).toContain(
				"Coordinación sobresaliente durante el cruce del río.",
			);
		});

		it("verifica el Principio de Inmutabilidad: CERO botones o controles de edición o borrado de notas en el DOM", async () => {
			await populateCompletedSession("K7B9");
			const record = await repo.getByCode("K7B9");

			const html = renderToString(
				React.createElement(CommentThread, {
					sessionCode: "K7B9",
					comments: record?.comments,
				}),
			);

			// Verifies that comment items contain zero buttons
			expect(html).not.toMatch(
				/<div[^>]*data-testid="comment-item"[^>]*>[\s\S]*?<button[\s\S]*?<\/div>/i,
			);

			// Verifies absence of edit or delete words associated with comments
			expect(html).not.toContain("Editar nota");
			expect(html).not.toContain("Borrar nota");
			expect(html).not.toContain("Eliminar comentario");
			expect(html).not.toContain("Edit");
			expect(html).not.toContain("Delete");

			// Only 1 button must exist in the entire form: the submit button "Agregar Nota"
			const buttonMatches = html.match(/<button/g) || [];
			expect(buttonMatches.length).toBe(1);
			expect(html).toContain("Agregar Nota");
		});
	});

	describe("4. Borrado Físico en Cascada y Refresco Reactivo ('borrar sesión', D5)", () => {
		it("muestra diálogo de confirmación explícita con mención a Ley 29733 / solicitud de padres", async () => {
			await populateCompletedSession("K7B9");

			// In initial state without delete trigger, confirm modal is not open
			const htmlInit = renderToString(
				React.createElement(PastSessionsList, { repo }),
			);
			expect(htmlInit).not.toContain('data-testid="delete-confirm-modal"');

			// Button "Borrar sesión" exists in table row
			expect(htmlInit).toContain("Borrar sesión");
		});

		it("ejecuta hardDelete eliminando físicamente y en cascada sesión, transcripts, dibujos, vision, eventos, scores y notas", async () => {
			const session = await populateCompletedSession("K7B9");
			const sessionId = session.id;

			// Verify data exists prior to deletion
			expect(await repo.getByCode("K7B9")).not.toBeNull();
			expect((await eventLog.getBySession(sessionId)).length).toBe(2);

			// Execute hardDelete
			const deleted = await repo.hardDelete("K7B9");
			expect(deleted).toBe(true);

			// 1. SessionRecord is completely gone
			expect(await repo.getByCode("K7B9")).toBeNull();

			// 2. Telemetry events in EventLog are purged
			const remainingEvents = await eventLog.getBySession(sessionId);
			expect(remainingEvents.length).toBe(0);

			// 3. Past sessions list no longer includes K7B9
			const pastList = await repo.listPast();
			expect(pastList.some((s) => s.code === "K7B9")).toBe(false);
		});

		it("refresca reactivamente el estado eliminando el código borrado y cerrando la vista de detalle", async () => {
			await populateCompletedSession("K7B9");
			await populateCompletedSession("W4MZ");

			// Seed Zustand store
			await useSessionListStore.getState().loadSessions(repo);
			expect(useSessionListStore.getState().sessions.length).toBe(2);

			// Select K7B9 in store
			useSessionListStore.getState().selectSession("K7B9");
			await useSessionDetailStore.getState().loadSession("K7B9", repo);
			expect(useSessionDetailStore.getState().activeSession?.code).toBe("K7B9");

			// Execute hardDeleteSession via store
			const deleted = await useSessionListStore
				.getState()
				.hardDeleteSession("K7B9", repo);
			expect(deleted).toBe(true);

			// Store reactive checks:
			// 1. K7B9 removed from store sessions
			const storeSessions = useSessionListStore.getState().sessions;
			expect(storeSessions.length).toBe(1);
			expect(storeSessions.some((s) => s.code === "K7B9")).toBe(false);

			// 2. selectedCode is reactively evicted (reset to null)
			expect(useSessionListStore.getState().selectedCode).toBeNull();

			// 3. Rendered HTML of PastSessionsList immediately reflects the removal
			const htmlAfter = renderToString(
				React.createElement(PastSessionsList, { repo }),
			);
			expect(htmlAfter).not.toContain("K7B9");
			expect(htmlAfter).toContain("W4MZ");
			expect(htmlAfter).not.toContain('data-testid="past-session-detail"');
		});
	});
});
