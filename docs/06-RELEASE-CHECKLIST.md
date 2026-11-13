# Release checklist: Delivered ✓✓ v1

**Date:** 5 Oct 2026 · **Deployer:** Claude for Minh · **Format:** engineering plugin `deploy-checklist`
**Target:** one claude.ai Artifact (private by default), capabilities `db`, `user`, `sample`.

## Pre-release
- [x] Unit 58/58, e2e 21/21, axe 0 violations in both themes (see 04-TEST-REPORT.md)
- [x] Security and privacy review: no high or medium findings (05-SECURITY-PRIVACY.md)
- [x] impeccable detector run; only the typing dots were flagged, kept on purpose
- [x] No known critical bugs
- [x] Storage: worst-case state 125 KiB against a 256 KiB cap; no data migration (first release)
- [x] Content guardrails: no em or en dashes in displayed text; 🟨 items capped; rows 11 and 19 starred; overclaim detector on every answer
- [x] Salary numbers never leave the browser
- [x] Rollback plan written (below)

## Release
- [x] Build `delivered.html` with `python3 src/build.py` (syntax check per file)
- [x] Publish with the Artifact tool: https://claude.ai/artifact/NCrN4XWx6cvjDdYTbT8ACX (private, contract 0.2.67)
- [ ] Minh opens the link once on the laptop and once on the phone: Day 1 opens, first tap starts music, progress dot reads "Đã lưu"
- [ ] Read the db once after Minh's first session to confirm `data/users/<id>/progress` was written (ADR action item 4)

## Post-release
- [ ] Minh confirms the 🟨 rows in "Minh → Minh" (book Part 7.6) so those questions can reach S
- [ ] Watch for feedback after Day 1 and Day 7 (the first call)
- [ ] Update project memory with the link and the rerun command

## Rollback triggers
- Progress lost after a reload or between devices: republish the previous version (the URL keeps working; Minh's db data is untouched by a republish).
- A screen goes blank or shows "Có lỗi" more than once: the error boundary keeps the session, but republish the last good build and add a test for the case.
- Coach grades an overclaim above F: republish with the grading prompt fixed. The rule check already runs on every typed answer and caps it at F, so this would mean a pattern the detector misses; add it to the detector and its unit test.
- Any sign salary numbers reached a prompt: unpublish immediately.

## Release notes v1
- 14 day chats, 72 questions, 5 segments a day inside 60 minutes, 30 minute short days.
- Grading on SEND with message ticks, Coach Thư in Vietnamese, spoken answers in English.
- Truth checks that fail the message and name the truth row; the day 11 call drops on an overclaim.
- Group calls on days 7, 11, 13 and a final panel on day 14 with four endings.
- Floor 18 memory palace map, scorecard with three gates per row, proof quests P1 to P8.
- Sound effects for every tick and generative lo-fi music, quieter in calls; toggles in the top bar.
- Progress saved privately to Minh's account, with a browser copy as backup.

---

# Release checklist: Delivered ✓✓ v2 (5 Oct 2026)

## Pre-release
- [x] All suites green on the published build (see 04-TEST-REPORT.md, v2 section)
- [x] Security: still one escaped HTML sink (`Md`), no `eval` or `innerHTML`; videos are data URIs inside the page, nothing new is fetched; language and scene choices live in localStorage only (05-SECURITY-PRIVACY.md, v2 section)
- [x] Same URL and capabilities (`db`, `user`, `sample`); no change to the stored progress shape, so v1 progress carries over
- [x] Page size about 3 MB against the 16 MB cap
- [x] Content guardrails re-run on all 106 follow-up samples and the Shadow Panel samples

## Release
- [x] Rebuild with `python3 src/build.py`
- [x] Republish `delivered.html` to https://claude.ai/artifact/NCrN4XWx6cvjDdYTbT8ACX
- [ ] Minh opens it on the laptop and the phone: start screen, intro plays, globe button switches to Vietnamese and back

## Rollback triggers (v2)
- A scene blocks the game or loops: Settings, "Cinematic scenes" off works at once; then republish with scenes off by default.
- Language switch loses progress: republish v1 (the db data is untouched by a republish).

## Release notes v2
- English everywhere by default. A small globe button at the top right (and Settings) switches to Vietnamese and back.
- Every follow-up question now has a sample answer of about 80 to 100 words, in plain spoken English, fitted to Minh's real work. Unconfirmed facts stay in [brackets].
- Free practice can show the whole script for any question: opener, answer, why it works, and every follow-up with its sample answer.
- Rehearse any finished day again, or shuffle 8 learned questions.
- Cinematic layer made with Remotion: an opening scene over Saigon at night, a ringing scene before each group call, a final panel scene, a "Delivered" ending, chapter cards for each new day, and a light sweep or jolt on S and F grades. New sound design: risers, impacts, braams, whooshes, a heartbeat before the panel. A start screen lets the first tap turn sound on. Scenes can be skipped or switched off and respect reduced motion.
