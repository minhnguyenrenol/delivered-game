// Accessibility: axe-core WCAG 2.1 AA scan of the main screens, both themes, plus a keyboard reachability check.
const fs = require('fs'), path = require('path'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; const AXE = path.join(process.env.VEND, 'node_modules/axe-core/axe.min.js');
(async () => {
  const browser = await chromium.launch(); const all = {};
  for (const scheme of ['light', 'dark']) {
    const { ctx, page } = await open(browser, OUT, { lang: 'en', colorScheme: scheme, init: `localStorage.setItem('delivered.sound','{"sfx":false,"music":false}')` });
    const scan = async name => { await page.addScriptTag({ path: AXE }); const r = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, eg: v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')) })));
      r.forEach(v => { const k = v.id + ' (' + v.impact + ')'; all[k] = all[k] || { help: v.help, where: new Set() }; all[k].where.add(scheme + ':' + name + ' x' + v.n + ' e.g. ' + v.eg.join(' | ')); }); };
    await page.waitForTimeout(600); await scan('home');
    await page.getByRole('button', { name: /Day 1\./ }).click(); await page.waitForTimeout(800); await scan('day1');
    for (const tab of ['Floor 18', 'Scorecard', 'Files']) { await page.locator('.railtabs').getByRole('button', { name: tab }).click(); await page.waitForTimeout(400); await scan(tab); }
    await page.locator('.railtabs').getByRole('button', { name: 'Chats' }).click(); await page.getByRole('button', { name: /Minh → Minh/ }).click(); await page.waitForTimeout(300); await scan('ledger');
    await page.getByRole('button', { name: /Coach Thư/ }).click(); await page.getByRole('tab', { name: 'Free practice' }).click(); await page.locator('.pickcard').first().click();
    await page.getByRole('button', { name: /Show the full script/ }).click(); await page.waitForTimeout(300); await scan('fullscript');
    await page.evaluate(() => { cinePref.set(true); }); await page.evaluate(() => { CineBus.cur = { key: 'call', title: 'Round 1', sub: 'Linh, Khoa', id: 1, done() { CineBus.cur = null; CineBus.emit(); } }; CineBus.emit(); }); await page.waitForTimeout(300); await scan('scene');
    await page.evaluate(() => CineBus.cur && CineBus.cur.done());
    await ctx.close();
  }
  { const { ctx, page } = await open(browser, OUT, { lang: 'en', fresh: true }); await page.waitForTimeout(400); await page.addScriptTag({ path: AXE });
    const r = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(v => v.id + ' x' + v.nodes.length));
    r.forEach(v => { all[v] = all[v] || { help: 'start screen', where: new Set(['startgate']) }; }); await ctx.close(); }
  // keyboard: tab through the home screen and count focus stops that are visible and named
  const { ctx, page } = await open(browser, OUT, { lang: 'en' });
  const stops = []; for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); stops.push(await page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { tag: e.tagName, name: (e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 30), vis: r.width > 0 && r.height > 0 }; })); }
  console.log('keyboard stops:', stops.filter(s => s.vis && s.name).length, '/ 40 visible and named; unnamed:', JSON.stringify(stops.filter(s => !s.name).slice(0, 5)));
  await page.getByRole('button', { name: /Day 1\./ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  console.log('Enter opens a day thread:', await page.locator('.thread .threadhead').count() > 0);
  await ctx.close(); await browser.close();
  const keys = Object.keys(all); console.log(keys.length ? 'axe violations:' : 'axe: no WCAG 2.1 AA violations');
  keys.forEach(k => { console.log('- ' + k + ': ' + all[k].help); [...all[k].where].slice(0, 4).forEach(w => console.log('    ' + w)); });
  if (keys.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
