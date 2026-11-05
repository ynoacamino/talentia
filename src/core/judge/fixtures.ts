/**
 * Fixtures Representativos del Juez Pedagógico (Superficie D4, SPEC §11)
 * Exportados para pruebas unitarias/integración, demos del pitch e inicialización.
 */

import type {
	JudgeEvaluationContext,
	JudgeScores,
	PlayerCard,
	SessionConfig,
} from "@/shared/documents.ts";

const BASE_CONFIG_ES: SessionConfig = {
	language: "ES",
	expectedPlayers: 3,
	durationMinutes: 5,
	durationGameMs: 300000,
	createdAtWallMs: 1730728800000,
	locked: true,
};

const BASE_CONFIG_EN: SessionConfig = {
	language: "EN",
	expectedPlayers: 3,
	durationMinutes: 5,
	durationGameMs: 300000,
	createdAtWallMs: 1730728800000,
	locked: true,
};

const BASE_CONFIG_QUZ: SessionConfig = {
	language: "QUZ",
	expectedPlayers: 3,
	durationMinutes: 5,
	durationGameMs: 300000,
	createdAtWallMs: 1730728800000,
	locked: true,
};

const BASE_PLAYERS: PlayerCard[] = [
	{
		slotIndex: 0,
		playerId: "p-mateo",
		avatar: "Zorro",
		name: "Mateo",
		confirmed: true,
		retired: false,
		retiredGameTsMs: null,
		lastActiveWallMs: 1730728850000,
		turnCount: 5,
		drawCount: 1,
	},
	{
		slotIndex: 1,
		playerId: "p-sofia",
		avatar: "Búho",
		name: "Sofía",
		confirmed: true,
		retired: false,
		retiredGameTsMs: null,
		lastActiveWallMs: 1730728850000,
		turnCount: 4,
		drawCount: 0,
	},
	{
		slotIndex: 2,
		playerId: "p-lucas",
		avatar: "Rana",
		name: "Lucas",
		confirmed: true,
		retired: false,
		retiredGameTsMs: null,
		lastActiveWallMs: 1730728850000,
		turnCount: 3,
		drawCount: 2,
	},
];

// ----------------------------------------------------------------------------
// 1. FIXTURE SUMA = 9 -> 3★ Y TOP 3 BADGES (Priority tie-break)
// ----------------------------------------------------------------------------
// Criterios:
// - turnTaking: 2 -> Badge 'se_turnaron' (Priority 4)
// - colaboracion: 2 -> Badge 'un_solo_equipo' (Priority 3)
// - negociacion: 2 -> Badge 'cumplieron_su_promesa' (Priority 2)
// - resolucionEstructurada: 1
// - organizacionLiderazgo: 2 -> Badge 'se_organizaron' (Priority 5)
//
// 4 insignias candidatas:
// 1. cumplieron_su_promesa (Priority 2)
// 2. un_solo_equipo (Priority 3)
// 3. se_turnaron (Priority 4)
// [DESCARTADA: se_organizaron (Priority 5) porque el límite estricto es 3]
// Suma = 2 + 2 + 2 + 1 + 2 = 9 puntos -> 3★ (SPEC §11: 8-10 = 3★)

export const FIXTURE_CONTEXT_SUM_9: JudgeEvaluationContext = {
	sessionId: "SESS-SUM9",
	config: BASE_CONFIG_ES,
	players: BASE_PLAYERS,
	transcripts: [
		{
			id: "tx-1",
			turnIndex: 0,
			holderPlayerId: "Mateo",
			audioDurationMs: 2500,
			sendReason: "release",
			rawText: "Vamos a la chacra primero a pedirle leños a Paco.",
			paraphraseEs: "Vamos a la chacra primero a pedirle leños a Paco.",
			suspectedOverlap: false,
			gameTsMs: 30000,
			wallTsMs: 1730728830000,
		},
		{
			id: "tx-2",
			turnIndex: 1,
			holderPlayerId: "Sofía",
			audioDurationMs: 3000,
			sendReason: "silence",
			rawText: "Sí, yo propongo votar antes de viajar hacia el taller.",
			paraphraseEs: "Sí, yo propongo votar antes de viajar hacia el taller.",
			suspectedOverlap: false,
			gameTsMs: 65000,
			wallTsMs: 1730728865000,
		},
		{
			id: "tx-3",
			turnIndex: 2,
			holderPlayerId: "Lucas",
			audioDurationMs: 2800,
			sendReason: "release",
			rawText: "Le prometimos a Paco regar los surcos a cambio de los troncos.",
			paraphraseEs:
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
			suspectedOverlap: false,
			gameTsMs: 110000,
			wallTsMs: 1730728910000,
		},
	],
	drawings: [
		{
			id: "dr-1",
			stationId: "taller",
			playerId: "Lucas",
			strokes: [],
			imageJpegBase64: "data:image/jpeg;base64,sample1",
			visionRead: null,
			thumbBase64: "data:image/jpeg;base64,sample1",
			gameTsMs: 140000,
			wallTsMs: 1730728940000,
		},
	],
	events: [
		{
			id: "ev-1",
			sessionId: "SESS-SUM9",
			type: "move_propose",
			game_ts_ms: 25000,
			wall_ts_ms: 1730728825000,
			actorId: "p-mateo",
			payload: {
				fromStation: "campamento",
				toStation: "chacra",
				proposerPlayerId: "p-mateo",
				proposalMethod: "voice",
			},
		},
		{
			id: "ev-2",
			sessionId: "SESS-SUM9",
			type: "grant_step",
			game_ts_ms: 90000,
			wall_ts_ms: 1730728890000,
			actorId: "npc-paco",
			payload: {
				stepId: "conseguir_madera",
				grantedItem: "madera",
				forced: false,
			},
		},
		{
			id: "ev-3",
			sessionId: "SESS-SUM9",
			type: "grant_step",
			game_ts_ms: 150000,
			wall_ts_ms: 1730728950000,
			actorId: "npc-luz",
			payload: {
				stepId: "aprobar_diseno",
				grantedItem: "plano",
				forced: false,
			},
		},
		{
			id: "ev-4",
			sessionId: "SESS-SUM9",
			type: "grant_step",
			game_ts_ms: 200000,
			wall_ts_ms: 1730729000000,
			actorId: "npc-soto",
			payload: {
				stepId: "permiso_alcaldia",
				grantedItem: "sello",
				forced: false,
			},
		},
		{
			id: "ev-5",
			sessionId: "SESS-SUM9",
			type: "move_execute",
			game_ts_ms: 230000,
			wall_ts_ms: 1730729030000,
			actorId: "party",
			payload: {
				destinationStation: "puente",
				walkDurationMs: 8000,
			},
		},
	],
	hasTeacherSupport: false,
	isFinished: true,
	rawScores: {
		turnTaking: {
			score: 2,
			evidenceQuote:
				"Esperaron cada uno su turno pacientemente sin interrumpir.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote:
				"Sofía sumó el plano de Lucas a la madera que consiguieron.",
		},
		negociacion: {
			score: 2,
			evidenceQuote:
				"Le prometieron a Paco regar los surcos a cambio de los leños.",
		},
		resolucionEstructurada: {
			score: 1,
			evidenceQuote:
				"Avanzaron ordenadamente tras recibir una orientación en el taller.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote:
				"Mateo y Sofía coordinaron las votaciones antes de cada viaje.",
		},
	},
};

export const FIXTURE_JUDGE_SUM_9: JudgeScores = {
	id: "scores-sum9",
	sessionId: "SESS-SUM9",
	sumPoints: 9,
	stars: 3,
	isFinished: true,
	earnedBadges: [
		{
			id: "cumplieron_su_promesa",
			name: "Cumplieron su promesa",
			quoteInRunLanguage:
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
		},
		{
			id: "un_solo_equipo",
			name: "Un solo equipo",
			quoteInRunLanguage: "Sumamos el plano de Mateo a la madera que trajimos.",
		},
		{
			id: "se_turnaron",
			name: "Se turnaron",
			quoteInRunLanguage: "Habló Sofía primero y luego escuchamos a Leo.",
		},
	],
	groupCriteria: {
		turnTaking: {
			score: 2,
			evidenceQuote:
				"Esperaron cada uno su turno pacientemente sin interrumpir.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote:
				"Sofía sumó el plano de Lucas a la madera que consiguieron.",
		},
		negociacion: {
			score: 2,
			evidenceQuote:
				"Le prometieron a Paco regar los surcos a cambio de los leños.",
		},
		resolucionEstructurada: {
			score: 1,
			evidenceQuote:
				"Avanzaron ordenadamente tras recibir una orientación en el taller.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote:
				"Mateo y Sofía coordinaron las votaciones antes de cada viaje.",
		},
	},
	students: [
		{
			playerId: "p-mateo",
			avatar: "Zorro",
			name: "Mateo",
			participacion: 2,
			propuesta: 2,
			organizacion: 2,
			anecdote: "Propuso la ruta inicial y esperó a que todos votaran.",
			turnCount: 5,
			drawCount: 1,
		},
		{
			playerId: "p-sofia",
			avatar: "Búho",
			name: "Sofía",
			participacion: 2,
			propuesta: 2,
			organizacion: 2,
			anecdote: "Coordinó los tiempos de viaje y cedió el turno a Lucas.",
			turnCount: 4,
			drawCount: 0,
		},
		{
			playerId: "p-lucas",
			avatar: "Rana",
			name: "Lucas",
			participacion: 2,
			propuesta: 2,
			organizacion: 1,
			anecdote: "Dibujó el plano del puente con los dos apoyos en las orillas.",
			turnCount: 3,
			drawCount: 2,
		},
	],
	conApoyoDocente: false,
	evaluatedAtWallMs: 1730729050000,
};

// ----------------------------------------------------------------------------
// 2. FIXTURE ASISTENCIA DOCENTE (hasTeacherSupport: true)
// ----------------------------------------------------------------------------
// Reglas SPEC §11:
// - resolucionEstructurada capada a 1 (incluso si rawScores marcaba 2).
// - Insignia 'Paso a paso' NO se otorga.
// - conApoyoDocente: true.

export const FIXTURE_CONTEXT_TEACHER_ASSISTED: JudgeEvaluationContext = {
	sessionId: "SESS-ASSISTED",
	config: BASE_CONFIG_ES,
	players: BASE_PLAYERS,
	transcripts: [],
	drawings: [],
	events: [
		{
			id: "ev-forced",
			sessionId: "SESS-ASSISTED",
			type: "grant_step",
			game_ts_ms: 120000,
			wall_ts_ms: 1730728920000,
			actorId: "teacher",
			payload: {
				stepId: "aprobar_diseno",
				grantedItem: "plano",
				forced: true,
			},
		},
		{
			id: "ev-grant-mayor",
			sessionId: "SESS-ASSISTED",
			type: "grant_step",
			game_ts_ms: 180000,
			wall_ts_ms: 1730728980000,
			actorId: "npc-soto",
			payload: {
				stepId: "permiso_alcaldia",
				grantedItem: "sello",
				forced: false,
			},
		},
		{
			id: "ev-cross",
			sessionId: "SESS-ASSISTED",
			type: "move_execute",
			game_ts_ms: 220000,
			wall_ts_ms: 1730729020000,
			actorId: "party",
			payload: {
				destinationStation: "puente",
				walkDurationMs: 8000,
			},
		},
	],
	hasTeacherSupport: true,
	isFinished: true,
	rawScores: {
		turnTaking: {
			score: 2,
			evidenceQuote: "Respetaron los turnos adecuadamente.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote: "Trabajaron juntos en el campamento.",
		},
		negociacion: {
			score: 1,
			evidenceQuote: "Tuvieron dudas sobre la oferta a Paco.",
		},
		resolucionEstructurada: {
			score: 2, // Intentó scoring 2, pero será capado a 1
			evidenceQuote: "Planeaban la secuencia completa.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote: "Se organizaron para viajar.",
		},
	},
};

export const FIXTURE_JUDGE_TEACHER_ASSISTED: JudgeScores = {
	id: "scores-assisted",
	sessionId: "SESS-ASSISTED",
	sumPoints: 8, // 2 + 2 + 1 + 1 (capado) + 2 = 8
	stars: 3,
	isFinished: true,
	earnedBadges: [
		{
			id: "un_solo_equipo",
			name: "Un solo equipo",
			quoteInRunLanguage: "Sumamos el plano de Mateo a la madera que trajimos.",
		},
		{
			id: "se_turnaron",
			name: "Se turnaron",
			quoteInRunLanguage: "Habló Sofía primero y luego escuchamos a Leo.",
		},
		{
			id: "se_organizaron",
			name: "Se organizaron",
			quoteInRunLanguage:
				"Alguien propuso votar antes de viajar hacia la alcaldía.",
		},
		// 'paso_a_paso' EXCLUIDA rigurosamente por apoyo docente
	],
	groupCriteria: {
		turnTaking: {
			score: 2,
			evidenceQuote: "Respetaron los turnos adecuadamente.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote: "Trabajaron juntos en el campamento.",
		},
		negociacion: {
			score: 1,
			evidenceQuote: "Tuvieron dudas sobre la oferta a Paco.",
		},
		resolucionEstructurada: {
			score: 1, // Capado a 1
			evidenceQuote:
				"Siguieron la secuencia de estaciones con orientación y asistencia docente.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote: "Se organizaron para viajar.",
		},
	},
	students: [
		{
			playerId: "p-mateo",
			avatar: "Zorro",
			name: "Mateo",
			participacion: 2,
			propuesta: 2,
			organizacion: 1,
			anecdote: "Participó activamente en la coordinación del equipo.",
			turnCount: 5,
			drawCount: 1,
		},
		{
			playerId: "p-sofia",
			avatar: "Búho",
			name: "Sofía",
			participacion: 2,
			propuesta: 1,
			organizacion: 2,
			anecdote: "Pidió asistencia docente al atascarse en el taller.",
			turnCount: 4,
			drawCount: 0,
		},
	],
	conApoyoDocente: true,
	evaluatedAtWallMs: 1730729050000,
};

// ----------------------------------------------------------------------------
// 3. FIXTURE MULTILINGÜE EN (Partida en inglés, reporte Docente en español)
// ----------------------------------------------------------------------------
// SPEC §11, §14:
// - Citas de evidencia en DocenteView SIEMPRE EN ESPAÑOL.
// - Badges quoteInRunLanguage en INGLÉS.

export const FIXTURE_CONTEXT_MULTILINGUAL_EN: JudgeEvaluationContext = {
	sessionId: "SESS-LANG-EN",
	config: BASE_CONFIG_EN,
	players: BASE_PLAYERS,
	transcripts: [
		{
			id: "tx-en-1",
			turnIndex: 0,
			holderPlayerId: "Mateo",
			audioDurationMs: 2500,
			sendReason: "release",
			rawText: "We need timber from the farm to fix the broken bridge.",
			paraphraseEs:
				"Necesitamos madera de la chacra para reparar el puente roto.",
			suspectedOverlap: false,
			gameTsMs: 35000,
			wallTsMs: 1730728835000,
		},
		{
			id: "tx-en-2",
			turnIndex: 1,
			holderPlayerId: "Lucas",
			audioDurationMs: 2900,
			sendReason: "silence",
			rawText: "We promise to water the crops in exchange for the wood logs.",
			paraphraseEs:
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
			suspectedOverlap: false,
			gameTsMs: 75000,
			wallTsMs: 1730728875000,
		},
	],
	drawings: [],
	events: [
		{
			id: "ev-en-bridge",
			sessionId: "SESS-LANG-EN",
			type: "move_execute",
			game_ts_ms: 220000,
			wall_ts_ms: 1730729020000,
			actorId: "party",
			payload: {
				destinationStation: "puente",
				walkDurationMs: 8000,
			},
		},
		{
			id: "ev-en-mayor",
			sessionId: "SESS-LANG-EN",
			type: "grant_step",
			game_ts_ms: 190000,
			wall_ts_ms: 1730728990000,
			actorId: "npc-soto",
			payload: {
				stepId: "permiso_alcaldia",
				grantedItem: "sello",
				forced: false,
			},
		},
	],
	hasTeacherSupport: false,
	isFinished: true,
	rawScores: {
		turnTaking: {
			score: 2,
			evidenceQuote:
				"Cedieron la palabra con paciencia y respetaron los turnos de habla.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote:
				"Construyeron sobre las ideas de los demás sin interrumpirse.",
		},
		negociacion: {
			score: 2,
			evidenceQuote:
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
		},
		resolucionEstructurada: {
			score: 2,
			evidenceQuote:
				"Planearon la secuencia chacra → taller → alcaldía paso a paso.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote:
				"Propusieron un orden claro de acción y distribuyeron tareas.",
		},
	},
};

export const FIXTURE_JUDGE_MULTILINGUAL_EN: JudgeScores = {
	id: "scores-en",
	sessionId: "SESS-LANG-EN",
	sumPoints: 10,
	stars: 3,
	isFinished: true,
	earnedBadges: [
		{
			id: "paso_a_paso",
			name: "Paso a paso",
			quoteInRunLanguage: "First we went to the farm, then to the workshop.",
		},
		{
			id: "cumplieron_su_promesa",
			name: "Cumplieron su promesa",
			quoteInRunLanguage:
				"We promised Paco to water the crops in exchange for timber.",
		},
		{
			id: "un_solo_equipo",
			name: "Un solo equipo",
			quoteInRunLanguage:
				"We combined Mateo's blueprint with the wood we brought.",
		},
	],
	groupCriteria: {
		turnTaking: {
			score: 2,
			evidenceQuote:
				"Cedieron la palabra con paciencia y respetaron los turnos de habla.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote:
				"Construyeron sobre las ideas de los demás sin interrumpirse.",
		},
		negociacion: {
			score: 2,
			evidenceQuote:
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
		},
		resolucionEstructurada: {
			score: 2,
			evidenceQuote:
				"Planearon la secuencia chacra → taller → alcaldía paso a paso.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote:
				"Propusieron un orden claro de acción y distribuyeron tareas.",
		},
	},
	students: [
		{
			playerId: "p-mateo",
			avatar: "Zorro",
			name: "Mateo",
			participacion: 2,
			propuesta: 2,
			organizacion: 2,
			anecdote:
				"Expresó en inglés la necesidad de madera y coordinó el primer movimiento.",
			turnCount: 5,
			drawCount: 1,
		},
		{
			playerId: "p-lucas",
			avatar: "Rana",
			name: "Lucas",
			participacion: 2,
			propuesta: 2,
			organizacion: 1,
			anecdote:
				"Acordó el intercambio con el agricultor Paco hablando fluidamente.",
			turnCount: 3,
			drawCount: 2,
		},
	],
	conApoyoDocente: false,
	evaluatedAtWallMs: 1730729050000,
};

// ----------------------------------------------------------------------------
// 4. FIXTURE MULTILINGÜE QUZ (Partida en quechua, reporte Docente en español)
// ----------------------------------------------------------------------------

export const FIXTURE_CONTEXT_MULTILINGUAL_QUZ: JudgeEvaluationContext = {
	sessionId: "SESS-LANG-QUZ",
	config: BASE_CONFIG_QUZ,
	players: BASE_PLAYERS,
	transcripts: [
		{
			id: "tx-quz-1",
			turnIndex: 0,
			holderPlayerId: "Mateo",
			audioDurationMs: 3100,
			sendReason: "release",
			rawText: "Ñawpaqta chakrapi rirqanchik, chaymantataq kanchapi.",
			paraphraseEs: "Primero fuimos a la chacra y luego al taller.",
			suspectedOverlap: false,
			gameTsMs: 40000,
			wallTsMs: 1730728840000,
		},
	],
	drawings: [],
	events: [
		{
			id: "ev-quz-bridge",
			sessionId: "SESS-LANG-QUZ",
			type: "move_execute",
			game_ts_ms: 220000,
			wall_ts_ms: 1730729020000,
			actorId: "party",
			payload: {
				destinationStation: "puente",
				walkDurationMs: 8000,
			},
		},
		{
			id: "ev-quz-mayor",
			sessionId: "SESS-LANG-QUZ",
			type: "grant_step",
			game_ts_ms: 190000,
			wall_ts_ms: 1730728990000,
			actorId: "npc-soto",
			payload: {
				stepId: "permiso_alcaldia",
				grantedItem: "sello",
				forced: false,
			},
		},
	],
	hasTeacherSupport: false,
	isFinished: true,
	rawScores: {
		turnTaking: {
			score: 2,
			evidenceQuote: "Habló Sofía primero y luego escucharon a Lucas.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote: "Sumaron el plano de Mateo a la madera que trajeron.",
		},
		negociacion: {
			score: 2,
			evidenceQuote: "Pacota rimaykurqanchik k'ullukunata chaskinapaq.", // Se resolverá al español
		},
		resolucionEstructurada: {
			score: 2,
			evidenceQuote: "Primero fuimos a la chacra y luego al taller.",
		},
		organizacionLiderazgo: {
			score: 2,
			evidenceQuote: "Alguien propuso votar antes de viajar hacia la alcaldía.",
		},
	},
};

// ----------------------------------------------------------------------------
// 5. FIXTURE NO FINALIZADA / RETENIDA (isFinished: false)
// ----------------------------------------------------------------------------

export const FIXTURE_CONTEXT_UNFINISHED: JudgeEvaluationContext = {
	sessionId: "SESS-UNFINISHED",
	config: BASE_CONFIG_ES,
	players: BASE_PLAYERS,
	transcripts: [],
	drawings: [],
	events: [],
	hasTeacherSupport: false,
	isFinished: false,
	rawScores: {
		turnTaking: {
			score: 1,
			evidenceQuote: "Hubo algunas interrupciones al inicio.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote: "Aportaron ideas constructivas.",
		},
		negociacion: {
			score: 1,
			evidenceQuote: "Conversaron con Paco sin cerrar trato.",
		},
		resolucionEstructurada: {
			score: 1,
			evidenceQuote: "Intentaron ir directo a la alcaldía sin madera.",
		},
		organizacionLiderazgo: {
			score: 1,
			evidenceQuote: "No designaron roles claros.",
		},
	},
};

export const FIXTURE_JUDGE_UNFINISHED: JudgeScores = {
	id: "scores-unfinished",
	sessionId: "SESS-UNFINISHED",
	sumPoints: 6,
	stars: null, // Retenidas según SPEC §1, §11
	isFinished: false,
	earnedBadges: [
		{
			id: "un_solo_equipo",
			name: "Un solo equipo",
			quoteInRunLanguage: "Sumamos el plano de Mateo a la madera que trajimos.",
		},
	],
	groupCriteria: {
		turnTaking: {
			score: 1,
			evidenceQuote: "Hubo algunas interrupciones al inicio.",
		},
		colaboracion: {
			score: 2,
			evidenceQuote: "Aportaron ideas constructivas.",
		},
		negociacion: {
			score: 1,
			evidenceQuote: "Conversaron con Paco sin cerrar trato.",
		},
		resolucionEstructurada: {
			score: 1,
			evidenceQuote: "Intentaron ir directo a la alcaldía sin madera.",
		},
		organizacionLiderazgo: {
			score: 1,
			evidenceQuote: "No designaron roles claros.",
		},
	},
	students: [
		{
			playerId: "p-mateo",
			avatar: "Zorro",
			name: "Mateo",
			participacion: 1,
			propuesta: 1,
			organizacion: 1,
			anecdote: "Participó en el diálogo inicial con el equipo.",
			turnCount: 2,
			drawCount: 0,
		},
	],
	conApoyoDocente: false,
	evaluatedAtWallMs: 1730729050000,
};
