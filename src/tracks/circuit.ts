import type { TrackDefinition } from '../types';

/**
 * Hard — Grand Circuit
 * A full racing circuit with a fast back straight, two tight hairpins,
 * variable-width sections, and three obstacles. Track width 52 px.
 * Canvas: 800 × 500 px.
 */
export const circuitTrack: TrackDefinition = {
  id: 'circuit',
  name: 'Grand Circuit',
  difficulty: 'hard',
  description:
    'A challenging full circuit with sharp hairpins, a narrow chicane, and three obstacles. Mastery requires precise speed management and tight cornering.',
  trackWidth: 52,
  startIndex: 0,
  color: '#1e1e1e',
  obstacles: [
    { id: 'barrier-1', cx: 655, cy: 200, radius: 16 },
    { id: 'barrier-2', cx: 370, cy: 310, radius: 14 },
    { id: 'barrier-3', cx: 165, cy: 295, radius: 15 },
  ],
  waypoints: [
    // Start/Finish straight (left → right)
    { x: 100, y: 250 },
    { x: 200, y: 248 },
    { x: 310, y: 245 },
    // Turn 1: sweeping fast right-hander
    { x: 375, y: 230 },
    { x: 420, y: 200 },
    { x: 455, y: 162 },
    // Short chute — heading right
    { x: 510, y: 148 },
    { x: 575, y: 142 },
    // Turn 2: tight right hairpin
    { x: 638, y: 148 },
    { x: 672, y: 172 },
    { x: 685, y: 205 },
    { x: 675, y: 240 },
    { x: 645, y: 260 },
    // Back straight (heading left)
    { x: 580, y: 270 },
    { x: 500, y: 272 },
    { x: 420, y: 273 },
    // Tight chicane on the back straight
    { x: 368, y: 285 },
    { x: 348, y: 308 },
    { x: 362, y: 330 },
    { x: 395, y: 338 },
    // Continue left
    { x: 320, y: 340 },
    { x: 248, y: 342 },
    // Turn 3: left hairpin (tightest corner)
    { x: 190, y: 338 },
    { x: 155, y: 318 },
    { x: 140, y: 290 },
    { x: 148, y: 262 },
    { x: 170, y: 248 },
    { x: 200, y: 248 },
    // ── Upper loop ────────────────────────────────────────────
    // After start straight, branch up through the top of the circuit
    { x: 440, y: 155 },
    { x: 445, y: 100 },
    { x: 415, y: 72 },
    { x: 360, y: 60 },
    { x: 295, y: 65 },
    { x: 250, y: 85 },
    { x: 228, y: 118 },
    { x: 230, y: 158 },
    { x: 250, y: 190 },
    // ── Lower sweep ───────────────────────────────────────────
    { x: 255, y: 390 },
    { x: 315, y: 422 },
    { x: 400, y: 438 },
    { x: 490, y: 432 },
    { x: 568, y: 412 },
    { x: 618, y: 378 },
    { x: 638, y: 338 },
    { x: 628, y: 300 },
    { x: 600, y: 278 },
  ],
};
