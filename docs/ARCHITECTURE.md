# Talentia Party — Arquitectura

ECS headless-first + R3F solo como vista. Todo con Bun.

## Capas

- `src/core/`: motor reutilizable (world koota, rng, math, storage, assets, audio). Sin React.
- `src/game/`: dominio Mario Party. Headless y testeable con `bun test`.
  - `board/`: `BoardGraph` + niveles (`levels.classic.ts`) + `registry.defineBoard`.
  - `dialogue/`: `types` + `registry` inyectable + `store` zustand + `audio` inyectable.
  - `npcs/`: traits koota + `registry` + `factory.defineNpc` + presets + `behaviors`
    (idle/patrol/follow) + `spawner` con validación fail-fast. Hablar = `start(scriptId)`.
  - `tiles/effects.ts`: `defineTileEffect` por `TileKind` (star/event/trap/bonus/start).
  - `items/`: `defineItem` + `registry` + `store` inventario (moneda-extra, robo, teleport).
  - `minigames/`: `types.defineMinigame` + `registry` factory + `store` + `builtin/`.
  - `systems/`: turn, movement, targeting. Funciones puras.
  - `stores/`: solo config UI + espejos de fase. La verdad vive en koota world.
  - `content.ts`: `bootstrapContent()` registra diálogos, NPCs y minijuegos iniciales.
- `src/render/`: vistas R3F tontas.leen traits, escriben vía actions/systems.
  - `board/`, `entities/` (billboards con `drei/Billboard` = siempre miran a cámara),
  - `minigames/` (registro vista por id, intercambiable),
  - `camera/`, `simulation/` (loop `useFrame` para sistemas tiempo real).
- `src/ui/`: DOM fuera del Canvas. `screens/`, `hud/`, `config/`, `dialogue/`, `minigames/`.
- `src/app/`: composición (`App`, `providers` con `WorldProvider`, `GameCanvas`).
- `src/shared/`: tipos y constantes.

## Cómo dar vida a un NPC (factory + behavior)

```ts
registerNpcValidated(npcPresets.mercader(6));
// o custom:
registerNpcValidated(
	defineNpc({
		npcId: "rival",
		name: "Rival",
		behaviorId: "follow",
		speed: 2,
		scriptId: "broma",
		spriteId: "orbe-bromista",
		tileIndex: 12,
	}),
);
// behavior nuevo: defineBehavior({ id: "dance", update: (...) => {...} })
```

`updateNpcs()` corre en `Simulation` (loop R3F): mueve según behavior y saluda
por proximidad (con cooldown). Lógica headless, testeable con `bun test`.

## Cómo agregar efectos de casilla e items

- Casilla: `registerTileEffect(defineTileEffect({ id: "trap", apply: (ctx) => [...] }))`.
  `playTurn()` ya encadena mover → bonus vuelta → `applyTileEffect`.
- Item: `registerItem(defineItem({ id: "x", use: (ctx) => ({ ok, message }) }))`.
  El inventario (`useInventoryStore`) da/consume; el HUD muestra y usa.

## Cómo inyectar conversaciones + audios (NPCs hablan)

```ts
registerDialogue({
	id: "aldea",
	lines: [
		{ id: "l1", speaker: "Guía", text: "Hola", audio: "/audio/hola.mp3" },
	],
});
registerNpc({
	npcId: "guia2",
	name: "Guía",
	color: "#fff",
	scriptId: "aldea",
	tileIndex: 5,
});
// En tests:
setDialogueAudio({ play: () => {}, stop: () => {} });
```

Click en NPC (billboard) → `useDialogueStore.start(scriptId)` → `DialogueBox` muestra texto y reproduce audio.

## Cómo crear un minijuego intercambiable (5 min)

1. Duplica `src/game/minigames/builtin/coinDash.ts`, cambia `id`.
2. Implementa `setup/update` headless.
3. `registerMinigame(miJuego)` en `content.ts`.
4. Crea `src/render/minigames/MiJuegoView.tsx` y `registerMinigameView(id, View)`.
5. Aparece solo en HUD + `MinigameOverlay` maneja intro/playing/results.

## Comandos (solo bun)

- `bun dev` / `bun run build` / `bun test`
- `bun run check` (biome + tsc, corre en pre-commit)
- `bun run lint` / `bun run lint:fix` / `bun run format`
- Commits convencionales (commitlint en `.husky/commit-msg`).
