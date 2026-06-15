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
AudioEngine.getSnapshot() → AudioData { frequencies, waveform, volume, centroid, onsets, lowEnergy }
    ↓
┌────────────────────────────────────────────────┐
│  UNIFIED VISUAL FIELD (persistent, evolving)    │
│                                                 │
│  Render back → front:                           │
│  Layer 1: RippleField     ← expanding rings     │
│  Layer 2: DriftShapes     ← 3D-positioned forms │
│  Layer 3: SmokeTrails     ← cloud/ember texture │
│  Layer 4: Stardust        ← sparkle particles   │
└────────────────────────────────────────────────┘
    ↓
Single Canvas2D — gentle clearing (α=0.05) for persistent trails
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

All layers paint into a **single unified visual field** with persistence. The canvas clears at alpha=0.05 per frame — elements leave visible trails lasting ~20 frames (330ms at 60fps). This captures the synesthetic quality of colors that "persist while sound continues and fade when sound stops."

### Design Philosophy

Grounded in **Savickaite et al. (2023)**: synesthetes using VR to draw their experiences emphasized that texture, movement, 3D depth, and persistence are essential — 2D color pickers and static representations miss the entire phenomenology.

| Synesthete Description | Visual Element | Source |
|----------------------|---------------|--------|
| "Stars in your eyes" | Stardust sparkle particles with glow halos | P1, Savickaite 2023 |
| "Pulsating outwards... gravitational vacuum" | RippleField concentric rings + central glow | P1, Savickaite 2023 |
| "This smoke will come in really helpful" | SmokeTrails soft radial blob particles | P1, Savickaite 2023 |
| "Big yellow shape... orange line in the middle" | DriftShapes persistent polygons with inner strokes | P1, Savickaite 2023 |
| "3D shapes moving up or down depending on pitch" | DriftShapes vertical position mapped to frequency | P4, Savickaite 2023 |
| "Shimmering" / "sparkly" / "electric bits" | Stardust cross-shaped sparkles with 8-20Hz flicker | P1, Savickaite 2023 |

### Layer 1: RippleField — "Gravitational Vacuum"

Expanding concentric rings triggered by audio energy and onsets. Each ring has a hue mapped to its dominant frequency and fades gradually. A central radial glow pulses with low-frequency energy. Captures the Klüver form constants (tunnels, spirals) and P1's "gravitational vacuum" quality.

**Research basis:** Klüver (1926) form constants; P1's descriptions of "pulsating outwards as if it's churning round" and "in the middle it's slower, on the outside it moves a lot more" (Savickaite et al. 2023).

### Layer 2: DriftShapes — "3D Shapes Moving in Space"

Persistent geometric shapes (circles, triangles, diamonds, pentagons) that appear at frequency-mapped positions, drift slowly, rotate, and pulse. Pitch maps to vertical position (higher pitch = higher on screen) per Ward et al. (2006). Shapes persist for 2–10 seconds, fading in/out with hold period.

**Research basis:** P1's "big yellow shape and then like a sort of orange line in the middle"; P2's "sideways eye shape" and "general like hard shape"; P4's "three-dimensional shapes specific to the instrument" (Savickaite et al. 2023). Kandinsky's abstract forms in motion.

### Layer 3: SmokeTrails — Cloud & Ember Texture

Soft radial-gradient blob particles that drift, slow down, and fade. Each particle uses a radial gradient from bright core to transparent edge, creating smoke/cloud visual quality. Some particles feature bright "ember" cores. Flow lines trace curved paths with metallic styling. Particle spawning is weighted by frequency amplitude — louder bins produce more particles.

**Research basis:** P1's "this smoke will actually come in really helpful because a lot of my synaesthesia looks kind of like that," "embers would still be going over the top," "a little bit fuzzy"; P2's "smokiness" and "cloudiness" descriptions; Deni Simon's "waving lines — like oscilloscope configurations — lines moving in color, often metallic" (Savickaite et al. 2023; Cytowic 1989).

### Layer 4: Stardust — "Stars in Your Eyes"

**Hypersensitive** sparkle particles that spawn even at very low volumes. Three spawning modes: ambient (always present, ~1-25 particles/frame), onset bursts (concentrated explosions of 30+ particles), and low-frequency swirls (orbital stardust near center). Each particle has a bright core, radial glow halo, and cross-shaped sparkle with fast flicker (8–20Hz oscillation).

**Research basis:** P1's "stars in your eyes" and "I never got to represent my experiences so clearly" (on the stars brush); "yellow and sparkly" for birdsong; "electric bits" for plucked guitar; Cytowic's "something like fireworks" (Savickaite et al. 2023; Cytowic 1989, 2009).

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
9. **Savickaite, S., McNaughton, D., Gaigalas, R., & Ward, J. (2023).** "Using immersive virtual reality to recreate the synaesthetic experience." *i-Perception*, 14(3). [PMC10478570](https://pmc.ncbi.nlm.nih.gov/articles/PMC10478570/) — participants drew their synesthetic experiences in 3D VR; revealed critical importance of texture, movement, and persistence.

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
