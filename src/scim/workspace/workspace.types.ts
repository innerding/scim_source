// Workspace-Datenmodell (Phase 2).
//
// Drei Primaer-Objekte:
//   - BoundaryGeometry  → data/geometries/*.json (GeoJSON Feature)
//   - Katalog           → data/*_pois_plan.md   (heute schon vorhanden)
//   - Representation    → data/representations/*.json (referenziert Geometry + Katalog)
//
// Loose Kopplung: ein Katalog kann von mehreren Representations referenziert
// werden. Geometry hingegen 1:1 — eine Representation hat genau eine Geometry,
// die den Namen liefert.

import type { Position } from 'geojson';

// ─── BoundaryGeometry ───────────────────────────────────────────────────────
//
// File-Format ist GeoJSON Feature (Polygon-Geometry). Das ist Industrie-Standard
// und kompatibel mit jedem GIS-Tool (QGIS, mapbox, leaflet, …) — kein eigener
// SCIM-Wrapper. Die Loader-Layer leitet aus der Feature-Properties die SCIM-
// spezifische ID und Metadaten ab.

export interface BoundaryGeometryFile {
  type: 'Feature';
  properties: {
    name: string;             // 'Grünberg' (display name, mehrfach verwendbar)
    region?: string;          // 'Gmunden' (groebere geografische Einordnung)
    source?: string;          // wie/wo wurde gezeichnet
    drawn_at?: string;        // ISO date
    note?: string;            // freier Text
  };
  geometry: {
    type: 'Polygon';
    coordinates: Position[][]; // [outer-ring, [hole-rings...]]
  };
}

// Zur Laufzeit angereicherte Form (mit ID aus Dateinamen)
export interface BoundaryGeometry {
  id: string;                 // 'gruenberg' (aus Dateinamen ohne .json)
  name: string;
  region?: string;
  source?: string;
  drawn_at?: string;
  note?: string;
  polygon: Position[];        // outer-ring als [lon, lat][]
  raw: BoundaryGeometryFile;  // fuer Map-Rendering durchgereicht
}

// ─── Representation ─────────────────────────────────────────────────────────

export interface RepresentationFile {
  schema: 'scim3_representation_v1';
  id: string;                 // 'rep_001' oder kebab-case
  name: string;               // Display-Name (default = Geometry-Name)
  geometry_id: string;        // Referenz auf BoundaryGeometry.id
  catalog_id?: string;        // Referenz auf Catalog.id (z.B. 'gruenberg', 'lichtenberg')
  created_at: string;
  note?: string;
}

// Zur Laufzeit ist file ein 1:1-Abbild — kein eigener Runtime-Typ noetig.
export type Representation = RepresentationFile;

// ─── Katalog-Referenz ───────────────────────────────────────────────────────
//
// Katalog-IDs sind die existierenden region_ids (gruenberg, lichtenberg).
// Hier nur als Lookup-Helfer fuer die Workspace-Listenanzeige.

export interface CatalogRef {
  id: string;                 // 'gruenberg'
  name: string;               // 'Grünberg'
  poi_count: number;
  cluster_count: number;
  warning_count: number;
}
