/**
 * Translation function and hook for SocraticGuild / TALENTIA.
 * SPEC.md §2, §11, §14, §19 & docs/gates/F0-contrato.md.
 */

import {
	dictionaries,
	esDictionary,
} from "@/shared/i18n/dictionaries/index.ts";
import {
	LOCKED_STRINGS,
	type LockedStringKey,
} from "@/shared/i18n/lockedStrings.ts";
import type { Language } from "@/shared/i18n/types.ts";

type DictNode =
	| string
	| number
	| boolean
	| { readonly [key: string]: DictNode };

/**
 * Helper to safely resolve a dot-path string inside an object.
 */
function getNestedValue(
	obj: { readonly [key: string]: DictNode },
	path: string,
): string | undefined {
	const segments = path.split(".");
	let current: DictNode | undefined = obj;

	for (const segment of segments) {
		if (
			current === null ||
			current === undefined ||
			typeof current !== "object" ||
			!(segment in current)
		) {
			return undefined;
		}
		current = current[segment];
	}

	return typeof current === "string" ? current : undefined;
}

/**
 * Replaces `{paramName}` placeholders with corresponding string/number values.
 */
function interpolate(
	template: string,
	params?: Record<string, string | number>,
): string {
	if (!params) {
		return template;
	}

	return template.replace(/\{(\w+)\}/g, (match, key: string) => {
		const val = params[key];
		return val !== undefined ? String(val) : match;
	});
}

/**
 * Pure translation function.
 *
 * Lookup order:
 * 1. Check LOCKED_STRINGS if key matches a locked constant.
 * 2. Look up key path in the requested language dictionary.
 * 3. Fallback to Spanish (ES) dictionary if missing in requested language.
 * 4. Fallback to raw key if not found in any dictionary.
 * 5. Interpolate `{placeholder}` parameters if provided.
 */
export function t(
	key: string,
	lang: Language = "ES",
	params?: Record<string, string | number>,
): string {
	// 1. Direct check in LOCKED_STRINGS
	if (key in LOCKED_STRINGS) {
		const locked = LOCKED_STRINGS[key as LockedStringKey];
		return interpolate(locked, params);
	}
	if (key.startsWith("LOCKED_STRINGS.")) {
		const stripped = key.replace("LOCKED_STRINGS.", "");
		if (stripped in LOCKED_STRINGS) {
			const locked = LOCKED_STRINGS[stripped as LockedStringKey];
			return interpolate(locked, params);
		}
	}

	// 2. Resolve dictionary
	const targetDict = dictionaries[lang] ?? esDictionary;
	let value = getNestedValue(
		targetDict as never as { readonly [key: string]: DictNode },
		key,
	);

	// 3. Fallback to ES if missing
	if (value === undefined && lang !== "ES") {
		value = getNestedValue(
			esDictionary as never as { readonly [key: string]: DictNode },
			key,
		);
	}

	// 4. Fallback to key itself
	const resolved = value ?? key;

	// 5. Interpolate
	return interpolate(resolved, params);
}

/**
 * Hook-style or bound translation helper for UI components.
 * Returns a bound `t` function that automatically uses the specified language.
 */
export function useTranslation(lang: Language = "ES") {
	return {
		t: (key: string, params?: Record<string, string | number>) =>
			t(key, lang, params),
		lang,
	};
}

/**
 * Dedicated Docente translation helper.
 * Enforces Spanish (ES) regardless of game language (SPEC §11, §14).
 */
export function tDocente(
	key: string,
	params?: Record<string, string | number>,
): string {
	return t(key, "ES", params);
}
