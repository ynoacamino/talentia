/**
 * Southern Quechua (QUZ / Runasimi Qusqu-Qullaw) Dictionary.
 * SPEC §11, §14:
 * - Player-facing UI is in Southern Quechua.
 * - DocenteView (d2, d4, d5, d6.console) remains ALWAYS in Spanish.
 * - Locked strings follow SPEC §19 exact literals.
 */

import { esDictionary } from "@/shared/i18n/dictionaries/es.ts";
import { LOCKED_STRINGS } from "@/shared/i18n/lockedStrings.ts";
import type { TranslationDictionary } from "@/shared/i18n/types.ts";

export const quzDictionary: TranslationDictionary = {
	common: {
		appName: "SocraticGuild",
		loading: "Churakuchkan...",
		error: "Pantay",
		retry: "Kutipay",
		cancel: "Tatichiy",
		confirm: "Takyachiy",
		close: "Wisq'ay",
		ready: "Allinña",
		back: "Kutiy",
		pause: "Sayay",
		seconds: "s",
		minutes: "min",
	},

	d1: {
		createSessionTitle: "Musuq Pukllay",
		languageLabel: "Pukllay simi",
		playersLabel: "Pukllaqkuna hayk'a",
		durationLabel: "Pukllana pacha",
		durationOption: "{m} minutukuna",
		createButton: "Pukllayta kamariy",
		sessionCodeLabel: "Pukllay chimpita",
		joinPrompt: "Yaykunaykipaq chimpitata qillqay",
		codePlaceholder: "XXXX",
		joinButton: "Pukllayman yaykuy",
		claimCardPrompt: "Kikinchatayki akllanaykipaq llikillata llamiy",
		playerSlot: "Pukllaq {n}",
		chooseAvatar: "Kikinchataykita akllay",
		namePrompt: "Sutiyki (ch'ulla 10 qillqa)",
		namePlaceholder: "Suti",
		voiceNameHelp: "Nit'iy rimanaykipaq icha sutiyki qillqay",
		confirmCard: "Allinña",
		editCard: "Allinchay",
		waitingOthers: "Llapanku takyachinankuta suyaspa...",
		countdownStart: "Pukllay qallarinqa {s} segundopi...",
		soloNotAllowed: "Iskay pukllaqkunaraq allinña kanan qallarinapaq",
		forceStart: "Iniciar con {n} listos", // Teacher action (Spanish)
	},

	// SPEC §11, §14: DocenteView remains ALWAYS in Spanish
	d2: esDictionary.d2,

	d3: {
		winTitle: LOCKED_STRINGS.WIN_TITLE,
		winSubtitle: "Kuska chakanta chimparqanku llaqtatapas qispichirqanku!",
		partialTitle: LOCKED_STRINGS.PARTIAL_TITLE,
		partialSubtitle:
			"Pacha puchukakurqan, ichaqa allinta kuskalla llamkarqankichik.",
		stepsCompleted: "Tukusqa llamkaykuna: {x}/3",
		starsEarned: "{n} ch'askakuna chaskisqa",
		starsWithheld: "Ch'askakuna suyasqa (llamkay mana tukusqa)",
		badgesTitle: "Kuska Llamkay Sananchakuna",
		noBadges: "Manaraq sananchakunata taripankichu kay pukllaypi.",
	},

	badges: {
		paso_a_paso: {
			name: "Taqaymanta taqayman",
			description: "Allillamanta ñankunata qatispa sasachakuyta allicharqanku.",
		},
		cumplieron_su_promesa: {
			name: "Rimaynin hunt'aq",
			description: "Allin rimanakuykunaman chayaspa siminkuta hunt'arqanku.",
		},
		un_solo_equipo: {
			name: "Huk sunqulla",
			description: "Llapanku yuyayninkuta kuskachaspa kallpachanakurqanku.",
		},
		se_turnaron: {
			name: "Mit'anakuspa",
			description: "Rimana mit'ata yupaychaspa allinta uyarirqanku.",
		},
		se_organizaron: {
			name: "Allin tantiasqa",
			description: "Llamkaykunata rakinakuspa allinta pusanakurqanku.",
		},
	},

	// SPEC §11, §14: DocenteView remains ALWAYS in Spanish
	d4: esDictionary.d4,

	// SPEC §11, §14: Docente comments remain ALWAYS in Spanish
	d5: esDictionary.d5,

	d6: {
		card: {
			holdToTalk: "Nit'iy rimanaykipaq",
			holdToDraw: "Nit'iy llimp'inaykipaq",
			npcSpeaking: LOCKED_STRINGS.NPC_LOCK,
			otherSpeaking: "{name} rimachkan",
			drawingActive: "{name} llimp'ichkan",
			planningWalk: "tantiaychik",
			retiredLabel: "lluqsisqa",
			simultaneousShake: LOCKED_STRINGS.SIMULTANEOUS,
			drawCapShake: LOCKED_STRINGS.DRAW_CAP,
		},
		movement: {
			mapButton: "Tiyanapampa",
			mapTitle: "Ayllu Tiyanapampa",
			mapPrompt: "Maymantataq rinkichik kuskalla?",
			vetoHoldPrompt: "Nit'iy tatichinaykipaq",
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
			npcListening: "{name} uyarichkan…",
		},
		checklist: {
			title: "Chaka Llamkay",
			step1: "1 K'ulluta chaskiy (chacra)",
			step2: "2 Siq'ita allinchay (taller)",
			step3: "3 Saqillayta mañakuy (alcaldía)",
			statusTodo: "Suyasqa",
			statusActive: "Ruwachkasqa",
			statusDone: "Tukusqa",
		},
		inventory: {
			wood: "K'ullu",
			blueprint: "Siq'i",
			seal: "Saqillay",
		},
		drawing: {
			title: "Kuska Llimp'ina Pirqa",
			undo: "Kutichiy",
			clear: "Pichay",
			submit: "Allinña",
			timeLeft: "Pukllana pacha: {s}s",
			clearConfirmPrompt: "Tukuy llimp'isqata pichankichu?",
		},
		stations: {
			campamento: "Chikllapata",
			chacra: "Chakra",
			taller: "Llamkana wasi",
			alcaldia: "Kuraka wasi",
			puente: "Chaka",
		},
		npcs: {
			soto: "Alcalde Soto",
			luz: "Ingeniera Luz",
			paco: "Agricultor Paco",
		},
		// Operator console: ALWAYS in Spanish
		console: esDictionary.d6.console,
	},

	d7: {
		playProjectionOnly:
			"Kay qawanaqa yachaywasipi qawachinapaq allichasqa. Manam yachachiqpa kamachiyninchu.",
		teacherPrivateOnly:
			"Yachachiqpa sapallan qawana. Laptopllapi qaway, ama qawachiychu.",
	},
};
