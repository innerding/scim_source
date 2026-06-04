// Trygon-Loop (TL) — das Kernfunktions-Emblem. Sachlich, nüchtern, monochrom.
//   AP = Anthem-Pulse · CK = Comfort Kernel · AK = Avoidance Kernel · TL = der Loop.
// Statisch (Default): Kürzel an den Trygon-Ecken, TL-Scheibe r 13,5.
// animated=true: zwei UNABHÄNGIGE Ebenen —
//   · Kürzel (mit eigener kleiner Scheibe) drehen kontinuierlich auf der Ring-Bahn (f0.6 ≈ 10 s/Umdrehung)
//   · das Trygon springt alle 5 s um 180° weiter (gleiche Richtung)
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

      {/* Trygon-Ebene: springt alle 5 s um 180° weiter (gleiche Richtung) */}
      <g>
        <polygon points="60,26 30.6,77 89.4,77" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="60" cy="26" r="2.4" fill={INK} />
        <circle cx="30.6" cy="77" r="2.4" fill={INK} />
        <circle cx="89.4" cy="77" r="2.4" fill={INK} />
        <animateTransform attributeName="transform" type="rotate"
          values="0 60 60; 0 60 60; 180 60 60; 180 60 60; 360 60 60"
          keyTimes="0; 0.4; 0.5; 0.9; 1"
          dur="10s" repeatCount="indefinite" />
      </g>

      {/* Kürzel-Ebene: AP/CK/AK mit eigener Scheibe (r 9) auf der Ring-Bahn, f0.6 ≈ 10 s/Umdrehung */}
      <g>
        <g>
          <circle cx="60" cy="10" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <text x="60" y="13.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AP</text>
          <animateTransform attributeName="transform" type="rotate" from="0 60 10" to="-360 60 10" dur="12.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx="16.7" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <text x="16.7" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">CK</text>
          <animateTransform attributeName="transform" type="rotate" from="0 16.7 85" to="-360 16.7 85" dur="12.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx="103.3" cy="85" r="9" fill="#fff" stroke={INK} strokeWidth="1" />
          <text x="103.3" y="88.4" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.5" fill={INK} fontFamily="system-ui, sans-serif">AK</text>
          <animateTransform attributeName="transform" type="rotate" from="0 103.3 85" to="-360 103.3 85" dur="12.5s" repeatCount="indefinite" />
        </g>
        {/* Bahn-Drehung der ganzen Kürzel-Ebene (f0.75 ≈ 12,5 s); Gegendrehung oben hält die Texte aufrecht */}
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="12.5s" repeatCount="indefinite" />
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
