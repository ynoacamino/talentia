import * as THREE from "three";

// Cache de texturas para sprites 2D. Los billboards usan esto.
const cache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export function loadSpriteTexture(url: string): THREE.Texture {
	const hit = cache.get(url);
	if (hit) return hit;
	const tex = loader.load(url);
	tex.colorSpace = THREE.SRGBColorSpace;
	cache.set(url, tex);
	return tex;
}

export function makePlaceholderTexture(color: string): THREE.Texture {
	// Canvas 64x64 para jugadores sin arte final. Evita binarios en el repo.
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 64;
	const ctx = c.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D no disponible");
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(32, 32, 28, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#fff";
	ctx.font = "bold 28px system-ui";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("●", 32, 34);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}
