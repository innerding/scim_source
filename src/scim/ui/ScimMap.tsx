import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';
import type { GraphState } from '../graph/graph.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { PoiModelState } from '../poi-model/poiModel.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace } from './RepresentBuildTetrahedron';
import {
  addRoadHeatMesh, addPoiRoutes, fetchOsmEdges,
  TILE_OSM_URL, TILE_OSM_ATTR, TILE_MESH_URL, TILE_MESH_ATTR,
} from './colourMeshOverlay';
import { useInspectorView, useInspectorAsset, useRepresentationContext } from '../../runtime/repContext';
import { useColourRegionSlug } from '../../runtime/useAuftraggeberRep';
import type { InspectorAsset } from '../../runtime/repContext';
import { slugify } from '../../runtime/router';
import { loadIncludedTypes } from '../regio-content/edgeTypeConfig';
import { parseCatalogById, CATALOG_REGISTRY } from '../poi-catalog/catalogRegistry';
import { GEOMETRIES, REPRESENTATIONS, wegnetzById } from '../workspace/workspace.registry';
import type { BoundaryGeometry, Representation, WegnetzFile } from '../workspace/workspace.types';
import { poiCompositeSvg } from '../poi-catalog/poiCatalog.composite';
import { renderClusterPois } from './clusterOverlay';
import { drawNet } from './netDraw';
import { resampleNet, type ResampledNet } from '../wegnetz/netResample';
import { stretchAverages, normalizeLoads, classifyStretches } from '../sensus/anthemSim';
import { playbookLoad, buildFlows, pickTestRoute, reroute, routeFromBusTo } from '../sensus/playbook';
import { routeComfortCheck } from '../sensus/netRoute';
import { getTestSeed, getTestRoute, setTestRoute, setTestBefund, subscribeTestRoute,
  getDestPoi, setDestBefund, requestAltRoute } from '../sensus/testRoute';
import { subscribeReveal } from '../sensus/revealPrep';
import { playBoundaryReveal } from './boundaryReveal';
import { colorAt, type ScaleSpec } from 'shell-kit';
import { loadColourSettings, COLOUR_SETTINGS_EVENT } from '../sensus/colourSettings';
import { loadUserExclusion, USER_EXCLUSION_EVENT } from '../sensus/userExclusion';
import { getSimHour, subscribeSimClock } from '../sensus/simClock';
import { MVP_RESAMPLE_TARGET_METERS } from '../sensus/originPackage';
import type { DerivedNet, LatLng } from '../regio-content/netModel';
import type { CatalogPoi } from '../poi-catalog/poiCatalog.types';

interface OsmEdge {
  edge_id: string;
  geometry: { coordinates: [number, number][] };
}

interface Props {
  result: ScimPipelineResult;
  onNavigate?: (face: RepresentBuildFace) => void;
  onCollapseToggle?: () => void;
}

const POI_LOAD_COLORS: Record<string, string> = {
  quiet: '#3d9970',
  moderate: '#ffdc00',
  busy: '#ff851b',
  very_busy: '#ff4136',
  unknown: '#aaaaaa',
};

interface LayerVisibility {
  boundary: boolean;
  routes: boolean;
  pois: boolean;
  poiIcons: boolean;   // POIs als echtes Icon (true) oder Platzhalter-Punkt (false)
  colourmesh: boolean;
  mapBase: boolean;    // Basemap-Tiles ueberhaupt anzeigen
  darkBase: boolean;   // dunkle Tiles (true) vs. helles OSM (false)
  resample3: boolean;  // P08-Resample-Vorschau @3 m
  resample10: boolean; // @10 m
  resample25: boolean; // @25 m
  simLoad: boolean;    // Last (sim): resampeltes @MVP-Netz nach Sim-Last eingefärbt
}

const DEFAULT_VISIBILITY: LayerVisibility = {
  boundary: true,
  routes: false,
  pois: true,
  poiIcons: true,
  colourmesh: false,
  mapBase: true,
  darkBase: false,
  resample3: false,
  resample10: false,
  resample25: false,
  simLoad: true,
};

// Polygon (outer ring) -> [minLon, minLat, maxLon, maxLat].
function polygonBbox(polygon: ReadonlyArray<readonly [number, number] | ReadonlyArray<number>>): [number, number, number, number] | null {
  if (!polygon || polygon.length === 0) return null;
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const pt of polygon) {
    const lon = pt[0]; const lat = pt[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') continue;
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

// Was der Inspector aus einem Workspace-Asset macht. Anders als
// ActiveRepresentation darf geometry hier null sein (Katalog hat keine).
interface InspectedTarget {
  representation: Representation;
  geometry: BoundaryGeometry | null;
}

// Welche Layer ein Asset-Typ ueberhaupt enthaelt — der Inspector zeigt und
// bietet nur diese an. Katalog: nur POIs. Boundary: nur Umriss. Representation
// (oder kein Asset erzwungen): alles. Karte/Dark-Base ist immer verfuegbar.
interface LayerAvailability { boundary: boolean; pois: boolean; colourmesh: boolean; routes: boolean; resample: boolean; }
const ALL_LAYERS: LayerAvailability = { boundary: true, pois: true, colourmesh: true, routes: true, resample: true };

function layersForAsset(asset: InspectorAsset | null): LayerAvailability {
  if (!asset) return ALL_LAYERS;
  if (asset.kind === 'catalog') return { boundary: false, pois: true, colourmesh: false, routes: false, resample: false };
  if (asset.kind === 'geometry') return { boundary: true, pois: false, colourmesh: false, routes: false, resample: false };
  return ALL_LAYERS; // representation
}

// Resample-Vorschau (P08): Segmente abwechselnd blau/gelb (zeigt die Teilung).
// Ohne Stützpunkt-Dots — die störten die Ansicht (User-Feedback).
function drawResampledNet(layer: L.LayerGroup, net: ResampledNet): void {
  const BLUE = '#2b6cb0', YELLOW = '#d69e2e';
  for (const s of net.stretches) {
    for (let i = 1; i < s.points.length; i++) {
      L.polyline([s.points[i - 1], s.points[i]], {
        color: (i - 1) % 2 === 0 ? BLUE : YELLOW, weight: 3, opacity: 1, lineCap: 'round',
      }).addTo(layer);
    }
  }
}

// Loest ein gewaehltes Asset in eine Inspector-Sicht auf. Synthetische
// Representation fuer Katalog/Boundary, damit die bestehende Render-Logik
// (rep.catalog_id → POIs, geometry.polygon → Umriss) unveraendert greift.
function buildInspectedTarget(asset: InspectorAsset | null): InspectedTarget | null {
  if (!asset) return null;
  if (asset.kind === 'representation') {
    const rep = REPRESENTATIONS.find((r) => r.id === asset.id);
    if (!rep) return null;
    return { representation: rep, geometry: GEOMETRIES.find((g) => g.id === rep.geometry_id) ?? null };
  }
  if (asset.kind === 'geometry') {
    const geo = GEOMETRIES.find((g) => g.id === asset.id);
    if (!geo) return null;
    const rep: Representation = {
      schema: 'scim3_representation_v1', id: `geo:${geo.id}`, name: geo.name,
      geometry_id: geo.id, created_at: geo.drawn_at ?? '',
    };
    return { representation: rep, geometry: geo };
  }
  // catalog
  const cat = CATALOG_REGISTRY.find((c) => c.id === asset.id);
  if (!cat) return null;
  const rep: Representation = {
    schema: 'scim3_representation_v1', id: `cat:${cat.id}`, name: cat.name,
    geometry_id: '', catalog_id: cat.id, created_at: '',
  };
  return { representation: rep, geometry: null };
}

export default function ScimMap({ result, onNavigate, onCollapseToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const [vis, setVis] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  // Effektive Sicht des Inspectors: bevorzugt die Operator-Auswahl
  // (Compare-Modus), faellt auf die URL-aktive R zurueck. Siehe
  // runtime/repContext.ts → useInspectorView.
  const fallbackView = useInspectorView();
  const assetSel = useInspectorAsset();
  const repCtx = useRepresentationContext();
  // Per Workspace-Auge gewaehltes Asset hat Vorrang vor der Default-Sicht.
  const assetView = useMemo(() => buildInspectedTarget(assetSel), [assetSel]);
  const availLayers = useMemo(() => layersForAsset(assetSel), [assetSel]);
  const activeRep: InspectedTarget | null = assetSel ? assetView : fallbackView;

  // Aktueller Region-Slug fuer Edge-Type-Filter. Default-Slug, wenn
  // keine R aktiv ist (P02 schreibt dann auch unter dem Default-Key).
  const regionSlug = useMemo(
    () => slugify(activeRep?.geometry?.region ?? '') || 'default',
    [activeRep],
  );

  // Edge-Type-Whitelist aus P02 (localStorage). Bei Region- oder
  // Filter-Wechsel neu eingelesen — P02 dispatcht 'scim:edge-types:changed'.
  const [edgeTypes, setEdgeTypes] = useState<string[]>(() => loadIncludedTypes(regionSlug));
  useEffect(() => {
    setEdgeTypes(loadIncludedTypes(regionSlug));
  }, [regionSlug]);
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { regionSlug?: string; types?: string[] } | undefined;
      if (!detail || detail.regionSlug !== regionSlug) return;
      if (Array.isArray(detail.types)) setEdgeTypes(detail.types);
    };
    window.addEventListener('scim:edge-types:changed', onChange);
    return () => window.removeEventListener('scim:edge-types:changed', onChange);
  }, [regionSlug]);

  // Farb-Settings (P01/P02/P04): an die PUBLISH-Region gekoppelt (wie P01 + Bundle),
  // damit die Vorschau zeigt, was publiziert wird. Edge-Types bleiben an der aktiven Rep.
  const colourRegionSlug = useColourRegionSlug();
  const [colourCfg, setColourCfg] = useState(() => loadColourSettings(colourRegionSlug));
  useEffect(() => { setColourCfg(loadColourSettings(colourRegionSlug)); }, [colourRegionSlug]);
  useEffect(() => {
    const onChange = (e: Event) => {
      const d = (e as CustomEvent).detail as { regionSlug?: string } | undefined;
      if (d && d.regionSlug && d.regionSlug !== colourRegionSlug) return;
      setColourCfg(loadColourSettings(colourRegionSlug));
    };
    window.addEventListener(COLOUR_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(COLOUR_SETTINGS_EVENT, onChange);
  }, [colourRegionSlug]);

  const [userExcl, setUserExcl] = useState<number | null>(() => loadUserExclusion());
  useEffect(() => {
    const onChange = () => setUserExcl(loadUserExclusion());
    window.addEventListener(USER_EXCLUSION_EVENT, onChange);
    return () => window.removeEventListener(USER_EXCLUSION_EVENT, onChange);
  }, []);
  // Stabile Identitaet fuer Effect-Deps (sortiert).
  const edgeTypesKey = useMemo(() => [...edgeTypes].sort().join('|'), [edgeTypes]);
  const repBbox = useMemo(
    () => (activeRep?.geometry ? polygonBbox(activeRep.geometry.polygon) : null),
    [activeRep],
  );

  // Catalog-POIs der aktiven R, sobald sie ein catalog_id-Feld hat.
  // Parsen ist nicht billig — daher memoisiert auf den Katalog-Identifikator.
  const repCatalog = useMemo(() => {
    const empty = { all: [] as CatalogPoi[], plain: [] as CatalogPoi[], members: [] as CatalogPoi[], ghostByCluster: new Map<string, CatalogPoi>() };
    const catId = activeRep?.representation.catalog_id;
    if (!catId) return empty;
    const parsed = parseCatalogById(catId);
    if (!parsed) return empty;
    // Nur POIs mit echter Koordinate zeichnen — Missing/0,0 uebersprungen.
    const withCoord = parsed.pois.filter((p) => (
      p.coord_status !== 'missing' && !(p.coord[0] === 0 && p.coord[1] === 0)
    ));
    // plain = einzeln gezeichnet; members = dynamisch geclustert; ghost liefert
    // nur Icon/Tagline fuer das vereinigte Cluster-POI (Position = Schwerpunkt).
    const plain = withCoord.filter((p) => !p.cluster && p.subcategory !== 'Cluster');
    const members = withCoord.filter((p) => p.cluster && p.subcategory !== 'Cluster');
    const ghostByCluster = new Map<string, CatalogPoi>();
    for (const p of parsed.pois) {
      if (p.subcategory === 'Cluster' && p.cluster) ghostByCluster.set(p.cluster, p);
    }
    return { all: withCoord, plain, members, ghostByCluster };
  }, [activeRep]);
  // Gespeichertes Wegnetz der aktiven R (ueber wegnetz_id). Liefert die echten
  // Edges fuer den Routen/Edges-Layer und das Colour-Mesh.
  const repWegnetz = useMemo<WegnetzFile | null>(() => {
    const wid = activeRep?.representation.wegnetz_id;
    if (!wid) return null;
    return wegnetzById(wid) ?? null;
  }, [activeRep]);
  // Das teure Sim-Routing (buildFlows, N×M) wird HINTER den ersten Paint verschoben:
  // simReady kippt erst nach Mount (idle) auf true. Sonst blockiert das Routing den
  // Seitenstart, weil Inspector-Default (aktive Rep) + „Last (sim)"-Default beim
  // Laden zusammenfallen.
  const [simReady, setSimReady] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setSimReady(true));
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setSimReady(true), 250);
    return () => clearTimeout(id);
  }, []);

  // Playbook-Sim (S2/S2b): resampeltes Netz + geroutete Flows (Bus→Attraktor),
  // memoisiert (Routing läuft nur bei Asset-/Netz-Wechsel). simHour treibt die
  // Tageszeit — S3-Slider folgt; Default Mittag (Peak), damit man sofort etwas sieht.
  // Nur rechnen, wenn „Last (sim)" an UND simReady (nach erstem Paint) — sonst
  // blockiert buildFlows den ersten Render.
  const simNet = useMemo(
    () => (vis.simLoad && simReady && activeRep && repWegnetz) ? resampleNet(repWegnetz.edges, { targetMeters: MVP_RESAMPLE_TARGET_METERS }) : null,
    [vis.simLoad, simReady, activeRep, repWegnetz],
  );
  const simFlows = useMemo(
    () => (vis.simLoad && simNet && repWegnetz) ? buildFlows(repWegnetz.edges, simNet, repCatalog.all) : [],
    [vis.simLoad, simNet, repWegnetz, repCatalog],
  );
  const [simHour, setSimHour] = useState(getSimHour());
  useEffect(() => subscribeSimClock(() => setSimHour(getSimHour())), []);

  // Test-Route (S4b): P09-Button bumpt den seed → hier neu routen. seed im State,
  // damit der Render die Route zeichnet; route-/comfort-Emits ändern den seed
  // nicht → keine Render-Schleife.
  const [testSeed, setTestSeed] = useState(getTestSeed());
  useEffect(() => subscribeTestRoute(() => setTestSeed(getTestSeed())), []);
  useEffect(() => {
    if (!simNet || !repWegnetz || !activeRep) return;
    setTestRoute(pickTestRoute(repWegnetz.edges, simNet, repCatalog.all, getTestSeed()));
  }, [testSeed, simNet, repWegnetz, repCatalog, activeRep]);
  // Wegnetz-Edges in die Colour-Mesh-Edge-Form ([lon,lat]-coordinates) bringen.
  const wegnetzAsEdges = useMemo(() => {
    if (!repWegnetz) return [];
    return repWegnetz.edges.map((e) => ({
      edge_id: String(e.id),
      geometry: { coordinates: e.points.map(([lat, lon]) => [lon, lat] as [number, number]) },
    }));
  }, [repWegnetz]);
  // Polygon-Ringe als [lat, lon][] fuer Leaflet vorbereiten.
  const repPolygonLatLng = useMemo(() => {
    if (!activeRep?.geometry) return null;
    const ring = activeRep.geometry.polygon;
    if (!ring || ring.length < 3) return null;
    return ring.map((p) => [p[1], p[0]] as [number, number]);
  }, [activeRep]);

  // Layer-Monitor: jeden vis-Wechsel an die Welt mitteilen, damit das
  // Firmament im Navigator weiss, welcher Slice glimmen darf
  // (siehe ann_066 Geste 3).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scim:layers:state', { detail: vis }));
  }, [vis]);

  // P07-Prep: Boundary-Reveal abspielen (Trigger aus revealPrep). Live über die
  // echte Leaflet-Projektion, additives Overlay — siehe boundaryReveal.ts.
  useEffect(() => subscribeReveal(() => {
    const c = containerRef.current, m = mapRef.current;
    if (c && m && repPolygonLatLng) playBoundaryReveal(c, m, repPolygonLatLng);
  }), [repPolygonLatLng]);
  const [osmEdges, setOsmEdges] = useState<OsmEdge[]>([]);
  const [, setOsmStatus] = useState<'idle' | 'loading' | 'ok' | 'failed'>('idle');

  // Init Leaflet map once (guard against StrictMode double-invoke).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: true,
      zoomSnap: 0,        // stufenlos
      zoomDelta: 1,       // 1 voller Step pro Wheel-Tick
      wheelPxPerZoomLevel: 3,
      wheelDebounceTime: 0,
      preferCanvas: true,
    });
    // Initiale Base-Tile: nur wenn mapBase an; darkBase entscheidet den Stil.
    if (DEFAULT_VISIBILITY.mapBase) {
      const initialUrl = DEFAULT_VISIBILITY.darkBase ? TILE_MESH_URL : TILE_OSM_URL;
      const initialAttr = DEFAULT_VISIBILITY.darkBase ? TILE_MESH_ATTR : TILE_OSM_ATTR;
      baseTileRef.current = L.tileLayer(initialUrl, {
        attribution: initialAttr,
        maxZoom: 19,
      }).addTo(map);
    }

    const layerGroup = L.layerGroup().addTo(map);
    // Separater Layer fuer die dynamischen Cluster-Marker — wird bei
    // zoom/move neu gezeichnet, ohne den Haupt-Layer anzufassen. Zuletzt
    // hinzugefuegt → liegt oben.
    const clusterLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;
    clusterLayerRef.current = clusterLayer;

    // Die Karte bleibt nach dem ersten Öffnen gemountet (App hält sie am Leben),
    // wird aber bei eingeklapptem Inspector auf Breite 0 versteckt. Leaflet muss
    // beim Wiederauftauchen (0 → 420) neu vermessen, sonst grauer/verschobener
    // Kartenausschnitt → ResizeObserver ruft invalidateSize().
    const ro = new ResizeObserver(() => { if (el.clientWidth > 0) map.invalidateSize(); });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      clusterLayerRef.current = null;
      baseTileRef.current = null;
    };
  }, []);

  // Base-Tile-Layer steuern: mapBase = Tiles ueberhaupt, darkBase = Stil.
  // Karte aus → Tile-Layer ganz entfernen (nur Container-Hintergrund + Overlays).
  // Entkoppelt vom Colour-Mesh-Overlay — alle Achsen frei kombinierbar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const oldBase = baseTileRef.current;
    if (!vis.mapBase) {
      if (oldBase) { map.removeLayer(oldBase); baseTileRef.current = null; }
      return;
    }
    const wantUrl = vis.darkBase ? TILE_MESH_URL : TILE_OSM_URL;
    const wantAttr = vis.darkBase ? TILE_MESH_ATTR : TILE_OSM_ATTR;
    const currentUrl = oldBase ? (oldBase as unknown as { _url: string })._url : null;
    if (oldBase && currentUrl === wantUrl) return;
    if (oldBase) map.removeLayer(oldBase);
    baseTileRef.current = L.tileLayer(wantUrl, {
      attribution: wantAttr, maxZoom: 19,
    }).addTo(map);
  }, [vis.mapBase, vis.darkBase]);

  // OSM-Wege via Overpass holen, sobald colourmesh an und bbox bekannt.
  // Hat einen Cache (24h) — beim zweiten Aufruf sofort da.
  // Aktive Representation hat Vorrang gegenueber der Pipeline-bbox.
  useEffect(() => {
    if (!vis.colourmesh || !availLayers.colourmesh) return;
    const pipelineBbox = result.success
      ? ((result.context.boundary as unknown as { computed_boundary: { bbox?: [number, number, number, number] } } | undefined)
         ?.computed_boundary?.bbox)
      : undefined;
    const bbox = repBbox ?? pipelineBbox;
    if (!bbox) return;
    let cancelled = false;
    setOsmStatus('loading');
    fetchOsmEdges(bbox, edgeTypes)
      .then((edges) => {
        if (cancelled) return;
        setOsmEdges(edges);
        setOsmStatus('ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Overpass-API failed, fallback to synthetic mesh:', err);
        setOsmStatus('failed');
      });
    return () => { cancelled = true; };
  }, [vis.colourmesh, result, repBbox, edgeTypes, edgeTypesKey]);

  // Container kann resized werden (Collapsible-Container) — Map neu einladen
  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 150);
  });

  // Draw pipeline result whenever it changes oder visibility togglet.
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !result.success) return;

    layerGroup.clearLayers();

    const ctx = result.context;
    const graph = ctx.graph as unknown as GraphState | undefined;
    const boundary = ctx.boundary as unknown as BoundaryState | undefined;
    const extraction = ctx.extracted_data as unknown as ExtractionState | undefined;
    const poiModel = ctx.poi_model as unknown as PoiModelState | undefined;
    const routeLayerModel = ctx.route_layer_model as unknown as RouteLayerModelState | undefined;

    // Boundary
    //   Wenn eine R aktiv ist, fuehrt sie die Sicht — das Pipeline-Rechteck
    //   wird unterdrueckt, der R-Polygon-Outline ersetzt es. Damit liegt
    //   nicht mehr das Gruenberg-Default unter Lichtenberg.
    if (availLayers.boundary && vis.boundary && repPolygonLatLng) {
      L.polygon(repPolygonLatLng, {
        color: '#0074d9',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.05,
      }).addTo(layerGroup);
    } else if (availLayers.boundary && vis.boundary && boundary?.computed_boundary.bbox) {
      const [minLon, minLat, maxLon, maxLat] = boundary.computed_boundary.bbox;
      L.rectangle([[minLat, minLon], [maxLat, maxLon]], {
        color: '#0074d9',
        weight: 1.5,
        fillOpacity: 0.04,
        dashArray: '6 4',
      }).addTo(layerGroup);
    }

    // Edge geometry lookup (immer aufbauen, da von Routes benoetigt)
    const edgeGeom = new Map<string, [number, number][]>();
    if (graph?.edges) {
      for (const edge of graph.edges) {
        edgeGeom.set(
          edge.edge_id,
          edge.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
        );
      }
    }

    // Routes aus dem Pipeline-RouteLayerModel. Mit aktiver R aus dem Bild —
    // R-eigene Routen kommen aus routeSolver (Stufe-1-Modul, folgt).
    if (vis.routes && !activeRep && routeLayerModel?.segments) {
      for (const seg of routeLayerModel.segments) {
        if (!seg.visible) continue;
        const coords = edgeGeom.get(seg.edge_id);
        if (!coords || coords.length < 2) continue;
        L.polyline(coords, {
          color: seg.style.color,
          weight: seg.style.weight,
          opacity: seg.style.opacity,
          dashArray: seg.style.dash_pattern,
        })
          .bindTooltip(`Edge: ${seg.edge_id}<br/>Score: ${seg.score_class}`)
          .addTo(layerGroup);
      }
    }

    // Routen/Edges der aktiven R: das gespeicherte Wegnetz (edges). primary =
    // echte Wege (dunkle Linie), connector_candidate = Snap-Bruecken (blau,
    // gestrichelt). points sind bereits [lat,lng].
    if (vis.routes && activeRep && repWegnetz) {
      // Spiegel des Drawers: exakt dieselbe Zeichenfunktion (netDraw.drawNet),
      // damit der Inspector nichts erfindet — Asphalt weiss-gekernt, Netz
      // schwarz, nosm gestrichelt, ganz wie der Drawer es ausgibt. Eigener
      // Sub-Layer, weil drawNet seinen Layer zu Beginn leert. POIs/Bridges
      // macht der Inspector separat → hier leer. asphalt rekonstruiert aus
      // source (netToPathEdges kodiert asphalt → 'connector_candidate'); nosm
      // ist in der gespeicherten WegnetzFile nicht enthalten.
      const netLayer = L.layerGroup();
      const derived: DerivedNet = {
        edges: repWegnetz.edges.map((e, i) => ({
          key: `${e.id}:${i}`, wayId: e.id, seg: i,
          points: e.points as LatLng[], klass: 'net' as const,
          asphalt: e.source === 'connector_candidate', deadEnd: false, nosm: false,
        })),
        bridges: [], pois: [], redKeys: [], netMeters: 0, deadEnds: [], nodes: [],
      };
      drawNet(netLayer, derived);
      netLayer.addTo(layerGroup);
    }

    // Resample-Vorschau (P08-Sampling): je aktiviertem Target eine eigene
    // Schicht. rot=Kreuzung · schwarz=Punkt · Segmente blau/gelb.
    if (activeRep && repWegnetz) {
      const targets: [boolean, number][] = [
        [vis.resample3, 3], [vis.resample10, 10], [vis.resample25, 25],
      ];
      for (const [on, t] of targets) {
        if (!on) continue;
        const sub = L.layerGroup();
        drawResampledNet(sub, resampleNet(repWegnetz.edges, { targetMeters: t }));
        sub.addTo(layerGroup);
      }
    }

    // Last (sim): die VOLLE Farb-Kette (Umbauplan Phase D). Anzeige je Segment
    // via colorize(System-normalisierte Last); Degradierung/Ausschluss je
    // STRECKE über die Ø-Last (crossing-gated). §2a: stetiger Gradient.
    if (vis.simLoad && activeRep && repWegnetz && simNet) {
      const sub = L.layerGroup();
      // Playbook-Last zur Tageszeit (Bus→Attraktor-Flows × Sonntagskurve)
      const raw = playbookLoad(simNet, simFlows, simHour);
      // System: normalisieren (Spreizung + Mindest-Rot)
      const loads = normalizeLoads(raw, { spread: colourCfg.spread, floor: colourCfg.floor });
      // je Strecke klassifizieren (Operator-Degradierung + User-Ausschluss)
      const avgs = stretchAverages(simNet, loads);
      const stateById = new Map(
        classifyStretches(avgs, {
          degradier: colourCfg.degradier ?? undefined,
          ausschluss: userExcl ?? undefined,
        }).map((c) => [c.id, c.state]),
      );
      // Neues Felder-/Grenzen-Modell (P01): genau das, was die Runtime publiziert.
      const scale: ScaleSpec = { stops: colourCfg.stops, borders: colourCfg.borders, spreizung: colourCfg.spreizung, verjuengung: colourCfg.verjuengung };
      // Pass 1: Shadow-Halo je Strecke (dunkle, breite Unterlage), damit die
      // Farbe — v. a. Grün — abhebt. Ein Polyline je Strecke (günstig).
      for (const s of simNet.stretches) {
        if (s.points.length >= 2) {
          L.polyline(s.points, {
            color: '#ffffff', weight: 8, opacity: 1,
            lineCap: 'round', lineJoin: 'round',
          }).addTo(sub);
        }
      }
      // Pass 2: farbige Segmente oben drauf.
      let idx = 0;
      for (const s of simNet.stretches) {
        const state = stateById.get(s.id) ?? 'normal';
        for (let i = 1; i < s.points.length; i++) {
          const load = loads[idx++] ?? 0;
          let color: string, weight: number, opacity: number;
          if (state === 'excluded') {
            color = '#9aa5b1'; weight = 2; opacity = 0.5;        // farblos neutralisiert
          } else if (state === 'degraded') {
            color = colorAt(load, scale);
            weight = 2; opacity = 0.4;                            // entdrängt (behält Farbe)
          } else {
            color = colorAt(load, scale);
            weight = 4; opacity = 1;
          }
          L.polyline([s.points[i - 1], s.points[i]], { color, weight, opacity, lineCap: 'round' }).addTo(sub);
        }
      }

      // Test-Route (S4b): Pfad hervorheben + Comfort-Check (Ø-Last > Comfort
      // = User-Ausschluss-Schwelle) → überschrittene Strecken rot markieren.
      const route = getTestRoute();
      if (route && route.segmentIds.length > 0) {
        const comfortRes = routeComfortCheck(route.segmentIds, avgs, userExcl);
        // S5: bei Überschreitung eine Ausweichroute suchen (überschrittene
        // Strecken-Kanten meiden) und gegen Comfort prüfen.
        let alt: { path: typeof route.path; segmentIds: string[] } | null = null;
        let altComfort = null;
        if (!comfortRes.ok && route.path.length >= 2) {
          const avoid = new Set(comfortRes.exceeding.map((id) => parseInt(id.split('.')[0], 10)));
          alt = reroute(repWegnetz.edges, simNet, route.path[0], route.path[route.path.length - 1], avoid);
          if (alt) altComfort = routeComfortCheck(alt.segmentIds, avgs, userExcl);
        }
        setTestBefund(comfortRes, alt, altComfort);
        // Original (blau gestrichelt) + überschrittene Strecken (rot)
        L.polyline(route.path, { color: '#3182ce', weight: 6, opacity: 0.55, lineCap: 'round', dashArray: '1 7' }).addTo(sub);
        const exSet = new Set(comfortRes.exceeding);
        for (const s of simNet.stretches) {
          if (exSet.has(s.id) && s.points.length >= 2) {
            L.polyline(s.points, { color: '#e53e3e', weight: 6, opacity: 0.95, lineCap: 'round' }).addTo(sub);
          }
        }
        // Ausweichroute (grün)
        if (alt) L.polyline(alt.path, { color: '#2f855a', weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(sub);
      }

      // Alternativroute (S6): User hat ein POI angeklickt → Route von einer
      // starken Bus-Station zu diesem frei gewählten Ziel, wieder comfort-
      // bewusst (gleiche Bewertung + Ausweich wie bei der Test-Route).
      const destPoi = getDestPoi();
      if (destPoi) {
        const dRoute = routeFromBusTo(repWegnetz.edges, simNet, repCatalog.all, destPoi.coord, destPoi.label);
        if (dRoute && dRoute.segmentIds.length > 0) {
          const dComfort = routeComfortCheck(dRoute.segmentIds, avgs, userExcl);
          let dAlt: { path: typeof dRoute.path; segmentIds: string[] } | null = null;
          let dAltComfort = null;
          if (!dComfort.ok && dRoute.path.length >= 2) {
            const avoid = new Set(dComfort.exceeding.map((id) => parseInt(id.split('.')[0], 10)));
            dAlt = reroute(repWegnetz.edges, simNet, dRoute.path[0], dRoute.path[dRoute.path.length - 1], avoid);
            if (dAlt) dAltComfort = routeComfortCheck(dAlt.segmentIds, avgs, userExcl);
          }
          setDestBefund(dRoute, dComfort, dAlt, dAltComfort);
          // Alternativroute violett gestrichelt (klar von der Test-Route blau
          // unterscheidbar) + überschrittene Strecken rot + Ausweich grün.
          L.polyline(dRoute.path, { color: '#805ad5', weight: 6, opacity: 0.7, lineCap: 'round', dashArray: '1 7' }).addTo(sub);
          const dEx = new Set(dComfort.exceeding);
          for (const s of simNet.stretches) {
            if (dEx.has(s.id) && s.points.length >= 2) {
              L.polyline(s.points, { color: '#e53e3e', weight: 6, opacity: 0.95, lineCap: 'round' }).addTo(sub);
            }
          }
          if (dAlt) L.polyline(dAlt.path, { color: '#2f855a', weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(sub);
        } else {
          setDestBefund(null, null, null, null);
        }
      }
      sub.addTo(layerGroup);
    }

    // POI Load class lookup
    const poiLoadClass = new Map<string, string>();
    if (poiModel?.evaluated_pois) {
      for (const p of poiModel.evaluated_pois) {
        poiLoadClass.set(p.poi_id, p.load_class);
      }
    }

    // Colour-Mesh: Heat *entlang der Strassen* + POI-zu-POI Routen mit Glow.
    // Bevorzugt OSM-Wege (echte Geometrie); waehrend des Ladens / bei Fehler
    // faellt addRoadHeatMesh intern auf synthetische Edges zurueck.
    //
    // Wenn eine R aktiv ist:
    //   - bbox kommt aus dem R-Polygon (repBbox), nicht aus der Pipeline
    //   - kein Fallback auf graph.edges (das waere Pipeline-Default und wuerde
    //     die alten Gruenberg-Edges unter Lichtenberg legen). Solange Overpass
    //     noch nicht durch ist, lieber kein Mesh als das falsche.
    //   - Pipeline-POIs werden nicht in die R-Sicht gezeichnet — die richtigen
    //     POIs kommen ueber rep.catalog_id, eigene Iteration.
    const meshBbox = repBbox ?? boundary?.computed_boundary.bbox;
    if (availLayers.colourmesh && vis.colourmesh && meshBbox) {
      const pois = activeRep ? [] : (extraction?.extracted_pois ?? []);
      // Aktive R: echte Edges — OSM-Wege wenn schon geladen, sonst die
      // gespeicherten Wegnetz-Edges (sofort da). Niemals synthetisch.
      const edgesToRender = activeRep
        ? (osmEdges.length > 0 ? osmEdges : wegnetzAsEdges)
        : (osmEdges.length > 0 ? osmEdges : (graph?.edges ?? []));
      if (edgesToRender.length > 0) {
        addRoadHeatMesh(layerGroup, edgesToRender, meshBbox, pois, !activeRep);
      }
      if (pois.length > 0) {
        addPoiRoutes(layerGroup, pois);
      }
    }

    // POIs aus dem Catalog der aktiven R (rep.catalog_id). Eigene
    // Render-Schleife mit leichterem Stil — kein Load-Class-Mapping,
    // weil der Catalog selbst keine Live-Last fuehrt.
    // Nur die ungeclusterten POIs hier statisch; Cluster-Mitglieder + Ghost
    // erledigt das dynamische Cluster-Overlay (eigener Layer, zoom-abhaengig).
    if (availLayers.pois && vis.pois && activeRep && repCatalog.plain.length > 0) {
      const POI_SIZE = 30;
      for (const poi of repCatalog.plain) {
        const [lon, lat] = poi.coord;
        const tooltip =
          `<strong>${poi.text}</strong><br/>` +
          `<span style="color:#718096">${poi.subcategory}</span>`;
        // Exakt das realisierte Katalog-Composite: Container-Geometrie +
        // Kategoriefarbe + Icon + Deco. Toggle aus → leeres Icon, d.h. nur der
        // farbige Container als Platzhalter (gleiche Geometrie/Farbe wie echt).
        const svg = poiCompositeSvg(vis.poiIcons ? poi.icon : '', poi.text, poi.subcategory, POI_SIZE);
        if (!svg) continue; // unbekannte Subkategorie
        const html = `<div style="width:${POI_SIZE}px;height:${POI_SIZE}px;line-height:0;` +
          `filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));">${svg}</div>`;
        L.marker([lat, lon], {
          icon: L.divIcon({ html, className: '', iconSize: [POI_SIZE, POI_SIZE], iconAnchor: [POI_SIZE / 2, POI_SIZE / 2] }),
        })
          .bindTooltip(tooltip)
          // S6: Klick auf POI → comfort-bewusste Alternativroute dorthin.
          .on('click', () => requestAltRoute([lat, lon], poi.text))
          .addTo(layerGroup);
      }
    }

    // POIs aus dem Pipeline-Extraction. Wenn eine R aktiv ist, gehoeren
    // diese POIs nicht zur Sicht — die R hat ihren eigenen Catalog (oben).
    if (vis.pois && !activeRep && extraction?.extracted_pois) {
      for (const poi of extraction.extracted_pois) {
        const [lon, lat] = poi.center.coordinates;
        const loadClass = poiLoadClass.get(poi.poi_id) ?? 'unknown';
        L.circleMarker([lat, lon], {
          radius: 9,
          color: '#333',
          weight: 1.5,
          fillColor: POI_LOAD_COLORS[loadClass] ?? '#aaa',
          fillOpacity: 0.9,
        })
          .bindTooltip(`${poi.name ?? poi.poi_id}<br/>Load: ${loadClass}`)
          .addTo(layerGroup);
      }
    }

    // Fit: aktive R hat Vorrang, sonst Pipeline-Boundary, sonst Graph-Knoten.
    if (repBbox) {
      const [minLon, minLat, maxLon, maxLat] = repBbox;
      map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24] });
    } else if (activeRep && repCatalog.all.length > 0) {
      // Katalog ohne Geometry: auf die POIs zoomen, nicht auf die Pipeline.
      const lats = repCatalog.all.map((p) => p.coord[1]);
      const lons = repCatalog.all.map((p) => p.coord[0]);
      map.fitBounds([
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ], { padding: [40, 40], maxZoom: 15 });
    } else if (boundary?.computed_boundary.bbox) {
      const [minLon, minLat, maxLon, maxLat] = boundary.computed_boundary.bbox;
      map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24] });
    } else if (graph?.nodes && graph.nodes.length > 0) {
      const lats = graph.nodes.map((n) => n.geometry.coordinates[1]);
      const lons = graph.nodes.map((n) => n.geometry.coordinates[0]);
      map.fitBounds([
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ]);
    }
  }, [result, vis, osmEdges, repBbox, repPolygonLatLng, activeRep, repCatalog, availLayers, repWegnetz, wegnetzAsEdges, colourCfg, userExcl, simNet, simFlows, simHour, testSeed]);

  // Dynamisches Cluster-Overlay: bei jedem zoom/move neu rechnen (Pixel-Logik).
  // Eigener Layer, damit der Haupt-Render unberuehrt bleibt.
  useEffect(() => {
    const map = mapRef.current;
    const layer = clusterLayerRef.current;
    if (!map || !layer) return;
    const active = availLayers.pois && vis.pois && !!activeRep && repCatalog.members.length > 0;
    if (!active) { layer.clearLayers(); return; }
    const draw = () => renderClusterPois(map, layer, repCatalog.members, repCatalog.ghostByCluster, vis.poiIcons);
    draw();
    map.on('zoomend moveend', draw);
    return () => { map.off('zoomend moveend', draw); layer.clearLayers(); };
  }, [activeRep, repCatalog, vis.pois, vis.poiIcons, availLayers]);

  if (!result.success) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#1a1a1a', color: '#ff4136', fontFamily: 'monospace', fontSize: 13,
      }}>
        <Header label="Inspector" detail="System-Build-Mirror" vis={vis} setVis={setVis} avail={ALL_LAYERS} onNavigate={onNavigate} onCollapseToggle={onCollapseToggle} disabled repCtx={repCtx} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Pipeline failed at: {result.failed_at_step ?? 'unknown'}
        </div>
      </div>
    );
  }

  // Header ist statisch: Label „Inspector", Subline „System-Build-Mirror".
  // Die fruehere dynamische Layer-/Asset-Zeile wurde entfernt (Userwunsch).
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header label="Inspector" detail="System-Build-Mirror" vis={vis} setVis={setVis} avail={availLayers} onNavigate={onNavigate} onCollapseToggle={onCollapseToggle} repCtx={repCtx} />
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

function Header({
  label, detail, vis, setVis, avail, onNavigate, onCollapseToggle, disabled, repCtx,
}: {
  label: string;
  detail: string;
  vis: LayerVisibility;
  setVis: (v: LayerVisibility) => void;
  avail: LayerAvailability;
  onNavigate?: (face: RepresentBuildFace) => void;
  onCollapseToggle?: () => void;
  disabled?: boolean;
  repCtx: ReturnType<typeof useRepresentationContext>;
}) {
  const [open, setOpen] = useState(false);

  // Compare-Picker: Operator waehlt, welche R der Inspector zeigt.
  // null = folgt der URL (Standardfall). Aenderung kippt die URL nicht.
  const geometryById = new Map(repCtx.registry.geometries.map((g) => [g.id, g]));
  const inspectorSelectValue = repCtx.inspectorView?.representation.id ?? '__follow_url__';
  return (
    <div style={{
      position: 'relative',
      padding: '6px 10px', background: '#0d1520', color: '#a0aec0',
      borderBottom: '1px solid #1e2d40', fontSize: 11,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flexShrink: 0 }} title="Inspector — Sicht auf die laufende Repraesentation">
        <RepresentBuildTetrahedron
          variant="dark"
          onFaceClick={onNavigate}
          size={38}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ color: '#e0eeff', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {detail}
        </div>
      </div>
      <select
        value={inspectorSelectValue}
        onChange={(e) => {
          const v = e.target.value;
          repCtx.setInspectorView(v === '__follow_url__' ? null : v);
        }}
        title="Inspector — welche Representation anzeigen (URL bleibt unangetastet)"
        style={{
          fontSize: 10, padding: '3px 6px',
          background: '#0d1520', color: '#e0eeff',
          border: '1px solid #2d4a6a', borderRadius: 3,
          maxWidth: 130,
        }}
      >
        <option value="__follow_url__">— keine R —</option>
        {repCtx.registry.representations.map((rep) => {
          const geo = geometryById.get(rep.geometry_id);
          const regionLabel = geo?.region ? ` (${geo.region})` : '';
          return (
            <option key={rep.id} value={rep.id}>
              {rep.name}{regionLabel}
            </option>
          );
        })}
      </select>
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 10, padding: '3px 8px', cursor: disabled ? 'not-allowed' : 'pointer',
          border: '1px solid #2d4a6a', background: open ? '#1e3a5f' : 'transparent',
          color: '#a0aec0', borderRadius: 3,
        }}
      >
        Layer ▾
      </button>
      {onCollapseToggle && (
        <button
          onClick={onCollapseToggle}
          title="Inspector ausblenden"
          style={{
            fontSize: 12, padding: '0 8px', cursor: 'pointer', height: 22,
            border: '1px solid #2d4a6a', background: 'transparent',
            color: '#a0aec0', borderRadius: 3,
          }}
        >▶</button>
      )}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 6, zIndex: 1000,
          background: '#1a2535', border: '1px solid #2d4a6a', borderRadius: 4,
          padding: '8px 10px', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {avail.boundary && <LayerToggle label="Boundary" checked={vis.boundary} onChange={(v) => setVis({ ...vis, boundary: v })} />}
          {avail.pois && <LayerToggle label="POIs" checked={vis.pois} onChange={(v) => setVis({ ...vis, pois: v })} />}
          {avail.pois && vis.pois && <LayerToggle label="↳ echte Icons" checked={vis.poiIcons} onChange={(v) => setVis({ ...vis, poiIcons: v })} indent />}
          {avail.colourmesh && <LayerToggle label="Colour-Mesh" checked={vis.colourmesh} onChange={(v) => setVis({ ...vis, colourmesh: v })} />}
          {avail.routes && <LayerToggle label="Routen / Edges" checked={vis.routes} onChange={(v) => setVis({ ...vis, routes: v })} />}
          {avail.resample && <LayerToggle label="Resample 3 m" checked={vis.resample3} onChange={(v) => setVis({ ...vis, resample3: v })} />}
          {avail.resample && <LayerToggle label="Resample 10 m" checked={vis.resample10} onChange={(v) => setVis({ ...vis, resample10: v })} />}
          {avail.resample && <LayerToggle label="Resample 25 m" checked={vis.resample25} onChange={(v) => setVis({ ...vis, resample25: v })} />}
          {avail.resample && <LayerToggle label="Last (sim)" checked={vis.simLoad} onChange={(v) => setVis({ ...vis, simLoad: v })} />}
          <div style={{ borderTop: '1px solid #2d4a6a', margin: '6px 0 4px' }} />
          <LayerToggle label="Karte" checked={vis.mapBase} onChange={(v) => setVis({ ...vis, mapBase: v })} />
          {vis.mapBase && <LayerToggle label="↳ dunkel" checked={vis.darkBase} onChange={(v) => setVis({ ...vis, darkBase: v })} indent />}
        </div>
      )}
    </div>
  );
}

function LayerToggle({ label, checked, onChange, indent }: { label: string; checked: boolean; onChange: (v: boolean) => void; indent?: boolean }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px 0', paddingLeft: indent ? 14 : 0, cursor: 'pointer',
      color: indent ? '#a9c4e0' : '#e0eeff', fontSize: 11,
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
          // Inspector-Blitz: Pergament-Trapez zuckt kurz weiss durch.
          // Reflexion hat sich neu sortiert. Siehe ann_066 (Geste 2).
          window.dispatchEvent(new CustomEvent('scim:inspector:flash'));
        }}
        style={{ cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}
