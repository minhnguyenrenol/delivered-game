# PRD: Delivered ✓✓, a 14-day interview game for Minh

**Owner:** Minh Nguyen · **Status:** v1 shipped 5 Oct 2026 · **Format:** product spec (engineering plugin `write-spec` structure)

## Problem statement
Minh has an Interview Script Book (72 questions, about 64k words), a CV and a 14-day plan for the Qualgo Lead Product Designer interview, but reading a book does not produce spoken, 90-second, truthful answers under pressure. The two reference games ("Sài Gòn Express", "The Long Game") make study feel like play, but they are generic: they do not know Minh's real record, cannot tell when Minh overclaims, and do not rehearse a panel. Without practice that is spoken, timed, spaced and honest, the most likely failure is an overclaim (14 years in banking, a team of 60, a shipped chat app) that a recruiter can disprove in a minute.

## Goals
1. Every one of the 72 questions is learned on its scheduled day and reviewed with spaced repetition, inside 60 minutes a day.
2. Minh can say every opener from memory in 5 seconds by day 14 (measured by the opener flash and the 72-object palace walk).
3. Zero overclaims in the four group calls (measured by the truth checks that grade F and drop the day 11 call).
4. All 21 scorecard rows reach 5 through three real gates, not through self-reported confidence.
5. Minh wants to come back every day (streak, trust meters, stickers, music, day teaser).

## Non-goals
- Speech recognition. The artifact runtime has no microphone capability, so "speak" mode is a stopwatch plus an honest SEND self-check, and "type" mode is graded by the coach.
- Content authoring. The game never invents interview content; everything comes from the book, the plan and the CV.
- A real chat product. The messenger is a frame for practice, not a claim of chat experience.
- Multi-user. Progress is private to Minh; no leaderboard, no sharing.
- Native app. It is a web artifact that works at phone width.

## User stories
- As Minh with one hour after work, I open today's chat and the game tells me exactly what to do next, segment by segment, so I never plan my own study.
- As Minh on a tired day, I choose a 30-minute short day (except whiteboard and call days), so the streak survives.
- As Minh answering out loud, I time myself and tick SEND honestly, so speaking practice counts even without a microphone.
- As Minh typing an answer, Coach Thư grades it on SEND with a strength, one fix and a stronger line, so the next try is better.
- As Minh, if I say something untrue the message fails to send and names the truth-table row, so I learn the honest version.
- As Minh, I confirm unverified details (🟨) in "Minh → Minh", so the game stops capping those questions.
- As Minh before the real interview, I see which scorecard rows are not yet at 5 and the single next step for each.
- Edge cases: missing a day uses a streak freeze; reload mid-segment resumes; no coach permission falls back to rule grading; empty review queue skips straight to the drill.

## Requirements
### P0 (must have)
| # | Requirement | Acceptance |
|---|---|---|
| P0-1 | 14 day threads with 5 segments (warm, learn, voice, review, night), calls on days 7, 11, 13, 14 | Day 1 playable start to close in the e2e test |
| P0-2 | Question loop: ask, study, 5-second recall with hint ladder, answer (speak or type), grade, retry, follow-up | Every phase reachable; hints cap grades at A and B |
| P0-3 | SEND grading S/A/B/C/F with tick metaphor | Unit tests on grade bands and caps |
| P0-4 | Truth gating: overclaim patterns, ledger claims, 🟨 cap | 9 overclaims flagged, 10 honest lines clean |
| P0-5 | Spaced repetition, 5 boxes | Unit test moveBox; review queue from schedule plus due cards |
| P0-6 | Progress saved across days and devices | Private db document per user, localStorage mirror |
| P0-7 | Bedtime lock until 5 a.m., streak with freezes | Unit tests on unlock and streak |
| P0-8 | Scorecard with three gates per row, rows 11 and 19 never imply shipped chat | Gate unit test; star note rendered |
| P0-9 | Works at 400 px, light and dark, reduced motion | No horizontal scroll; screenshots in both themes |
### P1 (should have)
| # | Requirement | Acceptance |
|---|---|---|
| P1-1 | Drills: honesty lines, Number Lock I/II, Scam Detector, Write-a-Warning, 3 whiteboards, Critique Duel, Story Forge, rapid-fire, Salary Card | Each reachable on its day |
| P1-2 | Floor 18 map that turns gold per room | Renders 10 rooms, 72 objects |
| P1-3 | Coach chat, free practice, mock panel per scorecard row, Shadow Panel from day 8 | Tabs render; mock answers count as panel |
| P1-4 | Sound effects per tick, generative music, calmer music in calls, toggles | Sound off by toggle, nothing plays before first tap |
| P1-5 | Files: proof quests P1-P8, scripts, warnings, report, debrief, settings | Proof quest done requires link plus criteria |
### P2 (later)
- Voice input if the runtime adds a microphone capability.
- Export of My Scripts as a document.
- A second 14-day "maintenance" season after Interview Week.

## Success metrics
- Leading: days closed in a row; openers recalled in the flash (target 5/5 by day 3 of each card); typed-answer grade trend per card.
- Lagging: scorecard rows at 5 (milestones 3 by day 9, 8 by day 11, 14 by day 13, 21 by day 14); calls with zero overclaims; the real interview debrief.

## Open questions (Minh)
- The 🟨 items in book Part 7.6: what the 67% friction measures, whether +20% is relative, the June 2023 to Feb 2024 gap, whether freelance work is declared to NAB, real stories for Q13 and Q39. The game blocks these until Minh confirms them in "Minh → Minh".

---

## v2 changes (5 Oct 2026, from Minh's feedback on v1)
| # | Requirement | Acceptance |
|---|---|---|
| V2-1 | English by default, Vietnamese on request, for every instruction, tip, coach reply and book explanation. Spoken answers stay English in both. | Language button in the top bar and a Settings row; switch reloads in the other language; English screens show no Vietnamese sentences (names, places and memory acronyms excepted) |
| V2-2 | A full spoken sample answer for every follow-up question (106 book follow-ups, 10 Shadow Panel pressure questions, 1 call follow-up): about 80 to 100 words, plain, practical, built from Minh's own record | Unit tests: word counts, no AI-writing vocabulary or frames (Wikipedia "Signs of AI writing"), no dashes, no overclaims, no 14-years/60-people/shipped-app/shipped-chat claims |
| V2-3 | Rehearse anything already learned | "Rehearse Day N again" on every closed day; "Shuffle 8 learned questions" and any question in Free practice |
| V2-4 | Full script view in Free practice: opener, sample answer, why it works, every follow-up with its sample answer, key line and note | e2e: every follow-up of the picked card shows a sample |
| V2-5 | Cinematic scenes and sound: intro, group-call join, final-panel doors, the ending; chapter cards when a new day opens; light sweep on S and a jolt on F | Scenes made in Remotion, embedded (MP4 + WebM), skippable (button, tap, Esc), off under reduced motion or in Settings |

Unconfirmed facts inside the new samples are written as [square-bracket placeholders] for Minh to fill, never invented.
