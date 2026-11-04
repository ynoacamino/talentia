/**
 * English (EN) Dictionary for SocraticGuild / TALENTIA.
 * SPEC §11, §14:
 * - Player-facing UI is in English.
 * - DocenteView (d2, d4, d5, d6.console) remains ALWAYS in Spanish.
 * - Locked strings follow SPEC §19.
 */

import { esDictionary } from "@/shared/i18n/dictionaries/es.ts";
import { LOCKED_STRINGS } from "@/shared/i18n/lockedStrings.ts";
import type { TranslationDictionary } from "@/shared/i18n/types.ts";

export const enDictionary: TranslationDictionary = {
	common: {
		appName: "SocraticGuild",
		loading: "Loading...",
		error: "Error",
		retry: "Retry",
		cancel: "Cancel",
		confirm: "Confirm",
		close: "Close",
		ready: "Ready",
		back: "Back",
		pause: "Pause",
		seconds: "s",
		minutes: "min",
	},

	d1: {
		createSessionTitle: "New Session",
		languageLabel: "Session language",
		playersLabel: "Number of players",
		durationLabel: "Game duration",
		durationOption: "{m} minutes",
		createButton: "Create session",
		sessionCodeLabel: "Session code",
		joinPrompt: "Enter code to join the game",
		codePlaceholder: "XXXX",
		joinButton: "Join game",
		claimCardPrompt: "Tap a card to choose your character",
		playerSlot: "Player {n}",
		chooseAvatar: "Choose your avatar",
		namePrompt: "Your name (max 10 chars)",
		namePlaceholder: "Name",
		voiceNameHelp: "Hold to say your name or type it",
		confirmCard: "Ready",
		editCard: "Change",
		waitingOthers: "Waiting for everyone to confirm...",
		countdownStart: "The adventure starts in {s}...",
		soloNotAllowed: "At least 2 confirmed players are required to start",
		forceStart: "Iniciar con {n} listos", // Teacher action (Spanish)
	},

	// SPEC §11, §14: DocenteView remains ALWAYS in Spanish
	d2: esDictionary.d2,

	d3: {
		winTitle: LOCKED_STRINGS.WIN_TITLE,
		winSubtitle: "The team crossed the bridge and saved the community!",
		partialTitle: LOCKED_STRINGS.PARTIAL_TITLE,
		partialSubtitle: "Time ran out, but you showed great teamwork.",
		stepsCompleted: "Steps completed: {x}/3",
		starsEarned: "{n} stars earned",
		starsWithheld: "Stars withheld (mission in progress)",
		badgesTitle: "Team Badges",
		noBadges: "No badges earned in this run.",
	},

	badges: {
		paso_a_paso: {
			name: "Step by step",
			description:
				"Solved the crisis following each stage in order and with patience.",
		},
		cumplieron_su_promesa: {
			name: "Kept their promise",
			description:
				"Reached fair agreements and kept their word in the face of challenges.",
		},
		un_solo_equipo: {
			name: "One team",
			description:
				"Built on everyone's ideas and supported each other throughout.",
		},
		se_turnaron: {
			name: "Took turns",
			description: "Respected turns to speak and listened attentively.",
		},
		se_organizaron: {
			name: "Organized well",
			description: "Distributed roles and coordinated their actions clearly.",
		},
	},

	// SPEC §11, §14: DocenteView remains ALWAYS in Spanish
	d4: esDictionary.d4,

	// SPEC §11, §14: Docente comments remain ALWAYS in Spanish
	d5: esDictionary.d5,

	d6: {
		card: {
			holdToTalk: "Hold to talk",
			holdToDraw: "Hold to draw",
			npcSpeaking: LOCKED_STRINGS.NPC_LOCK,
			otherSpeaking: "{name} speaking",
			drawingActive: "{name} drawing",
			planningWalk: "plan together",
			retiredLabel: "retired",
			simultaneousShake: LOCKED_STRINGS.SIMULTANEOUS,
			drawCapShake: LOCKED_STRINGS.DRAW_CAP,
		},
		movement: {
			mapButton: "Map",
			mapTitle: "Community Map",
			mapPrompt: "Where do you want to travel as a party?",
			vetoHoldPrompt: "Hold to veto",
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
			npcListening: "{name} listening…",
		},
		checklist: {
			title: "Bridge Mission",
			step1: "1 Get wood (farm)",
			step2: "2 Approve design (workshop)",
			step3: "3 Get permit (town hall)",
			statusTodo: "Pending",
			statusActive: "In progress",
			statusDone: "Completed",
		},
		inventory: {
			wood: "Wood",
			blueprint: "Blueprint",
			seal: "Permit",
		},
		drawing: {
			title: "Collaborative Drawing Board",
			undo: "Undo",
			clear: "Clear",
			submit: "Ready",
			timeLeft: "Time remaining: {s}s",
			clearConfirmPrompt: "Do you want to clear the entire drawing?",
		},
		stations: {
			campamento: "Camp",
			chacra: "Farm",
			taller: "Workshop",
			alcaldia: "Town Hall",
			puente: "Bridge",
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
			"This screen is optimized for classroom projection. Zero teacher controls or hidden counters.",
		teacherPrivateOnly:
			"Teacher private surface. Keep on operator local screen, never project.",
	},
};
