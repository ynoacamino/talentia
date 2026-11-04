import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Entity } from "koota";
import { useTrait } from "koota/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { makePlaceholderTexture } from "@/core/assets.ts";
import { Player, PlayerMeta, Transform } from "@/game/traits.ts";

export function PlayerBillboard({ entity }: { entity: Entity }) {
	const player = useTrait(entity, Player);
	const meta = useTrait(entity, PlayerMeta);
	const pos = useTrait(entity, Transform);
	const ref = useRef<THREE.Group>(null);

	const texture = useMemo(
		() => makePlaceholderTexture(meta?.color ?? "#fff"),
		[meta?.color],
	);

	useFrame(() => {
		if (!ref.current || !pos) return;
		ref.current.position.lerp(new THREE.Vector3(pos.x, 1, pos.z), 0.15);
	});

	if (!player || !meta) return null;

	return (
		<group ref={ref} position={[pos?.x ?? 0, 1, pos?.z ?? 0]}>
			<Billboard>
				<mesh>
					<planeGeometry args={[1.2, 1.2]} />
					<meshBasicMaterial map={texture} transparent />
				</mesh>
				<Text
					position={[0, 0.9, 0]}
					fontSize={0.35}
					color="white"
					anchorX="center"
				>
					{meta.name}
				</Text>
			</Billboard>
		</group>
	);
}
