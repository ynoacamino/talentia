import { Providers } from "@/app/providers.tsx";
import { useUIStore } from "@/game/stores/useMatch.ts";
import { GameScreen } from "@/ui/screens/GameScreen.tsx";
import { MainMenu } from "@/ui/screens/MainMenu.tsx";

function App() {
	const { screen } = useUIStore();
	return (
		<Providers>
			<div className="h-screen w-screen overflow-hidden">
				{screen === "game" ? <GameScreen /> : <MainMenu />}
			</div>
		</Providers>
	);
}

export default App;
