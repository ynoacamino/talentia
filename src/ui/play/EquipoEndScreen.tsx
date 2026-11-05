/**
 * EquipoEndScreen — Pantalla Final de Equipo ([PLAY-06], [PLAY-07], Superficie D3)
 * Conforme a SPEC §1, §10, §11, §12, §19 & docs/gates/F0-contrato.md:
 *
 * Victoria ([PLAY-06]):
 * - Título exacto locked string: '¡Puente listo!' (SPEC §19).
 * - Arte del puente completado.
 * - Animación de confeti CSS/Canvas y pop animado de estrellas (1-3★ calculado estrictamente con starsFor).
 * - Hasta 3 insignias ganadas priorizadas estrictamente con badgePriority:
 *   Paso a paso > Cumplieron su promesa > Un solo equipo > Se turnaron > Se organizaron.
 * - Cita conductual de evidencia de cada insignia EN EL IDIOMA DE LA PARTIDA (ES, EN, QUZ).
 * - Indicador de pasos: '3/3' (o '¡Puente listo!').
 *
 * Fin Parcial / Expiración de tiempo ([PLAY-07]):
 * - Título exacto locked string: 'Misión en curso X/3' (SPEC §19).
 * - Insignias ganadas hasta el momento (badges-only).
 * - ESTRELLAS RETENIDAS (stars === null): NO se muestra ninguna estrella (estrellas retenidas según SPEC §1, §11).
 *
 * PRIVACIDAD ESTRICTA:
 * - CERO nombres de alumnos, CERO números individuales, CERO calificaciones o rankings comparativos.
 * - Si la partida tuvo asistencia docente ('con apoyo docente', forced=true o time_skip),
 *   en /play NUNCA se muestra ninguna etiqueta ni advertencia de penalización;
 *   los niños ven las estrellas juzgadas sin delatar ayuda docente.
 */

import { useEffect, useState } from "react";
import type { JudgeScores, Language } from "@/shared/documents.ts";
import { type BadgeId, badgePriority, starsFor } from "@/shared/scoring.ts";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { BADGE_DEFINITIONS, type GroupScores } from "@/ui/tokens/badges.ts";
import { LOCKED_STRINGS } from "@/ui/tokens/strings.ts";

export interface EquipoEndScreenProps {
	scores?: GroupScores;
	endType?: "victory" | "partial" | null;
	checklistStep?: number;
	onReset?: () => void;
	lang?: Language;
	earnedBadgeIds?: BadgeId[];
	badgeQuotes?: Partial<Record<BadgeId, string>>;
	judgeScores?: JudgeScores | null;
	teacherAssisted?: boolean;
}

export function EquipoEndScreen({
	scores: propScores,
	endType: propEndType,
	checklistStep: propChecklistStep,
	onReset: propReset,
	lang: propLang,
	earnedBadgeIds: propBadgeIds,
	badgeQuotes: propBadgeQuotes,
	judgeScores: propJudgeScores,
	teacherAssisted: propTeacherAssisted,
}: EquipoEndScreenProps = {}) {
	const storeHook = usePlayStore();
	const store =
		typeof window === "undefined" ? usePlayStore.getState() : storeHook;

	const endType =
		propEndType ??
		store.endType ??
		(store.sessionStatus === "finished"
			? "victory"
			: store.sessionStatus === "expired"
				? "partial"
				: null);

	const checklistStep = propChecklistStep ?? store.checklistStep;
	const resetToLobby = propReset ?? store.resetToLobby;
	const lang: Language = propLang ?? store.language ?? "ES";

	const isVictory = endType === "victory";

	const [confettiPieces, setConfettiPieces] = useState<
		Array<{ id: number; left: number; delay: number; color: string }>
	>(() => {
		if (!isVictory) return [];
		const colors = [
			"#f59e0b",
			"#10b981",
			"#3b82f6",
			"#ec4899",
			"#8b5cf6",
			"#ef4444",
		];
		return Array.from({ length: 40 }).map((_, i) => ({
			id: i,
			left: (i * 2.5) % 98,
			delay: (i * 0.1) % 2.5,
			color: colors[i % colors.length] ?? "#f59e0b",
		}));
	});

	// Usar puntajes provistos por prop o fallback a estado del store / defaults
	const scores: GroupScores = propScores ??
		store.groupScores ?? {
			turnTaking: 2,
			colaboracion: 2,
			negociacion: 2,
			estructurada: 2,
			organizacion: 1,
		};

	// Cálculo puro de estrellas con función de dominio (@/shared/scoring.ts)
	// Si no es victoria, las estrellas se retienen estrictamente (null)
	const sumPoints =
		scores.turnTaking +
		scores.colaboracion +
		scores.negociacion +
		scores.estructurada +
		scores.organizacion;

	const stars =
		propJudgeScores?.stars !== undefined && propJudgeScores !== null
			? isVictory
				? propJudgeScores.stars
				: null
			: starsFor(sumPoints, isVictory);

	// Determinar qué criterios alcanzaron 2/2 (o badges explícitos)
	const isAssisted = Boolean(
		propTeacherAssisted ??
			store.teacherAssisted ??
			propJudgeScores?.conApoyoDocente,
	);

	let rawBadgeIds: BadgeId[] = [];
	if (propBadgeIds) {
		rawBadgeIds = [...propBadgeIds];
	} else if (propJudgeScores?.earnedBadges) {
		rawBadgeIds = propJudgeScores.earnedBadges.map((b) => b.id);
	} else {
		if (scores.estructurada === 2 && !isAssisted)
			rawBadgeIds.push("paso_a_paso");
		if (scores.negociacion === 2) rawBadgeIds.push("cumplieron_su_promesa");
		if (scores.colaboracion === 2) rawBadgeIds.push("un_solo_equipo");
		if (scores.turnTaking === 2) rawBadgeIds.push("se_turnaron");
		if (scores.organizacion === 2) rawBadgeIds.push("se_organizaron");
	}

	// Regla estricta SPEC §11: si hubo apoyo docente, 'Paso a paso' queda excluida
	if (isAssisted) {
		rawBadgeIds = rawBadgeIds.filter((b) => b !== "paso_a_paso");
	}

	// Filtrar y ordenar por prioridad estricta de contrato (máximo 3)
	// 1. Paso a paso > 2. Cumplieron su promesa > 3. Un solo equipo > 4. Se turnaron > 5. Se organizaron
	const prioritizedIds = badgePriority(rawBadgeIds);
	const earnedBadges = prioritizedIds
		.map((id) => {
			const def = BADGE_DEFINITIONS.find((b) => b.id === id);
			if (!def) return null;
			const customQuote = propBadgeQuotes?.[id] ?? store.badgeQuotes?.[id];
			const judgeQuote = propJudgeScores?.earnedBadges.find(
				(b) => b.id === id,
			)?.quoteInRunLanguage;
			const quote =
				customQuote ||
				judgeQuote ||
				def.defaultQuote[lang] ||
				def.defaultQuote.ES;
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
		} else {
			setConfettiPieces([]);
		}
	}, [isVictory]);

	if (!endType) return null;

	return (
		<div
			data-testid="equipo-end-screen"
			className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 z-50 select-none overflow-y-auto"
		>
			{/* Confetti CSS si es Victoria */}
			{isVictory && (
				<div
					data-testid="confetti-container"
					className="absolute inset-0 pointer-events-none overflow-hidden"
				>
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
				<h1
					data-testid="end-screen-title"
					className="text-4xl md:text-5xl font-black text-white tracking-tight animate-pop"
				>
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
					<div
						data-testid="steps-indicator"
						className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-bold text-amber-300"
					>
						{isVictory
							? "Pasos: 3/3 (¡Puente listo!)"
							: `Pasos: ${checklistStep}/3`}
					</div>
				</div>

				{/* Despliegue de Estrellas (1-3★ Pop Animado) o Retenidas */}
				{isVictory && stars !== null ? (
					<div className="flex flex-col items-center gap-2">
						<div
							data-testid="stars-container"
							className="flex items-center gap-4"
						>
							{[1, 2, 3].map((starNum) => {
								const isEarned = starNum <= stars;
								return (
									<div
										key={`star-slot-${starNum}`}
										data-testid={`star-${starNum}`}
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
						<div
							data-testid="stars-count-label"
							className="text-xs font-black uppercase tracking-wider text-amber-300"
						>
							{stars === 3
								? "¡Excelente coordinación de equipo! (3★)"
								: stars === 2
									? "¡Buen trabajo cooperativo! (2★)"
									: "¡Primer paso de trabajo grupal! (1★)"}
						</div>
					</div>
				) : (
					<div
						data-testid="stars-withheld"
						className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400"
					>
						Estrellas retenidas (misión en curso)
					</div>
				)}
			</div>

			{/* Insignias de Honor del Grupo (≤ 3 Badges con Cita en Idioma de la Partida) */}
			<div data-testid="badges-container" className="w-full max-w-3xl">
				<div className="text-xs font-black uppercase tracking-widest text-slate-400 text-center mb-3">
					Insignias de Cooperación Colectiva (Hasta 3):
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{earnedBadges.map(({ badge, quote }) => (
						<div
							key={badge.id}
							data-testid={`badge-${badge.id}`}
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
							<div
								data-testid={`badge-quote-${badge.id}`}
								className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-medium text-slate-200 italic"
							>
								"{quote}"
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Footer con Privacidad Estricta y Botón Volver */}
			<div className="w-full max-w-2xl flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
				<div className="text-[11px] text-slate-400">
					Evaluación grupal colectiva. Refuerzo positivo del trabajo en equipo.
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
