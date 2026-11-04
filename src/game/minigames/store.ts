import { create } from "zustand";
import type { MinigamePhase } from "@/game/minigames/types.ts";

type MinigameState = {
	activeId: string | null;
	phase: MinigamePhase;
	scores: Record<string, number>;
	start: (id: string) => void;
	setPhase: (p: MinigamePhase) => void;
	finish: (scores: Record<string, number>) => void;
	reset: () => void;
};

export const useMinigameStore = create<MinigameState>((set) => ({
	activeId: null,
	phase: "idle",
	scores: {},
	start: (activeId) => set({ activeId, phase: "intro", scores: {} }),
	setPhase: (phase) => set({ phase }),
	finish: (scores) => set({ scores, phase: "results" }),
	reset: () => set({ activeId: null, phase: "idle", scores: {} }),
}));
