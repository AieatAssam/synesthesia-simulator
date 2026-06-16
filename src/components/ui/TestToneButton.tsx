import { Music, Music2, Loader2 } from 'lucide-react';

interface Props {
  active: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function TestToneButton({ active, loading, onStart, onStop }: Props) {
  return (
    <button
      onClick={active ? onStop : onStart}
      disabled={loading}
      className={`
        flex items-center justify-center gap-2 rounded-2xl px-5 sm:px-6 py-3 sm:py-3.5
        text-sm font-medium transition-all duration-300
        min-h-[44px] w-full sm:w-auto select-none
        ${active
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 active:scale-95'
          : 'bg-amber-500/10 text-amber-400/80 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={active ? 'Stop test tone' : 'Play test tone'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : active ? (
        <Music2 className="h-4 w-4" />
      ) : (
        <Music className="h-4 w-4" />
      )}
      {loading ? 'Starting…' : active ? 'Stop Tone' : 'Test Tone'}
    </button>
  );
}
