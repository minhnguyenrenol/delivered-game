/* Day flow, group calls, chat list, ledger, coach, floor map, scorecard, files and the app shell. */

/* ---------- icons: one stroke family, drawn here ---------- */
const ICON = {
  chat: 'M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z',
  floor: 'M12 3.5l8.5 4.5-8.5 4.5-8.5-4.5zM3.5 12.5l8.5 4.5 8.5-4.5M3.5 16.5l8.5 4.5 8.5-4.5',
  score: 'M5 19.5v-7M10 19.5v-13M15 19.5v-9M20 19.5v-4M3.5 19.5h17',
  files: 'M3.5 6.5h6l2 2h9v10.5h-17z',
  back: 'M14.5 5.5l-6.5 6.5 6.5 6.5',
  lock: 'M6.5 11h11v8.5h-11zM9 11V8.5a3 3 0 016 0V11',
  flame: 'M12 20.5c3.6 0 5.8-2.4 5.8-5.6 0-3.7-2.8-5.5-3.8-8.4-1.8 1.7-2 3.6-2 4.7-1-.8-1.9-2-1.9-3.8-2 1.9-3.9 4.3-3.9 7.5 0 3.2 2.2 5.6 5.8 5.6z',
  phone: 'M6 4.5h3l1.8 4.3-2.1 1.3a10 10 0 004.9 4.9l1.3-2.1 4.3 1.8v3a1.4 1.4 0 01-1.5 1.4A15 15 0 014.6 6a1.4 1.4 0 011.4-1.5z',
  sliders: 'M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9M15 5v5M9 14v5',
  pin: 'M9 4.5h6l-1 5 3 3v1.5H7V12.5l3-3zM12 14v5.5',
  spark: 'M12 4v4M12 16v4M4 12h4M16 12h4M6.6 6.6l2.6 2.6M14.8 14.8l2.6 2.6M6.6 17.4l2.6-2.6M14.8 9.2l2.6-2.6',
  close: 'M6 6l12 12M18 6L6 18',
  speaker: 'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11',
  mute: 'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM16 9.5l5 5M21 9.5l-5 5',
  note: 'M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 15.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  globe: 'M12 3.5a8.5 8.5 0 110 17 8.5 8.5 0 010-17zM3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z',
};
function Icon({ n, size = 20, className = '' }) { return html`<svg className=${'icon ' + className} width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true"><path d=${ICON[n]} /></svg>`; }

/* ---------- day helpers ---------- */
const SEG_NAME = { warm: L('Warm-up', 'Khởi động'), learn: L('New messages', 'Tin mới'), voice: 'Voice note', review: L('Review', 'Ôn lại'), call: L('Call', 'Cuộc gọi'), night: L('Evening', 'Buổi tối') };
const enPl = (n, one, many) => (n === 1 ? one : many);
const SEG_MIN = { warm: 5, learn: 20, voice: 10, review: 20, call: 25, night: 5 };
const newIdsFor = d => (SCHED[d]?.new_ids || []).map(n => 'Q' + n);
const dayOf = (state, d) => state.days[d] || {};
function segsFor(state, d) {
  const M = DAY_META[d]; const ds = dayOf(state, d);
  if (d === 14) return ['warm', 'call', 'night'];
  if (M.boss) return ['warm', 'learn', 'review', 'call', 'night'];
  if (ds.short && !M.noShort) return ['warm', 'review', 'night'];
  return ['warm', 'learn', 'voice', 'review', 'night'];
}
function segMinutes(state, d) { return segsFor(state, d).reduce((a, k) => a + (k === 'call' ? CALLS[d].mins : SEG_MIN[k]), 0); }
function unlockedDay(state) {
  let d = 1;
  while (d < 14 && state.days[d]?.closed && (state.settings.lockOff || state.days[d].closedOn !== todayISO())) d++;
  return d;
}
function closeDay(s, d, unsure) {
  const x = s.days[d] = s.days[d] || {}; if (x.closed) return;
  const today = todayISO(), y1 = todayISO(new Date(Date.now() - 864e5)), y2 = todayISO(new Date(Date.now() - 2 * 864e5));
  x.closed = true; x.closedOn = today; x.unsure = unsure;
  if (!s.lastClosed || s.lastClosed === y1) s.streak += 1;
  else if (s.lastClosed === today) { /* several days closed on one date: no change */ }
  else if (s.lastClosed === y2 && s.freezes > 0) { s.freezes -= 1; s.streak += 1; x.usedFreeze = true; }
  else s.streak = 1;
  s.best = Math.max(s.best, s.streak); s.lastClosed = today; s.xp += 30;
}
function whoFor(card, list) { return list.includes(card.persona) ? card.persona : list[card.n % list.length]; }
const avgN = gs => gs.length ? gs.reduce((a, g) => a + (GRADE_N[g] || 0), 0) / gs.length : 0;
const nToG = n => n >= 4.5 ? 'S' : n >= 3.5 ? 'A' : n >= 2.5 ? 'B' : n >= 1.5 ? 'C' : 'F';

/* ---------- group calls ---------- */
const CLOUD_FOLLOW = { q: 'And if we need cloud for summaries?', hostile: true, sample: "Then it's opt-in, per chat. Before it runs, we explain it in one plain line, like \"This summary is made on our server and deleted right after.\" While it runs, there's a clear sign on the screen. Nothing is kept afterwards. If we can't explain it that simply, we shouldn't ship it yet. At NAB the fulfilment work came down to the same question: what the system can do alone, and where a person still checks. Here, on-device stays the default for everyone who doesn't opt in.", note: L("It gives a rule users can understand and a line you won't cross, which is what a privacy company wants to hear.", "Câu này đưa ra một quy tắc người dùng hiểu được và một giới hạn bạn không vượt qua, đúng điều một công ty bảo mật muốn nghe."),
  a: '*"Then it’s opt-in, per chat, explained in one plain line before it happens, with a visible indicator while it runs and nothing kept afterwards. If we can’t say that simply, we shouldn’t ship it yet."*' };
const CALLS = {
  7: { who: ['linh', 'khoa'], fixed: [1, 3, 5], pool: 'ABCD', extra: 3, mins: 25, name: L('Round 1: TA and hiring manager', 'Round 1: TA và hiring manager') },
  11: { who: ['hang', 'hai'], fixed: [28, 53], pool: 'CDG', extra: 3, mins: 20, drop: true, name: L('Round 2: Security and AI', 'Round 2: Security và AI') },
  13: { who: ['ceo', 'ngan'], fixed: [2, 32, 56, 58, 62, 63, 66, 67, 68], pool: '', extra: 0, mins: 25, name: L('Round 3: CEO and HRBP', 'Round 3: CEO và HRBP') },
  14: { who: ['khoa', 'vy', 'hang', 'mai', 'ngan'], fixed: [], pool: 'ABCDEFGHIJ', extra: 10, mins: 45, final: true, name: 'Final panel' },
};
function followFor(d, card) {
  if (d === 7 && card.n === 5) { const b3 = SHADOW.find(x => x.b === 'B3'); return [{ q: b3.q.replace(' chat', ''), a: b3.a, hostile: true }]; }
  if (d === 11 && card.n === 28) return [{ ...card.follow_ups[0], hostile: true }];
  if (d === 11 && card.n === 53) return [{ ...card.follow_ups[0], hostile: true }, CLOUD_FOLLOW];
  return undefined;
}
function pickCallQs(state, d) {
  const K = CALLS[d]; const fixed = K.fixed.map(n => 'Q' + n);
  const pool = CARDS.filter(c => K.pool.includes(c.room) && !fixed.includes(c.id));
  const learned = shuffle(pool.filter(c => isLearned(state, c.id))), rest = shuffle(pool.filter(c => !isLearned(state, c.id)));
  return [...fixed, ...[...learned, ...rest].slice(0, K.extra).map(c => c.id)];
}
function endingFor(state) {
  const fin = state.boss[14]; if (!fin) return null;
  const rows = C.scorecard.filter(r => rowStatus(state, r).done).length;
  if (fin.overs > 1 || fin.avg < 2.5) return 'seen';
  if (fin.overs === 0 && fin.avg >= 4.3 && rows >= 8) return 'offer';
  if (fin.avg >= 3.7) return 'offerq';
  return 'second';
}

function CallSeg({ d, state, update, onDone }) {
  const K = CALLS[d]; const call = dayOf(state, d).call || {};
  useEffect(() => { Sound.setMood('call'); return () => Sound.setMood('calm'); }, []);
  useEffect(() => { if (call.phase === 'dropped') Sound.play('drop'); if (call.phase === 'end' && d === 14) { const e = endingFor(state.boss[14] ? state : { ...state, boss: { ...state.boss, 14: { avg: avgN((call.log || []).map(x => x.g)), overs: (call.log || []).filter(x => x.over).length } } }); Sound.play(e === 'offer' || e === 'offerq' ? 'win' : 'close'); } }, [call.phase]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const setCall = fn => update(s => { const x = s.days[d] = s.days[d] || {}; x.call = x.call || {}; fn(x.call, s); });
  const elapsed = call.t0 ? (now - call.t0) / 1000 : 0;
  const head = html`<div className="callbar">
    <div className="callfaces">${K.who.map(p => html`<${Avatar} key=${p} p=${p} size=${36} trust=${state.trust[p]} />`)}</div>
    <div className="callmeta"><b>${K.name}</b><span className="mono">${call.t0 ? fmt(elapsed) + ' / ' + K.mins + ':00' : K.mins + L(' min', ' phút')}</span></div>
    ${call.qs && html`<span className="mono callcount">${Math.min(call.i + 1, call.qs.length)}/${call.qs.length}</span>`}
  </div>`;

  if (!call.qs) return html`<div className="callscreen lobby">${head}
    <div className="lobby-faces">${K.who.map(p => html`<div key=${p} className="lobby-p"><${Avatar} p=${p} size=${64} /><b>${PERSONAS[p].name}</b><span>${PERSONAS[p].role}</span></div>`)}</div>
    <p className="small">${K.final ? L('First a 45-minute portfolio talk, then 10 random questions, then a walk through the whole building in your head. Every answer counts as a panel answer.', 'Portfolio 45 phút trước, rồi 10 câu ngẫu nhiên, rồi đi trọn tòa nhà trong đầu. Mọi câu đều tính là trả lời trong panel.') : L('Answers in a call count as “panel” for the Scorecard. ', 'Câu trả lời trong cuộc gọi tính là “panel” cho Scorecard. ') + (K.drop ? L('One overclaim and the call drops.', 'Một câu nói quá là cuộc gọi rớt.') : L('You can’t see the sample answer before you reply.', 'Không có nút xem câu mẫu trước khi trả lời.'))}</p>
    <div className="actions"><${Btn} onClick=${() => { if (cinePref.get() && !reducedMotion()) playCine(K.final ? 'final' : 'call', { title: K.name, sub: K.who.map(p => PERSONAS[p].name).join(', ') }).then(() => Sound.play('join')); else { Sound.play('ring'); setTimeout(() => Sound.play('join'), 2300); } setCall(c => { c.qs = pickCallQs(state, d); c.i = 0; c.log = []; c.t0 = Date.now(); c.phase = K.final ? 'portfolio' : 'qs'; }); }}><${Icon} n="phone" size=${18} /> ${L('Join the call', 'Tham gia cuộc gọi')}</${Btn}></div>
  </div>`;

  if (call.phase === 'portfolio') return html`<div className="callscreen">${head}<${Portfolio} onDone=${() => setCall(c => { c.phase = 'qs'; })} /></div>`;

  if (call.phase === 'qs') {
    const id = call.qs[call.i]; const card = CARD[id];
    return html`<div className="callscreen">${head}
      <${CardRun} key=${id + call.i} card=${card} state=${state} update=${update} mode="boss" who=${whoFor(card, K.who)} followSeq=${followFor(d, card)}
        onDone=${r => setCall((c, s) => {
          const over = !!(r.result && r.result.overclaims && r.result.overclaims.length);
          c.log = [...(c.log || []), { id, g: r.g, over }];
          if (K.drop && over) { c.phase = 'dropped'; return; }
          c.i += 1; if (c.i >= c.qs.length) c.phase = K.final ? 'walk' : 'end';
        })} />
    </div>`;
  }

  if (call.phase === 'dropped') { const last = call.log[call.log.length - 1];
    return html`<div className="callscreen dropped">${head}
      <div className="dropcard"><${Icon} n="phone" size=${28} className="off" /><b>${L('Call dropped', 'Cuộc gọi bị ngắt')}</b>
        <p className="small">${L('Your answer to ' + last.id + ' had something the interviewer could check, and it wasn’t true. In a real room, this is when they stop listening.', 'Câu trả lời cho ' + last.id + ' có một điều người phỏng vấn kiểm tra được và không đúng. Trong phòng thật, đây là lúc họ thôi lắng nghe.')}</p>
        <p className="small">${L('Fix that answer with Coach Thư, confirm the items in Minh → Minh, then call back. Your other answers keep their grades.', 'Sửa câu đó trong Coach Thư, xác nhận các mục trong Minh → Minh, rồi gọi lại. Các câu khác giữ nguyên điểm.')}</p></div>
      <div className="actions"><${Btn} onClick=${() => setCall(c => { c.qs = pickCallQs(state, d); c.i = 0; c.log = []; c.t0 = Date.now(); c.phase = 'qs'; c.redials = (c.redials || 0) + 1; })}>${L('Call back', 'Gọi lại')}</${Btn}></div>
    </div>`; }

  if (call.phase === 'walk') return html`<div className="callscreen">${head}
    <${PalaceWalk} ids=${CARDS.map(c => c.id)} state=${state} timed=${true} title=${L('Walk the whole building, 72 objects', 'Đi trọn tòa nhà, 72 vật')} onDone=${r => setCall(c => { c.walk = { had: r.had, sec: Math.round(r.sec) }; c.phase = 'score'; })} /></div>`;

  if (call.phase === 'score') return html`<div className="callscreen">${head}
    <div className="drill"><${DrillHead} icon="📊" title=${L('Go over the Scorecard with the panel', 'Xem lại Scorecard cùng panel')} sub=${L('Any row below 5 is a question they’ll take back to the meeting room.', 'Hàng nào chưa đạt 5 là câu hỏi họ sẽ mang về phòng họp.')} />
      <${ScoreMini} state=${state} />
      <div className="actions"><${Btn} onClick=${() => setCall(c => { c.phase = 'end'; })}>${L('End the Q&A', 'Kết thúc phần hỏi đáp')}</${Btn}></div></div></div>`;

  /* end */
  const gs = (call.log || []).map(x => x.g); const avg = avgN(gs); const overs = (call.log || []).filter(x => x.over).length;
  const finalize = () => update(s => {
    if (s.boss[d]?.closedAt && s.boss[d].t0 === call.t0) return;
    s.boss[d] = { avg, grades: gs, overs, t0: call.t0, closedAt: Date.now(), walk: call.walk || null };
    s.xp += 80;
    if (d === 7) s.freezes = Math.min(3, s.freezes + 1);
    if (avg < 3.5) (call.log || []).filter(x => (GRADE_N[x.g] || 0) <= 3).forEach(x => { const c0 = cs(s, x.id); s.cards[x.id] = { ...c0, box: 1, due: d + 1 }; });
  });
  const end = d === 14 ? endingFor({ ...state, boss: { ...state.boss, 14: { avg, overs } } }) : null;
  return html`<div className="callscreen end">${head}
    <div className="callsum">
      <div className="callgrades">${(call.log || []).map((x, k) => html`<span key=${k} className="cg" title=${CARD[x.id].q}><small className="mono">${x.id}</small><${GradeBadge} g=${x.g} /></span>`)}</div>
      <div className="callavg"><${GradeBadge} g=${nToG(avg)} /><span><b>${L('Average ', 'Trung bình ')}${avg.toFixed(1)} / 5</b><span className="small">${overs ? overs + L(enPl(overs, ' overclaim', ' overclaims'), ' câu nói quá') : L('No overclaims', 'Không có câu nói quá')}${call.walk ? L(', walk ' + call.walk.had + '/72 in ' + fmt(call.walk.sec), ', đi bộ ' + call.walk.had + '/72 trong ' + fmt(call.walk.sec)) : ''}</span></span></div>
      ${d === 7 && html`<p className="small">${L('Round 1 done: you get one more streak freeze. ', 'Hoàn thành Round 1: thêm một băng đóng (freeze) cho chuỗi ngày. ')}${avg < 3.5 ? L('Answers below A are due again tomorrow.', 'Những câu dưới A sẽ đến hạn ngày mai.') : ''}</p>`}
      ${d === 11 && call.redials ? html`<p className="small">${L('Called back ' + call.redials + enPl(call.redials, ' time', ' times') + '. No drop this time.', 'Gọi lại ' + call.redials + ' lần. Lần này không rớt.')}</p>` : ''}
    </div>
    ${end && html`<${Ending} k=${end} />`}
    <div className="actions"><${Btn} onClick=${() => { finalize(); onDone(L('Average ', 'Trung bình ') + avg.toFixed(1) + (overs ? ', ' + overs + L(enPl(overs, ' overclaim', ' overclaims'), ' câu nói quá') : '')); }}>${L('Leave the call', 'Rời cuộc gọi')}</${Btn}></div>
  </div>`;
}

function Portfolio({ onDone }) {
  const sw = useStopwatch(); useEffect(() => { sw.start(); }, []);
  const rows = C.portfolio45.split('\n').filter(l => /^\|\s*\d/.test(l)).map(l => l.split('|').map(x => x.trim()).filter((x, i, a) => i > 0 && i < a.length - 1));
  const mins = rows.map(r => { const m = r[0].match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/); return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : [0, 0]; });
  const idx = (() => { const k = mins.findIndex(m => sw.sec < m[1]); return k < 0 ? rows.length - 1 : k; })();
  return html`<div className="drill presenter">
    <${DrillHead} icon="🖥️" title=${L('45-minute portfolio', 'Portfolio 45 phút')} sub=${L('Present the real thing on your other screen. This is just the clock and the script.', 'Trình chiếu thật trên màn hình kia. Ở đây chỉ là đồng hồ và kịch bản.')} />
    <${TimerBar} sec=${sw.sec} target=${45 * 60} on=${sw.on} onToggle=${() => sw.on ? sw.stop() : sw.start()} label=${L('Continue', 'Tiếp tục')} />
    <ol className="agenda">${rows.map((r, k) => html`<li key=${k} className=${k === idx ? 'cur' : k < idx ? 'done' : ''}><span className="mono">${r[0]}</span><div><b>${plain(r[1])}</b>${r[2] && html`<${Md} src=${r[2]} className="small" />`}</div></li>`)}</ol>
    <div className="actions"><${Btn} onClick=${() => { sw.stop(); onDone(); }}>${L('Go to Q&A', 'Sang phần hỏi đáp')}</${Btn}></div>
  </div>`;
}

let endingPlayed = false;
function Ending({ k }) {
  const E = ENDINGS[k];
  useEffect(() => { if (k !== 'seen' && !endingPlayed) { endingPlayed = true; playCine('delivered', { title: E.title }); } }, []);
  if (k === 'seen') return html`<div className="ending seen"><div className="seenrow"><${Bubble} from="me" ticks="read">Thank you all for your time today. I’d love to hear about next steps.</${Bubble}></div>
    <p className="small">${L('Seen ✓✓. No reply. This is only a game: it’s saying some answers aren’t ready yet. Open the Scorecard, pick the three lowest rows, and practice them in Interview Week.', 'Seen ✓✓. Không có tin trả lời. Đây chỉ là game: nó nói rằng có những câu chưa sẵn sàng. Mở Scorecard, chọn ba hàng thấp nhất, và luyện chúng trong Interview Week.')}</p></div>`;
  return html`<div className=${'ending ' + k}><div className="ending-h"><${Avatar} p=${E.from} size=${40} /><b>${E.title}</b></div>
    <${Bubble} who=${E.from}>${E.msg}</${Bubble}>
    <p className="small dim">${L('The game picked this ending from your practice scores. It’s not a prediction about Qualgo.', 'Kết thúc này do game tính từ điểm luyện tập, không phải dự đoán về Qualgo.')}</p></div>`;
}

/* ---------- segments ---------- */
function Onboard({ onDone }) {
  const [said, setSaid] = useState(0);
  return html`<div className="onboard">
    <${Bubble} who="thu"><span className="who">Coach Thư</span>${L('Hi Minh. 14 days, one hour a day, and every interview question is a message. The interviewer reads what you send, and the ticks show how much of it landed.', 'Chào Minh. 14 ngày, mỗi ngày một giờ, mọi câu hỏi phỏng vấn đều là một tin nhắn. Người phỏng vấn đọc tin của bạn và dấu tick cho biết họ nhận được bao nhiêu.')}</${Bubble}>
    <div className="legend">
      ${[['fail', 'Failed to send', L('An overclaim or something untrue. That’s an F, however good the rest is.', 'Nói quá hoặc sai sự thật. Điểm F, dù phần còn lại hay đến đâu.')], ['sent', 'Sent · C', L('They heard you but remember nothing.', 'Họ nghe nhưng không nhớ gì.')], ['delivered', 'Delivered · B', L('Right idea, but no proof or too long.', 'Đúng ý, thiếu bằng chứng hoặc quá dài.')], ['read', 'Read · A', L('Clear, with a number and a decision.', 'Rõ, có số, có quyết định.')], ['typing', 'Read + typing · S', L('They want to ask more because they’re curious, not because they doubt you.', 'Họ muốn hỏi tiếp vì tò mò, không phải vì nghi ngờ.')]].map(([t, n, d]) => html`<div key=${t} className="leg"><span className="legtick"><${Ticks} kind=${t} animate=${false} /></span><b>${n}</b><span className="small">${d}</span></div>`)}
    </div>
    <div className="sendcard">
      <div className="sendrow"><b>S</b><span><b>Signal.</b> ${L('Your first sentence is the answer. Like the preview line in a push notification: read it and you get it.', 'Câu đầu tiên là câu trả lời. Như dòng xem trước trong thông báo đẩy: đọc là hiểu.')}</span></div>
      <div className="sendrow"><b>E</b><span><b>Evidence.</b> ${L('One project and one number, labeled right: live or MVP, measured or estimated.', 'Một dự án và một con số, gắn nhãn đúng: live hay MVP, đo được hay ước tính.')}</span></div>
      <div className="sendrow"><b>N</b><span><b>Narrative.</b> ${L('One decision (“I decided…”) and one thing that didn’t go perfectly.', 'Một quyết định (“I decided…”) và một chi tiết không hoàn hảo.')}</span></div>
      <div className="sendrow"><b>D</b><span><b>Deliver.</b> ${L('Your last line ties back to Qualgo: scams, chat, trust, Vietnamese users.', 'Câu cuối nối về Qualgo: lừa đảo, chat, niềm tin, người dùng Việt.')}</span></div>
      <p className="small">${L('Memory trick: ', 'Mẹo nhớ: ')}<b>SEND</b>${L(' is the Send button. Every answer has to go out in 90 seconds.', ' chính là nút Gửi. Mỗi câu trả lời phải gửi đi được trong 90 giây.')}</p>
    </div>
    <div className="oneliner"><span className="small">${L('Your one-liner. Say it out loud three times, in English.', 'Câu một dòng của bạn. Nói to ba lần, bằng tiếng Anh.')}</span><b>“${C.oneliner}”</b>
      <div className="actions"><${Btn} kind="ghost" disabled=${said >= 3} onClick=${() => setSaid(Math.min(3, said + 1))}>${said >= 3 ? L('✓ Said 3/3', '✓ Đã nói 3/3') : L('Said ' + said + '/3', 'Đã nói ' + said + '/3')}</${Btn}></div></div>
    <p className="small">${L('A 🟨 item is something not confirmed yet. A question with 🟨 left can only reach grey ✓✓ until you confirm it in ', 'Mục 🟨 là điều chưa được xác nhận. Câu hỏi còn 🟨 chỉ đạt tối đa ✓✓ xám cho đến khi bạn xác nhận trong ')}<b>Minh → Minh</b>${L('. The game never treats an unconfirmed number as true.', '. Game không bao giờ coi một con số chưa xác nhận là sự thật.')}</p>
    <div className="actions"><${Btn} disabled=${said < 3} onClick=${() => onDone(L('Read the rules, said the one-liner 3 times', 'Đã đọc luật chơi, câu một dòng 3 lần'))}>${L('Start with Chị Linh', 'Bắt đầu với Chị Linh')}</${Btn}></div>
  </div>`;
}

function WarmSeg({ d, state, update, onDone }) {
  const [step, setStep] = useState(0); const [walk, setWalk] = useState(null);
  if (d === 1) return html`<${Onboard} onDone=${onDone} />`;
  if (d === 14) { const weak = CARDS.filter(c => isLearned(state, c.id)).sort((a, b) => bestGrade(state, a.id) - bestGrade(state, b.id)).slice(0, 8).map(c => c.id);
    return html`<${OpenerFlash} ids=${weak} state=${state} update=${update} title=${L('Your 8 weakest, 5 seconds each', '8 câu yếu nhất, 5 giây mỗi câu')} onDone=${r => onDone(r.had + '/' + r.n + L(' openers', ' câu mở đầu'))} />`; }
  const yIds = newIdsFor(d - 1);
  const due = dueToday(state, d).filter(id => isLearned(state, id) && !yIds.includes(id)).slice(0, 6);
  if (step === 0 && yIds.length) return html`<${PalaceWalk} ids=${yIds} state=${state} title=${L('Walk back through yesterday’s rooms', 'Đi lại các phòng hôm qua')} onDone=${r => { setWalk(r); setStep(1); }} />`;
  return html`<${OpenerFlash} ids=${due} state=${state} update=${update} onDone=${r => onDone((walk ? walk.had + '/' + walk.n + L(' objects from yesterday, ', ' vật hôm qua, ') : '') + (r.n ? r.had + '/' + r.n + L(' due openers', ' câu mở đầu đến hạn') : L('nothing due', 'không có câu đến hạn')))} />`;
}

function LearnSeg({ d, state, update, onDone }) {
  const ids = newIdsFor(d); const done = dayOf(state, d).learned || []; const M = DAY_META[d];
  const next = ids.find(id => !done.includes(id));
  useEffect(() => { if (!next) onDone(ids.length + L(' new questions: ', ' câu mới: ') + ids.map(id => CARD[id].sticker).join(' ')); }, [next]);
  if (!next) return null;
  const c = CARD[next];
  return html`<div className="seg">
    <div className="seghead"><span>${L('New message ' + (done.length + 1) + ' of ' + ids.length, 'Tin mới ' + (done.length + 1) + ' trên ' + ids.length)}</span><${Progress} i=${done.length} n=${ids.length} /></div>
    <${CardRun} key=${next} card=${c} state=${state} update=${update} mode="learn" who=${whoFor(c, M.contacts)} scaffoldChoose=${d === 1 && c.n === 1}
      onDone=${() => update(s => { const x = s.days[d] = s.days[d] || {}; x.learned = [...new Set([...(x.learned || []), next])]; })} />
  </div>`;
}

function VoiceSeg({ d, state, update, onDone }) {
  const ids = newIdsFor(d); const M = DAY_META[d];
  const c = ids.map(id => CARD[id]).sort((a, b) => b.diff - a.diff || (b.top ? 1 : 0) - (a.top ? 1 : 0))[0];
  useEffect(() => { if (!c) onDone(L('No new questions', 'Không có câu mới')); }, []);
  if (!c) return null;
  return html`<div className="seg">
    <div className="seghead"><span>${L('Voice note: today’s hardest question, said twice', 'Voice note: câu khó nhất hôm nay, nói hai lần')}</span></div>
    <p className="small">${L('First time, just talk. The coach points out one thing. Second time, fix that one thing and compare.', 'Lần một nói tự nhiên. Coach chỉ ra đúng một điều. Lần hai sửa đúng điều đó và so sánh.')}</p>
    <${CardRun} key=${'v' + c.id} card=${c} state=${state} update=${update} mode="voice" who=${whoFor(c, M.contacts)} onDone=${r => onDone(c.id + ' ' + c.sticker + L(' grade ', ' điểm ') + r.g)} />
  </div>`;
}

function drillKeys(d, short) {
  const M = DAY_META[d]; const k = [];
  if (!M.boss && d !== 14 && !short) k.push(M.drill);
  if (M.qf) k.push('qf');
  if (d === 10 && !short) k.push('salary');
  return k;
}
const DRILL_NAME = { honesty: L('Four honest lines', 'Bốn câu thành thật'), numbers1: 'Number Lock I', scam: 'Scam Detector', warning: 'Write-a-Warning', wb_strangers: 'Whiteboard I', critique: 'Critique Duel', forge: 'Story Forge', wb_community: 'Whiteboard II', numbers2: 'Number Lock II', wb_linking: 'Whiteboard III', qf: 'Rapid-fire', salary: 'Salary Card' };
function DrillFor({ k, d, state, update, onDone }) {
  const p = { state, update, onDone }; const M = DAY_META[d];
  switch (k) {
    case 'honesty': return html`<${HonestyDrill} ...${p} />`;
    case 'numbers1': return html`<${NumberLock} level=${1} ...${p} />`;
    case 'numbers2': return html`<${NumberLock} level=${2} ...${p} />`;
    case 'scam': return html`<${ScamDetector} start=${(state.drills.scam || []).length * 6} count=${6} ...${p} />`;
    case 'warning': return html`<${WriteWarning} ...${p} />`;
    case 'wb_strangers': return html`<${Whiteboard} ex="strangers" label="Whiteboard I" ...${p} />`;
    case 'wb_community': return html`<${Whiteboard} ex="community" label="Whiteboard II" ...${p} />`;
    case 'wb_linking': return html`<${Whiteboard} ex="linking" label="Whiteboard III" ...${p} />`;
    case 'critique': return html`<${CritiqueDuel} ...${p} />`;
    case 'forge': return html`<${StoryForge} ...${p} />`;
    case 'salary': return html`<${SalaryCard} onDone=${onDone} />`;
    case 'qf': return html`<${Rapidfire} from=${M.qf[0]} to=${M.qf[1]} mixed=${M.qf[1] - M.qf[0] > 12} ...${p} />`;
  }
  return null;
}

function ReviewSeg({ d, state, update, onDone }) {
  const ds = dayOf(state, d); const M = DAY_META[d]; const rv = ds.rev || {};
  useEffect(() => { if (!rv.q) update(s => { const x = s.days[d] = s.days[d] || {}; x.rev = { q: dueToday(s, d).filter(id => isLearned(s, id)).slice(0, M.boss ? 6 : 10), done: [], drills: [] }; }); }, []);
  const left = rv.q ? rv.q.filter(id => !rv.done.includes(id)) : [];
  const keys = drillKeys(d, ds.short); const nextDrill = rv.q ? keys.find(k => !rv.drills.includes(k)) : null;
  const setRv = fn => update(s => { fn(s.days[d].rev); });
  useEffect(() => { if (rv.q && !left.length && !nextDrill) onDone(rv.q.length + L(' review cards', ' thẻ ôn') + (keys.length ? ', ' + keys.map(k => DRILL_NAME[k]).join(', ') : '')); }, [!!rv.q, left.length, nextDrill]);
  if (!rv.q) return null;
  if (left.length) { const c = CARD[left[0]];
    return html`<div className="seg">
      <div className="seghead"><span>${L('Quick review: openers and must-say points', 'Ôn nhanh: câu mở đầu và ý bắt buộc')}</span><${Progress} i=${rv.done.length} n=${rv.q.length} /></div>
      <${CardRun} key=${'r' + c.id} card=${c} state=${state} update=${update} mode="review" onDone=${() => setRv(r => { r.done = [...r.done, c.id]; })} />
      <div className="actions"><button type="button" className="linkbtn" onClick=${() => setRv(r => { r.done = [...r.q]; })}>${L('Skip the rest of the review', 'Bỏ qua phần ôn còn lại')}</button></div>
    </div>`; }
  if (nextDrill) return html`<div className="seg">
    <div className="seghead"><span>${L('Today’s drill: ', 'Drill hôm nay: ')}${DRILL_NAME[nextDrill]}</span></div>
    <${DrillFor} key=${nextDrill} k=${nextDrill} d=${d} state=${state} update=${update} onDone=${() => setRv(r => { r.drills = [...r.drills, nextDrill]; })} />
  </div>`;
  return null;
}

function NightSeg({ d, state, update, onDone }) {
  const ds = dayOf(state, d); const sch = SCHED[d]; const next = DAY_META[d + 1];
  const [unsure, setUnsure] = useState(ds.unsure || '');
  const learned = newIdsFor(d);
  return html`<div className="night">
    <${Bubble} who="thu">${L('That’s enough for today. One real task left, outside the game:', 'Đủ cho hôm nay. Còn một việc thật, ngoài game:')}</${Bubble}>
    <div className="taskcard"><${Md} src=${sch.task} />
      <label className="chk"><input type="checkbox" id=${'task-' + d} checked=${!!ds.task} onChange=${() => update(s => { const x = s.days[d] = s.days[d] || {}; x.task = !x.task; })} /><span>${L('I did it, or I’ve scheduled it', 'Mình đã làm, hoặc đã xếp lịch làm')}</span></label></div>
    <div className="field"><label htmlFor=${'unsure-' + d}>${L('One thing I’m still not sure about (Coach Thư will ask tomorrow)', 'Một điều mình còn chưa chắc (để Coach Thư hỏi lại ngày mai)')}</label><textarea id=${'unsure-' + d} rows="2" value=${unsure} onInput=${e => setUnsure(e.target.value)}></textarea></div>
    ${learned.length > 0 && html`<div className="stickrow">${learned.map(id => html`<${Sticker} key=${id} card=${CARD[id]} state=${state} size=${40} />`)}</div>`}
    <div className="streakline"><${Icon} n="flame" size=${18} /><b>${state.streak + (state.lastClosed === todayISO() ? 0 : 1)}${L(enPl(state.streak + (state.lastClosed === todayISO() ? 0 : 1), ' day', ' days'), ' ngày')}</b><span className="small">${L('after closing today · ', 'sau khi đóng hôm nay · ')}${state.freezes}${L(enPl(state.freezes, ' freeze', ' freezes'), ' băng đóng')}</span></div>
    ${next && html`<div className="teaser"><span className="small">${L('Tomorrow: ', 'Ngày mai, ')}${next.title}</span><span className="blur" aria-hidden="true">${next.open}</span></div>`}
    <div className="actions"><${Btn} onClick=${() => { Sound.play('close'); update(s => closeDay(s, d, unsure)); onDone(L('Day closed', 'Đã đóng ngày')); }}>${L('Close Day ' + d + ' and go to sleep', 'Đóng Ngày ' + d + ' và đi ngủ')}</${Btn}></div>
    <p className="small dim">${L('The next day opens at 5:00 a.m. tomorrow. Sleep is part of remembering.', 'Ngày tiếp theo mở lúc 5:00 sáng mai. Ngủ là một phần của việc nhớ.')}</p>
  </div>`;
}
const SEG_C = { warm: WarmSeg, learn: LearnSeg, voice: VoiceSeg, review: ReviewSeg, call: CallSeg, night: NightSeg };

/* ---------- the day thread ---------- */
function ThreadHead({ title, sub, faces, onBack, right }) {
  return html`<div className="threadhead">
    ${onBack && html`<button type="button" className="iconbtn backbtn" aria-label=${L('Back', 'Quay lại')} onClick=${onBack}><${Icon} n="back" /></button>`}
    <div className="faces">${faces.map(p => html`<${Avatar} key=${p} p=${p} size=${36} />`)}</div>
    <div className="th-text"><b>${title}</b><span className="small">${sub}</span></div>
    ${right}
  </div>`;
}

function DayThread({ d, state, update, onBack }) {
  const M = DAY_META[d]; const ds = dayOf(state, d); const sch = SCHED[d];
  const segs = segsFor(state, d); const done = ds.segs || {};
  const cur = ds.closed ? null : segs.find(k => !done[k]);
  useEffect(() => { if (!ds.start) { update(s => { const x = s.days[d] = s.days[d] || {}; x.start = Date.now(); }); if (introSeen.get() && d > 1) playCine('chapter', { title: L('Day ' + d, 'Ngày ' + d), sub: M.title }); } }, [d]);
  useEffect(() => { if (ds.closed) return; const id = setInterval(() => { if (document.visibilityState === 'visible') update(s => { const x = s.days[d] = s.days[d] || {}; x.mins = (x.mins || 0) + 1; }); }, 60000); return () => clearInterval(id); }, [d, ds.closed]);
  const complete = (k, summary) => update(s => { const x = s.days[d] = s.days[d] || {}; if (x.segs?.[k]) return; x.segs = { ...(x.segs || {}), [k]: summary || L('Done', 'Xong') }; s.xp += 10; });
  const total = segMinutes(state, d);
  const canShort = !M.boss && !M.noShort && d !== 14 && !done.learn && !ds.closed;
  const SegC = cur && SEG_C[cur];
  const scroller = useRef(null);
  useEffect(() => { scroller.current && scroller.current.scrollTo({ top: 0 }); }, [d]);
  return html`<section className="thread" aria-label=${L('Day ' + d, 'Ngày ' + d)}>
    <${ThreadHead} onBack=${onBack} faces=${M.contacts.slice(0, 3)} title=${M.title} sub=${L('Day ' + d + ' of 14 · ', 'Ngày ' + d + ' trên 14 · ') + sch.theme}
      right=${html`<span className=${'minpill mono' + ((ds.mins || 0) > total ? ' over' : '')} title=${L('Minutes used today', 'Phút đã dùng hôm nay')}>${ds.mins || 0}/${total}′</span>`} />
    <div className="segbar">${segs.map(k => html`<span key=${k} className=${'segchip' + (done[k] ? ' done' : k === cur ? ' cur' : '')}>${done[k] ? '✓ ' : ''}${SEG_NAME[k]}<small className="mono">${k === 'call' ? CALLS[d].mins : SEG_MIN[k]}′</small></span>`)}
      ${canShort && html`<button type="button" className="linkbtn shortbtn" onClick=${() => update(s => { const x = s.days[d] = s.days[d] || {}; x.short = !x.short; })}>${ds.short ? L('Full day 60′', 'Ngày đủ 60′') : L('Short day 30′', 'Ngày ngắn 30′')}</button>`}
    </div>
    <div className="scroll" ref=${scroller}>
      <div className="daystamp">${L('Day ' + d, 'Ngày ' + d)}</div>
      <${Bubble} who=${M.contacts[0]}>${M.open}</${Bubble}>
      ${sch.read && d <= 13 && html`<${SysPill}>${L('Extra reading in the book, if you have time: ', 'Đọc thêm trong sách, nếu còn thời gian: ')}${plain(sch.read)}</${SysPill}>`}
      ${segs.filter(k => done[k]).map(k => html`<${SysPill} key=${k}>✓ ${SEG_NAME[k]}: ${done[k]}</${SysPill}>`)}
      ${SegC && html`<${SegC} key=${d + cur} d=${d} state=${state} update=${update} onDone=${s => complete(cur, s)} />`}
      ${ds.closed && html`<${DayClosed} d=${d} state=${state} update=${update} />`}
    </div>
  </section>`;
}

function DayClosed({ d, state, update }) {
  const ids = newIdsFor(d);
  return html`<div className="dayclosed">
    <${SysPill}>${L('Day ' + d + ' closed', 'Ngày ' + d + ' đã đóng')}${state.days[d].usedFreeze ? L(', used one freeze', ', đã dùng một băng đóng') : ''}</${SysPill}>
    ${ids.length > 0 && html`<div className="stickrow">${ids.map(id => html`<span key=${id} className="stickcell"><${Sticker} card=${CARD[id]} state=${state} size=${40} /><small className="mono">${id}</small>${bestGrade(state, id) ? html`<${GradeBadge} g=${nToG(bestGrade(state, id))} />` : ''}</span>`)}</div>`}
    ${state.days[d].unsure && html`<${Bubble} from="me" meta=${L('Not sure', 'Chưa chắc')}>${state.days[d].unsure}</${Bubble}>`}
    ${update && html`<${RehearseButton} ids=${[...ids, ...((SCHED[d] && SCHED[d].review_ids) || []).map(n => 'Q' + n)].filter((x, i, a) => CARD[x] && a.indexOf(x) === i)} state=${state} update=${update} label=${L('Rehearse Day ' + d + ' again', 'Luyện lại Ngày ' + d)} title=${L('Rehearsing Day ' + d, 'Luyện lại Ngày ' + d)} />`}
    <p className="small dim">${L('To practice any question again, open Floor 18 or message Coach Thư.', 'Muốn luyện lại câu nào, mở Tầng 18 hoặc nhắn Coach Thư.')}</p>
  </div>`;
}

/* ---------- chat list ---------- */
function ChatRow({ p, faces, name, preview, meta, badge, ticks, locked, active, onClick, pinned }) {
  return html`<button type="button" className=${'chatrow' + (active ? ' active' : '') + (locked ? ' locked' : '')} onClick=${onClick} disabled=${locked} aria-current=${active ? 'true' : undefined}>
    <span className="cr-av">${faces && faces.length > 1 ? html`<span className="stackav">${faces.slice(0, 2).map(f => html`<${Avatar} key=${f} p=${f} size=${30} />`)}</span>` : html`<${Avatar} p=${p} size=${44} dim=${locked} />`}</span>
    <span className="cr-main"><span className="cr-top"><b>${name}</b><span className="cr-meta small mono">${meta}</span></span>
      <span className="cr-bot"><span className=${'cr-prev small' + (locked ? ' blur' : '')}>${ticks && html`<${Ticks} kind=${ticks} animate=${false} />`}${preview}</span>
        ${locked ? html`<${Icon} n="lock" size=${15} />` : pinned ? html`<${Icon} n="pin" size=${15} />` : badge ? html`<span className="badge">${badge}</span>` : ''}</span></span>
  </button>`;
}

function ChatList({ state, chat, open, unlocked }) {
  const pend = ALL_PENDING.filter(p => !state.checks[p.id]).length;
  const truthOpen = C.truth.filter(t => !/^✅/.test(t.status) || /🟨|🟦/.test(t.status)).filter(t => !state.ledger[t.id]?.ok).length;
  const is = (k, d) => chat && chat.k === k && (d == null || chat.d === d);
  return html`<div className="chatlist">
    <${ChatRow} p="self" name="Minh → Minh" preview=${truthOpen + pend + L(' things to confirm. Only you know the answers', ' điều cần xác nhận, chỉ bạn biết câu trả lời')} meta=${L('pinned', 'ghim')} pinned=${true} active=${is('ledger')} onClick=${() => open({ k: 'ledger' })} />
    <${ChatRow} p="thu" name="Coach Thư" preview=${state.day >= 8 ? L('Shadow Panel is open. Mock panel, free practice.', 'Shadow Panel đã mở. Phòng họp thử, luyện tự do.') : L('Ask anything. Practice any question.', 'Hỏi gì cũng được. Luyện bất kỳ câu nào.')} meta=${L('pinned', 'ghim')} pinned=${true} active=${is('coach')} onClick=${() => open({ k: 'coach' })} />
    <div className="listlabel">${L('14 days', '14 ngày')}</div>
    ${Array.from({ length: 14 }, (_, i) => i + 1).map(d => {
      const M = DAY_META[d]; const ds = dayOf(state, d); const locked = d > unlocked;
      const gs = newIdsFor(d).map(id => lastGrade(state, id)).filter(Boolean);
      const segs = segsFor(state, d); const left = segs.filter(k => !(ds.segs || {})[k]).length;
      const preview = locked ? L('Opens after you close Day ' + (d - 1), 'Mở sau khi đóng Ngày ' + (d - 1)) : ds.closed ? (state.boss[d] ? L('Call done, average ', 'Cuộc gọi xong, trung bình ') + state.boss[d].avg.toFixed(1) : SCHED[d].theme + L(', closed', ', đã đóng')) : M.open;
      return html`<${ChatRow} key=${d} p=${M.contacts[0]} faces=${M.boss ? M.contacts : null} name=${L('Day ', 'Ngày ') + d + '. ' + M.title.replace(/^📞\s*/, '')} preview=${preview}
        meta=${ds.closed ? ds.closedOn?.slice(5).replace('-', '/') : d === unlocked ? L('today', 'hôm nay') : ''} ticks=${ds.closed && gs.length ? ticksFor(nToG(avgN(gs.map(nToG)))) : null}
        badge=${!locked && !ds.closed ? left : 0} locked=${locked} active=${is('day', d)} onClick=${() => open({ k: 'day', d })} />`;
    })}
    ${state.days[14]?.closed && html`<${ChatRow} p="ngan" name="Interview Week" preview=${L('Stay sharp until the real interview', 'Giữ phong độ đến ngày phỏng vấn thật')} meta=${L('after 14', 'sau 14')} active=${is('week')} onClick=${() => open({ k: 'week' })} />`}
  </div>`;
}

/* ---------- Minh → Minh: the truth ledger ---------- */
function Ledger({ state, update, onBack }) {
  const [tab, setTab] = useState('truth');
  const byRoom = Object.keys(ROOMS).map(r => ({ r, items: ALL_PENDING.filter(p => CARD[p.card].room === r) })).filter(x => x.items.length);
  const qfOpen = QF.filter(q => q.blocked);
  const bookOk = t => /^✅/.test(t.status) && !/🟨|🟦/.test(t.status);
  return html`<section className="thread">
    <${ThreadHead} onBack=${onBack} faces=${['self']} title="Minh → Minh" sub=${L('Truth ledger. Only write down what you can check.', 'Sổ sự thật. Chỉ ghi điều bạn kiểm tra được.')} />
    <div className="tabs" role="tablist">${[['truth', L('Truth table', 'Bảng sự thật')], ['cards', L('🟨 items by question', 'Mục 🟨 theo câu')], ['qf', L('Quick answers', 'Câu trả lời nhanh')], ['stories', L('Real stories', 'Câu chuyện thật')]].map(([k, l]) => html`<button type="button" role="tab" key=${k} aria-selected=${tab === k} onClick=${() => setTab(k)}>${l}</button>`)}</div>
    <div className="scroll">
      ${tab === 'truth' && html`<${Fragment}>
        <${Bubble} who="thu">${L('Each line here is something an interviewer can check. Only mark it “confirmed” once you’ve really checked, and write down the right way to say it.', 'Mỗi dòng ở đây là một điều người phỏng vấn có thể kiểm tra. Đánh dấu “đã xác nhận” chỉ khi bạn đã thực sự kiểm tra, và ghi lại cách nói đúng.')}</${Bubble}>
        ${C.truth.map(t => { const LG = state.ledger[t.id] || {}; const ok = bookOk(t);
          return html`<div key=${t.id} className=${'truthrow' + (ok || LG.ok ? ' ok' : '')}>
            <div className="tr-h"><span className="mono">${t.id}</span><b>${plain(t.claim)}</b><${Chip} kind=${ok ? 'jade' : LG.ok ? 'blue' : 'amber'}>${ok ? L('Book: ', 'Sách: ') + t.status : LG.ok ? L('Minh confirmed', 'Minh đã xác nhận') : t.status.includes('🟦') ? L('🟦 Needs data', '🟦 Cần số liệu') : L('🟨 Not confirmed', '🟨 Chưa xác nhận')}</${Chip}></div>
            ${t.ask && t.ask !== '-' && html`<div className="small">${L('They’ll ask: ', 'Họ sẽ hỏi: ')}<${Md} src=${t.ask} className="inline" /></div>`}
            <${Md} src=${t.todo} className="small" />
            ${!ok && html`<div className="tr-ctl">
              <input id=${'tn-' + t.id} placeholder=${L('The right way to say it, once checked', 'Cách nói đúng, sau khi đã kiểm tra')} aria-label=${L('Note ', 'Ghi chú ') + t.id} value=${LG.note || ''} onInput=${e => { const v = e.target.value; update(s => { s.ledger[t.id] = { ...(s.ledger[t.id] || {}), note: v }; }); }} />
              <label className="chk"><input type="checkbox" id=${'tc-' + t.id} checked=${!!LG.ok} onChange=${() => update(s => { const x = s.ledger[t.id] || {}; s.ledger[t.id] = { ...x, ok: !x.ok, d: s.day }; })} /><span>${L('I checked. This is true', 'Mình đã kiểm tra, điều này đúng')}</span></label></div>`}
          </div>`; })}
      </${Fragment}>`}
      ${tab === 'cards' && html`<${Fragment}>
        <${Bubble} who="thu">${L('These details are in the sample answers, but nobody has confirmed them. A question with open items can only reach grey ✓✓. Confirm them and the cap comes off.', 'Những chi tiết này nằm trong câu trả lời mẫu nhưng chưa ai xác nhận. Câu hỏi còn mục mở chỉ đạt tối đa ✓✓ xám. Xác nhận xong thì trần điểm được gỡ.')}</${Bubble}>
        ${byRoom.map(({ r, items }) => html`<div key=${r} className="ledgroup"><div className="listlabel">${ROOMS[r].full}</div>
          ${items.map(p => html`<label key=${p.id} className=${'chk pend' + (state.checks[p.id] ? ' on' : '')}><input type="checkbox" id=${'pc-' + p.id} checked=${!!state.checks[p.id]} onChange=${() => update(s => { s.checks[p.id] = !s.checks[p.id]; })} /><span><b className="mono">${p.card}</b> ${p.kind} ${p.text}</span></label>`)}</div>`)}
      </${Fragment}>`}
      ${tab === 'qf' && html`<${Fragment}>
        <${Bubble} who="thu">${L('These quick answers need your real answer. Write one line in English. The game will use it instead of the sample.', 'Những câu trả lời nhanh này cần câu thật của bạn. Viết một dòng tiếng Anh. Game sẽ dùng câu này thay câu mẫu.')}</${Bubble}>
        ${qfOpen.map(q => html`<div key=${q.id} className="field"><label htmlFor=${'lq-' + q.id}><span className="mono">${q.id}</span> ${q.q}</label><${Md} src=${q.a} className="small dim" />
          <input id=${'lq-' + q.id} value=${state.qfFill[q.id] || ''} onInput=${e => { const v = e.target.value; update(s => { if (v.trim()) s.qfFill[q.id] = v; else delete s.qfFill[q.id]; }); }} /></div>`)}
      </${Fragment}>`}
      ${tab === 'stories' && html`<${Fragment}>
        <${Bubble} who="thu">${L('The book only has example outlines for these three. Only your real story will hold up to follow-up questions. Build it in Story Forge (Day 8) or here.', 'Sách chỉ có khung minh họa cho ba câu này. Chỉ câu chuyện thật của bạn mới qua được câu hỏi đào sâu. Dựng trong Story Forge (Ngày 8) hoặc ở đây.')}</${Bubble}>
        ${[13, 39, 6].map(n => { const id = 'Q' + n; return html`<div key=${id} className=${'truthrow' + (state.scripts[id] ? ' ok' : '')}><div className="tr-h"><span className="mono">${id}</span><b>${CARD[id].q}</b><${Chip} kind=${state.scripts[id] ? 'blue' : 'amber'}>${state.scripts[id] ? L('My Script ready', 'Đã có My Script') : L('🟨 Not yet', '🟨 Chưa có')}</${Chip}></div>${state.scripts[id] && html`<${Md} src=${state.scripts[id]} className="small" />`}</div>`; })}
        <${Collapse} title=${L('Open Story Forge', 'Mở Story Forge')}><${StoryForge} state=${state} update=${update} onDone=${() => {}} /></${Collapse}>
      </${Fragment}>`}
    </div>
  </section>`;
}

/* ---------- Coach Thư ---------- */
function salaryLeak(msg) {
  let v = {}; try { v = JSON.parse(localStorage.getItem('delivered.salary') || '{}'); } catch (e) {}
  const norm = s => String(s || '').replace(/[^\d]/g, '');
  const m = norm(msg);
  return Object.values(v).map(norm).some(x => x.length >= 3 && m.includes(x));
}
const COACH_SYS = () => `You are "Coach Thư", a warm, direct design director coaching Minh for a Lead Product Designer interview at Qualgo (an AI-powered secure messenger for a mass audience in Vietnam). ${L('Reply in plain, simple English', 'Reply in Vietnamese')}; write any sample spoken interview lines in English, in quotes. Keep replies under 140 words. Never invent facts, numbers, employers or results about Minh. These are the only facts you may rely on:\n- ${FACTS.join('\n- ')}\nIf a fact is marked unconfirmed, say so and tell Minh to confirm it in the "Minh → Minh" ledger before using it. Never ask for, repeat or store internal NAB or client data; if Minh pastes some, ask Minh to remove it. Never discuss salary numbers.`;
function CoachChat({ state, update }) {
  const [txt, setTxt] = useState(''); const [busy, setBusy] = useState(false); const [partial, setPartial] = useState(''); const [warn, setWarn] = useState('');
  const log = state.coachLog || []; const end = useRef(null); const ctl = useRef(null);
  useEffect(() => { end.current && end.current.scrollIntoView({ block: 'nearest' }); }, [log.length, partial]);
  async function send() {
    const msg = txt.trim(); if (!msg) return;
    if (salaryLeak(msg)) { setWarn(L('This message has a salary number from your Salary Card. That number stays on this device and never goes to the coach. Write “[ANCHOR]” instead of the number.', 'Tin này có con số lương từ Salary Card. Con số đó chỉ ở trên thiết bị này, không gửi cho Coach. Hãy viết “[ANCHOR]” thay cho con số.')); return; }
    setWarn(''); setTxt(''); update(s => { s.coachLog = [...(s.coachLog || []), { r: 'me', t: msg }].slice(-30); });
    setBusy(true); setPartial('');
    const sample = await getSample(); let out = '';
    if (!sample) out = L('The AI coach isn’t available in this view. You can still practice every question: grade yourself with SEND, or use the quick rule check.', 'Coach AI chưa sẵn sàng ở chế độ xem này. Bạn vẫn luyện được mọi câu: chấm bằng tự chấm SEND hoặc chấm nhanh bằng luật.');
    else {
      const unsure = Object.values(state.days).map(x => x.unsure).filter(Boolean).slice(-3);
      const hist = [...log.slice(-10), { r: 'me', t: msg }];
      const turns = hist.map(m => ({ role: m.r === 'me' ? 'user' : 'assistant', content: m.t }));
      turns[0] = { role: 'user', content: COACH_SYS() + `\n\nMinh is on day ${state.day} of 14.` + (unsure.length ? ' Things Minh said they are unsure about: ' + unsure.join(' | ') : '') + '\n\n' + turns[0].content };
      if (turns[0].role !== 'user') turns.shift();
      ctl.current = new AbortController();
      try { const r = await sample(turns, { modelTier: 'default', cache: false, signal: ctl.current.signal, onText: ({ text }) => setPartial(text) }); out = r.text; }
      catch (e) { out = e && e.text ? e.text : e && e.code === 'not_granted' ? L('The AI coach isn’t allowed on this page.', 'Coach AI chưa được cho phép trong trang này.') : e && e.code === 'rate_limited' ? L('The coach is busy. Try again in a moment.', 'Coach đang bận. Thử lại sau một chút.') : L('The coach can’t answer right now.', 'Coach không trả lời được lúc này.'); }
    }
    update(s => { s.coachLog = [...(s.coachLog || []), { r: 'thu', t: out }].slice(-30); }); setPartial(''); setBusy(false);
  }
  const starters = [L('Ask me today’s hardest question', 'Hỏi mình câu khó nhất cho hôm nay'), L('Where is my Q5 still weak?', 'Q5 của mình còn yếu ở đâu?'), L('Explain E2EE like I’m your grandma', 'Giải thích E2EE như cho bà ngoại'), L('Give me a question to ask the CEO', 'Cho mình một câu hỏi ngược cho CEO')];
  return html`<div className="coachchat">
    <div className="scroll">
      <${Bubble} who="thu">${L('I’m here. Ask about any question, or have me play the interviewer. Don’t paste internal NAB or client data.', 'Mình ở đây. Hỏi về bất kỳ câu nào, hoặc nhờ mình đóng vai người phỏng vấn. Đừng dán dữ liệu nội bộ của NAB hay khách hàng.')}</${Bubble}>
      ${log.map((m, k) => m.r === 'me' ? html`<${Bubble} key=${k} from="me" ticks="read">${m.t}</${Bubble}>` : html`<${Bubble} key=${k} who="thu"><${Md} src=${m.t} /></${Bubble}>`)}
      ${busy && (partial ? html`<${Bubble} who="thu"><${Md} src=${partial} /></${Bubble}>` : html`<${TypingDots} who="thu" />`)}
      ${!log.length && html`<div className="starters">${starters.map(s => html`<button type="button" key=${s} className="opt" onClick=${() => setTxt(s)}>${s}</button>`)}</div>`}
      <div ref=${end}></div>
    </div>
    ${warn && html`<div className="pendnote small">${warn}</div>`}
    <div className="chatinput"><textarea id="coach-in" rows="1" aria-label=${L('Message to Coach Thư', 'Tin nhắn cho Coach Thư')} placeholder=${L('Message Coach Thư…', 'Nhắn Coach Thư…')} value=${txt} onInput=${e => setTxt(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); !busy && send(); } }}></textarea>
      ${busy ? html`<${Btn} kind="ghost" onClick=${() => ctl.current && ctl.current.abort()}>${L('Stop', 'Dừng')}</${Btn}>` : html`<${Btn} disabled=${!txt.trim()} onClick=${send}>${L('Send', 'Gửi')}</${Btn}>`}</div>
  </div>`;
}

function CardPicker({ state, onPick, onlyLearned = false }) {
  return html`<div className="picker">${Object.keys(ROOMS).map(r => { const cards = CARDS.filter(c => c.room === r && (!onlyLearned || isLearned(state, c.id)));
    return cards.length > 0 && html`<div key=${r} className="pickroom"><div className="listlabel">${ROOMS[r].full}</div><div className="pickgrid">${cards.map(c => html`<button type="button" key=${c.id} className="pickcard" title=${c.q} onClick=${() => onPick(c.id)}><${Sticker} card=${c} state=${state} size=${36} /><span className="mono small">${c.id}</span></button>`)}</div></div>`; })}</div>`;
}

function MockPanel({ state, update }) {
  const [row, setRow] = useState(null); const [i, setI] = useState(0); const [log, setLog] = useState([]);
  if (!row) return html`<div className="mock">
    <p className="small">${L('Pick a Scorecard row. Two interviewers take turns asking that row’s questions. Every answer here counts as a “panel answer” for gate 1.', 'Chọn một hàng Scorecard. Hai người phỏng vấn hỏi lần lượt các câu của hàng đó. Mọi câu ở đây tính là “trả lời trong panel” cho cổng 1.')}</p>
    ${C.scorecard.map(r => { const st = rowStatus(state, r); return html`<button type="button" key=${r.row} className="mockrow" onClick=${() => { setRow(r); setI(0); setLog([]); }}><span className="mono">${r.row}</span><span>${plain(r.name)}${r.star ? '*' : ''}</span><${Pips} v=${st.lvl} /></button>`; })}
  </div>`;
  const qs = row.q_ids.map(n => 'Q' + n);
  const who = [...new Set(qs.map(id => CARD[id].persona))].slice(0, 2);
  if (who.length < 2) who.push(who[0] === 'khoa' ? 'mai' : 'khoa');
  if (i >= qs.length) return html`<div className="mock"><${SysPill}>${L('Mock panel done: row ' + row.row + ', average ' + avgN(log).toFixed(1), 'Phòng họp thử xong: hàng ' + row.row + ', trung bình ' + avgN(log).toFixed(1))}</${SysPill}>
    <div className="callgrades">${qs.map((id, k) => html`<span key=${id} className="cg"><small className="mono">${id}</small><${GradeBadge} g=${log[k]} /></span>`)}</div>
    <div className="small">${rowStatus(state, row).next}</div>
    <div className="actions"><${Btn} onClick=${() => setRow(null)}>${L('Pick another row', 'Chọn hàng khác')}</${Btn}></div></div>`;
  const c = CARD[qs[i]];
  return html`<div className="mock"><div className="seghead"><span>${L('Row ', 'Hàng ')}${row.row}: ${plain(row.name)}</span><${Progress} i=${i} n=${qs.length} /></div>
    <${CardRun} key=${row.row + c.id} card=${c} state=${state} update=${update} mode="boss" who=${whoFor(c, who)} onDone=${r => { setLog([...log, r.g]); setI(i + 1); }} /></div>`;
}

function CoachThread({ state, update, onBack, onCard }) {
  const [tab, setTab] = useState('chat'); const [pick, setPick] = useState(null); const [shadow, setShadow] = useState(null);
  const learned = CARDS.filter(c => isLearned(state, c.id));
  const tabs = [['chat', L('Chat', 'Trò chuyện')], ['practice', L('Free practice', 'Luyện tự do')], ['panel', L('Mock panel', 'Phòng họp thử')], ['shadow', 'Shadow Panel']];
  return html`<section className="thread">
    <${ThreadHead} onBack=${onBack} faces=${['thu']} title="Coach Thư" sub=${L('Design director, 25 years on Lead hiring panels', 'Design director, 25 năm ngồi panel tuyển Lead')} />
    <div className="tabs" role="tablist">${tabs.map(([k, l]) => html`<button type="button" role="tab" key=${k} aria-selected=${tab === k} onClick=${() => { setTab(k); setPick(null); setShadow(null); }}>${l}${k === 'shadow' && state.day < 8 ? ' 🔒' : ''}</button>`)}</div>
    ${tab === 'chat' && html`<${CoachChat} state=${state} update=${update} />`}
    ${tab === 'practice' && html`<div className="scroll">${pick ? html`<${Fragment}><${ScriptToggle} key=${'st' + pick} card=${CARD[pick]} /><${CardRun} key=${'p' + pick + (state.cards[pick]?.att?.length || 0)} card=${CARD[pick]} state=${state} update=${update} mode="practice" onDone=${() => setPick(null)} /><div className="actions"><button type="button" className="linkbtn" onClick=${() => setPick(null)}>${L('Pick another question', 'Chọn câu khác')}</button></div></${Fragment}>` :
      html`<${Fragment}><${RehearseButton} key=${'shuf' + CARDS.filter(c => isLearned(state, c.id)).length} ids=${shuffle(CARDS.filter(c => isLearned(state, c.id)).map(c => c.id)).slice(0, 8)} state=${state} update=${update} label=${L('Shuffle 8 learned questions', 'Trộn 8 câu đã học')} title=${L('Shuffled rehearsal', 'Luyện lại ngẫu nhiên')} /><p className="small">${L('Or pick any question, even ones you haven’t reached yet.', 'Hoặc chọn bất kỳ câu nào, kể cả câu chưa tới ngày học.')}</p><${CardPicker} state=${state} onPick=${setPick} /></${Fragment}>`}</div>`}
    ${tab === 'panel' && html`<div className="scroll"><${MockPanel} state=${state} update=${update} /></div>`}
    ${tab === 'shadow' && html`<div className="scroll">${state.day < 8 ? html`<div className="empty"><${Icon} n="lock" size=${28} /><b>${L('Opens on Day 8', 'Mở từ Ngày 8')}</b><span className="small">${L('Shadow Panel asks tough follow-ups aimed at your blind spots. You need enough learned questions first.', 'Shadow Panel hỏi những câu gây áp lực từ các điểm mù của bạn. Cần có đủ câu đã học trước.')}</span></div>` :
      !learned.length ? html`<div className="empty"><b>${L('No learned questions yet.', 'Chưa có câu nào đã học.')}</b></div>` :
      shadow ? html`<${CardRun} key=${'s' + shadow} card=${CARD[shadow]} state=${state} update=${update} mode="shadow" who="khoa" onDone=${() => setShadow(null)} />` :
      html`<div className="empty"><${Icon} n="spark" size=${28} /><b>${L('One question, one surprise follow-up', 'Một câu, một đòn đào sâu không báo trước')}</b><span className="small">${L('A random question from the ones you’ve learned, then a tough follow-up taken from the 15 blind spots in the book.', 'Câu hỏi ngẫu nhiên từ những câu bạn đã học, rồi một câu hỏi gây áp lực lấy từ 15 điểm mù trong sách.')}</span><div className="actions"><${Btn} onClick=${() => setShadow(pick || CARDS.filter(c => isLearned(state, c.id))[Math.floor(Math.random() * learned.length)].id)}>${L('Enter the room', 'Vào phòng')}</${Btn}></div></div>`}</div>`}
  </section>`;
}

/* ---------- Interview Week ---------- */
function InterviewWeek({ state, update, onBack }) {
  const [mode, setMode] = useState(null);
  const ids = useMemo(() => shuffle(CARDS.filter(c => isLearned(state, c.id)).map(c => c.id)).slice(0, 10), [mode]);
  return html`<section className="thread">
    <${ThreadHead} onBack=${onBack} faces=${['ngan']} title="Interview Week" sub=${L('15 minutes a day until the real interview', '15 phút mỗi ngày cho đến buổi phỏng vấn thật')} />
    <div className="scroll">
      <${Bubble} who="ngan">${L('The real interview could get booked any time. Every day: 10 openers, one rapid-fire round, and read the four honest lines again.', 'Lịch phỏng vấn thật có thể đến bất cứ lúc nào. Mỗi ngày: 10 câu mở đầu, một vòng rapid-fire, và đọc lại bốn câu thành thật.')}</${Bubble}>
      ${!mode && html`<div className="actions left"><${Btn} onClick=${() => setMode('flash')}>${L('10 openers', '10 câu mở đầu')}</${Btn}><${Btn} kind="ghost" onClick=${() => setMode('qf')}>${L('Mixed rapid-fire', 'Rapid-fire trộn')}</${Btn}></div>`}
      ${mode === 'flash' && html`<${OpenerFlash} ids=${ids} state=${state} update=${update} onDone=${() => setMode(null)} />`}
      ${mode === 'qf' && html`<${Rapidfire} from=${1} to=${30} mixed=${true} state=${state} update=${update} onDone=${() => setMode(null)} />`}
      <div className="honest">${C.honesty.map((l, k) => html`<div key=${k} className="honest-line">“${l}”</div>`)}</div>
      <${Collapse} title=${L('If the interview comes early: the short plan', 'Nếu lịch đến sớm: kế hoạch rút gọn')}><${Md} src=${C.compress} /></${Collapse}>
    </div>
  </section>`;
}

/* ---------- Tầng 18: the floor map ---------- */
const ISO = { A: [0, 0], B: [1, 0], C: [2, 0], D: [3, 0], E: [4, 0], F: [0, 1], G: [1, 1], H: [2, 1], I: [3, 1], J: [4, 1] };
function roomGold(state, r) { const cs0 = CARDS.filter(c => c.room === r); const g = cs0.filter(c => cs(state, c.id).box >= 3).length; return { g, n: cs0.length, seen: cs0.filter(c => isLearned(state, c.id)).length }; }
function FloorMap({ state, room, onRoom }) {
  const W = 168, H = 96, D = 18, ox = 2 * W / 2 + 12 + W / 2, oy = 24;
  const pos = r => { const [c, w] = ISO[r]; return [ox + (c - w * 1.6) * W / 2 * 0.98 - 0, oy + (c + w * 1.6) * H / 2 * 0.98 + H / 2]; };
  const vb = [0, 0, ox + 4.6 * W / 2 + W / 2 + 12, oy + 5.6 * H / 2 + H + D + 24];
  const rooms = Object.keys(ROOMS).sort((a, b) => (ISO[a][0] + ISO[a][1] * 1.6) - (ISO[b][0] + ISO[b][1] * 1.6));
  return html`<div className="mapwrap"><svg className="floormap" viewBox=${vb.join(' ')} role="group" aria-label=${L('Floor 18 map, ten rooms', 'Sơ đồ tầng 18, mười phòng')}>
    ${rooms.map(r => { const [cx, cy] = pos(r); const G = roomGold(state, r); const ratio = G.g / G.n; const full = G.g === G.n;
      const top = `${cx},${cy - H / 2} ${cx + W / 2},${cy} ${cx},${cy + H / 2} ${cx - W / 2},${cy}`;
      const left = `${cx - W / 2},${cy} ${cx},${cy + H / 2} ${cx},${cy + H / 2 + D} ${cx - W / 2},${cy + D}`;
      const right = `${cx + W / 2},${cy} ${cx},${cy + H / 2} ${cx},${cy + H / 2 + D} ${cx + W / 2},${cy + D}`;
      const cards = CARDS.filter(c => c.room === r); const k = Math.ceil(Math.sqrt(cards.length));
      return html`<g key=${r} className=${'room' + (room === r ? ' sel' : '') + (full ? ' gold' : '')} tabIndex="0" role="button" aria-label=${ROOMS[r].full + L(', ' + G.g + ' of ' + G.n + ' questions pinned', ', ' + G.g + ' trên ' + G.n + ' câu đã ghim')}
          onClick=${() => onRoom(r)} onKeyDown=${e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRoom(r))}>
        <polygon points=${left} className="wall l" /><polygon points=${right} className="wall r" />
        <polygon points=${top} className="floor" style=${{ '--g': ratio }} />
        <polygon points=${top} className="goldfill" style=${{ opacity: full ? 1 : ratio * 0.55 }} />
        ${cards.map((c, i) => { const u = (i % k + 0.5) / k, v = (Math.floor(i / k) + 0.5) / k; const x = cx + (u - v) * W / 2 * 0.78, y = cy + (u + v - 1) * H / 2 * 0.78;
          const b = cs(state, c.id).box; return html`<g key=${c.id} className=${'obj b' + b}><ellipse cx=${x} cy=${y + 5} rx="7" ry="3.2" className="objshadow" /><text x=${x} y=${y + 3} textAnchor="middle" className="objglyph">${c.sticker}</text></g>`; })}
        <text x=${cx - W / 2 + 6} y=${cy + D + 14} className="roomlabel">${r} · ${ROOMS[r].name}</text>
      </g>`; })}
  </svg></div>`;
}

function MapTab({ state, update, onCard }) {
  const [room, setRoom] = useState(() => { const r = Object.keys(ROOMS).find(r => CARDS.some(c => c.room === r && !isLearned(state, c.id))); return r || 'A'; });
  const totalGold = CARDS.filter(c => cs(state, c.id).box >= 3).length;
  const R = ROOMS[room]; const cards = CARDS.filter(c => c.room === room); const G = roomGold(state, room);
  return html`<section className="thread maptab">
    <div className="viewhead"><h1>${L('Floor 18', 'Tầng 18')}</h1><span className="small">${L('mPlaza, 39 Lê Duẩn. Each question is an object in a room. A room turns gold when every object is pinned (Pinned box or higher).', 'mPlaza, 39 Lê Duẩn. Mỗi câu hỏi là một vật trong một phòng. Phòng hóa vàng khi mọi vật được ghim (hộp Pinned trở lên).')}</span>
      <div className="maplegend small">${BOX_NAME.map((n, b) => html`<span key=${b}><i className=${'dot b' + b}></i>${n}</span>`)}<span className="mono">${totalGold}/72${L(' pinned', ' ghim')}</span></div></div>
    <div className="scroll">
      <${FloorMap} state=${state} room=${room} onRoom=${setRoom} />
      <div className="roompanel">
        <div className="rp-h"><b>${R.full}</b><span className="small">${R.theme}. ${G.seen}/${G.n}${L(' learned, ', ' đã học, ')}${G.g}${L(' pinned.', ' đã ghim.')}</span></div>
        <div className="rp-list">${cards.map(c => { const bg = bestGrade(state, c.id);
          return html`<button type="button" key=${c.id} className="rp-card" onClick=${() => onCard(c.id)}><${Sticker} card=${c} state=${state} size=${40} />
            <span className="rp-q"><span className="mono small">${c.id}${c.top ? ' · TOP' : ''} · ${L('Day ', 'Ngày ')}${(C.schedule.find(s => s.new_ids.includes(c.n)) || {}).day || '-'}</span><span>${c.q}</span></span>
            <span className="rp-g">${bg ? html`<${GradeBadge} g=${nToG(bg)} />` : html`<span className="small dim">${L('new', 'mới')}</span>`}<small className="small dim">${BOX_NAME[cs(state, c.id).box]}</small></span></button>`; })}</div>
      </div>
    </div>
  </section>`;
}

function CardDetail({ id, state, update, onBack }) {
  const c = CARD[id]; const x = cs(state, id); const [answers, setAnswers] = useState([]); const [run, setRun] = useState(false);
  useEffect(() => { let on = true; Store.answers(id).then(a => on && setAnswers(a)); return () => { on = false; }; }, [id, (x.att || []).length]);
  const pend = c.pending;
  return html`<section className="thread">
    <${ThreadHead} onBack=${onBack} faces=${[c.persona]} title=${c.id + ' · ' + ROOMS[c.room].name} sub=${PERSONAS[c.persona].name + L(' asks · ', ' hỏi · ') + BOX_NAME[x.box] + (x.due ? L(', due Day ', ', đến hạn Ngày ') + x.due : '')} />
    <div className="scroll">
      <div className="detailtop"><${Sticker} card=${c} state=${state} size=${72} /><div><b className="detailq">${c.q}</b><span className="small">${plain(c.locus)}</span></div></div>
      ${run ? html`<${CardRun} key=${'d' + id + (x.att || []).length} card=${c} state=${state} update=${update} mode="practice" onDone=${() => setRun(false)} />` : html`<div className="actions left"><${Btn} onClick=${() => setRun(true)}>${L('Practice this one', 'Luyện câu này')}</${Btn}></div>`}
      ${(x.att || []).length > 0 && html`<div className="attempts">${x.att.slice().reverse().map((a, k) => html`<span key=${k} className="att"><${GradeBadge} g=${a.g} /><small className="mono">${L('D', 'N')}${a.d}${a.panel ? ' panel' : ''}</small></span>`)}</div>`}
      <div className="memgrid">
        <div><div className="label">${L('Opener', 'Câu mở đầu')}</div><b>“${c.opener}”</b></div>
        <div><div className="label">${L('Memory hook', 'Móc nhớ')}</div><${Md} src=${c.hook} /></div>
        <div><div className="label">${L('Must say', 'Bắt buộc phải nói')}</div><ol className="must">${c.mustList.map((m, i) => html`<li key=${i}>${m}</li>`)}</ol></div>
      </div>
      ${pend.length > 0 && html`<div className="pendnote"><b>${L('🟨 Needs your confirmation', '🟨 Cần bạn xác nhận')}</b>${pend.map(p => html`<label key=${p.id} className="chk"><input type="checkbox" id=${'cd-' + p.id} checked=${!!state.checks[p.id]} onChange=${() => update(s => { s.checks[p.id] = !s.checks[p.id]; })} /><span>${p.kind} ${p.text}</span></label>`)}</div>`}
      ${state.scripts[id] && html`<${Collapse} title="My Script" open=${true}><${Md} src=${state.scripts[id]} /></${Collapse}>`}
      <${Collapse} title=${L('Sample answer (', 'Câu trả lời mẫu (') + fmt(c.targetSec) + ')'}><${Md} src=${c.answer} className="answer" /><div className="label">${L('Why it works', 'Vì sao hiệu quả')}</div><${Md} src=${c.why} className="small" /></${Collapse}>
      <${Collapse} title=${L('To get 5/5', 'Để đạt 5/5')}><${Md} src=${c.five} /></${Collapse}>
      ${c.follow_ups.length > 0 && html`<${Collapse} title=${L('Follow-up questions (', 'Câu hỏi đào sâu (') + c.follow_ups.length + ')'}>${c.follow_ups.map((f, k) => html`<div key=${k} className="followpair"><b>${f.q}</b>${f.sample && html`<p className="fsample">${f.sample}</p>`}<${Md} src=${f.a} className="small" />${L(f.note_en, f.note_vi) && html`<span className="small dim">${L(f.note_en, f.note_vi)}</span>`}</div>`)}</${Collapse}>`}
      ${c.traps && html`<${Collapse} title=${L('Common traps', 'Bẫy thường gặp')}><${Md} src=${c.traps} /></${Collapse}>`}
      ${answers.length > 0 && html`<${Collapse} title=${L('Your typed answers (', 'Câu bạn đã gõ (') + answers.length + ')'}>${answers.map((a, k) => html`<div key=${k} className="myans"><span className="small mono">${L('Day ', 'Ngày ')}${a.d} · ${a.g}</span><p>${a.text}</p></div>`)}</${Collapse}>`}
    </div>
  </section>`;
}

/* ---------- Scorecard ---------- */
function Pips({ v }) { return html`<span className="pips" role="img" aria-label=${v + ' / 5'}>${[1, 2, 3, 4, 5].map(k => html`<i key=${k} className=${v >= k ? 'on' : v >= k - 0.5 ? 'half' : ''}></i>`)}<b className="mono">${L(String(v), String(v).replace('.', ','))}</b></span>`; }
const MILESTONES = [[9, 3], [11, 8], [13, 14], [14, 21]];
function ScoreMini({ state }) {
  const st = C.scorecard.map(r => ({ r, s: rowStatus(state, r) }));
  return html`<div className="scoremini">${st.map(({ r, s }) => html`<span key=${r.row} className=${'sm' + (s.done ? ' done' : '')} title=${plain(r.name)}><small className="mono">${r.row}</small><${Pips} v=${s.lvl} /></span>`)}</div>`;
}
function ScoreTab({ state, onCard }) {
  const st = C.scorecard.map(r => ({ r, s: rowStatus(state, r) })); const done = st.filter(x => x.s.done).length;
  const ms = MILESTONES.find(([d]) => state.day <= d) || MILESTONES[3];
  return html`<section className="thread">
    <div className="viewhead"><h1>Scorecard</h1><span className="small">${L('Qualgo’s 21 panel criteria. A row reaches 5 when it passes all three gates: an S on every question in the row on two different days (once in a panel), the proof done, and no 🟨 items left.', '21 tiêu chí panel của Qualgo. Một hàng đạt 5 khi qua cả ba cổng: S ở mọi câu của hàng trong hai ngày khác nhau (một lần trong panel), xong bằng chứng, và không còn mục 🟨.')}</span>
      <div className="milestone"><b className="mono">${done}/21</b><span className="small">${L('Next milestone: ' + ms[1] + ' rows at 5 by the end of Day ' + ms[0] + '.', 'Mốc kế tiếp: ' + ms[1] + ' hàng đạt 5 trước hết Ngày ' + ms[0] + '.')}</span></div></div>
    <div className="scroll">
      ${st.map(({ r, s }) => html`<div key=${r.row} className=${'scorerow' + (s.done ? ' done' : '')}>
        <div className="sr-h"><span className="mono">${r.row}</span><b>${plain(r.name)}${r.star ? '*' : ''}</b><span className="small dim">${r.weight}</span><${Pips} v=${s.lvl} /></div>
        <div className="gates">
          <span className=${'gate' + (s.g1 ? ' ok' : '')}>${L('S on two days, one in a panel', 'S hai ngày, có panel')}</span>
          <span className=${'gate' + (s.g2 ? ' ok' : '')}>${L('Proof ', 'Bằng chứng ')}${s.artOk.length ? s.artOk.map(a => a.a).join(', ') : L('not needed', 'không cần')}</span>
          <span className=${'gate' + (s.g3 ? ' ok' : '')}>${L('No 🟨 left', 'Không còn 🟨')}</span>
        </div>
        <div className="sr-qs">${s.qInfo.map(q => html`<button type="button" key=${q.id} className=${'qpill' + (q.ok ? ' ok' : '')} onClick=${() => onCard(q.id)} title=${CARD[q.id].q}>${CARD[q.id].sticker} ${q.id}<small>${'S'.repeat(Math.min(2, q.sCount)) || '·'}${q.sPanel ? 'P' : ''}</small>${q.pend ? html`<small className="amber">🟨${q.pend}</small>` : ''}</button>`)}</div>
        ${!s.done && s.next && html`<div className="small next">${L('Next step: ', 'Bước kế tiếp: ')}${s.next}</div>`}
        ${r.star && html`<div className="small starnote">${L('* This row doesn’t mean you’ve shipped a chat product. The proof here is your own concept, tests with real people, and this game itself. When you talk about it, always open with honest line 1.', '* Hàng này không có nghĩa là bạn đã có kinh nghiệm chat đã ship. Bằng chứng ở đây là concept tự làm, bài test với người thật, và chính game này. Khi nói, luôn mở bằng câu thành thật số 1.')}</div>`}
      </div>`)}
    </div>
  </section>`;
}

/* ---------- Files ---------- */
function ProofQuest({ p, state, update }) {
  const P = state.proof[p.id] || {}; const crit = plain(p.done).split(/;\s*/).filter(Boolean);
  const set = fn => update(s => { s.proof[p.id] = { ...(s.proof[p.id] || {}) }; fn(s.proof[p.id]); });
  const ready = (P.link || '').trim().length > 3 && crit.every((_, k) => P.c && P.c[k]);
  return html`<div className=${'quest' + (P.done ? ' done' : '')}>
    <div className="q-h"><span className="mono">${p.id}</span><${Md} src=${p.what} className="small" /></div>
    <div className="small dim">${plain(p.time)} · ${L('Scorecard row ', 'Scorecard hàng ')}${p.rows}</div>
    ${crit.map((t, k) => html`<label key=${k} className="chk"><input type="checkbox" id=${'pq-' + p.id + k} checked=${!!(P.c && P.c[k])} onChange=${() => set(x => { x.c = { ...(x.c || {}), [k]: !(x.c && x.c[k]) }; if (!x.c[k]) x.done = false; })} /><span>${t}</span></label>`)}
    <div className="field"><label htmlFor=${'pl-' + p.id}>${L('Link or file location', 'Link hoặc vị trí file')}</label><input id=${'pl-' + p.id} value=${P.link || ''} onInput=${e => { const v = e.target.value; set(x => { x.link = v; }); }} /></div>
    <label className=${'chk' + (ready ? '' : ' dim')}><input type="checkbox" id=${'pd-' + p.id} disabled=${!ready && !P.done} checked=${!!P.done} onChange=${() => set(x => { x.done = !x.done; x.d = state.day; })} /><span><b>${L('Done.', 'Đã xong.')}</b>${L(' From now on the game lets you mention ' + p.id + ' in your answers.', ' Từ giờ game cho phép bạn nhắc đến ' + p.id + ' trong câu trả lời.')}</span></label>
    ${P.done && html`<div className="small">${L('What to say when you present it: ', 'Câu nói khi trình bày: ')}<${Md} src=${p.say} className="inline" /></div>`}
  </div>`;
}

function Report({ state }) {
  const learned = CARDS.filter(c => isLearned(state, c.id)).length;
  const boxes = [0, 1, 2, 3, 4].map(b => CARDS.filter(c => cs(state, c.id).box === b).length);
  const closed = Object.values(state.days).filter(d => d.closed).length;
  const mins = Object.values(state.days).reduce((a, d) => a + (d.mins || 0), 0);
  const scam = (state.drills.scam || []).map(x => x.score + '/' + x.n).join(', ') || L('not yet', 'chưa');
  const wb = (state.drills.wb || []).map(x => L('D', 'N') + x.d + ' ' + Math.round(x.pct * 100) + '%').join(', ') || L('not yet', 'chưa');
  const rows = C.scorecard.filter(r => rowStatus(state, r).done).length;
  const truth = C.truth.filter(t => state.ledger[t.id]?.ok).length;
  const text = L(`Delivered ✓✓, report up to Day ${state.day}\n- Days closed: ${closed}/14, ${mins} min, streak ${state.streak} (best ${state.best})\n- Questions learned: ${learned}/72. Boxes: Inbox ${boxes[0]}, Unread ${boxes[1]}, Read ${boxes[2]}, Pinned ${boxes[3]}, Archived ${boxes[4]}\n- Scorecard: ${rows}/21 rows at 5\n- Calls: ${[7, 11, 13, 14].map(d => state.boss[d] ? 'D' + d + ' ' + state.boss[d].avg.toFixed(1) : 'D' + d + ' not yet').join(', ')}\n- Scam Detector: ${scam}. Whiteboard: ${wb}\n- Truth table items Minh confirmed: ${truth}. 🟨 items by question confirmed: ${Object.values(state.checks).filter(Boolean).length}/${ALL_PENDING.length}`,
    `Delivered ✓✓, báo cáo đến Ngày ${state.day}\n- Ngày đã đóng: ${closed}/14, ${mins} phút, chuỗi ${state.streak} (cao nhất ${state.best})\n- Câu đã học: ${learned}/72. Hộp: Inbox ${boxes[0]}, Unread ${boxes[1]}, Read ${boxes[2]}, Pinned ${boxes[3]}, Archived ${boxes[4]}\n- Scorecard: ${rows}/21 hàng đạt 5\n- Cuộc gọi: ${[7, 11, 13, 14].map(d => state.boss[d] ? 'N' + d + ' ' + state.boss[d].avg.toFixed(1) : 'N' + d + ' chưa').join(', ')}\n- Scam Detector: ${scam}. Whiteboard: ${wb}\n- Bảng sự thật Minh đã xác nhận: ${truth}. Mục 🟨 theo câu đã xác nhận: ${Object.values(state.checks).filter(Boolean).length}/${ALL_PENDING.length}`);
  const copy = () => { try { navigator.clipboard.writeText(text).then(() => toast(L('Report copied', 'Đã chép báo cáo')), () => toast(L('Couldn’t copy. Select the text to copy it.', 'Không chép được. Bôi đen để chép.'))); } catch (e) { toast(L('Couldn’t copy. Select the text to copy it.', 'Không chép được. Bôi đen để chép.')); } };
  return html`<div><pre className="report">${text}</pre><div className="actions left"><${Btn} kind="ghost" onClick=${copy}>${L('Copy report', 'Chép báo cáo')}</${Btn}></div></div>`;
}

function Debrief({ state, update }) {
  const [f, setF] = useState({ date: '', round: '', asked: '', well: '', fix: '' });
  const set = (k, v) => setF({ ...f, [k]: v });
  return html`<div className="debrief">
    ${(state.debrief || []).map((d, k) => html`<div key=${k} className="truthrow"><div className="tr-h"><span className="mono">${d.date}</span><b>${d.round}</b></div><div className="small"><b>${L('They asked:', 'Họ hỏi:')}</b> ${d.asked}</div><div className="small"><b>${L('Went well:', 'Tốt:')}</b> ${d.well}</div><div className="small"><b>${L('Fix:', 'Sửa:')}</b> ${d.fix}</div></div>`)}
    <div className="grid3">${[['date', L('Date', 'Ngày')], ['round', L('Round, interviewer', 'Vòng, người phỏng vấn')]].map(([k, l]) => html`<div key=${k} className="field"><label htmlFor=${'db-' + k}>${l}</label><input id=${'db-' + k} value=${f[k]} onInput=${e => set(k, e.target.value)} /></div>`)}</div>
    ${[['asked', L('Questions they asked', 'Những câu họ đã hỏi')], ['well', L('What went well', 'Điều đã làm tốt')], ['fix', L('What to fix for next round', 'Điều cần sửa cho vòng sau')]].map(([k, l]) => html`<div key=${k} className="field"><label htmlFor=${'db-' + k}>${l}</label><textarea id=${'db-' + k} rows="2" value=${f[k]} onInput=${e => set(k, e.target.value)}></textarea></div>`)}
    <p className="small dim">${L('Don’t write real interviewer names or anything confidential from Qualgo.', 'Không ghi tên người phỏng vấn thật hay thông tin bảo mật của Qualgo.')}</p>
    <div className="actions left"><${Btn} disabled=${!f.round.trim()} onClick=${() => { update(s => { s.debrief = [...(s.debrief || []), f]; }); setF({ date: '', round: '', asked: '', well: '', fix: '' }); }}>${L('Save debrief', 'Lưu debrief')}</${Btn}></div>
  </div>`;
}

function Settings({ state, update }) {
  const [theme, setThemeS] = useState(() => { try { return localStorage.getItem('delivered.theme') || ''; } catch (e) { return ''; } });
  const [confirm, setConfirm] = useState('');
  const [cine, setCine] = useState(cinePref.get());
  const setTheme = t => { setThemeS(t); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; try { localStorage.setItem('delivered.theme', t); } catch (e) {} };
  return html`<div className="settings">
    <div className="field"><span className="flabel">${L('Theme', 'Giao diện')}</span><div className="seg3 left">${[['', L('System', 'Theo hệ thống')], ['light', L('Light', 'Sáng')], ['dark', L('Dark', 'Tối')]].map(([k, l]) => html`<button type="button" key=${k} className=${'segbtn' + (theme === k ? ' had' : '')} onClick=${() => setTheme(k)}>${l}</button>`)}</div></div>
    <div className="field"><span className="flabel" id="set-lang-l">${L('Language', 'Ngôn ngữ')}</span><div className="seg3 left" role="radiogroup" aria-labelledby="set-lang-l">${[['en', 'English'], ['vi', 'Tiếng Việt']].map(([k, l]) => html`<button type="button" key=${k} role="radio" aria-checked=${LANG === k} lang=${k} className=${'segbtn' + (LANG === k ? ' had' : '')} onClick=${() => { if (LANG !== k) setLang(k); }}>${l}</button>`)}</div></div>
    <div className="field"><label htmlFor="set-vol">${L('Volume', 'Âm lượng')}</label><input id="set-vol" type="range" min="0" max="1" step="0.05" defaultValue=${Sound.prefs.vol} onInput=${e => Sound.set('vol', +e.target.value)} /></div>
    <div className="field"><span className="flabel">${L('Cinematic scenes', 'Cảnh điện ảnh')}</span><div className="row-inline"><label className="chk"><input type="checkbox" id="set-cine" checked=${cine} onChange=${() => { cinePref.set(!cine); setCine(!cine); }} /><span>${L('Play short scenes for the intro, calls and the final panel', 'Phát cảnh ngắn khi mở đầu, vào cuộc gọi và vòng cuối')}</span></label><button type="button" className="linkbtn" onClick=${() => { const was = cinePref.get(); cinePref.set(true); playIntro().then(() => cinePref.set(was)); }}>${L('Replay the intro', 'Xem lại cảnh mở đầu')}</button></div></div>
    <label className="chk"><input type="checkbox" id="set-lock" checked=${!!state.settings.lockOff} onChange=${() => update(s => { s.settings.lockOff = !s.settings.lockOff; })} /><span>${L('Turn off the sleep lock (the next day opens right after you close one). Only use this if your interview is coming soon.', 'Bỏ khóa giờ ngủ (mở ngày tiếp theo ngay sau khi đóng ngày). Chỉ dùng khi lịch phỏng vấn đến sớm.')}</span></label>
    <div className="small">${L('Progress saved: ', 'Lưu tiến độ: ')}${Store.mode === 'cloud' ? L('in your account, private', 'trong tài khoản của bạn, riêng tư') + (Store.lastSync ? L(', last at ', ', lần cuối ') + new Date(Store.lastSync).toLocaleTimeString(L('en-US', 'vi-VN')) : '') : L('only in this browser', 'chỉ trên trình duyệt này')}${Store.err ? L('. Last save error: ', '. Lỗi lưu gần nhất: ') + Store.err : ''}.</div>
    <div className="danger"><div className="field"><label htmlFor="set-reset">${L('Start over from Day 1. Type RESET to confirm.', 'Bắt đầu lại từ Ngày 1. Gõ XOA để xác nhận.')}</label><input id="set-reset" value=${confirm} onInput=${e => setConfirm(e.target.value)} /></div>
      <${Btn} kind="danger" disabled=${confirm.trim().toUpperCase() !== L('RESET', 'XOA')} onClick=${() => { update(s => { Object.assign(s, freshState()); }); setConfirm(''); toast(L('Started over.', 'Đã bắt đầu lại.')); }}>${L('Erase progress', 'Xóa tiến độ')}</${Btn}></div>
  </div>`;
}

function FilesTab({ state, update }) {
  const [date, setDate] = useState(state.settings.interviewDate || '');
  const daysLeft = date ? Math.ceil((new Date(date + 'T09:00') - new Date()) / 864e5) : null;
  return html`<section className="thread">
    <div className="viewhead"><h1>Files</h1><span className="small">${L('Real proof, your own words, and things that stay on this device.', 'Bằng chứng thật, câu chữ của bạn, và những thứ chỉ nằm trên máy này.')}</span></div>
    <div className="scroll files">
      <${Collapse} title=${L('Real interview date', 'Lịch phỏng vấn thật')} open=${true}>
        <div className="field"><label htmlFor="iv-date">${L('First interview date (if you have one)', 'Ngày phỏng vấn đầu tiên (nếu đã có)')}</label><input id="iv-date" type="date" value=${date} onInput=${e => { setDate(e.target.value); const v = e.target.value; update(s => { s.settings.interviewDate = v; }); }} /></div>
        ${daysLeft != null && html`<p className="small"><b className="mono">${daysLeft}</b>${L(enPl(daysLeft, ' day to go. ', ' days to go. '), ' ngày nữa. ')}${daysLeft < 14 - state.day + 1 ? L('Not enough time for all 14 days: use the short plan below and turn off the sleep lock in Settings.', 'Không đủ 14 ngày: dùng kế hoạch rút gọn dưới đây và bỏ khóa giờ ngủ trong Cài đặt.') : L('Enough time for the full plan.', 'Đủ thời gian cho cả lộ trình.')}</p>`}
        <${Md} src=${C.compress} className="small" />
      </${Collapse}>
      <${Collapse} title=${'Proof quests P1-P8 (' + C.proof.filter(p => state.proof[p.id]?.done).length + L('/8 done)', '/8 xong)')}>
        <p className="small">${L('Until a quest is done, the coach marks any line that talks as if it’s done (“I built…”, “I tested with five people”) as an overclaim.', 'Trước khi một quest xong, Coach sẽ đánh dấu mọi câu nói như thể nó đã xong (“I built…”, “I tested with five people”) là nói quá.')}</p>
        ${C.proof.map(p => html`<${ProofQuest} key=${p.id} p=${p} state=${state} update=${update} />`)}
        <label className="chk"><input type="checkbox" id="ex-crit" checked=${!!state.extra.critique} onChange=${() => update(s => { s.extra.critique = !s.extra.critique; })} /><span>${L('Recorded a real critique session with 2 designers (row 18)', 'Đã ghi lại một buổi critique thật với 2 designer (hàng 18)')}</span></label>
        <label className="chk"><input type="checkbox" id="ex-demo" checked=${!!state.extra.demo} onChange=${() => update(s => { s.extra.demo = !s.extra.demo; })} /><span>${L('Have a 2-minute AI demo with no NAB data (row 21)', 'Đã có demo AI 2 phút, không có dữ liệu NAB (hàng 21)')}</span></label>
      </${Collapse}>
      <${Collapse} title=${L('Four honest lines', 'Bốn câu thành thật')}><div className="honest">${C.honesty.map((l, k) => html`<div key=${k} className="honest-line"><span className="small">${HONESTY_WHEN[k]}</span>“${l}”</div>`)}</div></${Collapse}>
      <${Collapse} title=${'My Scripts (' + Object.keys(state.scripts).length + ')'}>${Object.keys(state.scripts).length ? Object.entries(state.scripts).map(([id, t]) => html`<div key=${id} className="myans"><b className="mono">${id}</b> ${CARD[id]?.q}<${Md} src=${t} className="small" /></div>`) : html`<p className="small dim">${L('None yet. Story Forge opens on Day 8.', 'Chưa có. Story Forge mở ở Ngày 8.')}</p>`}</${Collapse}>
      <${Collapse} title=${L('Scam warnings you wrote (', 'Cảnh báo lừa đảo bạn đã viết (') + (state.drills.warn || []).length + ')'}>${(state.drills.warn || []).map(w => html`<div key=${w.id} className="myans"><span className="small mono">${w.id} · ${w.score}/5</span><p>${w.text}</p></div>`)}</${Collapse}>
      <${Collapse} title=${L('Salary Card (this device only)', 'Salary Card (chỉ trên máy này)')}><${SalaryCard} /></${Collapse}>
      <${Collapse} title=${L('Debrief after the real interview', 'Debrief sau phỏng vấn thật')}><${Debrief} state=${state} update=${update} /></${Collapse}>
      <${Collapse} title=${L('Progress report', 'Báo cáo tiến độ')}><${Report} state=${state} /></${Collapse}>
      <${Collapse} title=${L('Settings', 'Cài đặt')}><${Settings} state=${state} update=${update} /></${Collapse}>
    </div>
  </section>`;
}

/* ---------- today panel ---------- */
function TodayPanel({ state, unlocked, open }) {
  const d = unlocked; const ds = dayOf(state, d); const segs = segsFor(state, d); const done = ds.segs || {};
  const due = dueToday(state, d).filter(id => isLearned(state, id)).length;
  const rows = C.scorecard.filter(r => rowStatus(state, r).done).length;
  const people = Object.keys(state.trust);
  const next = !ds.closed ? segs.find(k => !done[k]) : null;
  return html`<div className="today">
    <div className="td-day"><span className="small">${ds.closed ? L('Day ' + d + ' closed', 'Ngày ' + d + ' đã đóng') : L('Today', 'Hôm nay')}</span><b>${L('Day ', 'Ngày ')}${d}</b><span className="small">${SCHED[d].theme}</span></div>
    <ol className="td-segs">${segs.map(k => html`<li key=${k} className=${done[k] ? 'done' : k === next ? 'cur' : ''}><span>${done[k] ? '✓' : ''}</span>${SEG_NAME[k]}<small className="mono">${k === 'call' ? CALLS[d].mins : SEG_MIN[k]}′</small></li>`)}</ol>
    ${!ds.closed && html`<${Btn} onClick=${() => open({ k: 'day', d })}>${ds.segs ? L('Continue', 'Tiếp tục') : L('Start', 'Bắt đầu')} ${L('Day', 'Ngày')} ${d}</${Btn}>`}
    ${ds.closed && d < 14 && html`<p className="small">${L('Day ' + (d + 1) + ' opens at 5:00 a.m.', 'Ngày ' + (d + 1) + ' mở lúc 5:00 sáng.')}</p>`}
    <div className="td-stats">
      <div><${Icon} n="flame" size=${16} /><b className="mono">${state.streak}</b><span className="small">${L('day streak', 'chuỗi ngày')}</span></div>
      <div><b className="mono">${state.freezes}</b><span className="small">${L('freezes', 'băng đóng')}</span></div>
      <div><b className="mono">${state.xp}</b><span className="small">XP</span></div>
      <div><b className="mono">${due}</b><span className="small">${L('cards due', 'thẻ đến hạn')}</span></div>
    </div>
    <div className="td-sec"><div className="listlabel">${L('Panel trust', 'Niềm tin của panel')}</div>
      <div className="trustgrid">${people.map(p => html`<span key=${p} className="trustp" title=${PERSONAS[p].name + ': ' + state.trust[p]}><${Avatar} p=${p} size=${34} trust=${state.trust[p]} /><small>${PERSONAS[p].short}</small></span>`)}</div></div>
    <div className="td-sec"><div className="listlabel">Scorecard <span className="mono">${rows}/21</span></div><${ScoreMini} state=${state} /></div>
  </div>`;
}

/* ---------- shell ---------- */
const TABS = [['chats', 'chat', 'Chats'], ['map', 'floor', L('Floor 18', 'Tầng 18')], ['score', 'score', 'Scorecard'], ['files', 'files', 'Files']];
function SoundToggles() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(x => x + 1); Sound.listeners.add(f); return () => Sound.listeners.delete(f); }, []);
  return html`<span className="soundtg">
    <button type="button" className=${'iconbtn' + (Sound.prefs.sfx ? ' on' : '')} aria-pressed=${Sound.prefs.sfx} aria-label=${L('Sound effects', 'Hiệu ứng âm thanh')} title=${L('Sound effects', 'Hiệu ứng âm thanh')} onClick=${() => Sound.set('sfx', !Sound.prefs.sfx)}><${Icon} n=${Sound.prefs.sfx ? 'speaker' : 'mute'} size=${19} /></button>
    <button type="button" className=${'iconbtn' + (Sound.prefs.music ? ' on' : '')} aria-pressed=${Sound.prefs.music} aria-label=${L('Music', 'Nhạc nền')} title=${L('Music', 'Nhạc nền')} onClick=${() => Sound.set('music', !Sound.prefs.music)}><${Icon} n="note" size=${19} /></button>
  </span>`;
}
function SyncDot() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(x => x + 1); Store.listeners.add(f); return () => Store.listeners.delete(f); }, []);
  const ok = Store.mode === 'cloud' && !Store.err;
  return html`<span className=${'sync' + (ok ? ' ok' : Store.err ? ' err' : '')} title=${ok ? L('Saved to your account', 'Đã lưu vào tài khoản') : Store.err ? L('Save error: ', 'Lỗi lưu: ') + Store.err : L('Saved in this browser only', 'Chỉ lưu trên trình duyệt này')}><i></i><span className="sync-l">${ok ? L('Saved', 'Đã lưu') : Store.err ? L('Save error', 'Lỗi lưu') : L('On device', 'Trên máy')}</span></span>`;
}

function App({ initial }) {
  const [state, setState] = useState(initial);
  const update = useCallback(fn => setState(prev => { const n = structuredClone(prev); fn(n); Store.save(n); return n; }), []);
  const unlocked = unlockedDay(state);
  useEffect(() => { if (state.day !== unlocked) update(s => { s.day = unlocked; }); }, [unlocked]);
  const wide = () => window.matchMedia('(min-width: 760px)').matches;
  const [tab, setTab] = useState(() => { const h = (location.hash || '').slice(1); return TABS.some(t => t[0] === h) ? h : 'chats'; });
  const [chat, setChat] = useState(() => wide() ? { k: 'day', d: unlocked } : null);
  const [card, setCard] = useState(null);
  const [gate, setGate] = useState(() => !introSeen.get());
  const start = quiet => { introSeen.set(); setGate(false); if (!quiet) { Sound.ensure(); Sound.startMusic(); } playIntro(); };
  useEffect(() => { const t = setInterval(() => setState(s => ({ ...s })), 5 * 60e3); return () => clearInterval(t); }, []); /* re-check the 5 a.m. unlock */
  useEffect(() => { const f = () => { if (document.visibilityState === 'hidden') Store.flush(); }; document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, []);
  const open = c => { setChat(c); setTab('chats'); setCard(null); };
  const back = () => { setChat(null); };
  let main;
  if (card) main = html`<${CardDetail} key=${card} id=${card} state=${state} update=${update} onBack=${() => setCard(null)} />`;
  else if (tab === 'map') main = html`<${MapTab} state=${state} update=${update} onCard=${setCard} />`;
  else if (tab === 'score') main = html`<${ScoreTab} state=${state} onCard=${setCard} />`;
  else if (tab === 'files') main = html`<${FilesTab} state=${state} update=${update} />`;
  else if (!chat) main = html`<div className="emptymain"><${Icon} n="chat" size=${36} /><b>${L('Pick a chat', 'Chọn một cuộc trò chuyện')}</b></div>`;
  else if (chat.k === 'day') main = chat.d > unlocked ? html`<div className="emptymain"><${Icon} n="lock" size=${36} /><b>${L('Day ' + chat.d + ' isn’t open yet', 'Ngày ' + chat.d + ' chưa mở')}</b></div>` : html`<${DayThread} key=${'d' + chat.d} d=${chat.d} state=${state} update=${update} onBack=${back} />`;
  else if (chat.k === 'ledger') main = html`<${Ledger} state=${state} update=${update} onBack=${back} />`;
  else if (chat.k === 'coach') main = html`<${CoachThread} state=${state} update=${update} onBack=${back} onCard=${setCard} />`;
  else if (chat.k === 'week') main = html`<${InterviewWeek} state=${state} update=${update} onBack=${back} />`;
  const showMain = tab !== 'chats' || !!chat || !!card;
  return html`<div className=${'app' + (showMain ? ' show-main' : ' show-list')}>
    <header className="topbar">
      <span className="brand">Delivered<${Ticks} kind="read" /></span>
      <span className="tb-day mono">${L('Day ', 'Ngày ')}${unlocked}/14</span>
      <span className="tb-streak"><${Icon} n="flame" size=${16} /><span className="mono">${state.streak}</span></span>
      <${SoundToggles} />
      <${SyncDot} />
      <button type="button" className="iconbtn langbtn" aria-label=${L('Switch to Vietnamese', 'Chuyển sang tiếng Anh')} title=${L('Switch to Vietnamese', 'Chuyển sang tiếng Anh')} onClick=${() => setLang(LANG === 'en' ? 'vi' : 'en')}><${Icon} n="globe" size=${17} /><span>${LANG === 'en' ? 'VI' : 'EN'}</span></button>
    </header>
    <aside className="pane-list" aria-label=${L('Chats', 'Cuộc trò chuyện')}>
      <nav className="railtabs" aria-label=${L('Sections', 'Khu vực')}>${TABS.map(([k, ic, l]) => html`<button type="button" key=${k} className=${tab === k ? 'on' : ''} aria-current=${tab === k ? 'page' : undefined} onClick=${() => { setTab(k); setCard(null); }}><${Icon} n=${ic} size=${18} /><span>${l}</span></button>`)}</nav>
      <${ChatList} state=${state} chat=${tab === 'chats' && !card ? chat : null} open=${open} unlocked=${unlocked} />
    </aside>
    <main className="pane-main"><${Guard} key=${tab + (chat ? chat.k + (chat.d || '') : '') + (card || '')}>${main}</${Guard}></main>
    <aside className="pane-today" aria-label=${L('Today', 'Hôm nay')}><${TodayPanel} state=${state} unlocked=${unlocked} open=${open} /></aside>
    <nav className="bottomtabs" aria-label=${L('Sections', 'Khu vực')}>${TABS.map(([k, ic, l]) => html`<button type="button" key=${k} className=${tab === k ? 'on' : ''} aria-current=${tab === k ? 'page' : undefined} onClick=${() => { setTab(k); setCard(null); if (k === 'chats') setChat(null); }}><${Icon} n=${ic} size=${22} /><span>${l}</span></button>`)}</nav>
    <${Toasts} />
    <${CineHost} />
    ${gate && html`<${StartGate} onStart=${start} />`}
  </div>`;
}

class Guard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error('ui error', err); }
  render() { return this.state.err ? html`<div className="emptymain"><b>${L('Something went wrong showing this part.', 'Có lỗi khi hiển thị phần này.')}</b><span className="small">${L('Your progress is still saved.', 'Tiến độ của bạn vẫn được lưu.')}</span><${Btn} onClick=${() => this.setState({ err: null })}>${L('Try again', 'Thử lại')}</${Btn}></div>` : this.props.children; }
}
function Splash() { return html`<div className="splash"><span className="brand">Delivered<${Ticks} kind="read" /></span><div className="sk"><i></i><i></i><i></i></div></div>`; }

(async function boot() {
  document.documentElement.lang = LANG;
  try { const t = localStorage.getItem('delivered.theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(html`<${Splash} />`);
  const st = await Store.init();
  root.render(html`<${App} initial=${st} />`);
  window.addEventListener('pagehide', () => Store.flush());
})();
