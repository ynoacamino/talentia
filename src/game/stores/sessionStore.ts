/**
 * TALENTIA / SocraticGuild — Document Management Zustand Stores
 * Unified export for useSessionListStore, useSessionDetailStore, and useDocenteStore.
 * Conforms to SOLID (D): stores act as reactive mirrors of ISessionRepository.
 * 0 fetch or SQLite direct calls.
 * SPEC §2, §11, §13, §17, §19 & docs/gates/F0-contrato.md.
 */

export {
	createInMemorySessionRepository,
	getDefaultSessionRepository,
	InMemoryEventLog,
	InMemorySessionRepository,
	setDefaultSessionRepository,
} from "@/game/stores/sessionRepository.ts";
export {
	type DocenteState,
	deepFreeze,
	selectEarnedBadges,
	selectGroupCriteria,
	selectStudentEvaluations,
	useDocenteStore,
} from "@/game/stores/useDocenteStore.ts";
export {
	type SessionDetailState,
	useSessionDetailStore,
} from "@/game/stores/useSessionDetailStore.ts";
export {
	type SessionListState,
	useSessionListStore,
} from "@/game/stores/useSessionListStore.ts";
