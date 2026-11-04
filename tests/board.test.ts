import { describe, expect, test } from "bun:test";
import { BoardGraph } from "@/game/board/graph.ts";
import { classicLoopBoard } from "@/game/board/levels.classic.ts";

describe("BoardGraph", () => {
	test("avanza y cuenta vueltas en loop", () => {
		const board = new BoardGraph([
			{ index: 0, kind: "start", next: [1] },
			{ index: 1, kind: "normal", next: [2] },
			{ index: 2, kind: "normal", next: [0] },
		]);
		const r = board.advance(1, 2);
		expect(r.tile).toBe(0);
		expect(r.laps).toBe(1);
	});

	test("classic loop tiene 24 casillas y cierra", () => {
		const board = classicLoopBoard();
		expect(board.size).toBe(24);
		expect(board.nextIndices(23)).toEqual([0]);
	});
});
