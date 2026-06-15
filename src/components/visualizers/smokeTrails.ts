// SmokeTrails — flowing smoke/cloud/ember particles that drift and fade.
// Grounded in synesthete accounts from Savickaite et al. (2023):
// - "this smoke will actually come in really helpful because a lot of my synaesthesia looks kind of like that" (P1)
// - "The embers would still be going over the top" (P1)
// - "a little bit fuzzy" (P1)
// - "smokiness" and "cloudiness" of sensations (P2)
// - "stony, rough" textures (P2)
// - "as if it had been cut by a serrated knife" (P3)
// - "waving lines — like oscilloscope configurations — lines moving in color, often metallic" (Deni Simon)

import type { AudioData, VisualParams } from './types';
import type { SmokeParticle } from './persistence';
import { freqToHue } from './persistence';

const MAX_PARTICLES = 150;
const particles: SmokeParticle[] = [];
let fieldAngle = 0;

export function renderSmokeTrails(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  const { width, height, sensitivity, palette } = params;
  const cx = width / 2;
  const cy = height / 2;
  const sens = Math.max(0.3, sensitivity);

  fieldAngle += dt * (0.4 + audio.volume * sens * 1.5);

  // Spawn particles across frequency spectrum
  const spawnCount = Math.floor(3 + audio.volume * sens * 18);
  for (let i = 0; i < spawnCount; i++) {
    // Pick a frequency bin weighted by amplitude
    let binIdx = pickWeightedBin(audio);
    const freq = (binIdx * audio.sampleRate) / audio.fftSize;
    const { h, s, l } = freqToHue(freq, palette);

    // Position: spread across canvas, weighted toward center for bass, edges for treble
    const freqNorm = Math.min(freq / 4000, 1);
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.15 + freqNorm * 0.6 + Math.random() * 0.15) * Math.min(width, height) * 0.5;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    // Velocity: outward flow + rotation around center
    const outwardSpeed = 15 + audio.volume * sens * 40;
    const vAngle = angle + (Math.random() - 0.5) * 1.5;
    const vx = Math.cos(vAngle) * outwardSpeed + Math.cos(fieldAngle + binIdx * 0.1) * 20;
    const vy = Math.sin(vAngle) * outwardSpeed + Math.sin(fieldAngle + binIdx * 0.1) * 20;

    particles.push({
      x: px, y: py,
      vx, vy,
      radius: 8 + Math.random() * 30 + freqNorm * 10,
      life: 0,
      maxLife: 1.5 + Math.random() * 3.5 + audio.volume * sens * 2,
      hue: h,
      saturation: s,
      lightness: l,
    });
  }

  // Update and render
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Slow down over time
    p.vx *= 0.995;
    p.vy *= 0.995;

    const lifeRatio = p.life / p.maxLife;
    const alpha = lifeRatio < 0.2
      ? lifeRatio / 0.2  // fade in fast
      : 1 - (lifeRatio - 0.2) / 0.8;  // slow fade out

    // Smoke-like rendering: soft radial gradient
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    const hueShift = Math.sin(p.life * 3 + p.x * 0.01) * 10;  // subtle color shimmer
    grad.addColorStop(0, `hsla(${p.hue + hueShift}, ${p.saturation}%, ${p.lightness + 15}%, ${alpha * 0.35})`);
    grad.addColorStop(0.4, `hsla(${p.hue}, ${p.saturation * 0.5}%, ${p.lightness}%, ${alpha * 0.15})`);
    grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // "Ember" core — bright center for some particles
    if (Math.random() < 0.3 && lifeRatio < 0.5) {
      const coreAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${coreAlpha})`;
      ctx.fill();
    }
  }

  // Flow lines — "waving lines... oscilloscope configurations... metallic" (Deni Simon)
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1.2 + audio.volume * sens * 2;
  ctx.beginPath();
  const lineCount = 5;
  for (let l = 0; l < lineCount; l++) {
    const baseAngle = (l / lineCount) * Math.PI * 2 + fieldAngle * 0.3;
    const dist = Math.min(width, height) * 0.25 + audio.volume * sens * 60;

    for (let t = 0; t < 1; t += 0.02) {
      const a = baseAngle + t * Math.PI * 1.5;
      const r = dist * (0.3 + t * 0.7);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.6 + Math.sin(t * 4 + fieldAngle) * 15;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  const lineHue = 200 + audio.centroid * 0.02;
  ctx.strokeStyle = `hsla(${lineHue}, 40%, 50%, 0.15)`;
  ctx.stroke();

  ctx.restore();

  while (particles.length > MAX_PARTICLES) particles.shift();
}

function pickWeightedBin(audio: AudioData): number {
  // Roulette-wheel selection
  let total = 0;
  for (let i = 0; i < audio.frequencies.length; i++) total += audio.frequencies[i];
  if (total === 0) return Math.floor(Math.random() * audio.frequencies.length);

  let r = Math.random() * total;
  for (let i = 0; i < audio.frequencies.length; i++) {
    r -= audio.frequencies[i];
    if (r <= 0) return i;
  }
  return audio.frequencies.length - 1;
}
