import type { TileDef, TileKind } from "@/game/board/graph.ts";
import { BoardGraph } from "@/game/board/graph.ts";

function kindFor(i: number): TileKind {
	if (i === 0) return "start";
	if (i === 6 || i === 12 || i === 18) return "star";
	if (i === 8 || i === 20) return "event";
	if (i === 10 || i === 22) return "trap";
	if (i === 4 || i === 16) return "bonus";
	return "normal";
}

// Tablero circular 24 casillas. Para tableros nuevos: duplica esta
// función, cambia layout y regístralo con registerBoard().
export function classicLoopBoard(): BoardGraph {
	const N = 24;
	const tiles: TileDef[] = [];
	for (let i = 0; i < N; i++) {
		tiles.push({ index: i, kind: kindFor(i), next: [(i + 1) % N] });
	}
	return new BoardGraph(tiles);
}
