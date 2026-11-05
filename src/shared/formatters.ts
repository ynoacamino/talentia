/**
 * TALENTIA / SocraticGuild — Common Value Formatters
 * Formatting utilities for timestamps, game clocks, and session stars.
 * SPEC §2, §11, §13, §17 & docs/gates/F0-contrato.md.
 */

import type { StarRating } from "@/shared/documents.ts";

/**
 * Formats a Unix timestamp (wall_ts_ms) to ISO local-like 'YYYY-MM-DD HH:mm' or 'YYYY-MM-DD HH:mm:ss'.
 */
export function formatWallTime(
	wallTsMs: number,
	includeSeconds = false,
): string {
	if (!wallTsMs || Number.isNaN(wallTsMs) || wallTsMs <= 0) {
		return "—";
	}
	const d = new Date(wallTsMs);
	const pad = (n: number): string => n.toString().padStart(2, "0");
	const yyyy = d.getFullYear();
	const mm = pad(d.getMonth() + 1);
	const dd = pad(d.getDate());
	const hh = pad(d.getHours());
	const min = pad(d.getMinutes());

	if (includeSeconds) {
		const ss = pad(d.getSeconds());
		return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
	}
	return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Formats game timestamp in milliseconds (game_ts_ms) to 'MM:SS'.
 */
export function formatGameTime(gameTsMs: number): string {
	if (typeof gameTsMs !== "number" || Number.isNaN(gameTsMs) || gameTsMs < 0) {
		return "00:00";
	}
	const totalSeconds = Math.floor(gameTsMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formats star rating according to SPEC §2 and §11:
 * - If finished and stars != null: 1-3★ representation ('★☆☆ (1★)', '★★☆ (2★)', '★★★ (3★)')
 * - If not finished or stars == null: '-' (dash/guion)
 */
export function formatStars(
	stars: StarRating | null,
	isFinished = true,
): string {
	if (!isFinished || stars === null) {
		return "-";
	}
	const filled = "★".repeat(stars);
	const empty = "☆".repeat(3 - stars);
	return `${filled}${empty} (${stars}★)`;
}
