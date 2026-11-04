import {
	DEFAULT_BOARD_ID,
	DEFAULT_LAPS_TO_WIN,
	PLAYER_COLORS,
} from "@/shared/constants.ts";
import type { GameConfig } from "@/shared/types.ts";

export function defaultGameConfig(): GameConfig {
	return {
		boardId: DEFAULT_BOARD_ID,
		lapsToWin: DEFAULT_LAPS_TO_WIN,
		players: [
			{ name: "P1", color: PLAYER_COLORS[0] },
			{ name: "P2", color: PLAYER_COLORS[1] },
		],
	};
}

export function validateGameConfig(cfg: GameConfig): string[] {
	const errors: string[] = [];
	if (cfg.players.length < 2) errors.push("Mínimo 2 jugadores");
	if (cfg.players.length > 4) errors.push("Máximo 4 jugadores");
	if (cfg.lapsToWin < 1 || cfg.lapsToWin > 10)
		errors.push("Vueltas entre 1 y 10");
	return errors;
}
