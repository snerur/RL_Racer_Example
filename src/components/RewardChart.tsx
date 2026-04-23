import { useRef, useEffect } from 'react';
import type { EpisodeRecord } from '../types';

interface Props {
  history: EpisodeRecord[];
}

const CHART_BG = '#0e0e1a';
const GRID_COLOR = 'rgba(255,255,255,0.07)';
const LINE_COLOR = '#ff6b00';
const AVG_COLOR = '#4fc3f7';
const EPS_COLOR = 'rgba(76,175,80,0.7)';
const TEXT_COLOR = '#888';
const ROLLING = 20; // rolling average window

function rollingAvg(data: number[], window: number): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function RewardChart({ history }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 18, right: 14, bottom: 30, left: 48 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CHART_BG;
    ctx.fillRect(0, 0, W, H);

    if (history.length < 2) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for episode data…', W / 2, H / 2);
      return;
    }

    const rewards = history.map((r) => r.reward);
    const epsilons = history.map((r) => r.epsilon);
    const avgs = rollingAvg(rewards, ROLLING);
    const minR = Math.min(...rewards);
    const maxR = Math.max(...rewards, 1);
    const rangeR = maxR - minR || 1;

    const toX = (i: number) => PAD.left + (i / (history.length - 1)) * chartW;
    const toY = (v: number) => PAD.top + chartH - ((v - minR) / rangeR) * chartH;

    // ── Grid ─────────────────────────────────────────────────────────────────
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let g = 0; g <= gridLines; g++) {
      const y = PAD.top + (g / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();

      const val = maxR - (g / gridLines) * rangeR;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), PAD.left - 4, y + 3);
    }

    // ── Epsilon secondary axis (right side, green) ───────────────────────────
    ctx.strokeStyle = EPS_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const ex = toX(i);
      const ey = PAD.top + chartH - epsilons[i] * chartH;
      i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Per-episode reward (blue-ish line) ───────────────────────────────────
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = toX(i);
      const y = toY(rewards[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Rolling average (bold orange) ─────────────────────────────────────────
    ctx.strokeStyle = AVG_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < avgs.length; i++) {
      const x = toX(i);
      const y = toY(avgs[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ── Labels ────────────────────────────────────────────────────────────────
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Episode', PAD.left, H - 4);
    ctx.textAlign = 'right';
    ctx.fillText(history.length.toString(), PAD.left + chartW, H - 4);

    // Legend
    ctx.fillStyle = LINE_COLOR;
    ctx.fillRect(PAD.left, 4, 14, 3);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('Reward', PAD.left + 18, 10);
    ctx.fillStyle = AVG_COLOR;
    ctx.fillRect(PAD.left + 70, 4, 14, 3);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(`${ROLLING}-ep avg`, PAD.left + 88, 10);
    ctx.fillStyle = EPS_COLOR;
    ctx.fillRect(PAD.left + 160, 4, 14, 3);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('ε', PAD.left + 178, 10);
  }, [history]);

  return (
    <div className="panel chart-panel">
      <h3 className="panel-title">Training Progress</h3>
      <canvas
        ref={canvasRef}
        width={310}
        height={180}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
