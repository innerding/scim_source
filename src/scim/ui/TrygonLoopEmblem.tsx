// Trygon-Loop (TL) — das Kernfunktions-Emblem. Sachlich, nüchtern, monochrom.
//   AP = Anthem-Pulse · CK = Comfort Kernel · AK = Avoidance Kernel · TL = der Loop.
// Statisch (Default): Kürzel an den Trygon-Ecken, TL-Scheibe r 13,5.
// animated=true: Versatz-Staffel / Newton's Cradle —
//   · gerichteter Impuls AP → CK → AK: jede Kugel fährt bis DICHT vor die nächste (eine
//     Kugelbreite Abstand) und stupst sie an, die nächste startet im selben Moment
//   · weil sie nicht ganz aufschließt, rutscht der Reigen pro Runde eine Kugelbreite zurück
//   · ANSTÖSSER: AP (erste Kugel) wird nicht von selbst los, sondern vom echten Trygon
//     angestoßen — es trackt AP (−100°/Runde), steht still und schlägt jeden Rundenanfang
//     seinen Apex sauber auf AP (strike-and-stop)
//   · VERSATZ sichtbar am still stehenden Ghost-Trygon (Ursprungs-Apexe): Kugeln fallen dahinter zurück
//   · das ist der TL-Signalfluss (messen→beobachten→handeln) als wandernde Knall-Welle
//   · 18 Runden schließen den Loop nahtlos; Texte aufrecht; TL-Scheibe r 11,5
//   · Keyframes programmatisch: VS_* / vsAnim() / vsTriangle()
// © designed by Dietmar Broda · 2025/2026.

const INK = '#2d3748';
const FAINT = '#a0aec0';

// — Versatz-Staffel (animated). Jede Kugel fährt bis DICHT vor die nächste (eine
// Kugelbreite Abstand, ≈20° auf dem Ring r50, ⌀18) und stupst sie an; die nächste
// startet im selben Moment. Weil sie nicht ganz auf die Position der nächsten fährt,
// rutscht der Reigen pro Runde eine Kugelbreite zurück — fortlaufend. Vorrücken je
// Runde = 120° − 20° = 100°. Nach 18 Runden (18·100 = 5·360) sind die Kugeln wieder
// deckungsgleich, das Trygon (−120°/Runde = 6·360) ebenso → nahtloser Loop.
const VS_D = 20;            // Kugelbreite in Ring-Grad (≈ Berührung)
const VS_PER = 120 - VS_D;  // Vorrücken je Runde
const VS_N = 18;            // Runden bis zum nahtlosen Loop-Schluss
const VS_HO = 1.0;          // Sekunden je Etappe (3 Etappen = 1 Runde)
const VS_ROUND = 3 * VS_HO;
const VS_TOTAL = VS_N * VS_ROUND;
const VS_DUR = `${VS_TOTAL}s`;

// Baut values/keyTimes für eine Kugel: sie bewegt sich in Etappe `slot` jeder Runde
// um `step`° (negativ = Außen-Drehung um 60,60; positiv = Text-Gegendrehung um cx,cy).
function vsAnim(slot: number, cx: number, cy: number, step: number) {
  const pts: [number, number][] = [[0, 0]];
  for (let r = 0; r < VS_N; r++) {
    const tStart = (r * 3 + slot) * VS_HO;
    pts.push([tStart, r * step]);
    pts.push([tStart + VS_HO, (r + 1) * step]);
  }
  pts.push([VS_TOTAL, VS_N * step]);
  const vals: string[] = [], kts: string[] = [];
  let prevT = -1;
  for (const [t, a] of pts) {
    if (t === prevT) { vals[vals.length - 1] = `${a} ${cx} ${cy}`; continue; }
    vals.push(`${a} ${cx} ${cy}`);
    kts.push((t / VS_TOTAL).toFixed(5));
    prevT = t;
  }
  return { values: vals.join('; '), keyTimes: kts.join('; ') };
}

const VS = {
  apMove: vsAnim(0, 60, 60, -VS_PER), apText: vsAnim(0, 60, 10, VS_PER),
  ckMove: vsAnim(1, 60, 60, -VS_PER), ckText: vsAnim(1, 16.7, 85, VS_PER),
  akMove: vsAnim(2, 60, 60, -VS_PER), akText: vsAnim(2, 103.3, 85, VS_PER),
};

// Echtes Trygon (Anstößer): trackt AP mit −100°/Runde. Es steht still, schlägt dann mit
// jedem Rundenanfang seinen Apex genau auf AP (strike-and-stop, Dauer VS_J), steht wieder
// still. So sitzt der Apex jede Runde sauber auf der ersten Kugel und stößt sie an.
const VS_J = 0.35; // Schlag-Dauer (s)
function vsTriangle() {
  const pts: [number, number][] = [[0, 0]];
  for (let r = 1; r <= VS_N; r++) {
    const tEnd = r * VS_ROUND;          // Schlag endet exakt am Rundenanfang
    pts.push([tEnd - VS_J, -(r - 1) * VS_PER]); // hält die alte Lage bis kurz davor
    pts.push([tEnd, -r * VS_PER]);              // Schlag auf die neue AP-Position
  }
  const vals: string[] = [], kts: string[] = [];
  let prevT = -1;
  for (const [t, a] of pts) {
    if (t === prevT) { vals[vals.length - 1] = `${a} 60 60`; continue; }
    vals.push(`${a} 60 60`); kts.push((t / VS_TOTAL).toFixed(5)); prevT = t;
  }
  return { values: vals.join('; '), keyTimes: kts.join('; ') };
}
const VS_TRI = vsTriangle();
// Trygon auf Kugelhöhe (Ecken auf dem Ring r50, wo die Kugeln sitzen).
const VS_TRI_POINTS = '60,10 16.7,85 103.3,85';

export function TrygonLoopEmblem({ size = 96, withLegend = true, animated = false }: { size?: number; withLegend?: boolean; animated?: boolean }) {
  const staticSvg = (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Trygon-Loop (TL)" style={{ flexShrink: 0 }}>
      <circle cx="60" cy="60" r="50" fill="none" stroke={FAINT} strokeWidth="1" />
      <polygon points="60,26 30.6,77 89.4,77" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="60" cy="26" r="2.4" fill={INK} />
      <circle cx="30.6" cy="77" r="2.4" fill={INK} />
      <circle cx="89.4" cy="77" r="2.4" fill={INK} />
      <text x="60" y="17" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
      <text x="22" y="92" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
      <text x="98" y="92" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
      <circle cx="60" cy="60" r="13.5" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <text x="60" y="64.5" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">TL</text>
    </svg>
  );

  const animSvg = (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Trygon-Loop (TL)" style={{ flexShrink: 0 }}>
      {/* Loop-Ring (statisch) */}
      <circle cx="60" cy="60" r="50" fill="none" stroke={FAINT} strokeWidth="1" />

      {/* Ghost-Trygon: still an den Ursprungs-Apexen (0/120/240). Die Kugeln (und das echte
          Trygon) fallen Runde um Runde dahinter zurück = der sichtbare Versatz. */}
      <polygon points={VS_TRI_POINTS} fill="none" stroke={FAINT} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" strokeLinejoin="round" />

      {/* Echtes Trygon (Anstößer): trackt AP (−100°/Runde) und schlägt seinen Apex mit jedem
          Rundenanfang sauber auf AP (strike-and-stop). Keyframes: vsTriangle(). */}
      <g>
        <polygon points={VS_TRI_POINTS} fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <animateTransform attributeName="transform" type="rotate" values={VS_TRI.values} keyTimes={VS_TRI.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
      </g>

      {/* Kürzel-Ebene: Versatz-Staffel. Jede Kugel fährt bis DICHT vor die nächste und
          stupst sie an; pro Runde rutscht der Reigen eine Kugelbreite zurück (siehe oben).
          Innere Gegendrehung hält die Texte aufrecht. Keyframes: vsAnim(). */}
      <g>
        <g>
          <circle cx="60" cy="10" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="60" y="13.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
            <animateTransform attributeName="transform" type="rotate" values={VS.apText.values} keyTimes={VS.apText.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate" values={VS.apMove.values} keyTimes={VS.apMove.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
        </g>
        <g>
          <circle cx="16.7" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="16.7" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
            <animateTransform attributeName="transform" type="rotate" values={VS.ckText.values} keyTimes={VS.ckText.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate" values={VS.ckMove.values} keyTimes={VS.ckMove.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
        </g>
        <g>
          <circle cx="103.3" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="103.3" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
            <animateTransform attributeName="transform" type="rotate" values={VS.akText.values} keyTimes={VS.akText.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate" values={VS.akMove.values} keyTimes={VS.akMove.keyTimes} dur={VS_DUR} repeatCount="indefinite" />
        </g>
      </g>

      {/* Zentrum: TL im Kreis — 2 px kleiner (r 11,5), statisch */}
      <circle cx="60" cy="60" r="11.5" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <text x="60" y="64" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">TL</text>
    </svg>
  );

  const svg = animated ? animSvg : staticSvg;

  if (!withLegend) return svg;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: 'system-ui, sans-serif' }}>
      {svg}
      <div style={{ fontSize: 11.5, color: INK, lineHeight: 1.65 }}>
        <div style={{ fontWeight: 700, letterSpacing: 0.3, marginBottom: 4 }}>TL — Trygon-Loop</div>
        <div style={{ color: '#4a5568' }}><strong>AP</strong> Anthem-Pulse — misst die Last</div>
        <div style={{ color: '#4a5568' }}><strong>CK</strong> Comfort Kernel — beobachtet den Comfort</div>
        <div style={{ color: '#4a5568' }}><strong>AK</strong> Avoidance Kernel — handelt (Deeskalation)</div>
        <div style={{ color: '#718096', marginTop: 5, fontSize: 10 }}>designed by Dietmar Broda · © 2025/2026</div>
      </div>
    </div>
  );
}
