# Virtual Synesthesia — Agent Instructions

## Project Identity

**Virtual Synesthesia** is a browser-based application that captures live microphone audio and renders real-time visual experiences simulating **chromesthesia** (sound→color synesthesia). Every visual parameter is grounded in peer-reviewed neuroscience research and documented first-person accounts of synesthetes.

---

## Core Directives

### 1. Research-First Development
- **Every visual behavior must be traceable to a specific research finding.** If you add a new visual effect, cite which paper, account, or finding justifies it. Update `/research/chromesthesia-findings.md` when adding new research-backed features.
- When in doubt about how a visual should behave, consult `/research/chromesthesia-findings.md`. Don't invent mappings — use documented ones.
- The research file is the single source of truth for visual-to-audio mappings.

### 2. Scientific Authenticity > Artistic License
- The app should feel like stepping into a synesthete's mind, not like a generic audio visualizer.
- **Never** add effects that contradict documented synesthetic experience. No equalizer bars. No bouncing balls. No waveform visualizations that look like Winamp.
- If a synesthetic phenomenon is described as "metallic oscilloscope lines" (Deni Simon), make them metallic. If described as "fireworks" (Cytowic), make them firework-like.

### 3. Performance
- 60fps on desktop, 30fps minimum on mobile.
- Canvas resolution adaptive to device pixel ratio, capped at 2x.
- Audio analysis runs once per frame, shared across all visual layers.
- Particle systems and background form constants are the most expensive — scale them down on mobile.

### 4. Mobile-First
- All touch targets minimum 44×44px.
- Canvas fills available width, maintains aspect ratio.
- Fullscreen API available on user gesture.
- UI controls at bottom — reachable with thumbs.

### 5. Code Quality
- TypeScript everywhere. No `any` types.
- One `AudioContext` per app (singleton). Never create multiple.
- Canvas rendering is purely functional — each layer is a stateless function taking `(ctx, data, params, dt)`.
- Components are React 19 with hooks. No class components.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| UI | shadcn/ui + Tailwind CSS 4 |
| Audio | Web Audio API (AudioContext, AnalyserNode) |
| Rendering | Canvas2D via requestAnimationFrame |
| Hosting | GitHub Pages (static) |

---

## Project Structure Conventions

```
src/components/AudioEngine.ts      — Singleton. Owns AudioContext + AnalyserNode.
src/components/Canvas.tsx          — Single <canvas> element. rAF loop drives all layers.
src/components/visualizers/        — One file per visual layer. All export a render function.
src/components/ui/                 — shadcn/ui wrapper components. One per control.
src/hooks/                         — useAudioEngine, useAnimationFrame.
src/lib/                           — Pure utility functions (math, color, etc.).
```

### Layer Rendering Convention

Every visualizer layer exports:

```typescript
import { AudioData, VisualParams } from './types';

export function renderLayer(
  ctx: CanvasRenderingContext2D,
  audio: AudioData,
  params: VisualParams,
  dt: number  // delta time in seconds
): void;
```

Layers must NOT:
- Store state internally (pass accumulated state via params if needed)
- Call `requestAnimationFrame` (the Canvas component owns the rAF loop)
- Read from the AudioEngine directly (receive pre-processed data)
- Modify the canvas size (Canvas component owns dimensions)

---

## Key Audio→Visual Mapping Reference

| Sound Property | Visual Parameter | Research Source |
|---------------|-----------------|-----------------|
| Frequency (log) | Hue (0°-270°, red→violet) | Itoh et al. 2017 rainbow theory |
| Frequency (log) | Lightness (higher freq = brighter) | Ward et al. 2006 |
| Frequency (linear) | Saturation (higher freq = less saturated) | Itoh et al. 2017 |
| Amplitude | Alpha/opacity | Universal across accounts |
| RMS Volume | Element size / spread radius | Cytowic, general patterns |
| Spectral centroid | Color palette warmth | Timbre-to-color accounts |
| Onset detection | Particle burst trigger | Cytowic "fireworks" |
| Spectral flatness | Kaleidoscope visibility | Tori Amos "kaleidoscope" |
| Waveform shape | Oscilloscope line curvature | Deni Simon account |

---

## Development Workflow

1. Read `/research/chromesthesia-findings.md` before implementing any visual layer
2. Implement one layer at a time, verify against research
3. Test with real microphone input (claps, voice, music)
4. Verify on mobile viewport (Chrome DevTools device emulation)
5. Commit with descriptive messages referencing research findings where applicable
6. When adding new research-backed behavior, update `/research/chromesthesia-findings.md`

---

## Do Not

- Add audio visualizer clichés (bars, circles that pulse, generic particles)
- Use WebGL unnecessarily (Canvas2D is sufficient and simpler for this art style)
- Add any backend, database, or API dependency
- Use external audio visualization libraries
- Hardcode colors without referencing the frequency→color mapping
- Create multiple AudioContext instances
- Ignore mobile performance — always test on simulated mobile
