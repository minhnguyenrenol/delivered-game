// Shared test harness: wraps delivered.html like the artifact host, serves CDN scripts from a local copy.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const VEND = process.env.VEND; // folder with node_modules/react, react-dom, htm, axe-core
const MAP = {
  'react.production.min.js': 'react/umd/react.production.min.js',
  'react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js',
  'htm.umd.js': 'htm/dist/htm.umd.js',
};
function wrappedFile(outDir) {
  const page0 = fs.readFileSync(path.join(__dirname, '..', 'delivered.html'), 'utf8');
  const w = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + page0 + '</body></html>';
  const f = path.join(outDir, 'wrapped.html'); fs.writeFileSync(f, w); return f;
}
// lang: 'vi' keeps the original Vietnamese-label suites working; 'en' is the shipped default. fresh: show the first-visit start screen.
async function open(browser, outDir, { viewport = { width: 1440, height: 900 }, colorScheme = 'light', init, lang = 'vi', fresh = false, motion = 'reduce' } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme, reducedMotion: motion });
  await ctx.addInitScript(`try { if (!sessionStorage.getItem('t.init')) { sessionStorage.setItem('t.init', '1'); ${lang === 'en' ? "localStorage.removeItem('delivered.lang');" : "localStorage.setItem('delivered.lang', 'vi');"} ${fresh ? '' : "localStorage.setItem('delivered.intro', '1');"} } } catch (e) {}`);
  await ctx.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/, r => { const k = Object.keys(MAP).find(k => r.request().url().endsWith(k)); return k ? r.fulfill({ path: path.join(VEND, 'node_modules', MAP[k]), contentType: 'application/javascript' }) : r.abort(); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('file://' + wrappedFile(outDir));
  await page.waitForSelector('.app', { timeout: 30000 });
  return { ctx, page, errs };
}
module.exports = { chromium, open };
