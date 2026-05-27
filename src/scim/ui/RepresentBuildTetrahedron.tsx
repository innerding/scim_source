// RepresentBuildTetrahedron — kleines SVG-Pictogramm fuer Panel-Header.
//
// Zeigt das aufgeklappte Tetraeder mit den vier Seiten der Represent-Build-
// Architektur. Die aktive Seite ist gefuellt, die anderen umrissen. Klick
// auf eine andere Seite springt zum entsprechenden Panel (via onNavigate).
//
// Siehe docs/represent_build.md fuer die Architektur-Doku.

export type RepresentBuildFace =
  | 'geometry_draw'
  | 'catalog_magazination'
  | 'represent_inspection'
  | 'represent_organisation';

interface Props {
  activeFace: RepresentBuildFace;
  onNavigate?: (face: RepresentBuildFace) => void;
  size?: number;          // pixel-Hoehe; Breite wird automatisch
  showLegend?: boolean;   // Beschriftung unterm Pictogramm
}

// Geometrie-Konstanten (s = Seitenlaenge eines Dreiecks)
const S = 40;
const H = (S * Math.sqrt(3)) / 2;  // Hoehe eines gleichseitigen Dreiecks

// Triangle-Koordinaten im Net-Layout:
// Center (organisation, inverted): top-left (0,0), top-right (S,0), bottom (S/2, H)
// Top flap (geometry, pointing up): (0,0), (S,0), (S/2, -H)
// Left flap (catalog, attached to left edge of center):
//   shares (0,0)-(S/2,H) with center; third vertex at (-S/2, H)
// Right flap (inspection, attached to right edge of center):
//   shares (S,0)-(S/2,H) with center; third vertex at (3S/2, H)

const FACES: Array<{
  id: RepresentBuildFace;
  label: string;
  shortLabel: string;
  points: string;
  labelX: number;
  labelY: number;
}> = [
  {
    id: 'geometry_draw',
    label: 'Geometry Draw',
    shortLabel: 'Geometry',
    points: `0,0 ${S},0 ${S / 2},${-H}`,
    labelX: S / 2,
    labelY: -H * 0.45,
  },
  {
    id: 'represent_organisation',
    label: 'Represent Organisation',
    shortLabel: 'Organisation',
    points: `0,0 ${S},0 ${S / 2},${H}`,
    labelX: S / 2,
    labelY: H * 0.40,
  },
  {
    id: 'catalog_magazination',
    label: 'Catalog Magazination',
    shortLabel: 'Catalog',
    points: `0,0 ${S / 2},${H} ${-S / 2},${H}`,
    labelX: -S * 0.05,
    labelY: H * 0.78,
  },
  {
    id: 'represent_inspection',
    label: 'Represent Inspection',
    shortLabel: 'Inspection',
    points: `${S},0 ${S / 2},${H} ${3 * S / 2},${H}`,
    labelX: S * 1.05,
    labelY: H * 0.78,
  },
];

const FACE_BY_ID: Record<RepresentBuildFace, typeof FACES[number]> =
  Object.fromEntries(FACES.map((f) => [f.id, f])) as Record<RepresentBuildFace, typeof FACES[number]>;

export default function RepresentBuildTetrahedron({
  activeFace,
  onNavigate,
  size = 100,
  showLegend = false,
}: Props) {
  const activeLabel = FACE_BY_ID[activeFace].label;

  // viewBox: padding 8 around bounding box [-S/2, -H, 3S/2, H]
  const pad = 6;
  const minX = -S / 2 - pad;
  const minY = -H - pad;
  const w = 2 * S + 2 * pad;
  const h = 2 * H + 2 * pad;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg
        width={(size * w) / h}
        height={size}
        viewBox={`${minX} ${minY} ${w} ${h}`}
        style={{ overflow: 'visible' }}
      >
        {FACES.map((f) => {
          const isActive = f.id === activeFace;
          const fill = isActive ? '#2b6cb0' : 'transparent';
          const stroke = isActive ? '#1a365d' : '#a0aec0';
          const strokeWidth = isActive ? 1.5 : 1;
          const opacity = isActive ? 1 : 0.6;
          const clickable = onNavigate && !isActive;
          return (
            <g
              key={f.id}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
              onClick={clickable ? () => onNavigate!(f.id) : undefined}
            >
              <polygon
                points={f.points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                opacity={opacity}
              >
                <title>{f.label}</title>
              </polygon>
              <text
                x={f.labelX}
                y={f.labelY}
                fontSize={6}
                fontFamily="system-ui, sans-serif"
                fontWeight={isActive ? 600 : 400}
                fill={isActive ? '#fff' : '#4a5568'}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                {f.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
      {showLegend && (
        <div style={{
          fontSize: 10, color: '#4a5568', fontFamily: 'system-ui, sans-serif',
          textAlign: 'center', maxWidth: 140,
        }}>
          <div style={{ fontWeight: 600 }}>{activeLabel}</div>
          <div style={{ color: '#a0aec0' }}>Represent Build</div>
        </div>
      )}
    </div>
  );
}
