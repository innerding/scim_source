// Drawer-Panel (ann_072, Phase 1+2) — frueher Geometry-Editor.
//
// Zwei interne Tabs auf einem gemeinsamen Leaflet-Canvas:
//   Umriss  — Boundary-Geometrie zeichnen/editieren/committen (Funktion 1:1
//             wie der fruehere Geometry-Editor)
//   Wegnetz — konfigurierbares Wanderwegnetz aus OSM (Filter-Menue). Ab
//             Phase 3 lebt der Primaer-/Ausschluss-Filter: "Anwenden" laedt
//             OSM (Overpass) fuer die Region-Boundary und zeichnet die
//             primaeren Wege. Konnektoren/Luecken/Sackgassen folgen ab Phase 4.
//
// Der Tab-Wechsel re-initialisiert die Karte NICHT — Map-Init und View-State
// sind shared, nur die aktiven Werkzeuge/Layer wechseln.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { Position } from 'geojson';
import { GEOMETRIES } from '../../workspace/workspace.registry';
import { type HandoffNet } from '../../workspace/draftHandoff';
import { getDraft, createDraft, updateDraft, localStorageBytes } from '../../workspace/draftStore';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import RepresentBuildTetrahedron from '../RepresentBuildTetrahedron';
import type { RepresentBuildFace } from '../RepresentBuildTetrahedron';
import { useInspectorView } from '../../../runtime/repContext';
import {
  loadPathConfig, savePathConfig, type PathConfig, type BridlewayMode,
} from '../../regio-content/pathConfig';
import {
  deriveWanderwegnetz, anchorPois, cropNetToMask, netStats, formatBytes, isAsphalt, connectorPieceBetween, roundPolyline, simplifyNet,
  type PathFetchResult, type AnchorSummary, type PoiInput, type CropResult,
  type PathEdge, type GateNode,
} from '../../regio-content/pathEngine';
import { graphCompose, bridgeGaps, filterEdges, netzComponents, type NetGraphEdge } from '../../regio-content/netGraph';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import gruenbergMd from '../../../../data/gruenberg_pois_plan.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

const CATALOGS = [
  { id: 'gruenberg', name: 'Grünberg', md: gruenbergMd as string },
  { id: 'lichtenberg', name: 'Lichtenberg', md: lichtenbergMd as string },
];

export const DRAFT_KEY = 'scim3_geometry_draft';

// Slot-Stile (Umbauplan B): Slot 1 = editierbare Boundary (blau, durchgezogen),
// Slot 2 = Masken-Boundary (orange, gestrichelt) zum Drueberzeichnen ueber das Netz.
const SLOT1_COLOR = '#0074d9';
// Maske = rot-gestrichelt (F6). Violett ist für die Inspector-Representations-
// Boundary reserviert, daher rot für die Wegnetz-Crop-Maske.
const SLOT2_COLOR = '#e53e3e';
// Reifefarbe der editierbaren Draft-Boundary (F6): gelb ohne Katalog, orange mit.
const DRAFT_STROKE_GELB = '#ecc94b';
const DRAFT_STROKE_ORANGE = '#ed8936';
const SLOT2_DASH = '6 4';

type DrawerTab = 'umriss' | 'wegnetz';

// Koordinaten-Schlüssel (wie in netGraph): zum Abgleich Gate-POI ↔ Graph-Knoten.
const poiCoordKey = (lat: number, lng: number): string => `${lat.toFixed(7)},${lng.toFixed(7)}`;

// UÖ1: KEINE Geoman-Default-Toolbar mehr. Zeichnen/Bearbeiten werden über eigene
// Umriss-Werkzeuge (Tool-Header links) per pm.enableDraw('Polygon') bzw.
// per-Layer-Edit gesteuert — kein Rechteck, kein globales disable*.

// F7: ein Wegnetz (HandoffNet-Form) aus Kanten + Gates bauen. Nur Netz-Kanten
// (inNet). Wird für draft.net_unmasked (roh) und draft.net_masked (gecroppt) genutzt.
function buildNet(
  edges: PathEdge[], gates: GateNode[], cropped: boolean, gebiet: string, gebietName: string,
): HandoffNet {
  const net = edges.filter((e) => e.inNet);
  return {
    gebiet, gebietName, edges: net, gates, cropped,
    primaryCount: net.filter((e) => e.source === 'primary').length,
    connectorCount: net.filter((e) => e.source !== 'primary').length,
  };
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

interface Props {
  onJumpTo: (panelId: string) => void;
  // Beim Oeffnen aus dem Workspace: diese Boundary-Geometry laden statt des Drafts.
  openGeometryId?: string | null;
  onGeometryConsumed?: () => void;
}

export default function DrawerPanel({ onJumpTo, openGeometryId, onGeometryConsumed }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);
  const maskLayerRef = useRef<L.Layer | null>(null);
  // F6b: invertiertes Fill (außen getönt, innen klar) — zeigt die Innen/Außen-
  // Gatekeeper-Rolle der Draft-Boundary. Eigener, nicht-interaktiver Overlay-Layer
  // (Welt-Rechteck mit der Boundary als Loch), damit das Geoman-Editieren der
  // eigentlichen Boundary unberührt bleibt.
  const invFillLayerRef = useRef<L.Polygon | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectorRefRef = useRef<L.Polygon | null>(null);
  const pathLayerRef = useRef<L.LayerGroup | null>(null);
  const anchorLayerRef = useRef<L.LayerGroup | null>(null);
  const poiConnectLayerRef = useRef<L.LayerGroup | null>(null);
  const gateLayerRef = useRef<L.LayerGroup | null>(null);
  const pathAbortRef = useRef<AbortController | null>(null);

  const [tab, setTab] = useState<DrawerTab>('umriss');

  // Wegnetz-Ableitung (Phase 3): Status + letztes Ergebnis fuer die Legende.
  type PathStatus = 'idle' | 'loading' | 'done' | 'error';
  const [pathStatus, setPathStatus] = useState<PathStatus>('idle');
  const [pathError, setPathError] = useState<string>('');
  const [pathResult, setPathResult] = useState<PathFetchResult | null>(null);
  const [anchorSummary, setAnchorSummary] = useState<AnchorSummary | null>(null);
  // Maskierung/Crop (Umbauplan D): Ergebnis des Zuschnitts mit der Slot-2-Maske.
  const [cropResult, setCropResult] = useState<CropResult | null>(null);

  // US3: Anwenden lebt jetzt im Tool-Header (rechts, unter Beschneiden). Dafür
  // muss die Filter-Config eine Ebene hoch (currentCfg) und ein „dirty seit
  // letztem Anwenden"-Signal (appliedCfgSig) → der Button pulst bei Bedarf.
  const [currentCfg, setCurrentCfg] = useState<PathConfig | null>(null);
  const [appliedCfgSig, setAppliedCfgSig] = useState<string | null>(null);
  // Längen-Summen fürs Footer-Feld. „Netz" = nur SCHWARZE Komponenten (≥ Schwelle),
  // darin Wanderweg + Asphalt; „rest" = grüne Komponenten (vom Netz exkludiert).
  const [netSummary, setNetSummary] = useState<{ net: number; wander: number; asphalt: number; rest: number; bytes: number; points: number } | null>(null);
  // Datengröße-Reduktion (Footer): DP-Korridor (Punkte entfernen, ±eps garantiert)
  // + Nachkommastellen (Ziffern kürzen). Toleranzen addieren sich → unter 0,33 m.
  const [dpEps, setDpEps] = useState(0);
  const [coordDecimals, setCoordDecimals] = useState(7);

  // E2b — Konnektivitätsfärbung: Komponenten ≥ netLenThresh (m) gelten als „Netz"
  // (schwarz), kürzere als „Rest" (grün). sackgassenRot legt rot über alle
  // degree-1-Enden (Default: Grundfarbe der Komponente). Reiner Render-Zustand.
  const [netLenThresh, setNetLenThresh] = useState(300);
  const [sackgassenRot, setSackgassenRot] = useState(false);
  // E3 — Lückenfüller: lose Enden < gapTol (m) werden mit Brücken verbunden,
  // Komponenten verschmelzen. bridgeCount fürs Legenden-Feedback.
  const [gapTol, setGapTol] = useState(8);
  // T2 — Wege manuell aus OSM anwählen: im Anwähl-Modus werden die nicht
  // aufgenommenen Connector-Straßen (inNet=false) grau gestrichelt + klickbar
  // gezeigt; Klick nimmt sie ins Netz auf (Gegenstück zur blauen Abwahl).
  // manualPieces: beliebig viele aufgenommene TEILSTÜCKE, je mit eigener
  // synthetischer id (nid) → mehrere Stücke pro Straße möglich. Jedes Stück kennt
  // seine Quell-Straße (roadId) + einen Geometrie-Schlüssel (key) zur Dedup.
  const [pickMode, setPickMode] = useState(false);
  const [manualPieces, setManualPieces] = useState<Map<number, { roadId: number; points: [number, number][]; key: string }>>(new Map());
  const pieceNidRef = useRef(1_000_000_000_000); // über OSM-Way-ids, kollidiert nicht
  // Zwei-Punkt-Anwahl: erster Klick A merken, zweiter Klick B auf derselben Straße
  // füllt den Asphalt dazwischen.
  const [pendingConnect, setPendingConnect] = useState<{ roadId: number; lat: number; lng: number } | null>(null);

  // Entfernen: Ausschluss-Menge von Graph-Teilstücken (Schlüssel edgeId:seg). Im
  // Entfernen-Modus Klick auf ein Segment → raus (vor der Klassifizierung), nochmal
  // → zurück. greenKeysRef hält die aktuell grünen Keys für „alle Grünen entfernen".
  const [removeMode, setRemoveMode] = useState(false);
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const greenKeysRef = useRef<string[]>([]);

  // POI-Connector: Button → POIs 0,5–2 m vom Netz „schreien", jeder einzeln per
  // Klick verbindbar (Stich). <0,5 m = auf dem Pfad; >2 m = nicht verbindbar →
  // gilt als nicht akzeptiert (in der End-User-App stark ausgegraut).
  const [poiConnectMode, setPoiConnectMode] = useState(false);
  const [acceptedPois, setAcceptedPois] = useState<Set<string>>(new Set());
  // zuletzt angewandte Config (für Anschluss-Toleranz beim manuellen Anwählen).
  const lastCfgRef = useRef<PathConfig | null>(null);
  // E4a — „abgeschnitten" (blau): Sackgassen, hinter denen real ein Weg weitergeht,
  // aber keine OSM-Daten mehr liegen (Datenrand). Per Klick auf das Stummel-Segment
  // markiert; blau läuft VOR der Sackgassen(rot)-Bewertung und nimmt sie davon aus.
  // Lokaler Render-Zustand (noch nicht im Draft persistiert). Schlüssel pro
  // Teilstück = `${edgeId}:${seg}` (genodete Graph-Kante).
  const [cutEdges, setCutEdges] = useState<Set<string>>(new Set());

  // Inspector-Compare: das Polygon der vom Inspector gezeigten R kann
  // als read-only Referenz in Violett unter den Editor gelegt werden
  // (Tracing-Vorlage). Toggle separat, default aus.
  const inspectorView = useInspectorView();
  const [showInspectorRef, setShowInspectorRef] = useState(false);
  // Snap-Quelle aus Inspector-R (Umbauplan C): rasten Stuetzpunkte beim Zeichnen
  // auf die Punkte/Kanten der lila Vorlage ein. Nur sinnvoll, wenn die Vorlage
  // sichtbar ist.
  const [snapToTemplate, setSnapToTemplate] = useState(true);
  // US1 — Master-Snap-Toggle der Tool-Header-Leiste (beide Tabs). Treibt Geomans
  // globales Snapping; default an.
  const [snapEnabled, setSnapEnabled] = useState(true);
  // UÖ1/UÖ2 — Umriss: Geoman-Toolbar ist weg; Zeichnen/Bearbeiten laufen über
  // eigene Werkzeuge (kein Rechteck, kein globales disable → kein Weißer-Screen).
  const [umrissDraw, setUmrissDraw] = useState(false);
  const [umrissEdit, setUmrissEdit] = useState(false);

  // Ebenen-Steuerleiste (Umbauplan A): Dimmer + On/Off je Layer, auf beide Tabs
  // wirksam. (1) OSM-Tiles, (2) editierbare Boundary, (3) Inspector-R-Vorlage.
  const [tileVisible, setTileVisible] = useState(true);
  const [tileOpacity, setTileOpacity] = useState(0.75);
  const [boundaryVisible, setBoundaryVisible] = useState(true);
  const [boundaryOpacity, setBoundaryOpacity] = useState(0.6);
  const [inspectorOpacity, setInspectorOpacity] = useState(0.85);

  // Slot 2 (Umbauplan B): Masken-Boundary. Eigene Sichtbarkeit/Opacity.
  const [maskVisible, setMaskVisible] = useState(true);
  const [maskOpacity, setMaskOpacity] = useState(0.6);

  // Katalog-Platzhalter-POIs: Sichtbarkeit + Größe (statt Dimmen → Marker
  // vergrößern/verkleinern). EBENEN-Control.
  const [catalogPoiVisible, setCatalogPoiVisible] = useState(true);
  const [catalogPoiSize, setCatalogPoiSize] = useState(1);

  // Was wird beim Öffnen geladen (F5)?
  //   - openGeometryId 'draft-…'  → genau diesen Workspace-Draft laden + binden.
  //   - openGeometryId committed  → die Geometry als Referenz laden (kein Draft).
  //   - nichts                    → LEER. Kein stiller Autospeicher mehr.
  const initial = useMemo(() => {
    if (openGeometryId?.startsWith('draft-')) {
      const d = getDraft(openGeometryId);
      // F7.2: Slot 1 (polygon) = B1/Referenz = draft.reference; Slot 2 (maskPolygon)
      // = B2/finale Boundary = draft.boundary.
      if (d) return {
        draftId: d.id, geometryId: 'new' as const, name: d.name, region: '',
        polygon: d.reference ?? null, maskPolygon: d.boundary ?? null,
        catalogId: d.catalog_id ?? '',
      };
    }
    if (openGeometryId) {
      const g = GEOMETRIES.find((x) => x.id === openGeometryId);
      if (g) return {
        draftId: null, geometryId: g.id, name: g.name, region: g.region ?? '',
        polygon: g.polygon, maskPolygon: null, catalogId: '',
      };
    }
    return { draftId: null, geometryId: 'new' as const, name: '', region: '', polygon: null, maskPolygon: null, catalogId: '' };
  }, [openGeometryId]);
  // Sprung verbraucht — App-State leeren, damit spaetere Navigation leer startet.
  useEffect(() => {
    if (openGeometryId) onGeometryConsumed?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Aktiver Workspace-Draft. Alles, was gezeichnet wird, gehört zu diesem Draft;
  // ohne Draft entsteht beim ersten Zeichnen automatisch einer (lazy).
  const [activeDraftId, setActiveDraftId] = useState<string | null>(initial.draftId);
  // geometryId/name kommen aus dem geöffneten Draft bzw. der committeten Geometry
  // (read-only im Drawer; Benennen passiert im Workspace).
  const [geometryId] = useState<string | 'new'>(initial.geometryId);
  const [name] = useState(initial.name);
  const [polygon, setPolygon] = useState<Position[] | null>(initial.polygon);
  const [maskPolygon, setMaskPolygon] = useState<Position[] | null>(initial.maskPolygon ?? null);
  // F6: ein katalog-gebundener Draft schaltet seine POI-Platzhalter direkt scharf.
  const [overlayCatalogId] = useState<string>(initial.catalogId);
  // F7.3: Maskierung ist eine REVERSIBLE Vorschau (Zwischenspeicher/Test), KEIN
  // Commit. Rein lokaler Zustand — wird nicht in den Draft geschrieben. B1 wird
  // ausgeblendet + gesperrt, B2 blau-gestrichelt (Umriss). Toggle nur im Wegnetz.
  const [masked, setMasked] = useState<boolean>(false);
  const onToggleMask = () => setMasked((m) => !m);

  // F7-Neufassung: EXPLIZITES Speichern (kein stiller Autospeicher mehr).
  // saved=true direkt nach dem Speichern (B2 solid blau, 2b); jede Änderung
  // setzt es auf dirty zurück.
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const onSave = () => {
    if (geometryId !== 'new') return;                 // committete Geometry = nur Ansicht
    if ((!polygon || polygon.length < 3) && (!maskPolygon || maskPolygon.length < 3)) return;
    const gebiet = inspectorView?.geometry.id ?? '';
    const gebietName = inspectorView?.geometry.name ?? '';
    const netUn = pathResult ? buildNet(pathResult.edges, [], false, gebiet, gebietName) : null;
    // net_masked nur, wenn aktuell maskiert → macht den Draft rot (committbar).
    const netMa = (masked && cropResult)
      ? buildNet(cropResult.edges, cropResult.gates, true, gebiet, gebietName) : null;
    const patch = {
      name, reference: polygon, boundary: maskPolygon,
      net_unmasked: netUn, net_masked: netMa, catalog_id: overlayCatalogId || null,
    };
    try {
      if (activeDraftId) updateDraft(activeDraftId, patch);
      else { const d = createDraft(name || 'Unbenannter Draft', patch); setActiveDraftId(d.id); }
      setSaved(true);
      setSaveError('');
    } catch (e) {
      // Schreiben fehlgeschlagen (z. B. localStorage-Quota) — sichtbar machen.
      setSaveError(`Speichern fehlgeschlagen: ${(e as Error).message} · localStorage ${formatBytes(localStorageBytes())}`);
      setSaved(false);
    }
  };

  // Jede Änderung am Zustand → dirty (B2 nicht mehr solid; muss neu gespeichert werden).
  useEffect(() => { setSaved(false); }, [polygon, maskPolygon, masked, pathResult, overlayCatalogId, name]);

  // Allgemeiner Knopf „B2 aus B1": kopiert die Referenz-Boundary (B1) als Startform
  // in den finalen Slot (B2), die du dann netz-informiert verfeinerst.
  const onB2fromB1 = () => {
    const map = mapRef.current;
    if (!map || !polygon || polygon.length < 3) return;
    if (maskLayerRef.current) { map.removeLayer(maskLayerRef.current); maskLayerRef.current = null; }
    const copy = polygon.map((p) => [p[0], p[1]] as Position);
    const latlngs = copy.map(([lng, lat]) => [lat, lng] as [number, number]);
    const m = L.polygon(latlngs, { color: SLOT2_COLOR, dashArray: SLOT2_DASH }).addTo(map);
    maskLayerRef.current = m;
    setMaskPolygon(copy);
  };

  // Auf die aktuell im Inspector gewaehlte Region zoomen.
  const fitToInspector = () => {
    const map = mapRef.current;
    const poly = inspectorView?.geometry.polygon;
    if (!map || !poly || poly.length < 3) return;
    const latlngs = poly.map(([lng, lat]) => [lat, lng] as [number, number]);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
  };

  // Fokus-Treppe (Stufe 2): auf die POI-Koordinaten des gebundenen Katalogs zoomen.
  // Ein katalog-gebundener Draft weiß so selbst, wo er hingehört — ohne Inspector.
  const fitToCatalog = (catId: string) => {
    const map = mapRef.current;
    const cat = CATALOGS.find((c) => c.id === catId);
    if (!map || !cat) return;
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id, region_name: cat.name, source_path: `data/${cat.id}_pois_plan.md`,
    });
    const pts = parsed.pois
      .filter((p) => p.coord && !(p.coord[0] === 0 && p.coord[1] === 0))
      .map((p) => [p.coord[1], p.coord[0]] as [number, number]);
    if (pts.length === 0) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
  };

  // Katalog-POI-bbox als Fetch-Fläche (Position[]-Rechteck mit etwas Rand) —
  // nur als Quelle für „Anwenden", wenn keine eigene Boundary da ist. Kein B1.
  const catalogBboxPolygon = (catId: string): Position[] | null => {
    const cat = CATALOGS.find((c) => c.id === catId);
    if (!cat) return null;
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id, region_name: cat.name, source_path: `data/${cat.id}_pois_plan.md`,
    });
    const coords = parsed.pois
      .filter((p) => p.coord && !(p.coord[0] === 0 && p.coord[1] === 0))
      .map((p) => p.coord);
    if (coords.length === 0) return null;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }
    const padLng = (maxLng - minLng) * 0.1 || 0.005;
    const padLat = (maxLat - minLat) * 0.1 || 0.005;
    return [
      [minLng - padLng, minLat - padLat], [maxLng + padLng, minLat - padLat],
      [maxLng + padLng, maxLat + padLat], [minLng - padLng, maxLat + padLat],
    ];
  };

  // Map init (one-shot) — bleibt ueber Tab-Wechsel erhalten
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [47.9, 13.8],
      zoom: 13,
      scrollWheelZoom: true,
      zoomSnap: 0,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 3,
      wheelDebounceTime: 0,
      preferCanvas: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      fadeAnimation: true,
      inertia: true,
      inertiaDeceleration: 2500,
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      opacity: 0.75,
    });
    tiles.addTo(map);
    tileLayerRef.current = tiles;

    // UÖ1: keine Geoman-Toolbar; Zeichnen/Bearbeiten über Umriss-Werkzeuge.

    // Snapping global aktiv (Umbauplan C): beim Zeichnen/Editieren rasten
    // Stuetzpunkte auf nahe Snap-Ziele ein. Welche Layer als Ziel gelten,
    // steuert pro Layer das snapIgnore-Flag — die Inspector-R-Vorlage wird
    // unten gezielt freigegeben.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any).pm.setGlobalOptions?.({ snappable: true, snapDistance: 18, snapSegment: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ringOf = (layer: any): Position[] =>
      (layer.toGeoJSON().geometry as any).coordinates[0] as Position[];

    // Zwei-Slot-Modell (Umbauplan B): das erste gezeichnete Polygon fuellt Slot 1
    // (editierbare Boundary, blau). Ist Slot 1 belegt, wird das naechste Polygon
    // zur Masken-Boundary (Slot 2, orange-gestrichelt) — die ueber das Netz
    // gelegte Boundary aus Workflow-Schritt 5. Ein weiteres Polygon ersetzt Slot 2.
    map.on('pm:create', (e: L.LeafletEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = (e as any).layer as L.Polygon;
      if (!polygonLayerRef.current) {
        polygonLayerRef.current = layer;
        layer.setStyle?.({ color: SLOT1_COLOR });
        setPolygon(ringOf(layer));
      } else {
        if (maskLayerRef.current) map.removeLayer(maskLayerRef.current);
        maskLayerRef.current = layer;
        layer.setStyle?.({ color: SLOT2_COLOR, dashArray: SLOT2_DASH });
        setMaskPolygon(ringOf(layer));
      }
      setUmrissDraw(false); // ein Polygon gezeichnet → Zeichnen-Modus aus
    });

    map.on('pm:remove', (e: L.LeafletEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = (e as any).layer;
      if (layer === maskLayerRef.current) {
        maskLayerRef.current = null;
        setMaskPolygon(null);
        return;
      }
      // Slot 1 geloescht: Slot 2 rueckt nach (wird zur editierbaren Boundary).
      polygonLayerRef.current = null;
      setPolygon(null);
      if (maskLayerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = maskLayerRef.current as any;
        m.setStyle?.({ color: SLOT1_COLOR, dashArray: '' });
        polygonLayerRef.current = m;
        setPolygon(ringOf(m));
        maskLayerRef.current = null;
        setMaskPolygon(null);
      }
    });

    map.on('pm:edit', (e: L.LeafletEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = (e as any).layer;
      if (layer === polygonLayerRef.current) setPolygon(ringOf(layer));
      else if (layer === maskLayerRef.current) setMaskPolygon(ringOf(layer));
    });

    poiLayerRef.current = L.layerGroup().addTo(map);
    pathLayerRef.current = L.layerGroup().addTo(map);
    anchorLayerRef.current = L.layerGroup().addTo(map);
    poiConnectLayerRef.current = L.layerGroup().addTo(map);
    gateLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Initial Slot 1 (Boundary)
    if (polygon && polygon.length >= 3) {
      const latlngs = polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
      const poly = L.polygon(latlngs, { color: SLOT1_COLOR }).addTo(map);
      polygonLayerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }
    // Initial Slot 2 (Masken-Boundary), falls im Draft vorhanden
    if (maskPolygon && maskPolygon.length >= 3) {
      const latlngs = maskPolygon.map(([lng, lat]) => [lat, lng] as [number, number]);
      const mask = L.polygon(latlngs, { color: SLOT2_COLOR, dashArray: SLOT2_DASH }).addTo(map);
      maskLayerRef.current = mask;
    }
    // Initialer Fokus OHNE eigene Boundary: gleich auf den gebundenen Katalog zoomen
    // (synchron beim Öffnen) statt erst auf Default-Gmunden und dann per Timeout zu
    // springen — kein Flash, keine Wartezeit.
    if ((!polygon || polygon.length < 3) && overlayCatalogId) {
      fitToCatalog(overlayCatalogId);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      polygonLayerRef.current = null;
      maskLayerRef.current = null;
      poiLayerRef.current = null;
      pathLayerRef.current = null;
      anchorLayerRef.current = null;
      gateLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map nach Container-Resize einladen (sonst sind Tiles weiss)
  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 200);
  }, []);

  // Tab-Wechsel: Zeichen-Controls nur im Umriss-Tab, Karte neu vermessen
  // (Toolbar/Side-Panel aendern die Container-Groesse).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pm = (map as any).pm;
    // Wegnetz oder maskiert: Boundary nur sichtbar, nicht bearbeitbar → Zeichnen aus
    // + die Umriss-Modi zurücksetzen. KEIN globales disable* (Weißer-Screen-Falle);
    // gezielt nur an den Boundary-Layern (optional chaining schützt pm-lose Layer).
    if (tab !== 'umriss' || masked) {
      pm?.disableDraw?.();
      setUmrissDraw(false);
      setUmrissEdit(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (polygonLayerRef.current as any)?.pm?.disable?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (maskLayerRef.current as any)?.pm?.disable?.();
    }
  }, [tab, masked]); // eslint-disable-line react-hooks/exhaustive-deps

  // UÖ2: Umriss-Zeichnen/-Bearbeiten an Geoman durchreichen. Zeichnen über
  // enableDraw('Polygon') (Klick = Punkt, Klick auf Startpunkt schließt; Snapping
  // global aus snapEnabled). Bearbeiten per-Layer (kein globales disable).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pm = (map as any).pm;
    if (tab !== 'umriss' || masked) return;
    if (umrissDraw) pm?.enableDraw?.('Polygon'); else pm?.disableDraw?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1 = polygonLayerRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b2 = maskLayerRef.current as any;
    if (umrissEdit) { b1?.pm?.enable?.({ allowSelfIntersection: false }); b2?.pm?.enable?.({ allowSelfIntersection: false }); }
    else { b1?.pm?.disable?.(); b2?.pm?.disable?.(); }
    // Feines Fadenkreuz nur im Zeichnen-Modus.
    mapContainerRef.current?.classList.toggle('scim-draw-cursor', tab === 'umriss' && !masked && umrissDraw);
  }, [umrissDraw, umrissEdit, tab, masked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Karte neu vermessen + auf die Inspector-R zoomen — NUR bei echtem Tab-Wechsel,
  // nicht beim Maskieren (sonst springt/zoomt die Karte unerwartet, F7.3a-Fix).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setTimeout(() => {
      map.invalidateSize();
      if (tab === 'wegnetz') fitToInspector();
    }, 60);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ebenen-Steuerleiste (A): Tiles dimmen/abschalten.
  useEffect(() => {
    tileLayerRef.current?.setOpacity(tileVisible ? tileOpacity : 0);
  }, [tileVisible, tileOpacity]);

  // Ebenen-Steuerleiste (A): editierbare Boundary dimmen/abschalten. Layer
  // bleibt fuer Geoman auf der Karte; "aus" = transparent, nicht entfernt.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = polygonLayerRef.current as any;
    if (!layer?.setStyle) return;
    // F7.3: maskiert → B1/Referenz wird ausgeblendet (die finale B2 trägt die Bühne).
    const o = (masked || !boundaryVisible) ? 0 : boundaryOpacity;
    // Committete Geometry bleibt blau; ein Draft trägt Reifefarbe (gelb→orange).
    const color = geometryId !== 'new'
      ? SLOT1_COLOR
      : (overlayCatalogId ? DRAFT_STROKE_ORANGE : DRAFT_STROKE_GELB);
    // Innen klar (kein Fill an der editierbaren Boundary) — das Fill trägt der
    // invertierte Overlay-Layer (F6b).
    layer.setStyle({ color, weight: 2, opacity: o, fillOpacity: 0 });
  }, [boundaryVisible, boundaryOpacity, polygon, geometryId, tab, overlayCatalogId, masked]);

  // F6b: invertiertes Fill als eigener Overlay-Layer neu aufbauen. Nur für Drafts
  // (geometryId === 'new'); außen in Reifefarbe getönt, innen klar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (invFillLayerRef.current) {
      map.removeLayer(invFillLayerRef.current);
      invFillLayerRef.current = null;
    }
    const isDraft = geometryId === 'new';
    // Fill IMMER außen (invert). Aktive Boundary: unmaskiert B1 (polygon),
    // maskiert B2 (maskPolygon). Farbe folgt dem Zustand.
    const active = masked ? maskPolygon : polygon;
    if (!isDraft || !active || active.length < 3 || !boundaryVisible) return;
    const worldRing: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
    const hole = active.map(([lng, lat]) => [lat, lng] as [number, number]);
    const color = masked
      ? (tab === 'umriss' ? SLOT1_COLOR : SLOT2_COLOR)
      : (overlayCatalogId ? DRAFT_STROKE_ORANGE : DRAFT_STROKE_GELB);
    const inv = L.polygon([worldRing, hole], {
      stroke: false,
      fillColor: color,
      fillOpacity: boundaryOpacity * 0.18,
      interactive: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).addTo(map);
    inv.bringToBack();
    tileLayerRef.current?.bringToBack();
    invFillLayerRef.current = inv;
  }, [polygon, maskPolygon, geometryId, overlayCatalogId, boundaryVisible, boundaryOpacity, tab, masked]);

  // Ebenen-Steuerleiste (A): Inspector-R-Vorlage dimmen.
  useEffect(() => {
    inspectorRefRef.current?.setStyle({ opacity: inspectorOpacity, fillOpacity: inspectorOpacity * 0.05 });
  }, [inspectorOpacity, showInspectorRef, inspectorView]);

  // Snap-Quelle (C): snapIgnore am Vorlage-Layer live umschalten. Snap nur,
  // wenn die Vorlage auch sichtbar ist — sonst raste man auf Unsichtbares ein.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = inspectorRefRef.current as any;
    if (layer?.options) layer.options.snapIgnore = !(snapToTemplate && showInspectorRef);
  }, [snapToTemplate, showInspectorRef, inspectorView]);

  // US1: Master-Snap treibt Geomans globales Snapping (beim Zeichnen/Editieren).
  useEffect(() => {
    const map = mapRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any)?.pm?.setGlobalOptions?.({ snappable: snapEnabled });
  }, [snapEnabled]);

  // Slot 2 (B): Masken-Boundary dimmen/abschalten. Farbe (orange/gestrichelt)
  // bleibt erhalten, nur Opacity wird gesteuert.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = maskLayerRef.current as any;
    if (!layer?.setStyle) return;
    // F7.3: maskiert → B2 ist die Bühne (immer sichtbar). Im Umriss-Tab blau-
    // gestrichelt (committbar), im Wegnetz-Tab rot (die Crop-Maske).
    const o = (masked || maskVisible) ? maskOpacity : 0;
    const color = (masked && tab === 'umriss') ? SLOT1_COLOR : SLOT2_COLOR;
    // Kein Innen-Fill — alle Fills sind außen (Invert-Overlay).
    layer.setStyle({ color, dashArray: SLOT2_DASH, weight: 2, opacity: o, fillOpacity: 0 });
  }, [maskVisible, maskOpacity, maskPolygon, geometryId, tab, masked]);

  // Geometry-Wechsel laedt neue Daten in die Map
  // Inspector-Referenz-Polygon (violett, read-only) ein-/ausblenden.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (inspectorRefRef.current) {
      map.removeLayer(inspectorRefRef.current);
      inspectorRefRef.current = null;
    }
    if (!showInspectorRef || !inspectorView) return undefined;
    const ring = inspectorView.geometry.polygon;
    if (!ring || ring.length < 3) return undefined;
    const latlngs = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
    const layer = L.polygon(latlngs, {
      color: '#8b3fbf',
      weight: 1.5,
      opacity: 0.85,
      fillOpacity: 0.04,
      dashArray: '4 3',
      // interactive:false schuetzt die Vorlage vor Edit-/Remove-Klicks; Geoman
      // berechnet Snapping rein geometrisch, also bleibt sie trotzdem Snap-Ziel.
      interactive: false,
      // pmIgnore NICHT setzen — sonst bekommt der Layer kein layer.pm und faellt
      // aus der Geoman-Snap-Liste. snapIgnore steuert die Teilnahme am Snapping.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapIgnore: !snapToTemplate as any,
    });
    layer.addTo(map);
    inspectorRefRef.current = layer;
    return () => {
      if (inspectorRefRef.current) {
        map.removeLayer(inspectorRefRef.current);
        inspectorRefRef.current = null;
      }
    };
  }, [showInspectorRef, inspectorView]);

  // POI-Overlay anhand des Katalogs aktualisieren
  useEffect(() => {
    const map = mapRef.current;
    const layer = poiLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!overlayCatalogId || !catalogPoiVisible || poiConnectMode) return;
    const cat = CATALOGS.find((c) => c.id === overlayCatalogId);
    if (!cat) return;
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id,
      region_name: cat.name,
      source_path: `data/${cat.id}_pois_plan.md`,
    });
    const radius = Math.max(1, 4 * catalogPoiSize);
    for (const p of parsed.pois) {
      if (!p.coord || (p.coord[0] === 0 && p.coord[1] === 0)) continue;
      const marker = L.circleMarker([p.coord[1], p.coord[0]], {
        radius,
        color: '#c8389b',
        weight: 2,
        fillColor: '#fff',
        fillOpacity: 0.9,
      });
      marker.bindTooltip(p.text, { direction: 'top', offset: [0, -8], opacity: 0.9 });
      marker.addTo(layer);
    }
  }, [overlayCatalogId, catalogPoiVisible, catalogPoiSize, poiConnectMode]);

  // POI-Connector (v1): klassifiziert die Katalog-POIs nach Netz-Distanz und macht
  // 0,5–2-m-Kandidaten per Klick verbindbar. <0,5 m grün (auf dem Pfad); 0,5–2 m
  // orange & „schreiend" (Klick verbindet → Stich, dann grün); >2 m grau (nicht
  // verbindbar → unaccepted, in der End-User-App stark ausgegraut).
  useEffect(() => {
    const layer = poiConnectLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!poiConnectMode || !overlayCatalogId || !pathResult) return;
    const pois = regionPois(overlayCatalogId);
    const src = (masked && cropResult) ? { ...pathResult, edges: cropResult.edges } : pathResult;
    const summary = anchorPois(pois, src, 0.5, []); // 0,5 m = on-path-Schwelle; keine Boundary-Filterung
    for (const r of summary.results) {
      const key = `${r.poi[0]},${r.poi[1]}`;
      const accepted = acceptedPois.has(key);
      let color = '#2f855a'; let scream = false; let connectable = false; let tip: string;
      if (r.status === 'on_path') {
        tip = `${r.text} · auf dem Pfad (${r.distanceMeters.toFixed(1)} m)`;
      } else if (r.distanceMeters <= 2) {
        connectable = true;
        if (accepted) { color = '#2f855a'; tip = `${r.text} · verbunden (${r.distanceMeters.toFixed(1)} m) — Klick: trennen`; }
        else { color = '#dd6b20'; scream = true; tip = `${r.text} · ${r.distanceMeters.toFixed(1)} m — Klick: verbinden`; }
      } else {
        color = '#a0aec0';
        tip = `${r.text} · ${r.distanceMeters.toFixed(1)} m — zu weit (>2 m), nicht verbindbar`;
      }
      if (accepted && connectable && r.snap) {
        L.polyline([r.poi, r.snap], { color: '#2f855a', weight: 1.5, opacity: 0.85, dashArray: '3 3' }).addTo(layer);
      }
      const m = L.circleMarker(r.poi, {
        radius: scream ? 6 : 5, color, weight: scream ? 3 : 2, fillColor: '#fff', fillOpacity: 0.95,
        className: scream ? 'poi-scream' : undefined,
      });
      m.bindTooltip(tip, { direction: 'top', offset: [0, -8], opacity: 0.9 });
      if (connectable) {
        m.on('click', () => setAcceptedPois((prev) => {
          const n = new Set(prev);
          if (n.has(key)) n.delete(key); else n.add(key);
          return n;
        }));
      }
      m.addTo(layer);
    }
  }, [poiConnectMode, acceptedPois, overlayCatalogId, pathResult, masked, cropResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wegnetz auf den Map-Layer zeichnen — E2b: Färbung nach KONNEKTIVITÄT
  // (nicht mehr nach Herkunft). Der Graph wird verschweißt (graphCompose),
  // Komponenten nach Länge klassifiziert:
  //   schwarz = Netz (Komponente ≥ netLenThresh)
  //   grün    = Rest (kürzere Komponenten / abgetrennte Äste)
  //   rot     = Sackgassen (degree-1-Enden) — nur wenn sackgassenRot an
  // Default tragen Sackgassen die Grundfarbe ihrer Komponente.
  const NETZ_COLOR = '#222a35';
  const REST_COLOR = '#1f9d8f';
  const SACK_COLOR = '#e53e3e';
  const CUT_COLOR = '#3182ce';   // blau = abgeschnitten (Datenrand)
  const BRIDGE_COLOR = '#dd6b20';
  const toggleCut = (key: string) => setCutEdges((prev) => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });
  const addPiece = (roadId: number, pts: [number, number][]) => setManualPieces((prev) => {
    if (pts.length < 2) return prev;
    const key = `${roadId}:${pts[0]}:${pts[pts.length - 1]}`;
    for (const p of prev.values()) if (p.key === key) return prev; // schon vorhanden
    const n = new Map(prev);
    n.set((pieceNidRef.current += 1), { roadId, points: pts, key });
    return n;
  });
  const removePiece = (nid: number) => setManualPieces((prev) => {
    const n = new Map(prev);
    n.delete(nid);
    return n;
  });
  const toggleExclude = (key: string) => setExcludedKeys((prev) => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });
  const CAND_COLOR = '#a0aec0';   // grau = nicht aufgenommener OSM-Kandidat
  const LILA = '#9333ea';         // Straßen: Asphalt (weißer Kern, lila Einfassung) / andere Sorten (lila)
  const PICK_COLOR = LILA;        // manuell aufgenommenes Teilstück (Markierung)
  const renderPath = (res: PathFetchResult | null) => {
    const layer = pathLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!res) return;

    // T2: von Hand aufgenommene Teilstücke als zusätzliche inNet=true-Kanten
    // (gleiche edgeId, gecroppte Geometrie) anhängen; das Original bleibt inNet=false.
    const byId = new Map(res.edges.map((e) => [e.id, e]));
    const pieceEdges: PathEdge[] = [];
    for (const [nid, p] of manualPieces) {
      const src = byId.get(p.roadId);
      if (src && p.points.length >= 2) {
        pieceEdges.push({ id: nid, highway: src.highway, source: 'connector_candidate', points: p.points, tags: src.tags, inNet: true });
      }
    }
    let effEdges = pieceEdges.length ? [...res.edges, ...pieceEdges] : res.edges;
    // Datengröße-Reduktion: erst Punkte ausdünnen (DP, ±eps-Korridor, topologie-sicher),
    // dann Koordinaten auf N Stellen runden. Beides senkt das Netz-JSON.
    if (dpEps > 0) effEdges = simplifyNet(effEdges, dpEps);
    if (coordDecimals < 7) effEdges = effEdges.map((e) => ({ ...e, points: roundPolyline(e.points, coordDecimals) }));

    // E3: erst NODEN (graphCompose splittet an Kreuzungen), dann Lücken < gapTol
    // überbrücken (gapTol=0 → keine Brücken, roher genodeter Graph = A/B-Vergleich).
    const composed = graphCompose(effEdges);
    const merged = bridgeGaps(composed, gapTol);
    const bridges = merged.bridges;
    const graph0 = merged.graph; // vor dem Entfernen (für Ghosts)
    // Entfernen: ausgeschlossene Teilstücke aus dem Graphen nehmen → Grade/Komponenten
    // frisch rechnen, damit Klassifizierung + Summen sofort stimmen.
    const graph = excludedKeys.size
      ? filterEdges(graph0, (e) => !excludedKeys.has(`${e.edgeId}:${e.seg}`))
      : graph0;
    const netzSet = netzComponents(graph, netLenThresh);

    // Maskiert: Gate-Knoten (innerer Gate am Maskenrand) sind POIs, KEINE
    // Sackgassen — „aus Sacken werden durch Beschneidung POIs". Von Rot ausgenommen.
    const poiKeys = new Set<string>();
    if (masked && cropResult) {
      for (const g of cropResult.gates) poiKeys.add(poiCoordKey(g.inner[0], g.inner[1]));
    }
    const isPoiEnd = (nodeId: number): boolean =>
      poiKeys.has(poiCoordKey(graph.nodes[nodeId].lat, graph.nodes[nodeId].lng));

    // Asphalt-Eigenschaft pro Quell-Way (project_asphalt_tracking).
    const asphaltByEdgeId = new Map<number, boolean>();
    for (const e of effEdges) asphaltByEdgeId.set(e.id, isAsphalt(e));

    // Pro Graph-Teilstück (genodet) Farbe + Gewicht ableiten. Reihenfolge der
    // Klassen: blau (abgeschnitten, manuell) → rot (Sackgasse, Toggle) → Grundfarbe.
    type Kind = 'base' | 'red' | 'blue';
    const styled: { ge: NetGraphEdge; key: string; color: string; weight: number; kind: Kind; clickable: boolean; asphalt: boolean }[] = [];
    for (const ge of graph.edges) {
      if (ge.edgeId < 0) continue; // Brücken separat (orange gestrichelt)
      const key = `${ge.edgeId}:${ge.seg}`;
      const isNetz = netzSet.has(graph.nodes[ge.from].component);
      const asphalt = asphaltByEdgeId.get(ge.edgeId) ?? false;
      let color = isNetz ? NETZ_COLOR : REST_COLOR;
      const weight = isNetz ? 3 : 2;
      // echte Sackgasse = degree-1-Ende, das KEIN POI (Gate) ist.
      const isSack =
        (graph.nodes[ge.from].degree === 1 && !isPoiEnd(ge.from))
        || (graph.nodes[ge.to].degree === 1 && !isPoiEnd(ge.to));
      let kind: Kind = 'base';
      if (cutEdges.has(key)) { color = CUT_COLOR; kind = 'blue'; }        // blau VOR rot
      else if (sackgassenRot && isSack) { color = SACK_COLOR; kind = 'red'; }
      styled.push({ ge, key, color, weight, kind, clickable: isSack, asphalt });
    }

    // Längen-Summen: „Netz" = nur SCHWARZE Komponenten (≥ Schwelle), darin
    // Wanderweg + Asphalt; „rest" = grüne Komponenten (vom Netz exkludiert).
    let sNet = 0; let sAsph = 0; let sWander = 0; let sRest = 0;
    const greenKeys: string[] = [];
    for (const ge of graph.edges) {
      const isNetz = netzSet.has(graph.nodes[ge.from].component);
      const asph = ge.edgeId >= 0 && (asphaltByEdgeId.get(ge.edgeId) ?? false);
      if (isNetz) { sNet += ge.meters; if (asph) sAsph += ge.meters; else sWander += ge.meters; }
      else { sRest += ge.meters; if (ge.edgeId >= 0) greenKeys.push(`${ge.edgeId}:${ge.seg}`); }
    }
    const ns = netStats(effEdges.filter((e) => e.inNet));
    setNetSummary({ net: sNet, wander: sWander, asphalt: sAsph, rest: sRest, bytes: ns.bytes, points: ns.pointCount });
    greenKeysRef.current = greenKeys;

    // Sackgassen-Teilstücke sind anklickbar: Klick → blau (abgeschnitten) ↔ zurück.
    const attach = (pl: L.Polyline, s: typeof styled[number]) => {
      // Entfernen-Modus hat Vorrang: jedes Segment klickbar → raus/zurück.
      if (removeMode) {
        pl.bindTooltip('Klick: Segment entfernen', { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] });
        pl.on('click', (ev) => { L.DomEvent.stop(ev); toggleExclude(s.key); });
        return;
      }
      // Blau (abgeschnitten) gehört zum Sackgassen-Thema: nur wenn Sackgassen-rot
      // an ist UND kein anderer Karten-Modus läuft → keine Kollision mit A–B.
      if (!sackgassenRot || pickMode || poiConnectMode || !s.clickable) return;
      pl.bindTooltip(s.kind === 'blue' ? 'abgeschnitten (blau) — Klick: zurück' : 'Klick: abgeschnitten (blau)',
        { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] });
      pl.on('click', (ev) => { L.DomEvent.stop(ev); toggleCut(s.key); });
    };
    const draw = (s: typeof styled[number]) => {
      // Asphalt (nur Grundfarbe): weiß mit schwarzer Einfassung beidseitig (Casing).
      if (s.kind === 'base' && s.asphalt) {
        L.polyline(s.ge.points, { color: '#1a202c', weight: s.weight + 2.5, opacity: 0.95 }).addTo(layer);
        const top = L.polyline(s.ge.points, { color: '#ffffff', weight: s.weight / 2, opacity: 1 });
        attach(top, s);
        top.addTo(layer);
        return;
      }
      const pl = L.polyline(s.ge.points, {
        color: s.color, weight: s.kind === 'base' ? s.weight : 3,
        opacity: s.kind === 'base' ? 0.85 : 0.95,
      });
      attach(pl, s);
      pl.addTo(layer);
    };
    // Zeichenreihenfolge: Grundfarben unten, dann Brücken, dann rot, dann blau oben.
    for (const s of styled) if (s.kind === 'base') draw(s);
    for (const b of bridges) {
      L.polyline(b.points, {
        color: BRIDGE_COLOR, weight: 2, opacity: 0.9, dashArray: '4 4',
      }).addTo(layer);
    }
    for (const s of styled) if (s.kind === 'red') draw(s);
    for (const s of styled) if (s.kind === 'blue') draw(s);

    // Entfernen: ausgeschlossene Teilstücke als blasse Geister zeigen (im
    // Entfernen-Modus per Klick zurückholbar).
    if (excludedKeys.size) {
      for (const ge of graph0.edges) {
        const key = `${ge.edgeId}:${ge.seg}`;
        if (!excludedKeys.has(key)) continue;
        const pl = L.polyline(ge.points, { color: '#cbd5e0', weight: 2, opacity: 0.7, dashArray: '2 4' });
        if (removeMode) {
          pl.bindTooltip('entfernt — Klick: zurück', { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] });
          pl.on('click', (ev) => { L.DomEvent.stop(ev); toggleExclude(key); });
        }
        pl.addTo(layer);
      }
    }

    // T2: Anwähl-Modus — Zwei-Punkt. Graue Straße: erster Klick = A, zweiter Klick
    // = B auf DERSELBEN Straße → der Asphalt dazwischen wird aufgenommen (du
    // bestimmst die Spanne → keine Ministrecken). Orange = aufgenommen (Klick raus).
    if (pickMode) {
      for (const e of res.edges) {
        if (e.source === 'primary' || e.inNet) continue; // nur Straßen-Kandidaten
        const armed = pendingConnect?.roadId === e.id;
        const pl = L.polyline(e.points, {
          color: armed ? PICK_COLOR : CAND_COLOR, weight: armed ? 3 : 2, opacity: 0.9, dashArray: '5 5',
        });
        pl.bindTooltip(
          armed ? 'zweiten Punkt B auf dieser Straße klicken → Asphalt A–B aufnehmen'
            : (pendingConnect ? 'erst Punkt B auf der angefangenen Straße setzen'
              : 'OSM-Straße — Punkt A klicken, dann Punkt B → Asphalt dazwischen'),
          { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] },
        );
        pl.on('click', (ev) => {
          L.DomEvent.stop(ev);
          const ll = (ev as L.LeafletMouseEvent).latlng;
          if (pendingConnect && pendingConnect.roadId === e.id) {
            addPiece(e.id, connectorPieceBetween(e, pendingConnect.lat, pendingConnect.lng, ll.lat, ll.lng));
            setPendingConnect(null);
          } else {
            setPendingConnect({ roadId: e.id, lat: ll.lat, lng: ll.lng });
          }
        });
        pl.addTo(layer);
      }
      // Marker für den gesetzten ersten Punkt A.
      if (pendingConnect) {
        L.circleMarker([pendingConnect.lat, pendingConnect.lng], {
          radius: 5, color: PICK_COLOR, weight: 3, fillColor: '#fff', fillOpacity: 1,
        }).bindTooltip('Punkt A — jetzt B auf derselben Straße', { direction: 'top', offset: [0, -8], opacity: 0.9 }).addTo(layer);
      }
      // Aufgenommene Teilstücke obenauf (nur im Anwählmodus): Asphalt = weiß mit
      // lila Einfassung, andere Sorten = lila. Jedes per Klick wieder entfernbar.
      for (const [nid, p] of manualPieces) {
        const src = byId.get(p.roadId);
        const asph = src ? isAsphalt(src) : true;
        const tip = 'aufgenommenes Teilstück — Klick: wieder raus';
        if (asph) {
          L.polyline(p.points, { color: PICK_COLOR, weight: 5, opacity: 0.95 }).addTo(layer);
          const top = L.polyline(p.points, { color: '#ffffff', weight: 2, opacity: 1 });
          top.bindTooltip(tip, { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] });
          top.on('click', (ev) => { L.DomEvent.stop(ev); removePiece(nid); });
          top.addTo(layer);
        } else {
          const pl = L.polyline(p.points, { color: PICK_COLOR, weight: 3, opacity: 0.95 });
          pl.bindTooltip(tip, { sticky: true, opacity: 0.9, direction: 'right', offset: [12, 0] });
          pl.on('click', (ev) => { L.DomEvent.stop(ev); removePiece(nid); });
          pl.addTo(layer);
        }
      }
    }
  };

  // POIs der Region per Konvention (Katalog-id === Geometry-id). Phase-MVP-
  // Bindung; spaeter evtl. explizites Feld an der Geometry/Config.
  const regionPois = (regionId: string): PoiInput[] => {
    const cat = CATALOGS.find((c) => c.id === regionId);
    if (!cat) return [];
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id,
      region_name: cat.name,
      source_path: `data/${cat.id}_pois_plan.md`,
    });
    return parsed.pois
      .filter((p) => p.coord && !(p.coord[0] === 0 && p.coord[1] === 0))
      .map((p) => ({ text: p.text, lat: p.coord![1], lng: p.coord![0] }));
  };

  // Anker zeichnen: connected-POI als gestrichelte Linie POI->Snap (orange),
  // Marker farbcodiert nach Status (ann_074).
  const renderAnchors = (summary: AnchorSummary | null) => {
    const layer = anchorLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!summary) return;
    for (const a of summary.results) {
      if (a.status === 'connected' && a.snap) {
        L.polyline([a.poi, a.snap], {
          color: '#dd6b20', weight: 1.5, opacity: 0.8, dashArray: '3 3',
        }).addTo(layer);
      }
      const color = a.status === 'connected' ? '#dd6b20'
        : a.status === 'on_path' ? '#2f855a' : '#a0aec0';
      const distTxt = isFinite(a.distanceMeters) ? ` · ${a.distanceMeters.toFixed(1)} m` : '';
      L.circleMarker(a.poi, {
        radius: 4, color, weight: 2, fillColor: '#fff', fillOpacity: 0.9,
      })
        .bindTooltip(`${a.text} [${a.status}]${distTxt}`, { direction: 'top', offset: [0, -8], opacity: 0.9 })
        .addTo(layer);
    }
  };

  // Gate-Knoten zeichnen (Umbauplan D): inner-gate als gruener Ring (im Netz,
  // user-facing Eintritt), outer-gate als grauer Punkt (Nachbar-Anschluss),
  // dazwischen ein kurzer gestrichelter Stich.
  const renderGates = (gates: import('../../regio-content/pathEngine').GateNode[] | null) => {
    const layer = gateLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!gates) return;
    for (const g of gates) {
      if (g.outer) {
        L.polyline([g.inner, g.outer], {
          color: '#718096', weight: 1.5, opacity: 0.7, dashArray: '2 3',
        }).addTo(layer);
        L.circleMarker(g.outer, {
          radius: 3, color: '#718096', weight: 1.5, fillColor: '#fff', fillOpacity: 0.9,
        }).bindTooltip('outer-gate (Nachbar-Anschluss)', { direction: 'top', offset: [0, -6], opacity: 0.9 })
          .addTo(layer);
      }
      L.circleMarker(g.inner, {
        radius: 5, color: '#2f855a', weight: 2.5, fillColor: '#c6f6d5', fillOpacity: 0.95,
      }).bindTooltip('inner-gate (Eintritt/Austritt)', { direction: 'top', offset: [0, -8], opacity: 0.9 })
        .addTo(layer);
    }
  };

  // F7.3: Maskierung = REVERSIBLE Vorschau (Zwischenspeicher). masked an → Netz-
  // Crop-Vorschau inkl. Gate-POIs; aus → voller Netz-Zustand zurück. Der echte,
  // destruktive Crop passiert UNSICHTBAR erst am Commit im Workspace — der User
  // bekommt ihn im Drawer nicht als Aktion zu sehen. Nichts wird persistiert.
  useEffect(() => {
    if (!pathResult) return;
    if (masked && maskPolygon && maskPolygon.length >= 3) {
      const res = cropNetToMask(pathResult.edges, maskPolygon);
      setCropResult(res);
      renderPath({ ...pathResult, edges: res.edges });
      renderGates(res.gates);
    } else {
      setCropResult(null);
      renderPath(pathResult);
      renderGates(null);
    }
  }, [masked]); // eslint-disable-line react-hooks/exhaustive-deps

  // E2b: Schwelle/Sackgassen-Toggle ändern nur die Färbung → ohne neuen Fetch
  // den aktuellen Zustand (maskiert oder voll) neu zeichnen.
  useEffect(() => {
    if (!pathResult) return;
    if (masked && cropResult) renderPath({ ...pathResult, edges: cropResult.edges });
    else renderPath(pathResult);
  }, [netLenThresh, sackgassenRot, gapTol, cutEdges, pickMode, manualPieces, removeMode, excludedKeys, pendingConnect, dpEps, coordDecimals, poiConnectMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // F7-Neufassung: Die Handoff-Brücke entfällt. Der Drawer schreibt direkt in den
  // Workspace-Draft (onSave); der Commit lebt im Workspace.

  // [Anwenden] im Wegnetz-Tab: Boundary-bbox -> Overpass -> Filter -> Render,
  // anschliessend POI-Anker (ann_074) berechnen + zeichnen.
  const onApplyPath = async (cfg: PathConfig) => {
    lastCfgRef.current = cfg; // für T2-Anschluss-Toleranz beim manuellen Anwählen
    setAppliedCfgSig(JSON.stringify(cfg)); // Stand „angewandt" → Puls aus
    setCurrentCfg(cfg);
    const map = mapRef.current;
    // Vorrang-Regel: das Netz wird aus der EIGENEN Boundary (B1) des Drafts abgeleitet.
    // Nur wenn der Drawer noch keine eigene Boundary hat, leiht der Inspector seine —
    // und sie wird dann als B1 übernommen (Inspector→B1).
    // Quellen-Reihenfolge: eigene Boundary (B1) → Katalog-POI-Gebiet → Inspector.
    let src: Position[] | null = (polygon && polygon.length >= 3) ? polygon : null;
    // Katalog gebunden, aber keine eigene Boundary → Netz fürs Katalog-POI-Gebiet
    // holen (nur Fetch-Fläche, KEIN B1 — B1 zeichnest du danach).
    if (!src && overlayCatalogId) {
      src = catalogBboxPolygon(overlayCatalogId);
    }
    // Sonst leiht der Inspector seine Boundary — und sie wird als B1 übernommen.
    if (!src) {
      const ip = inspectorView?.geometry.polygon;
      if (ip && ip.length >= 3 && map) {
        if (polygonLayerRef.current) { map.removeLayer(polygonLayerRef.current); polygonLayerRef.current = null; }
        const latlngs = ip.map(([lng, lat]) => [lat, lng] as [number, number]);
        const poly = L.polygon(latlngs, { color: SLOT1_COLOR }).addTo(map);
        polygonLayerRef.current = poly;
        setPolygon(ip);
        src = ip;
      }
    }
    if (!src) {
      setPathStatus('error');
      setPathError('Keine Quelle — Boundary zeichnen, Katalog binden oder Inspector-R wählen.');
      return;
    }
    // Laufende Anfrage abbrechen
    pathAbortRef.current?.abort();
    const ctrl = new AbortController();
    pathAbortRef.current = ctrl;

    setPathStatus('loading');
    setPathError('');
    try {
      const res = await deriveWanderwegnetz(src, cfg, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setPathResult(res);
      renderPath(res);
      // Frisches Netz → alter Crop ist hinfaellig.
      setCropResult(null);
      renderGates(null);

      // POIs aus dem gebundenen Katalog des Drafts (Fallback: Inspector-Region).
      const catId = overlayCatalogId || inspectorView?.geometry.id || '';
      const summary = anchorPois(regionPois(catId), res, cfg.anker.snap_schwelle_meter, src);
      setAnchorSummary(summary);
      renderAnchors(summary);

      setPathStatus('done');
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setPathStatus('error');
      setPathError(err instanceof Error ? err.message : String(err));
    }
  };

  // Regionswechsel (andere Inspector-R): alte Wegnetz-Ableitung verwerfen.
  // ABER: hat der Drawer eine eigene Boundary (B1), gewinnt diese — der Inspector
  // darf den Drawer dann nicht kapern (kein Wipe/Zoom).
  useEffect(() => {
    // Fokus-Treppe: eigene Boundary ODER gebundener Katalog gewinnen über den
    // Inspector — dann darf der Inspector den Drawer nicht kapern.
    if (polygonLayerRef.current || overlayCatalogId) return;
    pathAbortRef.current?.abort();
    setPathStatus('idle');
    setPathError('');
    setPathResult(null);
    setAnchorSummary(null);
    setCropResult(null);
    renderPath(null);
    renderAnchors(null);
    renderGates(null);
    // Regel B: ohne eigene Boundary/Katalog leiht der Inspector den Fokus.
    setTimeout(fitToInspector, 80);
  }, [inspectorView?.geometry.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fokus-Treppe Stufe 2: gebundener Katalog → auf seine POI-bbox zoomen
  // (solange keine eigene Boundary da ist). Vorrang vor dem Inspector.
  useEffect(() => {
    if (polygonLayerRef.current || !overlayCatalogId) return;
    setTimeout(() => fitToCatalog(overlayCatalogId), 120);
  }, [overlayCatalogId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Maske geaendert/entfernt → bestehender Crop ist hinfaellig: Gate-Marker
  // loeschen und das ungekappte Netz wieder zeichnen.
  useEffect(() => {
    if (!cropResult) return;
    setCropResult(null);
    renderGates(null);
    if (pathResult) renderPath(pathResult);
  }, [maskPolygon]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTetraFace = (f: RepresentBuildFace) => {
    if (f === 'geometry_draw') onJumpTo('geometry_editor');
    else if (f === 'catalog_magazination') onJumpTo('catalog');
    else if (f === 'represent_organisation') onJumpTo('workspace');
    else if (f === 'sensus_core_build') onJumpTo('P11');
  };
  const onTetraArc = (a: string) => {
    if (a === 'system_adjust') onJumpTo('P01');
    else if (a === 'regio_content') onJumpTo('P02');
    else if (a === 'load_thresholds') onJumpTo('P09');
  };

  // US1 — Tool-Header-Registry. Adaptierbar: ein Werkzeug = ein Eintrag mit
  // `side` (left=Umriss · center=geteilt · right=Wegnetz) + `tabs`. Die Leiste
  // filtert nach aktivem Tab und ordnet nach Zone. Weitere Werkzeuge (US3) werden
  // einfach als weitere Einträge ergänzt — kein Umbau am Gerüst nötig.
  // „Anwenden" (rechte Zone): pulst, solange es etwas anzuwenden gibt — Quelle
  // vorhanden UND Netz veraltet (noch nie geladen oder Filter seit letztem
  // Anwenden geändert). Während des Ladens kein Puls.
  const canApplyNet =
    (!!polygon && polygon.length >= 3)
    || !!overlayCatalogId
    || !!(inspectorView?.geometry?.polygon && inspectorView.geometry.polygon.length >= 3);
  const netStale = !pathResult || (!!currentCfg && JSON.stringify(currentCfg) !== appliedCfgSig);
  const applyPulse = canApplyNet && netStale && pathStatus !== 'loading';

  const drawerTools: { id: string; side: 'left' | 'center' | 'right'; tabs: DrawerTab[]; node: ReactNode }[] = [
    {
      id: 'umriss-draw', side: 'left', tabs: ['umriss'],
      node: (
        <ToolToggle
          active={umrissDraw}
          onClick={() => { setUmrissDraw((v) => !v); setUmrissEdit(false); }}
          label="✏️ Zeichnen"
          title="Boundary zeichnen: Klick = Punkt, Klick auf den Startpunkt schließt"
        />
      ),
    },
    {
      id: 'umriss-edit', side: 'left', tabs: ['umriss'],
      node: (
        <ToolToggle
          active={umrissEdit}
          onClick={() => { setUmrissEdit((v) => !v); setUmrissDraw(false); }}
          label="✎ Bearbeiten"
          title="Stützpunkte ziehen/verschieben (Vertex-Drag)"
        />
      ),
    },
    {
      id: 'snap', side: 'center', tabs: ['umriss', 'wegnetz'],
      node: (
        <ToolToggle
          active={snapEnabled}
          onClick={() => setSnapEnabled((v) => !v)}
          label="⊹ Snap"
          title="Einrasten beim Zeichnen/Editieren auf nahe Punkte und Kanten (beide Tabs)"
        />
      ),
    },
    {
      id: 'netz', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolSlider label="Netz-Schwelle" value={netLenThresh} min={0} max={3000} step={25} onChange={setNetLenThresh} />
      ),
    },
    {
      id: 'sackgassen', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={sackgassenRot}
          onClick={() => setSackgassenRot((v) => !v)}
          label="⚠ Sackgassen"
          title="Sackgassen (degree-1-Enden) rot einblenden"
        />
      ),
    },
    {
      id: 'verbinden', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolSlider label="Verbinden (inkl. verschmelzen)" value={gapTol} min={0} max={50} step={1} onChange={setGapTol} />
      ),
    },
    {
      id: 'osm', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={pickMode}
          onClick={() => { setPickMode((v) => !v); setPendingConnect(null); setRemoveMode(false); setPoiConnectMode(false); }}
          label="⊟ OSM-Wege"
          title="OSM-Straßen zeigen; Punkt A → Punkt B auf derselben Straße füllt den Asphalt dazwischen"
        />
      ),
    },
    {
      id: 'entfernen', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={removeMode}
          onClick={() => { setRemoveMode((v) => !v); setPickMode(false); setPendingConnect(null); setPoiConnectMode(false); }}
          label="🗑 Entfernen"
          title="Segmente per Klick entfernen (grün oder schwarz) ↔ zurück"
        />
      ),
    },
    {
      id: 'poiconnect', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={poiConnectMode}
          onClick={() => { setPoiConnectMode((v) => !v); setPickMode(false); setPendingConnect(null); setRemoveMode(false); }}
          label="🔗 POI-Connect"
          title="POIs 0,5–2 m vom Netz verbinden (jeder einzeln per Klick); >2 m nicht verbindbar"
        />
      ),
    },
    {
      id: 'anwenden', side: 'right', tabs: ['wegnetz'],
      node: (
        <button
          className={applyPulse ? 'tool-pulse' : undefined}
          onClick={() => { if (currentCfg) onApplyPath(currentCfg); }}
          disabled={!canApplyNet || pathStatus === 'loading' || !currentCfg}
          title={
            !canApplyNet ? 'Keine Quelle fürs Netz (Boundary/Katalog/Inspector)'
              : pathStatus === 'loading' ? 'lädt OSM …'
              : netStale ? 'OSM holen + Filter anwenden (Einstellungen geändert)'
              : 'Netz ist aktuell'
          }
          style={{
            fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 5,
            minWidth: 104, textAlign: 'center',
            border: '1px solid #2b6cb0',
            background: (!canApplyNet || pathStatus === 'loading' || !currentCfg) ? '#edf2f7' : '#ebf8ff',
            color: (!canApplyNet || pathStatus === 'loading' || !currentCfg) ? '#a0aec0' : '#2b6cb0',
            cursor: (!canApplyNet || pathStatus === 'loading' || !currentCfg) ? 'not-allowed' : 'pointer',
          }}
        >
          {pathStatus === 'loading' ? '… lädt' : '▷ Anwenden'}
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* Tab-Strip Umriss / Wegnetz */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 0',
        background: '#edf2f7', borderBottom: '1px solid #e2e8f0',
      }}>
        <div title="Represent Build · Seite 1 · Geometry Draw" style={{ flexShrink: 0, marginRight: 4, marginBottom: 4 }}>
          <RepresentBuildTetrahedron
            activeFace="geometry_draw"
            variant="light"
            onFaceClick={onTetraFace}
            onArcClick={onTetraArc}
            size={36}
          />
        </div>
        {([
          { id: 'umriss', label: '◇ Umriss' },
          { id: 'wegnetz', label: '⋔ Wegnetz' },
        ] as { id: DrawerTab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 12, padding: '6px 16px', cursor: 'pointer',
              border: '1px solid #cbd5e0', borderBottom: 'none',
              borderTopLeftRadius: 5, borderTopRightRadius: 5,
              fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? '#f7f9fc' : '#e2e8f0',
              color: tab === t.id ? '#1a365d' : '#718096',
              marginBottom: tab === t.id ? -1 : 0,
            }}
          >
            {t.label}
          </button>
        ))}
        {/* Cache-Füllstand, mittig (ersetzt den früheren Diagnose-Block). */}
        <span style={{ flex: 1, textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: '#718096', marginBottom: 6 }}>
          Browser Cache {(localStorageBytes() / 1048576).toFixed(2)}/10 MB
        </span>
        {/* Wegnetz-Hinweis LINKS vom Speichern-Button, damit dieser nicht wandert. */}
        {tab === 'wegnetz' && (
          <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic', marginBottom: 4, marginRight: 8, whiteSpace: 'nowrap' }}>
            Primär-Filter + Konnektoren live · Verschweißen folgt
          </span>
        )}
        {/* F7-Neufassung: expliziter Speichern-Button (tab-unabhängig). Speichert
            den Draft in den Workspace; maskiert gespeichert = roter, committbarer Draft. */}
        {geometryId === 'new' && (
          <button
            onClick={onSave}
            disabled={saved || ((!polygon || polygon.length < 3) && (!maskPolygon || maskPolygon.length < 3))}
            title={saved ? 'Gespeichert' : 'Draft in den Workspace speichern'}
            style={{
              fontSize: 12, padding: '6px 14px', marginBottom: 4, fontWeight: 700,
              border: `1px solid ${saved ? '#9ae6b4' : '#2b6cb0'}`, borderRadius: 5,
              background: saved ? '#f0fff4' : '#2b6cb0',
              color: saved ? '#22543d' : '#fff',
              cursor: saved ? 'default' : 'pointer',
            }}
          >
            {saved ? '✓ Gespeichert' : '💾 Speichern'}
          </button>
        )}
      </div>

      {saveError && (
        <div style={{
          margin: '4px 12px', padding: '6px 10px', borderRadius: 5,
          background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c',
          fontSize: 11, lineHeight: 1.4,
        }}>
          ✗ {saveError}
        </div>
      )}

      {/* Ebenen-Steuerleiste (A) — Dimmer + On/Off, auf beide Tabs wirksam */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '5px 12px',
        background: '#f0f4f8', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#718096', letterSpacing: 0.5 }}>EBENEN</span>
        <LayerDimmer
          label="Karte" color="#4a5568"
          on={tileVisible} opacity={tileOpacity}
          onToggle={setTileVisible} onOpacity={setTileOpacity}
        />
        <LayerDimmer
          label="B1 · Referenz" color={overlayCatalogId ? DRAFT_STROKE_ORANGE : DRAFT_STROKE_GELB}
          on={boundaryVisible} opacity={boundaryOpacity}
          onToggle={setBoundaryVisible} onOpacity={setBoundaryOpacity}
          disabled={!polygon || polygon.length < 3}
          disabledHint="Keine Referenz-Boundary (B1) gezeichnet"
        />
        <LayerDimmer
          label="B2 · finale Boundary" color={SLOT2_COLOR}
          on={maskVisible} opacity={maskOpacity}
          onToggle={setMaskVisible} onOpacity={setMaskOpacity}
          disabled={!maskPolygon || maskPolygon.length < 3}
          disabledHint="Finale Boundary (B2) als zweites Polygon über B1 zeichnen — oder per Knopf darunter."
        />
        <button
          onClick={onB2fromB1}
          disabled={!polygon || polygon.length < 3}
          title={(!polygon || polygon.length < 3)
            ? 'Erst B1 (Referenz) zeichnen'
            : 'B2 als Kopie von B1 anlegen — dann netz-informiert verfeinern'}
          style={{
            fontSize: 10, padding: '3px 8px', marginLeft: 18, marginBottom: 4, alignSelf: 'flex-start',
            border: `1px solid ${(!polygon || polygon.length < 3) ? '#cbd5e0' : SLOT2_COLOR}`, borderRadius: 4,
            background: 'white', color: (!polygon || polygon.length < 3) ? '#a0aec0' : SLOT2_COLOR,
            cursor: (!polygon || polygon.length < 3) ? 'not-allowed' : 'pointer',
          }}
        >
          ▢→▣ B2 aus B1
        </button>
        <LayerDimmer
          label="Vorlage (Inspector-R)" color="#8b3fbf"
          on={showInspectorRef} opacity={inspectorOpacity}
          onToggle={setShowInspectorRef} onOpacity={setInspectorOpacity}
          disabled={!inspectorView}
          disabledHint="Inspector zeigt keine R — im rechten Header eine wählen"
        />
        {/* Snap-Quelle (C): einrasten auf die Vorlage-Punkte/Kanten */}
        <label
          title={
            !inspectorView ? 'Inspector zeigt keine R'
              : !showInspectorRef ? 'Vorlage erst einblenden'
              : 'Beim Zeichnen/Editieren auf die Punkte und Kanten der lila Vorlage einrasten'
          }
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            opacity: (!inspectorView || !showInspectorRef) ? 0.45 : 1,
            cursor: (!inspectorView || !showInspectorRef) ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={snapToTemplate}
            disabled={!inspectorView || !showInspectorRef}
            onChange={(e) => setSnapToTemplate(e.target.checked)}
            style={{ cursor: (!inspectorView || !showInspectorRef) ? 'not-allowed' : 'pointer' }}
          />
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: (snapToTemplate && showInspectorRef && inspectorView) ? '#8b3fbf' : '#718096',
          }}>
            ⊹ einrasten
          </span>
        </label>
        {/* Katalog-Platzhalter-POIs: wie ein Ebenen-Control, aber der Regler ändert
            die GRÖSSE der Platzhalter (nicht die Dimmung). */}
        <LayerSizer
          label="Katalog-POIs" color="#c8389b"
          on={catalogPoiVisible} size={catalogPoiSize}
          onToggle={setCatalogPoiVisible} onSize={setCatalogPoiSize}
          disabled={!overlayCatalogId}
          disabledHint="Kein Katalog gebunden — Platzhalter-POIs nur bei katalog-gebundenem Draft"
        />
        {/* Beschneiden — rechtsbündig (unter Speichern), nur im Wegnetz-Tab. */}
        {tab === 'wegnetz' && (
          <button
            onClick={onToggleMask}
            disabled={!maskPolygon || maskPolygon.length < 3}
            title={
              (!maskPolygon || maskPolygon.length < 3) ? 'Erst B2 (finale Boundary) zeichnen'
                : masked ? 'Zurück — maskiertes Netz verwerfen, unmaskiertes zeigen'
                : 'Beschneiden: maskiertes Netz (Vorschau) erzeugen'
            }
            style={{
              marginLeft: 'auto', fontSize: 10, padding: '3px 8px', marginBottom: 4, alignSelf: 'flex-start',
              border: `1px solid ${(!maskPolygon || maskPolygon.length < 3) ? '#cbd5e0' : masked ? '#2b6cb0' : '#c05621'}`,
              borderRadius: 4,
              background: (!maskPolygon || maskPolygon.length < 3) ? '#edf2f7' : masked ? '#ebf8ff' : '#fff5f5',
              color: (!maskPolygon || maskPolygon.length < 3) ? '#a0aec0' : masked ? '#2b6cb0' : '#c05621',
              cursor: (!maskPolygon || maskPolygon.length < 3) ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {masked ? '↩ zurück' : '▦ Beschneiden'}
          </button>
        )}
      </div>


      {/* Tool-Header-Leiste (US1) — tab-gefiltert, drei Zonen: Umriss links ·
          Snap mittig · Wegnetz rechts. Werkzeuge kommen aus `drawerTools`. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
        background: '#eef2f7', borderBottom: '1px solid #e2e8f0', minHeight: 30,
      }}>
        {/* LINKS — Umriss */}
        <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-start' }}>
          {drawerTools.filter((t) => t.side === 'left' && t.tabs.includes(tab))
            .map((t) => <span key={t.id}>{t.node}</span>)}
        </div>
        {/* MITTE — geteilt (Snap) */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {drawerTools.filter((t) => t.side === 'center' && t.tabs.includes(tab))
            .map((t) => <span key={t.id}>{t.node}</span>)}
        </div>
        {/* RECHTS — Wegnetz */}
        <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
          {drawerTools.filter((t) => t.side === 'right' && t.tabs.includes(tab))
            .map((t) => <span key={t.id}>{t.node}</span>)}
        </div>
      </div>

      {/* Inhaltszeile: optionales Wegnetz-Filtermenue + gemeinsamer Map-Canvas */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {tab === 'wegnetz' && (
          <PathFilterMenu
            gebiet={inspectorView?.geometry.id ?? ''}
            gebietLabel={inspectorView?.geometry.name ?? ''}
            canApply={
              (!!polygon && polygon.length >= 3)
              || !!overlayCatalogId
              || !!(inspectorView?.geometry?.polygon && inspectorView.geometry.polygon.length >= 3)
            }
            onResized={() => setTimeout(() => mapRef.current?.invalidateSize(), 60)}
            onCfgChange={setCurrentCfg}
            status={pathStatus}
            error={pathError}
            includeCount={manualPieces.size}
            onClearInclude={() => setManualPieces(new Map())}
            cutCount={cutEdges.size}
            onClearCut={() => setCutEdges(new Set())}
            excludedCount={excludedKeys.size}
            onRemoveGreen={() => setExcludedKeys((prev) => new Set([...prev, ...greenKeysRef.current]))}
            onClearExcluded={() => setExcludedKeys(new Set())}
          />
        )}
        <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />
      </div>

      {/* Status (nur Umriss-Tab) */}
      {tab === 'umriss' && (
        <div style={{
          padding: '4px 12px', fontSize: 11, fontFamily: 'monospace',
          background: '#f7fafc', borderTop: '1px solid #e2e8f0',
        }}>
          {polygon ? (
            <span style={{ color: '#38a169' }}>✓ Boundary (Slot 1) mit {polygon.length} Punkten</span>
          ) : (
            <span style={{ color: '#a0aec0' }}>Polygon-Werkzeug oben links wählen und zeichnen</span>
          )}
          {polygon && (
            maskPolygon ? (
              <span style={{ marginLeft: 16, color: SLOT2_COLOR }}>
                ✓ Masken-Boundary (Slot 2) mit {maskPolygon.length} Punkten
              </span>
            ) : (
              <span style={{ marginLeft: 16, color: '#a0aec0' }}>
                Zweites Polygon zeichnen → wird Masken-Boundary (Slot 2)
              </span>
            )
          )}
          {overlayCatalogId && (
            <span style={{ marginLeft: 16, color: '#c8389b' }}>
              ● POI-Overlay: {CATALOGS.find((c) => c.id === overlayCatalogId)?.name}
            </span>
          )}
        </div>
      )}

      {/* Footer-Leiste (Wegnetz): Summen-Infos aus dem alten Filter — grünes
          Netz-Feld + gelbes Maskierung/POI-Anker-Feld. */}
      {tab === 'wegnetz' && pathStatus === 'done' && pathResult && (
        <div style={{
          display: 'flex', gap: 8, padding: '5px 12px', fontSize: 11,
          background: '#f7fafc', borderTop: '1px solid #e2e8f0',
        }}>
          {/* GRÜN — Netz-Zusammenfassung */}
          <div style={{
            flex: 1, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center',
            padding: '5px 9px', borderRadius: 5, background: '#f0fff4', border: '1px solid #9ae6b4', color: '#22543d',
          }}>
            {netSummary && (
              <span style={{ fontWeight: 700 }}>
                Σ Netz {Math.round(netSummary.net)} m
                <span style={{ fontWeight: 400, color: '#2f6f4f' }}> ( Wanderweg {Math.round(netSummary.wander)} m · <span style={{ color: '#1a202c' }}>Asphalt {Math.round(netSummary.asphalt)} m</span> )</span>
              </span>
            )}
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #222a35', verticalAlign: 'middle' }} /> <b>Netz</b> (schwarz, ≥{netLenThresh} m)</span>
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '2px solid #1f9d8f', verticalAlign: 'middle' }} /> <b>Rest</b>{netSummary && <span style={{ color: '#718096' }}> (∉ {Math.round(netSummary.rest)} m)</span>}</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 5, background: '#fff', border: '1.5px solid #1a202c', verticalAlign: 'middle' }} /> <b>Asphalt</b></span>
            {sackgassenRot && <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #e53e3e', verticalAlign: 'middle' }} /> Sackgassen</span>}
            {cutEdges.size > 0 && <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #3182ce', verticalAlign: 'middle' }} /> {cutEdges.size} abgeschnitten</span>}
            <span style={{ color: '#718096' }}>{pathResult.primaryCount} primär · {pathResult.connectorCount} Konnekt. · {pathResult.rawWayCount} Ways</span>
            {netSummary && (
              <span style={{ fontFamily: 'monospace', color: '#2c5282' }}>
                {netSummary.points} Punkte · <b>{formatBytes(netSummary.bytes)}</b>
              </span>
            )}
            {/* Datengröße-Reduktion (Auslieferungs-Budget): DP-Korridor + Stellen. */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4a5568' }} title="Punkt-Reduktion (Douglas-Peucker): garantierter ±-Korridor, Kurven bleiben drin, Kreuzungen erhalten">
              DP <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{dpEps.toFixed(2)} m</span>
              <input type="range" min={0} max={0.3} step={0.03} value={dpEps}
                onChange={(e) => setDpEps(Number(e.target.value))} style={{ width: 70, margin: 0 }} />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4a5568' }} title="Nachkommastellen runden (kleiner Zusatz-Hebel, ~5%); 7≈1cm · 6≈0,11m · 5≈1,1m">
              Stellen <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{coordDecimals}</span>
              <input type="range" min={5} max={7} step={1} value={coordDecimals}
                onChange={(e) => setCoordDecimals(Number(e.target.value))} style={{ width: 50, margin: 0 }} />
            </span>
          </div>
          {/* GELB — Maskierung + POI-Anker */}
          {((masked && cropResult) || anchorSummary) && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center',
              padding: '5px 9px', borderRadius: 5, background: '#fffaf0', border: '1px solid #fbd38d', color: '#7c2d12',
            }}>
              {masked && cropResult && (
                <span><b>Maskierung:</b> {cropResult.keptCount} innen · {cropResult.clippedCount} gekappt · {cropResult.droppedCount} weg · {cropResult.gates.length} Gates</span>
              )}
              {anchorSummary && (
                <span><b>POI-Anker:</b> <span style={{ color: '#dd6b20' }}>●</span>{anchorSummary.connected} <span style={{ color: '#2f855a' }}>●</span>{anchorSummary.onPath} <span style={{ color: '#a0aec0' }}>●</span>{anchorSummary.outside}</span>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Wegnetz-Filter-Menue (Phase 2: UI + localStorage, keine Wirkung) ─────────

function PathFilterMenu({
  gebiet, gebietLabel, canApply, onResized, onCfgChange, status, error,
  includeCount, onClearInclude, cutCount, onClearCut,
  excludedCount, onRemoveGreen, onClearExcluded,
}: {
  gebiet: string;
  gebietLabel: string;
  canApply: boolean;
  onResized: () => void;
  onCfgChange: (cfg: PathConfig) => void;
  status: 'idle' | 'loading' | 'done' | 'error';
  error: string;
  includeCount: number;
  onClearInclude: () => void;
  cutCount: number;
  onClearCut: () => void;
  excludedCount: number;
  onRemoveGreen: () => void;
  onClearExcluded: () => void;
}) {
  // US2: zwei gestapelte Drop-Panels links — Filter + Profi, immer nur eins offen;
  // null = beide eingeklappt (zwei vertikale Reopen-Tabs).
  const [panelOpen, setPanelOpen] = useState<'filter' | 'pro' | null>('filter');
  const [cfg, setCfg] = useState<PathConfig>(() => loadPathConfig(gebiet));

  // Bei Gebietswechsel (andere Inspector-R) neue Config laden
  useEffect(() => { setCfg(loadPathConfig(gebiet)); }, [gebiet]);

  // Auto-Save bei jeder Aenderung
  useEffect(() => {
    if (!gebiet) return;
    savePathConfig({ ...cfg, gebiet });
  }, [cfg, gebiet]);

  // Config nach oben spiegeln (US3): der Anwenden-Knopf im Tool-Header braucht sie.
  useEffect(() => { onCfgChange(cfg); }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (fn: (c: PathConfig) => PathConfig) => setCfg((c) => fn(c));

  // Profi-Panel-Inhalt (selten gebrauchte Defaults).
  const proBody = (
    <>
      <Section title="Diagnose">
        <Check
          label="Lücken markieren"
          checked={cfg.diagnose.luecken_markieren}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, luecken_markieren: v } }))}
        />
        <Slider
          label="POI-Ausnahme-Distanz"
          value={cfg.diagnose.sackgasse_poi_ausnahme_meter}
          min={0} max={100} step={5}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, sackgasse_poi_ausnahme_meter: v } }))}
        />
      </Section>

      <Section title="Anker (POI-Verbindung)">
        <Slider
          label="Snap-Schwelle"
          value={cfg.anker.snap_schwelle_meter}
          min={0.5} max={6} step={0.5}
          onChange={(v) => update((c) => ({ ...c, anker: { ...c.anker, snap_schwelle_meter: v } }))}
        />
        <div style={{ padding: '0 10px', fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          Unter der Schwelle gilt der POI als auf dem Pfad; darüber bekommt er
          einen connected-POI-Stich (ann_074). Gelände-abhängig.
        </div>
      </Section>
    </>
  );

  // Vollständig eingeklappt → zwei vertikale Reopen-Tabs (Filter oben, Profi unten).
  if (panelOpen === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #cbd5e0' }}>
        <ReopenTab label="FILTER" onClick={() => { setPanelOpen('filter'); onResized(); }} />
        <ReopenTab label="PROFI" onClick={() => { setPanelOpen('pro'); onResized(); }} />
      </div>
    );
  }

  const isFilter = panelOpen === 'filter';
  return (
    <div style={{
      width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#f7fafc', borderRight: '1px solid #cbd5e0', fontSize: 12, color: '#2d3748',
    }}>
      {/* Kopf des offenen Panels */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#edf2f7', flexShrink: 0,
      }}>
        <button
          onClick={() => { setPanelOpen(isFilter ? 'pro' : null); onResized(); }}
          title={isFilter ? 'Weiter zu Profi (nochmal: einklappen)' : 'Einklappen'}
          style={{
            fontSize: 12, padding: '2px 8px', cursor: 'pointer',
            border: '1px solid #cbd5e0', borderRadius: 4, background: 'white', color: '#718096',
          }}
        >
          ◂
        </button>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>{isFilter ? 'Wegnetz-Filter' : 'Profi'}</span>
      </div>

      {/* Scrollbarer Inhalt des offenen Panels */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {isFilter ? (
          <>
            {!canApply && (
              <div style={{
                margin: 10, padding: '8px 10px', fontSize: 11, lineHeight: 1.5,
                background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 5, color: '#7c2d12',
              }}>
                Keine Quelle fürs Netz. Eine Boundary zeichnen, einen Katalog binden
                oder eine Inspector-Representation wählen.
              </div>
            )}

      <Section title="Region">
        <div style={{ padding: '0 10px 4px', fontSize: 12 }}>
          {gebiet
            ? <span><strong>{gebietLabel}</strong> <span style={{ color: '#a0aec0', fontFamily: 'monospace' }}>({gebiet})</span></span>
            : <span style={{ color: '#a0aec0' }}>— aus Inspector —</span>}
        </div>
      </Section>

      <Section title="Primäre Wegklassen">
        {([
          ['track', 'Forst-/Wirtschaftsweg (track)'],
          ['footway', 'Fußweg (footway)'],
          ['path', 'Pfad (path)'],
          ['steps', 'Treppe (steps)'],
          ['pedestrian', 'Fußgängerbereich (pedestrian)'],
        ] as [keyof PathConfig['primaere_wege'], string][]).map(([key, label]) => (
          <Check
            key={key}
            label={label}
            checked={cfg.primaere_wege[key] === true}
            onChange={(v) => update((c) => ({ ...c, primaere_wege: { ...c.primaere_wege, [key]: v } }))}
          />
        ))}
        {/* bridleway: tri-state */}
        <div style={{ padding: '3px 10px' }}>
          <label style={{ display: 'block', marginBottom: 3 }}>Reitweg (bridleway)</label>
          <select
            value={String(cfg.primaere_wege.bridleway)}
            onChange={(e) => {
              const raw = e.target.value;
              const val: BridlewayMode = raw === 'true' ? true : raw === 'false' ? false : 'nur_wenn_foot_erlaubt';
              update((c) => ({ ...c, primaere_wege: { ...c.primaere_wege, bridleway: val } }));
            }}
            style={{ width: '100%', fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0' }}
          >
            <option value="nur_wenn_foot_erlaubt">nur wenn Fußverkehr erlaubt</option>
            <option value="true">immer aufnehmen</option>
            <option value="false">nie aufnehmen</option>
          </select>
        </div>
      </Section>

      <Section title="Konnektoren">
        <Connector
          label="Nebenstraße"
          hint="service · residential · living_street · unclassified"
          aktiv={cfg.konnektoren.nebenstrasse.aktiv}
          max={cfg.konnektoren.nebenstrasse.max_laenge_meter}
          onAktiv={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, nebenstrasse: { ...c.konnektoren.nebenstrasse, aktiv: v } } }))}
          onMax={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, nebenstrasse: { ...c.konnektoren.nebenstrasse, max_laenge_meter: v } } }))}
        />
        <Connector
          label="Landstraße"
          hint="tertiary · secondary · primary"
          aktiv={cfg.konnektoren.landstrasse.aktiv}
          max={cfg.konnektoren.landstrasse.max_laenge_meter}
          onAktiv={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, landstrasse: { ...c.konnektoren.landstrasse, aktiv: v } } }))}
          onMax={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, landstrasse: { ...c.konnektoren.landstrasse, max_laenge_meter: v } } }))}
        />
        <Slider
          label="Anschluss-Toleranz"
          value={cfg.konnektoren.anschluss_toleranz_meter}
          min={0} max={250} step={5}
          onChange={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, anschluss_toleranz_meter: v } }))}
        />
        <div style={{ padding: '0 10px', fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          Abstand, bis zu dem ein grünes Wegende als auf der Straße liegend gilt
          (Verschweißen). Größer = mehr Gabeln verbinden, aber Risiko fremder Anschlüsse.
        </div>
      </Section>

      <Section title="Ausschlüsse">
        <div style={{ padding: '0 10px 4px', fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          Wirft Wege mit diesen OSM-Zugangs-Tags raus — Wege, die laut Daten nicht
          (zu Fuß) begehbar oder privat/gesperrt sind.
        </div>
        <Check
          label="foot=no (nicht für Fußverkehr)"
          checked={cfg.ausschluesse.foot_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, foot_no: v } }))}
        />
        <Check
          label="access=private"
          checked={cfg.ausschluesse.access_private}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_private: v } }))}
        />
        <Check
          label="access=no (gesperrt)"
          checked={cfg.ausschluesse.access_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_no: v } }))}
        />
      </Section>

      <Section title="Sackgassen & Anwahl">
        <div style={{ padding: '0 10px', fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          Netz-Schwelle, Sackgassen, Verbinden und OSM-Anwählen liegen jetzt in der
          <b> Werkzeugleiste oben</b>. Hier nur die Rücksetzer der Hand-Markierungen:
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cutCount > 0 && (
              <button
                onClick={onClearCut}
                style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  border: '1px solid #90cdf4', background: '#ebf8ff', color: '#3182ce', cursor: 'pointer',
                }}
              >
                {cutCount} blau · zurücksetzen
              </button>
            )}
            {includeCount > 0 && (
              <button
                onClick={onClearInclude}
                style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  border: '1px solid #d6bcfa', background: '#faf5ff', color: '#9333ea', cursor: 'pointer',
                }}
              >
                {includeCount} aufgenommen · zurücksetzen
              </button>
            )}
            {cutCount === 0 && includeCount === 0 && (
              <span style={{ color: '#cbd5e0' }}>keine</span>
            )}
          </div>
          <div style={{ marginTop: 6 }}>
            <b>Entfernen:</b> Segmente per Klick raus (Werkzeug „🗑" oben).
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                onClick={onRemoveGreen}
                style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  border: '1px solid #9ae6b4', background: '#f0fff4', color: '#276749', cursor: 'pointer',
                }}
              >
                alle Grünen entfernen
              </button>
              {excludedCount > 0 && (
                <button
                  onClick={onClearExcluded}
                  style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    border: '1px solid #cbd5e0', background: '#edf2f7', color: '#4a5568', cursor: 'pointer',
                  }}
                >
                  {excludedCount} entfernt · zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Status (Fehler) — Summen-Infos (grün/gelb) liegen in der Footer-Leiste. */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {status === 'error' && (
          <div style={{
            fontSize: 11, lineHeight: 1.5, padding: '7px 9px', borderRadius: 5,
            background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c',
          }}>
            ✗ {error}
          </div>
        )}
      </div>
          </>
        ) : proBody}
      </div>

      {/* Umschalt-Leiste zum anderen Panel (immer nur eins offen). */}
      <button
        onClick={() => { setPanelOpen(isFilter ? 'pro' : 'filter'); onResized(); }}
        title={`${isFilter ? 'Profi' : 'Wegnetz-Filter'} öffnen`}
        style={{
          flexShrink: 0, cursor: 'pointer', textAlign: 'left',
          padding: '8px 10px', border: 'none', borderTop: '1px solid #cbd5e0',
          background: '#edf2f7', color: '#2b6cb0', fontWeight: 700, fontSize: 12,
        }}
      >
        ▸ {isFilter ? 'Profi' : 'Wegnetz-Filter'}
      </button>
    </div>
  );
}

// Ebenen-Steuerleiste (A): ein Layer = On/Off-Checkbox + Opacity-Slider.
// US2 — vertikaler Reopen-Tab für ein eingeklapptes Drop-Panel (Filter/Profi).
function ReopenTab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="drawer-filter-reopen"
      onClick={onClick}
      title={`${label} ausklappen`}
      style={{
        width: 28, flexShrink: 0, cursor: 'pointer',
        background: '#edf2f7', border: 'none', borderRight: '1px solid #cbd5e0', borderBottom: '1px solid #cbd5e0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '10px 0', color: '#2b6cb0',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700 }}>▸</span>
      <span style={{ writingMode: 'vertical-rl', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#718096' }}>
        {label}
      </span>
    </button>
  );
}

// US3 — kompakter Inline-Schieber für die Tool-Header-Leiste (Label oben, Wert mit).
function ToolSlider({
  label, value, min, max, step, unit = 'm', onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 104 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#4a5568', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {label} <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{value}{unit}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', margin: 0 }}
      />
    </div>
  );
}

// US1 — generischer Tool-Knopf für die Tool-Header-Leiste (Toggle/Aktion).
function ToolToggle({
  label, title, active, onClick, disabled,
}: {
  label: string; title: string; active?: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
        border: `1px solid ${disabled ? '#cbd5e0' : active ? '#2b6cb0' : '#cbd5e0'}`,
        background: disabled ? '#edf2f7' : active ? '#ebf8ff' : '#fff',
        color: disabled ? '#a0aec0' : active ? '#2b6cb0' : '#4a5568',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// Katalog-POI-Control: wie LayerDimmer, aber der Regler ändert die Marker-GRÖSSE
// (0,5×–3×) statt der Opacity.
function LayerSizer({
  label, color, on, size, onToggle, onSize, disabled, disabledHint,
}: {
  label: string; color: string; on: boolean; size: number;
  onToggle: (v: boolean) => void; onSize: (v: number) => void;
  disabled?: boolean; disabledHint?: string;
}) {
  return (
    <div
      title={disabled ? disabledHint : `${label} — ein-/ausblenden + Platzhalter vergrößern/verkleinern`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.45 : 1 }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="checkbox"
          checked={on}
          disabled={disabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <span style={{ fontSize: 11, color: on && !disabled ? color : '#718096', fontWeight: 600 }}>{label}</span>
      </label>
      <input
        type="range" min={0.5} max={3} step={0.25} value={size}
        disabled={disabled || !on}
        onChange={(e) => onSize(Number(e.target.value))}
        title="Größe der Platzhalter-POIs"
        style={{ width: 64, cursor: (disabled || !on) ? 'not-allowed' : 'pointer' }}
      />
    </div>
  );
}

function LayerDimmer({
  label, color, on, opacity, onToggle, onOpacity, disabled, disabledHint,
}: {
  label: string; color: string; on: boolean; opacity: number;
  onToggle: (v: boolean) => void; onOpacity: (v: number) => void;
  disabled?: boolean; disabledHint?: string;
}) {
  return (
    <div
      title={disabled ? disabledHint : `${label} — ein-/ausblenden + dimmen`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.45 : 1 }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="checkbox"
          checked={on}
          disabled={disabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <span style={{ fontSize: 11, color: on && !disabled ? color : '#718096', fontWeight: 600 }}>{label}</span>
      </label>
      <input
        type="range" min={0} max={1} step={0.05} value={opacity}
        disabled={disabled || !on}
        onChange={(e) => onOpacity(Number(e.target.value))}
        style={{ width: 64, cursor: (disabled || !on) ? 'not-allowed' : 'pointer' }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid #edf2f7' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '7px 10px', cursor: 'pointer',
          border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700,
          color: '#4a5568', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 9, color: '#a0aec0' }}>{open ? '▾' : '▸'}</span>
        {title}
      </button>
      {open && <div style={{ paddingBottom: 6 }}>{children}</div>}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: '4px 10px' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{value} m</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function Connector({
  label, hint, aktiv, max, onAktiv, onMax,
}: {
  label: string; hint: string; aktiv: boolean; max: number;
  onAktiv: (v: boolean) => void; onMax: (v: number) => void;
}) {
  return (
    <div style={{ padding: '4px 10px 6px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={aktiv} onChange={(e) => onAktiv(e.target.checked)} />
        <span style={{ fontWeight: 600 }}>{label}</span>
      </label>
      <div style={{ fontSize: 10, color: '#a0aec0', margin: '1px 0 3px 22px', fontFamily: 'monospace' }}>{hint}</div>
      <div style={{ opacity: aktiv ? 1 : 0.4, pointerEvents: aktiv ? 'auto' : 'none' }}>
        <Slider label="max. Länge" value={max} min={0} max={500} step={10} onChange={onMax} />
      </div>
    </div>
  );
}

