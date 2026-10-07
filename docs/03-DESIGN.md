# DESIGN: calm messenger on floor 18

**Method:** impeccable (Operate mode, craft floor) + taste-skill dials · **Date:** 5 Oct 2026

## Design read
A private, daily-use practice tool for one senior designer, used for an hour after work, often at night, on a phone or laptop. Mode: **Operate** (the visitor completes a task). Taste-skill dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 4, VISUAL_DENSITY 6.

## World
The interview is a secure messenger, because Qualgo builds one. Every question is a message; every answer is a message Minh sends; the tick tells Minh what the interviewer actually received. The building is mPlaza, 39 Lê Duẩn, floor 18, the memory palace the book already uses. The world lends type, palette, density and one signature move. Navigation and controls stay standard (chat list, tabs, buttons, inputs).

## Signature move
**Ticks.** ! (failed to send) · ✓ sent (C) · ✓✓ grey delivered (B) · ✓✓ blue read (A) · ✓✓ blue plus "is typing…" (S). Ticks draw themselves stroke by stroke and turn blue; each has its own sound. The map is the second register of the same idea: a room turns gold when every question in it is pinned.

## Tokens
- Type: Be Vietnam Pro (body, full Vietnamese diacritics), Unbounded (display, used only for the brand, day number and grade badges), JetBrains Mono (timers, counts, ids only, never as costume).
- Light: ground #EAEEF3, surface #FFF, ink #111827, accent tick #2F6BFF, gold #B5861F, warn #C0352B, jade #1F7A57, amber #A86500.
- Dark: ground #0D1117, surface #161C26, ink #E8EDF5, tick #7AA2FF, gold #E2B64E.
- Calls are always night (#0E1626) whatever the theme, because a call is a different room.
- One accent (tick blue). Gold only for mastery. Warn only for truth failures. Neutrals biased slightly blue toward the accent.
- Radii: 14 px cards, 18 px bubbles with a 6 px tail corner, full pill only for small controls.
- Shadows: soft, offset, tinted toward the navy ink; no zero-offset glows.

## Rules applied from the skills
- No eyebrow labels above headings; section labels are sentence case, small, semibold.
- No em or en dashes in displayed text (content is normalised at load; a unit test enforces it).
- Icons are authored SVG in one 1.7 px stroke family. Emoji appear only as content: persona faces and the 72 memory-palace stickers from the book's "Hình dung" images.
- Browser surfaces themed: selection, caret, focus ring, scrollbars, tabular numerals.
- Loading uses a skeleton shimmer, not a spinner.
- Buttons press to 0.98 scale; every control has hover, disabled and focus states.

## Motion thesis
- Focal moment: the tick draw and turn-blue after each graded answer.
- Continuity: bubbles rise 6 px as they arrive; banners drop in for rapid-fire.
- Feedback: 100-150 ms on taps; 300-400 ms for cards; nothing over 900 ms except the tick sequence.
- Reduced motion: all movement collapses to instant; colour and state changes remain.

## Sound thesis
- Effects map to meaning, not decoration: send whoosh; one click for ✓, two for ✓✓, a soft chime for blue, a rising arpeggio for S, a low thud for a failed send, a ring and three-note join for calls, a falling tone when a call drops, a lullaby chord when the day closes.
- Music is generative lo-fi (pads plus a sparse pentatonic pluck at 70 bpm in F, E, D, C major sevenths). In calls it shifts to a slower, lower minor progression at lower volume, so it never competes with speaking out loud.
- Nothing plays before the first tap. Effects and music each have a toggle in the top bar and a volume slider in Settings. Audio pauses when the tab is hidden.

## Layout
Desktop: chat list 320 px | thread | today panel 340 px (from 1180 px). Tablet: list | thread. Phone: one pane with bottom tabs Chats · Tầng 18 · Scorecard · Files and a back button in threads.

## v2: cinematic layer
- **Scenes (Remotion 4.0.533, `cine/`):** four text-free 1280x720 scenes so titles can follow the language switch: *Intro* (Saigon at night, the elevator light climbs mPlaza to floor 18, a message gets ✓✓ blue), *Call* (rings pulse, five seats orbit, an anamorphic flare), *Final* (floor counter 15 to 18, steel doors part on a gold boardroom, five seats light one by one), *Delivered* (a burst of ticks, a gold ring, the big ✓✓ turns blue). Shared treatment: letterbox bars, film grain, vignette, a light leak at the cut. Rules followed from the Remotion skill: frame-driven `interpolate()` with `Easing.bezier`/`Easing.spring`, `scale`/`translate` props, no CSS animation inside compositions, local font via `delayRender`.
- **In the app:** scenes play over a dark stage with HTML titles that fade up on the scene's beat; a chapter band sweeps in when a new day opens; S grades get a gold-blue light sweep, F grades a short jolt and red edge. Every scene is skippable (Skip, tap, Esc) and none plays under reduced motion or when switched off in Settings.
- **First visit:** a start screen ("Start, with sound" or "Start quietly"), because browsers only allow sound after a tap.
- **Sound:** trailer-style layer on Web Audio: risers, sub impacts, brass-like braams, whooshes, shimmer, elevator dings and heartbeats, scheduled to each scene's timeline. Music ducks during scenes and comes back after.
- **Language:** a small globe button in the top bar (EN/VI). English is the default.
