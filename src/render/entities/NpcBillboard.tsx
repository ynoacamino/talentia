import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Entity } from "koota";
import { useTrait } from "koota/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getSpriteTexture } from "@/core/sprites.ts";
import { useDialogueStore } from "@/game/dialogue/store.ts";
import { Npc, NpcMeta } from "@/game/npcs/npcs.ts";
import { Transform } from "@/game/traits.ts";

export function NpcBillboard({ entity }: { entity: Entity }) {
	const npc = useTrait(entity, Npc);
	const meta = useTrait(entity, NpcMeta);
	const pos = useTrait(entity, Transform);
	const start = useDialogueStore((s) => s.start);
	const ref = useRef<THREE.Group>(null);

	const texture = useMemo(
		() => getSpriteTexture(npc?.spriteId ?? "orbe"),
		[npc?.spriteId],
	);

	useFrame(() => {
		if (!ref.current || !pos) return;
		ref.current.position.lerp(new THREE.Vector3(pos.x, 1, pos.z), 0.15);
	});

	if (!npc || !meta) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: interacción por raycast R3F, no DOM
		<group
			ref={ref}
			position={[pos?.x ?? 0, 1, pos?.z ?? 0]}
			onClick={(e) => {
				e.stopPropagation();
				start(npc.scriptId);
			}}
		>
			<Billboard>
				<mesh>
					<planeGeometry args={[1.4, 1.4]} />
					<meshBasicMaterial map={texture} transparent />
				</mesh>
				<Text
					position={[0, 1, 0]}
					fontSize={0.32}
					color="#a78bfa"
					anchorX="center"
				>
					{meta.name} ¡habla!
				</Text>
			</Billboard>
		</group>
	);
}
