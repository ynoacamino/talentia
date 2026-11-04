/**
 * TALENTIA / SocraticGuild — Session Detail Zustand Store
 * Reactive mirror of the active or inspected SessionRecord following SOLID (D).
 * 0 fetch or SQLite direct calls.
 * SPEC §2, §11, §12, §13, §17 & docs/gates/F0-contrato.md.
 */

import { create } from "zustand";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import type {
	DrawSubmission,
	ISessionRepository,
	SessionRecord,
	SessionStatus,
	TranscriptTurn,
} from "@/shared/documents.ts";

export interface SessionDetailState {
	readonly activeSession: SessionRecord | null;
	readonly isLoading: boolean;
	readonly error: string | null;

	loadSession: (
		code: string,
		repo?: ISessionRepository,
	) => Promise<SessionRecord | null>;
	setActiveSession: (session: SessionRecord | null) => void;
	syncFromRecord: (session: SessionRecord) => void;
	updateStatus: (
		status: SessionStatus,
		repo?: ISessionRepository,
	) => Promise<void>;
	addTranscriptTurn: (turn: TranscriptTurn) => void;
	addDrawingSubmission: (drawing: DrawSubmission) => void;
	clear: () => void;
	reset: () => void;
}

export const useSessionDetailStore = create<SessionDetailState>((set, get) => ({
	activeSession: null,
	isLoading: false,
	error: null,

	loadSession: async (
		code: string,
		repo?: ISessionRepository,
	): Promise<SessionRecord | null> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null });
		try {
			const found = await targetRepo.getByCode(code);
			set({
				activeSession: found,
				isLoading: false,
				error: found ? null : `Session "${code}" not found`,
			});
			return found;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load session detail";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	setActiveSession: (session: SessionRecord | null): void => {
		set({ activeSession: session, error: null });
	},

	syncFromRecord: (session: SessionRecord): void => {
		set({ activeSession: { ...session }, error: null });
	},

	updateStatus: async (
		status: SessionStatus,
		repo?: ISessionRepository,
	): Promise<void> => {
		const current = get().activeSession;
		if (!current) {
			throw new Error("No active session to update status");
		}
		const targetRepo = repo ?? getDefaultSessionRepository();
		await targetRepo.updateStatus(current.code, status);
		const refreshed = await targetRepo.getByCode(current.code);
		if (refreshed) {
			set({ activeSession: refreshed });
		} else {
			set({
				activeSession: {
					...current,
					status,
					updatedAtWallMs: Date.now(),
				},
			});
		}
	},

	addTranscriptTurn: (turn: TranscriptTurn): void => {
		const current = get().activeSession;
		if (!current) {
			return;
		}
		set({
			activeSession: {
				...current,
				transcripts: [...current.transcripts, turn],
				updatedAtWallMs: Date.now(),
			},
		});
	},

	addDrawingSubmission: (drawing: DrawSubmission): void => {
		const current = get().activeSession;
		if (!current) {
			return;
		}
		set({
			activeSession: {
				...current,
				drawings: [...current.drawings, drawing],
				updatedAtWallMs: Date.now(),
			},
		});
	},

	clear: (): void => {
		set({
			activeSession: null,
			isLoading: false,
			error: null,
		});
	},

	reset: (): void => {
		set({
			activeSession: null,
			isLoading: false,
			error: null,
		});
	},
}));
