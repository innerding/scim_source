// Netz-Resampler — Resample-Stufe von merge → DP → resample.
//
// merge + DP liegen bereits in pathEngine (simplifyNet zerlegt das Netz an
// Kreuzungen in Strecken und läuft DP INNERHALB der Strecken; roundPolyline
// reduziert Nachkommastellen). Diese Datei ergänzt das fehlende Stück:
//
//   resamplePolyline — teilt EINE Strecke in gleich lange Segmente.
//
// Eigenschaften (Spec):
//   - per-Strecke GLEICHE Teilung (kein Kreuzungs-Stub am Ende),
//   - Mindestsegmentlänge (Default 3 m) — kürzere Strecken bleiben 1 Segment,
//   - Zielsegmentlänge steuert die Auflösung (Default 3 m).
//
// Reine Geometrie, isoliert (eigenes Haversine), per Unit-Test geprüft. Das
// Anwenden über das ganze Netz + Segment-ids kommt als nächste Einheit.

export type LatLng = [number, number]; // [lat, lng] — wie PathEdge.points

export interface ResampleOptions {
  targetMeters: number;   // gewünschte Segmentlänge
  minMeters?: number;     // Untergrenze (Default 3)
}

export interface ResampledStretch {
  points: LatLng[];       // N+1 gleichmäßig verteilte Punkte (inkl. Endpunkte)
  segmentCount: number;   // N
  segmentMeters: number;  // L / N (0 bei entartet)
  totalMeters: number;    // Gesamtlänge der Eingangs-Strecke
}

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

// Haversine-Distanz in Metern zwischen zwei [lat, lng]-Punkten.
export function distMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Gesamtlänge einer Polyline (Meter).
export function polylineMeters(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += distMeters(points[i - 1], points[i]);
  return sum;
}

// Wählt die Segmentzahl N: nahe der Zielsegmentlänge, aber so, dass jedes
// Segment ≥ minMeters bleibt. Strecken kürzer als min werden 1 Segment.
function chooseSegmentCount(totalMeters: number, target: number, min: number): number {
  if (totalMeters <= min) return 1;
  const byTarget = Math.max(1, Math.round(totalMeters / target));
  const maxByMin = Math.max(1, Math.floor(totalMeters / min)); // mehr Segmente → kürzer als min
  return Math.min(byTarget, maxByMin);
}

// Setzt einen Punkt im Abstand `dist` (Meter) entlang der Polyline, linear
// zwischen den Original-Stützpunkten interpoliert.
function pointAtDistance(points: LatLng[], cum: number[], dist: number): LatLng {
  if (dist <= 0) return points[0];
  const total = cum[cum.length - 1];
  if (dist >= total) return points[points.length - 1];
  // Segment finden, in dem dist liegt.
  let i = 1;
  while (i < cum.length && cum[i] < dist) i++;
  const segStart = cum[i - 1];
  const segLen = cum[i] - segStart;
  const t = segLen === 0 ? 0 : (dist - segStart) / segLen;
  const a = points[i - 1];
  const b = points[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Teilt eine Strecke in N gleich lange Segmente und liefert N+1 Punkte.
export function resamplePolyline(points: LatLng[], opts: ResampleOptions): ResampledStretch {
  const min = opts.minMeters ?? 3;
  const target = Math.max(opts.targetMeters, min);

  if (points.length < 2) {
    return { points: points.slice(), segmentCount: 0, segmentMeters: 0, totalMeters: 0 };
  }

  // Kumulative Längen je Original-Stützpunkt.
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + distMeters(points[i - 1], points[i]));
  const total = cum[cum.length - 1];

  if (total === 0) {
    return { points: [points[0], points[0]], segmentCount: 1, segmentMeters: 0, totalMeters: 0 };
  }

  const n = chooseSegmentCount(total, target, min);
  const segMeters = total / n;
  const out: LatLng[] = [];
  for (let k = 0; k <= n; k++) out.push(pointAtDistance(points, cum, k * segMeters));

  return { points: out, segmentCount: n, segmentMeters: segMeters, totalMeters: total };
}
