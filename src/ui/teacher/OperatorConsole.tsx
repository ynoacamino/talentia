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
import type { ISessionRepository } from "@/shared/documents.ts";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

export interface OperatorConsoleProps {
	repo?: ISessionRepository;
}

export function OperatorConsole({ repo }: OperatorConsoleProps = {}) {
	const storeHook = useTeacherStore();
	const store =
		typeof window === "undefined" ? useTeacherStore.getState() : storeHook;
	const {
		skipToStation,
		forceGrantNext,
		forceGrantStep,
		replayLastNpcLine,
		endRunNow,
		skipIntro,
		retireStudent,
		retryService,
		studentEvals,
		teacherAssisted,
		conApoyoDocente,
		consoleError,
		liveStep,
		forceStart,
	} = store;

	const [studentToRetire, setStudentToRetire] = useState<string | null>(null);

	const confirmedCount = studentEvals.filter(
		(s) => s.confirmed && !s.retired,
	).length;
	const totalExpected = studentEvals.length;
	const canForceStart = confirmedCount >= 2 && confirmedCount < totalExpected;

	const stations = [
		{ id: "chacra", name: "Chacra (Paco)" },
		{ id: "taller", name: "Taller (Luz)" },
		{ id: "alcaldia", name: "Alcaldía (Soto)" },
		{ id: "puente", name: "Puente Roto" },
	];

	const targetStudent = studentEvals.find(
		(s) => s.studentId === studentToRetire,
	);
	const hasTeacherSupport = teacherAssisted || conApoyoDocente;

	return (
		<div
			data-testid="operator-console"
			className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-5"
		>
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
				{hasTeacherSupport && (
					<span
						data-testid="teacher-assisted-flag"
						className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[10px] uppercase tracking-wider"
					>
						con apoyo docente
					</span>
				)}
			</div>

			{/* Banner de Error de Consola (por ejemplo: fuera de orden) */}
			{consoleError && (
				<div
					data-testid="console-error-message"
					className="px-3 py-2 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs font-bold flex items-center gap-2"
				>
					<span>⚠️</span>
					<span>{consoleError}</span>
				</div>
			)}

			{/* Indicador Sincronizado de Reintento / Bloqueo IA (SPEC §16) */}
			{(store.isAiRetrying || store.isAiBlocked) && (
				<div
					data-testid="teacher-retry-indicator"
					className="px-4 py-3 rounded-2xl bg-amber-950/90 border border-amber-500/80 text-amber-200 text-xs font-bold flex items-center justify-between gap-3 animate-pulse"
				>
					<div className="flex items-center gap-2">
						<span
							data-testid="teacher-retry-spinner"
							className="animate-spin text-base"
						>
							🔄
						</span>
						<span>
							{store.isAiBlocked
								? `La partida se encuentra bloqueada por fallo en el servicio IA (${store.blockedAiService ?? "IA"}). Presione 'Reintentar IA' para reanudar.`
								: `Reintentando servicio de IA (${store.blockedAiService ?? "IA"})…`}
						</span>
					</div>
					<button
						type="button"
						data-testid="teacher-banner-retry-btn"
						onClick={retryService}
						className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow"
					>
						Reintentar
					</button>
				</div>
			)}

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
							data-testid={`skip-station-${s.id}`}
							onClick={() => skipToStation(s.id)}
							className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer text-center transition-all"
						>
							⏩ {s.name}
						</button>
					))}
				</div>
			</div>

			{/* Fila 2: Acciones Críticas de Partida */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{/* Force Grant Next & Steps */}
				<div className="flex flex-col gap-1.5">
					<button
						type="button"
						data-testid="force-grant-btn"
						onClick={() => forceGrantNext()}
						disabled={liveStep >= 3}
						className={`w-full py-2.5 px-3 rounded-xl text-xs font-black border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
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
					{/* Botones individuales de paso para pruebas directas */}
					<div className="grid grid-cols-3 gap-1">
						<button
							type="button"
							data-testid="force-grant-madera"
							onClick={() => forceGrantStep("madera")}
							className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700"
							title="Conceder Madera (Paso 1)"
						>
							1. Madera
						</button>
						<button
							type="button"
							data-testid="force-grant-diseno"
							onClick={() => forceGrantStep("diseño")}
							className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700"
							title="Conceder Diseño (Paso 2)"
						>
							2. Diseño
						</button>
						<button
							type="button"
							data-testid="force-grant-permiso"
							onClick={() => forceGrantStep("permiso")}
							className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700"
							title="Conceder Permiso (Paso 3)"
						>
							3. Permiso
						</button>
					</div>
				</div>

				{/* Replay PNJ */}
				<button
					type="button"
					data-testid="replay-npc-btn"
					onClick={replayLastNpcLine}
					className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all"
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
					data-testid="skip-intro-btn"
					onClick={skipIntro}
					className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all"
				>
					<span>⏭️ Saltar Intro</span>
					<span className="text-[9px] text-slate-400 font-normal">
						Omitir paneo Soto
					</span>
				</button>

				{/* Terminar Ahora */}
				<button
					type="button"
					data-testid="end-run-now-btn"
					onClick={() => endRunNow(repo)}
					className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-black border border-red-700 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all"
					title="Termina la sesión y genera evaluación parcial"
				>
					<span>⏹️ Terminar Ahora</span>
					<span className="text-[9px] text-red-400 font-normal">
						Evaluación parcial
					</span>
				</button>

				{/* Forzar Inicio (N Reducido) (§3) */}
				{canForceStart && (
					<button
						type="button"
						data-testid="force-start-btn"
						onClick={() => forceStart(repo)}
						className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-1 animate-bounce"
					>
						<span>{`🚀 Iniciar con ${confirmedCount} listos`}</span>
						<span className="text-[9px] text-slate-900 font-normal">
							Forzar inicio
						</span>
					</button>
				)}
			</div>

			{/* Fila 3: Control por Avatar de Alumnos (Retiro con confirmación inline) */}
			<div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
				<div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
					Control por Avatar (Retiro de Alumnos):
				</div>
				<div
					data-testid="operator-student-avatar-list"
					className="flex flex-wrap items-center gap-2"
				>
					{studentEvals.map((s) => (
						<div
							key={s.studentId}
							className={`flex items-center gap-2 p-2 rounded-xl border text-xs ${
								s.retired
									? "opacity-40 grayscale bg-slate-900 border-slate-800"
									: "bg-slate-800/80 border-slate-700 text-white"
							}`}
						>
							<span className="font-bold">
								{s.studentName} ({s.avatarId})
							</span>
							{s.retired ? (
								<span className="text-[10px] text-red-400 font-mono">
									{s.retiredAt ? `retirado ${s.retiredAt}` : "retirado"}
								</span>
							) : (
								<button
									type="button"
									data-testid={`inline-retire-btn-${s.studentId}`}
									onClick={() => setStudentToRetire(s.studentId)}
									className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 text-[10px] font-bold border border-red-800 cursor-pointer"
								>
									Retirar
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Fila 4: Selector Clásico de Retiro y Reintento IA */}
			<div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
				{/* Selector de Retiro de Alumno con Confirmación Inline (§3, §13) */}
				<div className="flex items-center gap-2 w-full md:w-auto">
					<span className="text-xs font-bold text-slate-400 shrink-0">
						Retirar alumno:
					</span>
					<select
						data-testid="retire-student-select"
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

					{studentToRetire && (
						<div
							data-testid="retire-inline-confirm"
							className="flex items-center gap-2 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-700 animate-pop"
						>
							<span
								data-testid="retire-inline-prompt"
								className="text-xs text-red-200 font-bold"
							>
								¿Retirar a {targetStudent?.studentName ?? studentToRetire}?
							</span>
							<button
								type="button"
								data-testid="confirm-retire-btn"
								onClick={() => {
									retireStudent(studentToRetire, repo);
									setStudentToRetire(null);
								}}
								className="px-2.5 py-1 rounded-lg text-xs font-black bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow"
							>
								Sí, retirar
							</button>
							<button
								type="button"
								data-testid="cancel-retire-btn"
								onClick={() => setStudentToRetire(null)}
								className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
							>
								Cancelar
							</button>
						</div>
					)}

					{!studentToRetire && (
						<button
							type="button"
							disabled={true}
							className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
						>
							Retirar
						</button>
					)}
				</div>

				{/* Botón Reintentar IA */}
				<button
					type="button"
					data-testid="retry-service-btn"
					onClick={retryService}
					className={`px-4 py-2 rounded-xl text-xs font-black border cursor-pointer flex items-center gap-2 transition-all ${
						store.isAiBlocked
							? "bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-lg animate-pulse"
							: "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
					}`}
				>
					<span>🔄 Reintentar IA</span>
					<span
						className={`text-[10px] font-normal ${
							store.isAiBlocked ? "text-slate-900" : "text-slate-400"
						}`}
					>
						STT/LLM/TTS
					</span>
				</button>
			</div>
		</div>
	);
}
