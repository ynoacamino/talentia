/**
 * TALENTIA / SocraticGuild — In-Memory Session Repository Implementation
 * ISessionRepository implementation with atomic cascade hard-delete (Ley 29733).
 * SPEC §2, §11, §13, §17 & docs/gates/F0-contrato.md.
 */

import {
	type ChecklistStep,
	codeGen,
	type DrawSubmission,
	type EventLogEntry,
	type IEventLogPort,
	type ISessionRepository,
	isValidCode,
	type JudgeScores,
	type PlayerCard,
	type SessionComment,
	type SessionConfig,
	type SessionRecord,
	type SessionStatus,
	type SessionSummary,
	type SharedInventory,
	type TranscriptTurn,
} from "@/shared/documents.ts";

export class InMemorySessionRepository implements ISessionRepository {
	private readonly sessions = new Map<string, SessionRecord>();
	private readonly sessionsById = new Map<string, string>(); // sessionId -> code
	private eventLog?: IEventLogPort;

	constructor(eventLog?: IEventLogPort) {
		this.eventLog = eventLog;
	}

	/**
	 * Injects or updates the associated EventLogPort for cascading deletions.
	 */
	setEventLog(eventLog: IEventLogPort): void {
		this.eventLog = eventLog;
	}

	/**
	 * Returns the associated EventLogPort.
	 */
	getEventLog(): IEventLogPort | undefined {
		return this.eventLog;
	}

	/**
	 * Resolves a 4-char session code or sessionId into the canonical 4-char code.
	 */
	private resolveCode(codeOrId: string): string {
		if (this.sessions.has(codeOrId)) {
			return codeOrId;
		}
		return this.sessionsById.get(codeOrId) ?? codeOrId;
	}

	/**
	 * Creates a new session record.
	 * Generates a 4-character code without confusables (0, O, 1, I, L) unless initialCode is provided.
	 */
	async create(
		config: SessionConfig,
		initialCode?: string,
	): Promise<SessionRecord> {
		let finalCode: string;

		if (initialCode !== undefined) {
			if (!isValidCode(initialCode)) {
				throw new Error(
					`Invalid session code "${initialCode}": must be 4 characters without 0, O, 1, I, L`,
				);
			}
			if (this.sessions.has(initialCode)) {
				throw new Error(`Session with code "${initialCode}" already exists`);
			}
			finalCode = initialCode;
		} else {
			let attempts = 0;
			do {
				finalCode = codeGen();
				attempts++;
				if (attempts > 50) {
					throw new Error(
						"Failed to generate unique session code after 50 attempts",
					);
				}
			} while (this.sessions.has(finalCode));
		}

		const now = Date.now();
		const id = crypto.randomUUID();

		const initialChecklist: readonly ChecklistStep[] = [
			{
				stepNumber: 1,
				id: "conseguir_madera",
				station: "chacra",
				status: "todo",
				forced: false,
			},
			{
				stepNumber: 2,
				id: "aprobar_diseno",
				station: "taller",
				status: "todo",
				forced: false,
			},
			{
				stepNumber: 3,
				id: "permiso_alcaldia",
				station: "alcaldía",
				status: "todo",
				forced: false,
			},
		];

		const initialInventory: SharedInventory = {
			madera: false,
			plano: false,
			sello: false,
		};

		const record: SessionRecord = {
			id,
			code: finalCode,
			config: { ...config },
			status: "created",
			currentStation: "campamento",
			gameTimeRemainingMs: config.durationGameMs,
			stallCountdownSeconds: 150,
			players: [],
			inventory: initialInventory,
			checklist: initialChecklist,
			transcripts: [],
			drawings: [],
			events: [],
			scores: null,
			comments: [],
			createdAtWallMs:
				config.createdAtWallMs > 0 ? config.createdAtWallMs : now,
			updatedAtWallMs: now,
		};

		this.sessions.set(finalCode, record);
		this.sessionsById.set(id, finalCode);

		return this.cloneRecord(record);
	}

	/**
	 * Retrieves a session record by its 4-character code or sessionId.
	 * Returns null if not found.
	 */
	async getByCode(code: string): Promise<SessionRecord | null> {
		const canonicalCode = this.resolveCode(code);
		const found = this.sessions.get(canonicalCode);
		if (!found) {
			return null;
		}
		return this.cloneRecord(found);
	}

	/**
	 * Lists summaries of all stored sessions, sorted chronologically descending.
	 */
	async listPast(): Promise<SessionSummary[]> {
		const summaries: SessionSummary[] = [];

		for (const record of this.sessions.values()) {
			const isFinished =
				record.status === "finished" || (record.scores?.isFinished ?? false);
			const conApoyoDocente =
				record.scores?.conApoyoDocente ??
				record.checklist.some((s) => s.forced);

			summaries.push({
				code: record.code,
				createdAtWallMs: record.createdAtWallMs,
				language: record.config.language,
				playerCount: record.players.length,
				stars: record.scores?.stars ?? null,
				isFinished,
				conApoyoDocente,
			});
		}

		// Sort most recent first
		summaries.sort((a, b) => b.createdAtWallMs - a.createdAtWallMs);

		return summaries;
	}

	/**
	 * Updates the status of an existing session.
	 */
	async updateStatus(code: string, status: SessionStatus): Promise<void> {
		const canonicalCode = this.resolveCode(code);
		const record = this.sessions.get(canonicalCode);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		const updated: SessionRecord = {
			...record,
			status,
			updatedAtWallMs: Date.now(),
		};

		this.sessions.set(canonicalCode, updated);
	}

	/**
	 * Appends an immutable pedagogical observation comment by the teacher.
	 * Strictly append-only: no edits, no individual deletions.
	 */
	async addComment(code: string, text: string): Promise<SessionComment> {
		const canonicalCode = this.resolveCode(code);
		const record = this.sessions.get(canonicalCode);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		if (!text || text.trim().length === 0) {
			throw new Error("Comment text cannot be empty");
		}

		const now = Date.now();
		const comment: SessionComment = {
			id: crypto.randomUUID(),
			sessionId: record.id,
			text: text.trim(),
			author: "teacher",
			wall_ts_ms: now,
		};

		const updated: SessionRecord = {
			...record,
			comments: [...record.comments, comment],
			updatedAtWallMs: now,
		};

		this.sessions.set(canonicalCode, updated);

		return { ...comment };
	}

	/**
	 * Saves judge scores and pedagogical evaluation context.
	 */
	async saveScores(code: string, scores: JudgeScores): Promise<void> {
		const canonicalCode = this.resolveCode(code);
		const record = this.sessions.get(canonicalCode);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		const updated: SessionRecord = {
			...record,
			scores: { ...scores },
			updatedAtWallMs: Date.now(),
		};

		this.sessions.set(canonicalCode, updated);
	}

	/**
	 * Atomic cascading purge of all session data (Ley 29733 compliance).
	 * Completely removes session, transcripts, drawings, thumbnails, vision reads,
	 * comments, judge scores, and associated telemetry events.
	 */
	async hardDelete(code: string): Promise<boolean> {
		const canonicalCode = this.resolveCode(code);
		const record = this.sessions.get(canonicalCode);
		if (!record) {
			return false;
		}

		const sessionId = record.id;

		// Cascade purge in linked event log if available
		if (this.eventLog) {
			await this.eventLog.deleteBySession(sessionId);
		}

		// Atomic removal from in-memory stores
		this.sessionsById.delete(sessionId);
		this.sessions.delete(canonicalCode);

		return true;
	}

	// ========================================================================
	// MUTATION HELPERS FOR DOMAIN WORKFLOWS & FIXTURES
	// ========================================================================

	/**
	 * Adds or updates a player card in the session.
	 */
	async addPlayer(code: string, player: PlayerCard): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		const existingIndex = record.players.findIndex(
			(p) => p.slotIndex === player.slotIndex,
		);
		const newPlayers = [...record.players];

		if (existingIndex >= 0) {
			newPlayers[existingIndex] = { ...player };
		} else {
			newPlayers.push({ ...player });
		}

		this.sessions.set(code, {
			...record,
			players: newPlayers,
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Appends a diarized transcript turn to the session.
	 */
	async addTranscript(code: string, transcript: TranscriptTurn): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		this.sessions.set(code, {
			...record,
			transcripts: [...record.transcripts, { ...transcript }],
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Appends a drawing submission to the session.
	 */
	async addDrawing(code: string, drawing: DrawSubmission): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		this.sessions.set(code, {
			...record,
			drawings: [...record.drawings, { ...drawing }],
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Updates the shared inventory.
	 */
	async updateInventory(
		code: string,
		inventory: SharedInventory,
	): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		this.sessions.set(code, {
			...record,
			inventory: { ...inventory },
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Updates the checklist steps.
	 */
	async updateChecklist(
		code: string,
		checklist: readonly ChecklistStep[],
	): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		this.sessions.set(code, {
			...record,
			checklist: [...checklist],
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Attaches an event directly to the session record.
	 */
	async attachEvent(code: string, event: EventLogEntry): Promise<void> {
		const record = this.sessions.get(code);
		if (!record) {
			throw new Error(`Session with code "${code}" not found`);
		}

		this.sessions.set(code, {
			...record,
			events: [...record.events, { ...event }],
			updatedAtWallMs: Date.now(),
		});
	}

	/**
	 * Returns total count of active stored sessions.
	 */
	count(): number {
		return this.sessions.size;
	}

	/**
	 * Clears all sessions (testing helper).
	 */
	clear(): void {
		this.sessions.clear();
		this.sessionsById.clear();
	}

	/**
	 * Clones a session record to guarantee caller immutability.
	 */
	private cloneRecord(record: SessionRecord): SessionRecord {
		return {
			...record,
			config: { ...record.config },
			inventory: { ...record.inventory },
			players: record.players.map((p) => ({ ...p })),
			checklist: record.checklist.map((c) => ({ ...c })),
			transcripts: record.transcripts.map((t) => ({ ...t })),
			drawings: record.drawings.map((d) => ({
				...d,
				strokes: d.strokes.map((s) => ({
					...s,
					points: s.points.map((pt) => ({ ...pt })),
				})),
				visionRead: d.visionRead
					? {
							...d.visionRead,
							objects: [...d.visionRead.objects],
							actions: [...d.visionRead.actions],
							measures: [...d.visionRead.measures],
							routes: [...d.visionRead.routes],
							labelsOrMarks: [...d.visionRead.labelsOrMarks],
							confidence: { ...d.visionRead.confidence },
						}
					: null,
			})),
			events: record.events.map((e) => ({ ...e })),
			scores: record.scores
				? {
						...record.scores,
						earnedBadges: record.scores.earnedBadges.map((b) => ({ ...b })),
						groupCriteria: {
							turnTaking: { ...record.scores.groupCriteria.turnTaking },
							colaboracion: { ...record.scores.groupCriteria.colaboracion },
							negociacion: { ...record.scores.groupCriteria.negociacion },
							resolucionEstructurada: {
								...record.scores.groupCriteria.resolucionEstructurada,
							},
							organizacionLiderazgo: {
								...record.scores.groupCriteria.organizacionLiderazgo,
							},
						},
						students: record.scores.students.map((s) => ({ ...s })),
					}
				: null,
			comments: record.comments.map((c) => ({ ...c })),
		};
	}
}
