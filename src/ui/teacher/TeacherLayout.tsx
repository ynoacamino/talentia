/**
 * TeacherLayout — Layout del Panel Docente y Operador (/teacher)
 * Conforme a SPEC §2, §4, §13:
 * - Aislamiento estricto de pantalla: esta interfaz vive exclusivamente en la laptop docente.
 * - Control de silenciamiento de música de fondo (Mute BGM) exclusivo aquí.
 * - Pestañas de navegación: Nueva Sesión, Espejo en Vivo, Vista Docente, Sesiones Pasadas.
 */
import { DocenteView } from "@/ui/teacher/DocenteView.tsx";
import { LiveMirror } from "@/ui/teacher/LiveMirror.tsx";
import { NewSessionForm } from "@/ui/teacher/NewSessionForm.tsx";
import { PastSessionsList } from "@/ui/teacher/PastSessionsList.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

export function TeacherLayout() {
	const {
		activeTab,
		setActiveTab,
		isBgmMuted,
		toggleBgmMute,
		activeSessionCode,
	} = useTeacherStore();

	const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
		{ id: "form", label: "Nueva Sesión", icon: "➕" },
		{ id: "live", label: "Espejo en Vivo", icon: "📺" },
		{ id: "docente", label: "Vista Docente", icon: "📊" },
		{ id: "past", label: "Sesiones Pasadas", icon: "📁" },
	];

	return (
		<div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
			{/* Header del Panel Docente */}
			<header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md z-30">
				<div className="flex items-center gap-3">
					<div className="text-xl">🎓</div>
					<div>
						<h1 className="text-sm font-black text-white tracking-wide">
							SocraticGuild — Consola Docente
						</h1>
						<div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
							Pestaña Privada — NO Proyectar en Aula (SPEC §2)
						</div>
					</div>
				</div>

				{/* Pestañas de Navegación */}
				<nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
								activeTab === tab.id
									? "bg-indigo-600 text-white shadow-md font-black"
									: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
							}`}
						>
							<span>{tab.icon}</span>
							<span>{tab.label}</span>
						</button>
					))}
				</nav>

				{/* Control de Mute BGM Exclusivo (§13) y Código de Sesión */}
				<div className="flex items-center gap-3">
					{/* Mute BGM exclusivo en /teacher */}
					<button
						type="button"
						onClick={toggleBgmMute}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
							isBgmMuted
								? "bg-red-950/80 text-red-300 border-red-800"
								: "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
						}`}
						title="Silenciar o activar música de fondo (exclusivo para el docente)"
					>
						<span>{isBgmMuted ? "🔇" : "🔊"}</span>
						<span>{isBgmMuted ? "BGM Silenciado" : "BGM Activo"}</span>
					</button>

					{/* Código de Sesión Activa */}
					{activeSessionCode && (
						<div className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/80 text-xs font-mono font-bold text-indigo-300">
							Código:{" "}
							<span className="text-white font-black">{activeSessionCode}</span>
						</div>
					)}
				</div>
			</header>

			{/* Contenedor Principal Scrollable */}
			<main className="flex-1 overflow-y-auto">
				{activeTab === "form" && <NewSessionForm />}
				{activeTab === "live" && <LiveMirror />}
				{activeTab === "docente" && <DocenteView />}
				{activeTab === "past" && <PastSessionsList />}
			</main>
		</div>
	);
}
