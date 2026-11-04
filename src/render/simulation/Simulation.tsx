import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { getWorld } from "@/core/world.ts";
import { getBoard } from "@/game/board/registry.ts";
import { useDialogueStore } from "@/game/dialogue/store.ts";
import { useGameConfig } from "@/game/stores/useGameConfig.ts";
import { updateNpcs } from "@/game/systems/npcs.ts";

// Punto de entrada de sistemas headless dentro del loop R3F.
// La simulación corre aquí; las vistas solo leen traits.
export function Simulation() {
	const { config } = useGameConfig();
	const start = useDialogueStore((s) => s.start);
	const board = useMemo(() => getBoard(config.boardId), [config.boardId]);

	useFrame((_, rawDelta) => {
		const dt = Math.min(rawDelta, 0.1);
		updateNpcs(getWorld(), board, dt, {
			onSpeak: (scriptId) => start(scriptId),
		});
	});
	return null;
}
