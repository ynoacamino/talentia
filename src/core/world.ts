import type { World } from "koota";
import { createWorld } from "koota";

let _world: World | null = null;

export function getWorld(): World {
	if (!_world) _world = createWorld();
	return _world;
}

export function resetWorld(): World {
	_world?.destroy();
	_world = createWorld();
	return _world;
}
