import type { World } from "koota";
import { create } from "zustand";
import type { BoardGraph } from "@/game/board/graph.ts";
import type { ItemUseResult } from "@/game/items/items.ts";
import { getItem } from "@/game/items/items.ts";

export type ItemEntry = {
	uid: string;
	itemId: string;
};

let uidCounter = 0;

type InventoryState = {
	items: Record<number, ItemEntry[]>;
	give: (playerIndex: number, itemId: string) => void;
	ensureStarterKit: (playerCount: number) => void;
	consumeItem: (
		world: World,
		board: BoardGraph,
		cols: number,
		playerIndex: number,
		uid: string,
	) => ItemUseResult | null;
	reset: () => void;
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
	items: {},

	give: (playerIndex, itemId) =>
		set((s) => ({
			items: {
				...s.items,
				[playerIndex]: [
					...(s.items[playerIndex] ?? []),
					{ uid: `item-${++uidCounter}`, itemId },
				],
			},
		})),

	ensureStarterKit: (playerCount) => {
		const { items } = get();
		if (Object.keys(items).length > 0) return;
		const fresh: Record<number, ItemEntry[]> = {};
		for (let i = 0; i < playerCount; i++) {
			fresh[i] = [{ uid: `item-${++uidCounter}`, itemId: "moneda-extra" }];
		}
		set({ items: fresh });
	},

	consumeItem: (world, board, cols, playerIndex, uid) => {
		const entry = (get().items[playerIndex] ?? []).find((e) => e.uid === uid);
		const def = entry ? getItem(entry.itemId) : undefined;
		if (!entry || !def) return null;
		const result = def.use({
			world,
			board,
			cols,
			playerIndex,
			rng: Math.random,
		});
		if (result.ok) {
			set((s) => ({
				items: {
					...s.items,
					[playerIndex]: (s.items[playerIndex] ?? []).filter(
						(e) => e.uid !== uid,
					),
				},
			}));
		}
		return result;
	},

	reset: () => set({ items: {} }),
}));
