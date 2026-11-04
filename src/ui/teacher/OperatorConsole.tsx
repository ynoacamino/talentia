/**
 * OperatorConsole — Consola Silenciosa del Operador ([TEACH-02], D6, SPEC §13)
 * Conforme a SPEC §13:
 * - Aislamiento estricto de ruta: nada de esto se proyecta a los alumnos.
 * - Saltar a estación (x4) (logged time_skip).
 * - Concesión forzada (force-grant siguiente en orden lineal, capa estructurada a 1).
 * - Replay última frase de PNJ (sin crear nuevo turno).
 * - Terminar ahora (end-run-now).
 * - Saltar intro (skip-intro).
 * - Retirar alumno con confirmación inline (marca retirado mm:ss).
 * - Reintentar llamada IA bloqueada.
 */
import { useState } from "react";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

export function OperatorConsole() {
	const {
		skipToStation,
		forceGrantNext,
		replayLastNpcLine,
		endRunNow,
		skipIntro,
		retireStudent,
		retryService,
		studentEvals,
		teacherAssisted,
		liveStep,
	} = useTeacherStore();

	const [studentToRetire, setStudentToRetire] = useState<string | null>(null);

	const stations = [
		{ id: "chacra", name: "Chacra (Paco)" },
		{ id: "taller", name: "Taller (Luz)" },
		{ id: "alcaldia", name: "Alcaldía (Soto)" },
		{ id: "puente", name: "Puente Roto" },
	];

	return (
		<div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-5">
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 className="text-base font-black text-white flex items-center gap-2">
						<span>🛠️</span>
						<span>Consola Silenciosa de Operador</span>
					</h3>
					<p className="text-[11px] text-slate-400">
						Controles de contingencia técnica. Invisibles en la pestaña /play.
					</p>
				</div>
				{teacherAssisted && (
					<span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
						con apoyo docente
					</span>
				)}
			</div>

			{/* Fila 1: Saltos de Estación (x4) */}
			<div className="flex flex-col gap-2">
				<div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
					Saltar a Estación (time_skip):
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
					{stations.map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => skipToStation(s.name)}
							className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer text-center"
						>
							⏩ {s.name}
						</button>
					))}
				</div>
			</div>

			{/* Fila 2: Acciones Críticas de Partida */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{/* Force Grant Next */}
				<button
					type="button"
					onClick={forceGrantNext}
					disabled={liveStep >= 3}
					className={`py-2.5 px-3 rounded-xl text-xs font-black border flex flex-col items-center justify-center gap-1 cursor-pointer ${
						liveStep >= 3
							? "bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed"
							: "bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-amber-200"
					}`}
					title="Conceder hito en orden lineal estricto"
				>
					<span>⚡ Concesión Forzada</span>
					<span className="text-[9px] text-amber-400 font-normal">
						(Paso {Math.min(3, liveStep + 1)}/3)
					</span>
				</button>

				{/* Replay PNJ */}
				<button
					type="button"
					onClick={replayLastNpcLine}
					className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex flex-col items-center justify-center gap-1"
					title="Reemite última locución del PNJ"
				>
					<span>🔁 Replay PNJ</span>
					<span className="text-[9px] text-slate-400 font-normal">
						Sin nuevo turno
					</span>
				</button>

				{/* Skip Intro */}
				<button
					type="button"
					onClick={skipIntro}
					className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex flex-col items-center justify-center gap-1"
				>
					<span>⏭️ Saltar Intro</span>
					<span className="text-[9px] text-slate-400 font-normal">
						Omitir paneo Soto
					</span>
				</button>

				{/* Terminar Ahora */}
				<button
					type="button"
					onClick={endRunNow}
					className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-black border border-red-700 cursor-pointer flex flex-col items-center justify-center gap-1"
					title="Termina la sesión y genera evaluación parcial"
				>
					<span>⏹️ Terminar Ahora</span>
					<span className="text-[9px] text-red-400 font-normal">
						Evaluación parcial
					</span>
				</button>
			</div>

			{/* Fila 3: Retirar Alumno y Reintentar */}
			<div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
				{/* Selector de Retiro de Alumno con Confirmación (§3, §13) */}
				<div className="flex items-center gap-2 w-full md:w-auto">
					<span className="text-xs font-bold text-slate-400 shrink-0">
						Retirar alumno:
					</span>
					<select
						value={studentToRetire ?? ""}
						onChange={(e) => setStudentToRetire(e.target.value || null)}
						className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 outline-none"
					>
						<option value="">Seleccionar participante...</option>
						{studentEvals
							.filter((s) => !s.retired)
							.map((s) => (
								<option key={s.studentId} value={s.studentId}>
									{s.studentName} ({s.avatarId})
								</option>
							))}
					</select>
					<button
						type="button"
						disabled={!studentToRetire}
						onClick={() => {
							if (studentToRetire) {
								retireStudent(studentToRetire);
								setStudentToRetire(null);
							}
						}}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
							studentToRetire
								? "bg-red-600 hover:bg-red-500 text-white border-red-500"
								: "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
						}`}
					>
						Confirmar retiro
					</button>
				</div>

				{/* Botón Reintentar IA */}
				<button
					type="button"
					onClick={retryService}
					className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black border border-slate-700 cursor-pointer flex items-center gap-2"
				>
					<span>🔄 Reintentar IA</span>
					<span className="text-[10px] text-slate-400 font-normal">
						STT/LLM/TTS
					</span>
				</button>
			</div>
		</div>
	);
}
