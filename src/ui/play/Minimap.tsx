/**
 * Minimap — Minimapa Circular (~100px) ([PLAY-03], SPEC §7)
 * Conforme a SPEC §7:
 * - Minimapa bottom-left ~100px circular.
 * - 5 estaciones + punto del grupo (party dot).
 * - Estación activa con anillo, tap abre zoom mapa.
 */
import { type StationId, usePlayStore } from "@/ui/play/playStore.ts";

export function Minimap() {
	const { currentStation, openMap } = usePlayStore();

	// Posiciones relativas en el radar circular (%)
	const stationPositions: Record<
		StationId,
		{ x: number; y: number; label: string; icon: string }
	> = {
		campamento: { x: 50, y: 78, label: "Campamento", icon: "⛺" },
		chacra: { x: 22, y: 55, label: "Chacra", icon: "🌾" },
		taller: { x: 78, y: 55, label: "Taller", icon: "📐" },
		alcaldia: { x: 74, y: 25, label: "Alcaldía", icon: "🏛️" },
		puente: { x: 50, y: 20, label: "Puente", icon: "🌉" },
	};

	return (
		<button
			type="button"
			onClick={openMap}
			className="absolute bottom-22 left-6 w-24 h-24 rounded-full bg-slate-950/90 border-3 border-slate-700/80 shadow-2xl backdrop-blur-md cursor-pointer hover:border-amber-400 hover:scale-105 active:scale-95 transition-all z-20 group"
			title="Tocar para abrir mapa y votar viaje"
		>
			{/* Grid circular sutil */}
			<div className="absolute inset-0 rounded-full border border-slate-800 pointer-events-none" />
			<div className="absolute inset-2 rounded-full border border-dashed border-slate-800/80 pointer-events-none" />

			{/* Estaciones (5 puntos) */}
			{(
				Object.entries(stationPositions) as [
					StationId,
					(typeof stationPositions)[StationId],
				][]
			).map(([id, pos]) => {
				const isCurrent = currentStation === id;
				return (
					<div
						key={id}
						style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
						className={`absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
							isCurrent
								? "bg-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-10 scale-125"
								: "bg-slate-500 border border-slate-900"
						}`}
					>
						{isCurrent && (
							<span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
						)}
					</div>
				);
			})}

			{/* Indicador de "MAPA" en el centro */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
				<span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
					MAPA
				</span>
			</div>
		</button>
	);
}
