// Trygon-Loop (TL) — das Kernfunktions-Emblem. Sachlich, nüchtern, monochrom.
// Trygon (Dreieck) der drei Funktionen, in der Mitte TL, umgeben vom Loop-Ring.
// Alle Geometrien teilen den Mittelpunkt (60,60) → zentriert, mit Luft.
//   AP = Anthem-Pulse      (misst die Last — Voraussetzung)
//   CK = Comfort Kernel    (beobachtet den Comfort)
//   AK = Avoidance Kernel  (handelt: Deeskalation)
// Loop: AP → CK → AK → verändert das Aufkommen → AP misst neu.
// © designed by Dietmar Broda · 2025/2026. Redesign 2026-06-04 (zentriert).

const INK = '#2d3748';
const FAINT = '#a0aec0';

export function TrygonLoopEmblem({ size = 96, withLegend = true, animated = false }: { size?: number; withLegend?: boolean; animated?: boolean }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Trygon-Loop (TL)" style={{ flexShrink: 0 }}>
      {/* Loop-Ring (Mittelpunkt 60,60) */}
      <circle cx="60" cy="60" r="50" fill="none" stroke={FAINT} strokeWidth="1" />
      {/* Trygon — Schwerpunkt = (60,60), Circumradius 34 */}
      <polygon points="60,26 30.6,77 89.4,77" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Ecken-Knoten */}
      <circle cx="60" cy="26" r="2.4" fill={INK} />
      <circle cx="30.6" cy="77" r="2.4" fill={INK} />
      <circle cx="89.4" cy="77" r="2.4" fill={INK} />
      {/* Kürzel an den Ecken (mit Luft) */}
      <text x="60" y="17" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
      <text x="22" y="92" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
      <text x="98" y="92" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
      {/* Zentrum: TL im Kreis (zentriert, statt Blitz) */}
      <circle cx="60" cy="60" r="13.5" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <text x="60" y="64.5" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">TL</text>
      {/* Loop-Animation: ein Punkt umkreist den Ring (AP → CK → AK → …) */}
      {animated && (
        <g>
          <circle cx="60" cy="10" r="3.2" fill={INK} />
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="7s" repeatCount="indefinite" />
        </g>
      )}
    </svg>
  );

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
