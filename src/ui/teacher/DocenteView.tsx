/**
 * DocenteView — Panel de Evaluación Docente ([TEACH-03], D2, D4, SPEC §11, §13)
 * Conforme a SPEC §11, §13:
 * - Idioma: Siempre en ESPAÑOL (ES), con independencia del idioma de la sesión.
 * - Banner locked obligatorio: "señales preliminares, no notas".
 * - Estrellas del grupo (1-3★) idénticas al cálculo del juez (starsFor) o retenidas si no finalizó.
 * - Tag "con apoyo docente" si hubo intervención de consola o paso forzado.
 * - 5 criterios grupales 0-2 con citas textuales de evidencia (vía tDocente).
 * - Tarjetas Paper-Mario por alumno: 3 dimensiones 0-2 (vía tDocente), anécdota y conteos de voz/dibujo.
 * - Pestaña/sección de inspección detallada: feed diarizado con doble timestamp (game_ts_ms y wall_ts_ms),
 *   galería de miniaturas de dibujos (thumbs) y lecturas de visión (visionRead).
 * - Inmutabilidad estricta: observaciones del juez inmutables.
 */
import { useState } from "react";
import type {
	CriterionScore,
	ISessionRepository,
	JudgeScores,
	SessionComment,
	SessionRecord,
} from "@/shared/documents.ts";
import { formatGameTime, formatWallTime } from "@/shared/formatters.ts";
import { tDocente } from "@/shared/i18n/t.ts";
import { AvatarCutout } from "@/ui/components/AvatarCutout.tsx";
import { CommentThread } from "@/ui/teacher/CommentThread.tsx";
import {
	type StudentEvaluation,
	useGroupStars,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";
import type { GroupScores } from "@/ui/tokens/badges.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export interface DocenteViewProps {
	sessionRecord?: SessionRecord | null;
	scores?: JudgeScores | null;
	groupScores?: GroupScores;
	groupQuotes?: Record<string, string>;
	studentEvals?: StudentEvaluation[];
	teacherAssisted?: boolean;
	sessionCode?: string;
	repo?: ISessionRepository;
	onCommentAdded?: (comment: SessionComment) => void;
	showInspectionSection?: boolean;
}

export function DocenteView(): React.JSX.Element;
export function DocenteView(props: DocenteViewProps): React.JSX.Element;
export function DocenteView(props: DocenteViewProps = {}): React.JSX.Element {
	const {
		sessionRecord,
		scores: propScoresObj,
		groupScores: propScores,
		groupQuotes: propQuotes,
		studentEvals: propEvals,
		teacherAssisted: propAssisted,
		sessionCode: propSessionCode,
		repo,
		onCommentAdded,
		showInspectionSection = true,
	} = props;
	const store = useTeacherStore();

	const effectiveScores: JudgeScores | null =
		propScoresObj ?? sessionRecord?.scores ?? null;

	// Active tab inside inspection view
	const [activeTab, setActiveTab] = useState<
		"all" | "eval" | "transcripts" | "drawings"
	>("all");

	// Derive values from effectiveScores or sessionRecord
	const derivedScores: GroupScores | undefined = effectiveScores
		? {
				turnTaking: effectiveScores.groupCriteria.turnTaking.score,
				colaboracion: effectiveScores.groupCriteria.colaboracion.score,
				negociacion: effectiveScores.groupCriteria.negociacion.score,
				estructurada:
					effectiveScores.groupCriteria.resolucionEstructurada.score,
				organizacion: effectiveScores.groupCriteria.organizacionLiderazgo.score,
			}
		: undefined;

	const derivedQuotes: Record<string, string> | undefined = effectiveScores
		? {
				turnTaking: effectiveScores.groupCriteria.turnTaking.evidenceQuote,
				colaboracion: effectiveScores.groupCriteria.colaboracion.evidenceQuote,
				negociacion: effectiveScores.groupCriteria.negociacion.evidenceQuote,
				estructurada:
					effectiveScores.groupCriteria.resolucionEstructurada.evidenceQuote,
				organizacion:
					effectiveScores.groupCriteria.organizacionLiderazgo.evidenceQuote,
			}
		: undefined;

	const derivedEvals: StudentEvaluation[] | undefined = effectiveScores
		? effectiveScores.students.map((s) => ({
				studentId: s.playerId,
				studentName: s.name.slice(0, 10),
				avatarId: s.avatar.toLowerCase(),
				participacion: s.participacion,
				propuesta: s.propuesta,
				organizacion: s.organizacion,
				anecdote: s.anecdote,
				voiceTurns: s.turnCount,
				drawsCount: s.drawCount,
				retired: false,
			}))
		: sessionRecord?.players && sessionRecord.players.length > 0
			? sessionRecord.players.map((p) => ({
					studentId: p.playerId,
					studentName: p.name.slice(0, 10),
					avatarId: p.avatar.toLowerCase(),
					participacion: 0 as CriterionScore,
					propuesta: 0 as CriterionScore,
					organizacion: 0 as CriterionScore,
					anecdote: "Participante registrado en la sesión",
					voiceTurns: p.turnCount,
					drawsCount: p.drawCount,
					retired: p.retired,
				}))
			: undefined;

	const derivedAssisted = effectiveScores
		? effectiveScores.conApoyoDocente
		: sessionRecord
			? Boolean(
					sessionRecord.scores?.conApoyoDocente ||
						sessionRecord.checklist?.some((s) => s.forced) ||
						sessionRecord.events?.some(
							(e) =>
								(e.type === "grant_step" &&
									(e.payload as { forced?: boolean })?.forced) ||
								e.type === "time_skip",
						),
				)
			: undefined;

	const groupScores = propScores ?? derivedScores ?? store.groupScores;
	const groupQuotes = propQuotes ?? derivedQuotes ?? store.groupQuotes;
	const studentEvals = propEvals ?? derivedEvals ?? store.studentEvals;
	const teacherAssisted =
		propAssisted ?? derivedAssisted ?? store.teacherAssisted;
	const activeSessionCode =
		propSessionCode ??
		effectiveScores?.sessionId ??
		sessionRecord?.code ??
		store.activeSessionCode;

	const liveStars = useGroupStars();
	const stars =
		effectiveScores !== null
			? effectiveScores.stars
			: sessionRecord
				? (sessionRecord.scores?.stars ?? null)
				: liveStars;

	const transcripts = sessionRecord?.transcripts ?? [];
	const drawings = sessionRecord?.drawings ?? [];

	// Metadata tipada de criterios usando diccionarios de i18n docentes (OCP)
	const criteriaMetadata: Record<
		keyof GroupScores,
		{ titleKey: string; descKey: string }
	> = {
		turnTaking: {
			titleKey: "d4.criteria.turnTaking",
			descKey: "d4.criteria.turnTakingDesc",
		},
		colaboracion: {
			titleKey: "d4.criteria.colaboracion",
			descKey: "d4.criteria.colaboracionDesc",
		},
		negociacion: {
			titleKey: "d4.criteria.negociacion",
			descKey: "d4.criteria.negociacionDesc",
		},
		estructurada: {
			titleKey: "d4.criteria.resolucionEstructurada",
			descKey: "d4.criteria.resolucionEstructuradaDesc",
		},
		organizacion: {
			titleKey: "d4.criteria.organizacionLiderazgo",
			descKey: "d4.criteria.organizacionLiderazgoDesc",
		},
	};

	const scoreColors: Record<number, string> = {
		2: "bg-emerald-950 text-emerald-300 border border-emerald-700",
		1: "bg-amber-950 text-amber-300 border border-amber-700",
		0: "bg-slate-800 text-slate-400 border border-slate-700",
	};

	return (
		<div
			data-testid="docente-view-root"
			className="flex flex-col gap-6 max-w-6xl mx-auto p-6 select-none"
		>
			{/* Banner Institucional Obligatorio (SPEC §11, §19) */}
			<div
				data-testid="docente-banner"
				className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 shadow-lg text-amber-200"
			>
				<div className="flex items-center gap-3">
					<span className="text-2xl">⚠️</span>
					<div>
						<div className="text-xs font-black uppercase tracking-widest text-amber-400">
							Marco de Evaluación Formativa
						</div>
						<div
							data-testid="docente-banner-title"
							className="text-base font-black text-white"
						>
							{LOCKED_STRINGS.DOCENTE_BANNER}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{teacherAssisted && (
						<span
							data-testid="teacher-assisted-flag"
							className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
						>
							{LOCKED_STRINGS.TEACHER_FLAG}
						</span>
					)}
					<span
						data-testid="session-code-badge"
						className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700"
					>
						Sesión {activeSessionCode}
					</span>
				</div>
			</div>

			{/* Sub-navegación de Detalle / Pestañas de Inspección */}
			{showInspectionSection && (
				<div className="flex items-center gap-2 border-b border-slate-800 pb-3">
					<button
						type="button"
						onClick={() => setActiveTab("all")}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
							activeTab === "all"
								? "bg-indigo-600 text-white font-black"
								: "bg-slate-800 text-slate-400 hover:text-slate-200"
						}`}
					>
						👁️ Vista Completa
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("eval")}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
							activeTab === "eval"
								? "bg-indigo-600 text-white font-black"
								: "bg-slate-800 text-slate-400 hover:text-slate-200"
						}`}
					>
						📊 Evaluación Docente
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("transcripts")}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
							activeTab === "transcripts"
								? "bg-indigo-600 text-white font-black"
								: "bg-slate-800 text-slate-400 hover:text-slate-200"
						}`}
					>
						💬 Transcripciones ({transcripts.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("drawings")}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
							activeTab === "drawings"
								? "bg-indigo-600 text-white font-black"
								: "bg-slate-800 text-slate-400 hover:text-slate-200"
						}`}
					>
						🎨 Dibujos y Visión ({drawings.length})
					</button>
				</div>
			)}

			{/* Sección 1: Evaluación Colectiva del Equipo (5 Criterios Inmutables) */}
			{(activeTab === "all" || activeTab === "eval") && (
				<>
					<div
						data-testid="docente-criteria-grid"
						className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5"
					>
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<div>
								<h3 className="text-lg font-black text-white">
									Evaluación Colectiva del Equipo
								</h3>
								<p className="text-xs text-slate-400">
									Inferencia cualitativa del Juez IA sobre las 5 habilidades
									blandas del juego.
								</p>
							</div>

							{/* Estrellas */}
							<div
								data-testid="docente-stars-container"
								className="flex items-center gap-2"
							>
								{stars !== null ? (
									<div className="flex items-center gap-1.5 text-2xl text-amber-400 font-bold">
										{[0, 1, 2].map((starIdx) => (
											<span
												key={`teacher-star-${starIdx}`}
												className={
													starIdx < stars ? "text-amber-400" : "text-slate-700"
												}
											>
												★
											</span>
										))}
										<span className="text-xs text-slate-400 ml-1">
											{`(${stars}/3)`}
										</span>
									</div>
								) : (
									<span
										data-testid="stars-retained-msg"
										className="text-base text-slate-400 font-bold"
									>
										—{" "}
										<span className="text-xs font-normal italic text-slate-500">
											(Estrellas retenidas)
										</span>
									</span>
								)}
							</div>
						</div>

						{/* Insignias Otorgadas por el Jurado (Top 3 - SPEC §11) */}
						{effectiveScores?.earnedBadges &&
							effectiveScores.earnedBadges.length > 0 && (
								<div
									data-testid="docente-earned-badges"
									className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-slate-950/60 border border-slate-800"
								>
									<span className="text-xs text-slate-400 font-bold">
										Insignias otorgadas (máx 3):
									</span>
									{effectiveScores.earnedBadges.map((badge) => (
										<span
											key={badge.id}
											data-testid={`earned-badge-${badge.id}`}
											className="px-2.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/80 text-xs font-bold text-indigo-200 flex items-center gap-1.5"
										>
											<span>🏅</span>
											<span>{badge.name}</span>
										</span>
									))}
								</div>
							)}

						{/* 5 Criterios 0-2 con Citas Textuales (§11, i18n tDocente) */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{(Object.keys(groupScores) as (keyof GroupScores)[]).map(
								(key) => {
									const score = groupScores[key];
									const meta = criteriaMetadata[key];
									const quote = groupQuotes[key] ?? "";

									return (
										<div
											key={key}
											data-testid={`criterion-card-${key}`}
											className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between gap-3 shadow-sm"
										>
											<div>
												<div className="flex items-center justify-between">
													<h4 className="text-sm font-black text-indigo-300">
														{tDocente(meta.titleKey)}
													</h4>
													<span
														data-testid={`criterion-score-${key}`}
														className={`text-xs font-black px-2 py-0.5 rounded-full ${scoreColors[score] ?? scoreColors[0]}`}
													>
														{tDocente(`d4.score${score}`)}
													</span>
												</div>
												<p className="text-[11px] text-slate-400 mt-1 leading-tight">
													{tDocente(meta.descKey)}
												</p>
											</div>

											{/* Cita de evidencia (siempre en español §11) */}
											<div
												data-testid={`criterion-quote-${key}`}
												className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 italic"
											>
												"{quote}"
											</div>
										</div>
									);
								},
							)}
						</div>
					</div>

					{/* Sección 2: Tarjetas Paper-Mario Individuales por Alumno */}
					<div
						data-testid="docente-student-cards"
						className="flex flex-col gap-4"
					>
						<div className="border-b border-slate-800 pb-2">
							<h3 className="text-lg font-black text-white">
								Señales Formativas Individuales (Tarjetas Paper-Mario)
							</h3>
							<p className="text-xs text-slate-400">
								3 dimensiones observadas (0-2), anécdota y telemetría de
								participación.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{studentEvals.map((student) => (
								<div
									key={student.studentId}
									data-testid={`student-card-${student.studentId}`}
									className="p-5 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-xl flex flex-col justify-between gap-4"
								>
									{/* Encabezado: Avatar + Nombre + Telemetría */}
									<div className="flex items-center justify-between border-b border-slate-800 pb-3">
										<div className="flex items-center gap-3">
											<AvatarCutout
												avatarId={student.avatarId}
												size="md"
												showBorder={true}
											/>
											<div>
												<h4
													data-testid="student-card-name"
													className="text-base font-black text-white"
												>
													{student.studentName.slice(0, 10)}
												</h4>
												<div className="text-[11px] text-slate-400 capitalize">
													Avatar: {student.avatarId}
												</div>
											</div>
										</div>

										{/* Conteos de turnos y dibujos (§11) */}
										<div className="flex items-center gap-2 text-xs font-mono">
											<span
												data-testid="student-turns-count"
												className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
											>
												{`🗣️ ${student.voiceTurns} turnos`}
											</span>
											<span
												data-testid="student-draws-count"
												className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
											>
												{`🎨 ${student.drawsCount} dibujos`}
											</span>
										</div>
									</div>

									{/* 3 Dimensiones Observadas (0-2) */}
									<div className="grid grid-cols-3 gap-2 text-center">
										<div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
											<div className="text-[10px] font-bold text-slate-400 uppercase">
												{tDocente("d4.studentDimensions.participacion")}
											</div>
											<div
												data-testid="student-dimension-participacion"
												className="text-base font-black text-indigo-400 mt-0.5"
											>
												{student.participacion}/2
											</div>
											<div className="text-[9px] text-slate-400">
												{tDocente(
													`d4.studentDimensions.participacion${student.participacion}`,
												)}
											</div>
										</div>

										<div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
											<div className="text-[10px] font-bold text-slate-400 uppercase">
												{tDocente("d4.studentDimensions.propuesta")}
											</div>
											<div
												data-testid="student-dimension-propuesta"
												className="text-base font-black text-emerald-400 mt-0.5"
											>
												{student.propuesta}/2
											</div>
											<div className="text-[9px] text-slate-400">
												{tDocente(
													`d4.studentDimensions.propuesta${student.propuesta}`,
												)}
											</div>
										</div>

										<div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
											<div className="text-[10px] font-bold text-slate-400 uppercase">
												{tDocente("d4.studentDimensions.organizacion")}
											</div>
											<div
												data-testid="student-dimension-organizacion"
												className="text-base font-black text-amber-400 mt-0.5"
											>
												{student.organizacion}/2
											</div>
											<div className="text-[9px] text-slate-400">
												{tDocente(
													`d4.studentDimensions.organizacion${student.organizacion}`,
												)}
											</div>
										</div>
									</div>

									{/* Anécdota Observacional de 1 Línea (§11) */}
									<div
										data-testid="student-anecdote"
										className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
									>
										<span className="font-bold text-amber-400 mr-1.5">
											{tDocente("d4.anecdote")}:
										</span>
										<span>{student.anecdote}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{/* Sección 3: Inspección Detallada — Feed Diarizado de Transcripciones */}
			{showInspectionSection &&
				(activeTab === "all" || activeTab === "transcripts") && (
					<div
						data-testid="transcripts-feed"
						className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4"
					>
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<div>
								<h3 className="text-base font-black text-white flex items-center gap-2">
									<span>💬</span>
									<span>
										Feed Diarizado de Transcripciones (Doble Timestamp)
									</span>
								</h3>
								<p className="text-xs text-slate-400 mt-0.5">
									Registro estricto diarizado por tarjeta de alumno con marcas
									duales de tiempo (game_ts_ms y wall_ts_ms).
								</p>
							</div>
							<span
								data-testid="transcripts-count"
								className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800"
							>
								{`${transcripts.length} intervenciones`}
							</span>
						</div>

						{transcripts.length === 0 ? (
							<div
								data-testid="transcripts-empty"
								className="text-xs text-slate-500 italic text-center py-6"
							>
								No hay transcripciones registradas para esta sesión.
							</div>
						) : (
							<div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
								{transcripts.map((turn) => (
									<div
										key={turn.id}
										data-testid="transcript-item"
										className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-2 shadow-sm"
									>
										<div className="flex items-center justify-between text-xs flex-wrap gap-2">
											<div className="flex items-center gap-2">
												<span
													data-testid="transcript-holder"
													className="font-black text-indigo-300"
												>
													{turn.holderPlayerId}
												</span>
												<span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
													corte: {turn.sendReason}
												</span>
												{turn.suspectedOverlap && (
													<span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
														⚠️ Solapamiento
													</span>
												)}
											</div>

											{/* Doble timestamp obligatorio (§17, D2) */}
											<div className="flex items-center gap-3 font-mono text-[11px]">
												<span
													data-testid="game-ts"
													className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800"
												>
													{`game_ts: ${formatGameTime(turn.gameTsMs)} (${turn.gameTsMs}ms)`}
												</span>
												<span
													data-testid="wall-ts"
													className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
												>
													{`wall_ts: ${formatWallTime(turn.wallTsMs, true)}`}
												</span>
											</div>
										</div>

										<p
											data-testid="transcript-raw-text"
											className="text-xs text-white font-medium leading-relaxed pl-1 border-l-2 border-indigo-500"
										>
											"{turn.rawText}"
										</p>

										{turn.paraphraseEs &&
											turn.paraphraseEs !== turn.rawText && (
												<div
													data-testid="transcript-paraphrase"
													className="text-[11px] text-slate-400 italic pl-1"
												>
													Paráfrasis (ES): "{turn.paraphraseEs}"
												</div>
											)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

			{/* Sección 4: Inspección Detallada — Galería de Miniaturas de Dibujos y Visión */}
			{showInspectionSection &&
				(activeTab === "all" || activeTab === "drawings") && (
					<div
						data-testid="drawings-gallery"
						className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4"
					>
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<div>
								<h3 className="text-base font-black text-white flex items-center gap-2">
									<span>🎨</span>
									<span>
										Galería de Miniaturas de Dibujos y Lecturas de Visión
									</span>
								</h3>
								<p className="text-xs text-slate-400 mt-0.5">
									Trazos optimizados en miniatura (thumbs) y extracciones
									semánticas devueltas por el modelo de visión.
								</p>
							</div>
							<span
								data-testid="drawings-count"
								className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800"
							>
								{`${drawings.length} dibujos`}
							</span>
						</div>

						{drawings.length === 0 ? (
							<div
								data-testid="drawings-empty"
								className="text-xs text-slate-500 italic text-center py-6"
							>
								No hay dibujos registrados para esta sesión.
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{drawings.map((draw) => (
									<div
										key={draw.id}
										data-testid="drawing-card"
										className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-3 shadow-sm"
									>
										<div className="flex items-center justify-between text-xs">
											<span
												data-testid="drawing-player"
												className="font-bold text-white"
											>
												Autor: {draw.playerId} ({draw.stationId})
											</span>
											{/* Doble timestamp en dibujo */}
											<div className="flex items-center gap-2 font-mono text-[10px]">
												<span
													data-testid="game-ts"
													className="text-emerald-400"
												>
													game: {formatGameTime(draw.gameTsMs)}
												</span>
												<span data-testid="wall-ts" className="text-slate-400">
													wall: {formatWallTime(draw.wallTsMs)}
												</span>
											</div>
										</div>

										<div className="flex gap-4 items-start">
											{/* Thumbnail */}
											<div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
												{draw.thumbBase64 || draw.imageJpegBase64 ? (
													<img
														src={draw.thumbBase64 || draw.imageJpegBase64}
														alt={`Dibujo ${draw.id}`}
														data-testid="drawing-thumb"
														className="w-full h-full object-contain"
													/>
												) : (
													<span
														data-testid="drawing-thumb-empty"
														className="text-2xl"
													>
														🖼️
													</span>
												)}
											</div>

											{/* Lectura de Visión */}
											<div
												data-testid="vision-read"
												className="flex-1 flex flex-col gap-1.5 text-xs text-slate-300"
											>
												<div className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider">
													Extracción de Visión (VLM)
												</div>
												{draw.visionRead ? (
													<>
														{draw.visionRead.objects.length > 0 && (
															<div data-testid="vision-objects">
																<span className="text-slate-400 font-semibold">
																	Objetos:{" "}
																</span>
																<span className="text-white">
																	{draw.visionRead.objects.join(", ")}
																</span>
															</div>
														)}
														{draw.visionRead.actions.length > 0 && (
															<div data-testid="vision-actions">
																<span className="text-slate-400 font-semibold">
																	Acciones:{" "}
																</span>
																<span className="text-white">
																	{draw.visionRead.actions.join(", ")}
																</span>
															</div>
														)}
														{draw.visionRead.measures.length > 0 && (
															<div data-testid="vision-measures">
																<span className="text-slate-400 font-semibold">
																	Medidas:{" "}
																</span>
																<span className="text-white">
																	{draw.visionRead.measures.join(", ")}
																</span>
															</div>
														)}
														{draw.visionRead.confidence &&
															Object.keys(draw.visionRead.confidence).length >
																0 && (
																<div
																	data-testid="vision-confidence"
																	className="flex flex-wrap gap-1 mt-1"
																>
																	{Object.entries(
																		draw.visionRead.confidence,
																	).map(([k, v]) => (
																		<span
																			key={k}
																			className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300"
																		>
																			{`${k}: ${Math.round(v * 100)}%`}
																		</span>
																	))}
																</div>
															)}
													</>
												) : (
													<div
														data-testid="vision-read-empty"
														className="text-slate-500 italic text-[11px]"
													>
														Sin extracción semántica de visión
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

			{/* Sección 5: Hilo de Comentarios Add-Only */}
			<CommentThread
				sessionCode={activeSessionCode}
				comments={sessionRecord?.comments}
				repo={repo}
				onCommentAdded={onCommentAdded}
			/>
		</div>
	);
}
