/**
 * Dictionary registry for SocraticGuild / TALENTIA.
 */

import { enDictionary } from "@/shared/i18n/dictionaries/en.ts";
import { esDictionary } from "@/shared/i18n/dictionaries/es.ts";
import { quzDictionary } from "@/shared/i18n/dictionaries/quz.ts";
import type { Language, TranslationDictionary } from "@/shared/i18n/types.ts";

export { enDictionary } from "@/shared/i18n/dictionaries/en.ts";
export { esDictionary } from "@/shared/i18n/dictionaries/es.ts";
export { quzDictionary } from "@/shared/i18n/dictionaries/quz.ts";

export const dictionaries: Record<Language, TranslationDictionary> = {
	ES: esDictionary,
	EN: enDictionary,
	QUZ: quzDictionary,
};
