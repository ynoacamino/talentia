export type Vec3 = { x: number; y: number; z: number };

export type PlayerConfig = {
	name: string;
	color: string;
};

export type GameConfig = {
	boardId: string;
	lapsToWin: number;
	players: PlayerConfig[];
};

export type MatchPhase = "lobby" | "roll" | "move" | "event" | "gameover";
