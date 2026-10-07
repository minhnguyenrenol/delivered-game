# Delivered ✓✓ · development record

The game was built like a small product release. Each step used one of the skills installed for Minh.

| Step | Document | Skill used |
|---|---|---|
| Plan | [01-PRD.md](01-PRD.md) | engineering `write-spec` |
| Architecture | [02-ADR-001-architecture.md](02-ADR-001-architecture.md) | engineering `architecture` |
| Design | [03-DESIGN.md](03-DESIGN.md) | impeccable (craft floor, detector), taste-skill |
| Test | [04-TEST-REPORT.md](04-TEST-REPORT.md) | engineering `testing-strategy`, design `accessibility-review` |
| Security | [05-SECURITY-PRIVACY.md](05-SECURITY-PRIVACY.md) | `security-review`, engineering `code-review` |
| Release | [06-RELEASE-CHECKLIST.md](06-RELEASE-CHECKLIST.md) | engineering `deploy-checklist` |

Remotion (v2): the four cinematic scenes (intro, call, final panel, ending) are Remotion compositions in `cine/`, rendered to MP4 and WebM and embedded in the page. The interactive game itself stays React; Remotion only makes the films.

## Layout
- `src/` source: `data.js` (personas, days, drills), `engine.js` (grading, truth checks, spaced repetition, storage), `sound.js` (Web Audio effects and music), `ui1-3.js` (React + htm screens), `app.css`, `content.json` (built from the book by `build_content.py`), `build.py`.
- `delivered.html` the built page that is published.
- `tests/` unit, e2e, a11y; run `sh tests/run-all.sh` (see the test report for the two environment variables).

The book, CV and plan in `/mnt/project-files/qualgo-interview/` are read, never edited.
