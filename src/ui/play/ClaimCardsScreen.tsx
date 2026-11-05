/**
 * ClaimCardsScreen — Reclamo de Tarjetas de Alumno ([PLAY-02])
 * Conforme a SPEC §3:
 * - N tarjetas repartidas (? + Jugador X).
 * - Selector de 8 avatares fijos (Paper-Mario cutout).
 * - Nombre con simulación de STT ("Mantén para hablar") + teclado freetype (máx 10 chars).
 * - Confirmación ✓ individual.
 * - Auto-countdown de 5s al confirmar todas las N tarjetas.
 */
import { useEffect, useState } from "react";
import { AvatarCutout } from "@/ui/components/AvatarCutout.tsx";
import type { PlayPhase, StudentCard } from "@/ui/play/playStore.ts";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { KID_AVATARS } from "@/ui/tokens/avatars.ts";

export interface ClaimCardsScreenProps {
	cards?: StudentCard[];
	phase?: PlayPhase;
	countdownSeconds?: number;
	sessionCode?: string | null;
	selectedCardIndex?: number | null;
}

export function ClaimCardsScreen({
	cards: propCards,
	phase: propPhase,
	countdownSeconds: propCountdown,
	sessionCode: propCode,
	selectedCardIndex: propSelectedIdx,
}: ClaimCardsScreenProps = {}) {
	const store = usePlayStore();
	const cards = propCards ?? store.cards;
	const phase = propPhase ?? store.phase;
	const countdownSeconds = propCountdown ?? store.countdownSeconds;
	const sessionCode = propCode ?? store.sessionCode;
	const selectedCardIndex =
		propSelectedIdx !== undefined ? propSelectedIdx : store.selectedCardIndex;
	const selectCardForEdit = store.selectCardForEdit;
	const updateCard = store.updateCard;
	const toggleCardConfirmed = store.toggleCardConfirmed;
	const startActiveGame = store.startActiveGame;

	const [isListeningStt, setIsListeningStt] = useState(false);
	const [nameInput, setNameInput] = useState("");

	// Countdown timer effect
	useEffect(() => {
		if (phase !== "countdown") return;
		if (countdownSeconds <= 0) {
			startActiveGame();
			return;
		}
		const timer = setTimeout(() => {
			usePlayStore.setState({ countdownSeconds: countdownSeconds - 1 });
		}, 1000);
		return () => clearTimeout(timer);
	}, [phase, countdownSeconds, startActiveGame]);

	const selectedCard: StudentCard | undefined =
		selectedCardIndex !== null ? cards[selectedCardIndex] : undefined;

	const handleOpenCard = (idx: number) => {
		const c = cards[idx];
		if (!c || c.isConfirmed) return;
		setNameInput(c.studentName || "");
		selectCardForEdit(idx);
	};

	const handleSelectAvatar = (avatarId: string) => {
		if (selectedCardIndex !== null) {
			updateCard(selectedCardIndex, { avatarId });
		}
	};

	const handleSimulateStt = () => {
		setIsListeningStt(true);
		// Simula reconocimiento de voz
		const sampleNames = [
			"Mateo",
			"Valentina",
			"Sofía",
			"Leo",
			"Camila",
			"Lucas",
			"Elena",
			"Joaquín",
		];
		const randomName =
			sampleNames[Math.floor(Math.random() * sampleNames.length)] ?? "Mateo";
		setNameInput(randomName);
		if (selectedCardIndex !== null) {
			updateCard(selectedCardIndex, { studentName: randomName });
		}
		setIsListeningStt(false);
	};

	const handleConfirmCard = (idx: number) => {
		const c = cards[idx];
		if (!c) return;
		const finalName = (
			nameInput.trim() ||
			c.studentName ||
			`Jugador ${idx + 1}`
		).slice(0, 10);
		updateCard(idx, { studentName: finalName });
		selectCardForEdit(null);
		toggleCardConfirmed(idx);
	};

	return (
		<div className="relative flex h-full w-full flex-col justify-between p-6 bg-radial from-slate-900 to-slate-950 text-white select-none overflow-hidden">
			{/* Top Header */}
			<div className="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
						Paso 1: Reclamar Personaje
					</div>
					<h2 className="text-2xl font-black text-white">
						Toquen una tarjeta para elegir su avatar y nombre
					</h2>
				</div>
				<div className="flex items-center gap-3">
					<div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
						Sesión:{" "}
						<span
							data-testid="claim-session-code"
							className="font-bold text-amber-400"
						>
							{sessionCode}
						</span>
					</div>
					<div
						data-testid="claim-ready-count"
						className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs font-bold text-emerald-300"
					>
						{cards.filter((c) => c.isConfirmed).length}/{cards.length} Listos
					</div>
				</div>
			</div>

			{/* Grid de N Tarjetas Dealt */}
			<div className="my-auto grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto w-full">
				{cards.map((card, idx) => {
					const isEditing = selectedCardIndex === idx;
					return (
						<div
							key={card.cardId}
							data-testid={`claim-card-${idx}`}
							className={`relative flex flex-col items-center justify-between p-5 rounded-3xl border-3 transition-all ${
								card.isConfirmed
									? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
									: isEditing
										? "border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105"
										: "border-slate-700 bg-slate-900/80 hover:border-slate-500"
							}`}
						>
							{/* Badge Superior */}
							<div className="w-full flex justify-between items-center mb-2">
								<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
									Jugador {idx + 1}
								</span>
								{card.isConfirmed ? (
									<button
										type="button"
										data-testid={`unconfirm-card-btn-${idx}`}
										onClick={(e) => {
											e.stopPropagation();
											toggleCardConfirmed(idx);
										}}
										className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md cursor-pointer hover:bg-emerald-400"
										title="Tocar para editar"
									>
										✓
									</button>
								) : (
									<span
										data-testid={`question-badge-${idx}`}
										className="w-6 h-6 rounded-full border border-slate-600 bg-slate-800 text-slate-400 text-xs flex items-center justify-center font-bold"
									>
										?
									</span>
								)}
							</div>

							{/* Avatar Paper-Mario Cutout */}
							<div className="my-3" data-testid={`card-avatar-${idx}`}>
								<AvatarCutout
									avatarId={card.avatarId}
									size="lg"
									showBorder={true}
								/>
							</div>

							{/* Nombre del Alumno (10-char max SPEC §3) */}
							<div className="w-full text-center mt-2">
								<div
									data-testid={`card-name-${idx}`}
									className="text-lg font-black truncate max-w-[140px] mx-auto text-white"
								>
									{card.studentName || `Jugador ${idx + 1}`}
								</div>
								<div className="text-[11px] font-semibold text-slate-400 capitalize mt-0.5">
									{card.avatarId}
								</div>
							</div>

							{/* Botón de Confirmación ✓ */}
							{!card.isConfirmed && (
								<div className="mt-4 flex flex-col gap-2 w-full">
									<button
										type="button"
										data-testid={`edit-card-btn-${idx}`}
										onClick={() => handleOpenCard(idx)}
										className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wide shadow-sm active:scale-95 cursor-pointer"
									>
										Cambiar personaje
									</button>
									<button
										type="button"
										data-testid={`confirm-card-btn-${idx}`}
										onClick={() => handleConfirmCard(idx)}
										className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-md active:scale-95 cursor-pointer"
									>
										Confirmar ✓
									</button>
								</div>
							)}
							{card.isConfirmed && (
								<div
									data-testid={`card-ready-status-${idx}`}
									className="mt-4 text-xs font-bold text-emerald-400 flex items-center gap-1"
								>
									<span>¡Listo para jugar!</span>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Modal / Panel de Edición de Tarjeta seleccionada */}
			{selectedCard && !selectedCard.isConfirmed && (
				<div
					data-testid="customize-modal"
					className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-pop"
				>
					<div className="max-w-xl w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<h3 className="text-xl font-black text-white">
								Personalizar Jugador {(selectedCardIndex ?? 0) + 1}
							</h3>
							<button
								type="button"
								data-testid="close-modal-btn"
								onClick={() => selectCardForEdit(null)}
								className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
							>
								✕
							</button>
						</div>

						{/* Selector de los 8 Avatares Fijos (duplicados permitidos SPEC §3) */}
						<div>
							<div className="text-xs uppercase font-bold text-amber-400 mb-2">
								1. Elige tu avatar animal:
							</div>
							<div className="grid grid-cols-4 gap-3">
								{KID_AVATARS.map((av) => {
									const isSelected = selectedCard.avatarId === av.id;
									const isTaken = cards.some(
										(c, i) => i !== selectedCardIndex && c.avatarId === av.id,
									);
									return (
										<button
											key={av.id}
											type="button"
											data-testid={`avatar-option-${av.id}`}
											onClick={() => handleSelectAvatar(av.id)}
											className={`relative p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
												isSelected
													? "bg-amber-400/20 border-2 border-amber-400 scale-105"
													: "bg-slate-800/80 border border-slate-700 hover:border-slate-500"
											}`}
										>
											<AvatarCutout
												avatarId={av.id}
												size="md"
												showBorder={false}
											/>
											<span className="text-xs font-bold text-slate-200">
												{av.name}
											</span>
											{isTaken && (
												<span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 px-1 rounded">
													En uso
												</span>
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Entrada de Nombre con Simulación STT y Freetype (SPEC §3) */}
						<div>
							<div className="text-xs uppercase font-bold text-amber-400 mb-2">
								2. Tu nombre (máx 10 letras):
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									maxLength={10}
									data-testid="student-name-input"
									value={nameInput}
									onChange={(e) => setNameInput(e.target.value.slice(0, 10))}
									placeholder="Escribe tu nombre..."
									className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border-2 border-slate-700 focus:border-amber-400 text-white font-bold text-lg outline-none"
								/>
								<button
									type="button"
									data-testid="stt-simulate-btn"
									onClick={handleSimulateStt}
									disabled={isListeningStt}
									className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all cursor-pointer ${
										isListeningStt
											? "bg-red-600 text-white border-red-500 animate-pulse"
											: "bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/50"
									}`}
									title="Mantén o pulsa para dictar tu nombre (STT)"
								>
									🎙️ {isListeningStt ? "Escuchando…" : "Hablar"}
								</button>
							</div>
						</div>

						{/* Botón de Confirmar Tarjeta */}
						<div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
							<button
								type="button"
								data-testid="cancel-edit-btn"
								onClick={() => selectCardForEdit(null)}
								className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								data-testid="save-confirm-btn"
								onClick={() =>
									selectedCardIndex !== null &&
									handleConfirmCard(selectedCardIndex)
								}
								className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-lg cursor-pointer"
							>
								Guardar y Confirmar ✓
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Overlay de Auto-Countdown de 5s o Force-Start de 3s (SPEC §3) */}
			{phase === "countdown" && (
				<div
					data-testid="countdown-overlay"
					className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-pop select-none"
				>
					<div className="text-center p-8 rounded-3xl bg-slate-900 border-3 border-amber-400 shadow-2xl max-w-md w-full">
						<div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2">
							¡Preparados para iniciar!
						</div>
						<h3 className="text-3xl font-black text-white mb-6">
							Iniciando misión en…
						</h3>
						<div
							data-testid="countdown-seconds"
							className="w-28 h-28 mx-auto rounded-full border-4 border-amber-400 bg-amber-400/20 flex items-center justify-center text-6xl font-black text-amber-300 animate-pop shadow-[0_0_30px_rgba(251,191,36,0.4)]"
						>
							{countdownSeconds}
						</div>
						<p className="text-sm text-slate-300 mt-6">
							Para cancelar, cualquier jugador puede desmarcar su tarjeta ✓
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
