import { useState, type ReactNode } from 'react';
import { useInspectorView } from '../../runtime/repContext';
import type { TabId } from './panelRegistry';
import {
  KOSMOLOGIE_IDS,
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR,
  RUNTIME_BUILDER_REGISTRY, VERSIONEN_REGISTRY, WORKSPACE_DESCRIPTOR,
  DRAWER_DESCRIPTOR, CATALOG_DESCRIPTOR,
} from './panelRegistry';
import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';

// Panel content placeholders — filled panel by panel in subsequent sessions
import PanelInputForm from './panels/PanelInputForm';
import ColourAdjust from './panels/ColourAdjust';
import UserExclusionControl from './panels/UserExclusionControl';
import TestRouteControl from './panels/TestRouteControl';
import RuntimeFlowExplainer from './panels/RuntimeFlowExplainer';
import SensusCoreReigen from './panels/SensusCoreReigen';
import { BoundaryView, WegnetzCompareView } from './panels/SichelViews';
import RuntimeShellView from './panels/RuntimeShellView';
import PanelResult from './panels/PanelResult';
import PanelValidation from './panels/PanelValidation';
import PanelRaw from './panels/PanelRaw';
import P06SimulationForm from './panels/P06SimulationForm';
import SimClockControl from './panels/SimClockControl';
import SimArchitecture from './panels/SimArchitecture';
import type { TelcoLoadState } from '../telco-load/telcoLoad.types';
import SystemPanel from './panels/SystemPanel';
import AiInterfacePanel from './panels/AiInterfacePanel';
import CatalogTab from './panels/CatalogTab';
import { useRole } from './RoleContext';
import V01PackagesPanel from './panels/V01PackagesPanel';
import V02RegionDetailPanel from './panels/V02RegionDetailPanel';
import V03ActiveMonitorPanel from './panels/V03ActiveMonitorPanel';
import WorkspacePanel from './panels/WorkspacePanel';
import DrawerPanel from './panels/DrawerPanel';
import { poiCompositeSvg } from '../poi-catalog/poiCatalog.composite';
import { CONTAINER_SYSTEM } from '../poi-catalog/poiCatalog.containerSystem';
import { REPRESENTATIONS, wegnetzById } from '../workspace/workspace.registry';
import { buildOriginPackage, MVP_RESAMPLE_TARGET_METERS } from '../sensus/originPackage';
import { buildOriginManifest } from '../sensus/originManifest';
import type { OriginManifest } from '../sensus/packageContract';
import type { OriginPackage } from '../sensus/originPackage';
import { resampleNet } from '../wegnetz/netResample';

interface Props {
  activeId: string;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  result: ScimPipelineResult;
  onJumpTo?: (panelId: string, geometryId?: string) => void;
  openGeometryId?: string | null;
  onGeometryConsumed?: () => void;
  openCatalogId?: string | null;
  onCatalogConsumed?: () => void;
}

const TAB_ORDER: TabId[] = ['catalog', 't1', 't2', 't3', 't4', 't5', 'signal_intake', 'analysis', 'adjust', 'input', 'icon', 'simulation', 'result', 'validation', 'leistungsblatt', 'raw'];

function TabBar({
  tabs, active, onSelect,
}: {
  tabs: { id: TabId; label: string; icon: string }[];
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #e2e8f0',
      background: '#f8fafc',
      flexShrink: 0,
    }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontFamily: 'monospace',
              border: 'none',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? '#1a365d' : '#718096',
              borderBottom: isActive ? '2px solid #0074d9' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'color 0.1s',
            }}
          >
            <span style={{ fontSize: 11 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function PanelHeader({ id, title, subtitle, dimmed }: { id: string; title: string; subtitle: string; dimmed?: boolean }) {
  // Header passt zum dunklen Navigator-Strip: dunkler Hintergrund,
  // Titel in Weiss mit 90 % Opacity, Untertitel in halber Helligkeit.
  // dimmed=true (Panel ist in der Kosmologie schon visuell vertreten):
  // gesamter Header auf 60 % opacity — kein Doppel-Schrei. Siehe ann_051.
  //
  // Vor dem Titel sitzt die Panel-ID als kleines Monospace-Chip, damit
  // der Operator zwischen P01..P14 / R01..R09 / V01..V03 nie raten muss,
  // wo er gerade ist. Bei nicht-nummerierten Panels (Workspace, Catalog,
  // Editor, System, AI) wird das Chip einfach uebersprungen.
  const showChip = /^(P\d{2}|R\d{2}|V\d{2})$/.test(id);
  return (
    <div style={{
      padding: '14px 20px 12px',
      borderBottom: '1px solid #1a2535',
      background: '#0d1520',
      flexShrink: 0,
      opacity: dimmed ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        fontFamily: 'system-ui, sans-serif',
      }}>
        {showChip && (
          <span style={{
            fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '2px 7px', borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}>
            {id}
          </span>
        )}
        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 3, fontFamily: 'system-ui, sans-serif' }}>
        {subtitle}
      </div>
    </div>
  );
}

function StubPanel({ id, description }: { id: string; description: string }) {
  return (
    <div style={{
      padding: '28px 24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '3px 8px', marginBottom: 18,
        fontSize: 10, fontFamily: 'monospace',
        color: '#2b6cb0', background: '#ebf8ff',
        border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        {id} — in Entwicklung
      </div>
      <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}

// Temporaere Bau-Konzeptnotiz: zeigt die Detailsaetze direkt im Panel an,
// solange es noch nicht mit echter Funktion befuellt ist (entfernbar, sobald
// gebaut). Quelle: PanelDescriptor.bauKonzept.
function BaukonzeptNotiz({ id, title, lines }: { id: string; title: string; lines: string[] }) {
  return (
    <div style={{
      margin: '0 0 18px', padding: '14px 16px',
      border: '1px solid #f6c177', background: '#fffaf0', borderRadius: 8,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10,
        fontSize: 10, fontFamily: 'monospace', color: '#9c6a00',
        background: '#fff0d6', border: '1px solid #f6c177', borderRadius: 4,
      }}>
        Baukonzeptnotiz · {id}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#7a4d00', marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#5a4a2a', lineHeight: 1.6 }}>
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

// P09 = vier auto-compute-Artefakte, alle gleich beschrieben (Sichtbarmachung
// der Rechen-Module). Build-seitige Vorbereitung; die Engine läuft lokal in der
// Ziel-App (App-Shell), nicht in SCIM. Jedes Artefakt wird bei Ausspielung als
// versionierte, selbst-enthaltende Kapsel via Sensus Core Service geborgt.
interface P09Descriptor {
  tabId: TabId; no: number; name: string; actions: string; source: string;
  horizon: string; pkg: string; produces: string[];
  dependsMid: string; dependsShort: string; fn: string; rescueFrom: string; gallery?: boolean;
}
const P09_DESCRIPTORS: P09Descriptor[] = [
  {
    tabId: 't1', no: 1, name: 'poi-dompteur', actions: 'category-composit + sequenzer',
    source: 'representation <xy> v.<x> · poi-katalog',
    horizon: 'long', pkg: 'Shell',
    produces: ['poi-dompteur (engine) → Shell · long', 'origin-asset-set → Origin · mid', 'origin-poi-set → Origin · mid'],
    dependsMid: 'representation(xy) poi-asset (die Icons)',
    dependsShort: 'telco-load → poi-translate · size = f(load): hohe Last → kleinere Größe + Last-Farbe',
    fn: 'size, colour = F(load, …)', rescueFrom: 'poiCatalog.composite', gallery: true,
  },
  {
    tabId: 't2', no: 2, name: 'load-colorist', actions: 'segment-gradient',
    source: 'representation <xy> v.<x> · origin-net (Segment-ids)',
    horizon: 'long', pkg: 'Shell',
    produces: ['colorize · normalizeLoads (engine) → Shell · long', 'load-values (je Segment) → Anthem · short'],
    dependsMid: 'origin-net (P08): Segment-Geometrie + id · colour-settings (Origin)',
    dependsShort: 'telco-load je Segment · presence-origin (Gate: welche origin-boundary)',
    fn: 'colour = colorize(normalizeLoads(load))', rescueFrom: 'sensus/loadColour.colorize + anthemSim.normalizeLoads (GEBAUT)',
  },
  {
    tabId: 't3', no: 3, name: 'comfort-masker', actions: 'segment-filter (BCK)',
    source: 'representation <xy> v.<x> · origin-net + User-Comfort',
    horizon: 'long', pkg: 'Shell',
    produces: ['comfort-masker / BCK (engine) → Shell · long'],
    dependsMid: 'origin-net',
    dependsShort: 'User-Comfort-Einstellung (Farbschwelle) — Laufzeit, kein Anthem-Particle',
    fn: 'state = classifyStretches(Ø-Last/Strecke)', rescueFrom: 'anthemSim.classifyStretches + stretchAverages (GEBAUT)',
  },
  {
    tabId: 't4', no: 4, name: 'bak-router', actions: 'route-build + rest-detect (BAK)',
    source: 'representation <xy> v.<x> · origin-net + origin-poi-set + User-Auswahl',
    horizon: 'long', pkg: 'Shell',
    produces: ['bak-router / BAK (engine) → Shell · long'],
    dependsMid: 'origin-net + origin-poi-set',
    dependsShort: 'User-Auswahl (POIs · Farbe · Dauer) — Laufzeit, kein Anthem-Particle',
    fn: 'route = buildRoutePath(net, a, b) · Ausweich folgt', rescueFrom: 'pathEngine.buildRoutePath + sensus/netRoute (GEBAUT) · Ausweich-Routing folgt (S5)',
  },
  {
    tabId: 't5', no: 5, name: 'reveal-engine', actions: 'boundary-intro · stilles Einloggen',
    source: 'representation <xy> v.<x> · origin-boundary (L0-Manifest)',
    horizon: 'long', pkg: 'Shell',
    produces: ['reveal-engine (engine) → Shell · long', 'verbraucht: origin-boundary → Origin · mid (L0)'],
    dependsMid: 'origin-boundary (L0): Ring + bbox — rahmt die OSM-Kamera',
    dependsShort: 'presence-origin (Startschuss des Reveals) — Laufzeit, kein Anthem-Particle',
    fn: 'invertierte Maske: Fenster-Zoom → Fill aus → Boundary ein (Stroke bleibt)',
    rescueFrom: 'ui/boundaryReveal.playBoundaryReveal (GEBAUT als P07-Prep)',
  },
];

function P09Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.45, padding: '4px 0', borderBottom: '1px solid #edf2f7' }}>
      <div style={{ width: 118, flexShrink: 0, color: '#718096', fontFamily: 'monospace', fontSize: 11 }}>{k}</div>
      <div style={{ color: '#2d3748' }}>{v}</div>
    </div>
  );
}

function P09PoiGallery() {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 8 }}>category-composit · SCIM-Vorschau (auch der Inspector nutzt diesen Renderer; die Ziel-App rendert eigenständig):</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {CONTAINER_SYSTEM.map((spec) => {
          const svg = poiCompositeSvg('', spec.color_label, spec.subcategory, 38);
          return (
            <div key={spec.subcategory} style={{ width: 88, textAlign: 'center' }}>
              <div style={{ width: 38, height: 38, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg ?? '' }} />
              <div style={{ fontSize: 9.5, color: '#4a5568', marginTop: 3, wordBreak: 'break-word' }}>{spec.subcategory}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function P09Artifact({ d, rep, origin }: { d: P09Descriptor; rep?: { name: string; version?: number } | null; origin?: OriginPackage | null }) {
  // source an die inspizierte Representation binden: <xy> → Name, v.<x> → Version.
  const source = rep
    ? d.source.replace('<xy>', rep.name).replace('v.<x>', rep.version != null ? `v.${rep.version}` : 'v.?')
    : d.source;
  // produces live machen: nennt eine Zeile ein origin-Partikel, echte Zahl+Bytes
  // aus dem aufgelösten Origin der Rep anhängen (gleicher Resolver wie P11).
  const enrich = (line: string): string => {
    if (!origin) return line;
    const p = origin.particles.find((x) => line.includes(x.id));
    return p ? `${line} · ${p.detail} · ${fmtBytes(p.bytes)}` : line;
  };
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Gemeinsamer Header — gilt für alle vier P09-Tabs. */}
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 8,
        fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0',
        background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        P09 · Engine-Prep &amp; Origin Capsulation · auto-compute-Artefakt
      </div>
      <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: '2px 0 14px' }}>
        Build-seitige Vorbereitung. Die Engine läuft <strong>lokal in der Ziel-App</strong>, nicht in
        SCIM. Bei Ausspielung wird das Artefakt als <strong>versionierte, selbst-enthaltende Kapsel</strong>
        (Inhalts-Hash/Diff) via <strong>Sensus Core Services</strong> ins <strong>jeweilige Paket je nach
        Horizont</strong> geborgt (Shell / Origin / Anthem) — Teil MVP-Lichtenberg (lokal, ohne Telco).
      </p>
      <P09Row k="artifact" v={<><strong>{d.name}</strong> · #{d.no}</>} />
      <P09Row k="actions" v={d.actions} />
      <P09Row k="source" v={source} />
      <P09Row k="produces" v={<>{d.produces.map((p, i) => <div key={i}>{enrich(p)}</div>)}</>} />
      <P09Row k="primär · paket" v={<><strong>{d.horizon}</strong> → {d.pkg}</>} />
      <P09Row k="depends · mid" v={d.dependsMid} />
      <P09Row k="depends · short" v={d.dependsShort} />
      <P09Row k="function" v={<code>{d.fn}</code>} />
      <P09Row k="rescue-kette" v={<>Berge <code>{d.rescueFrom}</code> → Kapsel (Hash/Diff) → SCS → {d.pkg}</>} />
      {d.gallery && <P09PoiGallery />}

      {/* Code-Fenster (schwarz): die Kapsel-Quelle. */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>code · Kapsel-Quelle:</div>
        <pre style={{
          background: '#0d1117', color: '#7ee787', padding: '12px 14px', borderRadius: 6,
          fontSize: 11.5, lineHeight: 1.55, overflowX: 'auto', margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{`// capsule: ${d.name}  ·  rescue from: ${d.rescueFrom}\n// target package: ${d.pkg}  (horizon ${d.horizon})\nfunction ${d.name.replace(/-/g, '_')}(load /* + deps */) {\n  return ${d.fn};\n}`}</pre>
      </div>

      {/* Aktualisierungsdaten in eigener Aufmachung. */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>Aktualisierung:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
          {([['version', '—'], ['hash', '—'], ['zuletzt ausgespielt', '—'], ['status', '— (kein Build)']] as [string, string][]).map(([k, v], i) => (
            <div key={i} style={{ padding: '8px 12px', borderRight: '1px solid #e2e8f0', minWidth: 130 }}>
              <div style={{ fontSize: 9, color: '#a0aec0', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
              <div style={{ fontSize: 12, color: '#2d3748', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sensus Core (P11): die committete Representation (Originpackage) wird von
// P07/P08/P09 in atomare particles portioniert; SCS sortiert sie nach Horizont
// in die drei Pakete. Statische Modell-Sicht.
const SCS_PACKAGES: { name: string; horizon: string; version: string; particles: string[] }[] = [
  { name: 'Shell', horizon: 'long-term', version: 'eigene App-Shell-Version', particles: ['dompteur', 'Farb-Engine: colorize · normalizeLoads', 'BCK: classifyStretches · stretchAverages', 'BAK: buildRoutePath · netRoute', 'reveal-engine: boundary-intro (verbraucht origin-boundary)', 'container-system'] },
  { name: 'Origin', horizon: 'mid-term', version: '= Representation-Version', particles: ['origin-boundary', 'origin-net (wegnetz-sample)', 'origin-asset-set', 'origin-poi-set', 'origin-pixel-images', 'colour-settings (spectrum/bias/safety/degradier)'] },
  { name: 'Anthem', horizon: 'short-term', version: 'Load-Zyklus (flüchtig)', particles: ['presence-origin (Einatmen · Gate)', 'load-values (Ausatmen)', 'user-exclusion (Runtime)'] },
];
// Deploy-Reihenfolge: quer über die Pakete (nicht Paket-für-Paket). presence-origin
// ist das Gate nach Shell — ohne zu wissen, in welcher origin-boundary der User
// ist, kann kein origin ausgespielt werden. Danach Netz, dann load (braucht das
// Netz), dann der Origin-Rest. MVP (origin via URL): kein Gate, kein Load → 1 → 3
// → 5. Scheduling gehört später dem Transmitter (SCS-nachgelagert); SCS deklariert
// die Reihenfolge hier.
const DEPLOY_ORDER: string[] = [
  '1 · Shell           — Engine-Suite (die App lebt)',
  '2 · presence-origin — Einatmen · Gate: welche boundary → welches origin   [entfällt im MVP]',
  '3 · origin-wegnetz  — das Netz (Segmente zum Einfärben)',
  '4 · load-values     — Ausatmen · Atem aufs Netz   [entfällt im MVP]',
  '5 · origin-rest     — asset-set → poi-set → pixel-charges (Pixel zuletzt)',
];

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} kB` : `${(n / 1048576).toFixed(2)} MB`;

function SensusCorePackages() {
  // Demo-Rep bleibt als Fallback/„Teilespender" erhalten — die Quelle, wenn kein
  // Auftraggeber gewählt/inspiziert ist.
  const demoRep = REPRESENTATIONS.find((r) => /lichtenberg/i.test(r.id) || /lichtenberg/i.test(r.name)) ?? REPRESENTATIONS[0];
  const inspected = useInspectorView()?.representation ?? null;
  // Auftraggeber: explizit gewählt > inspizierte (zuletzt aktive) > Demo-Rep.
  const [selId, setSelId] = useState<string | null>(null);
  const auftraggeber = REPRESENTATIONS.find((r) => r.id === selId) ?? inspected ?? demoRep;
  const origin = auftraggeber ? buildOriginPackage(auftraggeber) : null;
  // Beauftragung/Kapselung: der Button baut das echte OriginManifest. Wird der
  // Auftraggeber gewechselt, gilt eine alte Kapsel als veraltet (neu beauftragen).
  const [capsule, setCapsule] = useState<OriginManifest | null>(null);
  const capsuleFresh = capsule != null && capsule.repId === auftraggeber?.id;
  // Resample-Trade-off: dasselbe Netz bei verschiedenen Zielsegmentlängen.
  const net = auftraggeber?.wegnetz_id ? wegnetzById(auftraggeber.wegnetz_id) : undefined;
  const resampleVariants = net
    ? [3, 10, 25].map((t) => ({ t, r: resampleNet(net.edges, { targetMeters: t }) }))
    : [];
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 8,
        fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0',
        background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        Sensus Core Services · Originpackage → Shell · Origin · Anthem
      </div>
      {/* Auftraggeber-Wähler: welche committete Representation Sensus Core beauftragt. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12 }}>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>Auftraggeber:</span>
        <select
          value={auftraggeber?.id ?? ''}
          onChange={(e) => setSelId(e.target.value)}
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', color: '#1a365d' }}
        >
          {REPRESENTATIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.version != null ? ` · v${r.version}` : ''}</option>
          ))}
        </select>
        {inspected && auftraggeber?.id === inspected.id && selId == null && (
          <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic' }}>(folgt dem Inspector)</span>
        )}
        <button
          onClick={() => { if (auftraggeber) setCapsule(buildOriginManifest(auftraggeber)); }}
          style={{
            marginLeft: 'auto', fontSize: 12, padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
            border: '1px solid #2f855a', background: '#f0fff4', color: '#22543d', fontWeight: 600,
          }}
        >▣ Origin auflösen &amp; kapseln</button>
      </div>

      {/* Kapsel: das materialisierte OriginManifest (Vorschlag A · Schritt 2). */}
      {capsuleFresh && capsule && (
        <div style={{ border: '1px solid #c6f6d5', background: '#f0fff4', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22543d' }}>
            Kapsel · {capsule.kind} · „{capsule.repName}" v{capsule.version}
          </div>
          <div style={{ fontSize: 11, color: '#2f855a', margin: '2px 0 8px' }}>
            Origin gekapselt — bereit zum Publish (P14). Shell (Engines) + Anthem (Laufzeit) werden referenziert, nicht hier aufgelöst.
          </div>
          <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#22543d', lineHeight: 1.7 }}>
            <div>L0 · origin-boundary (Manifest) · {capsule.boundary.length} Punkte · bbox [{capsule.bbox.map((n) => n.toFixed(4)).join(', ')}]</div>
            {capsule.layers.map((l) => (
              <div key={l.id}>· {l.id}{l.bytes != null ? ` · ${fmtBytes(l.bytes)}` : ' · (reserviert)'} → <span style={{ color: '#718096' }}>{l.ref}</span></div>
            ))}
            <div>anthem → <span style={{ color: '#718096' }}>{capsule.anthemEndpoint}</span></div>
          </div>
        </div>
      )}
      {capsule && !capsuleFresh && (
        <div style={{ fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic', marginBottom: 10 }}>
          Auftraggeber gewechselt — bitte neu „Origin auflösen &amp; kapseln".
        </div>
      )}
      <SensusCoreReigen origin={origin} />
      <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.55, margin: '2px 0 14px' }}>
        Sensus Core ordert die atomaren particles von <strong>P07/P08/P09</strong> und stellt daraus
        <strong> Shell · Origin · Anthem</strong> zusammen. <strong>Origin erbt die Version der Representation.</strong>
        {' '}Tagging: <strong>Shell</strong> trägt die generischen <em>Engines</em> (Farb-Engine colorize/normalize/classify, BCK/BAK) ·
        <strong> Anthem</strong> die flüchtige <em>Last</em> (load-values, presence-origin, user-exclusion).
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {SCS_PACKAGES.map((pkg) => {
          const live = pkg.name === 'Origin' && origin ? origin : null;
          return (
          <div key={pkg.name} style={{ flex: '1 1 220px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>{pkg.name} <span style={{ fontSize: 10, fontWeight: 400, color: '#a0aec0' }}>({pkg.horizon})</span></div>
            <div style={{ fontSize: 10, color: '#718096', fontFamily: 'monospace', margin: '2px 0 6px' }}>
              version: {live ? `${live.version} · Σ ${fmtBytes(live.totalBytes)}` : pkg.version}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#2d3748', lineHeight: 1.5 }}>
              {live
                ? live.particles.map((p) => (
                    <li key={p.id}>{p.label} <span style={{ color: '#a0aec0', fontSize: 11 }}>· {p.detail} · {fmtBytes(p.bytes)}</span></li>
                  ))
                : pkg.particles.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        );})}
      </div>
      {origin && (
        <p style={{ fontSize: 10.5, color: '#a0aec0', margin: '6px 0 0' }}>
          Origin-Zahlen live aufgelöst aus „{origin.repName}" v{origin.version} (buildOriginPackage) — reale UTF-8-Größen.
        </p>
      )}
      {resampleVariants.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
            origin-net Resample-Trade-off (Netz {Math.round(resampleVariants[0].r.totalMeters)} m) — Zielsegmentlänge ist der Hebel:
          </div>
          <table style={{ fontSize: 11.5, borderCollapse: 'collapse', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            <thead>
              <tr style={{ color: '#a0aec0' }}>
                <th style={{ textAlign: 'left', padding: '2px 14px 2px 0' }}>Ziel</th>
                <th style={{ textAlign: 'right', padding: '2px 14px 2px 0' }}>Segmente</th>
                <th style={{ textAlign: 'right', padding: '2px 14px 2px 0' }}>Geometrie (1×)</th>
                <th style={{ textAlign: 'right', padding: '2px 0' }}>Load/5min</th>
              </tr>
            </thead>
            <tbody>
              {resampleVariants.map(({ t, r }) => (
                <tr key={t} style={{ color: t === MVP_RESAMPLE_TARGET_METERS ? '#1a365d' : '#2d3748', fontWeight: t === MVP_RESAMPLE_TARGET_METERS ? 700 : 400 }}>
                  <td style={{ padding: '2px 14px 2px 0' }}>{t} m{t === MVP_RESAMPLE_TARGET_METERS ? ' · MVP' : ''}</td>
                  <td style={{ textAlign: 'right', padding: '2px 14px 2px 0' }}>{r.segmentCount}</td>
                  <td style={{ textAlign: 'right', padding: '2px 14px 2px 0' }}>{fmtBytes(r.geometryBytes)}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0' }}>{fmtBytes(r.loadArrayBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 10.5, color: '#a0aec0', margin: '6px 0 0' }}>
            origin-net wird als <strong>@{MVP_RESAMPLE_TARGET_METERS} m-Resample</strong> ausgespielt (s. Origin-Karte) — die Tabelle zeigt den Zielsegmentlängen-Trade-off (3 m = Detail-Untergrenze, Geometrie explodiert).
          </p>
        </div>
      )}
      <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, margin: '12px 0 0' }}>
        <strong>Anthem = Zwei-Wege-Atem (alle 5 Min).</strong> Einatmen: <strong>presence-origin</strong> (anonym — nur <em>welche origin-boundary</em>; das <em>Gate</em>, das origin erst auswählt) ·
        Ausatmen: <strong>load-values</strong> (Segment-Farbe fürs Colour-Mesh). Echtes Telco später; <strong>MVP simuliert</strong> bereits den 5-Min-Ping „ich bin in der Region".
      </p>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
          Deploy-Reihenfolge — quer über die Pakete, sobald Load lieferbar (MVP, origin via URL: 1 → 3 → 5):
        </div>
        <pre style={{
          background: '#0d1117', color: '#7ee787', padding: '12px 14px', borderRadius: 6,
          fontSize: 11.5, lineHeight: 1.6, overflowX: 'auto', margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{DEPLOY_ORDER.join('\n')}</pre>
        <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 6 }}>
          Scheduling gehört später dem <strong>Transmitter</strong> (SCS-nachgelagert) — SCS deklariert die Reihenfolge hier.
        </div>
      </div>
    </div>
  );
}

function PanelContent({ activeId, activeTab, result, onJumpTo, openGeometryId, onGeometryConsumed, openCatalogId, onCatalogConsumed }: {
  activeId: string;
  activeTab: TabId;
  result: ScimPipelineResult;
  onJumpTo?: (panelId: string, geometryId?: string) => void;
  openGeometryId?: string | null;
  onGeometryConsumed?: () => void;
  openCatalogId?: string | null;
  onCatalogConsumed?: () => void;
}) {
  const role = useRole();
  const inspectedRep = useInspectorView()?.representation ?? null;
  if (activeId === WORKSPACE_DESCRIPTOR.id) {
    return <WorkspacePanel onJumpTo={onJumpTo ?? (() => {})} />;
  }
  if (activeId === DRAWER_DESCRIPTOR.id) {
    return <DrawerPanel onJumpTo={onJumpTo ?? (() => {})} openGeometryId={openGeometryId} onGeometryConsumed={onGeometryConsumed} iconView={activeTab === 'icon'} />;
  }
  if (activeId === CATALOG_DESCRIPTOR.id) {
    if (role !== 'operator') return null;
    return <CatalogTab onJumpTo={onJumpTo} openCatalogId={openCatalogId} onCatalogConsumed={onCatalogConsumed} />;
  }
  if (activeId === SYSTEM_DESCRIPTOR.id) {
    return <SystemPanel activeTab={activeTab} result={result} />;
  }
  if (activeId === AI_INTERFACE_DESCRIPTOR.id) {
    if (role !== 'operator') return null;
    return <AiInterfacePanel activeTab={activeTab} />;
  }

  // R01 Runtime Shell: echte Erklär-/Aussichts-Ansicht statt Stub.
  if (activeId === 'R01') return <RuntimeShellView />;
  const runtimeModule = RUNTIME_BUILDER_REGISTRY.find((m) => m.id === activeId);
  if (runtimeModule) {
    return <StubPanel id={runtimeModule.id} description={runtimeModule.shortDescription} />;
  }

  if (activeId === 'V01') return <V01PackagesPanel />;
  if (activeId === 'V02') return <V02RegionDetailPanel />;
  if (activeId === 'V03') return <V03ActiveMonitorPanel />;

  const versionenEntry = VERSIONEN_REGISTRY.find((v) => v.id === activeId);
  if (versionenEntry) {
    return <StubPanel id={versionenEntry.id} description={versionenEntry.shortDescription} />;
  }

  const panel = PANEL_REGISTRY.find((p) => p.id === activeId);
  if (!panel) return <div style={{ padding: 20, color: '#e53e3e' }}>Panel nicht gefunden: {activeId}</div>;

  // P09: vier uniform beschriebene auto-compute-Artefakte (POI/Last/Mask/Move).
  if (panel.id === 'P09') {
    const d = P09_DESCRIPTORS.find((x) => x.tabId === activeTab);
    if (d) {
      // Origin der inspizierten Rep live auflösen (gleicher Resolver wie P11) —
      // speist die produces-Zeilen mit echten Zahlen+Bytes.
      const p09Origin = inspectedRep ? buildOriginPackage(inspectedRep) : null;
      // Mask-Tab (t3): User-Ausschluss-Regler (C1) · Move-Tab (t4): Test-Route (S4b).
      const extra = activeTab === 't3' ? <UserExclusionControl />
        : activeTab === 't4' ? <><RuntimeFlowExplainer /><TestRouteControl /></>
        : null;
      if (extra) {
        return (
          <>
            <P09Artifact d={d} rep={inspectedRep} origin={p09Origin} />
            <div style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>{extra}</div>
          </>
        );
      }
      return <P09Artifact d={d} rep={inspectedRep} origin={p09Origin} />;
    }
  }
  // P11 Sensus Core Service: die drei Horizont-Pakete (Eingabe-Tab).
  if (panel.id === 'P11' && activeTab === 'input') return <SensusCorePackages />;

  // P07 t2 Rep-Junction: Notiz unauffällig halten (gedämpfte Zeile statt gelbem
  // Konzept-Kasten) — Future-Function, soll nicht ablenken.
  if (panel.id === 'P07' && activeTab === 't2') {
    const td = panel.tabs.find((t) => t.id === 't2');
    return (
      <div style={{ fontSize: 11.5, color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.55, maxWidth: 520 }}>
        {td?.body?.join(' ')}
      </div>
    );
  }

  // P01/P02/P04 (Threshold-Bögen, gleiche Tabs): Adjust zeigt NUR die Slider;
  // die Konzept-Notizen erscheinen unauffällig (gedämpfte Zeilen) in den anderen
  // Tabs. P01-bauKonzept nur einmal (Signal Intake), nicht doppelt auf jedem Tab.
  if (panel.id === 'P01' || panel.id === 'P02' || panel.id === 'P04') {
    if (activeTab === 'adjust') return <ColourAdjust panelId={panel.id} />;
    const td = panel.tabs.find((t) => t.id === activeTab);
    const lines = [...(td?.body ?? [])];
    if (activeTab === 'signal_intake' && panel.bauKonzept) lines.push(...panel.bauKonzept);
    if (lines.length === 0) return null;
    return (
      <div style={{ fontSize: 11.5, color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.55, maxWidth: 560 }}>
        {lines.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
      </div>
    );
  }

  // P08: Sampling-Pipeline als Direktvergleich (ohne Tabs, ohne Notiz).
  if (panel.id === 'P08') return <WegnetzCompareView />;

  // P07 t1: Boundary-View (Ring + Reveal-Prep). Notiz ist entfernt; falls wieder
  // gesetzt, erscheint sie darunter.
  if (panel.id === 'P07' && activeTab === 't1') {
    const td = panel.tabs.find((t) => t.id === 't1');
    return (
      <>
        <BoundaryView />
        {td?.body && td.body.length > 0 && (
          <div style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <BaukonzeptNotiz id={panel.id} title={td.label} lines={td.body} />
          </div>
        )}
      </>
    );
  }

  // Tab mit body → text-first Konzept-Kasten (z.B. Signal Intake / Analysis).
  const tabDesc = panel.tabs.find((t) => t.id === activeTab);
  let tabContent: ReactNode = null;
  if (tabDesc?.body && tabDesc.body.length > 0) {
    tabContent = <BaukonzeptNotiz id={panel.id} title={tabDesc.label} lines={tabDesc.body} />;
  } else {
    switch (activeTab) {
      // 'adjust' der Farb-Stationen P01/P02/P04 → die Farb-Regler (B2);
      // sonst die generischen Schwellen-Slider.
      case 'input':      tabContent = <PanelInputForm panel={panel} result={result} />; break;
      case 'adjust':
        tabContent = (panel.id === 'P01' || panel.id === 'P02' || panel.id === 'P04')
          ? <ColourAdjust panelId={panel.id} />
          : <PanelInputForm panel={panel} result={result} />;
        break;
      case 'simulation': {
        // Heute nur fuer P06 implementiert (Pattern-Klassifikator-Sandbox, ann_064).
        if (panel.id === 'P06') {
          const ctx = result.success ? (result.context as unknown as Record<string, unknown>) : null;
          tabContent = (
            <>
              <SimArchitecture />
              <SimClockControl />
              <P06SimulationForm state={ctx?.telco_load as TelcoLoadState | undefined} />
            </>
          );
        }
        break;
      }
      case 'result':     tabContent = <PanelResult panel={panel} result={result} />; break;
      case 'validation': tabContent = <PanelValidation panel={panel} result={result} />; break;
      case 'raw':        tabContent = <PanelRaw panel={panel} result={result} />; break;
      default:           tabContent = null;
    }
  }

  // Bau-Konzeptnotiz (falls gesetzt) ueber dem regulaeren Panel-Inhalt zeigen.
  if (panel.bauKonzept && panel.bauKonzept.length > 0) {
    return (
      <>
        <BaukonzeptNotiz id={panel.id} title={panel.label} lines={panel.bauKonzept} />
        {tabContent}
      </>
    );
  }
  return tabContent;
}

export default function PanelWorkspace({ activeId, activeTab, onTabChange, result, onJumpTo, openGeometryId, onGeometryConsumed, openCatalogId, onCatalogConsumed }: Props) {
  const role = useRole();

  // Resolve tabs for the current entry
  const entry =
    activeId === WORKSPACE_DESCRIPTOR.id        ? WORKSPACE_DESCRIPTOR :
    activeId === DRAWER_DESCRIPTOR.id  ? DRAWER_DESCRIPTOR :
    activeId === CATALOG_DESCRIPTOR.id          ? CATALOG_DESCRIPTOR :
    activeId === SYSTEM_DESCRIPTOR.id           ? SYSTEM_DESCRIPTOR :
    activeId === AI_INTERFACE_DESCRIPTOR.id ? AI_INTERFACE_DESCRIPTOR :
    RUNTIME_BUILDER_REGISTRY.find((m) => m.id === activeId) ??
    VERSIONEN_REGISTRY.find((v) => v.id === activeId) ??
    PANEL_REGISTRY.find((p) => p.id === activeId);

  if (!entry) {
    return (
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#718096', fontFamily: 'monospace', fontSize: 13 }}>Kein Panel ausgewählt</span>
      </div>
    );
  }

  const tabs = entry.tabs.filter((t) => {
    if (!TAB_ORDER.includes(t.id as TabId)) return false;
    if (t.id === 'catalog' && role !== 'operator') return false;
    return true;
  });
  // Aktiver Tab wird beim Panelwechsel auf 'input' gesetzt; Panels mit eigenen
  // Tabs (z.B. Threshold-Panels) haben kein 'input' → auf den ersten Tab fallen.
  const safeTab: TabId = tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? activeTab);
  const subtitle =
    'shortDescription' in entry ? (entry as { shortDescription: string }).shortDescription : '';

  return (
    <div style={{
      flex: 1,
      background: '#f7f9fc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      <PanelHeader id={entry.id} title={entry.label} subtitle={subtitle} dimmed={KOSMOLOGIE_IDS.has(activeId)} />
      {/* P08 rendert die Sampling-Pipeline als eine Vergleichsansicht — ohne Tabs. */}
      {activeId !== 'P08' && <TabBar tabs={tabs} active={safeTab} onSelect={onTabChange} />}
      {/* Geometry-Editor braucht volle Hoehe ohne Padding */}
      {activeId === DRAWER_DESCRIPTOR.id ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <PanelContent activeId={activeId} activeTab={safeTab} result={result} onJumpTo={onJumpTo} openGeometryId={openGeometryId} onGeometryConsumed={onGeometryConsumed} openCatalogId={openCatalogId} onCatalogConsumed={onCatalogConsumed} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <PanelContent activeId={activeId} activeTab={safeTab} result={result} onJumpTo={onJumpTo} openGeometryId={openGeometryId} onGeometryConsumed={onGeometryConsumed} openCatalogId={openCatalogId} onCatalogConsumed={onCatalogConsumed} />
        </div>
      )}
    </div>
  );
}
