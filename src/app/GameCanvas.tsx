import { Canvas } from "@react-three/fiber";
import { BoardView } from "@/render/board/BoardView.tsx";
import { CameraRig } from "@/render/camera/CameraRig.tsx";
import { NpcsView } from "@/render/entities/NpcsView.tsx";
import { PlayersView } from "@/render/entities/PlayersView.tsx";
import { MinigameView } from "@/render/minigames/MinigameView.tsx";
import { Simulation } from "@/render/simulation/Simulation.tsx";

export function GameCanvas() {
	return (
		<Canvas camera={{ position: [0, 12, 8], fov: 50 }} shadows>
			<color attach="background" args={["#0b0e14"]} />
			<ambientLight intensity={0.6} />
			<directionalLight position={[6, 10, 4]} intensity={1.2} castShadow />
			<BoardView />
			<PlayersView />
			<NpcsView />
			<MinigameView />
			<CameraRig target={[0, 0, 0]} />
			<Simulation />
		</Canvas>
	);
}
