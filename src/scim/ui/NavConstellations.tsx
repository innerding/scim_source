// Zirkumpolar-Feld — ECHTE Planisphäre um den Himmelsnordpol.
//
// Keine Hand-Platzierung mehr: jeder Stern steht mit realer Rektaszension (RA)
// und Deklination (Dec). Projektion = azimutal um den Pol (wie eine drehbare
// Sternkarte): Radius ∝ (90° − Dec), Azimut = RA. Der ganze Himmel wheelt
// langsam um den Pol (= rotierender RA-Versatz).
//
// Folge: die Lagen stimmen — der DRACHE windet sich real zwischen den Bären
// (Thuban α Dra liegt zwischen den Wagen; war vor ~4700 J. selbst Polarstern).
// Überlappung mit dem Kleinen Bär ist damit GEWOLLT/echt; lesbar gemacht durch
// Tiefe: Kataloge (blau) hinten, Schmieden (gold) vorn.
//
// Maschinen (schmieden, GOLD): Großer Bär (Icons) · Kleiner Bär (Schrift, Polaris).
// Katalog-Maschinen (halten & geben, BLAU): Cassiopeia · Cepheus · Draco.

interface Constellation {
  panelId: string;
  label: string;
  role: string;
  kind: 'forge' | 'catalog';
  /** Sterne als [RA in Stunden, Dec in Grad]. */
  stars: [number, number][];
  /** Linien des Asterismus über Stern-Indizes. */
  lines: [number, number][];
  /** Optionale Stern-Indizes für die Klick-Hülle (kompaktes geschlossenes Polygon
   *  statt voller Hülle — für sperrige Figuren wie den windenden Drachen). */
  hitbox?: number[];
}

// Reihenfolge = Mal-Reihenfolge (hinten → vorn). Kataloge zuerst (Draco ganz
// hinten), dann die Schmieden gold obenauf.
const SKY: Constellation[] = [
  {
    panelId: 'draco', label: 'Draco', role: 'Katalog', kind: 'catalog',
    // Kopf (γ,β,ξ) · Hals hinauf (δ,ε) · windet hinab zwischen die Bären (ζ,η,θ,ι,Thuban,κ,λ)
    stars: [
      [17.943, 51.49], [17.507, 52.30], [17.892, 56.87], [19.209, 67.66], [19.795, 70.27],
      [17.146, 65.71], [16.40, 61.51], [16.03, 58.56], [15.415, 58.97], [14.073, 64.38],
      [12.558, 69.79], [11.523, 69.33],
    ],
    lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]],
    // Klickfläche = nur Kopf + oberer Bogen (Punkte 1–8 vom Kopf), ~gleichschenkliges
    // Dreieck; der windende Schwanz (9–12) bleibt dekorativ/unklickbar.
    hitbox: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    panelId: 'cepheus', label: 'Cepheus', role: 'Katalog', kind: 'catalog',
    // α Alderamin · β Alfirk · γ Errai (nahe Pol) · ι · ζ — das „Haus"
    stars: [[21.310, 62.59], [21.478, 70.56], [23.656, 77.63], [22.828, 66.20], [22.182, 58.20]],
    lines: [[4, 0], [0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    panelId: 'cassiopeia', label: 'Cassiopeia', role: 'Katalog', kind: 'catalog',
    // das W: Caph β · Schedar α · Navi γ · Ruchbah δ · Segin ε
    stars: [[0.153, 59.15], [0.675, 56.54], [0.945, 60.72], [1.430, 60.24], [1.906, 63.67]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    panelId: 'ursa_major', label: 'Großer Bär', role: 'Icon-Schmiede', kind: 'forge',
    // Großer Wagen: Schale Dubhe α·Merak β·Phecda γ·Megrez δ · Deichsel ε·ζ·η
    stars: [[11.062, 61.75], [11.030, 56.38], [11.897, 53.69], [12.257, 57.03], [12.900, 55.96], [13.399, 54.93], [13.792, 49.31]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    panelId: 'polarstar', label: 'Kleiner Bär', role: 'Schrift-Schmiede', kind: 'forge',
    // Kleiner Wagen: Polaris α · δ Yildun · ε · ζ · η · β Kochab · γ Pherkad
    stars: [[2.530, 89.26], [17.537, 86.59], [16.766, 82.04], [15.734, 77.79], [16.291, 75.76], [14.845, 74.16], [15.345, 71.83]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
];

// Feld + Projektion
const W = 206, H = 198;
const CX = 103, CY = 96;
const SCALE = 2.05;          // px pro Grad Pol-Abstand → maxR ≈ 84 (minDec ≈ 49°)
const D2R = Math.PI / 180;

const FORGE = '#ffe6a6';
const CATALOG = 'rgba(150,185,255,0.85)';

// (RA[h], Dec[°]) → (x,y) azimutal um den Pol.
function project(raH: number, decDeg: number): [number, number] {
  const r = (90 - decDeg) * SCALE;
  const phi = raH * 15 * D2R;              // RA → Azimut
  return [CX + r * Math.sin(phi), CY - r * Math.cos(phi)];
}

function ConstellationSvg({ c, active, onSelect }: { c: Constellation; active: boolean; onSelect: (id: string) => void }) {
  const col = c.kind === 'forge' ? FORGE : CATALOG;
  const pts = c.stars.map(([ra, dec]) => project(ra, dec));
  const hullIdx = c.hitbox ?? c.stars.map((_, i) => i);
  const hull = hullIdx.map((i) => pts[i].map((v) => v.toFixed(1)).join(',')).join(' ');
  const dim = c.kind === 'catalog' && !active;
  return (
    <g style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => onSelect(c.panelId)}>
      <title>{c.label} — {c.role}</title>
      <polygon points={hull} fill="transparent" stroke="transparent" strokeWidth={12} strokeLinejoin="round" />
      {c.lines.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke={col} strokeWidth={active ? 1.2 : 0.75} strokeLinecap="round"
          opacity={active ? 0.95 : dim ? 0.42 : 0.55} />
      ))}
      {pts.map(([x, y], i) => {
        if (c.panelId === 'polarstar' && i === 0) return null;  // Polaris separat (Pol)
        return <circle key={i} cx={x} cy={y} r={active ? 1.7 : 1.2} fill={col} opacity={active ? 1 : dim ? 0.6 : 0.78} />;
      })}
    </g>
  );
}

export default function NavConstellations({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const polActive = activeId === 'polarstar';
  const [px, py] = project(2.530, 89.26);   // reale Polaris-Position (winziger Kreis um den Pol)
  return (
    <div style={{ width: '100%', height: H, flexShrink: 0, position: 'relative', marginBottom: 6, zIndex: 6, pointerEvents: 'none' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
        {/* der ganze Himmel wheelt langsam gegen den Uhrzeigersinn um den Pol */}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'scim-sky-wheel 280s linear infinite' }}>
          {SKY.map((c) => (
            <ConstellationSvg key={c.panelId} c={c} active={activeId === c.panelId} onSelect={onSelect} />
          ))}
          {/* Polaris — glimmernder Pol, an seiner echten (fast zentralen) Stelle */}
          <g style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => onSelect('polarstar')}>
            <title>Polarstern — Kleiner Bär (Schrift-Schmiede)</title>
            <circle cx={px} cy={py} r={9} fill="transparent" />
            <path
              d={`M${px},${py - 8} C${px + 1.4},${py - 2} ${px + 2},${py - 1.4} ${px + 8},${py} C${px + 2},${py + 1.4} ${px + 1.4},${py + 2} ${px},${py + 8} C${px - 1.4},${py + 2} ${px - 2},${py + 1.4} ${px - 8},${py} C${px - 2},${py - 1.4} ${px - 1.4},${py - 2} ${px},${py - 8} Z`}
              fill={polActive ? '#fff3d6' : '#ffe6a6'} stroke="rgba(255,255,255,0.9)" strokeWidth={0.5}
              style={{ filter: polActive ? 'drop-shadow(0 0 4px rgba(255,224,150,0.9))' : 'drop-shadow(0 0 2px rgba(255,224,150,0.5))' }}
              className="scim-pol-glimmer" />
            <circle cx={px} cy={py} r={2.1} fill="#fffaf0" />
          </g>
        </g>
      </svg>
      <style>{`
        @keyframes scim-sky-wheel { to { transform: rotate(-360deg); } }
        @keyframes scim-pol-glimmer { 0%,100% { opacity: 0.72; } 50% { opacity: 1; } }
        .scim-pol-glimmer { animation: scim-pol-glimmer 2600ms ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>
    </div>
  );
}
