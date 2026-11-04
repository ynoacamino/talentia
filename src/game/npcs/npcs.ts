import { trait } from "koota";
import type { NpcDef } from "@/game/npcs/types.ts";

export const Npc = trait({
	npcId: "npc",
	scriptId: "intro",
	behaviorId: "idle",
	speed: 1.5,
	spriteId: "orbe",
	tile: 0,
});
export const NpcMeta = trait({ name: "NPC", color: "#a78bfa" });

const npcs = new Map<string, NpcDef>();

export function registerNpc(def: NpcDef): void {
	npcs.set(def.npcId, def);
}

export function getNpc(npcId: string): NpcDef | undefined {
	return npcs.get(npcId);
}

export function listNpcs(): NpcDef[] {
	return [...npcs.values()];
}

export function clearNpcs(): void {
	npcs.clear();
}
