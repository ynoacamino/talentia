/**
 * SPEC.md §19: Exact locked strings (21 cadenas obligatorias carácter por carácter).
 *
 * DO NOT translate or modify these strings. They must match character-by-character:
 * - Proper ellipsis (U+2026 '…')
 * - Exact accents (í, ó, é, etc.)
 * - Inverted Spanish punctuation ('¿', '¡')
 */

export const LOCKED_STRINGS = {
	BANNER_MOVE: "¿Vamos a X? propuso [Nombre], mantén para vetar (5s)",
	MOVE_EXECUTE: "¡Vamos a X!",
	MID_WALK: "llegando a X…",
	NPC_LOCK: "escucha…",
	SIMULTANEOUS: "espera tu turno",
	DRAW_CAP: "aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!",
	UNCLEAR_1: "¿me lo repites o lo dibujas?",
	OVERLAP: "oí dos voces, ¿quién lo propone?",
	CIRCLE_NUDGE: "hablen entre ustedes 20s",
	CIRCLE_READY: "listo, tenemos plan",
	REMOTE_NPC: "vayan a X para hablar con Y",
	STALL_L3: "vayan a X y digan Y",
	FARMER_CLARIFY: "¿quién ayuda y en qué?",
	WIN_TITLE: "¡Puente listo!",
	PARTIAL_TITLE: "Misión en curso X/3",
	TEACHER_FLAG: "con apoyo docente",
	DOCENTE_BANNER: "señales preliminares, no notas",
	VISION_PROMPT:
		"Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each",
	REPEAT_ES: "repite/repítelo/puedes repetir",
	REPEAT_EN: "repeat/say again",
	REPEAT_QUZ: "huktawan niway/yapaykullay",
} as const;

export type LockedStringKey = keyof typeof LOCKED_STRINGS;

/**
 * Formatters for template-based locked strings.
 * Guarantees exact phrasing while replacing runtime placeholders.
 */
export function formatBannerMove(
	stationName: string,
	proposerName: string,
): string {
	return `¿Vamos a ${stationName}? propuso ${proposerName}, mantén para vetar (5s)`;
}

export function formatMoveExecute(stationName: string): string {
	return `¡Vamos a ${stationName}!`;
}

export function formatMidWalk(stationName: string): string {
	return `llegando a ${stationName}…`;
}

export function formatRemoteNpc(stationName: string, npcName: string): string {
	return `vayan a ${stationName} para hablar con ${npcName}`;
}

export function formatStallL3(
	stationName: string,
	phraseToSay: string,
): string {
	return `vayan a ${stationName} y digan ${phraseToSay}`;
}

export function formatPartialTitle(completedSteps: number): string {
	return `Misión en curso ${completedSteps}/3`;
}
