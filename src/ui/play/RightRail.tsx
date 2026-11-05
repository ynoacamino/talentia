/**
 * RightRail — Riel Derecho de Tarjetas de Alumnos ([PLAY-03], SPEC §5, §12)
 * Conforme a SPEC §5, §12:
 * - Tarjetas Paper-Mario cutout con borde distintivo de color.
 * - Anillos de estado: idle gris, recording rojo pulsante, locked dim,
 *   speaking 'X habla', drawing 'X dibuja', npc_lock 'escucha…', walk 'planeen'.
 * - Botones multitáctiles de Hablar (hold-to-talk) y Dibujar (hold-to-draw).
 * - Manejo de simultaneidad y estados transitorios (shake).
 */
import { useRef, useState } from "react";
import { AvatarCutout } from "@/ui/components/AvatarCutout.tsx";
import { type StudentCard, usePlayStore } from "@/ui/play/playStore.ts";
import {
	CARD_STATUS_TOKENS,
	type PlayerCardStatus,
} from "@/ui/tokens/colors.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export interface RightRailProps {
	cards?: StudentCard[];
}

export function RightRail({ cards: propCards }: RightRailProps = {}) {
	const store = usePlayStore();
	const cards = propCards ?? store.cards;
	const setCardStatus = store.setCardStatus;
	const addSubtitle = store.addSubtitle;
	const openDraw = store.openDraw;
	const showShakeMessage = store.showShakeMessage;
	const isWalking = store.isWalking;
	const isTimerPaused = store.isTimerPaused;

	const holdTimers = useRef<
		Record<string, { start: number; timerId: NodeJS.Timeout | null }>
	>({});
	const [activeRecordingId, setActiveRecordingId] = useState<string | null>(
		null,
	);

	// Multi-touch hold-to-talk handler (§5)
	const handlePointerDownTalk = (card: StudentCard, e: React.PointerEvent) => {
		e.currentTarget.setPointerCapture(e.pointerId);

		if (card.isRetired) return;

		// Si el grupo está en marcha (§5: walk talk allowed as planning, but no NPC reply)
		if (isWalking) {
			setCardStatus(card.cardId, "walk");
		}

		// Si ya hay alguien grabando (§5: simultaneous press -> "espera tu turno")
		if (activeRecordingId && activeRecordingId !== card.cardId) {
			showShakeMessage(LOCKED_STRINGS.SIMULTANEOUS);
			return;
		}

		// Si el sistema está en pausa o NPC hablando (§5: NPC lock -> "escucha…")
		if (isTimerPaused) {
			showShakeMessage(LOCKED_STRINGS.NPC_LOCK);
			return;
		}

		setActiveRecordingId(card.cardId);
		setCardStatus(card.cardId, "recording");

		const startTs = Date.now();
		// Auto-cut a los 20 segundos (§5)
		const timerId = setTimeout(() => {
			handlePointerUpTalk(card);
		}, 20000);

		holdTimers.current[card.cardId] = { start: startTs, timerId };
	};

	const handlePointerUpTalk = (card: StudentCard) => {
		const info = holdTimers.current[card.cardId];
		if (!info) return;

		if (info.timerId) clearTimeout(info.timerId);
		const durationMs = Date.now() - info.start;
		delete holdTimers.current[card.cardId];

		setActiveRecordingId(null);

		// Si fue < 0.5s se descarta (§5)
		if (durationMs < 500) {
			setCardStatus(card.cardId, "idle");
			return;
		}

		// Simula transcripción de habla del alumno
		setCardStatus(card.cardId, "speaking");
		const samplePhrases = [
			"Propongo que revisemos cuánta madera tenemos.",
			"¿Vamos al taller de la Ingeniera Luz?",
			"Paco nos pidió ayudar en los surcos.",
			"Tenemos que pedir el permiso al Alcalde Soto.",
		];
		const phrase =
			samplePhrases[Math.floor(Math.random() * samplePhrases.length)] ??
			"¡Vamos equipo!";

		addSubtitle({
			speakerName: card.studentName,
			speakerColor: "#38bdf8",
			speakerType: "kid",
			text: phrase,
		});

		// Retorna a idle tras 3 segundos
		setTimeout(() => {
			setCardStatus(card.cardId, "idle");
		}, 3000);
	};

	return (
		<div className="absolute top-0 right-0 bottom-0 w-72 bg-slate-950/90 border-l border-slate-800/90 backdrop-blur-md p-4 flex flex-col gap-3 z-10 select-none overflow-y-auto">
			<div className="flex items-center justify-between border-b border-slate-800 pb-2">
				<span className="text-xs font-black uppercase tracking-widest text-slate-400">
					Equipo ({cards.filter((c) => !c.isRetired).length})
				</span>
				<span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
					En línea
				</span>
			</div>

			{/* Tarjetas de Alumnos */}
			<div className="flex flex-col gap-3">
				{cards.map((card) => {
					const statusToken =
						CARD_STATUS_TOKENS[card.status as PlayerCardStatus] ??
						CARD_STATUS_TOKENS.idle;
					const isRetired = card.isRetired;

					return (
						<div
							key={card.cardId}
							className={`relative flex flex-col p-3 rounded-2xl border-2 transition-all ${
								isRetired
									? "opacity-40 grayscale bg-slate-900 border-slate-800 pointer-events-none"
									: statusToken.ringClass
							} bg-slate-900/80 shadow-lg`}
						>
							{/* Fila Superior: Avatar + Nombre + Estado */}
							<div className="flex items-center gap-3">
								<AvatarCutout
									avatarId={card.avatarId}
									size="sm"
									showBorder={true}
								/>

								<div className="flex-1 min-w-0">
									<div className="text-sm font-black truncate text-white leading-tight">
										{card.studentName}
									</div>
									<div className="text-[10px] font-semibold text-slate-400 capitalize">
										{card.avatarId}
									</div>
								</div>

								{/* Badge de Estado del Anillo (§12) */}
								{statusToken.label && (
									<span
										className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusToken.badgeBg} ${statusToken.badgeText} ${
											statusToken.pulse ? "animate-pulse" : ""
										}`}
									>
										{statusToken.label}
									</span>
								)}
								{isRetired && (
									<span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-950 text-red-300 border border-red-800">
										Retirado
									</span>
								)}
							</div>

							{/* Botones Multitáctiles: Hablar y Dibujar (§5, §6) */}
							{!isRetired && (
								<div className="grid grid-cols-2 gap-2 mt-3">
									{/* Hold-to-Talk */}
									<button
										type="button"
										onPointerDown={(e) => handlePointerDownTalk(card, e)}
										onPointerUp={() => handlePointerUpTalk(card)}
										onPointerCancel={() => handlePointerUpTalk(card)}
										className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 border transition-all cursor-pointer ${
											card.status === "recording"
												? "bg-red-600 text-white border-red-400 scale-95 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
												: "bg-slate-800 hover:bg-slate-700 active:bg-red-500 active:text-white text-slate-200 border-slate-700"
										}`}
										title="Mantén presionado para hablar (hold-to-talk)"
									>
										<span>🎙️</span>
										<span>
											{card.status === "recording" ? "Grabando" : "Hablar"}
										</span>
									</button>

									{/* Hold-to-Draw */}
									<button
										type="button"
										onClick={() => openDraw(card.cardId)}
										className="py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 border bg-slate-800 hover:bg-slate-700 active:bg-purple-600 active:text-white text-purple-300 border-slate-700 transition-all cursor-pointer"
										title="Abrir pizarra de dibujo para proponer diseño"
									>
										<span>🎨</span>
										<span>Dibujar</span>
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
