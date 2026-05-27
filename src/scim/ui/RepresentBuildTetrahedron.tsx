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
  | 'represent_inspection'
  | 'represent_organisation';

export type RepresentBuildArc =
  | 'system_adjust'
  | 'regio_content'
  | 'manual';

interface Props {
  activeFace?: RepresentBuildFace;     // hervorgehobene Triangle (optional)
  activeArc?: RepresentBuildArc;       // hervorgehobenes Bogen-Segment (optional)
  onFaceClick?: (face: RepresentBuildFace) => void;
  onArcClick?: (arc: RepresentBuildArc) => void;
  onInspectorToggle?: () => void;
  size?: number;
  variant?: 'dark' | 'light';
  showLabels?: boolean;
}

// ─── Geometrie ──────────────────────────────────────────────────────────────

const S = 40;                          // Seitenlaenge eines Dreiecks
const H = (S * Math.sqrt(3)) / 2;      // Hoehe eines gleichseitigen Dreiecks
const R = (4 * H) / 3;                 // Radius des umschriebenen Kreises (~46.2)
const ARC_THICKNESS = 9;               // Dicke der Bogensegmente
const ARC_GAP_DEG = 6;                 // Luecke zwischen Segmenten in Grad

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
  {
    id: 'geometry_draw',
    shortLabel: 'geo',
    longLabel: 'Geometry Draw',
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
    id: 'represent_inspection',
    shortLabel: 'ins',
    longLabel: 'Represent Inspection',
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
    shortLabel: 'rou',
    longLabel: 'Route Thresholds',
    startDeg: -90,
    endDeg: 30,
    labelAngleDeg: -30,
  },
  // Bottom-Right (30°) → Bottom-Left (150°): zwischen Inspection und Catalog
  {
    id: 'manual',
    shortLabel: 'man',
    longLabel: 'Manual',
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

// ─── Hauptkomponente ────────────────────────────────────────────────────────

export default function RepresentBuildTetrahedron({
  activeFace,
  activeArc,
  onFaceClick,
  onArcClick,
  onInspectorToggle,
  size = 100,
  variant = 'dark',
  showLabels = false,
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
      {/* Bogensegmente */}
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
              strokeWidth={isActive ? 1.2 : 0.8}
              strokeLinejoin="round"
              className={isActive ? 'rb-active-tile' : undefined}
            >
              <title>{a.longLabel}</title>
            </path>
            {showLabels && (
              <text
                x={lx}
                y={ly}
                fontSize={5}
                fontFamily="system-ui, sans-serif"
                fontWeight={isActive ? 700 : 500}
                fill={labelColor}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                {a.shortLabel}
              </text>
            )}
          </g>
        );
      })}

      {/* Triangles */}
      {FACES.map((f) => {
        const isActive = f.id === activeFace;
        const isInspector = f.id === 'represent_inspection';
        const fill = isActive ? triangleActiveFill : 'transparent';
        const stroke = isActive ? triangleActiveStroke : triangleInactiveStroke;
        const strokeWidth = isActive ? 1.6 : 1;
        const opacity = isActive ? 1 : 0.85;
        const clickable = !isActive && (
          isInspector ? !!onInspectorToggle : !!onFaceClick
        );
        const onClick = isInspector
          ? onInspectorToggle
          : (onFaceClick ? () => onFaceClick(f.id) : undefined);
        return (
          <g
            key={f.id}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable ? onClick : undefined}
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
              <title>{f.longLabel}{isInspector ? ' (Inspector-Toggle)' : ''}</title>
            </polygon>
            {showLabels && (
              <text
                x={f.labelX}
                y={f.labelY}
                fontSize={5.5}
                fontFamily="system-ui, sans-serif"
                fontWeight={isActive ? 700 : 500}
                fill={isActive ? triangleLabelActive : triangleLabelInactive}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                {f.shortLabel}
              </text>
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
