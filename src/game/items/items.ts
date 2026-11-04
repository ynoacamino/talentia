import type { World } from "koota";
import { tileToWorld } from "@/core/math.ts";
import type { BoardGraph } from "@/game/board/graph.ts";
import { findPlayerEntity } from "@/game/tiles/effects.ts";
import { Player, Transform } from "@/game/traits.ts";

export type ItemUseCtx = {
	world: World;
	board: BoardGraph;
	cols: number;
	playerIndex: number;
	rng: () => number;
};

export type ItemUseResult = {
	ok: boolean;
	message: string;
};

export type ItemDef = {
	id: string;
	name: string;
	description: string;
	icon: string;
	use: (ctx: ItemUseCtx) => ItemUseResult;
};

const items = new Map<string, ItemDef>();

export function defineItem(def: ItemDef): ItemDef {
	return def;
}

export function registerItem(def: ItemDef): void {
	items.set(def.id, def);
}

export function getItem(id: string): ItemDef | undefined {
	return items.get(id);
}

export function listItems(): ItemDef[] {
	return [...items.values()];
}

export function clearItems(): void {
	items.clear();
}

registerItem(
	defineItem({
		id: "moneda-extra",
		name: "Moneda extra",
		description: "Gana 5 monedas al instante.",
		icon: "🪙",
		use: ({ world, playerIndex }) => {
			const entity = findPlayerEntity(world, playerIndex);
			const p = entity?.get(Player);
			if (!entity || !p) return { ok: false, message: "Sin jugador" };
			entity.set(Player, { coins: p.coins + 5 });
			return { ok: true, message: "+5 monedas" };
		},
	}),
);

registerItem(
	defineItem({
		id: "roba-monedas",
		name: "Robo",
		description: "Roba hasta 5 monedas al jugador más rico.",
		icon: "🥷",
		use: ({ world, playerIndex }) => {
			const me = findPlayerEntity(world, playerIndex);
			const my = me?.get(Player);
			if (!me || !my) return { ok: false, message: "Sin jugador" };
			let richest: { index: number; coins: number } | null = null;
			for (const e of world.query(Player)) {
				const p = e.get(Player);
				if (!p || p.index === playerIndex) continue;
				if (!richest || p.coins > richest.coins) {
					richest = { index: p.index, coins: p.coins };
				}
			}
			if (!richest || richest.coins <= 0) {
				return { ok: false, message: "Nadie tiene monedas" };
			}
			const amount = Math.min(5, richest.coins);
			const victim = findPlayerEntity(world, richest.index);
			const vp = victim?.get(Player);
			if (victim && vp) victim.set(Player, { coins: vp.coins - amount });
			me.set(Player, { coins: my.coins + amount });
			return { ok: true, message: `Robaste ${amount} monedas` };
		},
	}),
);

registerItem(
	defineItem({
		id: "teleport-star",
		name: "Teleport estrella",
		description: "Viaja a la próxima casilla estrella.",
		icon: "🌟",
		use: ({ world, board, cols, playerIndex }) => {
			const entity = findPlayerEntity(world, playerIndex);
			const p = entity?.get(Player);
			if (!entity || !p) return { ok: false, message: "Sin jugador" };
			const star = board.tiles.find(
				(t) => t.kind === "star" && t.index !== p.tileIndex,
			);
			if (!star) return { ok: false, message: "No hay estrellas" };
			entity.set(Player, { tileIndex: star.index });
			const pos = tileToWorld(star.index, cols);
			entity.set(Transform, { x: pos.x, y: 0, z: pos.z });
			return { ok: true, message: `Teleport a casilla ${star.index}` };
		},
	}),
);
