/**
 * Synthesizes BoloNa's UI sounds as 16-bit PCM mono WAV files.
 * Re-run anytime with `node scripts/generate-sounds.js`.
 *
 * Outputs:
 *   assets/sounds/ring.wav    ~4.0s seamless-looping luxury video call ringtone
 *   assets/sounds/message.wav 1.0s total (sparkling crystal-bell notification tone + silence tail)
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

function writeWav(filePath, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
  console.log('wrote', filePath, (buf.length / 1024).toFixed(1) + 'kb');
}

/**
 * Premium crystal bell tone:
 * Multi-harmonic rich acoustic chime with warm body, crystalline sparkle,
 * and subtle chorus shimmer.
 */
function bell(t, freq, decay = 3.5, attackSec = 0.005) {
  if (t < 0) return 0;
  const attack = Math.min(1, t / Math.max(0.001, attackSec));
  const env = attack * Math.exp(-t * decay);
  
  // Harmonic series: 1x (fundamental), 2x (warmth), 3x (brightness), 4x (air)
  // plus slight detune for lush chorus depth
  const s1 = Math.sin(2 * Math.PI * freq * t);
  const s2 = 0.42 * Math.sin(2 * Math.PI * (freq * 2) * t);
  const s3 = 0.20 * Math.sin(2 * Math.PI * (freq * 3) * t);
  const s4 = 0.08 * Math.sin(2 * Math.PI * (freq * 4) * t);
  const detune = 0.15 * Math.sin(2 * Math.PI * (freq * 1.0025) * t);

  return env * (s1 + s2 + s3 + s4 + detune);
}

/**
 * Modern, melodic, premium video calling ringtone.
 * 4.0-second seamless loop with a lush, romantic, uplifting bell progression.
 */
function makeRing() {
  const seconds = 4.0;
  const n = Math.floor(SAMPLE_RATE * seconds);
  const out = new Array(n).fill(0);

  // Musical notes in Hertz
  const DS5 = 622.25;
  const F5  = 698.46;
  const GS5 = 830.61;
  const AS5 = 932.33;
  const C6  = 1046.50;
  const DS6 = 1244.50;
  const GS6 = 1661.22;

  // Romantic ascending phrase -> playful answer cadence
  const strikes = [
    // Phrase 1: Warm uplifting chime
    { at: 0.00, f: DS5, decay: 3.2, vol: 0.8 },
    { at: 0.00, f: GS5, decay: 3.0, vol: 0.7 },
    { at: 0.26, f: C6,  decay: 3.2, vol: 0.85 },
    { at: 0.52, f: DS6, decay: 3.4, vol: 0.9 },
    { at: 0.88, f: GS6, decay: 3.8, vol: 0.75 },

    // Phrase 2: Resolving melodic cadence
    { at: 1.70, f: F5,  decay: 3.2, vol: 0.75 },
    { at: 1.70, f: AS5, decay: 3.0, vol: 0.65 },
    { at: 1.96, f: C6,  decay: 3.2, vol: 0.8 },
    { at: 2.22, f: DS6, decay: 3.4, vol: 0.85 },
    { at: 2.56, f: GS5, decay: 3.0, vol: 0.7 },
    { at: 2.56, f: C6,  decay: 2.8, vol: 0.65 },
  ];

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let v = 0;
    for (const s of strikes) {
      v += bell(t - s.at, s.f, s.decay, 0.006) * s.vol;
    }
    // Headroom normalization (no clipping, clean dynamics)
    out[i] = v * 0.24;
  }
  return out;
}

/**
 * Ultra-soft, velvety premium notification tone:
 * A gentle, warm acoustic chime with a smooth rounded attack and soothing decay.
 * Completely free of sharp transients or harsh high-pitched frequencies.
 */
function makeMessagePop() {
  const seconds = 1.0;
  const audible = 0.55;
  const n = Math.floor(SAMPLE_RATE * seconds);
  const raw = new Array(n).fill(0);

  // Sweet, warm, luxury messenger double chime (A5 880Hz -> C#6 1108.7Hz)
  const A5  = 880.00;
  const CS6 = 1108.73;

  function chimeTone(t, freq, decay = 5.0, attackSec = 0.008) {
    if (t < 0) return 0;
    const attackProgress = Math.min(1, t / Math.max(0.001, attackSec));
    const smoothAttack = 0.5 * (1 - Math.cos(Math.PI * attackProgress));
    const env = smoothAttack * Math.exp(-t * decay);

    // Warm, rounded acoustic spectrum: fundamental + gentle overtone
    const s1 = Math.sin(2 * Math.PI * freq * t);
    const s2 = 0.30 * Math.sin(2 * Math.PI * (freq * 2) * t);
    const s3 = 0.08 * Math.sin(2 * Math.PI * (freq * 3) * t);

    return env * (s1 + s2 + s3);
  }

  const notes = [
    { at: 0.00, f: A5,  decay: 5.5, vol: 0.85 },
    { at: 0.08, f: CS6, decay: 4.8, vol: 1.00 },
  ];

  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    if (t > audible) break;
    let v = 0;
    for (const note of notes) {
      v += chimeTone(t - note.at, note.f, note.decay, 0.008) * note.vol;
    }
    raw[i] = v;
    if (Math.abs(v) > maxVal) maxVal = Math.abs(v);
  }

  // Peak normalize to 0.88 (-1.1 dB) for crystal-clear audibility on mobile speakers
  const out = new Array(n).fill(0);
  const scale = maxVal > 0 ? 0.88 / maxVal : 0.88;
  for (let i = 0; i < n; i++) {
    out[i] = raw[i] * scale;
  }
  return out;
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeWav(path.join(dir, 'ring.wav'), makeRing());
writeWav(path.join(dir, 'message.wav'), makeMessagePop());
