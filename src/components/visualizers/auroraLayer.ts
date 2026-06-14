import type { AudioData, VisualParams } from './types';
import { binToFrequency, frequencyToColor, hslaToStyle } from './colorMapping';

let flowOffset = 0;

export function renderAurora(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  if (params.mode === 'particles' || params.mode === 'oscilloscope') return;

  const { width, height } = params;
  const { frequencies, sampleRate, fftSize, volume, centroid } = audio;
  const bins = frequencies.length;

  flowOffset += dt * (40 + volume * 80);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const bandY = height * 0.45 + Math.sin(flowOffset * 0.003) * height * 0.05;
  const bandHeight = height * 0.25 + volume * height * 0.1;

  // Draw the aurora band as a series of vertical gradient columns
  for (let i = 0; i < bins; i++) {
    const amp = frequencies[i];
    if (amp < 3) continue; // skip silent bins

    const x = (i / bins) * width;
    const freq = binToFrequency(i, sampleRate, fftSize);
    const color = frequencyToColor(freq, amp, params.palette);

    // Column height scales with amplitude
    const colH = (amp / 255) * bandHeight;
    const y = bandY - colH / 2;

    // Draw as a soft vertical glow line
    const grad = ctx.createLinearGradient(x, y, x, y + colH);
    const mid = hslaToStyle({ ...color, a: color.a * 0.6 });
    const edge = hslaToStyle({ ...color, a: 0 });

    grad.addColorStop(0, edge);
    grad.addColorStop(0.3, mid);
    grad.addColorStop(0.5, hslaToStyle({ ...color, a: color.a * 0.8 }));
    grad.addColorStop(0.7, mid);
    grad.addColorStop(1, edge);

    ctx.fillStyle = grad;
    ctx.fillRect(x - 1, y, 3, colH);
  }

  // Slight horizontal glow connecting the band
  const glowGrad = ctx.createLinearGradient(0, bandY - bandHeight * 0.1, 0, bandY + bandHeight * 0.1);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.5, `hsla(${220 + centroid * 0.01}, 30%, 50%, 0.04)`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, bandY - bandHeight * 0.1, width, bandHeight * 0.2);

  ctx.restore();
}
