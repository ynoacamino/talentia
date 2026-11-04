/**
 * TALENTIA / SocraticGuild — Zustand Stores & Document Contract Integration Tests
 * SPEC §2, §11, §13, §17, §19 & docs/gates/F0-contrato.md.
 *
 * Verifies:
 * 1. Lifecycle: session creation -> list loading -> detail querying.
 * 2. addComment: append-only, wall timestamp, absence of edit/delete methods.
 * 3. hardDelete: cascading purge & reactive state update in past sessions list.
 * 4. Inmutability preservation of JudgeScores and evaluation evidence.
 * 5. SOLID (D) compliance: store as a reactive mirror of ISessionRepository with 0 fetch/SQLite calls.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	createInMemorySessionRepository,
	deepFreeze,
	getDefaultSessionRepository,
	selectEarnedBadges,
	selectGroupCriteria,
	selectStudentEvaluations,
	setDefaultSessionRepository,
	useDocenteStore,
	useSessionDetailStore,
	useSessionListStore,
} from "@/game/stores/sessionStore.ts";
import { LOCKED_STRINGS } from "@/shared/constants.ts";
import type {
	DrawSubmission,
	ISessionRepository,
	JudgeScores,
	SessionConfig,
	TranscriptTurn,
} from "@/shared/documents.ts";

describe("TALENTIA Zustand Stores & Contract Integration (SPEC §2, §11, §13, §17)", () => {
	let repo: ReturnType<typeof createInMemorySessionRepository>;

	const sampleConfig: SessionConfig = {
		language: "ES",
		expectedPlayers: 4,
		durationMinutes: 5,
		durationGameMs: 300000,
		createdAtWallMs: 1730700000000,
		locked: false,
	};

	beforeEach(() => {
		repo = createInMemorySessionRepository();
		setDefaultSessionRepository(repo);
		useSessionListStore.getState().reset();
		useSessionDetailStore.getState().reset();
		useDocenteStore.getState().reset();
	});

	afterEach(() => {
		repo.clear();
	});

	// ========================================================================
	// 1. SOLID (D) DEPENDENCY INVERSION & REPOSITORY ISOLATION
	// ========================================================================

	describe("SOLID (D) Dependency Inversion Contract", () => {
		it("stores act as mirrors of ISessionRepository with zero fetch or SQLite direct calls", () => {
			expect(getDefaultSessionRepository()).toBeDefined();

			// Custom mock repository implementing ISessionRepository
			let listPastCalled = false;
			const customMockRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async (code) => repo.getByCode(code),
				listPast: async () => {
					listPastCalled = true;
					return [];
				},
				updateStatus: async (code, st) => repo.updateStatus(code, st),
				addComment: async (code, txt) => repo.addComment(code, txt),
				saveScores: async (code, sc) => repo.saveScores(code, sc),
				hardDelete: async (code) => repo.hardDelete(code),
			};

			useSessionListStore.getState().loadSessions(customMockRepo);
			expect(listPastCalled).toBe(true);
		});

		it("allows switching global default repository via setDefaultSessionRepository", async () => {
			const anotherRepo = createInMemorySessionRepository();
			setDefaultSessionRepository(anotherRepo);
			expect(getDefaultSessionRepository()).toBe(anotherRepo);

			await useSessionListStore.getState().createSession(sampleConfig);
			const summaries = await anotherRepo.listPast();
			expect(summaries.length).toBe(1);
			expect(repo.count()).toBe(0); // Original repo remains untouched
		});
	});

	// ========================================================================
	// 2. CICLO DE VIDA: CREACIÓN → CARGA EN LISTA → CONSULTA DE DETALLE
	// ========================================================================

	describe("Lifecycle Contract: Creation -> List Loading -> Detail Querying", () => {
		it("completes full lifecycle: creates session, mirrors in list, loads detail with transcripts and drawings", async () => {
			const listStore = useSessionListStore.getState();
			const detailStore = useSessionDetailStore.getState();

			// Initial state
			expect(listStore.sessions.length).toBe(0);
			expect(detailStore.activeSession).toBeNull();

			// 1. Creation
			const createdRecord = await listStore.createSession(sampleConfig);

			expect(createdRecord).toBeDefined();
			expect(createdRecord.code).toMatch(
				/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
			);
			expect(createdRecord.status).toBe("created");
			expect(createdRecord.currentStation).toBe("campamento");
			expect(createdRecord.checklist.length).toBe(3);
			expect(createdRecord.checklist[0]?.id).toBe("conseguir_madera");
			expect(createdRecord.checklist[1]?.id).toBe("aprobar_diseno");
			expect(createdRecord.checklist[2]?.id).toBe("permiso_alcaldia");
			expect(createdRecord.inventory).toEqual({
				madera: false,
				plano: false,
				sello: false,
			});

			// 2. List loading & selection
			const currentList = useSessionListStore.getState().sessions;
			expect(currentList.length).toBe(1);
			expect(currentList[0]?.code).toBe(createdRecord.code);
			expect(currentList[0]?.language).toBe("ES");
			expect(currentList[0]?.playerCount).toBe(0);
			expect(currentList[0]?.isFinished).toBe(false);
			expect(currentList[0]?.stars).toBeNull();
			expect(useSessionListStore.getState().selectedCode).toBe(
				createdRecord.code,
			);

			// 3. Detail querying
			const loadedDetail = await detailStore.loadSession(createdRecord.code);
			expect(loadedDetail).not.toBeNull();
			expect(loadedDetail?.id).toBe(createdRecord.id);
			expect(loadedDetail?.code).toBe(createdRecord.code);
			expect(useSessionDetailStore.getState().activeSession?.code).toBe(
				createdRecord.code,
			);

			// 4. Status update through detail store
			await useSessionDetailStore.getState().updateStatus("playing");
			expect(useSessionDetailStore.getState().activeSession?.status).toBe(
				"playing",
			);
			const refreshedInRepo = await repo.getByCode(createdRecord.code);
			expect(refreshedInRepo?.status).toBe("playing");

			// 5. Reactive detail feed: transcripts & drawings
			const mockTurn: TranscriptTurn = {
				id: "turn-1",
				turnIndex: 0,
				holderPlayerId: "player-zorro",
				audioDurationMs: 2500,
				sendReason: "release",
				rawText: "vamos a la chacra por madera",
				paraphraseEs: "propone ir a la chacra",
				suspectedOverlap: false,
				gameTsMs: 12000,
				wallTsMs: Date.now(),
			};
			useSessionDetailStore.getState().addTranscriptTurn(mockTurn);
			expect(
				useSessionDetailStore.getState().activeSession?.transcripts.length,
			).toBe(1);

			const mockDraw: DrawSubmission = {
				id: "draw-1",
				stationId: "taller",
				playerId: "player-zorro",
				strokes: [
					{
						color: "azul",
						brushSize: 4,
						points: [{ x: 10, y: 20, timeOffsetMs: 50 }],
					},
				],
				imageJpegBase64: "data:image/jpeg;base64,mock",
				thumbBase64: "data:image/jpeg;base64,mockthumb",
				gameTsMs: 45000,
				wallTsMs: Date.now(),
				visionRead: null,
			};
			useSessionDetailStore.getState().addDrawingSubmission(mockDraw);
			expect(
				useSessionDetailStore.getState().activeSession?.drawings.length,
			).toBe(1);

			// 6. Clear & reset detail store
			detailStore.clear();
			expect(useSessionDetailStore.getState().activeSession).toBeNull();
		});

		it("handles non-existent session detail query gracefully without uncaught exceptions", async () => {
			const detail = await useSessionDetailStore.getState().loadSession("XXXX");
			expect(detail).toBeNull();
			expect(useSessionDetailStore.getState().activeSession).toBeNull();
			expect(useSessionDetailStore.getState().error).toBe(
				'Session "XXXX" not found',
			);
		});

		it("selectSession updates selectedCode in useSessionListStore", () => {
			useSessionListStore.getState().selectSession("W4MZ");
			expect(useSessionListStore.getState().selectedCode).toBe("W4MZ");
			useSessionListStore.getState().selectSession(null);
			expect(useSessionListStore.getState().selectedCode).toBeNull();
		});
	});

	// ========================================================================
	// 3. TEST DE ADDCOMMENT: APPEND-ONLY, WALL TIMESTAMP Y AUSENCIA DE EDICIÓN
	// ========================================================================

	describe("Comment Thread (Add-Only §11, §17, D5)", () => {
		it("appends observations with wall timestamp and enforces strict append-only semantics", async () => {
			const created = await repo.create(sampleConfig);
			const docenteStore = useDocenteStore.getState();

			await docenteStore.loadDocenteView(created.code);
			expect(docenteStore.comments.length).toBe(0);

			const beforeTime = Date.now();
			const comment1 = await useDocenteStore
				.getState()
				.addComment(created.code, "Buena coordinación inicial del equipo");
			const afterTime = Date.now();

			// Wall timestamp verification
			expect(comment1.id).toBeDefined();
			expect(comment1.sessionId).toBe(created.id);
			expect(comment1.text).toBe("Buena coordinación inicial del equipo");
			expect(comment1.author).toBe("teacher");
			expect(comment1.wall_ts_ms).toBeGreaterThanOrEqual(beforeTime);
			expect(comment1.wall_ts_ms).toBeLessThanOrEqual(afterTime);

			// Append-only reactive list
			const comment2 = await useDocenteStore
				.getState()
				.addComment(created.code, "Zorro cedió el turno a Búho");
			expect(comment2.id).toBeDefined();

			const currentComments = useDocenteStore.getState().comments;
			expect(currentComments.length).toBe(2);
			expect(currentComments[0]?.text).toBe(
				"Buena coordinación inicial del equipo",
			);
			expect(currentComments[1]?.text).toBe("Zorro cedió el turno a Búho");

			// Inmutability check: cannot mutate array
			expect(() => {
				(currentComments as unknown as unknown[]).push({} as unknown);
			}).toThrow();

			// Inmutability check: cannot edit individual comment properties
			expect(() => {
				(comment1 as unknown as { text: string }).text = "Modificado";
			}).toThrow();
		});

		it("verifies the total absence of edit/delete/update comment methods on useDocenteStore and repository", () => {
			const storeState = useDocenteStore.getState();
			const untypedStore = storeState as unknown as Record<string, unknown>;

			// Absolutely no comment mutation or deletion methods
			expect(untypedStore.updateComment).toBeUndefined();
			expect(untypedStore.editComment).toBeUndefined();
			expect(untypedStore.deleteComment).toBeUndefined();
			expect(untypedStore.removeComment).toBeUndefined();
			expect(untypedStore.clearComments).toBeUndefined();

			const untypedRepo = repo as unknown as Record<string, unknown>;
			expect(untypedRepo.updateComment).toBeUndefined();
			expect(untypedRepo.editComment).toBeUndefined();
			expect(untypedRepo.deleteComment).toBeUndefined();
			expect(untypedRepo.removeComment).toBeUndefined();
		});

		it("rejects empty comments or comments for nonexistent sessions with descriptive errors", async () => {
			await expect(
				useDocenteStore.getState().addComment("INVL", "   "),
			).rejects.toThrow();

			const created = await repo.create(sampleConfig);
			await expect(
				useDocenteStore.getState().addComment(created.code, ""),
			).rejects.toThrow("Comment text cannot be empty");
		});
	});

	// ========================================================================
	// 4. TEST DE HARDDELETE: BORRADO EN CASCADA Y ACTUALIZACIÓN REACTIVA
	// ========================================================================

	describe("Cascading Hard-Delete & Reactive Eviction (Ley 29733, SPEC §2, §17, D5)", () => {
		it("purges session and all linked data in cascade and reactively removes it from list", async () => {
			const listStore = useSessionListStore.getState();

			// 1. Create two sessions
			const s1 = await listStore.createSession(sampleConfig);
			const s2 = await listStore.createSession({
				...sampleConfig,
				language: "QUZ",
			});

			// Verify both in list
			expect(useSessionListStore.getState().sessions.length).toBe(2);

			// Add comments and events to s1
			await repo.addComment(s1.code, "Observación confidencial");
			await repo.addTranscript(s1.code, {
				id: "t1",
				turnIndex: 0,
				holderPlayerId: "p1",
				audioDurationMs: 1000,
				sendReason: "release",
				rawText: "audio",
				paraphraseEs: "audio",
				suspectedOverlap: false,
				gameTsMs: 1000,
				wallTsMs: Date.now(),
			});

			useSessionListStore.getState().selectSession(s1.code);
			expect(useSessionListStore.getState().selectedCode).toBe(s1.code);

			// 2. Perform hardDelete on s1
			const deleted = await useSessionListStore
				.getState()
				.hardDeleteSession(s1.code);
			expect(deleted).toBe(true);

			// 3. Reactive state update in store: s1 gone, s2 remains
			const remainingSessions = useSessionListStore.getState().sessions;
			expect(remainingSessions.length).toBe(1);
			expect(remainingSessions[0]?.code).toBe(s2.code);
			expect(remainingSessions.find((s) => s.code === s1.code)).toBeUndefined();

			// Selected code cleared reactively
			expect(useSessionListStore.getState().selectedCode).toBeNull();

			// 4. Absolute repository cascade purge
			const queriedS1 = await repo.getByCode(s1.code);
			expect(queriedS1).toBeNull();

			// Event log cascade purge
			const eventLog = repo.getEventLog();
			if (eventLog) {
				const s1Events = await eventLog.getBySession(s1.id);
				expect(s1Events.length).toBe(0);
			}
		});

		it("returns false and preserves list when attempting to delete a non-existent code", async () => {
			await useSessionListStore.getState().createSession(sampleConfig);
			expect(useSessionListStore.getState().sessions.length).toBe(1);

			const result = await useSessionListStore
				.getState()
				.hardDeleteSession("NONX");
			expect(result).toBe(false);
			expect(useSessionListStore.getState().sessions.length).toBe(1);
		});
	});

	// ========================================================================
	// 5. TEST DE PRESERVACIÓN DE INMUTABILIDAD DE JUDGESCORES
	// ========================================================================

	describe("Immutability Preservation of JudgeScores (SPEC §11, D4)", () => {
		const mockScores: JudgeScores = {
			id: "judge-eval-1",
			sessionId: "session-123",
			sumPoints: 8,
			stars: 3,
			isFinished: true,
			conApoyoDocente: false,
			evaluatedAtWallMs: 1730700050000,
			earnedBadges: [
				{
					id: "paso_a_paso",
					name: "Paso a paso",
					quoteInRunLanguage: "Primero la madera, luego el plano",
				},
				{
					id: "cumplieron_su_promesa",
					name: "Cumplieron su promesa",
					quoteInRunLanguage: "Acordaron regar y lo cumplieron",
				},
			],
			groupCriteria: {
				turnTaking: {
					score: 2,
					evidenceQuote: "Esperaron su turno sin interrumpir",
				},
				colaboracion: {
					score: 1,
					evidenceQuote: "Construyeron sobre la idea de Paco",
				},
				negociacion: {
					score: 2,
					evidenceQuote: "Ofrecieron ayuda concreta al agricultor",
				},
				resolucionEstructurada: {
					score: 2,
					evidenceQuote: "Siguieron la secuencia chacra taller alcaldia",
				},
				organizacionLiderazgo: {
					score: 1,
					evidenceQuote: "Rotaron el liderazgo entre Zorro y Búho",
				},
			},
			students: [
				{
					playerId: "player-zorro",
					avatar: "Zorro",
					name: "Mateo",
					participacion: 2,
					propuesta: 2,
					organizacion: 1,
					anecdote: "Propuso el plan de cruce",
					turnCount: 5,
					drawCount: 1,
				},
				{
					playerId: "player-buho",
					avatar: "Búho",
					name: "Sofía",
					participacion: 2,
					propuesta: 1,
					organizacion: 2,
					anecdote: "Organizó los turnos de dibujo",
					turnCount: 4,
					drawCount: 2,
				},
			],
		};

		it("displays the mandatory locked banner 'señales preliminares, no notas'", () => {
			expect(useDocenteStore.getState().bannerNotice).toBe(
				LOCKED_STRINGS.DOCENTE_BANNER,
			);
			expect(useDocenteStore.getState().bannerNotice).toBe(
				"señales preliminares, no notas",
			);
		});

		it("preserves runtime deep immutability on loaded JudgeScores, criteria, badges and students", async () => {
			const s = await repo.create(sampleConfig);
			await repo.saveScores(s.code, mockScores);

			const loaded = await useDocenteStore.getState().loadDocenteView(s.code);
			expect(loaded).not.toBeNull();

			const state = useDocenteStore.getState();
			expect(state.scores).not.toBeNull();
			expect(state.scores?.sumPoints).toBe(8);
			expect(state.scores?.stars).toBe(3);

			// 1. Root scores object is frozen
			expect(() => {
				(state.scores as unknown as { sumPoints: number }).sumPoints = 10;
			}).toThrow();

			// 2. Group criteria breakdown is frozen
			expect(() => {
				(
					state.scores?.groupCriteria.turnTaking as unknown as {
						score: number;
					}
				).score = 0;
			}).toThrow();

			expect(() => {
				(
					state.scores?.groupCriteria.turnTaking as unknown as {
						evidenceQuote: string;
					}
				).evidenceQuote = "Alterada";
			}).toThrow();

			// 3. Student evaluation cards are frozen
			const scores = state.scores;
			if (!scores) {
				throw new Error("scores must be defined");
			}

			const firstStudent = scores.students[0];
			if (!firstStudent) {
				throw new Error("firstStudent must be defined");
			}

			expect(() => {
				(firstStudent as unknown as { participacion: number }).participacion =
					0;
			}).toThrow();

			const studentsArray = scores.students as unknown as unknown[];
			expect(() => {
				studentsArray.push({} as unknown);
			}).toThrow();

			// 4. Earned badges array and objects are frozen
			const badgesArray = scores.earnedBadges as unknown as unknown[];
			expect(() => {
				badgesArray.push({} as unknown);
			}).toThrow();

			// 5. Selectors extract frozen parts safely
			const criteria = selectGroupCriteria(state);
			expect(criteria?.resolucionEstructurada.score).toBe(2);

			const students = selectStudentEvaluations(state);
			expect(students.length).toBe(2);
			expect(students[0]?.name).toBe("Mateo");

			const badges = selectEarnedBadges(state);
			expect(badges.length).toBe(2);
			expect(badges[0]?.id).toBe("paso_a_paso");
		});

		it("verifies absence of score mutation methods on useDocenteStore", () => {
			const storeState = useDocenteStore.getState();
			const untyped = storeState as unknown as Record<string, unknown>;

			expect(untyped.updateScore).toBeUndefined();
			expect(untyped.editScore).toBeUndefined();
			expect(untyped.deleteScore).toBeUndefined();
			expect(untyped.modifyCriterion).toBeUndefined();
			expect(untyped.overrideJudge).toBeUndefined();
		});

		it("setScores applies deepFreeze to scores saved into store", async () => {
			const s = await repo.create(sampleConfig);
			useDocenteStore.getState().reset();

			await useDocenteStore.getState().setScores({
				...mockScores,
				sessionId: s.id,
			});

			const state = useDocenteStore.getState();
			expect(state.scores?.sumPoints).toBe(8);
			expect(() => {
				(state.scores as unknown as { sumPoints: number }).sumPoints = 5;
			}).toThrow();
		});
	});

	// ========================================================================
	// 6. DEEPFREEZE UTILITY UNIT TESTS
	// ========================================================================

	describe("deepFreeze utility function", () => {
		it("handles primitives, null, and undefined without error", () => {
			expect(deepFreeze(null)).toBeNull();
			expect(deepFreeze(undefined)).toBeUndefined();
			expect(deepFreeze(42)).toBe(42);
			expect(deepFreeze("test")).toBe("test");
			expect(deepFreeze(true)).toBe(true);
		});

		it("deeply freezes nested objects and arrays", () => {
			const complex = {
				a: { b: [1, 2, { c: "deep" }] },
			};
			const frozen = deepFreeze(complex);
			expect(Object.isFrozen(frozen)).toBe(true);
			expect(Object.isFrozen(frozen.a)).toBe(true);
			expect(Object.isFrozen(frozen.a.b)).toBe(true);
			expect(Object.isFrozen(frozen.a.b[2])).toBe(true);
		});
	});

	// ========================================================================
	// 7. ERROR HANDLING & STORE RECOVERY
	// ========================================================================

	describe("Store Error Handling & Recovery", () => {
		it("captures error in useSessionListStore if repo.create fails", async () => {
			const failingRepo: ISessionRepository = {
				create: async () => {
					throw new Error("Disk full");
				},
				getByCode: async () => null,
				listPast: async () => [],
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => false,
			};

			await expect(
				useSessionListStore.getState().createSession(sampleConfig, failingRepo),
			).rejects.toThrow("Disk full");

			expect(useSessionListStore.getState().error).toBe("Disk full");
			expect(useSessionListStore.getState().isLoading).toBe(false);
		});

		it("captures error in useSessionListStore if repo.loadSessions fails", async () => {
			const failingRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async () => null,
				listPast: async () => {
					throw new Error("Connection lost");
				},
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => false,
			};

			await expect(
				useSessionListStore.getState().loadSessions(failingRepo),
			).rejects.toThrow("Connection lost");

			expect(useSessionListStore.getState().error).toBe("Connection lost");
			expect(useSessionListStore.getState().isLoading).toBe(false);
		});

		it("captures error in useSessionDetailStore if repo fails", async () => {
			const failingRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async () => {
					throw new Error("Read timeout");
				},
				listPast: async () => [],
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => false,
			};

			await expect(
				useSessionDetailStore.getState().loadSession("K7NP", failingRepo),
			).rejects.toThrow("Read timeout");

			expect(useSessionDetailStore.getState().error).toBe("Read timeout");
		});

		it("throws error in useSessionDetailStore.updateStatus when no active session", async () => {
			useSessionDetailStore.getState().clear();
			await expect(
				useSessionDetailStore.getState().updateStatus("playing"),
			).rejects.toThrow("No active session to update status");
		});

		it("resets all stores cleanly to default states", async () => {
			await useSessionListStore.getState().createSession(sampleConfig);
			useSessionListStore.getState().reset();
			expect(useSessionListStore.getState().sessions.length).toBe(0);
			expect(useSessionListStore.getState().selectedCode).toBeNull();

			useDocenteStore.getState().reset();
			expect(useDocenteStore.getState().scores).toBeNull();
			expect(useDocenteStore.getState().comments.length).toBe(0);
			expect(useDocenteStore.getState().activeCode).toBeNull();
		});

		it("covers defensive guards when mutating transcripts or drawings with no active session", () => {
			const detailStore = useSessionDetailStore.getState();
			detailStore.clear();

			// Calling guards with null activeSession returns safely without throwing
			detailStore.addTranscriptTurn({
				id: "t0",
				turnIndex: 0,
				holderPlayerId: "p1",
				audioDurationMs: 500,
				sendReason: "release",
				rawText: "hola",
				paraphraseEs: "hola",
				suspectedOverlap: false,
				gameTsMs: 0,
				wallTsMs: 1,
			});
			expect(detailStore.activeSession).toBeNull();

			detailStore.addDrawingSubmission({
				id: "d0",
				stationId: "chacra",
				playerId: "p1",
				strokes: [],
				imageJpegBase64: "",
				thumbBase64: "",
				gameTsMs: 0,
				wallTsMs: 1,
				visionRead: null,
			});
			expect(detailStore.activeSession).toBeNull();

			// Test setActiveSession and syncFromRecord
			detailStore.setActiveSession(null);
			expect(detailStore.activeSession).toBeNull();

			const dummyRecord = {
				id: "dummy",
				code: "DUMM",
				config: sampleConfig,
				status: "created" as const,
				currentStation: "campamento" as const,
				gameTimeRemainingMs: 1000,
				stallCountdownSeconds: 0,
				players: [],
				inventory: { madera: false, plano: false, sello: false },
				checklist: [],
				transcripts: [],
				drawings: [],
				events: [],
				scores: null,
				comments: [],
				createdAtWallMs: 1,
				updatedAtWallMs: 1,
			};
			detailStore.syncFromRecord(dummyRecord);
			expect(useSessionDetailStore.getState().activeSession?.code).toBe("DUMM");
		});

		it("covers loadDocenteView when session not found or when repo throws", async () => {
			const docenteStore = useDocenteStore.getState();

			// 1. Session not found
			const res = await docenteStore.loadDocenteView("NOTF");
			expect(res).toBeNull();
			expect(useDocenteStore.getState().error).toBe('Session "NOTF" not found');

			// 2. Repo throws
			const failingRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async () => {
					throw new Error("Docente repo error");
				},
				listPast: async () => [],
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => false,
			};

			await expect(
				docenteStore.loadDocenteView("ERRC", failingRepo),
			).rejects.toThrow("Docente repo error");
			expect(useDocenteStore.getState().error).toBe("Docente repo error");
		});

		it("captures error in useSessionListStore.hardDeleteSession if repo fails", async () => {
			const failingRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async () => null,
				listPast: async () => [],
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => {
					throw new Error("Hard delete disk failure");
				},
			};

			await expect(
				useSessionListStore.getState().hardDeleteSession("DELF", failingRepo),
			).rejects.toThrow("Hard delete disk failure");
			expect(useSessionListStore.getState().error).toBe(
				"Hard delete disk failure",
			);
		});

		it("covers updateStatus fallback when repo.getByCode returns null", async () => {
			const detailStore = useSessionDetailStore.getState();
			detailStore.syncFromRecord({
				id: "dummy",
				code: "DUMM",
				config: sampleConfig,
				status: "created",
				currentStation: "campamento",
				gameTimeRemainingMs: 1000,
				stallCountdownSeconds: 0,
				players: [],
				inventory: { madera: false, plano: false, sello: false },
				checklist: [],
				transcripts: [],
				drawings: [],
				events: [],
				scores: null,
				comments: [],
				createdAtWallMs: 1,
				updatedAtWallMs: 1,
			});

			const nullRefreshRepo: ISessionRepository = {
				create: async (cfg) => repo.create(cfg),
				getByCode: async () => null,
				listPast: async () => [],
				updateStatus: async () => {},
				addComment: async () => {
					throw new Error();
				},
				saveScores: async () => {},
				hardDelete: async () => false,
			};

			await detailStore.updateStatus("playing", nullRefreshRepo);
			expect(useSessionDetailStore.getState().activeSession?.status).toBe(
				"playing",
			);
		});
	});
});
