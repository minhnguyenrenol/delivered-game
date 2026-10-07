# ADR-001: Single-page artifact with private per-user storage and synthesised audio

**Status:** Accepted · **Date:** 5 Oct 2026 · **Deciders:** Minh (owner), Claude (builder) · **Format:** engineering plugin `architecture` skill

## Context
The game must run as a claude.ai Artifact: one HTML page, scripts only from cdnjs, jsdelivr, unpkg, Tailwind or jQuery CDNs, fonts only from Google Fonts, no `alert/confirm/prompt`, no microphone, and no fetch to other hosts. Progress must survive 14 days and work on Minh's phone and laptop. The page needs an AI coach without exposing secrets. Minh asked for sound and music.

## Decision
1. **One page, no build step at runtime.** React 18.3.1 UMD (cdnjs) plus htm 3.1.1 (jsdelivr) for JSX-like templates. The book content (267 KB) is embedded as JSON. A small Python build script concatenates `data.js, engine.js, sound.js, ui1.js, ui2.js, ui3.js` after `node --check` on each.
2. **Storage:** the `db` capability, document `data/users/<uid>/progress` holding `{state, day, updatedAt}`, plus one document per question for typed answers. `data/users/<id>/` is private to that person, even from the artifact owner. Writes are debounced 1.2 s, one in flight at a time, flushed on tab hide. localStorage `delivered.v1` mirrors state and is the fallback when db is unavailable; on load the newer of the two wins.
3. **Coach:** the `sample` capability (`sample.json` for grading, `sample` with streaming for chat). On any failure it falls back to rule-based grading, so the game never blocks on the model.
4. **Audio:** Web Audio API synthesis for all effects and a generative music loop. No audio files.
5. **Salary data:** localStorage only (`delivered.salary`), never in db state, never in any prompt; the coach chat refuses to send a message that contains a stored salary number.

## Options considered
### Storage
| Option | Complexity | Cross-device | Privacy | Verdict |
|---|---|---|---|---|
| localStorage only | Low | No | Device only | Fallback only |
| `artifact` self-republish | Med | Yes | Visible to anyone with the link | Rejected: answers would be public in the page source |
| **db private user path** | Med | Yes | Private to Minh | **Chosen** |
### Coach
| Option | Notes | Verdict |
|---|---|---|
| Rule grading only | Works offline, shallow | Kept as fallback |
| **sample capability** | Viewer pays, needs consent, may be rate limited | **Chosen**, with fallback |
### Audio
| Option | Notes | Verdict |
|---|---|---|
| MP3/OGG files as data URIs | Adds 1-3 MB, fixed loops get repetitive | Rejected |
| Audio library from CDN (Tone.js) | 300+ KB, more than needed | Rejected |
| **Web Audio synthesis** | 0 KB assets, music never repeats exactly, mood can change in calls | **Chosen** |

## Trade-off analysis
- One state document is simple and atomic, but has a 256 KiB cap. Worst case is measured at about 125 KiB in the unit tests (72 cards x 12 attempts, 30 coach messages, 72 scripts), so there is 2x headroom. Typed answers live in separate documents for the same reason.
- Last-writer-wins by `updatedAt` between devices is acceptable for one person on one plan; two devices open at once could lose a few minutes of the older tab.
- Rule grading cannot judge narrative quality; it errs toward B, never S, and says so on the card ("chấm nhanh").

## Consequences
- Easier: one file to publish; no server; Minh's data is private by default.
- Harder: no shared progress with a mentor (would need a shared db path and consent).
- Revisit: if the runtime adds a microphone capability, add speech-to-text and pace measurement.

## Action items
1. [x] Build script with syntax check.
2. [x] Worst-case state size unit test.
3. [x] Fallback paths for db, sample and audio.
4. [ ] After publish, read the db once to confirm the private path is written.

## Amendment, v2 (5 Oct 2026)
- **Language:** `i18n.js` defines `LANG` and `L(en, vi)`. UI strings carry both languages inline. Book content keeps its Vietnamese source; `build.py` embeds an English overlay (`src/i18n/en-*.json`, path to text) that the engine applies at load in English mode. Switching saves the choice in localStorage and reloads, so every table is rebuilt once.
- **Follow-up samples:** `src/i18n/followups.json` adds `sample`, `note_en`, `note_vi` to each follow-up at build time; Shadow Panel samples live in `data.js`.
- **Scenes:** rendered offline with Remotion and embedded as data URIs, MP4 (H.264) first and WebM (VP9) second. Total about 1.6 MB, so no assets capability or network is needed. Rejected: the `assets` capability (works, but adds a writer-only upload step and makes the page organization-internal); `@remotion/player` at runtime (needs a bundler and React 19; the page runs React 18 UMD).
- Page size grows from 0.53 MB to about 3 MB, well inside the 16 MB limit.
