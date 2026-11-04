import { describe, expect, test } from "bun:test";
import { codeGen } from "@/shared/codeGen.ts";
import {
	badgePriority,
	calculateStars,
	filterAndPrioritizeBadges,
	starsFor,
} from "@/shared/scoring.ts";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";
import { getAvatarById, KID_AVATARS, NPC_ROSTER } from "@/ui/tokens/avatars.ts";
import { BADGE_DEFINITIONS } from "@/ui/tokens/badges.ts";
import {
	CARD_STATUS_TOKENS,
	DRAWING_PALETTE,
	NPC_BORDER_COLOR,
} from "@/ui/tokens/colors.ts";
import { LOCKED_STRINGS, SAFE_CODE_ALPHABET } from "@/ui/tokens/strings.ts";

describe("F1a Design Tokens & Layouts Verification", () => {
	describe("1. Tokens de Color y Paletas (SPEC §2, §3, §4, §6, §12)", () => {
		test("Paleta de 5 colores de dibujo fija (#111827, #ef4444, #3b82f6, #22c55e, #eab308)", () => {
			expect(DRAWING_PALETTE.length).toBe(5);
			const hexes = DRAWING_PALETTE.map((c) => c.hex);
			expect(hexes).toContain("#111827"); // Negro
			expect(hexes).toContain("#ef4444"); // Rojo
			expect(hexes).toContain("#3b82f6"); // Azul
			expect(hexes).toContain("#22c55e"); // Verde
			expect(hexes).toContain("#eab308"); // Amarillo
		});

		test("Paleta de 8 avatares fijos de niños con bordes distintivos", () => {
			expect(KID_AVATARS.length).toBe(8);
			const ids = KID_AVATARS.map((a) => a.id);
			expect(ids).toEqual([
				"zorro",
				"buho",
				"rana",
				"gato",
				"llama",
				"toucan",
				"raton",
				"tortuga",
			]);

			for (const avatar of KID_AVATARS) {
				expect(avatar.themeColor).toBeString();
				expect(avatar.role).toBe("kid");
				expect(avatar.themeColor).not.toBe("#ffffff"); // Los niños tienen borde de color
			}
		});

		test("Borde blanco puro para los 3 NPCs (Paco, Luz, Soto)", () => {
			expect(NPC_BORDER_COLOR).toBe("#ffffff");
			expect(Object.keys(NPC_ROSTER)).toEqual(["paco", "luz", "soto"]);
			expect(NPC_ROSTER.paco?.themeColor).toBe("#ffffff");
			expect(NPC_ROSTER.luz?.themeColor).toBe("#ffffff");
			expect(NPC_ROSTER.soto?.themeColor).toBe("#ffffff");
		});

		test("getAvatarById resuelve tanto niños como NPCs", () => {
			expect(getAvatarById("zorro").name).toBe("Zorro");
			expect(getAvatarById("paco").name).toBe("Agricultor Paco");
			expect(getAvatarById("luz").name).toBe("Ingeniera Luz");
			expect(getAvatarById("soto").name).toBe("Alcalde Soto");
		});

		test("Anillos de estado de tarjetas de jugador cubren los 7 estados mandatorios", () => {
			const statuses = [
				"idle",
				"recording",
				"locked",
				"speaking",
				"drawing",
				"npc_lock",
				"walk",
			] as const;

			for (const status of statuses) {
				const token = CARD_STATUS_TOKENS[status];
				expect(token).toBeDefined();
				expect(token.ringClass).toBeString();
			}

			// Verificaciones puntuales
			expect(CARD_STATUS_TOKENS.recording.pulse).toBe(true);
			expect(CARD_STATUS_TOKENS.locked.dim).toBe(true);
			expect(CARD_STATUS_TOKENS.npc_lock.label).toBe("escucha…");
			expect(CARD_STATUS_TOKENS.walk.label).toBe("planeen");
		});
	});

	describe("2. Textos Bloqueados Verbatim y Generador de Códigos (SPEC §2, §19)", () => {
		test("Generador de códigos codeGen() genera 4 caracteres sin 0, O, 1, I, L", () => {
			for (let i = 0; i < 200; i++) {
				const code = codeGen();
				expect(code.length).toBe(4);
				expect(code).not.toMatch(/[0O1IL]/);
			}
			expect(SAFE_CODE_ALPHABET.length).toBe(31);
		});

		test("Strings bloqueados coinciden con SPEC §19", () => {
			expect(LOCKED_STRINGS.WIN_TITLE).toBe("¡Puente listo!");
			expect(LOCKED_STRINGS.PARTIAL_TITLE(2)).toBe("Misión en curso 2/3");
			expect(LOCKED_STRINGS.NPC_LOCK).toBe("escucha…");
			expect(LOCKED_STRINGS.SIMULTANEOUS).toBe("espera tu turno");
			expect(LOCKED_STRINGS.DRAW_CAP).toBe(
				"aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!",
			);
			expect(LOCKED_STRINGS.UNCLEAR_1).toBe("¿me lo repites o lo dibujas?");
			expect(LOCKED_STRINGS.OVERLAP).toBe("oí dos voces, ¿quién lo propone?");
			expect(LOCKED_STRINGS.CIRCLE_NUDGE).toBe("hablen entre ustedes 20s");
			expect(LOCKED_STRINGS.CIRCLE_RESUME).toBe("listo, tenemos plan");
			expect(LOCKED_STRINGS.TEACHER_FLAG).toBe("con apoyo docente");
			expect(LOCKED_STRINGS.DOCENTE_BANNER).toBe(
				"señales preliminares, no notas",
			);
			expect(LOCKED_STRINGS.FARMER_CLARIFY).toBe("¿quién ayuda y en qué?");
			expect(LOCKED_STRINGS.MID_WALK("Taller")).toBe("llegando a Taller…");
		});
	});

	describe("3. Lógica de Estrellas e Insignias (SPEC §11)", () => {
		test("calculateStars / starsFor retorna null si la partida no finalizó (estrellas retenidas)", () => {
			expect(calculateStars(10, false)).toBeNull();
			expect(starsFor(10, false)).toBeNull();
		});

		test("calculateStars calcula 1★ (0-4), 2★ (5-7) y 3★ (8-10) al finalizar", () => {
			expect(calculateStars(4, true)).toBe(1);
			expect(calculateStars(6, true)).toBe(2);
			expect(calculateStars(9, true)).toBe(3);
			expect(starsFor(9, true)).toBe(3);
		});

		test("BADGE_DEFINITIONS usa el ID estandarizado 'cumplieron_su_promesa'", () => {
			expect(BADGE_DEFINITIONS.length).toBe(5);
			const ids = BADGE_DEFINITIONS.map((b) => b.id);
			expect(ids).toContain("cumplieron_su_promesa");
			expect(ids).toContain("paso_a_paso");
			expect(ids).toContain("un_solo_equipo");
			expect(ids).toContain("se_turnaron");
			expect(ids).toContain("se_organizaron");
		});

		test("filterAndPrioritizeBadges respeta orden de prioridad estricta y tope de 3", () => {
			const allBadges = [
				"se_organizaron",
				"se_turnaron",
				"un_solo_equipo",
				"cumplieron_su_promesa",
				"paso_a_paso",
			] as const;

			const prioritized = filterAndPrioritizeBadges(allBadges);
			expect(prioritized.length).toBe(3);
			expect(prioritized[0]).toBe("paso_a_paso");
			expect(prioritized[1]).toBe("cumplieron_su_promesa");
			expect(prioritized[2]).toBe("un_solo_equipo");

			// Alias de dominio
			expect(badgePriority(allBadges)).toEqual(prioritized);
		});
	});

	describe("4. PlayStore — Máquina de Estados del Modo Alumnos (/play)", () => {
		test("joinSession inicializa N tarjetas con avatares", () => {
			usePlayStore.getState().joinSession("K7NP", 4);
			const state = usePlayStore.getState();

			expect(state.phase).toBe("claim");
			expect(state.sessionCode).toBe("K7NP");
			expect(state.expectedPlayers).toBe(4);
			expect(state.cards.length).toBe(4);
			expect(state.cards.every((c) => !c.isConfirmed)).toBe(true);
		});

		test("confirmar todas las tarjetas activa el countdown de 5s", () => {
			usePlayStore.getState().joinSession("K7NP", 3);
			usePlayStore.getState().toggleCardConfirmed(0);
			usePlayStore.getState().toggleCardConfirmed(1);
			expect(usePlayStore.getState().phase).toBe("claim");

			usePlayStore.getState().toggleCardConfirmed(2);
			expect(usePlayStore.getState().phase).toBe("countdown");
			expect(usePlayStore.getState().countdownSeconds).toBe(5);
		});

		test("transición a juego activo inicializa estación y checklist", () => {
			usePlayStore.getState().startActiveGame();
			const state = usePlayStore.getState();

			expect(state.phase).toBe("active");
			expect(state.currentStation).toBe("campamento");
			expect(state.checklistStep).toBe(0);
			expect(state.inventory.madera).toBe(false);
		});

		test("control de apertura y cierre de la pizarra de dibujo", () => {
			usePlayStore.getState().openDraw("c1");
			expect(usePlayStore.getState().isDrawOpen).toBe(true);
			expect(usePlayStore.getState().drawCardId).toBe("c1");
			expect(usePlayStore.getState().isTimerPaused).toBe(true);

			usePlayStore.getState().submitDrawing();
			expect(usePlayStore.getState().isDrawOpen).toBe(false);
			expect(usePlayStore.getState().isTimerPaused).toBe(false);
		});

		test("apertura de mapa y propuesta de viaje con veto de 5s", () => {
			usePlayStore.getState().openMap();
			expect(usePlayStore.getState().isMapOpen).toBe(true);

			usePlayStore.getState().proposeMove("taller", "Mateo");
			expect(usePlayStore.getState().proposedStation).toBe("taller");
			expect(usePlayStore.getState().proposerName).toBe("Mateo");
			expect(usePlayStore.getState().vetoCountdown).toBe(5);

			usePlayStore.getState().cancelMoveProposal();
			expect(usePlayStore.getState().proposedStation).toBeNull();
			expect(usePlayStore.getState().vetoCountdown).toBeNull();
		});

		test("disparo de victoria colectiva", () => {
			usePlayStore.getState().triggerVictory();
			const state = usePlayStore.getState();
			expect(state.endType).toBe("victory");
			expect(state.checklistStep).toBe(3);
			expect(state.inventory.madera).toBe(true);
			expect(state.inventory.plano).toBe(true);
			expect(state.inventory.sello).toBe(true);
		});
	});

	describe("5. TeacherStore — Consola y Privacidad Docente (/teacher)", () => {
		test("configuración de sesión bloquea valores fuera de rango", () => {
			useTeacherStore.getState().setFormPlayers(8); // Máximo es 6
			expect(useTeacherStore.getState().formPlayers).toBe(6);

			useTeacherStore.getState().setFormPlayers(1); // Mínimo es 3
			expect(useTeacherStore.getState().formPlayers).toBe(3);

			useTeacherStore.getState().setFormDurationMinutes(60); // Máximo es 40
			expect(useTeacherStore.getState().formDurationMinutes).toBe(40);
		});

		test("creación de sesión genera código de 4 caracteres usando codeGen()", () => {
			const code = useTeacherStore.getState().createNewSession();
			expect(code.length).toBe(4);
			expect(useTeacherStore.getState().isConfigLocked).toBe(true);
		});

		test("concesión forzada otorga paso siguiente y capa estructurada a 1 (SPEC §11)", () => {
			useTeacherStore.setState({
				liveStep: 1,
				teacherAssisted: false,
				groupScores: {
					turnTaking: 2,
					colaboracion: 2,
					negociacion: 2,
					estructurada: 2,
					organizacion: 2,
				},
			});

			useTeacherStore.getState().forceGrantNext();
			const state = useTeacherStore.getState();

			expect(state.liveStep).toBe(2);
			expect(state.teacherAssisted).toBe(true);
			expect(state.groupScores.estructurada).toBe(1); // Capado a máx 1
		});

		test("control de Mute BGM exclusivo del docente", () => {
			const initialMute = useTeacherStore.getState().isBgmMuted;
			useTeacherStore.getState().toggleBgmMute();
			expect(useTeacherStore.getState().isBgmMuted).toBe(!initialMute);
		});

		test("hilo de comentarios es estrictamente add-only (SPEC §11, D5)", () => {
			const countBefore = useTeacherStore.getState().comments.length;
			useTeacherStore
				.getState()
				.addComment("Excelente articulación durante la votación.");

			const state = useTeacherStore.getState();
			expect(state.comments.length).toBe(countBefore + 1);
			expect(state.comments[0]?.text).toBe(
				"Excelente articulación durante la votación.",
			);
			expect(state.comments[0]?.author).toBe("teacher");
		});

		test("borrado seguro de sesión pasada (hard-delete Ley 29733)", () => {
			const past = useTeacherStore.getState().pastSessions;
			const targetCode = past[0]?.code;
			expect(targetCode).toBeDefined();

			if (targetCode) {
				useTeacherStore.getState().deletePastSession(targetCode);
				const remaining = useTeacherStore.getState().pastSessions;
				expect(remaining.some((s) => s.code === targetCode)).toBe(false);
			}
		});
	});
});
