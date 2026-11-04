import type { ComponentType } from "react";

const views = new Map<string, ComponentType>();

export function registerMinigameView(id: string, view: ComponentType): void {
	views.set(id, view);
}

export function getMinigameView(id: string): ComponentType | undefined {
	return views.get(id);
}
