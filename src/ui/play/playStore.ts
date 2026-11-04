/**
 * Play Store (Modo Alumnos /play)
 * Conforme a SPEC §2, §3, §5, §6, §7, §12
 */
import { create } from "zustand";
import { KID_AVATARS } from "@/ui/tokens/avatars.ts";
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

	// Acciones
	setSessionCode: (code: string) => void;
	joinSession: (code: string, playersCount?: number) => void;
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
	triggerVictory: () => void;
	triggerPartialEnd: () => void;
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

	setSessionCode: (code) => set({ sessionCode: code.toUpperCase() }),

	joinSession: (code, playersCount = 4) => {
		const newCards: StudentCard[] = [];
		for (let i = 0; i < playersCount; i++) {
			const avatar = KID_AVATARS[i % KID_AVATARS.length];
			newCards.push({
				cardId: `card-${i + 1}`,
				playerIndex: i,
				avatarId: avatar?.id ?? "zorro",
				studentName: `Jugador ${i + 1}`,
				isConfirmed: false,
				status: "idle",
				isRetired: false,
				turnsCount: 0,
				drawsCount: 0,
			});
		}
		set({
			phase: "claim",
			sessionCode: code.toUpperCase(),
			expectedPlayers: playersCount,
			cards: newCards,
			selectedCardIndex: null,
		});
	},

	selectCardForEdit: (index) => set({ selectedCardIndex: index }),

	updateCard: (index, updates) => {
		const cards = [...get().cards];
		const current = cards[index];
		if (current) {
			cards[index] = { ...current, ...updates };
			set({ cards });
		}
	},

	toggleCardConfirmed: (index) => {
		const cards = [...get().cards];
		const current = cards[index];
		if (current) {
			cards[index] = { ...current, isConfirmed: !current.isConfirmed };
			set({ cards });

			// Si todas las tarjetas están confirmadas -> iniciar auto-countdown de 5s
			const allConfirmed = cards.every((c) => c.isConfirmed);
			if (allConfirmed) {
				get().startCountdown();
			} else {
				// Si alguien desconfirma durante cuenta regresiva -> cancela
				if (get().phase === "countdown") {
					get().cancelCountdown();
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

	triggerVictory: () => {
		set({
			endType: "victory",
			checklistStep: 3,
			inventory: { madera: true, plano: true, sello: true },
		});
	},

	triggerPartialEnd: () => {
		set({
			endType: "partial",
		});
	},

	resetToLobby: () => {
		set({
			phase: "claim",
			endType: null,
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
			currentStation: "campamento",
		});
	},
}));
