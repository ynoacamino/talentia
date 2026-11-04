/**
 * DocenteView — Panel de Evaluación Docente ([TEACH-03], D4, SPEC §11, §13)
 * Conforme a SPEC §11, §13:
 * - Idioma: Siempre en ESPAÑOL (ES), con independencia del idioma de la sesión.
 * - Banner locked obligatorio: "señales preliminares, no notas".
 * - Estrellas del grupo (1-3★) idénticas al cálculo del juez (starsFor).
 * - Tag "con apoyo docente" si hubo intervención de consola.
 * - 5 criterios grupales 0-2 con citas textuales de evidencia (vía tDocente).
 * - Tarjetas Paper-Mario por alumno: 3 dimensiones 0-2 (vía tDocente), anécdota y conteos de voz/dibujo.
 * - Inmutabilidad estricta: observaciones del juez inmutables.
 * - LSP: Parametrizada por props opcionales para testability sin singleton coupling.
 */
import { tDocente } from "@/shared/i18n/t.ts";
import { starsFor } from "@/shared/scoring.ts";
import { AvatarCutout } from "@/ui/components/AvatarCutout.tsx";
import { CommentThread } from "@/ui/teacher/CommentThread.tsx";
import {
	type StudentEvaluation,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";
import type { GroupScores } from "@/ui/tokens/badges.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export interface DocenteViewProps {
	groupScores?: GroupScores;
	groupQuotes?: Record<string, string>;
	studentEvals?: StudentEvaluation[];
	teacherAssisted?: boolean;
	sessionCode?: string;
}

export function DocenteView({
	groupScores: propScores,
	groupQuotes: propQuotes,
	studentEvals: propEvals,
	teacherAssisted: propAssisted,
	sessionCode: propSessionCode,
}: DocenteViewProps = {}) {
	const store = useTeacherStore();

	const groupScores = propScores ?? store.groupScores;
	const groupQuotes = propQuotes ?? store.groupQuotes;
	const studentEvals = propEvals ?? store.studentEvals;
	const teacherAssisted = propAssisted ?? store.teacherAssisted;
	const activeSessionCode = propSessionCode ?? store.activeSessionCode;

	// Cálculo puro de estrellas con función de dominio
	const sumPoints =
		groupScores.turnTaking +
		groupScores.colaboracion +
		groupScores.negociacion +
		groupScores.estructurada +
		groupScores.organizacion;
	const stars = starsFor(sumPoints, store.liveStep === 3);

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
		<div className="flex flex-col gap-6 max-w-6xl mx-auto p-6 select-none">
			{/* Banner Institucional Obligatorio (SPEC §11, §19) */}
			<div className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 shadow-lg text-amber-200">
				<div className="flex items-center gap-3">
					<span className="text-2xl">⚠️</span>
					<div>
						<div className="text-xs font-black uppercase tracking-widest text-amber-400">
							Marco de Evaluación Formativa
						</div>
						<div className="text-base font-black text-white">
							{LOCKED_STRINGS.DOCENTE_BANNER}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{teacherAssisted && (
						<span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
							{LOCKED_STRINGS.TEACHER_FLAG}
						</span>
					)}
					<span className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700">
						Sesión {activeSessionCode}
					</span>
				</div>
			</div>

			{/* Resumen Grupal: Estrellas y Criterios Colectivos */}
			<div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5">
				<div className="flex items-center justify-between border-b border-slate-800 pb-3">
					<div>
						<h3 className="text-lg font-black text-white">
							Evaluación Colectiva del Equipo
						</h3>
						<p className="text-xs text-slate-400">
							Inferencia cualitativa del Juez IA sobre las 5 habilidades blandas
							del juego.
						</p>
					</div>

					{/* Estrellas */}
					<div className="flex items-center gap-2">
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
								<span className="text-xs text-slate-400 ml-1">({stars}/3)</span>
							</div>
						) : (
							<span className="text-xs text-slate-400 italic">
								Estrellas retenidas
							</span>
						)}
					</div>
				</div>

				{/* 5 Criterios 0-2 con Citas Textuales (§11, i18n tDocente) */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{(Object.keys(groupScores) as (keyof GroupScores)[]).map((key) => {
						const score = groupScores[key];
						const meta = criteriaMetadata[key];
						const quote = groupQuotes[key] ?? "";

						return (
							<div
								key={key}
								className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between gap-3 shadow-sm"
							>
								<div>
									<div className="flex items-center justify-between">
										<h4 className="text-sm font-black text-indigo-300">
											{tDocente(meta.titleKey)}
										</h4>
										<span
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
								<div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 italic">
									"{quote}"
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Tarjetas Paper-Mario Individuales por Alumno (§11, i18n tDocente) */}
			<div className="flex flex-col gap-4">
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
										<h4 className="text-base font-black text-white">
											{student.studentName}
										</h4>
										<div className="text-[11px] text-slate-400 capitalize">
											Avatar: {student.avatarId}
										</div>
									</div>
								</div>

								{/* Conteos de turnos y dibujos (§11) */}
								<div className="flex items-center gap-2 text-xs font-mono">
									<span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
										🗣️ {student.voiceTurns} turnos
									</span>
									<span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
										🎨 {student.drawsCount} dibujos
									</span>
								</div>
							</div>

							{/* 3 Dimensiones Observadas (0-2) sin ternarios inline (OCP) */}
							<div className="grid grid-cols-3 gap-2 text-center">
								<div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
									<div className="text-[10px] font-bold text-slate-400 uppercase">
										{tDocente("d4.studentDimensions.participacion")}
									</div>
									<div className="text-base font-black text-indigo-400 mt-0.5">
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
									<div className="text-base font-black text-emerald-400 mt-0.5">
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
									<div className="text-base font-black text-amber-400 mt-0.5">
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
							<div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
								<span className="font-bold text-amber-400 mr-1.5">
									{tDocente("d4.anecdote")}:
								</span>
								<span>{student.anecdote}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Hilo de Comentarios Add-Only */}
			<CommentThread />
		</div>
	);
}
