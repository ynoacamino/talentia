import { describe, expect, test } from "bun:test";
import { createWorld } from "koota";
import { classicLoopBoard } from "@/game/board/levels.classic.ts";
import { registerDialogue } from "@/game/dialogue/registry.ts";
import { clearNpcRuntime } from "@/game/npcs/behaviors.ts";
import { defineNpc, validateNpc } from "@/game/npcs/factory.ts";
import { Npc } from "@/game/npcs/npcs.ts";
import { updateNpcs } from "@/game/systems/npcs.ts";
import { Player, Transform } from "@/game/traits.ts";

describe("npc factory", () => {
	test("defineNpc aplica defaults y validateNpc detecta script faltante", () => {
		const def = defineNpc({ npcId: "test-npc" });
		expect(def.behaviorId).toBe("idle");
		expect(def.spriteId).toBe("orbe");
		const errors = validateNpc({ ...def, scriptId: "no-existe" });
		expect(errors.length).toBe(1);
	});

	test("validateNpc pasa con diálogo y sprite registrados", () => {
		registerDialogue({ id: "saludo-test", lines: [] });
		const def = defineNpc({
			npcId: "test-npc-ok",
			scriptId: "saludo-test",
			spriteId: "orbe-guia",
		});
		expect(validateNpc(def)).toEqual([]);
	});
});

describe("npc system", () => {
	test("follow se acerca al jugador y greet saluda con cooldown", () => {
		clearNpcRuntime();
		const world = createWorld();
		const board = classicLoopBoard();
		world.spawn(
			Player({ index: 0, tileIndex: 0, coins: 0, stars: 0, laps: 0 }),
			Transform({ x: 0, y: 0, z: 0 }),
		);
		const npcEntity = world.spawn(
			Npc({
				npcId: "seguidor-test",
				scriptId: "saludo-test",
				behaviorId: "follow",
				speed: 2,
				spriteId: "orbe",
				tile: 0,
			}),
			Transform({ x: 10, y: 0, z: 0 }),
		);

		const said: string[] = [];
		updateNpcs(world, board, 1, {
			now: 0,
			onSpeak: (s) => said.push(s),
			greetCooldownMs: 20000,
		});
		const pos = npcEntity.get(Transform);
		expect(pos ? pos.x < 10 : false).toBe(true);

		// Cerca: saluda una vez y el cooldown evita spam
		npcEntity.set(Transform, { x: 0.5, y: 0, z: 0 });
		updateNpcs(world, board, 0.1, {
			now: 1000,
			onSpeak: (s) => said.push(s),
			greetCooldownMs: 20000,
		});
		updateNpcs(world, board, 0.1, {
			now: 2000,
			onSpeak: (s) => said.push(s),
			greetCooldownMs: 20000,
		});
		expect(said).toEqual(["saludo-test"]);
		world.destroy();
	});
});
