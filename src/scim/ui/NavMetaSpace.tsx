// Meta-Space — grobe Felsbrocken (Mondlandschaft) unter dem Substrat-Tetraeder.
// „Der Grund": dunkles Substrat-Geröll. NICHT aufgereiht, sondern in der TIEFE
// verteilt (hinten klein/höher/blasser, vorn groß/tiefer/dunkler). Licht oben-links
// → Schlagschatten nach unten-rechts; kleine Punkte auf der Schattenseite (Boden +
// Körper). Rein dekorativ. Siehe docs/begriffs_karte.md (Meta-Space „Der Grund").

type Rock = { cx: number; cy: number; r: number; fill: string };

// Tiefen-Streuung (back → front; in dieser Reihenfolge gemalt = Z-Sortierung).
const ROCKS: Rock[] = [
  { cx: 34, cy: 12, r: 5.5, fill: '#232d3b' },
  { cx: 92, cy: 10, r: 4.8, fill: '#232d3b' },
  { cx: 60, cy: 22, r: 7.5, fill: '#1f2835' },
  { cx: 104, cy: 28, r: 6.6, fill: '#1f2835' },
  { cx: 22, cy: 38, r: 9.5, fill: '#1a2330' },
  { cx: 74, cy: 45, r: 11, fill: '#18212d' },
];

// Unregelmäßiger Brocken (deterministisch), y leicht abgeflacht (Aufsicht).
const ANG = [0, 42, 88, 130, 176, 222, 268, 316];
const RAD = [1.0, 0.78, 1.08, 0.72, 1.0, 0.84, 1.06, 0.7];
function blob(cx: number, cy: number, r: number, rot: number): string {
  return ANG.map((deg, i) => {
    const a = ((deg + rot) * Math.PI) / 180;
    return `${(cx + Math.cos(a) * r * RAD[i]).toFixed(1)},${(cy + Math.sin(a) * r * RAD[i] * 0.82).toFixed(1)}`;
  }).join(' ');
}

export default function NavMetaSpace() {
  return (
    <svg viewBox="0 0 124 60" width="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {ROCKS.map((k, i) => {
        const rot = (i * 53) % 360; // variiert die Form je Brocken
        return (
          <g key={i}>
            {/* Schlagschatten — auf den Boden, nach unten-rechts (Schattenseite). */}
            <ellipse cx={k.cx + k.r * 0.5} cy={k.cy + k.r * 0.52} rx={k.r * 1.15} ry={k.r * 0.42} fill="rgba(0,0,0,0.40)" />
            {/* Boden-Punkte auf der Schattenseite. */}
            <circle cx={k.cx + k.r * 1.05} cy={k.cy + k.r * 0.55} r={0.6} fill="rgba(0,0,0,0.42)" />
            <circle cx={k.cx + k.r * 1.4} cy={k.cy + k.r * 0.38} r={0.45} fill="rgba(0,0,0,0.3)" />
            {/* Körper. */}
            <polygon points={blob(k.cx, k.cy, k.r, rot)} fill={k.fill} stroke="#3a485d" strokeWidth={0.5} strokeLinejoin="round" />
            {/* Licht-Kante oben-links (zarter Glanz). */}
            <path d={`M ${(k.cx - k.r * 0.7).toFixed(1)} ${(k.cy - k.r * 0.2).toFixed(1)} Q ${(k.cx - k.r * 0.2).toFixed(1)} ${(k.cy - k.r * 0.7).toFixed(1)} ${(k.cx + k.r * 0.4).toFixed(1)} ${(k.cy - k.r * 0.55).toFixed(1)}`}
              fill="none" stroke="#4a5b71" strokeWidth={0.5} strokeLinecap="round" opacity={0.7} />
            {/* Körper-Punkte auf der Schattenseite. */}
            <circle cx={k.cx + k.r * 0.42} cy={k.cy + k.r * 0.28} r={0.6} fill="#0f141d" />
            <circle cx={k.cx + k.r * 0.6} cy={k.cy + k.r * 0.02} r={0.42} fill="#0f141d" />
          </g>
        );
      })}
    </svg>
  );
}
