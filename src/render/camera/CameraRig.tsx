import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Cámara cenital inclinada que sigue al jugador activo.
export function CameraRig({ target }: { target: [number, number, number] }) {
	const { camera } = useThree();
	const desired = useRef(new THREE.Vector3());

	useFrame(() => {
		desired.current.set(target[0], 12, target[1] + 8);
		camera.position.lerp(desired.current, 0.05);
		camera.lookAt(target[0], 0, target[1]);
	});
	return null;
}
