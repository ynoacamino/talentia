/**
 * TALENTIA / SocraticGuild — Seed Sessions for Demo & Inspection
 * Conforme a SPEC §2, §11, §13, §17 y PLAN.md F3 (§5.3).
 * Provee 3 sesiones iniciales completas para el historial docente:
 * - K7B9: Finalizada, 3★, ES, 3 jugadores, con transcripciones, dibujo (thumb + visionRead) y notas.
 * - M2P4: Finalizada, 2★, EN, 4 jugadores.
 * - T8X2: En curso, QUZ, 4 jugadores (guion de resultado retenido).
 */

import type { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import type {
	DrawSubmission,
	PlayerCard,
	SessionConfig,
	TranscriptTurn,
} from "@/shared/documents.ts";

export async function seedDemoSessions(
	repo: InMemorySessionRepository,
): Promise<void> {
	// 1. SESIÓN K7B9 (Finalizada, 3 estrellas, ES)
	const now = Date.now();
	const configK7B9: SessionConfig = {
		language: "ES",
		expectedPlayers: 3,
		durationMinutes: 5,
		durationGameMs: 300000,
		createdAtWallMs: now - 3600000, // Hace 1 hora
		locked: true,
	};

	const s1 = await repo.create(configK7B9, "K7B9");

	const playersK7B9: PlayerCard[] = [
		{
			slotIndex: 0,
			playerId: "p-mateo",
			avatar: "Zorro",
			name: "Mateo",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 3400000,
			turnCount: 8,
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
			lastActiveWallMs: now - 3400000,
			turnCount: 7,
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
			lastActiveWallMs: now - 3400000,
			turnCount: 4,
			drawCount: 2,
		},
	];
	for (const p of playersK7B9) {
		await repo.addPlayer("K7B9", p);
	}

	const t1: TranscriptTurn = {
		id: "tx-1",
		turnIndex: 0,
		holderPlayerId: "Mateo (Zorro)",
		audioDurationMs: 2200,
		sendReason: "release",
		rawText: "Paco necesitamos madera para reparar el puente roto",
		paraphraseEs: "Paco necesitamos madera para reparar el puente roto",
		suspectedOverlap: false,
		gameTsMs: 45000,
		wallTsMs: now - 3555000,
	};
	const t2: TranscriptTurn = {
		id: "tx-2",
		turnIndex: 1,
		holderPlayerId: "Lucas (Rana)",
		audioDurationMs: 3100,
		sendReason: "silence",
		rawText: "Nosotros ayudamos a regar los surcos con baldes",
		paraphraseEs: "Nosotros ayudamos a regar los surcos con baldes",
		suspectedOverlap: true,
		gameTsMs: 70000,
		wallTsMs: now - 3530000,
	};
	await repo.addTranscript("K7B9", t1);
	await repo.addTranscript("K7B9", t2);

	const drawing: DrawSubmission = {
		id: "draw-1",
		stationId: "taller",
		playerId: "Lucas (Rana)",
		strokes: [
			{
				color: "azul",
				brushSize: 4,
				points: [
					{ x: 10, y: 10, timeOffsetMs: 0 },
					{ x: 50, y: 50, timeOffsetMs: 100 },
				],
			},
		],
		imageJpegBase64:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><path d='M10,75 Q50,25 90,75' stroke='%2338bdf8' stroke-width='6' fill='none'/><rect x='45' y='50' width='10' height='25' fill='%23f59e0b'/></svg>",
		thumbBase64:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231e293b'/><path d='M10,75 Q50,25 90,75' stroke='%2338bdf8' stroke-width='6' fill='none'/><rect x='45' y='50' width='10' height='25' fill='%23f59e0b'/></svg>",
		gameTsMs: 95000,
		wallTsMs: now - 3505000,
		visionRead: {
			objects: ["puente", "vigas_de_madera", "andamios"],
			actions: ["ensamblar", "sostener"],
			measures: ["3_metros", "doble_ancho"],
			routes: ["cruce_central"],
			labelsOrMarks: ["A", "B"],
			confidence: { bridge: 0.96, wood: 0.91 },
			rawResponse: '{"objects":["puente","vigas_de_madera"]}',
		},
	};
	await repo.addDrawing("K7B9", drawing);

	await repo.saveScores("K7B9", {
		id: "scores-k7b9",
		sessionId: s1.id,
		sumPoints: 9,
		stars: 3,
		isFinished: true,
		earnedBadges: [
			{
				id: "paso_a_paso",
				name: "Paso a paso",
				quoteInRunLanguage: "Construyeron en orden",
			},
			{
				id: "se_turnaron",
				name: "Se turnaron",
				quoteInRunLanguage: "Respetaron los turnos de habla",
			},
		],
		groupCriteria: {
			turnTaking: {
				score: 2,
				evidenceQuote: "Esperaron cada uno su turno pacientemente",
			},
			colaboracion: {
				score: 2,
				evidenceQuote: "Sofía complementó el plano propuesto por Mateo",
			},
			negociacion: {
				score: 2,
				evidenceQuote: "Acordaron regar los surcos a cambio de los leños",
			},
			resolucionEstructurada: {
				score: 1,
				evidenceQuote: "Avanzaron ordenadamente tras recibir la pista L1",
			},
			organizacionLiderazgo: {
				score: 2,
				evidenceQuote: "Mateo coordinó la votación para marchar al taller",
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
				anecdote: "Lideró la iniciativa de dibujo y consultó al equipo",
				turnCount: 8,
				drawCount: 1,
			},
			{
				playerId: "p-sofia",
				avatar: "Búho",
				name: "Sofía",
				participacion: 2,
				propuesta: 2,
				organizacion: 1,
				anecdote: "Negoció con el agricultor Paco recordando el trato",
				turnCount: 7,
				drawCount: 0,
			},
			{
				playerId: "p-lucas",
				avatar: "Rana",
				name: "Lucas",
				participacion: 1,
				propuesta: 2,
				organizacion: 1,
				anecdote: "Demostró claridad espacial trazando los tablones",
				turnCount: 4,
				drawCount: 2,
			},
		],
		conApoyoDocente: true,
		evaluatedAtWallMs: now - 3300000,
	});

	await repo.updateStatus("K7B9", "finished");

	await repo.addComment(
		"K7B9",
		"Coordinación sobresaliente durante el cruce del río.",
	);

	// 2. SESIÓN M2P4 (Finalizada, 2 estrellas, EN)
	const configM2P4: SessionConfig = {
		language: "EN",
		expectedPlayers: 4,
		durationMinutes: 10,
		durationGameMs: 600000,
		createdAtWallMs: now - 7200000, // Hace 2 horas
		locked: true,
	};
	const s2 = await repo.create(configM2P4, "M2P4");
	const playersM2P4: PlayerCard[] = [
		{
			slotIndex: 0,
			playerId: "p-gato",
			avatar: "Gato",
			name: "Emma",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 7000000,
			turnCount: 6,
			drawCount: 1,
		},
		{
			slotIndex: 1,
			playerId: "p-llama",
			avatar: "Llama",
			name: "Noah",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 7000000,
			turnCount: 5,
			drawCount: 1,
		},
		{
			slotIndex: 2,
			playerId: "p-tucan",
			avatar: "Tucán",
			name: "Mia",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 7000000,
			turnCount: 4,
			drawCount: 0,
		},
		{
			slotIndex: 3,
			playerId: "p-raton",
			avatar: "Ratón",
			name: "Liam",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 7000000,
			turnCount: 5,
			drawCount: 1,
		},
	];
	for (const p of playersM2P4) {
		await repo.addPlayer("M2P4", p);
	}

	await repo.saveScores("M2P4", {
		id: "scores-m2p4",
		sessionId: s2.id,
		sumPoints: 6,
		stars: 2,
		isFinished: true,
		earnedBadges: [
			{
				id: "un_solo_equipo",
				name: "Un solo equipo",
				quoteInRunLanguage: "Everyone contributed to the task",
			},
		],
		groupCriteria: {
			turnTaking: {
				score: 1,
				evidenceQuote: "Hubo dos interrupciones leves en la estación 2",
			},
			colaboracion: {
				score: 2,
				evidenceQuote: "Compartieron los tablones sin discutir",
			},
			negociacion: {
				score: 1,
				evidenceQuote: "Aceptaron la segunda oferta tras debate",
			},
			resolucionEstructurada: {
				score: 1,
				evidenceQuote: "Completaron la receta siguiendo las instrucciones",
			},
			organizacionLiderazgo: {
				score: 1,
				evidenceQuote: "Emma tomó la palabra y asignó roles",
			},
		},
		students: [
			{
				playerId: "p-gato",
				avatar: "Gato",
				name: "Emma",
				participacion: 2,
				propuesta: 2,
				organizacion: 2,
				anecdote: "Organizó el flujo de trabajo en la cocina",
				turnCount: 6,
				drawCount: 1,
			},
			{
				playerId: "p-llama",
				avatar: "Llama",
				name: "Noah",
				participacion: 1,
				propuesta: 1,
				organizacion: 1,
				anecdote: "Dibujó el mapa del sendero",
				turnCount: 5,
				drawCount: 1,
			},
		],
		conApoyoDocente: false,
		evaluatedAtWallMs: now - 6800000,
	});

	await repo.updateStatus("M2P4", "finished");

	// 3. SESIÓN T8X2 (En curso, QUZ, sin estrellas / guion)
	const configT8X2: SessionConfig = {
		language: "QUZ",
		expectedPlayers: 4,
		durationMinutes: 15,
		durationGameMs: 900000,
		createdAtWallMs: now - 1800000, // Hace 30 min
		locked: true,
	};
	await repo.create(configT8X2, "T8X2");
	const playersT8X2: PlayerCard[] = [
		{
			slotIndex: 0,
			playerId: "p-tortuga",
			avatar: "Tortuga",
			name: "Inti",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 1700000,
			turnCount: 2,
			drawCount: 0,
		},
		{
			slotIndex: 1,
			playerId: "p-zorro",
			avatar: "Zorro",
			name: "Killa",
			confirmed: true,
			retired: false,
			retiredGameTsMs: null,
			lastActiveWallMs: now - 1700000,
			turnCount: 3,
			drawCount: 0,
		},
	];
	for (const p of playersT8X2) {
		await repo.addPlayer("T8X2", p);
	}
	await repo.updateStatus("T8X2", "playing");
}
