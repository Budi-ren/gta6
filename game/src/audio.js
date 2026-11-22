// WebAudio synthesizer with zero audio files. All cues go through three
// small builders — tone(), noise(), arpeggio() — so each sound is a recipe
// on top of a shared voice instead of its own inline oscillator setup.
let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One oscillator voice with an optional pitch slide and exponential decay.
function tone({ freq = 440, slide = null, dur = 0.2, type = 'sine', vol = 0.2, delay = 0 }) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Filtered noise burst (impacts, skids, explosions).
function noise({ dur = 0.4, from = 800, to = 80, vol = 0.5, delay = 0 }) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
}

// A short melody: one voice per note, staggered by `step` seconds.
function arpeggio(notes, step = 0.11, type = 'square', vol = 0.14) {
  notes.forEach((freq, i) => tone({ freq, dur: 0.22, type, vol, delay: i * step }));
}

export const audio = {
  playGunshot() {
    tone({ freq: 240, slide: 55, dur: 0.14, type: 'sawtooth', vol: 0.4 });
    noise({ dur: 0.08, from: 3000, to: 500, vol: 0.25 });
  },

  playEngine(pitch = 90) {
    tone({ freq: pitch, dur: 0.09, type: 'triangle', vol: 0.045 });
  },

  playExplosion() {
    noise({ dur: 0.6, from: 500, to: 40, vol: 0.7 });
    tone({ freq: 70, slide: 28, dur: 0.5, type: 'sine', vol: 0.5 });
  },

  playCash() {
    arpeggio([523.25, 659.25, 783.99, 1046.5], 0.07, 'sine', 0.18);
  },

  playMissionJingle() {
    arpeggio([440, 554.37, 659.25, 880], 0.12, 'square', 0.13);
  },

  playSiren() {
    tone({ freq: 700, slide: 950, dur: 0.35, type: 'sine', vol: 0.05 });
    tone({ freq: 950, slide: 700, dur: 0.35, type: 'sine', vol: 0.05, delay: 0.35 });
  },

  playSkid() {
    noise({ dur: 0.25, from: 1800, to: 900, vol: 0.12 });
  },

  playDoor() {
    tone({ freq: 180, slide: 90, dur: 0.12, type: 'square', vol: 0.15 });
  },

  playPickup() {
    arpeggio([660, 880], 0.06, 'triangle', 0.16);
  },

  playHorn() {
    tone({ freq: 370, dur: 0.25, type: 'square', vol: 0.12 });
  },

  playClick() {
    tone({ freq: 1200, dur: 0.05, type: 'sine', vol: 0.12 });
  },

  setMuted(value) {
    muted = !!value;
  },

  isMuted() {
    return muted;
  },
};
