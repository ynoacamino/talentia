/**
 * PlayLayout — Layout Principal para Alumnos (/play)
 * Conforme a SPEC §2, §3, §12:
 * - Aislamiento estricto: CERO interfaz docente, CERO contadores de bloqueo.
 * - Flujo: Entrada de Código → Reclamo de Tarjetas → Juego Activo → Pantalla Final Equipo.
 * - Soporta parámetro de URL ?s=XXXX para prellenar código de sesión.
 */
import { useEffect } from "react";
import { ActivePlayView } from "@/ui/play/ActivePlayView.tsx";
import { ClaimCardsScreen } from "@/ui/play/ClaimCardsScreen.tsx";
import { JoinScreen } from "@/ui/play/JoinScreen.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { useAppRouter } from "@/ui/router/index.tsx";

export function PlayLayout() {
	const { phase, sessionCode, joinSession } = usePlayStore();
	const { sessionCodeParam } = useAppRouter();

	// Si viene ?s=XXXX por URL y no nos hemos unido aún, prellenar/unir
	useEffect(() => {
		if (sessionCodeParam && !sessionCode && phase === "join") {
			joinSession(sessionCodeParam);
		}
	}, [sessionCodeParam, sessionCode, phase, joinSession]);

	return (
		<div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
			{phase === "join" && <JoinScreen prefilledCode={sessionCodeParam} />}
			{(phase === "claim" || phase === "countdown") && <ClaimCardsScreen />}
			{(phase === "active" || phase === "end") && <ActivePlayView />}
		</div>
	);
}
