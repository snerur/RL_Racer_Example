import type { TrackDefinition } from '../types';

/**
 * Medium — Chicane Challenge
 * A flowing circuit with two S-curve chicanes and a hairpin.
 * Medium track width (65px) means tighter margins.
 * Canvas: 800 × 500 px.
 */
export const chianesTrack: TrackDefinition = {
  id: 'chicanes',
  name: 'Chicane Challenge',
  difficulty: 'medium',
  description:
    'Two flowing chicanes and a tight hairpin demand precise steering. The narrower track width (65 px) leaves less margin for error.',
  trackWidth: 65,
  startIndex: 0,
  color: '#252525',
  obstacles: [
    { id: 'cone-1', cx: 390, cy: 255, radius: 14 },
    { id: 'cone-2', cx: 600, cy: 180, radius: 14 },
  ],
  waypoints: [
    // Start/finish straight (left side, going right)
    { x: 100, y: 245 },
    { x: 200, y: 240 },
    { x: 300, y: 235 },
    // First chicane — left then right
    { x: 360, y: 210 },
    { x: 390, y: 180 },
    { x: 420, y: 215 },
    { x: 450, y: 250 },
    { x: 420, y: 285 },
    { x: 390, y: 310 },
    { x: 420, y: 340 },
    // Sweep into right-side straight
    { x: 470, y: 355 },
    { x: 560, y: 350 },
    // Second chicane — right then left
    { x: 620, y: 340 },
    { x: 650, y: 310 },
    { x: 635, y: 275 },
    { x: 605, y: 255 },
    { x: 630, y: 230 },
    { x: 655, y: 200 },
    { x: 650, y: 165 },
    // Top-right corner sweep
    { x: 710, y: 140 },
    { x: 730, y: 200 },
    { x: 720, y: 270 },
    // Right hairpin
    { x: 700, y: 360 },
    { x: 660, y: 420 },
    { x: 580, y: 445 },
    // Bottom straight — right to left
    { x: 460, y: 450 },
    { x: 340, y: 448 },
    { x: 220, y: 445 },
    // Bottom-left corner
    { x: 110, y: 420 },
    { x: 68, y: 360 },
    { x: 68, y: 290 },
  ],
};
