import { describe, expect, test } from "bun:test";
import {
	dictionaries,
	enDictionary,
	esDictionary,
	quzDictionary,
} from "@/shared/i18n/dictionaries/index.ts";
import {
	formatBannerMove,
	formatMidWalk,
	formatMoveExecute,
	formatPartialTitle,
	formatRemoteNpc,
	formatStallL3,
	LOCKED_STRINGS,
} from "@/shared/i18n/lockedStrings.ts";
import { t, tDocente, useTranslation } from "@/shared/i18n/t.ts";
import type { Language } from "@/shared/i18n/types.ts";

describe("i18n Subsystem & Locked Strings (SPEC §2, §11, §14, §19)", () => {
	describe("SPEC §19: Exact 21 Locked Strings", () => {
		test("exports exactly 21 locked strings with required keys", () => {
			const keys = Object.keys(LOCKED_STRINGS);
			expect(keys.length).toBe(21);
		});

		test("TR-19-01: BANNER_MOVE matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.BANNER_MOVE).toBe(
				"¿Vamos a X? propuso [Nombre], mantén para vetar (5s)",
			);
		});

		test("TR-19-02: MOVE_EXECUTE matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.MOVE_EXECUTE).toBe("¡Vamos a X!");
		});

		test("TR-19-03: MID_WALK contains single-character Unicode ellipsis U+2026", () => {
			expect(LOCKED_STRINGS.MID_WALK).toBe("llegando a X…");
			expect(LOCKED_STRINGS.MID_WALK.endsWith("\u2026")).toBe(true);
		});

		test("TR-19-04: NPC_LOCK contains single-character Unicode ellipsis U+2026", () => {
			expect(LOCKED_STRINGS.NPC_LOCK).toBe("escucha…");
			expect(LOCKED_STRINGS.NPC_LOCK.endsWith("\u2026")).toBe(true);
		});

		test("TR-19-05: SIMULTANEOUS matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.SIMULTANEOUS).toBe("espera tu turno");
		});

		test("TR-19-06: DRAW_CAP matches pixel-verbatim with inverted exclamation", () => {
			expect(LOCKED_STRINGS.DRAW_CAP).toBe(
				"aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!",
			);
		});

		test("TR-19-07: UNCLEAR_1 matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.UNCLEAR_1).toBe("¿me lo repites o lo dibujas?");
		});

		test("TR-19-08: OVERLAP matches pixel-verbatim with accents", () => {
			expect(LOCKED_STRINGS.OVERLAP).toBe("oí dos voces, ¿quién lo propone?");
		});

		test("TR-19-09: CIRCLE_NUDGE and CIRCLE_READY match pixel-verbatim", () => {
			expect(LOCKED_STRINGS.CIRCLE_NUDGE).toBe("hablen entre ustedes 20s");
			expect(LOCKED_STRINGS.CIRCLE_READY).toBe("listo, tenemos plan");
		});

		test("TR-19-10: REMOTE_NPC matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.REMOTE_NPC).toBe("vayan a X para hablar con Y");
		});

		test("TR-19-11: STALL_L3 matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.STALL_L3).toBe("vayan a X y digan Y");
		});

		test("TR-19-12: FARMER_CLARIFY matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.FARMER_CLARIFY).toBe("¿quién ayuda y en qué?");
		});

		test("TR-19-13: WIN_TITLE matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.WIN_TITLE).toBe("¡Puente listo!");
		});

		test("TR-19-14: PARTIAL_TITLE matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.PARTIAL_TITLE).toBe("Misión en curso X/3");
		});

		test("TR-19-15: TEACHER_FLAG matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.TEACHER_FLAG).toBe("con apoyo docente");
		});

		test("TR-19-16: DOCENTE_BANNER matches pixel-verbatim", () => {
			expect(LOCKED_STRINGS.DOCENTE_BANNER).toBe(
				"señales preliminares, no notas",
			);
		});

		test("TR-19-17: VISION_PROMPT matches pixel-verbatim in English", () => {
			expect(LOCKED_STRINGS.VISION_PROMPT).toBe(
				"Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each",
			);
		});

		test("TR-19-18, 19, 20: REPEAT variants match pixel-verbatim", () => {
			expect(LOCKED_STRINGS.REPEAT_ES).toBe("repite/repítelo/puedes repetir");
			expect(LOCKED_STRINGS.REPEAT_EN).toBe("repeat/say again");
			expect(LOCKED_STRINGS.REPEAT_QUZ).toBe("huktawan niway/yapaykullay");
		});

		test("Formatters for locked strings produce accurate text", () => {
			expect(formatBannerMove("taller", "Lucas")).toBe(
				"¿Vamos a taller? propuso Lucas, mantén para vetar (5s)",
			);
			expect(formatMoveExecute("alcaldía")).toBe("¡Vamos a alcaldía!");
			expect(formatMidWalk("puente")).toBe("llegando a puente…");
			expect(formatRemoteNpc("chacra", "Paco")).toBe(
				"vayan a chacra para hablar con Paco",
			);
			expect(formatStallL3("taller", "necesitamos plano")).toBe(
				"vayan a taller y digan necesitamos plano",
			);
			expect(formatPartialTitle(2)).toBe("Misión en curso 2/3");
		});
	});

	describe("Translation Dictionaries Completeness (ES, EN, QUZ)", () => {
		const languages: Language[] = ["ES", "EN", "QUZ"];

		test("all dictionaries exist in registry", () => {
			for (const lang of languages) {
				expect(dictionaries[lang]).toBeDefined();
			}
		});

		test("common strings are present across all languages", () => {
			for (const lang of languages) {
				const dict = dictionaries[lang];
				expect(dict.common.appName).toBe("SocraticGuild");
				expect(dict.common.ready).toBeString();
				expect(dict.common.cancel).toBeString();
				expect(dict.common.pause).toBeString();
			}
		});

		test("all 5 badges have complete name and description in each language", () => {
			const badgeIds = [
				"paso_a_paso",
				"cumplieron_su_promesa",
				"un_solo_equipo",
				"se_turnaron",
				"se_organizaron",
			] as const;

			for (const lang of languages) {
				const dict = dictionaries[lang];
				for (const id of badgeIds) {
					expect(dict.badges[id]).toBeDefined();
					expect(dict.badges[id].name.length).toBeGreaterThan(0);
					expect(dict.badges[id].description.length).toBeGreaterThan(0);
				}
			}
		});

		test("SPEC §11, §14: DocenteView sections remain ALWAYS in Spanish in EN and QUZ", () => {
			// D2 Past Sessions
			expect(enDictionary.d2.pastSessionsTitle).toBe(
				esDictionary.d2.pastSessionsTitle,
			);
			expect(quzDictionary.d2.pastSessionsTitle).toBe(
				esDictionary.d2.pastSessionsTitle,
			);

			// D4 Pedagogical View
			expect(enDictionary.d4.title).toBe(esDictionary.d4.title);
			expect(quzDictionary.d4.title).toBe(esDictionary.d4.title);
			expect(enDictionary.d4.docenteBanner).toBe(LOCKED_STRINGS.DOCENTE_BANNER);
			expect(quzDictionary.d4.docenteBanner).toBe(
				LOCKED_STRINGS.DOCENTE_BANNER,
			);
			expect(enDictionary.d4.criteria.turnTaking).toBe(
				esDictionary.d4.criteria.turnTaking,
			);
			expect(quzDictionary.d4.criteria.turnTaking).toBe(
				esDictionary.d4.criteria.turnTaking,
			);

			// D5 Comments & Hard Delete
			expect(enDictionary.d5.commentsTitle).toBe(esDictionary.d5.commentsTitle);
			expect(quzDictionary.d5.commentsTitle).toBe(
				esDictionary.d5.commentsTitle,
			);

			// D6 Operator Console
			expect(enDictionary.d6.console.title).toBe(esDictionary.d6.console.title);
			expect(quzDictionary.d6.console.title).toBe(
				esDictionary.d6.console.title,
			);
		});

		test("NPC names are fixed across all languages (SPEC §8)", () => {
			for (const lang of languages) {
				const dict = dictionaries[lang];
				expect(dict.d6.npcs.soto).toBe("Alcalde Soto");
				expect(dict.d6.npcs.luz).toBe("Ingeniera Luz");
				expect(dict.d6.npcs.paco).toBe("Agricultor Paco");
			}
		});
	});

	describe("t() translation function and useTranslation hook", () => {
		test("resolves direct locked strings", () => {
			expect(t("WIN_TITLE")).toBe("¡Puente listo!");
			expect(t("LOCKED_STRINGS.PARTIAL_TITLE")).toBe("Misión en curso X/3");
		});

		test("resolves dot-path keys for ES, EN, and QUZ", () => {
			expect(t("common.ready", "ES")).toBe("Listo");
			expect(t("common.ready", "EN")).toBe("Ready");
			expect(t("common.ready", "QUZ")).toBe("Allinña");
		});

		test("interpolates parameters correctly", () => {
			expect(t("d1.playerSlot", "ES", { n: 2 })).toBe("Jugador 2");
			expect(t("d1.playerSlot", "EN", { n: 2 })).toBe("Player 2");
			expect(t("d1.playerSlot", "QUZ", { n: 2 })).toBe("Pukllaq 2");

			expect(t("d3.stepsCompleted", "ES", { x: 3 })).toBe(
				"Pasos completados: 3/3",
			);
			expect(t("d3.stepsCompleted", "EN", { x: 3 })).toBe(
				"Steps completed: 3/3",
			);
			expect(t("d3.stepsCompleted", "QUZ", { x: 3 })).toBe(
				"Tukusqa llamkaykuna: 3/3",
			);
		});

		test("falls back to Spanish when key is missing in target language", () => {
			// Even if a nonexistent nested key is queried, it behaves gracefully
			const fallbackResult = t("d4.criteria.turnTaking", "EN");
			expect(fallbackResult).toBe("Toma de turnos (Turn-taking)");
		});

		test("returns raw key if not found in any dictionary", () => {
			expect(t("non.existent.key.xyz", "ES")).toBe("non.existent.key.xyz");
		});

		test("useTranslation hook binds language correctly", () => {
			const { t: tQuz, lang } = useTranslation("QUZ");
			expect(lang).toBe("QUZ");
			expect(tQuz("common.pause")).toBe("Sayay");
			expect(tQuz("d6.inventory.wood")).toBe("K'ullu");
		});

		test("tDocente helper always produces Spanish output", () => {
			expect(tDocente("d4.title")).toBe(
				"Panel de Evaluación Pedagógica Docente",
			);
			expect(tDocente("d4.docenteBanner")).toBe(
				"señales preliminares, no notas",
			);
		});
	});
});
