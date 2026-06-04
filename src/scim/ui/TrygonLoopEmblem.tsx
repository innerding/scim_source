// Trygon-Loop (TL) — das Kernfunktions-Emblem. Sachlich, nüchtern, monochrom.
// Trygon (Dreieck) der drei Funktionen, in der Mitte TL, umgeben vom Loop-Ring.
//   AP = Anthem-Pulse      (misst die Last — Voraussetzung)
//   CK = Comfort Kernel    (beobachtet den Comfort)
//   AK = Avoidance Kernel  (handelt: Deeskalation)
// Loop: AP → CK → AK → verändert das Aufkommen → AP misst neu.
// designed by Dietmar Broda · 2025/2026. Konsens 2026-06-04 (Redesign).

const INK = '#2d3748';
const FAINT = '#a0aec0';

export function TrygonLoopEmblem({ size = 96, withLegend = true }: { size?: number; withLegend?: boolean }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Trygon-Loop (TL)" style={{ flexShrink: 0 }}>
      {/* Loop-Ring */}
      <circle cx="60" cy="60" r="54" fill="none" stroke={FAINT} strokeWidth="1" />
      {/* Trygon */}
      <polygon points="60,22 24,92 96,92" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Ecken-Knoten */}
      <circle cx="60" cy="22" r="2.6" fill={INK} />
      <circle cx="24" cy="92" r="2.6" fill={INK} />
      <circle cx="96" cy="92" r="2.6" fill={INK} />
      {/* Kürzel an den Ecken */}
      <text x="60" y="14" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
      <text x="15" y="106" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
      <text x="105" y="106" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
      {/* Zentrum: TL im Kreis (statt Blitz) */}
      <circle cx="60" cy="62" r="15" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <text x="60" y="67" textAnchor="middle" fontSize="14" fontWeight="700" letterSpacing="1" fill={INK} fontFamily="system-ui, sans-serif">TL</text>
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
        <div style={{ color: '#718096', marginTop: 5, fontSize: 10 }}>designed by Dietmar Broda · 2025/2026</div>
      </div>
    </div>
  );
}
