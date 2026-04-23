import type { Point, TrackDefinition, ProcessedTrack } from '../types';

// ── Catmull-Rom Spline ──────────────────────────────────────────────────────

/** Interpolate a closed Catmull-Rom spline from control points. */
export function catmullRom(points: Point[], samplesPerSegment = 12): Point[] {
  const n = points.length;
  const result: Point[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x, y });
    }
  }

  return result;
}

// ── Derivative helpers ──────────────────────────────────────────────────────

/** Compute unit tangent vectors for each point in a closed polyline. */
function computeTangents(pts: Point[]): Point[] {
  const n = pts.length;
  return pts.map((_, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  });
}

/** Compute unit normal vectors (90° counter-clockwise from tangent). */
function computeNormals(tangents: Point[]): Point[] {
  return tangents.map((t) => ({ x: -t.y, y: t.x }));
}

/** Compute cumulative arc-length array. */
function computeCumDist(pts: Point[]): { cumDist: number[]; totalLength: number } {
  const n = pts.length;
  const cumDist = new Array<number>(n);
  cumDist[0] = 0;
  for (let i = 1; i < n; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cumDist[i] = cumDist[i - 1] + Math.hypot(dx, dy);
  }
  // totalLength includes the wrap-around segment
  const dx = pts[0].x - pts[n - 1].x;
  const dy = pts[0].y - pts[n - 1].y;
  const totalLength = cumDist[n - 1] + Math.hypot(dx, dy);
  return { cumDist, totalLength };
}

// ── Track processing ────────────────────────────────────────────────────────

/**
 * Convert a raw TrackDefinition (sparse control points) into a dense
 * ProcessedTrack with centerline, tangents, normals, and cumulative distances.
 */
export function processTrack(def: TrackDefinition): ProcessedTrack {
  const centerline = catmullRom(def.waypoints, 14);
  const tangents = computeTangents(centerline);
  const normals = computeNormals(tangents);
  const { cumDist, totalLength } = computeCumDist(centerline);

  // Map startIndex from waypoints → centerline
  const samplesPerSegment = 14;
  const startPtIdx = def.startIndex * samplesPerSegment;
  const t = tangents[startPtIdx] ?? tangents[0];
  const startHeading = Math.atan2(t.y, t.x);

  return { definition: def, centerline, tangents, normals, cumDist, totalLength, startHeading, startPtIdx };
}

// ── Closest point search ────────────────────────────────────────────────────

/**
 * Find the index of the centerline point closest to (px, py).
 * Searches ±searchRadius points around hint for efficiency.
 */
export function findClosestIdx(
  px: number,
  py: number,
  centerline: Point[],
  hint: number,
  searchRadius = 60
): number {
  const n = centerline.length;
  let bestDist = Infinity;
  let bestIdx = hint;

  for (let delta = -searchRadius; delta <= searchRadius; delta++) {
    const i = ((hint + delta) % n + n) % n;
    const dx = centerline[i].x - px;
    const dy = centerline[i].y - py;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Compute the signed cross-track error of point (px,py) relative to
 * the track at centerline index idx.
 * Positive = right of track (in direction of travel), negative = left.
 */
export function signedCTE(
  px: number,
  py: number,
  centerline: Point[],
  normals: Point[],
  idx: number
): number {
  const cp = centerline[idx];
  const n = normals[idx];
  const ox = px - cp.x;
  const oy = py - cp.y;
  return ox * n.x + oy * n.y;
}

/**
 * Compute signed heading error: car heading vs track tangent at idx.
 * Positive = pointing to the right of travel direction.
 */
export function headingError(carHeading: number, tangents: Point[], idx: number): number {
  const trackAngle = Math.atan2(tangents[idx].y, tangents[idx].x);
  let err = carHeading - trackAngle;
  // Normalize to (-PI, PI]
  while (err > Math.PI) err -= 2 * Math.PI;
  while (err <= -Math.PI) err += 2 * Math.PI;
  return err;
}

/** Euclidean distance between two points. */
export function dist2(a: Point, b: Point): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * Build left and right edge polylines from centerline for rendering.
 * Returns [leftEdge, rightEdge] — both are parallel arrays to centerline.
 */
export function buildEdges(
  centerline: Point[],
  normals: Point[],
  halfWidth: number
): [Point[], Point[]] {
  const left = centerline.map((p, i) => ({
    x: p.x + normals[i].x * halfWidth,
    y: p.y + normals[i].y * halfWidth,
  }));
  const right = centerline.map((p, i) => ({
    x: p.x - normals[i].x * halfWidth,
    y: p.y - normals[i].y * halfWidth,
  }));
  return [left, right];
}
