// Storage tipado para config del juego (React UI). No guarda simulación.
const KEY = "talentia:game-config:v1";

export function loadJSON<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function saveJSON(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore quota / ssr
	}
}

export const configStorageKey = KEY;
