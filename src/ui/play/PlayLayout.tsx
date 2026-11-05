/**
 * PlayLayout — Layout Principal para Alumnos (/play)
 * Conforme a SPEC §1, §2, §3, §11, §12 & Superficie D3:
 * - Aislamiento estricto: CERO interfaz docente, CERO contadores de bloqueo.
 * - Flujo: Entrada de Código → Reclamo de Tarjetas → Juego Activo → Pantalla Final Equipo.
 * - Alterna automáticamente a EquipoEndScreen cuando la partida finaliza (status finished o expired).
 * - Soporta parámetro de URL ?s=XXXX para prellenar código de sesión.
 */

import { useEffect } from "react";
import type { ISessionRepository, SessionRecord } from "@/shared/documents.ts";
import { ActivePlayView } from "@/ui/play/ActivePlayView.tsx";
import { ClaimCardsScreen } from "@/ui/play/ClaimCardsScreen.tsx";
import { EquipoEndScreen } from "@/ui/play/EquipoEndScreen.tsx";
import { JoinScreen } from "@/ui/play/JoinScreen.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { useAppRouter } from "@/ui/router/index.tsx";

export interface PlayLayoutProps {
	repo?: ISessionRepository;
}

export function PlayLayout({ repo }: PlayLayoutProps = {}) {
	const storeHook = usePlayStore();
	const store =
		typeof window === "undefined" ? usePlayStore.getState() : storeHook;
	const {
		phase,
		sessionCode,
		sessionStatus,
		endType,
		joinSession,
		triggerVictory,
		triggerPartialEnd,
	} = store;
	const { sessionCodeParam } = useAppRouter();

	// Si viene ?s=XXXX por URL y no nos hemos unido aún, prellenar/unir
	useEffect(() => {
		if (sessionCodeParam && !sessionCode && phase === "join") {
			joinSession(sessionCodeParam, repo);
		}
	}, [sessionCodeParam, sessionCode, phase, joinSession, repo]);

	// Sincronización automática de estado de sesión con el repositorio
	useEffect(() => {
		if (!repo || !sessionCode) return;
		let isMounted = true;

		// Chequeo síncrono si está disponible
		if (
			"getByCodeSync" in repo &&
			typeof (
				repo as { getByCodeSync?: (code: string) => SessionRecord | null }
			).getByCodeSync === "function"
		) {
			const rec = (
				repo as { getByCodeSync: (code: string) => SessionRecord | null }
			).getByCodeSync(sessionCode);
			if (rec) {
				if (rec.status === "finished" && endType !== "victory") {
					triggerVictory();
				} else if (rec.status === "expired" && endType !== "partial") {
					triggerPartialEnd();
				}
			}
		}

		// Chequeo asíncrono
		repo
			.getByCode(sessionCode)
			.then((rec) => {
				if (!isMounted || !rec) return;
				if (rec.status === "finished" && endType !== "victory") {
					triggerVictory();
				} else if (rec.status === "expired" && endType !== "partial") {
					triggerPartialEnd();
				}
			})
			.catch(() => {});

		return () => {
			isMounted = false;
		};
	}, [repo, sessionCode, endType, triggerVictory, triggerPartialEnd]);

	// Chequeo síncrono para SSR / sync repo
	let effectiveSessionStatus = sessionStatus;
	let effectiveEndType = endType;
	if (
		repo &&
		sessionCode &&
		"getByCodeSync" in repo &&
		typeof (repo as { getByCodeSync?: (code: string) => SessionRecord | null })
			.getByCodeSync === "function"
	) {
		const rec = (
			repo as { getByCodeSync: (code: string) => SessionRecord | null }
		).getByCodeSync(sessionCode);
		if (rec) {
			if (rec.status === "finished") {
				effectiveSessionStatus = "finished";
				effectiveEndType = "victory";
			} else if (rec.status === "expired") {
				effectiveSessionStatus = "expired";
				effectiveEndType = "partial";
			}
		}
	}

	// Determinar si la partida finalizó (status finished o expired, o endType activo)
	const isEnded =
		phase === "end" ||
		effectiveSessionStatus === "finished" ||
		effectiveSessionStatus === "expired" ||
		effectiveEndType !== null;

	return (
		<div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
			{phase === "join" && !isEnded && (
				<JoinScreen prefilledCode={sessionCodeParam} repo={repo} />
			)}
			{(phase === "claim" || phase === "countdown") && !isEnded && (
				<ClaimCardsScreen />
			)}
			{phase === "active" && !isEnded && <ActivePlayView />}
			{isEnded && <EquipoEndScreen endType={effectiveEndType} />}
		</div>
	);
}
