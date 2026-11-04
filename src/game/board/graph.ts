export type TileKind = "start" | "normal" | "star" | "event" | "trap" | "bonus";

export type TileDef = {
	index: number;
	kind: TileKind;
	// Para tableros lineales/circulares basta next. Para bifurcaciones, choices.
	next: number[];
};

// Grafo de casillas. Headless y testeable con `bun test`.
export class BoardGraph {
	tiles: TileDef[];

	constructor(tiles: TileDef[]) {
		this.tiles = tiles;
	}

	get size(): number {
		return this.tiles.length;
	}

	nextIndices(from: number): number[] {
		return this.tiles[from]?.next ?? [];
	}

	// Avanza n pasos desde `from`. Si hay bifurcación usa `choices` (por defecto primera rama).
	// Retorna { tile, laps } donde laps = veces que cruzó start.
	advance(
		from: number,
		steps: number,
		choices: number[] = [],
	): { tile: number; laps: number } {
		let cur = from;
		let laps = 0;
		let ci = 0;
		for (let i = 0; i < steps; i++) {
			const nexts = this.nextIndices(cur);
			const first = nexts[0];
			if (nexts.length === 0 || first === undefined) break;
			const pick =
				nexts.length === 1 ? first : (nexts[choices[ci++] ?? 0] ?? first);
			if (pick === 0 && this.tiles[0]?.kind === "start") laps += 1;
			cur = pick;
		}
		return { tile: cur, laps };
	}
}
