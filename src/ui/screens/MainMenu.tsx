import { useUIStore } from "@/game/stores/useMatch.ts";
import { ConfigForm } from "@/ui/config/ConfigForm.tsx";

export function MainMenu() {
	const { setScreen } = useUIStore();
	return (
		<div className="flex h-full flex-col items-center justify-center gap-6">
			<h1 className="text-4xl font-black">Talentia Party</h1>
			<p className="text-slate-400">
				Tablero 3D + sprites 2D billboard. Vista superior, apunta a tu equipo.
			</p>
			<div className="w-80">
				<ConfigForm />
			</div>
			<button
				type="button"
				onClick={() => setScreen("game")}
				className="rounded bg-white px-6 py-3 font-bold text-black"
			>
				Jugar
			</button>
		</div>
	);
}
