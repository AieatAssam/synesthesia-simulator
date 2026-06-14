import { useState } from 'react';
import { Info, X } from 'lucide-react';

export function InfoPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground
          hover:border-white/20 hover:text-foreground transition-all min-h-[36px] min-w-[36px]"
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
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold mb-3">About Virtual Synesthesia</h2>

            <p className="text-sm text-muted-foreground mb-4">
              This app simulates <strong className="text-foreground">chromesthesia</strong> — a form of
              synesthesia where sound involuntarily evokes visual experiences of color, shape, and movement.
            </p>

            <h3 className="text-sm font-semibold mb-2">The Visual Layers</h3>
            <ul className="text-xs text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">Background</strong> — Klüver form constants (tunnels, spirals, honeycombs) common in synesthetic and hallucinatory experience.</li>
              <li><strong className="text-foreground">Aurora</strong> — Frequency spectrum mapped to a rainbow color band. Low pitches=red, high=violet (Itoh et al. 2017).</li>
              <li><strong className="text-foreground">Oscilloscope</strong> — Waving metallic lines tracing the sound waveform, as described by synesthete Deni Simon.</li>
              <li><strong className="text-foreground">Fireworks</strong> — Particle bursts triggered by sudden sounds, per Cytowic's "something like fireworks" account.</li>
              <li><strong className="text-foreground">Kaleidoscope</strong> — Geometric symmetry during complex harmony, inspired by Tori Amos's experience.</li>
            </ul>

            <h3 className="text-sm font-semibold mb-2">Key Research</h3>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>Ramachandran &amp; Hubbard (2001, 2005) — Cross-activation theory</li>
              <li>Ward et al. (2006) — Pitch→brightness is universal</li>
              <li>Itoh et al. (2017) — Rainbow hue ordering of pitch classes</li>
              <li>Cytowic &amp; Eagleman (2009) — <em>Wednesday Is Indigo Blue</em></li>
            </ul>

            <p className="text-xs text-muted-foreground/60">
              Read the full research compilation in the project repository.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
