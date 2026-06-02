// Pfad ↔ Netz-Zuordnung (Umbauplan #2 · S1). Fundament für BCK (Comfort: welche
// Segmente liegen auf der Route?) und BAK/Playbook (Segment-Zählung: welche
// Segmente nutzt ein gerouteter Pfad?). Rein, panel-unabhängig.

import type { ResampledNet, LatLng } from '../wegnetz/netResample';

export interface NetSegment {
  id: string;        // '<stretchId>#<segIndex>'
  a: LatLng;
  b: LatLng;
  mid: LatLng;
}

// Flache Liste aller Segmente des resampelten Netzes (mit stabiler id + Mitte).
export function netSegments(net: ResampledNet): NetSegment[] {
  const out: NetSegment[] = [];
  for (const s of net.stretches) {
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1], b = s.points[i];
      out.push({ id: `${s.id}#${i - 1}`, a, b, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] });
    }
  }
  return out;
}

const M_LAT = 111195; // m pro Breitengrad (lokal-planar, ausreichend)

// Senkrecht-Abstand (m) eines Punkts zur Strecke a–b (auf das Stück geklemmt).
function distToSegMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const mLng = 111320 * Math.cos((p[0] * Math.PI) / 180);
  const px = p[1] * mLng, py = p[0] * M_LAT;
  const ax = a[1] * mLng, ay = a[0] * M_LAT;
  const bx = b[1] * mLng, by = b[0] * M_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Min-Abstand (m) eines Punkts zu einer Polyline.
export function distToPath(p: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) {
    const mLng = 111320 * Math.cos((p[0] * Math.PI) / 180);
    return Math.hypot((p[1] - path[0][1]) * mLng, (p[0] - path[0][0]) * M_LAT);
  }
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = distToSegMeters(p, path[i - 1], path[i]);
    if (d < best) best = d;
  }
  return best;
}

// Segment-ids, die ein Pfad überdeckt: Segment-Mitte näher als tol an der
// Pfad-Polylinie. Grundlage fürs Zählen (Playbook) und den Comfort-Check.
export function coveredSegmentIds(segments: NetSegment[], path: LatLng[], tolMeters = 8): string[] {
  return segments.filter((s) => distToPath(s.mid, path) <= tolMeters).map((s) => s.id);
}
