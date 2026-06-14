import type { AudioData, VisualParams, Particle } from './types';
import { frequencyToColor, hslaToStyle } from './colorMapping';

const particles: Particle[] = [];
const MAX_PARTICLES = 300;

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number
): void {
  if (params.mode === 'aurora' || params.mode === 'oscilloscope') {
    particles.length = 0;
    return;
  }

  const { width, height, sensitivity } = params;
  const cx = width / 2;
  const cy = height * 0.45;

  // Spawn particles on onsets (Cytowic "fireworks")
  for (const onsetFreq of audio.onsets) {
    const count = Math.floor(8 + audio.volume * 35 * sensitivity);
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 200 * audio.volume;
      const color = frequencyToColor(onsetFreq, 255, params.palette);

      particles.push({
        x: cx + (Math.random() - 0.5) * width * 0.3,
        y: cy + (Math.random() - 0.5) * height * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0,
        maxLife: 1.2 + Math.random() * 2.5 * (1 + audio.volume),
        size: 1.5 + Math.random() * 4 * audio.volume,
        hue: color.h,
        saturation: color.s,
        lightness: color.l,
        alpha: 1,
      });
    }
  }

  // Update and render
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    // Physics
    p.vy += 30 * dt;  // gravity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.995;    // air friction
    p.vy *= 0.995;

    // Lifecycle: fade in, then fade out
    const progress = p.life / p.maxLife;
    const fadeIn = Math.min(progress * 4, 1);
    const fadeOut = 1 - Math.max(0, (progress - 0.5) * 2);
    const alpha = fadeIn * fadeOut * p.alpha;

    // Glow
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    glow.addColorStop(0, hslaToStyle({ h: p.hue, s: p.saturation, l: Math.min(p.lightness + 30, 95), a: alpha * 0.9 }));
    glow.addColorStop(0.4, hslaToStyle({ h: p.hue, s: p.saturation, l: p.lightness, a: alpha * 0.4 }));
    glow.addColorStop(1, 'transparent');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
