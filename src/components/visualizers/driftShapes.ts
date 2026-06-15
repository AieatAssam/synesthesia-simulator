// DriftShapes — persistent 3D-positioned geometric/organic shapes that drift and rotate with music.
// Grounded in synesthete accounts from Savickaite et al. (2023):
// - "big yellow shape and then like a sort of orange line in the middle" (P1)
// - "sideways eye shape in the middle" (P2)
// - "the general like hard shape" (P2)
// - "3D shapes moving up or down depending on pitch" (P4, Experiment 1)
// - "I'm able to use like a 3D space rather than trying to draw something on a piece of paper" (P2)
// - Shapes were often the first thing described, before color or size (P2)
//
// Also: Kandinsky — sound translated into abstract forms (lines, circles, colored shapes in motion)

import type { AudioData, VisualParams } from './types';
import type { DriftShape } from './persistence';
import { freqToHue } from './persistence';

const MAX_SHAPES = 25;
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

  // Spawn shapes on sustained notes — not just onsets
  const volume = audio.volume * sens;
  const spawnInterval = 0.15 / (volume + 0.05); // faster spawn at higher volume
  lastSpawnTime += dt;

  if (lastSpawnTime > spawnInterval && volume > 0.03) {
    lastSpawnTime = 0;

    const freq = findPeakFreq(audio);
    const { h, s, l } = freqToHue(freq, palette);

    // Position: pitch maps to vertical position (higher pitch = higher on screen)
    // following Ward et al. (2006): high pitch = higher in space
    const pitchNorm = Math.min(freq / 3000, 1);
    const px = cx + (Math.random() - 0.5) * width * 0.7;
    const py = cy - height * 0.3 + pitchNorm * height * 0.6;

    // Higher pitches = smaller, sharper shapes
    const size = (10 + Math.random() * 50) * (1 - pitchNorm * 0.6) + volume * 30;
    const sides = Math.random() < 0.3 ? 0 // circle
      : Math.random() < 0.4 ? 3 // triangle
      : Math.random() < 0.5 ? 4 // diamond
      : Math.random() < 0.5 ? 5 // star/pentagon
      : 6; // hexagon

    shapes.push({
      x: px, y: py,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2 + volume * 3,
      life: 0,
      maxLife: 2.0 + Math.random() * 5.0 + volume * 4,
      hue: h,
      saturation: s,
      lightness: l + 10,
      sides,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 1.5 + Math.random() * 3 + volume * 5,
    });
  }

  // Update and render
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = shapes.length - 1; i >= 0; i--) {
    const sh = shapes[i];
    sh.life += dt;
    if (sh.life >= sh.maxLife) {
      shapes.splice(i, 1);
      continue;
    }

    // Slow drift + gentle oscillation
    sh.y += dt * (5 + Math.sin(sh.life * 0.7) * 8);
    sh.x += dt * Math.cos(sh.life * 0.5) * 6;
    sh.rotation += sh.rotSpeed * dt;
    sh.pulse += sh.pulseSpeed * dt;

    const lifeRatio = sh.life / sh.maxLife;
    const alpha = lifeRatio < 0.15
      ? lifeRatio / 0.15  // fade in
      : lifeRatio > 0.7
        ? 1 - (lifeRatio - 0.7) / 0.3  // fade out
        : 1;  // hold

    // Pulse size
    const pulseScale = 1 + Math.sin(sh.pulse) * 0.2;
    const currentSize = sh.size * pulseScale * (1 - lifeRatio * 0.3);

    // Draw shape
    ctx.beginPath();
    if (sh.sides === 0) {
      ctx.arc(sh.x, sh.y, currentSize, 0, Math.PI * 2);
    } else {
      for (let j = 0; j < sh.sides; j++) {
        const a = sh.rotation + (j / sh.sides) * Math.PI * 2 - Math.PI / 2;
        const r = currentSize;
        const sx = sh.x + Math.cos(a) * r;
        const sy = sh.y + Math.sin(a) * r;
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
    }

    // Stroke with glow
    ctx.strokeStyle = `hsla(${sh.hue}, ${sh.saturation}%, ${sh.lightness + 20}%, ${alpha * 0.6})`;
    ctx.lineWidth = 1.5 + alpha * 2;
    ctx.stroke();

    // Fill with soft transparency
    ctx.fillStyle = `hsla(${sh.hue}, ${sh.saturation}%, ${sh.lightness}%, ${alpha * 0.12})`;
    ctx.fill();

    // Inner glow for smaller concentric shape
    if (sh.sides >= 4) {
      ctx.beginPath();
      if (sh.sides === 0) {
        ctx.arc(sh.x, sh.y, currentSize * 0.5, 0, Math.PI * 2);
      } else {
        for (let j = 0; j < sh.sides; j++) {
          const a = sh.rotation + (j / sh.sides) * Math.PI * 2 - Math.PI / 2;
          const sx = sh.x + Math.cos(a) * currentSize * 0.5;
          const sy = sh.y + Math.sin(a) * currentSize * 0.5;
          if (j === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.strokeStyle = `hsla(${sh.hue + 10}, ${sh.saturation}, ${sh.lightness + 30}%, ${alpha * 0.3})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  ctx.restore();

  while (shapes.length > MAX_SHAPES) shapes.shift();
}

function findPeakFreq(audio: AudioData): number {
  if (audio.onsets.length > 0) return audio.onsets[0];
  let maxAmp = 0, maxIdx = 0;
  for (let i = 0; i < audio.frequencies.length; i++) {
    if (audio.frequencies[i] > maxAmp) {
      maxAmp = audio.frequencies[i];
      maxIdx = i;
    }
  }
  return maxAmp > 10 ? (maxIdx * audio.sampleRate) / audio.fftSize : 440;
}
