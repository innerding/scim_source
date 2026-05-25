// Globales Container-System: Geometrie + Farbe pro Subkategorie.
// Operator-Konvention vom 2026-05-25, dokumentiert in
// data/grunberg_pois_plan.md → Tabelle 3.

import type { Bucket, Geometry, Subcategory } from './poiCatalog.types';

export interface ContainerSpec {
  bucket: Bucket;
  subcategory: Subcategory;
  geometry: Geometry;
  color: string;           // CSS color literal
  color_label: string;     // German label for UI
  description: string;     // what kind of POIs live here
}

export const CONTAINER_SYSTEM: ContainerSpec[] = [
  // Points — Kreis
  {
    bucket: 'Points', subcategory: 'Points_historical',
    geometry: 'Kreis', color: '#f6d04a', color_label: 'gelb',
    description: 'Bildstock · Bauwerk · Denkmal · Burg · Schloss · Arena',
  },
  {
    bucket: 'Points', subcategory: 'Points_others',
    geometry: 'Kreis', color: '#cad847', color_label: 'gelb-grün',
    description: 'Wasser · Brücke · Botanik · Brunnen · Kirche · Wasserfall · Sendemast',
  },

  // Squares — Quadrat
  {
    bucket: 'Squares', subcategory: 'Square_Rest',
    geometry: 'Quadrat', color: '#6b8e23', color_label: 'oliv-grün',
    description: 'Aussicht · Rast · überdachte Rast (passiv)',
  },
  {
    bucket: 'Squares', subcategory: 'Square_Move',
    geometry: 'Quadrat', color: '#7ed957', color_label: 'hell-grün',
    description: 'Spielplatz · Sport · Attraktion · Aussichtsturm (aktiv)',
  },

  // Regenerate — Tropfen
  {
    bucket: 'Regenerate', subcategory: 'Regenerate_Substanze',
    geometry: 'Tropfen', color: '#5dade2', color_label: 'hell-blau',
    description: 'Geschäft · Imbiss · Gasthaus · Restaurant · Bar',
  },
  {
    bucket: 'Regenerate', subcategory: 'Regenerate_Water',
    geometry: 'Tropfen', color: '#1f4e79', color_label: 'dunkel-blau',
    description: 'Trinkwasser · Klo · See · Hallenbad · Badeplatz',
  },

  // Transport — Rechteck hoch
  {
    bucket: 'Transport', subcategory: 'Transport_Vehicle',
    geometry: 'Rechteck hoch', color: '#a0a8b0', color_label: 'hell-grau',
    description: 'Bergbahn · Schiff · Bus · Bahn',
  },
  {
    bucket: 'Transport', subcategory: 'Transport_Parking',
    geometry: 'Rechteck hoch', color: '#4a5560', color_label: 'dunkel-grau',
    description: 'Parkplatz · Ladestation',
  },

  // Service — Rechteck breit (Scheckkarte)
  {
    bucket: 'Service', subcategory: 'Service_Sleep',
    geometry: 'Rechteck breit', color: '#d4af37', color_label: 'gold',
    description: 'Zelt · Pension · Hotel · Kurhotel',
  },
  {
    bucket: 'Service', subcategory: 'Service_Others',
    geometry: 'Rechteck breit', color: '#d4af37', color_label: 'gold',
    description: 'Mechaniker · Sportgeschäft · Apotheke',
  },

  // Help — Dreieck
  {
    bucket: 'Help', subcategory: 'Help_order',
    geometry: 'Dreieck', color: '#cc6600', color_label: 'dunkel-orange',
    description: 'Sperre · Governance-Hinweis',
  },
  {
    bucket: 'Help', subcategory: 'Help_emergency',
    geometry: 'Dreieck', color: '#ff3300', color_label: 'rot-orange',
    description: 'Apotheke · Arzt · Notruf',
  },

  // Cluster — Hexagon-Ring
  {
    bucket: 'Cluster', subcategory: 'Cluster',
    geometry: 'Hexagon-Ring', color: '#c8389b', color_label: 'magenta',
    description: 'Vereinigung mehrerer POIs (Meta-POI)',
  },
];

export function containerOf(sub: Subcategory): ContainerSpec | undefined {
  return CONTAINER_SYSTEM.find((c) => c.subcategory === sub);
}

export function bucketOf(sub: Subcategory): Bucket | undefined {
  return containerOf(sub)?.bucket;
}
