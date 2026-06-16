interface Props {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}

export function SensitivitySlider({ value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-3 min-h-[44px]">
      <span className="text-xs text-muted-foreground w-20 shrink-0">Sensitivity</span>
      <input
        type="range"
        min={0.2}
        max={2.0}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-primary cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Sensitivity"
      />
    </div>
  );
}
