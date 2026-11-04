import { Howl } from "howler";

// Banco de SFX inyectable. El juego solo usa ids ("dice"); el mapeo
// id → archivo vive aquí y los tests inyectan un stub silencioso.
export type SfxPlayer = {
	play: (src: string) => void;
	stop: () => void;
};

class HowlSfxPlayer implements SfxPlayer {
	play(src: string): void {
		try {
			new Howl({ src: [src], volume: 0.5 }).play();
		} catch {
			// sin audio en tests / headless
		}
	}

	stop(): void {
		// howler global: los one-shots terminan solos
	}
}

let player: SfxPlayer = new HowlSfxPlayer();

export function setSfxPlayer(p: SfxPlayer): void {
	player = p;
}

const bank = new Map<string, string>([
	["dice", "/audio/dice.mp3"],
	["step", "/audio/step.mp3"],
	["select", "/audio/select.mp3"],
	["coin", "/audio/coin.mp3"],
	["star", "/audio/star.mp3"],
]);

export function registerSfx(id: string, src: string): void {
	bank.set(id, src);
}

export function playSfx(id: string): void {
	const src = bank.get(id);
	if (!src) return;
	player.play(src);
}
