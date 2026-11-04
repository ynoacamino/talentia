/**
 * 4-character session code generator without confusable characters.
 * SPEC.md §2 & docs/gates/F0-contrato.md §1.2 D1.
 *
 * Safe alphabet: 31 uppercase alphanumeric characters excluding:
 * - 0 (zero) and O (letter O)
 * - 1 (one), I (capital i), L (capital L)
 */

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ" as const;

export const CONFUSABLE_CHARS = [
	"0",
	"O",
	"1",
	"I",
	"L",
	"o",
	"l",
	"i",
] as const;

/**
 * Checks whether a character or string contains confusable glyphs (0, O, 1, I, L).
 */
export function hasConfusable(code: string): boolean {
	for (let i = 0; i < code.length; i++) {
		const char = code.charAt(i);
		for (let j = 0; j < CONFUSABLE_CHARS.length; j++) {
			if (char === CONFUSABLE_CHARS[j]) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Checks if a string is a valid 4-character session code.
 */
export function isValidCode(code: string): boolean {
	if (code.length !== 4) {
		return false;
	}
	for (let i = 0; i < code.length; i++) {
		const char = code.charAt(i);
		if (!CODE_ALPHABET.includes(char as (typeof CODE_ALPHABET)[number])) {
			return false;
		}
	}
	return true;
}

/**
 * Generates an uppercase 4-character alphanumeric code without confusables.
 * Uses crypto.getRandomValues with rejection sampling for unbiased uniform distribution.
 */
export function codeGen(length = 4): string {
	const alphabetLength = CODE_ALPHABET.length;
	let result = "";

	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		// Rejection sampling upper bound to avoid modulo bias (256 - (256 % 31) = 248)
		const maxValid = 256 - (256 % alphabetLength);
		const buffer = new Uint8Array(1);

		while (result.length < length) {
			crypto.getRandomValues(buffer);
			const byte = buffer[0] ?? 0;
			if (byte < maxValid) {
				const char = CODE_ALPHABET.charAt(byte % alphabetLength);
				result += char;
			}
		}
	} else {
		for (let i = 0; i < length; i++) {
			const index = Math.floor(Math.random() * alphabetLength);
			result += CODE_ALPHABET.charAt(index);
		}
	}

	return result;
}
