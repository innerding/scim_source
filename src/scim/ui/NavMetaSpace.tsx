// Meta-Space — grobe Felsbrocken (Mondlandschaft) unter dem Substrat-Tetraeder.
// „Der Grund": dunkles Substrat-Geröll. In der TIEFE verteilt (hinten klein/blass,
// vorn groß/dunkel). Jeder Brocken ein EIGENES Polygon, Unterseite immer fast
// gerade (sitzt flach am Boden). Licht oben-links → Schlagschatten nach unten-rechts;
// kleine Punkte auf der Schattenseite (Boden + Körper). Siehe docs/begriffs_karte.md.

// Sechs verschiedene Brocken-Silhouetten (relativ, x rechts / y unten). Erster und
// letzter Punkt liegen auf der flachen Basis (dy ≈ 0.72) → gerade Unterkante.
const SHAPES: [number, number][][] = [
  // 0 · breite Niedrig-Platte, flacher Rücken
  [[-1.15, 0.72], [-1.2, 0.2], [-0.8, -0.22], [-0.1, -0.38], [0.55, -0.3], [1.08, -0.16], [1.2, 0.32], [1.1, 0.72]],
  // 1 · hoch, spitzer Gipfel
  [[-0.85, 0.72], [-0.96, 0.02], [-0.5, -0.78], [-0.05, -1.06], [0.22, -0.58], [0.56, -0.86], [0.92, -0.18], [0.86, 0.72]],
  // 2 · asymmetrisch, geneigt
  [[-0.92, 0.72], [-1.02, -0.12], [-0.55, -0.5], [0.02, -0.46], [0.36, -0.82], [0.78, -0.54], [1.02, 0.12], [0.86, 0.72]],
  // 3 · gedrungenes Fünfeck
  [[-1.0, 0.72], [-1.06, -0.06], [-0.36, -0.72], [0.46, -0.6], [1.02, -0.05], [1.06, 0.72]],
  // 4 · drei Buckel
  [[-1.02, 0.72], [-1.12, 0.1], [-0.72, -0.46], [-0.22, -0.7], [0.26, -0.54], [0.72, -0.66], [1.06, -0.1], [1.0, 0.72]],
  // 5 · kleiner, kantiger Dreikant
  [[-0.95, 0.72], [-0.8, -0.32], [0.02, -0.76], [0.72, -0.34], [0.95, 0.72]],
];

type Rock = { cx: number; cy: number; r: number; fill: string; shape: number; pick?: string; label?: string };

// Tiefen-Streuung (back → front; Mal-Reihenfolge = Z-Sortierung), jeweils mit
// eigener Form-Nummer.
const ROCKS: Rock[] = [
  { cx: 34, cy: 13, r: 5.5, fill: '#232d3b', shape: 5 },
  { cx: 92, cy: 11, r: 4.8, fill: '#232d3b', shape: 3 },
  { cx: 60, cy: 23, r: 7.5, fill: '#1f2835', shape: 0 },
  { cx: 104, cy: 29, r: 6.6, fill: '#1f2835', shape: 4 },
  // Linker Brocken = P05 (Operator-Zonen, aus dem Substrat herausgelöst). Klickbar.
  { cx: 22, cy: 39, r: 9.5, fill: '#1a2330', shape: 2, pick: 'P05', label: 'Operator-Zonen (P05)' },
  // Vorderster Brocken = R01 (die geräteseitige Runtime Shell, in den Grund gesunken). Klickbar.
  { cx: 74, cy: 46, r: 11, fill: '#18212d', shape: 1, pick: 'R01', label: 'Runtime Shell (R01)' },
];

function pts(cx: number, cy: number, r: number, shape: [number, number][]): string {
  return shape.map(([dx, dy]) => `${(cx + dx * r).toFixed(1)},${(cy + dy * r).toFixed(1)}`).join(' ');
}

export default function NavMetaSpace({ onPick, activeId }: { onPick?: (id: string) => void; activeId?: string }) {
  return (
    <svg viewBox="0 0 124 60" width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {ROCKS.map((k, i) => {
        const baseY = k.cy + k.r * 0.72; // die flache Unterkante
        const clickable = !!k.pick;
        const isActive = clickable && activeId === k.pick;
        return (
          <g key={i}
            onClick={clickable ? () => onPick?.(k.pick as string) : undefined}
            style={clickable ? { cursor: 'pointer', pointerEvents: 'all' } : undefined}
          >
            {clickable && <title>{k.label}</title>}
            {/* Schlagschatten — am Boden, nach unten-rechts (Schattenseite). */}
            <ellipse cx={k.cx + k.r * 0.45} cy={baseY + k.r * 0.06} rx={k.r * 1.1} ry={k.r * 0.32} fill="rgba(0,0,0,0.40)" />
            {/* Boden-Punkte auf der Schattenseite. */}
            <circle cx={k.cx + k.r * 0.95} cy={baseY + k.r * 0.05} r={0.6} fill="rgba(0,0,0,0.42)" />
            <circle cx={k.cx + k.r * 1.3} cy={baseY - k.r * 0.04} r={0.45} fill="rgba(0,0,0,0.3)" />
            {/* Körper. */}
            <polygon points={pts(k.cx, k.cy, k.r, SHAPES[k.shape])} fill={isActive ? '#23364a' : k.fill}
              stroke={isActive ? '#63b3ed' : '#3a485d'} strokeWidth={isActive ? 1.1 : 0.5} strokeLinejoin="round" />
            {/* Licht-Kante oben-links (zarter Glanz). */}
            <path d={`M ${(k.cx - k.r * 0.7).toFixed(1)} ${(k.cy - k.r * 0.15).toFixed(1)} Q ${(k.cx - k.r * 0.2).toFixed(1)} ${(k.cy - k.r * 0.62).toFixed(1)} ${(k.cx + k.r * 0.35).toFixed(1)} ${(k.cy - k.r * 0.5).toFixed(1)}`}
              fill="none" stroke="#4a5b71" strokeWidth={0.5} strokeLinecap="round" opacity={0.7} />
            {/* Körper-Punkte auf der Schattenseite (unten-rechts auf dem Körper). */}
            <circle cx={k.cx + k.r * 0.42} cy={k.cy + k.r * 0.3} r={0.6} fill="#0f141d" />
            <circle cx={k.cx + k.r * 0.6} cy={k.cy + k.r * 0.05} r={0.42} fill="#0f141d" />
          </g>
        );
      })}
    </svg>
  );
}
