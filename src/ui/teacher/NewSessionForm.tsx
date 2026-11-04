/**
 * NewSessionForm — Configuración de Nueva Sesión ([TEACH-01], SPEC §2, §3)
 * Conforme a SPEC §2, §3:
 * - Idioma: ES | EN | QUZ.
 * - Jugadores esperados: 3 a 6 (demo default 4).
 * - Duración: 5 a 40 min en pasos de 5 min (demo default 5:00).
 * - Generador de código de 4 caracteres sin confusables (0, O, 1, I, L).
 * - Bloqueo de configuración al iniciar partida.
 */
import {
	type SessionLanguage,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";

export function NewSessionForm() {
	const {
		formLanguage,
		formPlayers,
		formDurationMinutes,
		isConfigLocked,
		activeSessionCode,
		setFormLanguage,
		setFormPlayers,
		setFormDurationMinutes,
		createNewSession,
		setActiveTab,
	} = useTeacherStore();

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		createNewSession();
		setActiveTab("live");
	};

	const languages: Array<{ id: SessionLanguage; label: string; desc: string }> =
		[
			{ id: "ES", label: "Español", desc: "Voz y textos en castellano" },
			{ id: "EN", label: "English", desc: "Voice and prompts in English" },
			{
				id: "QUZ",
				label: "Quechua Sureño",
				desc: "MMS-STT/TTS Quechua Collao/Chanka",
			},
		];

	return (
		<div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
			{/* Encabezado */}
			<div className="border-b border-slate-800 pb-4">
				<div className="text-xs font-black uppercase tracking-widest text-indigo-400">
					Consola de Operador — [TEACH-01]
				</div>
				<h2 className="text-2xl font-black text-white">
					Crear Nueva Sesión de Juego
				</h2>
				<p className="text-xs text-slate-400 mt-1">
					Configure los parámetros antes de iniciar. Una vez comenzada la
					partida, la configuración se bloquea.
				</p>
			</div>

			<form onSubmit={handleCreate} className="flex flex-col gap-6">
				{/* 1. Selector de Idioma (SPEC §2, §14) */}
				<div className="flex flex-col gap-2">
					<span className="text-xs font-black uppercase tracking-wider text-slate-300">
						1. Idioma de la sesión:
					</span>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						{languages.map((l) => (
							<button
								key={l.id}
								type="button"
								disabled={isConfigLocked}
								onClick={() => setFormLanguage(l.id)}
								className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
									formLanguage === l.id
										? "border-indigo-400 bg-indigo-950/40 text-white shadow-lg shadow-indigo-950"
										: "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
								}`}
							>
								<div className="font-black text-sm">{l.label}</div>
								<div className="text-[11px] text-slate-400 mt-0.5">
									{l.desc}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* 2. Jugadores Esperados: 3 a 6 (SPEC §2) */}
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-center">
						<span className="text-xs font-black uppercase tracking-wider text-slate-300">
							2. Cantidad de alumnos participantes (3 a 6):
						</span>
						<span className="text-sm font-black text-indigo-400 font-mono">
							{formPlayers} jugadores
						</span>
					</div>
					<div className="flex items-center gap-3">
						{[3, 4, 5, 6].map((count) => (
							<button
								key={count}
								type="button"
								disabled={isConfigLocked}
								onClick={() => setFormPlayers(count)}
								className={`flex-1 py-3 rounded-xl border font-black text-base transition-all cursor-pointer ${
									formPlayers === count
										? "border-indigo-400 bg-indigo-600 text-white shadow-md"
										: "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
								}`}
							>
								{count}
							</button>
						))}
					</div>
				</div>

				{/* 3. Duración: 5 a 40 min en pasos de 5 min (SPEC §2) */}
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-center">
						<label
							htmlFor="duration-slider"
							className="text-xs font-black uppercase tracking-wider text-slate-300"
						>
							3. Tiempo límite de juego (5 a 40 min):
						</label>
						<span className="text-sm font-black text-indigo-400 font-mono">
							{formDurationMinutes}:00 min
						</span>
					</div>
					<input
						id="duration-slider"
						type="range"
						min={5}
						max={40}
						step={5}
						disabled={isConfigLocked}
						value={formDurationMinutes}
						onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
						className="w-full accent-indigo-500 cursor-pointer"
					/>
					<div className="flex justify-between text-[11px] text-slate-400 px-1 font-mono">
						<span>5m (Demo)</span>
						<span>15m</span>
						<span>25m</span>
						<span>40m</span>
					</div>
				</div>

				{/* Botón de Creación */}
				<div className="pt-2">
					<button
						type="submit"
						className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-base shadow-xl active:scale-98 cursor-pointer transition-all"
					>
						✨ Generar Código y Crear Sesión
					</button>
				</div>
			</form>

			{/* Código Activo Generado */}
			{activeSessionCode && (
				<div className="p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pop">
					<div>
						<div className="text-[11px] uppercase font-black tracking-widest text-indigo-400">
							Código de Sesión Activa
						</div>
						<div className="text-4xl font-mono font-black text-white tracking-widest mt-1">
							{activeSessionCode}
						</div>
						<div className="text-xs text-slate-400 mt-1">
							Alfabeto seguro sin confusables (0, O, 1, I, L)
						</div>
					</div>

					<div className="flex flex-col gap-2 w-full md:w-auto">
						<a
							href={`/play?s=${activeSessionCode}`}
							target="_blank"
							rel="noreferrer"
							className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs text-center shadow-md cursor-pointer transition-all"
						>
							Abrir /play?s={activeSessionCode} ↗
						</a>
						<button
							type="button"
							onClick={() => setActiveTab("live")}
							className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer text-center"
						>
							Ir al Espejo en Vivo →
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
