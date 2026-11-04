import { describe, expect, test } from "bun:test";
import { setDialogueAudio } from "@/game/dialogue/audio.ts";
import {
	clearDialogues,
	getDialogue,
	registerDialogue,
} from "@/game/dialogue/registry.ts";

describe("dialogue registry inyectable", () => {
	test("registra y recupera scripts + audio stub", () => {
		clearDialogues();
		const played: string[] = [];
		setDialogueAudio({
			play: (src) => played.push(src),
			stop: () => {},
		});

		registerDialogue({
			id: "test",
			lines: [
				{ id: "l1", speaker: "NPC", text: "Hola", audio: "/audio/hola.mp3" },
			],
		});

		expect(getDialogue("test")?.lines.length).toBe(1);
		expect(played.length).toBe(0);
	});
});
