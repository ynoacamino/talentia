import { WorldProvider } from "koota/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { getWorld } from "@/core/world.ts";
import { bootstrapContent } from "@/game/content.ts";

export function Providers({ children }: { children: ReactNode }) {
	const world = getWorld();

	useEffect(() => {
		bootstrapContent();
	}, []);

	return <WorldProvider world={world}>{children}</WorldProvider>;
}
