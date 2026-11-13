import React from 'react';
import {AbsoluteFill, cancelRender, Composition, continueRender, delayRender, Easing, interpolate, random, Solid, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {lightLeak} from '@remotion/effects/light-leak';

/* Delivered ✓✓ cinematic scenes. Text-free on purpose: titles are overlaid in the app so they follow the language switch. */
const DISPLAY = 'Unbounded';
const fontHandle = delayRender('font');
new FontFace(DISPLAY, `url(${staticFile('unbounded600.ttf')}) format('truetype')`, {weight: '600'}).load()
  .then(f => { document.fonts.add(f); continueRender(fontHandle); }).catch(e => cancelRender(e));
const C = {night: '#0E1626', deep: '#05080F', ground: '#0D1117', tick: '#7AA2FF', tickHot: '#2F6BFF', gold: '#E2B64E', ink: '#E8EDF5', grey: '#95A2BA'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const LightLeak: React.FC<{from: number; to: number; seed: number; hue: number}> = ({from, to, seed, hue}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (frame < from || frame > to) return null;
  return <Solid width={width} height={height} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.7}}
    effects={[lightLeak({seed, hueShift: hue, progress: interpolate(frame, [from, to], [0, 1], clamp)})]} />;
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay'}}>
    <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} /></filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>;
};
const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) =>
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`}} />;
const Letterbox: React.FC<{from?: number}> = ({from = 0}) => {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [from, from + 20], [0, 64], {...clamp, easing: ease});
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
  </>;
};
const Stars: React.FC<{n?: number}> = ({n = 90}) => {
  const frame = useCurrentFrame();
  return <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
    {new Array(n).fill(0).map((_, i) => <circle key={i} cx={random('sx' + i) * 1280} cy={random('sy' + i) * 380} r={random('sr' + i) * 1.3 + 0.3}
      fill="#fff" opacity={0.25 + 0.55 * Math.abs(Math.sin(frame / (14 + random('st' + i) * 30) + i))} />)}
  </svg>;
};

/* Ticks: ✓ then ✓✓, drawn stroke by stroke, then blue */
const Ticks: React.FC<{at: number; size?: number; blueAt?: number}> = ({at, size = 120, blueAt}) => {
  const frame = useCurrentFrame();
  const d1 = interpolate(frame, [at, at + 10], [1, 0], {...clamp, easing: ease});
  const d2 = interpolate(frame, [at + 8, at + 18], [1, 0], {...clamp, easing: ease});
  const blue = blueAt !== undefined ? interpolate(frame, [blueAt, blueAt + 8], [0, 1], clamp) : 1;
  const col = blue > 0.5 ? C.tick : C.grey;
  return <svg width={size} height={size * 0.6} viewBox="0 0 40 24" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${8 * blue}px ${C.tickHot})`}}>
    <path d="M2 13 L9 20 L22 4" fill="none" stroke={col} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={d1} />
    <path d="M15 17 L18 20 L36 4" fill="none" stroke={col} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={d2} />
  </svg>;
};

/* ---------- 1. Intro: Saigon at night, the elevator climbs to floor 18 ---------- */
const BUILDINGS = new Array(30).fill(0).map((_, i) => ({x: i * 44 - 20 + random('bx' + i) * 10, w: 30 + random('bw' + i) * 26, h: 120 + random('bh' + i) * 230}));
const Skyline: React.FC = () => {
  const frame = useCurrentFrame();
  return <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
    <defs><linearGradient id="bld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A2436" /><stop offset="1" stopColor="#0A0F19" /></linearGradient></defs>
    {BUILDINGS.map((b, i) => Math.abs(b.x + b.w / 2 - 640) < 80 ? null : <g key={i}>
      <rect x={b.x} y={720 - b.h} width={b.w} height={b.h} fill="url(#bld)" />
      {new Array(Math.floor(b.h / 18)).fill(0).map((_, r) => new Array(Math.floor(b.w / 10)).fill(0).map((__, c) => {
        const on = random(`w${i}-${r}-${c}-${Math.floor((frame + i * 7) / 40)}`) > 0.72;
        return on ? <rect key={r + '-' + c} x={b.x + 4 + c * 10} y={720 - b.h + 8 + r * 18} width="4" height="7" fill={random('wc' + i + r) > 0.8 ? C.gold : '#9FB4D9'} opacity={0.55} /> : null;
      }))}
    </g>)}
  </svg>;
};
const Tower: React.FC = () => {
  const frame = useCurrentFrame();
  const top = 150, base = 720, floorH = (base - top) / 20;
  const climb = interpolate(frame, [50, 130], [0, 1], {...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1)});
  const carY = base - floorH * (1 + climb * 17);
  const hit = interpolate(frame, [130, 136, 175], [0, 1, 0.55], clamp);
  return <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="tw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#141D2C" /><stop offset=".5" stopColor="#24324A" /><stop offset="1" stopColor="#0E1522" /></linearGradient>
      <filter id="bloom" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="10" /></filter>
    </defs>
    <rect x={580} y={top} width={120} height={base - top} fill="url(#tw)" />
    <rect x={636} y={top - 46} width={8} height={46} fill="#24324A" />
    <circle cx={640} cy={top - 48} r={3} fill="#FF6B5E" opacity={0.4 + 0.6 * (Math.floor(frame / 15) % 2)} />
    {new Array(20).fill(0).map((_, f) => <line key={f} x1={586} x2={694} y1={base - floorH * f} y2={base - floorH * f} stroke="#33445F" strokeWidth="1" />)}
    <rect x={584} y={carY} width={112} height={floorH} fill={C.tick} opacity={0.35 * (1 - hit)} filter="url(#bloom)" />
    <rect x={584} y={carY} width={112} height={floorH} fill={C.tick} opacity={0.5 * (1 - hit)} />
    <rect x={584} y={base - floorH * 18} width={112} height={floorH} fill={C.gold} opacity={hit} filter="url(#bloom)" />
    <rect x={584} y={base - floorH * 18} width={112} height={floorH} fill={C.gold} opacity={hit * 0.9} />
  </svg>;
};
const FloorCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [50, 130], [1, 18], {...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1)}));
  const op = interpolate(frame, [40, 55, 175, 190], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', left: 760, top: 300, fontFamily: DISPLAY, color: n === 18 ? C.gold : C.ink, opacity: op, display: 'flex', alignItems: 'baseline', gap: 10}}>
    <span style={{fontSize: 22, letterSpacing: 4, color: C.grey}}>FL</span>
    <span style={{fontSize: 84, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textShadow: n === 18 ? `0 0 24px ${C.gold}` : 'none'}}>{String(n).padStart(2, '0')}</span>
  </div>;
};
const Bubble: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  return <div style={{position: 'absolute', left: 262, top: 150, width: 300, height: 104, borderRadius: 28, borderBottomRightRadius: 8,
    background: 'rgba(22,28,38,.86)', border: '1px solid #33445F', boxShadow: '0 30px 80px -20px rgba(0,0,0,.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px',
    opacity: interpolate(frame, [at, at + 12], [0, 1], clamp),
    scale: interpolate(frame, [at, at + 18], [0.8, 1], {...clamp, easing: Easing.spring({damping: 14})}),
    translate: interpolate(frame, [at, at + 18], ['0px 30px', '0px 0px'], {...clamp, easing: ease})}}>
    <div style={{position: 'absolute', left: 32, top: 40, width: 190, height: 12, borderRadius: 6, background: '#33445F'}} />
    <div style={{position: 'absolute', left: 32, top: 64, width: 130, height: 12, borderRadius: 6, background: '#2A3443'}} />
    <Ticks at={at + 10} size={78} blueAt={at + 28} />
  </div>;
};
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 0%, #1B2944 0%, ${C.deep} 70%)`}}>
    <AbsoluteFill style={{scale: interpolate(frame, [0, 210], [1.0, 1.16], {...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1)}),
      translate: interpolate(frame, [0, 210], ['0px 30px', '0px -10px'], clamp), transformOrigin: '50% 30%'}}>
      <Stars />
      <Skyline />
      <Tower />
    </AbsoluteFill>
    <FloorCounter />
    <Bubble at={140} />
    <Vignette />
    <Grain />
    <LightLeak from={170} to={210} seed={4} hue={170} />
    <Letterbox />
    <AbsoluteFill style={{background: C.ground, opacity: interpolate(frame, [192, 210], [0, 1], clamp)}} />
  </AbsoluteFill>;
};

/* ---------- 2. Incoming group call ---------- */
const Call: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const rings = [0, 30, 60, 90];
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #1A2A4A 0%, ${C.night} 60%, #070B14 100%)`}}>
    <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
      <defs><filter id="soft"><feGaussianBlur stdDeviation="6" /></filter></defs>
      {rings.map(r => {
        const t = interpolate(frame, [r, r + 60], [0, 1], clamp);
        return t > 0 && t < 1 ? <circle key={r} cx={640} cy={360} r={70 + t * 330} fill="none" stroke={C.tick} strokeWidth={2 + (1 - t) * 3} opacity={(1 - t) * 0.7} /> : null;
      })}
      {new Array(5).fill(0).map((_, i) => {
        const a = (i / 5) * Math.PI * 2 + frame / 90;
        const beat = rings.some(r => frame >= r + i * 4 && frame < r + i * 4 + 10) ? 1 : 0;
        const x = 640 + Math.cos(a) * 210, y = 360 + Math.sin(a) * 120;
        return <g key={i} opacity={interpolate(frame, [i * 6, i * 6 + 14], [0, 1], clamp)}>
          <circle cx={x} cy={y} r={26 + beat * 4} fill={C.tick} opacity={0.18 + beat * 0.3} filter="url(#soft)" />
          <circle cx={x} cy={y} r={18} fill="#16213A" stroke={beat ? C.tick : '#33445F'} strokeWidth="2" />
        </g>;
      })}
      <circle cx={640} cy={360} r={56} fill={C.tickHot} opacity={0.25 + 0.15 * Math.sin(frame / 5)} filter="url(#soft)" />
      <circle cx={640} cy={360} r={44} fill={C.tickHot} />
      <path d="M624 352c6 12 14 20 26 26l8-8c1-1 3-1 4 0l10 6c1 1 2 3 1 4l-5 8c-1 2-3 3-5 3-26-2-48-24-50-50 0-2 1-4 3-5l8-5c1-1 3 0 4 1l6 10c1 1 1 3 0 4z" fill="#fff" transform="translate(-6 -6)" />
    </svg>
    <div style={{position: 'absolute', top: 358, left: interpolate(frame, [12, 52], [-900, 1400], {...clamp, easing: Easing.bezier(0.5, 0, 0.5, 1)}),
      width: 900, height: 4, background: `linear-gradient(90deg, transparent, ${C.tick}, #fff, ${C.tick}, transparent)`, filter: 'blur(3px)', opacity: 0.85}} />
    <Vignette strength={0.85} />
    <Letterbox />
    <Grain />
    <AbsoluteFill style={{background: C.night, opacity: interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], clamp)}} />
  </AbsoluteFill>;
};

/* ---------- 3. Final panel: the doors open on floor 18 ---------- */
const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [62, 112], [0, 1], {...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1)});
  const fl = Math.round(interpolate(frame, [0, 46], [15, 18], clamp));
  const chairs = [0, 1, 2, 3, 4];
  return <AbsoluteFill style={{background: '#05070C'}}>
    <AbsoluteFill style={{scale: interpolate(frame, [60, 180], [1, 1.12], {...clamp, easing: ease})}}>
      <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="room" cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#F6EBCF" /><stop offset=".35" stopColor="#7A6A45" /><stop offset="1" stopColor="#120F0A" /></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <rect width="1280" height="720" fill="url(#room)" opacity={open} />
        <polygon points="420,520 860,520 1010,700 270,700" fill="#2B2418" opacity={open} />
        <polygon points="420,520 860,520 870,532 410,532" fill="#4A3E29" opacity={open} />
        {chairs.map(i => {
          const on = interpolate(frame, [116 + i * 9, 124 + i * 9], [0, 1], clamp);
          const x = 470 + i * 85;
          return <g key={i} opacity={open}>
            <circle cx={x} cy={470} r={34} fill={C.gold} opacity={on * 0.55} filter="url(#glow)" />
            <rect x={x - 22} y={448} width={44} height={60} rx={12} fill={on > 0.5 ? '#3A3020' : '#1A160F'} stroke={on > 0.5 ? C.gold : '#3A3020'} strokeWidth="2" />
            <circle cx={x} cy={430} r={14} fill={on > 0.5 ? '#3A3020' : '#1A160F'} stroke={on > 0.5 ? C.gold : '#3A3020'} strokeWidth="2" />
          </g>;
        })}
      </svg>
    </AbsoluteFill>
    {[-1, 1].map(s => <div key={s} style={{position: 'absolute', top: 0, bottom: 0, width: 640, left: s < 0 ? 0 : 640,
      translate: `${s * open * 660}px 0px`,
      background: 'linear-gradient(90deg, #39424F, #8B95A3 30%, #4B5563 55%, #9AA3AF 80%, #3B4350)', boxShadow: s < 0 ? 'inset -2px 0 0 #1F2937' : 'inset 2px 0 0 #1F2937'}} />)}
    <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: interpolate(frame, [70, 100], [1, 0], clamp)}}>
      <div style={{fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, color: fl === 18 ? C.gold : '#FF8A5C', padding: '6px 30px', background: '#0B0E14', borderRadius: 12,
        textShadow: `0 0 18px ${fl === 18 ? C.gold : '#FF8A5C'}`, fontVariantNumeric: 'tabular-nums'}}>{fl}</div>
    </div>
    <Vignette />
    <Grain />
    <LightLeak from={140} to={180} seed={9} hue={10} />
    <Letterbox />
    <AbsoluteFill style={{background: C.ground, opacity: interpolate(frame, [166, 180], [0, 1], clamp)}} />
  </AbsoluteFill>;
};

/* ---------- 4. Delivered: ticks burst, the message is read ---------- */
const Delivered: React.FC = () => {
  const frame = useCurrentFrame();
  const burst = interpolate(frame, [18, 80], [0, 1], {...clamp, easing: Easing.bezier(0.1, 0.8, 0.2, 1)});
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #18233B 0%, ${C.deep} 70%)`}}>
    <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
      <defs><filter id="gg"><feGaussianBlur stdDeviation="10" /></filter></defs>
      <circle cx={640} cy={360} r={40 + burst * 260} fill="none" stroke={C.gold} strokeWidth={3} opacity={(1 - burst) * 0.9} />
      <circle cx={640} cy={360} r={20 + burst * 420} fill="none" stroke={C.tick} strokeWidth={1.5} opacity={(1 - burst) * 0.6} />
      {new Array(64).fill(0).map((_, i) => {
        const a = random('a' + i) * Math.PI * 2, dist = 120 + random('d' + i) * 520;
        const x = 640 + Math.cos(a) * dist * burst, y = 360 + Math.sin(a) * dist * burst * 0.75;
        const col = random('c' + i) > 0.7 ? C.gold : C.tick;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${(random('r' + i) - 0.5) * 120 * burst}) scale(${0.5 + random('s' + i)})`} opacity={burst > 0 ? (1 - burst) * 0.95 + 0.05 : 0}>
          <path d="M-12 1 L-7 6 L2 -5 M-2 4 L0 6 L12 -5" fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>;
      })}
      <circle cx={640} cy={360} r={110} fill={C.tickHot} opacity={interpolate(frame, [40, 70], [0, 0.35], clamp)} filter="url(#gg)" />
    </svg>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', scale: interpolate(frame, [30, 60], [0.7, 1], {...clamp, easing: Easing.spring({damping: 12})})}}>
      <Ticks at={30} size={260} blueAt={62} />
    </AbsoluteFill>
    <Vignette />
    <Grain />
    <LightLeak from={88} to={150} seed={2} hue={0} />
    <Letterbox />
    <AbsoluteFill style={{background: C.ground, opacity: interpolate(frame, [136, 150], [0, 1], clamp)}} />
  </AbsoluteFill>;
};

export const Root: React.FC = () => <>
  <Composition id="intro" component={Intro} durationInFrames={210} fps={30} width={1280} height={720} />
  <Composition id="call" component={Call} durationInFrames={120} fps={30} width={1280} height={720} />
  <Composition id="final" component={Final} durationInFrames={180} fps={30} width={1280} height={720} />
  <Composition id="delivered" component={Delivered} durationInFrames={150} fps={30} width={1280} height={720} />
</>;
