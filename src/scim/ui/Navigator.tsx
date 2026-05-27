import type { PanelDescriptor, StatusColor } from './panelRegistry';
import {
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR,
  RUNTIME_BUILDER_REGISTRY, VERSIONEN_REGISTRY, WORKSPACE_DESCRIPTOR,
  GEOMETRY_EDITOR_DESCRIPTOR,
} from './panelRegistry';
import logoBase from '../../assets/logo-base.svg';
import logoHex from '../../assets/logo-hex.svg';
import { useRole } from './RoleContext';
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace, RepresentBuildArc } from './RepresentBuildTetrahedron';
import type { TabId } from './panelRegistry';

interface Props {
  activeId: string;
  activeTab?: TabId;
  onSelect: (id: string) => void;
  onGoTo?: (id: string, tab?: TabId) => void;
  onInspectorToggle?: () => void;
  onManualOpen?: () => void;
  panelStatus?: Record<string, StatusColor>;
}

const STATUS_DOT: Record<StatusColor, { char: string; color: string }> = {
  green:  { char: '●', color: '#2ecc40' },
  orange: { char: '◐', color: '#ff851b' },
  red:    { char: '●', color: '#ff4136' },
  grey:   { char: '○', color: '#555' },
  blue:   { char: '✎', color: '#0074d9' },
};

function Dot({ status }: { status: StatusColor }) {
  const s = STATUS_DOT[status];
  return (
    <span style={{ color: s.color, fontSize: 10, marginLeft: 'auto', flexShrink: 0 }}>
      {s.char}
    </span>
  );
}

function NavItem({
  icon, label, status, isActive, onClick,
}: {
  id: string; icon: string; label: string; status: StatusColor;
  isActive: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        cursor: 'pointer',
        borderRadius: 4,
        background: isActive ? '#1e3a5f' : 'transparent',
        color: isActive ? '#e0eeff' : '#a0aec0',
        fontSize: 12,
        fontFamily: 'monospace',
        userSelect: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#1a2535';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <Dot status={status} />
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      height: 1, background: '#1e2d40', margin: '4px 8px',
    }} />
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
      color: '#2d4a6a', textTransform: 'uppercase',
      padding: '14px 12px 4px',
      userSelect: 'none', flexShrink: 0,
    }}>
      {title}
    </div>
  );
}

function SectionDivider() {
  return (
    <div style={{
      height: 2, background: '#1a2d3e',
      margin: '8px 8px 0',
      borderTop: '1px solid #1e3a5f',
    }} />
  );
}

// Derive which tetrahedron-face is currently "active" from the activeId+activeTab.
function faceFromActive(activeId: string, activeTab?: TabId): RepresentBuildFace | undefined {
  if (activeId === 'geometry_editor') return 'geometry_draw';
  if (activeId === 'P02' && activeTab === 'catalog') return 'catalog_magazination';
  if (activeId === 'workspace') return 'represent_organisation';
  return undefined;
}

// Arc-Highlight: 'thr' wenn auf einem Panel im input-Tab (Regio-Content-Eingabe).
function arcFromActive(activeId: string, activeTab?: TabId): RepresentBuildArc | undefined {
  // P02 input == klassische Regio-Content-Eingabe
  if (activeId === 'P02' && activeTab === 'input') return 'regio_content';
  if (activeId === 'P01') return 'system_adjust';
  return undefined;
}

export default function Navigator({ activeId, activeTab, onSelect, onGoTo, onInspectorToggle, onManualOpen, panelStatus = {} }: Props) {
  const go = onGoTo ?? ((id: string) => onSelect(id));
  const pipelineGroups = [1, 2, 3, 4] as const;
  const role = useRole();

  return (
    <nav style={{
      width: 210,
      flexShrink: 0,
      background: '#0d1520',
      borderRight: '1px solid #1a2535',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '12px 6px 12px',
    }}>
      {/* Logo composition — aspect ratio 182.625 × 51.122 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: Math.round((210 - 12) / (182.625 / 51.122)),  // ≈ 54px
        marginBottom: 4, flexShrink: 0,
      }}>
        <img
          src={logoBase}
          alt="SCIM3"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <img
          src={logoHex}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            transformOrigin: '29.1% 59.1%',
            animation: 'nav-hex-pulse 3200ms 2000ms ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes nav-hex-pulse {
            0%, 100% { opacity: 0.75; }
            50%       { opacity: 1; }
          }
        `}</style>
      </div>

      {/* ── Represent Build — zentrales Tetraeder-Control ──────────────────── */}
      <div style={{
        padding: '14px 12px 8px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, flexShrink: 0,
      }}>
        <RepresentBuildTetrahedron
          activeFace={faceFromActive(activeId, activeTab)}
          activeArc={arcFromActive(activeId, activeTab)}
          variant="dark"
          size={170}
          showLabels
          onFaceClick={(f) => {
            if (f === 'geometry_draw') go('geometry_editor');
            else if (f === 'catalog_magazination') go('P02', 'catalog');
            else if (f === 'represent_organisation') go('workspace');
          }}
          onArcClick={(a) => {
            if (a === 'system_adjust') go('P01');
            else if (a === 'regio_content') go('P02', 'input');
            else if (a === 'manual') onManualOpen?.();
          }}
          onInspectorToggle={onInspectorToggle}
        />
        <div style={{
          fontSize: 9, color: '#4a6a8a', textTransform: 'uppercase',
          letterSpacing: '0.10em', fontFamily: 'monospace',
        }}>
          Represent Build
        </div>
      </div>

      {/* ── Workspace / Geometry-Editor als Listen-Fallback ────────────────── */}
      <SectionDivider />
      <NavItem
        id={WORKSPACE_DESCRIPTOR.id}
        icon={WORKSPACE_DESCRIPTOR.icon}
        label={WORKSPACE_DESCRIPTOR.label}
        status="blue"
        isActive={activeId === WORKSPACE_DESCRIPTOR.id}
        onClick={() => onSelect(WORKSPACE_DESCRIPTOR.id)}
      />
      <NavItem
        id={GEOMETRY_EDITOR_DESCRIPTOR.id}
        icon={GEOMETRY_EDITOR_DESCRIPTOR.icon}
        label={GEOMETRY_EDITOR_DESCRIPTOR.label}
        status="blue"
        isActive={activeId === GEOMETRY_EDITOR_DESCRIPTOR.id}
        onClick={() => onSelect(GEOMETRY_EDITOR_DESCRIPTOR.id)}
      />

      {/* ── Package Pipeline ───────────────────────────────────────────────── */}
      <SectionDivider />
      <SectionHeader title="Package Pipeline" />
      {pipelineGroups.map((g, gi) => {
        const panels = PANEL_REGISTRY.filter((p: PanelDescriptor) => p.group === g);
        return (
          <div key={g}>
            {gi > 0 && <Divider />}
            {panels.map((p: PanelDescriptor) => (
              <NavItem
                key={p.id}
                id={p.id}
                icon={p.icon}
                label={p.label}
                status={panelStatus[p.id] ?? 'grey'}
                isActive={activeId === p.id}
                onClick={() => onSelect(p.id)}
              />
            ))}
          </div>
        );
      })}

      {/* ── Runtime Builder ────────────────────────────────────────────────── */}
      <SectionDivider />
      <SectionHeader title="Runtime Builder" />
      {RUNTIME_BUILDER_REGISTRY.map((m) => (
        <NavItem
          key={m.id}
          id={m.id}
          icon={m.icon}
          label={m.label}
          status="grey"
          isActive={activeId === m.id}
          onClick={() => onSelect(m.id)}
        />
      ))}

      {/* ── Versionen ──────────────────────────────────────────────────────── */}
      <SectionDivider />
      <SectionHeader title="Versionen" />
      {VERSIONEN_REGISTRY.map((v) => (
        <NavItem
          key={v.id}
          id={v.id}
          icon={v.icon}
          label={v.label}
          status="grey"
          isActive={activeId === v.id}
          onClick={() => onSelect(v.id)}
        />
      ))}

      {/* ── Meta ───────────────────────────────────────────────────────────── */}
      <SectionDivider />

      <NavItem
        id={SYSTEM_DESCRIPTOR.id}
        icon={SYSTEM_DESCRIPTOR.icon}
        label={SYSTEM_DESCRIPTOR.label}
        status="orange"
        isActive={activeId === SYSTEM_DESCRIPTOR.id}
        onClick={() => onSelect(SYSTEM_DESCRIPTOR.id)}
      />
      {role === 'operator' && (
        <NavItem
          id={AI_INTERFACE_DESCRIPTOR.id}
          icon={AI_INTERFACE_DESCRIPTOR.icon}
          label={AI_INTERFACE_DESCRIPTOR.label}
          status="grey"
          isActive={activeId === AI_INTERFACE_DESCRIPTOR.id}
          onClick={() => onSelect(AI_INTERFACE_DESCRIPTOR.id)}
        />
      )}
    </nav>
  );
}
