/**
 * ChecklistBar — Barra Inferior de Pasos e Inventario Compartido ([PLAY-03], SPEC §7)
 * Conforme a SPEC §7:
 * - 3 pasos exactos:
 *   1 Conseguir madera (chacra) → 2 Aprobar diseño (taller) → 3 Permiso (alcaldía)
 * - Inventario compartido único para el grupo: madera, plano, sello.
 */
import { usePlayStore } from "@/ui/play/playStore.ts";

export function ChecklistBar() {
	const { checklistStep, inventory } = usePlayStore();

	const steps = [
		{ id: 1, title: "1. Conseguir madera", station: "chacra" },
		{ id: 2, title: "2. Aprobar diseño", station: "taller" },
		{ id: 3, title: "3. Permiso", station: "alcaldía" },
	];

	return (
		<div className="absolute bottom-0 left-0 right-72 h-18 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md px-6 flex items-center justify-between z-10 select-none">
			{/* Checklist de 3 Pasos */}
			<div className="flex items-center gap-3">
				<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
					Misión:
				</span>
				{steps.map((st, idx) => {
					const isDone = checklistStep >= st.id;
					const isCurrent = checklistStep === st.id - 1;
					return (
						<div key={st.id} className="flex items-center gap-2">
							<div
								className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
									isDone
										? "bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm"
										: isCurrent
											? "bg-amber-400/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30 animate-pulse"
											: "bg-slate-900 border-slate-800 text-slate-300"
								}`}
							>
								<span>{isDone ? "✓" : st.id}</span>
								<span>{st.title}</span>
							</div>
							{idx < steps.length - 1 && (
								<span className="text-slate-600 font-bold text-xs">→</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Inventario Compartido del Grupo (Madera, Plano, Sello) */}
			<div className="flex items-center gap-4">
				<span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
					Inventario de Equipo:
				</span>

				{/* Item 1: Madera */}
				<div
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
						inventory.madera
							? "bg-amber-950/80 border-amber-600 text-amber-200 shadow-md"
							: "bg-slate-900/60 border-slate-800 text-slate-300"
					}`}
					title={
						inventory.madera
							? "Troncos de madera obtenidos"
							: "Madera pendiente"
					}
				>
					<span className="text-base">🪵</span>
					<span>Madera</span>
				</div>

				{/* Item 2: Plano */}
				<div
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
						inventory.plano
							? "bg-sky-950/80 border-sky-600 text-sky-200 shadow-md"
							: "bg-slate-900/60 border-slate-800 text-slate-300"
					}`}
					title={
						inventory.plano ? "Plano de ingeniería aprobado" : "Plano pendiente"
					}
				>
					<span className="text-base">📐</span>
					<span>Plano</span>
				</div>

				{/* Item 3: Sello */}
				<div
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
						inventory.sello
							? "bg-purple-950/80 border-purple-600 text-purple-200 shadow-md"
							: "bg-slate-900/60 border-slate-800 text-slate-300"
					}`}
					title={
						inventory.sello ? "Permiso y sello municipal" : "Sello pendiente"
					}
				>
					<span className="text-base">📜</span>
					<span>Sello</span>
				</div>
			</div>
		</div>
	);
}
