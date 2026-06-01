// RepresentBuildTetrahedron — SVG-Control der Represent-Build-Architektur.
//
// Vier Dreiecke (Tetraeder-Netz) IM Kreis, dazwischen drei Bogensegmente.
// Insgesamt 6 oder 7 klickbare Teile:
//   - 4 Triangles: Geometry Draw, Catalog Magazination, Represent Organisation,
//     Represent Inspection
//   - 3 Arc-Segmente: System-Adjust, Regio-Content, Manual
//
// Inspector-Triangle ist Sonderfall: per Default ein Toggle-Callback, keine
// Panel-Navigation.
//
// Variants:
//   variant='dark' (Navigator, schwarzer Hintergrund): farbige Strokes
//   variant='light' (Panel-Header, weisser Hintergrund): invertiert
//
// Siehe docs/represent_build.md fuer das Konzept.

export type RepresentBuildFace =
  | 'geometry_draw'
  | 'catalog_magazination'
  | 'sensus_core_build'
  | 'represent_organisation';

export type RepresentBuildArc =
  | 'system_adjust'
  | 'regio_content'
  | 'load_thresholds';

// Sicheln: drei Kreissegmente zwischen den Aussenkanten des Dreiecksnetzes und
// dem umschriebenen Kreis. Eigene, NICHT-rotierende Gruppe (die Boegen drehen,
// die Sicheln nicht). bou=links (P07), wns=unten (P08), epb=rechts (P09).
export type RepresentBuildSickle =
  | 'boundary'
  | 'wegnetz_sampling'
  | 'engine_prep';

interface Props {
  activeFace?: RepresentBuildFace;     // hervorgehobene Triangle (optional)
  activeArc?: RepresentBuildArc;       // hervorgehobenes Bogen-Segment (optional)
  activeSickle?: RepresentBuildSickle; // hervorgehobene Sichel (optional)
  onFaceClick?: (face: RepresentBuildFace) => void;
  onArcClick?: (arc: RepresentBuildArc) => void;
  onSickleClick?: (sickle: RepresentBuildSickle) => void;
  size?: number;
  variant?: 'dark' | 'light';
  showLabels?: boolean;
  // Transmissions-Modus (siehe ann_066):
  //  - 'default' (=Output): Bogensegmente in Ruhestellung, Spalt am Apex offen,
  //    Strahl kann zum Mond austreten.
  //  - 'input': Schirme rotieren 60° im Uhrzeigersinn — der Apex-Spalt wandert
  //    weg vom Mond, die konkaven Schirme stehen empfangend.
  transmissionMode?: 'default' | 'input';
}

// ─── Geometrie ──────────────────────────────────────────────────────────────

const S = 40;                          // Seitenlaenge eines Dreiecks
const H = (S * Math.sqrt(3)) / 2;      // Hoehe eines gleichseitigen Dreiecks
const R = (4 * H) / 3;                 // Radius des umschriebenen Kreises (~46.2)
const ARC_THICKNESS = 9;               // Dicke der Bogensegmente
const ARC_GAP_DEG = 6;                 // Luecke zwischen Segmenten in Grad
// Bogen-Gruppe als Ganzes vom Zentrum heraus vergroessert, damit die Boegen
// klar AUSSERHALB der Sicheln liegen (Sichel-Aussenrand = R; Bogen-Innenrand
// skaliert = (R-ARC_THICKNESS/2)*ARC_SCALE > R). Sicheln drehen/skalieren NICHT
// mit — sie sind eine eigene Gruppe.
const ARC_SCALE = 1.16;

// Zentriere das Tetraeder-Netz auf (0,0): die drei Aussen-Vertices liegen
// auf dem Kreis vom Radius R um den Ursprung.
//
// Top-Vertex     bei (0, -R)              Winkel 270°
// Bottom-Right   bei (S, 2H/3)            Winkel  30°
// Bottom-Left    bei (-S, 2H/3)           Winkel 150°
//
// Center-Triangle (Inverted, in der Mitte): Vertices
//   top-left  (-S/2, -H/3)
//   top-right ( S/2, -H/3)
//   bottom    (0,    2H/3)

const FACES: Array<{
  id: RepresentBuildFace;
  shortLabel: string;
  longLabel: string;
  points: string;        // SVG points
  labelX: number;
  labelY: number;
}> = [
  // labelX/Y = geometrischer Schwerpunkt = (p1+p2+p3)/3
  // Top-Position: scb (Sensus Core Build) — feuert ueber den Apex zum Mond.
  {
    id: 'sensus_core_build',
    shortLabel: 'scs',
    longLabel: 'Sensus Core Service',
    points: `${-S / 2},${-H / 3} ${S / 2},${-H / 3} 0,${-R}`,
    labelX: 0,
    labelY: (-H / 3 + -H / 3 + -R) / 3,
  },
  {
    id: 'represent_organisation',
    shortLabel: 'org',
    longLabel: 'Represent Organisation',
    points: `${-S / 2},${-H / 3} ${S / 2},${-H / 3} 0,${2 * H / 3}`,
    labelX: 0,
    labelY: (-H / 3 + -H / 3 + 2 * H / 3) / 3,
  },
  {
    id: 'catalog_magazination',
    shortLabel: 'cat',
    longLabel: 'POI Magazin',
    points: `${-S / 2},${-H / 3} 0,${2 * H / 3} ${-S},${2 * H / 3}`,
    labelX: (-S / 2 + 0 + -S) / 3,
    labelY: (-H / 3 + 2 * H / 3 + 2 * H / 3) / 3,
  },
  {
    id: 'geometry_draw',
    shortLabel: 'geo',
    longLabel: 'Geometry Draw',
    points: `${S / 2},${-H / 3} 0,${2 * H / 3} ${S},${2 * H / 3}`,
    labelX: (S / 2 + 0 + S) / 3,
    labelY: (-H / 3 + 2 * H / 3 + 2 * H / 3) / 3,
  },
];

const FACE_BY_ID: Record<RepresentBuildFace, typeof FACES[number]> =
  Object.fromEntries(FACES.map((f) => [f.id, f])) as Record<RepresentBuildFace, typeof FACES[number]>;

// Arcs: drei 120°-Segmente zwischen den Aussen-Vertices.
// Bezeichnung pro Arc — wie sie clockwise zwischen den Vertices liegen.
const ARCS: Array<{
  id: RepresentBuildArc;
  shortLabel: string;     // 3-Letter-Abkuerzung
  longLabel: string;
  startDeg: number;       // SVG-Winkel (0° = rechts, im Uhrzeigersinn)
  endDeg: number;
  labelAngleDeg: number;
}> = [
  // Top (-90°) → Bottom-Right (30°): zwischen Geometry und Inspection
  {
    id: 'regio_content',
    shortLabel: 'reg',
    longLabel: 'Region Thresholds',
    startDeg: -90,
    endDeg: 30,
    labelAngleDeg: -30,
  },
  // Bottom-Right (30°) → Bottom-Left (150°): dritte Schwellen-Sphere
  {
    id: 'load_thresholds',
    shortLabel: 'loa',
    longLabel: 'Load Thresholds',
    startDeg: 30,
    endDeg: 150,
    labelAngleDeg: 90,
  },
  // Bottom-Left (150°) → Top (270°): zwischen Catalog und Geometry
  {
    id: 'system_adjust',
    shortLabel: 'sys',
    longLabel: 'System Thresholds',
    startDeg: 150,
    endDeg: 270,
    labelAngleDeg: 210,
  },
];

function polarToCartesian(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

function describeArcSegment(startDeg: number, endDeg: number, gapDeg: number): string {
  // Annulus-Sektor zwischen R-ARC_THICKNESS/2 (innen) und R+ARC_THICKNESS/2 (aussen)
  const rOuter = R + ARC_THICKNESS / 2;
  const rInner = R - ARC_THICKNESS / 2;
  const start = startDeg + gapDeg / 2;
  const end = endDeg - gapDeg / 2;
  const [x1, y1] = polarToCartesian(start, rOuter);
  const [x2, y2] = polarToCartesian(end, rOuter);
  const [x3, y3] = polarToCartesian(end, rInner);
  const [x4, y4] = polarToCartesian(start, rInner);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
    `Z`,
  ].join(' ');
}

// Sicheln: Kreissegment zwischen je zwei Aussen-Vertices (Bogen) und dem
// inneren Netz-Vertex dazwischen. Beschriftung im Schwerpunkt des Segments.
const SICKLES: Array<{
  id: RepresentBuildSickle;
  shortLabel: string;
  longLabel: string;
  path: string;
  labelX: number;
  labelY: number;
}> = (() => {
  const lr = R * 0.72;  // Label-Radius (innerhalb der Sichel)
  const [lxL, lyL] = polarToCartesian(210, lr);
  const [lxB, lyB] = polarToCartesian(90, lr);
  const [lxR, lyR] = polarToCartesian(-30, lr);
  return [
    {
      id: 'boundary', shortLabel: 'bou', longLabel: 'Boundary',
      // Bottom-Left (150°) → Top (270°), innerer Vertex top-left
      path: `M ${-S} ${2 * H / 3} A ${R} ${R} 0 0 1 0 ${-R} L ${-S / 2} ${-H / 3} Z`,
      labelX: lxL, labelY: lyL,
    },
    {
      id: 'wegnetz_sampling', shortLabel: 'wns', longLabel: 'Wegnetz-Sampling',
      // Bottom-Right (30°) → Bottom-Left (150°), innerer Vertex bottom
      path: `M ${S} ${2 * H / 3} A ${R} ${R} 0 0 1 ${-S} ${2 * H / 3} L 0 ${2 * H / 3} Z`,
      labelX: lxB, labelY: lyB,
    },
    {
      id: 'engine_prep', shortLabel: 'epb', longLabel: 'Engine-Prep-Build',
      // Top (270°/-90°) → Bottom-Right (30°), innerer Vertex top-right
      path: `M 0 ${-R} A ${R} ${R} 0 0 1 ${S} ${2 * H / 3} L ${S / 2} ${-H / 3} Z`,
      labelX: lxR, labelY: lyR,
    },
  ];
})();

// Minimalistische Glyphs statt der 3-Letter-Labels. Entworfen in einer ±5-Box,
// zentriert auf der Label-Position, leicht skaliert. Farbe = Label-Farbe.
function TetraGlyph({ id, x, y, color }: { id: string; x: number; y: number; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 0.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const f = { fill: color, stroke: 'none' };
  const bolt = <path d="M-2.3 -4 L-4.5 0.4 L-2.9 0.4 L-3.7 4 L-0.9 -1 L-2.5 -1 Z" {...f} />;
  let body: JSX.Element | null = null;
  switch (id) {
    case 'geometry_draw': // Bleistift, diagonal (Spitze unten-links)
      body = <g transform="rotate(-45)">
        <path d="M-4.2 0 L-2.8 -1.05 L-2.8 1.05 Z" {...s} />
        <path d="M-2.8 -1.05 L2.2 -1.05 L2.2 1.05 L-2.8 1.05 Z" {...s} />
        <line x1={1.1} y1={-1.05} x2={1.1} y2={1.05} {...s} />
      </g>;
      break;
    case 'represent_organisation': // Büroklammer (durchgehender Draht), leicht geneigt
      body = <g transform="rotate(-22)"><path d="M0.8 -3 L0.8 2.6 C0.8 3.8 -1.2 3.8 -1.2 2.6 L-1.2 -3.4 C-1.2 -4.6 1.6 -4.6 1.6 -3.4 L1.6 1.8" {...s} /></g>;
      break;
    case 'catalog_magazination': // Bild/Icon
      body = <><rect x={-4} y={-4} width={8} height={8} rx={1} {...s} /><circle cx={-1.4} cy={-1.4} r={1} {...s} /><path d="M-3.5 3.2 L-1 0.2 L0.6 1.8 L2 0.4 L3.5 3" {...s} /></>;
      break;
    case 'sensus_core_build': // Paket
      body = <><rect x={-3.8} y={-3.4} width={7.6} height={7.4} rx={0.6} {...s} /><line x1={0} y1={-3.4} x2={0} y2={4} {...s} /><line x1={-3.8} y1={0.3} x2={3.8} y2={0.3} {...s} /></>;
      break;
    case 'engine_prep': // Zahnrad
      body = <><circle cx={0} cy={0} r={2.4} {...s} /><path d="M0 -3.4 L0 -2.2 M0 3.4 L0 2.2 M-3.4 0 L-2.2 0 M3.4 0 L2.2 0 M-2.4 -2.4 L-1.55 -1.55 M2.4 -2.4 L1.55 -1.55 M-2.4 2.4 L-1.55 1.55 M2.4 2.4 L1.55 1.55" {...s} /><circle cx={0} cy={0} r={0.8} {...f} /></>;
      break;
    case 'wegnetz_sampling': // Sampling — Kurve mit 3 Stützpunkten DARAUF
      body = <><path d="M-4 1.6 Q0 -2.6 4 1.6" {...s} />{([[-4, 1.6], [0, -0.5], [4, 1.6]] as [number, number][]).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={0.7} {...f} />)}</>;
      break;
    case 'boundary': // unregelm. Polygon, 4 Knoten
      body = <><polygon points="-3.4,-2.6 3.6,-3.6 3,3.4 -3.8,2.2" {...s} />{([[-3.4, -2.6], [3.6, -3.6], [3, 3.4], [-3.8, 2.2]] as [number, number][]).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={0.8} {...f} />)}</>;
      break;
    case 'system_adjust': // Blitz + Slider
      body = <>{bolt}<line x1={0.8} y1={-2.2} x2={4} y2={-2.2} {...s} /><circle cx={2.6} cy={-2.2} r={0.7} {...f} /><line x1={0.8} y1={0} x2={4} y2={0} {...s} /><circle cx={1.7} cy={0} r={0.7} {...f} /><line x1={0.8} y1={2.2} x2={4} y2={2.2} {...s} /><circle cx={3.1} cy={2.2} r={0.7} {...f} /></>;
      break;
    case 'load_thresholds': // Blitz + Load (Load-Symbol über die horizontale Achse gespiegelt)
      body = <>{bolt}<g transform="scale(1,-1)"><path d="M2.4 -2.8 L2.4 1.4 M0.9 -0.1 L2.4 1.7 L3.9 -0.1" {...s} /><path d="M0.7 2.6 L0.7 3.6 L4.1 3.6 L4.1 2.6" {...s} /></g></>;
      break;
    case 'regio_content': // Blitz + Schild (ausgewogenere Proportion)
      body = <>{bolt}<path d="M0.6 -2.8 L4.4 -2.8 L4.4 0.6 C4.4 2.3 2.5 3.4 2.5 3.4 C2.5 3.4 0.6 2.3 0.6 0.6 Z" {...s} /></>;
      break;
    default:
      body = null;
  }
  // Threshold-Bögen leicht von der Bahn absetzen (sys links, reg rechts, load runter).
  const off: Record<string, [number, number]> = {
    system_adjust: [-3.2, 0],
    regio_content: [1.5, 0],
    load_thresholds: [0, 1.5],
  };
  const [dx, dy] = off[id] ?? [0, 0];
  // Basis-Scale 1.08; einzelne Glyphs zusätzlich vergrößert.
  const mul: Record<string, number> = { wegnetz_sampling: 1.3, geometry_draw: 1.2, engine_prep: 1.2 };
  const sc = (1.08 * (mul[id] ?? 1)).toFixed(3);
  return <g transform={`translate(${x + dx},${y + dy}) scale(${sc})`} style={{ pointerEvents: 'none' }}>{body}</g>;
}

// ─── Hauptkomponente ────────────────────────────────────────────────────────

export default function RepresentBuildTetrahedron({
  activeFace,
  activeArc,
  activeSickle,
  onFaceClick,
  onArcClick,
  onSickleClick,
  size = 100,
  variant = 'dark',
  showLabels = false,
  transmissionMode = 'default',
}: Props) {
  const isDark = variant === 'dark';

  // Farben pro Variante
  const triangleActiveFill = isDark ? '#2b6cb0' : '#1a365d';
  const triangleActiveStroke = isDark ? '#63b3ed' : '#1a365d';
  const triangleInactiveStroke = isDark ? '#2d4a6a' : '#a0aec0';
  const triangleLabelActive = '#fff';
  const triangleLabelInactive = isDark ? '#4a6a8a' : '#718096';
  const arcFillInactive = isDark ? '#1a2535' : '#edf2f7';
  const arcFillActive = isDark ? '#2b6cb0' : '#1a365d';
  const arcStrokeInactive = isDark ? '#2d4a6a' : '#cbd5e0';
  const arcStrokeActive = isDark ? '#63b3ed' : '#1a365d';
  const arcLabelInactive = isDark ? '#a0aec0' : '#4a5568';
  const arcLabelActive = '#fff';

  // viewBox mit Padding fuer Bogen-Beschriftung
  const labelPadding = 14;
  const totalRadius = R + ARC_THICKNESS / 2 + labelPadding;
  const vb = -totalRadius - 2;
  const vbSize = 2 * (totalRadius + 2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${vb} ${vb} ${vbSize} ${vbSize}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Bogensegmente — in einer rotierenden Gruppe gewrappt, damit der
          Input-/Output-Schwenk smooth animiert. transform-box: view-box
          verankert die Drehung um den SVG-Ursprung (Tetraeder-Zentrum). */}
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: '0 0',
          transform: `rotate(${transmissionMode === 'input' ? 60 : 0}deg) scale(${ARC_SCALE})`,
          transition: 'transform 480ms cubic-bezier(0.45, 0, 0.55, 1)',
        }}
      >
      {ARCS.map((a) => {
        const path = describeArcSegment(a.startDeg, a.endDeg, ARC_GAP_DEG);
        const [lx, ly] = polarToCartesian(a.labelAngleDeg, R + ARC_THICKNESS / 2 + 6);
        const clickable = !!onArcClick;
        const isActive = a.id === activeArc;
        const fill = isActive ? arcFillActive : arcFillInactive;
        const stroke = isActive ? arcStrokeActive : arcStrokeInactive;
        const labelColor = isActive ? arcLabelActive : arcLabelInactive;
        return (
          <g
            key={a.id}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable ? () => onArcClick(a.id) : undefined}
          >
            <path
              d={path}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 1.0 : 0.8}
              strokeLinejoin="round"
              className={isActive ? 'rb-active-tile' : undefined}
            >
              <title>{a.longLabel}</title>
            </path>
            {showLabels && (
              <>
                {/* transparente Hitbox hinter dem Kuerzel: der Klick aufs Label
                    trifft so den Bogen (onClick des umgebenden <g>) statt
                    durch das pointerEvents:none-Label durchzufallen. */}
                {clickable && <rect x={lx - 9} y={ly - 5} width={18} height={10} fill="transparent" />}
                <TetraGlyph id={a.id} x={lx} y={ly} color={labelColor} />
              </>
            )}
          </g>
        );
      })}
      </g>

      {/* Sicheln — bewusst AUSSERHALB der rotierenden Bogen-Gruppe: sie drehen
          beim Transmissions-Schwenk NICHT mit. Kreissegmente, klickbar. */}
      {SICKLES.map((s) => {
        const isActive = s.id === activeSickle;
        const clickable = !isActive && !!onSickleClick;
        const fill = isActive ? triangleActiveFill : 'transparent';
        const stroke = isActive ? triangleActiveStroke : triangleInactiveStroke;
        return (
          <g
            key={s.id}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable && onSickleClick ? () => onSickleClick(s.id) : undefined}
          >
            <path
              d={s.path}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 1.0 : 0.9}
              strokeLinejoin="round"
              opacity={isActive ? 1 : 0.85}
              className={isActive ? 'rb-active-tile' : undefined}
            >
              <title>{s.longLabel}</title>
            </path>
            {showLabels && (
              <TetraGlyph id={s.id} x={s.labelX} y={s.labelY} color={isActive ? triangleLabelActive : triangleLabelInactive} />
            )}
          </g>
        );
      })}

      {/* Triangles */}
      {FACES.map((f) => {
        const isActive = f.id === activeFace;
        const fill = isActive ? triangleActiveFill : 'transparent';
        const stroke = isActive ? triangleActiveStroke : triangleInactiveStroke;
        const strokeWidth = isActive ? 1.0 : 1;
        const opacity = isActive ? 1 : 0.85;
        const clickable = !isActive && !!onFaceClick;
        return (
          <g
            key={f.id}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable && onFaceClick ? () => onFaceClick(f.id) : undefined}
          >
            <polygon
              points={f.points}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              opacity={opacity}
              className={isActive ? 'rb-active-tile' : undefined}
            >
              <title>{f.longLabel}</title>
            </polygon>
            {showLabels && (
              <TetraGlyph id={f.id} x={f.labelX} y={f.labelY} color={isActive ? triangleLabelActive : triangleLabelInactive} />
            )}
          </g>
        );
      })}

      {/* Empty-Sea-Stil Pulse-Animation auf dem aktiven Tile */}
      <style>{`
        .rb-active-tile {
          animation: rb-pulse 3200ms ease-in-out infinite;
        }
        @keyframes rb-pulse {
          0%, 100% { opacity: 0.80; }
          50%       { opacity: 1.00; }
        }
      `}</style>
    </svg>
  );
}

// Exportiere FACE_BY_ID fuer evtl. spaetere Header-Beschriftung
export { FACE_BY_ID };
