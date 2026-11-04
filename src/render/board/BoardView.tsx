import { useMemo } from "react";
import { tileToWorld } from "@/core/math.ts";
import { getBoard, getBoardCols } from "@/game/board/registry.ts";
import { useGameConfig } from "@/game/stores/useGameConfig.ts";

function tileColor(kind: string): string {
	if (kind === "start") return "#22c55e";
	if (kind === "star") return "#eab308";
	if (kind === "event") return "#8b5cf6";
	if (kind === "trap") return "#ef4444";
	if (kind === "bonus") return "#06b6d4";
	return "#334155";
}

export function BoardView() {
	const { config } = useGameConfig();
	const board = useMemo(() => getBoard(config.boardId), [config.boardId]);
	const cols = getBoardCols(config.boardId);

	return (
		<group>
			{board.tiles.map((t) => {
				const p = tileToWorld(t.index, cols);
				return (
					<mesh key={t.index} position={[p.x, -0.25, p.z]}>
						<boxGeometry args={[1.8, 0.5, 1.8]} />
						<meshStandardMaterial color={tileColor(t.kind)} />
					</mesh>
				);
			})}
		</group>
	);
}
