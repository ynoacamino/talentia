/**
 * Pure domain scoring functions for SocraticGuild / TALENTIA.
 * SPEC.md §1, §10, §11 & docs/gates/F0-contrato.md §3 (Sección 9).
 */

export type StarRating = 1 | 2 | 3;

export type BadgeId =
	| "paso_a_paso"
	| "cumplieron_su_promesa"
	| "un_solo_equipo"
	| "se_turnaron"
	| "se_organizaron";

/**
 * Strict priority order for earned badges when more than 3 are earned:
 * 1. Paso a paso (resolucionEstructurada == 2)
 * 2. Cumplieron su promesa (negociacion == 2)
 * 3. Un solo equipo (colaboracion == 2)
 * 4. Se turnaron (turnTaking == 2)
 * 5. Se organizaron (organizacionLiderazgo == 2)
 */
export const BADGE_PRIORITY_ORDER: readonly BadgeId[] = [
	"paso_a_paso",
	"cumplieron_su_promesa",
	"un_solo_equipo",
	"se_turnaron",
	"se_organizaron",
] as const;

/**
 * Maps cumulative group soft-skill points (0-10) to stars (1-3★).
 * Strict requirement: Mission must be finished (cross the bridge).
 * If !isFinished (time expired or manual end-run), stars are withheld (returns null).
 *
 * Point ranges:
 * - 0 - 4  => 1★
 * - 5 - 7  => 2★
 * - 8 - 10 => 3★
 */
export function calculateStars(
	sumPoints: number,
	isFinished: boolean,
): StarRating | null {
	if (!isFinished) {
		return null;
	}
	if (sumPoints <= 4) {
		return 1;
	}
	if (sumPoints <= 7) {
		return 2;
	}
	return 3;
}

export const starsFor = calculateStars;

/**
 * Filters and prioritizes earned badges according to strict contract rules:
 * - Returns at most 3 badges.
 * - Resolves tie-breaks using BADGE_PRIORITY_ORDER.
 * - Deduplicates any repeated badges.
 */
export function filterAndPrioritizeBadges(
	earnedBadges: readonly BadgeId[],
): BadgeId[] {
	const badgeSet = new Set(earnedBadges);
	const prioritized: BadgeId[] = [];

	for (const badge of BADGE_PRIORITY_ORDER) {
		if (badgeSet.has(badge)) {
			prioritized.push(badge);
			if (prioritized.length === 3) {
				break;
			}
		}
	}

	return prioritized;
}

export const badgePriority = filterAndPrioritizeBadges;

export interface GroupScores {
	turnTaking: number; // 0..2
	colaboracion: number; // 0..2
	negociacion: number; // 0..2
	estructurada: number; // 0..2
	organizacion: number; // 0..2
}

export interface GroupScoreQuotes {
	turnTaking: string;
	colaboracion: string;
	negociacion: string;
	estructurada: string;
	organizacion: string;
}

export interface BadgeDefinition {
	id: BadgeId;
	name: string;
	criterionKey: keyof GroupScores;
	priority: number; // 1 = máxima prioridad
	description: string;
	icon: string;
	defaultQuote: {
		ES: string;
		EN: string;
		QUZ: string;
	};
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
	{
		id: "paso_a_paso",
		name: "Paso a paso",
		criterionKey: "estructurada",
		priority: 1,
		description:
			"Planearon la secuencia chacra → taller → alcaldía paso a paso.",
		icon: "🪜",
		defaultQuote: {
			ES: "Primero fuimos a la chacra y luego al taller.",
			EN: "First we went to the farm, then to the workshop.",
			QUZ: "Ñawpaqta chakrapi rirqanchik, chaymantataq kanchapi.",
		},
	},
	{
		id: "cumplieron_su_promesa",
		name: "Cumplieron su promesa",
		criterionKey: "negociacion",
		priority: 2,
		description:
			"Ofrecieron ayuda mutua y recordaron los compromisos con Paco y Soto.",
		icon: "🤝",
		defaultQuote: {
			ES: "Le prometimos a Paco regar los surcos a cambio de los troncos.",
			EN: "We promised Paco to water the crops in exchange for timber.",
			QUZ: "Pacota rimaykurqanchik k'ullukunata chaskinapaq.",
		},
	},
	{
		id: "un_solo_equipo",
		name: "Un solo equipo",
		criterionKey: "colaboracion",
		priority: 3,
		description: "Construyeron sobre las ideas de los demás sin interrumpirse.",
		icon: "🛡️",
		defaultQuote: {
			ES: "Sumamos el plano del puente a la madera que trajimos.",
			EN: "We combined the bridge blueprint with the timber we brought.",
			QUZ: "Chakrap siq'iyninta k'aspikunawan kuska churanchik.",
		},
	},
	{
		id: "se_turnaron",
		name: "Se turnaron",
		criterionKey: "turnTaking",
		priority: 4,
		description:
			"Cedieron la palabra con paciencia y respetaron los turnos de habla.",
		icon: "🔄",
		defaultQuote: {
			ES: "Cada integrante esperó su momento y escuchamos a todos.",
			EN: "Each member waited their turn and we listened to everyone.",
			QUZ: "Sapanka suyarqan rimanapaq, tukuyta allinta uyarispa.",
		},
	},
	{
		id: "se_organizaron",
		name: "Se organizaron",
		criterionKey: "organizacion",
		priority: 5,
		description: "Propusieron un orden claro de acción y distribuyeron tareas.",
		icon: "🧭",
		defaultQuote: {
			ES: "Alguien propuso votar antes de viajar hacia la alcaldía.",
			EN: "Someone proposed to vote before heading to town hall.",
			QUZ: "Pitaq rimarirqan manaraq alcaldiata rinkachkaspa.",
		},
	},
] as const;
