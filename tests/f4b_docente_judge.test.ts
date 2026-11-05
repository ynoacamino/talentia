/**
 * TALENTIA / SocraticGuild — Integration & Unit Tests for F4b
 * Motor y Fixtures del Juez, Rúbrica Pedagógica y Vista Docente (Superficie D4).
 * SPEC §1, §11, §13, §14, §19 & docs/gates/F0-contrato.md.
 *
 * Verificaciones obligatorias:
 * 1. Motor del Juez (JudgeService & Fixtures):
 *    - Evaluación del juez con fixture de suma=9 -> 3★ y filtro top 3 badges (badgePriority).
 *    - Regla de estrellas (SPEC §11: 0-4=1★, 5-7=2★, 8-10=3★) y retención con isFinished=false (stars=null).
 *    - Forzado/soporte docente: resolucion estructurada capada a 1, badge 'Paso a paso' bloqueada y conApoyoDocente: true.
 *    - Citas de evidencia en el reporte docente SIEMPRE EN ESPAÑOL incluso si la partida fue en EN o QUZ.
 *    - Tarjetas por alumno confirmado: 3 criterios 0-2, anécdota y conteos de intervenciones.
 * 2. Vista Docente en /teacher ([TEACH-03] / DocenteView.tsx):
 *    - Banner superior obligatorio: 'señales preliminares, no notas' (LOCKED_STRINGS.DOCENTE_BANNER).
 *    - Si hubo asistencia forzada, renderiza la etiqueta locked: 'con apoyo docente' (LOCKED_STRINGS.TEACHER_FLAG).
 *    - Muestra las estrellas (1-3★ o Guion si no finalizada) consumiendo useGroupStars() o scores.stars.
 *    - 5 criterios de grupo 0-2 con rúbrica cualitativa (ausente, emergente, consistente) y sus citas en español.
 *    - Tarjetas Paper-Mario por alumno (avatar, nombre hasta 10 chars, 3 dimensiones 0-2, anécdota y conteos).
 *    - Inmutabilidad estricta: ausencia total de inputs o botones para editar notas en el DOM.
 */

import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
	evaluateSession,
	FIXTURE_CONTEXT_MULTILINGUAL_EN,
	FIXTURE_CONTEXT_MULTILINGUAL_QUZ,
	FIXTURE_CONTEXT_SUM_9,
	FIXTURE_CONTEXT_TEACHER_ASSISTED,
	FIXTURE_JUDGE_MULTILINGUAL_EN,
	FIXTURE_JUDGE_SUM_9,
	FIXTURE_JUDGE_TEACHER_ASSISTED,
	FIXTURE_JUDGE_UNFINISHED,
	JudgeService,
	judgeService,
} from "@/core/judge/index.ts";
import { LOCKED_STRINGS } from "@/shared/constants.ts";
import type { JudgeEvaluationContext } from "@/shared/documents.ts";
import { DocenteView } from "@/ui/teacher/DocenteView.tsx";

describe("F4b: Motor del Juez Pedagógico (JudgeService & Fixtures - SPEC §11)", () => {
	it("evalúa una sesión con suma=9 puntos, otorgando 3★ cuando isFinished=true y filtrando el top 3 de insignias por prioridad", async () => {
		const scores = await judgeService.evaluateSession(FIXTURE_CONTEXT_SUM_9);

		// 1. Verificación de suma y estrellas (SPEC §11: 8-10 = 3★)
		expect(scores.sumPoints).toBe(9);
		expect(scores.isFinished).toBe(true);
		expect(scores.stars).toBe(3);
		expect(scores.conApoyoDocente).toBe(false);

		// 2. Verificación de los 5 criterios
		expect(scores.groupCriteria.turnTaking.score).toBe(2);
		expect(scores.groupCriteria.colaboracion.score).toBe(2);
		expect(scores.groupCriteria.negociacion.score).toBe(2);
		expect(scores.groupCriteria.resolucionEstructurada.score).toBe(1);
		expect(scores.groupCriteria.organizacionLiderazgo.score).toBe(2);

		// 3. Verificación de selección de insignias:
		// 4 criterios alcanzaron 2/2:
		// - negociacion 2/2 -> 'cumplieron_su_promesa' (Prioridad 2)
		// - colaboracion 2/2 -> 'un_solo_equipo' (Prioridad 3)
		// - turnTaking 2/2 -> 'se_turnaron' (Prioridad 4)
		// - organizacionLiderazgo 2/2 -> 'se_organizaron' (Prioridad 5)
		// Filtro top 3 según BADGE_PRIORITY_ORDER descarta 'se_organizaron'
		expect(scores.earnedBadges).toHaveLength(3);
		expect(scores.earnedBadges.map((b) => b.id)).toEqual([
			"cumplieron_su_promesa",
			"un_solo_equipo",
			"se_turnaron",
		]);

		// Asegurar que 'se_organizaron' quedó fuera por el tope de 3
		expect(scores.earnedBadges.some((b) => b.id === "se_organizaron")).toBe(
			false,
		);
	});

	it("retiene estrellas (stars=null / Guion) si la sesión no ha finalizado (isFinished=false) a pesar de tener 9 puntos", async () => {
		const unfinishedContext: JudgeEvaluationContext = {
			...FIXTURE_CONTEXT_SUM_9,
			isFinished: false,
		};

		const scores = await judgeService.evaluateSession(unfinishedContext);

		expect(scores.isFinished).toBe(false);
		expect(scores.sumPoints).toBe(9);
		// SPEC §1, §11: No finish = partial, badges-only, stars withheld (null)
		expect(scores.stars).toBeNull();
		// Las insignias sí se otorgan según el desempeño
		expect(scores.earnedBadges).toHaveLength(3);
	});

	it("asistencia o forzado docente capa resolucionEstructurada a máximo 1, bloquea 'Paso a paso' y marca conApoyoDocente: true", async () => {
		// Contexto donde estructurada intentó calificar 2/2
		const scores = await judgeService.evaluateSession(
			FIXTURE_CONTEXT_TEACHER_ASSISTED,
		);

		// 1. resolucionEstructurada debe estar capada a 1/2
		expect(scores.groupCriteria.resolucionEstructurada.score).toBe(1);

		// 2. Bandera obligatoria
		expect(scores.conApoyoDocente).toBe(true);

		// 3. Insignia 'Paso a paso' NO se otorga bajo ninguna circunstancia con apoyo docente
		const hasPasoAPaso = scores.earnedBadges.some(
			(b) => b.id === "paso_a_paso",
		);
		expect(hasPasoAPaso).toBe(false);

		// 4. Suma refleja el puntaje capado: 2 + 2 + 1 + 1 (capado) + 2 = 8 -> 3★
		expect(scores.sumPoints).toBe(8);
		expect(scores.stars).toBe(3);
	});

	it("detecta automáticamente apoyo docente desde eventos grant_step(forced=true) o time_skip", async () => {
		const service = new JudgeService();
		const contextWithForcedEvent: JudgeEvaluationContext = {
			...FIXTURE_CONTEXT_SUM_9,
			hasTeacherSupport: false, // Inicialmente false
			events: [
				{
					id: "ev-forced",
					sessionId: "SESS-1",
					type: "grant_step",
					game_ts_ms: 10000,
					wall_ts_ms: 1730728900000,
					actorId: "teacher",
					payload: {
						stepId: "conseguir_madera",
						grantedItem: "madera",
						forced: true,
					},
				},
			],
			rawScores: {
				...FIXTURE_CONTEXT_SUM_9.rawScores,
				resolucionEstructurada: {
					score: 2,
					evidenceQuote: "Planearon todo en orden.",
				},
			},
		};

		const scores = await service.evaluateSession(contextWithForcedEvent);

		expect(scores.conApoyoDocente).toBe(true);
		expect(scores.groupCriteria.resolucionEstructurada.score).toBe(1);
		expect(scores.earnedBadges.some((b) => b.id === "paso_a_paso")).toBe(false);
	});

	it("genera citas de evidencia y anécdotas siempre en español incluso en partidas monoglota EN o QUZ", async () => {
		// 1. Partida en inglés (EN)
		const scoresEn = await judgeService.evaluateSession(
			FIXTURE_CONTEXT_MULTILINGUAL_EN,
		);

		// Todas las citas de evidencia deben estar en español (paráfrasis según SPEC §11, §14)
		expect(scoresEn.groupCriteria.turnTaking.evidenceQuote).toContain(
			"Cedieron la palabra con paciencia",
		);
		expect(scoresEn.groupCriteria.negociacion.evidenceQuote).toContain(
			"Le prometimos a Paco regar los surcos",
		);
		// Las anécdotas por alumno deben estar en español
		expect(scoresEn.students[0]?.anecdote).toContain("intervenciones de voz");
		// Las insignias para la pantalla de niños (/play) deben tener la frase en el idioma de la partida (EN)
		expect(scoresEn.earnedBadges[0]?.quoteInRunLanguage).toBe(
			"First we went to the farm, then to the workshop.",
		);

		// 2. Partida en quechua (QUZ)
		const scoresQuz = await judgeService.evaluateSession(
			FIXTURE_CONTEXT_MULTILINGUAL_QUZ,
		);

		// Citas de evidencia en español
		expect(
			scoresQuz.groupCriteria.resolucionEstructurada.evidenceQuote,
		).toContain("Primero fuimos a la chacra y luego al taller");
		// Anécdotas en español
		expect(scoresQuz.students[0]?.anecdote).toContain("intervenciones de voz");
		// Cita de insignia en quechua para los niños (/play)
		expect(scoresQuz.earnedBadges[0]?.quoteInRunLanguage).toContain("chakrapi");
	});

	it("evalúa tarjetas de alumnos confirmados con 3 dimensiones 0-2, anécdota y conteos exactos de turnos y dibujos", async () => {
		const scores = await evaluateSession(FIXTURE_CONTEXT_SUM_9);

		// Solo 3 alumnos confirmados en FIXTURE_CONTEXT_SUM_9
		expect(scores.students).toHaveLength(3);

		for (const student of scores.students) {
			// Nombre truncado a máximo 10 caracteres (SPEC §3, §11)
			expect(student.name.length).toBeLessThanOrEqual(10);
			// 3 dimensiones dentro de rango 0..2
			expect([0, 1, 2]).toContain(student.participacion);
			expect([0, 1, 2]).toContain(student.propuesta);
			expect([0, 1, 2]).toContain(student.organizacion);
			// Anécdota descriptiva presente
			expect(typeof student.anecdote).toBe("string");
			expect(student.anecdote.length).toBeGreaterThan(0);
			// Conteos numéricos coherentes
			expect(student.turnCount).toBeGreaterThanOrEqual(0);
			expect(student.drawCount).toBeGreaterThanOrEqual(0);
		}

		// Mateo tiene 5 turnos y 1 dibujo en el fixture
		const mateo = scores.students.find((s) => s.name === "Mateo");
		expect(mateo).toBeDefined();
		expect(mateo?.turnCount).toBe(5);
		expect(mateo?.drawCount).toBe(1);
	});

	it("excluye de la evaluación individual a jugadores no confirmados", async () => {
		const contextWithUnconfirmed: JudgeEvaluationContext = {
			...FIXTURE_CONTEXT_SUM_9,
			players: [
				...FIXTURE_CONTEXT_SUM_9.players,
				{
					slotIndex: 3,
					playerId: "p-unconfirmed",
					avatar: "Tucán",
					name: "Invitado",
					confirmed: false, // NO CONFIRMADO
					retired: false,
					retiredGameTsMs: null,
					lastActiveWallMs: 0,
					turnCount: 0,
					drawCount: 0,
				},
			],
		};

		const scores = await judgeService.evaluateSession(contextWithUnconfirmed);
		// Solo los 3 confirmados
		expect(scores.students).toHaveLength(3);
		expect(scores.students.some((s) => s.playerId === "p-unconfirmed")).toBe(
			false,
		);
	});
});

describe("F4b: Vista Docente en /teacher ([TEACH-03] / DocenteView.tsx - SPEC §11, §13, §19)", () => {
	it("renderiza el banner superior obligatorio con la locked string 'señales preliminares, no notas'", () => {
		const html = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);

		// SPEC §19: DOCENTE_BANNER = "señales preliminares, no notas"
		expect(html).toContain(LOCKED_STRINGS.DOCENTE_BANNER);
		expect(html).toContain('data-testid="docente-banner"');
		expect(html).toContain('data-testid="docente-banner-title"');
	});

	it("renderiza la etiqueta locked 'con apoyo docente' cuando conApoyoDocente es true", () => {
		const htmlAssisted = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_TEACHER_ASSISTED,
				sessionCode: "ASSIST",
			}),
		);

		// SPEC §19: TEACHER_FLAG = "con apoyo docente"
		expect(htmlAssisted).toContain(LOCKED_STRINGS.TEACHER_FLAG);
		expect(htmlAssisted).toContain('data-testid="teacher-assisted-flag"');

		// Cuando NO hubo apoyo docente, la bandera no debe renderizarse
		const htmlUnassisted = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);
		expect(htmlUnassisted).not.toContain('data-testid="teacher-assisted-flag"');
	});

	it("muestra 3 estrellas cuando sumPoints=9 y finalizó, y muestra Guion ('—') cuando estrellas fueron retenidas", () => {
		// 1. Sesión con 9 puntos y finalizada -> 3★
		const html3Stars = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);
		expect(html3Stars).toContain("(3/3)");
		expect(html3Stars).toContain("★");

		// 2. Sesión inconclusa con estrellas retenidas -> Guion ('—')
		const htmlRetained = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_UNFINISHED,
				sessionCode: "UNFINISHED",
			}),
		);
		expect(htmlRetained).toContain('data-testid="stars-retained-msg"');
		expect(htmlRetained).toContain("—");
		expect(htmlRetained).toContain("Estrellas retenidas");
	});

	it("renderiza los 5 criterios colectivos con rúbrica cualitativa (ausente, emergente, consistente) y citas en español", () => {
		const html = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_MULTILINGUAL_EN,
				sessionCode: "EN01",
			}),
		);

		// Los 5 criterios deben estar presentes en el DOM
		expect(html).toContain('data-testid="criterion-card-turnTaking"');
		expect(html).toContain('data-testid="criterion-card-colaboracion"');
		expect(html).toContain('data-testid="criterion-card-negociacion"');
		expect(html).toContain('data-testid="criterion-card-estructurada"');
		expect(html).toContain('data-testid="criterion-card-organizacion"');

		// Rúbrica cualitativa formativa
		expect(html).toContain("2 - Consistente");

		// Citas de evidencia SIEMPRE en español, incluso con partida en inglés
		expect(html).toContain("Cedieron la palabra con paciencia");
		expect(html).toContain("Le prometimos a Paco regar los surcos");
		expect(html).toContain("Planearon la secuencia chacra → taller → alcaldía");
	});

	it("renderiza tarjetas Paper-Mario por alumno con avatar, nombre <= 10 caracteres, 3 dimensiones 0-2, anécdota y conteo", () => {
		const html = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);

		expect(html).toContain('data-testid="student-card-p-mateo"');
		expect(html).toContain('data-testid="student-card-p-sofia"');
		expect(html).toContain('data-testid="student-card-p-lucas"');

		// Nombres
		expect(html).toContain("Mateo");
		expect(html).toContain("Sofía");
		expect(html).toContain("Lucas");

		// Conteos de turnos y dibujos (§11)
		expect(html).toContain("5 turnos");
		expect(html).toContain("1 dibujos");

		// Dimensiones 0-2
		expect(html).toContain('data-testid="student-dimension-participacion"');
		expect(html).toContain('data-testid="student-dimension-propuesta"');
		expect(html).toContain('data-testid="student-dimension-organizacion"');

		// Anécdotas
		expect(html).toContain(
			"Propuso la ruta inicial y esperó a que todos votaran.",
		);
	});

	it("renderiza las insignias otorgadas por el juez pedagógico", () => {
		const html = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);

		expect(html).toContain('data-testid="docente-earned-badges"');
		expect(html).toContain('data-testid="earned-badge-cumplieron_su_promesa"');
		expect(html).toContain('data-testid="earned-badge-un_solo_equipo"');
		expect(html).toContain('data-testid="earned-badge-se_turnaron"');
		expect(html).toContain("Cumplieron su promesa");
		expect(html).toContain("Un solo equipo");
		expect(html).toContain("Se turnaron");
	});

	it("inmutabilidad estricta: verificación exhaustiva de ausencia de controles de edición de notas en el DOM", () => {
		// SPEC §11: "Judge observations immutable: teacher disagreement recorded only as comment, original score/quote never edited or deleted."
		const html = renderToString(
			React.createElement(DocenteView, {
				scores: FIXTURE_JUDGE_SUM_9,
				sessionCode: "SUM9",
			}),
		);

		// 1. No debe existir ningún input numérico o range para editar puntajes
		expect(html).not.toMatch(/<input[^>]*type=["']number["']/i);
		expect(html).not.toMatch(/<input[^>]*type=["']range["']/i);

		// 2. No debe existir ningún input o select dentro de los criterios o tarjetas de alumnos
		// (El único input o textarea permitido en toda la vista es el de agregar comentarios en el hilo inferior)
		const cleanHtmlWithoutComments = html.replace(
			/<div[^>]*data-testid=["']comment-thread["'][\s\S]*$/,
			"",
		);
		expect(cleanHtmlWithoutComments).not.toMatch(/<input/i);
		expect(cleanHtmlWithoutComments).not.toMatch(/<textarea/i);
		expect(cleanHtmlWithoutComments).not.toMatch(/<select/i);

		// 3. No debe existir ningún botón para 'guardar notas', 'editar notas', 'modificar evaluación'
		expect(cleanHtmlWithoutComments).not.toMatch(/guardar nota/i);
		expect(cleanHtmlWithoutComments).not.toMatch(/editar nota/i);
		expect(cleanHtmlWithoutComments).not.toMatch(/modificar puntaje/i);
		expect(cleanHtmlWithoutComments).not.toMatch(
			/contenteditable=["']true["']/i,
		);
	});
});
