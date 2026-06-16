import { useState } from 'react';
import { Info, X } from 'lucide-react';

export function InfoPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-lg border border-white/10
          bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground
          transition-all h-11 w-11"
        aria-label="About synesthesia"
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 inline-flex items-center justify-center
                text-muted-foreground hover:text-foreground h-11 w-11"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold mb-3">Virtual Synesthesia</h2>

            <p className="text-sm text-muted-foreground mb-4">
              A real-time simulation of <strong className="text-foreground">chromesthesia</strong> —
              sound→color synesthesia — grounded in peer-reviewed neuroscience and first-person
              accounts. Every visual behaviour is traceable to documented synesthetic experience.
            </p>

            <h3 className="text-sm font-semibold mb-2">The 5 Visual Layers</h3>
            <ul className="text-xs text-muted-foreground space-y-2 mb-4">
              <li>
                <strong className="text-foreground">RippleField</strong> — Expanding concentric rings
                pulsing outward from bass energy, with a central gravitational glow. Based on
                Klüver (1926) form constants and P1's "pulsating outwards… gravitational vacuum"
                (Savickaite et al. 2023).
              </li>
              <li>
                <strong className="text-foreground">DriftShapes</strong> — Persistent geometric shapes
                (circles, triangles, hexagons) placed at pitch-mapped positions. High pitch = higher
                on screen (Ward 2006). Timbre controls round/angular and saturation (Reuter 2025).
                Driven by Chiou et al. (2013): synesthetes see specific shapes at specific locations.
              </li>
              <li>
                <strong className="text-foreground">SmokeTrails</strong> — Soft radial-gradient
                particles with ember cores and metallic flow lines. Captures the "smoke, cloudiness,
                embers" texture repeatedly described by synesthetes (P1, P2 — Savickaite 2023)
                and Deni Simon's "waving lines… metallic with depth."
              </li>
              <li>
                <strong className="text-foreground">Stardust</strong> — Hypersensitive sparkle
                particles with glow halos and cross-shaped scintillation. Ambient, burst, and orbital
                modes. 8–20Hz flicker. "Stars in your eyes… electric bits… yellow and sparkly"
                (P1, Savickaite 2023; Cytowic "fireworks").
              </li>
              <li>
                <strong className="text-foreground">LightFilaments</strong> — Bézier-curved luminous
                strands that drift through 3D depth with parallax motion. Three-pass glow rendering
                (halo→mid→core). Scintillation dots travel along active strands. Captures Tori Amos's
                "light filament architecture" and Deni Simon's "lines moving in color with depth."
              </li>
            </ul>

            <h3 className="text-sm font-semibold mb-2">Audio Features Extracted</h3>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li><strong className="text-foreground">Spectral centroid</strong> — primary hue driver, timbre indicator</li>
              <li><strong className="text-foreground">Harmonicity</strong> — drives saturation (Reuter 2025: harmonic = rich color)</li>
              <li><strong className="text-foreground">Percussive loudness</strong> — drives lightness + texture roughness</li>
              <li><strong className="text-foreground">Spectral spread</strong> — texture indicator, drives edge roughness</li>
              <li><strong className="text-foreground">Low/mid/high energy bands</strong> — spawn rates, spatial placement</li>
              <li><strong className="text-foreground">Onset detection</strong> — triggers particle bursts</li>
              <li><strong className="text-foreground">RMS volume</strong> — size, spread, alpha modulation</li>
            </ul>

            <h3 className="text-sm font-semibold mb-2">Key Research</h3>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>Ramachandran &amp; Hubbard (2001, 2005) — Cross-activation theory</li>
              <li>Ward et al. (2006) — Pitch→brightness is universal; pitch→spatial position</li>
              <li>Itoh et al. (2017) — Rainbow hue ordering of pitch classes</li>
              <li>Chiou et al. (2013) — Shapes at specific spatial locations</li>
              <li>Savickaite et al. (2023) — VR recreation; texture, movement, 3D essential</li>
              <li>Reuter et al. (2025) — Timbre→color rules via harmonicity + percussiveness</li>
              <li>Koenig et al. (2026) — Frequency→spatial location is universal</li>
              <li>Cytowic &amp; Eagleman (2009) — <em>Wednesday Is Indigo Blue</em></li>
            </ul>

            <p className="text-xs text-muted-foreground/60">
              Full research compilation at{' '}
              <code className="text-[10px] bg-white/5 px-1 py-0.5 rounded">research/chromesthesia-findings.md</code>.
              Toggle layers via the mode selector. Use <strong className="text-foreground/60">Test Tone</strong> for
              no-mic testing — synthetic oscillator with frequency sweep.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
