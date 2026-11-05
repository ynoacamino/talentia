/**
 * CommentThread — Hilo de Comentarios Add-Only ([TEACH-04], D5, SPEC §2, §11, §17)
 * Conforme a SPEC §2, §11:
 * - Hilo append-only de notas pedagógicas.
 * - Inserción a través de SessionRepo.addComment(code, text).
 * - Renderiza lista de notas con fecha/hora de pared formateada (wall_ts_ms) y autor 'teacher'.
 * - Inmutabilidad estricta: CERO botones o endpoints de edición o borrado individual.
 * - Cualquier desacuerdo con el juez queda registrado como nota complementaria.
 */
import { useEffect, useState } from "react";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import type {
	ISessionRepository,
	ISyncSessionRepository,
	SessionComment,
} from "@/shared/documents.ts";
import { formatWallTime } from "@/shared/formatters.ts";
import {
	type TeacherComment,
	useTeacherStore,
} from "@/ui/teacher/teacherStore.ts";

export interface CommentThreadProps {
	sessionCode?: string;
	comments?: readonly SessionComment[];
	repo?: ISessionRepository | ISyncSessionRepository;
	onCommentAdded?: (comment: SessionComment) => void;
}

type DisplayComment = {
	readonly id: string;
	readonly sessionId: string;
	readonly text: string;
	readonly author: "teacher";
	readonly wall_ts_ms: number;
};

export function CommentThread(): React.JSX.Element;
export function CommentThread(props: CommentThreadProps): React.JSX.Element;
export function CommentThread(
	props: CommentThreadProps = {},
): React.JSX.Element {
	const {
		sessionCode: propCode,
		comments: propComments,
		repo: propRepo,
		onCommentAdded,
	} = props;
	const store = useTeacherStore();
	const activeSessionCode = propCode ?? store.activeSessionCode;
	const activeRepo = propRepo ?? getDefaultSessionRepository();

	const [textInput, setTextInput] = useState("");
	const [localComments, setLocalComments] = useState<DisplayComment[]>(() => {
		if (propComments) {
			return propComments.map((c) => ({
				id: c.id,
				sessionId: c.sessionId,
				text: c.text,
				author: c.author,
				wall_ts_ms: c.wall_ts_ms,
			}));
		}
		if (
			propCode &&
			activeRepo &&
			"getByCodeSync" in activeRepo &&
			typeof activeRepo.getByCodeSync === "function"
		) {
			const rec = activeRepo.getByCodeSync(propCode);
			if (rec?.comments) {
				return rec.comments.map((c: SessionComment) => ({
					id: c.id,
					sessionId: c.sessionId,
					text: c.text,
					author: c.author,
					wall_ts_ms: c.wall_ts_ms,
				}));
			}
		}
		return [];
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Sync or reset local comments when session or prop comments change
	useEffect(() => {
		if (propComments) {
			setLocalComments(
				propComments.map((c) => ({
					id: c.id,
					sessionId: c.sessionId,
					text: c.text,
					author: c.author,
					wall_ts_ms: c.wall_ts_ms,
				})),
			);
		} else if (propCode) {
			activeRepo.getByCode(propCode).then((record) => {
				if (record?.comments) {
					setLocalComments(
						record.comments.map((c) => ({
							id: c.id,
							sessionId: c.sessionId,
							text: c.text,
							author: c.author,
							wall_ts_ms: c.wall_ts_ms,
						})),
					);
				}
			});
		} else {
			// Fallback to store comments for backward compatibility
			setLocalComments(
				store.comments.map((c: TeacherComment) => ({
					id: c.id,
					sessionId: c.sessionId,
					text: c.text,
					author: c.author,
					wall_ts_ms: c.wallTsMs,
				})),
			);
		}
	}, [propComments, propCode, activeRepo, store.comments]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = textInput.trim();
		if (!trimmed || isSubmitting) return;

		setIsSubmitting(true);
		try {
			let newComment: SessionComment;

			if (activeSessionCode) {
				try {
					newComment = await activeRepo.addComment(activeSessionCode, trimmed);
				} catch {
					// Fallback if session is in-memory store mock only
					newComment = {
						id: `comm-${Date.now()}`,
						sessionId: activeSessionCode,
						text: trimmed,
						author: "teacher",
						wall_ts_ms: Date.now(),
					};
				}
			} else {
				newComment = {
					id: `comm-${Date.now()}`,
					sessionId: "active",
					text: trimmed,
					author: "teacher",
					wall_ts_ms: Date.now(),
				};
			}

			// Add to local state append-only
			const displayComm: DisplayComment = {
				id: newComment.id,
				sessionId: newComment.sessionId,
				text: newComment.text,
				author: newComment.author,
				wall_ts_ms: newComment.wall_ts_ms,
			};

			setLocalComments((prev) => [...prev, displayComm]);

			// Also notify store if active
			store.addComment(trimmed);
			onCommentAdded?.(newComment);
			setTextInput("");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			data-testid="comment-thread"
			className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5"
		>
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 className="text-base font-black text-white flex items-center gap-2">
						<span>📝</span>
						<span>Notas Pedagógicas del Docente ([TEACH-04])</span>
					</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						Registro inmutable (Add-Only). Sin edición ni borrado individual de
						anotaciones (Ley 29733).
					</p>
				</div>
				<span
					data-testid="comment-count-badge"
					className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800"
				>
					{localComments.length} notas
				</span>
			</div>

			{/* Formulario de Entrada Add-Only */}
			<form onSubmit={handleSubmit} className="flex gap-3">
				<input
					type="text"
					data-testid="comment-input"
					value={textInput}
					onChange={(e) => setTextInput(e.target.value)}
					placeholder="Escribir observación o discrepancia pedagógica..."
					className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:border-indigo-400 outline-none"
				/>
				<button
					type="submit"
					data-testid="add-comment-btn"
					disabled={!textInput.trim() || isSubmitting}
					className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
						textInput.trim() && !isSubmitting
							? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
							: "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
					}`}
				>
					{isSubmitting ? "Guardando…" : "Agregar Nota ↵"}
				</button>
			</form>

			{/* Lista Append-Only de Comentarios (CERO botones de editar o borrar) */}
			<div
				data-testid="comment-list"
				className="flex flex-col gap-3 max-h-80 overflow-y-auto"
			>
				{localComments.length === 0 ? (
					<div
						data-testid="comment-empty-msg"
						className="text-xs text-slate-500 italic text-center py-6"
					>
						No hay notas registradas para la sesión {activeSessionCode}.
					</div>
				) : (
					localComments.map((comm) => (
						<div
							key={comm.id}
							data-testid="comment-item"
							className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-1.5 shadow-sm"
						>
							<div className="flex items-center justify-between text-xs">
								<span
									data-testid="comment-author"
									className="font-bold text-indigo-300"
								>
									{comm.author}
								</span>
								<span
									data-testid="comment-wall-ts"
									className="text-[11px] text-slate-400 font-mono"
								>
									{formatWallTime(comm.wall_ts_ms, true)}
								</span>
							</div>
							<p
								data-testid="comment-text"
								className="text-xs text-slate-200 font-normal leading-relaxed"
							>
								{comm.text}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
