/**
 * SocraticGuild / Talentia Design Tokens
 * Conforme a SPEC.md §2, §4, §6, §11, §12, §19 y F0-contrato.md
 */

// Paleta de 5 colores de dibujo fija (§6)
export const DRAWING_PALETTE = [
	{ id: "black", hex: "#111827", name: "Negro" },
	{ id: "red", hex: "#ef4444", name: "Rojo" },
	{ id: "blue", hex: "#3b82f6", name: "Azul" },
	{ id: "green", hex: "#22c55e", name: "Verde" },
	{ id: "yellow", hex: "#eab308", name: "Amarillo" },
] as const;

export type DrawingColorHex = (typeof DRAWING_PALETTE)[number]["hex"];

export type KidAvatarId =
	| "zorro"
	| "buho"
	| "rana"
	| "gato"
	| "llama"
	| "toucan"
	| "raton"
	| "tortuga";

// Paleta de colores de avatares de niños (Paper-Mario cutout)
export const AVATAR_COLORS: Record<
	KidAvatarId,
	{ border: string; bg: string; text: string; glow: string }
> = {
	zorro: {
		border: "#f97316", // Naranja cálido
		bg: "rgba(249, 115, 22, 0.15)",
		text: "#fdba74",
		glow: "rgba(249, 115, 22, 0.4)",
	},
	buho: {
		border: "#6366f1", // Índigo intenso
		bg: "rgba(99, 102, 241, 0.15)",
		text: "#a5b4fc",
		glow: "rgba(99, 102, 241, 0.4)",
	},
	rana: {
		border: "#10b981", // Esmeralda vivo
		bg: "rgba(168, 85, 247, 0.15)",
		text: "#6ee7b7",
		glow: "rgba(16, 185, 129, 0.4)",
	},
	gato: {
		border: "#ec4899", // Rosa vibrante
		bg: "rgba(236, 72, 153, 0.15)",
		text: "#f9a8d4",
		glow: "rgba(236, 72, 153, 0.4)",
	},
	llama: {
		border: "#06b6d4", // Cian andino
		bg: "rgba(6, 182, 212, 0.15)",
		text: "#67e8f9",
		glow: "rgba(6, 182, 212, 0.4)",
	},
	toucan: {
		border: "#eab308", // Amarillo dorado
		bg: "rgba(234, 179, 8, 0.15)",
		text: "#fde047",
		glow: "rgba(234, 179, 8, 0.4)",
	},
	raton: {
		border: "#a855f7", // Púrpura brillante
		bg: "rgba(168, 85, 247, 0.15)",
		text: "#d8b4fe",
		glow: "rgba(168, 85, 247, 0.4)",
	},
	tortuga: {
		border: "#84cc16", // Lima bosque
		bg: "rgba(132, 204, 22, 0.15)",
		text: "#bef264",
		glow: "rgba(132, 204, 22, 0.4)",
	},
};

// Borde de NPCs: Blanco puro Paper-Mario cutout (§3, §4, §12)
export const NPC_BORDER_COLOR = "#ffffff";
export const NPC_BORDER_CLASS =
	"border-4 border-white shadow-[0_4px_12px_rgba(255,255,255,0.3)]";

// Anillos de estado de tarjetas de jugador (§12)
export type PlayerCardStatus =
	| "idle" // Gris neutral
	| "recording" // Rojo pulsante
	| "locked" // Atenuado
	| "speaking" // 'X habla'
	| "drawing" // 'X dibuja'
	| "npc_lock" // 'escucha…'
	| "walk"; // 'planeen'

export interface CardStatusToken {
	label: string | null;
	ringClass: string;
	badgeBg: string;
	badgeText: string;
	pulse: boolean;
	dim: boolean;
}

export const CARD_STATUS_TOKENS: Record<PlayerCardStatus, CardStatusToken> = {
	idle: {
		label: null,
		ringClass: "ring-2 ring-slate-500/40 border-slate-600/50",
		badgeBg: "bg-slate-800/80",
		badgeText: "text-slate-300",
		pulse: false,
		dim: false,
	},
	recording: {
		label: "Grabando…",
		ringClass: "ring-4 ring-red-500 bg-red-500/10 border-red-500",
		badgeBg: "bg-red-600",
		badgeText: "text-white font-bold",
		pulse: true,
		dim: false,
	},
	locked: {
		label: "Bloqueado",
		ringClass: "ring-1 ring-slate-700/50 border-slate-700",
		badgeBg: "bg-slate-800/50",
		badgeText: "text-slate-500",
		pulse: false,
		dim: true,
	},
	speaking: {
		label: "habla",
		ringClass: "ring-4 ring-sky-400 bg-sky-500/10 border-sky-400",
		badgeBg: "bg-sky-500",
		badgeText: "text-white font-bold",
		pulse: true,
		dim: false,
	},
	drawing: {
		label: "dibuja",
		ringClass: "ring-4 ring-purple-400 bg-purple-500/10 border-purple-400",
		badgeBg: "bg-purple-600",
		badgeText: "text-white font-bold",
		pulse: false,
		dim: false,
	},
	npc_lock: {
		label: "escucha…",
		ringClass: "ring-2 ring-amber-400/70 bg-amber-500/10 border-amber-400/80",
		badgeBg: "bg-amber-500/80",
		badgeText: "text-slate-950 font-bold",
		pulse: false,
		dim: false,
	},
	walk: {
		label: "planeen",
		ringClass:
			"ring-2 ring-emerald-400/70 bg-emerald-500/10 border-emerald-400/80",
		badgeBg: "bg-emerald-600/90",
		badgeText: "text-white font-medium",
		pulse: false,
		dim: false,
	},
};
