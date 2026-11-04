import type { World } from "koota";
import type { BoardGraph } from "@/game/board/graph.ts";
import { getBehavior, getNpcRuntime } from "@/game/npcs/behaviors.ts";
import { Npc } from "@/game/npcs/npcs.ts";
import { Player, Transform } from "@/game/traits.ts";

export type NpcSystemOpts = {
	now?: number;
	greetRadius?: number;
	greetCooldownMs?: number;
	onSpeak?: (scriptId: string) => void;
};

// Da vida a los NPCs: ejecuta su behavior y saludan si un jugador se acerca.
export function updateNpcs(
	world: World,
	board: BoardGraph,
	dt: number,
	opts: NpcSystemOpts = {},
): void {
	const now = opts.now ?? Date.now();
	const radius = opts.greetRadius ?? 1.5;
	const cooldown = opts.greetCooldownMs ?? 20000;

	for (const entity of world.query(Npc, Transform)) {
		const npc = entity.get(Npc);
		if (!npc) continue;

		const behavior = getBehavior(npc.behaviorId);
		behavior?.update({
			world,
			entity,
			board,
			dt,
			state: getNpcRuntime(npc.npcId, npc.tile),
		});

		if (!opts.onSpeak) continue;
		const self = entity.get(Transform);
		if (!self || now < getNpcRuntime(npc.npcId, npc.tile).cooldownUntil) {
			continue;
		}
		let nearPlayer = false;
		for (const p of world.query(Player, Transform)) {
			const t = p.get(Transform);
			if (!t) continue;
			if (Math.hypot(t.x - self.x, t.z - self.z) < radius) {
				nearPlayer = true;
				break;
			}
		}
		if (nearPlayer) {
			getNpcRuntime(npc.npcId, npc.tile).cooldownUntil = now + cooldown;
			opts.onSpeak(npc.scriptId);
		}
	}
}
