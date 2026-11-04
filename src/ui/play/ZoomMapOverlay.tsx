/**
 * ZoomMapOverlay — Mapa Zoom y Sistema de Votación/Veto ([PLAY-05], SPEC §7, §19)
 * Conforme a SPEC §7, §19:
 * - Overlay fullscreen (reloj corre, habla abierta, dibujo bloqueado).
 * - 5 botones grandes de estación con ícono + label + estado + marcador del grupo.
 * - Banner exacto: "¿Vamos a X? propuso [Nombre], mantén para vetar (5s)"
 * - Anillo de veto de 5s.
 * - Ejecución: "¡Vamos a X!" y marcha de 8-10s con mensaje "llegando a X…".
 */
import { useEffect, useState } from "react";
import { STATIONS, type StationId, usePlayStore } from "@/ui/play/playStore.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export function ZoomMapOverlay() {
	const {
		isMapOpen,
		closeMap,
		currentStation,
		proposedStation,
		proposerName,
		vetoCountdown,
		proposeMove,
		cancelMoveProposal,
		executeMove,
		cards,
	} = usePlayStore();

	const [isVetoHeld, setIsVetoHeld] = useState(false);

	// Cuenta regresiva de veto (5s)
	useEffect(() => {
		if (vetoCountdown === null) return;
		if (vetoCountdown <= 0) {
			if (proposedStation) {
				executeMove(proposedStation);
			}
			return;
		}
		const timer = setTimeout(() => {
			usePlayStore.setState({ vetoCountdown: vetoCountdown - 1 });
		}, 1000);
		return () => clearTimeout(timer);
	}, [vetoCountdown, proposedStation, executeMove]);

	if (!isMapOpen) return null;

	const handleStationClick = (stationId: StationId) => {
		if (stationId === currentStation) return;
		const activeCard = cards.find((c) => !c.isRetired) ?? cards[0];
		const proposer = activeCard?.studentName ?? "Equipo";
		proposeMove(stationId, proposer);
	};

	const handleHoldVeto = () => {
		setIsVetoHeld(true);
		// Un veto de 1 segundo cancela la propuesta (§7)
		setTimeout(() => {
			cancelMoveProposal();
			setIsVetoHeld(false);
		}, 1000);
	};

	const stationsList: StationId[] = [
		"campamento",
		"chacra",
		"taller",
		"alcaldia",
		"puente",
	];

	return (
		<div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-6 z-50 select-none animate-pop">
			{/* Header con botón X */}
			<div className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<div className="text-xs uppercase font-black tracking-widest text-amber-400">
						Mapa del Valle
					</div>
					<h3 className="text-2xl font-black text-white">
						Seleccionen un destino para viajar en equipo
					</h3>
				</div>
				<button
					type="button"
					onClick={closeMap}
					className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 cursor-pointer"
				>
					✕ Cerrar Mapa
				</button>
			</div>

			{/* Banner de Propuesta y Veto (§7, §19) */}
			{proposedStation && proposerName && (
				<div className="w-full max-w-2xl bg-amber-950/90 border-3 border-amber-400 p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-shake">
					<div>
						<div className="text-sm font-black text-amber-300">
							{LOCKED_STRINGS.BANNER_MOVE(
								STATIONS[proposedStation]?.name ?? proposedStation,
								proposerName,
							)}
						</div>
						<div className="text-xs text-amber-200/80 mt-1">
							Si alguien no está de acuerdo, mantenga presionado el botón de
							veto.
						</div>
					</div>

					<div className="flex items-center gap-3">
						{/* Anillo de 5s */}
						<div className="w-12 h-12 rounded-full border-3 border-amber-400 bg-amber-400/20 flex items-center justify-center font-black text-lg text-amber-300">
							{vetoCountdown}s
						</div>

						{/* Botón de Veto */}
						<button
							type="button"
							onPointerDown={handleHoldVeto}
							className={`px-5 py-3 rounded-2xl font-black text-sm tracking-wide shadow-lg border-2 cursor-pointer transition-all ${
								isVetoHeld
									? "bg-red-600 text-white border-red-400 scale-95"
									: "bg-red-950 hover:bg-red-900 text-red-200 border-red-700"
							}`}
							title="Mantener para vetar propuesta"
						>
							🛑 Vetar viaje
						</button>
					</div>
				</div>
			)}

			{/* 5 Botones Grandes de Estación (§7) */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl w-full my-auto">
				{stationsList.map((id) => {
					const info = STATIONS[id];
					const isCurrent = currentStation === id;
					const isProposed = proposedStation === id;

					return (
						<button
							key={id}
							type="button"
							onClick={() => handleStationClick(id)}
							className={`relative flex flex-col items-center justify-between p-5 rounded-3xl border-3 transition-all cursor-pointer ${
								isCurrent
									? "border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.3)] scale-105"
									: isProposed
										? "border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse"
										: "border-slate-700 bg-slate-900/80 hover:border-slate-500 hover:scale-102"
							}`}
						>
							{/* Marcador de grupo si es la estación actual */}
							{isCurrent && (
								<span className="absolute -top-3 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
									Aquí están
								</span>
							)}

							<div className="text-4xl my-2">{info?.icon ?? "📍"}</div>

							<div className="text-center">
								<h4 className="text-base font-black text-white">
									{info?.name}
								</h4>
								<div className="text-xs font-bold text-amber-300 mt-0.5">
									{info?.npcName}
								</div>
								<p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
									{info?.description}
								</p>
							</div>

							<div className="mt-4 w-full">
								<span
									className={`block w-full py-1.5 rounded-xl text-center text-xs font-black ${
										isCurrent
											? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
											: "bg-slate-800 text-slate-300 hover:bg-slate-700"
									}`}
								>
									{isCurrent ? "Ubicación actual" : "Proponer viaje →"}
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Footer con hint */}
			<div className="text-xs text-slate-400 text-center border-t border-slate-800 pt-3 w-full max-w-4xl">
				Cualquier miembro del equipo puede proponer un viaje. El viaje se
				ejecuta si nadie lo veta en 5 segundos.
			</div>
		</div>
	);
}
