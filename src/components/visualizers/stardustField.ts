// StardustField — sparkle, ember, and burst particles triggered by onsets and sustained audio.
// Grounded in synesthete accounts from Savickaite et al. (2023):
// - "stars in your eyes" — the stars effect brush was the best representation (P1)
// - "I never got to represent my experiences so clearly" (P1 on the stars brush)
// - "yellow and sparkly" (P1 on birdsong)
// - "electric bits" (P1)
// - "something like fireworks" (Cytowic)
// - "shimmering" quality of synesthetic experiences
//
// DESIGN: Hypersensitive — even quiet audio should produce visible stardust.
// Uses low threshold so the visual field is never empty.

import type { AudioData, VisualParams } from './types';
import type { Stardust } from './persistence';
import { freqToHue } from './persistence';

const MAX_STARS = 200;
const stars: Stardust[] = [];

export function renderStardust(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  const { width, height, sensitivity, palette } = params;
  const cx = width / 2;
  const cy = height / 2;
  const sens = Math.max(0.3, sensitivity);

  // HYPERSENSITIVE: spawn at very low volumes too
  const volume = audio.volume * sens;

  // Ambient stardust — always present, amount scales with volume
  const ambientCount = Math.floor(1 + volume * 25);
  for (let i = 0; i < ambientCount; i++) {
    const freq = pickFreq(audio);
    const { h, s: _s, l } = freqToHue(freq, palette);

    // Position: spread across canvas with slight bias toward frequency position
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.1 + Math.random() * 0.7) * Math.min(width, height) * 0.45;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    // Slow drift
    const driftAngle = Math.random() * Math.PI * 2;
    const driftSpeed = 5 + Math.random() * 20 + volume * 30;

    stars.push({
      x: px, y: py,
      vx: Math.cos(driftAngle) * driftSpeed,
      vy: Math.sin(driftAngle) * driftSpeed,
      size: 1.5 + Math.random() * 4 + volume * 5,
      life: 0,
      maxLife: 1.0 + Math.random() * 3.0,
      hue: h,
      brightness: Math.min(l + 10 + Math.random() * 15, 60),
      sparkle: Math.random() * Math.PI * 2,
    });
  }

  // Onset bursts — concentrated stardust explosions
  if (audio.onsets.length > 0 && volume > 0.04) {
    const onsetFreq = audio.onsets[0];
    const { h, s: _s2, l } = freqToHue(onsetFreq, palette);
    const burstCount = Math.floor(8 + volume * 30);

    // Burst from frequency-weighted position
    const bAngle = Math.random() * Math.PI * 2;
    const bDist = Math.min(width, height) * 0.1;
    const bx = cx + Math.cos(bAngle) * bDist;
    const by = cy + Math.sin(bAngle) * bDist;

    for (let i = 0; i < burstCount; i++) {
      const spreadAngle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120 + volume * 150;
      stars.push({
        x: bx, y: by,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        size: 2 + Math.random() * 8,
        life: 0,
        maxLife: 0.6 + Math.random() * 2.0,
        hue: h + (Math.random() - 0.5) * 20,
        brightness: Math.min(l + 12 + Math.random() * 18, 62),
        sparkle: Math.random() * Math.PI * 2,
      });
    }
  }

  // Low-frequency heavy stardust — "gravitational vacuum" stardust swirling near center
  if (audio.lowEnergy * sens > 0.15) {
    const swirlCount = Math.floor(audio.lowEnergy * sens * 8);
    for (let i = 0; i < swirlCount; i++) {
      const { h, s: _s3, l } = freqToHue(80 + Math.random() * 200, palette); // low freq range
      const sAngle = Math.random() * Math.PI * 2;
      const sDist = Math.random() * Math.min(width, height) * 0.15;
      const sx = cx + Math.cos(sAngle) * sDist;
      const sy = cy + Math.sin(sAngle) * sDist;

      // Orbital velocity around center
      const orbitAngle = sAngle + Math.PI / 2;
      const orbitSpeed = 30 + Math.random() * 60;
      stars.push({
        x: sx, y: sy,
        vx: Math.cos(orbitAngle) * orbitSpeed,
        vy: Math.sin(orbitAngle) * orbitSpeed,
        size: 2 + Math.random() * 6,
        life: 0,
        maxLife: 1.5 + Math.random() * 2.5,
        hue: h,
        brightness: Math.min(l + 5 + Math.random() * 12, 55),
        sparkle: Math.random() * Math.PI * 2,
      });
    }
  }

  // Render
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.life += dt;
    if (s.life >= s.maxLife) {
      stars.splice(i, 1);
      continue;
    }

    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.98;
    s.vy *= 0.98;
    s.sparkle += dt * (8 + Math.random() * 20);  // fast flicker

    const lifeRatio = s.life / s.maxLife;
    const alpha = 1 - lifeRatio;  // fade from max

    // Sparkle core — bright point
    const sparkleAlpha = alpha * (0.6 + 0.4 * Math.abs(Math.sin(s.sparkle)));
    const coreSize = s.size * (0.8 + 0.4 * Math.abs(Math.sin(s.sparkle * 1.7)));

    // Glow halo
    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
    glow.addColorStop(0, `hsla(${s.hue}, 90%, ${s.brightness}%, ${sparkleAlpha})`);
    glow.addColorStop(0.15, `hsla(${s.hue}, 70%, ${Math.min(s.brightness - 3, 58)}%, ${sparkleAlpha * 0.5})`);
    glow.addColorStop(0.5, `hsla(${s.hue}, 40%, ${Math.min(s.brightness - 8, 50)}%, ${sparkleAlpha * 0.12})`);
    glow.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Core dot — capped at brightness 75
    ctx.beginPath();
    ctx.arc(s.x, s.y, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.hue}, 95%, ${Math.min(s.brightness + 10, 75)}%, ${sparkleAlpha * 1.0})`;
    ctx.fill();

    // Cross-shaped sparkle for brighter ones — dimmed
    if (sparkleAlpha > 0.5 && Math.abs(Math.sin(s.sparkle)) > 0.7) {
      ctx.strokeStyle = `hsla(${s.hue}, 85%, ${Math.min(s.brightness + 15, 72)}%, ${sparkleAlpha * 0.45})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(s.x - s.size * 2, s.y);
      ctx.lineTo(s.x + s.size * 2, s.y);
      ctx.moveTo(s.x, s.y - s.size * 2);
      ctx.lineTo(s.x, s.y + s.size * 2);
      ctx.stroke();
    }
  }

  ctx.restore();

  while (stars.length > MAX_STARS) stars.splice(0, stars.length - MAX_STARS);
}

function pickFreq(audio: AudioData): number {
  let maxAmp = 0, maxIdx = 0;
  for (let i = 0; i < audio.frequencies.length; i++) {
    if (audio.frequencies[i] > maxAmp) { maxAmp = audio.frequencies[i]; maxIdx = i; }
  }
  return (maxIdx * audio.sampleRate) / audio.fftSize;
}
