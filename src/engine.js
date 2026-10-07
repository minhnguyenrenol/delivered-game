/* Engine: content derivation, persistence, scheduling, grading. */
/* Dash normalising for display: ranges take a hyphen, em-dash asides become commas. */
const undash = v => v.replace(/(\d)\s?[–—]\s?(\d)/g, '$1-$2').replace(/([A-Za-zÀ-ỹ0-9])–(\d)/g, '$1-$2').replace(/\s+—\s+/g, ', ').replace(/\s+–\s+/g, ', ').replace(/—/g, '-').replace(/–/g, '-');
const C = JSON.parse(document.getElementById('content').textContent, (k, v) => typeof v === 'string' ? undash(v) : v);
// English overlay: path -> text for every Vietnamese string in the book content (built by build.py from i18n/en-*.json)
(function applyLang() {
  const ov = C._en || {}; delete C._en;
  if (LANG !== 'en') return;
  for (const path in ov) { const ks = path.split('.'); let o = C; for (let i = 0; i < ks.length - 1 && o; i++) o = o[ks[i]]; if (o && typeof o[ks[ks.length - 1]] === 'string') o[ks[ks.length - 1]] = ov[path]; }
})();

/* ---------- markdown-lite (book text is trusted local content) ---------- */
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
function md(src) {
  if (!src) return '';
  const lines = String(src).replace(/\r/g, '').split('\n');
  let out = [], para = [], list = null, table = null;
  const flushP = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flushL = () => { if (list) { out.push('<' + list.t + '>' + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + '</' + list.t + '>'); list = null; } };
  const flushT = () => { if (table) {
    const rows = table.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r)).map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    const [h, ...b] = rows;
    if (!h) { table = null; return; }
    out.push('<div class="tablewrap"><table><thead><tr>' + h.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
      b.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
    table = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd();
    if (/^\s*\|/.test(l)) { flushP(); flushL(); (table = table || []).push(l); continue; } else flushT();
    let m;
    if (!l.trim()) { flushP(); flushL(); continue; }
    if ((m = l.match(/^\s*[-•]\s+(.*)/))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = l.match(/^\s*\d+\.\s+(.*)/))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = l.match(/^>\s?(.*)/))) { flushP(); flushL(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
    if ((m = l.match(/^#{2,4}\s+(.*)/))) { flushP(); flushL(); out.push('<h4>' + inline(m[1]) + '</h4>'); continue; }
    if (list && /^\s{2,}/.test(raw)) { list.items[list.items.length - 1] += ' ' + l.trim(); continue; }
    flushL(); para.push(l.trim());
  }
  flushP(); flushL(); flushT();
  return out.join('');
}
const plain = s => String(s ?? '').replace(/\*\*|\*|`/g, '').replace(/\s+/g, ' ').trim();

/* ---------- derived content ---------- */
function personaFor(c) {
  const who = c.who || '';
  const keys = LANG === 'vi'
    ? [['linh', /Chị Linh|\bTA\b/], ['khoa', /Anh Khoa|\bHM\b/], ['mai', /Chị Mai|\bPM\b/], ['tuan', /Anh Tuấn|Mobile/], ['vy', /\bVy\b/],
      ['hai', /Anh Hải|\bEng\b/], ['hang', /Chị Hằng|Security/], ['ceo', /CEO/], ['ngan', /Chị Ngân|HRBP/]]
    // English overlay may drop or change the Chị/Anh honorifics, so bare names count too
    : [['linh', /Chị Linh|\bLinh\b|\bTA\b/], ['khoa', /Anh Khoa|\bKhoa\b|\bHM\b/], ['mai', /Chị Mai|\bMai\b|\bPM\b/], ['tuan', /Anh Tuấn|Tuấn|\bTuan\b|Mobile/], ['vy', /\bVy\b/],
      ['hai', /Anh Hải|Hải|\bHai\b|\bEng\b/], ['hang', /Chị Hằng|Hằng|\bHang\b|Security/], ['ceo', /CEO/], ['ngan', /Chị Ngân|Ngân|\bNgan\b|HRBP|\bHR\b/]];
  let best = null, bi = 1e9;
  for (const [k, re] of keys) { const m = who.match(re); if (m && m.index < bi) { bi = m.index; best = k; } }
  return best || ROOM_DEFAULT_PERSONA[c.room];
}
function targetFor(c) {
  if (c.n === 68) return 45;
  const lab = c.answer_label || '';
  let m = lab.match(/(\d+)[\s-]*(?:giây|seconds?|secs?)\b/); if (m) return +m[1];
  m = lab.match(/(\d+)[\s-]*(?:phút|minutes?|mins?)\b/); if (m) return +m[1] * 60;
  if (c.n === 1) return 90;
  if (c.n === 67) return 60;
  return ['C', 'G', 'H'].includes(c.room) || c.diff >= 5 ? 120 : 90;
}
function pendingFor(c) {
  const ev = c.evidence || '';
  const parts = ev.split(/(?=✅|🟨|🟦)/u);
  const out = [];
  parts.forEach(p => {
    const kind = p.startsWith('🟨') ? 'confirm' : p.startsWith('🟦') ? 'do' : null;
    if (!kind) return;
    let t = plain(p.replace(/^(🟨|🟦)\s*/u, '')).replace(/^[:\-–\s]+/, '');
    if (t.length > 260) t = t.slice(0, 257) + '…';
    if (t) out.push({ id: 'Q' + c.n + '-' + out.length, kind, text: t });
  });
  return out;
}
function mustItems(c) {
  const t = plain(c.must);
  const parts = t.split(/\(\d\)\s*/).map(s => s.replace(/[;.]\s*$/, '').trim()).filter(Boolean);
  return parts.length ? parts : [t];
}
const OPENER_FIX = { 67: 'I have two questions, if that’s okay.' };
const CARDS = C.cards.map(c => ({ ...c, id: 'Q' + c.n, opener: c.opener || OPENER_FIX[c.n] || '', persona: personaFor(c), sticker: STICKERS[c.n],
  targetSec: targetFor(c), pending: pendingFor(c), mustList: mustItems(c) }));
const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
const QF = C.quickfire.map(q => ({ ...q, id: 'QF' + q.n, blocked: /🟨/.test(q.a + q.note) || /\[🟨/.test(q.a) }));
const SCHED = Object.fromEntries(C.schedule.map(d => [d.day, d]));
const ALL_PENDING = CARDS.flatMap(c => c.pending.map(p => ({ ...p, card: c.id })));

/* ---------- state ---------- */
const SR_GAP = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 14 };
const BOX_NAME = ['Inbox', 'Unread', 'Read', 'Pinned', 'Archived'];
const GRADE_N = { S: 5, A: 4, B: 3, C: 2, F: 1 };
function freshState() {
  const trust = {}; Object.keys(PERSONAS).forEach(k => { if (!['thu', 'self'].includes(k)) trust[k] = 40; });
  return { v: 1, createdAt: Date.now(), updatedAt: Date.now(), day: 1, days: {}, cards: {}, qf: {}, trust, xp: 0, streak: 0, best: 0, freezes: 2,
    lastClosed: null, ledger: {}, checks: {}, qfFill: {}, proof: {}, extra: { critique: false, demo: false }, numbers: {}, drills: {},
    boss: {}, scripts: {}, settings: { lockOff: false, rounds: {} }, debrief: [], stickers: {}, coachLog: [] };
}
const todayISO = (d = new Date()) => { const x = new Date(d.getTime() - 5 * 3600e3); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

const Store = {
  db: null, uid: null, ref: null, mode: 'local', timer: null, pending: null, listeners: new Set(),
  async init() {
    let local = null;
    try { local = JSON.parse(localStorage.getItem('delivered.v1') || 'null'); } catch (e) {}
    let remote = null;
    try {
      if (window.claude && claude.use) {
        const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
        const uid = user ? await user.id() : null;
        if (db && uid) {
          this.db = db; this.uid = uid; this.ref = db.doc('data/users/' + uid + '/progress');
          const snap = await this.ref.get();
          if (snap.exists) remote = snap.data().state ? JSON.parse(snap.data().state) : null;
          this.mode = 'cloud';
        }
      }
    } catch (e) { console.warn('db unavailable', e); }
    let st = remote && local ? (local.updatedAt > remote.updatedAt ? local : remote) : (remote || local || freshState());
    return Object.assign(freshState(), st);
  },
  save(state) {
    state.updatedAt = Date.now();
    try { localStorage.setItem('delivered.v1', JSON.stringify(state)); } catch (e) {}
    if (!this.ref) return;
    this.pending = state;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 1200);
  },
  async flush() {
    if (!this.ref || !this.pending || this.busy) return;
    const s = this.pending; this.pending = null; this.busy = true;
    try { await this.ref.set({ state: JSON.stringify(s), day: s.day, updatedAt: s.updatedAt }); this.lastSync = Date.now(); this.emit(); }
    catch (e) { console.warn('save failed', e); this.err = e.code || 'error'; this.emit(); }
    this.busy = false;
    if (this.pending) this.flush();
  },
  async saveAnswer(cardId, entry) {
    try {
      const k = 'delivered.ans.' + cardId; const prev = JSON.parse(localStorage.getItem(k) || '[]');
      const list = [entry, ...prev].slice(0, 4); localStorage.setItem(k, JSON.stringify(list));
      if (this.db && this.uid) await this.db.doc('data/users/' + this.uid + '/ans-' + cardId).set({ list });
    } catch (e) {}
  },
  async answers(cardId) {
    try {
      if (this.db && this.uid) { const s = await this.db.doc('data/users/' + this.uid + '/ans-' + cardId).get(); if (s.exists) return s.data().list || []; }
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem('delivered.ans.' + cardId) || '[]'); } catch (e) { return []; }
  },
  emit() { this.listeners.forEach(f => f()); },
};

/* ---------- scheduling ---------- */
function cs(state, id) { return state.cards[id] || { box: 0, due: null, att: [] }; }
function isLearned(state, id) { return (cs(state, id).att || []).length > 0; }
function dueToday(state, day) {
  const sch = SCHED[day];
  const fromBook = sch ? sch.review_ids.map(n => 'Q' + n) : [];
  const sr = CARDS.filter(c => { const x = state.cards[c.id]; return x && x.due != null && x.due <= day && x.box > 0; }).map(c => c.id);
  const set = [...new Set([...fromBook.filter(id => isLearned(state, id) || true), ...sr])];
  const newIds = new Set(sch ? sch.new_ids.map(n => 'Q' + n) : []);
  return set.filter(id => !newIds.has(id)).sort((a, b) => cs(state, a).box - cs(state, b).box || (lastGrade(state, a) - lastGrade(state, b)));
}
function lastGrade(state, id) { const a = cs(state, id).att || []; return a.length ? GRADE_N[a[a.length - 1].g] || 0 : 0; }
function bestGrade(state, id) { const a = cs(state, id).att || []; return a.reduce((m, x) => Math.max(m, GRADE_N[x.g] || 0), 0); }
function moveBox(prev, recall, grade, panel) {
  let box = prev.box || 0; const g = GRADE_N[grade] || 0;
  const att = prev.att || [];
  const lastA = att.length && GRADE_N[att[att.length - 1].g] >= 4;
  if (grade === 'F') box = 1;
  else if (recall === 'blank') box = Math.max(1, box >= 3 ? 2 : 1);
  else if (box <= 1) box = recall === 'had' && g >= 3 ? 2 : 1;
  else if (box === 2) box = recall === 'had' && g >= 4 ? 3 : g < 3 ? 1 : 2;
  else if (box === 3) box = recall === 'had' && g >= 4 && lastA ? 4 : 3;
  else if (box === 4 && panel && g <= 2) box = 1;
  return box;
}
function recordAttempt(state, id, a) {
  const prev = cs(state, id);
  const box = moveBox(prev, a.recall, a.g, a.panel);
  const att = [...(prev.att || []), { d: state.day, g: a.g, p: a.pct, m: a.mode, panel: !!a.panel, s: a.sec || 0, w: a.words || 0, r: a.recall, t: Date.now() }].slice(-12);
  state.cards[id] = { ...prev, box, due: state.day + SR_GAP[box], att, seen: true };
  if (box >= 2 && !state.stickers[id]) state.stickers[id] = 'got';
  if (box === 4) state.stickers[id] = 'gold';
  return box;
}

/* ---------- truth ---------- */
function openPending(state, cardId) { return CARD[cardId].pending.filter(p => !state.checks[p.id]); }
function detectOverclaims(text) {
  const hits = [];
  for (const o of OVERCLAIMS) {
    const m = text.match(o.re); if (!m) continue;
    const ctx = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 10);
    if (o.neg && o.neg.test(ctx)) continue;
    hits.push({ id: o.id, quote: m[0], fix: o.fix });
  }
  return hits;
}
function ledgerClaims(state, text) {
  const hits = [];
  if (!state.proof.P2?.done && /\b(tore|torn|i'?ve)\b[^.]{0,20}\b(down|teardown)\b|teardown of (zalo|telegram|signal)/i.test(text) && !/\b(will|would|plan|going to)\b/i.test(text))
    hits.push({ id: 'P2', quote: 'teardown', fix: 'Your Files say the P2 teardown isn’t done. Do it tonight, or drop the sentence.' });
  if (!state.proof.P1?.done && /\b(sketched|built|prototyped|designed)\b[^.]{0,40}\b(concept|message[- ]request|prototype)\b/i.test(text) && !/\b(will|would|plan|going to)\b/i.test(text))
    hits.push({ id: 'P1', quote: 'chat concept', fix: 'You said you’ve built or sketched the chat concept. Your Files say P1 isn’t done. Either do it, or drop the sentence.' });
  if (!state.proof.P3?.done && /\btested with (five|5) (people|users)\b/i.test(text))
    hits.push({ id: 'P3', quote: 'tested with five people', fix: 'P3 (5-person test) isn’t marked done yet.' });
  return hits;
}

/* ---------- grading ---------- */
const STOP = new Set('the a an and or of to in on for with that this is are was were be been it its i i\'m im my me we our you your they their at as by from so but not have has had do does did what which who how why when where there here than then just about into over also very really more most can could would will shall should may might like'.split(' '));
const toks = s => plain(s).toLowerCase().replace(/[^\p{L}\p{N}\s%+→]/gu, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
function overlap(a, b) { const A = new Set(toks(a)), B = toks(b); if (!B.length) return 0; let h = 0; B.forEach(w => { if (A.has(w)) h++; }); return h / B.length; }
function lengthFactor(sec, target) { return sec <= target ? 1 : sec <= target * 1.5 ? 0.85 : 0.6; }
function gradeFrom(pct, five, truth) {
  if (truth === 0) return 'F';
  if (pct >= 0.9) return five ? 'S' : 'A';
  if (pct >= 0.75) return 'A'; if (pct >= 0.5) return 'B'; return 'C';
}
function applyCaps(result, caps) {
  const order = ['F', 'C', 'B', 'A', 'S'];
  let g = result.grade;
  for (const cap of caps) if (order.indexOf(g) > order.indexOf(cap.g)) { g = cap.g; result.capped = cap.why; }
  result.grade = g; return result;
}
function ruleGrade(card, text, sec, state) {
  const words = (text.match(/\S+/g) || []).length;
  const first = (text.split(/(?<=[.!?])\s/)[0] || '');
  const sim = overlap(first, card.opener);
  const S = sim >= 0.45 ? 4 : sim >= 0.25 ? 3 : sim >= 0.12 ? 2 : overlap(text, card.opener) > 0.4 ? 1 : 0;
  const mustHit = card.mustList.map(m => overlap(text, m) >= 0.34);
  const hasNum = /\d/.test(text), hasProj = /(cyberhythm|regshield|nab|lseg|eikon|hearti|wallet|stablecoin|fulfil|merchant|sle|toastmasters|adplist|mica|capstone|design system)/i.test(text);
  const E = hasNum && hasProj ? 4 : hasNum || hasProj ? 2 : 0;
  const nHits = (text.match(/\b(i decided|i chose|decision|turn(ed)?|mistake|wrong|learned|learnt|first version|realis|realiz|instead|trade-?off|i changed)\b/gi) || []).length;
  const N = nHits >= 2 ? 4 : nHits === 1 ? 2 : 0;
  const dHits = new Set((text.match(/\b(qualgo|vietnam|scam|chat|messag\w*|your (users|product|team)|trust)\b/gi) || []).map(x => x.toLowerCase())).size;
  const D = dHits >= 2 ? 4 : dHits === 1 ? 2 : 0;
  const lf = lengthFactor(sec || words / 2.2, card.targetSec);
  const over = [...detectOverclaims(text), ...ledgerClaims(state, text)];
  const T = over.length ? 0 : 2;
  const pct = ((S + E + N + D) / 16) * lf;
  let grade = gradeFrom(pct, false, T);
  if (mustHit.every(x => !x) && grade !== 'F') grade = ['S', 'A'].includes(grade) ? 'B' : grade;
  const missing = card.mustList.find((m, i) => !mustHit[i]);
  return { scores: { S, E, N, D, T }, lf, pct, grade, mustHit, five: false, overclaims: over, words, provisional: true,
    strength: S >= 3 ? 'Your first sentence carries the signal. That’s the strongest five seconds you can give.' : E >= 4 ? 'You named a real project and a number. That’s evidence, not adjectives.' : 'You answered in your own words. That’s the base to build on.',
    fix: over.length ? over[0].fix : S < 3 ? 'Lead with the opener: “' + card.opener + '”' : missing ? 'You missed a must-say: ' + missing + '.' : lf < 1 ? 'Too long for the target. Cut the process, keep the decision.' : 'Add the bridge to Qualgo in the last sentence.',
    stronger: card.opener, follow_up: null };
}

const GRADE_PROMPT = (card, text, sec, state, persona) => `You are "Coach Thư", a design director with 25+ years on Lead Product Designer hiring panels in Southeast Asia. Grade a PRACTICE answer by Minh for a Lead Product Designer interview at Qualgo (a cybersecurity R&D company building an AI-powered secure messenger for a mass audience in Vietnam).

Use the SEND rubric exactly (each 0–4):
S Signal: first sentence is the answer (matches the card's opener in meaning) = 4; point mid-answer = 2; buried = 0.
E Evidence: a specific project + a number, correctly labelled (live/MVP, measured/estimate) = 4; generic = 2; none = 0.
N Narrative: a decision, a turn and one imperfect detail = 4; some story = 2; list of facts = 0.
D Deliver to Qualgo: specific bridge to their world (scams, chat, trust, G-local, on-device AI) = 4; generic = 2; none = 0.
T Truth: 0 if any claim contradicts FACTS or matches the OVERCLAIM list; 1 if an estimate is unlabelled; 2 if all claims are labelled and consistent.
Check MUST_SAY points semantically. Check FIVE ${L('(the 5/5 criterion)', '(the 5/5 criterion, written in Vietnamese)')} and say whether it is met.
Be specific and kind. Never flatter. Quote Minh's own words in the strength. One strength, one fix (the single most valuable change), one stronger line in Minh's voice (max 30 words, English), never more than 70 words total across strength+fix. Write strength and fix in English. ${L('Add "vi": one short, plain English sentence of encouragement (no dashes) only if the answer is excellent, else "".', 'Add "vi": one short Vietnamese sentence of encouragement only if the answer is excellent, else "".')}

FACTS (source of truth about Minh):
${FACTS.map(f => '- ' + f).join('\n')}
OVERCLAIMS (any of these = T 0): "14 years in banking"; "RegShield launched/live"; "shipped a mobile app" or wallet on app stores; "I led 60 people" / a team of 60; "measured 60%"; "my product had 400k users"; "shipped a chat app"; claiming a chat teardown/concept/user test that is not done.
DONE ARTEFACTS: ${Object.entries(state.proof).filter(([, v]) => v.done).map(([k]) => k).join(', ') || 'none yet'} (P1 chat concept, P2 teardown, P3 5-person test; anything not listed is NOT done).

CARD ${card.id} (asked by ${PERSONAS[persona].name}, ${PERSONAS[persona].role}): "${card.q}"
OPENER: "${card.opener}"
MUST_SAY: ${card.mustList.map((m, i) => '(' + (i + 1) + ') ' + m).join('; ')}
FIVE: ${plain(card.five)}
MODEL ANSWER (for reference only, do not require its exact words): ${plain(card.answer).slice(0, 1600)}
TARGET_SECONDS: ${card.targetSec}  ACTUAL_SECONDS: ${Math.round(sec)}  WORDS: ${(text.match(/\S+/g) || []).length}

PLAYER_RESPONSE:
"""${text.slice(0, 4000)}"""

Reply with ONLY this JSON:
{"scores":{"S":0,"E":0,"N":0,"D":0,"T":2},"must_say_hit":[true,false,true],"five_met":false,"strength":"...","fix":"...","stronger_line":"...","overclaims":["exact quote"],"vi":""}`;

async function getSample() { try { return window.claude && claude.use ? await claude.use('sample') : null; } catch (e) { return null; } }
async function coachGrade(card, text, sec, state, persona, signal) {
  const base = ruleGrade(card, text, sec, state);
  const sample = await getSample();
  if (!sample) return { ...base, note: L('Quick grade by rules (Coach AI isn’t available in this view).', 'Chấm nhanh bằng luật (Coach AI chưa sẵn sàng ở chế độ xem này).') };
  try {
    const j = await sample.json(GRADE_PROMPT(card, text, sec, state, persona), { signal, modelTier: 'default' });
    const sc = j && j.scores; if (!sc) throw new Error('shape');
    const n = k => Math.max(0, Math.min(4, Math.round(+sc[k] || 0)));
    const S = n('S'), E = n('E'), N = n('N'), D = n('D');
    let T = Math.max(0, Math.min(2, Math.round(sc.T ?? 2)));
    const rule = [...detectOverclaims(text), ...ledgerClaims(state, text)];
    if (rule.length) T = 0;
    const lf = lengthFactor(sec || base.words / 2.2, card.targetSec);
    const pct = ((S + E + N + D) / 16) * lf;
    const mustHit = Array.isArray(j.must_say_hit) ? card.mustList.map((_, i) => !!j.must_say_hit[i]) : base.mustHit;
    let grade = gradeFrom(pct, !!j.five_met, T);
    if (mustHit.every(x => !x) && grade !== 'F') grade = ['S', 'A'].includes(grade) ? 'B' : grade;
    const over = [...rule, ...(Array.isArray(j.overclaims) ? j.overclaims.filter(Boolean).map(q => ({ id: '?', quote: String(q), fix: '' })) : [])];
    return { scores: { S, E, N, D, T }, lf, pct, grade, mustHit, five: !!j.five_met, overclaims: T === 0 ? over : [], words: base.words,
      strength: String(j.strength || base.strength), fix: String((rule[0] && rule[0].fix) || j.fix || base.fix), stronger: String(j.stronger_line || base.stronger), vi: String(j.vi || ''), provisional: false };
  } catch (e) {
    if (e && e.code === 'cancelled') return { ...base, note: L('Stopped. This is the quick grade by rules.', 'Đã dừng. Kết quả chấm nhanh bằng luật.') };
    return { ...base, note: e && e.code === 'not_granted' ? L('Coach AI isn’t allowed yet. This is the quick grade by rules.', 'Coach AI chưa được cho phép. Kết quả chấm nhanh bằng luật.') : L('Coach AI didn’t answer in time. This is the quick grade by rules (for now).', 'Coach AI không trả lời kịp. Kết quả chấm nhanh bằng luật (tạm).') };
  }
}
function selfGrade(card, checks, sec, state) {
  const S = checks.signal ? 4 : 1, E = checks.evidence ? 4 : 1, N = checks.narrative ? 4 : 1, D = checks.deliver ? 4 : 1;
  const T = checks.overclaim ? 0 : 2;
  const lf = lengthFactor(sec || card.targetSec, card.targetSec);
  const pct = ((S + E + N + D) / 16) * lf;
  const mustHit = card.mustList.map((_, i) => !!checks['m' + i]);
  let grade = gradeFrom(pct, !!checks.five, T);
  if (mustHit.every(x => !x) && grade !== 'F') grade = ['S', 'A'].includes(grade) ? 'B' : grade;
  const missing = card.mustList.find((m, i) => !mustHit[i]);
  return { scores: { S, E, N, D, T }, lf, pct, grade, mustHit, five: !!checks.five, overclaims: checks.overclaim ? [{ id: 'self', quote: L('self-reported', 'tự báo'), fix: L('You flagged a detail you haven’t checked yet. Fix that line before next time.', 'Bạn tự báo một chi tiết chưa xác minh. Sửa câu đó trước lần sau.') }] : [], self: true,
    strength: checks.signal ? 'You opened with the signal. Keep that first sentence exactly.' : 'You got through it out loud. Reps like this are the whole game.',
    fix: checks.overclaim ? 'Drop or label the claim you flagged. An overclaim costs more than a gap.' : !checks.signal ? 'Next time, say the opener first: “' + card.opener + '”' : missing ? 'Must-say missing: ' + missing + '.' : lf < 1 ? 'Over time. Cut the process, keep the decision.' : !checks.five ? L('You’re close. Re-read “To get 5/5” and aim at that one thing.', 'You’re close. Re-read “Để đạt 5/5” and aim at that one thing.') : 'That’s a 5/5 shape. Do it again under a panel.',
    stronger: card.opener, provisional: false };
}

function ticksFor(g) { return g === 'F' ? 'fail' : g === 'C' ? 'sent' : g === 'B' ? 'delivered' : g === 'A' ? 'read' : 'typing'; }
function bandFor(g) { return g === 'S' || g === 'A' ? 'SA' : g === 'B' ? 'B' : 'C'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

/* ---------- scorecard ---------- */
function rowStatus(state, row) {
  const qs = row.q_ids.map(n => 'Q' + n);
  const qInfo = qs.map(id => {
    const att = cs(state, id).att || [];
    const sDays = new Set(att.filter(a => a.g === 'S').map(a => a.d));
    const sPanel = att.some(a => a.g === 'S' && a.panel);
    return { id, sCount: sDays.size, sPanel, ok: sDays.size >= 2 && sPanel, best: bestGrade(state, id), pend: openPending(state, id).length };
  });
  const arts = [...row.p_ids];
  if (row.row === 18) arts.push('critique');
  if (row.row === 21) arts.push('demo');
  const artOk = arts.map(a => ({ a, ok: a === 'critique' ? !!state.extra.critique : a === 'demo' ? !!state.extra.demo : !!state.proof[a]?.done }));
  const g1 = qInfo.every(q => q.ok), g2 = artOk.every(a => a.ok), g3 = qInfo.every(q => q.pend === 0);
  const base = parseFloat(String(row.today).replace(',', '.')) || 3;
  const avgBest = qInfo.reduce((s, q) => s + q.best, 0) / qInfo.length;
  let lvl = base;
  if (avgBest >= 3) lvl = Math.max(lvl, Math.min(4, base + (avgBest - 2.5)));
  if (g1 && g2 && g3) lvl = 5;
  else { if (!g3) lvl = Math.min(lvl, 3); if (!g2) lvl = Math.min(lvl, 4); if (!g1) lvl = Math.min(lvl, 4.5); }
  lvl = Math.round(lvl * 2) / 2;
  let next = '';
  const pendQ = qInfo.find(q => q.pend);
  const missA = artOk.find(a => !a.ok);
  const notS = qInfo.find(q => !q.ok);
  if (pendQ) next = L('Confirm the 🟨 items for ' + pendQ.id + ' in Minh → Minh.', 'Xác nhận mục 🟨 của ' + pendQ.id + ' trong Minh → Minh.');
  else if (missA) next = missA.a === 'critique' ? L('Log one real critique session with 2 designers.', 'Ghi lại một buổi critique thật với 2 designer.') : missA.a === 'demo' ? L('Add a 2-minute AI demo (no NAB data) to Files.', 'Thêm demo AI 2 phút (không dữ liệu NAB) vào Files.') : L('Finish ' + missA.a + ' in Files.', 'Hoàn thành ' + missA.a + ' trong Files.');
  else if (notS) next = notS.sCount === 0 ? L('Get an S on ' + notS.id + '.', 'Đạt S ở ' + notS.id + '.') : notS.sCount === 1 && !notS.sPanel ? L('Get an S on ' + notS.id + ' in a group call.', 'Đạt S ở ' + notS.id + ' trong một cuộc gọi nhóm.') : L('Get an S on ' + notS.id + ' on one more day.', 'Đạt S ở ' + notS.id + ' thêm một ngày khác.');
  return { lvl, g1, g2, g3, qInfo, artOk, next, done: g1 && g2 && g3 };
}
