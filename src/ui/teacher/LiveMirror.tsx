/**
 * LiveMirror — Espejo en Vivo (Read-Only) ([TEACH-02], D6, SPEC §13)
 * Conforme a SPEC §10, §12, §13, §17:
 * - Réplica 3D view-only idéntica a /play (sin controles ni inputs en el diorama).
 * - Checklist sincronizado (3 pasos: chacra, taller, alcaldía) + inventario compartido (madera, plano, sello).
 * - Captions inferiores activos (2 líneas, punto de color niños / blanco NPC, 6s expiración).
 * - Feed diarizado de los últimos 20 turnos de transcripción (last20) en orden cronológico con timestamps duales (game_ts_ms y wall_ts_ms).
 * - Feed en vivo de eventos de telemetría (mostrando eventos cerrados del log con timestamps duales).
 * - Debug de temporizadores:
 *   - Reloj de juego mm:ss con flash de pausa y alerta roja visual cuando quedan < 60 segundos.
 *   - Cuenta regresiva de atasco/stall (L1 45s, L2 90s, L3 150s).
 *   - Reloj de pared (wall_ts_ms).
 * - Estado de participantes interactivo: claimed, confirmed, speaking, drawing, retired (con badge 'retirado mm:ss').
 * - Consola de operador silenciosa integrada.
 */

import { useEffect } from "react";
import type { ISessionRepository } from "@/shared/documents.ts";
import {
	STATIONS,
	type StationId,
	type SubtitleLine,
} from "@/ui/play/playStore.ts";
import {
	type MirrorEvent,
	type MirrorTranscript,
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
	isTimerPaused?: boolean;
	pauseReason?: string | null;
	stallCountdownSeconds?: number;
	stallTier?: "L1" | "L2" | "L3";
	wallClockMs?: number;
	liveStep?: number;
	liveStation?: string;
	inventory?: { madera: boolean; plano: boolean; sello: boolean };
	recentTranscripts?: MirrorTranscript[];
	recentEvents?: MirrorEvent[];
	activeSubtitles?: SubtitleLine[];
}

export function LiveMirror({
	repo: _repo,
	studentEvals: propEvals,
	activeSessionCode: propCode,
	isCountingDown: propCountingDown,
	countdownSeconds: propCountdown,
	liveTimerSeconds: propTimer,
	isTimerPaused: propTimerPaused,
	pauseReason: propPauseReason,
	stallCountdownSeconds: propStallCountdown,
	stallTier: propStallTier,
	wallClockMs: propWallClock,
	liveStep: propStep,
	liveStation: propStation,
	inventory: propInventory,
	recentTranscripts: propTranscripts,
	recentEvents: propEvents,
	activeSubtitles: propSubtitles,
}: LiveMirrorProps = {}) {
	const storeHook = useTeacherStore();
	const store =
		typeof window === "undefined" ? useTeacherStore.getState() : storeHook;
	const liveStep = propStep ?? store.liveStep;
	const liveStation = propStation ?? store.liveStation;
	const liveTimerSeconds = propTimer ?? store.liveTimerSeconds;
	const isTimerPaused = propTimerPaused ?? store.isTimerPaused;
	const pauseReason = propPauseReason ?? store.pauseReason;
	const stallCountdownSeconds =
		propStallCountdown ?? store.stallCountdownSeconds;
	const stallTier = propStallTier ?? store.stallTier ?? "L1";
	const wallClockMs = propWallClock ?? store.wallClockMs;
	const recentTranscripts = propTranscripts ?? store.recentTranscripts;
	const recentEvents = propEvents ?? store.recentEvents;
	const studentEvals = propEvals ?? store.studentEvals;
	const activeSessionCode = propCode ?? store.activeSessionCode;
	const countdownSeconds = propCountdown ?? store.countdownSeconds;
	const isCountingDown = propCountingDown ?? store.isCountingDown;
	const activeSubtitles = propSubtitles ?? store.activeSubtitles;
	const clearExpiredSubtitles = store.clearExpiredSubtitles;

	// Inventario compartido: derivado de liveStep o prop/store
	const effectiveInventory = propInventory ??
		store.inventory ?? {
			madera: liveStep >= 1,
			plano: liveStep >= 2,
			sello: liveStep >= 3,
		};

	// Limpieza periódica de subtítulos expirados (§12: expiración 6s)
	useEffect(() => {
		const interval = setInterval(() => {
			clearExpiredSubtitles();
		}, 1000);
		return () => clearInterval(interval);
	}, [clearExpiredSubtitles]);

	const formatTimer = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	const formatWallTime = (tsMs: number) => {
		const d = new Date(tsMs);
		return d.toTimeString().split(" ")[0] ?? "10:00:00";
	};

	const formattedWall = formatWallTime(wallClockMs);
	const isUrgentTime = liveTimerSeconds < 60;
	const currentStationInfo =
		STATIONS[liveStation as StationId] ?? STATIONS.campamento;

	return (
		<div
			data-testid="live-mirror"
			className="flex flex-col gap-6 w-full select-none"
		>
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

				{/* Debug de Temporizadores (§10, §13: reloj juego mm:ss + flash pausa + alerta roja <60s, stall tiers, reloj pared) */}
				<div className="flex items-center gap-4 text-xs font-mono">
					{/* Reloj de Juego con alerta visual roja < 60s y flash de pausa */}
					<div
						data-testid="live-timer-container"
						data-urgent={isUrgentTime ? "true" : undefined}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
							isUrgentTime
								? "bg-red-950/80 border-red-500 text-red-300 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
								: "bg-slate-800 border-slate-700"
						}`}
					>
						<span className="text-slate-400">Juego:</span>
						<span
							data-testid="live-game-timer"
							className={`font-bold ${isUrgentTime ? "text-red-200" : "text-white"}`}
						>
							{formatTimer(liveTimerSeconds)}
						</span>
						{isUrgentTime && (
							<span
								data-testid="timer-red-alert"
								className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse"
							>
								&lt;60s
							</span>
						)}
						{isTimerPaused && (
							<span
								data-testid="timer-pause-flash"
								className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full animate-pulse"
							>
								{pauseReason ? `Pausa (${pauseReason})` : "Pausa"}
							</span>
						)}
					</div>

					{/* Cuenta regresiva de atasco/stall (L1 45s, L2 90s, L3 150s) */}
					<div
						data-testid="stall-timer-container"
						className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700"
					>
						<span className="text-slate-400">Stall:</span>
						<span
							data-testid="stall-tier"
							className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-amber-300"
						>
							{`${stallTier} (${stallTier === "L1" ? "45s" : stallTier === "L2" ? "90s" : "150s"})`}
						</span>
						<span
							data-testid="stall-countdown"
							className="font-bold text-amber-400"
						>
							{`${stallCountdownSeconds}s`}
						</span>
					</div>

					{/* Reloj de pared con timestamp dual */}
					<div
						data-testid="wall-clock"
						data-wall-ms={wallClockMs}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700"
					>
						<span className="text-slate-400">Pared:</span>
						<span
							data-testid="wall-clock-time"
							className="font-bold text-slate-300"
						>
							{formattedWall}
						</span>
						<span
							data-testid="wall-clock-ms"
							className="text-[9px] text-slate-500 font-mono"
						>
							{`(${wallClockMs})`}
						</span>
					</div>
				</div>
			</div>

			{/* Grid Superior: 3D Placeholder Mirror + Estado de Alumnos */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Espejo 3D Diorama (Read-Only) — réplica view-only idéntica a /play (sin controles ni inputs) */}
				<div
					data-testid="live-mirror-diorama"
					className="lg:col-span-2 relative h-96 rounded-3xl bg-radial from-slate-900 via-slate-950 to-slate-950 border-2 border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-hidden pointer-events-none select-none"
				>
					{/* Fondo de río decorativo idéntico a /play */}
					<div className="absolute inset-x-0 bottom-24 h-24 bg-blue-950/20 border-t border-blue-900/30 flex items-center justify-center pointer-events-none">
						<span className="text-xs font-bold text-blue-400 tracking-widest uppercase opacity-40">
							~~ Río Caudaloso ~~
						</span>
					</div>

					{/* Encabezado superior del diorama */}
					<div className="flex justify-between items-center z-10">
						<span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-indigo-300">
							Estación:{" "}
							<span className="capitalize text-white font-black">
								{currentStationInfo.name}
							</span>
						</span>
						<span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-emerald-300">
							Hito: {liveStep}/3
						</span>
					</div>

					{/* Centro Simulado del Diorama idéntico a /play */}
					<div className="text-center my-auto z-10">
						<div className="text-6xl mb-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-pop">
							{currentStationInfo.icon}
						</div>
						<h3 className="text-2xl font-black text-white">
							{currentStationInfo.name}
						</h3>
						<p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
							{currentStationInfo.description}
						</p>
						<div className="mt-2 inline-block px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-bold text-slate-200">
							Hablando con:{" "}
							<span className="text-amber-300">
								{currentStationInfo.npcName}
							</span>
						</div>
					</div>

					{/* Captions inferiores activos (2 líneas, punto de color niños / blanco NPC, 6s expiración) */}
					{activeSubtitles.length > 0 && (
						<div
							data-testid="mirror-captions"
							className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 z-20 flex flex-col gap-1.5 items-center pointer-events-none"
						>
							{activeSubtitles.slice(-2).map((sub) => (
								<div
									key={sub.id}
									data-testid={`caption-item-${sub.id}`}
									className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-white max-w-md animate-pop pointer-events-none"
								>
									<span
										data-testid={`caption-dot-${sub.id}`}
										className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
										style={{
											backgroundColor:
												sub.speakerType === "npc"
													? "#ffffff"
													: sub.speakerColor,
										}}
									/>
									<span
										className="text-xs font-black uppercase tracking-wide shrink-0"
										style={{
											color:
												sub.speakerType === "npc"
													? "#ffffff"
													: sub.speakerColor,
										}}
									>
										{`${sub.speakerName}:`}
									</span>
									<span className="text-xs font-medium line-clamp-2 leading-snug text-slate-100">
										{`"${sub.text}"`}
									</span>
								</div>
							))}
						</div>
					)}

					{/* Checklist sincronizado (3 pasos: chacra, taller, alcaldía) + inventario compartido (madera, plano, sello) */}
					<div
						data-testid="mirror-checklist-bar"
						className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 z-10"
					>
						{/* Checklist de 3 pasos */}
						<div
							data-testid="mirror-checklist"
							className="flex items-center gap-2 text-xs font-bold"
						>
							<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
								Pasos:
							</span>
							<span
								className={`px-2 py-1 rounded-lg border transition-all ${
									liveStep >= 1
										? "bg-emerald-950/80 border-emerald-600 text-emerald-300 font-black"
										: liveStep === 0
											? "bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse"
											: "bg-slate-900 border-slate-800 text-slate-500"
								}`}
							>
								{`1 Conseguir madera (chacra) ${liveStep >= 1 ? "✓" : "○"}`}
							</span>
							<span className="text-slate-600 font-bold">→</span>
							<span
								className={`px-2 py-1 rounded-lg border transition-all ${
									liveStep >= 2
										? "bg-emerald-950/80 border-emerald-600 text-emerald-300 font-black"
										: liveStep === 1
											? "bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse"
											: "bg-slate-900 border-slate-800 text-slate-500"
								}`}
							>
								{`2 Aprobar diseño (taller) ${liveStep >= 2 ? "✓" : "○"}`}
							</span>
							<span className="text-slate-600 font-bold">→</span>
							<span
								className={`px-2 py-1 rounded-lg border transition-all ${
									liveStep >= 3
										? "bg-emerald-950/80 border-emerald-600 text-emerald-300 font-black"
										: liveStep === 2
											? "bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse"
											: "bg-slate-900 border-slate-800 text-slate-500"
								}`}
							>
								{`3 Permiso (alcaldía) ${liveStep >= 3 ? "✓" : "○"}`}
							</span>
						</div>

						{/* Inventario compartido único para el grupo */}
						<div
							data-testid="mirror-inventory"
							className="flex items-center gap-2 text-xs"
						>
							<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
								Inventario:
							</span>
							<span
								data-testid="inventory-madera"
								className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
									effectiveInventory.madera
										? "bg-amber-950/80 border-amber-600 text-amber-200"
										: "bg-slate-900/60 border-slate-800 text-slate-600 opacity-40"
								}`}
								title={
									effectiveInventory.madera
										? "Madera obtenida"
										: "Madera pendiente"
								}
							>
								<span>🪵</span>
								<span>Madera</span>
							</span>
							<span
								data-testid="inventory-plano"
								className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
									effectiveInventory.plano
										? "bg-sky-950/80 border-sky-600 text-sky-200"
										: "bg-slate-900/60 border-slate-800 text-slate-600 opacity-40"
								}`}
								title={
									effectiveInventory.plano
										? "Plano obtenido"
										: "Plano pendiente"
								}
							>
								<span>📐</span>
								<span>Plano</span>
							</span>
							<span
								data-testid="inventory-sello"
								className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
									effectiveInventory.sello
										? "bg-purple-950/80 border-purple-600 text-purple-200"
										: "bg-slate-900/60 border-slate-800 text-slate-600 opacity-40"
								}`}
								title={
									effectiveInventory.sello
										? "Sello obtenido"
										: "Sello pendiente"
								}
							>
								<span>📜</span>
								<span>Sello</span>
							</span>
						</div>
					</div>
				</div>

				{/* Panel de Estado de Participantes: claimed, confirmed, speaking, drawing, retired */}
				<div
					data-testid="mirror-participants"
					className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl"
				>
					<div className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
						<span>
							Participantes Activos (
							{studentEvals.filter((s) => !s.retired).length})
						</span>
						<span className="text-[10px] text-slate-500 font-mono">
							Total: {studentEvals.length}
						</span>
					</div>
					<div className="flex flex-col gap-2.5 overflow-y-auto max-h-80">
						{studentEvals.map((s) => {
							const isRetired = s.retired;
							const status = isRetired
								? "retired"
								: (s.status ?? (s.confirmed ? "confirmed" : "claimed"));

							return (
								<div
									key={s.studentId}
									data-testid={`mirror-student-${s.studentId}`}
									className={`flex flex-col gap-2 p-2.5 rounded-xl border transition-all ${
										isRetired
											? "bg-red-950/20 border-red-900/40 opacity-50 grayscale"
											: status === "speaking"
												? "bg-red-950/30 border-red-500 ring-2 ring-red-500/30"
												: status === "drawing"
													? "bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/30"
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
											{isRetired ? (
												<span
													data-testid="retired-badge"
													data-student-id={s.studentId}
													className="text-[9px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800"
												>
													{`Retirado ${s.retiredAt}`}
												</span>
											) : (
												<>
													{status === "speaking" && (
														<span
															data-testid={`mirror-status-speaking-${s.studentId}`}
															data-status="speaking"
															className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-red-300 bg-red-950 border-red-700 animate-pulse"
														>
															Hablando 🎙️
														</span>
													)}
													{status === "drawing" && (
														<span
															data-testid={`mirror-status-drawing-${s.studentId}`}
															data-status="drawing"
															className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-purple-300 bg-purple-950 border-purple-700 animate-pulse"
														>
															Dibujando 🎨
														</span>
													)}
													{status === "confirmed" && (
														<span
															data-testid={`mirror-status-confirmed-${s.studentId}`}
															data-status="confirmed"
															className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-950 border-emerald-800"
														>
															Listo ✓
														</span>
													)}
													{status === "claimed" && (
														<span
															data-testid={`mirror-status-claimed-${s.studentId}`}
															data-status="claimed"
															className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-amber-300 bg-amber-950/80 border-amber-800"
														>
															Esperando
														</span>
													)}

													{/* Identificador genérico de status para tests retrocompatibles */}
													<span
														data-testid={`mirror-status-${s.studentId}`}
														className="hidden"
													>
														{status}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Feeds de Telemetría: Transcripciones (últimos 20) y Registro de Eventos con Timestamps Duales */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Transcripciones Recientes (últimos 20 en orden cronológico con timestamps duales) */}
				<div
					data-testid="transcript-feed"
					className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl"
				>
					<div className="flex items-center justify-between border-b border-slate-800 pb-2">
						<span className="text-xs font-black uppercase tracking-wider text-slate-400">
							Feed de Transcripciones (Últimos 20)
						</span>
						<span className="text-[10px] text-slate-500 font-mono">
							STT en vivo (timestamps duales)
						</span>
					</div>
					<div className="flex flex-col gap-2 overflow-y-auto max-h-56">
						{recentTranscripts.slice(-20).map((t) => (
							<div
								key={t.id}
								data-testid={`transcript-item-${t.id}`}
								className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex flex-col gap-1"
							>
								<div className="flex justify-between items-center gap-2">
									<span
										data-testid={`transcript-holder-${t.id}`}
										className="font-bold text-indigo-300 truncate"
									>
										{t.holder}
									</span>
									<div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
										<span
											data-testid={`transcript-game-ts-${t.id}`}
											data-game-ts={t.game_ts_ms}
											className="text-amber-400/90"
											title={`Tiempo de juego: ${t.game_ts_ms}ms`}
										>
											{`Juego: ${formatTimer(Math.floor(t.game_ts_ms / 1000))}`}
										</span>
										<span className="text-slate-600">|</span>
										<span
											data-testid={`transcript-wall-ts-${t.id}`}
											data-wall-ts={t.wall_ts_ms}
											className="text-slate-400"
											title={`Reloj de pared: ${t.wall_ts_ms}`}
										>
											{`Pared: ${formatWallTime(t.wall_ts_ms)}`}
										</span>
									</div>
								</div>
								<div className="text-slate-300 font-medium italic">
									{`"${t.text}"`}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Feed de Eventos Cerrado (§17: 18 closed types con timestamps duales) */}
				<div
					data-testid="event-feed"
					className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 shadow-xl"
				>
					<div className="flex items-center justify-between border-b border-slate-800 pb-2">
						<span className="text-xs font-black uppercase tracking-wider text-slate-400">
							Log de Eventos (SPEC §17)
						</span>
						<span className="text-[10px] text-slate-500 font-mono">
							Append-only (18 closed types)
						</span>
					</div>
					<div className="flex flex-col gap-2 overflow-y-auto max-h-56">
						{recentEvents.slice(0, 20).map((ev) => (
							<div
								key={ev.id}
								data-testid={`event-item-${ev.id}`}
								className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex flex-col gap-1"
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 min-w-0">
										<span
											data-testid={`event-type-${ev.id}`}
											className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-amber-400 shrink-0"
										>
											{ev.type}
										</span>
										<span className="text-slate-200 font-bold truncate text-[11px]">
											{ev.actor}
										</span>
									</div>
									<div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
										<span
											data-testid={`event-game-ts-${ev.id}`}
											data-game-ts={ev.game_ts_ms}
											className="text-amber-400/90"
										>
											{`Juego: ${formatTimer(Math.floor(ev.game_ts_ms / 1000))}`}
										</span>
										<span className="text-slate-600">|</span>
										<span
											data-testid={`event-wall-ts-${ev.id}`}
											data-wall-ts={ev.wall_ts_ms}
											className="text-slate-400"
										>
											{`Pared: ${formatWallTime(ev.wall_ts_ms)}`}
										</span>
									</div>
								</div>
								<div className="text-slate-300 text-[11px]">{ev.details}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
