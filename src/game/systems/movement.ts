import type { World } from "koota";
import { tileToWorld } from "@/core/math.ts";
import type { BoardGraph } from "@/game/board/graph.ts";
import { Player, Transform } from "@/game/traits.ts";

// Mueve la entidad del jugador al tile destino (snap; la animación la hace la vista con gsap).
export function movePlayerToTile(
	world: World,
	board: BoardGraph,
	playerIndex: number,
	steps: number,
	cols = 6,
) {
	const entity = world
		.query(Player)
		.find((e) => e.get(Player)?.index === playerIndex);
	if (!entity) return null;
	const p = entity.get(Player);
	if (!p) return null;
	const { tile, laps } = board.advance(p.tileIndex, steps);
	entity.set(Player, { tileIndex: tile, laps: p.laps + laps });
	const pos = tileToWorld(tile, cols);
	entity.set(Transform, { x: pos.x, y: 0, z: pos.z });
	return { tile, laps: p.laps + laps };
}
