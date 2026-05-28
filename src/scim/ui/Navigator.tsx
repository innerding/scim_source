import type { PanelDescriptor, StatusColor } from './panelRegistry';
import {
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR,
  RUNTIME_BUILDER_REGISTRY, VERSIONEN_REGISTRY, WORKSPACE_DESCRIPTOR,
  GEOMETRY_EDITOR_DESCRIPTOR, CATALOG_DESCRIPTOR,
} from './panelRegistry';
import logoBaseNaked from '../../assets/logo-base-naked.svg';
import logoHexNaked from '../../assets/logo-hex-naked.svg';
import { useRole } from './RoleContext';
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace, RepresentBuildArc } from './RepresentBuildTetrahedron';
import type { TabId } from './panelRegistry';
import NavTransmissionField from './NavTransmissionField';

interface Props {
  activeId: string;
  activeTab?: TabId;
  onSelect: (id: string) => void;
  onGoTo?: (id: string, tab?: TabId) => void;
  onInspectorToggle?: () => void;   // Trapez ueber dem Mond ruft das auf
  onManualOpen?: () => void;        // Reader-Icon ruft das auf
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

// Derive which tetrahedron-face is currently "active" from the activeId.
// Faces -> Panels (1:1).
function faceFromActive(activeId: string): RepresentBuildFace | undefined {
  if (activeId === 'geometry_editor') return 'geometry_draw';
  if (activeId === 'catalog') return 'catalog_magazination';
  if (activeId === 'workspace') return 'represent_organisation';
  if (activeId === 'P11') return 'sensus_core_build';
  return undefined;
}

// Arc-Highlight: sys = P01, rou = P02, loa = P09 (Engine, wo Load lebt).
function arcFromActive(activeId: string): RepresentBuildArc | undefined {
  if (activeId === 'P02') return 'regio_content';
  if (activeId === 'P01') return 'system_adjust';
  if (activeId === 'P09') return 'load_thresholds';
  return undefined;
}

export default function Navigator({ activeId, onSelect, onGoTo, onInspectorToggle, onManualOpen, panelStatus = {} }: Props) {
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
      position: 'relative',
    }}>
      {/* Inspector — Pergament-Trapez ueber dem Mond.
          Perspektivisch: oben breit (Gap zu li/re/oben), unten schmaler.
          88% transluzent, kein Stroke. Klick toggelt die Map. */}
      {onInspectorToggle && (
        <svg
          viewBox="0 0 178 28"
          width={178}
          height={28}
          onClick={onInspectorToggle}
          style={{
            position: 'absolute', top: 8, left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer', zIndex: 5,
          }}
        >
          <title>Inspector — Sicht oeffnen/schliessen</title>
          <polygon
            points="0,0 178,0 154,28 24,28"
            fill="#e8d4a8"
            fillOpacity={0.12}
            stroke="none"
          />
        </svg>
      )}
      {/* Nacktes Logo — Iconset alleine, beschnitten auf 107.5 x 51.122.
          Wrapper zentriert die 0.88-skalierte Box links/rechts.
          Hex-Layer pulsiert; Dim-Wert um 50% tiefer als zuvor. */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        marginTop: 28, marginBottom: 6, flexShrink: 0,
      }}>
        <div style={{
          position: 'relative',
          width: `${Math.round(0.88 * 100)}%`,                          // f0.88
          height: Math.round(0.88 * (210 - 12) / (107.5 / 51.122)),     // proportional mit f0.88
        }}>
          <img
            src={logoBaseNaked}
            alt="SCIM3"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          <img
            src={logoHexNaked}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              animation: 'nav-hex-pulse 3200ms 2000ms ease-in-out infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes nav-hex-pulse {
            0%, 100% { opacity: 0.625; }
            50%       { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Transmissionsfeld — animiertes Mesh-Dreieck zwischen Mond und Tetraeder.
          Nimmt keinen Flow-Platz (height: 0), fuellt die 36-px-Luecke ueber
          der Manual+Reader-Zeile als absolute SVG-Overlay. Siehe ann_059. */}
      <NavTransmissionField />

      {/* Manual + Reader — sitzt am unteren Rand des Transmissionsfelds.
          Verschoben um 36 px nach unten via translateY (Layout-Fluss
          unveraendert, Tetraeder darunter ruehrt sich nicht).
          Manual (links): Datei-Glyph, sitzt da, ist nicht klickbar.
          Reader (rechts): unsichtbare Hitbox — Icon entfernt, Klickflaeche bleibt
          (siehe ann_059: das Transmissionsfeld traegt die Bedeutung, das
          Reader-Glyph war eine vorlaeufige Andeutung). */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 14px', marginBottom: 6, flexShrink: 0,
        transform: 'translateY(56px)',
      }}>
        <span
          title="Manual (ohne Leser stumm)"
          style={{
            fontSize: 14, color: '#4a6a8a', opacity: 0.55,
            userSelect: 'none', cursor: 'default',
          }}
        >📄</span>
        <span
          title="Manual lesen"
          onClick={onManualOpen}
          style={{
            display: 'inline-block',
            width: 18, height: 18,
            userSelect: 'none', cursor: onManualOpen ? 'pointer' : 'default',
          }}
        />
      </div>

      {/* ── Represent Build — zentrales Tetraeder-Control ──────────────────── */}
      <div style={{
        padding: '14px 12px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, flexShrink: 0,
      }}>
        <RepresentBuildTetrahedron
          activeFace={faceFromActive(activeId)}
          activeArc={arcFromActive(activeId)}
          variant="dark"
          size={171}
          showLabels
          onFaceClick={(f) => {
            if (f === 'geometry_draw') go('geometry_editor');
            else if (f === 'catalog_magazination') go('catalog');
            else if (f === 'represent_organisation') go('workspace');
            else if (f === 'sensus_core_build') go('P11');
          }}
          onArcClick={(a) => {
            if (a === 'system_adjust') go('P01');
            else if (a === 'regio_content') go('P02', 'input');
            else if (a === 'load_thresholds') go('P09');
          }}
        />
        <div style={{
          fontSize: 9, color: '#4a6a8a', textTransform: 'uppercase',
          letterSpacing: '0.10em', fontFamily: 'monospace',
        }}>
          Represent Build
        </div>
      </div>

      {/* ── Workspace / Geometry-Editor / Katalog / SystemAdjust ──────────── */}
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
      {role === 'operator' && (
        <NavItem
          id={CATALOG_DESCRIPTOR.id}
          icon={CATALOG_DESCRIPTOR.icon}
          label={CATALOG_DESCRIPTOR.label}
          status="blue"
          isActive={activeId === CATALOG_DESCRIPTOR.id}
          onClick={() => onSelect(CATALOG_DESCRIPTOR.id)}
        />
      )}
      {(['P01', 'P02'] as const).map((pid) => {
        const p = PANEL_REGISTRY.find((x) => x.id === pid);
        if (!p) return null;
        return (
          <NavItem
            key={p.id}
            id={p.id}
            icon={p.icon}
            label={p.label}
            status={panelStatus[p.id] ?? 'grey'}
            isActive={activeId === p.id}
            onClick={() => onSelect(p.id)}
          />
        );
      })}

      {/* ── Package Pipeline (ohne P01/P02 — sitzen jetzt unter Katalog) ──── */}
      <SectionDivider />
      <SectionHeader title="Package Pipeline" />
      {pipelineGroups.map((g, gi) => {
        const panels = PANEL_REGISTRY.filter((p: PanelDescriptor) => p.group === g && p.id !== 'P01' && p.id !== 'P02');
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
