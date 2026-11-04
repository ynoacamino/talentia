import { create } from "zustand";
import type { MatchPhase } from "@/shared/types.ts";

type UIState = {
	screen: "menu" | "lobby" | "game";
	selectedTile: number | null;
	setScreen: (s: UIState["screen"]) => void;
	selectTile: (t: number | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
	screen: "menu",
	selectedTile: null,
	setScreen: (screen) => set({ screen }),
	selectTile: (selectedTile) => set({ selectedTile }),
}));

type MatchState = {
	phase: MatchPhase;
	activePlayer: number;
	lastRoll: number | null;
	setPhase: (p: MatchPhase) => void;
	setActivePlayer: (i: number) => void;
	setLastRoll: (n: number | null) => void;
};

export const useMatchStore = create<MatchState>((set) => ({
	phase: "lobby",
	activePlayer: 0,
	lastRoll: null,
	setPhase: (phase) => set({ phase }),
	setActivePlayer: (activePlayer) => set({ activePlayer }),
	setLastRoll: (lastRoll) => set({ lastRoll }),
}));
