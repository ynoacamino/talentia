import { registerDialogue } from "@/game/dialogue/registry.ts";
import { coinDashTemplate } from "@/game/minigames/builtin/coinDash.ts";
import { targetDummy } from "@/game/minigames/builtin/targetDummy.ts";
import { registerMinigame } from "@/game/minigames/registry.ts";
import { npcPresets, registerNpcValidated } from "@/game/npcs/factory.ts";

let bootstrapped = false;

// Datos iniciales inyectables. Llama una vez desde App.
// Orden importa: diálogos y sprites primero (los NPCs los validan).
export function bootstrapContent(): void {
	if (bootstrapped) return;
	bootstrapped = true;

	registerDialogue({
		id: "intro",
		lines: [
			{
				id: "l1",
				speaker: "Guía",
				text: "¡Bienvenidos a Talentia Party! Lanza el dado para avanzar.",
				audio: "/audio/intro-l1.mp3",
			},
			{
				id: "l2",
				speaker: "Guía",
				text: "Toca a tus compañeros para sumar en el minijuego.",
				audio: "/audio/intro-l2.mp3",
			},
		],
	});

	registerDialogue({
		id: "tienda",
		lines: [
			{
				id: "l1",
				speaker: "Mercader",
				text: "Tengo dados cargados... por unas monedas.",
				audio: "/audio/tienda-l1.mp3",
			},
		],
	});

	registerDialogue({
		id: "broma",
		lines: [
			{
				id: "l1",
				speaker: "Bromista",
				text: "¿Me viste? ¡Te sigo a todas partes!",
				audio: "/audio/broma-l1.mp3",
			},
		],
	});

	registerNpcValidated(npcPresets.guia(0));
	registerNpcValidated(npcPresets.mercader(6));
	registerNpcValidated(npcPresets.bromista(12));

	registerMinigame(targetDummy);
	registerMinigame(coinDashTemplate);
}
