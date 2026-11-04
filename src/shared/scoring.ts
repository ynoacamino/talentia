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
