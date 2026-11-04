import { describe, expect, test } from "bun:test";
import {
	CODE_ALPHABET,
	CONFUSABLE_CHARS,
	codeGen,
	hasConfusable,
	isValidCode,
} from "@/shared/codeGen.ts";

describe("Code Generation Pure Function (SPEC §2)", () => {
	test("codeGen generates 4-character codes", () => {
		const code = codeGen();
		expect(code).toBeString();
		expect(code.length).toBe(4);
	});

	test("alphabet does not contain any confusable characters (0, O, 1, I, L)", () => {
		for (const confusable of CONFUSABLE_CHARS) {
			expect(CODE_ALPHABET.includes(confusable as never)).toBe(false);
		}
		expect(CODE_ALPHABET.length).toBe(31);
	});

	test("isValidCode correctly accepts valid codes and rejects invalid ones", () => {
		expect(isValidCode("K7B9")).toBe(true);
		expect(isValidCode("M2P4")).toBe(true);
		expect(isValidCode("T8X2")).toBe(true);

		// Confusables rejected
		expect(isValidCode("K0B9")).toBe(false); // contains 0
		expect(isValidCode("KOB9")).toBe(false); // contains O
		expect(isValidCode("17B9")).toBe(false); // contains 1
		expect(isValidCode("I7B9")).toBe(false); // contains I
		expect(isValidCode("L7B9")).toBe(false); // contains L

		// Wrong lengths rejected
		expect(isValidCode("K7B")).toBe(false);
		expect(isValidCode("K7B99")).toBe(false);
		expect(isValidCode("")).toBe(false);
	});

	test("hasConfusable correctly identifies ambiguous characters", () => {
		expect(hasConfusable("ABCD")).toBe(false);
		expect(hasConfusable("A0CD")).toBe(true);
		expect(hasConfusable("ABOD")).toBe(true);
		expect(hasConfusable("AB1D")).toBe(true);
		expect(hasConfusable("ABID")).toBe(true);
		expect(hasConfusable("ABLD")).toBe(true);
		expect(hasConfusable("abid")).toBe(true);
	});

	test("generates 1000 samples verifying length 4 and 0 confusables on each", () => {
		const SAMPLES = 1000;
		const generated = new Set<string>();

		for (let i = 0; i < SAMPLES; i++) {
			const code = codeGen();

			// Length check
			expect(code.length).toBe(4);

			// Confusables check
			expect(hasConfusable(code)).toBe(false);
			expect(isValidCode(code)).toBe(true);

			// Character by character check against alphabet
			for (let c = 0; c < 4; c++) {
				const char = code.charAt(c);
				expect(CODE_ALPHABET.includes(char as never)).toBe(true);
				expect(["0", "O", "1", "I", "L"]).not.toContain(char);
			}

			generated.add(code);
		}

		// Ensure good entropy (at least 95% unique across 1000 samples)
		expect(generated.size).toBeGreaterThan(950);
	});
});
