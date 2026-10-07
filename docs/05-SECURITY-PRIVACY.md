# Security and privacy review

**Date:** 5 Oct 2026 · **Method:** `security-review` skill (OWASP-style review of the full source as one change set, with a sub-agent tracing every HTML sink and data path), plus the engineering `code-review` checklist · **Result:** no high or medium findings. One robustness bug fixed.

## Threat model
| Asset | Where it lives | Who can read it |
|---|---|---|
| Progress, grades, ledger confirmations, My Scripts | db `data/users/<uid>/progress` | Only Minh (the platform keeps `data/users/<id>/` private, even from the artifact owner) |
| Typed answers | db `data/users/<uid>/ans-Q#` | Only Minh |
| Salary walk-away / target / anchor | localStorage `delivered.salary` on that device | Only that browser; never in db, never in any prompt |
| Coach prompts | `sample` capability, billed to the viewer | Anthropic model; contains the book's facts about Minh and what Minh types |
| Book content | embedded JSON in the page | Anyone Minh shares the link with |

## What was checked
- **XSS.** The only raw-HTML sink is `Md` (ui1.js). Everything that reaches it goes through `md()`, which escapes `& < > "` before adding a fixed set of tags and never builds attributes from text. Payloads with `<img onerror>`, `<svg onload>`, `<script>` in table cells and quote break-outs all render as text. Model output (coach chat, streaming text) goes through the same path. All other model fields render as React text.
- **Data exposure.** Only two db paths exist, both under the private user prefix; ids come from the platform and the embedded content. No shared collections, no public writes.
- **Salary.** The Salary Card never puts numbers into game state, the report, or any of the six prompts. The coach chat refuses to send a message containing a stored salary number.
- **Script embedding.** The build escapes `</` inside the embedded JSON and asserts the bundled JS has no `</script`.
- **Secrets.** None in the source. The model is reached only through the platform capability; no API keys.
- **External calls.** None besides the three CDN scripts and Google Fonts, enforced by the artifact CSP.

## Fixed during review
| # | Issue | Fix |
|---|---|---|
| 1 | A markdown table made only of separator rows (possible in model output) threw inside `md()` and could blank the screen | Guard in `md()`, plus a React error boundary around the main pane so one bad render never loses the session. Unit test added. |

## Accepted risks
- **Prompt content.** Whatever Minh types in the coach goes to the model. The UI warns on every input not to paste internal NAB or client data. This is the user's own content and is out of scope as a vulnerability, but it is the main privacy rule to follow.
- **salaryLeak is a guard, not a filter.** It catches stored numbers, not "25 triệu" written in words.
- **Sharing.** If Minh shares the artifact link, others see the book content (Minh's career facts) but never Minh's progress, answers or salary.
- **Two devices at once.** Last write wins by timestamp; a few minutes of the older tab can be lost.

## v2 review (5 Oct 2026)
- **New code paths:** language switch (`setLang` writes one localStorage key and reloads), English content overlay (build-time JSON, our own text), follow-up samples (rendered as React text or through the escaping `md()`), scene videos (data URIs built into the page; no network), start screen, rehearsal runs.
- **Sinks:** still exactly one raw-HTML sink (`Md`), unchanged. No `eval`, `new Function` or `innerHTML` anywhere (grep checked).
- **Prompts:** the coach and grader now answer in the chosen language. Truth, ledger and salary rules in the prompts are unchanged; salary numbers still never leave the browser.
- **Storage:** three new per-device keys in localStorage: `delivered.lang`, `delivered.intro`, `delivered.cine`. No new db paths.
- **Result:** no new findings.
