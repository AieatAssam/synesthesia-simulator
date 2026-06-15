// Persistent visual elements that evolve over many frames.
// Grounded in synesthete accounts from Savickaite et al. (2023) PMC10478570:
// "pulsating outwards", "gravitational vacuum", "floating away",
// "stars in eyes", "smoke/cloudiness", "electric bits", "3D shapes moving in space"

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;       // 0→1, grows then fades
  hue: number;
  saturation: number;
  lightness: number;
  lineWidth: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  hue: number;
  saturation: number;
  lightness: number;
}

export interface Stardust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
  sparkle: number;  // oscillating brightness factor
}

export interface DriftShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  hue: number;
  saturation: number;
  lightness: number;
  sides: number;     // 3=triangle, 4=diamond, 5=star, 0=circle
  pulse: number;     // 0→1 oscillation phase
  pulseSpeed: number;
}

// Shared color mapping from frequency
export function freqToHue(freq: number, palette: string = 'synesthete'): { h: number; s: number; l: number } {
  // Map frequency to note index (A4=440Hz as reference)
  const noteIndex = freq > 20 ? Math.round(12 * Math.log2(freq / 440)) + 57 : 0;
  const note = ((noteIndex % 12) + 12) % 12;

  switch (palette) {
    case 'warm':
      return { h: 0 + (note / 12) * 60, s: 70 + (note / 12) * 30, l: 50 + 15 * Math.sin(note * 0.5) };
    case 'cool':
      return { h: 180 + (note / 12) * 60, s: 50 + (note / 12) * 30, l: 45 + 15 * Math.sin(note * 0.5) };
    case 'neon':
      return { h: (note * 30) % 360, s: 100, l: 55 + 15 * Math.sin(note * 0.7) };
    case 'mono':
      return { h: 220, s: 20, l: 40 + (note / 12) * 40 };
    default: // synesthete — Itoh 2017 rainbow theory
      const hues = [0, 30, 60, 120, 180, 210, 240, 270, 280, 290, 300, 310];
      return { h: hues[note], s: 80 - note * 3, l: 45 + 10 * Math.sin(note * 0.5) };
  }
}
