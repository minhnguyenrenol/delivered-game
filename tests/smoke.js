const path = require('path'), fs = require('fs'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  for (const [name, viewport, colorScheme] of [['desktop', { width: 1440, height: 900 }, 'light'], ['mobile', { width: 400, height: 860 }, 'dark']]) {
    const { ctx, page, errs } = await open(browser, OUT, { viewport, colorScheme });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(name, '| errors:', errs.length ? errs.join(' || ') : 'none', '| h-overflow px:', overflow);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
