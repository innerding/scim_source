// Paket-Vertrag (Umbauplan Phase 0) — die Typen, die Editor (Erzeuger) und
// Ziel-App (Konsument) teilen. REINE TYPEN, kein Verhalten. Maßgebliche Specs:
//   docs/ziel_app_umbauplan.md · docs/anthem_snapshot_spec.md
//
// Drei Horizonte: Shell (Engines, Code) · Origin (mittel, statisch, gestaffelt) ·
// Anthem (kurz, 5-Min-Snapshot). Diese Datei beschreibt die ÜBERTRAGUNGSFORM —
// nicht die internen Editor-Strukturen (ResampledNet etc.).

// ── Segment-Identität (eingefroren) ─────────────────────────────────────────
// Format '<stretchId>#<segIndex>', z.B. '5.0#2'. Quelle: netRoute.netSegments.
export type SegmentId = string;

// ── Anthem — der ausgelieferte 5-Min-Snapshot ───────────────────────────────
// Trägt die NORMALISIERTE LAST [0..1] je Segment, NICHT Farbe (Farbe rechnet die
// Shell-Engine `colorize` app-seitig). Keine Koordinaten — die App mappt
// Index/segId → Geometrie über das Origin-Netz.
export interface AnthemSnapshot {
  kind: 'anthem_snapshot_v1';
  repId: string;
  /** ISO-Zeit im 5-Min-Raster (Sim-Zeit im MVP, globale Sim-Tageszeit). */
  t: string;
  /** Last [0..1] je Segment; Reihenfolge = Origin-Net-Segment-Index. */
  loads: number[];
  /**
   * Nur falls die reine Index-Reihenfolge nicht garantiert werden kann:
   * explizite Segment-IDs parallel zu `loads` (gleiche Länge/Reihenfolge).
   */
  segmentIds?: SegmentId[];
}

// ── Origin — gestaffelt, Manifest-first ─────────────────────────────────────
// L0 boundary = Manifest (unsichtbar): rahmt OSM (bbox) + verlinkt alle weiteren
// Schichten + den Anthem-Endpoint. Die Shell (Orchestrator) zieht L1..L4 in
// Reveal-Reihenfolge nach.

/** [minLon, minLat, maxLon, maxLat] — rahmt die OSM-Kamera. */
export type Bbox = [number, number, number, number];

/** Verweis auf eine nachladbare Origin-Schicht (R2-Key oder URL). */
export interface OriginLayerRef {
  /** Stabiler Partikel-Bezeichner, z.B. 'origin-net'. */
  id: 'origin-net' | 'origin-asset-set' | 'origin-poi-set' | 'origin-pixel-charges';
  ref: string;     // R2-Key / URL
  bytes?: number;  // reale UTF-8-Größe (für Lade-Anzeige), optional
}

export interface OriginManifest {
  kind: 'origin_manifest_v1';
  repId: string;
  repName: string;
  version: number;
  /** Unsichtbar — richtet nur die OSM-Kamera aus. */
  bbox: Bbox;
  /** Boundary-Ring (GeoJSON-Polygon-Koordinaten) für Maskierung/Fokus. */
  boundary: [number, number][];
  /** Endpoint, an dem die App den aktuellen Anthem-Snapshot zieht. */
  anthemEndpoint: string;
  /** Nachladbare Schichten in Reveal-/Lade-Reihenfolge (L1..L4). */
  layers: OriginLayerRef[];
}

// ── Segment-Adjazenz — der App-seitige Routing-Graph (Modell B) ──────────────
// Wird im Editor aus dem Netz abgeleitet und im Origin-Paket (an L1 origin-net)
// mitgeliefert, damit der App-BAK selbst über Segmente routen kann (gewichtet mit
// der Live-Last aus dem Anthem). Reine Nachbarschaft — keine Geometrie.
export interface SegmentAdjacency {
  kind: 'segment_adjacency_v1';
  /** Je Segment-ID die Liste der an einem Endknoten anliegenden Nachbar-Segmente. */
  neighbors: Record<SegmentId, SegmentId[]>;
}
