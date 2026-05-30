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
import { getDraft, createDraft, updateDraft, localStorageBytes, localStorageBreakdown } from '../../workspace/draftStore';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import RepresentBuildTetrahedron from '../RepresentBuildTetrahedron';
import type { RepresentBuildFace } from '../RepresentBuildTetrahedron';
import { useInspectorView } from '../../../runtime/repContext';
import {
  loadPathConfig, savePathConfig, type PathConfig, type BridlewayMode,
} from '../../regio-content/pathConfig';
import {
  deriveWanderwegnetz, anchorPois, isNetEdge, cropNetToMask, netStats, formatBytes,
  type PathFetchResult, type AnchorSummary, type PoiInput, type CropResult,
  type PathEdge, type GateNode,
} from '../../regio-content/pathEngine';
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

// Geoman-Werkzeugleiste fuer den Umriss-Tab. Wird beim Tab-Wechsel
// hinzugefuegt/entfernt, damit die Zeichen-Controls im Wegnetz-Tab nicht
// stoeren.
function addBoundaryControls(map: L.Map): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (map as any).pm.addControls({
    position: 'topleft',
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: true,
    drawPolygon: true,
    drawCircle: false,
    drawText: false,
    editMode: true,
    dragMode: false,
    cutPolygon: false,
    removalMode: true,
    rotateMode: false,
  });
}

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

  // Inspector-Compare: das Polygon der vom Inspector gezeigten R kann
  // als read-only Referenz in Violett unter den Editor gelegt werden
  // (Tracing-Vorlage). Toggle separat, default aus.
  const inspectorView = useInspectorView();
  const [showInspectorRef, setShowInspectorRef] = useState(false);
  // Snap-Quelle aus Inspector-R (Umbauplan C): rasten Stuetzpunkte beim Zeichnen
  // auf die Punkte/Kanten der lila Vorlage ein. Nur sinnvoll, wenn die Vorlage
  // sichtbar ist.
  const [snapToTemplate, setSnapToTemplate] = useState(true);

  // Ebenen-Steuerleiste (Umbauplan A): Dimmer + On/Off je Layer, auf beide Tabs
  // wirksam. (1) OSM-Tiles, (2) editierbare Boundary, (3) Inspector-R-Vorlage.
  const [tileVisible, setTileVisible] = useState(true);
  const [tileOpacity, setTileOpacity] = useState(0.75);
  const [boundaryVisible, setBoundaryVisible] = useState(true);
  const [boundaryOpacity, setBoundaryOpacity] = useState(1);
  const [inspectorOpacity, setInspectorOpacity] = useState(0.85);

  // Slot 2 (Umbauplan B): Masken-Boundary. Eigene Sichtbarkeit/Opacity.
  const [maskVisible, setMaskVisible] = useState(true);
  const [maskOpacity, setMaskOpacity] = useState(1);

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

    // Zeichen-Controls nur im Umriss-Tab (Init startet dort).
    addBoundaryControls(map);

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
    // F7.3: maskiert → B1 ist gesperrt, auch im Umriss-Tab keine Zeichen-Controls.
    if (tab === 'umriss' && !masked) {
      if (!pm.controlsVisible?.()) addBoundaryControls(map);
    } else {
      // Wegnetz oder maskiert: Boundary nur sichtbar, nicht bearbeitbar. Toolbar
      // entfernen genuegt (ohne Werkzeuge kein Editieren). Die globalen disable*-Methoden
      // genuegt (ohne Werkzeuge kein Editieren). Die globalen disable*-Methoden
      // von Geoman NICHT aufrufen — sie iterieren ueber alle Map-Layer und
      // greifen auf layer.pm zu; das programmatisch gezeichnete Boundary-Polygon
      // hat kein pm und liess Geoman crashen (weisser Screen). Stattdessen
      // gezielt nur am Boundary-Layer den Edit-Modus beenden, falls vorhanden.
      pm.removeControls?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (polygonLayerRef.current as any)?.pm?.disable?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (maskLayerRef.current as any)?.pm?.disable?.();
    }
  }, [tab, masked]); // eslint-disable-line react-hooks/exhaustive-deps

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
    layer.setStyle({ color, opacity: o, fillOpacity: 0 });
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
    layer.setStyle({ color, dashArray: SLOT2_DASH, opacity: o, fillOpacity: 0 });
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
    if (!overlayCatalogId) return;
    const cat = CATALOGS.find((c) => c.id === overlayCatalogId);
    if (!cat) return;
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id,
      region_name: cat.name,
      source_path: `data/${cat.id}_pois_plan.md`,
    });
    for (const p of parsed.pois) {
      if (!p.coord || (p.coord[0] === 0 && p.coord[1] === 0)) continue;
      const marker = L.circleMarker([p.coord[1], p.coord[0]], {
        radius: 4,
        color: '#c8389b',
        weight: 2,
        fillColor: '#fff',
        fillOpacity: 0.9,
      });
      marker.bindTooltip(p.text, { direction: 'top', offset: [0, -8], opacity: 0.9 });
      marker.addTo(layer);
    }
  }, [overlayCatalogId]);

  // Wegnetz auf den Map-Layer zeichnen. Primaere Wege gruen-blau; aktive
  // Konnektoren (Asphalt) grau darunter, damit sichtbar wird, wie sie Luecken
  // zwischen den Wegen schliessen. Inaktive Konnektoren bleiben unsichtbar.
  const renderPath = (res: PathFetchResult | null) => {
    const layer = pathLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!res) return;
    // Konnektoren zuerst (liegen unter den primaeren Wegen).
    for (const edge of res.edges) {
      if (edge.source === 'primary' || !isNetEdge(edge)) continue;
      L.polyline(edge.points, {
        color: '#8a94a6',
        weight: 3,
        opacity: 0.7,
      }).addTo(layer);
    }
    for (const edge of res.edges) {
      if (edge.source !== 'primary') continue;
      L.polyline(edge.points, {
        color: '#1f9d8f',
        weight: 2,
        opacity: 0.85,
      }).addTo(layer);
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

  // F7-Neufassung: Die Handoff-Brücke entfällt. Der Drawer schreibt direkt in den
  // Workspace-Draft (onSave); der Commit lebt im Workspace.

  // [Anwenden] im Wegnetz-Tab: Boundary-bbox -> Overpass -> Filter -> Render,
  // anschliessend POI-Anker (ann_074) berechnen + zeichnen.
  const onApplyPath = async (cfg: PathConfig) => {
    const map = mapRef.current;
    // Vorrang-Regel: das Netz wird aus der EIGENEN Boundary (B1) des Drafts abgeleitet.
    // Nur wenn der Drawer noch keine eigene Boundary hat, leiht der Inspector seine —
    // und sie wird dann als B1 übernommen (Inspector→B1).
    let src: Position[] | null = (polygon && polygon.length >= 3) ? polygon : null;
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
      setPathError('Keine Boundary — im Umriss-Tab eine zeichnen oder eine Inspector-R wählen.');
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
        <span style={{ flex: 1 }} />
        {/* F7-Diagnose: an welchen Draft bindet der Drawer + was liegt im Speicher? */}
        {geometryId === 'new' && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#718096', marginBottom: 6, marginRight: 8, whiteSpace: 'nowrap' }}>
            {activeDraftId ? `→ ${activeDraftId}` : '→ NEU'} · B1 {polygon?.length ?? 0} · B2 {maskPolygon?.length ?? 0} · Netz {pathResult ? 'ja' : '–'} · LS {formatBytes(localStorageBytes())}
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
        {tab === 'wegnetz' && (
          <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic', marginBottom: 4 }}>
            Primär-Filter + Konnektoren live · Verschweißen folgt
          </span>
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

      {/* F7-Diagnose: was füllt den localStorage wirklich? Top-Schlüssel. */}
      <div style={{
        margin: '2px 12px', padding: '4px 8px', borderRadius: 4,
        background: '#f7fafc', border: '1px solid #e2e8f0',
        fontSize: 9, fontFamily: 'monospace', color: '#718096', lineHeight: 1.5,
      }}>
        LS {formatBytes(localStorageBytes())} ·{' '}
        {localStorageBreakdown().slice(0, 6).map((e) => `${e.key}=${formatBytes(e.bytes)}`).join(' · ')}
      </div>

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
      </div>


      {/* Inhaltszeile: optionales Wegnetz-Filtermenue + gemeinsamer Map-Canvas */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {tab === 'wegnetz' && (
          <PathFilterMenu
            gebiet={inspectorView?.geometry.id ?? ''}
            gebietLabel={inspectorView?.geometry.name ?? ''}
            onResized={() => setTimeout(() => mapRef.current?.invalidateSize(), 60)}
            onApply={onApplyPath}
            status={pathStatus}
            error={pathError}
            result={pathResult}
            anchor={anchorSummary}
            crop={cropResult}
            masked={masked}
            onToggleMask={onToggleMask}
            canMask={!!maskPolygon && maskPolygon.length >= 3}
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

    </div>
  );
}

// ─── Wegnetz-Filter-Menue (Phase 2: UI + localStorage, keine Wirkung) ─────────

function PathFilterMenu({
  gebiet, gebietLabel, onResized, onApply, status, error, result, anchor,
  crop,
  masked, onToggleMask, canMask,
}: {
  gebiet: string;
  gebietLabel: string;
  onResized: () => void;
  onApply: (cfg: PathConfig) => void;
  status: 'idle' | 'loading' | 'done' | 'error';
  error: string;
  result: import('../../regio-content/pathEngine').PathFetchResult | null;
  anchor: AnchorSummary | null;
  crop: CropResult | null;
  masked: boolean;
  onToggleMask: () => void;
  canMask: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cfg, setCfg] = useState<PathConfig>(() => loadPathConfig(gebiet));

  // Bei Gebietswechsel (andere Inspector-R) neue Config laden
  useEffect(() => { setCfg(loadPathConfig(gebiet)); }, [gebiet]);

  // Auto-Save bei jeder Aenderung
  useEffect(() => {
    if (!gebiet) return;
    savePathConfig({ ...cfg, gebiet });
  }, [cfg, gebiet]);

  const update = (fn: (c: PathConfig) => PathConfig) => setCfg((c) => fn(c));

  if (collapsed) {
    return (
      <div
        onClick={() => { setCollapsed(false); onResized(); }}
        title="Filter-Menü ausklappen"
        style={{
          width: 18, flexShrink: 0, cursor: 'pointer',
          background: '#edf2f7', borderRight: '1px solid #cbd5e0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#718096', fontSize: 12,
        }}
      >
        ▸
      </div>
    );
  }

  return (
    <div style={{
      width: 290, flexShrink: 0, overflowY: 'auto',
      background: '#f7fafc', borderRight: '1px solid #cbd5e0',
      fontSize: 12, color: '#2d3748',
    }}>
      {/* Kopf */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#edf2f7',
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>Wegnetz-Filter</span>
        <button
          onClick={() => { setCollapsed(true); onResized(); }}
          title="Einklappen"
          style={{
            fontSize: 12, padding: '2px 8px', cursor: 'pointer',
            border: '1px solid #cbd5e0', borderRadius: 4, background: 'white', color: '#718096',
          }}
        >
          ◂
        </button>
      </div>

      {!gebiet && (
        <div style={{
          margin: 10, padding: '8px 10px', fontSize: 11, lineHeight: 1.5,
          background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 5, color: '#7c2d12',
        }}>
          Keine Region aktiv. Im rechten Inspector-Header eine Representation
          wählen — ihr Gebiet liefert den Konfig-Kontext.
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
        <Check
          label="foot=no"
          checked={cfg.ausschluesse.foot_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, foot_no: v } }))}
        />
        <Check
          label="access=private"
          checked={cfg.ausschluesse.access_private}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_private: v } }))}
        />
        <Check
          label="access=no"
          checked={cfg.ausschluesse.access_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_no: v } }))}
        />
      </Section>

      <Section title="Diagnose">
        <Check
          label="Lücken markieren"
          checked={cfg.diagnose.luecken_markieren}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, luecken_markieren: v } }))}
        />
        <Check
          label="Sackgassen ausblenden"
          checked={cfg.diagnose.sackgassen_ausblenden}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, sackgassen_ausblenden: v } }))}
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

      {/* Aktionen */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => {
            savePathConfig({ ...cfg, gebiet });
            onApply(cfg);
          }}
          disabled={!gebiet || status === 'loading'}
          style={{
            fontSize: 12, padding: '7px 12px', fontWeight: 600,
            border: '1px solid #2b6cb0', borderRadius: 5,
            background: status === 'loading' ? '#bee3f8' : '#ebf8ff',
            color: '#2b6cb0',
            cursor: (!gebiet || status === 'loading') ? 'not-allowed' : 'pointer',
            opacity: gebiet ? 1 : 0.5,
          }}
        >
          {status === 'loading' ? '… lade OSM' : 'Anwenden'}
        </button>

        {/* F7.3: KEIN destruktiver Crop-Button mehr. Der Schnitt passiert unsichtbar
            erst am Commit im Workspace. Die Maskierung unten ist eine reversible
            Vorschau; das crop-Info-Feld zeigt nur die Vorschau-Wirkung. */}
        {crop && (
          <div style={{
            fontSize: 11, lineHeight: 1.6, padding: '7px 9px', borderRadius: 5,
            background: '#fffaf0', border: '1px solid #fbd38d', color: '#7c2d12',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Maskierung</div>
            <div>{crop.keptCount} ganz innen · {crop.clippedCount} gekappt · {crop.droppedCount} verworfen</div>
            <div style={{ marginTop: 2 }}>
              <span style={{ color: '#2f855a' }}>●</span> {crop.gates.length} Gate-Knoten (inner/outer)
            </div>
          </div>
        )}
        {/* F7-Neufassung: Beschneiden-Toggle = reversible Vorschau. An → maskiertes
            Netz erzeugen/anzeigen; zurück → löschen, unmaskiertes anzeigen. */}
        <button
          onClick={onToggleMask}
          disabled={!canMask}
          title={
            !canMask ? 'Erst B2 (finale Boundary) im Umriss-Tab über B1 zeichnen'
              : masked ? 'Zurück — maskiertes Netz verwerfen, unmaskiertes zeigen'
              : 'Beschneiden: maskiertes Netz (Vorschau) erzeugen'
          }
          style={{
            fontSize: 12, padding: '7px 12px', fontWeight: 700,
            border: `1px solid ${masked ? '#2b6cb0' : '#c05621'}`, borderRadius: 5,
            background: !canMask ? '#edf2f7' : masked ? '#ebf8ff' : '#fff5f5',
            color: !canMask ? '#a0aec0' : masked ? '#2b6cb0' : '#c05621',
            cursor: canMask ? 'pointer' : 'not-allowed',
          }}
        >
          {masked ? '↩ zurück (unmaskiert)' : '▦ Beschneiden'}
        </button>
        <div style={{ fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          „Beschneiden" ist eine reversible Vorschau. Gespeichert wird oben mit
          „Speichern" — maskiert gespeichert = roter, committbarer Draft. Der Commit
          selbst passiert im Workspace.
        </div>

        {/* Status / Legende */}
        {status === 'error' && (
          <div style={{
            fontSize: 11, lineHeight: 1.5, padding: '7px 9px', borderRadius: 5,
            background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c',
          }}>
            ✗ {error}
          </div>
        )}
        {status === 'done' && result && (
          <div style={{
            fontSize: 11, lineHeight: 1.6, padding: '7px 9px', borderRadius: 5,
            background: '#f0fff4', border: '1px solid #9ae6b4', color: '#22543d',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 14, height: 0,
                borderTop: '2px solid #1f9d8f',
              }} />
              <strong>{result.primaryCount}</strong> primäre Wege
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                display: 'inline-block', width: 14, height: 0,
                borderTop: '3px solid #8a94a6',
              }} />
              <strong>{result.connectorCount}</strong> Bridge-Konnektoren (Asphalt)
            </div>
            <div style={{ color: '#718096', marginTop: 2 }}>
              {result.rawWayCount} OSM-Ways geladen
            </div>
            {/* F7: Netz-Datengröße (stabil, später fürs Auslieferungs-Budget). */}
            {(() => {
              const u = netStats(result.edges.filter((e) => e.inNet));
              const m = crop ? netStats(crop.edges.filter((e) => e.inNet)) : null;
              return (
                <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #9ae6b4', fontFamily: 'monospace', fontSize: 10, color: '#2c5282' }}>
                  Netz unmaskiert: {u.edgeCount} Kanten · {u.pointCount} Punkte · <strong>{formatBytes(u.bytes)}</strong>
                  {m && (
                    <div style={{ marginTop: 1 }}>
                      Netz maskiert: {m.edgeCount} Kanten · {m.pointCount} Punkte · <strong>{formatBytes(m.bytes)}</strong>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        {status === 'done' && anchor && (
          <div style={{
            fontSize: 11, lineHeight: 1.7, padding: '7px 9px', borderRadius: 5,
            background: '#fffaf0', border: '1px solid #fbd38d', color: '#7c2d12',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>POI-Anker</div>
            <div><span style={{ color: '#dd6b20' }}>●</span> {anchor.connected} connected (Stich)</div>
            <div><span style={{ color: '#2f855a' }}>●</span> {anchor.onPath} auf dem Pfad</div>
            <div><span style={{ color: '#a0aec0' }}>●</span> {anchor.outside} außerhalb der Boundary</div>
          </div>
        )}
        <div style={{ fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          „Anwenden" lädt OSM (Overpass) für die Region-Boundary und zeichnet
          primäre Wege (grün) plus aktive Konnektoren (grau). Lücken, Sackgassen
          und das Verschweißen folgen in späteren Phasen.
        </div>
      </div>
    </div>
  );
}

// Ebenen-Steuerleiste (A): ein Layer = On/Off-Checkbox + Opacity-Slider.
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

