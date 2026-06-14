import { useEffect, useRef } from 'react';

export function useAnimationFrame(
  callback: (dt: number) => void,
  active: boolean
): void {
  const cbRef = useRef(callback);
  const prevTime = useRef(0);
  const rafId = useRef(0);

  cbRef.current = callback;

  useEffect(() => {
    if (!active) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      prevTime.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (prevTime.current === 0) prevTime.current = time;
      const dt = Math.min((time - prevTime.current) / 1000, 0.1); // cap at 100ms
      prevTime.current = time;
      cbRef.current(dt);
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [active]);
}
