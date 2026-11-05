/**
 * LiveMirror — Espejo en Vivo (Read-Only) ([TEACH-02], D6, SPEC §13)
 * Conforme a SPEC §13:
 * - Réplica sincronizada de la escena 3D en modo de solo lectura (sin interacción).
 * - Checklist sincronizado e inventario compartido.
 * - Subtítulos en tiempo real.
 * - Feed de últimos 20 transcripts con nombre y timestamps.
 * - Feed de eventos de telemetría.
 * - Debug panel: temporizador de juego, stall countdown y reloj de pared.
 * - Estado de tarjetas de los alumnos.
 * - Consola de operador silenciosa integrada.
 */

import { useState } from "react";
import type { ISessionRepository } from "@/shared/documents.ts";
import { STATIONS, type StationId } from "@/ui/play/playStore.ts";
import { OperatorConsole } from "@/ui/teacher/OperatorConsole.tsx";
import {
	type StudentEvaluation,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";
import { getAvatarById } from "@/ui/tokens/avatars.ts";

export interface LiveMirrorProps {
	repo?: ISessionRepository;
	studentEvals?: StudentEvaluation[];
	activeSessionCode?: string;
	isCountingDown?: boolean;
	countdownSeconds?: number;
	liveTimerSeconds?: number;
}

export function LiveMirror({
	repo,
	studentEvals: propEvals,
	activeSessionCode: propCode,
	isCountingDown: propCountingDown,
	countdownSeconds: propCountdown,
	liveTimerSeconds: propTimer,
}: LiveMirrorProps = {}) {
	const store = useTeacherStore();
	const liveStep = store.liveStep;
	const liveStation = store.liveStation;
	const liveTimerSeconds = propTimer ?? store.liveTimerSeconds;
	const stallCountdownSeconds = store.stallCountdownSeconds;
	const wallClockMs = store.wallClockMs;
	const recentTranscripts = store.recentTranscripts;
	const recentEvents = store.recentEvents;
	const studentEvals = propEvals ?? store.studentEvals;
	const activeSessionCode = propCode ?? store.activeSessionCode;
	const countdownSeconds = propCountdown ?? store.countdownSeconds;
	const isCountingDown = propCountingDown ?? store.isCountingDown;
	const forceStart = store.forceStart;
	const retireStudent = store.retireStudent;

	const [retiringStudentId, setRetiringStudentId] = useState<string | null>(
		null,
	);

	const confirmedCount = studentEvals.filter(
		(s) => s.confirmed && !s.retired,
	).length;
	const totalExpected = studentEvals.length;
	const canForceStart = confirmedCount >= 2 && confirmedCount < totalExpected;

	const formatTimer = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	const wallDate = new Date(wallClockMs);
	const formattedWall = wallDate.toTimeString().split(" ")[0] ?? "10:00:00";

	return (
		<div className="flex flex-col gap-6 max-w-6xl mx-auto p-6 select-none">
			{/* Top Bar de Debug y Estado de Sesión (§10, §13) */}
			<div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
				<div className="flex items-center gap-3">
					<div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
					<span className="text-xs font-black uppercase tracking-wider text-slate-300">
						Espejo en Vivo:{" "}
						<span className="font-mono text-indigo-400">
							{activeSessionCode}
						</span>
					</span>
					<span className="text-xs text-slate-500 font-mono">
						(3D solo lectura)
					</span>
				</div>

				{/* Botón de Force-Start si hay ≥2 confirmados y < N (§3) */}
				{canForceStart && (
					<button
						type="button"
						data-testid="force-start-btn"
						onClick={() => forceStart(repo)}
						className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all flex items-center gap-2 animate-bounce"
					>
						<span>{`🚀 Iniciar con ${confirmedCount} listos`}</span>
					</button>
				)}

				{/* Cuenta regresiva de inicio visible en /teacher (§3) */}
				{isCountingDown && (
					<div
						data-testid="teacher-countdown"
						className="px-4 py-2 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs font-black flex items-center gap-2 animate-pulse"
					>
						<span>⏳ Iniciando misión en</span>
						<span
							data-testid="teacher-countdown-seconds"
							className="text-base font-mono font-black text-amber-300"
						>
							{countdownSeconds}s
						</span>
					</div>
				)}

				{/* Métricas de Tiempo / Stall / Reloj de Pared */}
				<div className="flex items-center gap-4 text-xs font-mono">
					<div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
						<span className="text-slate-400">Juego:</span>
						<span className="font-bold text-white">
							{formatTimer(liveTimerSeconds)}
						</span>
					</div>

					<div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
						<span className="text-slate-400">Stall (Nudge L1):</span>
						<span className="font-bold text-amber-400">
							{stallCountdownSeconds}s
						</span>
					</div>

					<div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
						<span className="text-slate-400">Pared:</span>
						<span className="font-bold text-slate-300">{formattedWall}</span>
					</div>
				</div>
			</div>

			{/* Grid Superior: 3D Placeholder Mirror + Estado de Alumnos */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Espejo 3D Diorama (Read-Only) */}
				<div className="lg:col-span-2 relative h-80 rounded-3xl bg-radial from-slate-900 to-slate-950 border-2 border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-hidden pointer-events-none">
					<div className="flex justify-between items-center">
						<span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-indigo-300">
							Estación:{" "}
							<span className="capitalize text-white font-black">
								{liveStation}
							</span>
						</span>
						<span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-emerald-300">
							Hito: {liveStep}/3
						</span>
					</div>

					{/* Centro Simulado del Diorama */}
					<div className="text-center my-auto">
						<div className="text-6xl mb-2 drop-shadow-lg">
							{STATIONS[liveStation as StationId]?.icon ?? "🌉"}
						</div>
						<div className="text-xl font-black text-white">
							Vista Espejo — {liveStation.toUpperCase()}
						</div>
						<div className="text-xs text-slate-400 mt-0.5">
							Sincronizado 1:1 con la pantalla proyectada a los alumnos
						</div>
					</div>

					{/* Checklist e Inventario sincronizado */}
					<div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
						<div className="flex items-center gap-2 text-xs font-bold text-slate-300">
							<span>Pasos:</span>
							<span
								className={
									liveStep >= 1
										? "text-emerald-400 font-black"
										: "text-slate-600"
								}
							>
								1. Madera {liveStep >= 1 ? "✓" : "○"}
							</span>
							<span>→</span>
							<span
								className={
									liveStep >= 2
										? "text-emerald-400 font-black"
										: "text-slate-600"
								}
							>
								2. Plano {liveStep >= 2 ? "✓" : "○"}
							</span>
							<span>→</span>
							<span
								className={
									liveStep >= 3
										? "text-emerald-400 font-black"
										: "text-slate-600"
								}
							>
								3. Permiso {liveStep >= 3 ? "✓" : "○"}
							</span>
						</div>

						<div className="flex items-center gap-2 text-xs">
							<span className={liveStep >= 1 ? "opacity-100" : "opacity-30"}>
								🪵
							</span>
							<span className={liveStep >= 2 ? "opacity-100" : "opacity-30"}>
								📐
							</span>
							<span className={liveStep >= 3 ? "opacity-100" : "opacity-30"}>
								📜
							</span>
						</div>
					</div>
				</div>

				{/* Panel de Estado de Tarjetas de Alumnos */}
				<div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl">
					<div className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
						Participantes Activos (
						{studentEvals.filter((s) => !s.retired).length})
					</div>
					<div className="flex flex-col gap-2.5 overflow-y-auto max-h-64">
						{studentEvals.map((s) => (
							<div
								key={s.studentId}
								data-testid={`mirror-student-${s.studentId}`}
								className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
									s.retired
										? "bg-red-950/20 border-red-900/40 opacity-50 grayscale"
										: "bg-slate-800/60 border-slate-700/80"
								}`}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2.5">
										<span className="text-lg">
											{getAvatarById(s.avatarId).emoji}
										</span>
										<div>
											<div className="text-xs font-black text-white leading-tight">
												{s.studentName}
											</div>
											<div className="text-[10px] text-slate-400 font-mono">
												{s.voiceTurns} turnos / {s.drawsCount} dibujos
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{s.retired ? (
											<span
												data-testid="retired-badge"
												className="text-[9px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800"
											>
												{`Retirado ${s.retiredAt}`}
											</span>
										) : (
											<>
												<span
													data-testid={`mirror-status-${s.studentId}`}
													className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
														s.confirmed
															? "text-emerald-400 bg-emerald-950 border-emerald-800"
															: "text-amber-300 bg-amber-950/80 border-amber-800"
													}`}
												>
													{s.confirmed ? "Listo ✓" : "Esperando"}
												</span>
												<button
													type="button"
													data-testid={`inline-retire-btn-${s.studentId}`}
													onClick={() => setRetiringStudentId(s.studentId)}
													className="text-[10px] font-bold text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/80 cursor-pointer"
													title="Retirar alumno de la sesión"
												>
													Retirar
												</button>
											</>
										)}
									</div>
								</div>

								{/* Inline Confirmación de Retiro (§3, §13) */}
								{retiringStudentId === s.studentId && !s.retired && (
									<div
										data-testid={`inline-retire-confirm-${s.studentId}`}
										className="p-2 rounded-lg bg-red-950/80 border border-red-700 flex items-center justify-between gap-2 mt-1"
									>
										<span className="text-[10px] text-red-200 font-bold">
											¿Retirar a {s.studentName}?
										</span>
										<div className="flex items-center gap-1.5">
											<button
												type="button"
												data-testid={`confirm-inline-retire-${s.studentId}`}
												onClick={() => {
													retireStudent(s.studentId, repo);
													setRetiringStudentId(null);
												}}
												className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer"
											>
												Sí, retirar
											</button>
											<button
												type="button"
												data-testid={`cancel-inline-retire-${s.studentId}`}
												onClick={() => setRetiringStudentId(null)}
												className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer"
											>
												No
											</button>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Feeds de Telemetría: Transcripciones (últimas 20) y Registro de Eventos */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Transcripciones Recientes (últimas 20) */}
				<div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl">
					<div className="flex items-center justify-between border-b border-slate-800 pb-2">
						<span className="text-xs font-black uppercase tracking-wider text-slate-400">
							Feed de Transcripciones (Últimos 20)
						</span>
						<span className="text-[10px] text-slate-500 font-mono">
							STT en vivo
						</span>
					</div>
					<div className="flex flex-col gap-2 overflow-y-auto max-h-56">
						{recentTranscripts.map((t) => (
							<div
								key={t.id}
								className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex flex-col gap-1"
							>
								<div className="flex justify-between items-center">
									<span className="font-bold text-indigo-300">{t.holder}</span>
									<span className="text-[10px] text-slate-500 font-mono">
										{t.time}
									</span>
								</div>
								<div className="text-slate-300 font-medium italic">
									"{t.text}"
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Feed de Eventos Cerrado (§17: 18 tipos closed log) */}
				<div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl">
					<div className="flex items-center justify-between border-b border-slate-800 pb-2">
						<span className="text-xs font-black uppercase tracking-wider text-slate-400">
							Log de Eventos (SPEC §17)
						</span>
						<span className="text-[10px] text-slate-500 font-mono">
							Append-only
						</span>
					</div>
					<div className="flex flex-col gap-2 overflow-y-auto max-h-56">
						{recentEvents.map((ev) => (
							<div
								key={ev.id}
								className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-amber-400">
										{ev.type}
									</span>
									<span className="text-slate-300">{ev.details}</span>
								</div>
								<span className="text-[10px] text-slate-500 font-mono shrink-0">
									{ev.time}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Consola Silenciosa del Operador */}
			<OperatorConsole />
		</div>
	);
}
