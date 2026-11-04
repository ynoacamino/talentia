/**
 * Spanish (ES) Dictionary for SocraticGuild / TALENTIA.
 * Standard language for Docente panel and primary UI.
 */

import { LOCKED_STRINGS } from "@/shared/i18n/lockedStrings.ts";
import type { TranslationDictionary } from "@/shared/i18n/types.ts";

export const esDictionary: TranslationDictionary = {
	common: {
		appName: "SocraticGuild",
		loading: "Cargando...",
		error: "Error",
		retry: "Reintentar",
		cancel: "Cancelar",
		confirm: "Confirmar",
		close: "Cerrar",
		ready: "Listo",
		back: "Volver",
		pause: "Pausa",
		seconds: "s",
		minutes: "min",
	},

	d1: {
		createSessionTitle: "Nueva Sesión",
		languageLabel: "Idioma de la partida",
		playersLabel: "Cantidad de jugadores",
		durationLabel: "Duración de juego",
		durationOption: "{m} minutos",
		createButton: "Crear sesión",
		sessionCodeLabel: "Código de sesión",
		joinPrompt: "Ingresa el código para unirte",
		codePlaceholder: "XXXX",
		joinButton: "Unirse a la partida",
		claimCardPrompt: "Toca una tarjeta para elegir tu personaje",
		playerSlot: "Jugador {n}",
		chooseAvatar: "Elige tu avatar",
		namePrompt: "Tu nombre (máx 10 letras)",
		namePlaceholder: "Nombre",
		voiceNameHelp: "Mantén presionado para dictar o escribe tu nombre",
		confirmCard: "Listo",
		editCard: "Cambiar",
		waitingOthers: "Esperando a que todos confirmen...",
		countdownStart: "La aventura comienza en {s}...",
		soloNotAllowed: "Se requieren al menos 2 jugadores listos para comenzar",
		forceStart: "Iniciar con {n} listos",
	},

	d2: {
		pastSessionsTitle: "Historial de Sesiones Pasadas",
		colCode: "Código",
		colDate: "Fecha / Hora",
		colLanguage: "Idioma",
		colPlayers: "Jugadores",
		colResult: "Resultado",
		colActions: "Acciones",
		viewDetail: "Ver Detalle",
		inconclusive: "Inconclusa",
		playersCount: "{n} niños",
		emptyHistory: "No hay sesiones previas registradas.",
		sessionDetailTitle: "Detalle de Sesión: {code}",
	},

	d3: {
		winTitle: LOCKED_STRINGS.WIN_TITLE,
		winSubtitle: "¡El equipo cruzó el puente y salvó a la comunidad!",
		partialTitle: LOCKED_STRINGS.PARTIAL_TITLE,
		partialSubtitle:
			"El tiempo se agotó, pero demostraron un gran trabajo en equipo.",
		stepsCompleted: "Pasos completados: {x}/3",
		starsEarned: "{n} estrellas ganadas",
		starsWithheld: "Estrellas retenidas (misión inconclusa)",
		badgesTitle: "Insignias del Equipo",
		noBadges: "Ninguna insignia alcanzada en esta partida.",
	},

	badges: {
		paso_a_paso: {
			name: "Paso a paso",
			description:
				"Resolvieron la crisis siguiendo cada etapa con orden y paciencia.",
		},
		cumplieron_su_promesa: {
			name: "Cumplieron su promesa",
			description:
				"Llegaron a acuerdos justos y mantuvieron su palabra ante los desafíos.",
		},
		un_solo_equipo: {
			name: "Un solo equipo",
			description:
				"Construyeron sobre las ideas de todos y se apoyaron mutuamente.",
		},
		se_turnaron: {
			name: "Se turnaron",
			description:
				"Respetaron los turnos para hablar y escucharon con atención.",
		},
		se_organizaron: {
			name: "Se organizaron",
			description:
				"Distribuyeron roles y coordinaron sus acciones con claridad.",
		},
	},

	d4: {
		docenteBanner: LOCKED_STRINGS.DOCENTE_BANNER,
		teacherFlag: LOCKED_STRINGS.TEACHER_FLAG,
		title: "Panel de Evaluación Pedagógica Docente",
		subtitle:
			"Observación formativa de habilidades blandas basada en evidencia conversacional y gráfica",
		groupTitle: "Evaluación Grupal de Habilidades Blandas (5 Criterios)",
		studentsTitle: "Tarjetas Individuales de Estudiantes Confirmados",
		score0: "0 - Ausente",
		score1: "1 - Emergente",
		score2: "2 - Consistente",
		evidenceQuote: "Evidencia observada",
		voiceTurns: "Turnos de voz",
		drawingsCount: "Dibujos",
		anecdote: "Anécdota del juez",
		paraphraseNote:
			"Citas parafraseadas al español conforme a SPEC §11, §14 para garantizar coherencia diagnóstica.",
		criteria: {
			turnTaking: "Toma de turnos (Turn-taking)",
			turnTakingDesc:
				"esperan su turno / pocas interrupciones / ceden la palabra",
			colaboracion: "Colaboración",
			colaboracionDesc:
				"hablan encima / reparten turnos / construyen sobre lo dicho",
			negociacion: "Negociación",
			negociacionDesc:
				"exigen / ofrecen algo / acuerdan con compromiso recordado",
			resolucionEstructurada: "Resolución estructurada",
			resolucionEstructuradaDesc:
				"saltan pasos / reintentan tras pista / planean chacra→taller→alcaldía",
			organizacionLiderazgo: "Organización y Liderazgo",
			organizacionLiderazgoDesc:
				"nadie coordina / alguien propone orden / rol de coordinación rotado o aceptado",
		},
		studentDimensions: {
			participacion: "Participación",
			participacion0: "Silencio",
			participacion1: "1–2 aportes",
			participacion2: "Interviene sostenidamente",
			propuesta: "Propuesta",
			propuesta0: "Repite",
			propuesta1: "Aporta idea o dibujo",
			propuesta2: "Idea retomada por el grupo",
			organizacion: "Organización",
			organizacion0: "Nunca ordena",
			organizacion1: "Pide turno u orden una vez",
			organizacion2: "Coordina o reparte roles",
		},
	},

	d5: {
		commentsTitle: "Notas y Observaciones del Docente (Registro Add-Only)",
		commentPlaceholder:
			"Escribe una observación pedagógica sobre esta sesión...",
		addCommentButton: "Agregar observación",
		immutableNotice:
			"Registro inmutable: las observaciones se agregan cronológicamente y no pueden modificarse ni eliminarse individualmente.",
		emptyComments: "No hay observaciones registradas aún.",
		authorTeacher: "Docente",
		hardDeleteTitle: "Privacidad y Derechos ARCO",
		hardDeleteButton: "Borrar sesión",
		deleteConfirmTitle: "¿Eliminar definitivamente la sesión {code}?",
		deleteConfirmMessage:
			"Esta acción purgará irreversiblemente transcripciones, dibujos, eventos, puntajes y comentarios de la sesión (Ley 29733 / Solicitud de Padres).",
		deleteConfirmButton: "Sí, borrar definitivamente",
		deleteCancelButton: "Cancelar",
	},

	d6: {
		card: {
			holdToTalk: "Mantén para hablar",
			holdToDraw: "Mantén para dibujar",
			npcSpeaking: LOCKED_STRINGS.NPC_LOCK,
			otherSpeaking: "{name} habla",
			drawingActive: "{name} dibuja",
			planningWalk: "planeen",
			retiredLabel: "retirado",
			simultaneousShake: LOCKED_STRINGS.SIMULTANEOUS,
			drawCapShake: LOCKED_STRINGS.DRAW_CAP,
		},
		movement: {
			mapButton: "Mapa",
			mapTitle: "Mapa de la Comunidad",
			mapPrompt: "¿A dónde quieren viajar en grupo?",
			vetoHoldPrompt: "Mantén para vetar",
			bannerMove: LOCKED_STRINGS.BANNER_MOVE,
			moveExecute: LOCKED_STRINGS.MOVE_EXECUTE,
			midWalk: LOCKED_STRINGS.MID_WALK,
		},
		dialogue: {
			unclear1: LOCKED_STRINGS.UNCLEAR_1,
			overlap: LOCKED_STRINGS.OVERLAP,
			circleNudge: LOCKED_STRINGS.CIRCLE_NUDGE,
			circleReady: LOCKED_STRINGS.CIRCLE_READY,
			farmerClarify: LOCKED_STRINGS.FARMER_CLARIFY,
			npcListening: "{name} escucha…",
		},
		checklist: {
			title: "Misión del Puente",
			step1: "1 Conseguir madera (chacra)",
			step2: "2 Aprobar diseño (taller)",
			step3: "3 Permiso (alcaldía)",
			statusTodo: "Pendiente",
			statusActive: "En curso",
			statusDone: "Completado",
		},
		inventory: {
			wood: "Madera",
			blueprint: "Diseño",
			seal: "Permiso",
		},
		drawing: {
			title: "Pizarra de Dibujo Colaborativo",
			undo: "Deshacer",
			clear: "Borrar todo",
			submit: "Listo",
			timeLeft: "Tiempo restante: {s}s",
			clearConfirmPrompt: "¿Deseas borrar todo el dibujo?",
		},
		stations: {
			campamento: "Campamento",
			chacra: "Chacra",
			taller: "Taller",
			alcaldia: "Alcaldía",
			puente: "Puente",
		},
		npcs: {
			soto: "Alcalde Soto",
			luz: "Ingeniera Luz",
			paco: "Agricultor Paco",
		},
		console: {
			title: "Consola de Intervención Docente (Silenciosa)",
			liveMirrorTitle: "Espejo en Vivo (Solo Lectura)",
			transcriptFeedTitle: "Registro de Transcripciones Recientes (Últimos 20)",
			eventFeedTitle: "Registro de Eventos en Tiempo Real",
			timerGameLabel: "Tiempo de juego:",
			timerStallLabel: "Alerta de atasco (Stall):",
			timerWallLabel: "Tiempo transcurrido (Pared):",
			skipIntro: "Saltar introducción",
			forceGrant: "Conceder siguiente hito (Force grant)",
			replayNpc: "Repetir última frase PNJ",
			endRunNow: "Terminar partida ahora",
			retryBlocked: "Reintentar bloqueo",
			retirePlayer: "Retirar jugador",
			muteBgm: "Silenciar música (BGM)",
			unmuteBgm: "Activar música (BGM)",
			skipToCampamento: "Ir a Campamento",
			skipToChacra: "Ir a Chacra",
			skipToTaller: "Ir a Taller",
			skipToAlcaldia: "Ir a Alcaldía",
			skipToPuente: "Ir a Puente",
		},
	},

	d7: {
		playProjectionOnly:
			"Esta pantalla está optimizada para la proyección en el aula. Cero controles docentes ni contadores de bloqueos.",
		teacherPrivateOnly:
			"Superficie privada del docente. Mantener en la pantalla local del operador, nunca proyectar.",
	},
};
