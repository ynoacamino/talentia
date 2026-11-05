/**
 * Play Store (Modo Alumnos /play)
 * Conforme a SPEC §2, §3, §5, §6, §7, §12
 */
import { create } from "zustand";
import {
	createSessionSyncBus,
	type SessionSyncBus,
	type SyncMessage,
} from "@/core/sync/sessionSync.ts";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import type {
	ISessionRepository,
	ISyncSessionRepository,
	Language,
	SessionStatus,
} from "@/shared/documents.ts";
import type { BadgeId } from "@/shared/scoring.ts";
import { KID_AVATARS } from "@/ui/tokens/avatars.ts";
import type { GroupScores } from "@/ui/tokens/badges.ts";
import type { PlayerCardStatus } from "@/ui/tokens/colors.ts";

export interface StudentCard {
	cardId: string;
	playerIndex: number;
	avatarId: string;
	studentName: string;
	isConfirmed: boolean;
	status: PlayerCardStatus;
	isRetired: boolean;
	turnsCount: number;
	drawsCount: number;
}

export interface SubtitleLine {
	id: string;
	speakerName: string;
	speakerColor: string;
	speakerType: "kid" | "npc";
	text: string;
	expiresAt: number;
}

export type PlayPhase = "join" | "claim" | "countdown" | "active" | "end";

export type StationId =
	| "campamento"
	| "chacra"
	| "taller"
	| "alcaldia"
	| "puente";

export interface StationInfo {
	id: StationId;
	name: string;
	npcName: string;
	npcId: string;
	icon: string;
	description: string;
}

export const STATIONS: Record<StationId, StationInfo> = {
	campamento: {
		id: "campamento",
		name: "Campamento",
		npcName: "Alcalde Soto (Voz)",
		npcId: "soto",
		icon: "⛺",
		description: "Punto de partida del equipo",
	},
	chacra: {
		id: "chacra",
		name: "Chacra",
		npcName: "Agricultor Paco",
		npcId: "paco",
		icon: "🌾",
		description: "Obtener madera para el puente",
	},
	taller: {
		id: "taller",
		name: "Taller",
		npcName: "Ingeniera Luz",
		npcId: "luz",
		icon: "📐",
		description: "Aprobar diseño del puente",
	},
	alcaldia: {
		id: "alcaldia",
		name: "Alcaldía",
		npcName: "Alcalde Soto",
		npcId: "soto",
		icon: "🏛️",
		description: "Obtener permiso oficial",
	},
	puente: {
		id: "puente",
		name: "Puente Roto",
		npcName: "Comunidad",
		npcId: "soto",
		icon: "🌉",
		description: "Construir y cruzar el puente",
	},
};

export interface PlayState {
	// Fase y sesión
	phase: PlayPhase;
	sessionCode: string | null;
	expectedPlayers: number;
	cards: StudentCard[];
	selectedCardIndex: number | null;
	countdownSeconds: number;
	syncBus: SessionSyncBus | null;

	// Estado en partida activa
	currentStation: StationId;
	gameTimeSeconds: number;
	isTimerPaused: boolean;
	pauseReason: string | null;

	// Checklist & Inventario compartido (§7)
	checklistStep: number; // 0: nada, 1: chacra hecha, 2: taller hecho, 3: alcaldía hecha
	inventory: {
		madera: boolean;
		plano: boolean;
		sello: boolean;
	};

	// Subtítulos activos (§12: 2 líneas, 6s expiración)
	activeSubtitles: SubtitleLine[];

	// Overlays interactivos
	isDrawOpen: boolean;
	drawCardId: string | null;
	drawTimeRemaining: number;
	drawCapHit: boolean;
	drawCapHitCardId?: string;

	isMapOpen: boolean;
	proposedStation: StationId | null;
	proposerName: string | null;
	vetoCountdown: number | null; // 5s veto ring
	discussCountdown: number | null; // 20s discuss
	isWalking: boolean;

	// Mensaje momentáneo (shake banner) (§12)
	shakeMessage: string | null;

	// Fin de equipo ([PLAY-06], [PLAY-07])
	endType: "victory" | "partial" | null;
	sessionStatus: SessionStatus;
	language: Language;
	groupScores?: GroupScores;
	badgeQuotes?: Partial<Record<BadgeId, string>>;
	teacherAssisted?: boolean;

	// Acciones
	setSessionCode: (code: string) => void;
	setLanguage: (lang: Language) => void;
	setSessionStatus: (status: SessionStatus) => void;
	setGroupScores: (scores: GroupScores) => void;
	setBadgeQuotes: (quotes: Partial<Record<BadgeId, string>>) => void;
	setTeacherAssisted: (assisted: boolean) => void;
	joinSession: (
		code: string,
		repoOrPlayersCount?: ISessionRepository | ISyncSessionRepository | number,
	) => void;
	selectCardForEdit: (index: number | null) => void;
	updateCard: (index: number, updates: Partial<StudentCard>) => void;
	toggleCardConfirmed: (index: number) => void;
	startCountdown: () => void;
	cancelCountdown: () => void;
	startActiveGame: () => void;

	// Acciones en juego
	setCardStatus: (cardId: string, status: PlayerCardStatus) => void;
	addSubtitle: (line: Omit<SubtitleLine, "id" | "expiresAt">) => void;
	clearExpiredSubtitles: () => void;
	showShakeMessage: (msg: string) => void;

	// Movimiento y Votación (§7)
	openMap: () => void;
	closeMap: () => void;
	proposeMove: (station: StationId, proposerName: string) => void;
	cancelMoveProposal: () => void;
	executeMove: (station: StationId) => void;

	// Pizarra de Dibujo (§6)
	openDraw: (cardId: string) => void;
	closeDraw: () => void;
	submitDrawing: () => void;

	// Fin
	triggerVictory: (scores?: GroupScores) => void;
	triggerPartialEnd: (scores?: GroupScores) => void;
	resetToLobby: () => void;
}

const INITIAL_CARDS: StudentCard[] = [
	{
		cardId: "c1",
		playerIndex: 0,
		avatarId: "zorro",
		studentName: "Mateo",
		isConfirmed: false,
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
		isConfirmed: false,
		status: "idle",
		isRetired: false,
		turnsCount: 2,
		drawsCount: 0,
	},
	{
		cardId: "c3",
		playerIndex: 2,
		avatarId: "rana",
		studentName: "Leo",
		isConfirmed: false,
		status: "idle",
		isRetired: false,
		turnsCount: 4,
		drawsCount: 1,
	},
	{
		cardId: "c4",
		playerIndex: 3,
		avatarId: "gato",
		studentName: "Sofía",
		isConfirmed: false,
		status: "idle",
		isRetired: false,
		turnsCount: 1,
		drawsCount: 0,
	},
];

export const usePlayStore = create<PlayState>((set, get) => ({
	phase: "join",
	sessionCode: null,
	expectedPlayers: 4,
	cards: INITIAL_CARDS,
	selectedCardIndex: null,
	countdownSeconds: 5,
	syncBus: null,

	currentStation: "campamento",
	gameTimeSeconds: 300, // 5:00
	isTimerPaused: false,
	pauseReason: null,

	checklistStep: 0,
	inventory: {
		madera: false,
		plano: false,
		sello: false,
	},

	activeSubtitles: [
		{
			id: "s1",
			speakerName: "Alcalde Soto",
			speakerColor: "#ffffff",
			speakerType: "npc",
			text: "El río nos partió el puente… ¡Necesitamos su ayuda para cruzarlo!",
			expiresAt: Date.now() + 6000,
		},
	],

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
	sessionStatus: "created",
	language: "ES",
	groupScores: undefined,
	badgeQuotes: undefined,
	teacherAssisted: false,

	setSessionCode: (code) => set({ sessionCode: code.toUpperCase() }),
	setLanguage: (lang) => set({ language: lang }),
	setSessionStatus: (status) => {
		if (status === "finished") {
			get().triggerVictory();
		} else if (status === "expired") {
			get().triggerPartialEnd();
		} else {
			set({ sessionStatus: status });
		}
	},
	setGroupScores: (scores) => set({ groupScores: scores }),
	setBadgeQuotes: (quotes) => set({ badgeQuotes: quotes }),
	setTeacherAssisted: (assisted) => set({ teacherAssisted: assisted }),

	joinSession: (code, repoOrPlayersCount) => {
		const canonicalCode = code.trim().toUpperCase();
		let playersCount = 4;
		let targetRepo: ISessionRepository | ISyncSessionRepository | undefined;

		if (typeof repoOrPlayersCount === "number") {
			playersCount = repoOrPlayersCount;
		} else if (repoOrPlayersCount) {
			targetRepo = repoOrPlayersCount;
		} else {
			targetRepo = getDefaultSessionRepository();
		}

		if (
			targetRepo &&
			"getByCodeSync" in targetRepo &&
			typeof targetRepo.getByCodeSync === "function"
		) {
			const rec = targetRepo.getByCodeSync(canonicalCode);
			if (rec) {
				playersCount = rec.config.expectedPlayers;
				set({
					language: rec.config.language,
					sessionStatus: rec.status,
				});
				if (rec.status === "finished") {
					get().triggerVictory();
				} else if (rec.status === "expired") {
					get().triggerPartialEnd();
				}
			}
		}

		if (get().syncBus) {
			get().syncBus?.close();
		}

		const bus = createSessionSyncBus(canonicalCode);

		const newCards: StudentCard[] = [];
		for (let i = 0; i < playersCount; i++) {
			const avatar = KID_AVATARS[i % KID_AVATARS.length];
			newCards.push({
				cardId: `card-${i + 1}`,
				playerIndex: i,
				avatarId: avatar?.id ?? "zorro",
				studentName: "",
				isConfirmed: false,
				status: "idle",
				isRetired: false,
				turnsCount: 0,
				drawsCount: 0,
			});
		}

		bus.subscribe((msg: SyncMessage) => {
			if (msg.type === "CARD_UPDATED") {
				set((state) => {
					const cards = [...state.cards];
					const existing = cards[msg.slotIndex];
					if (existing) {
						cards[msg.slotIndex] = {
							...existing,
							...msg.card,
							status: (msg.card.status as PlayerCardStatus) || existing.status,
						};
					}
					return { cards };
				});
			} else if (msg.type === "CARD_CONFIRMED") {
				set((state) => {
					const cards = [...state.cards];
					const existing = cards[msg.slotIndex];
					if (existing) {
						cards[msg.slotIndex] = {
							...existing,
							avatarId: msg.avatarId || existing.avatarId,
							studentName: msg.studentName || existing.studentName,
							isConfirmed: msg.confirmed,
						};
					}
					const allConfirmed =
						cards.length > 0 && cards.every((c) => c.isConfirmed);
					if (allConfirmed) {
						return { cards, phase: "countdown", countdownSeconds: 5 };
					}
					return { cards };
				});
			} else if (msg.type === "COUNTDOWN_START") {
				set({ phase: "countdown", countdownSeconds: msg.seconds });
			} else if (msg.type === "COUNTDOWN_CANCEL") {
				set((state) => {
					const cards = [...state.cards];
					const existing = cards[msg.slotIndex];
					if (existing) {
						cards[msg.slotIndex] = {
							...existing,
							isConfirmed: false,
						};
					}
					return { phase: "claim", cards, countdownSeconds: 5 };
				});
			} else if (msg.type === "COUNTDOWN_TICK") {
				set({ countdownSeconds: msg.seconds });
			} else if (msg.type === "FORCE_START") {
				set((state) => {
					const remainingCards = state.cards.filter((c) => c.isConfirmed);
					return {
						phase: "countdown",
						countdownSeconds: msg.seconds,
						cards: remainingCards,
						expectedPlayers: msg.confirmedCount,
					};
				});
			} else if (msg.type === "GAME_START") {
				get().startActiveGame();
			} else if (msg.type === "RETIRE_STUDENT") {
				set((state) => {
					const cards = state.cards.map((c, idx) =>
						c.cardId === msg.studentId || idx === msg.slotIndex
							? { ...c, isRetired: true, status: "idle" as PlayerCardStatus }
							: c,
					);
					return { cards };
				});
			} else if (msg.type === "SESSION_STATE_SYNC") {
				if (msg.payload.language) {
					set({ language: msg.payload.language });
				}
				if (msg.payload.status === "finished") {
					get().triggerVictory();
				} else if (msg.payload.status === "expired") {
					get().triggerPartialEnd();
				}
			} else if (msg.type === "SESSION_END") {
				if (msg.status === "finished") {
					get().triggerVictory(msg.scores);
				} else if (msg.status === "expired") {
					get().triggerPartialEnd(msg.scores);
				}
				if (msg.language) {
					set({ language: msg.language });
				}
			}
		});

		set({
			phase: "claim",
			sessionCode: canonicalCode,
			expectedPlayers: playersCount,
			cards: newCards,
			selectedCardIndex: null,
			syncBus: bus,
		});

		bus.send({ type: "SESSION_JOINED", sender: "play", code: canonicalCode });

		if (targetRepo && !("getByCodeSync" in targetRepo)) {
			targetRepo
				.getByCode(canonicalCode)
				.then((rec) => {
					if (rec) {
						set({
							language: rec.config.language,
							sessionStatus: rec.status,
						});
						if (rec.status === "finished") {
							get().triggerVictory();
						} else if (rec.status === "expired") {
							get().triggerPartialEnd();
						}
						if (rec.config.expectedPlayers !== playersCount) {
							const updatedCount = rec.config.expectedPlayers;
							const updatedCards: StudentCard[] = [];
							for (let i = 0; i < updatedCount; i++) {
								const avatar = KID_AVATARS[i % KID_AVATARS.length];
								updatedCards.push({
									cardId: `card-${i + 1}`,
									playerIndex: i,
									avatarId: avatar?.id ?? "zorro",
									studentName: "",
									isConfirmed: false,
									status: "idle",
									isRetired: false,
									turnsCount: 0,
									drawsCount: 0,
								});
							}
							set({
								expectedPlayers: updatedCount,
								cards: updatedCards,
							});
						}
					}
				})
				.catch(() => {});
		}
	},

	selectCardForEdit: (index) => set({ selectedCardIndex: index }),

	updateCard: (index, updates) => {
		const cards = [...get().cards];
		const current = cards[index];
		if (current) {
			const safeUpdates = { ...updates };
			if (safeUpdates.studentName !== undefined) {
				safeUpdates.studentName = safeUpdates.studentName.slice(0, 10);
			}
			cards[index] = { ...current, ...safeUpdates };
			set({ cards });
			get().syncBus?.send({
				type: "CARD_UPDATED",
				slotIndex: index,
				card: safeUpdates,
			});
		}
	},

	toggleCardConfirmed: (index) => {
		const cards = [...get().cards];
		const current = cards[index];
		if (current) {
			const nextConfirmed = !current.isConfirmed;
			cards[index] = { ...current, isConfirmed: nextConfirmed };

			get().syncBus?.send({
				type: "CARD_CONFIRMED",
				slotIndex: index,
				avatarId: current.avatarId,
				studentName: current.studentName,
				confirmed: nextConfirmed,
			});

			if (nextConfirmed) {
				const allConfirmed =
					cards.length > 0 && cards.every((c) => c.isConfirmed);
				if (allConfirmed) {
					set({ cards, phase: "countdown", countdownSeconds: 5 });
					get().syncBus?.send({
						type: "COUNTDOWN_START",
						seconds: 5,
						reason: "all_ready",
					});
				} else {
					set({ cards });
				}
			} else {
				if (get().phase === "countdown") {
					set({ cards, phase: "claim", countdownSeconds: 5 });
					get().syncBus?.send({
						type: "COUNTDOWN_CANCEL",
						slotIndex: index,
					});
				} else {
					set({ cards });
				}
			}
		}
	},

	startCountdown: () => {
		set({ phase: "countdown", countdownSeconds: 5 });
	},

	cancelCountdown: () => {
		set({ phase: "claim", countdownSeconds: 5 });
	},

	startActiveGame: () => {
		get().syncBus?.send({
			type: "GAME_START",
			phase: "playing",
		});
		set({
			phase: "active",
			gameTimeSeconds: 300,
			isTimerPaused: false,
			pauseReason: null,
			endType: null,
			currentStation: "campamento",
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
		});
	},

	setCardStatus: (cardId, status) => {
		const cards = get().cards.map((c) =>
			c.cardId === cardId ? { ...c, status } : c,
		);
		set({ cards });
	},

	addSubtitle: (line) => {
		const id = `sub-${Date.now()}-${Math.random()}`;
		const expiresAt = Date.now() + 6000;
		// Mantener como máximo 2 subtítulos simultáneos (§12)
		const updated = [
			...get().activeSubtitles.slice(-1),
			{ ...line, id, expiresAt },
		];
		set({ activeSubtitles: updated });
	},

	clearExpiredSubtitles: () => {
		const now = Date.now();
		const valid = get().activeSubtitles.filter((s) => s.expiresAt > now);
		if (valid.length !== get().activeSubtitles.length) {
			set({ activeSubtitles: valid });
		}
	},

	showShakeMessage: (msg) => {
		set({ shakeMessage: msg });
		setTimeout(() => {
			set({ shakeMessage: null });
		}, 3000);
	},

	openMap: () => set({ isMapOpen: true }),
	closeMap: () =>
		set({
			isMapOpen: false,
			proposedStation: null,
			proposerName: null,
			vetoCountdown: null,
		}),

	proposeMove: (station, proposerName) => {
		set({
			proposedStation: station,
			proposerName,
			vetoCountdown: 5,
		});
	},

	cancelMoveProposal: () => {
		set({
			proposedStation: null,
			proposerName: null,
			vetoCountdown: null,
			discussCountdown: null,
		});
	},

	executeMove: (station) => {
		set({
			isMapOpen: false,
			proposedStation: null,
			proposerName: null,
			vetoCountdown: null,
			discussCountdown: null,
			isWalking: true,
		});

		// Marcha de 8 segundos (§4, §7)
		setTimeout(() => {
			set({
				currentStation: station,
				isWalking: false,
			});
			// Agregar subtítulo de llegada
			const st = STATIONS[station];
			if (st) {
				get().addSubtitle({
					speakerName: st.npcName,
					speakerColor: "#ffffff",
					speakerType: "npc",
					text: `¡Llegaron a ${st.name}! ${st.description}.`,
				});
			}
		}, 3000);
	},

	openDraw: (cardId) => {
		set({
			isDrawOpen: true,
			drawCardId: cardId,
			drawTimeRemaining: 30,
			isTimerPaused: true,
			pauseReason: "dibujo",
		});
	},

	closeDraw: () => {
		set({
			isDrawOpen: false,
			drawCardId: null,
			isTimerPaused: false,
			pauseReason: null,
		});
	},

	submitDrawing: () => {
		const cardId = get().drawCardId;
		if (cardId) {
			const cards = get().cards.map((c) =>
				c.cardId === cardId ? { ...c, drawsCount: c.drawsCount + 1 } : c,
			);
			set({ cards });
		}
		get().closeDraw();
		get().addSubtitle({
			speakerName: "Ingeniera Luz",
			speakerColor: "#ffffff",
			speakerType: "npc",
			text: "¡Buen plano! Veo vigas firmes en ambos extremos del río.",
		});
	},

	triggerVictory: (scores?: GroupScores) => {
		set({
			phase: "end",
			sessionStatus: "finished",
			endType: "victory",
			checklistStep: 3,
			inventory: { madera: true, plano: true, sello: true },
			...(scores ? { groupScores: scores } : {}),
		});
	},

	triggerPartialEnd: (scores?: GroupScores) => {
		set({
			phase: "end",
			sessionStatus: "expired",
			endType: "partial",
			...(scores ? { groupScores: scores } : {}),
		});
	},

	resetToLobby: () => {
		if (get().syncBus) {
			get().syncBus?.close();
		}
		set({
			phase: "join",
			sessionCode: null,
			sessionStatus: "created",
			language: "ES",
			cards: [],
			selectedCardIndex: null,
			syncBus: null,
			countdownSeconds: 5,
			endType: null,
			groupScores: undefined,
			badgeQuotes: undefined,
			teacherAssisted: false,
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
			currentStation: "campamento",
		});
	},
}));

if (typeof window !== "undefined") {
	(window as unknown as { __playStore?: typeof usePlayStore }).__playStore =
		usePlayStore;
}
