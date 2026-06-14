import { Mic, MicOff, Loader2 } from 'lucide-react';

interface Props {
  active: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ active, loading, onStart, onStop }: Props) {
  return (
    <button
      onClick={active ? onStop : onStart}
      disabled={loading}
      className={`
        flex items-center justify-center gap-2 rounded-2xl px-8 py-4
        text-base font-semibold transition-all duration-300
        min-h-[56px] min-w-[200px] select-none
        ${active
          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95'
          : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 active:scale-95'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={active ? 'Stop microphone' : 'Start microphone'}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : active ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
      {loading ? 'Starting…' : active ? 'Stop' : 'Start Microphone'}
    </button>
  );
}
