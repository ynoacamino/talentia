import { useQuery } from "koota/react";
import { useMemo } from "react";
import { Player, PlayerMeta } from "@/game/traits.ts";
import { PlayerBillboard } from "@/render/entities/PlayerBillboard.tsx";

export function PlayersView() {
	const players = useQuery(Player, PlayerMeta);
	const list = useMemo(() => [...players], [players]);
	return (
		<group>
			{list.map((entity) => {
				const p = entity.get(Player);
				return (
					<PlayerBillboard
						key={p ? `player-${p.index}` : String(entity)}
						entity={entity}
					/>
				);
			})}
		</group>
	);
}
