/**
 * TALENTIA / SocraticGuild — Reliability & Chaos Resilience Subsystem (F6a)
 * Conforme a SPEC §16, §17 & docs/gates/F0-contrato.md.
 *
 * Responsabilidades:
 * 1. Mecanismo de 3x auto-retry con backoff para servicios de IA (STT, LLM, TTS, VLM, Juez).
 * 2. Retroalimentación sincronizada:
 *    - En /play: indicador amigable locked 'reintentando…' (SPEC §16).
 *    - En /teacher: indicador de reintento + botón 'reintentar'.
 * 3. Bloqueo visible si se agotan los reintentos: la partida se bloquea de forma visible
 *    (NUNCA degradación silenciosa ni scores inventados de relleno), requiriendo que el docente
 *    pulse 'reintentar' en la consola silenciosa. Al reintentar, reanuda la operación con éxito
 *    sin degradar la evaluación formativa.
 * 4. Cola Serial (GMSerialQueue): garantiza procesamiento estrictamente secuencial FIFO
 *    de peticiones del Game Master evitando condiciones de carrera.
 * 5. Marcas de tiempo duales (game_ts_ms y wall_ts_ms) en todos los eventos emitidos.
 */

import type {
	EventLogEntry,
	EventPayloadMap,
	EventType,
	IEventLogPort,
} from "@/shared/documents.ts";

export type AIServiceType =
	| "STT"
	| "LLM"
	| "TTS"
	| "VLM"
	| "judge"
	| "stt"
	| "llm"
	| "tts"
	| "vlm"
	| "Juez";

export interface DualTimestamp {
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
}

/**
 * Genera marcas de tiempo duales auditables (SPEC §16, §17).
 */
export function createDualTimestamp(gameTimeSeconds?: number): DualTimestamp {
	const wall_ts_ms = Date.now();
	const game_ts_ms =
		typeof gameTimeSeconds === "number" &&
		!Number.isNaN(gameTimeSeconds) &&
		gameTimeSeconds >= 0
			? Math.floor(gameTimeSeconds * 1000)
			: 0;

	return { game_ts_ms, wall_ts_ms };
}

/**
 * Valida que una estructura contenga marcas de tiempo duales válidas.
 */
export function assertDualTimestamps(entry: Partial<DualTimestamp>): void {
	if (
		typeof entry.game_ts_ms !== "number" ||
		Number.isNaN(entry.game_ts_ms) ||
		entry.game_ts_ms < 0
	) {
		throw new Error(
			`Invalid game_ts_ms: expected non-negative number, got ${entry.game_ts_ms}`,
		);
	}
	if (
		typeof entry.wall_ts_ms !== "number" ||
		Number.isNaN(entry.wall_ts_ms) ||
		entry.wall_ts_ms <= 0
	) {
		throw new Error(
			`Invalid wall_ts_ms: expected positive number, got ${entry.wall_ts_ms}`,
		);
	}
}

export interface RetryEventInfo {
	readonly service: AIServiceType;
	readonly attempt: number;
	readonly error: Error | string;
	readonly nextDelayMs: number;
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
}

export interface BlockEventInfo {
	readonly service: AIServiceType;
	readonly consecutiveFailures: number;
	readonly error: Error | string;
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
}

export interface SuccessEventInfo {
	readonly service: AIServiceType;
	readonly attempts: number;
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
}

export interface RetryOptions {
	readonly maxRetries?: number; // default: 3
	readonly maxConsecutiveFailures?: number; // default: 3
	readonly initialBackoffMs?: number; // default: 100
	readonly backoffMultiplier?: number; // default: 2
	readonly maxBackoffMs?: number; // default: 5000
	readonly gameTimeSeconds?: number;
	readonly onRetry?: (info: RetryEventInfo) => void;
	readonly onBlock?: (info: BlockEventInfo) => void;
	readonly onSuccess?: (info: SuccessEventInfo) => void;
}

export interface BlockedOperation {
	readonly id: string;
	readonly service: AIServiceType;
	readonly consecutiveFailures: number;
	readonly error: Error | string;
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
	executeRetry(): Promise<boolean>;
	reject(reason: Error | string): void;
}

export interface AIRetryState {
	readonly isRetrying: boolean;
	readonly isBlocked: boolean;
	readonly activeService: AIServiceType | null;
	readonly attempt: number;
	readonly consecutiveFailures: number;
	readonly lastError: Error | string | null;
	readonly blockedCount: number;
}

export type AIRetryStateListener = (state: AIRetryState) => void;

/**
 * AIRetryQueue — Gestor de Reintentos de IA con Backoff y Bloqueo Visible (SPEC §16)
 */
export class AIRetryQueue {
	private isRetryingState = false;
	private isBlockedState = false;
	private activeServiceState: AIServiceType | null = null;
	private attemptState = 0;
	private consecutiveFailuresState = 0;
	private lastErrorState: Error | string | null = null;
	private blockedQueue: BlockedOperation[] = [];
	private listeners = new Set<AIRetryStateListener>();

	/**
	 * Ejecuta una operación de servicio de IA con 3x auto-retry, backoff exponencial
	 * y bloqueo visible si se agotan los reintentos.
	 */
	async executeWithRetry<T>(
		service: AIServiceType,
		operation: () => Promise<T>,
		options?: RetryOptions,
	): Promise<T> {
		const maxRetries = options?.maxRetries ?? 3;
		const effectiveMaxFailures = options?.maxConsecutiveFailures ?? maxRetries;
		const initialBackoffMs = options?.initialBackoffMs ?? 100;
		const backoffMultiplier = options?.backoffMultiplier ?? 2;
		const maxBackoffMs = options?.maxBackoffMs ?? 5000;

		let failures = 0;

		while (failures < effectiveMaxFailures) {
			try {
				const result = await operation();

				// Éxito
				const dualTs = createDualTimestamp(options?.gameTimeSeconds);
				options?.onSuccess?.({
					service,
					attempts: failures + 1,
					game_ts_ms: dualTs.game_ts_ms,
					wall_ts_ms: dualTs.wall_ts_ms,
				});

				this.updateState({
					isRetrying: false,
					isBlocked: this.blockedQueue.length > 0,
					activeService:
						this.blockedQueue.length > 0 ? this.activeServiceState : null,
					attempt: 0,
					consecutiveFailures: 0,
					lastError: null,
				});

				return result;
			} catch (error) {
				failures++;
				const errObj =
					error instanceof Error ? error : new Error(String(error));
				const dualTs = createDualTimestamp(options?.gameTimeSeconds);
				this.lastErrorState = errObj;

				if (failures < effectiveMaxFailures) {
					// Auto-retry con backoff
					const delay = Math.min(
						maxBackoffMs,
						initialBackoffMs * backoffMultiplier ** (failures - 1),
					);

					this.updateState({
						isRetrying: true,
						isBlocked: false,
						activeService: service,
						attempt: failures,
						consecutiveFailures: failures,
						lastError: errObj,
					});

					options?.onRetry?.({
						service,
						attempt: failures,
						error: errObj,
						nextDelayMs: delay,
						game_ts_ms: dualTs.game_ts_ms,
						wall_ts_ms: dualTs.wall_ts_ms,
					});

					if (delay > 0) {
						await new Promise((resolve) => setTimeout(resolve, delay));
					}
				} else {
					// Agotados los reintentos automáticos -> BLOQUEO VISIBLE
					this.updateState({
						isRetrying: false,
						isBlocked: true,
						activeService: service,
						attempt: failures,
						consecutiveFailures: failures,
						lastError: errObj,
					});

					options?.onBlock?.({
						service,
						consecutiveFailures: failures,
						error: errObj,
						game_ts_ms: dualTs.game_ts_ms,
						wall_ts_ms: dualTs.wall_ts_ms,
					});

					// Queda pendiente esperando que el docente pulse 'reintentar' en la consola
					return new Promise<T>((resolve, reject) => {
						const blockedOp: BlockedOperation = {
							id: crypto.randomUUID(),
							service,
							consecutiveFailures: failures,
							error: errObj,
							game_ts_ms: dualTs.game_ts_ms,
							wall_ts_ms: dualTs.wall_ts_ms,
							executeRetry: async () => {
								try {
									const retryResult = await operation();
									const retryTs = createDualTimestamp(options?.gameTimeSeconds);
									options?.onSuccess?.({
										service,
										attempts: failures + 1,
										game_ts_ms: retryTs.game_ts_ms,
										wall_ts_ms: retryTs.wall_ts_ms,
									});
									resolve(retryResult);
									return true;
								} catch (err) {
									const retryErr =
										err instanceof Error ? err : new Error(String(err));
									failures++;
									this.updateState({
										isRetrying: false,
										isBlocked: true,
										activeService: service,
										consecutiveFailures: failures,
										lastError: retryErr,
									});
									return false;
								}
							},
							reject: (reason) => {
								reject(typeof reason === "string" ? new Error(reason) : reason);
							},
						};

						this.blockedQueue.push(blockedOp);
						this.emitState();
					});
				}
			}
		}

		// Fallback de seguridad tipada (inaccesible por el loop)
		throw new Error(
			`[AIRetryQueue] Inesperado fin de ciclo para servicio ${service}`,
		);
	}

	/**
	 * Reanuda las operaciones bloqueadas cuando el docente pulsa 'reintentar'.
	 * Garantiza que se devuelva el resultado real sin degradación de evaluación.
	 */
	async retryBlocked(): Promise<{ ok: boolean; retriedCount: number }> {
		if (this.blockedQueue.length === 0) {
			this.updateState({
				isRetrying: false,
				isBlocked: false,
				activeService: null,
				attempt: 0,
				consecutiveFailures: 0,
				lastError: null,
			});
			return { ok: true, retriedCount: 0 };
		}

		const ops = [...this.blockedQueue];
		this.blockedQueue = [];
		let successCount = 0;

		for (const blockedOp of ops) {
			const success = await blockedOp.executeRetry();
			if (success) {
				successCount++;
			} else {
				this.blockedQueue.push(blockedOp);
			}
		}

		if (this.blockedQueue.length === 0) {
			this.updateState({
				isRetrying: false,
				isBlocked: false,
				activeService: null,
				attempt: 0,
				consecutiveFailures: 0,
				lastError: null,
			});
		}

		return { ok: successCount > 0, retriedCount: successCount };
	}

	getState(): AIRetryState {
		return {
			isRetrying: this.isRetryingState,
			isBlocked: this.isBlockedState,
			activeService: this.activeServiceState,
			attempt: this.attemptState,
			consecutiveFailures: this.consecutiveFailuresState,
			lastError: this.lastErrorState,
			blockedCount: this.blockedQueue.length,
		};
	}

	subscribe(listener: AIRetryStateListener): () => void {
		this.listeners.add(listener);
		listener(this.getState());
		return () => {
			this.listeners.delete(listener);
		};
	}

	getBlockedOperations(): readonly BlockedOperation[] {
		return [...this.blockedQueue];
	}

	isBlocked(): boolean {
		return this.isBlockedState || this.blockedQueue.length > 0;
	}

	isRetrying(): boolean {
		return this.isRetryingState;
	}

	clear(reason = "Queue cleared"): void {
		const pending = [...this.blockedQueue];
		this.blockedQueue = [];
		for (const op of pending) {
			op.reject(new Error(reason));
		}
		this.updateState({
			isRetrying: false,
			isBlocked: false,
			activeService: null,
			attempt: 0,
			consecutiveFailures: 0,
			lastError: null,
		});
	}

	private updateState(updates: Partial<AIRetryState>): void {
		if (updates.isRetrying !== undefined)
			this.isRetryingState = updates.isRetrying;
		if (updates.isBlocked !== undefined)
			this.isBlockedState = updates.isBlocked;
		if (updates.activeService !== undefined)
			this.activeServiceState = updates.activeService;
		if (updates.attempt !== undefined) this.attemptState = updates.attempt;
		if (updates.consecutiveFailures !== undefined)
			this.consecutiveFailuresState = updates.consecutiveFailures;
		if (updates.lastError !== undefined)
			this.lastErrorState = updates.lastError;
		this.emitState();
	}

	private emitState(): void {
		const snapshot = this.getState();
		for (const listener of this.listeners) {
			try {
				listener(snapshot);
			} catch (e) {
				console.error("[AIRetryQueue] Listener error:", e);
			}
		}
	}
}

export const defaultAIRetryQueue = new AIRetryQueue();

export function getAIRetryQueue(): AIRetryQueue {
	return defaultAIRetryQueue;
}

export async function executeWithRetry<T>(
	service: AIServiceType,
	operation: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	return defaultAIRetryQueue.executeWithRetry(service, operation, options);
}

// ============================================================================
// COLA SERIAL (Game Master Serial Queue - GMSerialQueue)
// ============================================================================

export type GMTaskMetaScalar = string | number | boolean | null | undefined;

export interface GMTaskMetadata {
	readonly id?: string;
	readonly actorId?: string;
	readonly actionType?: string;
	readonly game_ts_ms?: number;
	readonly wall_ts_ms?: number;
	readonly [key: string]: GMTaskMetaScalar;
}

export interface GMTaskEntry {
	readonly id: string;
	readonly metadata?: GMTaskMetadata;
	readonly enqueuedAtWallMs: number;
	readonly enqueuedAtGameMs: number;
	run(): Promise<void>;
	reject(reason: Error | string): void;
}

export interface GMSerialQueueOptions {
	readonly onTaskStart?: (info: {
		id: string;
		metadata?: GMTaskMetadata;
		game_ts_ms: number;
		wall_ts_ms: number;
	}) => void;
	readonly onTaskComplete?: (info: {
		id: string;
		durationMs: number;
		error?: Error | string;
		game_ts_ms: number;
		wall_ts_ms: number;
	}) => void;
}

/**
 * GMSerialQueue — Cola Serial para el Game Master (SPEC §16)
 * Garantiza que todas las peticiones, turnos y validaciones del Game Master se procesen
 * estrictamente en orden secuencial FIFO, eliminando condiciones de carrera.
 */
export class GMSerialQueue {
	private queue: GMTaskEntry[] = [];
	private activeTask: GMTaskEntry | null = null;
	private idleWaiters: Array<() => void> = [];
	private options: GMSerialQueueOptions;

	constructor(options: GMSerialQueueOptions = {}) {
		this.options = options;
	}

	/**
	 * Encola una tarea del Game Master. Se garantiza que la tarea solo comenzará
	 * una vez que todas las tareas encoladas con anterioridad hayan finalizado por completo.
	 */
	enqueue<T>(task: () => Promise<T>, metadata?: GMTaskMetadata): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const wallTs = Date.now();
			const gameTs =
				typeof metadata?.game_ts_ms === "number" &&
				!Number.isNaN(metadata.game_ts_ms) &&
				metadata.game_ts_ms >= 0
					? metadata.game_ts_ms
					: 0;
			const taskId = metadata?.id ?? crypto.randomUUID();

			const entry: GMTaskEntry = {
				id: taskId,
				metadata: {
					...metadata,
					game_ts_ms: gameTs,
					wall_ts_ms: wallTs,
				},
				enqueuedAtWallMs: wallTs,
				enqueuedAtGameMs: gameTs,
				run: async () => {
					this.options.onTaskStart?.({
						id: taskId,
						metadata,
						game_ts_ms: gameTs,
						wall_ts_ms: wallTs,
					});

					const startTime = Date.now();
					try {
						const result = await task();
						this.options.onTaskComplete?.({
							id: taskId,
							durationMs: Date.now() - startTime,
							game_ts_ms: gameTs,
							wall_ts_ms: Date.now(),
						});
						resolve(result);
					} catch (error) {
						const errObj =
							error instanceof Error ? error : new Error(String(error));
						this.options.onTaskComplete?.({
							id: taskId,
							durationMs: Date.now() - startTime,
							error: errObj,
							game_ts_ms: gameTs,
							wall_ts_ms: Date.now(),
						});
						reject(errObj);
					}
				},
				reject: (reason) => {
					reject(typeof reason === "string" ? new Error(reason) : reason);
				},
			};

			this.queue.push(entry);
			this.processNext();
		});
	}

	/**
	 * Encola una tarea y registra automáticamente el evento en el log con marcas de tiempo duales.
	 */
	async enqueueWithEvent<T, E extends EventType = EventType>(
		eventLog: IEventLogPort,
		sessionId: string,
		eventType: E,
		actorId: string,
		task: () => Promise<T>,
		getPayload: (result: T) => EventPayloadMap[E],
		metadata?: GMTaskMetadata,
	): Promise<{ result: T; event: EventLogEntry<E> }> {
		return this.enqueue(async () => {
			const startWall = Date.now();
			const gameTs = metadata?.game_ts_ms ?? 0;
			const result = await task();

			const event = await eventLog.append({
				sessionId,
				actorId,
				type: eventType,
				game_ts_ms: gameTs,
				wall_ts_ms: startWall,
				payload: getPayload(result),
			});

			return { result, event };
		}, metadata);
	}

	private async processNext(): Promise<void> {
		if (this.activeTask !== null || this.queue.length === 0) {
			if (this.activeTask === null && this.queue.length === 0) {
				const waiters = [...this.idleWaiters];
				this.idleWaiters = [];
				for (const w of waiters) {
					try {
						w();
					} catch (e) {
						console.error("[GMSerialQueue] Idle waiter error:", e);
					}
				}
			}
			return;
		}

		const next = this.queue.shift();
		if (!next) return;

		this.activeTask = next;

		try {
			await next.run();
		} finally {
			this.activeTask = null;
			this.processNext();
		}
	}

	size(): number {
		return this.queue.length + (this.activeTask ? 1 : 0);
	}

	pendingCount(): number {
		return this.queue.length;
	}

	isProcessing(): boolean {
		return this.activeTask !== null;
	}

	waitForIdle(): Promise<void> {
		if (this.queue.length === 0 && this.activeTask === null) {
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			this.idleWaiters.push(resolve);
		});
	}

	clear(reason = "Queue cleared"): void {
		const pending = [...this.queue];
		this.queue = [];
		for (const entry of pending) {
			entry.reject(new Error(reason));
		}
	}
}

export const defaultGMSerialQueue = new GMSerialQueue();

export function getGMSerialQueue(): GMSerialQueue {
	return defaultGMSerialQueue;
}
