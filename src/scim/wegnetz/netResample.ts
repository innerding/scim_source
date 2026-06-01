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

// Catmull-Rom-Spline: glättet eine Polylinie, ohne neue STÜTZpunkte zu speichern.
// Die Vertices bleiben (die Kurve läuft exakt durch sie); die Tangente je Punkt
// wird aus den Nachbarn ABGELEITET, und zwischen je zwei Punkten wird das Kurven-
// stück fürs Zeichnen abgetastet (flüchtige Render-Punkte, keine Daten). Enden
// werden gepinnt (Endpunkt verdoppelt) → je Strecke bleiben die Kreuzungen scharf.
// Reine Render-Hilfe: das gespeicherte origin-net bleibt die geraden Segmente.
export function catmullRomSpline(points: LatLng[], samples = 4): LatLng[] {
  if (points.length < 3 || samples < 1) return points.slice();
  const pt = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  const out: LatLng[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    for (let s = 1; s <= samples; s++) {
      const t = s / samples, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, c2: number, d: number) =>
        0.5 * ((2 * b) + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

// ─── Netz-weites Resampling ───────────────────────────────────────────────────
// Jede inNet-Kante wird an ihren Kreuzungspunkten (von ≥2 Kanten geteilte
// Koordinaten) in Strecken zerlegt; jede Strecke wird einzeln resampelt (so
// bleiben Kreuzungen exakt erhalten, kein Stub). Liefert die resampelten
// Strecken-Polylines + Segment-/Größen-Kennzahlen (für das Colour-Mesh-Budget).

import type { PathEdge } from '../regio-content/pathEngine';

export interface NetResampleOptions {
  targetMeters: number;
  minMeters?: number;
  decimals?: number;     // Nachkommastellen-Rundung (Default 6 ≈ 0,11 m)
}

export interface ResampledStretchOut {
  id: string;            // '<edgeId>.<piece>'
  points: LatLng[];      // resampelte, gerundete Strecken-Punkte
}

export interface ResampledNet {
  stretches: ResampledStretchOut[];
  stretchCount: number;
  segmentCount: number;  // Σ (points − 1) über alle Strecken
  pointCount: number;
  geometryBytes: number; // JSON-Größe der gerundeten Strecken-Punkte (statisch, 1×)
  loadArrayBytes: number;// 1 Byte je Segment (volatil, alle 5 Min)
  totalMeters: number;
}

function roundPt([lat, lng]: LatLng, f: number): LatLng {
  return [Math.round(lat * f) / f, Math.round(lng * f) / f];
}

export function resampleNet(edges: PathEdge[], opts: NetResampleOptions): ResampledNet {
  const decimals = opts.decimals ?? 6;
  const f = Math.pow(10, decimals);
  const key = (p: LatLng) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

  // Punkt-Nutzung über alle inNet-Kanten (je Kante einmal gezählt).
  const usage = new Map<string, number>();
  for (const e of edges) {
    if (!e.inNet) continue;
    const seen = new Set<string>();
    for (const p of e.points) {
      const k = key(p);
      if (seen.has(k)) continue;
      seen.add(k);
      usage.set(k, (usage.get(k) ?? 0) + 1);
    }
  }

  const stretches: ResampledStretchOut[] = [];
  for (const e of edges) {
    if (!e.inNet || e.points.length < 2) continue;
    const pts = e.points;
    // An Kreuzungs-Innenpunkten (usage ≥ 2) in Stücke zerlegen.
    let runStart = 0;
    let piece = 0;
    for (let i = 1; i < pts.length; i++) {
      const sharedInterior = i < pts.length - 1 && (usage.get(key(pts[i])) ?? 0) >= 2;
      if (i === pts.length - 1 || sharedInterior) {
        const seg = pts.slice(runStart, i + 1);
        const r = resamplePolyline(seg, opts);
        if (r.points.length >= 2) {
          stretches.push({ id: `${e.id}.${piece}`, points: r.points.map((p) => roundPt(p, f)) });
        }
        runStart = i;
        piece++;
      }
    }
  }

  let segmentCount = 0;
  let pointCount = 0;
  let totalMeters = 0;
  for (const s of stretches) {
    segmentCount += s.points.length - 1;
    pointCount += s.points.length;
    totalMeters += polylineMeters(s.points);
  }
  const geometryBytes = new TextEncoder().encode(
    JSON.stringify(stretches.map((s) => s.points)),
  ).length;

  return {
    stretches,
    stretchCount: stretches.length,
    segmentCount,
    pointCount,
    geometryBytes,
    loadArrayBytes: segmentCount, // 1 B / Segment
    totalMeters,
  };
}
