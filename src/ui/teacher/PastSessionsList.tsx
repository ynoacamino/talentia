/**
 * PastSessionsList — Lista e Inspección de Sesiones Pasadas ([TEACH-05], D2, SPEC §2, §11)
 * Conforme a SPEC §2, §11:
 * - Tabla con 5 columnas: Código, Fecha, Idioma, Jugadores, Estrellas.
 * - Detalle de inspección con vista docente y transcripciones.
 * - Botón "borrar sesión" con confirmación nativa para hard-delete (Ley 29733).
 */
import { useState } from "react";
import {
	type PastSessionRecord,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";

export function PastSessionsList() {
	const {
		pastSessions,
		selectedPastSessionCode,
		selectPastSession,
		deletePastSession,
		setActiveTab,
	} = useTeacherStore();

	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

	const selectedSession: PastSessionRecord | undefined = pastSessions.find(
		(s) => s.code === selectedPastSessionCode,
	);

	const handleConfirmDelete = () => {
		if (sessionToDelete) {
			deletePastSession(sessionToDelete);
			setSessionToDelete(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-6xl mx-auto p-6 select-none">
			<div className="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<div className="text-xs font-black uppercase tracking-widest text-indigo-400">
						Historial Docente — [TEACH-05]
					</div>
					<h2 className="text-2xl font-black text-white">
						Registro Histórico de Sesiones
					</h2>
					<p className="text-xs text-slate-400 mt-1">
						Almacenamiento por código efímero de 4 letras. Sin cuentas de niños.
					</p>
				</div>
				<span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
					{pastSessions.length} sesiones archivadas
				</span>
			</div>

			{/* Tabla de 5 Columnas (SPEC §2, D2) */}
			<div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-black tracking-wider">
							<th className="py-3.5 px-5">1. Código</th>
							<th className="py-3.5 px-5">2. Fecha y Hora</th>
							<th className="py-3.5 px-5">3. Idioma</th>
							<th className="py-3.5 px-5">4. Jugadores</th>
							<th className="py-3.5 px-5">5. Resultado / Estrellas</th>
							<th className="py-3.5 px-5 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
						{pastSessions.map((session) => (
							<tr
								key={session.code}
								onClick={() => selectPastSession(session.code)}
								className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
									selectedPastSessionCode === session.code
										? "bg-indigo-950/40"
										: ""
								}`}
							>
								{/* Código */}
								<td className="py-4 px-5 font-mono font-black text-indigo-400 text-sm">
									{session.code}
								</td>

								{/* Fecha */}
								<td className="py-4 px-5 text-slate-300 font-mono">
									{session.date}
								</td>

								{/* Idioma */}
								<td className="py-4 px-5">
									<span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-bold text-[11px]">
										{session.language}
									</span>
								</td>

								{/* Jugadores */}
								<td className="py-4 px-5 text-slate-300">
									{session.players} alumnos
								</td>

								{/* Estrellas */}
								<td className="py-4 px-5">
									{session.stars !== null ? (
										<span className="text-amber-400 font-bold text-sm">
											{"★".repeat(session.stars)}
											{"☆".repeat(3 - session.stars)}
										</span>
									) : (
										<span className="text-slate-500 font-bold italic">
											Inconclusa
										</span>
									)}
								</td>

								{/* Acciones */}
								<td className="py-4 px-5 text-right">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setSessionToDelete(session.code);
										}}
										className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800 cursor-pointer"
										title="Borrar sesión de forma irrecuperable (Ley 29733)"
									>
										Borrar sesión
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Modal de Detalle de Sesión Seleccionada */}
			{selectedSession && (
				<div className="p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl flex flex-col gap-4 animate-pop">
					<div className="flex items-center justify-between border-b border-slate-800 pb-3">
						<div className="flex items-center gap-3">
							<span className="text-2xl">📋</span>
							<div>
								<h3 className="text-lg font-black text-white">
									Detalle de Sesión: {selectedSession.code}
								</h3>
								<div className="text-xs text-slate-400">
									Fecha: {selectedSession.date} | Idioma:{" "}
									{selectedSession.language} | {selectedSession.players}{" "}
									Jugadores
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setActiveTab("docente")}
								className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md"
							>
								Ver en Vista Docente →
							</button>
							<button
								type="button"
								onClick={() => selectPastSession(null)}
								className="text-slate-400 hover:text-white p-2 font-bold cursor-pointer"
							>
								✕
							</button>
						</div>
					</div>

					<div className="text-xs text-slate-300 leading-relaxed">
						Esta sesión cuenta con registro de transcripciones completas,
						miniaturas de dibujos analizados por visión y evaluación formativa
						del Juez.
					</div>
				</div>
			)}

			{/* Diálogo Bloqueante de Confirmación de Borrado (Ley 29733 / SPEC §2, D5) */}
			{sessionToDelete && (
				<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-red-500 shadow-2xl flex flex-col gap-4 text-center animate-pop">
						<div className="text-4xl">⚠️</div>
						<h3 className="text-xl font-black text-white">
							¿Confirmar borrado de la sesión {sessionToDelete}?
						</h3>
						<p className="text-xs text-slate-300 leading-relaxed">
							Esta acción ejecuta un{" "}
							<span className="text-red-400 font-bold">
								borrado en cascada (hard-delete)
							</span>{" "}
							irrecuperable de configuraciones, transcripciones, dibujos, notas
							y eventos para cumplir con la solicitud parental y la Ley 29733.
						</p>
						<div className="flex gap-3 justify-center pt-2">
							<button
								type="button"
								onClick={() => setSessionToDelete(null)}
								className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleConfirmDelete}
								className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg cursor-pointer"
							>
								Sí, borrar sesión
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
