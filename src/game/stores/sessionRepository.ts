/**
 * TALENTIA / SocraticGuild — Session Repository Management
 * Dependency Inversion (SOLID D) bridge for Zustand stores.
 * Connects stores to ISessionRepository without direct fetch/SQLite calls.
 */

import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import { InMemorySessionRepository } from "@/core/storage/sessionRepo.ts";
import type { ISessionRepository } from "@/shared/documents.ts";

let defaultRepository: ISessionRepository = new InMemorySessionRepository(
	new InMemoryEventLog(),
);

/**
 * Returns the current active default session repository.
 */
export function getDefaultSessionRepository(): ISessionRepository {
	return defaultRepository;
}

/**
 * Sets the default session repository (e.g. for testing or switching implementations).
 */
export function setDefaultSessionRepository(repo: ISessionRepository): void {
	defaultRepository = repo;
}

/**
 * Creates a fresh in-memory repository instance with linked event log.
 */
export function createInMemorySessionRepository(): InMemorySessionRepository {
	return new InMemorySessionRepository(new InMemoryEventLog());
}

export { InMemoryEventLog, InMemorySessionRepository };
