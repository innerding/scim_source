import type { TabId } from './panelRegistry';
import {
  KOSMOLOGIE_IDS,
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR,
  RUNTIME_BUILDER_REGISTRY, VERSIONEN_REGISTRY, WORKSPACE_DESCRIPTOR,
  GEOMETRY_EDITOR_DESCRIPTOR, CATALOG_DESCRIPTOR,
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
import GeometryEditorPanel from './panels/GeometryEditorPanel';

interface Props {
  activeId: string;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  result: ScimPipelineResult;
  onJumpTo?: (panelId: string) => void;
}

const TAB_ORDER: TabId[] = ['catalog', 'input', 'simulation', 'result', 'validation', 'leistungsblatt', 'raw'];

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

function PanelHeader({ title, subtitle, dimmed }: { title: string; subtitle: string; dimmed?: boolean }) {
  // Header passt zum dunklen Navigator-Strip: dunkler Hintergrund,
  // Titel in Weiss mit 90 % Opacity, Untertitel in halber Helligkeit.
  // dimmed=true (Panel ist in der Kosmologie schon visuell vertreten):
  // gesamter Header auf 60 % opacity — kein Doppel-Schrei. Siehe ann_051.
  return (
    <div style={{
      padding: '14px 20px 12px',
      borderBottom: '1px solid #1a2535',
      background: '#0d1520',
      flexShrink: 0,
      opacity: dimmed ? 0.6 : 1,
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'system-ui, sans-serif' }}>
        {title}
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

function PanelContent({ activeId, activeTab, result, onJumpTo }: {
  activeId: string;
  activeTab: TabId;
  result: ScimPipelineResult;
  onJumpTo?: (panelId: string) => void;
}) {
  const role = useRole();
  if (activeId === WORKSPACE_DESCRIPTOR.id) {
    return <WorkspacePanel onJumpTo={onJumpTo ?? (() => {})} />;
  }
  if (activeId === GEOMETRY_EDITOR_DESCRIPTOR.id) {
    return <GeometryEditorPanel onJumpTo={onJumpTo ?? (() => {})} />;
  }
  if (activeId === CATALOG_DESCRIPTOR.id) {
    if (role !== 'operator') return null;
    return <CatalogTab onJumpTo={onJumpTo} />;
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

  switch (activeTab) {
    case 'input':      return <PanelInputForm panel={panel} result={result} />;
    case 'simulation': {
      // Heute nur fuer P06 implementiert (Pattern-Klassifikator-Sandbox, ann_064).
      if (panel.id !== 'P06') return null;
      const ctx = result.success ? (result.context as unknown as Record<string, unknown>) : null;
      return <P06SimulationForm state={ctx?.telco_load as TelcoLoadState | undefined} />;
    }
    case 'result':     return <PanelResult panel={panel} result={result} />;
    case 'validation': return <PanelValidation panel={panel} result={result} />;
    case 'raw':        return <PanelRaw panel={panel} result={result} />;
    default:           return null;
  }
}

export default function PanelWorkspace({ activeId, activeTab, onTabChange, result, onJumpTo }: Props) {
  const role = useRole();

  // Resolve tabs for the current entry
  const entry =
    activeId === WORKSPACE_DESCRIPTOR.id        ? WORKSPACE_DESCRIPTOR :
    activeId === GEOMETRY_EDITOR_DESCRIPTOR.id  ? GEOMETRY_EDITOR_DESCRIPTOR :
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
      <PanelHeader title={entry.label} subtitle={subtitle} dimmed={KOSMOLOGIE_IDS.has(activeId)} />
      <TabBar tabs={tabs} active={activeTab} onSelect={onTabChange} />
      {/* Geometry-Editor braucht volle Hoehe ohne Padding */}
      {activeId === GEOMETRY_EDITOR_DESCRIPTOR.id ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <PanelContent activeId={activeId} activeTab={activeTab} result={result} onJumpTo={onJumpTo} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <PanelContent activeId={activeId} activeTab={activeTab} result={result} onJumpTo={onJumpTo} />
        </div>
      )}
    </div>
  );
}
