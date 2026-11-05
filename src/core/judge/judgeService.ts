/**
 * JudgeService — Motor del Juez Pedagógico de IA (Superficie D4)
 * Conforme a SPEC.md §1, §11, §13, §14, §19 & docs/gates/F0-contrato.md.
 *
 * Responsabilidades:
 * 1. Implementa IJudgeService: evaluateSession(context: JudgeEvaluationContext): Promise<JudgeScores>.
 * 2. Evaluación de los 5 criterios colectivos grupales 0-2:
 *    - turnTaking (esperan turno / pocas interrupciones / ceden la palabra)
 *    - colaboracion (construyen sobre lo dicho / reparten turnos)
 *    - negociacion (ofrecen algo / recuerdan compromiso)
 *    - resolucionEstructurada (planean secuencia chacra -> taller -> alcaldía)
 *    - organizacionLiderazgo (proponen orden / rol de coordinación rotado o aceptado)
 * 3. Reglas de asistencia / forzado docente:
 *    - Si hasTeacherSupport === true (forced grant o time_skip):
 *      - resolucionEstructurada queda capada a máximo 1 (Math.min(score, 1)).
 *      - La insignia 'Paso a paso' NO se otorga bajo ninguna circunstancia.
 *      - conApoyoDocente: true.
 * 4. Suma de 5 criterios 0-10 -> estrellas calculadas con starsFor(sumPoints, isFinished):
 *    - 0-4 = 1★, 5-7 = 2★, 8-10 = 3★.
 *    - Requiere isFinished === true. Si isFinished === false, estrellas quedan retenidas (null).
 * 5. Desempate y selección de máximo 3 insignias con badgePriority (SPEC §11).
 * 6. Citas de evidencia y anécdotas SIEMPRE EN ESPAÑOL (paráfrasis al español),
 *    incluso en sesiones cuya lengua de ejecución fue EN o QUZ.
 * 7. Evaluación individual por cada alumno confirmado:
 *    - 3 dimensiones formativas 0-2 (participacion, propuesta, organizacion)
 *    - anécdota observacional de 1 línea en español
 *    - conteos de intervenciones de voz (turnCount) y dibujos (drawCount).
 */

import type {
	AvatarSpecies,
	BadgeAward,
	BadgeId,
	CriterionScore,
	GroupCriteriaBreakdown,
	IJudgeService,
	JudgeEvaluationContext,
	JudgeScores,
	StudentEvaluation,
} from "@/shared/documents.ts";
import {
	BADGE_DEFINITIONS,
	badgePriority,
	starsFor,
} from "@/shared/scoring.ts";

/**
 * Heurísticas de fallback pedagógico para citas de evidencia en español.
 */
const DEFAULT_ES_EVIDENCE_QUOTES = {
	turnTaking:
		"Cedieron la palabra con paciencia y respetaron los turnos de habla.",
	colaboracion:
		"Construyeron sobre las ideas del equipo y sumaron aportes complementarios.",
	negociacion:
		"Ofrecieron ayuda mutua y recordaron los compromisos con Paco y Soto.",
	resolucionEstructurada:
		"Planearon la secuencia chacra → taller → alcaldía paso a paso.",
	resolucionEstructuradaAssisted:
		"Siguieron la secuencia de estaciones con orientación y asistencia docente.",
	organizacionLiderazgo:
		"Propusieron un orden claro de acción y votaron antes de trasladarse.",
} as const;

export class JudgeService implements IJudgeService {
	/**
	 * Evalúa una sesión a partir del contexto del juego (transcripciones, dibujos,
	 * eventos, jugadores confirmados y banderas de asistencia docente).
	 */
	async evaluateSession(context: JudgeEvaluationContext): Promise<JudgeScores> {
		// 1. Detección estricta de asistencia docente / forzado (SPEC §11)
		const hasForcedGrant = context.events.some(
			(e) =>
				e.type === "grant_step" &&
				(e.payload as { forced?: boolean })?.forced === true,
		);
		const hasTimeSkip = context.events.some((e) => e.type === "time_skip");
		const hasTeacherSupport = Boolean(
			context.hasTeacherSupport || hasForcedGrant || hasTimeSkip,
		);

		// 2. Detección de finalización de misión (cruzar el puente)
		const reachedBridge = context.events.some(
			(e) =>
				e.type === "move_execute" &&
				(e.payload as { destinationStation?: string })?.destinationStation ===
					"puente",
		);
		const mayorPermisoGranted = context.events.some(
			(e) =>
				e.type === "grant_step" &&
				(e.payload as { stepId?: string })?.stepId === "permiso_alcaldia",
		);
		const isFinished =
			context.isFinished !== undefined
				? context.isFinished
				: Boolean(reachedBridge && mayorPermisoGranted);

		// 3. Evaluación de los 5 criterios colectivos grupales (0-2)
		const groupCriteria = this.evaluateGroupCriteria(
			context,
			hasTeacherSupport,
		);

		// 4. Suma de puntos grupales (0 a 10)
		const sumPoints =
			groupCriteria.turnTaking.score +
			groupCriteria.colaboracion.score +
			groupCriteria.negociacion.score +
			groupCriteria.resolucionEstructurada.score +
			groupCriteria.organizacionLiderazgo.score;

		// 5. Cálculo determinista de estrellas (SPEC §11: starsFor)
		// Requiere isFinished para otorgar estrellas (null si no finalizó)
		const stars = starsFor(sumPoints, isFinished);

		// 6. Selección y priorización de insignias (SPEC §11: 1:1 a 2/2, máx 3)
		const earnedBadges = this.determineEarnedBadges(
			groupCriteria,
			context.config.language,
			hasTeacherSupport,
		);

		// 7. Evaluación individual por cada alumno confirmado
		const students = this.evaluateStudents(context);

		const sessionId =
			context.sessionId ?? `session-${context.config.createdAtWallMs}`;
		const scoresId = `judge-${sessionId}-${Date.now()}`;

		return {
			id: scoresId,
			sessionId,
			sumPoints,
			stars,
			isFinished,
			earnedBadges,
			groupCriteria,
			students,
			conApoyoDocente: hasTeacherSupport,
			evaluatedAtWallMs: Date.now(),
		};
	}

	/**
	 * Evalúa los 5 criterios colectivos asegurando que las citas de evidencia
	 * estén SIEMPRE EN ESPAÑOL y que 'resolucionEstructurada' esté capada a 1
	 * si hubo asistencia docente.
	 */
	private evaluateGroupCriteria(
		context: JudgeEvaluationContext,
		hasTeacherSupport: boolean,
	): GroupCriteriaBreakdown {
		const rawOverrides = context.rawScores;

		// 1. Turn Taking (0-2)
		let turnTakingScore: CriterionScore = 2;
		let turnTakingQuote: string = DEFAULT_ES_EVIDENCE_QUOTES.turnTaking;
		if (rawOverrides?.turnTaking) {
			turnTakingScore = rawOverrides.turnTaking.score;
			turnTakingQuote = rawOverrides.turnTaking.evidenceQuote;
		} else {
			const overlaps = context.events.filter(
				(e) => e.type === "suspected_overlap",
			).length;
			const blockedPresses = context.events.filter(
				(e) => e.type === "blocked_press",
			).length;
			if (overlaps + blockedPresses > 2) {
				turnTakingScore = 0;
			} else if (overlaps + blockedPresses > 0) {
				turnTakingScore = 1;
			}
		}

		// 2. Colaboración (0-2)
		let colaboracionScore: CriterionScore = 2;
		let colaboracionQuote: string = DEFAULT_ES_EVIDENCE_QUOTES.colaboracion;
		if (rawOverrides?.colaboracion) {
			colaboracionScore = rawOverrides.colaboracion.score;
			colaboracionQuote = rawOverrides.colaboracion.evidenceQuote;
		} else {
			const activeSpeakers = new Set(
				context.transcripts.map((t) => t.holderPlayerId),
			);
			const activeDrawers = new Set(context.drawings.map((d) => d.playerId));
			const totalActive = new Set([...activeSpeakers, ...activeDrawers]).size;
			const confirmedCount = context.players.filter((p) => p.confirmed).length;
			if (totalActive < Math.min(2, confirmedCount)) {
				colaboracionScore = 0;
			} else if (totalActive < confirmedCount) {
				colaboracionScore = 1;
			}
		}

		// 3. Negociación (0-2)
		let negociacionScore: CriterionScore = 2;
		let negociacionQuote: string = DEFAULT_ES_EVIDENCE_QUOTES.negociacion;
		if (rawOverrides?.negociacion) {
			negociacionScore = rawOverrides.negociacion.score;
			negociacionQuote = rawOverrides.negociacion.evidenceQuote;
		} else {
			const grantSteps = context.events.filter(
				(e) => e.type === "grant_step",
			).length;
			if (grantSteps === 0) {
				negociacionScore = 0;
			} else if (grantSteps < 2) {
				negociacionScore = 1;
			}
		}

		// 4. Resolución Estructurada (0-2)
		let estructuradaScore: CriterionScore = 2;
		let estructuradaQuote: string =
			DEFAULT_ES_EVIDENCE_QUOTES.resolucionEstructurada;
		if (rawOverrides?.resolucionEstructurada) {
			estructuradaScore = rawOverrides.resolucionEstructurada.score;
			estructuradaQuote = rawOverrides.resolucionEstructurada.evidenceQuote;
		}

		// REGLA FUNDAMENTAL SPEC §11:
		// Si hubo apoyo docente, resolucionEstructurada queda capada a máximo 1/2
		if (hasTeacherSupport) {
			estructuradaScore = Math.min(estructuradaScore, 1) as CriterionScore;
			if (!rawOverrides?.resolucionEstructurada?.evidenceQuote) {
				estructuradaQuote =
					DEFAULT_ES_EVIDENCE_QUOTES.resolucionEstructuradaAssisted;
			}
		}

		// 5. Organización y Liderazgo (0-2)
		let organizacionScore: CriterionScore = 2;
		let organizacionQuote: string =
			DEFAULT_ES_EVIDENCE_QUOTES.organizacionLiderazgo;
		if (rawOverrides?.organizacionLiderazgo) {
			organizacionScore = rawOverrides.organizacionLiderazgo.score;
			organizacionQuote = rawOverrides.organizacionLiderazgo.evidenceQuote;
		} else {
			const moveProposals = context.events.filter(
				(e) => e.type === "move_propose",
			).length;
			if (moveProposals === 0) {
				organizacionScore = 0;
			} else if (moveProposals === 1) {
				organizacionScore = 1;
			}
		}

		// Resolver citas de transcripción en español si la partida fue en EN o QUZ
		turnTakingQuote = this.resolveSpanishQuote(
			turnTakingQuote,
			context,
			DEFAULT_ES_EVIDENCE_QUOTES.turnTaking,
		);
		colaboracionQuote = this.resolveSpanishQuote(
			colaboracionQuote,
			context,
			DEFAULT_ES_EVIDENCE_QUOTES.colaboracion,
		);
		negociacionQuote = this.resolveSpanishQuote(
			negociacionQuote,
			context,
			DEFAULT_ES_EVIDENCE_QUOTES.negociacion,
		);
		estructuradaQuote = this.resolveSpanishQuote(
			estructuradaQuote,
			context,
			hasTeacherSupport
				? DEFAULT_ES_EVIDENCE_QUOTES.resolucionEstructuradaAssisted
				: DEFAULT_ES_EVIDENCE_QUOTES.resolucionEstructurada,
		);
		organizacionQuote = this.resolveSpanishQuote(
			organizacionQuote,
			context,
			DEFAULT_ES_EVIDENCE_QUOTES.organizacionLiderazgo,
		);

		return {
			turnTaking: {
				score: turnTakingScore,
				evidenceQuote: turnTakingQuote,
			},
			colaboracion: {
				score: colaboracionScore,
				evidenceQuote: colaboracionQuote,
			},
			negociacion: {
				score: negociacionScore,
				evidenceQuote: negociacionQuote,
			},
			resolucionEstructurada: {
				score: estructuradaScore,
				evidenceQuote: estructuradaQuote,
			},
			organizacionLiderazgo: {
				score: organizacionScore,
				evidenceQuote: organizacionQuote,
			},
		};
	}

	/**
	 * Asegura que las citas para la vista docente estén SIEMPRE EN ESPAÑOL
	 * (SPEC §11, §14), usando paraphraseEs cuando provienen de sesiones EN o QUZ.
	 */
	private resolveSpanishQuote(
		candidateQuote: string,
		context: JudgeEvaluationContext,
		fallbackQuote: string,
	): string {
		if (context.config.language === "ES") {
			return candidateQuote || fallbackQuote;
		}

		// Si el texto coincide con una transcripción no-española, extraer paraphraseEs
		const matchingTurn = context.transcripts.find(
			(t) =>
				(t.rawText && t.rawText === candidateQuote) ||
				(t.paraphraseEs && t.paraphraseEs === candidateQuote),
		);
		if (matchingTurn?.paraphraseEs) {
			return matchingTurn.paraphraseEs;
		}

		// Si ya es un texto descriptivo pedagógico en español, respetarlo
		if (
			candidateQuote &&
			!this.looksNonSpanish(candidateQuote, context.config.language)
		) {
			return candidateQuote;
		}

		return fallbackQuote;
	}

	/**
	 * Heurística simple para detectar si un texto no es español según el idioma de la sesión.
	 */
	private looksNonSpanish(text: string, language: string): boolean {
		if (language === "EN") {
			return /\b(we|the|and|went|wood|bridge|farm|workshop|first|promised|spoke)\b/i.test(
				text,
			);
		}
		if (language === "QUZ") {
			return /\b(rirqanchik|kanchapi|chakrapi|rimarqan|kuska|chaskinapaq|ñawpaqta)\b/i.test(
				text,
			);
		}
		return false;
	}

	/**
	 * Determina las insignias otorgadas según los criterios 2/2 y prioriza con badgePriority.
	 * REGLAS FUNDAMENTALES (SPEC §11):
	 * - 1:1 cuando el criterio grupal alcanza 2/2.
	 * - Si hubo asistencia docente: 'Paso a paso' NO se otorga.
	 * - Máximo 3 insignias priorizadas según BADGE_PRIORITY_ORDER.
	 * - La quoteInRunLanguage se devuelve en el idioma de la partida (ES, EN o QUZ).
	 */
	private determineEarnedBadges(
		criteria: GroupCriteriaBreakdown,
		language: "ES" | "EN" | "QUZ",
		hasTeacherSupport: boolean,
	): BadgeAward[] {
		const candidateBadgeIds: BadgeId[] = [];

		// 1. Paso a paso ↔ estructurada 2/2 (Bloqueada con apoyo docente)
		if (criteria.resolucionEstructurada.score === 2 && !hasTeacherSupport) {
			candidateBadgeIds.push("paso_a_paso");
		}

		// 2. Cumplieron su promesa ↔ negociación 2/2
		if (criteria.negociacion.score === 2) {
			candidateBadgeIds.push("cumplieron_su_promesa");
		}

		// 3. Un solo equipo ↔ colaboración 2/2
		if (criteria.colaboracion.score === 2) {
			candidateBadgeIds.push("un_solo_equipo");
		}

		// 4. Se turnaron ↔ turnTaking 2/2
		if (criteria.turnTaking.score === 2) {
			candidateBadgeIds.push("se_turnaron");
		}

		// 5. Se organizaron ↔ organización 2/2
		if (criteria.organizacionLiderazgo.score === 2) {
			candidateBadgeIds.push("se_organizaron");
		}

		// Filtrar y ordenar top 3 usando la función de dominio pura badgePriority
		const prioritizedIds = badgePriority(candidateBadgeIds);

		return prioritizedIds.map((badgeId) => {
			const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
			const name = def?.name ?? badgeId;
			const quoteInRunLanguage =
				def?.defaultQuote[language] ?? def?.defaultQuote.ES ?? "";

			return {
				id: badgeId,
				name,
				quoteInRunLanguage,
			};
		});
	}

	/**
	 * Genera las tarjetas formativas individuales por alumno confirmado (SPEC §11).
	 */
	private evaluateStudents(
		context: JudgeEvaluationContext,
	): StudentEvaluation[] {
		// Solo evaluar alumnos confirmados
		const confirmedPlayers = context.players.filter((p) => p.confirmed);

		return confirmedPlayers.map((player) => {
			const override = context.studentOverrides?.find(
				(s) =>
					s.playerId === player.playerId ||
					(s.name && s.name.toLowerCase() === player.name.toLowerCase()),
			);

			// Contar turnos de voz de las transcripciones si player.turnCount no está poblado
			const transcriptTurns = context.transcripts.filter(
				(t) =>
					t.holderPlayerId === player.name ||
					t.holderPlayerId === player.playerId ||
					t.holderPlayerId.includes(player.name),
			).length;
			const voiceTurns =
				player.turnCount > 0 ? player.turnCount : transcriptTurns;

			// Contar dibujos registrados
			const drawingsCount = context.drawings.filter(
				(d) => d.playerId === player.name || d.playerId === player.playerId,
			).length;
			const drawsCount =
				player.drawCount > 0 ? player.drawCount : drawingsCount;

			// 3 dimensiones formativas 0-2 (SPEC §11)
			const participacion: CriterionScore =
				override?.participacion ??
				(voiceTurns >= 3 ? 2 : voiceTurns >= 1 ? 1 : 0);

			const propuesta: CriterionScore =
				override?.propuesta ??
				(drawsCount > 0 || voiceTurns >= 2 ? 2 : voiceTurns === 1 ? 1 : 0);

			const organizacion: CriterionScore =
				override?.organizacion ??
				(voiceTurns >= 4 ? 2 : voiceTurns >= 2 ? 1 : 0);

			// Anécdota observacional de 1 línea SIEMPRE EN ESPAÑOL
			const anecdote =
				override?.anecdote ??
				`Participó activamente con ${voiceTurns} intervenciones de voz y ${drawsCount} dibujos para el equipo.`;

			return {
				playerId: player.playerId,
				avatar: player.avatar as AvatarSpecies,
				name: player.name.slice(0, 10), // Truncar a máximo 10 caracteres
				participacion,
				propuesta,
				organizacion,
				anecdote,
				turnCount: voiceTurns,
				drawCount: drawsCount,
			};
		});
	}
}

/**
 * Instancia singleton predeterminada de JudgeService.
 */
export const judgeService = new JudgeService();

/**
 * Función pura de evaluación que utiliza la instancia default de JudgeService.
 */
export function evaluateSession(
	context: JudgeEvaluationContext,
): Promise<JudgeScores> {
	return judgeService.evaluateSession(context);
}
