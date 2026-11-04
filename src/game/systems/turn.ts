import type { World } from "koota";
import { rollD6 } from "@/core/rng.ts";
import type { BoardGraph } from "@/game/board/graph.ts";
import { movePlayerToTile } from "@/game/systems/movement.ts";
import type { TileEvent } from "@/game/tiles/effects.ts";
import { applyTileEffect, findPlayerEntity } from "@/game/tiles/effects.ts";
import { Player } from "@/game/traits.ts";

export function rollTurn(): number {
	return rollD6();
}

export function nextPlayer(current: number, total: number): number {
	return (current + 1) % total;
}

export type TurnResult = {
	roll: number;
	tile: number;
	laps: number;
	events: TileEvent[];
};

// Turno completo testeable: tira, mueve, bonus por vuelta y efecto de casilla.
export function playTurn(
	world: World,
	board: BoardGraph,
	playerIndex: number,
	steps: number,
	rng: () => number = Math.random,
): TurnResult | null {
	const moved = movePlayerToTile(world, board, playerIndex, steps);
	if (!moved) return null;
	const events: TileEvent[] = [];
	if (moved.laps > 0) {
		const entity = findPlayerEntity(world, playerIndex);
		const p = entity?.get(Player);
		if (entity && p) {
			entity.set(Player, { coins: p.coins + 5 * moved.laps });
			events.push({
				kind: "coins",
				playerIndex,
				amount: 5 * moved.laps,
				message: `Vuelta completa +${5 * moved.laps}`,
			});
		}
	}
	const tile = board.tiles[moved.tile];
	if (tile) events.push(...applyTileEffect(world, tile.kind, playerIndex, rng));
	return { roll: steps, tile: moved.tile, laps: moved.laps, events };
}
