import { useMinigameStore } from "@/game/minigames/store.ts";
import { getMinigameView } from "@/render/minigames/registry.ts";
import "@/render/minigames/TargetDummyView.tsx";

export function MinigameView() {
	const activeId = useMinigameStore((s) => s.activeId);
	const phase = useMinigameStore((s) => s.phase);
	if (!activeId || phase === "idle") return null;
	const View = getMinigameView(activeId);
	if (!View) return null;
	return <View />;
}
