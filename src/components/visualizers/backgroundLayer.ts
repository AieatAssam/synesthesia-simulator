import type { AudioData, VisualParams } from './types';

let angle = 0;
let phase = 0;

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  if (params.mode === 'oscilloscope') return; // skip bg in osc-only mode

  const { width, height } = params;
  const cx = width / 2;
  const cy = height / 2;

  // Klüver form constants: tunnels, spirals, honeycombs
  // Tunnels: concentric circles with radial gradient
  // Driven by low-frequency energy and slow volume envelope

  const energy = audio.lowEnergy;       // 0–1 normalized
  const vol = audio.volume;
  const sens = params.sensitivity;

  // Apply sensitivity to amplify visual response
  const se = Math.min(energy * sens * 1.5, 1);
  const sv = Math.min(vol * sens * 1.5, 1);

  angle += dt * (0.3 + se * 2.0);
  phase += dt * (0.5 + sv * 3.0);

  ctx.save();
  ctx.globalAlpha = 0.04 + se * 0.28;
  ctx.globalCompositeOperation = 'lighter';

  // Tunnel (concentric circles) — radial pulse driven by volume
  const rings = 5;
  const baseRadius = Math.min(width, height) * 0.2 + sv * 120;
  for (let i = rings; i >= 0; i--) {
    const r = baseRadius + i * (40 + se * 60) + Math.sin(phase * 0.7 + i) * 20;
    const hue = 220 + i * 25 + se * 40;
    const alpha = 0.04 + (1 - i / rings) * 0.10;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 40%, ${25 + i * 6}%, ${alpha})`;
    ctx.lineWidth = 1.5 + i * 0.4;
    ctx.stroke();
  }

  // Spiral overlay
  ctx.beginPath();
  const spiralArms = 3;
  for (let arm = 0; arm < spiralArms; arm++) {
    const armAngle = (arm / spiralArms) * Math.PI * 2 + angle * 0.3;
    for (let t = 0; t < Math.PI * 4; t += 0.05) {
      const r = t * (14 + se * 20);
      const a = armAngle + t * 0.8;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.6;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = `hsla(260, 35%, 20%, 0.10)`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Honeycomb hint (subtle hexagonal grid) — pulses with volume
  const hexSize = 24 + sv * 22;
  const hexW = hexSize * 1.5;
  const hexH = hexSize * Math.sqrt(3);
  const hexAlpha = 0.03 + sv * 0.07;
  for (let row = -2; row < Math.ceil(height / hexH) + 2; row++) {
    for (let col = -2; col < Math.ceil(width / hexW) + 2; col++) {
      const x = col * hexW + (row % 2) * hexW / 2 + Math.sin(phase + col * 0.3) * 6;
      const y = row * hexH * 0.75 + Math.cos(phase + row * 0.25) * 5;
      drawHex(ctx, x, y, hexSize * 0.5);
    }
  }
  ctx.strokeStyle = `hsla(230, 25%, 18%, ${hexAlpha})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.restore();
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
