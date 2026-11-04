export const GAME_NAME = "Talentia Party";
export const DEFAULT_BOARD_ID = "classic-loop";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const DEFAULT_LAPS_TO_WIN = 3;

export const PLAYER_COLORS = [
	"#f43f5e",
	"#3b82f6",
	"#22c55e",
	"#eab308",
] as const;

// ============================================================================
// SPEC.md & F0-contrato.md CONSTANTS
// ============================================================================

export { CODE_ALPHABET, CONFUSABLE_CHARS } from "@/shared/codeGen.ts";
export { LOCKED_STRINGS } from "@/shared/i18n/lockedStrings.ts";
export { BADGE_PRIORITY_ORDER } from "@/shared/scoring.ts";

export const AVATAR_SPECIES = [
	"Zorro",
	"Búho",
	"Rana",
	"Gato",
	"Llama",
	"Tucán",
	"Ratón",
	"Tortuga",
] as const;

export const STATIONS = [
	"campamento",
	"chacra",
	"taller",
	"alcaldía",
	"puente",
] as const;

export const DEMO_CONFIG = {
	expectedPlayers: 4,
	durationMinutes: 5,
	durationGameMs: 300000,
	language: "ES" as const,
};
