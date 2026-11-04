import type { Entity, World } from "koota";
import { tileToWorld } from "@/core/math.ts";
import type { BoardGraph } from "@/game/board/graph.ts";
import { Npc } from "@/game/npcs/npcs.ts";
import type { NpcBehaviorId } from "@/game/npcs/types.ts";
import { Player, Transform } from "@/game/traits.ts";

export type BehaviorState = {
	targetTile: number;
	cooldownUntil: number;
};

export type BehaviorCtx = {
	world: World;
	entity: Entity;
	board: BoardGraph;
	dt: number;
	state: BehaviorState;
};

export type BehaviorDef = {
	id: NpcBehaviorId;
	update: (ctx: BehaviorCtx) => void;
};

const behaviors = new Map<NpcBehaviorId, BehaviorDef>();

export function defineBehavior(def: BehaviorDef): void {
	behaviors.set(def.id, def);
}

export function getBehavior(id: string): BehaviorDef | undefined {
	return behaviors.get(id as NpcBehaviorId);
}

// Estado runtime por NPC (no va en traits porque son rutas/temporizadores).
const runtime = new Map<string, BehaviorState>();

export function getNpcRuntime(npcId: string, tile: number): BehaviorState {
	let s = runtime.get(npcId);
	if (!s) {
		s = { targetTile: tile, cooldownUntil: 0 };
		runtime.set(npcId, s);
	}
	return s;
}

export function clearNpcRuntime(): void {
	runtime.clear();
}

function moveTransformToward(
	entity: Entity,
	tx: number,
	tz: number,
	speed: number,
	dt: number,
): void {
	const pos = entity.get(Transform);
	if (!pos) return;
	const dx = tx - pos.x;
	const dz = tz - pos.z;
	const dist = Math.hypot(dx, dz);
	if (dist < 0.05) return;
	const step = Math.min(dist, speed * dt);
	entity.set(Transform, {
		x: pos.x + (dx / dist) * step,
		y: 0,
		z: pos.z + (dz / dist) * step,
	});
}

defineBehavior({
	id: "idle",
	update: () => {},
});

defineBehavior({
	id: "patrol",
	update: ({ entity, board, dt, state }) => {
		const npc = entity.get(Npc);
		if (!npc) return;
		const target = tileToWorld(state.targetTile, 6);
		moveTransformToward(entity, target.x, target.z, npc.speed, dt);
		const pos = entity.get(Transform);
		if (!pos) return;
		if (Math.hypot(target.x - pos.x, target.z - pos.z) < 0.1) {
			const next = board.advance(state.targetTile, 1).tile;
			state.targetTile = next;
			entity.set(Npc, { tile: next });
		}
	},
});

defineBehavior({
	id: "follow",
	update: ({ world, entity, dt }) => {
		const npc = entity.get(Npc);
		const self = entity.get(Transform);
		if (!npc || !self) return;
		let best: { x: number; z: number; d: number } | null = null;
		for (const p of world.query(Player, Transform)) {
			const t = p.get(Transform);
			if (!t) continue;
			const d = Math.hypot(t.x - self.x, t.z - self.z);
			if (!best || d < best.d) best = { x: t.x, z: t.z, d };
		}
		if (!best || best.d < 1.5) return;
		moveTransformToward(entity, best.x, best.z, npc.speed, dt);
	},
});
