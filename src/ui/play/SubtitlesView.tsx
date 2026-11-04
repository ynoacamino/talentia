/**
 * SubtitlesView — Subtítulos de 2 Líneas ([PLAY-03], SPEC §12)
 * Conforme a SPEC §12:
 * - 2 líneas máximo, expiración automática 6s.
 * - Punto de color distintivo + nombre del hablante (color del niño, blanco para NPC).
 * - Always-on: cada frase de PNJ y cada intervención de los niños tras STT.
 */
import { useEffect } from "react";
import { usePlayStore } from "@/ui/play/playStore.ts";

export function SubtitlesView() {
	const { activeSubtitles, clearExpiredSubtitles } = usePlayStore();

	useEffect(() => {
		const interval = setInterval(() => {
			clearExpiredSubtitles();
		}, 1000);
		return () => clearInterval(interval);
	}, [clearExpiredSubtitles]);

	if (activeSubtitles.length === 0) return null;

	return (
		<div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 pointer-events-none z-20">
			<div className="flex flex-col gap-2 items-center">
				{activeSubtitles.slice(-2).map((sub) => (
					<div
						key={sub.id}
						className="px-5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white max-w-xl animate-pop pointer-events-auto"
					>
						{/* Punto de color + Nombre */}
						<div className="flex items-center gap-2 shrink-0">
							<span
								className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
								style={{ backgroundColor: sub.speakerColor }}
							/>
							<span
								className="text-xs font-black uppercase tracking-wide"
								style={{
									color:
										sub.speakerType === "npc" ? "#ffffff" : sub.speakerColor,
								}}
							>
								{sub.speakerName}:
							</span>
						</div>

						{/* Texto limitado a 2 líneas */}
						<div className="text-sm font-medium line-clamp-2 leading-snug text-slate-100">
							"{sub.text}"
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
