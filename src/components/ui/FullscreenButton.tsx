import { Maximize2, Minimize2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

export function FullscreenButton() {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground
        hover:border-white/20 hover:text-foreground transition-all min-h-[36px] min-w-[36px]"
      aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
}
