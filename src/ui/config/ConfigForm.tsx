import { useGameConfig } from "@/game/stores/useGameConfig.ts";
import { PLAYER_COLORS } from "@/shared/constants.ts";

export function ConfigForm() {
	const { config, setConfig } = useGameConfig();

	return (
		<div className="flex flex-col gap-4">
			<label className="flex flex-col gap-1 text-sm">
				Vueltas para ganar
				<input
					type="number"
					min={1}
					max={10}
					value={config.lapsToWin}
					onChange={(e) => setConfig({ lapsToWin: Number(e.target.value) })}
					className="rounded bg-slate-800 px-3 py-2"
				/>
			</label>
			<div className="flex flex-col gap-2">
				{config.players.map((p, i) => (
					<div key={p.name} className="flex items-center gap-2">
						<span
							className="h-6 w-6 rounded-full"
							style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
						/>
						<input
							value={p.name}
							onChange={(e) => {
								const players = [...config.players];
								players[i] = {
									name: e.target.value,
									color: PLAYER_COLORS[i % PLAYER_COLORS.length] ?? "#fff",
								};
								setConfig({ players });
							}}
							className="flex-1 rounded bg-slate-800 px-3 py-2"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
