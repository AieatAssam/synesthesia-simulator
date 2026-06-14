# Virtual Synesthesia — Product Requirements Document

## Vision

An artistic, scientifically-grounded web application that captures live microphone audio and renders it as real-time visual experiences — simulating what a person with **chromesthesia** (sound→color synesthesia) perceives when hearing sound.

The result should feel like **stepping into a synesthete's mind** — not a generic audio visualizer, but a rich, emotionally resonant, research-backed simulation of a documented neurological phenomenon.

---

## Core Principles

1. **Scientific authenticity** — every visual parameter maps to documented synesthetic experiences from peer-reviewed research and first-person accounts
2. **Artistic richness** — the visuals must be beautiful, layered, and emotionally evocative, not clinical
3. **Real-time performance** — microphone → Canvas2D/WebGL pipeline with sub-50ms latency
4. **Mobile-first** — works on phones (touch targets, responsive layout, efficient rendering)
5. **Pure frontend** — no backend, no API keys, runs entirely in the browser

---

## Target Users

- Anyone curious about synesthesia and altered perception
- Musicians wanting to "see" their sound
- Artists exploring cross-modal creativity
- People with synesthesia who want to compare their experience
- General public — the experience should be immediately compelling without explanation

---

## Feature Requirements

### Phase 1: Core Visualization (MVP)

#### Audio Input
- [ ] Browser microphone access via `getUserMedia`
- [ ] Real-time FFT analysis (Web Audio API `AnalyserNode`)
- [ ] Extract: frequency spectrum, waveform, RMS volume, spectral centroid, onset detection
- [ ] Configurable FFT size (2048 or 4096 for good frequency resolution)
- [ ] Audio context auto-resumes on user gesture (required by browsers)

#### Visual Rendering — Chromesthesia Simulation

Based on research findings, the system MUST implement:

| Research Finding | Implementation |
|-----------------|----------------|
| **Pitch→Color** (rainbow mapping) | Map frequency bins to HSL color space: 20Hz→deep red, 20kHz→violet. Follow Itoh rainbow: low=red, mid=green, high=violet |
| **Pitch→Brightness** (high=bright, low=dark) | HSL lightness increases with log(frequency) |
| **Pitch→Saturation** (higher=less saturated) | HSL saturation decreases above ~2kHz |
| **Timbre→Texture** | Harmonic structure (even/odd ratio) modulates shape roughness, blur, particle density |
| **Loudness→Size** | Volume RMS scales the size/radius/spread of visual elements |
| **Temporal transients** | Onset detection triggers visual "bursts" — like fireworks per Cytowic |
| **Klüver form constants** | Background layer uses tunnel, spiral, honeycomb, and grating motifs |
| **Oscilloscope lines** (Deni Simon) | Primary visual layer: waving, metallic lines driven by waveform |
| **Three-dimensional depth** | Layers with parallax, varying z-depths, atmospheric perspective |
| **Movement** | Directional flow, pulsing, scintillation per volume and frequency changes |

#### Visual Layers (Stacked from back to front)

1. **Background Atmosphere** — slow-moving Klüver form constants (tunnels, spirals, honeycombs). Subtle, atmospheric. Responds to low-frequency energy and overall volume envelope.

2. **Frequency "Aurora"** — horizontal band(s) of color mapping the frequency spectrum left (bass) to right (treble) as a flowing, aurora-like band. Rainbow color mapping. The primary "tonal color" layer.

3. **Waveform Lines** — oscilloscope-style waving lines (per Deni Simon's account). Metallic sheen via gradients. Multiple lines at varying opacities. Responds to waveform shape.

4. **Particle / "Firework" Layer** — transient particle bursts triggered by onsets and percussive events. Colors mapped to dominant frequency at onset moment. Particles have physics (gravity, fade, drift). This is the Cytowic "fireworks" layer.

5. **Kaleidoscopic Overlay** — optional geometric symmetry overlay inspired by Tori Amos's "kaleidoscope" description. Fades in during complex harmonic moments.

#### UI Controls
- [ ] **Start/Stop** microphone button (prominent, mobile-friendly)
- [ ] **Visualization mode toggle**: Full Experience / Aurora Only / Oscilloscope / Particles Only
- [ ] **Sensitivity slider**: how aggressively onsets trigger bursts
- [ ] **Color palette selector**: Synesthete (research-backed rainbow) / Warm / Cool / Neon / Monochrome
- [ ] **Info panel** — explains the science, cites research sources
- [ ] **Fullscreen button** — immersive mode for mobile

### Phase 2: Enhancements
- [ ] Save/export a frame as image
- [ ] Multiple mic sensitivity presets (quiet room, loud environment, music)
- [ ] Specific instrument detection (timbre analysis → different visual signatures)
- [ ] Pitch-class overlay showing note names and their synesthetic colors
- [ ] "Synesthete Mode" — intentionally altered/heightened to match specific documented accounts

---

## Technical Requirements

- **Framework**: React 19 + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Audio**: Web Audio API (`AudioContext`, `AnalyserNode`, `MediaStreamSource`)
- **Rendering**: HTML Canvas (Canvas2D) with requestAnimationFrame loop; may use OffscreenCanvas for layered composition
- **Hosting**: GitHub Pages (static, no backend)
- **Performance target**: 60fps on desktop, 30fps minimum on mobile. Canvas resolution adaptive to device pixel ratio
- **Bundle size**: <200KB gzipped
- **Browser support**: Chrome, Firefox, Safari, Edge (Web Audio API required)

---

## Success Criteria

1. Microphone → visual latency under 100ms perceived
2. FFT analysis runs at ≥30fps on mobile devices
3. Visual output is recognizably different for different sounds (clap vs. hum vs. speech)
4. Users unfamiliar with synesthesia describe the experience as "beautiful" or "eye-opening"
5. All visual parameters are traceable to specific research findings documented in `/research/`

---

## Non-Goals (Out of Scope)

- ML-based instrument recognition (too heavy)
- Spotify/audio file integration (keep it live-mic for now)
- Social sharing / cloud features
- Accessibility for visually impaired users (the app IS the visual experience)
- Backend or database of any kind
