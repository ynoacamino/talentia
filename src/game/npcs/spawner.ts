import type { World } from "koota";
import { tileToWorld } from "@/core/math.ts";
import { validateNpc } from "@/game/npcs/factory.ts";
import { Npc, NpcMeta } from "@/game/npcs/npcs.ts";
import type { NpcDef } from "@/game/npcs/types.ts";
import { Transform } from "@/game/traits.ts";

// Falla rápido si un NPC apunta a diálogo/sprite inexistente.
export function spawnNpcs(world: World, defs: NpcDef[], cols = 6): void {
	for (const def of defs) {
		const errors = validateNpc(def);
		if (errors.length > 0) throw new Error(errors.join("; "));
		const pos = tileToWorld(def.tileIndex, cols);
		world.spawn(
			Npc({
				npcId: def.npcId,
				scriptId: def.scriptId,
				behaviorId: def.behaviorId,
				speed: def.speed,
				spriteId: def.spriteId,
				tile: def.tileIndex,
			}),
			NpcMeta({ name: def.name, color: def.color }),
			Transform({ x: pos.x, y: 0, z: pos.z }),
		);
	}
}
