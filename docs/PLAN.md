# Virtual Synesthesia — Implementation Plan

## Phase 0: Research (COMPLETE ✓)

See `/research/chromesthesia-findings.md` for the full compilation of scientific papers, personal accounts, and documented mapping patterns.

Key findings that drive implementation:
- Pitch→Rainbow Hue (Itoh 2017 rainbow theory)
- Pitch→Brightness (high=bright, low=dark — Ward 2006)
- Timbre→Texture/Shape
- Klüver form constants as background motifs
- "Oscilloscope lines" from Deni Simon's account
- "Fireworks" description from Cytowic
- "Light filament" architecture from Tori Amos

---

## Phase 1: Project Scaffold

### 1.1 Initialize React + Vite + TypeScript
```bash
npm create vite@latest virtual-synesthesia -- --template react-ts
cd virtual-synesthesia
npm install
```

### 1.2 Add shadcn/ui + Tailwind
```bash
npx shadcn@latest init
npx shadcn@latest add button card slider toggle select
```

### 1.3 Dependencies
```bash
npm install lucide-react
# No other external deps — Web Audio API + Canvas2D are built-in
```

### 1.4 Project Structure
```
src/
  components/
    App.tsx              — main layout, mic control, mode selector
    Canvas.tsx            — primary canvas component, rAF render loop
    AudioEngine.ts        — Web Audio API wrapper (singleton)
    visualizers/
      types.ts            — shared types (FrequencyData, VisualParams, etc.)
      colorMapping.ts     — frequency→color lookup tables (rainbow theory)
      backgroundLayer.ts  — Klüver form constants renderer
      auroraLayer.ts      — frequency spectrum "aurora" band
      waveformLayer.ts    — oscilloscope-style waving lines
      particleLayer.ts    — onset-triggered firework particles
      kaleidoscopeLayer.ts — geometric symmetry overlay
    ui/
      MicButton.tsx       — start/stop microphone
      ModeSelector.tsx    — visualization mode toggle
      SensitivitySlider.tsx
      InfoPanel.tsx       — about synesthesia, research citations
      FullscreenButton.tsx
  hooks/
    useAudioEngine.ts     — React hook wrapping AudioEngine
    useAnimationFrame.ts  — rAF loop hook
  lib/
    utils.ts              — math helpers, lerp, clamp, map

public/
  index.html
```

---

## Phase 2: Audio Engine

### 2.1 AudioEngine class (`src/components/AudioEngine.ts`)

```typescript
class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;  // 2048 frequency bins, good resolution
    this.analyser.smoothingTimeConstant = 0.5;  // smooth but responsive
    this.source.connect(this.analyser);
    // Don't connect to destination — we're analyzing, not playing back
  }
  
  getFrequencyData(): Uint8Array {
    const data = new Uint8Array(this.analyser!.frequencyBinCount);
    this.analyser!.getByteFrequencyData(data);
    return data;
  }
  
  getTimeData(): Uint8Array {
    const data = new Uint8Array(this.analyser!.fftSize);
    this.analyser!.getByteTimeDomainData(data);
    return data;
  }
  
  getVolume(): number { /* RMS from time data */ }
  getSpectralCentroid(): number { /* weighted mean of frequencies */ }
  detectOnsets(): boolean { /* compare current frame energy to running average */ }
}
```

Export as singleton — one AudioContext per app.

---

## Phase 3: Color Mapping Engine

### 3.1 Frequency → Color (`colorMapping.ts`)

Based on Itoh rainbow theory + Ward brightness findings:

```typescript
interface HSLA { h: number; s: number; l: number; a: number; }

function frequencyToColor(frequency: number, amplitude: number): HSLA {
  // Map 20Hz-20kHz to 0-360 hue (red→violet rainbow)
  const logFreq = Math.log2(Math.max(frequency, 20));
  const logMin = Math.log2(20);     // ~4.32
  const logMax = Math.log2(20000);  // ~14.29
  
  // Hue: 0° (red) at 20Hz → 270° (violet) at 20kHz
  const hue = ((logFreq - logMin) / (logMax - logMin)) * 270;
  
  // Lightness: brighter at high frequencies (Ward 2006)
  const lightness = 40 + ((logFreq - logMin) / (logMax - logMin)) * 40;
  
  // Saturation: decreases at high frequencies (Itoh 2017)
  const saturation = 90 - ((logFreq - logMin) / (logMax - logMin)) * 40;
  
  // Alpha: driven by amplitude (louder = more opaque)
  const alpha = Math.min(amplitude / 255 * 1.2, 1.0);
  
  return { h: hue, s: saturation, l: lightness, a: alpha };
}
```

### 3.2 Color Palettes

Predefined palette overrides for user selection:
- **Synesthete** (default): Research-backed rainbow as above
- **Warm**: Compressed hue range 0–60 (reds through golds)
- **Cool**: Compressed hue range 180–270 (cyans through violets)
- **Neon**: Full rainbow, max saturation, boosted lightness
- **Monochrome**: Hue fixed to one color, only lightness/alpha vary

---

## Phase 4: Visual Layers (Canvas Rendering)

All layers render to a single Canvas2D context via composition. Each layer is a function `(ctx, data, params, dt) => void` called in order each frame.

### 4.1 Background: Klüver Form Constants

Slow-moving atmospheric background. Renders one or more form constants:
- **Tunnels**: concentric circles with radial gradient, slowly pulsing with volume
- **Spirals**: logarithmic spirals rotating slowly
- **Honeycombs**: hexagonal tiling with subtle color variations

Rendered at low opacity (10–20%). Parameters driven by low-frequency spectral energy and slow volume envelope.

### 4.2 Aurora: Frequency Spectrum Band

A horizontal, flowing band across the canvas:
- Left edge = 20Hz, right edge = 20kHz
- Each frequency bin drawn as a vertical column or gaussian-blob
- Height = amplitude at that frequency
- Color = `frequencyToColor(binFrequency, amplitude)`
- Smooth interpolation between bins for continuous appearance
- Vertical position centers around canvas mid-height
- Slight wave/sine distortion for organic "aurora" feel

### 4.3 Waveform: Oscilloscope Lines

Per Deni Simon's account: "waving lines like oscilloscope configurations — often metallic."

- Raw time-domain waveform drawn as a connected line
- Centered vertically, scaled to fill 60–80% of canvas height
- Multiple lines at slight offsets for depth
- Metallic sheen via multiple gradient strokes (light edge + dark core)
- Line color shifts based on spectral centroid (timbre indicator)
- Smoothing via moving average to avoid jitter

### 4.4 Particles: "Fireworks"

Transient particle bursts on detected onsets. Per Cytowic: "colors arise, move around, and then fade when the sound ends."

- Each onset spawns 10–50 particles
- Initial position: random spread near canvas center
- Initial velocity: outward radial burst + random variation
- Physics: gravity (slow downward drift), air friction, fade over 1–3 seconds
- Color: `frequencyToColor(onsetFrequency, onsetAmplitude)`
- Shape: circles with glow (radial gradient)
- Size: proportional to onset amplitude

### 4.5 Kaleidoscopic Overlay

Geometric symmetry layer that fades in during complex harmonic content (high spectral flatness = many frequencies active = rich chord).

- Radial symmetry (6–12 fold) centered on canvas
- Draws mirrored waveform segments
- Low opacity (15–25%) — subtle enhancement, not dominant
- Inspired by Tori Amos: "the best kaleidoscope ever"

---

## Phase 5: UI Components

### Layout (Mobile-First)
```
┌──────────────────────────┐
│  🎤 Virtual Synesthesia  │  ← Header (sticky)
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │    CANVAS           │  │  ← Fills available space
│  │    (visual output)  │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  [▶ Start Microphone]    │  ← Primary CTA
│                          │
│  Visualization: [▼]      │  ← Mode selector
│  Sensitivity: [═══●══]   │  ← Slider
│  Palette: [▼]            │  ← Color palette
│                          │
│  ℹ About Synesthesia     │  ← Info panel toggle
└──────────────────────────┘
```

Touch targets minimum 44×44px. Canvas scales to fill width, maintains 16:9 or adapts to viewport.

### States
- **Idle**: "Tap to begin" prompt, subtle animated placeholder
- **Requesting**: Permission prompt feedback
- **Active**: Full visualization running, controls available
- **Error**: Microphone denied/unavailable message with troubleshooting
- **Paused**: Canvas frozen, last frame visible

---

## Phase 6: Polish & Performance

### Performance Optimizations
- **Adaptive quality**: Detect frame drops → reduce particle count, skip background on mobile
- **Canvas resolution**: Match device pixel ratio but cap at 2x
- **Layer skipping**: Allow disabling individual layers for performance
- **requestAnimationFrame**: Single rAF loop drives all layers
- **Throttle FFT reads**: Read audio data once per frame, share across layers

### Mobile Optimizations
- Viewport meta tag for proper scaling
- Touch-friendly controls (minimum 44px targets)
- Fullscreen API for immersive mode
- Reduced particle count on mobile (detected via `navigator.hardwareConcurrency` or user agent)
- No hover-dependent UI

### Accessibility
- All buttons have aria-labels
- Canvas has descriptive alt text
- Info panel text is readable, well-structured
- Keyboard navigation for controls

---

## Phase 7: Testing

### Manual Testing Checklist
- [ ] Microphone permission flow (grant, deny, dismiss)
- [ ] Different sound types: voice, clap, whistle, music
- [ ] Color response to pitch sweep (low→high)
- [ ] Onset detection for percussive sounds
- [ ] Mode switching (all layers toggle correctly)
- [ ] Mobile: touch targets, canvas scaling, performance
- [ ] Fullscreen mode
- [ ] Browser compatibility (Chrome, Firefox, Safari)

### Automated
- Unit tests for `frequencyToColor()`, `AudioEngine` math
- Component render tests for UI controls
- No E2E for microphone (browser automation limitation)

---

## Phase 8: Deploy

- GitHub Pages via GitHub Actions
- `base: '/virtual-synesthesia/'` in vite.config.ts
- Push to `main` → automatic deploy
- Verify on mobile device

---

## File Checklist

```
virtual-synesthesia/
├── README.md                    ← Comprehensive project README
├── AGENTS.md                    ← Agentic instructions
├── docs/
│   ├── PRD.md                   ← This document's companion PRD
│   └── PLAN.md                  ← This document
├── research/
│   └── chromesthesia-findings.md ← Research compilation
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── AudioEngine.ts
│   │   ├── Canvas.tsx
│   │   ├── visualizers/
│   │   │   ├── types.ts
│   │   │   ├── colorMapping.ts
│   │   │   ├── backgroundLayer.ts
│   │   │   ├── auroraLayer.ts
│   │   │   ├── waveformLayer.ts
│   │   │   ├── particleLayer.ts
│   │   │   └── kaleidoscopeLayer.ts
│   │   └── ui/
│   │       ├── MicButton.tsx
│   │       ├── ModeSelector.tsx
│   │       ├── SensitivitySlider.tsx
│   │       ├── PaletteSelector.tsx
│   │       ├── InfoPanel.tsx
│   │       └── FullscreenButton.tsx
│   └── hooks/
│       ├── useAudioEngine.ts
│       └── useAnimationFrame.ts
└── public/
    └── (static assets)
```
