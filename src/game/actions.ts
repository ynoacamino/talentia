import type { World } from "koota";
import { tileToWorld } from "@/core/math.ts";
import { getWorld } from "@/core/world.ts";
import { Npc } from "@/game/npcs/npcs.ts";
import { Player, PlayerMeta, Transform } from "@/game/traits.ts";
import type { GameConfig } from "@/shared/types.ts";

export function spawnMatch(world: World, config: GameConfig, cols = 6) {
	for (const e of [...world.query(Player)]) e.destroy();
	for (const e of [...world.query(Npc)]) e.destroy();
	for (let i = 0; i < config.players.length; i++) {
		const p = config.players[i];
		if (!p) continue;
		const pos = tileToWorld(0, cols);
		world.spawn(
			Player({ index: i, tileIndex: 0, coins: 0, stars: 0, laps: 0 }),
			PlayerMeta({ name: p.name, color: p.color }),
			Transform({ x: pos.x, y: 0, z: pos.z }),
		);
	}
}

export function spawnDefaultMatch(config: GameConfig) {
	return spawnMatch(getWorld(), config);
}
