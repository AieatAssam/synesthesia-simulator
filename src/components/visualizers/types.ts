export interface AudioData {
  frequencies: Uint8Array;
  waveform: Uint8Array;
  volume: number;
  centroid: number;
  onsets: number[];
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  flatness: number;
  spreadNorm: number;
  harmonicity: number;   // Reuter 2025: harmonic-to-total energy ratio
  percussive: number;     // Reuter 2025: high-frequency transient energy
  fftSize: number;
  sampleRate: number;
}

export interface VisualParams {
  mode: 'full' | 'ripples' | 'shapes' | 'smoke' | 'stardust' | 'filaments';
  sensitivity: number;     // 0–1, onset detection threshold
  palette: PaletteName;
  width: number;
  height: number;
}

export type PaletteName = 'synesthete' | 'warm' | 'cool' | 'neon' | 'monochrome';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
}
