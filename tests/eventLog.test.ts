import { describe, expect, it } from "bun:test";
import { InMemoryEventLog } from "@/core/storage/eventLog.ts";
import {
	CLOSED_EVENT_TYPES,
	type EventType,
	type GrantStepPayload,
	type HintLevelPayload,
	type JudgeScoresPayload,
	type PressPayload,
	type TranscriptPayload,
} from "@/shared/documents.ts";

describe("IEventLogPort & InMemoryEventLog Contract Tests (SPEC §17)", () => {
	it("CLOSED_EVENT_TYPES contains exactly 18 official event types", () => {
		expect(CLOSED_EVENT_TYPES.length).toBe(18);
		expect(CLOSED_EVENT_TYPES).toEqual([
			"press",
			"blocked_press",
			"speech_start",
			"speech_end",
			"transcript",
			"suspected_overlap",
			"draw_start",
			"draw_submit",
			"vision_read",
			"move_propose",
			"move_veto",
			"move_execute",
			"refusal",
			"hint_level",
			"grant_step",
			"npc_line",
			"time_skip",
			"judge_scores",
		]);
	});

	it("appends and queries all 18 event types with strict payloads and dual timestamps", async () => {
		const log = new InMemoryEventLog();
		const sessionId = "session-101";

		// 1. press
		await log.append({
			sessionId,
			type: "press",
			game_ts_ms: 1000,
			wall_ts_ms: 1730700001000,
			actorId: "player-1",
			payload: {
				targetType: "talk",
				buttonId: "talk-btn",
			} satisfies PressPayload,
		});

		// 2. blocked_press
		await log.append({
			sessionId,
			type: "blocked_press",
			game_ts_ms: 1200,
			wall_ts_ms: 1730700001200,
			actorId: "player-2",
			payload: { reason: "other_speaking", currentActiveSpeakerId: "player-1" },
		});

		// 3. speech_start
		await log.append({
			sessionId,
			type: "speech_start",
			game_ts_ms: 1500,
			wall_ts_ms: 1730700001500,
			actorId: "player-1",
			payload: { audioSessionId: "audio-turn-1" },
		});

		// 4. speech_end
		await log.append({
			sessionId,
			type: "speech_end",
			game_ts_ms: 3500,
			wall_ts_ms: 1730700003500,
			actorId: "player-1",
			payload: { durationMs: 2000, sendReason: "release" },
		});

		// 5. transcript
		await log.append({
			sessionId,
			type: "transcript",
			game_ts_ms: 3700,
			wall_ts_ms: 1730700003700,
			actorId: "player-1",
			payload: {
				transcriptId: "tx-1",
				text: "Hola Don Paco venimos por madera",
				sendReason: "release",
			} satisfies TranscriptPayload,
		});

		// 6. suspected_overlap
		await log.append({
			sessionId,
			type: "suspected_overlap",
			game_ts_ms: 4000,
			wall_ts_ms: 1730700004000,
			actorId: "player-2",
			payload: {
				detectedClues: ["dual_pitch", "interruption"],
				rawTranscriptSnippet: "yo también quiero",
			},
		});

		// 7. draw_start
		await log.append({
			sessionId,
			type: "draw_start",
			game_ts_ms: 5000,
			wall_ts_ms: 1730700005000,
			actorId: "player-3",
			payload: { stationId: "taller" },
		});

		// 8. draw_submit
		await log.append({
			sessionId,
			type: "draw_submit",
			game_ts_ms: 12000,
			wall_ts_ms: 1730700012000,
			actorId: "player-3",
			payload: {
				drawSubmissionId: "draw-sub-1",
				strokeCount: 14,
				wasEmpty: false,
			},
		});

		// 9. vision_read
		await log.append({
			sessionId,
			type: "vision_read",
			game_ts_ms: 14000,
			wall_ts_ms: 1730700014000,
			actorId: "system",
			payload: {
				drawSubmissionId: "draw-sub-1",
				visionRead: {
					objects: ["bridge", "plank"],
					actions: ["cross", "support"],
					measures: ["long"],
					routes: ["horizontal"],
					labelsOrMarks: ["A", "B"],
					confidence: { bridge: 0.95 },
					rawResponse: "Bridge structure with support beams",
				},
			},
		});

		// 10. move_propose
		await log.append({
			sessionId,
			type: "move_propose",
			game_ts_ms: 16000,
			wall_ts_ms: 1730700016000,
			actorId: "player-1",
			payload: {
				fromStation: "chacra",
				toStation: "taller",
				proposerPlayerId: "player-1",
				proposalMethod: "voice",
			},
		});

		// 11. move_veto
		await log.append({
			sessionId,
			type: "move_veto",
			game_ts_ms: 18000,
			wall_ts_ms: 1730700018000,
			actorId: "player-2",
			payload: {
				vetoerPlayerId: "player-2",
				targetStation: "taller",
				vetoSpeechTranscript: "No, todavía falta hablar con Paco",
			},
		});

		// 12. move_execute
		await log.append({
			sessionId,
			type: "move_execute",
			game_ts_ms: 22000,
			wall_ts_ms: 1730700022000,
			actorId: "system",
			payload: {
				destinationStation: "taller",
				walkDurationMs: 8000,
			},
		});

		// 13. refusal
		await log.append({
			sessionId,
			type: "refusal",
			game_ts_ms: 25000,
			wall_ts_ms: 1730700025000,
			actorId: "paco",
			payload: {
				npcId: "paco",
				stationId: "chacra",
				missingRequirement: "ayuda_cosecha",
				isOutOfOrder: false,
			},
		});

		// 14. hint_level
		await log.append({
			sessionId,
			type: "hint_level",
			game_ts_ms: 30000,
			wall_ts_ms: 1730700030000,
			actorId: "paco",
			payload: {
				tier: "L1",
				npcId: "paco",
				stationId: "chacra",
				messageText: "¿quién ayuda y en qué?",
			} satisfies HintLevelPayload,
		});

		// 15. grant_step
		await log.append({
			sessionId,
			type: "grant_step",
			game_ts_ms: 35000,
			wall_ts_ms: 1730700035000,
			actorId: "paco",
			payload: {
				stepId: "conseguir_madera",
				grantedItem: "madera",
				forced: false,
			} satisfies GrantStepPayload,
		});

		// 16. npc_line
		await log.append({
			sessionId,
			type: "npc_line",
			game_ts_ms: 36000,
			wall_ts_ms: 1730700036000,
			actorId: "paco",
			payload: {
				npcId: "paco",
				stationId: "chacra",
				text: "¡Aquí tienen la madera amigos!",
				audioDurationMs: 2500,
			},
		});

		// 17. time_skip
		await log.append({
			sessionId,
			type: "time_skip",
			game_ts_ms: 40000,
			wall_ts_ms: 1730700040000,
			actorId: "teacher",
			payload: {
				fromStation: "chacra",
				toStation: "taller",
				triggeredBy: "teacher_console",
			},
		});

		// 18. judge_scores
		await log.append({
			sessionId,
			type: "judge_scores",
			game_ts_ms: 120000,
			wall_ts_ms: 1730700120000,
			actorId: "judge",
			payload: {
				judgeScoresId: "judge-eval-1",
				sumPoints: 9,
				stars: 3,
				conApoyoDocente: false,
			} satisfies JudgeScoresPayload,
		});

		const events = await log.getBySession(sessionId);
		expect(events.length).toBe(18);

		// Verify every entry has a generated UUID and dual timestamps
		for (const event of events) {
			expect(typeof event.id).toBe("string");
			expect(event.id.length).toBeGreaterThan(0);
			expect(event.sessionId).toBe(sessionId);
			expect(typeof event.game_ts_ms).toBe("number");
			expect(typeof event.wall_ts_ms).toBe("number");
			expect(event.game_ts_ms).toBeGreaterThanOrEqual(1000);
			expect(event.wall_ts_ms).toBeGreaterThanOrEqual(1730700000000);
		}

		// Verify chronological insertion order
		for (let i = 1; i < events.length; i++) {
			const prev = events[i - 1];
			const curr = events[i];
			if (prev && curr) {
				expect(curr.game_ts_ms).toBeGreaterThanOrEqual(prev.game_ts_ms);
				expect(curr.wall_ts_ms).toBeGreaterThanOrEqual(prev.wall_ts_ms);
			}
		}
	});

	it("rejects unknown event types at runtime", async () => {
		const log = new InMemoryEventLog();
		const invalidEntry = {
			sessionId: "s1",
			type: "hacked_event" as unknown as EventType,
			game_ts_ms: 100,
			wall_ts_ms: 1000,
			actorId: "actor",
			payload: { targetType: "talk", buttonId: "b" } as unknown as PressPayload,
		};

		expect(log.append(invalidEntry)).rejects.toThrow(
			'Invalid or disallowed event type: "hacked_event"',
		);
	});

	it("rejects invalid or missing timestamps", async () => {
		const log = new InMemoryEventLog();

		// Negative game_ts_ms
		expect(
			log.append({
				sessionId: "s1",
				type: "press",
				game_ts_ms: -5,
				wall_ts_ms: 1000,
				actorId: "actor",
				payload: { targetType: "talk", buttonId: "b" },
			}),
		).rejects.toThrow("Invalid game_ts_ms");

		// Non-positive wall_ts_ms
		expect(
			log.append({
				sessionId: "s1",
				type: "press",
				game_ts_ms: 100,
				wall_ts_ms: 0,
				actorId: "actor",
				payload: { targetType: "talk", buttonId: "b" },
			}),
		).rejects.toThrow("Invalid wall_ts_ms");
	});

	it("isolates sessions and supports deleteBySession", async () => {
		const log = new InMemoryEventLog();
		const sessionA = "session-AAA";
		const sessionB = "session-BBB";

		await log.append({
			sessionId: sessionA,
			type: "press",
			game_ts_ms: 10,
			wall_ts_ms: 100,
			actorId: "player-1",
			payload: { targetType: "talk", buttonId: "b1" },
		});
		await log.append({
			sessionId: sessionA,
			type: "draw_start",
			game_ts_ms: 20,
			wall_ts_ms: 110,
			actorId: "player-1",
			payload: { stationId: "chacra" },
		});
		await log.append({
			sessionId: sessionB,
			type: "press",
			game_ts_ms: 15,
			wall_ts_ms: 105,
			actorId: "player-2",
			payload: { targetType: "map", buttonId: "b2" },
		});

		expect(log.count()).toBe(3);
		expect((await log.getBySession(sessionA)).length).toBe(2);
		expect((await log.getBySession(sessionB)).length).toBe(1);

		// Delete sessionA
		await log.deleteBySession(sessionA);

		expect((await log.getBySession(sessionA)).length).toBe(0);
		expect((await log.getBySession(sessionB)).length).toBe(1);
		expect(log.count()).toBe(1);
	});

	it("guarantees immutability of returned entries", async () => {
		const log = new InMemoryEventLog();
		const sessionId = "session-immut";

		await log.append({
			sessionId,
			type: "press",
			game_ts_ms: 10,
			wall_ts_ms: 100,
			actorId: "player-1",
			payload: { targetType: "talk", buttonId: "b1" },
		});

		const events = await log.getBySession(sessionId);
		expect(events.length).toBe(1);

		// Mutate returned array
		// @ts-expect-error test mutation defense
		events[0].actorId = "mutated-hacker";
		// @ts-expect-error test mutation defense
		events.push({ id: "fake" });

		const freshEvents = await log.getBySession(sessionId);
		expect(freshEvents.length).toBe(1);
		const first = freshEvents[0];
		if (first) {
			expect(first.actorId).toBe("player-1");
		}
	});
});
