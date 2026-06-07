import { useEffect, useRef, useState } from 'react';
import type { StatusColor } from './panelRegistry';
import {
  KOSMOLOGIE_IDS,
  PANEL_REGISTRY, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR, IPILLS_DESCRIPTOR, CLOUD_DESCRIPTOR,
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
import NavMetaSpace from './NavMetaSpace';
import NavDepthTetraeder from './NavDepthTetraeder';
import NavTrashTruck from './NavTrashTruck';
import NavVisibility from './NavVisibility';
import NavCloud from './NavCloud';

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

// ─── Cosmo Controls Row (textlicher Spiegel der Kosmologie) ──────────────────
// Reihenfolge von oben (entsprechend den Controls): Mond → Transmitter →
// Komposit-Tetraeder → Substrat. Dünne Zwischen-Labels als Trenner.
const COSMO_GROUPS: { label: string; ids: string[]; sub?: string }[] = [
  // Hexagon=V03 (Publishing-Monitor) · Scheibe=V01 (All-Publications) · Extensions=V02 (Regions).
  { label: 'Mond', ids: ['V03', 'V01', 'V02'], sub: 'url: diesenpark.com' },
  { label: 'Transmitter', ids: ['P06', 'P01', 'P04', 'P02'] },
  { label: 'Komposit-Tetraeder', ids: ['P11', 'P07', 'P08', 'P09', 'workspace', 'geometry_editor', 'catalog'] },
  { label: 'Substrat', ids: ['ai_interface', 'ipills', 'system'] },
  // Grund (Brocken/Meta-Space): P05 (Operator-Zonen, herausgelöst). R01 ist in V03 aufgegangen.
  { label: 'Grund', ids: ['P05'] },
];
// Der Rest — was bislang keinen Platz fand (flach, mit Icons).
// R02 „Link & QR" ist in die Cloud-Schicht befördert (nicht mehr im Müllwagen).
const REST_IDS = ['P03', 'P10', 'P12', 'P13', 'P14', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08'];

function descById(id: string): { id: string; icon: string; label: string } | null {
  const p = PANEL_REGISTRY.find((x) => x.id === id);
  if (p) return { id, icon: p.icon, label: p.label };
  for (const d of [WORKSPACE_DESCRIPTOR, DRAWER_DESCRIPTOR, CATALOG_DESCRIPTOR, SYSTEM_DESCRIPTOR, AI_INTERFACE_DESCRIPTOR, IPILLS_DESCRIPTOR, CLOUD_DESCRIPTOR]) {
    if (d.id === id) return { id, icon: d.icon, label: d.label };
  }
  const r = RUNTIME_BUILDER_REGISTRY.find((x) => x.id === id);
  if (r) return { id, icon: r.icon, label: r.label };
  const v = VERSIONEN_REGISTRY.find((x) => x.id === id);
  if (v) return { id, icon: v.icon, label: v.label };
  return null;
}

function CosmoSubLabel({ text, sub }: { text: string; sub?: string }) {
  return (
    <div style={{ padding: '6px 12px 2px 12px', userSelect: 'none' }}>
      <div style={{
        fontSize: 8.5, color: '#3d556f', textTransform: 'uppercase', letterSpacing: '0.10em',
        fontFamily: 'monospace',
      }}>{text}</div>
      {sub && <div style={{ fontSize: 8, color: '#2f4459', fontFamily: 'monospace', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function CosmoItem({ id, label, isActive, onClick }: { id: string; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      data-id={id}
      style={{
        padding: '2.5px 12px 2.5px 22px', cursor: 'pointer', borderRadius: 3,
        background: isActive ? '#1e3a5f' : 'transparent',
        color: isActive ? '#e0eeff' : '#8b97a8',
        fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none', transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#1a2535'; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >{label}</div>
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
  // T2: Bögen = Transmitter-Anatomie. system_adjust(oben-links)=Thresholds→P01 ·
  // regio_content(oben-rechts)=Telco→P04 · load_thresholds(unten)=Coder→P02.
  if (activeId === 'P01') return 'system_adjust';
  if (activeId === 'P04') return 'regio_content';
  if (activeId === 'P02') return 'load_thresholds';
  return undefined;
}

// Sichel-Highlight: bou = P07, wns = P08, epb = P09.
function sickleFromActive(activeId: string): RepresentBuildSickle | undefined {
  // M6: Sichel-Rotation. P08 Deep-Shell → engine_prep-Sichel (Zahnrad, rechts);
  // P09 Origin-Capsuler → wegnetz_sampling-Sichel (Sampling, unten). P07 bleibt links.
  if (activeId === 'P07') return 'boundary';
  if (activeId === 'P08') return 'engine_prep';
  if (activeId === 'P09') return 'wegnetz_sampling';
  return undefined;
}

export default function Navigator({ activeId, onSelect, onGoTo, onInspectorToggle, inspectorActive = false, onManualOpen, panelStatus = {} }: Props) {
  const go = onGoTo ?? ((id: string) => onSelect(id));
  const role = useRole();
  const locked = role !== 'operator';   // non-operator: alles unter dem Komposit gesperrt

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

  // Cosmo-Controls-Drop-Down: Manual-Zustand (persistiert), beim ersten Laden offen.
  const [manuallyOpen, setManuallyOpen] = useState<Set<string>>(() => {
    const s = loadOpenSections();
    if (localStorage.getItem(SECTION_STORAGE_KEY) === null) s.add('cosmo');
    return s;
  });
  const cosmoOpen = manuallyOpen.has('cosmo');
  // Müllwagen-Sektion: ungenutzte Panels (REST). Default zu; auto-offen, wenn der
  // aktive Panel drinliegt (sonst wäre der Aktiv-Marker versteckt).
  const trashOpen = manuallyOpen.has('trash') || REST_IDS.includes(activeId);
  const toggleSection = (sectionId: string) => {
    setManuallyOpen((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      saveOpenSections(next);
      return next;
    });
  };
  // Anzahl sichtbarer Cosmo-Items (Rolle: catalog/ai_interface nur Operator).
  // non-operator: die Gruppen „Substrat" + „Grund" (alles unter dem Komposit) ausblenden.
  const visibleCosmoGroups = COSMO_GROUPS.filter((g) => !locked || (g.label !== 'Substrat' && g.label !== 'Grund'));
  const cosmoCount = visibleCosmoGroups.reduce((n, g) => n + g.ids.filter((id) =>
    descById(id) && !(id === 'ai_interface' && role !== 'operator')).length, 0);

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
          <title>Inspector System-Build-Mirror</title>
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
              <title>Inspector System-Build-Mirror</title>
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
              <title>Mond — All-Publications (V01)</title>
            </path>
            {/* Hex-Polygon — der Beobachter der ausgelieferten Maschine. */}
            <polygon
              points="52.95,20.79 61.23,25.57 61.23,35.13 52.95,39.91 44.67,35.13 44.67,25.57"
              fill={activeId === 'V03' ? '#2b6cb0' : 'transparent'}
              stroke={activeId === 'V03' ? '#63b3ed' : undefined}
              strokeWidth={activeId === 'V03' ? 1.0 : undefined}
              className={activeId === 'V03' ? 'scim-active-pulse' : undefined}
              onClick={() => go('V03')}
              style={{ pointerEvents: 'fill', cursor: 'pointer' }}
            >
              <title>Hex — Publishing-Monitor (V03)</title>
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

      {/* Cloud — our-side Auslieferungs-/Eintritts-Schicht (Launcher · globe-switcher ·
          collector). Sitzt im Spalt zwischen Mond und Transmissionsfeld; System-Icon aus
          src/assets/system. Klick öffnet das Cloud-Panel (Übersicht/Launcher/Globe/Collector). */}
      <NavCloud onClick={() => go('cloud')} active={activeId === 'cloud'} />

      {/* Transmissionsfeld — animiertes Mesh-Dreieck zwischen Mond und Tetraeder.
          Nimmt keinen Flow-Platz (height: 0), fuellt die Luecke ueber dem
          Tetraeder als absolute SVG-Overlay. Siehe ann_059. */}
      <NavTransmissionField onClick={() => go('P06')} active={activeId === 'P06'} />

      {/* Spacer zwischen Mesh und Upper-Tetraeder. 24 -> 46 (+22 px). */}
      <div style={{ height: 46, flexShrink: 0 }} />

      {/* ── Represent Build — zentrales Tetraeder-Control ──────────────────── */}
      {/* zIndex:2 hebt den oberen Tetraeder ueber den Hintergrund. Das Substrat
          liegt mit zIndex:3 DARUEBER (Bipyramiden-Verdeckung der unteren Haelfte);
          der loa-Klick faellt durch eine treffer-freie Zone im Substrat-SVG. */}
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
            // T2: Thresholds→P01 · Telco→P04 · Coder→P02.
            if (a === 'system_adjust') go('P01');
            else if (a === 'regio_content') go('P04');
            else if (a === 'load_thresholds') go('P02');
          }}
          onSickleClick={(s) => {
            // M6: engine_prep-Sichel → P08 (Deep-Shell); wegnetz_sampling → P09 (Origin-Capsuler).
            if (s === 'boundary') go('P07');
            else if (s === 'engine_prep') go('P08');
            else if (s === 'wegnetz_sampling') go('P09');
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
        // zIndex:3 -> Substrat-Drahtgitter malt UEBER den oberen Tetraeder
        // (Verdeckung der unteren Haelfte / Bipyramide). pointerEvents:none am
        // Wrapper; das SVG ist selbst treffer-frei und nur ein Faenger im unteren
        // Bereich nimmt Hover/Lock, sodass der loa-Arc oben klickbar bleibt.
        position: 'relative', zIndex: 3,
        pointerEvents: 'none',
        // nur den Substrat-Tetraeder nach unten (Transform → Layout/Folgendes
        // unberührt). 6px + 24px = 30px (gesamter Tetraeder samt Hitbox).
        transform: 'translateY(30px)',
      }}>
        <NavDepthTetraeder
          size={208}
          // Vom Row-Open/Close entbunden: die drei Faces steuern die Operator-
          // Heimat-Panels an. Oben AI-Interface · links i-Pills · rechts System.
          // non-operator: Faces tot (stille Deko).
          activeId={activeId}
          onFaceClick={(panelId) => go(panelId)}
          locked={locked}
        />
      </div>

      {/* Meta-Space — grobe Felsbrocken (Mondlandschaft) unter dem Substrat-Tetraeder.
          Echtes Flow-Element: nimmt Platz und schiebt Cosmo-Controls + alles darunter
          nach unten. zIndex:5 (über dem Substrat-Catcher), damit klickbare Brocken
          erreichbar sind; Wrapper pointerEvents:none, nur klickbare Brocken fangen. */}
      <div style={{
        padding: '0 18px', flexShrink: 0, marginTop: -20,
        position: 'relative', zIndex: 5, pointerEvents: 'none',
      }}>
        <NavMetaSpace onPick={go} activeId={activeId} locked={locked} />
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
          // war -68 (zog die Zeile ins Substrat hoch); 0 → rückt sie + alles
          // darunter unter die Meta-Space-Brocken.
          marginTop: 0,
          // Diese Zeile (Cosmo-Controls + Reader-Diode) liegt durch marginTop:-68
          // im Bereich des Substrats (zIndex:3). Ohne eigenes zIndex deckt der
          // Substrat-Treffer-Faenger sie zu → Row-Hover/Diode tot. zIndex:4 hebt
          // sie wieder ueber das Substrat.
          position: 'relative', zIndex: 4,
        }}>
        {/* Links: Cosmo-Controls = Drop-Down-Kopf (Chevron + Titel + Count) —
            ersetzt den separaten SectionHeader. Klick klappt das Drop-Down. */}
        <div
          onClick={() => toggleSection('cosmo')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            userSelect: 'none', position: 'relative', top: 6,
          }}
        >
          <span style={{ fontSize: 9, color: '#4a6a8a', opacity: 0.85 }}>{cosmoOpen ? '▾' : '▸'}</span>
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic',
            fontSize: 11, letterSpacing: '0.02em', color: 'rgba(255, 255, 255, 0.55)',
          }}>Cosmo Controls</span>
          <span style={{ fontSize: 9, color: '#4a6a8a', opacity: 0.5, fontFamily: 'monospace' }}>({cosmoCount})</span>
        </div>
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
            opacity={readerRowHover ? undefined : 0.7}
            className={readerRowHover ? 'scim-reader-dot-pulse' : undefined}
            style={{ transition: 'opacity 1200ms ease-out' }}
          >
            <circle cx={9} cy={9} r={7}   fill="url(#reader-diode-glow)" />
            <circle cx={9} cy={9} r={2.5} fill="url(#reader-diode-body)" />
          </g>
        </svg>
      </div>

      {/* ── Cosmo Controls — Drop-Down-Inhalt (Kopf ist die Zeile oben) ──────── */}
      <SectionBody isOpen={cosmoOpen}>
        {visibleCosmoGroups.map((g) => {
          const items = g.ids
            .map(descById)
            .filter((d): d is { id: string; icon: string; label: string } => d !== null)
            .filter((d) => !(d.id === 'ai_interface' && role !== 'operator'));
          if (items.length === 0) return null;
          return (
            <div key={g.label}>
              <CosmoSubLabel text={g.label} sub={g.sub} />
              {items.map((d) => (
                <CosmoItem
                  key={d.id}
                  id={d.id}
                  label={d.label}
                  isActive={activeId === d.id}
                  onClick={() => onSelect(d.id)}
                />
              ))}
            </div>
          );
        })}
      </SectionBody>

      {/* ── Müllwagen — ungenutzte Panels (der „Rest"), eingeklappt unter dem Strich ── */}
      <SectionDivider />
      <NavTrashTruck
        isOpen={!locked && trashOpen}
        count={REST_IDS.map(descById).filter((d) => d !== null).length}
        onClick={() => toggleSection('trash')}
        locked={locked}
      />
      <SectionBody isOpen={!locked && trashOpen}>
        {!locked && REST_IDS
          .map(descById)
          .filter((d): d is { id: string; icon: string; label: string } => d !== null)
          .map((d) => (
            <NavItem
              key={d.id}
              id={d.id}
              icon={d.icon}
              label={d.label}
              status={panelStatus[d.id] ?? 'grey'}
              isActive={activeId === d.id}
              onClick={() => onSelect(d.id)}
            />
          ))}
      </SectionBody>

      {/* Visibility — operator-only Sperr-Registry, einziges ganz-verschwindendes Element. */}
      {!locked && (
        <NavVisibility
          isOpen={manuallyOpen.has('visibility')}
          onClick={() => toggleSection('visibility')}
        />
      )}
    </nav>
  );
}
