// Trygon-Loop (TL) — das Kernfunktions-Emblem. Sachlich, nüchtern, monochrom.
//   AP = Anthem-Pulse · CK = Comfort Kernel · AK = Avoidance Kernel · TL = der Loop.
// Statisch (Default): Kürzel an den Trygon-Ecken, TL-Scheibe r 13,5.
// animated=true: Staffel-Lauf / Newton's Cradle (9 s = 3 Runden) —
//   · gerichteter Impuls AP → CK → AK: jede Kugel fährt VOLL bis auf die Position der nächsten
//     und stupst sie an, die nächste startet im selben Moment; das ist der TL-Signalfluss
//     (messen→beobachten→handeln), als wandernde Knall-Welle um den Ring
//   · jede Kugel umrundet einmal komplett (3 Etappen) → nahtloser Loop; Texte bleiben aufrecht
//   · das Trygon dreht langsam mit (−120°/Runde) — „der Orbiter dreht sich mit den Kugeln"
//   · TL-Scheibe 2 px kleiner (r 11,5)
// © designed by Dietmar Broda · 2025/2026.

const INK = '#2d3748';
const FAINT = '#a0aec0';

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

      {/* Trygon-Ebene: dreht langsam mit dem Staffel-Lauf mit (−360° über den vollen
          3-Runden-Zyklus = −120°/Runde). „der Orbiter dreht sich mit den Kugeln." */}
      <g>
        <polygon points="60,26 30.6,77 89.4,77" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="60" cy="26" r="2.4" fill={INK} />
        <circle cx="30.6" cy="77" r="2.4" fill={INK} />
        <circle cx="89.4" cy="77" r="2.4" fill={INK} />
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="-360 60 60" dur="9s" repeatCount="indefinite" />
      </g>

      {/* Kürzel-Ebene: Staffel-Lauf (Newton's Cradle). Gerichteter Impuls AP → CK → AK:
          jede Kugel fährt VOLL bis auf die Position der nächsten und stupst sie an, die
          nächste startet im selben Moment. 9 Etappen (3 Runden) = ein nahtloser Loop;
          jede Kugel umrundet einmal komplett. Innere Gegendrehung hält die Texte aufrecht. */}
      <g>
        {/* AP — Etappen 1, 4, 7 */}
        <g>
          <circle cx="60" cy="10" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="60" y="13.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
            <animateTransform attributeName="transform" type="rotate"
              values="0 60 10; 120 60 10; 120 60 10; 120 60 10; 240 60 10; 240 60 10; 240 60 10; 360 60 10; 360 60 10; 360 60 10"
              keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate"
            values="0 60 60; -120 60 60; -120 60 60; -120 60 60; -240 60 60; -240 60 60; -240 60 60; -360 60 60; -360 60 60; -360 60 60"
            keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
        </g>
        {/* CK — Etappen 2, 5, 8 */}
        <g>
          <circle cx="16.7" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="16.7" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
            <animateTransform attributeName="transform" type="rotate"
              values="0 16.7 85; 0 16.7 85; 120 16.7 85; 120 16.7 85; 120 16.7 85; 240 16.7 85; 240 16.7 85; 240 16.7 85; 360 16.7 85; 360 16.7 85"
              keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate"
            values="0 60 60; 0 60 60; -120 60 60; -120 60 60; -120 60 60; -240 60 60; -240 60 60; -240 60 60; -360 60 60; -360 60 60"
            keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
        </g>
        {/* AK — Etappen 3, 6, 9 */}
        <g>
          <circle cx="103.3" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <g>
            <text x="103.3" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
            <animateTransform attributeName="transform" type="rotate"
              values="0 103.3 85; 0 103.3 85; 0 103.3 85; 120 103.3 85; 120 103.3 85; 120 103.3 85; 240 103.3 85; 240 103.3 85; 240 103.3 85; 360 103.3 85"
              keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate"
            values="0 60 60; 0 60 60; 0 60 60; -120 60 60; -120 60 60; -120 60 60; -240 60 60; -240 60 60; -240 60 60; -360 60 60"
            keyTimes="0; 0.111; 0.222; 0.333; 0.444; 0.556; 0.667; 0.778; 0.889; 1" dur="9s" repeatCount="indefinite" />
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
