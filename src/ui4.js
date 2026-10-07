/* v2: cinematic scenes (rendered with Remotion, embedded as video), screen effects, and rehearsal runs. */
const CINE_SRC = (() => { try { return JSON.parse(document.getElementById('cine').textContent); } catch (e) { return {}; } })();
const CINE_LEN = { intro: 7, call: 4, final: 6, delivered: 5, chapter: 1.8 };
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cinePref = { get() { try { return localStorage.getItem('delivered.cine') !== 'off'; } catch (e) { return true; } }, set(on) { try { localStorage.setItem('delivered.cine', on ? 'on' : 'off'); } catch (e) {} } };
const CineBus = { cur: null, fx: null, subs: new Set(), emit() { this.subs.forEach(f => f()); } };

/* Picks one file the browser can decode: H.264 where it is supported (Safari, Chrome, Edge), VP9 WebM otherwise. */
function cineSrc(key) {
  const s = CINE_SRC[key]; if (!s) return null;
  const v = document.createElement('video');
  const h264 = v.canPlayType('video/mp4; codecs="avc1.42E01E"') === 'probably';
  const vp9 = !!v.canPlayType('video/webm; codecs="vp9"');
  return (h264 && s.mp4) || (vp9 && s.webm) || s.mp4 || s.webm || null;
}
/* Plays a scene over everything. Resolves when it ends or is skipped. Off when the person chose so or prefers reduced motion. */
function playCine(key, o = {}) {
  if (!cinePref.get() || reducedMotion()) return Promise.resolve();
  if (CineBus.cur) CineBus.cur.done();
  return new Promise(res => {
    const item = { key, title: o.title || '', sub: o.sub || '', id: Date.now() + Math.random(), done: () => { if (CineBus.cur === item) { CineBus.cur = null; CineBus.emit(); } res(); } };
    CineBus.cur = item; CineBus.emit();
  });
}
/* Short screen effect for a grade: a light sweep for S, a jolt for F. */
function cineGrade(g) {
  if (g !== 'S' && g !== 'F') return;
  Sound.cine(g === 'S' ? 'gradeS' : 'gradeF');
  if (reducedMotion()) return;
  CineBus.fx = { g, id: Date.now() }; CineBus.emit();
  setTimeout(() => { CineBus.fx = null; CineBus.emit(); }, 900);
}

function CineHost() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(x => x + 1); CineBus.subs.add(f); return () => CineBus.subs.delete(f); }, []);
  const cur = CineBus.cur, fx = CineBus.fx;
  return html`<${Fragment}>
    ${fx && html`<div key=${fx.id} className=${'fxlayer fx-' + fx.g} aria-hidden="true"></div>`}
    ${cur && html`<${CineScene} key=${cur.id} item=${cur} />`}
  </${Fragment}>`;
}

function CineScene({ item }) {
  const vid = useRef(null); const btn = useRef(null);
  const src = cineSrc(item.key);
  const [failed, setFailed] = useState(!src);
  useEffect(() => {
    Sound.cine(item.key);
    const t = setTimeout(item.done, (CINE_LEN[item.key] || 4) * 1000 + 600); /* safety net if the video never ends */
    const k = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.done(); } };
    document.addEventListener('keydown', k); btn.current && btn.current.focus();
    return () => { clearTimeout(t); document.removeEventListener('keydown', k); };
  }, []);
  useEffect(() => { if (vid.current) { const p = vid.current.play(); p && p.catch(() => setFailed(true)); } }, []);
  const label = item.title || L('Scene', 'Cảnh');
  return html`<div className=${'cine cine-' + item.key + (failed ? ' cine-css' : '')} role="dialog" aria-modal="true" aria-label=${label} onClick=${item.done}>
    ${src && !failed && html`<video ref=${vid} className="cine-video" src=${src} muted=${true} playsInline=${true} autoPlay=${true} preload="auto" onEnded=${item.done} onError=${() => setFailed(true)} aria-hidden="true"></video>`}
    ${failed && html`<div className="cine-fallback" aria-hidden="true"><svg viewBox="0 0 40 24" width="120" height="72"><path d="M2 13 L9 20 L22 4" /><path d="M15 17 L18 20 L36 4" /></svg></div>`}
    <div className="cine-bars" aria-hidden="true"><i></i><i></i></div>
    ${(item.title || item.sub) && html`<div className="cine-title">${item.title && html`<b>${item.title}</b>`}${item.sub && html`<span>${item.sub}</span>`}</div>`}
    <button type="button" ref=${btn} className="cine-skip" onClick=${e => { e.stopPropagation(); item.done(); }}>${L('Skip', 'Bỏ qua')}</button>
  </div>`;
}

/* First visit: a start screen, so the opening scene can play with sound (browsers need one tap first). */
function StartGate({ onStart }) {
  return html`<div className="startgate" role="dialog" aria-modal="true" aria-label="Delivered">
    <div className="sg-inner">
      <span className="brand sg-brand">Delivered<${Ticks} kind="read" /></span>
      <p>${L('Fourteen evenings, one hour each, to get ready for the Qualgo Lead Product Designer interview.', 'Mười bốn buổi tối, mỗi buổi một giờ, để sẵn sàng cho buổi phỏng vấn Lead Product Designer ở Qualgo.')}</p>
      <${Btn} onClick=${onStart}>${L('Start, with sound', 'Bắt đầu, có âm thanh')}</${Btn}>
      <button type="button" className="linkbtn" onClick=${() => { Sound.set('sfx', false); Sound.set('music', false); onStart(true); }}>${L('Start quietly', 'Bắt đầu, không âm thanh')}</button>
    </div>
  </div>`;
}
const introSeen = { get() { try { return localStorage.getItem('delivered.intro') === '1'; } catch (e) { return true; } }, set() { try { localStorage.setItem('delivered.intro', '1'); } catch (e) {} } };
function playIntro() { return playCine('intro', { title: 'Delivered ✓✓', sub: L('Floor 18, mPlaza Saigon. Your interview is in 14 days.', 'Tầng 18, mPlaza Sài Gòn. Buổi phỏng vấn còn 14 ngày nữa.') }); }

/* Rehearsal: run any list of learned questions again, one after another, in practice mode (follow-ups included). */
function Rehearse({ ids, state, update, title, onClose }) {
  const [i, setI] = useState(0); const [order] = useState(ids);
  if (!order.length) return html`<p className="small dim">${L('Nothing to rehearse yet.', 'Chưa có câu nào để luyện lại.')}</p>`;
  if (i >= order.length) return html`<div className="rehearse done">
    <${SysPill}>${L('Rehearsal done: ' + order.length + (order.length === 1 ? ' question' : ' questions'), 'Đã luyện lại xong ' + order.length + ' câu')}</${SysPill}>
    <div className="actions"><${Btn} kind="ghost" onClick=${() => setI(0)}>${L('Run it again', 'Luyện lại lần nữa')}</${Btn}>${onClose && html`<button type="button" className="linkbtn" onClick=${onClose}>${L('Close', 'Đóng')}</button>`}</div>
  </div>`;
  const c = CARD[order[i]];
  return html`<div className="rehearse">
    <div className="seghead"><span>${title || L('Rehearsal', 'Luyện lại')}</span><${Progress} i=${i} n=${order.length} /></div>
    <${CardRun} key=${'rh' + c.id + i} card=${c} state=${state} update=${update} mode="practice" onDone=${() => setI(i + 1)} />
    <div className="actions"><button type="button" className="linkbtn" onClick=${() => setI(i + 1)}>${L('Skip this one', 'Bỏ qua câu này')}</button>${onClose && html`<button type="button" className="linkbtn" onClick=${onClose}>${L('Stop', 'Dừng')}</button>`}</div>
  </div>`;
}
function RehearseButton({ ids, state, update, label, title }) {
  const [on, setOn] = useState(false);
  const learned = ids.filter(id => isLearned(state, id));
  if (!learned.length) return null;
  if (on) return html`<${Rehearse} ids=${learned} state=${state} update=${update} title=${title} onClose=${() => setOn(false)} />`;
  return html`<div className="actions left"><${Btn} kind="ghost" onClick=${() => setOn(true)}><${Icon} n="spark" size=${16} /> ${label || L('Rehearse these ' + learned.length, 'Luyện lại ' + learned.length + ' câu này')}</${Btn}></div>`;
}

/* Full script: the whole model answer and every follow-up with its sample answer, for reading before or after a run. */
function FullScript({ card }) {
  return html`<div className="fullscript">
    <div className="label">${L('Opener', 'Câu mở đầu')}</div><b className="fs-open">“${card.opener}”</b>
    <div className="label">${L('Sample answer', 'Câu trả lời mẫu')} · ${fmt(card.targetSec)}</div><${Md} src=${card.answer} className="answer" />
    <div className="label">${L('Why it works', 'Vì sao hiệu quả')}</div><${Md} src=${card.why} className="small" />
    ${card.follow_ups.length > 0 && html`<div className="label">${L('Follow-up questions', 'Câu hỏi đào sâu')} (${card.follow_ups.length})</div>
      ${card.follow_ups.map((f, k) => html`<div key=${k} className="fs-follow">
        <b className="fs-q">${f.q}</b>
        ${f.sample && html`<p className="fsample">${f.sample}</p>`}
        ${f.a && html`<div className="fs-key"><span className="small dim">${L('Key line', 'Câu cốt lõi')}</span><${Md} src=${f.a} className="small" /></div>`}
        ${L(f.note_en, f.note_vi) && html`<span className="small dim">${L(f.note_en, f.note_vi)}</span>`}
      </div>`)}`}
  </div>`;
}
function ScriptToggle({ card }) {
  const [on, setOn] = useState(false);
  return html`<div className="scripttoggle">
    <button type="button" className="linkbtn" aria-expanded=${on} onClick=${() => setOn(!on)}>${on ? L('Hide the full script', 'Ẩn kịch bản đầy đủ') : L('Show the full script (answer and all follow-ups)', 'Xem kịch bản đầy đủ (câu trả lời và mọi câu đào sâu)')}</button>
    ${on && html`<${FullScript} card=${card} />`}
  </div>`;
}
