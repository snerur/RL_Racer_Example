import type { CarState, ActionIdx, ProcessedTrack } from '../types';
import { ACTIONS } from '../types';
import { findClosestIdx, signedCTE, headingError } from './trackGeometry';

export const TRAIL_LENGTH = 70;
const SPEED_LERP = 0.18; // how quickly speed converges to target each step
const MIN_SPEED = 1.2;   // px / step
const MAX_SPEED = 3.8;   // px / step

/** Create a fresh CarState at the track start. */
export function createCar(track: ProcessedTrack): CarState {
  const { centerline, startPtIdx, startHeading, tangents, normals } = track;
  const startPt = centerline[startPtIdx];

  return {
    x: startPt.x,
    y: startPt.y,
    heading: startHeading,
    speed: ACTIONS[2].targetSpeed, // straight speed
    closestIdx: startPtIdx,
    cte: 0,
    headingError: 0,
    lapProgress: 0,
    lapCount: 0,
    trail: [],
  };
}

/**
 * Advance the car by one physics step.
 * Applies steering + target-speed control, updates position, and
 * recomputes CTE / heading error relative to the track.
 *
 * Returns a new CarState (immutable update).
 */
export function stepCar(
  car: CarState,
  actionIdx: ActionIdx,
  track: ProcessedTrack
): CarState {
  const action = ACTIONS[actionIdx];

  // 1. Update heading
  const newHeading = car.heading + action.steer;

  // 2. Lerp speed toward action's target speed
  const newSpeed = clamp(
    car.speed + SPEED_LERP * (action.targetSpeed - car.speed),
    MIN_SPEED,
    MAX_SPEED
  );

  // 3. Kinematic position update
  const newX = car.x + Math.cos(newHeading) * newSpeed;
  const newY = car.y + Math.sin(newHeading) * newSpeed;

  // 4. Update closest centerline point
  const n = track.centerline.length;
  const newClosestIdx = findClosestIdx(newX, newY, track.centerline, car.closestIdx, 80);

  // 5. Cross-track error & heading error
  const newCTE = signedCTE(newX, newY, track.centerline, track.normals, newClosestIdx);
  const newHE = headingError(newHeading, track.tangents, newClosestIdx);

  // 6. Lap progress (monotonically increasing; wraps for multi-lap)
  // "progress" counts how many centerline segments the car has advanced.
  const rawDelta = (newClosestIdx - car.closestIdx + n) % n;
  // Reject backward jumps (rawDelta > n/2 means we went backward)
  const progressDelta = rawDelta < n / 2 ? rawDelta : 0;
  const newProgress = car.lapProgress + progressDelta;

  // 7. Lap count (each time progress crosses the total centerline length)
  const lapCount = Math.floor(newProgress / n);

  // 8. Trail
  const newTrail = [...car.trail, { x: car.x, y: car.y }].slice(-TRAIL_LENGTH);

  return {
    x: newX,
    y: newY,
    heading: newHeading,
    speed: newSpeed,
    closestIdx: newClosestIdx,
    cte: newCTE,
    headingError: newHE,
    lapProgress: newProgress,
    lapCount,
    trail: newTrail,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
