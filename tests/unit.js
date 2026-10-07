// Unit tests for the engine, run inside the built page so they test exactly what ships.
const fs = require('fs'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch(); const { page, ctx } = await open(browser, OUT);
  const res = await page.evaluate(() => {
    const out = []; const t = (name, ok, info = '') => out.push({ name, ok: !!ok, info: ok ? '' : String(info) });
    const st = freshState();
    // content integrity
    t('72 cards', CARDS.length === 72, CARDS.length);
    t('every card has opener, answer, hook, must list', CARDS.every(c => c.opener && c.answer && c.hook && c.mustList.length), CARDS.filter(c => !(c.opener && c.answer && c.hook && c.mustList.length)).map(c => c.id));
    t('every card has a sticker and a room', CARDS.every(c => c.sticker && ROOMS[c.room]));
    t('schedule covers all 72 questions once', (() => { const n = C.schedule.flatMap(d => d.new_ids); return n.length === 72 && new Set(n).size === 72; })());
    t('21 scorecard rows, rows 11 and 19 starred', C.scorecard.length === 21 && C.scorecard.find(r => r.row === 11).star && C.scorecard.find(r => r.row === 19).star);
    t('truth table T1-T17', C.truth.length === 17);
    t('no em or en dash in displayed content', !JSON.stringify(C).match(/[–—]/), (JSON.stringify(C).match(/.{20}[–—].{20}/) || [])[0]);
    // overclaim detector: must catch
    const bad = ['I have 14 years in banking and finance.', 'I led a design team of 60 people.', 'I have led teams of up to sixty people.', 'RegShield launched last quarter.', 'We measured that AI did 60% of the design work.', 'Our mobile app is live on both stores.', 'I shipped a native mobile app for the wallet.', 'My product had 400,000 users.', 'I have shipped a consumer chat app before.'];
    bad.forEach(s => t('flags: ' + s, detectOverclaims(s).length > 0));
    // must not flag honest lines
    const good = [...C.honesty, 'Ten years in product design, after four as a developer.', 'RegShield is an MVP in flight, not live yet.', 'By my own estimate, AI supported about 60% of design activities.', 'The native app is planned, not shipped.', 'I ran a workshop for about 60 people.', 'FX Impact was integrated into Eikon, which has about 400,000 users.'];
    good.forEach(s => t('clean: ' + s.slice(0, 60), detectOverclaims(s).length === 0, JSON.stringify(detectOverclaims(s))));
    t('ledger: claiming P1 before done is flagged', ledgerClaims(st, 'I built a chat concept prototype last weekend.').length > 0);
    t('ledger: future tense is fine', ledgerClaims(st, 'I would build a chat concept prototype.').length === 0);
    // grading
    t('grade S needs five', gradeFrom(0.95, true, 2) === 'S' && gradeFrom(0.95, false, 2) === 'A');
    t('truth 0 gives F', gradeFrom(1, true, 0) === 'F');
    t('bands', gradeFrom(0.8, false, 2) === 'A' && gradeFrom(0.6, false, 2) === 'B' && gradeFrom(0.3, false, 2) === 'C');
    t('length factor', lengthFactor(80, 90) === 1 && lengthFactor(120, 90) === 0.85 && lengthFactor(200, 90) === 0.6);
    const r1 = { grade: 'S' }; applyCaps(r1, [{ g: 'A', why: 'x' }, { g: 'B', why: 'y' }]); t('caps take the lowest', r1.grade === 'B');
    const q1 = CARD.Q1; const rg = ruleGrade(q1, 'I have fourteen years in banking. ' + q1.answer, 80, st); t('rule grade F on overclaim', rg.overclaims.length > 0);
    const sg = selfGrade(q1, { signal: 1, evidence: 1, narrative: 1, deliver: 1, five: 1, m0: 1, m1: 1, m2: 1, m3: 1 }, 80, st); t('self grade all ticked = S', sg.grade === 'S', sg.grade);
    t('self grade overclaim = F', selfGrade(q1, { signal: 1, overclaim: 1 }, 80, st).grade === 'F');
    // spaced repetition
    t('blank recall goes to box 1', moveBox(3, 'blank', 'A', false) === 1);
    t('ticks map', ticksFor('F') === 'fail' && ticksFor('C') === 'sent' && ticksFor('B') === 'delivered' && ticksFor('A') === 'read' && ticksFor('S') === 'typing');
    // pending caps exist for 🟨 cards
    t('some cards carry 🟨 items', ALL_PENDING.length > 0, ALL_PENDING.length);
    // day logic
    const s2 = freshState(); t('day 1 unlocked at start', unlockedDay(s2) === 1);
    s2.days[1] = { closed: true, closedOn: todayISO() }; t('closed today stays locked until 5 a.m.', unlockedDay(s2) === 1);
    s2.settings.lockOff = true; t('lock off opens next day', unlockedDay(s2) === 2);
    s2.days[1].closedOn = '2000-01-01'; s2.settings.lockOff = false; t('closed on an earlier date opens next day', unlockedDay(s2) === 2);
    const s3 = freshState(); closeDay(s3, 1, ''); t('first close starts streak 1', s3.streak === 1 && s3.best === 1);
    const s4 = freshState(); s4.lastClosed = todayISO(new Date(Date.now() - 2 * 864e5)); s4.streak = 3; closeDay(s4, 2, ''); t('missed one day uses a freeze', s4.streak === 4 && s4.freezes === 1);
    const s5 = freshState(); s5.lastClosed = '2000-01-01'; s5.streak = 5; closeDay(s5, 2, ''); t('long gap resets streak', s5.streak === 1);
    t('segments: boss day has a call', segsFor(st, 7).includes('call') && segsFor(st, 14).join() === 'warm,call,night');
    t('segments: whiteboard day cannot be short', (() => { const s = freshState(); s.days[5] = { short: true }; return segsFor(s, 5).length === 5; })());
    t('call questions day 13 are the nine fixed ones', pickCallQs(st, 13).length === 9);
    t('day 7 Q5 has hostile follow-up', followFor(7, CARD.Q5)[0].hostile);
    t('day 11 Q53 has two follow-ups', followFor(11, CARD.Q53).length === 2);
    // scorecard gates
    const s6 = freshState(); const row = C.scorecard[0]; t('fresh row is not done', !rowStatus(s6, row).done);
    row.q_ids.forEach(n => { const id = 'Q' + n; s6.cards[id] = { box: 3, due: 9, att: [{ g: 'S', d: 3 }, { g: 'S', d: 5, panel: true }] }; CARD[id].pending.forEach(p => s6.checks[p.id] = true); });
    row.p_ids.forEach(p => s6.proof[p] = { done: true }); if (row.row === 18) s6.extra.critique = true; if (row.row === 21) s6.extra.demo = true;
    t('row with all three gates is done at 5', rowStatus(s6, row).done && rowStatus(s6, row).lvl === 5, JSON.stringify(rowStatus(s6, row)));
    // salary guard
    localStorage.setItem('delivered.salary', JSON.stringify({ anchor: '85.000.000' }));
    t('salary number is blocked from coach', salaryLeak('I want around 85,000,000 a month'));
    t('normal text passes salary guard', !salaryLeak('Q5 is weak, help me'));
    localStorage.removeItem('delivered.salary');
    // markdown escaping (model output goes through md())
    t('md survives a table of only separator rows', (() => { try { md('|---|---|\n|---|---|'); return true; } catch (e) { return false; } })());
    t('md escapes HTML', !md('<img src=x onerror=alert(1)> **ok**').includes('<img'));
    // state size stays under the 256 KiB db doc cap even at full use
    const big = freshState(); CARDS.forEach(c => big.cards[c.id] = { box: 4, due: 20, att: Array.from({ length: 12 }, (_, i) => ({ g: 'S', pct: 0.93, mode: 'type', panel: true, sec: 88, words: 190, recall: 'had', d: i })) });
    big.coachLog = Array.from({ length: 30 }, () => ({ r: 'thu', t: 'x'.repeat(900) })); for (let d = 1; d <= 14; d++) big.days[d] = { segs: { warm: 'x'.repeat(80), learn: 'x'.repeat(80) }, unsure: 'x'.repeat(300), rev: { q: CARDS.slice(0, 10).map(c => c.id), done: [], drills: [] } };
    CARDS.forEach(c => big.scripts[c.id] = 'x'.repeat(1400));
    const kb = new Blob([JSON.stringify(big)]).size / 1024; t('worst-case state < 256 KiB (' + kb.toFixed(0) + ' KiB)', kb < 256, kb);
    return out;
  });
  const fail = res.filter(r => !r.ok);
  res.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.info ? '  -> ' + r.info : '')));
  console.log(`\n${res.length - fail.length}/${res.length} passed`);
  await ctx.close(); await browser.close(); process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
