export type Vec3 = { x: number; y: number; z: number };

export type PlayerConfig = {
	name: string;
	color: string;
};

export type GameConfig = {
	boardId: string;
	lapsToWin: number;
	players: PlayerConfig[];
};

export type MatchPhase = "lobby" | "roll" | "move" | "event" | "gameover";

// ============================================================================
// DOMAIN TYPES FROM SPEC.md & F0-contrato.md
// ============================================================================

export type { Language } from "@/shared/i18n/types.ts";
export type { BadgeId, StarRating } from "@/shared/scoring.ts";

export type AvatarSpecies =
	| "Zorro"
	| "Búho"
	| "Rana"
	| "Gato"
	| "Llama"
	| "Tucán"
	| "Ratón"
	| "Tortuga";

export type StationId =
	| "campamento"
	| "chacra"
	| "taller"
	| "alcaldía"
	| "puente";

export type InventoryItemId = "madera" | "plano" | "sello";

export type ChecklistStepId =
	| "conseguir_madera"
	| "aprobar_diseno"
	| "permiso_alcaldia";

export type ChecklistStatus = "todo" | "active" | "done";

export type PlayerCardStatus =
	| "idle"
	| "recording"
	| "locked"
	| "other_speaking"
	| "drawing"
	| "npc_speaking"
	| "walking"
	| "retired";

export type SendReason = "release" | "silence" | "autocut";

export type HintTier = "L1" | "L2" | "L3";

export type CriterionScore = 0 | 1 | 2;

export type SessionStatus =
	| "created"
	| "claim"
	| "countdown"
	| "intro"
	| "playing"
	| "paused"
	| "finished"
	| "expired"
	| "deleted";

export type DrawingColor = "negro" | "rojo" | "azul" | "verde" | "amarillo";
