import { useEffect, useRef, useState } from 'react';
import type { PanelDescriptor, StatusColor } from './panelRegistry';
import {
  KOSMOLOGIE_IDS,
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR,
  RUNTIME_BUILDER_REGISTRY, VERSIONEN_REGISTRY, WORKSPACE_DESCRIPTOR,
  DRAWER_DESCRIPTOR, CATALOG_DESCRIPTOR,
} from './panelRegistry';
import logoBaseNaked from '../../assets/logo-base-naked.svg';
import logoHexNaked from '../../assets/logo-hex-naked.svg';
import { useRole } from './RoleContext';
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace, RepresentBuildArc, RepresentBuildSickle } from './RepresentBuildTetrahedron';
import type { TabId } from './panelRegistry';
import NavTransmissionField from './NavTransmissionField';
import NavDepthTetraeder from './NavDepthTetraeder';

interface Props {
  activeId: string;
  activeTab?: TabId;
  onSelect: (id: string) => void;
  onGoTo?: (id: string, tab?: TabId) => void;
  onInspectorToggle?: () => void;   // Trapez ueber dem Mond ruft das auf
  inspectorActive?: boolean;        // true wenn ScimMap rechts offen ist
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
  id, icon, label, status, isActive, onClick,
}: {
  id: string; icon: string; label: string; status: StatusColor;
  isActive: boolean; onClick: () => void;
}) {
  // Items, die in der Kosmologie schon visuell vertreten sind, werden im
  // Navigator-Listenteil auf 60 % gedimmt — kein Doppel-Schrei. Siehe ann_051.
  const inKosmologie = KOSMOLOGIE_IDS.has(id);
  const dimStyle = inKosmologie ? { opacity: 0.6 } : undefined;
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
        fontSize: 11,                          // Label: Faktor 0.9 (12 -> 11)
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
      {/* Icon-Glyph: monochrom, Faktor 1.8 ggue. urspruenglichem 13 -> 23 */}
      <span style={{ fontSize: 23, width: 32, textAlign: 'center', flexShrink: 0, ...dimStyle }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...dimStyle }}>
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

function SectionHeader({
  title, count, isOpen, locked, onToggle,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  locked: boolean;       // true wenn aktive Sektion (kann nicht zu)
  onToggle: () => void;
}) {
  // Stil des "Represent Build"-Labels (zentriert, monospace, #4a6a8a, fontSize 12.5).
  // Plus Chevron + Count + Toggle-Verhalten. Locked = aktive Sektion bleibt
  // visuell offen, der Toggle ist trotzdem klickbar (er aendert das manuell-
  // offen-Set, was nach Verlassen der Sektion wirkt). Siehe ann_068.
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', background: 'transparent', border: 'none',
        fontSize: 12.5, color: '#4a6a8a', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontFamily: 'monospace',
        padding: '14px 12px 4px',
        cursor: 'pointer', userSelect: 'none', flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, opacity: locked ? 0.5 : 0.85 }}>{isOpen ? '▾' : '▸'}</span>
      <span>{title}</span>
      <span style={{ opacity: 0.5 }}>({count})</span>
    </button>
  );
}

function SectionBody({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  // max-height-Transition fuer ruhiges Auf- und Zuklappen. 800 px reicht fuer
  // jede Sektion (Pipeline ist die laengste mit 12 Items à ~38 px).
  return (
    <div style={{
      maxHeight: isOpen ? 800 : 0,
      overflow: 'hidden',
      transition: 'max-height 280ms ease-in-out',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// ─── Section-Definitionen + localStorage ─────────────────────────────────────
//
// Vier kollabierbare Sektionen. Eine Sektion ist offen, wenn (a) der aktive
// Panel innerhalb ihrer Ids liegt oder (b) sie im Session-localStorage als
// manuell offen vermerkt ist. Siehe ann_068.

const SECTION_STORAGE_KEY = 'scim3_nav_sections_open';

function loadOpenSections(): Set<string> {
  try {
    const raw = localStorage.getItem(SECTION_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x: unknown) => typeof x === 'string'));
    return new Set();
  } catch {
    return new Set();
  }
}

function saveOpenSections(s: Set<string>): void {
  try { localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(Array.from(s))); }
  catch { /* localStorage kann disabled sein, kein Hindernis */ }
}

// ─── Mond-Auswuchs-Konfiguration ─────────────────────────────────────────────
//
// Blob-Pfade direkt aus logo-base-naked.svg uebernommen. Hitbox folgt damit
// exakt der sichtbaren Form. regionMatch ist die REGION_MAP-ID (V01PackagesPanel),
// damit die Auswuchs-Aktivierung mit V02-Tabs synchronisiert ist. null bedeutet
// "noch keine Region in REGION_MAP" — Klick navigiert dann zu V02 ohne Tab-Select.

const MOND_AUSWUCHS_CONFIG: ReadonlyArray<{
  pathD: string;
  regionMatch: string | null;
  label: string;
}> = [
  {
    pathD: 'M14.802,8.585c-.507,3.935-4.122,6.722-8.058,6.217C2.809,14.295.02,10.68.527,6.744c.245-1.902,1.219-3.597,2.743-4.773,1.524-1.177,3.41-1.689,5.314-1.443,1.903.245,3.598,1.219,4.774,2.743,1.175,1.524,1.688,3.411,1.443,5.314Z',
    regionMatch: 'skg',
    label: 'Grünberg — Salzkammergut',
  },
  {
    pathD: 'M74.741,18.11c-.571-.741-.82-1.659-.701-2.585.119-.926.593-1.751,1.333-2.323.741-.571,1.654-.821,2.585-.701,1.914.246,3.27,2.004,3.024,3.919-.246,1.914-2.002,3.273-3.919,3.024-.926-.119-1.751-.593-2.323-1.334Z',
    regionMatch: 'böhmerwald',
    label: 'Lichtenberg — Böhmerwald',
  },
  {
    pathD: 'M22.601,42.624c.725.939,1.04,2.102.889,3.274-.311,2.425-2.537,4.151-4.965,3.833h0c-2.425-.313-4.144-2.54-3.832-4.965s2.536-4.144,4.965-3.833c1.173.151,2.218.751,2.942,1.69Z',
    regionMatch: null,
    label: 'Kanton Zürich (Region noch nicht im Index)',
  },
  {
    pathD: 'M106.491,46.274c-.354,2.746-2.876,4.699-5.622,4.338-1.329-.171-2.512-.851-3.333-1.915-.82-1.063-1.177-2.38-1.006-3.708.082-.633.286-1.23.586-1.774,0-.001.002,0,.003-.002.002-.002,0-.005.001-.008.328-.592.771-1.12,1.324-1.547.89-.686,1.956-1.049,3.058-1.049.216,0,.433.014.651.042,1.329.172,2.511.851,3.332,1.914s1.177,2.38,1.006,3.708Z',
    regionMatch: 'salzburg',
    label: 'Gaisberg — Salzburg',
  },
];

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

// Arc-Highlight: sys = P01, rou = P02, loa = P04 (Load/TelcoLoad).
function arcFromActive(activeId: string): RepresentBuildArc | undefined {
  if (activeId === 'P02') return 'regio_content';
  if (activeId === 'P01') return 'system_adjust';
  if (activeId === 'P04') return 'load_thresholds';
  return undefined;
}

// Sichel-Highlight: bou = P07, wns = P08, epb = P09.
function sickleFromActive(activeId: string): RepresentBuildSickle | undefined {
  if (activeId === 'P07') return 'boundary';
  if (activeId === 'P08') return 'wegnetz_sampling';
  if (activeId === 'P09') return 'engine_prep';
  return undefined;
}

export default function Navigator({ activeId, onSelect, onGoTo, onInspectorToggle, inspectorActive = false, onManualOpen, panelStatus = {} }: Props) {
  const go = onGoTo ?? ((id: string) => onSelect(id));
  const pipelineGroups = [1, 2, 3, 4] as const;
  const role = useRole();

  // Transmitter-Pulse: kurzfristiger Input-Modus des Tetraeder-Schwingungs-
  // Mechanismus (siehe ann_066). Wird per Window-Event "scim:transmitter:pulse"
  // ausgeloest — z.B. vom P06-Simulation-Tab beim "In Klassifikator schieben".
  const [transmissionMode, setTransmissionMode] = useState<'default' | 'input'>('default');
  const pulseTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const onPulse = (e: Event) => {
      const detail = (e as CustomEvent<{ duration?: number }>).detail ?? {};
      const duration = detail.duration ?? 1500;
      setTransmissionMode('input');
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => setTransmissionMode('default'), duration);
    };
    window.addEventListener('scim:transmitter:pulse', onPulse);
    return () => {
      window.removeEventListener('scim:transmitter:pulse', onPulse);
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  // Inspector-Blitz: jedes Layer-Toggle in der ScimMap loest ein
  // "scim:inspector:flash"-Event aus. Der Wert dient als Key fuer den
  // Polygon-Remount, damit die CSS-Animation pro Event neu gestartet wird.
  // Siehe ann_066 (Geste 2).
  const [flashId, setFlashId] = useState<number>(0);
  useEffect(() => {
    const onFlash = () => setFlashId((id) => id + 1);
    window.addEventListener('scim:inspector:flash', onFlash);
    return () => window.removeEventListener('scim:inspector:flash', onFlash);
  }, []);

  // Layer-Monitor: ScimMap dispatcht 'scim:layers:state' mit dem aktuellen
  // vis-Objekt. Wir spiegeln das hier und treiben die Firmament-Glimmer-
  // Sequenz daraus an. Siehe ann_066 Geste 3.
  const [layerVis, setLayerVis] = useState<{
    boundary: boolean; pois: boolean; colourmesh: boolean; routes: boolean;
  }>({ boundary: true, pois: true, colourmesh: true, routes: false });
  useEffect(() => {
    const onLayers = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') setLayerVis(detail);
    };
    window.addEventListener('scim:layers:state', onLayers);
    return () => window.removeEventListener('scim:layers:state', onLayers);
  }, []);

  // Firmament-Glimmer (Geste 3, JS-getrieben):
  // Cursor laeuft durch die aktiven Layer-Slices nacheinander. Am Ende des
  // active-Slice-Arrays kehrt er um (Ping-Pong). Inaktive Slices werden
  // uebersprungen. Pro Slice: ~600 ms Glimmer + ~400 ms Pause, dann Cursor
  // weiter. Wenn keine Layer aktiv: nichts.
  const [glowIdx, setGlowIdx] = useState<number | null>(null);
  useEffect(() => {
    const activeIndices: number[] = [];
    if (layerVis.boundary)   activeIndices.push(0);
    if (layerVis.pois)       activeIndices.push(1);
    if (layerVis.colourmesh) activeIndices.push(2);
    if (layerVis.routes)     activeIndices.push(3);

    if (!inspectorActive || activeIndices.length === 0) {
      setGlowIdx(null);
      return;
    }

    let cursor = 0;
    let direction: 1 | -1 = 1;
    const timers: number[] = [];

    const startGlow = () => {
      setGlowIdx(activeIndices[cursor]);
      timers.push(window.setTimeout(startGap, 600));
    };
    const startGap = () => {
      setGlowIdx(null);
      timers.push(window.setTimeout(advance, 400));
    };
    const advance = () => {
      if (activeIndices.length > 1) {
        const next = cursor + direction;
        if (next >= activeIndices.length || next < 0) {
          direction = (direction === 1 ? -1 : 1);
          cursor = cursor + direction;
        } else {
          cursor = next;
        }
      }
      startGlow();
    };

    startGlow();
    return () => timers.forEach((t) => clearTimeout(t));
  }, [layerVis, inspectorActive]);

  // Reader-Dot-Hover: Default fast unsichtbar (0.03), bei Hover auf der
  // Manual+Reader-Zeile pulsiert er hell. "Nimm mich wenn du suchst."
  const [readerRowHover, setReaderRowHover] = useState(false);

  // V02-Region-Sync: V02RegionDetailPanel dispatcht 'scim:v02:region-changed'
  // bei jedem Tab-Wechsel; Navigator spiegelt das hier, damit der passende
  // Mond-Auswuchs "schreiend aktiv" wird. Klick auf einen Auswuchs dispatcht
  // umgekehrt 'scim:v02:select-region' an V02.
  const [v02Region, setV02Region] = useState<string | null>(null);
  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') setV02Region(detail);
    };
    window.addEventListener('scim:v02:region-changed', onChanged);
    return () => window.removeEventListener('scim:v02:region-changed', onChanged);
  }, []);

  // Vier kollabierbare Sektionen — siehe ann_068.
  const SECTION_DEFS: { id: string; title: string; ids: readonly string[] }[] = [
    { id: 'represent_build', title: 'Represent Build',
      ids: ['workspace', 'geometry_editor', 'catalog', 'P01', 'P02'] },
    { id: 'package_pipeline', title: 'Package Pipeline',
      ids: ['P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14'] },
    { id: 'runtime_builder', title: 'Runtime Builder',
      ids: RUNTIME_BUILDER_REGISTRY.map((m) => m.id) },
    { id: 'versionen', title: 'Versionen',
      ids: VERSIONEN_REGISTRY.map((v) => v.id) },
  ];
  const [manuallyOpen, setManuallyOpen] = useState<Set<string>>(() => loadOpenSections());
  // manuallyClosed ueberschreibt die Auto-Open via activeId — sonst laesst
  // sich eine Sektion nicht mehr aus dem Depth-T abwaehlen, wenn das aktive
  // Panel innerhalb der Sektion liegt (z.B. R01 nach Hex-Klick auf den Mond).
  const [manuallyClosed, setManuallyClosed] = useState<Set<string>>(new Set());
  const sectionContainsActive = (ids: readonly string[]) => ids.includes(activeId);
  const isSectionOpen = (sectionId: string, ids: readonly string[]) => {
    if (manuallyOpen.has(sectionId)) return true;
    if (manuallyClosed.has(sectionId)) return false;
    return sectionContainsActive(ids);
  };
  const toggleSection = (sectionId: string) => {
    const def = SECTION_DEFS.find((s) => s.id === sectionId);
    const currentlyOpen = def ? isSectionOpen(sectionId, def.ids) : manuallyOpen.has(sectionId);
    if (currentlyOpen) {
      setManuallyOpen((prev) => {
        if (!prev.has(sectionId)) return prev;
        const next = new Set(prev); next.delete(sectionId); saveOpenSections(next); return next;
      });
      setManuallyClosed((prev) => {
        if (prev.has(sectionId)) return prev;
        const next = new Set(prev); next.add(sectionId); return next;
      });
    } else {
      setManuallyClosed((prev) => {
        if (!prev.has(sectionId)) return prev;
        const next = new Set(prev); next.delete(sectionId); return next;
      });
      setManuallyOpen((prev) => {
        if (prev.has(sectionId)) return prev;
        const next = new Set(prev); next.add(sectionId); saveOpenSections(next); return next;
      });
    }
  };

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
            position: 'absolute', top: 32, left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer', zIndex: 5,
          }}
        >
          <title>Inspector — Sicht oeffnen/schliessen</title>
          {/* Polygon-Remount per Key-Wechsel triggert die Flash-Animation neu.
              Default-Stil ist Pergament-12%; die Animation zuckt kurz nach
              weiss durch. Aktiv-Stand (ScimMap offen) erhoeht fillOpacity
              auf 0.28 und gibt der Form den Aktiv-Atem (siehe ann_066). */}
          {/* Layer 1: das eigentliche Pergament-Trapez. Konstant auf Basis-
              Helligkeit, traegt den Layer-Toggle-Blitz (Geste 2). */}
          <polygon
            key={`flash-${flashId}`}
            points="0,0 178,0 154,28 24,28"
            fill="#e8d4a8"
            fillOpacity={0.12}
            stroke="none"
            className={flashId > 0 ? 'scim-inspector-flashing' : undefined}
          />
          {/* Layer 2: vier Trapez-Slices als Layer-Monitor (ann_066 Geste 3).
              Solid-Weiss-Fill mit fill-opacity-Transition. JS-getriebener
              Cursor laeuft sequentiell durch die aktiven Layer-Slices und
              ping-pongt am Ende zurueck. Nach kurzem Gradient-Ausflug
              wieder zurueck auf den stabilen pre-Gradient-Stand: der
              Spiegel hat seine Reflexe (Geste 2 Blitz + Geste 3 Sequenz),
              das reicht. */}
          {inspectorActive && [
            { points: '0,0 44.5,0 56.5,28 24,28',       label: 'Boundary' },
            { points: '44.5,0 89,0 89,28 56.5,28',      label: 'POIs' },
            { points: '89,0 133.5,0 121.5,28 89,28',    label: 'Colour-Mesh' },
            { points: '133.5,0 178,0 154,28 121.5,28',  label: 'Routen / Edges' },
          ].map((slice, idx) => (
            <polygon
              key={idx}
              points={slice.points}
              fill="#ffffff"
              fillOpacity={glowIdx === idx ? 0.50 : 0}
              stroke="none"
              style={{ transition: 'fill-opacity 400ms ease-in-out' }}
            >
              <title>Layer-Monitor: {slice.label}</title>
            </polygon>
          ))}
        </svg>
      )}
      {/* Globale Gesten-Styles (siehe ann_066). */}
      <style>{`
        @keyframes scim-inspector-flash {
          0%   { fill: #e8d4a8; fill-opacity: 0.12; }
          18%  { fill: #ffffff; fill-opacity: 0.88; }
          100% { fill: #e8d4a8; fill-opacity: 0.12; }
        }
        .scim-inspector-flashing {
          animation: scim-inspector-flash 420ms cubic-bezier(0.2, 0, 0.4, 1) 1;
        }
        @keyframes scim-active-breath {
          0%, 100% { opacity: 0.78; }
          50%       { opacity: 1.00; }
        }
        .scim-active-pulse {
          animation: scim-active-breath 3200ms ease-in-out infinite;
        }
        /* Reader-Dot-Pulse: default unsichtbar (Gruppen-Opacity 0.03),
           bei Row-Hover sanftes Pulsieren zwischen 0.55 und 0.95.
           Animation auf Gruppen-Opacity (nicht fill-opacity), damit
           die Radialverlaufs-Fuellung des LED-Koerpers + Glow erhalten
           bleibt. */
        @keyframes scim-reader-dot-pulse {
          0%, 100% { opacity: 1;   }
          50%      { opacity: 0.8; }
        }
        .scim-reader-dot-pulse {
          animation: scim-reader-dot-pulse 1500ms ease-in-out infinite;
        }
        /* Firmament-Glimmer: JS-getrieben (siehe glowIdx-State + useEffect
           im Navigator-Body). CSS-Keyframes entfaellt, weil der Cursor
           sequentiell durch die aktiven Layer wandert und am Ende ping-
           pongt — das laesst sich rein deklarativ nicht ausdruecken. Die
           weichen Uebergaenge laufen ueber die inline-style-Transition
           auf jedem Slice-Polygon. */
      `}</style>
      {/* Nacktes Logo — Iconset alleine, beschnitten auf 107.5 x 51.122.
          Wrapper zentriert die 0.88-skalierte Box links/rechts.
          Hex-Layer pulsiert; Dim-Wert um 50% tiefer als zuvor. */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        marginTop: 74, marginBottom: 28, flexShrink: 0,
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
          {/* Hex visuell auf Faktor 0.85 — mehr Platz fuer die umgebende
              Mondscheiben-Klickflaeche (siehe ann_051). transform-origin
              steht auf dem Hex-Mittelpunkt im Logo-viewBox (49.3% x 59.4%). */}
          <img
            src={logoHexNaked}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              animation: 'nav-hex-pulse 3200ms 2000ms ease-in-out infinite',
              transform: 'scale(0.85)',
              transformOrigin: '49.3% 59.4%',
            }}
          />
          {/* Mond-Klick-Karte (siehe ann_051):
              - Donut-Path (Mondscheibe minus Hex-Hole) → V01 Pakete
              - Hex-Polygon (auf 0.85 verkleinert)       → R01 Runtime Shell
              Geometrien aus den Logo-SVGs direkt uebernommen. SVG nutzt
              identischen viewBox wie das Logo (107.5 x 51.122), damit
              Koordinaten 1:1 mit dem Bild uebereinanderliegen.
              pointer-events: 'fill' auf den Pfaden — der SVG-Container
              selbst bleibt durchlaessig (pointer-events: none). */}
          <svg
            viewBox="0 0 107.5 51.122"
            preserveAspectRatio="none"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {/* Mondscheibe (originaler Pfad aus logo-base-naked.svg) MINUS
                Hex-Hole (kleines Polygon). fill-rule="evenodd" laesst den
                Hex-Bereich aus der Klick-Flaeche heraus. */}
            {/* Aktiv-Stand schreiend wie die Tetraeder-Faces:
                fill #2b6cb0 (solider Block), stroke #63b3ed (heller Outline),
                strokeWidth 1.5, Pulse. */}
            <path
              d={
                'M45.355,45.642c-8.505-4.234-11.982-14.6-7.75-23.107,' +
                '4.234-8.506,14.599-11.98,23.107-7.749,' +
                '8.506,4.234,11.983,14.599,7.75,23.106-' +
                '4.234,8.507-14.597,11.983-23.107,7.75 Z ' +
                'M52.95,20.79 L61.23,25.57 L61.23,35.13 ' +
                'L52.95,39.91 L44.67,35.13 L44.67,25.57 Z'
              }
              fill={activeId === 'V01' ? '#2b6cb0' : 'transparent'}
              fillRule="evenodd"
              stroke={activeId === 'V01' ? '#63b3ed' : undefined}
              strokeWidth={activeId === 'V01' ? 1.0 : undefined}
              className={activeId === 'V01' ? 'scim-active-pulse' : undefined}
              onClick={() => go('V01')}
              style={{ pointerEvents: 'fill', cursor: 'pointer' }}
            >
              <title>Mond — R-Bibliothek (V01 Pakete)</title>
            </path>
            {/* Hex-Polygon (pointy-top), r=9.5625 = 11.25 * 0.85,
                Mittelpunkt (52.95, 30.35) — dort wo der visuelle Hex sitzt. */}
            <polygon
              points="52.95,20.79 61.23,25.57 61.23,35.13 52.95,39.91 44.67,35.13 44.67,25.57"
              fill={activeId === 'R01' ? '#2b6cb0' : 'transparent'}
              stroke={activeId === 'R01' ? '#63b3ed' : undefined}
              strokeWidth={activeId === 'R01' ? 1.0 : undefined}
              className={activeId === 'R01' ? 'scim-active-pulse' : undefined}
              onClick={() => go('R01')}
              style={{ pointerEvents: 'fill', cursor: 'pointer' }}
            >
              <title>Hex — App-Shell + Engine (R01 Runtime Shell)</title>
            </polygon>
            {/* Mond-Auswuechse — vier echte Blob-Pfade direkt aus
                logo-base-naked.svg uebernommen. Hitbox folgt exakt der
                sichtbaren Form, kein Approximations-Versatz mehr.
                Aktiv-Stand: schreiend wie Tetraeder-Faces, AUSSER bei
                Kanton Zuerich (regionMatch null) — dort waere kein
                V02-Tab vorhanden. Region-Sync mit V02 ueber Window-Event
                'scim:v02:select-region'. Siehe ann_051. */}
            {MOND_AUSWUCHS_CONFIG.map(({ pathD, regionMatch, label }) => {
              const isAct = activeId === 'V02' && regionMatch !== null && v02Region === regionMatch;
              return (
                <path
                  key={`auswuchs-${label}`}
                  d={pathD}
                  fill={isAct ? '#2b6cb0' : 'transparent'}
                  stroke={isAct ? '#63b3ed' : undefined}
                  strokeWidth={isAct ? 1.0 : undefined}
                  className={isAct ? 'scim-active-pulse' : undefined}
                  onClick={() => {
                    if (regionMatch) {
                      window.dispatchEvent(new CustomEvent('scim:v02:select-region', { detail: regionMatch }));
                    }
                    go('V02');
                  }}
                  style={{ pointerEvents: 'fill', cursor: 'pointer' }}
                  data-region={regionMatch ?? 'unbound'}
                >
                  <title>{label}</title>
                </path>
              );
            })}
          </svg>
        </div>
        <style>{`
          @keyframes nav-hex-pulse {
            0%, 100% { opacity: 0.625; }
            50%       { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Transmissionsfeld — animiertes Mesh-Dreieck zwischen Mond und Tetraeder.
          Nimmt keinen Flow-Platz (height: 0), fuellt die Luecke ueber dem
          Tetraeder als absolute SVG-Overlay. Siehe ann_059. */}
      <NavTransmissionField onClick={() => go('P06')} active={activeId === 'P06'} />

      {/* Spacer zwischen Mesh und Upper-Tetraeder. 24 -> 46 (+22 px). */}
      <div style={{ height: 46, flexShrink: 0 }} />

      {/* ── Represent Build — zentrales Tetraeder-Control ──────────────────── */}
      {/* position:relative + zIndex stapeln den oberen Tetraeder UEBER den
          (spaeter im DOM, hochgezogenen) Substrat-Tetraeder, damit Klicks auf
          den loa-Bogen/das loa-Kuerzel nicht auf dessen Flaechen durchfallen. */}
      <div style={{
        padding: '14px 12px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, flexShrink: 0,
        position: 'relative', zIndex: 2,
      }}>
        <RepresentBuildTetrahedron
          activeFace={faceFromActive(activeId)}
          activeArc={arcFromActive(activeId)}
          activeSickle={sickleFromActive(activeId)}
          variant="dark"
          size={171}
          showLabels
          transmissionMode={transmissionMode}
          onFaceClick={(f) => {
            if (f === 'geometry_draw') go('geometry_editor');
            else if (f === 'catalog_magazination') go('catalog');
            else if (f === 'represent_organisation') go('workspace');
            else if (f === 'sensus_core_build') go('P11');
          }}
          onArcClick={(a) => {
            if (a === 'system_adjust') go('P01');
            else if (a === 'regio_content') go('P02', 'input');
            else if (a === 'load_thresholds') go('P04');
          }}
          onSickleClick={(s) => {
            if (s === 'boundary') go('P07');
            else if (s === 'wegnetz_sampling') go('P08');
            else if (s === 'engine_prep') go('P09');
          }}
        />
      </div>

      {/* Tiefen-Tetraeder — Substrat-Tetraeder der Bipyramide (ann_060).
          Punkt-nach-unten stehend, rotierend. Drei Side-Faces toggeln je
          eine Navigator-Sektion (Package Pipeline / Runtime Builder /
          Versionen) — reine Fokus-Funktion, kein Panel-Navigation.
          Siehe ann_051. */}
      <div style={{
        padding: '22px 12px 22px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', flexShrink: 0,
        marginTop: -68,   // zieht Depth-T und alles Folgende 68 px nach oben
        // pointerEvents:none -> Wrapper-Padding deckt sonst den loa-Arc
        // des Upper-Tetraeders zu (negative margin schiebt ihn drueber).
        // Die NavDepthTetraeder-Komponente setzt ihre eigenen Pointer-Events.
        pointerEvents: 'none',
      }}>
        <NavDepthTetraeder
          size={208}
          openSections={(() => {
            const s = new Set<string>(manuallyOpen);
            for (const sec of SECTION_DEFS) {
              if (sectionContainsActive(sec.ids)) s.add(sec.id);
            }
            return s;
          })()}
          onToggleSection={(secId) => toggleSection(secId)}
        />
      </div>

      {/* Manual + Reader sitzen am Fuss der Kosmologie — unter der gesamten
          Bipyramide. Reader-Dot (●, rechts) ist Default fast unsichtbar
          (opacity 0.03) und erscheint mit Pulse, wenn die Maus die Zeile
          beruehrt — wie eine LED, die "nimm mich" sagt nur wenn gesucht.
          marginTop: -68 zieht Manual+Reader und alles dahinter um weitere
          68 px nach oben. */}
      <div
        onMouseEnter={() => setReaderRowHover(true)}
        onMouseLeave={() => setReaderRowHover(false)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 14px', marginBottom: 6, flexShrink: 0,
          marginTop: -68,
        }}>
        {/* Manual-Icon entfernt — Reader-Dot allein traegt die Geste. */}
        <span aria-hidden style={{ width: 14, flexShrink: 0 }} />
        {/* Cosmo-Controls — eigene typografische Insel (Italic-Serif),
            zentriert in der Manual+Reader-Zeile (justify-content:
            space-between sorgt fuer die Aufteilung). Default 6% white,
            bei Hover auf der Zeile dimmt es gemuetlich auf 90%. */}
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: readerRowHover
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(255, 255, 255, 0.06)',
            transition: 'color 2100ms ease-out',
            userSelect: 'none',
            cursor: 'default',
            position: 'relative',
            top: 6,
          }}
        >Cosmo-Controls</span>
        {/* Reader-Dot als blaue LED:
            - LED-Koerper mit Radialverlauf (heller Kern -> mittleres Blau ->
              dunkler Blau-Rand) wie ein echtes Diodengehaeuse.
            - Aeusserer Glow als zweiter Radialverlauf, blaue Aura.
            - Default-Gruppen-Opacity 0.03 (fast unsichtbar — auf Standby).
            - Hover auf der Zeile: Pulse zwischen 0.55 und 0.95.
            - Klick oeffnet das Usage Manual. */}
        <svg
          width={18} height={18} viewBox="0 0 18 18"
          onClick={onManualOpen}
          style={{
            cursor: onManualOpen ? 'pointer' : 'default',
            userSelect: 'none', flexShrink: 0,
            // Auf einer Linie mit dem Cosmo-Controls-Text zentriert.
            // Text hat top: 6 + fontSize 10 -> Mitte bei ~11; SVG ist 18 hoch,
            // Mitte bei 9; also top: 2 hebt nichts, top: 6 setzt SVG-Mitte
            // auf gleiche Hoehe wie Text-Mitte.
            position: 'relative', top: 6,
          }}
        >
          <title>Reader — oeffnet das Usage Manual</title>
          <defs>
            <radialGradient id="reader-diode-body" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%"   stopColor="#dbeafe" stopOpacity="1" />
              <stop offset="55%"  stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1" />
            </radialGradient>
            <radialGradient id="reader-diode-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g
            opacity={readerRowHover ? undefined : 0.03}
            className={readerRowHover ? 'scim-reader-dot-pulse' : undefined}
            style={{ transition: 'opacity 1200ms ease-out' }}
          >
            <circle cx={9} cy={9} r={7}   fill="url(#reader-diode-glow)" />
            <circle cx={9} cy={9} r={2.5} fill="url(#reader-diode-body)" />
          </g>
        </svg>
      </div>

      {/* ── Vier kollabierbare Sektionen (siehe ann_068) ──────────────────── */}

      {/* 1. Represent Build — Workspace, Geometry-Editor, Katalog, P01, P02.
            Default zu, weil Tetraeder die Inhalte schon zeigt. */}
      {(() => {
        const sec = SECTION_DEFS[0];
        const visibleCount = sec.ids.filter((id) => id !== 'catalog' || role === 'operator').length;
        const isOpen = isSectionOpen(sec.id, sec.ids);
        return (
          <>
            <SectionDivider />
            <SectionHeader
              title={sec.title}
              count={visibleCount}
              isOpen={isOpen}
              locked={sectionContainsActive(sec.ids)}
              onToggle={() => toggleSection(sec.id)}
            />
            <SectionBody isOpen={isOpen}>
              <NavItem
                id={WORKSPACE_DESCRIPTOR.id}
                icon={WORKSPACE_DESCRIPTOR.icon}
                label={WORKSPACE_DESCRIPTOR.label}
                status="blue"
                isActive={activeId === WORKSPACE_DESCRIPTOR.id}
                onClick={() => onSelect(WORKSPACE_DESCRIPTOR.id)}
              />
              <NavItem
                id={DRAWER_DESCRIPTOR.id}
                icon={DRAWER_DESCRIPTOR.icon}
                label={DRAWER_DESCRIPTOR.label}
                status="blue"
                isActive={activeId === DRAWER_DESCRIPTOR.id}
                onClick={() => onSelect(DRAWER_DESCRIPTOR.id)}
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
            </SectionBody>
          </>
        );
      })()}

      {/* 2. Package Pipeline (P03..P14, P01+P02 leben in Represent Build) */}
      {(() => {
        const sec = SECTION_DEFS[1];
        const isOpen = isSectionOpen(sec.id, sec.ids);
        return (
          <>
            <SectionDivider />
            <SectionHeader
              title={sec.title}
              count={sec.ids.length}
              isOpen={isOpen}
              locked={sectionContainsActive(sec.ids)}
              onToggle={() => toggleSection(sec.id)}
            />
            <SectionBody isOpen={isOpen}>
              {pipelineGroups.map((g, gi) => {
                const panels = PANEL_REGISTRY.filter((p: PanelDescriptor) => p.group === g && p.id !== 'P01' && p.id !== 'P02');
                if (panels.length === 0) return null;
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
            </SectionBody>
          </>
        );
      })()}

      {/* 3. Runtime Builder */}
      {(() => {
        const sec = SECTION_DEFS[2];
        const isOpen = isSectionOpen(sec.id, sec.ids);
        return (
          <>
            <SectionDivider />
            <SectionHeader
              title={sec.title}
              count={sec.ids.length}
              isOpen={isOpen}
              locked={sectionContainsActive(sec.ids)}
              onToggle={() => toggleSection(sec.id)}
            />
            <SectionBody isOpen={isOpen}>
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
            </SectionBody>
          </>
        );
      })()}

      {/* 4. Versionen */}
      {(() => {
        const sec = SECTION_DEFS[3];
        const isOpen = isSectionOpen(sec.id, sec.ids);
        return (
          <>
            <SectionDivider />
            <SectionHeader
              title={sec.title}
              count={sec.ids.length}
              isOpen={isOpen}
              locked={sectionContainsActive(sec.ids)}
              onToggle={() => toggleSection(sec.id)}
            />
            <SectionBody isOpen={isOpen}>
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
            </SectionBody>
          </>
        );
      })()}

      {/* ── Meta — System + KI-Schnittstelle, immer sichtbar (ann_068) ─────── */}
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
