/**
 * Teacher Store (Modo Docente / Operador /teacher)
 * Conforme a SPEC §2, §11, §13, §17
 */
import { create } from "zustand";
import { getAIRetryQueue } from "@/core/reliability/retryQueue.ts";
import {
	createSessionSyncBus,
	type SessionSyncBus,
	type SyncMessage,
} from "@/core/sync/sessionSync.ts";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import { codeGen } from "@/shared/codeGen.ts";
import type {
	CriterionScore,
	ISessionRepository,
	ISyncSessionRepository,
	Language,
	PlayerCard,
	SessionConfig,
	StarRating,
} from "@/shared/documents.ts";
import { starsFor } from "@/shared/scoring.ts";
import {
	STATIONS,
	type StationId,
	type SubtitleLine,
} from "@/ui/play/playStore.ts";
import { KID_AVATARS } from "@/ui/tokens/avatars.ts";
import type { GroupScores } from "@/ui/tokens/badges.ts";

export type SessionLanguage = Language;

export type ParticipantCardStatus =
	| "claimed"
	| "confirmed"
	| "speaking"
	| "drawing"
	| "retired";

export interface StudentEvaluation {
	studentId: string;
	studentName: string;
	avatarId: string;
	confirmed?: boolean;
	status?: ParticipantCardStatus;
	participacion: CriterionScore; // 0..2
	propuesta: CriterionScore; // 0..2
	organizacion: CriterionScore; // 0..2
	anecdote: string;
	voiceTurns: number;
	drawsCount: number;
	retired: boolean;
	retiredAt?: string;
}

export type ClosedEventType =
	| "press"
	| "blocked_press"
	| "speech_start"
	| "speech_end"
	| "transcript"
	| "suspected_overlap"
	| "draw_start"
	| "draw_submit"
	| "vision_read"
	| "move_propose"
	| "move_veto"
	| "move_execute"
	| "refusal"
	| "hint_level"
	| "grant_step"
	| "npc_line"
	| "time_skip"
	| "judge_scores";

export interface MirrorTranscript {
	id: string;
	holder: string;
	text: string;
	time: string;
	avatarId: string;
	game_ts_ms: number;
	wall_ts_ms: number;
}

export interface MirrorEvent {
	id: string;
	type: ClosedEventType;
	actor: string;
	details: string;
	time: string;
	game_ts_ms: number;
	wall_ts_ms: number;
	payload?: Record<string, string | number | boolean | null | undefined>;
}

export interface TeacherComment {
	id: string;
	sessionId: string;
	text: string;
	author: "teacher";
	wallTsMs: number;
	formattedTime: string;
}

export interface PastSessionRecord {
	code: string;
	date: string;
	language: SessionLanguage;
	players: number;
	stars: StarRating | null; // null si quedó inconclusa
	status: "completada" | "inconclusa";
	commentsCount: number;
}

export interface TeacherState {
	// Formulario de nueva sesión ([TEACH-01])
	formLanguage: SessionLanguage;
	formPlayers: number;
	formDurationMinutes: number;
	isConfigLocked: boolean;
	configError: string | null;
	configShake: boolean;

	// Sesión activa
	activeSessionCode: string;
	activeTab: "form" | "live" | "docente" | "past";
	syncBus: SessionSyncBus | null;
	countdownSeconds: number;
	isCountingDown: boolean;

	// Audio mute exclusivo de teacher (§13)
	isBgmMuted: boolean;

	// Espejo en vivo / consola ([TEACH-02], D6)
	isLiveConnected: boolean;
	liveStep: number;
	liveStation: string;
	liveTimerSeconds: number;
	isTimerPaused: boolean;
	pauseReason: string | null;
	stallCountdownSeconds: number;
	stallTier: "L1" | "L2" | "L3";
	wallClockMs: number;
	teacherAssisted: boolean; // Flag "con apoyo docente"
	conApoyoDocente: boolean; // Alias / indicador explícito
	consoleError: string | null;
	inventory: {
		madera: boolean;
		plano: boolean;
		sello: boolean;
	};
	activeSubtitles: SubtitleLine[];
	recentTranscripts: MirrorTranscript[];
	recentEvents: MirrorEvent[];

	// Fiabilidad y Resiliencia (§16)
	isAiRetrying: boolean;
	isAiBlocked: boolean;
	blockedAiService: string | null;

	// Panel Docente ([TEACH-03], §11)
	groupScores: GroupScores;
	groupQuotes: {
		turnTaking: string;
		colaboracion: string;
		negociacion: string;
		estructurada: string;
		organizacion: string;
	};
	studentEvals: StudentEvaluation[];

	// Hilo de comentarios Add-Only ([TEACH-04], D5)
	comments: TeacherComment[];

	// Sesiones pasadas ([TEACH-05], D2)
	pastSessions: PastSessionRecord[];
	selectedPastSessionCode: string | null;

	// Acciones de configuración
	setFormLanguage: (lang: SessionLanguage) => void;
	setFormPlayers: (players: number) => void;
	setFormDurationMinutes: (minutes: number) => void;
	createNewSession: (
		repo?: ISessionRepository | ISyncSessionRepository,
	) => string;
	forceStart: (
		repo?: ISessionRepository | ISyncSessionRepository,
	) => Promise<boolean>;
	setActiveTab: (tab: TeacherState["activeTab"]) => void;
	toggleBgmMute: () => void;

	// Acciones de Espejo en Vivo y Temporizadores
	setTimerPaused: (paused: boolean, reason?: string | null) => void;
	setStallCountdown: (seconds: number, tier?: "L1" | "L2" | "L3") => void;
	setLiveTimerSeconds: (seconds: number) => void;
	setParticipantStatus: (
		studentId: string,
		status: ParticipantCardStatus,
	) => void;
	setInventory: (
		inv: Partial<{ madera: boolean; plano: boolean; sello: boolean }>,
	) => void;
	addSubtitle: (
		sub: Omit<SubtitleLine, "id" | "expiresAt"> & { expiresAt?: number },
	) => void;
	clearExpiredSubtitles: () => void;
	addTranscript: (
		transcript: Omit<MirrorTranscript, "id"> & { id?: string },
	) => void;
	addEvent: (event: Omit<MirrorEvent, "id"> & { id?: string }) => void;

	// Acciones de Consola Silenciosa (§13)
	skipToStation: (stationName: string) => void;
	forceGrantNext: () => {
		ok: boolean;
		error?: string;
		step?: number;
		item?: string;
	};
	forceGrantStep: (
		target: "madera" | "diseño" | "diseno" | "permiso" | 1 | 2 | 3,
	) => { ok: boolean; error?: string; step?: number; item?: string };
	replayLastNpcLine: () => void;
	endRunNow: (repo?: ISessionRepository | ISyncSessionRepository) => void;
	skipIntro: () => void;
	retireStudent: (
		studentId: string,
		repo?: ISessionRepository | ISyncSessionRepository,
	) => void;
	retryService: () => void;
	setAiRetrying: (retrying: boolean, service?: string) => void;
	setAiBlocked: (blocked: boolean, service?: string) => void;

	// Acciones de Comentarios (Add-Only §11, §13, D5)
	addComment: (text: string) => void;

	// Acciones de Historial
	selectPastSession: (code: string | null) => void;
	deletePastSession: (code: string) => void;
}

const INITIAL_PAST_SESSIONS: PastSessionRecord[] = [
	{
		code: "K7NP",
		date: "2026-11-04 10:15",
		language: "ES",
		players: 4,
		stars: 3,
		status: "completada",
		commentsCount: 2,
	},
	{
		code: "W4MZ",
		date: "2026-11-04 09:30",
		language: "QUZ",
		players: 3,
		stars: 2,
		status: "completada",
		commentsCount: 1,
	},
	{
		code: "H8TX",
		date: "2026-11-03 16:45",
		language: "EN",
		players: 4,
		stars: null,
		status: "inconclusa",
		commentsCount: 0,
	},
];

const INITIAL_STUDENT_EVALS: StudentEvaluation[] = [
	{
		studentId: "c1",
		studentName: "Mateo",
		avatarId: "zorro",
		confirmed: true,
		status: "confirmed",
		participacion: 2,
		propuesta: 2,
		organizacion: 1,
		anecdote:
			"Propuso usar los troncos caídos de la chacra y dibujó el primer tramo.",
		voiceTurns: 6,
		drawsCount: 2,
		retired: false,
	},
	{
		studentId: "c2",
		studentName: "Valentina",
		avatarId: "buho",
		confirmed: true,
		status: "confirmed",
		participacion: 2,
		propuesta: 1,
		organizacion: 2,
		anecdote:
			"Coordinó la votación para ir al taller antes de hablar con el alcalde.",
		voiceTurns: 5,
		drawsCount: 1,
		retired: false,
	},
	{
		studentId: "c3",
		studentName: "Leo",
		avatarId: "rana",
		confirmed: false,
		status: "claimed",
		participacion: 1,
		propuesta: 2,
		organizacion: 1,
		anecdote:
			"Recordó a Paco que regaríamos sus surcos a cambio de los troncos.",
		voiceTurns: 4,
		drawsCount: 1,
		retired: false,
	},
	{
		studentId: "c4",
		studentName: "Sofía",
		avatarId: "gato",
		confirmed: false,
		status: "claimed",
		participacion: 2,
		propuesta: 1,
		organizacion: 2,
		anecdote:
			"Cedió la palabra cuando dos compañeros hablaron al mismo tiempo.",
		voiceTurns: 5,
		drawsCount: 0,
		retired: false,
	},
];

const INITIAL_TRANSCRIPTS: MirrorTranscript[] = [
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
		holder: "Leo (Rana)",
		text: "Nosotros ayudamos a regar todos los surcos con baldes.",
		time: "01:10",
		avatarId: "rana",
		game_ts_ms: 70000,
		wall_ts_ms: 1730715370000,
	},
	{
		id: "t4",
		holder: "Valentina (Búho)",
		text: "¡Trato hecho! Ahora vamos al taller de la Ingeniera Luz.",
		time: "01:25",
		avatarId: "buho",
		game_ts_ms: 85000,
		wall_ts_ms: 1730715385000,
	},
];

const INITIAL_EVENTS: MirrorEvent[] = [
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
		type: "move_propose",
		actor: "Valentina",
		details: "Propuesta hacia Taller",
		time: "01:28",
		game_ts_ms: 88000,
		wall_ts_ms: 1730715388000,
	},
	{
		id: "e4",
		type: "move_execute",
		actor: "Equipo",
		details: "Marcha hacia Taller completada",
		time: "01:36",
		game_ts_ms: 96000,
		wall_ts_ms: 1730715396000,
	},
];

const INITIAL_SUBTITLES: SubtitleLine[] = [
	{
		id: "sub-1",
		speakerName: "Alcalde Soto",
		speakerColor: "#ffffff",
		speakerType: "npc",
		text: "¡El río nos partió el puente! Debemos unirnos para cruzarlo.",
		expiresAt: Date.now() + 6000,
	},
];

export const useTeacherStore = create<TeacherState>((set, get) => ({
	formLanguage: "ES",
	formPlayers: 4,
	formDurationMinutes: 5,
	isConfigLocked: false,
	configError: null,
	configShake: false,

	activeSessionCode: "K7NP",
	activeTab: "live",
	syncBus: null,
	countdownSeconds: 0,
	isCountingDown: false,

	isBgmMuted: false,

	isLiveConnected: true,
	liveStep: 2,
	liveStation: "taller",
	liveTimerSeconds: 215, // 03:35 restante
	isTimerPaused: false,
	pauseReason: null,
	stallCountdownSeconds: 45, // L1 nudge en 45s
	stallTier: "L1",
	wallClockMs: Date.now(),
	teacherAssisted: false,
	conApoyoDocente: false,
	consoleError: null,
	inventory: {
		madera: true,
		plano: true,
		sello: false,
	},
	activeSubtitles: INITIAL_SUBTITLES,
	isAiRetrying: false,
	isAiBlocked: false,
	blockedAiService: null,

	recentTranscripts: INITIAL_TRANSCRIPTS,
	recentEvents: INITIAL_EVENTS,

	groupScores: {
		turnTaking: 2,
		colaboracion: 2,
		negociacion: 2,
		estructurada: 2,
		organizacion: 1,
	},

	groupQuotes: {
		turnTaking:
			"Esperaron a que Mateo terminara antes de que Sofía propusiera el voto.",
		colaboracion:
			"Construyeron sobre el plano de dibujo agregando las vigas sugeridas.",
		negociacion:
			"Ofrecieron regar los surcos a cambio de los troncos sin exigir.",
		estructurada:
			"Siguieron la secuencia chacra → taller → alcaldía sin saltar pasos.",
		organizacion:
			"Valentina tomó la iniciativa de ordenar los turnos de dibujo.",
	},

	studentEvals: INITIAL_STUDENT_EVALS,

	comments: [
		{
			id: "comm-1",
			sessionId: "K7NP",
			text: "Excelente dinámica inicial. Mateo y Valentina asumieron buena articulación grupal.",
			author: "teacher",
			wallTsMs: Date.now() - 1000 * 60 * 12,
			formattedTime: "10:18:22",
		},
	],

	pastSessions: INITIAL_PAST_SESSIONS,
	selectedPastSessionCode: null,

	setFormLanguage: (lang) => {
		if (get().isConfigLocked) {
			set({
				configError: "Configuración congelada: la partida ya ha iniciado",
				configShake: true,
			});
			throw new Error(
				"Configuration is locked: cannot mutate session configuration post-start",
			);
		}
		set({ formLanguage: lang, configError: null, configShake: false });
	},

	setFormPlayers: (players) => {
		if (get().isConfigLocked) {
			set({
				configError: "Configuración congelada: la partida ya ha iniciado",
				configShake: true,
			});
			throw new Error(
				"Configuration is locked: cannot mutate session configuration post-start",
			);
		}
		const valid = Math.max(3, Math.min(6, Math.floor(players)));
		set({ formPlayers: valid, configError: null, configShake: false });
	},

	setFormDurationMinutes: (minutes) => {
		if (get().isConfigLocked) {
			set({
				configError: "Configuración congelada: la partida ya ha iniciado",
				configShake: true,
			});
			throw new Error(
				"Configuration is locked: cannot mutate session configuration post-start",
			);
		}
		const valid = Math.max(5, Math.min(40, minutes));
		set({ formDurationMinutes: valid, configError: null, configShake: false });
	},

	createNewSession: (repo?: ISessionRepository) => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		const current = get();

		if (!["ES", "EN", "QUZ"].includes(current.formLanguage)) {
			throw new Error(
				`Invalid language "${current.formLanguage}": must be ES, EN, or QUZ`,
			);
		}
		if (
			!Number.isInteger(current.formPlayers) ||
			current.formPlayers < 3 ||
			current.formPlayers > 6
		) {
			throw new Error(
				`Invalid expectedPlayers ${current.formPlayers}: must be an integer between 3 and 6`,
			);
		}
		if (
			!Number.isInteger(current.formDurationMinutes) ||
			current.formDurationMinutes < 5 ||
			current.formDurationMinutes > 40 ||
			current.formDurationMinutes % 5 !== 0
		) {
			throw new Error(
				`Invalid durationMinutes ${current.formDurationMinutes}: must be between 5 and 40 in steps of 5`,
			);
		}

		if (current.syncBus) {
			current.syncBus.close();
		}

		const config: SessionConfig = {
			language: current.formLanguage,
			expectedPlayers: current.formPlayers,
			durationMinutes: current.formDurationMinutes,
			durationGameMs: current.formDurationMinutes * 60 * 1000,
			createdAtWallMs: Date.now(),
			locked: false,
		};

		let newCode = "";
		if (
			targetRepo &&
			"createSync" in targetRepo &&
			typeof targetRepo.createSync === "function"
		) {
			const record = targetRepo.createSync(config);
			newCode = record.code;
		} else {
			newCode = codeGen();
			targetRepo.create(config, newCode).catch(() => {});
		}

		const initialEvals: StudentEvaluation[] = [];
		for (let i = 0; i < current.formPlayers; i++) {
			const av = KID_AVATARS[i % KID_AVATARS.length];
			initialEvals.push({
				studentId: `c${i + 1}`,
				studentName: `Jugador ${i + 1}`,
				avatarId: av?.id ?? "zorro",
				confirmed: false,
				participacion: 0,
				propuesta: 0,
				organizacion: 0,
				anecdote: "",
				voiceTurns: 0,
				drawsCount: 0,
				retired: false,
			});
		}

		const bus = createSessionSyncBus(newCode);

		bus.subscribe((msg: SyncMessage) => {
			if (msg.type === "SESSION_STATE_REQUEST") {
				const state = get();
				bus.send({
					type: "SESSION_STATE_SYNC",
					payload: {
						code: newCode,
						language: state.formLanguage,
						expectedPlayers: state.formPlayers,
						durationMinutes: state.formDurationMinutes,
						status: state.isConfigLocked ? "playing" : "created",
						isConfigLocked: state.isConfigLocked,
						cards: state.studentEvals.map((s, idx) => ({
							slotIndex: idx,
							cardId: s.studentId,
							playerId: s.studentId,
							avatarId: s.avatarId,
							studentName: s.studentName,
							isConfirmed: s.confirmed ?? false,
							isRetired: s.retired,
							retiredAt: s.retiredAt,
							turnsCount: s.voiceTurns,
							drawsCount: s.drawsCount,
							status: s.retired ? "retired" : "idle",
						})),
						countdownSeconds: state.countdownSeconds,
					},
				});
			} else if (msg.type === "CARD_CONFIRMED") {
				set((state) => {
					const evals = [...state.studentEvals];
					const existing = evals[msg.slotIndex];
					if (existing) {
						evals[msg.slotIndex] = {
							...existing,
							avatarId: msg.avatarId || existing.avatarId,
							studentName: msg.studentName || existing.studentName,
							confirmed: msg.confirmed,
						};
					}
					return { studentEvals: evals };
				});
			} else if (msg.type === "CARD_UPDATED") {
				set((state) => {
					const evals = [...state.studentEvals];
					const existing = evals[msg.slotIndex];
					if (existing) {
						evals[msg.slotIndex] = {
							...existing,
							avatarId: msg.card.avatarId ?? existing.avatarId,
							studentName: msg.card.studentName ?? existing.studentName,
						};
					}
					return { studentEvals: evals };
				});
			} else if (msg.type === "COUNTDOWN_START") {
				set({
					isConfigLocked: true,
					isCountingDown: true,
					countdownSeconds: msg.seconds,
				});
				targetRepo.updateStatus(newCode, "countdown").catch(() => {});
			} else if (msg.type === "COUNTDOWN_CANCEL") {
				set((state) => {
					const evals = [...state.studentEvals];
					const existing = evals[msg.slotIndex];
					if (existing) {
						evals[msg.slotIndex] = {
							...existing,
							confirmed: false,
						};
					}
					return {
						isCountingDown: false,
						countdownSeconds: 0,
						studentEvals: evals,
					};
				});
			} else if (msg.type === "COUNTDOWN_TICK") {
				set({ countdownSeconds: msg.seconds });
			} else if (msg.type === "FORCE_START") {
				set((state) => {
					const confirmedEvals = state.studentEvals.filter((s) => s.confirmed);
					return {
						isConfigLocked: true,
						isCountingDown: true,
						countdownSeconds: msg.seconds,
						studentEvals:
							confirmedEvals.length >= 2 ? confirmedEvals : state.studentEvals,
						formPlayers: msg.confirmedCount,
					};
				});
			} else if (msg.type === "GAME_START") {
				set({
					isConfigLocked: true,
					isCountingDown: false,
					activeTab: "live",
					liveStep: 0,
					liveStation: "campamento",
				});
				targetRepo.updateStatus(newCode, "playing").catch(() => {});
			} else if (msg.type === "RETIRE_STUDENT") {
				set((state) => {
					const evals = state.studentEvals.map((s, idx) =>
						s.studentId === msg.studentId || idx === msg.slotIndex
							? { ...s, retired: true, retiredAt: msg.retiredAt }
							: s,
					);
					return { studentEvals: evals };
				});
			} else if (msg.type === "RETRY_SERVICE") {
				set({
					isTimerPaused: false,
					pauseReason: null,
					isAiBlocked: false,
					isAiRetrying: false,
					blockedAiService: null,
					consoleError: null,
				});
			} else if (msg.type === "AI_SERVICE_RETRYING") {
				set({
					isAiRetrying: true,
					isAiBlocked: false,
					blockedAiService: msg.service,
					isTimerPaused: true,
					pauseReason: "ai_retry",
				});
			} else if (msg.type === "AI_SERVICE_BLOCKED") {
				set({
					isAiRetrying: false,
					isAiBlocked: true,
					blockedAiService: msg.service,
					isTimerPaused: true,
					pauseReason: "ai_blocked",
				});
			} else if (msg.type === "AI_SERVICE_RESOLVED") {
				set({
					isAiRetrying: false,
					isAiBlocked: false,
					blockedAiService: null,
					isTimerPaused: false,
					pauseReason: null,
				});
			}
		});

		set({
			activeSessionCode: newCode,
			isConfigLocked: true,
			configError: null,
			configShake: false,
			syncBus: bus,
			studentEvals: initialEvals,
			liveStep: 0,
			liveStation: "campamento",
			liveTimerSeconds: current.formDurationMinutes * 60,
			teacherAssisted: false,
			isCountingDown: false,
			countdownSeconds: 0,
		});

		return newCode;
	},

	forceStart: async (repo?: ISessionRepository): Promise<boolean> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		const state = get();
		const confirmed = state.studentEvals.filter(
			(s) => s.confirmed && !s.retired,
		);

		if (confirmed.length < 2) {
			throw new Error(
				"Mínimo 2 participantes confirmados requeridos para iniciar la partida (el juego en solitario está estrictamente prohibido)",
			);
		}

		// Broadcast FORCE_START with 3 seconds countdown
		state.syncBus?.send({
			type: "FORCE_START",
			confirmedCount: confirmed.length,
			remainingSlots: confirmed.map((_, i) => i),
			seconds: 3,
		});

		set({
			isConfigLocked: true,
			isCountingDown: true,
			countdownSeconds: 3,
			studentEvals: confirmed,
			formPlayers: confirmed.length,
		});

		// Lock config and update repo post-start
		if (state.activeSessionCode) {
			try {
				await targetRepo.updateConfig?.(state.activeSessionCode, {
					expectedPlayers: confirmed.length,
				});
				await targetRepo.updateStatus(state.activeSessionCode, "playing");
			} catch (err) {
				console.error("[TeacherStore] forceStart repo error:", err);
			}
		}

		state.syncBus?.send({
			type: "GAME_START",
			phase: "playing",
		});

		set({
			isCountingDown: false,
			activeTab: "live",
		});

		return true;
	},

	setActiveTab: (tab) => set({ activeTab: tab }),

	toggleBgmMute: () => set((state) => ({ isBgmMuted: !state.isBgmMuted })),

	setTimerPaused: (paused, reason = null) =>
		set({ isTimerPaused: paused, pauseReason: reason }),

	setStallCountdown: (seconds, tier) =>
		set((state) => ({
			stallCountdownSeconds: seconds,
			stallTier: tier ?? state.stallTier,
		})),

	setLiveTimerSeconds: (seconds) => set({ liveTimerSeconds: seconds }),

	setParticipantStatus: (studentId, status) =>
		set((state) => ({
			studentEvals: state.studentEvals.map((s) =>
				s.studentId === studentId
					? {
							...s,
							status,
							confirmed: status === "confirmed" ? true : s.confirmed,
							retired: status === "retired" ? true : s.retired,
						}
					: s,
			),
		})),

	setInventory: (inv) =>
		set((state) => ({
			inventory: { ...state.inventory, ...inv },
		})),

	addSubtitle: (sub) => {
		const id = `sub-${Date.now()}-${Math.random()}`;
		const expiresAt = sub.expiresAt ?? Date.now() + 6000;
		const newLine: SubtitleLine = {
			id,
			speakerName: sub.speakerName,
			speakerColor: sub.speakerColor,
			speakerType: sub.speakerType,
			text: sub.text,
			expiresAt,
		};
		set((state) => ({
			activeSubtitles: [...state.activeSubtitles.slice(-1), newLine],
		}));
	},

	clearExpiredSubtitles: () => {
		const now = Date.now();
		const valid = get().activeSubtitles.filter((s) => s.expiresAt > now);
		if (valid.length !== get().activeSubtitles.length) {
			set({ activeSubtitles: valid });
		}
	},

	addTranscript: (t) => {
		const id = t.id ?? `tr-${Date.now()}`;
		const newT: MirrorTranscript = {
			id,
			holder: t.holder,
			text: t.text,
			time: t.time ?? "00:00",
			avatarId: t.avatarId,
			game_ts_ms: t.game_ts_ms,
			wall_ts_ms: t.wall_ts_ms,
		};
		set((state) => ({
			recentTranscripts: [...state.recentTranscripts, newT].slice(-20),
		}));
	},

	addEvent: (ev) => {
		const id = ev.id ?? `ev-${Date.now()}`;
		const newEv: MirrorEvent = {
			id,
			type: ev.type,
			actor: ev.actor,
			details: ev.details,
			time: ev.time ?? "00:00",
			game_ts_ms: ev.game_ts_ms,
			wall_ts_ms: ev.wall_ts_ms,
		};
		set((state) => ({
			recentEvents: [newEv, ...state.recentEvents].slice(0, 20),
		}));
	},

	skipToStation: (stationName) => {
		const state = get();
		const rawName = stationName.trim();
		const rawLower = rawName.toLowerCase();
		let targetId: StationId = "campamento";
		if (rawLower.includes("chacra")) targetId = "chacra";
		else if (rawLower.includes("taller")) targetId = "taller";
		else if (rawLower.includes("alcaldia") || rawLower.includes("alcaldía"))
			targetId = "alcaldia";
		else if (rawLower.includes("puente")) targetId = "puente";
		else if (rawLower in STATIONS) targetId = rawLower as StationId;

		const fromStation = (state.liveStation || "campamento") as StationId;
		const toStation = targetId;

		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "time_skip",
			actor: "Operador",
			details: `Salto a estación ${toStation} (teletransporte fade)`,
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
			payload: {
				fromStation,
				toStation,
				triggeredBy: "teacher_console",
			},
		};

		// Emitir salto de estación en tiempo real a /play
		state.syncBus?.send({
			type: "TIME_SKIP",
			fromStation,
			toStation,
		});

		// REGLA ESTRICTA: NO otorga ningún grant/item ni aprobación
		set((s) => ({
			liveStation: toStation,
			recentEvents: [newEvent, ...s.recentEvents].slice(0, 20),
		}));
	},

	forceGrantStep: (targetStep) => {
		const state = get();
		const inventory = state.inventory ?? {
			madera: state.liveStep >= 1,
			plano: state.liveStep >= 2,
			sello: state.liveStep >= 3,
		};

		let targetNum: 1 | 2 | 3;
		if (targetStep === 1 || targetStep === "madera") {
			targetNum = 1;
		} else if (
			targetStep === 2 ||
			targetStep === "diseño" ||
			targetStep === "diseno"
		) {
			targetNum = 2;
		} else if (targetStep === 3 || targetStep === "permiso") {
			targetNum = 3;
		} else {
			return { ok: false, error: "Paso desconocido" };
		}

		// Verificación de orden secuencial estricto (§9, §11, §13):
		// 1. 'madera' si no tiene madera
		// 2. 'diseño' si ya tiene madera pero no diseño
		// 3. 'permiso' si ya tiene madera y diseño pero no permiso
		const hasMadera = inventory.madera || state.liveStep >= 1;
		const hasDiseno =
			(inventory.madera && inventory.plano) || state.liveStep >= 2;

		if (targetNum === 2) {
			if (!hasMadera) {
				const errMsg = "Falta: madera";
				set({ consoleError: errMsg });
				return { ok: false, error: errMsg };
			}
		} else if (targetNum === 3) {
			if (!hasMadera) {
				const errMsg = "Falta: madera";
				set({ consoleError: errMsg });
				return { ok: false, error: errMsg };
			}
			if (!hasDiseno) {
				const errMsg = "Falta: diseño";
				set({ consoleError: errMsg });
				return { ok: false, error: errMsg };
			}
		}

		const itemKey =
			targetNum === 1 ? "madera" : targetNum === 2 ? "plano" : "sello";
		const stepId =
			targetNum === 1
				? "conseguir_madera"
				: targetNum === 2
					? "aprobar_diseno"
					: "permiso_alcaldia";
		const updatedInventory = {
			...inventory,
			madera: targetNum >= 1 || inventory.madera,
			plano: targetNum >= 2 || inventory.plano,
			sello: targetNum >= 3 || inventory.sello,
			[itemKey]: true,
		};

		const nextStep = Math.max(state.liveStep, targetNum);

		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "grant_step",
			actor: "Operador (Forced)",
			details: `Paso ${targetNum} (${itemKey}) otorgado con auxilio docente`,
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
			payload: {
				stepId,
				grantedItem: itemKey,
				forced: true,
			},
		};

		// Broadcast a /play vía sessionSync
		state.syncBus?.send({
			type: "FORCE_GRANT",
			step: nextStep,
			item: itemKey,
			teacherAssisted: true,
		});

		set((s) => ({
			liveStep: nextStep,
			inventory: updatedInventory,
			teacherAssisted: true,
			conApoyoDocente: true,
			consoleError: null,
			groupScores: {
				...s.groupScores,
				estructurada: Math.min(1, s.groupScores.estructurada), // Capado a máx 1 (§11)
			},
			recentEvents: [newEvent, ...s.recentEvents].slice(0, 20),
		}));

		return { ok: true, step: nextStep, item: itemKey };
	},

	forceGrantNext: () => {
		const state = get();
		const inventory = state.inventory ?? {
			madera: state.liveStep >= 1,
			plano: state.liveStep >= 2,
			sello: state.liveStep >= 3,
		};

		const step = state.liveStep;
		if (step < 1 || !inventory.madera) {
			return get().forceGrantStep(1);
		}
		if (step < 2 || !inventory.plano) {
			return get().forceGrantStep(2);
		}
		if (step < 3 || !inventory.sello) {
			return get().forceGrantStep(3);
		}
		return { ok: false, error: "Todos los pasos ya fueron concedidos" };
	},

	replayLastNpcLine: () => {
		const state = get();
		const currentStation = (state.liveStation || "campamento") as StationId;
		const st = STATIONS[currentStation] ?? STATIONS.campamento;
		const defaultLines: Record<string, string> = {
			campamento: "El río nos partió el puente. Debemos cruzar al otro lado.",
			chacra:
				"¡Bienvenidos a la chacra! Ayúdenme con los surcos si quieren madera.",
			taller: "¡Hola equipo! Diseñemos un puente firme para cruzar.",
			alcaldia:
				"En la alcaldía necesitamos orden: ¿tienen la madera y el diseño?",
			puente: "¡El puente está roto! Debemos repararlo.",
		};
		const line = defaultLines[currentStation] ?? "¡Continuemos con la misión!";

		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "npc_line",
			actor: `Operador (Replay ${st.npcName})`,
			details: `Replay NPC: "${line}"`,
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
			payload: {
				npcId: st.npcId,
				stationId: currentStation,
				text: line,
				audioDurationMs: 0,
			},
		};

		// Emitir por sessionSync
		state.syncBus?.send({
			type: "REPLAY_NPC",
			stationId: currentStation,
			npcName: st.npcName,
			text: line,
		});

		// REGLA ESTRICTA: NO crea ningún turno nuevo de transcripción ni avanza el juego
		set((s) => ({
			recentEvents: [newEvent, ...s.recentEvents].slice(0, 20),
		}));
	},

	endRunNow: (repo) => {
		const state = get();
		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "judge_scores",
			actor: "Operador",
			details: "Terminar ahora ejecutado. Evaluación parcial del juez.",
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
		};

		// Detener partida de inmediato y congelar en /play
		state.syncBus?.send({
			type: "SESSION_END",
			status: "expired",
			endType: "partial",
			scores: state.groupScores,
		});

		set({
			liveTimerSeconds: state.liveTimerSeconds, // Congela el temporizador
			isTimerPaused: true,
			recentEvents: [newEvent, ...state.recentEvents].slice(0, 20),
			activeTab: "docente",
		});

		const targetRepo =
			repo ??
			(state.activeSessionCode ? getDefaultSessionRepository() : undefined);
		if (state.activeSessionCode && targetRepo) {
			targetRepo
				.updateStatus?.(state.activeSessionCode, "expired")
				.catch(() => {});
		}
	},

	skipIntro: () => {
		const state = get();
		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "time_skip",
			actor: "Operador",
			details: "Intro omitida",
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
		};

		state.syncBus?.send({
			type: "SKIP_INTRO",
		});

		set((s) => ({
			recentEvents: [newEvent, ...s.recentEvents].slice(0, 20),
		}));
	},

	retireStudent: (studentId, repo) => {
		const state = get();
		const student = state.studentEvals.find((s) => s.studentId === studentId);
		const studentName = student?.studentName ?? studentId;
		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const slotIndex = state.studentEvals.findIndex(
			(s) => s.studentId === studentId,
		);

		const updatedEvals = state.studentEvals.map((s) =>
			s.studentId === studentId
				? { ...s, retired: true, retiredAt: timeStr }
				: s,
		);

		state.syncBus?.send({
			type: "RETIRE_STUDENT",
			studentId,
			slotIndex: Math.max(slotIndex, 0),
			retiredAt: timeStr,
		});

		const newEvent: MirrorEvent = {
			id: `ev-${Date.now()}`,
			type: "press",
			actor: "Operador",
			details: `Alumno ${studentName} retirado (${timeStr})`,
			time: timeStr,
			game_ts_ms: elapsedSeconds * 1000,
			wall_ts_ms: Date.now(),
		};

		set({
			studentEvals: updatedEvals,
			recentEvents: [newEvent, ...state.recentEvents].slice(0, 20),
		});

		const targetRepo =
			repo ??
			(state.activeSessionCode ? getDefaultSessionRepository() : undefined);
		if (state.activeSessionCode && targetRepo) {
			const activeCode = state.activeSessionCode;
			targetRepo
				.getByCode(activeCode)
				.then((record) => {
					if (record) {
						const existingPlayer = record.players.find(
							(p) => p.playerId === studentId || p.slotIndex === slotIndex,
						);
						if (existingPlayer) {
							const updatedPlayer: PlayerCard = {
								...existingPlayer,
								retired: true,
								retiredGameTsMs: elapsedSeconds * 1000,
							};
							targetRepo
								.updatePlayer?.(activeCode, updatedPlayer)
								.catch(() => {});
						}
					}
				})
				.catch(() => {});
		}
	},

	retryService: () => {
		const state = get();
		const elapsedSeconds = Math.max(
			0,
			state.formDurationMinutes * 60 - state.liveTimerSeconds,
		);
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

		const wallNow = Date.now();
		const gameTs = elapsedSeconds * 1000;

		const newEvent: MirrorEvent = {
			id: `ev-${wallNow}`,
			type: "speech_start",
			actor: "Operador",
			details: "Reintento de llamada IA desbloqueado",
			time: timeStr,
			game_ts_ms: gameTs,
			wall_ts_ms: wallNow,
		};

		// Reintentar operaciones bloqueadas en la cola de fiabilidad
		getAIRetryQueue()
			.retryBlocked()
			.catch(() => {});

		state.syncBus?.send({
			type: "RETRY_SERVICE",
		});

		set((s) => ({
			isTimerPaused: false,
			pauseReason: null,
			isAiBlocked: false,
			isAiRetrying: false,
			blockedAiService: null,
			consoleError: null,
			recentEvents: [newEvent, ...s.recentEvents].slice(0, 20),
		}));
	},

	setAiRetrying: (retrying, service = "IA") =>
		set({
			isAiRetrying: retrying,
			isAiBlocked: false,
			blockedAiService: retrying ? service : null,
			isTimerPaused: retrying,
			pauseReason: retrying ? "ai_retry" : null,
		}),

	setAiBlocked: (blocked, service = "IA") =>
		set({
			isAiBlocked: blocked,
			isAiRetrying: false,
			blockedAiService: blocked ? service : null,
			isTimerPaused: blocked,
			pauseReason: blocked ? "ai_blocked" : null,
		}),

	// Hilo de comentarios pedagógicos: estrictamente append-only (§11, §13, D5)
	addComment: (text) => {
		if (!text.trim()) return;
		const now = new Date();
		const formatted = now.toTimeString().split(" ")[0] ?? "00:00:00";
		const newComment: TeacherComment = {
			id: `comm-${Date.now()}-${Math.random()}`,
			sessionId: get().activeSessionCode,
			text: text.trim(),
			author: "teacher",
			wallTsMs: Date.now(),
			formattedTime: formatted,
		};
		set((state) => ({
			comments: [newComment, ...state.comments],
		}));
	},

	selectPastSession: (code) => set({ selectedPastSessionCode: code }),

	deletePastSession: (code) => {
		set((state) => ({
			pastSessions: state.pastSessions.filter((s) => s.code !== code),
			selectedPastSessionCode:
				state.selectedPastSessionCode === code
					? null
					: state.selectedPastSessionCode,
		}));
	},
}));

// Helper selector para estrellas de la sesión
export function useGroupStars(): number | null {
	const scores = useTeacherStore((s) => s.groupScores);
	const step = useTeacherStore((s) => s.liveStep);
	const sum =
		scores.turnTaking +
		scores.colaboracion +
		scores.negociacion +
		scores.estructurada +
		scores.organizacion;
	return starsFor(sum, step === 3);
}
