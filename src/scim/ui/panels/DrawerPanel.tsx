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
import { useModeSwitch, isEditorRole, type Role } from '../RoleContext';
import { useInspectorView, useBoundRep } from '../../../runtime/repContext';
import {
  loadPathConfig, savePathConfig, type PathConfig, type BridlewayMode,
} from '../../regio-content/pathConfig';
import {
  deriveWanderwegnetz, anchorPois, netStats, formatBytes, isAsphalt, buildRoutePath, cropNetToMask,
  type PathFetchResult, type AnchorSummary, type PoiInput, type CropResult,
  type PathEdge, type GateNode,
} from '../../regio-content/pathEngine';
import {
  deriveNet, addDrawnEdge, deleteKeys, deleteAllRed, addPoi, removePoi, emptyModel,
  type NetModel, type ModelEdge, type LatLng, type GatePoi, type DerivedNet,
} from '../../regio-content/netModel';
import { drawNet } from '../netDraw';
import { ICON_REGISTRY } from '../../poi-catalog/iconRegistry';
import { parseCatalogById } from '../../poi-catalog/catalogRegistry';
import { mintToken, buildPrefix } from '../../poi-catalog/poiCatalog.token';
import type { CatalogPoi, Bucket, Subcategory } from '../../poi-catalog/poiCatalog.types';

// POI-Kategorien fürs Modal = Katalog-Subcategories + Gate (ohne Cluster).
const POI_CATEGORIES: { value: string; label: string }[] = [
  { value: 'gate', label: 'Gate · Ein-/Ausstieg' },
  { value: 'Transport_Vehicle', label: 'Transport · Bus/Bahn/Station' },
  { value: 'Transport_Parking', label: 'Transport · Parkplatz' },
  { value: 'Service_Sleep', label: 'Service · Übernachtung' },
  { value: 'Service_Others', label: 'Service · Sonstiges' },
  { value: 'Regenerate_Substanze', label: 'Regenerate · Substanz' },
  { value: 'Regenerate_Water', label: 'Regenerate · Wasser' },
  { value: 'Points_historical', label: 'Points · Historisch' },
  { value: 'Points_others', label: 'Points · Sonstiges' },
  { value: 'Square_Rest', label: 'Square · Rast' },
  { value: 'Square_Move', label: 'Square · Bewegung' },
  { value: 'Help_order', label: 'Help · Ordnung' },
  { value: 'Help_emergency', label: 'Help · Notfall' },
];

interface PoiDraft { at: LatLng; category: string; tagline: string; note: string; icon: string; editId?: string; }

// Katalog-Bucket aus dem Subcategory-Präfix.
function bucketOf(sub: string): Bucket {
  if (sub.startsWith('Square')) return 'Squares';
  if (sub.startsWith('Points')) return 'Points';
  if (sub.startsWith('Regenerate')) return 'Regenerate';
  if (sub.startsWith('Transport')) return 'Transport';
  if (sub.startsWith('Service')) return 'Service';
  if (sub.startsWith('Help')) return 'Help';
  return 'Points';
}

// Netz-Klassen-Kanten (klass 'net') → PathEdge[] für Crop/Commit.
function netToPathEdges(d: DerivedNet): PathEdge[] {
  return d.edges.filter((e) => e.klass === 'net').map((e) => ({
    id: e.wayId, highway: '', source: e.asphalt ? 'connector_candidate' : 'primary',
    points: e.points, tags: {}, inNet: true,
  }));
}
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

type DrawerTab = 'umriss' | 'wegnetz' | 'synchronizer';

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


// Technik-Tab „Synchronizer" (Operator/Review). Vorerst nur die Beschreibung —
// ein OSM ↔ OSM-Mesh-Synchronizer, der die OSM-Grundlage gegen unser Mesh prüft.
// Overlay über dem Map-Canvas (Karte bleibt darunter gemountet). Kein Editor.
function SynchronizerNotiz() {
  const H: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#234e52', margin: '12px 0 4px' };
  const P: React.CSSProperties = { fontSize: 12.5, color: '#4a5568', lineHeight: 1.55, margin: '2px 0' };
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1200, overflowY: 'auto',
      background: '#f0fdfa', padding: '18px 22px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10,
        fontSize: 10, fontFamily: 'monospace', color: '#285e61',
        background: '#d5f1ee', border: '1px solid #81e6d9', borderRadius: 4,
      }}>
        Technik · Drawer-Tab „Synchronizer" (OSM ↔ OSM-Mesh)
      </div>
      <h2 style={{ fontSize: 16, color: '#234e52', margin: '4px 0 10px' }}>OSM ↔ OSM-Mesh Synchronizer</h2>
      <p style={P}>
        Der <strong>Synchronizer überprüft die OSM-Grundlage</strong>, ob unser Mesh noch
        <strong> kohärent</strong> ist.
      </p>
      <div style={H}>Status</div>
      <p style={P}><em>Beschreibung gesetzt — die Prüf-Mechanik wird später gebaut.</em></p>
    </div>
  );
}

export default function DrawerPanel({ openGeometryId, onGeometryConsumed }: Props) {
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

  // Rollen-Maske (wie Katalog/Thresholds): Footer-Diode = activeMode (Sicht),
  // echtes Login = Effekt-Gate. live = echtes Login besitzt die Sicht und nicht
  // Review → onSave persistiert; sonst Sandbox (folgenlos). Editor: Umriss +
  // Wegnetz, gibt mit „Senden zu Committ" weiter (Commit lebt im Workspace).
  // Operator/Review: zusätzlich der Synchronizer-Tab (Technik).
  const mode = useModeSwitch();
  const activeMode: Role = mode?.activeMode ?? 'operator';
  const realRole: Role = mode?.real ?? 'operator';
  const live = realRole === activeMode && activeMode !== 'analyst';
  const showSynchronizer = !isEditorRole(activeMode);   // Technik-Tab nur Operator/Review
  // Editor stünde nie auf dem Synchronizer-Tab (existiert für ihn nicht) → zurückholen.
  useEffect(() => {
    if (tab === 'synchronizer' && !showSynchronizer) setTab('umriss');
  }, [tab, showSynchronizer]);

  // Wegnetz-Ableitung (Phase 3): Status + letztes Ergebnis fuer die Legende.
  type PathStatus = 'idle' | 'loading' | 'done' | 'error';
  const [pathStatus, setPathStatus] = useState<PathStatus>('idle');
  const [pathError, setPathError] = useState<string>('');
  const [pathResult, setPathResult] = useState<PathFetchResult | null>(null);
  const [anchorSummary, setAnchorSummary] = useState<AnchorSummary | null>(null);
  // Maskierung/Crop (Umbauplan D): Ergebnis des Zuschnitts mit der Slot-2-Maske.
  const [cropResult, setCropResult] = useState<CropResult | null>(null);

  // „Netz holen" lebt im Tool-Header. Dafür muss die Filter-Config eine Ebene
  // hoch (currentCfg).
  const [currentCfg, setCurrentCfg] = useState<PathConfig | null>(null);
  // Längen-Summen fürs Footer-Feld. „Netz" = nur SCHWARZE Komponenten (≥ Schwelle),
  // darin Wanderweg + Asphalt; „rest" = grüne Komponenten (vom Netz exkludiert).
  const [netSummary, setNetSummary] = useState<{ net: number; wander: number; asphalt: number; rest: number; bytes: number; points: number } | null>(null);
  // Datengröße-Reduktion (Footer): DP-Korridor (Punkte entfernen, ±eps garantiert)
  // + Nachkommastellen (Ziffern kürzen). Toleranzen addieren sich → unter 0,33 m.
  const [dpEps, setDpEps] = useState(0);
  const [coordDecimals, setCoordDecimals] = useState(7);

  // Wegnetz-Modell (Rückbau) — die EINE Wahrheit. Aus deriveNet(netModel) wird
  // alles abgeleitet (Färbung, Sackgassen, Netz=längste Komponente, Brücken).
  const [netModel, setNetModel] = useState<NetModel>(() => emptyModel());
  // OSM-Pool = Connector-Kandidaten aus dem Fetch; nur Quelle fürs Trassieren.
  const [osmPool, setOsmPool] = useState<ModelEdge[]>([]);
  const undoRef = useRef<NetModel[]>([]);
  const pushModel = (next: NetModel): void => { undoRef.current.push(netModel); setNetModel(next); };
  const undoModel = (): void => { const prev = undoRef.current.pop(); if (prev) setNetModel(prev); };
  // Karten-Klick-Modi (exklusiv): pickMode = Trassieren, removeMode = Löschen.
  const [pickMode, setPickMode] = useState(false);
  // Kurzstrecken-Modus: gleiche Geste wie Trassieren, aber feine Toleranzen
  // (kleiner Knoten-Merge + Mindeststück), damit kurze Strecken nicht kollabieren.
  const [shortMode, setShortMode] = useState(false);
  // Gate-Modus: Klick auf eine rote Sackgassen-Spitze setzt/entfernt ein Gate-POI
  // (Endpunkt wird gültiger Ein-/Ausstieg → Arm nicht mehr rot).
  const [poiMode, setPoiMode] = useState(false);
  // POI-Erfassung: beim Klick öffnet ein Modal; nach „Ablegen" landet der POI in
  // der Registry (op_model). Token erst beim Export → hier nur lokale id.
  const [poiDraft, setPoiDraft] = useState<PoiDraft | null>(null);
  const poiIdRef = useRef(1);
  const netModelRef = useRef<NetModel>(netModel);
  useEffect(() => { netModelRef.current = netModel; }, [netModel]);
  const snapEnabledRef = useRef(true); // gespiegelt (snapEnabled wird später deklariert)
  // Zwei-Punkt-Anwahl: erster Klick A merken, zweiter Klick B (beliebiger Punkt;
  // das A→B-Routing spannt über mehrere Ways/Kreuzungen). Die Hover-Spur zwischen
  // den Klicks entscheidet Verzweigungen.
  const [pendingConnect, setPendingConnect] = useState<{ lat: number; lng: number } | null>(null);
  const pendingConnectRef = useRef<{ lat: number; lng: number } | null>(null);
  const hoverTrailRef = useRef<[number, number][]>([]);
  const pickPreviewRef = useRef<L.LayerGroup | null>(null);
  const edgesRef = useRef<PathEdge[]>([]); // OP+OSM-Pool als PathEdge — Basis fürs Routing
  const routeModelEdgesRef = useRef<ModelEdge[]>([]); // dito als ModelEdge — für Asphalt-Lookup
  useEffect(() => { pendingConnectRef.current = pendingConnect; }, [pendingConnect]);

  // Zwei Klick-Werkzeuge: Trassieren = A→B über OSM routen. Kurzstrecke = freie,
  // GERADE Verbindung A→B, die NICHT aus OSM kommt (verbindet das OP über einen
  // Platz). Beide: Klick A, Klick B; Karten-Schieben nur zwischen A und B aus.
  // Bei Kurzstrecke werden A und B (bei Snap) auf den nächsten Netz-Knoten gerastet.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (!pickMode && !shortMode)) return undefined;

    const snapNode = (p: LatLng): LatLng => {
      if (!snapEnabledRef.current) return p;
      const nodes = deriveNet(netModelRef.current).nodes;
      let best = Infinity; let pick: LatLng | null = null;
      for (const c of nodes) {
        const mLng = 111320 * Math.cos((c[0] * Math.PI) / 180);
        const d = Math.hypot((p[1] - c[1]) * mLng, (p[0] - c[0]) * 110540);
        if (d < best) { best = d; pick = c; }
      }
      return (pick && best <= 12) ? pick : p;
    };

    const onClick = (ev: L.LeafletMouseEvent) => {
      const click: LatLng = [ev.latlng.lat, ev.latlng.lng];
      if (!pendingConnectRef.current) {
        const a = shortMode ? snapNode(click) : click; // Kurzstrecke: A auf Knoten rasten
        pendingConnectRef.current = { lat: a[0], lng: a[1] };
        setPendingConnect({ lat: a[0], lng: a[1] });
        hoverTrailRef.current = [[a[0], a[1]]];
        pickPreviewRef.current?.clearLayers();
        map.dragging.disable();
      } else {
        const a = pendingConnectRef.current;
        if (shortMode) {
          // GERADE Verbindung, nicht über OSM — über einen Platz hinweg → nosm.
          const b = snapNode(click);
          setNetModel((prev) => { undoRef.current.push(prev); return addDrawnEdge(prev, [[a.lat, a.lng], b], false, true); });
        } else {
          const route = buildRoutePath(edgesRef.current, [a.lat, a.lng], [click[0], click[1]], hoverTrailRef.current);
          if (route && route.points.length >= 2) {
            const mid = route.points[Math.floor(route.points.length / 2)];
            let best = Infinity; let asph = false;
            for (const e of routeModelEdgesRef.current) {
              for (const p of e.points) {
                const dd = (p[0] - mid[0]) ** 2 + (p[1] - mid[1]) ** 2;
                if (dd < best) { best = dd; asph = e.asphalt; }
              }
            }
            const straight = route.mode === 'straight';
            setNetModel((prev) => { undoRef.current.push(prev); return addDrawnEdge(prev, route.points, straight ? false : asph); });
          }
        }
        pendingConnectRef.current = null;
        setPendingConnect(null);
        hoverTrailRef.current = [];
        pickPreviewRef.current?.clearLayers();
        map.dragging.enable();
      }
    };
    const onMove = (ev: L.LeafletMouseEvent) => {
      const a = pendingConnectRef.current;
      if (!a) return; // nur zwischen A und B
      const cur: LatLng = [ev.latlng.lat, ev.latlng.lng];
      if (!pickPreviewRef.current) pickPreviewRef.current = L.layerGroup().addTo(map);
      if (shortMode) {
        // Gerade Vorschaulinie A→Cursor.
        pickPreviewRef.current.clearLayers();
        L.polyline([[a.lat, a.lng], cur], { color: '#9333ea', weight: 3, opacity: 0.75, dashArray: '4 5' }).addTo(pickPreviewRef.current);
        return;
      }
      // Trassieren: Spur aufzeichnen (Drossel) + geroutete Vorschau.
      const trail = hoverTrailRef.current;
      const last = trail[trail.length - 1];
      if (last) {
        const mLng = 111320 * Math.cos((cur[0] * Math.PI) / 180);
        const d = Math.hypot((cur[1] - last[1]) * mLng, (cur[0] - last[0]) * 110540);
        if (d < 4) return;
      }
      trail.push([cur[0], cur[1]]);
      pickPreviewRef.current.clearLayers();
      const preview = buildRoutePath(edgesRef.current, [a.lat, a.lng], [cur[0], cur[1]], trail);
      if (preview && preview.points.length >= 2) {
        L.polyline(preview.points, {
          color: '#9333ea', weight: 3, opacity: 0.75,
          ...(preview.mode === 'straight' ? { dashArray: '4 5' } : {}),
        }).addTo(pickPreviewRef.current);
      }
    };
    map.on('click', onClick);
    map.on('mousemove', onMove);
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
      map.dragging.enable(); // beim Verlassen sicher wieder an
      pendingConnectRef.current = null;
      hoverTrailRef.current = [];
      pickPreviewRef.current?.clearLayers();
    };
  }, [pickMode, shortMode]);

  // POI-Werkzeug: Klick platziert einen POI. Frei platzierbar; bei aktivem Snap
  // rastet er auf den nächsten Graph-Knoten (innerhalb der Treffer-Toleranz). Es
  // öffnet ein Modal (Kategorie/Tagline/Notiz/Icon). Ein POI an einer Sackgassen-
  // Spitze legitimiert den Arm (rot→net).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !poiMode) return undefined;
    const onClick = (ev: L.LeafletMouseEvent) => {
      const click: LatLng = [ev.latlng.lat, ev.latlng.lng];
      const m = netModelRef.current;
      // Bestehendes POI in der Nähe? → dessen Modal zum Bearbeiten öffnen.
      let editHit: GatePoi | null = null; let editBest = Infinity;
      for (const g of m.gates) {
        const mLng = 111320 * Math.cos((g.at[0] * Math.PI) / 180);
        const dist = Math.hypot((click[1] - g.at[1]) * mLng, (click[0] - g.at[0]) * 110540);
        if (dist < editBest) { editBest = dist; editHit = g; }
      }
      if (editHit && editBest <= 12) {
        const id = editHit.id ?? `poi-${poiIdRef.current++}`;
        setPoiDraft({ at: editHit.at, category: editHit.category ?? 'gate', tagline: editHit.tagline ?? '', note: editHit.note ?? '', icon: editHit.icon ?? '', editId: id });
        return;
      }
      // Sonst neu: frei platzieren, bei Snap auf den nächsten Knoten einrasten.
      let at: LatLng = click;
      if (snapEnabledRef.current) {
        const nodes = deriveNet(m).nodes;
        let best = Infinity; let pick: LatLng | null = null;
        for (const c of nodes) {
          const mLng = 111320 * Math.cos((c[0] * Math.PI) / 180);
          const dist = Math.hypot((at[1] - c[1]) * mLng, (at[0] - c[0]) * 110540);
          if (dist < best) { best = dist; pick = c; }
        }
        if (pick && best <= 12) at = pick;
      }
      setPoiDraft({ at, category: 'gate', tagline: '', note: '', icon: '' });
    };
    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, [poiMode]);

  const commitPoiDraft = (): void => {
    if (!poiDraft) return;
    const editId = poiDraft.editId;
    const poi: GatePoi = {
      at: poiDraft.at,
      category: poiDraft.category,
      tagline: poiDraft.tagline.trim() || undefined,
      note: poiDraft.note.trim() || undefined,
      icon: poiDraft.icon || undefined,
      id: editId ?? `poi-${poiIdRef.current++}`,
    };
    setNetModel((prev) => {
      undoRef.current.push(prev);
      if (editId) return { ...prev, gates: prev.gates.map((g) => (g.id === editId ? poi : g)) };
      return addPoi(prev, poi);
    });
    setPoiDraft(null);
  };

  // Löschen-Modus (removeMode): Klick auf ein Teilstück → deleteKeys im Modell.
  const [removeMode, setRemoveMode] = useState(false);

  // POI-Connector: Button → POIs 0,5–2 m vom Netz „schreien", jeder einzeln per
  // Klick verbindbar (Stich). <0,5 m = auf dem Pfad; >2 m = nicht verbindbar →
  // gilt als nicht akzeptiert (in der End-User-App stark ausgegraut).
  const [poiConnectMode, setPoiConnectMode] = useState(false);
  const [acceptedPois, setAcceptedPois] = useState<Set<string>>(new Set());
  // zuletzt angewandte Config (für Anschluss-Toleranz beim manuellen Anwählen).
  const lastCfgRef = useRef<PathConfig | null>(null);

  // Inspector-Compare: das Polygon der vom Inspector gezeigten R kann
  // als read-only Referenz in Violett unter den Editor gelegt werden
  // (Tracing-Vorlage). Toggle separat, default aus.
  const inspectorView = useInspectorView();
  const boundRep = useBoundRep();   // gebundene Rep (Pathworks-Editor) — Fallback-Öffnungsziel
  const [showInspectorRef, setShowInspectorRef] = useState(false);
  // Snap-Quelle aus Inspector-R (Umbauplan C): rasten Stuetzpunkte beim Zeichnen
  // auf die Punkte/Kanten der lila Vorlage ein. Nur sinnvoll, wenn die Vorlage
  // sichtbar ist.
  const [snapToTemplate, setSnapToTemplate] = useState(true);
  // US1 — Master-Snap-Toggle der Tool-Header-Leiste (beide Tabs). Treibt Geomans
  // globales Snapping; default an.
  const [snapEnabled, setSnapEnabled] = useState(true);
  useEffect(() => { snapEnabledRef.current = snapEnabled; }, [snapEnabled]);
  // UÖ1/UÖ2 — Umriss: Geoman-Toolbar ist weg; Zeichnen/Bearbeiten laufen über
  // eigene Werkzeuge (kein Rechteck, kein globales disable → kein Weißer-Screen).
  const [umrissDraw, setUmrissDraw] = useState(false);
  const [umrissEdit, setUmrissEdit] = useState(false);
  // UÖ6: sobald B2 existiert, ist B2 default bearbeitbar; B1 nur, wenn editB1 an
  // (Toggle erscheint nach „Bearbeiten"). B1 bleibt sonst Snap-Quelle.
  const [editB1, setEditB1] = useState(false);

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
  // Effektives Öffnungs-Ziel: explizites openGeometryId (Card-Knopf) ODER — falls
  // keins kommt (z.B. Eintritt über eine Control-Face) — die GEBUNDENE Rep. So
  // zeigt der Drawer immer die Rep, an der die Werkzeuge hängen.
  const effectiveOpenId = openGeometryId
    ?? (boundRep ? (boundRep.origin === 'draft' ? boundRep.id : boundRep.geometryId) : null);
  const initial = useMemo(() => {
    if (effectiveOpenId?.startsWith('draft-')) {
      const d = getDraft(effectiveOpenId);
      // F7.2: Slot 1 (polygon) = B1/Referenz = draft.reference; Slot 2 (maskPolygon)
      // = B2/finale Boundary = draft.boundary.
      if (d) return {
        draftId: d.id, geometryId: 'new' as const, name: d.name, region: '',
        polygon: d.reference ?? null, maskPolygon: d.boundary ?? null,
        catalogId: d.catalog_id ?? '', pathFetch: d.path_fetch ?? null, opModel: d.op_model ?? null,
      };
    }
    if (effectiveOpenId) {
      const g = GEOMETRIES.find((x) => x.id === effectiveOpenId);
      if (g) return {
        draftId: null, geometryId: g.id, name: g.name, region: g.region ?? '',
        polygon: g.polygon, maskPolygon: null, catalogId: '', pathFetch: null, opModel: null,
      };
    }
    return { draftId: null, geometryId: 'new' as const, name: '', region: '', polygon: null, maskPolygon: null, catalogId: '', pathFetch: null, opModel: null };
  }, [effectiveOpenId]);
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
    if (!live) return;                                // Sandbox (Review/Vorschau) → folgenlos
    if (geometryId !== 'new') return;                 // committete Geometry = nur Ansicht
    if ((!polygon || polygon.length < 3) && (!maskPolygon || maskPolygon.length < 3)) return;
    const gebiet = inspectorView?.geometry.id ?? '';
    const gebietName = inspectorView?.geometry.name ?? '';
    // Committet wird das EDITIERTE Netz (Modell), nicht der rohe Fetch.
    const netEdges = netToPathEdges(deriveNet(netModel));
    const netUn = netEdges.length ? buildNet(netEdges, [], false, gebiet, gebietName) : null;
    // net_masked: das Modell-Netz auf B2 zugeschnitten (macht den Draft rot/committbar).
    const crop = (maskPolygon && maskPolygon.length >= 3) ? cropNetToMask(netEdges, maskPolygon) : null;
    const netMa = crop ? buildNet(crop.edges, crop.gates, true, gebiet, gebietName) : null;
    const patch = {
      name, reference: polygon, boundary: maskPolygon,
      net_unmasked: netUn, net_masked: netMa, catalog_id: overlayCatalogId || null,
      // Kompletter B1-Overpass-Fetch mitspeichern → beim Wiederöffnen kein
      // erneuter Overpass-Abruf, OSM-Pool für Trassieren sofort verfügbar.
      path_fetch: pathResult,
      // Editiertes OP-Netz (Trassierungen/Löschungen/Gates) = die Wahrheit des
      // Netz-Edits; beim Öffnen wiederhergestellt, damit Edits nicht verloren gehen.
      op_model: netModel,
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

  // POI-Export (Schritt 1 des „roten Briefs"): die NICHT-Gate-POIs der Registry
  // werden zu katalog-fertigen CatalogPoi (mit gemintetem Token) und als
  // poi_inbox in den Draft gelegt — der Workspace zeigt sie später als roten Brief.
  const [poiExportMsg, setPoiExportMsg] = useState<string>('');
  const onExportPois = () => {
    if (!overlayCatalogId || !activeDraftId) { setPoiExportMsg('Kein gebundener Katalog / ungespeicherter Draft.'); return; }
    const cat = parseCatalogById(overlayCatalogId);
    if (!cat) { setPoiExportMsg('Katalog nicht gefunden.'); return; }
    const prefix = buildPrefix(cat.token_verbund, cat.token_slug);
    const taken = new Set<string>(cat.pois.map((p) => p.id));
    const inbox: CatalogPoi[] = [];
    for (const g of netModel.gates) {
      if (!g.category || g.category === 'gate') continue; // Gates bleiben netz-intern
      const token = mintToken(prefix, taken); taken.add(token);
      inbox.push({
        id: token,
        bucket: bucketOf(g.category),
        subcategory: g.category as Subcategory,
        icon: g.icon ?? '',
        text: g.tagline ?? '',
        description_short: g.note || undefined,
        coord: [g.at[1], g.at[0]],   // [lon, lat]
        coord_status: 'exact',
      });
    }
    if (inbox.length === 0) { setPoiExportMsg('Keine exportierbaren POIs (nur Gates / leer).'); return; }
    updateDraft(activeDraftId, { poi_inbox: { catalogId: overlayCatalogId, pois: inbox } });
    setPoiExportMsg(`${inbox.length} POI(s) als „roter Brief" an Katalog „${cat.region_name}" gelegt — Sichten/Importieren im Workspace.`);
  };

  // Jede Änderung am Zustand → dirty (B2 nicht mehr solid; muss neu gespeichert werden).
  useEffect(() => { setSaved(false); }, [polygon, maskPolygon, masked, pathResult, netModel, overlayCatalogId, name]);

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

    // Hinweis: pm:edit / pm:markerdrag sind in Geoman LAYER-ONLY-Events — sie
    // blubbern NICHT zur Map. Der State-Commit nach dem Editieren passiert daher
    // layer-gebunden im Bearbeiten-Effekt (Suche „pm:edit" weiter unten).

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

    // B1-Overpass aus dem Draft wiederherstellen — kein erneuter Overpass-Abruf.
    // Modell speisen (OP = primär, OSM-Pool = Connector), dann zeichnet der
    // Render-Effekt automatisch.
    if (initial.pathFetch) {
      const pf = initial.pathFetch;
      setPathResult(pf);
      setPathStatus('done');
      // OSM-Pool (Connector-Kandidaten) für Trassieren aus dem Fetch.
      setOsmPool(pf.edges.filter((e) => e.source !== 'primary').map((e) => ({ id: e.id, points: e.points, source: 'osm', asphalt: isAsphalt(e) })));
      // OP: gespeichertes Editier-Modell bevorzugen (Trassierungen/Löschungen/
      // Gates bleiben erhalten); sonst frisch aus dem primären Netz seeden.
      if (initial.opModel) {
        setNetModel(initial.opModel);
      } else {
        setNetModel({ edges: pf.edges.filter((e) => e.source === 'primary').map((e) => ({ id: e.id, points: e.points, source: 'osm', asphalt: isAsphalt(e) })), excluded: [], gates: [] });
      }
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
    if (umrissDraw) {
      pm?.enableDraw?.('Polygon', {
        tooltips: false,
        cursorMarker: false,
        // Zeichen-Stroke dezent (Stärke ~0.6) + leichte, dünne Hintline.
        pathOptions: { color: SLOT1_COLOR, weight: 2, opacity: 0.9, fillOpacity: 0 },
        templineStyle: { color: SLOT1_COLOR, weight: 2, opacity: 0.85 },
        hintlineStyle: { color: SLOT1_COLOR, weight: 1.5, opacity: 0.5, dashArray: '4 5' },
      });
    } else {
      pm?.disableDraw?.();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1 = polygonLayerRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b2 = maskLayerRef.current as any;
    // Punkt löschen: Geoman entfernt einen Stützpunkt per Rechtsklick (contextmenu).
    pm?.setGlobalOptions?.({ removeVertexOn: 'contextmenu' });
    const hasB2 = !!(maskPolygon && maskPolygon.length >= 3);
    if (umrissEdit) {
      // B2 default bearbeitbar; B1 nur ohne B2 ODER wenn editB1 an (sonst Snap-Quelle).
      if (hasB2) b2?.pm?.enable?.({ allowSelfIntersection: false }); else b2?.pm?.disable?.();
      if (!hasB2 || editB1) b1?.pm?.enable?.({ allowSelfIntersection: false }); else b1?.pm?.disable?.();
    } else { b1?.pm?.disable?.(); b2?.pm?.disable?.(); }
    // Feines Fadenkreuz nur im Zeichnen-Modus.
    mapContainerRef.current?.classList.toggle('scim-draw-cursor', tab === 'umriss' && !masked && umrissDraw);

    // Diese Geoman-Edit-Events feuern NUR auf dem Layer (nicht auf der Map —
    // map.on griff deshalb nie). Daher direkt an B1/B2 hängen:
    //   pm:markerdrag → invertiertes Außen-Fill LIVE nachführen (nur optisch).
    //   pm:edit       → die WAHRHEIT nachziehen: sobald ein Punkt abgelegt ist,
    //                   den ganzen Ring des Layers in den State schreiben →
    //                   alles (Fill, Speicherung, Netz) rendert aus dem neuen Ring.
    if (!umrissEdit) return undefined;
    const worldRing: L.LatLngExpression[] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
    const liveFill = () => {
      const inv = invFillLayerRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeLayer = (masked ? maskLayerRef.current : polygonLayerRef.current) as any;
      if (!inv || !activeLayer?.getLatLngs) return;
      const rings = activeLayer.getLatLngs();
      const ring = Array.isArray(rings[0]) ? rings[0] : rings;
      if (!Array.isArray(ring) || ring.length < 3) return;
      inv.setLatLngs([worldRing, ring]);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commit = (lyr: any) => {
      if (!lyr?.toGeoJSON) return;
      const ring = lyr.toGeoJSON().geometry.coordinates[0] as Position[];
      if (!ring || ring.length < 4) return; // GeoJSON-Ring ist geschlossen (Dreieck = 4 Punkte)
      if (lyr === polygonLayerRef.current) setPolygon(ring);
      else if (lyr === maskLayerRef.current) setMaskPolygon(ring);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attached: { lyr: any; onDrag: () => void; onEdit: () => void }[] = [];
    for (const lyr of [b1, b2]) {
      if (!lyr?.on) continue;
      const onDrag = () => liveFill();
      const onEdit = () => { liveFill(); commit(lyr); };
      lyr.on('pm:markerdrag', onDrag);
      lyr.on('pm:edit', onEdit);
      attached.push({ lyr, onDrag, onEdit });
    }
    return () => {
      for (const { lyr, onDrag, onEdit } of attached) {
        lyr.off?.('pm:markerdrag', onDrag);
        lyr.off?.('pm:edit', onEdit);
      }
    };
  }, [umrissDraw, umrissEdit, editB1, maskPolygon, tab, masked]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Beim Bearbeiten wird dieses Overlay aus dem State neu aufgebaut (Stand bei
    // Edit-Beginn) und dann vom Vertex-Drag live nachgeführt (Effekt unten),
    // damit das Fill mit den Punkten mitgeht statt nachzulaufen.
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
  }, [polygon, maskPolygon, geometryId, overlayCatalogId, boundaryVisible, boundaryOpacity, tab, masked, umrissEdit]);


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

  // EINE Zeichenfunktion: draw(deriveNet(netModel)). Plus im Trassier-Modus den
  // OSM-Pool (grau, klickbar A/B) und den A-Marker; die Vorschau zeichnet der
  // mousemove-Effekt. Im Lösch-Modus sind die Teilstücke klickbar (deleteKeys).
  const renderPath = (): void => {
    const layer = pathLayerRef.current;
    if (!layer) return;

    const poiCoords: [number, number][] = overlayCatalogId
      ? regionPois(overlayCatalogId).map((p) => [p.lat, p.lng] as [number, number])
      : [];
    const derived = deriveNet(netModel, poiCoords);

    // B2-Maskierungs-Vorschau: das NETZ auf die Maske zuschneiden; die Übertritte
    // an der Maskengrenze werden Gate-Knoten (gültige Enden, nicht rot).
    if (masked && maskPolygon && maskPolygon.length >= 3) {
      const crop = cropNetToMask(netToPathEdges(derived), maskPolygon);
      drawNet(layer, {
        edges: crop.edges.filter((e) => e.inNet).map((e, i) => ({ key: `${e.id}:c${i}`, wayId: e.id, seg: i, points: e.points, klass: 'net' as const, asphalt: e.source !== 'primary', deadEnd: false, nosm: false })),
        bridges: [], pois: [], redKeys: [], netMeters: 0, deadEnds: [], nodes: [],
      }, {});
      // Translate-POI-Paar an jedem Maskenrand-Übertritt: inner (im Netz) + outer (Nachbar).
      renderGates(crop.gates);
      return;
    }
    renderGates(null);

    drawNet(layer, derived, {
      onSegmentClick: removeMode ? (k) => pushModel(deleteKeys(netModel, [k])) : undefined,
      pickTooltip: removeMode ? 'Klick: Teilstück löschen' : undefined,
      showDeadEnds: poiMode,
    });

    // Footer-Summen aus dem Modell.
    const len = (pts: [number, number][]): number => {
      let m = 0;
      for (let i = 1; i < pts.length; i++) {
        const mLng = 111320 * Math.cos((pts[i][0] * Math.PI) / 180);
        m += Math.hypot((pts[i][1] - pts[i - 1][1]) * mLng, (pts[i][0] - pts[i - 1][0]) * 110540);
      }
      return m;
    };
    let net = 0; let asph = 0; let rest = 0;
    for (const e of derived.edges) {
      const m = len(e.points);
      if (e.klass === 'net') { net += m; if (e.asphalt) asph += m; } else rest += m;
    }
    const ns = netStats(netModel.edges.map((e) => ({ id: e.id, highway: '', source: 'primary' as const, points: e.points, tags: {}, inNet: true })));
    setNetSummary({ net, wander: net - asph, asphalt: asph, rest, bytes: ns.bytes, points: ns.pointCount });

    // Trassier-Basis: OP + OSM-Pool (für buildRoutePath im Drag-Effekt).
    routeModelEdgesRef.current = [...netModel.edges, ...osmPool];
    edgesRef.current = routeModelEdgesRef.current.map((e) => ({ id: e.id, highway: '', source: 'primary', points: e.points, tags: {}, inNet: true }));

    // Trassieren/Kurzstrecke: OSM-Pool grau einblenden (nur Anzeige); A-Marker.
    if (pickMode || shortMode) {
      for (const e of osmPool) {
        L.polyline(e.points, { color: '#a0aec0', weight: 2, opacity: 0.9, dashArray: '5 5', interactive: false }).addTo(layer);
      }
      if (pendingConnect) {
        L.circleMarker([pendingConnect.lat, pendingConnect.lng], { radius: 5, color: '#9333ea', weight: 3, fillColor: '#fff', fillOpacity: 1, interactive: false })
          .addTo(layer);
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

  // Render: bei jeder Modell-/Modus-Änderung neu zeichnen (deriveNet → drawNet).
  // (Maskierung/B2-Crop ist ein eigener späterer Schritt — hier noch nicht aktiv.)
  useEffect(() => {
    renderPath();
  }, [netModel, osmPool, pickMode, shortMode, removeMode, poiMode, pendingConnect, masked, maskPolygon]); // eslint-disable-line react-hooks/exhaustive-deps

  // F7-Neufassung: Die Handoff-Brücke entfällt. Der Drawer schreibt direkt in den
  // Workspace-Draft (onSave); der Commit lebt im Workspace.

  // [Anwenden] im Wegnetz-Tab: Boundary-bbox -> Overpass -> Filter -> Render,
  // anschliessend POI-Anker (ann_074) berechnen + zeichnen.
  const onApplyPath = async (cfg: PathConfig) => {
    lastCfgRef.current = cfg; // für T2-Anschluss-Toleranz beim manuellen Anwählen
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
      // Modell speisen: OP = primäres Netz, OSM-Pool = Connector-Kandidaten.
      const opEdges: ModelEdge[] = res.edges
        .filter((e) => e.source === 'primary')
        .map((e) => ({ id: e.id, points: e.points, source: 'osm', asphalt: isAsphalt(e) }));
      const pool: ModelEdge[] = res.edges
        .filter((e) => e.source !== 'primary')
        .map((e) => ({ id: e.id, points: e.points, source: 'osm', asphalt: isAsphalt(e) }));
      undoRef.current = [];
      setOsmPool(pool);
      setNetModel({ edges: opEdges, excluded: [], gates: [] });
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
    setOsmPool([]);
    setNetModel(emptyModel());
    renderPath();
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
    renderPath();
  }, [maskPolygon]); // eslint-disable-line react-hooks/exhaustive-deps

  // US1 — Tool-Header-Registry. Adaptierbar: ein Werkzeug = ein Eintrag mit
  // `side` (left=Umriss · center=geteilt · right=Wegnetz) + `tabs`. Die Leiste
  // filtert nach aktivem Tab und ordnet nach Zone. Weitere Werkzeuge (US3) werden
  // einfach als weitere Einträge ergänzt — kein Umbau am Gerüst nötig.
  // „Netz holen" (rechte Zone): aktiv, sobald eine Quelle da ist (Boundary,
  // Katalog oder Inspector-R).
  const canApplyNet =
    (!!polygon && polygon.length >= 3)
    || !!overlayCatalogId
    || !!(inspectorView?.geometry?.polygon && inspectorView.geometry.polygon.length >= 3);

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
          title="Stützpunkte ziehen/verschieben (Vertex-Drag) · Rechtsklick auf Punkt = löschen"
        />
      ),
    },
    {
      id: 'umriss-delete-hint', side: 'left', tabs: ['umriss'],
      node: (
        <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic' }}>
          Rechtsklick = Punkt löschen
        </span>
      ),
    },
    // UÖ6: B1-Bearbeiten-Toggle — nur sichtbar, wenn bearbeitet wird UND B2 existiert
    // (sonst ist B2 default; B1 ist gesperrt = nur Snap-Quelle).
    ...(umrissEdit && maskPolygon && maskPolygon.length >= 3 ? [{
      id: 'umriss-editb1', side: 'left' as const, tabs: ['umriss'] as DrawerTab[],
      node: (
        <ToolToggle
          active={editB1}
          onClick={() => setEditB1((v) => !v)}
          label="B1 bearbeiten"
          title="B1 (Referenz) ebenfalls bearbeitbar machen — sonst gesperrt (nur Snap-Quelle)"
        />
      ),
    }] : []),
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
      id: 'trassieren', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={pickMode}
          onClick={() => { setPickMode((v) => !v); setShortMode(false); setPoiMode(false); setPendingConnect(null); setRemoveMode(false); setPoiConnectMode(false); }}
          label="✎ Trassieren"
          title="Klick A, Strecke abfahren, Klick B → lila Stück, verschmilzt (grobe Treffer-Toleranz)"
        />
      ),
    },
    {
      id: 'kurzstrecke', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={shortMode}
          onClick={() => { setShortMode((v) => !v); setPickMode(false); setPoiMode(false); setPendingConnect(null); setRemoveMode(false); setPoiConnectMode(false); }}
          label="⟜ Kurzstrecke"
          title="Freie gerade Verbindung A→B (nicht aus OSM) — verbindet das Netz über einen Platz; A/B rasten bei Snap auf Netz-Knoten"
        />
      ),
    },
    {
      id: 'loeschen', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={removeMode}
          onClick={() => { setRemoveMode((v) => !v); setPickMode(false); setShortMode(false); setPoiMode(false); setPendingConnect(null); setPoiConnectMode(false); }}
          label="🗑 Löschen"
          title="Teilstück anklicken → raus (isoliert / Sackgasse / zwischen Kreuzungen)"
        />
      ),
    },
    {
      id: 'poi', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={poiMode}
          onClick={() => { setPoiMode((v) => !v); setPickMode(false); setShortMode(false); setRemoveMode(false); setPoiConnectMode(false); setPendingConnect(null); }}
          label="⊕ POI"
          title="Klick platziert einen POI (Snap rastet auf Knoten); Modal für Kategorie/Name. POI an Sackgasse → Arm wird gültig."
        />
      ),
    },
    {
      id: 'alles-rot', side: 'right', tabs: ['wegnetz'],
      node: (
        <button
          onClick={() => pushModel(deleteAllRed(netModel))}
          title="Alles Rote löschen (nicht verbunden + Sackgassen)"
          style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5, border: '1px solid #e53e3e', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}
        >
          ⊘ Alles Rote löschen
        </button>
      ),
    },
    {
      id: 'undo', side: 'right', tabs: ['wegnetz'],
      node: (
        <button
          onClick={undoModel}
          disabled={undoRef.current.length === 0}
          title="Letzten Schritt zurück"
          style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5, border: '1px solid #cbd5e0', background: '#fff', color: undoRef.current.length === 0 ? '#a0aec0' : '#2d3748', cursor: undoRef.current.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          ↶ Undo
        </button>
      ),
    },
    {
      id: 'poiconnect', side: 'right', tabs: ['wegnetz'],
      node: (
        <ToolToggle
          active={poiConnectMode}
          onClick={() => { setPoiConnectMode((v) => !v); setPickMode(false); setShortMode(false); setPoiMode(false); setPendingConnect(null); setRemoveMode(false); }}
          label="🔗 POI-Connect"
          title="POIs 0,5–2 m vom Netz verbinden (jeder einzeln per Klick); >2 m nicht verbindbar"
        />
      ),
    },
    {
      id: 'anwenden', side: 'right', tabs: ['wegnetz'],
      node: (
        <button
          onClick={() => { if (currentCfg) onApplyPath(currentCfg); }}
          disabled={!canApplyNet || pathStatus === 'loading' || !currentCfg}
          title={
            !canApplyNet ? 'Keine Quelle fürs Netz (Boundary/Katalog/Inspector)'
              : pathStatus === 'loading' ? 'lädt OSM …'
              : 'Overpass fürs Gebiet holen → füllt OP (Netz) + OSM-Pool (Quelle zum Trassieren)'
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
          {pathStatus === 'loading' ? '… lädt' : '⬇ Netz holen'}
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {/* (Icon-Schmiede-Spec aus dem Drawer herausgezogen → Großer Bär.) */}
      {/* Tab-Strip Umriss / Wegnetz / Synchronizer (Technik, Operator/Review) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 0',
        background: '#edf2f7', borderBottom: '1px solid #e2e8f0',
      }}>
        {([
          { id: 'umriss', label: '◇ Umriss' },
          { id: 'wegnetz', label: '⋔ Wegnetz' },
          ...(showSynchronizer ? [{ id: 'synchronizer' as DrawerTab, label: '⚙ Synchronizer' }] : []),
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
        {/* Sandbox-Chip (Review/Vorschau, !live): bedienbar, aber folgenlos. */}
        {!live && (
          <span style={{
            fontSize: 10, fontFamily: 'monospace', marginBottom: 4, marginRight: 4,
            padding: '2px 8px', borderRadius: 10, background: '#fffaf0', color: '#c05621',
            border: '1px solid #fbd38d', whiteSpace: 'nowrap',
          }} title="Review/Vorschau — Änderungen werden nicht gespeichert (Operator-Stand bleibt unangetastet).">
            Sandbox
          </span>
        )}
        {/* F7-Neufassung: expliziter Speichern-Button. NUR live (Operator/Editor mit
            eigenem Login). Speichert den Draft in den Workspace; der Commit lebt im Workspace. */}
        {live && geometryId === 'new' && (
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
        {/* Senden zur Review lebt NICHT mehr hier — eine ganze Representation wird
            im Pathworks-Editor gesendet, nicht ein einzelnes Werkzeug. Hier nur
            speichern; rausgehen über die Controls. */}
        {live && isEditorRole(activeMode) && geometryId === 'new' && (
          <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic', marginBottom: 4, marginLeft: 4, whiteSpace: 'nowrap' }}>
            Senden zur Review: im Pathworks-Editor
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

      {/* Inhaltszeile: optionales Wegnetz-Filtermenue + gemeinsamer Map-Canvas.
          Synchronizer-Overlay liegt NUR über diesem Bereich (nicht über dem
          Tab-Streifen) → man bleibt gleichwertig bei Umriss/Wegnetz und kommt zurück. */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {tab === 'synchronizer' && <SynchronizerNotiz />}
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
            includeCount={netModel.edges.filter((e) => e.source === 'drawn').length}
            onClearInclude={() => pushModel({ ...netModel, edges: netModel.edges.filter((e) => e.source !== 'drawn') })}
            cutCount={0}
            onClearCut={() => { /* kein separater Cut mehr */ }}
            excludedCount={netModel.excluded.length}
            onRemoveGreen={() => pushModel(deleteAllRed(netModel))}
            onClearExcluded={() => pushModel({ ...netModel, excluded: [] })}
          />
        )}
        <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />
      </div>

      {/* POI-Modal: Kategorie/Tagline/Notiz/Icon erfassen → Registry (op_model). */}
      {poiDraft && (
        <div
          onClick={() => setPoiDraft(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 8, padding: 16, width: 360, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', fontFamily: 'system-ui, sans-serif' }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#1a365d' }}>{poiDraft.editId ? 'POI bearbeiten' : 'POI ablegen'}</div>
            <label style={{ display: 'block', fontSize: 11, color: '#4a5568', marginBottom: 8 }}>Kategorie
              <select value={poiDraft.category} onChange={(e) => setPoiDraft({ ...poiDraft, category: e.target.value })}
                style={{ display: 'block', width: '100%', fontSize: 12, padding: '5px 6px', marginTop: 2, borderRadius: 5, border: '1px solid #cbd5e0' }}>
                {POI_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', fontSize: 11, color: '#4a5568', marginBottom: 8 }}>Tagline
              <input value={poiDraft.tagline} onChange={(e) => setPoiDraft({ ...poiDraft, tagline: e.target.value })} placeholder="z. B. Busstation Gmunden"
                style={{ display: 'block', width: '100%', fontSize: 12, padding: '5px 6px', marginTop: 2, borderRadius: 5, border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
            </label>
            <label style={{ display: 'block', fontSize: 11, color: '#4a5568', marginBottom: 8 }}>Icon
              <select value={poiDraft.icon} onChange={(e) => setPoiDraft({ ...poiDraft, icon: e.target.value })}
                style={{ display: 'block', width: '100%', fontSize: 12, padding: '5px 6px', marginTop: 2, borderRadius: 5, border: '1px solid #cbd5e0' }}>
                <option value="">— kein Icon (stattdessen unten beschreiben) —</option>
                {ICON_REGISTRY.map((i) => <option key={i.id} value={i.id}>{i.file_name}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', fontSize: 11, color: '#4a5568', marginBottom: 8 }}>Beschreibung (ein Satz, grau)
              <input value={poiDraft.note} onChange={(e) => setPoiDraft({ ...poiDraft, note: e.target.value })} placeholder="kurz — z. B. Icon-Hinweis; landet grau in der Description"
                style={{ display: 'block', width: '100%', fontSize: 12, padding: '5px 6px', marginTop: 2, borderRadius: 5, border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
            </label>
            <div style={{ fontSize: 10, color: '#a0aec0', margin: '8px 0' }}>Token wird beim Export vergeben · Coord erfasst</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setPoiDraft(null)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#718096', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={commitPoiDraft} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 5, border: '1px solid #276749', background: '#276749', color: '#fff', cursor: 'pointer' }}>{poiDraft.editId ? 'Speichern' : 'Ablegen'}</button>
            </div>
          </div>
        </div>
      )}

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
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #1a202c', verticalAlign: 'middle' }} /> <b>Netz</b> (längste Komponente)</span>
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #e53e3e', verticalAlign: 'middle' }} /> <b>rot</b>{netSummary && <span style={{ color: '#718096' }}> (∉ {Math.round(netSummary.rest)} m)</span>}</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 5, background: '#fff', border: '1.5px solid #1a202c', verticalAlign: 'middle' }} /> <b>Asphalt</b></span>
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '3px solid #9333ea', verticalAlign: 'middle' }} /> <b>lila</b> (trassiert)</span>
            <span style={{ color: '#718096' }}>{pathResult.primaryCount} primär · {pathResult.connectorCount} Konnekt. · {pathResult.rawWayCount} Ways</span>
            {netSummary && (
              <span style={{ fontFamily: 'monospace', color: '#2c5282' }}>
                {netSummary.points} Punkte · <b>{formatBytes(netSummary.bytes)}</b>
              </span>
            )}
            {/* Datengröße-/Abstands-Hebel (aktuell ohne Wirkung aufs Modell) — vorgesehen
                für spätere Colour-Mesh-Abstands-Harmonisierung. */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4a5568' }} title="Punkt-Reduktion (Douglas-Peucker) / später Colour-Mesh-Abstand">
              DP <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{dpEps.toFixed(2)} m</span>
              <input type="range" min={0} max={0.3} step={0.03} value={dpEps}
                onChange={(e) => setDpEps(Number(e.target.value))} style={{ width: 70, margin: 0 }} />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4a5568' }} title="Nachkommastellen runden; 7≈1cm · 6≈0,11m · 5≈1,1m">
              Stellen <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{coordDecimals}</span>
              <input type="range" min={5} max={7} step={1} value={coordDecimals}
                onChange={(e) => setCoordDecimals(Number(e.target.value))} style={{ width: 50, margin: 0 }} />
            </span>
          </div>
          {/* Postausgang: im Drawer erfasste POIs (Registry) → Export an den Katalog. */}
          {netModel.gates.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center',
              padding: '5px 9px', borderRadius: 5, background: '#f0fff4', border: '1px solid #9ae6b4', color: '#22543d',
            }}>
              <b style={{ fontSize: 11 }}>Postausgang ({netModel.gates.length})</b>
              {netModel.gates.map((g) => (
                <span key={g.id ?? `${g.at[0]},${g.at[1]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, background: '#fff', border: '1px solid #c6f6d5', borderRadius: 4, padding: '1px 4px' }}>
                  {g.tagline || g.category || 'POI'}
                  {g.id && (
                    <button onClick={() => pushModel(removePoi(netModel, g.id as string))} title="aus dem Posteingang entfernen"
                      style={{ border: 'none', background: 'transparent', color: '#a0aec0', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
                  )}
                </span>
              ))}
              {netModel.gates.some((g) => g.category && g.category !== 'gate') && (
                <button
                  onClick={onExportPois}
                  disabled={!overlayCatalogId || !activeDraftId}
                  title={!overlayCatalogId ? 'Kein Katalog gebunden' : !activeDraftId ? 'Erst Draft speichern' : 'Nicht-Gate-POIs als roten Brief an den Katalog legen'}
                  style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, border: '1px solid #276749', background: (!overlayCatalogId || !activeDraftId) ? '#edf2f7' : '#276749', color: (!overlayCatalogId || !activeDraftId) ? '#a0aec0' : '#fff', cursor: (!overlayCatalogId || !activeDraftId) ? 'not-allowed' : 'pointer' }}
                >
                  📤 → Katalog
                </button>
              )}
              {poiExportMsg && <span style={{ fontSize: 10, color: '#22543d' }}>{poiExportMsg}</span>}
            </div>
          )}
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

