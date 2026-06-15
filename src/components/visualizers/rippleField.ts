// RippleField — persistent concentric ripples emanating from sound onsets.
// Grounded in synesthete accounts:
// - "pulsating outwards as if it's churning round" (Participant 1, Savickaite 2023)
// - "gravitational vacuum — slower in the middle, moves a lot more on the outside" (Participant 1)
// - Klüver form constants: tunnels, spirals, concentric patterns

import type { AudioData, VisualParams } from './types';
import type { Ripple } from './persistence';
import { freqToHue } from './persistence';

const MAX_RIPPLES = 40;
const ripples: Ripple[] = [];
let phase = 0;

export function renderRippleField(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  const { width, height, sensitivity, palette } = params;
  const cx = width / 2;
  const cy = height / 2;
  const maxDim = Math.max(width, height);
  const sens = Math.max(0.3, sensitivity);

  phase += dt * 0.8;

  // Spawn new ripples from onsets and sustained energy
  const energy = audio.volume * sens;
  const onsetSpawning = audio.onsets.length > 0;

  // Always spawn from center with low-frequency energy
  const spawnRate = Math.floor(audio.lowEnergy * sens * 8);
  for (let i = 0; i < spawnRate; i++) {
    const dominantFreq = findDominantFreq(audio);
    const { h, s, l } = freqToHue(dominantFreq, palette);
    ripples.push({
      x: cx + (Math.random() - 0.5) * width * 0.3,
      y: cy + (Math.random() - 0.5) * height * 0.3,
      radius: 5,
      maxRadius: maxDim * 0.4 + Math.random() * maxDim * 0.4,
      life: 0,
      hue: h,
      saturation: s,
      lightness: l + 15,
      lineWidth: 0.8 + Math.random() * 2.5,
    });
  }

  // Onset bursts — multiple ripples from random positions
  if (onsetSpawning && energy > 0.15) {
    for (let i = 0; i < 6; i++) {
      const freq = audio.onsets[0] || 440;
      const { h, s, l } = freqToHue(freq, palette);
      const rx = cx + (Math.random() - 0.5) * width * 0.5;
      const ry = cy + (Math.random() - 0.5) * height * 0.5;
      ripples.push({
        x: rx, y: ry,
        radius: 3,
        maxRadius: maxDim * (0.3 + Math.random() * 0.5),
        life: 0,
        hue: h,
        saturation: s + 10,
        lightness: l + 25,
        lineWidth: 1.5 + Math.random() * 3,
      });
    }
  }

  // Render all ripples
  ctx.save();
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    // Life: 0→0.5 grows, 0.5→1.0 fades
    r.life += dt * 0.25;
    if (r.life >= 1.0) {
      ripples.splice(i, 1);
      continue;
    }

    const growPhase = Math.min(r.life * 2, 1);  // 0→1 during growth
    r.radius += dt * r.maxRadius * 0.3;

    // Alpha: peak at life=0.5
    const alphaMul = r.life < 0.5
      ? r.life * 2  // fade in
      : 2 - r.life * 2;  // fade out
    const alpha = alphaMul * 0.25;

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${r.hue}, ${r.saturation}%, ${r.lightness}%, ${alpha})`;
    ctx.lineWidth = r.lineWidth * (1 - r.life * 0.7);
    ctx.stroke();

    // Secondary ring for echo effect
    if (growPhase > 0.3) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue + 15}, ${r.saturation - 10}%, ${r.lightness + 10}%, ${alpha * 0.4})`;
      ctx.lineWidth = r.lineWidth * 0.5;
      ctx.stroke();
    }
  }

  // Central glow — "gravitational vacuum" at center, pulses with volume
  const glowSize = 60 + audio.volume * sens * 160 + Math.sin(phase * 2) * 20;
  const glowAlpha = 0.08 + audio.lowEnergy * sens * 0.15;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
  glow.addColorStop(0, `hsla(250, 30%, 30%, ${glowAlpha})`);
  glow.addColorStop(0.4, `hsla(240, 25%, 15%, ${glowAlpha * 0.6})`);
  glow.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Clean up if too many
  while (ripples.length > MAX_RIPPLES) ripples.shift();

  ctx.restore();
}

function findDominantFreq(audio: AudioData): number {
  if (audio.onsets.length > 0) return audio.onsets[0];
  let maxAmp = 0, maxIdx = 0;
  for (let i = 0; i < audio.frequencies.length; i++) {
    if (audio.frequencies[i] > maxAmp) {
      maxAmp = audio.frequencies[i];
      maxIdx = i;
    }
  }
  return (maxIdx * audio.sampleRate) / audio.fftSize;
}
