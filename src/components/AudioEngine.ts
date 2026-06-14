import type { AudioData } from './visualizers/types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private energyHistory: number[] = [];
  private running = false;
  private sensitivity = 1.0;

  async start(): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.55;
    this.analyser.minDecibels = -85;
    this.analyser.maxDecibels = -10;
    this.source.connect(this.analyser);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source?.disconnect();
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.energyHistory = [];
  }

  setSensitivity(v: number): void {
    this.sensitivity = v;
  }

  getSnapshot(): AudioData | null {
    if (!this.running || !this.analyser || !this.freqData || !this.timeData) return null;

    const freqBuf = new Uint8Array(this.freqData!.buffer as ArrayBuffer);
    const timeBuf = new Uint8Array(this.timeData!.buffer as ArrayBuffer);
    this.analyser.getByteFrequencyData(freqBuf);
    this.analyser.getByteTimeDomainData(timeBuf);

    const fftSize = this.analyser.fftSize;
    const sampleRate = this.ctx!.sampleRate;
    const bins = freqBuf.length;

    // Volume (RMS)
    let sumSq = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      const v = (timeBuf[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / timeBuf.length);
    const volume = Math.min(rms * 3, 1);

    // Spectral centroid (timbre indicator)
    let weightedSum = 0;
    let totalAmp = 0;
    for (let i = 0; i < bins; i++) {
      const freq = (i * sampleRate) / fftSize;
      weightedSum += freq * freqBuf[i];
      totalAmp += freqBuf[i];
    }
    const centroid = totalAmp > 0 ? weightedSum / totalAmp : 0;

    // Low-frequency energy (for background layer)
    const lowBins = Math.floor(bins * 0.08);
    let lowSum = 0;
    for (let i = 0; i < lowBins; i++) lowSum += freqBuf[i];
    const lowEnergy = Math.min(lowSum / (lowBins * 255) * 2, 1);

    // Spectral flatness
    let geoSum = 0;
    let ariSum = 0;
    let activeBins = 0;
    for (let i = 0; i < bins; i++) {
      if (freqBuf[i] > 1) {
        geoSum += Math.log(Math.max(freqBuf[i], 1));
        ariSum += freqBuf[i];
        activeBins++;
      }
    }
    const flatness = activeBins > 2
      ? Math.exp(geoSum / activeBins) / (ariSum / activeBins)
      : 0;

    // Onset detection
    const energy = rms;
    this.energyHistory.push(energy);
    if (this.energyHistory.length > 30) this.energyHistory.shift();
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const threshold = 0.15 / this.sensitivity;
    const onsetDelta = energy - avgEnergy;

    const onsets: number[] = [];
    if (onsetDelta > threshold && this.energyHistory.length > 10) {
      let maxBin = 0;
      let maxAmp = 0;
      for (let i = 0; i < bins; i++) {
        if (freqBuf[i] > maxAmp) {
          maxAmp = freqBuf[i];
          maxBin = i;
        }
      }
      const onsetFreq = (maxBin * sampleRate) / fftSize;
      onsets.push(onsetFreq);
    }

    return {
      frequencies: freqBuf,
      waveform: timeBuf,
      volume,
      centroid,
      onsets,
      lowEnergy,
      flatness,
      fftSize,
      sampleRate,
    };
  }

  isRunning(): boolean {
    return this.running;
  }
}

// Singleton
export const audioEngine = new AudioEngine();
