import { create } from "zustand";
import { persist } from "zustand/middleware";
import { configStorageKey, loadJSON } from "@/core/storage.ts";
import { defaultGameConfig } from "@/game/config.ts";
import type { GameConfig } from "@/shared/types.ts";

type GameConfigState = {
	config: GameConfig;
	setConfig: (patch: Partial<GameConfig>) => void;
	reset: () => void;
};

const initial = loadJSON<GameConfig>(configStorageKey, defaultGameConfig());

export const useGameConfig = create<GameConfigState>()(
	persist(
		(set) => ({
			config: initial,
			setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
			reset: () => set({ config: defaultGameConfig() }),
		}),
		{ name: configStorageKey },
	),
);
