import { describe, expect, test } from "bun:test";
import {
	BADGE_PRIORITY_ORDER,
	type BadgeId,
	badgePriority,
	calculateStars,
	filterAndPrioritizeBadges,
	starsFor,
} from "@/shared/scoring.ts";

describe("Scoring Domain Functions (SPEC §11)", () => {
	describe("calculateStars and starsFor alias", () => {
		test("returns null if mission is not finished, regardless of points", () => {
			const testCases = [0, 1, 4, 5, 7, 8, 10, 12];
			for (const pts of testCases) {
				expect(calculateStars(pts, false)).toBeNull();
				expect(starsFor(pts, false)).toBeNull();
			}
		});

		test("returns 1 star for 0-4 points when finished", () => {
			expect(calculateStars(0, true)).toBe(1);
			expect(calculateStars(1, true)).toBe(1);
			expect(calculateStars(2, true)).toBe(1);
			expect(calculateStars(3, true)).toBe(1);
			expect(calculateStars(4, true)).toBe(1);

			// Test alias
			expect(starsFor(0, true)).toBe(1);
			expect(starsFor(4, true)).toBe(1);
		});

		test("returns 2 stars for 5-7 points when finished", () => {
			expect(calculateStars(5, true)).toBe(2);
			expect(calculateStars(6, true)).toBe(2);
			expect(calculateStars(7, true)).toBe(2);

			// Test alias
			expect(starsFor(5, true)).toBe(2);
			expect(starsFor(7, true)).toBe(2);
		});

		test("returns 3 stars for 8-10 points when finished", () => {
			expect(calculateStars(8, true)).toBe(3);
			expect(calculateStars(9, true)).toBe(3);
			expect(calculateStars(10, true)).toBe(3);

			// Test alias
			expect(starsFor(8, true)).toBe(3);
			expect(starsFor(10, true)).toBe(3);
		});

		test("boundary points verification (0, 4, 5, 7, 8, 10)", () => {
			expect(starsFor(0, true)).toBe(1);
			expect(starsFor(4, true)).toBe(1);
			expect(starsFor(5, true)).toBe(2);
			expect(starsFor(7, true)).toBe(2);
			expect(starsFor(8, true)).toBe(3);
			expect(starsFor(10, true)).toBe(3);
		});
	});

	describe("filterAndPrioritizeBadges and badgePriority alias", () => {
		test("has strict BADGE_PRIORITY_ORDER according to SPEC §11", () => {
			expect(BADGE_PRIORITY_ORDER).toEqual([
				"paso_a_paso",
				"cumplieron_su_promesa",
				"un_solo_equipo",
				"se_turnaron",
				"se_organizaron",
			]);
		});

		test("returns empty array when no badges earned", () => {
			expect(filterAndPrioritizeBadges([])).toEqual([]);
			expect(badgePriority([])).toEqual([]);
		});

		test("handles 1 badge correctly", () => {
			expect(filterAndPrioritizeBadges(["se_organizaron"])).toEqual([
				"se_organizaron",
			]);
			expect(filterAndPrioritizeBadges(["paso_a_paso"])).toEqual([
				"paso_a_paso",
			]);
		});

		test("handles 2 badges and reorders by priority regardless of input order", () => {
			const input: BadgeId[] = ["se_organizaron", "se_turnaron"];
			expect(filterAndPrioritizeBadges(input)).toEqual([
				"se_turnaron",
				"se_organizaron",
			]);
		});

		test("handles 3 badges in correct priority order", () => {
			const input: BadgeId[] = [
				"se_organizaron",
				"un_solo_equipo",
				"cumplieron_su_promesa",
			];
			expect(filterAndPrioritizeBadges(input)).toEqual([
				"cumplieron_su_promesa",
				"un_solo_equipo",
				"se_organizaron",
			]);
		});

		test("handles 4 badges by capping at 3 and dropping the lowest priority", () => {
			const input: BadgeId[] = [
				"se_organizaron",
				"se_turnaron",
				"cumplieron_su_promesa",
				"un_solo_equipo",
			];
			// Priorities: cumplieron_su_promesa > un_solo_equipo > se_turnaron > se_organizaron
			// Top 3 should be: cumplieron_su_promesa, un_solo_equipo, se_turnaron
			expect(filterAndPrioritizeBadges(input)).toEqual([
				"cumplieron_su_promesa",
				"un_solo_equipo",
				"se_turnaron",
			]);
		});

		test("handles all 5 badges by capping at top 3 strictly", () => {
			const allFive: BadgeId[] = [
				"se_organizaron",
				"se_turnaron",
				"un_solo_equipo",
				"cumplieron_su_promesa",
				"paso_a_paso",
			];
			// Top 3 strictly: Paso a paso > Cumplieron su promesa > Un solo equipo
			expect(filterAndPrioritizeBadges(allFive)).toEqual([
				"paso_a_paso",
				"cumplieron_su_promesa",
				"un_solo_equipo",
			]);
			expect(badgePriority(allFive)).toEqual([
				"paso_a_paso",
				"cumplieron_su_promesa",
				"un_solo_equipo",
			]);
		});

		test("deduplicates redundant badge IDs in input", () => {
			const duplicates: BadgeId[] = [
				"paso_a_paso",
				"paso_a_paso",
				"se_turnaron",
				"se_turnaron",
			];
			expect(filterAndPrioritizeBadges(duplicates)).toEqual([
				"paso_a_paso",
				"se_turnaron",
			]);
		});
	});
});
