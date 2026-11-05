/**
 * TALENTIA / SocraticGuild — Domain Type Definitions & Contracts
 * Documento contractual para D1–D7 bajo SPEC.md & F0-contrato.md (FINAL).
 *
 * Directivas obligatorias:
 * - 0 any, 0 unknown.
 * - 100% readonly en propiedades de inmutabilidad.
 * - Log cerrado de 18 tipos de eventos con doble timestamp (game_ts_ms, wall_ts_ms).
 * - Puertos del dominio: ISessionRepository, IEventLogPort, IJudgeService.
 */

// ============================================================================
// 1. TIPOS PRIMITIVOS Y ENUMS LITERALES
// ============================================================================

export type Language = "ES" | "EN" | "QUZ";

export type AvatarSpecies =
	| "Zorro"
	| "Búho"
	| "Rana"
	| "Gato"
	| "Llama"
	| "Tucán"
	| "Ratón"
	| "Tortuga";

export type StationId =
	| "campamento"
	| "chacra"
	| "taller"
	| "alcaldía"
	| "puente";

export type InventoryItemId = "madera" | "plano" | "sello";

export type ChecklistStepId =
	| "conseguir_madera"
	| "aprobar_diseno"
	| "permiso_alcaldia";

export type ChecklistStatus = "todo" | "active" | "done";

export type PlayerCardStatus =
	| "idle"
	| "recording"
	| "locked"
	| "other_speaking"
	| "drawing"
	| "npc_speaking"
	| "walking"
	| "retired";

export type SendReason = "release" | "silence" | "autocut";

export type HintTier = "L1" | "L2" | "L3";

export type CriterionScore = 0 | 1 | 2;

export type StarRating = 1 | 2 | 3;

export type BadgeId =
	| "paso_a_paso"
	| "cumplieron_su_promesa"
	| "un_solo_equipo"
	| "se_turnaron"
	| "se_organizaron";

export type SessionStatus =
	| "created"
	| "claim"
	| "countdown"
	| "intro"
	| "playing"
	| "paused"
	| "finished"
	| "expired"
	| "deleted";

export type DrawingColor = "negro" | "rojo" | "azul" | "verde" | "amarillo";

// ============================================================================
// 2. CONFIGURACIÓN Y ESTADO DE SESIÓN
// ============================================================================

export interface SessionConfig {
	/** Idioma monoglota fijado al inicio (ES | EN | QUZ) */
	readonly language: Language;
	/** Cantidad de jugadores esperados: 3 a 6 */
	readonly expectedPlayers: number;
	/** Duración de la partida en minutos (5 a 40, paso de 5 min) */
	readonly durationMinutes: number;
	/** Duración de la partida en milisegundos de tiempo de juego (ej. 300000 para 5 min) */
	readonly durationGameMs: number;
	/** Marca de tiempo de reloj de pared de creación (ms Unix) */
	readonly createdAtWallMs: number;
	/** Bandera de bloqueo. Al iniciar queda bloqueada permanentemente */
	readonly locked: boolean;
}

export interface PlayerCard {
	readonly slotIndex: number;
	readonly playerId: string;
	readonly avatar: AvatarSpecies;
	readonly name: string; // Máximo 10 caracteres
	readonly confirmed: boolean;
	readonly retired: boolean;
	readonly retiredGameTsMs: number | null;
	readonly lastActiveWallMs: number;
	readonly turnCount: number;
	readonly drawCount: number;
}

export interface SharedInventory {
	readonly madera: boolean;
	readonly plano: boolean;
	readonly sello: boolean;
}

export interface ChecklistStep {
	readonly stepNumber: 1 | 2 | 3;
	readonly id: ChecklistStepId;
	readonly station: StationId;
	readonly status: ChecklistStatus;
	readonly forced: boolean;
}

// ============================================================================
// 3. DIBUJO Y LECTURA DE VISIÓN (VLM)
// ============================================================================

export interface DrawPoint {
	readonly x: number;
	readonly y: number;
	readonly timeOffsetMs: number;
}

export interface DrawStroke {
	readonly color: DrawingColor;
	readonly brushSize: number;
	readonly points: readonly DrawPoint[];
}

export interface VisionRead {
	readonly objects: readonly string[];
	readonly actions: readonly string[];
	readonly measures: readonly string[];
	readonly routes: readonly string[];
	readonly labelsOrMarks: readonly string[];
	readonly confidence: Readonly<Record<string, number>>;
	readonly rawResponse: string;
}

export interface DrawSubmission {
	readonly id: string;
	readonly stationId: StationId;
	readonly playerId: string;
	readonly strokes: readonly DrawStroke[];
	readonly imageJpegBase64: string; // JPEG comprimido <= 1024px
	readonly thumbBase64: string; // Miniatura para reporte
	readonly gameTsMs: number;
	readonly wallTsMs: number;
	readonly visionRead: VisionRead | null;
}

// ============================================================================
// 4. TRANSCRIPCIONES DIARIZADAS
// ============================================================================

export interface TranscriptTurn {
	readonly id: string;
	readonly turnIndex: number;
	readonly holderPlayerId: string;
	readonly audioDurationMs: number;
	readonly sendReason: SendReason;
	readonly rawText: string;
	readonly paraphraseEs: string;
	readonly suspectedOverlap: boolean;
	readonly gameTsMs: number;
	readonly wallTsMs: number;
}

// ============================================================================
// 5. REGISTRO DE EVENTOS (CLOSED EVENT LOG: 18 TIPOS EXACTOS)
// ============================================================================

export const CLOSED_EVENT_TYPES = [
	"press",
	"blocked_press",
	"speech_start",
	"speech_end",
	"transcript",
	"suspected_overlap",
	"draw_start",
	"draw_submit",
	"vision_read",
	"move_propose",
	"move_veto",
	"move_execute",
	"refusal",
	"hint_level",
	"grant_step",
	"npc_line",
	"time_skip",
	"judge_scores",
] as const;

export interface PressPayload {
	readonly targetType: "talk" | "draw" | "map" | "card";
	readonly buttonId: string;
}

export interface BlockedPressPayload {
	readonly reason:
		| "npc_speaking"
		| "other_speaking"
		| "draw_active"
		| "walk_active"
		| "draw_cap_reached";
	readonly currentActiveSpeakerId: string | null;
}

export interface SpeechStartPayload {
	readonly audioSessionId: string;
}

export interface SpeechEndPayload {
	readonly durationMs: number;
	readonly sendReason: SendReason;
}

export interface TranscriptPayload {
	readonly transcriptId: string;
	readonly text: string;
	readonly sendReason: SendReason;
}

export interface SuspectedOverlapPayload {
	readonly detectedClues: readonly string[];
	readonly rawTranscriptSnippet: string;
}

export interface DrawStartPayload {
	readonly stationId: StationId;
}

export interface DrawSubmitPayload {
	readonly drawSubmissionId: string;
	readonly strokeCount: number;
	readonly wasEmpty: boolean;
}

export interface VisionReadPayload {
	readonly drawSubmissionId: string;
	readonly visionRead: VisionRead;
}

export interface MoveProposePayload {
	readonly fromStation: StationId;
	readonly toStation: StationId;
	readonly proposerPlayerId: string;
	readonly proposalMethod: "voice" | "map_tap";
}

export interface MoveVetoPayload {
	readonly vetoerPlayerId: string;
	readonly targetStation: StationId;
	readonly vetoSpeechTranscript: string;
}

export interface MoveExecutePayload {
	readonly destinationStation: StationId;
	readonly walkDurationMs: number;
}

export interface RefusalPayload {
	readonly npcId: string;
	readonly stationId: StationId;
	readonly missingRequirement: string;
	readonly isOutOfOrder: boolean;
}

export interface HintLevelPayload {
	readonly tier: HintTier;
	readonly npcId: string;
	readonly stationId: StationId;
	readonly messageText: string;
}

export interface GrantStepPayload {
	readonly stepId: ChecklistStepId;
	readonly grantedItem: InventoryItemId | null;
	readonly forced: boolean;
}

export interface NpcLinePayload {
	readonly npcId: string;
	readonly stationId: StationId;
	readonly text: string;
	readonly audioDurationMs: number;
}

export interface TimeSkipPayload {
	readonly fromStation: StationId;
	readonly toStation: StationId;
	readonly triggeredBy: "teacher_console";
}

export interface JudgeScoresPayload {
	readonly judgeScoresId: string;
	readonly sumPoints: number;
	readonly stars: StarRating | null;
	readonly conApoyoDocente: boolean;
}

export interface EventPayloadMap {
	readonly press: PressPayload;
	readonly blocked_press: BlockedPressPayload;
	readonly speech_start: SpeechStartPayload;
	readonly speech_end: SpeechEndPayload;
	readonly transcript: TranscriptPayload;
	readonly suspected_overlap: SuspectedOverlapPayload;
	readonly draw_start: DrawStartPayload;
	readonly draw_submit: DrawSubmitPayload;
	readonly vision_read: VisionReadPayload;
	readonly move_propose: MoveProposePayload;
	readonly move_veto: MoveVetoPayload;
	readonly move_execute: MoveExecutePayload;
	readonly refusal: RefusalPayload;
	readonly hint_level: HintLevelPayload;
	readonly grant_step: GrantStepPayload;
	readonly npc_line: NpcLinePayload;
	readonly time_skip: TimeSkipPayload;
	readonly judge_scores: JudgeScoresPayload;
}

export type EventType = keyof EventPayloadMap;

export interface EventLogEntry<T extends EventType = EventType> {
	readonly id: string;
	readonly sessionId: string;
	readonly type: T;
	readonly game_ts_ms: number;
	readonly wall_ts_ms: number;
	readonly actorId: string; // playerId, npcId o "teacher"
	readonly payload: EventPayloadMap[T];
}

// ============================================================================
// 6. EVALUACIÓN PEDAGÓGICA Y MODELO DEL JUEZ (JUDGE)
// ============================================================================

export interface GroupCriterionEvaluation {
	readonly score: CriterionScore;
	readonly evidenceQuote: string; // Cita textual o paráfrasis en español
}

export interface GroupCriteriaBreakdown {
	readonly turnTaking: GroupCriterionEvaluation;
	readonly colaboracion: GroupCriterionEvaluation;
	readonly negociacion: GroupCriterionEvaluation;
	readonly resolucionEstructurada: GroupCriterionEvaluation;
	readonly organizacionLiderazgo: GroupCriterionEvaluation;
}

export interface StudentEvaluation {
	readonly playerId: string;
	readonly avatar: AvatarSpecies;
	readonly name: string;
	readonly participacion: CriterionScore;
	readonly propuesta: CriterionScore;
	readonly organizacion: CriterionScore;
	readonly anecdote: string;
	readonly turnCount: number;
	readonly drawCount: number;
}

export interface BadgeAward {
	readonly id: BadgeId;
	readonly name: string;
	readonly quoteInRunLanguage: string;
}

export interface JudgeScores {
	readonly id: string;
	readonly sessionId: string;
	readonly sumPoints: number; // 0 a 10
	readonly stars: StarRating | null; // null si no terminó
	readonly isFinished: boolean;
	readonly earnedBadges: readonly BadgeAward[]; // Máximo 3, ordenadas por prioridad
	readonly groupCriteria: GroupCriteriaBreakdown;
	readonly students: readonly StudentEvaluation[];
	readonly conApoyoDocente: boolean;
	readonly evaluatedAtWallMs: number;
}

export interface JudgeEvaluationContext {
	readonly config: SessionConfig;
	readonly players: readonly PlayerCard[];
	readonly transcripts: readonly TranscriptTurn[];
	readonly drawings: readonly DrawSubmission[];
	readonly events: readonly EventLogEntry[];
	readonly hasTeacherSupport: boolean;
}

// ============================================================================
// 7. HILO DE COMENTARIOS (ADD-ONLY)
// ============================================================================

export interface SessionComment {
	readonly id: string;
	readonly sessionId: string;
	readonly text: string;
	readonly author: "teacher";
	readonly wall_ts_ms: number;
}

// ============================================================================
// 8. REGISTRO COMPLETO DE SESIÓN (SESSION RECORD)
// ============================================================================

export interface SessionRecord {
	readonly id: string;
	readonly code: string; // 4 caracteres excluyendo 0, O, 1, I, L
	readonly config: SessionConfig;
	readonly status: SessionStatus;
	readonly currentStation: StationId;
	readonly gameTimeRemainingMs: number;
	readonly stallCountdownSeconds: number;
	readonly players: readonly PlayerCard[];
	readonly inventory: SharedInventory;
	readonly checklist: readonly ChecklistStep[];
	readonly transcripts: readonly TranscriptTurn[];
	readonly drawings: readonly DrawSubmission[];
	readonly events: readonly EventLogEntry[];
	readonly scores: JudgeScores | null;
	readonly comments: readonly SessionComment[];
	readonly createdAtWallMs: number;
	readonly updatedAtWallMs: number;
}

export interface SessionSummary {
	readonly code: string;
	readonly createdAtWallMs: number;
	readonly language: Language;
	readonly playerCount: number;
	readonly stars: StarRating | null;
	readonly isFinished: boolean;
	readonly conApoyoDocente: boolean;
}

// ============================================================================
// 9. FUNCIONES PURAS Y ALIAS DE DOMINIO (RE-EXPORTACIONES)
// ============================================================================

export {
	CODE_ALPHABET,
	codeGen,
	hasConfusable,
	isValidCode,
} from "@/shared/codeGen.ts";

export {
	BADGE_PRIORITY_ORDER,
	badgePriority,
	calculateStars,
	filterAndPrioritizeBadges,
	starsFor,
} from "@/shared/scoring.ts";

// ============================================================================
// 10. INTERFACES DE PUERTOS Y REPOSITORIOS
// ============================================================================

export interface ISessionRepository {
	create(config: SessionConfig, initialCode?: string): Promise<SessionRecord>;
	getByCode(code: string): Promise<SessionRecord | null>;
	listPast(): Promise<SessionSummary[]>;
	updateStatus(code: string, status: SessionStatus): Promise<void>;
	updateConfig?(code: string, newConfig: Partial<SessionConfig>): Promise<void>;
	updatePlayer?(code: string, player: PlayerCard): Promise<void>;
	addComment(code: string, text: string): Promise<SessionComment>;
	saveScores(code: string, scores: JudgeScores): Promise<void>;
	/**
	 * Borrado en cascada definitivo.
	 * Elimina sesión, eventos, dibujos, transcripciones, puntajes y comentarios (Ley 29733).
	 */
	hardDelete(code: string): Promise<boolean>;
}

export interface ISyncSessionRepository extends ISessionRepository {
	createSync?(config: SessionConfig, initialCode?: string): SessionRecord;
	getByCodeSync?(code: string): SessionRecord | null;
	listPastSync?(): SessionSummary[];
}

export interface IEventLogPort {
	append<T extends EventType>(
		entry: Omit<EventLogEntry<T>, "id">,
	): Promise<EventLogEntry<T>>;
	getBySession(sessionId: string): Promise<EventLogEntry[]>;
	deleteBySession(sessionId: string): Promise<void>;
}

export interface IJudgeService {
	evaluateSession(context: JudgeEvaluationContext): Promise<JudgeScores>;
}
