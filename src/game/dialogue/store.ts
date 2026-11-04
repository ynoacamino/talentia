import { create } from "zustand";
import { getDialogueAudio } from "@/game/dialogue/audio.ts";
import { getDialogue } from "@/game/dialogue/registry.ts";
import type { DialogueLine } from "@/game/dialogue/types.ts";

type DialogueState = {
	activeScriptId: string | null;
	lineIndex: number;
	visible: boolean;
	start: (scriptId: string) => void;
	next: () => void;
	stop: () => void;
	currentLine: () => DialogueLine | null;
};

export const useDialogueStore = create<DialogueState>((set, get) => ({
	activeScriptId: null,
	lineIndex: 0,
	visible: false,

	start: (scriptId) => {
		const script = getDialogue(scriptId);
		if (!script) return;
		set({ activeScriptId: scriptId, lineIndex: 0, visible: true });
		const first = script.lines[0];
		if (first?.audio) getDialogueAudio().play(first.audio);
	},

	next: () => {
		const { activeScriptId, lineIndex } = get();
		if (!activeScriptId) return;
		const script = getDialogue(activeScriptId);
		if (!script) return;
		const nextIndex = lineIndex + 1;
		if (nextIndex >= script.lines.length) {
			get().stop();
			return;
		}
		set({ lineIndex: nextIndex });
		const line = script.lines[nextIndex];
		if (line?.audio) getDialogueAudio().play(line.audio);
	},

	stop: () => {
		getDialogueAudio().stop();
		set({ activeScriptId: null, lineIndex: 0, visible: false });
	},

	currentLine: () => {
		const { activeScriptId, lineIndex } = get();
		if (!activeScriptId) return null;
		return getDialogue(activeScriptId)?.lines[lineIndex] ?? null;
	},
}));
