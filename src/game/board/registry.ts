import type { BoardGraph } from "@/game/board/graph.ts";
import { classicLoopBoard } from "@/game/board/levels.classic.ts";

export type BoardDef = {
	id: string;
	name: string;
	/** Columnas para mapear tileIndex → mundo 3D. */
	cols: number;
	build: () => BoardGraph;
};

const boards = new Map<string, BoardDef>();

export function defineBoard(def: BoardDef): BoardDef {
	return def;
}

export function registerBoard(def: BoardDef): void {
	boards.set(def.id, def);
}

export function getBoardDef(id: string): BoardDef | undefined {
	return boards.get(id);
}

export function listBoards(): BoardDef[] {
	return [...boards.values()];
}

export function clearBoards(): void {
	boards.clear();
}

export function getBoard(id: string): BoardGraph {
	return getBoardDef(id)?.build() ?? classicLoopBoard();
}

export function getBoardCols(id: string): number {
	return getBoardDef(id)?.cols ?? 6;
}

registerBoard(
	defineBoard({
		id: "classic-loop",
		name: "Circuito Clásico",
		cols: 6,
		build: classicLoopBoard,
	}),
);
