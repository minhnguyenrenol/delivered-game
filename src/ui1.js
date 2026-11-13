/* UI primitives and the core question loop. */
const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;
const html = htm.bind(React.createElement);

/* ---------- toasts ---------- */
const toastBus = new Set();
function toast(text, kind = '') { Sound.play(/Sticker/.test(text) ? 'sticker' : 'notify'); toastBus.forEach(f => f({ text, kind, id: Math.random() })); }
function Toasts() {
  const [items, set] = useState([]);
  useEffect(() => { const f = t => { set(x => [...x, t]); setTimeout(() => set(x => x.filter(i => i.id !== t.id)), 3200); }; toastBus.add(f); return () => toastBus.delete(f); }, []);
  return html`<div className="toasts" aria-live="polite">${items.map(t => html`<div key=${t.id} className=${'toast ' + t.kind}>${t.text}</div>`)}</div>`;
}

/* ---------- primitives ---------- */
function Md({ src, className = '' }) { return html`<div className=${'md ' + className} dangerouslySetInnerHTML=${{ __html: md(src) }}></div>`; }
function Avatar({ p, size = 40, trust = null, dim = false }) {
  const P = PERSONAS[p] || PERSONAS.thu; const r = size / 2;
  const t = trust == null ? null : Math.max(0, Math.min(100, trust));
  const circ = 2 * Math.PI * (r - 1.5);
  return html`<span className=${'avatar' + (dim ? ' dim' : '')} style=${{ width: size, height: size, '--h': P.hue }} title=${P.name + ' · ' + P.role}>
    <span className="avatar-face" style=${{ fontSize: size * 0.46 }}>${P.emoji}</span>
    ${t != null && html`<svg className="avatar-ring" viewBox=${`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx=${r} cy=${r} r=${r - 1.5} className="ring-track" />
      <circle cx=${r} cy=${r} r=${r - 1.5} className="ring-prog" style=${{ strokeDasharray: circ, strokeDashoffset: circ * (1 - t / 100) }} transform=${`rotate(-90 ${r} ${r})`} />
    </svg>`}
  </span>`;
}
function Ticks({ kind, animate = true }) {
  if (!kind) return null;
  if (kind === 'fail') return html`<span role="img" className="ticks fail" aria-label="Failed to send">!</span>`;
  const two = kind !== 'sent', blue = kind === 'read' || kind === 'typing';
  return html`<span role="img" className=${'ticks' + (blue ? ' blue' : '') + (animate ? ' anim' : '')} aria-label=${{ sent: 'Sent', delivered: 'Delivered', read: 'Read', typing: 'Read' }[kind]}>
    <svg viewBox="0 0 22 12" width="20" height="12" aria-hidden="true">
      <path className="t1" d="M1.5 6.5l3.2 3.2L11 3" />
      ${two && html`<path className="t2" d="M7.5 9.7L14.3 3M8.7 8.4" />`}
      ${two && html`<path className="t2b" d="M10.5 9.7L18 2.2" />`}
    </svg></span>`;
}
function TypingDots({ who }) { return html`<div className="row-msg them"><${Avatar} p=${who} size=${28} /><div className="bubble them typing" role="status" aria-label=${L('typing', 'đang gõ')}><i></i><i></i><i></i></div></div>`; }
function Bubble({ from = 'them', who, children, ticks, meta, wide, className = '' }) {
  return html`<div className=${'row-msg ' + from + (wide ? ' wide' : '')}>
    ${from === 'them' && who && html`<${Avatar} p=${who} size=${28} />`}
    <div className=${'bubble ' + from + ' ' + className}>${children}${(ticks || meta) && html`<span className="bmeta">${meta}${ticks && html`<${Ticks} kind=${ticks} />`}</span>`}</div>
  </div>`;
}
function SysPill({ children }) { return html`<div className="syspill">${children}</div>`; }
function Btn({ kind = 'primary', children, ...p }) { return html`<button type="button" className=${'btn ' + kind} ...${p}>${children}</button>`; }
function Chip({ kind = '', children, ...p }) { return html`<span className=${'chip ' + kind} ...${p}>${children}</span>`; }
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function useStopwatch() {
  const [on, setOn] = useState(false); const [sec, setSec] = useState(0); const t0 = useRef(0); const acc = useRef(0);
  useEffect(() => { if (!on) return; t0.current = performance.now(); const id = setInterval(() => setSec(acc.current + (performance.now() - t0.current) / 1000), 200); return () => { clearInterval(id); acc.current += (performance.now() - t0.current) / 1000; }; }, [on]);
  const reset = () => { acc.current = 0; setSec(0); setOn(false); };
  return { on, sec, start: () => setOn(true), stop: () => setOn(false), reset };
}
function TimerBar({ sec, target, on, onToggle, label = L('Speak', 'Nói to'), small }) {
  const ratio = sec / target; const cls = ratio > 1.5 ? 'red' : ratio > 1 ? 'amber' : '';
  return html`<div className=${'timerbar ' + cls + (small ? ' small' : '')}>
    <span className="tb-face mono">${fmt(sec)}<small> / ${fmt(target)}</small></span>
    <span className="tb-track"><i style=${{ transform: `scaleX(${Math.min(1, ratio / 1.5)})` }}></i><b style=${{ left: (100 / 1.5) + '%' }}></b></span>
    ${onToggle && html`<${Btn} kind=${on ? 'ghost' : 'primary'} onClick=${onToggle}>${on ? L('■ Stop', '■ Dừng') : '● ' + label}</${Btn}>`}
  </div>`;
}
function RecallRing({ seconds = 5, onEnd }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t0 = performance.now(); const id = setInterval(() => { const l = seconds - (performance.now() - t0) / 1000; setLeft(l); if (l <= 0) { clearInterval(id); Sound.play('flip'); onEnd && onEnd(); } }, 100); return () => clearInterval(id); }, []);
  const r = 26, c = 2 * Math.PI * r;
  return html`<svg className="recallring" viewBox="0 0 64 64" width="64" height="64" aria-label=${L(Math.ceil(Math.max(0, left)) + ' seconds', Math.ceil(Math.max(0, left)) + ' giây')}>
    <circle cx="32" cy="32" r=${r} className="rr-track" /><circle cx="32" cy="32" r=${r} className="rr-prog" style=${{ strokeDasharray: c, strokeDashoffset: c * Math.max(0, left) / seconds }} transform="rotate(-90 32 32)" />
    <text x="32" y="38" textAnchor="middle">${Math.ceil(Math.max(0, left))}</text></svg>`;
}
function Sticker({ card, state, size = 44, showState = true }) {
  const st = state ? (state.stickers[card.id] || '') : 'got';
  const box = state ? cs(state, card.id).box : 2;
  return html`<span className=${'sticker ' + (showState ? 'b' + box + ' ' + st : '')} style=${{ width: size, height: size, fontSize: size * 0.55 }} title=${plain(card.hook)}>${card.sticker}</span>`;
}
function Collapse({ title, children, open: o = false, className = '' }) {
  const [open, setOpen] = useState(o);
  return html`<div className=${'collapse ' + (open ? 'open ' : '') + className}><button type="button" className="collapse-h" aria-expanded=${open} onClick=${() => setOpen(!open)}><span>${title}</span><span className="chev">›</span></button>${open && html`<div className="collapse-b">${children}</div>`}</div>`;
}
function GradeBadge({ g }) { return html`<span className=${'gbadge g' + g}>${g === 'F' ? '!' : g}</span>`; }

/* ---------- the core loop ---------- */
/* mode: learn | review | voice | boss | practice | shadow */
function CardRun({ card, state, update, mode = 'learn', who, followSeq, onDone, scaffoldChoose = false, compact = false }) {
  const persona = who || card.persona;
  const panel = mode === 'boss';
  const [phase, setPhase] = useState('ask');
  const [hint, setHint] = useState(0);
  const [recall, setRecall] = useState(null);
  const [ringDone, setRingDone] = useState(false);
  const [input, setInput] = useState(state.day >= 2 || mode !== 'learn' ? 'speak' : 'speak');
  const [text, setText] = useState('');
  const [checks, setChecks] = useState({});
  const [result, setResult] = useState(null);
  const [tries, setTries] = useState([]);
  const [replyShown, setReplyShown] = useState(false);
  const [fIdx, setFIdx] = useState(0);
  const [fState, setFState] = useState('ask');
  const [fMarks, setFMarks] = useState([]);
  const [chosen, setChosen] = useState(null);
  const sw = useStopwatch(); const fsw = useStopwatch();
  const ctl = useRef(null); const endRef = useRef(null);
  const quick = mode === 'review';
  const pend = openPending(state, card.id);
  const blanks = (cs(state, card.id).att || []).slice(-2).filter(a => a.r === 'blank').length;
  const doChoose = scaffoldChoose || (mode !== 'boss' && blanks >= 2);
  const follows = useMemo(() => followSeq || (mode === 'shadow' ? [pick(SHADOW)] : card.follow_ups.length ? [pick(card.follow_ups)] : []), [card.id]);

  useEffect(() => { const t = setTimeout(() => setPhase(mode === 'learn' ? 'study' : 'recall'), 900); return () => clearTimeout(t); }, []);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [phase, replyShown, fState, fIdx, result]);

  const caps = [];
  if (hint >= 2) caps.push({ g: 'A', why: L('You used the memory hook hint, so the best you can get is blue ✓✓ (A).', 'Đã dùng gợi ý móc nhớ: trần ✓✓ xanh (A).') });
  if (hint >= 3) caps.push({ g: 'B', why: L('You saw the first 3 words, so the best you can get is grey ✓✓ (B).', 'Đã xem 3 chữ đầu: trần ✓✓ xám (B).') });
  if (pend.length) caps.push({ g: 'B', why: L('This question still has ' + pend.length + ' 🟨/🟦 item(s) not confirmed in Minh → Minh, so the best you can get is grey ✓✓.', 'Câu này còn ' + pend.length + ' mục 🟨/🟦 chưa xác nhận trong Minh → Minh: trần ✓✓ xám.') });

  async function submitTyped() {
    sw.stop(); setPhase('grading');
    ctl.current = new AbortController();
    const r = await coachGrade(card, text, sw.sec || ((text.match(/\S+/g) || []).length / 2.2), state, persona, ctl.current.signal);
    finishGrade({ ...r, mode: 'type', sec: sw.sec, text });
  }
  function submitSelf() { sw.stop(); finishGrade({ ...selfGrade(card, checks, sw.sec, state), mode: 'speak', sec: sw.sec, words: 0 }); }
  function finishGrade(r) {
    applyCaps(r, caps);
    if (r.overclaims?.length) r.grade = 'F';
    Sound.play('send'); setTimeout(() => Sound.grade(r.grade), 250); setTimeout(() => cineGrade(r.grade), r.grade === 'S' ? 1000 : 300);
    setResult(r); setTries(t => [...t, r]); setPhase('graded'); setReplyShown(false);
    setTimeout(() => setReplyShown(true), r.grade === 'S' ? 1700 : 1100);
    if (r.mode === 'type' && text.trim()) Store.saveAnswer(card.id, { d: state.day, t: Date.now(), g: r.grade, text: text.slice(0, 2400) });
  }
  function retry() { setText(''); setChecks({}); sw.reset(); setResult(null); setPhase('answer'); }
  function finish(extra = {}) {
    const final = result || extra.result;
    const g = final ? final.grade : extra.g;
    const marks = extra.marks || fMarks;
    update(s => {
      const box = recordAttempt(s, card.id, { g, pct: final ? final.pct : 0, mode: final ? final.mode : 'quick', panel, sec: final ? final.sec : 0, words: final ? final.words : 0, recall: recall || 'partial' });
      const dT = { S: 6, A: 4, B: 1, C: -2, F: -6 }[g] + marks.reduce((a, m) => a + (m === 'nail' ? 2 : m === 'miss' ? -1 : 0), 0);
      s.trust[persona] = Math.max(0, Math.min(100, (s.trust[persona] ?? 40) + (quick ? Math.sign(dT) : dT)));
      s.xp += { S: 50, A: 35, B: 20, C: 10, F: 5 }[g] + (recall === 'had' ? 5 : 0);
      if (box >= 2 && !(state.stickers[card.id])) setTimeout(() => toast(L('Sticker unlocked ' + card.sticker + '  ' + plain(card.hook).slice(0, 48), 'Sticker mới ' + card.sticker + '  ' + plain(card.hook).slice(0, 48))), 300);
    });
    onDone && onDone({ g, recall, result: final, marks });
  }

  const P = PERSONAS[persona];
  const ticks = result ? ticksFor(result.grade) : null;
  const curF = follows[fIdx];

  return html`<div className=${'cardrun ' + mode + (compact ? ' compact' : '')}>
    ${phase === 'ask' ? html`<${TypingDots} who=${persona} />` : html`<${Bubble} who=${persona}>
      <span className="who">${P.name}</span>
      <span className="qtext">${card.q}</span>
      <span className="qmeta"><span className="mono">${card.id}</span> · ${ROOMS[card.room].name}${card.top ? ' · ★ TOP' : ''} · ${'★'.repeat(card.diff)}<span className="dim">${'★'.repeat(5 - card.diff)}</span></span>
    </${Bubble}>`}

    ${phase === 'study' && html`<div className="studycard">
      <div className="study-top">
        <${Sticker} card=${card} state=${null} size=${64} showState=${false} />
        <div><div className="label">${L('Place the object in the room', 'Đặt vật vào phòng')}</div><div className="locus">${plain(card.locus)}</div><${Md} src=${card.image} className="small" /></div>
      </div>
      ${card.understand && html`<div className="sec"><div className="label">${L('Understand the question', 'Hiểu câu hỏi')}</div><${Md} src=${card.understand} /></div>`}
      <div className="sec"><div className="label">${L('Who asks · what they look for', 'Ai hỏi · chấm gì')}</div><${Md} src=${card.who} className="small" /></div>
      ${pend.length > 0 && html`<div className="pendnote"><b>${L('🟨 Not confirmed in this answer.', '🟨 Chưa xác nhận trong câu này.')}</b> ${L('Only say these details if they are true:', 'Chỉ nói những chi tiết này khi đúng:')} ${pend.map(p => html`<div key=${p.id}>· ${p.text}</div>`)}</div>`}
      <${Collapse} title=${L('Sample answer · read it out loud once (' + fmt(card.targetSec) + ')', 'Câu trả lời mẫu · đọc to một lần (' + fmt(card.targetSec) + ')')} open=${state.day <= 1}>
        ${state.scripts[card.id] && html`<div className="myscript"><div className="label">${L('Your version (My Script)', 'Bản của bạn (My Script)')}</div><${Md} src=${state.scripts[card.id]} /></div>`}
        <${Md} src=${card.answer} className="answer" />
        <div className="label">${L('Why it works', 'Vì sao hiệu quả')}</div><${Md} src=${card.why} className="small" />
      </${Collapse}>
      <div className="memgrid">
        <div><div className="label">${L('Memory hook', 'Móc nhớ')}</div><${Md} src=${card.hook} /></div>
        <div><div className="label">${L('Must say', 'Bắt buộc phải nói')}</div><ol className="must">${card.mustList.map((m, i) => html`<li key=${i}>${m}</li>`)}</ol></div>
        <div><div className="label">${L('To get 5/5', 'Để đạt 5/5')}</div><${Md} src=${card.five} className="small" /></div>
      </div>
      <div className="actions"><${Btn} onClick=${() => setPhase('recall')}>${L('I’m ready · hide the answer', 'Mình sẵn sàng · che câu mẫu')}</${Btn}></div>
    </div>`}

    ${['recall', 'choose', 'answer', 'grading', 'graded', 'must', 'follow'].includes(phase) && html`<div className="recallbox">
      ${!recall ? html`<div className="recall-live">
        ${!ringDone ? html`<${RecallRing} seconds=${5} onEnd=${() => setRingDone(true)} />` : html`<div className="recall-opener"><span className="label">${L('Opening line', 'Câu mở đầu')}</span><b>“${card.opener}”</b></div>`}
        <div className="recall-copy">
          <b>${ringDone ? L('Did you say it?', 'Bạn đã nói được chưa?') : L('Say the opening line out loud, right now.', 'Nói to câu mở đầu, ngay bây giờ.')}</b>
          <span className="small">${ringDone ? L('Be honest with yourself. These are the most important 5 seconds of every answer.', 'Tự chấm thật lòng. Đây là 5 giây quan trọng nhất của mỗi câu.') : L('5 seconds. No peeking.', '5 giây. Chưa được nhìn gì.')}</span>
          ${!ringDone && html`<div className="hints">
            ${hint >= 1 ? html`<${Chip}>${card.sticker} ${plain(card.locus)}</${Chip}>` : html`<button type="button" className="linkbtn" onClick=${() => setHint(1)}>${L('💡 Hint 1 · room and object (free)', '💡 Gợi ý 1 · phòng và vật (miễn phí)')}</button>`}
            ${hint >= 1 && (hint >= 2 ? html`<${Chip}>${plain(card.hook).slice(0, 90)}</${Chip}>` : html`<button type="button" className="linkbtn" onClick=${() => setHint(2)}>${L('💡 Hint 2 · memory hook (max A)', '💡 Gợi ý 2 · móc nhớ (trần A)')}</button>`)}
            ${hint >= 2 && (hint >= 3 ? html`<${Chip}>“${card.opener.split(/\s+/).slice(0, 3).join(' ')}…”</${Chip}>` : html`<button type="button" className="linkbtn" onClick=${() => setHint(3)}>${L('💡 Hint 3 · first three words (max B)', '💡 Gợi ý 3 · ba chữ đầu (trần B)')}</button>`)}
            <button type="button" className="linkbtn" onClick=${() => setRingDone(true)}>${L('Flip now', 'Lật ngay')}</button>
          </div>`}
        </div>
        ${ringDone && html`<div className="seg3">
          ${[['had', L('Yes, almost word for word', 'Có, gần nguyên văn')], ['partial', L('Partly', 'Một phần')], ['blank', L('Blank', 'Trống')]].map(([k, l]) => html`<button type="button" key=${k} className=${'segbtn ' + k} onClick=${() => { setRecall(k); setPhase(quick ? 'must' : doChoose ? 'choose' : 'answer'); }}>${l}</button>`)}
        </div>`}
      </div>` : html`<${Bubble} from="me" meta=${{ had: L('Remembered the opener', 'Nhớ câu mở đầu'), partial: L('Partly remembered', 'Nhớ một phần'), blank: L('Forgot the opener', 'Quên câu mở đầu') }[recall]}>“${card.opener}”</${Bubble}>`}
    </div>`}

    ${phase === 'choose' && html`<${ChooseOpener} card=${card} onPick=${c => { setChosen(c); }} chosen=${chosen} onNext=${() => setPhase('answer')} />`}

    ${phase === 'must' && html`<${QuickMust} card=${card} recall=${recall} onDone=${(g) => finish({ g })} />`}

    ${(phase === 'answer' || phase === 'grading') && html`<div className="composer">
      <div className="composer-tabs" role="tablist">
        <button type="button" role="tab" aria-selected=${input === 'speak'} onClick=${() => setInput('speak')}>${L('🎙️ Speak · grade yourself', '🎙️ Nói to · tự chấm')}</button>
        <button type="button" role="tab" aria-selected=${input === 'type'} onClick=${() => setInput('type')}>${L('⌨️ Type · Coach Thư grades', '⌨️ Gõ · Coach Thư chấm')}</button>
      </div>
      ${tries.length > 0 && html`<div className="small note">${L('Try ', 'Lần ')}${tries.length + 1}${L('. Last time: ', '. Lần trước: ')}${tries[tries.length - 1].grade}, ${Math.round(tries[tries.length - 1].pct * 100)}%${L('. Coach wants you to fix just one thing: ', '. Coach muốn bạn sửa đúng một điều: ')}<b>${tries[tries.length - 1].fix}</b></div>`}
      ${input === 'speak' ? html`<div className="speak">
        <p className="small">${L('Stand up and speak in English as if you were sitting across from ' + P.name + '. Start the timer, say it all, then grade yourself with SEND.', 'Đứng lên, nói bằng tiếng Anh như đang ngồi trước ' + P.name + '. Bấm giờ, nói hết, rồi tự chấm theo SEND.')}</p>
        <${TimerBar} sec=${sw.sec} target=${card.targetSec} on=${sw.on} onToggle=${() => sw.on ? sw.stop() : sw.start()} />
        ${!sw.on && sw.sec > 2 && html`<${SelfCheck} card=${card} checks=${checks} setChecks=${setChecks} onSubmit=${submitSelf} />`}
      </div>` : html`<div className="type">
        <textarea id=${'ans-' + card.id} rows="7" value=${text} placeholder=${L('Type exactly what you would say. Your first sentence is the Signal.', 'Gõ đúng những gì bạn sẽ nói. Câu đầu tiên là Signal.')} onInput=${e => { setText(e.target.value); if (!sw.on && e.target.value.length > 0) sw.start(); }} disabled=${phase === 'grading'}></textarea>
        <div className="typebar">
          <span className="small mono">${(text.match(/\S+/g) || []).length}${L(' words · target ≤ ', ' từ · mục tiêu ≤ ')}${Math.round(card.targetSec * 2)} · ${fmt(sw.sec)}</span>
          ${phase === 'grading' ? html`<span className="grading"><span className="spin"></span> ${L('Coach Thư is reading…', 'Coach Thư đang đọc…')}</span><${Btn} kind="ghost" onClick=${() => ctl.current && ctl.current.abort()}>${L('Quick grade', 'Chấm nhanh')}</${Btn}>` :
            html`<${Btn} disabled=${(text.match(/\S+/g) || []).length < 8} onClick=${submitTyped}>${L('Send ➤', 'Gửi ➤')}</${Btn}>`}
        </div>
        <p className="small dim">${L('Don’t put NAB internal data or customer data in your answer.', 'Không đưa dữ liệu nội bộ NAB hay khách hàng vào câu trả lời.')}</p>
      </div>`}
    </div>`}

    ${(phase === 'graded' || phase === 'follow') && result && html`<${Fragment}>
      <${Bubble} from="me" ticks=${ticks} meta=${result.mode === 'type' ? fmt(result.sec) + ' · ' + result.words + L(' words ', ' từ ') : '🎙️ ' + fmt(result.sec) + ' '} className=${result.grade === 'F' ? 'shake' : ''}>
        ${result.mode === 'type' ? html`<span className="mytext">${text}</span>` : html`<span className="voicenote"><span className="wave">${Array.from({ length: 28 }, (_, i) => html`<i key=${i} style=${{ height: 6 + Math.abs(Math.sin(i * 1.7 + card.n)) * 18 }}></i>`)}</span></span>`}
      </${Bubble}>
      <${CoachCard} r=${result} card=${card} tries=${tries} />
      ${!replyShown ? html`<${TypingDots} who=${persona} />` : html`<${Bubble} who=${persona}>${result.grade === 'F' ? 'Hmm. I’d want to double-check that claim.' : pick(P.replies?.[bandFor(result.grade)] || ['Thanks.'])}</${Bubble}>`}
      ${replyShown && phase === 'graded' && html`<div className="actions">
        ${(tries.length < 2 || (mode === 'voice' && tries.length < 2)) && html`<${Btn} kind=${mode === 'voice' && tries.length < 2 ? 'primary' : 'ghost'} onClick=${retry}>${L('✎ Edit message · answer again', '✎ Sửa tin nhắn · trả lời lại')}</${Btn}>`}
        ${!(mode === 'voice' && tries.length < 2) && html`<${Btn} onClick=${() => follows.length ? setPhase('follow') : finish()}>${follows.length ? L('Next · follow-up question', 'Tiếp · câu hỏi đào sâu') : L('Done with this one', 'Xong câu này')}</${Btn}>`}
      </div>`}
    </${Fragment}>`}

    ${phase === 'follow' && curF && html`<${Fragment}>
      ${follows.slice(0, fIdx).map((f, i) => html`<${Bubble} key=${'fq' + i} who=${persona}><span className="small">${f.q}</span><span className="bmeta">${{ nail: L('✓ solid', '✓ chắc'), ok: L('~ okay', '~ tạm'), miss: L('✗ missed', '✗ hụt') }[fMarks[i]]}</span></${Bubble}>`)}
      <${Bubble} who=${persona}><span className="who">${P.name}${mode === 'shadow' || curF.hostile ? L(' · pushing hard', ' · gây áp lực') : ''}</span>${curF.q}</${Bubble}>
      <div className="followbox">
        <${TimerBar} sec=${fsw.sec} target=${45} on=${fsw.on} onToggle=${() => fsw.on ? fsw.stop() : fsw.start()} small=${true} label=${L('Answer in ≤ 45s', 'Trả lời ≤ 45s')} />
        ${fState === 'ask' ? html`<div className="actions"><${Btn} kind="ghost" onClick=${() => { fsw.stop(); setFState('reveal'); }}>${L('See sample answer', 'Xem câu mẫu')}</${Btn}></div>` : html`<${Fragment}>
          <div className="modelf">
            ${curF.sample ? html`<${Fragment}><div className="label">${L('Sample answer', 'Câu mẫu')}</div><${Md} src=${curF.sample} /></${Fragment}>` : html`<${Fragment}><div className="label">${L('Sample answer', 'Câu mẫu')}</div><${Md} src=${curF.a || L('_(No sample in the book. Use the structure of the main answer.)_', '_(Sách không có câu mẫu: dùng khung của câu chính.)_')} /></${Fragment}>`}
            ${curF.sample && curF.a && html`<${Fragment}><div className="label">${L('Key line', 'Câu cốt lõi')}</div><${Md} src=${curF.a} className="small" /></${Fragment}>`}
            ${L(curF.note_en, curF.note_vi) && html`<div className="small dim">${L(curF.note_en, curF.note_vi)}</div>`}
          </div>
          <div className="seg3">${[['nail', L('I could say that', 'Mình nói được như vậy')], ['ok', L('Close', 'Gần đúng')], ['miss', L('Missed', 'Hụt')]].map(([k, l]) => html`<button type="button" key=${k} className=${'segbtn ' + (k === 'nail' ? 'had' : k === 'ok' ? 'partial' : 'blank')} onClick=${() => {
            const marks = [...fMarks, k]; setFMarks(marks); fsw.reset();
            if (fIdx + 1 < follows.length) { setFIdx(fIdx + 1); setFState('ask'); } else finish({ marks });
          }}>${l}</button>`)}</div>
        </${Fragment}>`}
      </div>
    </${Fragment}>`}
    <div ref=${endRef}></div>
  </div>`;
}

function SelfCheck({ card, checks, setChecks, onSubmit }) {
  const tog = k => setChecks(c => ({ ...c, [k]: !c[k] }));
  const Row = ({ k, children, warn }) => html`<label className=${'chk' + (warn ? ' warn' : '')}><input type="checkbox" id=${'sc-' + card.id + '-' + k} checked=${!!checks[k]} onChange=${() => tog(k)} /><span>${children}</span></label>`;
  return html`<div className="selfcheck">
    <div className="label">${L('SEND self-check · be honest', 'Tự chấm SEND · thật lòng')}</div>
    <${Row} k="signal"><b>S</b> ${L('My first sentence was the opening line:', 'Câu đầu tiên chính là câu mở đầu:')} “${card.opener}”</${Row}>
    ${card.mustList.map((m, i) => html`<${Row} key=${i} k=${'m' + i}><b>●</b> ${m}</${Row}>`)}
    <${Row} k="evidence"><b>E</b> ${L('Named a project + a number, labelled right (live/MVP, measured/estimated)', 'Có dự án + con số, gắn nhãn đúng (live/MVP, đo/ước tính)')}</${Row}>
    <${Row} k="narrative"><b>N</b> ${L('Shared one decision and one thing that wasn’t perfect', 'Có một quyết định và một chi tiết không hoàn hảo')}</${Row}>
    <${Row} k="deliver"><b>D</b> ${L('Last sentence links to Qualgo (scams, chat, trust, Vietnam)', 'Câu cuối nối tới Qualgo (lừa đảo, chat, niềm tin, Việt Nam)')}</${Row}>
    <${Row} k="five"><b>5/5</b> ${plain(card.five)}</${Row}>
    <${Row} k="overclaim" warn=${true}><b>!</b> ${L('I said something unverified or overstated', 'Mình đã nói một điều chưa xác minh hoặc nói quá')}</${Row}>
    <${Collapse} title=${L('Compare with the sample answer', 'So với câu mẫu')}><${Md} src=${card.answer} className="answer" /></${Collapse}>
    <div className="actions"><${Btn} onClick=${onSubmit}>${L('Send voice note ➤', 'Gửi voice note ➤')}</${Btn}></div>
  </div>`;
}

function CoachCard({ r, card, tries }) {
  const pct = Math.round(r.pct * 100);
  const two = tries.length >= 2 ? tries[tries.length - 2] : null;
  return html`<div className=${'coachcard g' + r.grade}>
    <div className="cc-head">
      <${Avatar} p="thu" size=${30} />
      <div className="cc-grade"><${GradeBadge} g=${r.grade} /><span className="mono">${pct}%</span>
        <span className="small">${r.mode === 'type' ? fmt(r.sec) + ' / ' + fmt(card.targetSec) + ' · ' + r.words + L(' words', ' từ') : fmt(r.sec) + ' / ' + fmt(card.targetSec)}${r.self ? L(' · self-graded', ' · tự chấm') : r.provisional ? L(' · quick grade', ' · chấm nhanh') : ''}</span></div>
      <div className="sendbars">${['S', 'E', 'N', 'D'].map(k => html`<span key=${k} title=${k + ' ' + r.scores[k] + '/4'}><b>${k}</b><i style=${{ '--v': r.scores[k] / 4 }}></i></span>`)}</div>
    </div>
    <div className="mustdots">${card.mustList.map((m, i) => html`<span key=${i} className=${r.mustHit[i] ? 'on' : ''}>${r.mustHit[i] ? '●' : '○'} ${m.length > 46 ? m.slice(0, 44) + '…' : m}</span>`)}</div>
    ${r.overclaims?.length > 0 && html`<div className="overclaim"><b>! Failed to send.</b> ${r.overclaims.map((o, i) => html`<div key=${i}>“${o.quote}” ${o.fix ? '· ' + o.fix : ''} ${o.id && o.id !== '?' && o.id !== 'self' ? html`<${Chip} kind="amber">${o.id}</${Chip}>` : ''}</div>`)}</div>`}
    <div className="cc-lines">
      <div><span className="ok">✔</span> ${r.strength}</div>
      <div><span className="no">✘</span> ${r.fix}</div>
      <div><span className="pen">✎</span> <i>“${r.stronger}”</i></div>
      <div><span className="hook">🃏</span> ${plain(card.hook)} <span className="dim">· ${plain(card.locus)}</span></div>
    </div>
    ${r.capped && html`<div className="small capnote">${r.capped}</div>`}
    ${r.note && html`<div className="small dim">${r.note}</div>`}
    ${r.vi && r.grade === 'S' && html`<div className="vi">${r.vi}</div>`}
    ${r.grade === 'S' && html`<div className="typingline">${PERSONAS[card.persona].name} is typing<span className="dots"><i></i><i></i><i></i></span></div>`}
    ${two && html`<div className="compare"><span>${L('Try 1:', 'Lần 1:')} <b>${two.grade}</b> ${Math.round(two.pct * 100)}%${two.words ? ' · ' + two.words + L(' words', ' từ') : ''} · ${fmt(two.sec)}</span><span>→</span><span>${L('Try 2:', 'Lần 2:')} <b>${r.grade}</b> ${pct}%${r.words ? ' · ' + r.words + L(' words', ' từ') : ''} · ${fmt(r.sec)}</span></div>`}
  </div>`;
}

const GENERIC_OPENERS = ['I’m passionate about creating user-centred experiences.', 'Great question. Let me start from the beginning of my career.', 'I think it really depends on the context.', 'I’m a fast learner and a team player.'];
const OVER_OPENERS = ['I’m a senior designer with 14 years in banking and finance.', 'I’ve led design teams of up to sixty people.', 'I’ve already shipped a consumer chat app, so this is familiar.', 'RegShield, which I launched last quarter, proves it.'];
function ChooseOpener({ card, onPick, chosen, onNext }) {
  const opts = useMemo(() => shuffle([{ t: card.opener, k: 'right' }, { t: pick(GENERIC_OPENERS), k: 'generic' }, { t: pick(OVER_OPENERS), k: 'over' }]), [card.id]);
  const why = { right: L('Right. Now say it out loud.', 'Đúng. Giờ hãy nói to câu đó.'), generic: L('✓ Sent, but it’s generic. Anyone could say this. Where’s the Signal?', '✓ Sent, nhưng chung chung. Ai cũng nói được câu này. Signal ở đâu?'), over: L('! Failed to send. This one is on your facts table. A recruiter can check it in a minute.', '! Failed to send. Câu này nằm trong bảng sự thật của bạn. Người tuyển dụng kiểm tra được trong một phút.') };
  return html`<div className="choose">
    <div className="label">${L('Pick the opening line', 'Chọn câu mở đầu')}</div>
    ${opts.map((o, i) => html`<button type="button" key=${i} className=${'opt' + (chosen ? (o.k === 'right' ? ' right' : chosen === o.k ? ' wrong' : '') : '')} disabled=${!!chosen} onClick=${() => onPick(o.k)}>${o.t}</button>`)}
    ${chosen && html`<div className=${'small ' + (chosen === 'right' ? 'okc' : 'noc')}>${why[chosen]}</div>`}
    ${chosen && html`<div className="actions"><${Btn} onClick=${onNext}>${L('Now say the whole answer', 'Giờ nói cả câu trả lời')}</${Btn}></div>`}
  </div>`;
}

function QuickMust({ card, recall, onDone }) {
  const sw = useStopwatch(); const [hit, setHit] = useState({}); const [shown, setShown] = useState(false);
  useEffect(() => { sw.start(); }, []);
  const n = Object.values(hit).filter(Boolean).length;
  return html`<div className="quickmust">
    <${TimerBar} sec=${sw.sec} target=${30} on=${sw.on} small=${true} />
    <div className="small">${L('Say the opening line + ' + card.mustList.length + ' must-say points out loud in 30 seconds. Then tick the ones you said.', 'Nói to câu mở đầu + ' + card.mustList.length + ' ý bắt buộc trong 30 giây. Rồi đánh dấu ý nào bạn đã nói.')}</div>
    ${!shown ? html`<div className="actions"><${Btn} kind="ghost" onClick=${() => { sw.stop(); setShown(true); }}>${L('Done · show must-say points', 'Xong · xem ý bắt buộc')}</${Btn}></div>` : html`<${Fragment}>
      ${card.mustList.map((m, i) => html`<label key=${i} className="chk"><input type="checkbox" id=${'qm-' + card.id + i} checked=${!!hit[i]} onChange=${() => setHit(h => ({ ...h, [i]: !h[i] }))} /><span>${m}</span></label>`)}
      <div className="actions"><${Btn} onClick=${() => onDone(recall === 'blank' ? 'C' : n === card.mustList.length && recall === 'had' && sw.sec <= 36 ? 'A' : n >= Math.ceil(card.mustList.length / 2) ? 'B' : 'C')}>${L('Save · next card', 'Lưu · thẻ tiếp')}</${Btn}></div>
    </${Fragment}>`}
  </div>`;
}
