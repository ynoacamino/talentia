/**
 * Public API for i18n subsystem in SocraticGuild / TALENTIA.
 */

export {
	dictionaries,
	enDictionary,
	esDictionary,
	quzDictionary,
} from "@/shared/i18n/dictionaries/index.ts";

export {
	formatBannerMove,
	formatMidWalk,
	formatMoveExecute,
	formatPartialTitle,
	formatRemoteNpc,
	formatStallL3,
	LOCKED_STRINGS,
	type LockedStringKey,
} from "@/shared/i18n/lockedStrings.ts";

export { t, tDocente, useTranslation } from "@/shared/i18n/t.ts";

export {
	type BadgeTranslation,
	type Language,
	SUPPORTED_LANGUAGES,
	type TranslationDictionary,
} from "@/shared/i18n/types.ts";
