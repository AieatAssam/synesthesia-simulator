const LOG_MIN = Math.log2(20);
const LOG_RANGE = Math.log2(20000) - LOG_MIN;

export function frequencyToHue(freq: number): number {
  const logF = Math.log2(Math.max(freq, 20));
  return ((logF - LOG_MIN) / LOG_RANGE) * 270; // 0°=red → 270°=violet
}

export function frequencyToLightness(freq: number): number {
  const logF = Math.log2(Math.max(freq, 20));
  return 35 + ((logF - LOG_MIN) / LOG_RANGE) * 45; // 35–80
}

export function frequencyToSaturation(freq: number): number {
  const logF = Math.log2(Math.max(freq, 20));
  return 95 - ((logF - LOG_MIN) / LOG_RANGE) * 40; // 95–55
}

export function binToFrequency(bin: number, sampleRate: number, fftSize: number): number {
  return (bin * sampleRate) / fftSize;
}

import type { PaletteName } from './types';

interface HSLA { h: number; s: number; l: number; a: number }

export function frequencyToColor(
  freq: number, amplitude: number, palette: PaletteName = 'synesthete'
): HSLA {
  let h = frequencyToHue(freq);
  let s = frequencyToSaturation(freq);
  const l = frequencyToLightness(freq);
  const a = Math.min(amplitude / 255 * 1.3, 1.0);

  switch (palette) {
    case 'warm':
      h = h * 0.22;            // compress to 0–60° (reds through golds)
      s = Math.min(s + 15, 100);
      break;
    case 'cool':
      h = 180 + h * 0.33;      // compress to 180–270° (cyans through violets)
      s = Math.min(s + 10, 100);
      break;
    case 'neon':
      s = 100;                  // max saturation
      break;
    case 'monochrome':
      h = 210;                  // fixed blue
      s = 30;
      break;
    case 'synesthete':
    default:
      break;                    // research-backed defaults
  }

  return { h, s, l, a };
}

export function hslaToStyle({ h, s, l, a }: HSLA): string {
  return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a.toFixed(2)})`;
}
