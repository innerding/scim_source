// Operator-seitiges POI-Katalog-Schema.
// Lebt parallel zu RegioContent — der Katalog ist die Plan/Design-Fläche,
// RegioContent ist die validierte Pipeline-Eingabe. Später durch Promotion
// vom Katalog ableitbar.

export type Bucket =
  | 'Points'
  | 'Squares'
  | 'Regenerate'
  | 'Transport'
  | 'Service'
  | 'Help'
  | 'Cluster';

export type Subcategory =
  | 'Points_historical'
  | 'Points_others'
  | 'Square_Rest'
  | 'Square_Move'
  | 'Regenerate_Substanze'
  | 'Regenerate_Water'
  | 'Transport_Vehicle'
  | 'Transport_Parking'
  | 'Service_Sleep'
  | 'Service_Others'
  | 'Help_order'
  | 'Help_emergency'
  | 'Cluster';

// Geometrie-Shape (ann_042 — diskriminierte Union).
// Pro Variante die einfachstmögliche SVG-native Form.
export type GeometryShape =
  | { kind: 'circle';  cx: number; cy: number; r: number }
  | { kind: 'rect';    x: number; y: number; width: number; height: number; rx?: number }
  | { kind: 'polygon'; points: [number, number][] }
  | { kind: 'path';    d: string };

export interface Geometry {
  id: string;                       // 'geo_1_circle' …
  name_display: string;             // 'Kreis', 'Tropfen', … (für UI-Anzeige)
  viewBox: string;                  // meist '0 0 48 48', Hexagon '0 0 46 50'
  fill_role: 'fill' | 'stroke';     // 'stroke' nur beim Hexagon-Ring
  shape: GeometryShape;
  // Pixel-Y-Versatz für das innenliegende Icon, gegenüber der geometrischen
  // Mitte (24,24). Positiv = Icon nach unten; nutzt der Composite-Renderer
  // im Standard-Modus (nicht im Summit-Modus, dort positioniert summitLayout).
  // Default 0. Beispiele: Droplet=5 (Icon in den bauchigen Teil), Triangle=4
  // (Schwerpunkts-Versatz nach unten).
  icon_offset_y?: number;
}

export type CoordStatus = 'exact' | 'estimated' | 'missing';

export interface CatalogPoi {
  id: string;                  // 'poi_001' etc.
  bucket: Bucket;              // 'Squares'
  subcategory: Subcategory;    // 'Square_Rest'
  icon: string;                // 'Fernglas+' (operator-icon-name)
  text: string;                // 'Katzenstein 1349 m'
  coord: [number, number];     // [lon, lat]
  coord_status: CoordStatus;
  cluster?: string;            // 'Sender' — name of cluster the poi belongs to
  is_cluster_identity?: boolean; // true if this POI is the cluster's identity-icon
  raw_notes?: string;          // anything in italics like "(vorher T:Talstation)"
}

export interface CatalogCluster {
  name: string;                // 'Sender'
  hover_text: string;          // 'Grünberg Plateau'
  member_count: number;        // counted from POIs
  identity_poi_id?: string;    // POI that carries the cluster icon
}

export interface PoiCatalogState {
  region_id: string;           // 'gruenberg'
  region_name: string;         // 'Grünberg'
  generated_at: string;        // from md frontmatter or fallback
  pois: CatalogPoi[];
  clusters: CatalogCluster[];
  source: {
    type: 'markdown_runtime';
    path: string;              // where the md came from
  };
  warnings: string[];          // parser/validation warnings
}

// ─── Editor (Phase 3) ─────────────────────────────────────────────────────────
// Overlay-Patches gegen die geparsten Plan-Daten. .md bleibt Source of Truth,
// localStorage hält pro POI-id eine Patch-Entry. Synthetische IDs `new_XXX`
// werden für Editor-eigene Neu-Anlagen vergeben (bis Export).

export interface PoiPatch {
  // Nur für vorhandene Plan-POIs: einzelne Felder überschreiben.
  changes?: Partial<Omit<CatalogPoi, 'id'>>;
  // Plan-POI im Editor als gelöscht markiert.
  deleted?: boolean;
  // Editor-neue POIs: tragen die volle POI-Definition.
  is_new?: boolean;
  new_poi?: CatalogPoi;
}

export interface PoiCatalogEditState {
  region_id: string;
  patches: Record<string, PoiPatch>;  // key = poi id (existing oder synthetic new_XXX)
  next_new_id: number;                // counter für synthetische IDs
  updated_at: string;                  // ISO-String, last write
  schema_version: 1;
}

export interface MergedPoi extends CatalogPoi {
  _isDirty: boolean;
  _isNew: boolean;
  _isDeleted: boolean;
}

export interface MergedCatalog {
  pois: MergedPoi[];
  clusters: CatalogCluster[];
  dirty_count: number;
  new_count: number;
  deleted_count: number;
}
