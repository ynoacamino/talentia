import { describe, expect, test } from "bun:test";
import { createWorld } from "koota";
import { spawnMatch } from "@/game/actions.ts";
import { classicLoopBoard } from "@/game/board/levels.classic.ts";
import { getItem } from "@/game/items/items.ts";
import { findPlayerEntity } from "@/game/tiles/effects.ts";
import { Player } from "@/game/traits.ts";
import type { GameConfig } from "@/shared/types.ts";

const config: GameConfig = {
	boardId: "classic-loop",
	lapsToWin: 3,
	players: [
		{ name: "P1", color: "#fff" },
		{ name: "P2", color: "#000" },
	],
};

describe("items", () => {
	test("moneda-extra suma 5", () => {
		const world = createWorld();
		spawnMatch(world, config);
		const board = classicLoopBoard();
		const result = getItem("moneda-extra")?.use({
			world,
			board,
			cols: 6,
			playerIndex: 0,
			rng: Math.random,
		});
		expect(result?.ok).toBe(true);
		expect(findPlayerEntity(world, 0)?.get(Player)?.coins).toBe(5);
		world.destroy();
	});

	test("roba-monedas quita al más rico", () => {
		const world = createWorld();
		spawnMatch(world, config);
		const board = classicLoopBoard();
		findPlayerEntity(world, 1)?.set(Player, { coins: 8 });
		const result = getItem("roba-monedas")?.use({
			world,
			board,
			cols: 6,
			playerIndex: 0,
			rng: Math.random,
		});
		expect(result?.ok).toBe(true);
		expect(findPlayerEntity(world, 0)?.get(Player)?.coins).toBe(5);
		expect(findPlayerEntity(world, 1)?.get(Player)?.coins).toBe(3);
		world.destroy();
	});

	test("teleport-star lleva a casilla star", () => {
		const world = createWorld();
		spawnMatch(world, config);
		const board = classicLoopBoard();
		const result = getItem("teleport-star")?.use({
			world,
			board,
			cols: 6,
			playerIndex: 0,
			rng: Math.random,
		});
		expect(result?.ok).toBe(true);
		expect(findPlayerEntity(world, 0)?.get(Player)?.tileIndex).toBe(6);
		world.destroy();
	});
});
