// Container-System (ann_042) — Geometrien als Code-Konstanten in einer
// diskriminierten Union, Subkategorien als Mapping auf Geometrie-ID + Farbe.
//
// Bucket → Geometrie: 1:1 (alle Subkategorien eines Buckets teilen sich die
// gleiche Form). Cluster ist Sonderfall (siehe ann_043).
//
// Anmerkung: Die in ann_042 vorgeschlagenen Subkategorie-IDs
// (`points_1_historical` etc.) sind die Soll-Nomenklatur. Der aktuelle
// `Subcategory`-Typ in poiCatalog.types.ts verwendet noch die historischen
// IDs (`Points_historical` etc.) — ein Rename trifft auch das Plan-.md-Format
// und ist eigene Aufgabe. Hier wird die historische ID weiterverwendet, die
// Reihenfolge im CONTAINER_SYSTEM-Array entspricht aber bereits der ann_042-
// Position (1_, 2_).

import type { Bucket, Subcategory } from './poiCatalog.types';

// ─── Geometrien ───────────────────────────────────────────────────────────────
// EINE Quelle: das Formen-Vokabular (GEOMETRIES + geometryOf) lebt in shell-kit
// (app/geometry). Hier nur re-exportiert — die Subkategorie→Geometrie+Farbe-
// ZUORDNUNG (CONTAINER_SYSTEM, unten) bleibt katalogseitig (Origin klassifiziert).
export { GEOMETRIES, geometryOf } from 'shell-kit';

// ─── Container-System: Subkategorie → Geometrie + Farbe ──────────────────────

export interface ContainerSpec {
  bucket: Bucket;
  subcategory: Subcategory;
  geometry_id: string;     // Referenz in GEOMETRIES
  color: string;           // CSS-Hex-Literal (z.B. '#ffd700')
  color_label: string;     // Deutsche Bezeichnung für UI
  description: string;     // Was lebt in dieser Subkategorie
}

export const CONTAINER_SYSTEM: ContainerSpec[] = [
  // Points — Kreis
  {
    bucket: 'Points', subcategory: 'Points_historical',
    geometry_id: 'geo_1_circle',
    color: '#ffd700', color_label: 'gelb',
    description: 'Bildstock · Bauwerk · Denkmal · Burg · Schloss · Arena',
  },
  {
    bucket: 'Points', subcategory: 'Points_others',
    geometry_id: 'geo_1_circle',
    color: '#ccff33', color_label: 'gelb-grün',
    description: 'Wasser · Brücke · Botanik · Brunnen · Kirche · Wasserfall · Sendemast',
  },

  // Squares — Quadrat
  {
    bucket: 'Squares', subcategory: 'Square_Rest',
    geometry_id: 'geo_2_rectangle',
    color: '#718c00', color_label: 'oliv-grün',
    description: 'Aussicht · Rast · überdachte Rast (passiv)',
  },
  {
    bucket: 'Squares', subcategory: 'Square_Move',
    geometry_id: 'geo_2_rectangle',
    color: '#a4d000', color_label: 'hell-grün',
    description: 'Spielplatz · Sport · Attraktion · Aussichtsturm (aktiv)',
  },

  // Regenerate — Tropfen
  {
    bucket: 'Regenerate', subcategory: 'Regenerate_Substanze',
    geometry_id: 'geo_3_droplet',
    color: '#87ceeb', color_label: 'hell-blau',
    description: 'Geschäft · Imbiss · Gasthaus · Restaurant · Bar',
  },
  {
    bucket: 'Regenerate', subcategory: 'Regenerate_Water',
    geometry_id: 'geo_3_droplet',
    color: '#0099ff', color_label: 'blau',
    description: 'Trinkwasser · Klo · See · Hallenbad · Badeplatz',
  },

  // Transport — Rechteck hochkant
  {
    bucket: 'Transport', subcategory: 'Transport_Vehicle',
    geometry_id: 'geo_4_rectangle_high',
    color: '#c0c0c0', color_label: 'silber',
    description: 'Bergbahn · Schiff · Bus · Bahn',
  },
  {
    bucket: 'Transport', subcategory: 'Transport_Parking',
    geometry_id: 'geo_4_rectangle_high',
    color: '#7a7a7a', color_label: 'grau',
    description: 'Parkplatz · Ladestation',
  },

  // Service — Rechteck quer (Scheckkarte)
  {
    bucket: 'Service', subcategory: 'Service_Sleep',
    geometry_id: 'geo_5_rectangle_wide',
    color: '#d4a017', color_label: 'gold',
    description: 'Zelt · Pension · Hotel · Kurhotel',
  },
  {
    bucket: 'Service', subcategory: 'Service_Others',
    geometry_id: 'geo_5_rectangle_wide',
    color: '#d4a017', color_label: 'gold',
    description: 'Mechaniker · Sportgeschäft · Apotheke',
  },

  // Help — Dreieck
  {
    bucket: 'Help', subcategory: 'Help_order',
    geometry_id: 'geo_6_triangle',
    color: '#ff8c00', color_label: 'orange',
    description: 'Sperre · Governance-Hinweis',
  },
  {
    bucket: 'Help', subcategory: 'Help_emergency',
    geometry_id: 'geo_6_triangle',
    color: '#ff4e00', color_label: 'rot-orange',
    description: 'Apotheke · Arzt · Notruf',
  },

  // Cluster — Hexagon-Ring (Sonderfall, siehe ann_043)
  {
    bucket: 'Cluster', subcategory: 'Cluster',
    geometry_id: 'geo_special_hexagon_ring',
    color: '#ff00ff', color_label: 'magenta',
    description: 'Vereinigung mehrerer POIs (Meta-POI)',
  },
];

export function containerOf(sub: Subcategory): ContainerSpec | undefined {
  return CONTAINER_SYSTEM.find((c) => c.subcategory === sub);
}

export function bucketOf(sub: Subcategory): Bucket | undefined {
  return containerOf(sub)?.bucket;
}
