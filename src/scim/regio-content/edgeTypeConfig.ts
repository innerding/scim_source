// Edge-Typ-Konfiguration fuer den ColourMesh.
//
// Welche OSM-Highway-Typen sollen ueberhaupt im Mesh erscheinen? Dies ist
// eine *regionale* Routing-Entscheidung — Wander-R will Forststrassen
// drin, Stadt-R will footway/cycleway/residential, Autobahn-R will
// motorway/trunk. Heimat in P02 (rou-Sphaere), persistiert in
// localStorage pro Region.
//
// Zukunft: die Werte wandern in die Representation-Manifeste oder in
// region-spezifische data/regio_content/*.json. Heute reicht ein
// localStorage-Speicher pro Region als Operator-Editier-Modus.

export type OsmHighwayType =
  | 'motorway'
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'unclassified'
  | 'residential'
  | 'service'
  | 'living_street'
  | 'pedestrian'
  | 'track'
  | 'footway'
  | 'path'
  | 'cycleway'
  | 'bridleway'
  | 'steps';

export interface HighwayTypeMeta {
  type: OsmHighwayType;
  label: string;
  group: 'road' | 'service' | 'path';
  hint: string;
}

export const HIGHWAY_TYPES: HighwayTypeMeta[] = [
  { type: 'motorway',      group: 'road',    label: 'Autobahn',          hint: 'Schnellverkehr, in der Regel kein Fussweg' },
  { type: 'trunk',         group: 'road',    label: 'Schnellstrasse',    hint: 'Hoeher klassifizierte Schnellstrasse' },
  { type: 'primary',       group: 'road',    label: 'Bundesstrasse',     hint: 'Hauptverbindung zwischen Orten' },
  { type: 'secondary',     group: 'road',    label: 'Landstrasse',       hint: 'Regionale Verbindung' },
  { type: 'tertiary',      group: 'road',    label: 'Kreisstrasse',      hint: 'Lokale Verbindung' },
  { type: 'unclassified',  group: 'road',    label: 'Nebenstrasse',      hint: 'Niedriger klassifizierte Strasse' },
  { type: 'residential',   group: 'road',    label: 'Wohngebiet',        hint: 'Strasse in Wohngebiet' },
  { type: 'living_street', group: 'road',    label: 'Spielstrasse',      hint: 'Fussgaenger-bevorrechtigt' },
  { type: 'pedestrian',    group: 'service', label: 'Fussgaengerzone',   hint: 'Innerstaedtisch, ohne Auto' },
  { type: 'service',       group: 'service', label: 'Service-Weg',       hint: 'Zufahrt, Parkplatz, Betriebshof' },
  { type: 'track',         group: 'path',    label: 'Forst-/Wirtschaftsweg', hint: 'Unbefestigt, oft mit Schranke' },
  { type: 'footway',       group: 'path',    label: 'Fussweg',           hint: 'Wege fuer Fussgaenger' },
  { type: 'path',          group: 'path',    label: 'Pfad',              hint: 'Allgemeiner Weg ohne Strassenstatus' },
  { type: 'cycleway',      group: 'path',    label: 'Radweg',            hint: 'Wege fuer Fahrraeder' },
  { type: 'bridleway',     group: 'path',    label: 'Reitweg',           hint: 'Wege fuer Pferde' },
  { type: 'steps',         group: 'path',    label: 'Treppe',            hint: 'Hoehenverbindung mit Stufen' },
];

// ─── Defaults ───────────────────────────────────────────────────────────────
//
// Wander-Default: alles ausser Autobahn/Schnellstrasse. Passt fuer
// Lichtenberg / Gruenberg / Boehmerwald — laendlich, viel Pfad-Routing.

const WANDERN_DEFAULT_OFF: OsmHighwayType[] = ['motorway', 'trunk'];

export function defaultIncludedTypes(): OsmHighwayType[] {
  return HIGHWAY_TYPES
    .map((t) => t.type)
    .filter((t) => !WANDERN_DEFAULT_OFF.includes(t));
}

// ─── localStorage-Persistenz pro Region ─────────────────────────────────────

function storageKey(regionSlug: string): string {
  return `scim3_edge_types_${regionSlug || 'default'}`;
}

export function loadIncludedTypes(regionSlug: string): OsmHighwayType[] {
  try {
    const raw = localStorage.getItem(storageKey(regionSlug));
    if (raw) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) {
        const valid = arr.filter((t): t is OsmHighwayType =>
          HIGHWAY_TYPES.some((h) => h.type === t),
        );
        if (valid.length > 0) return valid;
      }
    }
  } catch { /* ignore */ }
  return defaultIncludedTypes();
}

export function saveIncludedTypes(regionSlug: string, types: OsmHighwayType[]): void {
  try {
    localStorage.setItem(storageKey(regionSlug), JSON.stringify(types));
  } catch { /* ignore */ }
}

export function isCustomized(regionSlug: string): boolean {
  try {
    return localStorage.getItem(storageKey(regionSlug)) !== null;
  } catch {
    return false;
  }
}

export function resetIncludedTypes(regionSlug: string): void {
  try { localStorage.removeItem(storageKey(regionSlug)); } catch { /* ignore */ }
}
