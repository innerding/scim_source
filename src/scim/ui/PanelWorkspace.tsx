import type { ReactNode } from 'react';
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
import PanelResult from './panels/PanelResult';
import PanelValidation from './panels/PanelValidation';
import PanelRaw from './panels/PanelRaw';
import P06SimulationForm from './panels/P06SimulationForm';
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

const TAB_ORDER: TabId[] = ['catalog', 't1', 't2', 't3', 't4', 'signal_intake', 'analysis', 'adjust', 'input', 'icon', 'simulation', 'result', 'validation', 'leistungsblatt', 'raw'];

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
  horizon: string; pkg: string;
  dependsMid: string; dependsShort: string; fn: string; rescueFrom: string; gallery?: boolean;
}
// Vorschlag-Mapping Artefakt → Horizont → Zielpaket (bitte bestätigen):
const P09_DESCRIPTORS: P09Descriptor[] = [
  {
    tabId: 't1', no: 1, name: 'poi-dompteur', actions: 'category-composit + sequenzer', source: 'poi-katalog',
    horizon: 'mid', pkg: 'Representation-Paket',
    dependsMid: 'representation(xy) poi-asset (die Icons)',
    dependsShort: 'telco-load → poi-translate · size = f(load): hohe Last → kleinere Größe + Last-Farbe',
    fn: 'size, colour = F(load, …)', rescueFrom: 'poiCatalog.composite', gallery: true,
  },
  {
    tabId: 't2', no: 2, name: 'load-colorist', actions: 'segment-gradient', source: 'gesampeltes Wegnetz (Segment-ids)',
    horizon: 'short', pkg: 'Atem(load)-Paket',
    dependsMid: 'gesampeltes Netz (P08): Segment-Geometrie + id',
    dependsShort: 'telco-load je Segment',
    fn: 'colour = G(load_segment)', rescueFrom: 'colourMesh (heatColor)',
  },
  {
    tabId: 't3', no: 3, name: 'comfort-masker', actions: 'segment-filter (BCK)', source: 'gesampeltes Wegnetz + User-Comfort',
    horizon: 'short', pkg: 'Atem(load)-Paket',
    dependsMid: 'gesampeltes Netz',
    dependsShort: 'User-Comfort-Einstellung (Farbschwelle)',
    fn: 'visible = (segment_colour ≤ comfort_colour)', rescueFrom: 'mask-logik (folgt)',
  },
  {
    tabId: 't4', no: 4, name: 'bak-router', actions: 'route-build + rest-detect (BAK)', source: 'gesampeltes Wegnetz + POI-Auswahl + Dauer',
    horizon: 'short', pkg: 'Atem(load)-Paket',
    dependsMid: 'gesampeltes Netz + POIs',
    dependsShort: 'User-Auswahl (POIs · Farbe · Dauer)',
    fn: 'route = BAK(net, pois, comfort, duration) · rest-detect', rescueFrom: 'routing-logik (folgt)',
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

function P09Artifact({ d }: { d: P09Descriptor }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Gemeinsamer Header — gilt für alle vier P09-Tabs. */}
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 8,
        fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0',
        background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        P09 · Engine-Prep-Build · auto-compute-Artefakt
      </div>
      <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: '2px 0 14px' }}>
        Build-seitige Vorbereitung. Die Engine läuft <strong>lokal in der Ziel-App</strong>, nicht in
        SCIM. Bei Ausspielung wird das Artefakt als <strong>versionierte, selbst-enthaltende Kapsel</strong>
        (Inhalts-Hash/Diff) via <strong>Sensus Core Service</strong> ins <strong>jeweilige Paket je nach
        Horizont</strong> geborgt (App-Shell / Representation / Atem(load)) — Teil MVP-Lichtenberg (lokal, ohne Telco).
      </p>
      <P09Row k="artifact" v={<><strong>{d.name}</strong> · #{d.no}</>} />
      <P09Row k="actions" v={d.actions} />
      <P09Row k="source" v={d.source} />
      <P09Row k="horizon · paket" v={<><strong>{d.horizon}</strong> → {d.pkg}</>} />
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
    if (d) return <P09Artifact d={d} />;
  }

  // Tab mit body → text-first Konzept-Kasten (z.B. Signal Intake / Analysis).
  const tabDesc = panel.tabs.find((t) => t.id === activeTab);
  let tabContent: ReactNode = null;
  if (tabDesc?.body && tabDesc.body.length > 0) {
    tabContent = <BaukonzeptNotiz id={panel.id} title={tabDesc.label} lines={tabDesc.body} />;
  } else {
    switch (activeTab) {
      // 'adjust' (Threshold-Panels) rendert die echten Schwellen-Slider.
      case 'input':
      case 'adjust':     tabContent = <PanelInputForm panel={panel} result={result} />; break;
      case 'simulation': {
        // Heute nur fuer P06 implementiert (Pattern-Klassifikator-Sandbox, ann_064).
        if (panel.id === 'P06') {
          const ctx = result.success ? (result.context as unknown as Record<string, unknown>) : null;
          tabContent = <P06SimulationForm state={ctx?.telco_load as TelcoLoadState | undefined} />;
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
      <TabBar tabs={tabs} active={safeTab} onSelect={onTabChange} />
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
