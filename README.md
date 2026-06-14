# Virtual Synesthesia

**A browser-based simulation of chromesthesia — stepping into the mind of a sound→color synesthete.**

Live microphone audio is analyzed in real-time and rendered as rich, multi-layered visual experiences grounded in neuroscience research and first-person accounts. Not a generic audio visualizer — this is what documented synesthetes actually describe seeing.

---

## Table of Contents

- [The Science](#the-science)
- [What Synesthetes Actually See](#what-synesthetes-actually-see)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Visual Layers](#visual-layers)
- [Audio→Visual Mapping Reference](#audiovisual-mapping-reference)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Research Sources](#research-sources)
- [License](#license)

---

## The Science

**Chromesthesia** is a form of synesthesia where sound involuntarily evokes visual experiences — colors, shapes, textures, and movement. It affects approximately 1 in 3,000 people and is one of the most studied forms of the condition.

### How It Works (Neurologically)

Three competing (but not mutually exclusive) theories explain chromesthesia:

1. **Cross-Activation Theory** (Ramachandran & Hubbard, 2001/2005): Extra structural connections between adjacent brain areas — specifically auditory cortex and V4 (color area) — cause sound to directly trigger color perception. Caused by reduced neural pruning during development due to a genetic mutation.

2. **Disinhibited Feedback Model** (Cytowic & Eagleman, 2009): All brains have feedback pathways between sensory areas. Synesthetes simply fail to inhibit these normally. This explains acquired synesthesia (after brain injury) and drug-induced synesthesia.

3. **Ideasthesia** (Nikolić & Simner): Synesthesia is mediated by *meaning*, not raw sensation. The concept of "C" triggers red, not the 261.6 Hz frequency itself. This is why C# (277.2 Hz) and Db (277.2 Hz — same frequency!) produce different colors in many synesthetes.

### Key Research Findings This App Implements

| Finding | Source | Implementation |
|---------|--------|----------------|
| Pitch classes follow a rainbow (do=red → si=violet) | Itoh et al. (2017) *Scientific Reports* | HSL hue mapped to log(frequency), 20Hz–20kHz → 0°–270° |
| Higher pitch = brighter colors (universal, not just synesthetes) | Ward et al. (2006) *Cortex* | HSL lightness increases with frequency |
| Higher pitch classes = less saturated colors | Itoh et al. (2017) | HSL saturation decreases above 2kHz |
| Sound evokes "firework shapes" that arise, move, and fade | Cytowic (1989, 2009) | Onset-triggered particle bursts with physics |
| Music produces "oscilloscope-like waving metallic lines with depth" | Deni Simon (via Cytowic) | Waveform layer with gradient "metallic" strokes |
| "Light filament architecture" and "kaleidoscope" structures | Tori Amos (2005) | Geometric symmetry overlay during complex harmony |
| Background forms: tunnels, spirals, honeycombs, gratings | Klüver (1926) form constants | Slow atmospheric background layer |
| Timbre (instrument quality) modulates color independently of pitch | Ellington, Bernstein, Liszt accounts | Spectral centroid drives palette warmth, harmonic structure affects texture |

---

## What Synesthetes Actually See

### Pharrell Williams
Based his 2008 album *Seeing Sounds* on his synesthetic experience. Describes seeing music as layered colors and patterns.

### Tori Amos
> "The song appears as light filament once I've cracked it... I've never seen the same light creature in my life. Obviously similar chord progressions follow similar light patterns, but try to imagine the best kaleidoscope ever... The sound of the words with the sound of the chord progression combined with the rhythm manifests itself in a unique expression of the architecture of color-and-light."

### Deni Simon (non-musician synesthete)
> "Music produces waving lines — like oscilloscope configurations — lines moving in color, often metallic with height, width, and, most importantly, depth. My favorite music has lines that extend horizontally beyond the screen area."

### Franz Liszt (1842, directing an orchestra)
> "Gentlemen, a little bluer, if you please... That is a deep violet, please, depend on it!"

### Duke Ellington
Described his orchestra as a painter's palette: trumpet = "dark blue," alto saxophone = "light blue satin." Each performance was "creating a new painting."

---

## Features

- 🎤 **Live microphone** input via Web Audio API — no pre-recorded audio needed
- 🌈 **Research-backed color mapping** — frequency→hue using Itoh rainbow theory
- 🎆 **5 visual layers** simulating different aspects of chromesthetic experience
- 📱 **Mobile-first design** — touch-friendly controls, adaptive rendering quality
- 🎨 **Multiple color palettes** — Synesthete (research), Warm, Cool, Neon, Monochrome
- 🔬 **Built-in science reference** — info panel explaining the research behind each visual element
- 🖥️ **Fullscreen immersive mode** — for phones and desktop
- ⚡ **60fps rendering** on desktop, adaptive to 30fps minimum on mobile
- 🌐 **Pure frontend** — no backend, no API keys, works offline after load

---

## Technical Architecture

### Audio Pipeline

```
Microphone → getUserMedia → MediaStream
    ↓
AudioContext.createMediaStreamSource(stream)
    ↓
AnalyserNode (FFT size: 4096, smoothing: 0.5)
    ↓
┌───────────────┼───────────────┐
│               │               │
▼               ▼               ▼
getByteFrequencyData  getByteTimeDomainData  RMS/Spectral Analysis
(freq spectrum)       (raw waveform)         (volume, centroid, onsets)
│               │               │
└───────────────┼───────────────┘
                ▼
       AudioData (shared across layers)
```

### Rendering Pipeline

```
requestAnimationFrame loop
    ↓
AudioEngine.getSnapshot() → AudioData { frequencies, waveform, volume, centroid, onsets }
    ↓
┌──────────────────────────────────────┐
│  Layer 1: renderBackground()         │  ← Klüver form constants
│  Layer 2: renderAurora()             │  ← Frequency spectrum rainbow band
│  Layer 3: renderWaveform()           │  ← Oscilloscope metallic lines
│  Layer 4: renderParticles()          │  ← Onset-triggered firework bursts
│  Layer 5: renderKaleidoscope()       │  ← Geometric symmetry overlay
└──────────────────────────────────────┘
    ↓
Single Canvas2D context (composited in order)
```

### Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React 19 + TypeScript | Component architecture, type safety |
| **Build** | Vite 6 | Fast dev server, optimized production builds |
| **UI** | shadcn/ui + Tailwind CSS 4 | Accessible, customizable, mobile-friendly components |
| **Audio** | Web Audio API | Built into browsers, no dependencies. FFT analysis via `AnalyserNode` |
| **Rendering** | Canvas2D | Sufficient for this art style, simpler than WebGL, excellent mobile performance |
| **Hosting** | GitHub Pages | Free, automatic deploy via Actions |

### Why Canvas2D, Not WebGL?

The visual style (gradients, lines, particles, geometric shapes) maps naturally to Canvas2D's API. WebGL would add complexity (shader management, context loss handling, GPU memory) without benefit for this art style. Canvas2D's `globalCompositeOperation` and gradient APIs give us the "metallic," "light filament," and "firework" effects described by synesthetes without a GL pipeline.

---

## Visual Layers

### Layer 1: Background — Klüver Form Constants

Slow-moving atmospheric background motifs drawn from Klüver's (1926) documented hallucinatory form categories: tunnels (concentric circles), spirals (logarithmic), and honeycombs (hexagonal tilings). Rendered at 10–20% opacity. Responds to low-frequency energy and slow volume envelope. Provides the "space" in which other visuals appear.

**Research basis:** Klüver (1926) identified four recurring geometric categories in hallucinations, later confirmed to appear in chromesthetic experiences (Cytowic 2018).

### Layer 2: Aurora — Frequency Spectrum Band

A flowing horizontal band mapping the entire frequency spectrum from bass (left, ~20Hz) to treble (right, ~20kHz) as a continuous color gradient. Each frequency bin's amplitude controls the "height" of that column in the band. Colors follow Itoh's rainbow theory: red at low frequencies, transitioning through yellow, green, and blue to violet at the highest frequencies.

**Research basis:** Itoh et al. (2017) demonstrated rainbow-like hue ordering across pitch classes in 33 subjects. The "aurora" metaphor reflects descriptions of synesthetic colors as flowing, atmospheric, and band-like rather than discrete.

### Layer 3: Waveform — Oscilloscope Lines

Waving, "metallic" lines tracing the raw time-domain audio waveform. Multiple lines at slight offsets create depth. Gradient strokes (light edge + darker core) produce the "metallic" quality described by Deni Simon. Line color shifts in real-time based on spectral centroid (a timbre indicator) — different sounds produce different line hues even at the same pitch.

**Research basis:** Deni Simon's firsthand account (via Cytowic): "waving lines — like oscilloscope configurations — lines moving in color, often metallic with height, width, and, most importantly, depth."

### Layer 4: Particles — "Fireworks"

Transient particle bursts triggered by detected audio onsets (sudden increases in energy). Each onset spawns particles that burst outward with gravity, air friction, and fade over 1–3 seconds. Colors are mapped to the dominant frequency at the onset moment. Particle count scales with onset intensity.

**Research basis:** Cytowic's "something like fireworks" description (1989, 2009): voice, music, and environmental sounds "trigger color and firework shapes that arise, move around, and then fade when the sound ends."

### Layer 5: Kaleidoscopic Overlay

Geometric radial symmetry (6–12 fold) applied to waveform segments, creating mandala-like patterns. Fades in during moments of high spectral flatness — when many frequencies are active simultaneously (rich chords, dense textures). Rendered at low opacity (15–25%) as a subtle enhancement.

**Research basis:** Tori Amos's "kaleidoscope" description (2005): "try to imagine the best kaleidoscope ever — after the initial excitement, you start to focus on each element's stunning original detail."

---

## Audio→Visual Mapping Reference

### Complete Parameter Mapping Table

| Audio Parameter | Extraction Method | Visual Parameter | Mapping Function | Research Basis |
|----------------|-------------------|-----------------|-----------------|----------------|
| Frequency | FFT bin index → Hz | Hue (HSL) | `hue = logMap(freq, 20, 20000) * 270°` | Itoh et al. 2017 |
| Frequency | FFT bin index → Hz | Lightness (HSL) | `lightness = 40 + logMap(freq) * 40` | Ward et al. 2006 |
| Frequency | FFT bin index → Hz | Saturation (HSL) | `sat = 90 - logMap(freq) * 40` | Itoh et al. 2017 |
| Amplitude | FFT bin magnitude (0–255) | Alpha opacity | `alpha = clamp(amp/255 * 1.2, 0, 1)` | Universal |
| RMS Volume | Time-domain RMS | Element size/radius | `size = baseSize * (1 + rms * 3)` | Cytowic, general |
| RMS Volume | Time-domain RMS | Particle spawn count | `count = floor(rms * 50)` | Cytowic "fireworks" |
| Spectral Centroid | Weighted mean of FFT bins | Color temperature offset | `warmthBias = map(centroid, 0, sampleRate/2, 30, -30)` | Timbre accounts |
| Onset Detection | Energy delta vs. running avg | Particle burst trigger | Binary trigger | Cytowic firework timing |
| Spectral Flatness | Geometric/arithmetic mean ratio | Kaleidoscope opacity | `opacity = map(flatness, 0.3, 0.8, 0, 0.25)` | Amos "kaleidoscope" |
| Harmonics Ratio | Even/odd harmonic energy | Line texture / roughness | Higher odd ratio → rougher line stroke | Timbre → texture |
| Waveform | Time-domain samples | Oscilloscope line vertices | Direct mapping, smoothed | Deni Simon account |
| Low-freq Energy | Integrated energy <250Hz | Background motion speed | `speed = map(lowEnergy, 0, 0.5, 0.2, 2)` | Klüver form dynamics |

### Rainbow Color Mapping (Itoh Theory)

```
20 Hz  ──────────────────────────── 20,000 Hz
  │                                      │
  ▼                                      ▼
Red (0°) → Orange → Yellow → Green → Cyan → Blue → Violet (270°)
└────── warm ──────┘└──────── cool ──────────┘
 High saturation                    Low saturation
    Darker                            Brighter
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- A microphone

### Development

```bash
# Clone
git clone https://github.com/AieatAssam/virtual-synesthesia.git
cd virtual-synesthesia

# Install
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. Open the app in a browser
2. Tap "Start Microphone" and grant permission
3. Make sounds — speak, clap, play music, whistle
4. Watch the canvas respond in real-time
5. Switch between visualization modes and color palettes
6. Tap fullscreen for immersive mode

### Browser Support

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full support |
| Firefox 90+ | ✅ Full support |
| Safari 15+ | ✅ Full support (requires user gesture) |
| Edge 90+ | ✅ Full support |
| Mobile Chrome | ✅ Full support |
| Mobile Safari | ✅ Full support (requires user gesture) |

---

## Project Structure

```
virtual-synesthesia/
├── README.md
├── AGENTS.md                       ← Agentic instructions for AI-assisted development
├── docs/
│   ├── PRD.md                      ← Product Requirements Document
│   └── PLAN.md                     ← Implementation plan with file checklist
├── research/
│   └── chromesthesia-findings.md   ← Comprehensive research compilation
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                     ← Root component, layout, state
│   ├── index.css                   ← Tailwind imports + global styles
│   ├── components/
│   │   ├── AudioEngine.ts          ← Singleton: AudioContext, AnalyserNode, analysis
│   │   ├── Canvas.tsx              ← rAF render loop, layer composition
│   │   ├── visualizers/
│   │   │   ├── types.ts            ← Shared AudioData, VisualParams interfaces
│   │   │   ├── colorMapping.ts     ← Frequency→HSL mapping, palette presets
│   │   │   ├── backgroundLayer.ts  ← Klüver form constants renderer
│   │   │   ├── auroraLayer.ts      ← Frequency spectrum rainbow band
│   │   │   ├── waveformLayer.ts    ← Oscilloscope metallic lines
│   │   │   ├── particleLayer.ts    ← Onset-triggered firework particles
│   │   │   └── kaleidoscopeLayer.ts← Geometric symmetry overlay
│   │   └── ui/
│   │       ├── MicButton.tsx       ← Start/stop microphone
│   │       ├── ModeSelector.tsx    ← Visualization mode toggle
│   │       ├── SensitivitySlider.tsx
│   │       ├── PaletteSelector.tsx ← Color palette chooser
│   │       ├── InfoPanel.tsx       ← Science reference + research citations
│   │       └── FullscreenButton.tsx
│   └── hooks/
│       ├── useAudioEngine.ts       ← React hook wrapping AudioEngine
│       └── useAnimationFrame.ts    ← rAF loop hook
└── public/
    └── (static assets)
```

---

## Research Sources

### Primary Scientific Literature
1. Ramachandran, V.S. & Hubbard, E.M. (2001). "Synaesthesia: A window into perception, thought and language." *Journal of Consciousness Studies*, 8(12):3-34.
2. Hubbard, E.M. & Ramachandran, V.S. (2005). "Neurocognitive mechanisms of synesthesia." *Neuron*, 48(3):509-520.
3. Ward, J., Huckstep, B. & Tsakanikos, E. (2006). "Sound-colour synaesthesia: to what extent does it use cross-modal mechanisms common to us all?" *Cortex*, 42(2):264-280.
4. Itoh, K., Sakata, H., Kwee, I.L. & Nakada, T. (2017). "Musical pitch classes have rainbow hues in pitch class-color synesthesia." *Scientific Reports*.
5. Itoh, K. & Nakada, T. (2018). "Absolute pitch is not necessary for pitch class-color synesthesia."
6. Cao, Y. & Ueda, S. (2025). "One- or two-step? New insights into two-step hypothesis and rainbow-like theory for pitch class-color synesthesia."
7. Niccolai, V., Jennes, J., Stoerig, P. & Van Leeuwen, T.M. (2012). Study on voice-related chromesthesia.
8. Simner, J. et al. (2006). Prevalence study. *Perception*.

### Books
- Cytowic, R.E. (1989). *Synesthesia: A Union of the Senses*.
- Cytowic, R.E. & Eagleman, D.M. (2009). *Wednesday Is Indigo Blue: Discovering the Brain of Synesthesia*.
- Amos, T. (2005). *Piece by Piece*.

### Historical
- Klüver, H. (1926). Form constants in hallucinations.
- Sabaneyev, L. (1911). Scriabin's key-color system.
- Galeyev, B.M. & Vanechkina, I.L. (2001). "Was Scriabin a Synesthete?" *Leonardo*.

### First-Person Accounts
- Tori Amos (2005), *Piece by Piece*
- Deni Simon, via Cytowic (1989, 2009)
- Duke Ellington, via multiple biographies
- Franz Liszt, 1842 rehearsal accounts (*Neue Berliner Musikzeitung*)
- Leonard Bernstein, rehearsal recordings
- Pharrell Williams, *Seeing Sounds* (2008)
- Lorde, Billie Eilish, and others via interviews

Full research compilation at [`/research/chromesthesia-findings.md`](research/chromesthesia-findings.md).

---

## License

MIT

---

*"I started visiting this world when I was three, listening to a piece by Béla Bartók; I visited a configuration that day that wasn't on this earth. It was euphoric."* — Tori Amos
