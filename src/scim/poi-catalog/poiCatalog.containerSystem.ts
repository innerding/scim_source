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

import type { Bucket, Geometry, Subcategory } from './poiCatalog.types';

// ─── Geometrien ───────────────────────────────────────────────────────────────

export const GEOMETRIES: Geometry[] = [
  {
    id: 'geo_1_circle',
    name_display: 'Kreis',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    shape: { kind: 'circle', cx: 24, cy: 24, r: 18 },
  },
  {
    id: 'geo_2_rectangle',
    name_display: 'Quadrat',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    shape: { kind: 'rect', x: 8, y: 8, width: 32, height: 32, rx: 6 },
  },
  {
    id: 'geo_3_droplet',
    name_display: 'Tropfen',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    // Apex oben, Halbkreis unten, symmetrische Bezier-Seiten.
    shape: { kind: 'path', d: 'M 24 4 C 20 12, 9 22, 9 29 A 15 15 0 0 0 39 29 C 39 22, 28 12, 24 4 Z' },
    // Icon nach unten in die bauchige Hälfte verschieben — nicht auf die Spitze.
    icon_offset_y: 5,
  },
  {
    id: 'geo_4_rectangle_high',
    name_display: 'Rechteck hochkant',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    shape: { kind: 'rect', x: 10, y: 4, width: 28, height: 40, rx: 6 },
  },
  {
    id: 'geo_5_rectangle_wide',
    name_display: 'Rechteck quer',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    shape: { kind: 'rect', x: 4, y: 10, width: 40, height: 28, rx: 6 },
  },
  {
    id: 'geo_6_triangle',
    name_display: 'Dreieck',
    viewBox: '0 0 48 48',
    fill_role: 'fill',
    // Apex 3 px nach unten verschoben gegen optisches "zu hoch"-Empfinden.
    shape: { kind: 'polygon', points: [[24, 7], [44, 41], [4, 41]] },
    // Dreieck-Schwerpunkt liegt unter der geometrischen Mitte; Icon mitziehen.
    icon_offset_y: 4,
  },
  {
    id: 'geo_special_hexagon_ring',
    name_display: 'Hexagon-Ring',
    viewBox: '0 0 46 50',
    fill_role: 'stroke',
    shape: { kind: 'polygon', points: [[23, 0], [46, 12.5], [46, 37.5], [23, 50], [0, 37.5], [0, 12.5]] },
  },
];

export function geometryOf(id: string): Geometry | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}

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
    color: '#0066ff', color_label: 'blau',
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
