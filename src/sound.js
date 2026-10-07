/* Sound and music. Everything is synthesised with Web Audio, so nothing loads from outside the page
   and nothing plays before the first tap (browsers require a gesture). */
const Sound = {
  ctx: null, master: null, sfx: null, mus: null, timer: null, mood: 'calm', beat: 0, nextT: 0, listeners: new Set(),
  prefs: (() => { const d = { sfx: true, music: true, vol: 0.7 }; try { return { ...d, ...JSON.parse(localStorage.getItem('delivered.sound') || '{}') }; } catch (e) { return d; } })(),
  set(k, v) {
    this.prefs[k] = v; try { localStorage.setItem('delivered.sound', JSON.stringify(this.prefs)); } catch (e) {}
    if (this.master) this.master.gain.setTargetAtTime(this.prefs.vol, this.ctx.currentTime, 0.05);
    if (k === 'music') v ? this.startMusic() : this.stopMusic();
    this.listeners.forEach(f => f());
  },
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { this.ctx = new AC(); } catch (e) { return null; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = this.prefs.vol; this.master.connect(comp);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    const verb = c.createConvolver(); const len = c.sampleRate * 2.2; const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir; this.verb = c.createGain(); this.verb.gain.value = 0.28; this.verb.connect(verb); verb.connect(this.master);
    return c;
  },
  tone(f, t, dur, o = {}) {
    const c = this.ctx; const osc = c.createOscillator(); const g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const peak = o.gain ?? 0.15, a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g); g.connect(o.bus || this.sfx); if (o.wet) g.connect(this.verb);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(t, dur, o = {}) {
    const c = this.ctx; const n = c.createBufferSource(); const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = o.q || 1.2;
    f.frequency.setValueAtTime(o.f0 || 800, t); f.frequency.exponentialRampToValueAtTime(o.f1 || 3000, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || 0.08, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(this.sfx); n.start(t); n.stop(t + dur);
  },
  play(name) {
    if (!this.prefs.sfx) return; const c = this.ensure(); if (!c) return;
    const t = c.currentTime + 0.01, T = this.tone.bind(this);
    switch (name) {
      case 'tap': T(880, t, 0.05, { type: 'triangle', gain: 0.035 }); break;
      case 'send': this.noise(t, 0.22, { f0: 600, f1: 4200, gain: 0.05 }); T(660, t, 0.14, { to: 990, gain: 0.06 }); break;
      case 'sent': T(1250, t + 0.05, 0.05, { type: 'triangle', gain: 0.07 }); break;
      case 'delivered': T(1250, t + 0.05, 0.05, { type: 'triangle', gain: 0.07 }); T(1480, t + 0.43, 0.05, { type: 'triangle', gain: 0.07 }); break;
      case 'read': T(1250, t + 0.05, 0.05, { type: 'triangle', gain: 0.06 }); T(1480, t + 0.43, 0.05, { type: 'triangle', gain: 0.06 }); T(1046.5, t + 0.75, 0.5, { gain: 0.08, wet: true }); T(1568, t + 0.83, 0.6, { gain: 0.06, wet: true }); break;
      case 'typing': this.play('read'); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => T(f, t + 1.0 + i * 0.07, 0.7, { type: 'triangle', gain: 0.05, wet: true })); break;
      case 'fail': T(196, t, 0.32, { type: 'sawtooth', to: 110, gain: 0.07, lp: 700 }); T(98, t, 0.4, { gain: 0.1 }); break;
      case 'notify': T(1568, t, 0.5, { gain: 0.06, wet: true }); T(2093, t + 0.08, 0.6, { gain: 0.05, wet: true }); break;
      case 'flip': T(520, t, 0.08, { type: 'triangle', gain: 0.06, to: 780 }); break;
      case 'unlock': T(1800, t, 0.03, { type: 'square', gain: 0.03, lp: 3000 }); T(1200, t + 0.06, 0.04, { type: 'square', gain: 0.03, lp: 3000 }); T(880, t + 0.12, 0.35, { gain: 0.06, wet: true }); break;
      case 'ring': for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) { T(440, t + k * 1.1 + i * 0.07, 0.06, { gain: 0.05 }); T(480, t + k * 1.1 + i * 0.07, 0.06, { gain: 0.05 }); } break;
      case 'join': [392, 523.25, 659.25].forEach((f, i) => T(f, t + i * 0.09, 0.4, { gain: 0.06, wet: true })); break;
      case 'drop': T(620, t, 0.5, { to: 180, type: 'triangle', gain: 0.08 }); T(480, t + 0.05, 0.08, { gain: 0.05 }); T(480, t + 0.2, 0.08, { gain: 0.05 }); T(480, t + 0.35, 0.08, { gain: 0.05 }); break;
      case 'sticker': [1318.5, 1568, 2093].forEach((f, i) => T(f, t + i * 0.06, 0.35, { gain: 0.045, wet: true })); break;
      case 'close': [261.63, 329.63, 392, 440, 523.25].forEach((f, i) => T(f, t + i * 0.18, 2.2, { type: 'triangle', gain: 0.045, attack: 0.04, wet: true, lp: 1800 })); break;
      case 'win': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => T(f, t + i * 0.12, 1.6, { type: 'triangle', gain: 0.06, wet: true })); T(130.81, t, 2, { gain: 0.07, attack: 0.05 }); break;
    }
  },
  grade(g) { this.play({ F: 'fail', C: 'sent', B: 'delivered', A: 'read', S: 'typing' }[g] || 'sent'); },

  /* Cinematic layer: trailer-style risers, impacts and swells, timed to the Remotion scenes (seconds from scene start). */
  riser(t, dur, o = {}) {
    const c = this.ctx; this.noise(t, dur, { f0: o.f0 || 300, f1: o.f1 || 6000, q: 2.5, gain: o.gain || 0.06 });
    this.tone(o.from || 110, t, dur, { type: 'sawtooth', to: o.to || 880, gain: (o.gain || 0.06) * 0.5, attack: dur * 0.9, lp: 2600 });
  },
  impact(t, o = {}) {
    const g = o.gain || 1;
    this.tone(o.f || 70, t, 1.6, { to: 32, gain: 0.32 * g, attack: 0.004 });
    this.tone((o.f || 70) * 2, t, 0.5, { type: 'triangle', to: 50, gain: 0.12 * g, attack: 0.002 });
    this.noise(t, 0.6, { f0: 2400, f1: 180, q: 0.7, gain: 0.12 * g });
    this.tone(55, t + 0.01, 3.2, { gain: 0.05 * g, attack: 0.02, wet: true, lp: 400 });
  },
  braam(t, root = 55, dur = 2.6, major = false) {
    [0, 7, 12, major ? 16 : 15].forEach((st, i) => [-9, 0, 9].forEach(dt =>
      this.tone(root * Math.pow(2, st / 12), t, dur, { type: 'sawtooth', detune: dt, gain: 0.035 - i * 0.004, attack: 0.08, lp: 900 + i * 300, wet: true })));
  },
  whoosh(t, dur = 0.7, gain = 0.09) { this.noise(t, dur, { f0: 250, f1: 5200, q: 1.4, gain }); this.noise(t + dur * 0.5, dur * 0.6, { f0: 5000, f1: 400, q: 1.2, gain: gain * 0.6 }); },
  shimmer(t, base = 1046.5) { [1, 1.25, 1.5, 2, 2.5, 3].forEach((m, i) => this.tone(base * m, t + i * 0.045, 1.4, { type: 'triangle', gain: 0.03, wet: true })); },
  ding(t, f = 1318.5) { this.tone(f, t, 1.4, { gain: 0.09, wet: true }); this.tone(f * 2.01, t, 0.6, { gain: 0.025, wet: true }); },
  heartbeat(t) { this.tone(58, t, 0.22, { gain: 0.25, to: 40 }); this.tone(52, t + 0.24, 0.26, { gain: 0.18, to: 36 }); },
  cine(key) {
    if (!this.prefs.sfx) return; const c = this.ensure(); if (!c) return; const t = c.currentTime + 0.05;
    if (this.mus && this.timer) { this.mus.gain.setTargetAtTime(0, t, 0.15); setTimeout(() => this.setMood(this.mood), ({ intro: 7000, call: 4000, final: 6000, delivered: 5000, chapter: 1800 })[key] || 2000); }
    switch (key) {
      case 'intro':
        this.tone(55, t, 6.5, { gain: 0.08, attack: 1.6, lp: 500 }); this.tone(82.4, t + 0.4, 6, { type: 'triangle', gain: 0.04, attack: 1.8, lp: 700, wet: true });
        this.riser(t + 1.6, 2.7, { from: 110, to: 660, gain: 0.05 });
        for (let i = 0; i < 17; i++) this.tone(1600 + i * 30, t + 1.67 + i * 0.157, 0.03, { type: 'square', gain: 0.012, lp: 3000 });
        this.impact(t + 4.33); this.ding(t + 4.36);
        this.whoosh(t + 4.6, 0.5, 0.06);
        this.tone(1250, t + 5.0, 0.05, { type: 'triangle', gain: 0.07 }); this.tone(1480, t + 5.28, 0.05, { type: 'triangle', gain: 0.07 });
        this.shimmer(t + 5.9); this.riser(t + 5.6, 0.9, { from: 220, to: 1760, gain: 0.04 }); this.braam(t + 6.4, 55, 2.4, true);
        break;
      case 'call':
        this.impact(t, { f: 60, gain: 0.7 }); this.whoosh(t + 0.4, 0.9, 0.07);
        [0, 1, 2, 3].forEach(k => { this.heartbeat(t + k * 1.0 + 0.05); this.tone(440, t + k + 0.1, 0.5, { gain: 0.03, wet: true }); this.tone(554.4, t + k + 0.1, 0.5, { gain: 0.025, wet: true }); });
        this.riser(t + 2.6, 1.3, { from: 110, to: 440, gain: 0.04 });
        break;
      case 'final':
        [0.5, 1.0, 1.53].forEach((x, i) => this.ding(t + x, [987.8, 1108.7, 1318.5][i]));
        this.noise(t + 2.07, 1.7, { f0: 200, f1: 900, q: 0.8, gain: 0.07 }); this.tone(48, t + 2.07, 1.8, { gain: 0.1, attack: 0.3, lp: 200 });
        [523.25, 587.33, 659.25, 783.99, 880].forEach((f, i) => this.tone(f, t + 3.87 + i * 0.3, 1.2, { type: 'triangle', gain: 0.05, wet: true }));
        this.riser(t + 4.4, 1.0, { from: 165, to: 990, gain: 0.05 }); this.impact(t + 5.4, { gain: 0.8 }); this.braam(t + 5.4, 65.4, 2.4, true);
        break;
      case 'delivered':
        this.riser(t, 0.6, { from: 220, to: 1320, gain: 0.05 }); this.impact(t + 0.6);
        for (let i = 0; i < 14; i++) this.tone(1800 + Math.random() * 2200, t + 0.62 + Math.random() * 1.4, 0.25, { type: 'triangle', gain: 0.018, wet: true });
        this.tone(1250, t + 1.05, 0.05, { type: 'triangle', gain: 0.08 }); this.tone(1480, t + 1.32, 0.05, { type: 'triangle', gain: 0.08 });
        this.shimmer(t + 2.07, 1318.5); this.braam(t + 2.9, 65.4, 3, true);
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + 3.0 + i * 0.1, 2, { type: 'triangle', gain: 0.05, wet: true }));
        break;
      case 'chapter': this.whoosh(t, 0.6, 0.07); this.impact(t + 0.45, { f: 80, gain: 0.55 }); this.tone(196, t + 0.45, 1.6, { type: 'triangle', gain: 0.04, wet: true }); break;
      case 'gradeS': this.riser(t, 0.35, { from: 440, to: 1760, gain: 0.04 }); this.impact(t + 0.35, { f: 90, gain: 0.45 }); this.shimmer(t + 0.4, 1318.5); break;
      case 'gradeF': this.impact(t, { f: 50, gain: 0.6 }); this.tone(92, t, 0.5, { type: 'sawtooth', gain: 0.06, lp: 500, to: 60 }); break;
    }
  },

  /* Generative lo-fi: soft pads and a sparse pentatonic pluck. Calm by day, lower and slower in calls. */
  MOODS: {
    calm: { bpm: 70, prog: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], scale: [72, 74, 76, 79, 81, 84], pluck: 0.32, gain: 0.5 },
    call: { bpm: 60, prog: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 52, 55, 60], [43, 50, 55, 59]], scale: [69, 72, 74, 76, 79], pluck: 0.18, gain: 0.32 },
  },
  setMood(m) { this.mood = m; if (this.mus && this.ctx) this.mus.gain.setTargetAtTime(this.prefs.music ? this.MOODS[m].gain * 0.22 : 0, this.ctx.currentTime, 0.8); },
  startMusic() {
    if (!this.prefs.music) return; const c = this.ensure(); if (!c || this.timer) return;
    this.mus.gain.setTargetAtTime(this.MOODS[this.mood].gain * 0.22, c.currentTime, 1.5);
    this.nextT = c.currentTime + 0.1; this.beat = 0;
    const midi = n => 440 * Math.pow(2, (n - 69) / 12);
    const step = () => {
      if (document.visibilityState === 'hidden') return;
      const M = this.MOODS[this.mood]; const spb = 60 / M.bpm;
      while (this.nextT < c.currentTime + 0.4) {
        const t = this.nextT, b = this.beat; const chord = M.prog[Math.floor(b / 8) % M.prog.length];
        if (b % 8 === 0) chord.forEach((n, i) => { this.tone(midi(n), t, spb * 8.4, { type: i % 2 ? 'triangle' : 'sine', gain: 0.09, attack: 1.2, lp: 900, bus: this.mus, detune: (i - 1.5) * 4 }); });
        if (b % 8 === 0) this.tone(midi(chord[0] - 12), t, spb * 7.5, { gain: 0.12, attack: 0.3, lp: 300, bus: this.mus });
        if (b % 2 === 1 && Math.random() < M.pluck) { const n = M.scale[Math.floor(Math.random() * M.scale.length)]; this.tone(midi(n), t + (Math.random() < 0.3 ? spb / 2 : 0), spb * 1.6, { type: 'triangle', gain: 0.05, lp: 2400, bus: this.mus }); }
        this.nextT += spb; this.beat++;
      }
    };
    this.timer = setInterval(step, 120); step();
  },
  stopMusic() { clearInterval(this.timer); this.timer = null; if (this.mus && this.ctx) this.mus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); },
};
document.addEventListener('pointerdown', e => {
  Sound.ensure(); if (Sound.prefs.music && !Sound.timer) Sound.startMusic();
  const b = e.target.closest && e.target.closest('button'); if (b && !b.disabled) Sound.play('tap');
}, { capture: true });
document.addEventListener('visibilitychange', () => { if (!Sound.ctx) return; document.visibilityState === 'hidden' ? Sound.ctx.suspend() : Sound.ctx.resume(); });
