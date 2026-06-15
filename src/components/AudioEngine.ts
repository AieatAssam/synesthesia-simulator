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

  // Synthetic test oscillator
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private testMode = false;
  private testFreq = 440;
  private testInterval: ReturnType<typeof setInterval> | null = null;

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
    this.analyser.minDecibels = -60;
    this.analyser.maxDecibels = -10;
    this.source.connect(this.analyser);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.running = true;
  }

  stop(): void {
    this.stopTest();
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

  /** Start synthetic test oscillator — no mic needed.
   *  frequency: sweep across a range for richer testing (default 80→4000Hz sweep) */
  async startTest(frequency?: number): Promise<void> {
    if (this.running) return;
    this.testMode = true;
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.55;
    this.analyser.minDecibels = -60;
    this.analyser.maxDecibels = -10;

    // Main oscillator
    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = 'sawtooth'; // rich harmonics = more interesting visuals
    this.oscNode.frequency.value = frequency ?? 220;

    // LFO for frequency modulation — creates sweeping, musical variation
    this.lfoNode = this.ctx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.value = 0.15;
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = 200; // ±200Hz modulation
    this.lfoNode.connect(this.lfoGain);
    this.lfoGain.connect(this.oscNode.frequency);

    // Master gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.5;

    this.oscNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    // Don't connect to destination — silent visual test
    this.oscNode.start();
    this.lfoNode.start();

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.running = true;

    // If no specific frequency given, sweep through range for rich testing
    if (frequency === undefined) {
      this.testFreq = 80;
      this.testInterval = setInterval(() => {
        if (!this.oscNode) return;
        this.testFreq = this.testFreq >= 3800 ? 80 : this.testFreq + 50;
        this.oscNode.frequency.cancelScheduledValues(this.ctx!.currentTime);
        this.oscNode.frequency.setValueAtTime(this.testFreq, this.ctx!.currentTime);
      }, 400);
    }
  }

  stopTest(): void {
    if (this.testInterval) { clearInterval(this.testInterval); this.testInterval = null; }
    this.oscNode?.stop();
    this.oscNode?.disconnect();
    this.lfoNode?.stop();
    this.lfoNode?.disconnect();
    this.lfoGain?.disconnect();
    this.gainNode?.disconnect();
    this.oscNode = null;
    this.lfoNode = null;
    this.lfoGain = null;
    this.gainNode = null;
    this.testMode = false;
  }

  isTestMode(): boolean {
    return this.testMode;
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
    const gain = Math.max(0.2, this.sensitivity);
    const volume = Math.min(rms * 3 * gain, 1);

    // Spectral centroid (timbre indicator)
    let weightedSum = 0;
    let totalAmp = 0;
    for (let i = 0; i < bins; i++) {
      const freq = (i * sampleRate) / fftSize;
      weightedSum += freq * freqBuf[i];
      totalAmp += freqBuf[i];
    }
    const centroid = totalAmp > 0 ? weightedSum / totalAmp : 0;

    // Low-frequency energy (bass — <250Hz, for ground/gravity effects)
    const lowBins = Math.floor(bins * 0.06);
    let lowSum = 0;
    for (let i = 0; i < lowBins; i++) lowSum += freqBuf[i];
    const lowEnergy = Math.min(lowSum / (lowBins * 255) * 2 * gain, 1);

    // Mid-frequency energy (250Hz–2kHz, for body/presence)
    const midStart = Math.floor(bins * 0.06);
    const midEnd = Math.floor(bins * 0.45);
    let midSum = 0;
    for (let i = midStart; i < midEnd; i++) midSum += freqBuf[i];
    const midEnergy = Math.min(midSum / ((midEnd - midStart) * 255) * 1.5 * gain, 1);

    // High-frequency energy (>2kHz, for sparkle/air)
    const highStart = Math.floor(bins * 0.45);
    let highSum = 0;
    for (let i = highStart; i < bins; i++) highSum += freqBuf[i];
    const highEnergy = Math.min(highSum / ((bins - highStart) * 255) * 1.5 * gain, 1);

    // Spectral spread (variance around centroid — texture indicator)
    let spreadSum = 0;
    for (let i = 0; i < bins; i++) {
      const freq = (i * sampleRate) / fftSize;
      spreadSum += freqBuf[i] * (freq - centroid) * (freq - centroid);
    }
    const spread = totalAmp > 0 ? Math.sqrt(spreadSum / totalAmp) : 0;
    const spreadNorm = Math.min(spread / (sampleRate / 4), 1); // normalize to 0-1

    // Harmonicity strength (Reuter 2025): ratio of harmonic to total energy.
    // Harmonic bins = multiples of fundamental (approximate by checking bins
    // at integer multiples of the peak bin, ±1 bin tolerance)
    const peakBin = totalAmp > 0 ? bins - 1 - [...freqBuf].reverse().indexOf(Math.max(...freqBuf)) : 0;
    let harmonicSum = 0, totalSum = 0;
    for (let i = 1; i < bins; i++) {
      totalSum += freqBuf[i] * freqBuf[i];
      if (peakBin > 0 && i > 1) {
        // Check if this bin is near a harmonic of the fundamental
        const ratio = i / peakBin;
        const nearestHarm = Math.round(ratio);
        if (nearestHarm >= 2 && nearestHarm <= 10 && Math.abs(ratio - nearestHarm) < 0.08) {
          harmonicSum += freqBuf[i] * freqBuf[i];
        }
      }
    }
    const harmonicity = totalSum > 0 ? Math.min(harmonicSum / totalSum * 3, 1) : 0;

    // Percussive loudness (Reuter 2025): high-frequency transient energy.
    // Sharp onsets in high bands → percussive, rough textures.
    const percussiveHighBins = Math.floor(bins * 0.6);
    let percussiveSum = 0;
    for (let i = percussiveHighBins; i < bins; i++) percussiveSum += freqBuf[i];
    const percussive = Math.min(percussiveSum / ((bins - percussiveHighBins) * 255) * 2 * gain, 1);

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
    this.energyHistory.push(volume);
    if (this.energyHistory.length > 30) this.energyHistory.shift();
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const onsetDelta = volume - avgEnergy;
    const onsetThreshold = 0.06;

    const onsets: number[] = [];
    if (onsetDelta > onsetThreshold && this.energyHistory.length > 10) {
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
      midEnergy,
      highEnergy,
      flatness,
      spreadNorm,
      harmonicity,
      percussive,
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
