import type { TrackDefinition } from '../types';

/**
 * Easy Oval Track
 * Gentle rounded-rectangle loop — ideal for first-time RL training.
 * Wide track (90px) and large-radius corners make it forgiving.
 * Canvas: 800 × 500 px.
 */
export const ovalTrack: TrackDefinition = {
  id: 'oval',
  name: 'Oval Circuit',
  difficulty: 'easy',
  description:
    'A smooth oval loop with wide lanes and gentle curves. Perfect for learning the basics of Q-learning.',
  trackWidth: 90,
  startIndex: 3, // top-center stretch — car starts pointing right
  color: '#2a2a2a',
  obstacles: [],
  waypoints: [
    // Top edge — left to right
    { x: 140, y: 88 },
    { x: 270, y: 72 },
    { x: 400, y: 68 },
    { x: 530, y: 72 },
    { x: 660, y: 88 },
    // Top-right corner
    { x: 715, y: 130 },
    { x: 730, y: 185 },
    // Right edge
    { x: 730, y: 250 },
    { x: 730, y: 315 },
    // Bottom-right corner
    { x: 715, y: 370 },
    { x: 660, y: 412 },
    // Bottom edge — right to left
    { x: 530, y: 428 },
    { x: 400, y: 432 },
    { x: 270, y: 428 },
    { x: 140, y: 412 },
    // Bottom-left corner
    { x: 85, y: 370 },
    { x: 70, y: 315 },
    // Left edge
    { x: 70, y: 250 },
    { x: 70, y: 185 },
    // Top-left corner
    { x: 85, y: 130 },
  ],
};
