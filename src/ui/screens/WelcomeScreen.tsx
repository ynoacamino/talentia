/**
 * WelcomeScreen — Pantalla de Bienvenida y Selector de Rutas (/)
 * Conforme a SPEC §2:
 * Discrimina entre /play (Alumnos / Proyector) y /teacher (Docente / Operador).
 */
import { useAppRouter } from "@/ui/router/index.tsx";

export function WelcomeScreen() {
	const { navigate, sessionCodeParam } = useAppRouter();

	return (
		<div className="h-screen w-screen bg-radial from-slate-900 via-slate-950 to-slate-950 text-white flex flex-col items-center justify-center p-6 select-none overflow-y-auto">
			<div className="max-w-2xl w-full flex flex-col items-center gap-8 p-10 rounded-3xl bg-slate-900/80 border-2 border-slate-700/80 shadow-2xl backdrop-blur-xl text-center">
				{/* Título y Logotipo */}
				<div>
					<div className="text-5xl mb-3">🌉 🦊 🦉 🐸 🏛️</div>
					<h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
						SocraticGuild — Talentia
					</h1>
					<p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
						Crisis del puente roto. Evaluación formativa de habilidades blandas
						grupales mediante voz y dibujo cooperativo.
					</p>
				</div>

				{/* Selector de los Dos Modos Aislados (SPEC §2) */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
					{/* Opción 1: /play (Alumnos) */}
					<button
						type="button"
						onClick={() =>
							navigate(
								sessionCodeParam ? `/play?s=${sessionCodeParam}` : "/play",
							)
						}
						className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-400/50 hover:border-amber-400 hover:scale-102 transition-all cursor-pointer shadow-lg flex flex-col justify-between text-left group"
					>
						<div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-3xl">🎮</span>
								<span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
									Proyector en Aula
								</span>
							</div>
							<h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
								Modo Alumnos (/play)
							</h3>
							<p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
								Reclamo de tarjetas Paper-Mario, voz hold-to-talk, pizarra de
								dibujo y pantalla final colectiva con estrellas.
							</p>
						</div>
						<div className="mt-5">
							<span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 group-hover:translate-x-1 transition-transform">
								Entrar como Equipo →
							</span>
						</div>
					</button>

					{/* Opción 2: /teacher (Docente) */}
					<button
						type="button"
						onClick={() => navigate("/teacher")}
						className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 hover:border-indigo-400 hover:scale-102 transition-all cursor-pointer shadow-lg flex flex-col justify-between text-left group"
					>
						<div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-3xl">🎓</span>
								<span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white px-2 py-0.5 rounded-full">
									Privado en Laptop
								</span>
							</div>
							<h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
								Modo Docente (/teacher)
							</h3>
							<p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
								Creación de sesión (código 4-char), espejo en vivo, consola
								silenciosa, reporte pedagógico y borrado de sesión.
							</p>
						</div>
						<div className="mt-5">
							<span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-400 group-hover:translate-x-1 transition-transform">
								Abrir Consola Docente →
							</span>
						</div>
					</button>
				</div>

				{/* Nota de Arquitectura de Privacidad */}
				<div className="text-[11px] text-slate-400 border-t border-slate-800 pt-4 w-full">
					<span className="text-amber-400 font-bold">
						Límite de Privacidad (SPEC §2):
					</span>{" "}
					La proyección comparte exclusivamente la pestaña{" "}
					<code className="text-slate-300 font-mono">/play</code>. La pestaña{" "}
					<code className="text-slate-300 font-mono">/teacher</code> nunca entra
					a la superficie proyectada.
				</div>
			</div>
		</div>
	);
}
