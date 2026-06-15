// RippleField — persistent concentric ripples emanating from audio energy.
// Grounded in synesthete accounts:
// - "pulsating outwards as if it's churning round" (P1, Savickaite 2023)
// - "gravitational vacuum — slower in the middle, moves a lot more on the outside" (P1)
// - Klüver form constants: tunnels, spirals, concentric patterns
// - spatial positioning: Chiou et al. (2013) — synesthetes see geometric objects at specific locations
//   High pitch = higher in space (Ward et al. 2006), bass = lower
//
// ENRICHMENT: timbre-responsive rendering via spectral centroid and spread.
// Bright timbre (high centroid) = sharper, faster ripples. Dark timbre = softer, slower.
// Mid energy adds body, high energy adds texture to ring edges.

import type { AudioData, VisualParams } from './types';
import type { Ripple } from './persistence';
import { freqToHue } from './persistence';

const MAX_RIPPLES = 50;
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

  // Timbre influences animation speed — brighter timbre = faster
  const centroidNorm = Math.min(audio.centroid / 4000, 1);
  const timbreSpeed = 0.5 + centroidNorm * 1.5;
  phase += dt * timbreSpeed;

  const vol = audio.volume * sens;
  const lowE = audio.lowEnergy * sens;
  const midE = audio.midEnergy * sens;
  const highE = audio.highEnergy * sens;

  // Ambient ripples from low-frequency energy — "gravitational" bass ripples
  const bassRate = Math.floor(lowE * 10);
  for (let i = 0; i < bassRate; i++) {
    const freq = 40 + Math.random() * 120; // low bass
    const { h, s, l } = freqToHue(freq, palette);
    // Spatial: bass ripples originate lower on screen
    const ry = cy + height * 0.25 + Math.random() * height * 0.2;
    ripples.push({
      x: cx + (Math.random() - 0.5) * width * 0.35,
      y: ry,
      radius: 3,
      maxRadius: maxDim * 0.5 + Math.random() * maxDim * 0.4,
      life: 0,
      hue: h,
      saturation: s,
      lightness: l + 10,
      lineWidth: 1.5 + Math.random() * 3,
    });
  }

  // Mid-range ripples — "body" of the sound
  const midRate = Math.floor(midE * 8);
  for (let i = 0; i < midRate; i++) {
    const freq = 300 + Math.random() * 1500;
    const { h, s, l } = freqToHue(freq, palette);
    const ry = cy - height * 0.05 + Math.random() * height * 0.25;
    ripples.push({
      x: cx + (Math.random() - 0.5) * width * 0.4,
      y: ry,
      radius: 4,
      maxRadius: maxDim * 0.35 + Math.random() * maxDim * 0.3,
      life: 0,
      hue: h,
      saturation: s,
      lightness: l + 20,
      lineWidth: 1 + Math.random() * 2,
    });
  }

  // High-frequency ripples — "air/sparkle", positioned higher on screen
  const highRate = Math.floor(highE * 6);
  for (let i = 0; i < highRate; i++) {
    const freq = 2000 + Math.random() * 6000;
    const { h, s, l } = freqToHue(freq, palette);
    const ry = cy - height * 0.3 - Math.random() * height * 0.15;
    ripples.push({
      x: cx + (Math.random() - 0.5) * width * 0.3,
      y: Math.max(10, ry),
      radius: 2,
      maxRadius: maxDim * (0.15 + Math.random() * 0.2),
      life: 0,
      hue: h,
      saturation: s + 5,
      lightness: l + 30,
      lineWidth: 0.5 + Math.random() * 1.2,
    });
  }

  // Onset bursts — concentrated ripples at the source frequency's spatial location
  if (audio.onsets.length > 0 && vol > 0.08) {
    const freq = audio.onsets[0] || 440;
    const { h, s, l } = freqToHue(freq, palette);
    const pitchNorm = Math.min(freq / 4000, 1);
    const targetY = cy + height * 0.35 - pitchNorm * height * 0.7;
    const burstCount = Math.floor(5 + vol * 15);

    for (let i = 0; i < burstCount; i++) {
      ripples.push({
        x: cx + (Math.random() - 0.5) * width * 0.4,
        y: targetY + (Math.random() - 0.5) * 60,
        radius: 2,
        maxRadius: maxDim * (0.25 + Math.random() * 0.45),
        life: 0,
        hue: h,
        saturation: s + 15,
        lightness: l + 30,
        lineWidth: 1.5 + Math.random() * 3,
      });
    }
  }

  // Render
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.life += dt * 0.28;
    if (r.life >= 1.0) { ripples.splice(i, 1); continue; }

    r.radius += dt * r.maxRadius * 0.25 * (1 + centroidNorm * 0.5);

    const alphaMul = r.life < 0.5 ? r.life * 2 : 2 - r.life * 2;
    // Timbre affects alpha: brighter sounds = slightly more defined rings
    const alpha = alphaMul * (0.18 + centroidNorm * 0.10);
    const lw = r.lineWidth * (1 - r.life * 0.6);

    // Main ring
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${r.hue}, ${r.saturation}%, ${r.lightness}%, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Echo ring (gap)
    const echoR = r.radius * 0.65;
    if (echoR > 3) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, echoR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue + 20}, ${r.saturation - 15}%, ${r.lightness + 10}%, ${alpha * 0.35})`;
      ctx.lineWidth = lw * 0.4;
      ctx.stroke();
    }

    // High-freq rings get a textured edge (spreadNorm indicates noisier spectrum)
    if (audio.spreadNorm > 0.4 && r.life < 0.6) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue + 30}, 50%, ${r.lightness + 15}%, ${alpha * 0.2 * audio.spreadNorm})`;
      ctx.setLineDash([2, 4 + r.life * 6]);
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Central gravitational glow — pulses with bass, colored by centroid
  const glowHue = 230 + centroidNorm * 40;
  const glowSize = 50 + lowE * 180 + Math.sin(phase * 1.5) * 25;
  const glowAlpha = 0.06 + lowE * 0.12 + midE * 0.04;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
  glow.addColorStop(0, `hsla(${glowHue}, 25%, 28%, ${glowAlpha})`);
  glow.addColorStop(0.35, `hsla(${glowHue - 10}, 20%, 12%, ${glowAlpha * 0.5})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
  while (ripples.length > MAX_RIPPLES) ripples.shift();
}
