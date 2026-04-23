import type { CarState, ProcessedTrack, RewardWeights, Obstacle } from '../types';

export interface StepResult {
  reward: number;
  done: boolean;           // episode ended (off-track or max steps)
  lapCompleted: boolean;
  offTrack: boolean;
  hitObstacle: boolean;
}

const CAR_RADIUS = 9; // px — used for obstacle collision detection

/**
 * Compute the reward for one simulation step and determine episode termination.
 *
 * Reward shaping principles:
 *  • Heavy penalty for leaving the track (episode ends immediately)
 *  • Per-collision penalty for obstacles (episode continues)
 *  • Gaussian reward for distance from centerline (max reward at center)
 *  • Small speed reward modulated by forward alignment
 *  • Lap completion bonus (large one-time reward)
 *  • Tiny step penalty to encourage efficiency
 */
export function computeReward(
  car: CarState,
  prevLapCount: number,
  track: ProcessedTrack,
  weights: RewardWeights
): StepResult {
  const halfWidth = track.definition.trackWidth / 2;

  // ── Off-track check ─────────────────────────────────────────────────────
  const offTrack = Math.abs(car.cte) > halfWidth;
  if (offTrack) {
    return { reward: weights.offTrackPenalty, done: true, lapCompleted: false, offTrack: true, hitObstacle: false };
  }

  // ── Obstacle collision check ─────────────────────────────────────────────
  const hitObstacle = track.definition.obstacles.some(
    (obs) => Math.hypot(car.x - obs.cx, car.y - obs.cy) < obs.radius + CAR_RADIUS
  );

  // ── Lap completion ───────────────────────────────────────────────────────
  const lapCompleted = car.lapCount > prevLapCount;

  // ── Gaussian center reward ───────────────────────────────────────────────
  // Peaks at 1.0 when CTE=0; approaches 0 near the edges
  const cteNorm = Math.abs(car.cte) / halfWidth; // [0, 1]
  const centerReward = weights.centerTrack * Math.exp(-2.5 * cteNorm * cteNorm);

  // ── Speed reward (forward-aligned component only) ────────────────────────
  const alignmentFactor = Math.max(0, Math.cos(car.headingError)); // 1 = aligned, 0 = perpendicular
  const speedNorm = (car.speed - 1.2) / (3.8 - 1.2); // [0, 1]
  const speedReward = weights.speed * speedNorm * alignmentFactor;

  // ── Assemble reward ──────────────────────────────────────────────────────
  let reward = weights.stepPenalty + centerReward + speedReward;
  if (hitObstacle) reward += weights.obstaclePenalty;
  if (lapCompleted) reward += weights.lapBonus;

  return { reward, done: false, lapCompleted, offTrack: false, hitObstacle };
}

/** Default reward weights (tuned for fast initial learning). */
export function defaultRewardWeights(): RewardWeights {
  return {
    centerTrack: 1.0,
    speed: 0.4,
    lapBonus: 150.0,
    offTrackPenalty: -80.0,
    obstaclePenalty: -30.0,
    stepPenalty: -0.05,
  };
}
