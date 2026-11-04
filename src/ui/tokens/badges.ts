/**
 * Badges Visual Tokens & Definitions (SPEC §11)
 * Estrictamente tokens visuales y metadata de insignias.
 * Lógica de dominio pura (cálculo de estrellas y priorización) vive en @/shared/scoring.ts.
 */
import type { BadgeId } from "@/shared/scoring.ts";

export interface GroupScores {
	turnTaking: number; // 0..2
	colaboracion: number; // 0..2
	negociacion: number; // 0..2
	estructurada: number; // 0..2
	organizacion: number; // 0..2
}

export interface GroupScoreQuotes {
	turnTaking: string;
	colaboracion: string;
	negociacion: string;
	estructurada: string;
	organizacion: string;
}

export interface BadgeDefinition {
	id: BadgeId;
	name: string;
	criterionKey: keyof GroupScores;
	priority: number; // 1 = máxima prioridad
	description: string;
	icon: string;
	defaultQuote: {
		ES: string;
		EN: string;
		QUZ: string;
	};
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
	{
		id: "paso_a_paso",
		name: "Paso a paso",
		criterionKey: "estructurada",
		priority: 1,
		description:
			"Planearon la secuencia chacra → taller → alcaldía paso a paso.",
		icon: "🪜",
		defaultQuote: {
			ES: "Primero fuimos a la chacra y luego al taller.",
			EN: "First we went to the farm, then to the workshop.",
			QUZ: "Ñawpaqta chakrapi rirqanchik, chaymantataq kanchapi.",
		},
	},
	{
		id: "cumplieron_su_promesa",
		name: "Cumplieron su promesa",
		criterionKey: "negociacion",
		priority: 2,
		description:
			"Ofrecieron ayuda mutua y recordaron los compromisos con Paco y Soto.",
		icon: "🤝",
		defaultQuote: {
			ES: "Le prometimos a Paco regar los surcos a cambio de los troncos.",
			EN: "We promised Paco to water the crops in exchange for timber.",
			QUZ: "Pacota rimaykurqanchik k'ullukunata chaskinapaq.",
		},
	},
	{
		id: "un_solo_equipo",
		name: "Un solo equipo",
		criterionKey: "colaboracion",
		priority: 3,
		description: "Construyeron sobre las ideas de los demás sin interrumpirse.",
		icon: "🛡️",
		defaultQuote: {
			ES: "Sumamos el plano de Mateo a la madera que trajimos.",
			EN: "We combined Mateo's blueprint with the wood we brought.",
			QUZ: "Mateoq siq'iyninta k'aspikunawan kuska churanchik.",
		},
	},
	{
		id: "se_turnaron",
		name: "Se turnaron",
		criterionKey: "turnTaking",
		priority: 4,
		description:
			"Cedieron la palabra con paciencia y respetaron los turnos de habla.",
		icon: "🔄",
		defaultQuote: {
			ES: "Habló Sofía primero y luego escuchamos a Leo.",
			EN: "Sofia spoke first, then we listened to Leo.",
			QUZ: "Ñawpaqta Sofia rimarqan, chaymanta Leota uyariq kasqaku.",
		},
	},
	{
		id: "se_organizaron",
		name: "Se organizaron",
		criterionKey: "organizacion",
		priority: 5,
		description: "Propusieron un orden claro de acción y distribuyeron tareas.",
		icon: "🧭",
		defaultQuote: {
			ES: "Alguien propuso votar antes de viajar hacia la alcaldía.",
			EN: "Someone proposed to vote before heading to town hall.",
			QUZ: "Pitaq rimarirqan manaraq alcaldiata rinkachkaspa.",
		},
	},
];
