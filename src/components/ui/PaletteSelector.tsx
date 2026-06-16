import type { PaletteName } from '../visualizers/types';

interface Props {
  palette: PaletteName;
  onChange: (p: PaletteName) => void;
  disabled: boolean;
}

const PALETTES: { value: PaletteName; label: string; colors: string[] }[] = [
  { value: 'synesthete', label: 'Synesthete', colors: ['#ff3333', '#ffcc00', '#33cc33', '#3399ff', '#9933ff'] },
  { value: 'warm', label: 'Warm', colors: ['#cc2200', '#ff6600', '#ffaa00', '#ffdd44', '#ffeebb'] },
  { value: 'cool', label: 'Cool', colors: ['#2266cc', '#4488ee', '#66aaff', '#88ccff', '#aaeeff'] },
  { value: 'neon', label: 'Neon', colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0066', '#00ff66'] },
  { value: 'monochrome', label: 'Mono', colors: ['#334466', '#5577aa', '#7799cc', '#99bbee', '#bbddff'] },
];

export function PaletteSelector({ palette, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PALETTES.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          disabled={disabled}
          className={`
            inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium
            transition-all min-h-[44px]
            ${palette === p.value
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
          aria-pressed={palette === p.value}
        >
          <span className="flex gap-0.5">
            {p.colors.map((c, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </span>
          {p.label}
        </button>
      ))}
    </div>
  );
}
