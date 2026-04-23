import type { CarState, ProcessedTrack } from '../types';
import { buildEdges } from './trackGeometry';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const GRASS_COLOR = '#1a3d1a';
const ASPHALT_COLOR = '#1e1e1e';
const EDGE_LINE_COLOR = '#e8e8e8';
const CENTER_LINE_COLOR = '#f5c518';
const CAR_BODY_COLOR = '#e63946';
const CAR_WINDSHIELD_COLOR = '#1d3557';
const CAR_HIGHLIGHT = '#ff6b6b';
const TRAIL_COLOR = 'rgba(220,80,60,0.18)';
const OBSTACLE_COLOR = '#f4a261';
const OBSTACLE_STRIPE = '#e63946';
const START_LINE_COLOR = '#ffffff';

// ── Track rendering ──────────────────────────────────────────────────────────

export function drawTrack(ctx: Ctx2D, track: ProcessedTrack): void {
  const { centerline, normals, definition } = track;
  const hw = definition.trackWidth / 2;
  const [left, right] = buildEdges(centerline, normals, hw);
  const n = centerline.length;

  // ── Grass background (already cleared to this color) ───────────────────
  ctx.fillStyle = GRASS_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // ── Asphalt surface (filled polygon between left & right edges) ─────────
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
  // Reverse right edge to close the polygon
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = ASPHALT_COLOR;
  ctx.fill();

  // ── Subtle asphalt texture (fine grid of lighter squares) ───────────────
  // (Light enough to not distract from the car)
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#888';
  for (let i = 0; i < n; i += 4) {
    const cx = centerline[i].x;
    const cy = centerline[i].y;
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
  }
  ctx.restore();

  // ── White edge lines ─────────────────────────────────────────────────────
  const drawEdge = (pts: typeof left) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = EDGE_LINE_COLOR;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  drawEdge(left);
  drawEdge(right);

  // ── Dashed yellow center line ─────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(centerline[0].x, centerline[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(centerline[i].x, centerline[i].y);
  ctx.closePath();
  ctx.strokeStyle = CENTER_LINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([12, 12]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Start / finish line ───────────────────────────────────────────────────
  const si = track.startPtIdx;
  const lp = left[si];
  const rp = right[si];
  const squareSize = 6;
  const count = Math.floor(definition.trackWidth / squareSize);
  const dx = (rp.x - lp.x) / count;
  const dy = (rp.y - lp.y) / count;
  const nx = normals[si].x * squareSize;
  const ny = normals[si].y * squareSize;
  for (let col = 0; col < count; col++) {
    for (let row = 0; row < 2; row++) {
      const bx = lp.x + dx * col - nx * row;
      const by = lp.y + dy * col - ny * row;
      ctx.fillStyle = (col + row) % 2 === 0 ? '#ffffff' : '#222222';
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(0, 0, squareSize, squareSize);
      ctx.restore();
    }
  }
}

// ── Obstacles ────────────────────────────────────────────────────────────────

export function drawObstacles(ctx: Ctx2D, track: ProcessedTrack): void {
  for (const obs of track.definition.obstacles) {
    const r = obs.radius;
    // Cone body
    ctx.beginPath();
    ctx.arc(obs.cx, obs.cy, r, 0, Math.PI * 2);
    ctx.fillStyle = OBSTACLE_COLOR;
    ctx.fill();
    // Stripe
    ctx.beginPath();
    ctx.arc(obs.cx, obs.cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = OBSTACLE_STRIPE;
    ctx.fill();
    // Top dot
    ctx.beginPath();
    ctx.arc(obs.cx, obs.cy, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

// ── Tire trail ────────────────────────────────────────────────────────────────

export function drawTrail(ctx: Ctx2D, car: CarState): void {
  if (car.trail.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(car.trail[0].x, car.trail[0].y);
  for (let i = 1; i < car.trail.length; i++) {
    ctx.lineTo(car.trail[i].x, car.trail[i].y);
  }
  ctx.strokeStyle = TRAIL_COLOR;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ── Car ───────────────────────────────────────────────────────────────────────

const CAR_LENGTH = 20;
const CAR_WIDTH = 11;

export function drawCar(ctx: Ctx2D, car: CarState, flash = false): void {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);

  // Body
  ctx.fillStyle = flash ? '#ff3333' : CAR_BODY_COLOR;
  ctx.beginPath();
  ctx.roundRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH, 3);
  ctx.fill();

  // Windshield
  ctx.fillStyle = CAR_WINDSHIELD_COLOR;
  ctx.beginPath();
  ctx.roundRect(CAR_LENGTH * 0.05, -CAR_WIDTH * 0.35, CAR_LENGTH * 0.4, CAR_WIDTH * 0.7, 2);
  ctx.fill();

  // Highlight stripe
  ctx.fillStyle = CAR_HIGHLIGHT;
  ctx.fillRect(-CAR_LENGTH / 2 + 2, -1, CAR_LENGTH * 0.35, 2);

  // Wheels (four small rectangles)
  ctx.fillStyle = '#111';
  const ww = 4, wh = 3;
  ctx.fillRect(-CAR_LENGTH * 0.35, -CAR_WIDTH / 2 - wh / 2 + 1, ww, wh);
  ctx.fillRect(-CAR_LENGTH * 0.35, CAR_WIDTH / 2 - wh / 2 - 1, ww, wh);
  ctx.fillRect(CAR_LENGTH * 0.2, -CAR_WIDTH / 2 - wh / 2 + 1, ww, wh);
  ctx.fillRect(CAR_LENGTH * 0.2, CAR_WIDTH / 2 - wh / 2 - 1, ww, wh);

  ctx.restore();
}

// ── Debug overlay ─────────────────────────────────────────────────────────────

export function drawDebugOverlay(
  ctx: Ctx2D,
  car: CarState,
  track: ProcessedTrack
): void {
  // CTE line (from car perpendicular to center)
  const cp = track.centerline[car.closestIdx];
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(cp.x, cp.y);
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Heading error arc
  const arcRadius = 22;
  const trackAngle = Math.atan2(track.tangents[car.closestIdx].y, track.tangents[car.closestIdx].x);
  ctx.beginPath();
  ctx.arc(car.x, car.y, arcRadius, trackAngle, car.heading, car.heading < trackAngle);
  ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── HUD overlay ───────────────────────────────────────────────────────────────

export function drawHUD(
  ctx: Ctx2D,
  car: CarState,
  episode: number,
  episodeStep: number,
  episodeReward: number,
  epsilon: number,
  isTraining: boolean,
  mode: 'training' | 'testing'
): void {
  const pad = 10;
  const lineH = 18;
  const boxW = 170;
  const boxH = 6 * lineH + 2 * pad;

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#0a0a12';
  ctx.beginPath();
  ctx.roundRect(pad, pad, boxW, boxH, 6);
  ctx.fill();
  ctx.restore();

  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillStyle = '#ff6b00';
  let y = pad + lineH + 2;
  ctx.fillText(`Episode:  ${episode}`, pad + 8, y); y += lineH;
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText(`Step:     ${episodeStep}`, pad + 8, y); y += lineH;
  ctx.fillText(`Reward:   ${episodeReward.toFixed(1)}`, pad + 8, y); y += lineH;
  ctx.fillText(`ε:        ${epsilon.toFixed(3)}`, pad + 8, y); y += lineH;
  ctx.fillText(`Speed:    ${car.speed.toFixed(1)} px/s`, pad + 8, y); y += lineH;
  ctx.fillStyle = mode === 'training' ? '#4caf50' : '#2196f3';
  ctx.fillText(mode === 'training' ? '● TRAINING' : '● TESTING', pad + 8, y);
}
