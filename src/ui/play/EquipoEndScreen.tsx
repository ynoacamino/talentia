/**
 * EquipoEndScreen — Pantalla Final de Equipo ([PLAY-06], [PLAY-07])
 * Conforme a SPEC §1, §10, §11, §19:
 * Victoria ([PLAY-06]):
 * - Arte del puente listo
 * - Pop animado de 1 a 3 estrellas (1-3★) calculado por starsFor()
 * - ≤3 insignias ganadas priorizadas por badgePriority()
 * - Indicador 3/3
 * - Animación confetti CSS
 * - PRIVACIDAD ESTRICTA: CERO nombres de alumnos, CERO notas numéricas o rankings.
 *
 * Fin Parcial ([PLAY-07]):
 * - Título exacto: "Misión en curso X/3"
 * - Estrellas retenidas (no se muestra ninguna)
 * - Solo insignias ganadas (badges-only)
 */
import { useEffect, useState } from "react";
import { type BadgeId, badgePriority, starsFor } from "@/shared/scoring.ts";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { BADGE_DEFINITIONS, type GroupScores } from "@/ui/tokens/badges.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export interface EquipoEndScreenProps {
	scores?: GroupScores;
	endType?: "victory" | "partial" | null;
	checklistStep?: number;
	onReset?: () => void;
	lang?: "ES" | "EN" | "QUZ";
}

export function EquipoEndScreen({
	scores: propScores,
	endType: propEndType,
	checklistStep: propChecklistStep,
	onReset: propReset,
	lang = "ES",
}: EquipoEndScreenProps = {}) {
	const store = usePlayStore();

	const endType = propEndType ?? store.endType;
	const checklistStep = propChecklistStep ?? store.checklistStep;
	const resetToLobby = propReset ?? store.resetToLobby;

	const [confettiPieces, setConfettiPieces] = useState<
		Array<{ id: number; left: number; delay: number; color: string }>
	>([]);

	const isVictory = endType === "victory";

	// Usar puntajes provistos por prop o fallback a estado inicial del equipo
	const scores: GroupScores = propScores ?? {
		turnTaking: 2,
		colaboracion: 2,
		negociacion: 2,
		estructurada: 2,
		organizacion: 1,
	};

	// Cálculo puro de estrellas con función de dominio (@/shared/scoring.ts)
	const sumPoints =
		scores.turnTaking +
		scores.colaboracion +
		scores.negociacion +
		scores.estructurada +
		scores.organizacion;
	const stars = starsFor(sumPoints, isVictory);

	// Determinar qué criterios alcanzaron 2/2
	const earnedBadgeIds: BadgeId[] = [];
	if (scores.estructurada === 2) earnedBadgeIds.push("paso_a_paso");
	if (scores.negociacion === 2) earnedBadgeIds.push("cumplieron_su_promesa");
	if (scores.colaboracion === 2) earnedBadgeIds.push("un_solo_equipo");
	if (scores.turnTaking === 2) earnedBadgeIds.push("se_turnaron");
	if (scores.organizacion === 2) earnedBadgeIds.push("se_organizaron");

	// Filtrar y ordenar por prioridad estricta de contrato (máximo 3)
	const prioritizedIds = badgePriority(earnedBadgeIds);
	const earnedBadges = prioritizedIds
		.map((id) => {
			const def = BADGE_DEFINITIONS.find((b) => b.id === id);
			if (!def) return null;
			const quote = def.defaultQuote[lang] || def.defaultQuote.ES;
			return { badge: def, quote };
		})
		.filter((b): b is NonNullable<typeof b> => b !== null);

	// Generar confeti CSS para victoria
	useEffect(() => {
		if (isVictory) {
			const colors = [
				"#f59e0b",
				"#10b981",
				"#3b82f6",
				"#ec4899",
				"#8b5cf6",
				"#ef4444",
			];
			const pieces = Array.from({ length: 40 }).map((_, i) => ({
				id: i,
				left: Math.random() * 98,
				delay: Math.random() * 2.5,
				color: colors[i % colors.length] ?? "#f59e0b",
			}));
			setConfettiPieces(pieces);
		}
	}, [isVictory]);

	if (!endType) return null;

	return (
		<div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 z-50 select-none overflow-y-auto">
			{/* Confetti CSS si es Victoria */}
			{isVictory && (
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					{confettiPieces.map((p) => (
						<div
							key={p.id}
							className="confetti-piece"
							style={{
								left: `${p.left}%`,
								animationDelay: `${p.delay}s`,
								backgroundColor: p.color,
							}}
						/>
					))}
				</div>
			)}

			{/* Encabezado y Título Principal (§19) */}
			<div className="text-center max-w-2xl w-full pt-4">
				<div className="text-sm uppercase font-black tracking-widest text-amber-400 mb-2">
					{isVictory ? "¡Objetivo Colectivo Logrado!" : "Sesión Finalizada"}
				</div>
				<h1 className="text-4xl md:text-5xl font-black text-white tracking-tight animate-pop">
					{isVictory
						? LOCKED_STRINGS.WIN_TITLE
						: LOCKED_STRINGS.PARTIAL_TITLE(checklistStep)}
				</h1>
				<p className="text-sm text-slate-300 mt-2">
					{isVictory
						? "Todo el pueblo cruzó el río gracias a su cooperación y trabajo en equipo."
						: "Gran esfuerzo en equipo. Continuaremos la misión en la próxima sesión."}
				</p>
			</div>

			{/* Ilustración Central y Estrellas Colectivas */}
			<div className="my-auto flex flex-col items-center gap-6 py-4">
				{/* Arte del Puente */}
				<div className="relative w-72 h-44 rounded-3xl bg-radial from-slate-800 to-slate-900 border-3 border-amber-400/50 shadow-2xl flex items-center justify-center overflow-hidden">
					<div className="text-6xl animate-pop">
						{isVictory ? "🌉 ✨" : "🪵 🌾"}
					</div>
					<div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-amber-300">
						{isVictory ? "Pasos: 3/3 Completos" : `Pasos: ${checklistStep}/3`}
					</div>
				</div>

				{/* Despliegue de Estrellas (1-3★ Pop Animado) o Retenidas */}
				{isVictory && stars !== null ? (
					<div className="flex flex-col items-center gap-2">
						<div className="flex items-center gap-4">
							{[1, 2, 3].map((starNum) => {
								const isEarned = starNum <= stars;
								return (
									<div
										key={`star-slot-${starNum}`}
										style={{ animationDelay: `${starNum * 200}ms` }}
										className={`text-5xl transition-all ${
											isEarned
												? "text-amber-400 animate-star-pop drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
												: "text-slate-700 opacity-40 scale-75"
										}`}
									>
										★
									</div>
								);
							})}
						</div>
						<div className="text-xs font-black uppercase tracking-wider text-amber-300">
							{stars === 3
								? "¡Excelente coordinación de equipo!"
								: stars === 2
									? "¡Buen trabajo cooperativo!"
									: "¡Primer paso de trabajo grupal!"}
						</div>
					</div>
				) : (
					<div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400">
						⭐ Estrellas retenidas (Misión en curso)
					</div>
				)}
			</div>

			{/* Insignias de Honor del Grupo (≤ 3 Badges con Cita en Idioma de la Partida) */}
			<div className="w-full max-w-3xl">
				<div className="text-xs font-black uppercase tracking-widest text-slate-400 text-center mb-3">
					Insignias de Cooperación Colectiva (Máximo 3):
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{earnedBadges.map(({ badge, quote }) => (
						<div
							key={badge.id}
							className="p-4 rounded-2xl bg-slate-900/90 border-2 border-amber-400/40 shadow-xl flex flex-col justify-between gap-3 animate-pop"
						>
							<div className="flex items-center gap-3">
								<span className="text-3xl">{badge.icon}</span>
								<div>
									<h4 className="text-sm font-black text-amber-300">
										{badge.name}
									</h4>
									<p className="text-[11px] text-slate-300 line-clamp-2">
										{badge.description}
									</p>
								</div>
							</div>

							{/* Cita de evidencia conductual en idioma de la partida */}
							<div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-medium text-slate-200 italic">
								"{quote}"
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Footer con Privacidad Estricta y Botón Volver */}
			<div className="w-full max-w-2xl flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
				<div className="text-[11px] text-slate-400">
					Evaluación grupal colectiva. Cero calificaciones numéricas ni rankings
					individuales.
				</div>
				<button
					type="button"
					onClick={resetToLobby}
					className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
				>
					Volver al Inicio
				</button>
			</div>
		</div>
	);
}
