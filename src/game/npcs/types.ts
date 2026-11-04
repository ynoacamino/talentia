export type NpcBehaviorId = "idle" | "patrol" | "follow";

export type NpcVoice = {
	pitch: number;
	rate: number;
};

export type NpcDef = {
	npcId: string;
	name: string;
	color: string;
	/** Id del sprite en el SpriteRegistry. Si falta, placeholder por color. */
	spriteId: string;
	scriptId: string;
	behaviorId: NpcBehaviorId;
	/** Casillas por segundo para patrol/follow. */
	speed: number;
	tileIndex: number;
	voice?: NpcVoice;
};
