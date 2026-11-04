import { defineMinigame } from "@/game/minigames/types.ts";

// Plantilla para copiar y crear un minijuego nuevo en minutos:
// 1. Duplica este archivo, cambia id/nombre.
// 2. Implementa setup/update con queries koota.
// 3. Registra en builtin/index.ts + crea su vista en render/minigames/.
export const coinDashTemplate = defineMinigame({
	id: "coin-dash-template",
	name: "Coin Dash (plantilla)",
	description: "Plantilla intercambiable: recoge monedas con tu equipo.",
	instructions: "Mueve con click y recoge monedas.",
	minPlayers: 2,
	maxPlayers: 4,
	setup: () => {},
	update: (_ctx, _dt) => {},
});
