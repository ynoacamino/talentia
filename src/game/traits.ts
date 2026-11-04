import { trait } from "koota";

// Transform plano para billboards. Sistemas escriben aquí, la vista sincroniza meshes.
export const Transform = trait({ x: 0, y: 0, z: 0 });

// Jugador del party. tileIndex = posición lógica en el BoardGraph.
export const Player = trait({
	index: 0,
	tileIndex: 0,
	coins: 0,
	stars: 0,
	laps: 0,
});

// Color/nombre no cambian en runtime, pero los guardamos para la vista.
// koota traits aceptan strings como primitivas.
export const PlayerMeta = trait({ name: "P", color: "#ffffff" });

export const IsActiveTurn = trait();
