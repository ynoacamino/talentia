/**
 * TALENTIA / SocraticGuild — Docente Pedagogical View Zustand Store
 * Immutable pedagogical evaluation & add-only comments following SOLID (D).
 * 0 fetch or SQLite direct calls.
 * SPEC §2, §11, §13, §17, §19 & docs/gates/F0-contrato.md.
 */

import { create } from "zustand";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import { LOCKED_STRINGS } from "@/shared/constants.ts";
import type {
	BadgeAward,
	GroupCriteriaBreakdown,
	ISessionRepository,
	JudgeScores,
	SessionComment,
	StudentEvaluation,
} from "@/shared/documents.ts";

/**
 * Deeply freezes an object graph to guarantee runtime immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}
	Object.freeze(obj);
	for (const key of Object.getOwnPropertyNames(obj)) {
		const val = (obj as Record<string, unknown>)[key];
		if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
			deepFreeze(val);
		}
	}
	return obj;
}

export interface DocenteState {
	/** Active session code for the docente view */
	readonly activeCode: string | null;
	/**
	 * Immutable Judge evaluation scores.
	 * Preserved via deepFreeze: no direct or indirect score mutation methods exist.
	 */
	readonly scores: JudgeScores | null;
	/**
	 * Strictly append-only teacher observations.
	 * No edit or delete methods exist in this contract.
	 */
	readonly comments: readonly SessionComment[];
	/** Locked string banner (§19): "señales preliminares, no notas" */
	readonly bannerNotice: string;
	readonly isLoading: boolean;
	readonly error: string | null;

	loadDocenteView: (
		code: string,
		repo?: ISessionRepository,
	) => Promise<JudgeScores | null>;
	addComment: (
		code: string,
		text: string,
		repo?: ISessionRepository,
	) => Promise<SessionComment>;
	setScores: (scores: JudgeScores, repo?: ISessionRepository) => Promise<void>;
	reset: () => void;
}

export const useDocenteStore = create<DocenteState>((set, get) => ({
	activeCode: null,
	scores: null,
	comments: [],
	bannerNotice: LOCKED_STRINGS.DOCENTE_BANNER,
	isLoading: false,
	error: null,

	loadDocenteView: async (
		code: string,
		repo?: ISessionRepository,
	): Promise<JudgeScores | null> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null, activeCode: code });
		try {
			const record = await targetRepo.getByCode(code);
			if (!record) {
				const errorMsg = `Session "${code}" not found`;
				set({
					isLoading: false,
					error: errorMsg,
					scores: null,
					comments: [],
				});
				return null;
			}

			// Ensure deep immutability on scores and comments
			const immutableScores = record.scores
				? deepFreeze(structuredClone(record.scores))
				: null;
			const immutableComments = Object.freeze(
				record.comments.map((c) => deepFreeze({ ...c })),
			);

			set({
				activeCode: code,
				scores: immutableScores,
				comments: immutableComments,
				isLoading: false,
				error: null,
			});

			return immutableScores;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load docente view";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	/**
	 * Strictly append-only comment addition.
	 * Timestamp is recorded from wall clock. No mutation or deletion allowed.
	 */
	addComment: async (
		code: string,
		text: string,
		repo?: ISessionRepository,
	): Promise<SessionComment> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		set({ isLoading: true, error: null });
		try {
			const created = await targetRepo.addComment(code, text);
			const frozenComment = deepFreeze({ ...created });
			const current = get();

			set({
				comments: Object.freeze([...current.comments, frozenComment]),
				isLoading: false,
				error: null,
			});

			return frozenComment;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to add comment";
			set({ isLoading: false, error: message });
			throw err;
		}
	},

	/**
	 * Sets immutable scores and persists them through the repository.
	 */
	setScores: async (
		scores: JudgeScores,
		repo?: ISessionRepository,
	): Promise<void> => {
		const targetRepo = repo ?? getDefaultSessionRepository();
		const currentCode = get().activeCode ?? scores.sessionId;
		await targetRepo.saveScores(currentCode, scores);
		const immutableScores = deepFreeze(structuredClone(scores));

		set({
			scores: immutableScores,
			activeCode: currentCode,
			error: null,
		});
	},

	reset: (): void => {
		set({
			activeCode: null,
			scores: null,
			comments: [],
			bannerNotice: LOCKED_STRINGS.DOCENTE_BANNER,
			isLoading: false,
			error: null,
		});
	},
}));

// ============================================================================
// CONVENIENCE PURE SELECTORS
// ============================================================================

export function selectGroupCriteria(
	state: DocenteState,
): GroupCriteriaBreakdown | null {
	return state.scores?.groupCriteria ?? null;
}

export function selectStudentEvaluations(
	state: DocenteState,
): readonly StudentEvaluation[] {
	return state.scores?.students ?? [];
}

export function selectEarnedBadges(state: DocenteState): readonly BadgeAward[] {
	return state.scores?.earnedBadges ?? [];
}
