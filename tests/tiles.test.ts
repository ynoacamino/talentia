import { describe, expect, test } from "bun:test";
import { createWorld } from "koota";
import { spawnMatch } from "@/game/actions.ts";
import { classicLoopBoard } from "@/game/board/levels.classic.ts";
import { playTurn } from "@/game/systems/turn.ts";
import { applyTileEffect, findPlayerEntity } from "@/game/tiles/effects.ts";
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

describe("tile effects", () => {
	test("star cobra 10 y da estrella; sin monedas solo avisa", () => {
		const world = createWorld();
		spawnMatch(world, config);
		const entity = findPlayerEntity(world, 0);
		entity?.set(Player, { coins: 10 });
		const events = applyTileEffect(world, "star", 0);
		expect(entity?.get(Player)?.stars).toBe(1);
		expect(entity?.get(Player)?.coins).toBe(0);
		expect(events[0]?.kind).toBe("stars");
		world.destroy();
	});

	test("trap no deja monedas negativas", () => {
		const world = createWorld();
		spawnMatch(world, config);
		const events = applyTileEffect(world, "trap", 1);
		expect(findPlayerEntity(world, 1)?.get(Player)?.coins).toBe(0);
		expect(events[0]?.amount).toBe(0);
		world.destroy();
	});

	test("playTurn mueve, cae en star (tile 6) y aplica efecto", () => {
		const world = createWorld();
		spawnMatch(world, config);
		findPlayerEntity(world, 0)?.set(Player, { coins: 10 });
		const board = classicLoopBoard();
		const result = playTurn(world, board, 0, 6, () => 0.9);
		expect(result?.tile).toBe(6);
		expect(board.tiles[6]?.kind).toBe("star");
		expect(result?.events.some((e) => e.kind === "stars")).toBe(true);
		world.destroy();
	});
});
