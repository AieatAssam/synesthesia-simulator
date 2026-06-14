import type { AudioData, VisualParams } from './types';
import { frequencyToColor } from './colorMapping';

let rotation = 0;

export function renderKaleidoscope(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  // Fades in during high spectral flatness — many frequencies active = rich chords
  // Per Tori Amos: "the best kaleidoscope ever"
  const { width, height, sensitivity } = params;
  const { flatness, waveform, centroid, volume } = audio;

  if (flatness < 0.35) return; // not enough harmonic complexity

  const targetAlpha = Math.min((flatness - 0.35) / 0.4 * 0.22, 0.22) * sensitivity;
  if (targetAlpha < 0.02) return;

  rotation += dt * (0.8 + volume * 3);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.4;
  const folds = 8; // radial symmetry

  const freq = centroid > 0 ? centroid : 800;
  const color = frequencyToColor(freq, 180, params.palette);

  ctx.save();
  ctx.globalAlpha = targetAlpha;
  ctx.globalCompositeOperation = 'lighter';

  // Draw mirrored waveform segments
  const step = Math.max(1, Math.floor(waveform.length / 60));

  for (let fold = 0; fold < folds; fold++) {
    const foldAngle = (fold / folds) * Math.PI * 2 + rotation;

    ctx.beginPath();

    for (let i = 0; i < waveform.length - step; i += step) {
      const val = (waveform[i] / 255 - 0.5) * 2; // -1 to 1
      const baseR = maxR * (0.3 + val * 0.7);
      const angle = foldAngle + (i / waveform.length) * Math.PI * 0.5;
      const r = baseR * (0.5 + Math.sin(i * 0.1 + rotation) * 0.15);

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `hsla(${color.h + fold * 15}, ${color.s}%, ${color.l}%, 0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}
