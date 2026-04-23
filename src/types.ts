// ── Geometry ────────────────────────────────────────────────────────────────
export interface Point { x: number; y: number; }

// ── Track ───────────────────────────────────────────────────────────────────
export interface Obstacle {
  id: string;
  cx: number;   // center x (canvas px)
  cy: number;   // center y (canvas px)
  radius: number;
}

export interface TrackDefinition {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  waypoints: Point[];   // Catmull-Rom control points (closed loop)
  trackWidth: number;   // full track width in px
  obstacles: Obstacle[];
  startIndex: number;   // index into waypoints for car start
  color: string;        // track surface color hex
}

/** Dense centerline computed from TrackDefinition via spline interpolation. */
export interface ProcessedTrack {
  definition: TrackDefinition;
  centerline: Point[];    // ~200-400 evenly distributed points (closed)
  tangents: Point[];      // unit tangent at each centerline point
  normals: Point[];       // unit normal (90° left of tangent)
  cumDist: number[];      // cumulative arc-length to each point
  totalLength: number;    // total arc-length
  startHeading: number;   // radians — computed from tangent at startPtIdx
  startPtIdx: number;     // index into centerline for car start
}

// ── Car / Physics ────────────────────────────────────────────────────────────
export interface CarState {
  x: number;
  y: number;
  heading: number;      // radians; 0=right, PI/2=down (canvas coords)
  speed: number;        // px/step
  closestIdx: number;   // nearest centerline point index
  cte: number;          // signed cross-track error (+ = right of track)
  headingError: number; // signed heading error (+ = pointing right of tangent)
  lapProgress: number;  // how many centerline segments completed this lap
  lapCount: number;
  trail: Point[];       // last N positions for tire-track rendering
}

// ── Actions ──────────────────────────────────────────────────────────────────
export type ActionIdx = 0 | 1 | 2 | 3 | 4;

export const ACTIONS: Readonly<{ id: ActionIdx; label: string; steer: number; targetSpeed: number }[]> = [
  { id: 0, label: 'Hard Left',  steer: -0.10, targetSpeed: 1.8 },
  { id: 1, label: 'Soft Left',  steer: -0.05, targetSpeed: 2.4 },
  { id: 2, label: 'Straight',   steer:  0.00, targetSpeed: 3.2 },
  { id: 3, label: 'Soft Right', steer: +0.05, targetSpeed: 2.4 },
  { id: 4, label: 'Hard Right', steer: +0.10, targetSpeed: 1.8 },
];

export const NUM_ACTIONS = 5;

// ── RL State (Discretized) ───────────────────────────────────────────────────
export interface DiscreteState {
  cteBin: number;       // 0–8 (9 bins)
  headingBin: number;   // 0–6 (7 bins)
  speedBin: number;     // 0–3 (4 bins)
}
// Total state space: 9 × 7 × 4 = 252 states

export type QTable = Map<string, Float32Array>; // state key → [Q(s,a0)…Q(s,a4)]

// ── Hyperparameters ──────────────────────────────────────────────────────────
export interface RLParams {
  alpha: number;        // learning rate
  gamma: number;        // discount factor
  epsilon: number;      // current exploration rate (mutable each episode)
  epsilonDecay: number; // multiplied each episode
  epsilonMin: number;
  maxSteps: number;     // per episode
}

export interface RewardWeights {
  centerTrack: number;       // reward for being near center
  speed: number;             // reward for forward speed
  lapBonus: number;          // one-time reward per lap completion
  offTrackPenalty: number;   // (negative) episode-ending penalty
  obstaclePenalty: number;   // (negative) per-collision penalty
  stepPenalty: number;       // (negative) efficiency penalty per step
}

// ── Statistics ───────────────────────────────────────────────────────────────
export interface EpisodeRecord {
  episode: number;
  reward: number;
  steps: number;
  laps: number;
  epsilon: number;
}

export interface SimStats {
  episode: number;
  episodeStep: number;
  episodeReward: number;
  bestReward: number;
  lapCount: number;
  epsilon: number;
  qtableSize: number;
  isRunning: boolean;
  isTraining: boolean;
  history: EpisodeRecord[];  // last 500 episodes
}

// ── LLM ──────────────────────────────────────────────────────────────────────
export type LLMProvider = 'anthropic' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export type SimSpeed = 1 | 5 | 20 | 50;

export const ANTHROPIC_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
] as const;

export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
] as const;
