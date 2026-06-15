import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Canvas } from './components/Canvas';
import { audioEngine } from './components/AudioEngine';
import { MicButton } from './components/ui/MicButton';
import { TestToneButton } from './components/ui/TestToneButton';
import { ModeSelector } from './components/ui/ModeSelector';
import { SensitivitySlider } from './components/ui/SensitivitySlider';
import { PaletteSelector } from './components/ui/PaletteSelector';
import { FullscreenButton } from './components/ui/FullscreenButton';
import { InfoPanel } from './components/ui/InfoPanel';
import type { VisualParams } from './components/visualizers/types';

export default function App() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<VisualParams['mode']>('full');
  const [sensitivity, setSensitivity] = useState(1.0);
  const [palette, setPalette] = useState<VisualParams['palette']>('synesthete');

  const handleStart = useCallback(async () => {
    // Stop test tone if running
    if (testActive) handleTestStop();
    setError(null);
    setLoading(true);
    try {
      await audioEngine.start();
      audioEngine.setSensitivity(sensitivity);
      setActive(true);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (msg.includes('NotFound')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Could not start: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, [sensitivity]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setActive(false);
  }, []);

  const handleTestStart = useCallback(async () => {
    // Stop mic if running
    if (active) handleStop();
    setError(null);
    setTestLoading(true);
    try {
      await audioEngine.startTest();
      audioEngine.setSensitivity(sensitivity);
      setTestActive(true);
    } catch (err: any) {
      setError(`Test tone error: ${err?.message || 'Unknown'}`);
    } finally {
      setTestLoading(false);
    }
  }, [sensitivity]);

  const handleTestStop = useCallback(() => {
    audioEngine.stop();
    setTestActive(false);
  }, []);

  const handleSensitivity = useCallback((v: number) => {
    setSensitivity(v);
    audioEngine.setSensitivity(v);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Virtual Synesthesia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <InfoPanel />
          <FullscreenButton />
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 min-h-0 relative">
        <Canvas
          active={active || testActive}
          mode={mode}
          sensitivity={sensitivity}
          palette={palette}
        />
        {!active && !testActive && !loading && !testLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground/40">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Tap the button below to begin</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 right-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline text-red-300 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 border-t border-white/5 px-4 py-3 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <MicButton active={active} loading={loading} onStart={handleStart} onStop={handleStop} />
          <TestToneButton active={testActive} loading={testLoading} onStart={handleTestStart} onStop={handleTestStop} />
        </div>

        <div className="space-y-2">
          <ModeSelector mode={mode} onChange={setMode} disabled={active} />
          <SensitivitySlider value={sensitivity} onChange={handleSensitivity} disabled={false} />
          <PaletteSelector palette={palette} onChange={setPalette} disabled={false} />
        </div>
      </div>
    </div>
  );
}
