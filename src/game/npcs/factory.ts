import { getSprite } from "@/core/sprites.ts";
import { getDialogue } from "@/game/dialogue/registry.ts";
import { registerNpc } from "@/game/npcs/npcs.ts";
import type { NpcDef } from "@/game/npcs/types.ts";

// Crea un NPC con defaults sensatos. Solo pide lo esencial.
export function defineNpc(def: Partial<NpcDef> & { npcId: string }): NpcDef {
	return {
		name: def.npcId,
		color: "#a78bfa",
		spriteId: "orbe",
		scriptId: "intro",
		behaviorId: "idle",
		speed: 1.5,
		tileIndex: 0,
		...def,
	};
}

// Falla rápido en bootstrap: si el diálogo o sprite no existe, avisa.
export function validateNpc(def: NpcDef): string[] {
	const errors: string[] = [];
	if (!getDialogue(def.scriptId)) {
		errors.push(`NPC ${def.npcId}: script "${def.scriptId}" no registrado`);
	}
	if (!getSprite(def.spriteId)) {
		errors.push(`NPC ${def.npcId}: sprite "${def.spriteId}" no registrado`);
	}
	return errors;
}

export function registerNpcValidated(def: NpcDef): void {
	const errors = validateNpc(def);
	if (errors.length > 0) throw new Error(errors.join("; "));
	registerNpc(def);
}

// Presets listos para poblar un tablero en 1 línea cada uno.
export const npcPresets = {
	guia: (tileIndex = 0): NpcDef =>
		defineNpc({
			npcId: "guia",
			name: "Guía",
			color: "#a78bfa",
			spriteId: "orbe-guia",
			scriptId: "intro",
			behaviorId: "patrol",
			speed: 1.2,
			tileIndex,
		}),
	mercader: (tileIndex = 6): NpcDef =>
		defineNpc({
			npcId: "mercader",
			name: "Mercader",
			color: "#eab308",
			spriteId: "orbe-mercader",
			scriptId: "tienda",
			behaviorId: "idle",
			tileIndex,
		}),
	bromista: (tileIndex = 12): NpcDef =>
		defineNpc({
			npcId: "bromista",
			name: "Bromista",
			color: "#f43f5e",
			spriteId: "orbe-bromista",
			scriptId: "broma",
			behaviorId: "follow",
			speed: 2,
			tileIndex,
		}),
};
