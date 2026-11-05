/**
 * PastSessionsList — Lista e Inspección de Sesiones Pasadas ([TEACH-05], D2, D5, SPEC §2, §11)
 * Conforme a SPEC §2, §11:
 * - Tabla con 5 columnas obligatorias: Código, Fecha/Hora, Idioma, Jugadores y Resultado (Estrellas 1-3★ o Guion si no finalizada).
 * - Estado vacío amigable cuando no hay sesiones pasadas.
 * - Detalle de inspección con DocenteView, feed diarizado con doble timestamp, galería de miniaturas de dibujos y lecturas de visión.
 * - Hilo de notas pedagógicas add-only y botón "borrar sesión" con confirmación bloqueante (Ley 29733).
 * - Refresco reactivo automático tras borrado en cascada.
 */
import { useCallback, useEffect, useState } from "react";
import { getDefaultSessionRepository } from "@/game/stores/sessionRepository.ts";
import { useSessionDetailStore } from "@/game/stores/useSessionDetailStore.ts";
import { useSessionListStore } from "@/game/stores/useSessionListStore.ts";
import type {
	ISessionRepository,
	ISyncSessionRepository,
	SessionRecord,
	SessionSummary,
} from "@/shared/documents.ts";
import { formatWallTime } from "@/shared/formatters.ts";
import { DocenteView } from "@/ui/teacher/DocenteView.tsx";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

export interface PastSessionsListProps {
	repo?: ISessionRepository | ISyncSessionRepository;
	initialSelectedCode?: string | null;
	useNativeConfirm?: boolean;
	onSelectSession?: (code: string) => void;
	onDeleteSession?: (code: string) => void;
}

export function PastSessionsList(): React.JSX.Element;
export function PastSessionsList(
	props: PastSessionsListProps,
): React.JSX.Element;
export function PastSessionsList(
	props: PastSessionsListProps = {},
): React.JSX.Element {
	const {
		repo: propRepo,
		initialSelectedCode = null,
		useNativeConfirm = false,
		onSelectSession,
		onDeleteSession,
	} = props;
	const activeRepo = propRepo ?? getDefaultSessionRepository();

	const [summaries, setSummaries] = useState<readonly SessionSummary[]>(() => {
		if (
			activeRepo &&
			"listPastSync" in activeRepo &&
			typeof activeRepo.listPastSync === "function"
		) {
			return activeRepo.listPastSync();
		}
		const storeSessions = useSessionListStore.getState().sessions;
		return storeSessions.length > 0 ? storeSessions : [];
	});
	const [isLoading, setIsLoading] = useState(false);
	const [selectedCode, setSelectedCode] = useState<string | null>(
		initialSelectedCode,
	);
	const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(
		() => {
			const targetCode =
				initialSelectedCode ?? useSessionListStore.getState().selectedCode;
			if (
				targetCode &&
				activeRepo &&
				"getByCodeSync" in activeRepo &&
				typeof activeRepo.getByCodeSync === "function"
			) {
				return activeRepo.getByCodeSync(targetCode) ?? null;
			}
			return null;
		},
	);
	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deletedSessionNotice, setDeletedSessionNotice] = useState<
		string | null
	>(null);

	// Fetch past sessions list
	const refreshList = useCallback(async () => {
		setIsLoading(true);
		try {
			const list = await activeRepo.listPast();
			setSummaries(list);

			// Synchronize with useSessionListStore
			useSessionListStore
				.getState()
				.loadSessions(activeRepo)
				.catch(() => {});
		} finally {
			setIsLoading(false);
		}
	}, [activeRepo]);

	useEffect(() => {
		refreshList();
	}, [refreshList]);

	// Load detail if code is selected
	useEffect(() => {
		if (selectedCode) {
			activeRepo.getByCode(selectedCode).then((record) => {
				setSelectedRecord(record);
				if (record) {
					useSessionDetailStore.getState().setActiveSession(record);
					useTeacherStore.getState().selectPastSession(record.code);
				}
			});
		} else {
			setSelectedRecord(null);
		}
	}, [selectedCode, activeRepo]);

	const handleSelectSession = async (code: string) => {
		setSelectedCode(code);
		const record = await activeRepo.getByCode(code);
		setSelectedRecord(record);
		if (record) {
			useSessionDetailStore.getState().setActiveSession(record);
			useTeacherStore.getState().selectPastSession(code);
		}
		onSelectSession?.(code);
	};

	const triggerDelete = async (code: string) => {
		if (
			useNativeConfirm &&
			typeof window !== "undefined" &&
			typeof window.confirm === "function"
		) {
			const confirmed = window.confirm(
				`¿Confirmar borrado irreversible de la sesión ${code} bajo la Ley 29733 (Protección de Datos Personales)? Se eliminarán permanentemente la sesión, transcripciones, dibujos, lecturas de visión, eventos y notas pedagógicas.`,
			);
			if (confirmed) {
				await executeHardDelete(code);
			}
			return;
		}

		setSessionToDelete(code);
	};

	const executeHardDelete = async (code: string) => {
		setIsDeleting(true);
		try {
			await activeRepo.hardDelete(code);

			// Evict from Zustand stores
			useSessionListStore
				.getState()
				.hardDeleteSession(code, activeRepo)
				.catch(() => {});
			useTeacherStore.getState().deletePastSession(code);

			// Clear detail if deleting the currently selected session
			if (selectedCode === code) {
				setSelectedCode(null);
				setSelectedRecord(null);
				useSessionDetailStore.getState().clear();
			}

			// Reactively refresh the list
			const updatedList = await activeRepo.listPast();
			setSummaries(updatedList);
			setSessionToDelete(null);
			setDeletedSessionNotice(
				`✓ Sesión ${code} eliminada de forma permanente e irreversible (Hard-Delete Ley 29733 completado)`,
			);
			onDeleteSession?.(code);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div
			data-testid="past-sessions-container"
			className="flex flex-col gap-6 max-w-6xl mx-auto p-6 select-none"
		>
			{/* Encabezado del Historial */}
			<div className="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<div className="text-xs font-black uppercase tracking-widest text-indigo-400">
						Historial Docente — [TEACH-05]
					</div>
					<h2 className="text-2xl font-black text-white">
						Registro Histórico de Sesiones
					</h2>
					<p className="text-xs text-slate-400 mt-1">
						Almacenamiento por código efímero de 4 letras. Sin cuentas de niños
						(Ley 29733).
					</p>
				</div>
				<span
					data-testid="past-sessions-count-badge"
					className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
				>
					{summaries.length} sesiones archivadas
				</span>
			</div>

			{/* Banner de Confirmación de Borrado Ley 29733 */}
			{deletedSessionNotice && (
				<div
					data-testid="deleted-session-confirmation"
					className="px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-fade-in"
				>
					<div className="flex items-center gap-2">
						<span className="text-emerald-400 text-base">✓</span>
						<span>{deletedSessionNotice}</span>
					</div>
					<button
						type="button"
						onClick={() => setDeletedSessionNotice(null)}
						className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer font-black"
					>
						✕
					</button>
				</div>
			)}

			{/* Tabla de 5 Columnas Obligatorias (Código, Fecha/Hora, Idioma, Jugadores, Resultado) */}
			{isLoading && summaries.length === 0 ? (
				<div
					data-testid="sessions-loading"
					className="p-12 text-center text-slate-400 border border-slate-800 rounded-3xl bg-slate-900/60"
				>
					Cargando historial de sesiones…
				</div>
			) : summaries.length === 0 ? (
				/* Estado Vacío Amigable */
				<div
					data-testid="empty-past-sessions"
					className="p-12 text-center text-slate-400 border border-slate-800 rounded-3xl bg-slate-900/60 flex flex-col items-center justify-center gap-3 shadow-xl"
				>
					<div className="text-5xl">📁</div>
					<h3 className="text-lg font-black text-white">
						No hay sesiones pasadas archivadas
					</h3>
					<p className="text-xs text-slate-400 max-w-md leading-relaxed">
						No se encontraron sesiones registradas en el historial. Las sesiones
						finalizadas o canceladas aparecerán en esta tabla de forma
						automática.
					</p>
				</div>
			) : (
				<div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
					<table
						data-testid="past-sessions-table"
						className="w-full text-left text-xs border-collapse"
					>
						<thead>
							<tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-black tracking-wider">
								<th className="py-3.5 px-5">1. Código</th>
								<th className="py-3.5 px-5">2. Fecha y Hora</th>
								<th className="py-3.5 px-5">3. Idioma</th>
								<th className="py-3.5 px-5">4. Jugadores</th>
								<th className="py-3.5 px-5">5. Resultado</th>
								<th className="py-3.5 px-5 text-right">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
							{summaries.map((session) => (
								<tr
									key={session.code}
									data-testid="past-session-row"
									onClick={() => handleSelectSession(session.code)}
									className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
										selectedCode === session.code ? "bg-indigo-950/40" : ""
									}`}
								>
									{/* 1. Código */}
									<td
										data-testid="session-code"
										className="py-4 px-5 font-mono font-black text-indigo-400 text-sm"
									>
										{session.code}
									</td>

									{/* 2. Fecha y Hora */}
									<td
										data-testid="session-date"
										className="py-4 px-5 text-slate-300 font-mono"
									>
										{formatWallTime(session.createdAtWallMs)}
									</td>

									{/* 3. Idioma */}
									<td data-testid="session-lang" className="py-4 px-5">
										<span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-bold text-[11px]">
											{session.language}
										</span>
									</td>

									{/* 4. Jugadores */}
									<td
										data-testid="session-players"
										className="py-4 px-5 text-slate-300"
									>
										{`${session.playerCount} alumnos`}
									</td>

									{/* 5. Resultado: Estrellas 1-3★ o Guion (-) si no finalizada */}
									<td data-testid="session-result" className="py-4 px-5">
										{session.isFinished && session.stars !== null ? (
											<span
												data-testid="session-stars"
												className="text-amber-400 font-bold text-sm font-mono"
											>
												{`${"★".repeat(session.stars)}${"☆".repeat(3 - session.stars)} (${session.stars}★)`}
											</span>
										) : (
											<span
												data-testid="session-stars-dash"
												className="text-slate-500 font-bold font-mono text-base"
												title="Sesión no finalizada / Estrellas retenidas"
											>
												-
											</span>
										)}
									</td>

									{/* Acciones */}
									<td className="py-4 px-5 text-right">
										<div className="flex items-center justify-end gap-2">
											<button
												type="button"
												data-testid={`view-detail-btn-${session.code}`}
												onClick={(e) => {
													e.stopPropagation();
													handleSelectSession(session.code);
												}}
												className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow"
											>
												Ver Detalle
											</button>
											<button
												type="button"
												data-testid={`delete-session-btn-${session.code}`}
												onClick={(e) => {
													e.stopPropagation();
													triggerDelete(session.code);
												}}
												className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800 cursor-pointer"
												title="Borrar sesión de forma irrecuperable (Ley 29733)"
											>
												Borrar sesión
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Detalle Completo de Sesión Pasada Seleccionada ([TEACH-03], D2) */}
			{selectedRecord && (
				<div
					data-testid="past-session-detail"
					className="p-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/60 shadow-2xl flex flex-col gap-6"
				>
					<div className="flex items-center justify-between border-b border-slate-800 pb-4">
						<div className="flex items-center gap-3">
							<span className="text-3xl">📋</span>
							<div>
								<div className="flex items-center gap-3">
									<h3 className="text-xl font-black text-white">
										{`Detalle de Sesión: ${selectedRecord.code}`}
									</h3>
									<span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-mono font-bold">
										{selectedRecord.config.language}
									</span>
									<span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
										{selectedRecord.players.length} alumnos
									</span>
								</div>
								<div className="text-xs text-slate-400 mt-0.5">
									Creada: {formatWallTime(selectedRecord.createdAtWallMs, true)}{" "}
									| Estado: {selectedRecord.status}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<button
								type="button"
								data-testid="detail-delete-btn"
								onClick={() => triggerDelete(selectedRecord.code)}
								className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800 cursor-pointer shadow"
							>
								Borrar sesión (Ley 29733)
							</button>
							<button
								type="button"
								data-testid="close-detail-btn"
								onClick={() => {
									setSelectedCode(null);
									setSelectedRecord(null);
								}}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
							>
								← Volver al listado
							</button>
						</div>
					</div>

					{/* Componente DocenteView integrado con feed de inspección y comentarios */}
					<DocenteView
						sessionRecord={selectedRecord}
						repo={activeRepo}
						showInspectionSection={true}
						onCommentAdded={async () => {
							const refreshed = await activeRepo.getByCode(selectedRecord.code);
							if (refreshed) setSelectedRecord(refreshed);
						}}
					/>
				</div>
			)}

			{/* Diálogo Bloqueante de Confirmación de Borrado (Ley 29733 / SPEC §2, D5) */}
			{sessionToDelete && (
				<div
					data-testid="delete-confirm-modal"
					className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
				>
					<div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-red-500 shadow-2xl flex flex-col gap-4 text-center">
						<div className="text-4xl">⚠️</div>
						<h3
							data-testid="confirm-modal-title"
							className="text-xl font-black text-white"
						>
							¿Eliminar definitivamente la sesión {sessionToDelete}?
						</h3>
						<p className="text-xs text-slate-300 leading-relaxed">
							Esta acción ejecuta un{" "}
							<span className="text-red-400 font-bold">
								borrado físico en cascada (hard-delete)
							</span>{" "}
							total e irreversible de configuraciones, transcripciones, dibujos,
							miniaturas, lecturas de visión, eventos en EventLog, scores y
							notas pedagógicas en estricto cumplimiento de la{" "}
							<span className="text-amber-400 font-bold">Ley 29733</span>{" "}
							(Protección de Datos Personales) o solicitud de padres.
						</p>
						<div className="flex gap-3 justify-center pt-2">
							<button
								type="button"
								data-testid="cancel-delete-btn"
								disabled={isDeleting}
								onClick={() => setSessionToDelete(null)}
								className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								data-testid="confirm-hard-delete-btn"
								disabled={isDeleting}
								onClick={() => executeHardDelete(sessionToDelete)}
								className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg cursor-pointer disabled:opacity-50"
							>
								{isDeleting ? "Borrando…" : "Sí, borrar definitivamente"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
