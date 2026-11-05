/**
 * TALENTIA / SocraticGuild — Integration & Unit Tests for F4a
 * Superficie D3: Pantalla Final Colectiva de Equipo y Privacidad Pública en /play.
 * Conforme a SPEC §1, §11, §12, §19 & docs/gates/F0-contrato.md.
 *
 * Verificaciones obligatorias:
 * 1. Pantalla final de Equipo en /play ([PLAY-06], [PLAY-07] / EquipoEndScreen.tsx):
 *    - Victoria ([PLAY-06]):
 *      - Título exacto locked string: '¡Puente listo!' (SPEC §19).
 *      - Animación de confeti CSS y pop animado de estrellas (1-3★ calculado estrictamente con starsFor).
 *      - Hasta 3 insignias ganadas priorizadas con badgePriority:
 *        Paso a paso > Cumplieron su promesa > Un solo equipo > Se turnaron > Se organizaron.
 *      - Cita conductual de evidencia de cada insignia EN EL IDIOMA DE LA PARTIDA (ES, EN, QUZ).
 *      - Indicador de pasos: '3/3' (o '¡Puente listo!').
 *    - Inconcluso / Expiración de tiempo / Parcial ([PLAY-07]):
 *      - Título exacto locked string: 'Misión en curso X/3' (SPEC §19).
 *      - Insignias ganadas hasta el momento (badges-only).
 *      - ESTRELLAS RETENIDAS (stars === null): NO se muestra ninguna estrella.
 *    - Privacidad estricta y sin rankings:
 *      - CERO nombres de alumnos, CERO números individuales, CERO calificaciones o rankings comparativos.
 *      - Asistencia docente ('con apoyo docente', forced=true o time_skip) NUNCA se muestra en /play;
 *        los niños ven las estrellas juzgadas sin delatar ayuda docente.
 * 2. Integración en PlayLayout.tsx:
 *    - Alterna automáticamente a EquipoEndScreen cuando la partida finaliza (status finished o expired).
 *    - Desmontea ActivePlayView eliminando tarjetas de alumnos y riel del DOM.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import { setDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import type { SessionConfig } from "@/shared/documents.ts";
import { calculateStars, starsFor } from "@/shared/scoring.ts";
import {
	EquipoEndScreen,
	type EquipoEndScreenProps,
} from "@/ui/play/EquipoEndScreen.tsx";
import { PlayLayout, type PlayLayoutProps } from "@/ui/play/PlayLayout.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import type { GroupScores } from "@/ui/tokens/badges.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

describe("F4a: Pantalla Final de Equipo y Privacidad Pública (Superficie D3, SPEC §1, §11, §12, §19)", () => {
	let repo: InMemorySessionRepository;

	beforeEach(() => {
		repo = new InMemorySessionRepository();
		setDefaultSessionRepository(repo);

		// Reset Play Store
		usePlayStore.setState({
			phase: "join",
			sessionCode: null,
			sessionStatus: "created",
			language: "ES",
			expectedPlayers: 4,
			cards: [],
			selectedCardIndex: null,
			countdownSeconds: 5,
			syncBus: null,
			currentStation: "campamento",
			gameTimeSeconds: 300,
			isTimerPaused: false,
			pauseReason: null,
			checklistStep: 0,
			inventory: { madera: false, plano: false, sello: false },
			activeSubtitles: [],
			isDrawOpen: false,
			drawCardId: null,
			drawTimeRemaining: 30,
			drawCapHit: false,
			isMapOpen: false,
			proposedStation: null,
			proposerName: null,
			vetoCountdown: null,
			discussCountdown: null,
			isWalking: false,
			shakeMessage: null,
			endType: null,
			groupScores: undefined,
			badgeQuotes: undefined,
			teacherAssisted: false,
		});
	});

	// =========================================================================
	// 1. ESTADO VICTORIA ([PLAY-06], SUPERFICIE D3)
	// =========================================================================
	describe("1. Estado Victoria ([PLAY-06] - SPEC §1, §11, §19)", () => {
		it("renderiza el título exacto de victoria '¡Puente listo!' (LOCKED_STRINGS.WIN_TITLE)", () => {
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					checklistStep: 3,
				}),
			);

			expect(html).toContain(LOCKED_STRINGS.WIN_TITLE);
			expect(html).toContain("¡Puente listo!");
			expect(html).toContain("¡Objetivo Colectivo Logrado!");
			expect(html).toContain("Pasos: 3/3");
		});

		it("renderiza la animación de confeti CSS en estado de victoria", () => {
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					checklistStep: 3,
				}),
			);

			expect(html).toContain('data-testid="confetti-container"');
			expect(html).toContain("confetti-piece");
		});

		it("calcula estrictamente 3★ (pop animado) cuando sumPoints está entre 8 y 10", () => {
			// Puntajes perfectos 2+2+2+2+2 = 10 -> 3★
			const scores10: GroupScores = {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			};
			expect(starsFor(10, true)).toBe(3);

			const html10 = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores10,
				}),
			);
			expect(html10).toContain('data-testid="stars-container"');
			expect(html10).toContain("¡Excelente coordinación de equipo! (3★)");
			expect(html10).toContain('data-testid="star-1"');
			expect(html10).toContain('data-testid="star-2"');
			expect(html10).toContain('data-testid="star-3"');
			expect(html10).toContain("animate-star-pop");

			// Límite inferior 8 puntos -> 3★
			const scores8: GroupScores = {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 1,
				organizacion: 1,
			};
			expect(starsFor(8, true)).toBe(3);
			const html8 = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores8,
				}),
			);
			expect(html8).toContain("3★");
		});

		it("calcula estrictamente 2★ cuando sumPoints está entre 5 y 7 puntos", () => {
			const scores6: GroupScores = {
				turnTaking: 2,
				colaboracion: 1,
				negociacion: 1,
				estructurada: 1,
				organizacion: 1,
			};
			expect(starsFor(6, true)).toBe(2);

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores6,
				}),
			);
			expect(html).toContain('data-testid="stars-container"');
			expect(html).toContain("¡Buen trabajo cooperativo! (2★)");
		});

		it("calcula estrictamente 1★ cuando sumPoints está entre 0 y 4 puntos", () => {
			const scores4: GroupScores = {
				turnTaking: 1,
				colaboracion: 1,
				negociacion: 1,
				estructurada: 1,
				organizacion: 0,
			};
			expect(starsFor(4, true)).toBe(1);

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores4,
				}),
			);
			expect(html).toContain('data-testid="stars-container"');
			expect(html).toContain("¡Primer paso de trabajo grupal! (1★)");
		});

		it("despliega hasta 3 insignias priorizadas estrictamente: Paso a paso > Cumplieron su promesa > Un solo equipo", () => {
			// Los 5 criterios obtienen 2/2
			const all5Earned: GroupScores = {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			};

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: all5Earned,
				}),
			);

			// Debe mostrar exactamente las 3 primeras por contrato de prioridad (§11)
			expect(html).toContain('data-testid="badge-paso_a_paso"');
			expect(html).toContain('data-testid="badge-cumplieron_su_promesa"');
			expect(html).toContain('data-testid="badge-un_solo_equipo"');

			// 'se_turnaron' y 'se_organizaron' deben ser omitidas por exceder el tope de 3
			expect(html).not.toContain('data-testid="badge-se_turnaron"');
			expect(html).not.toContain('data-testid="badge-se_organizaron"');
		});

		it("respeta la prioridad cuando solo se ganan 2 o 3 insignias con orden variado", () => {
			// estructurada=2, colaboracion=2, organizacion=2 (negociacion y turnTaking no alcanzaron 2)
			const scores: GroupScores = {
				turnTaking: 1,
				colaboracion: 2,
				negociacion: 0,
				estructurada: 2,
				organizacion: 2,
			};

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores,
				}),
			);

			// Se deben mostrar paso_a_paso, un_solo_equipo y se_organizaron
			expect(html).toContain('data-testid="badge-paso_a_paso"');
			expect(html).toContain('data-testid="badge-un_solo_equipo"');
			expect(html).toContain('data-testid="badge-se_organizaron"');
			expect(html).not.toContain('data-testid="badge-cumplieron_su_promesa"');
			expect(html).not.toContain('data-testid="badge-se_turnaron"');
		});

		it("muestra la cita de evidencia conductual en el idioma de la partida (ES, EN, QUZ)", () => {
			const scores: GroupScores = {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			};

			// 1. Partida en Español (ES)
			const htmlEs = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores,
					lang: "ES",
				}),
			);
			expect(htmlEs).toContain("Primero fuimos a la chacra y luego al taller.");
			expect(htmlEs).toContain(
				"Le prometimos a Paco regar los surcos a cambio de los troncos.",
			);

			// 2. Partida en Inglés (EN)
			const htmlEn = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores,
					lang: "EN",
				}),
			);
			expect(htmlEn).toContain(
				"First we went to the farm, then to the workshop.",
			);
			expect(htmlEn).toContain(
				"We promised Paco to water the crops in exchange for timber.",
			);

			// 3. Partida en Quechua (QUZ)
			const htmlQuz = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: scores,
					lang: "QUZ",
				}),
			);
			expect(htmlQuz).toContain(
				"Ñawpaqta chakrapi rirqanchik, chaymantataq kanchapi.",
			);
			expect(htmlQuz).toContain("Pacota rimaykurqanchik");
			expect(htmlQuz).toContain("chaskinapaq.");
		});
	});

	// =========================================================================
	// 2. ESTADO INCONCLUSO / EXPIRACIÓN DE TIEMPO ([PLAY-07], SUPERFICIE D3)
	// =========================================================================
	describe("2. Estado Parcial / Expiración de Tiempo ([PLAY-07] - SPEC §1, §11, §19)", () => {
		it("renderiza el título locked exacto 'Misión en curso X/3' según el paso alcanzado", () => {
			// Paso 0/3
			const html0 = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 0,
				}),
			);
			expect(html0).toContain(LOCKED_STRINGS.PARTIAL_TITLE(0));
			expect(html0).toContain("Misión en curso 0/3");
			expect(html0).toContain("Pasos: 0/3");

			// Paso 1/3
			const html1 = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 1,
				}),
			);
			expect(html1).toContain(LOCKED_STRINGS.PARTIAL_TITLE(1));
			expect(html1).toContain("Misión en curso 1/3");
			expect(html1).toContain("Pasos: 1/3");

			// Paso 2/3
			const html2 = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 2,
				}),
			);
			expect(html2).toContain(LOCKED_STRINGS.PARTIAL_TITLE(2));
			expect(html2).toContain("Misión en curso 2/3");
			expect(html2).toContain("Pasos: 2/3");
		});

		it("ESTRELLAS RETENIDAS (stars === null): NO muestra ninguna estrella en el DOM", () => {
			// A pesar de tener 10 puntos, si endType no es victoria, starsFor retorna null
			const highScores: GroupScores = {
				turnTaking: 2,
				colaboracion: 2,
				negociacion: 2,
				estructurada: 2,
				organizacion: 2,
			};
			expect(calculateStars(10, false)).toBeNull();
			expect(starsFor(10, false)).toBeNull();

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 1,
					scores: highScores,
				}),
			);

			// Ausencia total de estrellas y de contenedor de estrellas
			expect(html).not.toContain('data-testid="stars-container"');
			expect(html).not.toContain("★");
			expect(html).not.toContain("⭐");
			expect(html).not.toContain("animate-star-pop");

			// Debe mostrar el distintivo obligatorio de estrellas retenidas
			expect(html).toContain('data-testid="stars-withheld"');
			expect(html).toContain("Estrellas retenidas (misión en curso)");
		});

		it("despliega únicamente las insignias ganadas hasta el momento (badges-only)", () => {
			const partialScores: GroupScores = {
				turnTaking: 2,
				colaboracion: 0,
				negociacion: 2,
				estructurada: 1,
				organizacion: 0,
			};

			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 2,
					scores: partialScores,
				}),
			);

			// negociacion=2 (cumplieron_su_promesa) y turnTaking=2 (se_turnaron)
			expect(html).toContain('data-testid="badge-cumplieron_su_promesa"');
			expect(html).toContain('data-testid="badge-se_turnaron"');

			// No alcanzaron 2: paso_a_paso, un_solo_equipo, se_organizaron
			expect(html).not.toContain('data-testid="badge-paso_a_paso"');
			expect(html).not.toContain('data-testid="badge-un_solo_equipo"');
			expect(html).not.toContain('data-testid="badge-se_organizaron"');
		});

		it("no renderiza contenedor de confeti en estado parcial", () => {
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 1,
				}),
			);

			expect(html).not.toContain('data-testid="confetti-container"');
		});
	});

	// =========================================================================
	// 3. PRIVACIDAD ESTRICTA Y AUSENCIA EN EL DOM DE /play (SPEC §1, §11, §12)
	// =========================================================================
	describe("3. Privacidad Estricta y Ausencia en el DOM de /play (SPEC §1, §11, §12)", () => {
		it("garantiza la AUSENCIA TOTAL de nombres de alumnos en el DOM de /play", () => {
			// Mock de estado con alumnos confirmados en el store
			usePlayStore.setState({
				cards: [
					{
						cardId: "c1",
						playerIndex: 0,
						avatarId: "zorro",
						studentName: "Mateo",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 5,
						drawsCount: 2,
					},
					{
						cardId: "c2",
						playerIndex: 1,
						avatarId: "buho",
						studentName: "Valentina",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 4,
						drawsCount: 1,
					},
				],
			});

			const victoryHtml = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
				}),
			);
			const partialHtml = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 2,
				}),
			);

			for (const html of [victoryHtml, partialHtml]) {
				expect(html).not.toContain("Mateo");
				expect(html).not.toContain("Valentina");
				expect(html).not.toContain("Sofía");
				expect(html).not.toContain("Leo");
				expect(html).not.toContain("Lucas");
				expect(html).not.toContain("Ana");
				expect(html).not.toContain("Jugador 1");
				expect(html).not.toContain("Jugador 2");
			}
		});

		it("garantiza la AUSENCIA TOTAL de números individuales o telemetría por alumno", () => {
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: {
						turnTaking: 2,
						colaboracion: 2,
						negociacion: 2,
						estructurada: 2,
						organizacion: 1,
					},
				}),
			);

			// Ausencia de conteos de voz individuales
			expect(html).not.toContain("turnos");
			expect(html).not.toContain("turnsCount");
			expect(html).not.toContain("intervenciones");

			// Ausencia de conteos de dibujo individuales
			expect(html).not.toContain("dibujos");
			expect(html).not.toContain("drawsCount");

			// Ausencia de notas o rúbricas individuales
			expect(html).not.toContain("participación:");
			expect(html).not.toContain("propuesta:");
			expect(html).not.toContain("organización:");
		});

		it("garantiza la AUSENCIA TOTAL de calificaciones competitivas o rankings", () => {
			const html = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
				}),
			);

			expect(html).not.toContain("ranking");
			expect(html).not.toContain("puesto");
			expect(html).not.toContain("primer lugar");
			expect(html).not.toContain("1er lugar");
			expect(html).not.toContain("ganador");
			expect(html).not.toContain("perdedor");
			expect(html).not.toContain("nota individual");
		});

		it("NUNCA muestra etiquetas ni advertencias de penalización o apoyo docente en /play", () => {
			// Caso donde la sesión tuvo apoyo docente / forzado
			usePlayStore.setState({
				teacherAssisted: true,
			});

			const victoryHtml = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "victory",
					scores: {
						turnTaking: 2,
						colaboracion: 2,
						negociacion: 2,
						estructurada: 1, // Capado por asistencia docente
						organizacion: 1,
					},
				}),
			);

			const partialHtml = renderToString(
				React.createElement<EquipoEndScreenProps>(EquipoEndScreen, {
					endType: "partial",
					checklistStep: 1,
					scores: {
						turnTaking: 1,
						colaboracion: 1,
						negociacion: 1,
						estructurada: 1,
						organizacion: 0,
					},
				}),
			);

			for (const html of [victoryHtml, partialHtml]) {
				expect(html).not.toContain(LOCKED_STRINGS.TEACHER_FLAG);
				expect(html).not.toContain("con apoyo docente");
				expect(html).not.toContain("apoyo docente");
				expect(html).not.toContain("asistencia docente");
				expect(html).not.toContain("penalización");
				expect(html).not.toContain("forzado");
				expect(html).not.toContain("time_skip");
				expect(html).not.toContain("consola");
			}
		});
	});

	// =========================================================================
	// 4. INTEGRACIÓN EN PlayLayout.tsx ([PLAY-03], [PLAY-06], [PLAY-07])
	// =========================================================================
	describe("4. Integración en PlayLayout.tsx y Alternancia Automática", () => {
		it("muestra ActivePlayView mientras la partida está en curso (phase='active')", () => {
			usePlayStore.setState({
				phase: "active",
				sessionStatus: "playing",
				endType: null,
				gameTimeSeconds: 240,
			});

			const html = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			// ActivePlayView incluye temporizador, estación activa y barra inferior
			expect(html).toContain("Estación Activa");
			expect(html).toContain("Tocar para abrir mapa");
			expect(html).not.toContain('data-testid="equipo-end-screen"');
		});

		it("alterna automáticamente a EquipoEndScreen cuando endType='victory'", () => {
			usePlayStore.setState({
				phase: "end",
				sessionStatus: "finished",
				endType: "victory",
				checklistStep: 3,
			});

			const html = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			expect(html).toContain('data-testid="equipo-end-screen"');
			expect(html).toContain("¡Puente listo!");
			expect(html).toContain("Pasos: 3/3");
			// Desmontea ActivePlayView
			expect(html).not.toContain("Estación Activa");
		});

		it("alterna automáticamente a EquipoEndScreen cuando endType='partial'", () => {
			usePlayStore.setState({
				phase: "end",
				sessionStatus: "expired",
				endType: "partial",
				checklistStep: 2,
			});

			const html = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			expect(html).toContain('data-testid="equipo-end-screen"');
			expect(html).toContain("Misión en curso 2/3");
			expect(html).not.toContain("Estación Activa");
		});

		it("sincroniza automáticamente con SessionRepo cuando la sesión pasa a 'finished'", async () => {
			const config: SessionConfig = {
				language: "ES",
				expectedPlayers: 4,
				durationMinutes: 5,
				durationGameMs: 300000,
				createdAtWallMs: Date.now(),
				locked: true,
			};
			await repo.create(config, "V7K2");
			await repo.updateStatus("V7K2", "finished");

			usePlayStore.setState({
				phase: "active",
				sessionCode: "V7K2",
				sessionStatus: "playing",
				endType: null,
			});

			// Montar PlayLayout con el repo que tiene V7K2 en 'finished'
			const html = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			expect(html).toContain('data-testid="equipo-end-screen"');
			expect(html).toContain("¡Puente listo!");
		});

		it("sincroniza automáticamente con SessionRepo cuando la sesión pasa a 'expired'", async () => {
			const config: SessionConfig = {
				language: "ES",
				expectedPlayers: 4,
				durationMinutes: 5,
				durationGameMs: 300000,
				createdAtWallMs: Date.now(),
				locked: true,
			};
			await repo.create(config, "E3P9");
			await repo.updateStatus("E3P9", "expired");

			usePlayStore.setState({
				phase: "active",
				sessionCode: "E3P9",
				sessionStatus: "playing",
				endType: null,
				checklistStep: 1,
			});

			// Montar PlayLayout con el repo que tiene E3P9 en 'expired'
			const html = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);

			expect(html).toContain('data-testid="equipo-end-screen"');
			expect(html).toContain("Misión en curso 1/3");
		});

		it("garantiza que al alternar a EquipoEndScreen el riel de alumnos con nombres queda desmontado del DOM", () => {
			// En partida activa, RightRail contiene nombres de alumnos
			usePlayStore.setState({
				phase: "active",
				sessionStatus: "playing",
				endType: null,
				cards: [
					{
						cardId: "c1",
						playerIndex: 0,
						avatarId: "zorro",
						studentName: "Mateo",
						isConfirmed: true,
						status: "idle",
						isRetired: false,
						turnsCount: 3,
						drawsCount: 1,
					},
				],
			});

			const activeHtml = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);
			expect(activeHtml).toContain("Mateo");

			// Cuando la partida finaliza
			usePlayStore.getState().triggerVictory();

			const endHtml = renderToString(
				React.createElement<PlayLayoutProps>(PlayLayout, { repo }),
			);
			expect(endHtml).toContain('data-testid="equipo-end-screen"');
			expect(endHtml).not.toContain("Mateo");
			expect(endHtml).not.toContain("Riel de Alumnos");
		});

		it("el botón 'Volver al Inicio' en EquipoEndScreen resetea el store al lobby", () => {
			usePlayStore.setState({
				phase: "end",
				sessionCode: "TEST",
				endType: "victory",
			});

			usePlayStore.getState().resetToLobby();

			const state = usePlayStore.getState();
			expect(state.phase).toBe("join");
			expect(state.sessionCode).toBeNull();
			expect(state.endType).toBeNull();
		});
	});
});
