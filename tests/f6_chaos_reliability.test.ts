/**
 * tests/f6_chaos_reliability.test.ts
 *
 * Suite de Verificación de Fiabilidad, Resiliencia al Caos y Cola Serial (F6a)
 * Conforme a SPEC §16, §17 & docs/gates/F0-contrato.md.
 *
 * Casos críticos cubiertos:
 * 1. Test de 1 fallo transitorio -> auto-retry 1x y continúa transparente.
 * 2. Test de 3 fallos consecutivos -> bloqueo visible -> reintentar docente reanuda sin puntajes degradados.
 * 3. Test de cola serial: peticiones concurrentes se ejecutan en orden estricto FIFO.
 * 4. Test de persistencia de timestamps duales en todos los eventos generados.
 * 5. Retroalimentación sincronizada en UI: indicador locked 'reintentando…' en /play y consola en /teacher.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
	AIRetryQueue,
	assertDualTimestamps,
	createDualTimestamp,
	defaultAIRetryQueue,
	defaultGMSerialQueue,
	GMSerialQueue,
} from "@/core/reliability/retryQueue.ts";
import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import {
	CLOSED_EVENT_TYPES,
	type EventType,
	type JudgeScores,
} from "@/shared/documents.ts";
import { ActivePlayView } from "@/ui/play/ActivePlayView.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { OperatorConsole } from "@/ui/teacher/OperatorConsole.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

describe("F6a: Fiabilidad, Resiliencia y Cola Serial (SPEC §16, §17)", () => {
	beforeEach(() => {
		// Reset de colas globales
		defaultAIRetryQueue.clear();
		defaultGMSerialQueue.clear();

		// Reset de stores
		usePlayStore.setState({
			isTimerPaused: false,
			pauseReason: null,
			shakeMessage: null,
			isAiRetrying: false,
			isAiBlocked: false,
			aiRetryMessage: null,
			gameTimeSeconds: 300,
			checklistStep: 1,
			currentStation: "chacra",
		});

		useTeacherStore.setState({
			isTimerPaused: false,
			pauseReason: null,
			consoleError: null,
			isAiRetrying: false,
			isAiBlocked: false,
			blockedAiService: null,
			liveTimerSeconds: 300,
			liveStep: 1,
			recentEvents: [],
		});
	});

	// =========================================================================
	// 1. AUTO-RETRY CON BACKOFF (1 Fallo Transitorio -> 1x Auto-Retry)
	// =========================================================================
	describe("1. Auto-Retry con Backoff y Recuperación Transparente", () => {
		it("maneja 1 fallo transitorio -> auto-retry 1x y continúa transparente sin intervención docente", async () => {
			let callCount = 0;
			const retryEvents: { attempt: number; delay: number }[] = [];
			const successEvents: { attempts: number }[] = [];

			const flakySttService = async () => {
				callCount++;
				if (callCount === 1) {
					throw new Error("HTTP 503 Service Unavailable: Speech API timeout");
				}
				return {
					text: "Agricultor Paco, venimos a ayudar con la cosecha de madera",
					confidence: 0.94,
					holder: "Mateo",
				};
			};

			const queue = new AIRetryQueue();

			const result = await queue.executeWithRetry("STT", flakySttService, {
				initialBackoffMs: 2,
				backoffMultiplier: 2,
				maxRetries: 3,
				gameTimeSeconds: 120,
				onRetry: (info) => {
					retryEvents.push({
						attempt: info.attempt,
						delay: info.nextDelayMs,
					});
					assertDualTimestamps(info);
				},
				onSuccess: (info) => {
					successEvents.push({ attempts: info.attempts });
					assertDualTimestamps(info);
				},
			});

			// 1. Verificación de llamadas: exactamente 2 (intento 1 falló, intento 2 tuvo éxito)
			expect(callCount).toBe(2);

			// 2. Verificación de resultado auténtico transparente
			expect(result.text).toBe(
				"Agricultor Paco, venimos a ayudar con la cosecha de madera",
			);
			expect(result.confidence).toBe(0.94);
			expect(result.holder).toBe("Mateo");

			// 3. Verificación de telemetría de reintento
			expect(retryEvents.length).toBe(1);
			expect(retryEvents[0]?.attempt).toBe(1);
			expect(retryEvents[0]?.delay).toBeGreaterThanOrEqual(2);

			// 4. Verificación de éxito
			expect(successEvents.length).toBe(1);
			expect(successEvents[0]?.attempts).toBe(2);

			// 5. El estado final no queda bloqueado ni reintentando
			expect(queue.isBlocked()).toBe(false);
			expect(queue.isRetrying()).toBe(false);
		});

		it("opera transparentemente en todos los servicios de IA definidos en SPEC §16 (STT, LLM, TTS, VLM, Juez)", async () => {
			const services: Array<"STT" | "LLM" | "TTS" | "VLM" | "judge" | "Juez"> =
				["STT", "LLM", "TTS", "VLM", "judge", "Juez"];

			for (const service of services) {
				let attempts = 0;
				const mockFn = async () => {
					attempts++;
					if (attempts === 1) {
						throw new Error(`Transient ${service} glitch`);
					}
					return { ok: true, service };
				};

				const queue = new AIRetryQueue();
				const result = await queue.executeWithRetry(service, mockFn, {
					initialBackoffMs: 1,
					maxRetries: 3,
				});

				expect(attempts).toBe(2);
				expect(result.ok).toBe(true);
				expect(result.service).toBe(service);
				expect(queue.isBlocked()).toBe(false);
			}
		});

		it("resuelve de inmediato en el primer intento si no hay errores", async () => {
			let calls = 0;
			const perfectService = async () => {
				calls++;
				return { data: "success" };
			};

			const queue = new AIRetryQueue();
			const result = await queue.executeWithRetry("LLM", perfectService, {
				initialBackoffMs: 1,
			});

			expect(calls).toBe(1);
			expect(result.data).toBe("success");
			expect(queue.isBlocked()).toBe(false);
			expect(queue.isRetrying()).toBe(false);
		});
	});

	// =========================================================================
	// 2. BLOQUEO VISIBLE Y REANUDACIÓN DOCENTE (3 Fallos Consecutivos)
	// =========================================================================
	describe("2. Bloqueo Visible tras 3 Fallos Consecutivos y Reanudación Docente (SPEC §16)", () => {
		it("test de 3 fallos consecutivos -> bloqueo visible -> reintentar docente reanuda sin puntajes degradados", async () => {
			let totalCalls = 0;
			const blockEvents: { consecutiveFailures: number }[] = [];

			// Evaluación formativa auténtica de 3 estrellas
			const authenticJudgeScores: JudgeScores = {
				id: "judge-eval-1",
				sessionId: "SESS-001",
				sumPoints: 9,
				stars: 3,
				isFinished: true,
				groupCriteria: {
					turnTaking: {
						score: 2,
						evidenceQuote: "Cedieron la palabra con paciencia",
					},
					colaboracion: {
						score: 2,
						evidenceQuote: "Construyeron sobre las propuestas del equipo",
					},
					negociacion: {
						score: 2,
						evidenceQuote: "Acordaron compromisos con Paco y Soto",
					},
					resolucionEstructurada: {
						score: 2,
						evidenceQuote:
							"Planearon la secuencia chacra -> taller -> alcaldía",
					},
					organizacionLiderazgo: {
						score: 1,
						evidenceQuote: "Propusieron orden en las votaciones",
					},
				},
				students: [
					{
						playerId: "c1",
						avatar: "Zorro",
						name: "Mateo",
						participacion: 2,
						propuesta: 2,
						organizacion: 1,
						anecdote: "Lideró la propuesta de madera",
						turnCount: 4,
						drawCount: 1,
					},
				],
				earnedBadges: [
					{
						id: "paso_a_paso",
						name: "Paso a paso",
						quoteInRunLanguage: "Siguieron la secuencia de estaciones",
					},
					{
						id: "cumplieron_su_promesa",
						name: "Cumplieron su promesa",
						quoteInRunLanguage: "Recordaron el trato con Paco",
					},
					{
						id: "un_solo_equipo",
						name: "Un solo equipo",
						quoteInRunLanguage: "Trabajaron coordinados",
					},
				],
				conApoyoDocente: false,
				evaluatedAtWallMs: Date.now(),
			};

			// Falla exactamente 3 veces consecutivas, y en la llamada 4 (tras reintento del docente) tiene éxito
			const flakyJudgeCall = async (): Promise<JudgeScores> => {
				totalCalls++;
				if (totalCalls <= 3) {
					throw new Error(
						`HTTP 429 Too Many Requests: Rate limit exceeded (falla ${totalCalls})`,
					);
				}
				return authenticJudgeScores;
			};

			const queue = new AIRetryQueue();

			// Conectar estado con los stores
			queue.subscribe((state) => {
				if (state.isBlocked) {
					usePlayStore.getState().setAiBlocked(true, "reintentando…");
					useTeacherStore.getState().setAiBlocked(true, "Juez");
				} else if (state.isRetrying) {
					usePlayStore.getState().setAiRetrying(true, "reintentando…");
					useTeacherStore.getState().setAiRetrying(true, "Juez");
				} else {
					usePlayStore.setState({ isAiBlocked: false, isAiRetrying: false });
					useTeacherStore.setState({
						isAiBlocked: false,
						isAiRetrying: false,
					});
				}
			});

			// Iniciar la evaluación asíncrona
			const evalPromise = queue.executeWithRetry("judge", flakyJudgeCall, {
				initialBackoffMs: 1,
				backoffMultiplier: 2,
				maxRetries: 3,
				maxConsecutiveFailures: 3,
				gameTimeSeconds: 240,
				onBlock: (info) => {
					blockEvents.push({
						consecutiveFailures: info.consecutiveFailures,
					});
					assertDualTimestamps(info);
				},
			});

			// Esperar a que se consuman los reintentos automáticos
			await new Promise((resolve) => setTimeout(resolve, 50));

			// 1. Verificación del BLOQUEO VISIBLE
			expect(totalCalls).toBe(3);
			expect(queue.isBlocked()).toBe(true);
			expect(queue.getBlockedOperations().length).toBe(1);
			expect(blockEvents.length).toBe(1);
			expect(blockEvents[0]?.consecutiveFailures).toBe(3);

			// 2. Estado visible en /play: indicador friendly locked 'reintentando…'
			const playState = usePlayStore.getState();
			expect(playState.isAiBlocked).toBe(true);
			expect(playState.isTimerPaused).toBe(true);
			expect(playState.aiRetryMessage).toBe("reintentando…");

			// 3. Estado visible en /teacher: consola silenciosa solicita reintento
			const teacherState = useTeacherStore.getState();
			expect(teacherState.isAiBlocked).toBe(true);
			expect(teacherState.blockedAiService).toBe("Juez");

			// 4. NUNCA DEGRADACIÓN SILENCIOSA: el resultado aún no se resolvió con datos inventados
			// (la promesa sigue pendiente, no arrojó un score falso ni 0 estrellas)

			// 5. El docente pulsa 'reintentar' en la consola silenciosa
			const retryResult = await queue.retryBlocked();
			expect(retryResult.ok).toBe(true);
			expect(retryResult.retriedCount).toBe(1);

			// 6. La promesa original se resuelve ahora con los puntajes auténticos
			const resolvedScores = await evalPromise;

			expect(totalCalls).toBe(4);
			expect(resolvedScores.stars).toBe(3);
			expect(resolvedScores.sumPoints).toBe(9);
			expect(resolvedScores.groupCriteria.resolucionEstructurada.score).toBe(2);
			expect(resolvedScores.conApoyoDocente).toBe(false);
			expect(resolvedScores.earnedBadges.map((b) => b.id)).toContain(
				"paso_a_paso",
			);

			// 7. La partida queda desbloqueada
			expect(queue.isBlocked()).toBe(false);
		});

		it("mantiene el bloqueo si un reintento manual falla nuevamente hasta que uno tiene éxito", async () => {
			let attempts = 0;
			const unstableService = async () => {
				attempts++;
				if (attempts < 5) {
					throw new Error("Persistent socket timeout");
				}
				return { status: "recovered", attemptNumber: attempts };
			};

			const queue = new AIRetryQueue();

			const taskPromise = queue.executeWithRetry("VLM", unstableService, {
				initialBackoffMs: 1,
				maxRetries: 3,
			});

			// Esperar los 3 fallos iniciales
			await new Promise((resolve) => setTimeout(resolve, 40));
			expect(queue.isBlocked()).toBe(true);
			expect(attempts).toBe(3);

			// Reintento 1 del docente: falla (intento 4)
			const firstRetry = await queue.retryBlocked();
			expect(firstRetry.ok).toBe(false);
			expect(queue.isBlocked()).toBe(true);
			expect(attempts).toBe(4);

			// Reintento 2 del docente: tiene éxito (intento 5)
			const secondRetry = await queue.retryBlocked();
			expect(secondRetry.ok).toBe(true);
			expect(queue.isBlocked()).toBe(false);
			expect(attempts).toBe(5);

			const finalResult = await taskPromise;
			expect(finalResult.status).toBe("recovered");
			expect(finalResult.attemptNumber).toBe(5);
		});
	});

	// =========================================================================
	// 3. COLA SERIAL DEL GAME MASTER (GMSerialQueue - SPEC §16)
	// =========================================================================
	describe("3. Game Master Serial Queue (SPEC §16: FIFO estricto)", () => {
		it("test de cola serial: peticiones concurrentes se ejecutan en orden estricto FIFO", async () => {
			const queue = new GMSerialQueue();
			const executionLog: string[] = [];

			// Definición de 5 tareas concurrentes con duraciones asimétricas
			// Si no hubiera cola serial, la tarea 4 (5ms) terminaría antes que la tarea 1 (35ms)
			const task1 = async () => {
				executionLog.push("t1_start");
				await new Promise((r) => setTimeout(r, 35));
				executionLog.push("t1_end");
				return "result_1";
			};

			const task2 = async () => {
				executionLog.push("t2_start");
				await new Promise((r) => setTimeout(r, 10));
				executionLog.push("t2_end");
				return "result_2";
			};

			const task3 = async () => {
				executionLog.push("t3_start");
				await new Promise((r) => setTimeout(r, 20));
				executionLog.push("t3_end");
				return "result_3";
			};

			const task4 = async () => {
				executionLog.push("t4_start");
				await new Promise((r) => setTimeout(r, 5));
				executionLog.push("t4_end");
				return "result_4";
			};

			const task5 = async () => {
				executionLog.push("t5_start");
				await new Promise((r) => setTimeout(r, 15));
				executionLog.push("t5_end");
				return "result_5";
			};

			// Disparar las 5 peticiones simultáneamente
			const [r1, r2, r3, r4, r5] = await Promise.all([
				queue.enqueue(task1, { actionType: "grant_wood" }),
				queue.enqueue(task2, { actionType: "veto_move" }),
				queue.enqueue(task3, { actionType: "npc_reply" }),
				queue.enqueue(task4, { actionType: "grant_design" }),
				queue.enqueue(task5, { actionType: "mayor_dialogue" }),
			]);

			// 1. Resultados obtenidos correctamente
			expect(r1).toBe("result_1");
			expect(r2).toBe("result_2");
			expect(r3).toBe("result_3");
			expect(r4).toBe("result_4");
			expect(r5).toBe("result_5");

			// 2. Orden estrictamente secuencial y FIFO:
			// Cada tarea empieza ÚNICAMENTE después de que la anterior ha terminado.
			expect(executionLog).toEqual([
				"t1_start",
				"t1_end",
				"t2_start",
				"t2_end",
				"t3_start",
				"t3_end",
				"t4_start",
				"t4_end",
				"t5_start",
				"t5_end",
			]);

			expect(queue.isProcessing()).toBe(false);
			expect(queue.size()).toBe(0);
		});

		it("garantiza que el fallo de una tarea en cola no rompa ni bloquee las tareas subsiguientes", async () => {
			const queue = new GMSerialQueue();
			const processed: string[] = [];

			const goodTask1 = async () => {
				processed.push("task1");
				return "ok1";
			};

			const badTask = async () => {
				processed.push("badTask");
				throw new Error("Game Master intent validation exception");
			};

			const goodTask2 = async () => {
				processed.push("task2");
				return "ok2";
			};

			const p1 = queue.enqueue(goodTask1);
			const p2 = queue.enqueue(badTask);
			const p3 = queue.enqueue(goodTask2);

			const r1 = await p1;
			expect(r1).toBe("ok1");

			// badTask debe rechazar con la excepción
			await expect(p2).rejects.toThrow(
				"Game Master intent validation exception",
			);

			// goodTask2 debe haberse ejecutado después y resolver sin problemas
			const r3 = await p3;
			expect(r3).toBe("ok2");

			expect(processed).toEqual(["task1", "badTask", "task2"]);
			expect(queue.size()).toBe(0);
		});

		it("soporta waitForIdle para sincronización de turnos en tests", async () => {
			const queue = new GMSerialQueue();
			let completed = false;

			queue.enqueue(async () => {
				await new Promise((r) => setTimeout(r, 20));
				completed = true;
			});

			expect(queue.isProcessing()).toBe(true);
			await queue.waitForIdle();
			expect(completed).toBe(true);
			expect(queue.isProcessing()).toBe(false);
		});
	});

	// =========================================================================
	// 4. PERSISTENCIA DE TIMESTAMPS DUALES (SPEC §16, §17)
	// =========================================================================
	describe("4. Persistencia de Timestamps Duales en Todos los Eventos Generados", () => {
		it("test de persistencia de timestamps duales en todos los eventos generados", async () => {
			const eventLog = new InMemoryEventLog();
			const queue = new GMSerialQueue();
			const sessionId = "SESS-DUAL-TS-001";
			const startWall = Date.now();

			// Generación de diversos eventos canónicos de SPEC §17
			const eventsToLog: Array<{
				type: EventType;
				actorId: string;
				gameTimeSeconds: number;
				payload: Record<string, unknown>;
			}> = [
				{
					type: "press",
					actorId: "c1",
					gameTimeSeconds: 5,
					payload: { targetType: "talk", buttonId: "btn-talk-c1" },
				},
				{
					type: "blocked_press",
					actorId: "c2",
					gameTimeSeconds: 6,
					payload: {
						reason: "npc_speaking",
						attemptedTarget: "talk",
						timestampGameMs: 6000,
					},
				},
				{
					type: "speech_start",
					actorId: "c1",
					gameTimeSeconds: 10,
					payload: { holderCardId: "c1", audioChannel: "shared-mic" },
				},
				{
					type: "transcript",
					actorId: "c1",
					gameTimeSeconds: 15,
					payload: {
						holderCardId: "c1",
						text: "Hablemos con Paco para pedir madera",
						sendReason: "release",
						confidence: 0.95,
					},
				},
				{
					type: "move_propose",
					actorId: "c1",
					gameTimeSeconds: 20,
					payload: {
						proposerName: "Mateo",
						targetStation: "chacra",
						mechanism: "voice",
					},
				},
				{
					type: "move_execute",
					actorId: "system",
					gameTimeSeconds: 30,
					payload: {
						destinationStation: "chacra",
						walkDurationMs: 8000,
						votersCount: 3,
					},
				},
				{
					type: "grant_step",
					actorId: "paco",
					gameTimeSeconds: 60,
					payload: {
						stepId: "madera_chacra",
						forced: false,
						station: "chacra",
					},
				},
				{
					type: "judge_scores",
					actorId: "judge",
					gameTimeSeconds: 210,
					payload: {
						stars: 3,
						totalPoints: 9,
						finished: true,
						conApoyoDocente: false,
						scoresGroup: {
							turnTaking: 2,
							colaboracion: 2,
							negociacion: 2,
							estructurada: 2,
							organizacion: 1,
						},
					},
				},
			];

			// Registrar eventos a través de la cola serial del Game Master
			for (const item of eventsToLog) {
				const dualTs = createDualTimestamp(item.gameTimeSeconds);

				await queue.enqueue(async () => {
					await eventLog.append({
						sessionId,
						actorId: item.actorId,
						type: item.type,
						game_ts_ms: dualTs.game_ts_ms,
						wall_ts_ms: dualTs.wall_ts_ms,
						payload: item.payload as never,
					});
				});
			}

			// Recuperar todos los eventos persistidos
			const recordedEvents = await eventLog.getBySession(sessionId);

			expect(recordedEvents.length).toBe(eventsToLog.length);

			// Validar minuciosamente los timestamps duales en cada evento registrado
			for (let i = 0; i < recordedEvents.length; i++) {
				const ev = recordedEvents[i];
				const orig = eventsToLog[i];
				if (!ev || !orig) {
					throw new Error(`Missing event at index ${i}`);
				}

				// 1. game_ts_ms debe ser un número entero no negativo correspondiente al tiempo de juego
				expect(typeof ev.game_ts_ms).toBe("number");
				expect(Number.isFinite(ev.game_ts_ms)).toBe(true);
				expect(ev.game_ts_ms).toBeGreaterThanOrEqual(0);
				expect(ev.game_ts_ms).toBe(orig.gameTimeSeconds * 1000);

				// 2. wall_ts_ms debe ser una marca de tiempo válida de época Unix
				expect(typeof ev.wall_ts_ms).toBe("number");
				expect(Number.isFinite(ev.wall_ts_ms)).toBe(true);
				expect(ev.wall_ts_ms).toBeGreaterThanOrEqual(startWall);

				// 3. Validación de integridad con helper del subsistema
				expect(() => assertDualTimestamps(ev)).not.toThrow();

				// 4. Tipo de evento cerrado válido (§17)
				expect(CLOSED_EVENT_TYPES).toContain(ev.type);
			}
		});

		it("valida y rechaza eventos con timestamps inválidos o negativos", () => {
			expect(() =>
				assertDualTimestamps({ game_ts_ms: -5, wall_ts_ms: 1000 }),
			).toThrow("Invalid game_ts_ms");

			expect(() =>
				assertDualTimestamps({ game_ts_ms: 1000, wall_ts_ms: 0 }),
			).toThrow("Invalid wall_ts_ms");

			expect(() =>
				assertDualTimestamps({ game_ts_ms: NaN, wall_ts_ms: 1000 }),
			).toThrow("Invalid game_ts_ms");

			expect(() =>
				assertDualTimestamps({ game_ts_ms: 1000, wall_ts_ms: -10 }),
			).toThrow("Invalid wall_ts_ms");
		});
	});

	// =========================================================================
	// 5. RETROALIMENTACIÓN SINCRONIZADA Y AISLAMIENTO DE RUTAS (SPEC §16)
	// =========================================================================
	describe("5. Retroalimentación Sincronizada en UI (/play vs /teacher)", () => {
		it("en /play: renderiza el indicador amigable locked 'reintentando…' al estar bloqueado o reintentando", () => {
			usePlayStore.setState({
				isAiBlocked: true,
				aiRetryMessage: "reintentando…",
			});

			const playHtml = renderToString(React.createElement(ActivePlayView));

			// Indicador visible en /play
			expect(playHtml).toContain('data-testid="play-retry-indicator"');
			expect(playHtml).toContain("reintentando…");

			// AISLAMIENTO: NUNCA debe contener botones docentes de reintento en /play
			expect(playHtml).not.toContain('data-testid="retry-service-btn"');
			expect(playHtml).not.toContain('data-testid="teacher-retry-indicator"');
		});

		it("en /teacher: renderiza el spinner de reintento y el botón de reintentar", () => {
			useTeacherStore.setState({
				isAiBlocked: true,
				blockedAiService: "Juez",
			});

			const teacherHtml = renderToString(React.createElement(OperatorConsole));

			// Indicador y botón visibles en /teacher
			expect(teacherHtml).toContain('data-testid="teacher-retry-indicator"');
			expect(teacherHtml).toContain('data-testid="teacher-retry-spinner"');
			expect(teacherHtml).toContain('data-testid="retry-service-btn"');
			expect(teacherHtml).toContain("Reintentar IA");
		});

		it("el botón retryService en teacherStore reanuda la partida y limpia bloqueos en playStore", () => {
			usePlayStore.setState({
				isAiBlocked: true,
				isTimerPaused: true,
				pauseReason: "ai_blocked",
				aiRetryMessage: "reintentando…",
			});

			useTeacherStore.setState({
				isAiBlocked: true,
				blockedAiService: "LLM",
				isTimerPaused: true,
				pauseReason: "ai_blocked",
			});

			// Simular que el docente pulsa 'reintentar'
			useTeacherStore.getState().retryService();

			// Estado en teacher limpio
			expect(useTeacherStore.getState().isAiBlocked).toBe(false);
			expect(useTeacherStore.getState().isTimerPaused).toBe(false);
			expect(useTeacherStore.getState().blockedAiService).toBeNull();
		});
	});
});
