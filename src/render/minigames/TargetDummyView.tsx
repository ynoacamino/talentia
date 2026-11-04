import { useQuery } from "koota/react";
import { useMinigameStore } from "@/game/minigames/store.ts";
import { Player } from "@/game/traits.ts";
import { registerMinigameView } from "@/render/minigames/registry.ts";

// Vista del minijuego target-dummy: clickear billboards suma puntos.
// Intercambiable: otro minijuego = otro componente registrado con su id.
export function TargetDummyView() {
	const finish = useMinigameStore((s) => s.finish);
	const players = useQuery(Player);

	const score = (playerIndex: number) => {
		const scores: Record<string, number> = {};
		for (const e of players) {
			const p = e.get(Player);
			if (p) scores[String(p.index)] = p.index === playerIndex ? 1 : 0;
		}
		finish(scores);
	};

	return (
		<group>
			{[...players].map((entity) => {
				const p = entity.get(Player);
				if (!p) return null;
				const idx = p.index;
				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: interacción por raycast R3F, no DOM
					<mesh
						key={`target-${idx}`}
						position={[idx * 2 - 3, 0.5, -4]}
						onClick={(e) => {
							e.stopPropagation();
							score(idx);
						}}
					>
						<sphereGeometry args={[0.6, 16, 16]} />
						<meshStandardMaterial color="#f43f5e" emissive="#7f1d1d" />
					</mesh>
				);
			})}
		</group>
	);
}

registerMinigameView("target-dummy", TargetDummyView);
