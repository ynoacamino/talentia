import type * as THREE from "three";
import { loadSpriteTexture, makePlaceholderTexture } from "@/core/assets.ts";

export type SpriteDef = {
	id: string;
	/** Color del placeholder si aún no hay arte final. */
	color: string;
	/** Ruta en public/sprites/. Opcional: si falta, usa placeholder. */
	url?: string;
};

const sprites = new Map<string, SpriteDef>();

export function defineSprite(def: SpriteDef): SpriteDef {
	return def;
}

export function registerSprite(def: SpriteDef): void {
	sprites.set(def.id, def);
}

export function getSprite(id: string): SpriteDef | undefined {
	return sprites.get(id);
}

export function listSprites(): SpriteDef[] {
	return [...sprites.values()];
}

const textureCache = new Map<string, THREE.Texture>();

// Resuelve la textura de un sprite: URL real o placeholder por color.
// Cuando llegue el arte final solo se agrega `url`, sin tocar vistas.
export function getSpriteTexture(id: string): THREE.Texture {
	const cached = textureCache.get(id);
	if (cached) return cached;
	const def = getSprite(id);
	const tex = def?.url
		? loadSpriteTexture(def.url)
		: makePlaceholderTexture(def?.color ?? "#ffffff");
	textureCache.set(id, tex);
	return tex;
}

registerSprite(defineSprite({ id: "orbe", color: "#ffffff" }));
registerSprite(defineSprite({ id: "orbe-guia", color: "#a78bfa" }));
registerSprite(defineSprite({ id: "orbe-mercader", color: "#eab308" }));
registerSprite(defineSprite({ id: "orbe-bromista", color: "#f43f5e" }));
