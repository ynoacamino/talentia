/**
 * TALENTIA / SocraticGuild — Real-Time Session Synchronization Channel
 * Conforme a SPEC §2, §3 & F0-contrato.md:
 * - Canal bidireccional en tiempo real entre pestañas (/play y /teacher).
 * - Utiliza BroadcastChannel("talentia-sync-" + code) de acuerdo con los requerimientos de F3a.
 * - Sincroniza estado de sesión, reclamo de tarjetas, confirmación individual ✓,
 *   cuenta regresiva automática (5s), force-start docente (3s) y dropout (retirar alumno).
 */

import type { Language, SessionStatus } from "@/shared/documents.ts";

export interface PlayerCardSync {
	readonly slotIndex: number;
	readonly cardId: string;
	readonly playerId: string;
	readonly avatarId: string;
	readonly studentName: string; // Max 10 chars
	readonly isConfirmed: boolean;
	readonly isRetired: boolean;
	readonly retiredAt?: string; // "mm:ss"
	readonly turnsCount: number;
	readonly drawsCount: number;
	readonly status: string;
}

export type SyncMessage =
	| {
			readonly type: "SESSION_STATE_REQUEST";
			readonly sender: "play" | "teacher";
	  }
	| {
			readonly type: "SESSION_STATE_SYNC";
			readonly payload: {
				readonly code: string;
				readonly language: Language;
				readonly expectedPlayers: number;
				readonly durationMinutes: number;
				readonly status: SessionStatus;
				readonly isConfigLocked: boolean;
				readonly cards: readonly PlayerCardSync[];
				readonly countdownSeconds?: number;
				readonly countdownReason?: "all_ready" | "force_start";
			};
	  }
	| {
			readonly type: "SESSION_JOINED";
			readonly sender: "play" | "teacher";
			readonly code: string;
	  }
	| {
			readonly type: "CARD_UPDATED";
			readonly slotIndex: number;
			readonly card: Partial<PlayerCardSync>;
	  }
	| {
			readonly type: "CARD_CONFIRMED";
			readonly slotIndex: number;
			readonly avatarId: string;
			readonly studentName: string;
			readonly confirmed: boolean;
	  }
	| {
			readonly type: "COUNTDOWN_START";
			readonly seconds: number;
			readonly reason: "all_ready" | "force_start";
	  }
	| {
			readonly type: "COUNTDOWN_CANCEL";
			readonly slotIndex: number;
	  }
	| {
			readonly type: "COUNTDOWN_TICK";
			readonly seconds: number;
	  }
	| {
			readonly type: "FORCE_START";
			readonly confirmedCount: number;
			readonly remainingSlots: readonly number[];
			readonly seconds: number;
	  }
	| {
			readonly type: "GAME_START";
			readonly phase: "intro" | "playing";
	  }
	| {
			readonly type: "RETIRE_STUDENT";
			readonly studentId: string;
			readonly slotIndex: number;
			readonly retiredAt: string;
	  }
	| {
			readonly type: "CONFIG_LOCKED";
	  };

export interface SessionSyncBus {
	readonly code: string;
	readonly channelName: string;
	send(message: SyncMessage): void;
	subscribe(listener: (message: SyncMessage) => void): () => void;
	close(): void;
}

// In-memory fallback bus for environments without BroadcastChannel or custom isolated testing
const memoryBuses = new Map<string, Set<(msg: SyncMessage) => void>>();

export interface SessionSyncOptions {
	readonly forceMemoryBus?: boolean;
}

/**
 * Creates or attaches to a synchronized communication channel between /play and /teacher
 * using BroadcastChannel("talentia-sync-" + code) with an in-memory fallback.
 */
export function createSessionSyncBus(
	code: string,
	listenerOrOptions?: ((message: SyncMessage) => void) | SessionSyncOptions,
	optionsArg?: SessionSyncOptions,
): SessionSyncBus {
	const canonicalCode = code.toUpperCase();
	const channelName = `talentia-sync-${canonicalCode}`;

	const initialListener =
		typeof listenerOrOptions === "function" ? listenerOrOptions : undefined;
	const options =
		typeof listenerOrOptions === "object" && listenerOrOptions !== null
			? listenerOrOptions
			: optionsArg;

	const subscribers = new Set<(message: SyncMessage) => void>();
	if (initialListener) {
		subscribers.add(initialListener);
	}

	let bc: BroadcastChannel | null = null;
	const useMemoryOnly = options?.forceMemoryBus === true;

	if (!useMemoryOnly && typeof BroadcastChannel !== "undefined") {
		try {
			bc = new BroadcastChannel(channelName);
			bc.onmessage = (event: MessageEvent<SyncMessage>) => {
				const data = event.data;
				if (data && typeof data === "object" && "type" in data) {
					for (const sub of subscribers) {
						try {
							sub(data);
						} catch (err) {
							console.error(
								`[SessionSync:${channelName}] Subscriber error:`,
								err,
							);
						}
					}
				}
			};
		} catch (e) {
			console.warn(
				`[SessionSync] BroadcastChannel unavailable, using in-memory bus:`,
				e,
			);
			bc = null;
		}
	}

	// Register memory bus listener as fallback or when forced
	let memoryDispatcher: ((msg: SyncMessage) => void) | null = null;
	if (!bc) {
		let memorySet = memoryBuses.get(channelName);
		if (!memorySet) {
			memorySet = new Set();
			memoryBuses.set(channelName, memorySet);
		}

		memoryDispatcher = (msg: SyncMessage) => {
			for (const sub of subscribers) {
				try {
					sub(msg);
				} catch (err) {
					console.error(`[SessionSync:${channelName}] Dispatch error:`, err);
				}
			}
		};
		memorySet.add(memoryDispatcher);
	}

	return {
		code: canonicalCode,
		channelName,

		send(message: SyncMessage): void {
			// If native BroadcastChannel is active, broadcast through it
			if (bc) {
				try {
					bc.postMessage(message);
					return;
				} catch (err) {
					console.error(`[SessionSync:${channelName}] Broadcast error:`, err);
				}
			}

			// In-memory fallback dispatch to other bus instances on the same channel
			const currentMemorySet = memoryBuses.get(channelName);
			if (currentMemorySet) {
				for (const dispatcher of currentMemorySet) {
					if (dispatcher !== memoryDispatcher) {
						dispatcher(message);
					}
				}
			}
		},

		subscribe(listener: (message: SyncMessage) => void): () => void {
			subscribers.add(listener);
			return () => {
				subscribers.delete(listener);
			};
		},

		close(): void {
			subscribers.clear();
			if (bc) {
				try {
					bc.close();
				} catch {
					// Ignore close errors
				}
				bc = null;
			}
			if (memoryDispatcher) {
				const currentSet = memoryBuses.get(channelName);
				if (currentSet) {
					currentSet.delete(memoryDispatcher);
					if (currentSet.size === 0) {
						memoryBuses.delete(channelName);
					}
				}
				memoryDispatcher = null;
			}
		},
	};
}

/**
 * Resets all in-memory synchronization buses (testing helper).
 */
export function resetAllSyncBuses(): void {
	memoryBuses.clear();
}
