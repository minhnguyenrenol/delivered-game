// End-to-end: plays day 1 start to finish like a person would, then checks a group call, a dropped call,
// the final panel, the map, scorecard, files, ledger and coach. Uses local storage (no db in the test browser).
const fs = require('fs'), path = require('path'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
let failures = 0; const check = (name, ok, info = '') => { log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  -> ' + info)); if (!ok) failures++; };

// Clicks the next sensible control in the open thread. Returns the label clicked, or null.
async function step(page, opts = {}) {
  const scope = page.locator('.pane-main');
  const pri = [
    /^Đã nói \d\/3$/, /^Bắt đầu với/, /^Mình sẵn sàng/, /^Lật ngay$/, /^Có, gần nguyên văn$/, /^Có$/, /^Trúng$/, /^Mình đã nói/, /^Bước vào sảnh$/, /^Ra khỏi tòa nhà$/,
    /^Giờ nói cả câu trả lời$/, /^Gửi voice note/, /^Tiếp · câu hỏi đào sâu$/, /^Xem câu mẫu$/, /^Mình nói được như vậy$/, /^Xong câu này$/, /^Lưu · thẻ tiếp$/, /^Xong · xem ý bắt buộc$/,
    /^Tiếp$/, /^Tham gia cuộc gọi$/, /^Sang phần hỏi đáp$/, /^Kết thúc phần hỏi đáp$/, /^Rời cuộc gọi$/, /^Đóng Ngày/, /^✎ Sửa tin nhắn/, /^Vào hành lang$/, /^Mặt số tiếp$/, /^Che lại và gõ$/,
  ];
  // special phases
  if (await scope.locator('.choose .opt:not([disabled])').count()) { await scope.locator('.choose .opt').first().click(); return 'choose'; }
  if (await scope.locator('.speak .timerbar button').count() && !(await scope.locator('.selfcheck').count())) {
    await scope.locator('.speak .timerbar button').click(); await page.waitForTimeout(opts.speakMs || 2600); await scope.locator('.speak .timerbar button').click();
    for (const cb of await scope.locator('.selfcheck input[type=checkbox]').all()) { const id = await cb.getAttribute('id'); if (!/overclaim/.test(id)) await cb.check(); }
    return 'spoke';
  }
  if (await scope.locator('.quickmust input[type=checkbox]').count()) { for (const cb of await scope.locator('.quickmust input[type=checkbox]').all()) await cb.check(); }
  const hon = scope.locator('textarea[id^=hon-]'); if (await hon.count()) { const i = +(await hon.getAttribute('id')).split('-')[1]; const line = await page.evaluate(i => C.honesty[i], i);
    if (!(await scope.locator('.diff').count())) { await hon.fill(line); await scope.getByRole('button', { name: 'Kiểm tra' }).click(); return 'honesty'; } }
  const btns = await scope.locator('button:visible:not([disabled])').all();
  const labels = await Promise.all(btns.map(b => b.innerText().then(t => t.trim()).catch(() => '')));
  for (const re of pri) { const k = labels.findIndex(l => re.test(l)); if (k >= 0) { await btns[k].click(); return labels[k]; } }
  const hk = labels.findIndex(l => /^Đúng nguyên văn/.test(l)); if (hk >= 0) { await btns[hk].click(); return labels[hk]; }
  return null;
}
async function play(page, until, max = 400) {
  let idle = 0;
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    const l = await step(page); if (!l) { idle++; await page.waitForTimeout(700); if (idle > 10) return false; } else idle = 0;
    await page.waitForTimeout(l === 'spoke' ? 200 : 450);
  }
  return false;
}
const seed = st => `localStorage.setItem('delivered.v1', ${JSON.stringify(JSON.stringify(st))}); localStorage.setItem('delivered.sound', '{"sfx":false,"music":false}');`;

(async () => {
  const browser = await chromium.launch();
  // ---- Day 1 complete run, mobile size ----
  {
    const { ctx, page, errs } = await open(browser, OUT, { viewport: { width: 400, height: 860 }, init: `localStorage.setItem('delivered.sound','{"sfx":false,"music":false}')` });
    await page.getByRole('button', { name: /Ngày 1\./ }).click();
    const ok = await play(page, async () => (await page.locator('.dayclosed').count()) > 0, 500);
    await page.screenshot({ path: path.join(OUT, 'e2e-day1-end.png') });
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('delivered.v1')));
    check('day 1 plays to the end and closes', ok && st.days[1]?.closed, JSON.stringify(st.days[1]?.segs));
    check('day 1 learned Q1-Q5', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].every(id => st.cards[id]?.att?.length), Object.keys(st.cards));
    check('streak is 1 and XP earned', st.streak === 1 && st.xp > 100, st.streak + ' ' + st.xp);
    check('honesty drill saved', Object.keys(st.drills.honesty || {}).length === 4, JSON.stringify(st.drills.honesty));
    check('day 2 locked until 5 a.m.', await page.evaluate(() => unlockedDay(JSON.parse(localStorage.getItem('delivered.v1'))) === 1));
    check('no page errors on day 1', errs.filter(e => !/Failed to load resource/.test(e)).length === 0, errs.join(' | '));
    check('no horizontal scroll at 400px', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await ctx.close();
  }
  // ---- typed answer with an overclaim gets F (rule grading, no coach in test) ----
  {
    const { ctx, page } = await open(browser, OUT, { init: seed({ v: 1, day: 1, days: {}, settings: { lockOff: true, rounds: {} } }) });
    await page.getByRole('button', { name: /Coach Thư/ }).click();
    await page.getByRole('tab', { name: 'Luyện tự do' }).click();
    await page.locator('.pickcard').filter({ hasText: 'Q1' }).first().click();
    await play(page, async () => (await page.locator('.composer').count()) > 0, 30);
    await page.getByRole('tab', { name: /Gõ/ }).click();
    await page.locator('.composer textarea').fill('I have fourteen years in banking and finance, and I led a design team of sixty people at NAB, so I am ready to lead.');
    await page.getByRole('button', { name: /Gửi ➤/ }).click();
    await page.waitForSelector('.coachcard', { timeout: 10000 });
    const g = await page.locator('.coachcard .gbadge').first().innerText();
    check('typed overclaim is graded F ("!")', g.trim() === '!', g);
    check('overclaim explanation names T1 and T10', (await page.locator('.overclaim').innerText()).match(/T1\b/) && (await page.locator('.overclaim').innerText()).includes('T10'));
    await page.screenshot({ path: path.join(OUT, 'e2e-overclaim.png') });
    await ctx.close();
  }
  // ---- group call day 7 ----
  {
    const days = {}; for (let d = 1; d <= 6; d++) days[d] = { closed: true, closedOn: '2026-01-0' + d, segs: { warm: 'x', learn: 'x', voice: 'x', review: 'x', night: 'x' } };
    days[7] = { segs: { warm: 'x', learn: 'x', review: 'x' } };
    const cards = {}; for (let n = 1; n <= 32; n++) cards['Q' + n] = { box: 2, due: 9, att: [{ g: 'B', d: 2 }] };
    const { ctx, page, errs } = await open(browser, OUT, { init: seed({ v: 1, day: 7, days, cards, streak: 6, best: 6, freezes: 2, lastClosed: '2026-01-06', settings: { lockOff: false, rounds: {} } }) });
    await page.getByRole('button', { name: /Ngày 7\./ }).click();
    await page.waitForSelector('.callscreen.lobby');
    await page.screenshot({ path: path.join(OUT, 'e2e-call-lobby.png') });
    const ok = await play(page, async () => (await page.locator('.callscreen.end').count()) > 0, 300);
    await page.screenshot({ path: path.join(OUT, 'e2e-call-end.png') });
    check('day 7 call runs 6 questions to the end', ok && (await page.locator('.callgrades .cg').count()) === 6);
    await page.getByRole('button', { name: 'Rời cuộc gọi' }).click(); await page.waitForTimeout(400);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('delivered.v1')));
    check('call result saved and a freeze earned', st.boss[7] && st.freezes === 3, JSON.stringify(st.boss[7]) + ' freezes ' + st.freezes);
    check('panel answers recorded as panel', st.cards.Q1.att.some(a => a.panel));
    check('no page errors in call', errs.filter(e => !/Failed to load resource/.test(e)).length === 0, errs.join(' | '));
    await ctx.close();
  }
  // ---- day 11: an overclaim drops the call ----
  {
    const days = {}; for (let d = 1; d <= 10; d++) days[d] = { closed: true, closedOn: '2026-01-' + String(d).padStart(2, '0'), segs: {} };
    days[11] = { segs: { warm: 'x', learn: 'x', review: 'x' } };
    const { ctx, page } = await open(browser, OUT, { init: seed({ v: 1, day: 11, days, settings: { lockOff: false, rounds: {} } }) });
    await page.getByRole('button', { name: /Ngày 11\./ }).click();
    await page.getByRole('button', { name: /Tham gia cuộc gọi/ }).click();
    await play(page, async () => (await page.locator('.composer').count()) > 0, 30);
    await page.getByRole('tab', { name: /Gõ/ }).click();
    await page.locator('.composer textarea').fill('Our model never cries wolf. RegShield launched last quarter and is live in production, so I know AI warnings work.');
    await page.getByRole('button', { name: /Gửi ➤/ }).click();
    await play(page, async () => (await page.locator('.callscreen.dropped').count()) > 0, 30);
    check('day 11 call drops on an overclaim', (await page.locator('.callscreen.dropped').count()) === 1);
    await page.screenshot({ path: path.join(OUT, 'e2e-call-dropped.png') });
    await ctx.close();
  }
  // ---- day 14 final panel to an ending ----
  {
    const days = {}; for (let d = 1; d <= 13; d++) days[d] = { closed: true, closedOn: '2026-01-' + String(d).padStart(2, '0'), segs: {} };
    days[14] = { segs: { warm: 'x' } };
    const cards = {}; for (let n = 1; n <= 72; n++) cards['Q' + n] = { box: 3, due: 20, att: [{ g: 'A', d: 10 }] };
    const { ctx, page, errs } = await open(browser, OUT, { viewport: { width: 1280, height: 900 }, init: seed({ v: 1, day: 14, days, cards, settings: { lockOff: false, rounds: {} } }) });
    await page.getByRole('button', { name: /Ngày 14\./ }).click();
    const ok = await play(page, async () => (await page.locator('.ending').count()) > 0, 900);
    await page.screenshot({ path: path.join(OUT, 'e2e-final.png') });
    check('final panel reaches an ending', ok, '');
    check('no page errors in final', errs.filter(e => !/Failed to load resource/.test(e)).length === 0, errs.join(' | '));
    // tabs
    for (const [tab, sel] of [['Tầng 18', '.floormap'], ['Scorecard', '.scorerow'], ['Files', '.files']]) {
      await page.locator('.railtabs').getByRole('button', { name: tab }).click(); await page.waitForTimeout(300);
      check(tab + ' tab renders', (await page.locator(sel).count()) > 0);
      await page.screenshot({ path: path.join(OUT, 'tab-' + tab.replace(/\W+/g, '') + '.png') });
    }
    await page.locator('.railtabs').getByRole('button', { name: 'Tầng 18' }).click();
    await page.locator('.room').first().click(); await page.locator('.rp-card').first().click();
    check('card detail opens from map', (await page.locator('.detailtop').count()) === 1);
    await page.locator('.railtabs').getByRole('button', { name: 'Chats' }).click();
    await page.getByRole('button', { name: /Minh → Minh/ }).click();
    await page.locator('.truthrow input[type=checkbox]').first().check();
    const led = await page.evaluate(() => JSON.parse(localStorage.getItem('delivered.v1')).ledger);
    check('ledger confirmation saves', Object.values(led).some(x => x.ok));
    await page.screenshot({ path: path.join(OUT, 'ledger.png') });
    await ctx.close();
  }
  await browser.close();
  log(failures ? `\n${failures} FAILED` : '\nall e2e checks passed'); process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
