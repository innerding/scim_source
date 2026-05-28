// Runtime-Router — pathname -> Representation.
//
// Schritt 2 von 4 fuer den R-Konsumenten (siehe ann_067 / docs/runtime_mvp.md).
//
// URL-Schema: scim3.diesenpark.com/<region>/<r-name>
//   z. B.   /boehmerwald/lichtenberg   -> rep-lichtenberg
//
// Diese Datei ist pure / seiteneffektfrei: parsen + matchen, kein React,
// keine DOM-Zugriffe. Der RepresentationContext (Schritt 3) verkabelt sie
// mit `window.location` und stellt die aktive R global bereit.
//
// Match-Regel:
//   slug(geometry.region) === regionSlug
//   UND ( slug(rep.name) === repSlug ODER rep.geometry_id === repSlug )
//
// Region kann (heute) nicht eindeutig aus rep.json gelesen werden — sie wird
// ueber rep.geometry_id -> geometry.properties.region aufgeloest.

import type { BoundaryGeometry, Representation } from '../scim/workspace/workspace.types';

// ─── Slugify ────────────────────────────────────────────────────────────────
//
// Deutsche Umlaute werden expandiert (ä→ae, ö→oe, ü→ue, ß→ss). Alles andere
// ueber NFD + Combining-Marks-Strip. Dann lowercase, Nicht-Alphanum -> '-',
// Mehrfach-Dashes kollabieren, Trim.

const UMLAUT_MAP: Record<string, string> = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
  'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue',
};

export function slugify(input: string): string {
  if (!input) return '';
  const expanded = input.replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT_MAP[c] ?? c);
  const ascii = expanded
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Route ──────────────────────────────────────────────────────────────────

export interface RuntimeRoute {
  regionSlug: string;
  repSlug: string;
}

/**
 * Liest einen pathname und gibt RegionSlug + RepSlug zurueck, wenn das
 * Schema /<region>/<r-name> matcht. Sonst null.
 *
 * Erlaubt Trailing-Slash und beliebige Suffix-Segmente (die werden ignoriert
 * — Stufe 3 bringt evtl. `/<region>/<r>/tour=...`).
 */
export function parseRuntimeUrl(pathname: string): RuntimeRoute | null {
  if (!pathname) return null;
  const segments = pathname.split('/').filter((s) => s.length > 0);
  if (segments.length < 2) return null;

  const regionSlug = slugify(decodeURIComponent(segments[0]));
  const repSlug = slugify(decodeURIComponent(segments[1]));
  if (!regionSlug || !repSlug) return null;

  return { regionSlug, repSlug };
}

// ─── Match ──────────────────────────────────────────────────────────────────

export interface RepresentationMatch {
  representation: Representation;
  geometry: BoundaryGeometry;
}

/**
 * Findet die Representation, deren Geometrie-Region und Name (oder
 * geometry_id) zu Route passen. Erste Match gewinnt.
 *
 * Registry wird injiziert (statt importiert), damit Tests den Match
 * isoliert pruefen koennen.
 */
export function matchRepresentation(
  route: RuntimeRoute | null,
  representations: Representation[],
  geometries: BoundaryGeometry[],
): RepresentationMatch | null {
  if (!route) return null;
  const geometryById = new Map(geometries.map((g) => [g.id, g]));

  for (const rep of representations) {
    const geo = geometryById.get(rep.geometry_id);
    if (!geo) continue;

    const regionMatches = slugify(geo.region ?? '') === route.regionSlug;
    if (!regionMatches) continue;

    const nameMatches = slugify(rep.name) === route.repSlug;
    const geometryIdMatches = slugify(rep.geometry_id) === route.repSlug;
    if (!nameMatches && !geometryIdMatches) continue;

    return { representation: rep, geometry: geo };
  }

  return null;
}

/**
 * Convenience: pathname -> RepresentationMatch | null in einem Schritt.
 */
export function resolveRuntimeUrl(
  pathname: string,
  representations: Representation[],
  geometries: BoundaryGeometry[],
): RepresentationMatch | null {
  return matchRepresentation(parseRuntimeUrl(pathname), representations, geometries);
}
