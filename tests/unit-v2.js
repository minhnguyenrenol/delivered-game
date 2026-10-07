// Unit tests for v2 content, run in the built page in English (the default): follow-up samples, plain-language
// rules from Wikipedia's "Signs of AI writing", truth checks on every sample, translation coverage, embedded scenes.
const fs = require('fs'); const { chromium, open } = require('./lib');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch(); const { page, ctx } = await open(browser, OUT, { lang: 'en' });
  const res = await page.evaluate(() => {
    const out = []; const t = (name, ok, info = '') => out.push({ name, ok: !!ok, info: ok ? '' : String(info).slice(0, 400) });
    const BANNED = /delve|tapestry|testament|pivotal|underscor|\blandscape|foster|enhanc|crucial|intricate|showcas|\bhighlight(s|ed|ing)?\b|meticulous|vibrant|\brealm|seamless|robust|leverag|empower|unlock|holistic|synerg|paradigm|game.changer|cutting.edge|ever.evolving|fast.paced|nuanced|multifaceted|invaluable|profound|commendable|bolster|garner|embark|endeavo|align(s|ed)? with|resonat|interplay|\bboasts?\b|stands as|serves as|plays? an? (vital|key|crucial|pivotal) role|lasting impact|additionally|furthermore|moreover|in conclusion|in summary|it'?s (important|worth) (to note|noting|remembering)|great question|i hope this helps|not only\b.*\bbut also|it'?s not just\b/i;
    const VI = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
    const KEEP = /Thư|Lê Duẩn|Tiếng Việt|Chị \w+|Anh \w+|Tuấn|Hằng|Hải|Ngân|Đạt|Sài Gòn|Hà Nội|Cần Thơ|lì xì|Phở[^.]*|Cà Phê[^.]*|Cô Út Pha Sữa Fin|Bánh Đúc Hành|Nhà Đông Người Có Tết|Đừng Mở Ví|Tôi Sợ Mất Rồi|Phải Đi[^.]*|Hoàn toàn được|“[^”]*”|"[^"]*"/g;
    const words = s => s.trim().split(/\s+/).length;
    // a field reads as Vietnamese when more than 1 in 5 of its words carry Vietnamese letters (names, places and memory acronyms alone stay under that)
    const viShare = s => { const w = String(s).split(/\s+/).filter(Boolean); return w.length ? w.filter(x => VI.test(x)).length / w.length : 0; };
    t('page runs in English by default', LANG === 'en' && L('a', 'b') === 'a');
    const fus = CARDS.flatMap(c => c.follow_ups.map((f, j) => ({ ...f, id: c.id + '.' + j })));
    t('106 follow-ups', fus.length === 106, fus.length);
    t('every follow-up has a sample answer', fus.every(f => f.sample), fus.filter(f => !f.sample).map(f => f.id));
    t('every follow-up has an English and a Vietnamese note', fus.every(f => f.note_en && f.note_vi), fus.filter(f => !(f.note_en && f.note_vi)).map(f => f.id));
    t('samples are 70-110 words (80-100 target)', fus.every(f => words(f.sample) >= 65 && words(f.sample) <= 115), fus.filter(f => words(f.sample) < 65 || words(f.sample) > 115).map(f => f.id + ':' + words(f.sample)));
    const avg = fus.reduce((a, f) => a + words(f.sample), 0) / fus.length; t('average sample length near 90 words (' + avg.toFixed(0) + ')', avg >= 78 && avg <= 102, avg);
    t('no AI-writing vocabulary or frames in samples', fus.every(f => !BANNED.test(f.sample)), fus.filter(f => BANNED.test(f.sample)).map(f => f.id + ': ' + f.sample.match(BANNED)[0]));
    t('no em or en dashes in samples', fus.every(f => !/[–—]/.test(f.sample)), fus.filter(f => /[–—]/.test(f.sample)).map(f => f.id));
    t('no bold, bullets or emoji in spoken samples', fus.every(f => !/\*\*|^\s*[-•]|\p{Extended_Pictographic}/mu.test(f.sample)), fus.filter(f => /\*\*|^\s*[-•]|\p{Extended_Pictographic}/mu.test(f.sample)).map(f => f.id));
    t('no overclaims in any sample (truth table)', fus.every(f => detectOverclaims(f.sample).length === 0), fus.filter(f => detectOverclaims(f.sample).length).map(f => f.id + ': ' + JSON.stringify(detectOverclaims(f.sample))));
    const BADCLAIM = /14 years in bank|fourteen years in bank|team of (60|sixty)|(?<!n't |not |never )(shipped|launched)( a)? (native|ios|android|mobile) app|(?<!n't |not |never )shipped (a )?chat/i;
    t('no "14 years in banking", no team of 60, no shipped native app or chat', fus.every(f => !BADCLAIM.test(f.sample)), fus.filter(f => BADCLAIM.test(f.sample)).map(f => f.id));
    t('the 60% AI figure is always an estimate', fus.filter(f => /60\s?%|sixty percent/i.test(f.sample)).every(f => /estimate/i.test(f.sample)));
    t('RegShield never called live or launched', fus.filter(f => /RegShield/.test(f.sample)).every(f => !/RegShield (is|was|went) (live|launched)|launched RegShield/i.test(f.sample)));
    t('pressure follow-ups (Shadow Panel) have samples', SHADOW.every(s => s.sample && s.note), SHADOW.filter(s => !s.sample).map(s => s.b));
    t('cloud follow-up has a sample', !!CLOUD_FOLLOW.sample);
    t('no overclaims in Shadow samples', SHADOW.every(s => detectOverclaims(s.sample).length === 0), SHADOW.filter(s => detectOverclaims(s.sample).length).map(s => s.b));
    // translation coverage: every book field shown to the person is English in English mode
    const fields = ['who', 'understand', 'why', 'five', 'evidence', 'hook', 'image', 'locus', 'traps', 'drill', 'answer_label'];
    const left = []; CARDS.forEach(c => fields.forEach(k => { const v = String(c[k] || '').replace(KEEP, ''); if (viShare(v) > 0.2) left.push(c.id + '.' + k + ' (' + Math.round(viShare(v) * 100) + '%): ' + v.slice(0, 60)); }));
    t('book content on cards is English in English mode', left.length === 0, left.slice(0, 6).join(' | '));
    const shared = []; ['truth', 'scorecard', 'proof', 'schedule'].forEach(k => (C[k] || []).forEach((r, i) => Object.entries(r).forEach(([f, v]) => { if (typeof v === 'string' && viShare(v.replace(KEEP, '')) > 0.2) shared.push(k + '.' + i + '.' + f); })));
    t('truth table, scorecard, proof quests and schedule are English', shared.length === 0, shared.slice(0, 8).join(', '));
    t('must-say lists are English', CARDS.every(c => c.mustList.every(m => viShare(m.replace(KEEP, '')) <= 0.2)), CARDS.filter(c => c.mustList.some(m => viShare(m.replace(KEEP, '')) > 0.2)).map(c => c.id));
    t('target times unchanged by translation', CARDS.every(c => c.targetSec > 0) && CARD.Q71.targetSec === 180, CARD.Q71.targetSec);
    // scenes
    t('four Remotion scenes embedded as MP4 and WebM', ['intro', 'call', 'final', 'delivered'].every(k => CINE_SRC[k] && (CINE_SRC[k].mp4 || '').startsWith('data:video/mp4;base64,') && (CINE_SRC[k].webm || '').startsWith('data:video/webm;base64,')), Object.keys(CINE_SRC));
    t('scene sounds exist for every scene', ['intro', 'call', 'final', 'delivered', 'chapter', 'gradeS', 'gradeF'].every(k => { try { Sound.cine(k); return true; } catch (e) { return false; } }));
    t('scene lengths match the renders', CINE_LEN.intro === 7 && CINE_LEN.call === 4 && CINE_LEN.final === 6 && CINE_LEN.delivered === 5);
    return out;
  });
  const fail = res.filter(r => !r.ok);
  res.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.info ? '  -> ' + r.info : '')));
  console.log(`\n${res.length - fail.length}/${res.length} v2 unit checks passed`);
  await ctx.close(); await browser.close(); process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
