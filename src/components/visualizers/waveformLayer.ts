import type { AudioData, VisualParams } from './types';
import { frequencyToColor } from './colorMapping';

export function renderWaveform(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  _dt: number
): void {
  if (params.mode === 'aurora' || params.mode === 'particles') return;

  const { width, height } = params;
  const { waveform, centroid } = audio;

  // Convert waveform to smoothed points
  const points: { x: number; y: number }[] = [];
  const step = Math.max(1, Math.floor(waveform.length / width));
  const cy = height * 0.5;
  const amp = height * 0.35;

  // Smoothing buffer
  const smoothWindow = 3;
  for (let i = 0; i < waveform.length - step; i += step) {
    let sum = 0;
    for (let j = 0; j < smoothWindow && i + j < waveform.length; j++) {
      sum += waveform[i + j];
    }
    const avg = sum / smoothWindow;
    const x = (i / waveform.length) * width;
    const y = cy + ((avg / 255) - 0.5) * amp * 2;
    points.push({ x, y });
  }

  if (points.length < 2) return;

  // Color based on spectral centroid (timbre indicator)
  const freq = centroid > 0 ? centroid : 1000;
  const baseColor = frequencyToColor(freq, 200, params.palette);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Multiple offset passes for depth (Deni Simon: "lines with height, width, depth")
  for (let pass = 2; pass >= 0; pass--) {
    const offset = pass * 3;
    const alpha = 0.15 + pass * 0.1;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y + offset);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2 + offset;
      ctx.quadraticCurveTo(points[i].x, points[i].y + offset, xc, yc);
    }

    // Metallic gradient stroke (light edge + darker core)
    if (pass === 0) {
      // Core line — thinner, brighter
      ctx.strokeStyle = `hsla(${baseColor.h}, ${baseColor.s}%, ${Math.min(baseColor.l + 20, 95)}%, ${alpha + 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (pass === 1) {
      // Mid layer
      ctx.strokeStyle = `hsla(${baseColor.h}, ${baseColor.s - 10}%, ${baseColor.l}%, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Outer glow
      ctx.shadowColor = `hsla(${baseColor.h}, 80%, 50%, 0.15)`;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = `hsla(${baseColor.h}, 60%, ${baseColor.l - 20}%, ${alpha - 0.05})`;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}
