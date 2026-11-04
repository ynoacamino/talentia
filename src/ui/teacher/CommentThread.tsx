/**
 * CommentThread — Hilo de Comentarios Add-Only ([TEACH-04], D5, SPEC §2, §11, §17)
 * Conforme a SPEC §2, §11:
 * - Hilo append-only de notas pedagógicas.
 * - Inmutabilidad estricta: CERO botones o endpoints de edición o borrado individual.
 * - Cualquier desacuerdo con el juez queda registrado como nota complementaria.
 */
import { useState } from "react";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

export function CommentThread() {
	const { comments, addComment, activeSessionCode } = useTeacherStore();
	const [textInput, setTextInput] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!textInput.trim()) return;
		addComment(textInput);
		setTextInput("");
	};

	return (
		<div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5">
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 className="text-base font-black text-white flex items-center gap-2">
						<span>📝</span>
						<span>Notas Pedagógicas del Docente ([TEACH-04])</span>
					</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						Registro inmutable (Add-Only). Sin edición ni borrado individual de
						anotaciones.
					</p>
				</div>
				<span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
					{comments.length} notas
				</span>
			</div>

			{/* Formulario de Entrada Add-Only */}
			<form onSubmit={handleSubmit} className="flex gap-3">
				<input
					type="text"
					value={textInput}
					onChange={(e) => setTextInput(e.target.value)}
					placeholder="Escribir observación o discrepancia pedagógica..."
					className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:border-indigo-400 outline-none"
				/>
				<button
					type="submit"
					disabled={!textInput.trim()}
					className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
						textInput.trim()
							? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
							: "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
					}`}
				>
					Agregar Nota ↵
				</button>
			</form>

			{/* Lista Append-Only de Comentarios */}
			<div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
				{comments.length === 0 ? (
					<div className="text-xs text-slate-500 italic text-center py-6">
						No hay notas registradas para la sesión {activeSessionCode}.
					</div>
				) : (
					comments.map((comm) => (
						<div
							key={comm.id}
							className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-1.5 shadow-sm"
						>
							<div className="flex items-center justify-between text-xs">
								<span className="font-bold text-indigo-300">
									Docente (Observador)
								</span>
								<span className="text-[11px] text-slate-400 font-mono">
									{comm.formattedTime}
								</span>
							</div>
							<p className="text-xs text-slate-200 font-normal leading-relaxed">
								{comm.text}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
