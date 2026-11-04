import { getMinigame } from "@/game/minigames/registry.ts";
import { useMinigameStore } from "@/game/minigames/store.ts";

export function MinigameOverlay() {
	const activeId = useMinigameStore((s) => s.activeId);
	const phase = useMinigameStore((s) => s.phase);
	const scores = useMinigameStore((s) => s.scores);
	const setPhase = useMinigameStore((s) => s.setPhase);
	const reset = useMinigameStore((s) => s.reset);

	if (!activeId || phase === "idle") return null;
	const def = getMinigame(activeId);
	if (!def) return null;

	return (
		<div className="pointer-events-auto absolute top-4 right-4 w-72 rounded bg-black/70 p-4">
			<div className="text-xs tracking-widest text-slate-400 uppercase">
				{phase}
			</div>
			<div className="text-lg font-bold">{def.name}</div>
			<p className="mt-1 text-sm text-slate-300">{def.instructions}</p>
			{phase === "intro" && (
				<button
					type="button"
					onClick={() => setPhase("playing")}
					className="mt-3 w-full rounded bg-emerald-500 px-4 py-2 font-bold text-black"
				>
					¡Jugar!
				</button>
			)}
			{phase === "results" && (
				<div className="mt-2">
					<pre className="text-xs">{JSON.stringify(scores, null, 2)}</pre>
					<button
						type="button"
						onClick={reset}
						className="mt-2 w-full rounded bg-white px-4 py-2 font-bold text-black"
					>
						Volver al tablero
					</button>
				</div>
			)}
		</div>
	);
}
