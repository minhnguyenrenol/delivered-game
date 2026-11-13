/* Drills: opener flash, palace walk, honesty lines, Number Lock, Scam Detector, rapid-fire, whiteboard, warnings, critique, Story Forge, salary. */

function DrillHead({ icon, title, sub, who }) {
  return html`<div className="drillhead">${who ? html`<${Avatar} p=${who} size=${34} />` : html`<span className="dicon">${icon}</span>`}<div><b>${title}</b>${sub && html`<span className="small">${sub}</span>`}</div></div>`;
}
function Progress({ i, n }) { return html`<div className="pdots" role="img" aria-label=${i + ' / ' + n}>${Array.from({ length: n }, (_, k) => html`<i key=${k} className=${k < i ? 'on' : k === i ? 'cur' : ''}></i>`)}</div>`; }

/* Rapid opener recall, 5 s each */
function OpenerFlash({ ids, state, update, onDone, title = L('Opener recall', 'Gọi lại câu mở đầu') }) {
  const [i, setI] = useState(0); const [flip, setFlip] = useState(false); const [log, setLog] = useState([]);
  if (!ids.length) return html`<div className="drill"><${DrillHead} icon="⚡" title=${title} sub=${L('No cards due.', 'Không có thẻ nào đến hạn.')} /><div className="actions"><${Btn} onClick=${() => onDone({ n: 0 })}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  if (i >= ids.length) {
    const had = log.filter(x => x === 'had').length;
    return html`<div className="drill done"><${DrillHead} icon="⚡" title=${title} sub=${had + ' / ' + ids.length + L(' openers in 5 seconds', ' câu mở đầu trong 5 giây')} />
      <div className="flashsum">${ids.map((id, k) => html`<span key=${id} className=${'fs ' + log[k]} title=${CARD[id].q}>${CARD[id].sticker}<small>${id}</small></span>`)}</div>
      <div className="actions"><${Btn} onClick=${() => onDone({ n: ids.length, had })}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  }
  const c = CARD[ids[i]];
  const mark = k => {
    setLog(l => [...l, k]);
    if (k === 'blank') update(s => { const x = cs(s, c.id); s.cards[c.id] = { ...x, box: Math.max(1, Math.min(x.box || 1, 1)), due: s.day + 1 }; });
    setFlip(false); setI(i + 1);
  };
  return html`<div className="drill">
    <${DrillHead} icon="⚡" title=${title} sub=${(i + 1) + ' / ' + ids.length + L(' · say it out loud before you flip', ' · nói to trước khi lật')} />
    <${Progress} i=${i} n=${ids.length} />
    <div className="flash" key=${c.id}>
      <${Sticker} card=${c} state=${state} size=${56} />
      <div className="flash-q"><span className="small mono">${c.id} · ${ROOMS[c.room].name}</span><b>${c.q}</b></div>
      ${!flip ? html`<${RecallRing} key=${'r' + c.id} seconds=${5} onEnd=${() => setFlip(true)} />` : html`<div className="flash-a">“${c.opener}”</div>`}
    </div>
    ${flip ? html`<div className="seg3">${[['had', L('Got it', 'Có')], ['partial', L('Partly', 'Một phần')], ['blank', L('Blank', 'Trống')]].map(([k, l]) => html`<button type="button" key=${k} className=${'segbtn ' + k} onClick=${() => mark(k)}>${l}</button>`)}</div>`
      : html`<div className="actions"><button type="button" className="linkbtn" onClick=${() => setFlip(true)}>${L('Flip now', 'Lật ngay')}</button></div>`}
  </div>`;
}

/* Palace walk: same route every time, A → J */
function PalaceWalk({ ids, state, onDone, title = L('Building walk', 'Đi bộ trong tòa nhà'), timed = false }) {
  const order = useMemo(() => [...ids].sort((a, b) => CARD[a].n - CARD[b].n), [ids.join()]);
  const [i, setI] = useState(-1); const [rev, setRev] = useState(false); const [log, setLog] = useState([]);
  const sw = useStopwatch();
  useEffect(() => { if (i === 0 && timed) sw.start(); if (i >= order.length) sw.stop(); }, [i]);
  if (i < 0) return html`<div className="drill walk">
    <${DrillHead} icon="🏢" title=${title} sub=${order.length + L(' objects · mPlaza, 39 Lê Duẩn, floor 18', ' vật · mPlaza, 39 Lê Duẩn, tầng 18')} />
    <p className="small">${L('Always walk the same route: Lobby → Lift → Whiteboard → Safe → Design team → Pantry → Lab → Balcony → Director’s office → Rooftop. At each object, look only at the sticker and where it is, say the opener out loud, then flip.', 'Đi đúng một lộ trình: Sảnh → Thang máy → Bảng trắng → Két sắt → Design team → Pantry → Lab → Ban công → Phòng giám đốc → Sân thượng. Ở mỗi vật, chỉ nhìn sticker và vị trí, nói to câu mở đầu, rồi mới lật.')}${timed ? L(' Goal: 72 answers in 22 minutes.', ' Mục tiêu: 72 câu trong 22 phút.') : ''}</p>
    <div className="actions"><${Btn} onClick=${() => setI(0)}>${L('Walk into the lobby', 'Bước vào sảnh')}</${Btn}></div></div>`;
  if (i >= order.length) {
    const had = log.filter(Boolean).length;
    return html`<div className="drill walk done"><${DrillHead} icon="🏢" title=${title} sub=${had + ' / ' + order.length + L(' openers', ' câu mở đầu') + (timed ? ' · ' + fmt(sw.sec) : '')} />
      <div className="actions"><${Btn} onClick=${() => onDone({ had, n: order.length, sec: sw.sec })}>${L('Leave the building', 'Ra khỏi tòa nhà')}</${Btn}></div></div>`;
  }
  const c = CARD[order[i]]; const prev = i > 0 ? CARD[order[i - 1]] : null;
  return html`<div className="drill walk">
    <div className="walkbar"><span className="mono">${ROOMS[c.room].full}</span>${timed && html`<span className="mono">${fmt(sw.sec)} / 22:00</span>`}<span className="mono">${i + 1}/${order.length}</span></div>
    ${prev && prev.room !== c.room && html`<${SysPill}>${L('You walk into ', 'Bạn bước sang ')}${ROOMS[c.room].full}</${SysPill}>`}
    <div className="walkobj" key=${c.id}>
      <span className="bigsticker">${c.sticker}</span>
      <div className="locus">${plain(c.locus)}</div>
      ${rev ? html`<div className="flash-a">“${c.opener}”</div><div className="small dim">${c.id} · ${c.q}</div>` : html`<${Md} src=${c.image} className="small dim imgtext" />`}
    </div>
    ${!rev ? html`<div className="actions"><${Btn} onClick=${() => setRev(true)}>${L('I said it · flip', 'Mình đã nói · lật')}</${Btn}></div>` :
      html`<div className="seg3"><button type="button" className="segbtn had" onClick=${() => { setLog([...log, true]); setRev(false); setI(i + 1); }}>${L('Got it', 'Có')}</button><button type="button" className="segbtn blank" onClick=${() => { setLog([...log, false]); setRev(false); setI(i + 1); }}>${L('Not yet', 'Chưa')}</button></div>`}
  </div>`;
}

/* Honesty lines (Day 1) */
function lcsMarks(target, typed) {
  const T = target.toLowerCase().replace(/[^\p{L}\p{N}\s'’-]/gu, '').split(/\s+/).filter(Boolean);
  const U = typed.toLowerCase().replace(/[^\p{L}\p{N}\s'’-]/gu, '').split(/\s+/).filter(Boolean).map(w => w.replace(/’/g, "'"));
  const t2 = T.map(w => w.replace(/’/g, "'"));
  const dp = Array.from({ length: t2.length + 1 }, () => new Array(U.length + 1).fill(0));
  for (let i = t2.length - 1; i >= 0; i--) for (let j = U.length - 1; j >= 0; j--) dp[i][j] = t2[i] === U[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Array(t2.length).fill(false); let i = 0, j = 0;
  while (i < t2.length && j < U.length) { if (t2[i] === U[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return { words: target.split(/\s+/), hit, ratio: hit.filter(Boolean).length / Math.max(1, t2.length) };
}
const HONESTY_WHEN = [L('When asked about chat experience', 'Khi bị hỏi về kinh nghiệm chat'), L('When asked for a number', 'Khi bị hỏi một con số'), L('When you don’t know', 'Khi không biết'), L('When asked about managing people', 'Khi bị hỏi về quản lý người')];
function HonestyDrill({ state, update, onDone }) {
  const [i, setI] = useState(0); const [txt, setTxt] = useState(''); const [res, setRes] = useState(null); const [tries, setTries] = useState(0); const [peek, setPeek] = useState(i === 0);
  if (i >= 4) return html`<div className="drill done"><${DrillHead} icon="🛟" title=${L('Four honest lines', 'Bốn câu thành thật')} sub=${L('Saved to Files. Stick them on your mirror tonight.', 'Đã lưu vào Files. Dán lên gương tối nay.')} /><div className="actions"><${Btn} onClick=${() => onDone({})}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  const line = C.honesty[i];
  const check = () => { const r = lcsMarks(line, txt); setRes(r); setTries(tries + 1); if (r.ratio >= 0.95) update(s => { s.drills.honesty = { ...(s.drills.honesty || {}), [i]: Math.max(r.ratio, s.drills.honesty?.[i] || 0) }; }); };
  return html`<div className="drill">
    <${DrillHead} icon="🛟" title=${L('Four honest lines', 'Bốn câu thành thật')} sub=${(i + 1) + ' / 4 · ' + HONESTY_WHEN[i] + L(' · type it from memory until it’s word for word', ' · gõ từ trí nhớ đến khi đúng nguyên văn')} />
    <${Progress} i=${i} n=${4} />
    ${peek ? html`<div className="honest-line">“${line}”</div>` : html`<button type="button" className="linkbtn" onClick=${() => setPeek(true)}>${L('Peek once', 'Xem câu một lần')}</button>`}
    ${peek && !res && html`<div className="actions"><${Btn} kind="ghost" onClick=${() => setPeek(false)}>${L('Hide it and type', 'Che lại và gõ')}</${Btn}></div>`}
    ${!peek && html`<${Fragment}>
      <textarea id=${'hon-' + i} rows="3" value=${txt} onInput=${e => setTxt(e.target.value)} placeholder=${L('Type it word for word…', 'Gõ nguyên văn…')}></textarea>
      ${res && html`<div className="diff">${res.words.map((w, k) => html`<span key=${k} className=${res.hit[k] ? 'hit' : 'miss'}>${w} </span>`)}<div className="small mono">${Math.round(res.ratio * 100)}${L('% word for word', '% nguyên văn')}</div></div>`}
      <div className="actions">
        ${res && res.ratio >= 0.95 ? html`<${Btn} onClick=${() => { setI(i + 1); setTxt(''); setRes(null); setTries(0); setPeek(false); }}>${L('Word for word · say it out loud once, then go on', 'Đúng nguyên văn · nói to một lần rồi tiếp')}</${Btn}>` :
          html`<${Btn} onClick=${check} disabled=${txt.trim().length < 5}>${L('Check', 'Kiểm tra')}</${Btn}>${tries >= 3 && html`<${Btn} kind="ghost" onClick=${() => { setI(i + 1); setTxt(''); setRes(null); setTries(0); setPeek(false); }}>${L('Save for tomorrow', 'Để ngày mai')}</${Btn}>`}`}
      </div>
    </${Fragment}>`}
  </div>`;
}

/* Number Lock */
const NUM_LABEL = { '10 + 4': 'ok', '50%': 'confirm', '3 / 3 / 15': 'ok', '400k / 190': 'other', '70 → 79': 'measured', '52 · 100%': 'measured', '67% · 4.57': 'confirm',
  '24h → 5 min · live': 'live', '70% · +20%': 'confirm', '60% · ½': 'estimate', '55 · 2': 'ok', '250+ / 50+': 'ok' };
const LABELS = [['live', '🟢 Live'], ['measured', L('📏 Measured', '📏 Đo được')], ['estimate', L('≈ Estimate', '≈ Ước tính')], ['confirm', L('🟨 Needs checking', '🟨 Cần xác nhận')], ['other', L('🏷️ Someone else’s number', '🏷️ Số của nơi khác')], ['ok', L('✅ Verified', '✅ Đã xác minh')]];
function numOk(target, typed) {
  const groups = (target.match(/\d+(?:[.,]\d+)?/g) || []);
  const got = (typed.replace(',', '.').match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
  const okD = groups.every(g => got.includes(g.replace(',', '.')));
  const half = !target.includes('½') || /½|half|1\/2|nửa|một nửa/i.test(typed);
  return okD && half;
}
function NumberLock({ level = 1, state, update, onDone }) {
  const [i, setI] = useState(-1); const [val, setVal] = useState(''); const [lab, setLab] = useState(null); const [res, setRes] = useState(null); const [score, setScore] = useState(0);
  const N = C.numbers;
  if (i < 0) return html`<div className="drill lock"><${DrillHead} icon="🔢" title=${'Number Lock ' + (level === 1 ? 'I' : 'II')} sub=${level === 1 ? L('12 dials · type the exact number', '12 mặt số · gõ đúng con số') : L('12 dials · the number, its label and a one-line definition', '12 mặt số · con số, nhãn và một câu định nghĩa')} />
    <div className="corridor"><div className="label">${L('The number corridor', 'Hành lang các con số')}</div><${Md} src=${C.corridor} className="small" /></div>
    <div className="actions"><${Btn} onClick=${() => setI(0)}>${L('Enter the corridor', 'Vào hành lang')}</${Btn}></div></div>`;
  if (i >= N.length) {
    return html`<div className="drill lock done"><${DrillHead} icon="🔓" title=${L('Unlocked', 'Khóa đã mở')} sub=${score + ' / ' + N.length + L(' dials', ' mặt số')} />
      <div className="dials">${N.map((n, k) => html`<span key=${k} className=${'dial ' + ((state.numbers[n.n] || 0) >= level ? 'open' : '')}>${n.n}</span>`)}</div>
      <div className="actions"><${Btn} onClick=${() => onDone({ score })}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  }
  const n = N[i]; const clue = plain(n.what).replace(/\d+(?:[.,]\d+)?\s?%?|½/g, '▢');
  const check = () => {
    const okN = numOk(n.n, val); const okL = level === 1 || lab === NUM_LABEL[n.n];
    const ok = okN && okL; setRes({ okN, okL });
    Sound.play(ok ? 'unlock' : 'fail');
    if (ok) { setScore(score + 1); update(s => { s.numbers[n.n] = Math.max(level, s.numbers[n.n] || 0); s.xp += 8; }); }
  };
  const truthRow = { '50%': 'T9', '67% · 4.57': 'T2 · T3', '70% · +20%': 'T6', '60% · ½': 'T7', '400k / 190': 'T11', '24h → 5 min · live': 'T5' }[n.n];
  return html`<div className="drill lock">
    <${DrillHead} icon="🔢" title=${'Number Lock ' + (level === 1 ? 'I' : 'II')} sub=${(i + 1) + L(' / 12 · use it for: ', ' / 12 · dùng cho: ') + plain(n.use)} />
    <div className="dials">${N.map((x, k) => html`<span key=${k} className=${'dial ' + (k < i ? 'open' : k === i ? 'cur' : '')}>${k < i ? x.n : '••'}</span>`)}</div>
    <div className="clue">${clue}</div>
    <input id=${'num-' + i} className="numin mono" value=${val} onInput=${e => setVal(e.target.value)} onKeyDown=${e => e.key === 'Enter' && !res && check()} placeholder=${L('Type the number…', 'Gõ con số…')} disabled=${!!res} />
    ${level === 2 && html`<div className="labels">${LABELS.map(([k, l]) => html`<button type="button" key=${k} className=${'lab' + (lab === k ? ' on' : '') + (res ? (k === NUM_LABEL[n.n] ? ' right' : lab === k ? ' wrong' : '') : '')} disabled=${!!res} onClick=${() => setLab(k)}>${l}</button>`)}</div>`}
    ${level === 2 && !res && html`<p className="small">${L('Say the one-line definition out loud before you check.', 'Nói to định nghĩa một câu trước khi kiểm tra.')}</p>`}
    ${res && html`<div className=${'lockres ' + (res.okN && res.okL ? 'ok' : 'no')}>
      <b className="mono">${res.okN && res.okL ? '🔓 ' : '🔒 '}${n.n}</b><${Md} src=${n.what} className="small" />
      ${truthRow && html`<div className="small">${L('Truth table: ', 'Bảng sự thật: ')}<${Chip} kind="amber">${truthRow}</${Chip}> ${C.truth.filter(t => truthRow.includes(t.id)).map(t => plain(t.todo)).join(' ').slice(0, 220)}</div>`}
    </div>`}
    <div className="actions">${!res ? html`<${Btn} onClick=${check} disabled=${!val.trim() || (level === 2 && !lab)}>${L('Turn the dial', 'Xoay khóa')}</${Btn}>` : html`<${Btn} onClick=${() => { setI(i + 1); setVal(''); setLab(null); setRes(null); }}>${L('Next dial', 'Mặt số tiếp')}</${Btn}>`}</div>
  </div>`;
}

/* Scam Detector */
function ScamDetector({ state, update, onDone, start = 0, count = 6 }) {
  const rounds = useMemo(() => { const r = []; for (let k = 0; k < count; k++) r.push(SCAM_ROUNDS[(start + k) % SCAM_ROUNDS.length]); return r; }, [start]);
  const [i, setI] = useState(0); const [sel, setSel] = useState(null); const [reason, setReason] = useState(null); const [res, setRes] = useState(null); const [score, setScore] = useState(0);
  if (i >= rounds.length) return html`<div className="drill done"><${DrillHead} icon="🚩" title="Scam Detector" sub=${L('Score: ', 'Điểm: ') + score + ' / ' + rounds.length} />
    <p className="small">${L('Every overclaim is a scam text you send the interviewer yourself. False alarms cost points too: that’s the “crying wolf” from Q28.', 'Mỗi câu nói quá là một tin nhắn lừa đảo bạn tự gửi cho người phỏng vấn. Báo nhầm cũng mất điểm: đó chính là "kêu sói" ở Q28.')}</p>
    <div className="actions"><${Btn} onClick=${() => { update(s => { s.drills.scam = [...(s.drills.scam || []), { d: s.day, score, n: rounds.length }]; s.xp += score * 10; }); onDone({ score }); }}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  const r = rounds[i];
  const submit = (asFine) => {
    let pts = 0, ok;
    if (asFine) { ok = r.bad === -1; pts = ok ? 1 : 0; }
    else { ok = sel === r.bad && (r.reasons.length === 0 || reason === r.ok); pts = r.bad === -1 ? -1 : ok ? 1 : sel === r.bad ? 0 : -1; }
    setScore(score + pts); setRes({ ok, pts, asFine }); Sound.play(ok ? 'read' : 'fail');
  };
  return html`<div className="drill scam">
    <${DrillHead} icon="🚩" title="Scam Detector" sub=${(i + 1) + ' / ' + rounds.length + L(' · Message request from “Minh (draft)”. One line might be an overclaim.', ' · Tin nhắn chờ từ “Minh (bản nháp)”. Một câu có thể là lời nói quá.')} />
    <div className="reqcard"><span className="reqctx">${L('Not in your contacts · draft answer · ', 'Chưa có trong danh bạ · bản nháp câu trả lời · ')}${r.t}</span>
      ${r.s.map((t, k) => html`<button type="button" key=${k} className=${'scamline' + (sel === k ? ' sel' : '') + (res ? (k === r.bad ? ' bad' : '') : '')} disabled=${!!res} onClick=${() => { setSel(k); setReason(null); }}>${t}</button>`)}
    </div>
    ${sel != null && !res && r.reasons.length > 0 && r.bad !== -1 && html`<div className="labels">${(r.reasons).map((x, k) => html`<button type="button" key=${k} className=${'lab' + (reason === k ? ' on' : '')} onClick=${() => setReason(k)}>${x}</button>`)}</div>`}
    ${sel != null && !res && (r.bad === -1 || r.reasons.length === 0) && html`<div className="labels"><button type="button" className="lab on">${L('Overclaim / not true', 'Nói quá / sai sự thật')}</button></div>`}
    ${res && html`<div className=${'lockres ' + (res.ok ? 'ok' : 'no')}><b>${res.ok ? (res.asFine ? L('✓ Right, this one’s clean.', '✓ Đúng, câu này sạch.') : L('✓ Good catch.', '✓ Bắt đúng.')) : res.pts < 0 ? L('✗ False alarm (−1).', '✗ Báo nhầm (−1).') : L('✗ Not quite.', '✗ Chưa đúng.')}</b>
      <div className="small">${r.bad === -1 ? L('No overclaim here.', 'Không có câu nói quá.') : L('The overclaim: “', 'Câu nói quá: “') + r.s[r.bad] + '”' + (r.reasons.length ? L(' · right reason: ', ' · lý do đúng: ') + r.reasons[r.ok] : '')}</div>
      <div className="small">${L('Honest version: ', 'Cách nói thật: ')}${r.honest}</div></div>`}
    <div className="actions">${!res ? html`<${Btn} kind="ghost" onClick=${() => submit(true)}>${L('Looks fine ✓', 'Trông ổn ✓')}</${Btn}><${Btn} disabled=${sel == null || (r.reasons.length > 0 && r.bad !== -1 && reason == null)} onClick=${() => submit(false)}>${L('Report 🚩', 'Báo cáo 🚩')}</${Btn}>` :
      html`<${Btn} onClick=${() => { setI(i + 1); setSel(null); setReason(null); setRes(null); }}>${L('Next message', 'Tin tiếp')}</${Btn}>`}</div>
  </div>`;
}

/* Rapid-fire quickfire */
function Rapidfire({ from = 1, to = 10, state, update, onDone, mixed = false }) {
  const list = useMemo(() => { const l = QF.filter(q => q.n >= from && q.n <= to); return mixed ? shuffle(l).slice(0, 12) : l; }, [from, to]);
  const [i, setI] = useState(0); const [rev, setRev] = useState(false); const [left, setLeft] = useState(20); const [log, setLog] = useState([]); const [fill, setFill] = useState('');
  const q = list[i];
  useEffect(() => { if (!q || rev) return; setLeft(20); const t0 = performance.now(); const id = setInterval(() => { const l = 20 - (performance.now() - t0) / 1000; setLeft(l); if (l <= 0) { clearInterval(id); setRev(true); } }, 100); return () => clearInterval(id); }, [i, rev]);
  if (!q) { const had = log.filter(x => x === 'had').length;
    return html`<div className="drill done"><${DrillHead} icon="🔔" title="Rapid-fire" sub=${had + ' / ' + list.length + L(' answered in 20 seconds', ' câu trong 20 giây')} /><div className="actions"><${Btn} onClick=${() => onDone({ had })}>${L('Next', 'Tiếp')}</${Btn}></div></div>`; }
  const filled = state.qfFill[q.id];
  const blocked = q.blocked && !filled;
  const next = k => { setLog([...log, k]); update(s => { s.qf[q.id] = { last: k, d: s.day, n: (s.qf[q.id]?.n || 0) + 1 }; }); setRev(false); setFill(''); setI(i + 1); };
  return html`<div className="drill rapid">
    <${DrillHead} icon="🔔" title="Rapid-fire" sub=${(i + 1) + ' / ' + list.length + L(' · 20 seconds max, one sentence is enough', ' · ≤ 20 giây, một câu là đủ')} />
    ${log.filter(x => x === 'miss').length > 0 && html`<div className="stack">${log.filter(x => x === 'miss').length}${L(' unread notifications', ' thông báo chưa đọc')}</div>`}
    <div className="banner" key=${q.id}><span className="b-app">Qualgo · now</span><b>${q.q}</b><span className="b-bar"><i style=${{ transform: `scaleX(${Math.max(0, left) / 20})` }}></i></span></div>
    ${blocked ? html`<div className="pendnote"><b>${L('🟨 This one needs your real answer.', '🟨 Câu này cần câu trả lời thật của bạn.')}</b> <${Md} src=${q.a + (q.note ? ' · ' + q.note : '')} className="small" />
        <input id=${'qf-' + q.id} value=${fill} onInput=${e => setFill(e.target.value)} placeholder=${L('Your real answer, one line (in English)', 'Câu trả lời thật, một dòng (tiếng Anh)')} />
        <div className="actions"><${Btn} kind="ghost" onClick=${() => next('skip')}>${L('Skip', 'Bỏ qua')}</${Btn}><${Btn} disabled=${fill.trim().length < 4} onClick=${() => { update(s => { s.qfFill[q.id] = fill.trim(); }); }}>${L('Save to Minh → Minh', 'Lưu vào Minh → Minh')}</${Btn}></div></div>` :
      !rev ? html`<div className="actions"><${Btn} onClick=${() => setRev(true)}>${L('I said it', 'Mình đã nói')}</${Btn}></div>` :
      html`<${Fragment}><div className="flash-a"><${Md} src=${filled || q.a} /></div>${q.note && !filled && html`<div className="small dim">${plain(q.note)}</div>`}
        <div className="seg3"><button type="button" className="segbtn had" onClick=${() => next('had')}>${L('Hit', 'Trúng')}</button><button type="button" className="segbtn blank" onClick=${() => next('miss')}>${L('Miss', 'Hụt')}</button></div></${Fragment}>`}
  </div>`;
}

/* Sketch canvas for the whiteboard */
function Sketch({ id }) {
  const ref = useRef(null); const drawing = useRef(false);
  useEffect(() => {
    const cv = ref.current; const ctx = cv.getContext('2d'); const dpr = window.devicePixelRatio || 1;
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = getComputedStyle(cv).color; };
    size();
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = e => { drawing.current = true; cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = e => { if (!drawing.current) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
    const up = () => { drawing.current = false; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointerleave', up);
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointerleave', up); };
  }, []);
  const clear = () => { const cv = ref.current; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); };
  return html`<div className="sketch"><canvas id=${id} ref=${ref} aria-label=${L('Drawing board', 'Bảng vẽ')}></canvas><button type="button" className="linkbtn" onClick=${clear}>${L('Clear board', 'Xóa bảng')}</button></div>`;
}

const CUPSF = [
  { k: 'C', name: 'Clarify', min: 5, nudge: 'What would you ask me before drawing?', check: L('≥ 2 clarifying questions; name the growth ↔ safety tension', '≥ 2 câu hỏi làm rõ; gọi tên căng thẳng tăng trưởng ↔ an toàn') },
  { k: 'U', name: 'Users & risks', min: 7, nudge: 'Who’s the most vulnerable user here?', check: L('≥ 2 specific Vietnamese personas, one of them older or outside a big city; a risk list', '≥ 2 persona Việt cụ thể, có một người lớn tuổi hoặc ngoài đô thị; bảng rủi ro') },
  { k: 'P', name: 'Principles', min: 3, nudge: 'What’s your rule for this design?', check: L('2 or 3 principles, said as choices', '2-3 nguyên tắc nói thành lựa chọn') },
  { k: 'S', name: 'Sketch', min: 10, nudge: 'What happens with a shared group of 3,000?', check: L('Main flow, key screens, at least one edge case or error state', 'Luồng chính, màn hình chính, ít nhất một edge case / trạng thái lỗi') },
  { k: 'F', name: 'Follow-up', min: 5, nudge: 'How would you know it worked, and didn’t break growth?', check: L('One success metric + one guardrail; what you’d do with more time', 'Một chỉ số thành công + một guardrail; điều sẽ làm nếu có thêm thời gian') },
];
function Whiteboard({ ex = 'strangers', label = 'Whiteboard I', state, update, onDone }) {
  const W = C.whiteboard[ex];
  const [started, setStarted] = useState(false); const sw = useStopwatch();
  const [notes, setNotes] = useState({}); const [checks, setChecks] = useState({}); const [end, setEnd] = useState(false); const [ai, setAi] = useState(null); const [busy, setBusy] = useState(false);
  const total = CUPSF.reduce((a, b) => a + b.min, 0) * 60;
  let acc = 0; const cur = CUPSF.findIndex(s => { acc += s.min * 60; return sw.sec < acc; });
  const step = cur < 0 ? CUPSF.length - 1 : cur;
  const prev = (state.drills.wb || []).filter(w => w.ex === ex || true);
  async function grade() {
    setBusy(true);
    const sample = await getSample();
    if (sample) {
      try {
        const j = await sample.json(`You are Vy, a senior product designer, grading a 30-minute whiteboard exercise transcript (notes) by a Lead Product Designer candidate, Minh, against the C-U-P-S-F method. Brief: "${W.brief}". Rubric: C asks ≥2 clarifying questions and names the growth/safety tension; U has ≥2 specific Vietnamese personas incl. an older or non-urban user and a risk list; P states 2–3 principles as choices; S has the main flow, key screens and ≥1 edge case/error state; F names a success metric AND a guardrail. Reply ONLY JSON {"C":0-2,"U":0-2,"P":0-2,"S":0-2,"F":0-2,"strength":"one sentence","fix":"one sentence","name_it":"a short memorable name for the idea, if any"}. Write strength and fix in ${L('English', 'Vietnamese')}.\n\nNOTES:\n${CUPSF.map(s => s.k + ': ' + (notes[s.k] || '(empty)')).join('\n')}`, { modelTier: 'default' });
        setAi(j);
      } catch (e) { setAi({ err: true }); }
    } else setAi({ err: true });
    setBusy(false);
  }
  function save() {
    const pts = ai && !ai.err ? CUPSF.reduce((a, s) => a + (+ai[s.k] || 0), 0) / 10 : CUPSF.filter(s => checks[s.k]).length / 5;
    update(s => { s.drills.wb = [...(s.drills.wb || []), { d: s.day, ex, min: Math.round(sw.sec / 60), pct: pts, firstP: notes.P ? 1 : 0 }]; s.xp += Math.round(pts * 60); });
    onDone({ pct: pts });
  }
  if (!started) return html`<div className="drill wb">
    <${DrillHead} who="vy" title=${label + ' · C-U-P-S-F'} sub=${L('30 minutes · think out loud · Vy just listens', '30 phút · nghĩ thành tiếng · Vy chỉ nghe')} />
    <${Bubble} who="vy"><span className="qtext">“${W.brief}”</span></${Bubble}>
    <p className="small">${L('Memory trick: ', 'Mẹo nhớ: ')}<b>${L('Can U Please Sketch Fast', 'Cô Út Pha Sữa Fin')}</b>${L('. Clarify · Users · Principles · Sketch · Follow-up. Talk out loud while you type your notes. The notes are what gets graded.', '. Clarify · Users · Principles · Sketch · Follow-up. Nói to trong lúc viết ghi chú; ghi chú là bản chép lời để chấm.')}</p>
    ${prev.length > 0 && html`<div className="small">${L('Last time: ', 'Lần trước: ')}${prev.map(p => L('Day ', 'Ngày ') + p.d + ' · ' + Math.round(p.pct * 100) + '%').join(' · ')}</div>`}
    <div className="actions"><${Btn} onClick=${() => { setStarted(true); sw.start(); }}>${L('Start the 30 minutes', 'Bắt đầu 30 phút')}</${Btn}></div></div>`;
  return html`<div className="drill wb">
    <div className="cupsf">${CUPSF.map((s, k) => html`<span key=${s.k} className=${k < step ? 'done' : k === step ? 'cur' : ''} style=${{ flex: s.min }}><b>${s.k}</b> ${s.name}</span>`)}</div>
    <div className="walkbar"><span className="mono">${fmt(sw.sec)} / ${fmt(total)}</span><span className="small">Vy: “${CUPSF[step].nudge}”</span></div>
    <${Sketch} id=${'sk-' + ex} />
    ${CUPSF.map(s => html`<div key=${s.k} className=${'wbnote' + (CUPSF[step].k === s.k ? ' cur' : '')}><label htmlFor=${'wb-' + ex + s.k}><b>${s.k} · ${s.name}</b> <span className="small dim">${s.check}</span></label><textarea id=${'wb-' + ex + s.k} rows=${CUPSF[step].k === s.k ? 4 : 2} value=${notes[s.k] || ''} onInput=${e => setNotes({ ...notes, [s.k]: e.target.value })}></textarea></div>`)}
    ${!end ? html`<div className="actions"><${Btn} onClick=${() => { sw.stop(); setEnd(true); }}>${L('Finish', 'Kết thúc bài')}</${Btn}></div>` : html`<${Fragment}>
      <div className="selfcheck"><div className="label">${L('Check yourself with C-U-P-S-F', 'Tự chấm theo C-U-P-S-F')}</div>${CUPSF.map(s => html`<label key=${s.k} className="chk"><input type="checkbox" id=${'wbc-' + s.k} checked=${!!checks[s.k]} onChange=${() => setChecks({ ...checks, [s.k]: !checks[s.k] })} /><span><b>${s.k}</b> ${s.check}</span></label>`)}</div>
      ${!ai ? html`<div className="actions"><${Btn} kind="ghost" disabled=${busy} onClick=${grade}>${busy ? L('Vy is reading…', 'Vy đang đọc…') : L('Ask Vy to grade your notes', 'Nhờ Vy chấm ghi chú')}</${Btn}></div>` : ai.err ? html`<div className="small dim">${L('Vy (AI) isn’t available in this view. Use the self-check.', 'Vy (AI) chưa sẵn sàng ở chế độ xem này. Dùng phần tự chấm.')}</div>` :
        html`<div className="coachcard"><div className="sendbars wide">${CUPSF.map(s => html`<span key=${s.k}><b>${s.k}</b><i style=${{ '--v': (+ai[s.k] || 0) / 2 }}></i></span>`)}</div><div className="cc-lines"><div><span className="ok">✔</span> ${ai.strength}</div><div><span className="no">✘</span> ${ai.fix}</div>${ai.name_it && html`<div><span className="pen">✎</span> ${L('Name the idea: ', 'Đặt tên cho ý tưởng: ')}<b>${ai.name_it}</b></div>`}</div></div>`}
      <${Collapse} title=${L('Model answer from the book', 'Bài mẫu trong sách')}><${Md} src=${W.model} /></${Collapse}>
      <div className="actions"><${Btn} onClick=${save}>${L('Save · next', 'Lưu bài · tiếp')}</${Btn}></div>
    </${Fragment}>`}
  </div>`;
}

/* Write-a-Warning (Day 4) */
function WriteWarning({ state, update, onDone }) {
  const [i, setI] = useState(0); const [txt, setTxt] = useState(''); const [r, setR] = useState(null); const [busy, setBusy] = useState(false);
  if (i >= WARNINGS.length) return html`<div className="drill done"><${DrillHead} who="hang" title="Write-a-Warning" sub=${L('Three warnings saved to Files.', 'Ba cảnh báo đã lưu vào Files.')} /><div className="actions"><${Btn} onClick=${() => onDone({})}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  const w = WARNINGS[i];
  async function grade() {
    setBusy(true); const sample = await getSample(); let out = null;
    if (sample) try { out = await sample.json(`You are Chị Hằng, Product Security lead at a Vietnamese secure-messenger company. Grade this in-app SCAM WARNING written in ${L('English', 'Vietnamese')} by a design candidate. Scam message the user received: ${w.msg}\nCriteria: specific (names what is unusual, not generic "this may be a scam"), calm (no shouting, no ALL CAPS, no "!!!"), one clear safer action (e.g. call the saved number, don't send OTP), short (≤ 40 words), plain ${L('English', 'Vietnamese')} a 58-year-old understands. Reply ONLY JSON {"score":1-5,"good":"one sentence in ${L('English', 'Vietnamese')}","fix":"one sentence in ${L('English', 'Vietnamese')}","rewrite":"your improved ${L('English', 'Vietnamese')} warning, ≤ 40 words"}.\n\nWARNING:\n${txt}`, { modelTier: 'quick' }); } catch (e) {}
    if (!out) { const words = (txt.match(/\S+/g) || []).length; const calm = !/!!|[A-ZĐ]{5,}/.test(txt); const act = /(gọi|không gửi|đừng|chặn|kiểm tra|liên hệ|call|don['’]t|do not|never|block|check|contact)/i.test(txt);
      out = { score: 1 + (words <= 40 ? 1 : 0) + (calm ? 1 : 0) + (act ? 1 : 0) + (words >= 12 ? 1 : 0), good: calm ? L('Calm tone.', 'Giọng bình tĩnh.') : L('You wrote a warning.', 'Có cảnh báo.'), fix: !act ? L('Add one clear safe action, like “Call the saved number”.', 'Thêm một hành động an toàn cụ thể, ví dụ “Gọi số đã lưu”.') : words > 40 ? L('Cut it to under 40 words.', 'Rút xuống dưới 40 từ.') : L('Say exactly what looks unusual.', 'Nêu cụ thể điều bất thường.'), rewrite: '', rule: true }; }
    setR(out); setBusy(false);
    update(s => { const arr = (s.drills.warn || []).filter(x => x.id !== w.id); s.drills.warn = [...arr, { id: w.id, text: txt, score: out.score, d: s.day }]; s.xp += out.score * 6; });
  }
  return html`<div className="drill">
    <${DrillHead} who="hang" title="Write-a-Warning" sub=${(i + 1) + ' / 3 · ' + w.title + L(' · a specific, calm warning', ' · cảnh báo tiếng Việt, cụ thể và bình tĩnh')} />
    <div className="reqcard"><span className="reqctx">${L('Message request · not in your contacts', 'Tin nhắn chờ · chưa có trong danh bạ')}</span><div className="scamline">${w.msg}</div></div>
    <textarea id=${'warn-' + w.id} rows="3" value=${txt} onInput=${e => setTxt(e.target.value)} placeholder=${L('Write the warning that shows above this message…', 'Viết cảnh báo hiển thị phía trên tin nhắn này…')} disabled=${!!r}></textarea>
    <div className="small mono">${(txt.match(/\S+/g) || []).length}${L(' / 40 words', ' / 40 từ')}</div>
    ${r && html`<div className="coachcard"><div className="cc-head"><${Avatar} p="hang" size=${30} /><span className="gbadge">${r.score}/5</span>${r.rule && html`<span className="small dim">${L('quick check', 'chấm nhanh')}</span>`}</div>
      <div className="cc-lines"><div><span className="ok">✔</span> ${r.good}</div><div><span className="no">✘</span> ${r.fix}</div>${r.rewrite && html`<div><span className="pen">✎</span> <i>${r.rewrite}</i></div>`}</div>
      ${i === 0 && html`<div className="small">${L('Top-tier example from the book: ', 'Mẫu tầng cao trong sách: ')}<i>${L('“This message asks for money from an unsaved number and says it’s a family member. Call them on their old number before you do anything.”', '“Tin nhắn này yêu cầu chuyển tiền từ một số chưa lưu và tự xưng là người thân. Hãy gọi cho người thân bằng số cũ trước khi làm gì.”')}</i></div>`}</div>`}
    <div className="actions">${!r ? html`<${Btn} disabled=${busy || txt.trim().length < 8} onClick=${grade}>${busy ? L('Chị Hằng is reading…', 'Chị Hằng đang đọc…') : L('Send to Chị Hằng', 'Gửi cho Chị Hằng')}</${Btn}>` : html`<${Btn} onClick=${() => { setI(i + 1); setTxt(''); setR(null); }}>${L('Next warning', 'Cảnh báo tiếp')}</${Btn}>`}</div>
  </div>`;
}

/* Critique Duel (Day 6) */
function Wire({ id }) {
  const common = { className: 'wire', viewBox: '0 0 160 260', role: 'img' };
  if (id === 'req') return html`<svg ...${common} aria-label="Wireframe: message request"><rect x="6" y="6" width="148" height="248" rx="18" className="w-frame" /><rect x="18" y="24" width="90" height="10" rx="4" className="w-ink" /><rect x="18" y="56" width="104" height="38" rx="12" className="w-them" /><rect x="26" y="66" width="70" height="6" rx="3" className="w-ink2" /><rect x="26" y="78" width="54" height="6" rx="3" className="w-link" /><rect x="18" y="206" width="124" height="34" rx="12" className="w-cta" /><text x="80" y="228" textAnchor="middle" className="w-ctat">Accept</text><text x="80" y="198" textAnchor="middle" className="w-tiny">block · report</text></svg>`;
  if (id === 'warn') return html`<svg ...${common} aria-label="Wireframe: full-screen warning"><rect x="6" y="6" width="148" height="248" rx="18" className="w-frame w-red" /><text x="80" y="96" textAnchor="middle" className="w-big">WARNING!!!</text><text x="80" y="118" textAnchor="middle" className="w-tiny2">This may be a scam!!!</text><rect x="30" y="200" width="100" height="32" rx="12" className="w-cta" /><text x="80" y="221" textAnchor="middle" className="w-ctat">OK</text></svg>`;
  if (id === 'group') return html`<svg ...${common} aria-label="Wireframe: auto-join group"><rect x="6" y="6" width="148" height="248" rx="18" className="w-frame" /><rect x="18" y="24" width="110" height="10" rx="4" className="w-ink" /><text x="18" y="56" className="w-tiny2">You were added to</text><text x="18" y="72" className="w-mid">${L('VIP Investing 💰', 'Đầu tư VIP 💰')}</text><text x="18" y="88" className="w-tiny">3,000 members</text>${[0, 1, 2, 3].map(k => html`<rect key=${k} x="18" y=${108 + k * 30} width=${80 + (k % 2) * 30} height="20" rx="8" className="w-them" />`)}</svg>`;
  return html`<svg ...${common} aria-label="Wireframe: device linked"><rect x="6" y="6" width="148" height="248" rx="18" className="w-frame" /><circle cx="80" cy="96" r="26" className="w-ok" /><path d="M68 96l9 9 17-19" className="w-tick" /><text x="80" y="146" textAnchor="middle" className="w-mid">Linked ✓</text><text x="80" y="164" textAnchor="middle" className="w-tiny">Windows · Chrome · Hà Nội · 02:13</text></svg>`;
}
const CRIT_MODEL = {
  req: 'Good: replying is fast. Problems: the stranger’s link is live before consent; “Accept” is the only strong action, so block and report are hidden. Fix: a waiting room with a context card (not in contacts, account age, no mutual groups), links disabled until accepted, and three equal actions: Accept · Delete · Block and report.',
  warn: 'Good: impossible to miss. Problems: shouting reads as noise and trains people to tap OK; it never says what is unusual or what to do instead. Fix: a calm, specific shield screen that names the signals and makes “Call the saved number” the primary action.',
  group: 'Good: zero friction for real groups. Problems: anyone can drop you into 3,000 strangers; there is no “who added you” context. Fix: invites from non-contacts go to Requests, showing inviter, mutual contacts and member count; joining is a choice.',
  link: 'Good: a clear success state. Problems: confirmation comes after linking, and the unusual detail (Hà Nội at 02:13) is tiny grey text. Fix: confirm before linking with device, browser, location and what it can do; ask “Did someone tell you to scan this?” on anomalies; notify every device with one-tap remove.' };
function CritiqueDuel({ state, update, onDone }) {
  const [i, setI] = useState(0); const [txt, setTxt] = useState(''); const [r, setR] = useState(null); const [busy, setBusy] = useState(false);
  if (i >= CRITIQUE.length) return html`<div className="drill done"><${DrillHead} who="vy" title="Critique Duel" sub=${L('Four patterns, using the Q20 structure: something good first, two problems, one fix.', 'Bốn pattern, theo cấu trúc Q20: điểm tốt trước, hai vấn đề, một cách sửa.')} /><div className="actions"><${Btn} onClick=${() => onDone({})}>${L('Next', 'Tiếp')}</${Btn}></div></div>`;
  const p = CRITIQUE[i];
  async function grade() {
    setBusy(true); const sample = await getSample(); let out = null;
    if (sample) try { out = await sample.json(`You are Vy, a senior product designer at a Vietnamese secure-messenger company. A Lead Designer candidate critiques a generic chat pattern (no real app). Pattern: "${p.title}": ${p.note}\nThey must follow: one genuine good thing first, two problems (trust/safety/usability), one concrete fix. Reply ONLY JSON {"score":1-5,"good":"one sentence","fix":"one sentence","missed":"the most important issue they missed, or empty"}. Write good, fix and missed in ${L('English', 'Vietnamese')}.\n\nCRITIQUE:\n${txt}`, { modelTier: 'quick' }); } catch (e) {}
    setR(out || { score: null, good: '', fix: '', rule: true }); setBusy(false);
    update(s => { s.drills.crit = [...(s.drills.crit || []), { id: p.id, d: s.day, score: out?.score || 0 }]; s.xp += 15; });
  }
  return html`<div className="drill crit">
    <${DrillHead} who="vy" title="Critique Duel" sub=${(i + 1) + ' / 4 · ' + p.title} />
    <div className="critrow"><${Wire} id=${p.id} /><div><p className="small">${p.note}</p><p className="small dim">${L('Q20 structure: “Good first” · two problems · one fix. Say it out loud, then type a short summary.', 'Cấu trúc Q20: “Good first” · hai vấn đề · một cách sửa. Nói to, rồi gõ tóm tắt.')}</p></div></div>
    <textarea id=${'crit-' + p.id} rows="4" value=${txt} onInput=${e => setTxt(e.target.value)} placeholder="Good: … Problems: … Fix: …" disabled=${!!r}></textarea>
    ${r && html`<div className="coachcard">${!r.rule && html`<div className="cc-head"><${Avatar} p="vy" size=${30} /><span className="gbadge">${r.score}/5</span></div><div className="cc-lines"><div><span className="ok">✔</span> ${r.good}</div><div><span className="no">✘</span> ${r.fix}</div>${r.missed && html`<div><span className="pen">!</span> ${r.missed}</div>`}</div>`}
      <div className="label">${L('Sample critique', 'Critique mẫu')}</div><p className="small">${CRIT_MODEL[p.id]}</p></div>`}
    <div className="actions">${!r ? html`<${Btn} disabled=${busy || txt.trim().length < 20} onClick=${grade}>${busy ? L('Vy is reading…', 'Vy đang đọc…') : L('Send to Vy', 'Gửi cho Vy')}</${Btn}>` : html`<${Btn} onClick=${() => { setI(i + 1); setTxt(''); setR(null); }}>${L('Next pattern', 'Pattern tiếp')}</${Btn}>`}</div>
  </div>`;
}

/* Story Forge (Day 8) */
function StoryForge({ state, update, onDone, initial = 13 }) {
  const [q, setQ] = useState(initial); const [a, setA] = useState({}); const [draft, setDraft] = useState(state.scripts['Q' + initial] || ''); const [busy, setBusy] = useState(false); const [step, setStep] = useState(state.scripts['Q' + initial] ? 2 : 0);
  const card = CARD['Q' + q];
  async function forge() {
    setBusy(true); const sample = await getSample(); let out = '';
    const words = FORGE_QS.map((x, k) => x + '\n' + (a[k] || '(blank)')).join('\n\n');
    if (sample) try { const r = await sample(`Draft a 90-second spoken interview answer (English, 170–210 words) for the question "${card.q}" using ONLY the facts in Minh's own notes below. Structure it as SEND: first sentence is the Signal (the answer in one line), then Evidence, a short Narrative with one imperfect detail and "I decided…", and a closing line that delivers to Qualgo (a secure messenger for Vietnam). Do NOT invent any fact, number, name or result that is not in the notes; where something is missing, write [fill in: …]. No headings, no bullet points, just the answer.\n\nMINH'S NOTES:\n${words}`, { modelTier: 'default' }); out = r.text; } catch (e) {}
    if (!out) out = (a[1] ? a[1] + ' ' : '') + (a[0] ? 'It happened when ' + a[0] + '. ' : '') + (a[2] ? 'What I’d do differently: ' + a[2] + '. ' : '') + (a[3] ? 'Afterwards, ' + a[3] + '. ' : '') + (a[5] ? 'The result: ' + a[5] + '. ' : '') + 'That’s what I’d bring to Qualgo: [fill in the bridge].';
    setDraft(out.trim()); setStep(2); setBusy(false);
  }
  function save() { update(s => { s.scripts[card.id] = draft; s.ledger['story-' + card.id] = { done: true, d: s.day }; s.xp += 40; }); toast(L('Saved My Script for ' + card.id, 'Đã lưu My Script cho ' + card.id)); onDone({}); }
  return html`<div className="drill forge">
    <${DrillHead} icon="⚒️" title="Story Forge" sub=${L('A real story, told only in your own words. It replaces the example frame in the book.', 'Câu chuyện thật, chỉ từ lời của bạn. Thay khung minh họa trong sách.')} />
    <div className="seg3 left">${[13, 39, 6].map(n => html`<button type="button" key=${n} className=${'segbtn' + (q === n ? ' had' : '')} onClick=${() => { setQ(n); setDraft(state.scripts['Q' + n] || ''); setStep(state.scripts['Q' + n] ? 2 : 0); setA({}); }}>Q${n} · ${n === 13 ? L('failure', 'thất bại') : n === 39 ? L('hard feedback', 'phản hồi khó') : L('the 2023-24 gap', 'khoảng trống 2023-24')}</button>`)}</div>
    <${Bubble} who=${card.persona}><span className="qtext">${card.q}</span></${Bubble}>
    ${step < 2 && html`<${Fragment}>${FORGE_QS.map((x, k) => html`<div key=${k} className="field"><label htmlFor=${'fg-' + q + k}>${k + 1}. ${x}</label><textarea id=${'fg-' + q + k} rows="2" value=${a[k] || ''} onInput=${e => setA({ ...a, [k]: e.target.value })}></textarea></div>`)}
      <p className="small dim">${L('Don’t write client names, internal data or NAB security details.', 'Không ghi tên khách hàng, dữ liệu nội bộ hay chi tiết bảo mật của NAB.')}</p>
      <div className="actions"><${Btn} disabled=${busy || Object.values(a).filter(v => v && v.trim()).length < 3} onClick=${forge}>${busy ? L('Coach Thư is writing a draft…', 'Coach Thư đang dựng bản nháp…') : L('Build a 90-second draft', 'Dựng bản nháp 90 giây')}</${Btn}></div></${Fragment}>`}
    ${step === 2 && html`<${Fragment}><div className="field"><label htmlFor=${'fgd-' + q}>${L('Draft. Edit it until it sounds like you, and remove every [fill in] before you save.', 'Bản nháp. Sửa cho đúng giọng bạn, xóa mọi [fill in] trước khi lưu.')}</label><textarea id=${'fgd-' + q} rows="9" value=${draft} onInput=${e => setDraft(e.target.value)}></textarea></div>
      <div className="actions"><${Btn} kind="ghost" onClick=${() => setStep(0)}>${L('Start over', 'Làm lại')}</${Btn}><${Btn} disabled=${/\[fill in/i.test(draft) || draft.trim().length < 40} onClick=${save}>${L('Approve · save as My Script', 'Duyệt · lưu làm My Script')}</${Btn}></div></${Fragment}>`}
  </div>`;
}

/* Salary Card: numbers stay on this device and are never sent to the coach */
function SalaryCard({ onDone }) {
  const load = () => { try { return JSON.parse(localStorage.getItem('delivered.salary') || '{}'); } catch (e) { return {}; } };
  const [v, setV] = useState(load); const [reps, setReps] = useState(0); const [t0, setT0] = useState(null); const [pause, setPause] = useState([]);
  const set = (k, x) => { const n = { ...v, [k]: x }; setV(n); try { localStorage.setItem('delivered.salary', JSON.stringify(n)); } catch (e) {} };
  return html`<div className="drill salary">
    <${DrillHead} icon="💌" title="Salary Card" sub=${L('Saved on this device only. Never sent to the Coach.', 'Chỉ lưu trên thiết bị này. Không bao giờ gửi cho Coach.')} />
    <div className="grid3">${[['walk', 'Walk-away'], ['target', 'Target'], ['anchor', 'Anchor']].map(([k, l]) => html`<div key=${k} className="field"><label htmlFor=${'sal-' + k}>${l}${L(' (VND/month, gross)', ' (VND/tháng, gross)')}</label><input id=${'sal-' + k} className="mono" value=${v[k] || ''} onInput=${e => set(k, e.target.value)} /></div>`)}</div>
    <p className="small">${L('Anchor line: ', 'Câu neo: ')}<i>“Based on the scope of the role and market data, I’m looking at around <b>${v.anchor || '[ANCHOR]'}</b> gross per month, and I’m flexible on how the package is structured.”</i></p>
    <div className="pausebox">
      <span className="small">${L('Time your pause before the number (goal: under 1.5 seconds). Tap “Chị Ngân asks”, then tap “Number!” the moment you start saying it.', 'Đo khoảng dừng trước con số (mục tiêu < 1,5 giây): bấm “Hỏi”, rồi bấm “Con số” ngay khi bạn bắt đầu nói con số.')}</span>
      <div className="actions">${t0 == null ? html`<${Btn} kind="ghost" onClick=${() => setT0(performance.now())}>${L('Chị Ngân asks', 'Chị Ngân hỏi')}</${Btn}>` : html`<${Btn} onClick=${() => { setPause([...pause, (performance.now() - t0) / 1000].slice(-10)); setT0(null); setReps(reps + 1); }}>${L('Number!', 'Con số!')}</${Btn}>`}</div>
      <div className="mono small">${reps}${L(' / 10 reps · ', ' / 10 lần · ')}${pause.map(p => p.toFixed(1) + 's').join(' · ')}</div>
    </div>
    ${onDone && html`<div className="actions"><${Btn} onClick=${() => onDone({ reps })}>${L('Next', 'Tiếp')}</${Btn}></div>`}
  </div>`;
}
