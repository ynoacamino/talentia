/**
 * TALENTIA / SocraticGuild — In-Memory Event Log Implementation
 * Closed 18-event telemetry log with dual timestamps (game_ts_ms, wall_ts_ms).
 * SPEC §17 & docs/gates/F0-contrato.md.
 */

import {
	CLOSED_EVENT_TYPES,
	type EventLogEntry,
	type EventType,
	type IEventLogPort,
} from "@/shared/documents.ts";

export class InMemoryEventLog implements IEventLogPort {
	private readonly entries: EventLogEntry[] = [];

	/**
	 * Appends a new typed event to the log.
	 * Generates a unique UUID and validates closed event types and dual timestamps.
	 */
	async append<T extends EventType>(
		entry: Omit<EventLogEntry<T>, "id">,
	): Promise<EventLogEntry<T>> {
		if (
			!entry ||
			typeof entry.type !== "string" ||
			!CLOSED_EVENT_TYPES.includes(entry.type)
		) {
			throw new Error(`Invalid or disallowed event type: "${entry?.type}"`);
		}

		if (
			typeof entry.game_ts_ms !== "number" ||
			Number.isNaN(entry.game_ts_ms) ||
			entry.game_ts_ms < 0
		) {
			throw new Error(
				`Invalid game_ts_ms: must be a non-negative number, got ${entry.game_ts_ms}`,
			);
		}

		if (
			typeof entry.wall_ts_ms !== "number" ||
			Number.isNaN(entry.wall_ts_ms) ||
			entry.wall_ts_ms <= 0
		) {
			throw new Error(
				`Invalid wall_ts_ms: must be a positive timestamp, got ${entry.wall_ts_ms}`,
			);
		}

		if (!entry.sessionId || entry.sessionId.trim().length === 0) {
			throw new Error("Missing sessionId: cannot log event without a session");
		}

		if (!entry.actorId || entry.actorId.trim().length === 0) {
			throw new Error("Missing actorId: cannot log event without an actor");
		}

		const created: EventLogEntry<T> = {
			...entry,
			id: crypto.randomUUID(),
		};

		this.entries.push(created as EventLogEntry);

		return { ...created };
	}

	/**
	 * Returns all events for a given session in insertion (append-only) order.
	 */
	async getBySession(sessionId: string): Promise<EventLogEntry[]> {
		return this.entries
			.filter((e) => e.sessionId === sessionId)
			.map((e) => ({ ...e }));
	}

	/**
	 * Completely deletes all events associated with a session.
	 * Part of cascade hard-delete for Ley 29733 compliance.
	 */
	async deleteBySession(sessionId: string): Promise<void> {
		const remaining = this.entries.filter((e) => e.sessionId !== sessionId);
		this.entries.length = 0;
		this.entries.push(...remaining);
	}

	/**
	 * Returns total count of events across all sessions (telemetry helper).
	 */
	count(): number {
		return this.entries.length;
	}

	/**
	 * Returns a snapshot of all events in the store.
	 */
	getAll(): readonly EventLogEntry[] {
		return this.entries.map((e) => ({ ...e }));
	}

	/**
	 * Resets storage (testing helper).
	 */
	clear(): void {
		this.entries.length = 0;
	}
}
