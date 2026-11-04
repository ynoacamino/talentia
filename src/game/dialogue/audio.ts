import { Howl } from "howler";

// Audio inyectable para diálogos. En juego usa Howler,
// en tests se inyecta un stub silencioso.
export type IAudioPlayer = {
	play: (src: string) => void;
	stop: () => void;
};

class HowlAudioPlayer implements IAudioPlayer {
	private current: Howl | null = null;

	play(src: string): void {
		try {
			this.stop();
			this.current = new Howl({ src: [src], volume: 0.7 });
			this.current.play();
		} catch {
			// headless / sin asset: no rompe el diálogo
		}
	}

	stop(): void {
		try {
			this.current?.stop();
		} catch {
			// noop
		}
		this.current = null;
	}
}

let player: IAudioPlayer = new HowlAudioPlayer();

export function setDialogueAudio(p: IAudioPlayer): void {
	player = p;
}

export function getDialogueAudio(): IAudioPlayer {
	return player;
}
