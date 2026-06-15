// LightFilament — ethereal, flowing light strands that trace through the visual field.
// Grounded in synesthete accounts:
// - "The song appears as light filament once I've cracked it... architecture of color-and-light" (Tori Amos, 2005)
// - "lines moving in color, often metallic with height, width, and, most importantly, depth" (Deni Simon)
// - "scintillation" — flicker/sparkle quality that changes with sound texture (Cytowic)
// - "everyday sounds elicited animated, directional movement" (Savickaite 2023, P1, P3)
//
// DESIGN: Hypersensitive flowing threads. Each filament is a smooth curve whose
// control points drift with audio energy. High-pitched = thinner, brighter filaments.
// Low-pitched = thicker, darker. The filaments create a sense of 3D depth via multiple
// parallax layers moving at different speeds.

import type { AudioData, VisualParams } from './types';
import { freqToHue } from './persistence';

// Multiple filament strands at different depths
interface FilamentStrand {
  points: { x: number; y: number }[];
  hue: number;
  saturation: number;
  lightness: number;
  speed: number;       // parallax depth: lower = deeper, higher = closer
  phase: number;
  thickness: number;
  lifePhase: number;   // 0→2π continuous oscillation
}

const MAX_STRANDS = 12;
const strands: FilamentStrand[] = [];

export function renderLightFilaments(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  const { width, height, sensitivity, palette } = params;
  const cx = width / 2;
  const cy = height / 2;
  const sens = Math.max(0.3, sensitivity);
  const vol = audio.volume * sens;

  // Spawn new strands on onsets or sustained loud sections
  if ((audio.onsets.length > 0 && vol > 0.06) || (vol > 0.25 && strands.length < 2)) {
    const freq = audio.onsets[0] || findPeak(audio);
    const { h, s, l } = freqToHue(freq, palette);
    const pitchNorm = Math.min(freq / 4000, 1);

    // Create a strand with control points along a curved path
    const numPoints = 8 + Math.floor(Math.random() * 12);
    const points: { x: number; y: number }[] = [];

    // Strand starts at a random edge/screen position
    const startAngle = Math.random() * Math.PI * 2;
    const startDist = Math.min(width, height) * 0.3;

    // Strand flows through the center and out the other side
    const endAngle = startAngle + Math.PI + (Math.random() - 0.5) * 1.5;
    const endDist = startDist * (0.8 + Math.random() * 0.4);

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const a = startAngle + t * (endAngle - startAngle);
      const d = startDist + t * (endDist - startDist) * 0.6;
      const x = cx + Math.cos(a) * d + (Math.random() - 0.5) * width * 0.15;
      const y = cy + Math.sin(a) * d + (Math.random() - 0.5) * height * 0.15;
      points.push({ x, y });
    }

    strands.push({
      points,
      hue: h,
      saturation: s,
      lightness: Math.min(l + 5, 58),
      speed: 0.3 + pitchNorm * 0.5,  // deeper (slower) for bass, closer for treble
      phase: Math.random() * Math.PI * 2,
      thickness: 1.5 + (1 - pitchNorm) * 3,
      lifePhase: 0,
    });
  }

  // Update and render — use 'screen' blend to avoid white-out
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = strands.length - 1; i >= 0; i--) {
    const s = strands[i];
    s.lifePhase += dt * 0.8;
    if (s.lifePhase > Math.PI * 2.5) {
      strands.splice(i, 1);
      continue;
    }

    // Life: fade in, hold, fade out
    const lifeRatio = s.lifePhase / (Math.PI * 2.5);
    const alpha = lifeRatio < 0.2
      ? lifeRatio / 0.2
      : lifeRatio > 0.7
        ? 1 - (lifeRatio - 0.7) / 0.3
        : 1;

    // Animate control points — drift + oscillate
    for (const pt of s.points) {
      pt.x += Math.sin(s.lifePhase * s.speed + pt.y * 0.002) * dt * 20;
      pt.y += Math.cos(s.lifePhase * s.speed + pt.x * 0.002) * dt * 15;
    }

    // Draw the filament as a smooth curve
    if (s.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);

    for (let j = 1; j < s.points.length - 1; j++) {
      const xc = (s.points[j].x + s.points[j + 1].x) / 2;
      const yc = (s.points[j].y + s.points[j + 1].y) / 2;
      ctx.quadraticCurveTo(s.points[j].x, s.points[j].y, xc, yc);
    }
    // Last point
    const last = s.points[s.points.length - 1];
    ctx.lineTo(last.x, last.y);

    // Outer glow (wide, very faint)
    ctx.strokeStyle = `hsla(${s.hue}, ${s.saturation}%, ${s.lightness}%, ${alpha * 0.06})`;
    ctx.lineWidth = s.thickness * 3.5;
    ctx.stroke();

    // Mid glow
    ctx.strokeStyle = `hsla(${s.hue}, ${Math.min(s.saturation + 8, 95)}%, ${Math.min(s.lightness + 5, 62)}%, ${alpha * 0.14})`;
    ctx.lineWidth = s.thickness * 1.8;
    ctx.stroke();

    // Core (bright, thin) — capped at lightness 65
    ctx.strokeStyle = `hsla(${s.hue}, 75%, ${Math.min(s.lightness + 10, 65)}%, ${alpha * 0.28})`;
    ctx.lineWidth = s.thickness * 0.7;
    ctx.stroke();
  }

  // Subtle scintillation dots along active filaments — dimmed
  if (vol > 0.1 && strands.length > 0) {
    for (const s of strands) {
      const lifeRatio = s.lifePhase / (Math.PI * 2.5);
      if (lifeRatio < 0.1 || lifeRatio > 0.9) continue;

      const dotCount = Math.floor(2 + vol * 8);
      for (let d = 0; d < dotCount; d++) {
        const t = Math.random();
        const idx = Math.floor(t * (s.points.length - 1));
        const frac = t * (s.points.length - 1) - idx;
        const p0 = s.points[idx];
        const p1 = s.points[Math.min(idx + 1, s.points.length - 1)];
        const dx = p0.x + (p1.x - p0.x) * frac;
        const dy = p0.y + (p1.y - p0.y) * frac;

        const dotAlpha = 0.2 + Math.random() * 0.3;
        const dotSize = 0.8 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 90%, ${Math.min(s.lightness + 15, 68)}%, ${dotAlpha})`;
        ctx.fill();
      }
    }
  }

  ctx.restore();

  while (strands.length > MAX_STRANDS) strands.shift();
}

function findPeak(audio: AudioData): number {
  let maxAmp = 0, maxIdx = 0;
  for (let i = 0; i < audio.frequencies.length; i++) {
    if (audio.frequencies[i] > maxAmp) { maxAmp = audio.frequencies[i]; maxIdx = i; }
  }
  return (maxIdx * audio.sampleRate) / audio.fftSize;
}
