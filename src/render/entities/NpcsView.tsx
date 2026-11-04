import { useQuery } from "koota/react";
import { useMemo } from "react";
import { Npc, NpcMeta } from "@/game/npcs/npcs.ts";
import { NpcBillboard } from "@/render/entities/NpcBillboard.tsx";

export function NpcsView() {
	const npcs = useQuery(Npc, NpcMeta);
	const list = useMemo(() => [...npcs], [npcs]);
	return (
		<group>
			{list.map((entity) => {
				const n = entity.get(Npc);
				return (
					<NpcBillboard
						key={n ? `npc-${n.npcId}` : String(entity)}
						entity={entity}
					/>
				);
			})}
		</group>
	);
}
