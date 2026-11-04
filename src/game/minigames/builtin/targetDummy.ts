import { defineMinigame } from "@/game/minigames/types.ts";

// Minijuego ejemplo: vista superior, apunta a tus compañeros.
// La vista R3F detecta clicks y llama a useMinigameStore scores.
export const targetDummy = defineMinigame({
	id: "target-dummy",
	name: "Toca a tu equipo",
	description: "Vista superior: apunta y clickea a tus compañeros.",
	instructions: "Click en los billboards para sumar puntos.",
	minPlayers: 2,
	maxPlayers: 4,
	setup: () => {},
});
