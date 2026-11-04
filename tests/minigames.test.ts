import { describe, expect, test } from "bun:test";
import {
	clearMinigames,
	getMinigame,
	registerMinigame,
} from "@/game/minigames/registry.ts";
import { defineMinigame } from "@/game/minigames/types.ts";

describe("minigame factory", () => {
	test("define + registra minijuegos intercambiables", () => {
		clearMinigames();
		const demo = defineMinigame({
			id: "demo",
			name: "Demo",
			description: "d",
			instructions: "i",
			minPlayers: 2,
			maxPlayers: 4,
			setup: () => {},
		});
		registerMinigame(demo);
		expect(getMinigame("demo")?.name).toBe("Demo");
	});
});
