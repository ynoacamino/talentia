import { useEffect } from "react";
import { GameCanvas } from "@/app/GameCanvas.tsx";
import { getWorld } from "@/core/world.ts";
import { spawnDefaultMatch } from "@/game/actions.ts";
import { useInventoryStore } from "@/game/items/store.ts";
import { listNpcs } from "@/game/npcs/npcs.ts";
import { spawnNpcs } from "@/game/npcs/spawner.ts";
import { useGameConfig } from "@/game/stores/useGameConfig.ts";
import { DialogueBox } from "@/ui/dialogue/DialogueBox.tsx";
import { HUD } from "@/ui/hud/HUD.tsx";
import { MinigameOverlay } from "@/ui/minigames/MinigameOverlay.tsx";

export function GameScreen() {
	const { config } = useGameConfig();

	useEffect(() => {
		spawnDefaultMatch(config);
		spawnNpcs(getWorld(), listNpcs());
		useInventoryStore.getState().ensureStarterKit(config.players.length);
	}, [config]);

	return (
		<div className="relative h-full w-full">
			<GameCanvas />
			<HUD />
			<DialogueBox />
			<MinigameOverlay />
		</div>
	);
}
