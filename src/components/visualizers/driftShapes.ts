// DriftShapes — persistent 3D-positioned geometric/organic shapes that drift and rotate.
// Grounded in:
// - "big yellow shape... orange line in the middle" (P1, Savickaite 2023)
// - "sideways eye shape in the middle" (P2)
// - "3D shapes moving up or down depending on pitch" (P4)
// - Chiou et al. (2013): synesthetes see geometric objects at SPECIFIC spatial locations
// - Ward et al. (2006): high pitch = higher in space, brighter
//
// ENRICHMENT: Timbre-responsive shapes. Low centroid (dark timbre) = rounder, fewer sides.
// High centroid (bright timbre) = more angular, sharper geometry.
// Automatically maps to the timbre accounts (Ellington: trumpet=dark blue, alto sax=light blue satin)

import type { AudioData, VisualParams } from './types';
import type { DriftShape } from './persistence';
import { freqToHue } from './persistence';

const MAX_SHAPES = 30;
const shapes: DriftShape[] = [];
let lastSpawnTime = 0;

export function renderDriftShapes(
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
  const centroidNorm = Math.min(audio.centroid / 4000, 1);
  const spreadNorm = audio.spreadNorm;
  const harmonicity = audio.harmonicity;     // Reuter 2025: harmonic→saturated
  const percussive = audio.percussive;        // Reuter 2025: percussive→rough, angular

  // Spawn based on sustained energy — more spawns from mid energy (body of sound)
  const spawnInterval = 0.12 / (vol + 0.04);
  lastSpawnTime += dt;

  // Also spawn from onsets
  const onsetSpawn = audio.onsets.length > 0 && vol > 0.06;

  if (lastSpawnTime > spawnInterval || onsetSpawn) {
    lastSpawnTime = 0;

    const freq = onsetSpawn ? audio.onsets[0] : findPeakFreq(audio);
    const { h, s, l } = freqToHue(freq, palette);
    const pitchNorm = Math.min(freq / 4000, 1);

    // Reuter 2025: harmonicity drives saturation. More harmonic (flute, violin)
    // → more saturated. More percussive (drums, plucks) → less saturated, lighter.
    // Lightness capped at 60 max to prevent bleaching under 'screen' blend.
    const harmonicSatBoost = harmonicity * 20;
    const percussiveLighten = percussive * 8;

    // Spatial mapping (Chiou 2013 + Ward 2006):
    // High pitch = higher in space (Ward 2006), bass = lower, grounded.
    // Wide horizontal spread across full canvas width.
    // Canvas Y=0 is TOP, so high pitch → low Y value.
    const px = cx + (pitchNorm - 0.5) * width * 0.7 + (Math.random() - 0.5) * width * 0.3;
    const py = cy + height * 0.25 - pitchNorm * height * 0.55 + (Math.random() - 0.5) * height * 0.1;

    // Timbre-responsive shape selection:
    // Low centroid (dark) → rounder (circle/oval, 0 sides)
    // Mid centroid → intermediate (triangle, diamond)
    // High centroid (bright) → angular (pentagon, hexagon, star)
    // High spread (noisy spectrum) → fewer sides (organic, simple)
    const angularity = centroidNorm * (1 - spreadNorm * 0.5); // 0=round, 1=angular
    const sides = angularity < 0.2 ? 0  // circle
      : angularity < 0.4 ? 3  // triangle
      : angularity < 0.6 ? 4  // diamond
      : angularity < 0.8 ? 5  // pentagon
      : 6 + Math.floor(Math.random() * 3); // hexagon+

    const size = (12 + Math.random() * 45) * (1 - pitchNorm * 0.5) + vol * 25;

    shapes.push({
      x: px, y: py,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5 + centroidNorm * 3,
      life: 0,
      maxLife: 2.5 + Math.random() * 5.0 + vol * 3,
      hue: h,
      saturation: Math.min(s + harmonicSatBoost, 95),
      lightness: Math.min(l + centroidNorm * 5 + percussiveLighten, 60),
      sides,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 1.5 + Math.random() * 3 + vol * 4,
    });
  }

  // Render — use 'screen' blend instead of 'lighter' to avoid white-out.
  // Screen: result = 1-(1-src)*(1-dst) — gentler additive, saturates without bleaching.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = shapes.length - 1; i >= 0; i--) {
    const sh = shapes[i];
    sh.life += dt;
    if (sh.life >= sh.maxLife) { shapes.splice(i, 1); continue; }

    // Parallax drift: bass shapes drift slowly (gravitational, grounded),
    // treble shapes dart around faster (airy, electric).
    // Compute pitchNorm from stored hue (which was mapped from freq→note→hue).
    // Low hues (red, ~0°) = bass, high hues (violet, ~270°) = treble.
    const storedPitchNorm = Math.min((sh.hue % 360) / 270, 1);
    const driftAmp = 40 + storedPitchNorm * 100; // px/sec
    sh.x += dt * Math.sin(sh.life * 1.2 + storedPitchNorm) * driftAmp * 0.6;
    sh.y += dt * Math.cos(sh.life * 0.9 + storedPitchNorm) * driftAmp * 0.4;
    sh.rotation += sh.rotSpeed * dt;
    sh.pulse += sh.pulseSpeed * dt;

    const lifeRatio = sh.life / sh.maxLife;
    const alpha = lifeRatio < 0.12
      ? lifeRatio / 0.12
      : lifeRatio > 0.65
        ? 1 - (lifeRatio - 0.65) / 0.35
        : 1;

    const pulseScale = 1 + Math.sin(sh.pulse) * 0.25;
    const currentSize = sh.size * pulseScale * (1 - lifeRatio * 0.25);

    // Outer glow (gentle)
    ctx.beginPath();
    drawShape(ctx, sh.x, sh.y, currentSize * 1.3, sh.sides, sh.rotation);
    ctx.strokeStyle = `hsla(${sh.hue}, ${sh.saturation}%, ${sh.lightness + 5}%, ${alpha * 0.10})`;
    ctx.lineWidth = currentSize * 0.25;
    ctx.stroke();

    // Main shape stroke — capped at lightness 65
    ctx.beginPath();
    drawShape(ctx, sh.x, sh.y, currentSize, sh.sides, sh.rotation);
    ctx.strokeStyle = `hsla(${sh.hue}, ${Math.min(sh.saturation + 5, 95)}%, ${Math.min(sh.lightness + 8, 65)}%, ${alpha * 0.35})`;
    ctx.lineWidth = 1.0 + alpha * 1.8;
    ctx.stroke();

    // Fill — very subtle, main purpose is to give the shape body
    ctx.fillStyle = `hsla(${sh.hue}, ${sh.saturation}%, ${sh.lightness}%, ${alpha * 0.05})`;
    ctx.fill();

    // Inner shape for angular ones (echo of the "orange line in the middle")
    if (sh.sides >= 4 && alpha > 0.3) {
      ctx.beginPath();
      drawShape(ctx, sh.x, sh.y, currentSize * 0.45, sh.sides, sh.rotation + Math.PI / sh.sides);
      ctx.strokeStyle = `hsla(${sh.hue + 15}, 55%, ${Math.min(sh.lightness + 12, 68)}%, ${alpha * 0.18})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  ctx.restore();
  while (shapes.length > MAX_SHAPES) shapes.shift();
}

function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number, rot: number): void {
  if (sides === 0) {
    // Slightly elliptical for organic feel
    ctx.ellipse(x, y, r, r * 0.85, rot, 0, Math.PI * 2);
  } else {
    for (let j = 0; j < sides; j++) {
      const a = rot + (j / sides) * Math.PI * 2 - Math.PI / 2;
      const sx = x + Math.cos(a) * r;
      const sy = y + Math.sin(a) * r;
      if (j === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
  }
}

function findPeakFreq(audio: AudioData): number {
  if (audio.onsets.length > 0) return audio.onsets[0];
  let maxAmp = 0, maxIdx = 0;
  for (let i = 0; i < audio.frequencies.length; i++) {
    if (audio.frequencies[i] > maxAmp) { maxAmp = audio.frequencies[i]; maxIdx = i; }
  }
  return maxAmp > 10 ? (maxIdx * audio.sampleRate) / audio.fftSize : 440;
}
