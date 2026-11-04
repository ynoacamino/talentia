import type { DialogueScript } from "@/game/dialogue/types.ts";

// Registro inyectable. Permite cargar conversaciones desde JSON,
// DLCs o tests sin tocar el motor.
const scripts = new Map<string, DialogueScript>();

export function registerDialogue(script: DialogueScript): void {
	scripts.set(script.id, script);
}

export function registerDialogues(list: DialogueScript[]): void {
	for (const s of list) scripts.set(s.id, s);
}

export function getDialogue(id: string): DialogueScript | undefined {
	return scripts.get(id);
}

export function listDialogues(): DialogueScript[] {
	return [...scripts.values()];
}

export function clearDialogues(): void {
	scripts.clear();
}
