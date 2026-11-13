/* Language: English by default, Vietnamese on request. Chosen once per device; switching reloads so every table is rebuilt in the new language. */
const LANG = (() => { try { return localStorage.getItem('delivered.lang') === 'vi' ? 'vi' : 'en'; } catch (e) { return 'en'; } })();
const L = (en, vi) => (LANG === 'vi' ? vi : en);
function setLang(l) {
  try { localStorage.setItem('delivered.lang', l); } catch (e) { return; }
  Promise.resolve(typeof Store !== 'undefined' && Store.flush ? Store.flush() : null).catch(() => {}).finally(() => location.reload());
}
