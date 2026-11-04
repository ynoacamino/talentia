import type { MinigameDef } from "@/game/minigames/types.ts";

// Factory / registro intercambiable. Los minijuegos se registran
// una vez y el resto del juego solo usa ids.
const registry = new Map<string, MinigameDef>();

export function registerMinigame(def: MinigameDef): void {
	registry.set(def.id, def);
}

export function getMinigame(id: string): MinigameDef | undefined {
	return registry.get(id);
}

export function listMinigames(): MinigameDef[] {
	return [...registry.values()];
}

export function clearMinigames(): void {
	registry.clear();
}
