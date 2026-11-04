/**
 * Exact Locked Strings (SPEC.md §19)
 * Todos los strings mandatorios con exactitud de caracteres (pixel-verbatim).
 */
import { CODE_ALPHABET } from "@/shared/codeGen.ts";

export const LOCKED_STRINGS = {
	// Movimiento y votación (§7, §19)
	BANNER_MOVE: (station: string, proposerName: string) =>
		`¿Vamos a ${station}? propuso ${proposerName}, mantén para vetar (5s)`,
	MOVE_EXECUTE: (station: string) => `¡Vamos a ${station}!`,
	MID_WALK: (station: string) => `llegando a ${station}…`,

	// Restricciones y estados (§5, §19)
	NPC_LOCK: "escucha…",
	SIMULTANEOUS: "espera tu turno",
	DRAW_CAP: "aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!",
	UNCLEAR_1: "¿me lo repites o lo dibujas?",
	OVERLAP: "oí dos voces, ¿quién lo propone?",
	CIRCLE_NUDGE: "hablen entre ustedes 20s",
	CIRCLE_RESUME: "listo, tenemos plan",
	REMOTE_NPC: (station: string, npcName: string) =>
		`vayan a ${station} para hablar con ${npcName}`,
	STALL_L3: (station: string, line: string) =>
		`vayan a ${station} y digan ${line}`,
	FARMER_CLARIFY: "¿quién ayuda y en qué?",

	// Fin de partida (§1, §10, §11, §19)
	WIN_TITLE: "¡Puente listo!",
	PARTIAL_TITLE: (step: number) => `Misión en curso ${step}/3`,

	// Evaluación y banderas (§11, §19)
	TEACHER_FLAG: "con apoyo docente",
	DOCENTE_BANNER: "señales preliminares, no notas",

	// Visión (§6, §19)
	VISION_PROMPT:
		"Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each",

	// Variantes de repetición (§5, §19)
	REPEAT_ES: "repite/repítelo/puedes repetir",
	REPEAT_EN: "repeat/say again",
	REPEAT_QUZ: "huktawan niway/yapaykullay",
} as const;

// Alfabeto seguro sin confusables (0, O, 1, I, L) (§2, §3)
export const SAFE_CODE_ALPHABET = CODE_ALPHABET;
