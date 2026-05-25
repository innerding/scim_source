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

export type Geometry =
  | 'Kreis'
  | 'Quadrat'
  | 'Tropfen'
  | 'Rechteck hoch'
  | 'Rechteck breit'
  | 'Dreieck'
  | 'Hexagon-Ring';

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
