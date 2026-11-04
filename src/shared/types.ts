export type Vec3 = { x: number; y: number; z: number };

export type PlayerConfig = {
	name: string;
	color: string;
};

export type GameConfig = {
	boardId: string;
	lapsToWin: number;
	players: PlayerConfig[];
};

export type MatchPhase = "lobby" | "roll" | "move" | "event" | "gameover";

// ============================================================================
// DOMAIN TYPES FROM SPEC.md & F0-contrato.md (Re-exported from documents.ts)
// ============================================================================

export type {
	AvatarSpecies,
	BadgeAward,
	BadgeId,
	ChecklistStatus,
	ChecklistStep,
	ChecklistStepId,
	CriterionScore,
	DrawingColor,
	DrawPoint,
	DrawStroke,
	DrawSubmission,
	EventLogEntry,
	EventPayloadMap,
	EventType,
	GroupCriteriaBreakdown,
	GroupCriterionEvaluation,
	HintTier,
	IEventLogPort,
	IJudgeService,
	InventoryItemId,
	ISessionRepository,
	JudgeEvaluationContext,
	JudgeScores,
	Language,
	PlayerCard,
	PlayerCardStatus,
	SendReason,
	SessionComment,
	SessionConfig,
	SessionRecord,
	SessionStatus,
	SessionSummary,
	SharedInventory,
	StarRating,
	StationId,
	StudentEvaluation,
	TranscriptTurn,
	VisionRead,
} from "@/shared/documents.ts";
