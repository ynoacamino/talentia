/**
 * Badges Visual Tokens & Definitions (SPEC §11)
 * Estrictamente tokens visuales y metadata de insignias.
 * Lógica de dominio pura (cálculo de estrellas y priorización) vive en @/shared/scoring.ts.
 */
export type {
	BadgeDefinition,
	GroupScoreQuotes,
	GroupScores,
} from "@/shared/scoring.ts";
export { BADGE_DEFINITIONS } from "@/shared/scoring.ts";
