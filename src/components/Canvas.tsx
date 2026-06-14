import { useRef, useEffect, useCallback } from 'react';
import type { VisualParams } from './visualizers/types';
import { audioEngine } from './AudioEngine';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { renderBackground } from './visualizers/backgroundLayer';
import { renderAurora } from './visualizers/auroraLayer';
import { renderWaveform } from './visualizers/waveformLayer';
import { renderParticles } from './visualizers/particleLayer';
import { renderKaleidoscope } from './visualizers/kaleidoscopeLayer';

interface Props {
  active: boolean;
  mode: VisualParams['mode'];
  sensitivity: number;
  palette: VisualParams['palette'];
}

export function Canvas({ active, mode, sensitivity, palette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef({ width: 0, height: 0 });

  // Resize handler
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

  // Clear canvas when inactive
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

  // Render loop
  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimsRef.current;
    if (width === 0 || height === 0) return;

    const audio = audioEngine.getSnapshot();
    if (!audio) return;

    const params: VisualParams = { mode, sensitivity, palette, width, height };

    // Clear with subtle fade for persistence
    ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // Render layers back-to-front
    renderBackground(ctx, audio, params, dt);
    renderAurora(ctx, audio, params, dt);
    renderWaveform(ctx, audio, params, dt);
    renderParticles(ctx, audio, params, dt);
    renderKaleidoscope(ctx, audio, params, dt);
  }, active);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
