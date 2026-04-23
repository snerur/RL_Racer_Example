import type { DiscreteState, QTable, ActionIdx, RLParams, CarState } from '../types';
import { NUM_ACTIONS, ACTIONS } from '../types';

// ── State key ────────────────────────────────────────────────────────────────

export function stateKey(s: DiscreteState): string {
  return `${s.cteBin},${s.headingBin},${s.speedBin}`;
}

// ── State discretization ─────────────────────────────────────────────────────

const CTE_BINS = 9;        // -4..+4
const HEADING_BINS = 7;    // -3..+3
const SPEED_BINS = 4;      // 0..3
const MAX_SPEED_BIN = 3.8; // px/step

/**
 * Map continuous car state → discrete (cteBin, headingBin, speedBin).
 *
 * cteBin:     normalized CTE in [-1,1] → 9 bins  (0=far left, 8=far right)
 * headingBin: heading error in [-PI/2,PI/2] → 7 bins (0=far left, 6=far right)
 * speedBin:   speed in [1.2, 3.8] → 4 bins (0=slow, 3=fast)
 */
export function discretize(car: CarState, trackHalfWidth: number): DiscreteState {
  // CTE: normalized to [-1, 1], clamped
  const cteNorm = Math.max(-1, Math.min(1, car.cte / trackHalfWidth));
  // Map [-1,1] → [0, 8]
  const cteBin = Math.min(CTE_BINS - 1, Math.max(0, Math.round((cteNorm + 1) / 2 * (CTE_BINS - 1))));

  // Heading error: clamped to [-PI/2, PI/2]
  const heClamped = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, car.headingError));
  const heNorm = heClamped / (Math.PI / 2); // [-1, 1]
  const headingBin = Math.min(HEADING_BINS - 1, Math.max(0, Math.round((heNorm + 1) / 2 * (HEADING_BINS - 1))));

  // Speed bin
  const speedFrac = (car.speed - 1.2) / (MAX_SPEED_BIN - 1.2);
  const speedBin = Math.min(SPEED_BINS - 1, Math.max(0, Math.floor(speedFrac * SPEED_BINS)));

  return { cteBin, headingBin, speedBin };
}

// ── Q-table helpers ──────────────────────────────────────────────────────────

/** Get (or lazily-create) the Q-value array for a state. */
export function getQValues(qtable: QTable, state: DiscreteState): Float32Array {
  const key = stateKey(state);
  let vals = qtable.get(key);
  if (!vals) {
    vals = new Float32Array(NUM_ACTIONS); // initialized to 0
    qtable.set(key, vals);
  }
  return vals;
}

/** Return the action index with the highest Q-value (argmax). */
export function bestAction(qvals: Float32Array): ActionIdx {
  let best = 0;
  for (let i = 1; i < qvals.length; i++) {
    if (qvals[i] > qvals[best]) best = i;
  }
  return best as ActionIdx;
}

/** ε-greedy action selection. */
export function selectAction(qtable: QTable, state: DiscreteState, epsilon: number): ActionIdx {
  if (Math.random() < epsilon) {
    return (Math.floor(Math.random() * NUM_ACTIONS)) as ActionIdx;
  }
  return bestAction(getQValues(qtable, state));
}

// ── Bellman update ───────────────────────────────────────────────────────────

/**
 * Q(s,a) ← Q(s,a) + α · [r + γ · max_a' Q(s',a') - Q(s,a)]
 *
 * Returns the TD error (useful for debugging / diagnostics).
 */
export function updateQ(
  qtable: QTable,
  state: DiscreteState,
  action: ActionIdx,
  reward: number,
  nextState: DiscreteState,
  done: boolean,
  params: RLParams
): number {
  const qCurrent = getQValues(qtable, state);
  const qNext = getQValues(qtable, nextState);

  const maxNext = done ? 0 : Math.max(...Array.from(qNext));
  const target = reward + params.gamma * maxNext;
  const tdError = target - qCurrent[action];
  qCurrent[action] += params.alpha * tdError;

  return tdError;
}

/** Decay epsilon by one episode. */
export function decayEpsilon(params: RLParams): void {
  params.epsilon = Math.max(params.epsilonMin, params.epsilon * params.epsilonDecay);
}

/** Create a default QTable. */
export function createQTable(): QTable {
  return new Map<string, Float32Array>();
}

/** Reset a QTable in place. */
export function resetQTable(qtable: QTable): void {
  qtable.clear();
}
