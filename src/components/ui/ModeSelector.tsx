import type { VisualParams } from '../visualizers/types';

interface Props {
  mode: VisualParams['mode'];
  onChange: (mode: VisualParams['mode']) => void;
  disabled: boolean;
}

const MODES: { value: VisualParams['mode']; label: string }[] = [
  { value: 'full', label: 'Full Experience' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'oscilloscope', label: 'Oscilloscope' },
  { value: 'particles', label: 'Fireworks' },
];

export function ModeSelector({ mode, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          disabled={disabled}
          className={`
            rounded-lg border px-3 py-1.5 text-xs font-medium transition-all min-h-[36px]
            ${mode === m.value
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
          aria-pressed={mode === m.value}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
