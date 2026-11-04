# SocraticGuild — Demo Spec (locked)

Status: FINAL for demo. Supersedes all prior notes and `ARCHITECTURE.md` for demo scope.
Date: 2026-11-04. Repo state: nothing else final, everything else subject to change.

## 0. Confirmed intent

- Outcome: One playable bridge-crisis slice proving group voice+draw play surfaces soft skills paper tests miss.
- User: Jury/teachers watching a short live run; kids 3-6 playing in class on one shared device.
- Why now: Pitch on día 5. Must show teamwork/leadership/conflict-resolution + structured solving + trilingual path in one run.
- Success: Live 5-min cap run crosses bridge ~3-4 min, shows group stars/badges, teacher view shows quoted criteria + per-student signals, language clips play.
- Constraint: Día 5, one online multi-touch device + projector, single-session web build, no second device, no offline.
- Out of scope: 40-min content, multi-device kids, offline, CNEB mapping, pre/post tests, academic scoring, parent portal, moderation beyond add-only comments, Quechua correctness claims, pronunciation scoring.

Explicit yes received. This doc is the build contract.

## 1. Demo slice

- Crisis: bridge only. Broken bridge north-center must be rebuilt.
- Chain (linear, GM-enforced): `chacra (Farmer) → taller (Engineer) → alcaldía (Mayor) → puente (build+cross)`.
- Win: permiso granted at alcaldía, party travels to puente, 5s part-by-part assembly on arrival, group auto-walk across, NPCs cheer, freeze `¡Puente listo!` + confetti + judge call.
- Finish required for stars. No finish = partial `Misión en curso X/3`, badges-only, stars withheld.
- 3-6 players configurable. Pitch uses 3-4. Demo default duration 5:00 game-time.
- Vision line for pitch only: `end goal AI authors stories/worlds`. Not built.

## 2. Routes / sessions / join

- Two routes, two tabs, same backend session:
  - `/play`: kids only. Code entry → N cards → game → Equipo end. Zero teacher UI.
  - `/teacher`: operator only. New session → code → live view → console → Docente → past sessions.
- Session config on `/teacher`: language `ES|EN|QUZ`, expected players `3-6`, duration `5-40` min in 5-min steps. Demo default `5:00`.
- Join: teacher taps `nueva sesión` → 4-char code shown (no confusables `0/O/1/I/L`). `/play` setup enters code. Pitch pre-filled via `?s=XXXX`. Both attach via WebSocket to same session id. Code doubles as past-session key.
- Config locks at start. No mid-run language/player/duration change.
- Projection shares ONLY the `/play` tab/window (share-tab, never full-screen mirror). `/teacher` never enters shared surface. Privacy is a route boundary.
- No auth. No kid accounts. Codes only.
- Storage per session: config, transcripts, drawings + thumbs, vision reads, events, scores, comments. No raw audio retained.
- Past sessions on `/teacher`: list by code/date/lang/players/stars. Detail = Docente view + transcript/draws. Add comment anytime. `borrar sesión` hard-deletes with confirm. Parent deletion request = delete session.
- Data pitch line: runs in-class on one device, no kid accounts, audio/drawings processed to produce session readout then deletable on parent request, teacher note-only (comment, never edit/delete). Consent via school comunicado, opt-out always, all play in class.

## 3. Setup / start / drop

- `/play` after code-join shows N dealt cards (`?` + `Jugador X`, N = teacher count). No shared first-tap claim grid.
- Per card flow (kid-owned): tap card → 8-avatar picker (dupes allowed, live-taken shown but selectable) → name: one STT hold attempt, verbatim text written → freetype keyboard edit → `✓` confirms. 10-char max shown above cutout. Teacher never edits.
- Avatar roster fixed, identical all languages: `Zorro, Búho, Rana, Gato, Llama, Tucán, Ratón, Tortuga`. Paper-Mario cutouts. Kids color border, NPCs white border.
- All N `✓` → 5s auto-countdown shown on both routes → intro auto-plays. During countdown un-`✓` cancels own card only, never global start.
- Teacher force-start on `/teacher`: `iniciar con X listos` appears at ≥2 confirmed (under-count live) → tap → 3s countdown → unconfirmed cards removed, session N rewrites to X confirmed, intro plays. Minimum 2. Solo play forbidden.
- Joins only in claim phase. Zero joins once 5s countdown begins. Late kid watches only.
- Dropout only via `/teacher` `retirar` per avatar with inline confirm. Self-retire forbidden. Effect: avatar grays, holds disabled, party continues, history kept, judge sees `retirado mm:ss`. No rejoin same run. If drops to 1, run continues, judge notes it.

## 4. World / 3D / camera / art / audio

- Stack: web single-page, Three.js billboard diorama, laptop + shared mic/speaker. Min 10" 5-point multitouch, Chrome/Edge. Quiet room assumed.
- Single continuous scene, no loads. Stations: `campamento` spawn south-center, `chacra` west, `taller` east, `alcaldía` north-east, `puente roto` north-center. All visible from spawn. Hops 8-10s group auto-walk.
- Ground/river low-poly + instanced filler (trees/rocks/houses/fences/tents) + 5 station props. Broken halves swap to built bridge on arrival build.
- Party formation: loose cluster side-by-side ~1m, auto-face active NPC or walk direction. Camera 30° behind-above, auto-zoom fit bounding box party + active station, lerp follow, never splits. Intro spline pan. Win static + confetti.
- Speaker ring + name pulse on active holder. Active NPC highlight.
- Anims: idle bounce, walk hop, grant jump, refusal shake, win cheer, NPC bob. No lip-sync.
- Cutouts: 8 fixed animals, kids color border + name tag, NPCs white border.
- SFX: hold blip, send whoosh, grant chime, refusal thunk, steps loop, veto buzz, win fanfare. Soft BGM loop, mute on `/teacher` only. TTS cached per exact line.
- NPC placement fixed: Paco at chacra, Luz at taller, Soto at alcaldía. No NPC ever walks. Camp intro delivered as Soto voice-over while camera pans.

## 5. Talk input

- Per claimed card: `hold-to-talk` + `hold-to-draw`. Multi-touch required, each kid holds own card.
- Talk: pointerdown start, pointerup send, 20s max auto-cut, 2.5s client VAD silence auto-send. Ring + waveform, last 5s countdown. 20s/2.5s accommodates stutter/slow speech.
- Empty hold (<0.5s / silence-only) discarded, no turn logged, no NPC reaction.
- NPC lock (unified): no new talk or draw holds while any NPC TTS plays. Zero queue, must re-hold. Press shows `escucha…` + shake + `blocked_press` event. Judge-only, never a visible counter.
- Simultaneous: first-press wins, second gets `espera tu turno` shake + counted `blocked_press`.
- Every hold transcribed + logged with dual timestamps. GM routes:
  - Name-addressed or gate-intent → station NPC solo TTS reply (same station only).
  - Else nod-caption (`Paco escucha…`) no TTS, counts as planning for judge.
- Solo-reply-only. Never multi-NPC scenes or remote interjections.
- Walk: talk allowed as planning (judge credit), draw/move/NPC-talk locked, timer runs.
- Same-station-talk-only. Addressing remote NPC → `vayan a X para hablar con Y` + auto-ping X. Not a refusal.
- Repeat: holder says ES `repite/repítelo/puedes repetir`, EN `repeat/say again`, QUZ `huktawan niway/yapaykullay` → current NPC re-speaks last line verbatim + name prefix. `/teacher` replay button same, creates no new turn.
- Attribution: holder-claims-all. All audio in hold window attributed to holder, no speaker verification. Overlap hints in transcript (second name invoked, `él/ella dice`, two proposals one window, abrupt style break) → GM marks `suspected_overlap`, NPC asks `oí dos voces, ¿quién lo propone?`, turn yields group-only credit + turn-taking demerit evidence.

## 6. Draw / vision

- Exclusive fullscreen overlay, game paused except draw clock. One drawer at a time, holder only. No new draws during NPC TTS (unified lock).
- Tools: 5 fixed colors (`negro/rojo/azul/verde/amarillo`), one thick brush, undo×20, clear with inline confirm, `listo` submits, 30s auto-submit with timer ring. Empty submit = pass, no VLM call.
- Hidden cap 3 draws/station/run. 4th attempt: `aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!` shake, NOT counted as blocked. Never a counter, must not feel like resource.
- One VLM call per submit, JPEG ≤1024px. Prompt exactly (positive-only, no negative rules):
  - `Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each`
  - JSON out. NPC interprets extraction against current gate in-character. Kids never see `image received`; only in-character content reaction. Thumb stored in transcript.
- Engineer trace: chalk span outline + 2 landing pads rendered under strokes, composite sent, judged lands+span not art quality. Offered after first unclear E2 attempt. Generic draw serves all gates; VLM never assumes bridge/water.

## 7. Movement / map / voting

- Only two move paths: voice naming a station inside a hold, or zoom-map station tap. Checklist taps and 3D taps never move.
- Minimap bottom-left ~100px circle: 5 station dots + party dot, current ringed, L2 ping pulses target. Tap opens fullscreen zoom overlay (timer runs, talk open, draw locked): 5 large station buttons icon+label+status + party marker + X. Close on move execute / X / outside-tap. Tap station = move proposal through same veto flow.
- Banner: `¿Vamos a X? propuso [Nombre], mantén para vetar (5s)` + 5s ring. Veto = any non-proposer hold within 5s; its speech transcribed as objection (planning credit). Proposer re-hold does not self-veto.
- Then 20s discuss banner. Votes = holds naming a station (one/avatar, last wins). Majority of distinct holders wins. Tie → one 10s re-discuss → proposer wins. No votes → proposer wins. Guaranteed termination, no teacher rescue.
- Execute: `¡Vamos a X!`, map auto-closes, 8-10s group auto-walk. Mid-walk proposals ignored with `llegando a X…` hint (not blocked).
- Bottom checklist display-only. Exactly 3 steps, ES labels (EN/QUZ translated 1:1):
  - `1 Conseguir madera (chacra) → 2 Aprobar diseño (taller) → 3 Permiso (alcaldía)`
  - Plus shared inventory icons: madera log / plano scroll / sello. Fill as grants land. Group-shared single set, never per-kid.
- Correct-next marker (map pulse + ping) only after L2 fires. Never before; permanent marker would zero the sequencing probe.

## 8. NPCs / GM / tools

- Runtime 3+1: 3 NPC brains (Soto/Luz/Paco, each sees only own gate + personality + shared transcript/events + participation counts + remaining game-time + station) + 1 GM validator (code + LLM intent-check, sole writer of grants/moves/hints, serial queue). NPCs never write state, only request.
- Roster fixed names/titles across ES/EN/QUZ, distinct voices: Alcalde Soto (terco, grave), Ingeniera Luz (confundida-amable, aguda), Agricultor Paco (práctico, media).
- NPC tools request-only, GM-approved: `highlight_ui(draw/map/inventory)`, `show_trace_template(bridge span)`, `ping_station(next target)`, `request_grant(item/approval)`. GM denies out-of-order with exact-missing hint. Order unbreakable.
- Tone-only stubbornness. NPCs must request grant the instant criteria met, never invent extra conditions or second refusals for personality. All terco/confundido in wording only.
- Line budget ≤25 words/turn all languages, urgent/time-low ≤12 words. Prompt target + hard truncate 30w (urgent 15w).
- First arrival per station = 1 fixed script line per language. Revisits ≤8w nod.
- Participation injected each turn (`Ana 4, Luis 0`), instruction `invita brevemente al rezagado, sin penalizar`. Reticent coverage AI-driven only. No teacher probe. No penalty for pass/short.
- Time injected each turn (`quedan M:SS`), urgent tone <2:00.
- Patience: never time-out holder mid-turn. Unclear #1: `¿me lo repites o lo dibujas?` in-character. #2: auto draw offer + highlight draw. Out-of-order: exact missing item + ping after L2.
- Circle-nudge: GM detects 2+ full speak cycles zero progress → NPC pauses, `hablen entre ustedes 20s`, locks all input except one `listo, tenemos plan` hold.
- Repeat-escalation: 3rd identical failed proposal → restate missing + draw/trace offer. 4th → no-progress for stall timer.

## 9. Gates (GM-vetoed, at station only, in order)

- Acceptance: LLM intent-match on transcript/draw against criteria. No keyword matching. GM vetoes out-of-order.
- Farmer at chacra: F1 explicit aid offer naming what + who helps. F2 Paco restates → kids confirm. Vague `danos madera` → one clarifying `¿quién ayuda y en qué?` then GM draw-prompt.
- Engineer at taller: E1 madera held. E2 span/landing proposal by voice or draw naming where both ends land. E3 Luz restates medidas → kids confirm. Trace template offered after first unclear.
- Mayor at alcaldía: M1 madera + diseño held. M2 recall farmer deal who+what. M3 named builder/crew. Soto out-of-order refusals always name exact missing item.
- Remote grant impossible. Forced grant via console only next-in-order, never skips two.

## 10. Time / stall / win / expiry / intro

- Game-time 5-40 min slider, demo 5:00. Timer top-left mm:ss, `pausa` flash during system, red last 60s. Pauses during NPC TTS + draw windows. Only kid-side thinking/talking consumes. Wall unbounded, no wall cap.
- Progress resets stall: grant, move execute, new gate-relevant proposal/draw. Planning, repeats, blocked presses do not.
- Tiers (5m fixed): L1 45s in-character nudge, L2 90s GM ping_station + highlight correct next + map dot, L3 150s explicit `vayan a X y digan Y`. Longer runs scale proportionally. If remaining <90s compress to 15/30/60s.
- `/teacher` shows stall countdown + wall debug line.
- Intro ≤30s: Soto VO `el río nos partió el puente…` + camera pan chacra→taller→alcaldía→puente + checklist reveal. Skippable via `/teacher` only.
- After permiso at alcaldía must travel to puente. Arrival auto-build 5s part-by-part → auto-cross + cheers + freeze `¡Puente listo!` + confetti → judge call.
- Expiry / teacher end-run: freeze mid-scene, judge partial, Equipo shows `Misión en curso X/3` badges-only, stars withheld.

## 11. Scoring / judge / evidence

- One blocking LLM call at cross/expiry/end over: diarized-by-holder transcript (dual ts) + draw thumbs + vision reads + full event log + config/forced flags.
- Pure judgment. Event counts (blocked, overlaps, hint levels) evidence-only, judge may weigh or ignore. No formulaic auto-fail.
- Output Spanish always. Quotes Spanish paraphrase, never verbatim non-Spanish, so Docente stays Spanish.
- Group 5×0-2 (0=ausente, 1=emergente, 2=consistente) + one evidence quote each:
  - turn-taking: esperan su turno / pocas interrupciones / ceden la palabra
  - colaboración: hablan encima / reparten turnos / construyen sobre lo dicho
  - negociación: exigen / ofrecen algo / acuerdan con compromiso recordado
  - resolución estructurada: saltan pasos / reintentan tras pista / planean chacra→taller→alcaldía
  - organización/liderazgo: nadie coordina / alguien propone orden / rol de coordinación rotado o aceptado
- Per-student 3×0-2 + one-line anecdote + turn/draw counts:
  - participación: silencio / 1-2 aportes / interviene sostenidamente
  - propuesta: repite / aporta idea o dibujo / idea retomada por el grupo
  - organización: nunca ordena / pide turno u orden una vez / coordina o reparte roles
- Stars computed sum 0-10 → 0-4=1★, 5-7=2★, 8-10=3★. Finish required. Never LLM-picked.
- Badges 1:1 at 2/2, show max 3 earned. Priority if >3: Paso a paso > Cumplieron su promesa > Un solo equipo > Se turnaron > Se organizaron.
  - Se turnaron ↔ turn-taking 2/2
  - Un solo equipo ↔ colaboración 2/2
  - Cumplieron su promesa ↔ negociación 2/2
  - Paso a paso ↔ estructurada 2/2
  - Se organizaron ↔ organización 2/2
- Forced grant/skip: logged `grant_step(forced=true)` / `time_skip`, estructurada capped at 1, `con apoyo docente` on Docente only, public shows judged stars.
- Equipo (`/play`): bridge art, stars pop, ≤3 badges with 1-line run-language behavior quote, steps X/3, zero names/numbers/rankings.
- Docente (`/teacher`): same stars + full 5 criteria 0-2 with quotes + per-student cards (avatar+name+3×0-2+anecdote+counts) + `señales preliminares, no notas` banner + session comment thread add-only (text+ts, no edit/delete). Judge observations immutable: teacher disagreement recorded only as comment, original score/quote never edited or deleted.

## 12. UI `/play` exact

- 3D scene ~70% center. Right rail claimed avatar cards: avatar+name+talk hold+draw hold+status ring (idle gray, recording red pulse, locked dim, other-speaking `X habla`, drawing `X dibuja`, NPC lock `escucha`, walk `planeen`). Bottom bar: checklist todo/active/done current pulse + shared log/plano/sello + language badge. Top-left timer. Bottom-left minimap. Bottom captions 2 lines (color dot+name, kids colored, NPC white, 6s expire).
- Always-on captions: every NPC line + every kid turn transcript after STT. TTS fail still shows caption text.
- Blocked/overlap counts never visible. Only momentary shake text.
- All touch + click. No teacher UI on `/play`.

## 13. UI `/teacher` exact

- New session form + code display + past list + live session + Docente.
- Live (read-only full mirror): same 3D scene + checklist+inventory, captions, transcript feed last 20, event feed, timer+stall countdown + wall debug, card status (claimed/confirmed/speaking/drawing/retired). 3D view-only, no input.
- Console (silent by route isolation): skip-to-station×4 (fade teleport, logged `time_skip`, grants nothing), force-grant next-in-order only, replay last NPC line, end-run-now, skip-intro, `retirar` per avatar, `reintentar` when blocked.
- Docente: §11 content + comment box + past-session review.
- Mute BGM here only.

## 14. Languages

- Per-run monolingual selector at creation: ES / EN / QUZ. Switches UI strings 1:1, STT lang, LLM prompts, NPC voices. Fixed across runs: NPC names, avatar species, Docente Spanish.
- QUZ = Southern Quechua. Zero dialect-correctness claim. Zero language/pronunciation scoring. Input tolerant (jerga, stutter, brief code-switch accepted) in all runs.
- QUZ pipeline same shape as ES/EN: MMS-STT → LLM (Spanish-internal reasoning allowed) → MMS-TTS in Quechua, free generation, no fixed lines. No QUZ-specific fallback; accepted non-primary risk.
- Proof: 1 live run in one selector language + 2×30s pre-recorded clips showing other languages reaching farmer gate, same build, separate deck videos, not in-app. No mixed-language run claimed.

## 15. Providers / config

- All endpoints configurable OpenAI-compat. STT/TTS pluggable incl. MMS-for-QUZ. Exact models deferred to later research.
- MMS self-hosted on GPU box reachable over LAN from pitch laptop. Not on-device, not public-cloud-dependent.
- Single LLM class for NPC brains + GM intent-check + judge (role prompts differ). One VLM endpoint for draws.

## 16. Reliability

- 3× auto-retry with backoff on STT/LLM/TTS/VLM/judge. `/play` friendly `reintentando…`, `/teacher` spinner + `reintentar`. If all retries fail run visibly blocks with teacher `reintentar`. Never silent degraded scores. No event-only fallback.
- GM serial queue. Timestamps dual everywhere for audit.

## 17. Events / data

- Closed append-only log, every row: `game_ts_ms` + `wall_ts_ms` + actor/icon id + payload. Types only:
  - `press, blocked_press, speech_start, speech_end, transcript, suspected_overlap, draw_start, draw_submit, vision_read, move_propose, move_veto, move_execute, refusal, hint_level, grant_step, npc_line, time_skip, judge_scores`
- `grant_step` includes forced flag. `hint_level` includes L1/L2/L3. `transcript` includes holder + text + send reason (release/silence/autocut).
- No raw audio. Draws + thumbs + vision JSON retained. Hard delete removes all.

## 18. Pitch run-of-show (6-min arc)

- 30s problema → 30s setup (language + avatars) → 5:00 cap play (cross expected ~3-4) → 30s Equipo → 30s Docente peek → 30s language clips + close.
- Clips last so clip failure cannot kill main story. Projection `/play` only; operator turns laptop for Docente peek.
- Rehearsal cast out of scope for this spec.

## 19. Exact locked strings

- Banner move: `¿Vamos a X? propuso [Nombre], mantén para vetar (5s)`
- Execute: `¡Vamos a X!`
- Mid-walk: `llegando a X…`
- NPC lock: `escucha…`
- Simultaneous: `espera tu turno`
- Draw cap: `aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!`
- Unclear #1: `¿me lo repites o lo dibujas?`
- Overlap: `oí dos voces, ¿quién lo propone?`
- Circle: `hablen entre ustedes 20s` + `listo, tenemos plan`
- Remote: `vayan a X para hablar con Y`
- L3: `vayan a X y digan Y`
- Farmer clarify: `¿quién ayuda y en qué?`
- Win: `¡Puente listo!`
- Partial: `Misión en curso X/3`
- Teacher flag: `con apoyo docente`
- Docente banner: `señales preliminares, no notas`
- Vision prompt: `Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each`
- Repeat ES: `repite/repítelo/puedes repetir`. EN: `repeat/say again`. QUZ: `huktawan niway/yapaykullay`.
