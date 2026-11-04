/**
 * TALENTIA / SocraticGuild — Session List Zustand Store
 * Reactive mirror of ISessionRepository.listPast() following SOLID (D).
 * 0 fetch or SQLite direct calls.
 * SPEC §2, §11, §13 & docs/gates/F0-contrato.md.
 */

import { create } from "zustand";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import type {
	ISessionRepository,
	SessionConfig,
	SessionRecord,
	SessionSummary,
} from "@/shared/documents.ts";

export interface SessionListState {
	readonly sessions: readonly SessionSummary[];
	readonly selectedCode: string | null;
	readonly isLoading: boolean;
	readonly error: string | null;

	loadSessions: (repo?: ISessionRepository) => Promise<SessionSummary[]>;
	createSession: (
		config: SessionConfig,
		repo?: ISessionRepository,
	) => Promise<SessionRecord>;
	hardDeleteSession: (
		code: string,
		repo?: ISessionRepository,
	) => Promise<boolean>;
	selectSession: (code: string | null) => void;
	reset: () => void;
}

export const useSessionListStore = create<SessionListState>((set, get) => ({
	sessions: [],
	selectedCode: null,
	isLoading: false,
	error: null,

	loadSessions: async (
		repo?: ISessionRepository,
	): Promise<SessionSummary[]> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null });
		try {
			const list = await targetRepo.listPast();
			set({ sessions: list, isLoading: false, error: null });
			return list;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load sessions";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	createSession: async (
		config: SessionConfig,
		repo?: ISessionRepository,
	): Promise<SessionRecord> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null });
		try {
			const created = await targetRepo.create(config);
			const list = await targetRepo.listPast();
			set({
				sessions: list,
				selectedCode: created.code,
				isLoading: false,
				error: null,
			});
			return created;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to create session";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	hardDeleteSession: async (
		code: string,
		repo?: ISessionRepository,
	): Promise<boolean> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null });
		try {
			const deleted = await targetRepo.hardDelete(code);
			if (deleted) {
				const current = get();
				set({
					sessions: current.sessions.filter((s) => s.code !== code),
					selectedCode:
						current.selectedCode === code ? null : current.selectedCode,
					isLoading: false,
					error: null,
				});
			} else {
				set({ isLoading: false });
			}
			return deleted;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete session";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	selectSession: (code: string | null): void => {
		set({ selectedCode: code });
	},

	reset: (): void => {
		set({
			sessions: [],
			selectedCode: null,
			isLoading: false,
			error: null,
		});
	},
}));
