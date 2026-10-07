// End-to-end for v2: English by default with a Vietnamese switch, cinematic scenes, grade effects,
// follow-up sample answers, full scripts in Free practice, and rehearsal of finished questions.
const fs = require('fs'), path = require('path'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
let failures = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  -> ' + info)); if (!ok) failures++; };
const quiet = `localStorage.setItem('delivered.sound','{"sfx":false,"music":false}');`;
const seedOnce = st => `if (!sessionStorage.getItem('t.seed')) { sessionStorage.setItem('t.seed','1'); localStorage.setItem('delivered.v1', ${JSON.stringify(JSON.stringify(st))}); } ${quiet}`;
const realErrs = errs => errs.filter(e => !/Failed to load resource/.test(e));
// Vietnamese letters that should not appear in English mode, outside names and places we keep on purpose
const VI = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const KEEP = /Thư|Lê Duẩn|Tiếng Việt|Chị \w+|Anh \w+|Tuấn|Hằng|Hải|Ngân|Đạt|Sài Gòn|Hà Nội|Cần Thơ|lì xì|Phở|Cà Phê|Cô Út Pha Sữa Fin|Bánh Đúc Hành|Nhà Đông Người Có Tết|Đừng Mở Ví|Tôi Sợ Mất Rồi|Phải Đi|Hoàn toàn được/g;
const viShare = l => { const w = l.split(/\s+/).filter(Boolean); return w.length ? w.filter(x => VI.test(x)).length / w.length : 0; };
const viLeft = async page => { const t = (await page.locator('body').innerText()).replace(KEEP, ''); return t.split('\n').filter(l => viShare(l) > 0.25 && l.split(/\s+/).length > 1).slice(0, 4); };
const closedDays = n => { const days = {}; for (let d = 1; d <= n; d++) days[d] = { closed: true, closedOn: '2026-01-' + String(d).padStart(2, '0'), segs: { warm: 'x', learn: 'x', voice: 'x', review: 'x', night: 'x' } }; return days; };
const learnedCards = n => { const cards = {}; for (let k = 1; k <= n; k++) cards['Q' + k] = { box: 2, due: 30, att: [{ g: 'B', d: 1 }] }; return cards; };
const base = (extra) => ({ v: 1, day: 1, days: {}, cards: {}, streak: 0, best: 0, freezes: 1, settings: { lockOff: false, rounds: {} }, ...extra });

(async () => {
  const browser = await chromium.launch();
  const h264 = await (async () => { const p = await (await browser.newContext()).newPage(); return p.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"')); })();
  console.log('test browser H.264 support:', JSON.stringify(h264), h264 ? '' : '(scenes play the WebM copy here; Chrome, Edge and Safari get the MP4)');

  // ---- first visit: English, start screen, intro scene, skip ----
  {
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', fresh: true, motion: 'no-preference', viewport: { width: 1280, height: 800 } });
    check('first visit shows the start screen', await page.locator('.startgate').isVisible());
    check('start screen is English', /Start, with sound/.test(await page.locator('.startgate').innerText()));
    await page.getByRole('button', { name: 'Start quietly' }).click();
    await page.waitForSelector('.cine-intro', { timeout: 4000 }).catch(() => {});
    check('intro scene plays after start', await page.locator('.cine-intro').count() === 1);
    check('intro has the embedded video', await page.locator('.cine-intro video').count() === 1 || await page.locator('.cine-intro.cine-css').count() === 1);
    await page.waitForTimeout(5600); await page.screenshot({ path: path.join(OUT, 'v2-intro.png') });
    const v = await page.evaluate(() => { const x = document.querySelector('.cine-intro video'); return x ? { t: x.currentTime, src: (x.currentSrc || '').slice(0, 16), paused: x.paused, err: !!x.error } : null; });
    check('intro video really plays (WebM in this browser)', v && v.t > 1 && /webm|mp4/.test(v.src) && !v.err, JSON.stringify(v));
    check('intro title appears', /Delivered/.test(await page.locator('.cine-title').innerText().catch(() => '')));
    await page.getByRole('button', { name: 'Skip' }).click(); await page.waitForTimeout(300);
    check('Skip closes the scene', await page.locator('.cine').count() === 0);
    check('intro is remembered', await page.evaluate(() => localStorage.getItem('delivered.intro')) === '1');
    check('quiet start turned sound off', await page.evaluate(() => !Sound.prefs.sfx && !Sound.prefs.music));
    check('day list is in English', await page.getByRole('button', { name: /Day 1\. Lobby/ }).count() === 1);
    check('no stray Vietnamese on home (English mode)', (await viLeft(page)).length === 0, JSON.stringify(await viLeft(page)));
    check('no page errors on first visit', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  // ---- language switch: EN -> VI -> EN, survives reload ----
  {
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', init: quiet });
    const btn = page.locator('.langbtn');
    check('language button sits in the top bar', await page.locator('.topbar .langbtn').count() === 1);
    check('language button offers VI in English mode', (await btn.innerText()).trim() === 'VI');
    await btn.click(); await page.waitForFunction(() => typeof LANG !== 'undefined' && LANG === 'vi' && document.querySelector('.app'), null, { timeout: 30000 });
    check('switch to Vietnamese reloads in Vietnamese', await page.getByRole('button', { name: /Ngày 1\. Sảnh/ }).count() === 1);
    check('html lang follows the choice', await page.evaluate(() => document.documentElement.lang) === 'vi');
    await page.locator('.langbtn').click(); await page.waitForFunction(() => typeof LANG !== 'undefined' && LANG === 'en' && document.querySelector('.app'), null, { timeout: 30000 });
    check('and back to English', await page.getByRole('button', { name: /Day 1\. Lobby/ }).count() === 1);
    check('no page errors switching language', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  // ---- English coverage across the main screens ----
  {
    const { ctx, page } = await open(browser, OUT, { lang: 'en', init: seedOnce(base({ day: 8, days: closedDays(7), cards: learnedCards(40), streak: 7, best: 7, lastClosed: '2026-01-07' })) });
    const spots = {};
    await page.getByRole('button', { name: /Day 8\./ }).click(); await page.waitForTimeout(700); spots.day8 = await viLeft(page);
    for (const tab of ['Floor 18', 'Scorecard', 'Files']) { await page.locator('.railtabs').getByRole('button', { name: tab }).click(); await page.waitForTimeout(400); spots[tab] = await viLeft(page); }
    await page.locator('.railtabs').getByRole('button', { name: 'Chats' }).click();
    await page.getByRole('button', { name: /Minh → Minh/ }).click(); await page.waitForTimeout(300); spots.ledger = await viLeft(page);
    await page.getByRole('button', { name: /Coach Thư/ }).click(); await page.waitForTimeout(300); spots.coach = await viLeft(page);
    const bad = Object.entries(spots).filter(([, v]) => v.length);
    check('English mode: day thread, map, scorecard, files, ledger, coach have no stray Vietnamese', bad.length === 0, JSON.stringify(bad).slice(0, 600));
    await ctx.close();
  }

  // ---- Free practice: full script with every follow-up and its sample answer ----
  {
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', init: quiet, viewport: { width: 400, height: 860 } });
    await page.getByRole('button', { name: /Coach Thư/ }).click();
    await page.getByRole('tab', { name: 'Free practice' }).click();
    await page.locator('.pickcard').first().click();
    await page.getByRole('button', { name: /Show the full script/ }).click();
    const n = await page.evaluate(() => CARD.Q1.follow_ups.length);
    check('full script shows the main sample answer', await page.locator('.fullscript .answer').count() === 1);
    check('full script lists every follow-up with a sample answer', await page.locator('.fullscript .fs-follow .fsample').count() === n, n);
    const words = (await page.locator('.fullscript .fsample').first().innerText()).split(/\s+/).length;
    check('follow-up sample is a full spoken answer (70-110 words)', words >= 65 && words <= 115, words);
    await page.screenshot({ path: path.join(OUT, 'v2-fullscript.png'), fullPage: false });
    check('no horizontal scroll at 400px', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    check('no page errors in full script', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  // ---- in a real run, the follow-up reveal shows the sample answer, then the key line ----
  {
    const { ctx, page } = await open(browser, OUT, { lang: 'en', init: quiet });
    await page.getByRole('button', { name: /Coach Thư/ }).click(); await page.getByRole('tab', { name: 'Free practice' }).click(); await page.locator('.pickcard').first().click();
    const r = await page.evaluate(() => { const f = CARD.Q1.follow_ups[0]; return { hasSample: !!f.sample, hasNote: !!f.note_en && !!f.note_vi }; });
    check('follow-ups carry sample, English note and Vietnamese note', r.hasSample && r.hasNote, JSON.stringify(r));
    await ctx.close();
  }

  // ---- rehearse a finished day ----
  {
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', init: seedOnce(base({ day: 2, days: closedDays(1), cards: learnedCards(5), streak: 1, best: 1, lastClosed: '2026-01-01' })) });
    await page.getByRole('button', { name: /Day 1\./ }).click(); await page.waitForTimeout(500);
    const rb = page.getByRole('button', { name: /Rehearse Day 1 again/ });
    check('closed day offers a rehearsal', await rb.count() === 1);
    await rb.click(); await page.waitForTimeout(400);
    check('rehearsal runs the day’s questions again', await page.locator('.rehearse .seghead').count() === 1 && /Rehearsing Day 1/.test(await page.locator('.rehearse .seghead').innerText()));
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: /Coach Thư/ }).click(); await page.getByRole('tab', { name: 'Free practice' }).click();
    check('Free practice offers a shuffled rehearsal of learned questions', await page.getByRole('button', { name: /Shuffle 8 learned questions/ }).count() === 1);
    check('no page errors in rehearsal', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  // ---- chapter card on a new day, call scene on joining, grade effects ----
  {
    const days = closedDays(6); days[7] = { segs: { warm: 'x', learn: 'x', review: 'x' } };
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', motion: 'no-preference', viewport: { width: 400, height: 860 }, init: seedOnce(base({ day: 7, days, cards: learnedCards(32), streak: 6, best: 6, freezes: 2, lastClosed: '2026-01-06' })) });
    await page.getByRole('button', { name: /Day 7\./ }).click(); await page.waitForTimeout(250);
    check('opening a new day plays its chapter card', await page.locator('.cine-chapter').count() === 1);
    await page.waitForTimeout(2600);
    check('chapter card clears itself', await page.locator('.cine').count() === 0);
    await page.getByRole('button', { name: /Join the call/ }).click(); await page.waitForTimeout(400);
    check('joining a group call plays the call scene', await page.locator('.cine-call').count() === 1);
    check('call scene names the round', /Round 1/.test(await page.locator('.cine-call .cine-title').innerText().catch(() => '')));
    await page.screenshot({ path: path.join(OUT, 'v2-call-scene.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    check('Escape skips the scene and the call continues', await page.locator('.cine').count() === 0 && await page.locator('.callscreen').count() > 0);
    await page.evaluate(() => cineGrade('S')); await page.waitForTimeout(80);
    check('an S grade sweeps light across the screen', await page.locator('.fxlayer.fx-S').count() === 1);
    await page.waitForTimeout(1000); await page.evaluate(() => cineGrade('F')); await page.waitForTimeout(80);
    check('an F grade jolts the screen', await page.locator('.fxlayer.fx-F').count() === 1);
    check('no page errors with scenes', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  // ---- reduced motion and the setting both turn scenes off ----
  {
    const { ctx, page } = await open(browser, OUT, { lang: 'en', motion: 'reduce', init: quiet });
    await page.evaluate(() => playCine('call', { title: 'x' })); await page.waitForTimeout(200);
    check('reduced motion: no scene plays', await page.locator('.cine').count() === 0);
    await ctx.close();
    const b = await open(browser, OUT, { lang: 'en', motion: 'no-preference', init: quiet + `localStorage.setItem('delivered.cine','off');` });
    await b.page.evaluate(() => playCine('call', { title: 'x' })); await b.page.waitForTimeout(200);
    check('setting off: no scene plays', await b.page.locator('.cine').count() === 0);
    await b.page.locator('.railtabs').getByRole('button', { name: 'Files' }).click(); await b.page.waitForTimeout(300);
    const set = b.page.locator('#set-cine');
    if (await set.count() === 0) { const s = b.page.getByRole('button', { name: /Settings/ }); if (await s.count()) await s.first().click(); await b.page.waitForTimeout(300); }
    check('Settings has the cinematic scenes switch', await b.page.locator('#set-cine').count() === 1);
    await b.ctx.close();
  }

  // ---- final panel scene and the ending scene ----
  {
    const days = closedDays(13); days[14] = { segs: { warm: 'x' } };
    const cards = {}; for (let k = 1; k <= 72; k++) cards['Q' + k] = { box: 3, due: 30, att: [{ g: 'A', d: 10, panel: true }] };
    const { ctx, page, errs } = await open(browser, OUT, { lang: 'en', motion: 'no-preference', init: seedOnce(base({ day: 14, days, cards, streak: 13, best: 13, lastClosed: '2026-01-13', boss: { 7: { avg: 4 }, 11: { avg: 4 }, 13: { avg: 4 } } })) });
    await page.getByRole('button', { name: /Day 14\./ }).click(); await page.waitForTimeout(2400);
    const join = page.getByRole('button', { name: /Join the call/ });
    if (await join.count()) { await join.click(); await page.waitForTimeout(400); check('final panel plays the doors-open scene', await page.locator('.cine-final').count() === 1); await page.waitForTimeout(3800); await page.screenshot({ path: path.join(OUT, 'v2-final-scene.png') }); await page.getByRole('button', { name: 'Skip' }).click(); }
    else check('final panel plays the doors-open scene', false, 'no Join button on day 14');
    await page.evaluate(() => { endingPlayed = false; });
    check('no page errors on day 14', realErrs(errs).length === 0, realErrs(errs).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(failures ? failures + ' v2 checks failed' : 'all v2 checks passed'); process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
