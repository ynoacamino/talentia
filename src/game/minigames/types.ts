import type { World } from "koota";
import type { GameConfig } from "@/shared/types.ts";

export type MinigamePhase = "idle" | "intro" | "playing" | "results";

export type MinigameApi = {
	finish: (scores: Record<string, number>) => void;
	speak: (scriptId: string) => void;
};

export type MinigameContext = {
	world: World;
	config: GameConfig;
	rng: () => number;
	api: MinigameApi;
};

// Interfaz que todo minijuego debe implementar.
// Lógica headless: no importa React ni R3F aquí.
export type MinigameDef = {
	id: string;
	name: string;
	description: string;
	instructions: string;
	minPlayers: number;
	maxPlayers: number;
	setup: (ctx: MinigameContext) => void | Promise<void>;
	update?: (ctx: MinigameContext, dt: number) => void;
	teardown?: (ctx: MinigameContext) => void;
};

// Helper para crear minijuegos rápido con tipado.
export function defineMinigame(def: MinigameDef): MinigameDef {
	return def;
}
