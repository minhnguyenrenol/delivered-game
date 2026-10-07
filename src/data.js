/* Authored game data for Delivered ✓✓. Book-derived content lives in content.json; this file holds
   what the game plan specifies on top of it: cast, day threads, drills, facts and overclaim rules. */

const PERSONAS = {
  linh: { name: 'Chị Linh', role: 'Talent Acquisition · R1', short: 'TA', emoji: '🌷', hue: 340,
    probe: 'And your notice period?',
    replies: {
      SA: [L('Ooh, I like that. Short and clear 😊', 'Ooh, I like that. Ngắn gọn mà rõ 😊'), 'That’s really clear, thank you! I can already see how to pitch you to the team 🙌', 'Perfect, that’s exactly what the HM will want to hear 😊'],
      B: ['Thanks! Could you say a bit more about the result? 🙂', 'Got it. And what was your part in that, specifically?', 'Thanks Minh. Maybe one concrete example?'],
      C: ['Thanks Minh. Could you give me the short version, maybe in 30 seconds?', 'Hmm, I lost the thread a little. What’s the one thing you want me to remember?', 'Okay… let me note that down. Could you try it more briefly?'] } },
  khoa: { name: 'Anh Khoa', role: 'Head of Product · hiring manager', short: 'HM', emoji: '🧭', hue: 215,
    probe: 'Why should I believe that?',
    replies: {
      SA: ['Good. That’s a decision, not a process.', 'Okay. I can work with that.', 'Clear. Next one.'],
      B: ['Fine. What did you decide, though?', 'Shorter. What was the trade-off?', 'And the number?'],
      C: ['I’m not sure what the answer was.', 'That was a lot of process. What happened?', 'Let me ask it differently.'] } },
  mai: { name: 'Chị Mai', role: 'Senior PM, chat', short: 'PM', emoji: '☕', hue: 28,
    probe: 'How did you measure that?',
    replies: {
      SA: [L('Love that you defined the number. Iced coffee is on me ☕', 'Love that you defined the number. Cà phê sữa đá on me ☕'), 'That’s how I’d want to work with design. Nice.', 'Okay, I’d sign up for that experiment.'],
      B: ['How would you measure it, though?', 'And if the test said no?', 'Which metric would you own?'],
      C: ['Hmm, that sounds like opinion against opinion.', 'I’m not hearing the data yet.', 'What would you do if I disagreed?'] } },
  tuan: { name: 'Anh Tuấn', role: 'Lead Mobile Engineer', short: 'iOS', emoji: '📱', hue: 190,
    probe: 'What happens on Android back?',
    replies: {
      SA: ['Okay, that’s buildable. Respect.', 'You thought about the failed state. Thank you.', 'Good, that’s how we’d actually ship it.'],
      B: ['And with no network?', 'Same on iOS and Android?', 'Who owns the edge cases?'],
      C: ['That sounds pixel-perfect, not buildable.', 'I’d need a lot more states than that.', 'Hmm. How would I implement that?'] } },
  vy: { name: 'Vy', role: 'Senior Product Designer', short: 'SD', emoji: '🎨', hue: 280,
    probe: 'Can I zoom in?',
    replies: {
      SA: ['Okay, I’d actually like working with you 🙂', 'That’s a craft answer. Thank you.', 'You built on what was there. I noticed.'],
      B: ['Could you show me the detail?', 'What would you want from me as your designer?', 'Hmm, and the visual side?'],
      C: ['That sounds more strategic than hands-on.', 'Would you change our system on day one?', 'I didn’t see the pixels in that.'] } },
  hai: { name: 'Anh Hải', role: 'Principal Engineer (Go)', short: 'ENG', emoji: '🛠️', hue: 150,
    probe: 'Which part is expensive?',
    replies: {
      SA: ['Ha. You asked what’s expensive. Rare.', 'Okay, backend won’t need a rewrite for that.', 'Pragmatic. Good.'],
      B: ['And how does E2EE change that?', 'Which part costs us a quarter?', 'Would you cut scope?'],
      C: ['That one needs server-side reading. We can’t.', 'Sounds expensive.', 'Hmm. Defend it or drop it?'] } },
  hang: { name: 'Chị Hằng', role: 'Product Security / AI lead', short: 'SEC', emoji: '🛡️', hue: 0,
    probe: 'Where does the model run?',
    replies: {
      SA: ['Precise. You treated security as product value.', 'Good. You designed for the model being wrong.', 'That is the answer I wanted.'],
      B: ['Where does the model run, exactly?', 'And when it’s wrong?', 'Please avoid “100% secure”.'],
      C: ['That would require reading messages server-side.', 'I’m hearing buzzwords.', 'Let’s be more exact.'] } },
  ceo: { name: 'Anh Đạt', role: 'CEO / Country GM', short: 'CEO', emoji: '🌍', hue: 45,
    probe: 'Why would anyone switch?',
    replies: {
      SA: ['That’s a vision I can repeat to our partners.', 'Good. One sentence. I like that.', 'Conviction. Thank you.'],
      B: ['And why would anyone switch?', 'What’s the wedge?', 'Give me the number.'],
      C: ['That sounds like a super-app pitch.', 'I’m not sure you believe it.', 'Shorter, please.'] } },
  ngan: { name: 'Chị Ngân', role: 'HR Business Partner', short: 'HR', emoji: '🤝', hue: 100,
    probe: 'Anything else we should know?',
    replies: {
      SA: ['Thank you for being so open, Minh.', 'That’s helpful, thank you.', 'I appreciate the transparency.'],
      B: ['Could you tell me how that ended?', 'And what would you do differently?', 'Is there anything else we should know?'],
      C: ['I’m not sure I followed the commitment there.', 'Could you be more specific?', 'Let me come back to that.'] } },
  thu: { name: 'Coach Thư', role: 'Your coach', short: 'Thư', emoji: '🎓', hue: 230 },
  self: { name: 'Minh → Minh', role: 'Truth Ledger', short: 'M', emoji: '📝', hue: 50 },
};

/* Day threads (plan 6.4 + 11) */
const DAY_META = {
  1: { title: L('Lobby · “Hi Minh 👋”', 'Sảnh · “Chào Minh 👋”'), contacts: ['linh'], drill: 'honesty', open: L('Hi Minh, thanks for coming back to Qualgo 😊 Can I ask you a few questions?', 'Chào Minh, cảm ơn bạn đã quay lại với Qualgo 😊 Mình có thể hỏi vài câu không?') },
  2: { title: L('Elevator · “Show me”', 'Thang máy · “Show me”'), contacts: ['khoa'], drill: 'numbers1', qf: [1, 10], open: 'Minh. I read your CV twice. Today, show me the evidence.' },
  3: { title: L('Elevator · “Prove it”', 'Thang máy · “Prove it”'), contacts: ['mai'], drill: 'scam', open: 'Hi Minh! Today I’ll ask about numbers. Every one of them 😉☕' },
  4: { title: L('Vault · “Security”', 'Két sắt · “Bảo mật”'), contacts: ['hang'], drill: 'warning', open: 'Good morning. We are a security company. Let us talk about trust, precisely.' },
  5: { title: L('Whiteboard · “Draw it”', 'Bảng trắng · “Draw it”'), contacts: ['vy'], drill: 'wb_strangers', qf: [11, 20], noShort: true, open: 'Hi! Today I hand you the whiteboard 🙂 Think out loud, I’ll just listen.' },
  6: { title: L('Whiteboard · “Pixels”', 'Bảng trắng · “Pixels”'), contacts: ['tuan'], drill: 'critique', open: 'Morning. Mobile craft today. States, platforms, motion.' },
  7: { title: '📞 Group call · Round 1', contacts: ['linh', 'khoa'], drill: 'boss1', boss: true, open: 'Chị Linh added you to a call with Anh Khoa. 25 minutes. Ready when you are.' },
  8: { title: 'Design team · “Lead?”', contacts: ['vy'], drill: 'forge', qf: [21, 30], open: 'So… you might be my lead. Can I ask you some lead questions? 🙂' },
  9: { title: 'Design team · “Feedback”', contacts: ['vy', 'mai'], drill: 'wb_community', open: 'Vy and Chị Mai want to talk about critique and feedback.' },
  10: { title: L('Pantry · “Iced milk coffee”', 'Pantry · “Cà phê sữa đá”'), contacts: ['mai', 'hai'], drill: 'numbers2', open: 'Pantry chat ☕ Chị Mai and Anh Hải are by the coffee machine.' },
  11: { title: '📞 Group call · Round 2', contacts: ['hang', 'hai'], drill: 'boss2', boss: true, qf: [1, 30], open: 'Chị Hằng started a call with Anh Hải. Security and AI. 20 minutes.' },
  12: { title: L('Balcony · “Big picture”', 'Ban công · “Big picture”'), contacts: ['khoa'], drill: 'wb_linking', open: 'Come out to the balcony. Let’s talk about where this goes.' },
  13: { title: '📞 Group call · Round 3', contacts: ['ceo', 'ngan'], drill: 'boss3', boss: true, open: 'Anh Đạt and Chị Ngân are waiting in the director’s room.' },
  14: { title: '📞 Final panel', contacts: ['khoa', 'vy', 'hang', 'mai', 'ngan'], drill: 'final', boss: true, open: 'Everyone’s here. Portfolio first, then questions.' },
};

/* One sticker per question, drawn from the book's “Hình dung” image */
const STICKERS = { 1: '🔐', 2: '🍜', 3: '🎁', 4: '🥃', 5: '📱', 6: '📖', 7: '🪴', 8: '⏱️', 9: '👛', 10: '🎨', 11: '📏', 12: '🎯', 13: '🌱', 14: '📡',
  15: '🏠', 16: '👆', 17: '👗', 18: '📢', 19: '🔔', 20: '👑', 21: '🌳', 22: '👵', 23: '🕰️', 24: '💪', 25: '💡', 26: '✉️', 27: '🛂', 28: '🐺',
  29: '📒', 30: '🛡️', 31: '📯', 32: '🏅', 33: '🩺', 34: '🃏', 35: '🧱', 36: '🎤', 37: '🚪', 38: '🚴', 39: '⏰', 40: '📦', 41: '⚖️', 42: '☕',
  43: '🧾', 44: '🦛', 45: '🎧', 46: '📋', 47: '🕒', 48: '🏆', 49: '🔬', 50: '⭐', 51: '📅', 52: '🤖', 53: '📲', 54: '🍌', 55: '🧪', 56: '🏙️',
  57: '🌸', 58: '🪵', 59: '📝', 60: '🧮', 61: '📜', 62: '🧳', 63: '💌', 64: '🗄️', 65: '🖼️', 66: '🪑', 67: '📮', 68: '✅', 69: '🧧', 70: '👓',
  71: '🪞', 72: '🧯' };

const ROOMS = {
  A: { name: L('Lobby', 'Sảnh'), full: L('A · Ground floor lobby', 'A · Sảnh tầng trệt'), theme: L('Who you are, and why now', 'Bạn là ai, vì sao là bây giờ') },
  B: { name: L('Elevator', 'Thang máy'), full: L('B · Elevator', 'B · Thang máy'), theme: L('Evidence, impact, failure', 'Bằng chứng, tác động, thất bại') },
  C: { name: L('Whiteboard', 'Bảng trắng'), full: L('C · Whiteboard', 'C · Bảng trắng'), theme: L('Product craft, chat, mobile', 'Tay nghề sản phẩm, chat, mobile') },
  D: { name: L('Vault', 'Két sắt'), full: L('D · Vault', 'D · Két sắt'), theme: L('Security, privacy, trust', 'Bảo mật, riêng tư, niềm tin') },
  E: { name: 'Design team', full: L('E · Design team room', 'E · Phòng design team'), theme: L('Leading quality and people', 'Dẫn dắt chất lượng và con người') },
  F: { name: 'Pantry', full: 'F · Pantry', theme: L('Working together and influence', 'Cộng tác và ảnh hưởng') },
  G: { name: L('Lab', 'Phòng lab'), full: L('G · Lab', 'G · Phòng lab'), theme: L('Data, research, AI', 'Dữ liệu, nghiên cứu, AI') },
  H: { name: L('Balcony', 'Ban công'), full: L('H · 18th floor balcony', 'H · Ban công tầng 18'), theme: L('Vision and strategy', 'Tầm nhìn và chiến lược') },
  I: { name: L('Director’s office', 'Phòng giám đốc'), full: L('I · Director’s office', 'I · Phòng giám đốc'), theme: L('Fit, commitment, wrapping up', 'Phù hợp, cam kết, kết thúc') },
  J: { name: L('Rooftop', 'Sân thượng'), full: L('J · Rooftop', 'J · Sân thượng'), theme: L('Four off-script questions', 'Bốn câu ngoài kịch bản') },
};
const ROOM_DEFAULT_PERSONA = { A: 'linh', B: 'khoa', C: 'vy', D: 'hang', E: 'vy', F: 'mai', G: 'hang', H: 'khoa', I: 'ngan', J: 'khoa' };

/* What the coach treats as true about Minh. Built from the book's Part 7.6, the CV, and Minh's confirmations. */
const FACTS = [
  'Career: about 4 years as a developer (2012–2016), then 10 years in product/UX design (2016–2026). Total is about 14 years; only about 4 of those are in finance/banking (LSEG + NAB). “14 years in banking” is false.',
  'NAB (Feb 2024–now), Senior Product Designer. Straight-through facilities fulfilment is LIVE in production: about 24 hours → about 5 minutes, 80%+ positive validation.',
  'RegShield is an AI-first regulatory MVP that is NOT live (“MVP in flight, on track”). Never “launched”.',
  'On RegShield, AI supported about 60% of design activities and roughly halved their time. This is Minh’s own ESTIMATE, not a measurement. It must be labelled as an estimate.',
  'Hearti Lab: recruited and led a team of 3 designers; 3 products, 15 projects in 2 years. CYBERhythm: 50% fewer user errors, 10% faster (baseline still to confirm).',
  'About 60 people was a Tech Academy workshop AUDIENCE, not a team Minh led. Minh has never led a team of 60.',
  'LSEG: FX Impact Intelligence was integrated into Eikon. 400,000 users / 190 countries are Eikon’s users, not “Minh’s product’s users”. 40,000+ clients is a different number (Labs clients).',
  'Freelance stablecoin wallet (anonymous overseas client): a 55-screen MOBILE-RESPONSIVE WEB app plus operator portal and 2 design systems. A native mobile app is only PLANNED. Minh never shipped a mobile app.',
  'Minh has NOT shipped a consumer chat app. A chat teardown (P2) or chat concept (P1) can only be mentioned once it is actually done.',
  'Q2 FY26 NAB Individual Award for “uplifting team capability through practical AI guidance” (an individual award). AI adoption lead for NAB Vietnam design chapter since March 2026.',
  'Qualgo approached Minh 2–3 times in the past year; Minh has not applied.',
  'SLE workflow “67% less friction”: the definition of friction is still unconfirmed. Merchant: “70% faster onboarding” for existing customers and “+20% lead-to-sale”: whether +20% is relative is unconfirmed.',
  'Toastmasters (EVO) President: membership 7 → 20, attendance 10 → 26. ADPList: 250+ sessions with 50+ designers. Master’s at MICA (2022–2023), capstone a mentorship platform.',
];

/* Patterns a sceptical interviewer could disprove. Each maps to a truth-table row. */
const OVERCLAIMS = [
  { id: 'T1', re: /\b(14|fourteen)\+?\s*(years?|yrs)\b[^.]{0,30}\b(bank|banking|finance|financial)/i, fix: '“14 years in banking” is false: 4 years developer + 10 in design, about 4 in finance.' },
  { id: 'T10', re: /\b(led|lead|leading|managed|managing|ran|run)\b[^.]{0,20}\b(team|teams|group|org)\b[^.]{0,15}\b(60|sixty)\b/i, fix: '~60 was a workshop audience. The team you led was 3.' },
  { id: 'T10', re: /\b(60|sixty)\s+(people|designers|engineers|reports)\b[^.]{0,25}\b(team|reported|led|managed)/i, fix: '~60 was a workshop audience. The team you led was 3.' },
  { id: 'T7', re: /\bmeasured\b[^.]{0,50}\b60\s?%|\b60\s?%[^.]{0,50}\bmeasured\b/i, neg: /(not|never|isn'?t|wasn'?t)\s+(a\s+)?measured|estimate/i, fix: '60% is your own estimate, not a measurement. Say “my own estimate”.' },
  { id: 'T8', re: /\bregshield\b[^.]{0,60}\b(launched|is live|went live|in production|shipped|released|rolled out)\b/i, neg: /\b(not|n't|before|yet|until|once)\b/i, fix: 'RegShield is an MVP in flight. Never “launched” or “live”.' },
  { id: 'T12', re: /\b(shipped|launched|released|published|live)\b[^.]{0,40}\b(native|mobile|ios|android)\s+app\b|\b(app store|play store|both stores)\b/i, neg: /\b(not|never|haven'?t|hasn'?t|planned|planning|plan)\b/i, fix: 'The wallet is a mobile-responsive web app. The native app is only planned.' },
  { id: 'T11', re: /\b(my|our)\s+(product|tool|app|feature)\b[^.]{0,40}\b(400\s?k|400,000|400 000|four hundred thousand)/i, fix: '400k are Eikon’s users. FX Impact was integrated into Eikon.' },
  { id: 'T17', re: /\b(shipped|launched|built and shipped|released|designed and launched)\b[^.]{0,30}\b(consumer\s+)?(chat|messaging|messenger)\s+(app|product|platform)/i, neg: /\b(haven'?t|have not|never|not|didn'?t)\b/i, fix: 'You haven’t shipped a chat app. Say the honesty line instead.' },
  { id: 'T8', re: /\bregshield\b[^.]{0,30}\b(users|customers)\b[^.]{0,20}\b\d/i, fix: 'RegShield is not live, so it has no user numbers yet.' },
];

/* Scam Detector rounds (plan 12.3 plus more in the same pattern). One sentence is the overclaim, or none (decoy). */
const SCAM_ROUNDS = [
  { s: ['At NAB I lead design for RegShield, an AI-first regulatory tool.', 'RegShield launched last quarter and cut reporting time in half.', 'The hard part was making 200-plus fields readable for a checker.'], bad: 1,
    reasons: ['Not live: say MVP in flight', 'Wrong owner of the number', 'Unlabelled estimate'], ok: 0, t: 'T8', honest: '“RegShield is an MVP in flight, on track. On it, AI roughly halved design time, by my own estimate.”' },
  { s: ['At LSEG I designed FX Impact Intelligence.', 'My product in Eikon had 400,000 users.', 'Traders in 190 countries taught me that one wrong number costs real money.'], bad: 1,
    reasons: ['Audience ≠ team', 'Wrong owner of the number', 'Not live: say MVP'], ok: 1, t: 'T11', honest: '“FX Impact was integrated into Eikon, which has about 400,000 users in 190 countries.”' },
  { s: ['I led AI adoption for our design chapter.', 'We measured that AI did 60% of the design work on RegShield.', 'I coached colleagues one-to-one on real work.'], bad: 1,
    reasons: ['Unlabelled estimate', 'Never say shipped a mobile app', 'Audience ≠ team'], ok: 0, t: 'T7', honest: '“By my own estimate, AI supported about 60% of design activities and roughly halved their time.”' },
  { s: ['People leadership matters to me.', 'I’ve led teams of up to sixty people.', 'I coach through critique, not through approvals.'], bad: 1,
    reasons: ['Wrong owner of the number', 'Audience ≠ team', 'Unlabelled estimate'], ok: 1, t: 'T10', honest: '“I’ve hired and led a team of three, and coached 50-plus designers. I ran a Design Thinking workshop for about 60 people.”' },
  { s: ['Outside NAB I design a consumer stablecoin wallet.', 'Our mobile app for the wallet is live on both stores.', 'Its whole problem is trust with first-time users.'], bad: 1,
    reasons: ['Never say shipped a mobile app', 'Not live: say MVP', 'Wrong owner of the number'], ok: 0, t: 'T12', honest: '“It’s a mobile-responsive web app, 55 screens; the native app is planned, not shipped.”' },
  { s: ['At NAB I redesigned the facilities fulfilment flow.', 'What took a day now takes about five minutes, and it’s live in production.', 'Engineering automated it; design defined what could be automated.'], bad: -1,
    reasons: [], t: 'T5', honest: 'Clean. Fulfilment is live: about 24h → about 5 minutes. Leave it alone.' },
  { s: ['I’ve spent fourteen years in banking and finance.', 'Trust is the thread through all of it.', 'Now I want consumers, mobile and security.'], bad: 0,
    reasons: ['Total ≠ banking', 'Unlabelled estimate', 'Audience ≠ team'], ok: 0, t: 'T1', honest: '“Ten years in product design, after four as a developer; about four of those in finance.”' },
  { s: ['I haven’t shipped a consumer chat app.', 'What I have shipped is products people must trust with money and security.', 'That’s the harder half of a privacy-first chat product.'], bad: -1,
    reasons: [], t: 'T17', honest: 'Clean. That is honesty line #1, word for word.' },
  { s: ['On the SLE workflow we cut friction by 67%.', 'That’s measured in our usability benchmark.', 'It scored 4.57 on ExQual, Platinum.'], bad: 1,
    reasons: ['Undefined number: say what was measured', 'Not live: say MVP', 'Audience ≠ team'], ok: 0, t: 'T2', honest: 'Only claim “measured” once you have written the real definition of friction (ledger T2). Until then: “67% less friction, as we defined it: [your definition]”.' },
  { s: ['I validated my chat concept with users.', 'Five people tested it, two over fifty-five.', 'The biggest surprise was how few read the warning.'], bad: 0,
    reasons: ['“Validated” overclaims a 5-person test', 'Wrong owner of the number', 'Not live: say MVP'], ok: 0, t: 'P3', honest: '“Tested with five people”, never “validated”. And only once P3 is actually done.' },
  { s: ['Merchant onboarding got 70% faster for existing customers.', 'Lead-to-sale went up 20 percentage points.', 'Design owned the flow end to end.'], bad: 1,
    reasons: ['Relative vs absolute: unconfirmed', 'Audience ≠ team', 'Not live: say MVP'], ok: 0, t: 'T6', honest: 'Say “+20% relative uplift” only if that’s what it was (ledger T6). Percentage points is a different, bigger claim.' },
  { s: ['The CYBERhythm dashboard cut user errors by half.', 'It was tested against the old dashboard.', 'Operators finished tasks about 10% faster.'], bad: 1,
    reasons: ['Baseline unconfirmed: check before saying', 'Wrong owner of the number', 'Total ≠ banking'], ok: 0, t: 'T9', honest: 'Say how it was tested only after you’ve confirmed the baseline (ledger T9). The 50% itself is on your CV.' },
];

/* Hostile follow-ups for Shadow Panel, built from blind spots B1–B15 and plan 7.11 */
const SHADOW = [
  { b: 'B12', q: 'Your tenure is often one to two years. Why should we believe you’ll stay?', a: '“Fair question. Early on I moved for scope, each move a step up. I’m looking for a place to stay three to five years and build a product and a team. That’s why I said no the first two times.”', sample: "Fair question. Early in my career I moved for scope, and each move was a step up. At Hearti Lab I hired and led a team of three and worked on CYBERhythm. At LSEG I worked on FX Impact, which was built into Eikon. At NAB I worked on the fulfilment flow that went live, from about a day down to about five minutes. Now I want to stay three to five years and build one product and one team. That's why I said no the first two times. I wanted to say yes only when I was ready to commit.", note: L("It admits the short stays, shows each move added something real, and backs the promise with a fact: you said no twice.", "Câu này thừa nhận các lần ở ngắn, cho thấy mỗi lần chuyển đều có thêm điều thật, và chứng minh lời hứa bằng một sự thật: bạn đã từ chối hai lần.") },
  { b: 'B9', q: 'Is this freelance work declared? Will you keep doing it?', a: '“I’d wrap it up before I start. A Lead role deserves my full attention.” (Only claim it’s declared once ledger T13 is confirmed.)', sample: "Yes, I do some freelance design for one early-stage client. It's a stablecoin wallet, a mobile-responsive web app, and the native app is still only planned. [Fill in once confirmed: It's declared to NAB under their policy.] [Fill in: whether there's an NDA, and what you're allowed to show.] If I join Qualgo, I'd wrap it up before I start. A Lead role deserves my full attention. At a security company, I also don't want any doubt about a conflict of interest, so I'm happy to put that in writing.", note: L("It answers the real worry, which is split attention, and only claims the declaration after you have checked it.", "Câu này trả lời đúng nỗi lo thật là bạn bị chia sự chú ý, và chỉ nói đã khai báo sau khi bạn đã kiểm tra.") },
  { b: 'B3', q: 'So you’re asking us to pay a lead salary while you learn chat?', a: '“I’m asking you to pay for the part that’s hard to find, trust and systems, and to let me learn the part that’s learnable fast, with a senior who’s lived chat.”', sample: "That's a fair worry, and I won't pretend I've shipped chat. I'm asking you to pay for the part that's hard to find, which is designing trust in regulated products. At NAB I defined what the system could automate in the fulfilment flow and where a person still reviews. On the stablecoin wallet I studied authentication in about 18 apps. Chat patterns are learnable fast. I've started with teardowns and a small concept. I'd also pair with someone senior who has built chat, so I learn the right things first.", note: L("It agrees with the fair part of the challenge, then shows what you bring and a clear plan for the gap.", "Câu này đồng ý với phần đúng của câu hỏi, rồi cho thấy bạn mang đến điều gì và có kế hoạch rõ ràng cho phần còn thiếu.") },
  { b: 'B2', q: 'Your old CV says fourteen years in banking. Which is it?', a: '“It shouldn’t have. Fourteen is total: four as a developer, ten in design, about four in finance. The new CV says it precisely.”', sample: "It shouldn't have said that, and that's my mistake. Fourteen is my total working years. I spent about four as a developer, then ten in product design. About four of those design years were in finance, around two and a half at NAB and my time at LSEG on FX Impact. Before that I was at Hearti Lab, where I led a team of three designers. The new CV says it precisely. I'd rather correct it myself now than have you find it later and wonder about my other numbers.", note: L("Owning the mistake first and giving the exact split makes every number after it easier to trust.", "Nhận lỗi trước và nói rõ cách chia số năm giúp mọi con số sau đó dễ tin hơn.") },
  { b: 'B13', q: 'What happened between mid-2023 and early 2024?', a: 'One calm sentence with your verified explanation (ledger Q6). No apology.', sample: "After my master's at MICA ended in May 2023, I [what you really did, for example: came back to Vietnam, ran my 8-week design program and did freelance work]. [One true detail, for example: how many people joined the program.] In February 2024 I joined NAB, because [your real reason, for example: I wanted regulated, complex work]. That choice worked out. I worked on the fulfilment flow that went live, from about a day down to about five minutes, and I won an individual award there. I'm happy to go into any part of it.", note: L("One calm, true explanation with no apology closes the topic fast, so fill the brackets with what really happened.", "Một lời giải thích bình tĩnh, đúng sự thật và không xin lỗi sẽ khép chủ đề nhanh, nên hãy điền vào ngoặc vuông điều đã thật sự xảy ra.") },
  { b: 'B5', q: 'That was long. What’s the one-sentence version?', a: 'Say your opener again, then stop. Silence is fine.', sample: "Sure. I've spent ten years in product design after four as a developer, and I'm best at making complex, high-trust products feel simple.", note: L("It proves you can cut it down on the spot, and stopping after one sentence shows confidence.", "Câu này cho thấy bạn rút gọn được ngay tại chỗ, và dừng lại sau một câu thể hiện sự tự tin.") },
  { b: 'B11', q: 'Are these NAB screens? Are we allowed to see them?', a: '“Everything here is sanitised; numbers are the ones I’m allowed to share.”', sample: "Good that you ask, and I'd expect that question here. Some screens come from my NAB work, but everything is sanitised. The data is fake, and I've taken out customer names, internal numbers and system names. The only numbers I show are the ones already on my CV, like the fulfilment flow going from about a day to about five minutes. RegShield is an MVP that isn't live yet, so I talk about decisions, not results. If there's something I can't show, I'll explain the decision in words instead.", note: L("At a security company, showing that you protect your employer's data earns trust before you show any design.", "Ở một công ty bảo mật, cho thấy bạn bảo vệ dữ liệu của nơi làm cũ sẽ tạo niềm tin trước cả khi bạn trình bày thiết kế.") },
  { b: 'B7', q: 'How does message sync work across devices with E2EE?', a: '“Each device has its own keys; history doesn’t transfer automatically, so linking needs a deliberate, visible step. I’d design that moment as the most careful screen we have.”', sample: "Each device has its own keys, so history doesn't move over by itself. Linking a new device needs a clear step the user can see. For example, you scan a QR code from inside the app, then confirm on the phone with the device name and place. I'd make that the most careful screen we have, because attackers like that moment most. On the stablecoin wallet I studied authentication in about 18 apps, and the lesson was the same: put security at the moment of value. I'd check the key details with the engineers.", note: L("It gets the key fact right, moves straight to the design decision, and leaves the deep cryptography to the engineers.", "Câu này nói đúng sự thật kỹ thuật chính, chuyển ngay sang quyết định thiết kế, và để phần mật mã sâu cho kỹ sư.") },
  { b: 'B8', q: 'You’re coming from an Australian bank. Aren’t you going to be expensive?', a: '“I’ve anchored on the role’s scope and market data, not my current salary. I’m flexible on structure.”', sample: "I've anchored on the role's scope and on market data here in Vietnam, not on my NAB salary. I know a scale-up pays differently from an Australian bank, so I look at the whole package: base, bonus, leave and growth. What you'd get is a lead who has shipped live work at NAB and led a team of three at Hearti Lab. I'm flexible on how the offer is structured. If the role is right, I'm confident we can find a number that works for both of us.", note: L("Anchoring on the role and the market instead of your bank salary removes the \"expensive\" label without naming a number too early.", "Neo vào vai trò và thị trường thay vì lương ngân hàng giúp bạn tránh bị gắn mác \"đắt\" mà không phải nói con số quá sớm.") },
  { b: 'B15', q: 'Who do you think decides the roadmap here?', a: '“I’d genuinely like to know. Who owns product decisions between Vietnam and your partners?” Turn it into your reverse question.', sample: "Honestly, I don't know yet, and I'd like to. From the outside it looks like product decisions may be shared between the team in Vietnam and your partners. So who owns the roadmap day to day? And when priorities change, how does design hear about it? At NAB I saw how much time a team saves when everyone agrees early on one definition of done. I'd want to set that up here too. So knowing who decides helps me plan how I'd lead.", note: L("Turning the trap into an honest question shows you care about how decisions get made before you join.", "Biến câu hỏi bẫy thành một câu hỏi thật lòng cho thấy bạn quan tâm đến cách ra quyết định trước khi nhận việc.") },
];

/* Critique Duel (Day 6): annotated wireframes of common chat patterns (no real apps). */
const CRITIQUE = [
  { id: 'req', title: 'Message request from a stranger', note: 'A stranger’s message opens straight into the chat. The link is live. “Accept” is the only big button.' },
  { id: 'warn', title: 'Full-screen scam warning', note: 'A red full-screen alert: “WARNING! This may be a scam!!!” with a single “OK” button.' },
  { id: 'group', title: 'Group invite', note: 'Being added to a 3,000-person group happens instantly, with no preview of who added you.' },
  { id: 'link', title: 'Desktop linking confirm', note: 'After scanning a QR, the phone shows “Linked ✓” immediately. Device details are in small grey text.' },
];

/* Write-a-Warning scenarios (Day 4) */
const WARNINGS = [
  { id: 'police', title: L('Fake police', 'Giả danh công an'), msg: L('“This is District 1 Police. Your account is linked to a money laundering case. Move your money into a holding account so we can check it.”', '“Đây là Công an quận 1. Tài khoản của bạn liên quan đến một vụ rửa tiền. Hãy chuyển tiền vào tài khoản tạm giữ để xác minh.”') },
  { id: 'crypto', title: L('Crypto investing', 'Đầu tư tiền số'), msg: L('“VIP USDT investment group, 3% profit a day, 2,000 members already. Deposit at least 5 million VND to get our trading tips.”', '“Nhóm VIP đầu tư USDT, lãi 3%/ngày, đã có 2.000 thành viên. Nạp tối thiểu 5 triệu để nhận tín hiệu.”') },
  { id: 'job', title: L('Easy job, big pay', 'Việc nhẹ lương cao'), msg: L('“Hiring people to like videos, 500k VND a day, work from home. Send us your OTP code to get your first bonus.”', '“Tuyển cộng tác viên like video, 500k/ngày, làm tại nhà. Gửi mã OTP để nhận thưởng đầu tiên.”') },
];

/* Story Forge (Day 8): six questions, Minh’s words only */
const FORGE_QS = [
  'What happened? Where were you, and when (roughly)?',
  'What did you do, in your own words? Start with “I decided…”',
  'What would you do differently now?',
  'What changed afterwards (for you, the team, or the product)?',
  'One line you actually said at the time, if you remember it.',
  'The result, with a number if there is one you can defend.',
];

/* Endings (plan 11.7) */
const ENDINGS = {
  offer: { title: 'Offer · Lead Product Designer', from: 'ngan', msg: L('Congratulations, Minh! 🎉 The panel was unanimous. We’d love you to lead design for the product. I’ll send the written offer today.', 'Chúc mừng Minh! 🎉 The panel was unanimous. We’d love you to lead design for the product. I’ll send the written offer today.') },
  offerq: { title: 'Offer, with a question', from: 'ngan', msg: 'Good news, Minh: the panel recommends an offer. One concern came up, and we’d like to frame it as a 90-day goal together.' },
  second: { title: 'Second interview', from: 'ngan', msg: 'Thank you, Minh. We’d love one more conversation before we decide. Could you do another session this week?' },
  seen: { title: 'Seen ✓✓', from: 'ngan', msg: '' },
};
