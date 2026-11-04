/**
 * i18n type definitions for SocraticGuild / TALENTIA.
 * SPEC.md §2, §11, §14, §19 & docs/gates/F0-contrato.md.
 */

import type { BadgeId } from "@/shared/scoring.ts";

export type Language = "ES" | "EN" | "QUZ";

export const SUPPORTED_LANGUAGES: readonly Language[] = [
	"ES",
	"EN",
	"QUZ",
] as const;

export interface BadgeTranslation {
	readonly name: string;
	readonly description: string;
}

export interface TranslationDictionary {
	readonly common: {
		readonly appName: string;
		readonly loading: string;
		readonly error: string;
		readonly retry: string;
		readonly cancel: string;
		readonly confirm: string;
		readonly close: string;
		readonly ready: string;
		readonly back: string;
		readonly pause: string;
		readonly seconds: string;
		readonly minutes: string;
	};

	readonly d1: {
		readonly createSessionTitle: string;
		readonly languageLabel: string;
		readonly playersLabel: string;
		readonly durationLabel: string;
		readonly durationOption: string;
		readonly createButton: string;
		readonly sessionCodeLabel: string;
		readonly joinPrompt: string;
		readonly codePlaceholder: string;
		readonly joinButton: string;
		readonly claimCardPrompt: string;
		readonly playerSlot: string;
		readonly chooseAvatar: string;
		readonly namePrompt: string;
		readonly namePlaceholder: string;
		readonly voiceNameHelp: string;
		readonly confirmCard: string;
		readonly editCard: string;
		readonly waitingOthers: string;
		readonly countdownStart: string;
		readonly soloNotAllowed: string;
		readonly forceStart: string;
	};

	readonly d2: {
		// Docente past sessions (SPEC §11, §14: ALWAYS in Spanish)
		readonly pastSessionsTitle: string;
		readonly colCode: string;
		readonly colDate: string;
		readonly colLanguage: string;
		readonly colPlayers: string;
		readonly colResult: string;
		readonly colActions: string;
		readonly viewDetail: string;
		readonly inconclusive: string;
		readonly playersCount: string;
		readonly emptyHistory: string;
		readonly sessionDetailTitle: string;
	};

	readonly d3: {
		// Equipo end screen (SPEC §11, §12: Localized in run language)
		readonly winTitle: string;
		readonly winSubtitle: string;
		readonly partialTitle: string;
		readonly partialSubtitle: string;
		readonly stepsCompleted: string;
		readonly starsEarned: string;
		readonly starsWithheld: string;
		readonly badgesTitle: string;
		readonly noBadges: string;
	};

	readonly badges: Record<BadgeId, BadgeTranslation>;

	readonly d4: {
		// Docente pedagogical view (SPEC §11, §14: ALWAYS in Spanish)
		readonly docenteBanner: string;
		readonly teacherFlag: string;
		readonly title: string;
		readonly subtitle: string;
		readonly groupTitle: string;
		readonly studentsTitle: string;
		readonly score0: string;
		readonly score1: string;
		readonly score2: string;
		readonly evidenceQuote: string;
		readonly voiceTurns: string;
		readonly drawingsCount: string;
		readonly anecdote: string;
		readonly paraphraseNote: string;
		readonly criteria: {
			readonly turnTaking: string;
			readonly turnTakingDesc: string;
			readonly colaboracion: string;
			readonly colaboracionDesc: string;
			readonly negociacion: string;
			readonly negociacionDesc: string;
			readonly resolucionEstructurada: string;
			readonly resolucionEstructuradaDesc: string;
			readonly organizacionLiderazgo: string;
			readonly organizacionLiderazgoDesc: string;
		};
		readonly studentDimensions: {
			readonly participacion: string;
			readonly participacion0: string;
			readonly participacion1: string;
			readonly participacion2: string;
			readonly propuesta: string;
			readonly propuesta0: string;
			readonly propuesta1: string;
			readonly propuesta2: string;
			readonly organizacion: string;
			readonly organizacion0: string;
			readonly organizacion1: string;
			readonly organizacion2: string;
		};
	};

	readonly d5: {
		// Docente comments & hard delete (SPEC §2, §11: ALWAYS in Spanish)
		readonly commentsTitle: string;
		readonly commentPlaceholder: string;
		readonly addCommentButton: string;
		readonly immutableNotice: string;
		readonly emptyComments: string;
		readonly authorTeacher: string;
		readonly hardDeleteTitle: string;
		readonly hardDeleteButton: string;
		readonly deleteConfirmTitle: string;
		readonly deleteConfirmMessage: string;
		readonly deleteConfirmButton: string;
		readonly deleteCancelButton: string;
	};

	readonly d6: {
		readonly card: {
			readonly holdToTalk: string;
			readonly holdToDraw: string;
			readonly npcSpeaking: string;
			readonly otherSpeaking: string;
			readonly drawingActive: string;
			readonly planningWalk: string;
			readonly retiredLabel: string;
			readonly simultaneousShake: string;
			readonly drawCapShake: string;
		};
		readonly movement: {
			readonly mapButton: string;
			readonly mapTitle: string;
			readonly mapPrompt: string;
			readonly vetoHoldPrompt: string;
			readonly bannerMove: string;
			readonly moveExecute: string;
			readonly midWalk: string;
		};
		readonly dialogue: {
			readonly unclear1: string;
			readonly overlap: string;
			readonly circleNudge: string;
			readonly circleReady: string;
			readonly farmerClarify: string;
			readonly npcListening: string;
		};
		readonly checklist: {
			readonly title: string;
			readonly step1: string;
			readonly step2: string;
			readonly step3: string;
			readonly statusTodo: string;
			readonly statusActive: string;
			readonly statusDone: string;
		};
		readonly inventory: {
			readonly wood: string;
			readonly blueprint: string;
			readonly seal: string;
		};
		readonly drawing: {
			readonly title: string;
			readonly undo: string;
			readonly clear: string;
			readonly submit: string;
			readonly timeLeft: string;
			readonly clearConfirmPrompt: string;
		};
		readonly stations: {
			readonly campamento: string;
			readonly chacra: string;
			readonly taller: string;
			readonly alcaldia: string;
			readonly puente: string;
		};
		readonly npcs: {
			readonly soto: string;
			readonly luz: string;
			readonly paco: string;
		};
		readonly console: {
			// Operator console (ALWAYS in Spanish)
			readonly title: string;
			readonly liveMirrorTitle: string;
			readonly transcriptFeedTitle: string;
			readonly eventFeedTitle: string;
			readonly timerGameLabel: string;
			readonly timerStallLabel: string;
			readonly timerWallLabel: string;
			readonly skipIntro: string;
			readonly forceGrant: string;
			readonly replayNpc: string;
			readonly endRunNow: string;
			readonly retryBlocked: string;
			readonly retirePlayer: string;
			readonly muteBgm: string;
			readonly unmuteBgm: string;
			readonly skipToCampamento: string;
			readonly skipToChacra: string;
			readonly skipToTaller: string;
			readonly skipToAlcaldia: string;
			readonly skipToPuente: string;
		};
	};

	readonly d7: {
		readonly playProjectionOnly: string;
		readonly teacherPrivateOnly: string;
	};
}
