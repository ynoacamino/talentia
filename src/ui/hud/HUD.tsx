import { useState } from "react";
import { playSfx } from "@/core/audio.ts";
import { getWorld } from "@/core/world.ts";
import { getBoard, getBoardCols } from "@/game/board/registry.ts";
import { getItem } from "@/game/items/items.ts";
import { useInventoryStore } from "@/game/items/store.ts";
import { listMinigames } from "@/game/minigames/registry.ts";
import { useMinigameStore } from "@/game/minigames/store.ts";
import { useGameConfig } from "@/game/stores/useGameConfig.ts";
import { useMatchStore } from "@/game/stores/useMatch.ts";
import { nextPlayer, playTurn, rollTurn } from "@/game/systems/turn.ts";
import type { TileEvent } from "@/game/tiles/effects.ts";

function describeEvent(e: TileEvent): string {
	return e.amount !== undefined ? `${e.message} (${e.amount})` : e.message;
}

export function HUD() {
	const { config } = useGameConfig();
	const {
		phase,
		activePlayer,
		lastRoll,
		setPhase,
		setActivePlayer,
		setLastRoll,
	} = useMatchStore();
	const startMinigame = useMinigameStore((s) => s.start);
	const inventory = useInventoryStore((s) => s.items);
	const consumeItem = useInventoryStore((s) => s.consumeItem);
	const [feed, setFeed] = useState<TileEvent[]>([]);
	const [itemMsg, setItemMsg] = useState<string | null>(null);

	const onRoll = () => {
		playSfx("dice");
		const roll = rollTurn();
		setLastRoll(roll);
		setPhase("move");
		const board = getBoard(config.boardId);
		const result = playTurn(getWorld(), board, activePlayer, roll);
		if (result) {
			setFeed(result.events);
			if (result.events.some((e) => e.kind === "stars")) playSfx("star");
			else if (result.events.some((e) => e.kind === "coins")) playSfx("coin");
		}
		playSfx("step");
		setActivePlayer(nextPlayer(activePlayer, config.players.length));
		setPhase("roll");
	};

	const onUseItem = (uid: string) => {
		const board = getBoard(config.boardId);
		const result = consumeItem(
			getWorld(),
			board,
			getBoardCols(config.boardId),
			activePlayer,
			uid,
		);
		setItemMsg(result?.message ?? "Item inválido");
		if (result?.ok) playSfx("select");
	};

	const minigames = listMinigames();
	const myItems = inventory[activePlayer] ?? [];

	return (
		<div className="pointer-events-auto absolute top-4 left-4 flex max-w-64 flex-col gap-2 rounded bg-black/60 p-4">
			<div className="text-sm text-slate-300">Fase: {phase}</div>
			<div className="text-lg font-bold">
				Turno: {config.players[activePlayer]?.name ?? "-"}
			</div>
			{lastRoll !== null && <div>Dado: {lastRoll}</div>}
			<button
				type="button"
				onClick={onRoll}
				className="rounded bg-emerald-500 px-4 py-2 font-bold text-black"
			>
				Lanzar dado
			</button>
			{feed.length > 0 && (
				<div className="flex flex-col gap-1 text-sm text-amber-200">
					{feed.map((e) => (
						<div key={`${e.kind}-${e.message}`}>{describeEvent(e)}</div>
					))}
				</div>
			)}
			<div className="mt-1 flex flex-col gap-1">
				<div className="text-xs tracking-widest text-slate-400 uppercase">
					Items
				</div>
				{myItems.length === 0 && (
					<div className="text-xs text-slate-500">Sin items</div>
				)}
				{myItems.map((entry) => {
					const def = getItem(entry.itemId);
					return (
						<button
							key={entry.uid}
							type="button"
							onClick={() => onUseItem(entry.uid)}
							className="rounded bg-slate-700 px-3 py-1 text-left text-sm"
						>
							{def?.icon} {def?.name}
						</button>
					);
				})}
				{itemMsg && <div className="text-xs text-slate-300">{itemMsg}</div>}
			</div>
			<div className="mt-2 flex flex-col gap-1">
				<div className="text-xs tracking-widest text-slate-400 uppercase">
					Minijuegos
				</div>
				{minigames.map((m) => (
					<button
						key={m.id}
						type="button"
						onClick={() => startMinigame(m.id)}
						className="rounded bg-slate-700 px-3 py-1 text-sm"
					>
						{m.name}
					</button>
				))}
			</div>
		</div>
	);
}
