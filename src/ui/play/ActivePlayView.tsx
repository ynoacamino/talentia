/**
 * ActivePlayView — Vista de Juego Activo ([PLAY-03], SPEC §12)
 * Conforme a SPEC §12:
 * - Área 3D (~70% centro) con placeholder diorama y banner de estación.
 * - Riel derecho con tarjetas de alumnos y anillos de estado.
 * - Minimapa (~100px bottom-left).
 * - Subtítulos inferiores de 2 líneas (expiración 6s).
 * - Barra inferior de checklist (3 pasos) + inventario compartido (madera, plano, sello).
 * - Temporizador top-left (mm:ss, flash pausa, rojo en últimos 60s).
 */
import { useEffect } from "react";
import { ChecklistBar } from "@/ui/play/ChecklistBar.tsx";
import { DrawingOverlay } from "@/ui/play/DrawingOverlay.tsx";
import { EquipoEndScreen } from "@/ui/play/EquipoEndScreen.tsx";
import { Minimap } from "@/ui/play/Minimap.tsx";
import { STATIONS, usePlayStore } from "@/ui/play/playStore.ts";
import { RightRail } from "@/ui/play/RightRail.tsx";
import { SubtitlesView } from "@/ui/play/SubtitlesView.tsx";
import { ZoomMapOverlay } from "@/ui/play/ZoomMapOverlay.tsx";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export function ActivePlayView() {
	const {
		currentStation,
		gameTimeSeconds,
		isTimerPaused,
		pauseReason,
		isWalking,
		shakeMessage,
		endType,
	} = usePlayStore();

	// Temporizador de juego
	useEffect(() => {
		if (isTimerPaused || gameTimeSeconds <= 0 || endType !== null) return;
		const interval = setInterval(() => {
			usePlayStore.setState((s) => {
				const nextTime = Math.max(0, s.gameTimeSeconds - 1);
				if (nextTime === 0) {
					s.triggerPartialEnd();
				}
				return { gameTimeSeconds: nextTime };
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [isTimerPaused, gameTimeSeconds, endType]);

	const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	const currentStationInfo = STATIONS[currentStation] ?? STATIONS.campamento;
	const isUrgentTime = gameTimeSeconds <= 60;

	return (
		<div className="relative h-full w-full bg-slate-950 overflow-hidden select-none">
			{/* Temporizador Top-Left (§10, §12) */}
			<div className="absolute top-4 left-6 z-20 flex items-center gap-3">
				<div
					className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all ${
						isUrgentTime
							? "bg-red-950/80 border-red-500 text-red-300 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]"
							: "bg-slate-900/80 border-slate-700/80 text-white"
					}`}
				>
					<span className="text-sm">⏳</span>
					<span className="text-xl font-mono font-black tracking-tight">
						{formatTime(gameTimeSeconds)}
					</span>
					{isTimerPaused && (
						<span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
							{pauseReason ? `Pausa (${pauseReason})` : "Pausa"}
						</span>
					)}
				</div>
			</div>

			{/* Banner de Estación Activa (Top Center) */}
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
				<div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 backdrop-blur-md shadow-2xl">
					<span className="text-2xl">{currentStationInfo.icon}</span>
					<div>
						<div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
							Estación Activa
						</div>
						<div className="text-base font-black text-white">
							{currentStationInfo.name} — {currentStationInfo.npcName}
						</div>
					</div>
				</div>
			</div>

			{/* Banner de Marcha Grupal (§7, §19: 'llegando a X…') */}
			{isWalking && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-pop">
					<div className="px-6 py-3 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 font-black text-lg shadow-2xl flex items-center gap-3">
						<span className="animate-bounce">🚶‍♂️</span>
						<span>{LOCKED_STRINGS.MID_WALK(currentStationInfo.name)}</span>
					</div>
				</div>
			)}

			{/* Mensaje Momentáneo (Shake Text, SPEC §12) */}
			{shakeMessage && (
				<div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-shake">
					<div className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-base shadow-2xl flex items-center gap-2">
						<span>⚠️</span>
						<span>{shakeMessage}</span>
					</div>
				</div>
			)}

			{/* Área Central 3D Placeholder Diorama (~70% de la pantalla) */}
			<div className="absolute top-0 left-0 right-72 bottom-18 bg-radial from-slate-900 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-8">
				{/* Diorama Visual Decorativo */}
				<div className="relative w-full max-w-3xl h-96 rounded-3xl border-2 border-slate-800 bg-slate-900/60 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-6 backdrop-blur-sm">
					{/* Fondo de río y montañas estilizadas */}
					<div className="absolute inset-x-0 bottom-0 h-32 bg-blue-950/20 border-t border-blue-900/30 flex items-center justify-center">
						<span className="text-xs font-bold text-blue-400 tracking-widest uppercase opacity-40">
							~~ Río Caudaloso ~~
						</span>
					</div>

					{/* Elemento Central del Escenario */}
					<div className="my-auto text-center z-10">
						<div className="text-7xl mb-4 animate-pop drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
							{currentStationInfo.icon}
						</div>
						<h3 className="text-2xl font-black text-white">
							{currentStationInfo.name}
						</h3>
						<p className="text-sm text-slate-300 max-w-md mx-auto mt-1">
							{currentStationInfo.description}
						</p>
					</div>

					{/* Tag de la PNJ activa */}
					<div className="z-10 px-4 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-bold text-slate-200">
						Hablando con:{" "}
						<span className="text-amber-300">{currentStationInfo.npcName}</span>
					</div>
				</div>
			</div>

			{/* Subtítulos Inferiores (2 líneas, expiración 6s) */}
			<SubtitlesView />

			{/* Minimapa (~100px bottom-left) */}
			<Minimap />

			{/* Barra Inferior con Checklist de 3 pasos e Inventario Compartido */}
			<ChecklistBar />

			{/* Riel Derecho de Tarjetas de Alumnos */}
			<RightRail />

			{/* Overlays Modales */}
			<DrawingOverlay />
			<ZoomMapOverlay />
			<EquipoEndScreen />
		</div>
	);
}
