import { useRef, useEffect, useCallback } from 'react';
import type { ProcessedTrack } from '../types';
import { drawTrack, drawObstacles, drawTrail, drawCar, drawHUD, drawDebugOverlay } from '../engine/renderer';

interface SimulationCanvasProps {
  processedTrack: ProcessedTrack;
  coreRef: React.MutableRefObject<{
    car: import('../types').CarState;
    track: ProcessedTrack;
    episode: number;
    episodeStep: number;
    episodeReward: number;
    rlParams: import('../types').RLParams;
    mode: 'training' | 'testing';
    isRunning: boolean;
  }>;
  showDebug: boolean;
}

const CANVAS_W = 800;
const CANVAS_H = 500;

export function SimulationCanvas({ processedTrack, coreRef, showDebug }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackCacheRef = useRef<OffscreenCanvas | null>(null);
  const lastTrackIdRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  // ── Pre-render track to an offscreen canvas ──────────────────────────────
  const buildTrackCache = useCallback((track: ProcessedTrack) => {
    const oc = new OffscreenCanvas(CANVAS_W, CANVAS_H);
    const octx = oc.getContext('2d')!;
    drawTrack(octx, track);
    drawObstacles(octx, track);
    trackCacheRef.current = oc;
    lastTrackIdRef.current = track.definition.id;
  }, []);

  // Build track cache on mount / track change
  useEffect(() => {
    buildTrackCache(processedTrack);
  }, [processedTrack, buildTrackCache]);

  // ── Render loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const render = () => {
      const core = coreRef.current;
      const track = core.track;

      // Rebuild track cache if track changed
      if (track.definition.id !== lastTrackIdRef.current) {
        buildTrackCache(track);
      }

      // Blit the cached track (fast — no redraw of complex geometry)
      if (trackCacheRef.current) {
        ctx.drawImage(trackCacheRef.current, 0, 0);
      }

      // Trail, car, overlays
      drawTrail(ctx, core.car);
      if (showDebug) drawDebugOverlay(ctx, core.car, track);
      drawCar(ctx, core.car);
      drawHUD(
        ctx,
        core.car,
        core.episode,
        core.episodeStep,
        core.episodeReward,
        core.rlParams.epsilon,
        core.isRunning,
        core.mode
      );

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [coreRef, showDebug, buildTrackCache]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="sim-canvas"
        aria-label="RL Racer simulation canvas"
      />
    </div>
  );
}
