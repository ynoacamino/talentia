import type { Vec3 } from "@/shared/types.ts";

export function vec3(x = 0, y = 0, z = 0): Vec3 {
	return { x, y, z };
}

export function tileToWorld(index: number, cols: number, spacing = 2): Vec3 {
	const row = Math.floor(index / cols);
	const col = index % cols;
	return {
		x: (col - (cols - 1) / 2) * spacing,
		y: 0,
		z: (row - (cols - 1) / 2) * spacing,
	};
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}
