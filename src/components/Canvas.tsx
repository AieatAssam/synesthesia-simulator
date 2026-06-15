import { useRef, useEffect, useCallback } from 'react';
import type { VisualParams } from './visualizers/types';
import { audioEngine } from './AudioEngine';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { renderRippleField } from './visualizers/rippleField';
import { renderSmokeTrails } from './visualizers/smokeTrails';
import { renderStardust } from './visualizers/stardustField';
import { renderDriftShapes } from './visualizers/driftShapes';
import { renderLightFilaments } from './visualizers/lightFilaments';

interface Props {
  active: boolean;
  mode: VisualParams['mode'];
  sensitivity: number;
  palette: VisualParams['palette'];
}

export function Canvas({ active, mode, sensitivity, palette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    dimsRef.current = { width: canvas.width, height: canvas.height };
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    if (!active) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0a0f';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [active]);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimsRef.current;
    if (width === 0 || height === 0) return;

    const audio = audioEngine.getSnapshot();

    // Persistence: gentle clearing for long trails
    ctx.fillStyle = 'rgba(5, 5, 10, 0.025)';
    ctx.fillRect(0, 0, width, height);

    // Silence gate
    if (!audio || audio.volume < 0.002) return;

    const params: VisualParams = { mode, sensitivity, palette, width, height };
    const showAll = mode === 'full';

    // Render back to front. New filament mode added.
    if (showAll || mode === 'ripples') renderRippleField(ctx, audio, params, dt);
    if (showAll || mode === 'shapes') renderDriftShapes(ctx, audio, params, dt);
    if (showAll || mode === 'smoke') renderSmokeTrails(ctx, audio, params, dt);
    if (showAll || mode === 'filaments') renderLightFilaments(ctx, audio, params, dt);
    if (showAll || mode === 'stardust') renderStardust(ctx, audio, params, dt);
  }, active);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
