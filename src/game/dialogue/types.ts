export type DialogueLine = {
	id: string;
	speaker: string;
	text: string;
	/** Ruta en public/audio/. Opcional: si falta, solo texto. */
	audio?: string;
	/** Ms para auto-avance. Si falta, espera click. */
	durationMs?: number;
};

export type DialogueScript = {
	id: string;
	lines: DialogueLine[];
};
