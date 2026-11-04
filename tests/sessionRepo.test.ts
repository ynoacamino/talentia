import { describe, expect, it } from "bun:test";
import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import {
	type DrawSubmission,
	hasConfusable,
	isValidCode,
	type JudgeScores,
	type PlayerCard,
	type SessionConfig,
	type TranscriptTurn,
} from "@/shared/documents.ts";

describe("ISessionRepository & InMemorySessionRepository Contract Tests (SPEC §2, §11, §13, §17)", () => {
	const sampleConfig: SessionConfig = {
		language: "ES",
		expectedPlayers: 3,
		durationMinutes: 5,
		durationGameMs: 300000,
		createdAtWallMs: 1730700000000,
		locked: false,
	};

	it("creates a session with a valid 4-character code without confusables", async () => {
		const repo = new InMemorySessionRepository();
		const session = await repo.create(sampleConfig);

		expect(session.code.length).toBe(4);
		expect(isValidCode(session.code)).toBe(true);
		expect(hasConfusable(session.code)).toBe(false);
		expect(session.status).toBe("created");
		expect(session.currentStation).toBe("campamento");
		expect(session.gameTimeRemainingMs).toBe(300000);
		expect(session.checklist.length).toBe(3);
		expect(session.inventory).toEqual({
			madera: false,
			plano: false,
			sello: false,
		});
		expect(session.players.length).toBe(0);
		expect(session.transcripts.length).toBe(0);
		expect(session.drawings.length).toBe(0);
		expect(session.comments.length).toBe(0);
		expect(session.scores).toBeNull();
	});

	it("creates a session with an explicit valid initialCode", async () => {
		const repo = new InMemorySessionRepository();
		const session = await repo.create(sampleConfig, "K7B9");

		expect(session.code).toBe("K7B9");
		const retrieved = await repo.getByCode("K7B9");
		expect(retrieved).not.toBeNull();
		if (retrieved) {
			expect(retrieved.id).toBe(session.id);
			expect(retrieved.code).toBe("K7B9");
		}
	});

	it("rejects invalid or duplicate initial codes", async () => {
		const repo = new InMemorySessionRepository();

		// Confusable characters (0, O, 1, I, L)
		expect(repo.create(sampleConfig, "K0B9")).rejects.toThrow(
			"Invalid session code",
		);
		expect(repo.create(sampleConfig, "KOB9")).rejects.toThrow(
			"Invalid session code",
		);
		expect(repo.create(sampleConfig, "K1B9")).rejects.toThrow(
			"Invalid session code",
		);
		expect(repo.create(sampleConfig, "KIB9")).rejects.toThrow(
			"Invalid session code",
		);
		expect(repo.create(sampleConfig, "KLB9")).rejects.toThrow(
			"Invalid session code",
		);

		// Length != 4
		expect(repo.create(sampleConfig, "ABC")).rejects.toThrow(
			"Invalid session code",
		);
		expect(repo.create(sampleConfig, "ABCDE")).rejects.toThrow(
			"Invalid session code",
		);

		// Duplicates
		await repo.create(sampleConfig, "M2P4");
		expect(repo.create(sampleConfig, "M2P4")).rejects.toThrow(
			'Session with code "M2P4" already exists',
		);
	});

	it("updates status and reflects in getByCode", async () => {
		const repo = new InMemorySessionRepository();
		const session = await repo.create(sampleConfig, "T8X2");

		expect(session.status).toBe("created");

		await repo.updateStatus("T8X2", "playing");
		let current = await repo.getByCode("T8X2");
		expect(current?.status).toBe("playing");

		await repo.updateStatus("T8X2", "finished");
		current = await repo.getByCode("T8X2");
		expect(current?.status).toBe("finished");

		// Non-existent session
		expect(repo.updateStatus("ZZZZ", "playing")).rejects.toThrow(
			'Session with code "ZZZZ" not found',
		);
	});

	it("lists past sessions sorted chronologically descending", async () => {
		const repo = new InMemorySessionRepository();

		// Create 3 sessions with different wall timestamps
		await repo.create({ ...sampleConfig, createdAtWallMs: 1000 }, "AAA2");
		await repo.create({ ...sampleConfig, createdAtWallMs: 3000 }, "CCC2");
		await repo.create({ ...sampleConfig, createdAtWallMs: 2000 }, "BBB2");

		const list = await repo.listPast();
		expect(list.length).toBe(3);
		expect(list[0]?.code).toBe("CCC2");
		expect(list[1]?.code).toBe("BBB2");
		expect(list[2]?.code).toBe("AAA2");
	});

	it("addComment implements strict immutable append-only thread (SPEC §2, §11, D5)", async () => {
		const repo = new InMemorySessionRepository();
		const code = "C2MM";
		await repo.create(sampleConfig, code);

		// Add first comment
		const c1 = await repo.addComment(
			code,
			"Observación inicial: Mateo y Sofía se organizan.",
		);
		expect(c1.author).toBe("teacher");
		expect(c1.text).toBe("Observación inicial: Mateo y Sofía se organizan.");
		expect(typeof c1.id).toBe("string");
		expect(typeof c1.wall_ts_ms).toBe("number");

		// Add second comment
		const c2 = await repo.addComment(
			code,
			"Lucas apoyó con el plano en el taller.",
		);
		expect(c2.author).toBe("teacher");
		expect(c2.text).toBe("Lucas apoyó con el plano en el taller.");
		expect(c2.wall_ts_ms).toBeGreaterThanOrEqual(c1.wall_ts_ms);

		const session = await repo.getByCode(code);
		expect(session?.comments.length).toBe(2);
		expect(session?.comments[0]?.text).toBe(c1.text);
		expect(session?.comments[1]?.text).toBe(c2.text);

		// Rejects empty comment text
		expect(repo.addComment(code, "")).rejects.toThrow(
			"Comment text cannot be empty",
		);
		expect(repo.addComment(code, "   ")).rejects.toThrow(
			"Comment text cannot be empty",
		);

		// Rejects commenting on non-existent session
		expect(repo.addComment("NOPE", "Texto")).rejects.toThrow(
			'Session with code "NOPE" not found',
		);
	});

	it("saves judge scores and updates summary accordingly", async () => {
		const repo = new InMemorySessionRepository();
		const code = "J7G3";
		await repo.create(sampleConfig, code);

		const scores: JudgeScores = {
			id: "judge-eval-77",
			sessionId: "session-id",
			sumPoints: 8,
			stars: 3,
			isFinished: true,
			earnedBadges: [
				{
					id: "paso_a_paso",
					name: "Paso a paso",
					quoteInRunLanguage: "Resolvieron en orden exacto",
				},
				{
					id: "un_solo_equipo",
					name: "Un solo equipo",
					quoteInRunLanguage: "Colaboraron activamente",
				},
			],
			groupCriteria: {
				turnTaking: {
					score: 2,
					evidenceQuote: "Se turnaron sin interrupciones",
				},
				colaboracion: { score: 2, evidenceQuote: "Sofía complementó a Lucas" },
				negociacion: { score: 1, evidenceQuote: "Acordaron ayuda con Paco" },
				resolucionEstructurada: {
					score: 2,
					evidenceQuote: "Siguieron el orden",
				},
				organizacionLiderazgo: {
					score: 1,
					evidenceQuote: "Mateo propuso viajar",
				},
			},
			students: [
				{
					playerId: "p1",
					avatar: "Zorro",
					name: "Mateo",
					participacion: 2,
					propuesta: 2,
					organizacion: 2,
					anecdote: "Iniciativa en el mapa",
					turnCount: 8,
					drawCount: 1,
				},
			],
			conApoyoDocente: false,
			evaluatedAtWallMs: Date.now(),
		};

		await repo.saveScores(code, scores);

		const session = await repo.getByCode(code);
		expect(session?.scores).not.toBeNull();
		expect(session?.scores?.sumPoints).toBe(8);
		expect(session?.scores?.stars).toBe(3);

		const summaries = await repo.listPast();
		const summary = summaries.find((s) => s.code === code);
		expect(summary?.stars).toBe(3);
		expect(summary?.isFinished).toBe(true);
		expect(summary?.conApoyoDocente).toBe(false);
	});

	it("hardDelete performs complete atomic cascading purge of all associated data (Ley 29733 compliance)", async () => {
		const eventLog = new InMemoryEventLog();
		const repo = new InMemorySessionRepository(eventLog);
		const code = "PURG";

		// 1. Create session
		const session = await repo.create(sampleConfig, code);
		const sessionId = session.id;

		// 2. Add players
		const player1: PlayerCard = {
			slotIndex: 0,
			playerId: "player-mateo",
			avatar: "Zorro",
			name: "Mateo",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: Date.now(),
			turnCount: 5,
			drawCount: 1,
		};
		const player2: PlayerCard = {
			slotIndex: 1,
			playerId: "player-sofia",
			avatar: "Búho",
			name: "Sofía",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: Date.now(),
			turnCount: 4,
			drawCount: 0,
		};
		await repo.addPlayer(code, player1);
		await repo.addPlayer(code, player2);

		// 3. Add transcript turns
		const tx: TranscriptTurn = {
			id: "tx-1",
			turnIndex: 0,
			holderPlayerId: "player-mateo",
			audioDurationMs: 2500,
			sendReason: "release",
			rawText: "Vamos a pedirle madera al agricultor",
			paraphraseEs: "Vamos a pedirle madera al agricultor",
			suspectedOverlap: false,
			gameTsMs: 5000,
			wallTsMs: Date.now(),
		};
		await repo.addTranscript(code, tx);

		// 4. Add drawing submission with strokes, thumb and visionRead
		const drawing: DrawSubmission = {
			id: "draw-1",
			stationId: "taller",
			playerId: "player-mateo",
			strokes: [
				{
					color: "azul",
					brushSize: 4,
					points: [
						{ x: 10, y: 20, timeOffsetMs: 50 },
						{ x: 15, y: 25, timeOffsetMs: 100 },
					],
				},
			],
			imageJpegBase64: "data:image/jpeg;base64,sample123",
			thumbBase64: "data:image/jpeg;base64,thumb123",
			gameTsMs: 15000,
			wallTsMs: Date.now(),
			visionRead: {
				objects: ["puente", "vigas"],
				actions: ["unir", "sostener"],
				measures: ["ancho"],
				routes: ["cruce"],
				labelsOrMarks: ["A"],
				confidence: { bridge: 0.98 },
				rawResponse: "Dibujo de puente con vigas de madera",
			},
		};
		await repo.addDrawing(code, drawing);

		// 5. Add comments
		await repo.addComment(code, "Docente: Mateo lideró la negociación.");

		// 6. Add scores
		const judgeScores: JudgeScores = {
			id: "judge-eval-del",
			sessionId,
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
				turnTaking: { score: 2, evidenceQuote: "Pocas interrupciones" },
				colaboracion: { score: 2, evidenceQuote: "Trabajaron juntos" },
				negociacion: { score: 2, evidenceQuote: "Pacto respetado" },
				resolucionEstructurada: {
					score: 2,
					evidenceQuote: "Orden chacra taller",
				},
				organizacionLiderazgo: { score: 1, evidenceQuote: "Propuesta de rol" },
			},
			students: [],
			conApoyoDocente: false,
			evaluatedAtWallMs: Date.now(),
		};
		await repo.saveScores(code, judgeScores);

		// 7. Add telemetry events in eventLog
		await eventLog.append({
			sessionId,
			type: "press",
			game_ts_ms: 100,
			wall_ts_ms: Date.now(),
			actorId: "player-mateo",
			payload: { targetType: "talk", buttonId: "talk-btn" },
		});
		await eventLog.append({
			sessionId,
			type: "grant_step",
			game_ts_ms: 20000,
			wall_ts_ms: Date.now(),
			actorId: "paco",
			payload: {
				stepId: "conseguir_madera",
				grantedItem: "madera",
				forced: false,
			},
		});

		// Verify fixture is completely populated
		const populated = await repo.getByCode(code);
		expect(populated).not.toBeNull();
		expect(populated?.players.length).toBe(2);
		expect(populated?.transcripts.length).toBe(1);
		expect(populated?.drawings.length).toBe(1);
		expect(populated?.comments.length).toBe(1);
		expect(populated?.scores).not.toBeNull();
		expect((await eventLog.getBySession(sessionId)).length).toBe(2);

		// Also create another session to verify non-interference
		const otherSession = await repo.create(sampleConfig, "KEEP");
		await eventLog.append({
			sessionId: otherSession.id,
			type: "press",
			game_ts_ms: 50,
			wall_ts_ms: Date.now(),
			actorId: "other-actor",
			payload: { targetType: "map", buttonId: "map-btn" },
		});

		// EXECUTE HARD DELETE (Cascade Ley 29733)
		const deleted = await repo.hardDelete(code);
		expect(deleted).toBe(true);

		// VERIFY ABSOLUTE CASCADING PURGE:
		// 1. SessionRecord is null
		expect(await repo.getByCode(code)).toBeNull();

		// 2. Session disappears from listPast
		const past = await repo.listPast();
		expect(past.some((s) => s.code === code)).toBe(false);

		// 3. Associated telemetry events in eventLog are completely purged
		const orphanedEvents = await eventLog.getBySession(sessionId);
		expect(orphanedEvents.length).toBe(0);

		// 4. Repeated hardDelete returns false
		expect(await repo.hardDelete(code)).toBe(false);

		// 5. Unrelated session KEEP is preserved
		const preserved = await repo.getByCode("KEEP");
		expect(preserved).not.toBeNull();
		expect((await eventLog.getBySession(otherSession.id)).length).toBe(1);
	});

	it("guarantees internal immutability against caller mutations", async () => {
		const repo = new InMemorySessionRepository();
		const code = "SAFE";
		await repo.create(sampleConfig, code);

		const retrieved = await repo.getByCode(code);
		expect(retrieved).not.toBeNull();
		if (retrieved) {
			// @ts-expect-error test defense
			retrieved.players.push({ name: "Hacker" });
			// @ts-expect-error test defense
			retrieved.comments.push({ text: "Spam" });
			// @ts-expect-error test defense
			retrieved.config.language = "EN";
		}

		const fresh = await repo.getByCode(code);
		expect(fresh?.players.length).toBe(0);
		expect(fresh?.comments.length).toBe(0);
		expect(fresh?.config.language).toBe("ES");
	});
});
