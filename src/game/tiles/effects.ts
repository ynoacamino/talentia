import type { Entity, World } from "koota";
import type { TileKind } from "@/game/board/graph.ts";
import { Player } from "@/game/traits.ts";

export type TileEvent = {
	kind: "coins" | "stars" | "info";
	playerIndex: number;
	amount?: number;
	message: string;
};

export type TileEffectCtx = {
	world: World;
	playerIndex: number;
	rng: () => number;
};

export type TileEffectDef = {
	id: TileKind;
	apply: (ctx: TileEffectCtx) => TileEvent[];
};

const effects = new Map<TileKind, TileEffectDef>();

export function defineTileEffect(def: TileEffectDef): TileEffectDef {
	return def;
}

export function registerTileEffect(def: TileEffectDef): void {
	effects.set(def.id, def);
}

export function getTileEffect(kind: TileKind): TileEffectDef | undefined {
	return effects.get(kind);
}

export function findPlayerEntity(
	world: World,
	playerIndex: number,
): Entity | undefined {
	return world.query(Player).find((e) => e.get(Player)?.index === playerIndex);
}

function addCoins(world: World, playerIndex: number, amount: number): number {
	const entity = findPlayerEntity(world, playerIndex);
	const p = entity?.get(Player);
	if (!entity || !p) return 0;
	const coins = Math.max(0, p.coins + amount);
	entity.set(Player, { coins });
	return coins - p.coins;
}

function addStars(world: World, playerIndex: number, amount: number): void {
	const entity = findPlayerEntity(world, playerIndex);
	const p = entity?.get(Player);
	if (!entity || !p) return;
	entity.set(Player, { stars: p.stars + amount });
}

// Aplica el efecto de la casilla donde cayó el jugador. Retorna eventos para el feed.
export function applyTileEffect(
	world: World,
	kind: TileKind,
	playerIndex: number,
	rng: () => number = Math.random,
): TileEvent[] {
	return (
		getTileEffect(kind)?.apply({ world, playerIndex, rng }) ?? [
			{ kind: "info", playerIndex, message: `Casilla ${kind} sin efecto` },
		]
	);
}

registerTileEffect(
	defineTileEffect({
		id: "start",
		apply: ({ world, playerIndex }) => {
			const delta = addCoins(world, playerIndex, 3);
			return [
				{
					kind: "coins",
					playerIndex,
					amount: delta,
					message: "Bono de salida +3",
				},
			];
		},
	}),
);

registerTileEffect(
	defineTileEffect({
		id: "normal",
		apply: () => [],
	}),
);

registerTileEffect(
	defineTileEffect({
		id: "star",
		apply: ({ world, playerIndex }) => {
			const entity = findPlayerEntity(world, playerIndex);
			const p = entity?.get(Player);
			if (!entity || !p) return [];
			if (p.coins < 10) {
				return [
					{
						kind: "info",
						playerIndex,
						message: "Casilla estrella: necesitas 10 monedas",
					},
				];
			}
			addCoins(world, playerIndex, -10);
			addStars(world, playerIndex, 1);
			return [
				{
					kind: "stars",
					playerIndex,
					amount: 1,
					message: "¡Estrella! -10 monedas",
				},
			];
		},
	}),
);

registerTileEffect(
	defineTileEffect({
		id: "event",
		apply: ({ world, playerIndex, rng }) => {
			const roll = rng();
			if (roll < 0.4) {
				const delta = addCoins(world, playerIndex, 5);
				return [
					{
						kind: "coins",
						playerIndex,
						amount: delta,
						message: "Evento afortunado +5",
					},
				];
			}
			if (roll < 0.7) {
				addStars(world, playerIndex, 1);
				return [
					{
						kind: "stars",
						playerIndex,
						amount: 1,
						message: "Evento raro: +1 estrella",
					},
				];
			}
			const delta = addCoins(world, playerIndex, -3);
			return [
				{
					kind: "coins",
					playerIndex,
					amount: delta,
					message: "Evento malo -3",
				},
			];
		},
	}),
);

registerTileEffect(
	defineTileEffect({
		id: "trap",
		apply: ({ world, playerIndex }) => {
			const delta = addCoins(world, playerIndex, -4);
			return [
				{ kind: "coins", playerIndex, amount: delta, message: "¡Trampa! -4" },
			];
		},
	}),
);

registerTileEffect(
	defineTileEffect({
		id: "bonus",
		apply: ({ world, playerIndex }) => {
			const delta = addCoins(world, playerIndex, 5);
			return [
				{ kind: "coins", playerIndex, amount: delta, message: "Bonus +5" },
			];
		},
	}),
);
