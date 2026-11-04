/**
 * App Root Component
 * Integra el router cliente de Talentia / SocraticGuild:
 * - /play: Modo Alumnos (proyección en aula)
 * - /teacher: Modo Docente (consola privada)
 * - /: Pantalla de Bienvenida y selector de modo
 */
import { Providers } from "@/app/providers.tsx";
import { PlayLayout } from "@/ui/play/PlayLayout.tsx";
import { useAppRouter } from "@/ui/router/index.tsx";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen.tsx";
import { TeacherLayout } from "@/ui/teacher/TeacherLayout.tsx";

function App() {
	const { route } = useAppRouter();

	return (
		<Providers>
			<div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
				{route === "/play" && <PlayLayout />}
				{route === "/teacher" && <TeacherLayout />}
				{route === "/" && <WelcomeScreen />}
			</div>
		</Providers>
	);
}

export default App;
