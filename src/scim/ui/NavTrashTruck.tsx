import { useState } from 'react';

// Müllwagen-Icon — Sammel-Toggle für die weitgehend ungenutzten Panels (der „Rest").
// Klick klappt die Liste auf/zu. Größe ~ Breite des Substrat-Tetraeders. Minimaler
// Stil, aber durch die Größe als Silhouette eines echten Müllwagens lesbar: Kabine
// mit Windschutz (links), hoher gerippter Aufbau, schräger Heck-Schütttrichter,
// zwei Räder, Heck-Lader-Aussparung. Interne Details = Negativraum in Nav-Hintergrund.

const BG = '#0d1520';   // Nav-Hintergrund = „Schnitt"-Farbe der Innendetails

export default function NavTrashTruck({
  isOpen, count, onClick, locked = false,
}: { isOpen: boolean; count: number; onClick: () => void; locked?: boolean }) {
  const [hover, setHover] = useState(false);
  const fill = isOpen ? '#5f7d9c' : hover ? '#52677f' : '#425468';
  const outline = isOpen ? 'var(--cm-b, #63b3ed)' : hover ? '#4a6a8a' : 'transparent';

  return (
    <div
      onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={locked ? 'Ungenutzte Panels — gesperrt' : `Ungenutzte Panels (${count}) — auf-/zuklappen`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: locked ? 'default' : 'pointer', userSelect: 'none', padding: '6px 0 2px',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 230 112"
        width="88%"
        style={{ maxWidth: 190, display: 'block', transition: 'all 0.15s' }}
        aria-label="Müllwagen — ungenutzte Panels"
      >
        {/* Karosserie-Silhouette: Kabine (li) → gerippter Aufbau → schräges Heck. */}
        <path
          d="M14,86 L14,54 L24,54 L32,40 L52,40 L56,30 L172,30 L200,48 L200,86 Z"
          fill={fill}
          stroke={outline}
          strokeWidth={isOpen ? 1.6 : 1}
        />
        {/* Räder (Silhouettenfarbe) mit Nabe (Negativraum). */}
        {[60, 162].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={90} r={13} fill={fill} stroke={outline} strokeWidth={isOpen ? 1.4 : 0.8} />
            <circle cx={cx} cy={90} r={4.5} fill={BG} />
          </g>
        ))}
        {/* Innendetails als Negativraum (Nav-Hintergrund). */}
        <g stroke={BG} strokeLinecap="round" fill="none">
          {/* Windschutzscheibe (Kabine). */}
          <polygon points="28,52 34,42 50,42 50,52" fill={BG} stroke="none" />
          {/* Naht Kabine↔Aufbau. */}
          <line x1={55} y1={34} x2={55} y2={82} strokeWidth={3} />
          {/* Aufbau-Rippen. */}
          <line x1={92}  y1={34} x2={92}  y2={82} strokeWidth={3} />
          <line x1={120} y1={34} x2={120} y2={82} strokeWidth={3} />
          <line x1={148} y1={34} x2={148} y2={82} strokeWidth={3} />
          {/* Horizontale Aufbau-Naht. */}
          <line x1={60} y1={46} x2={172} y2={46} strokeWidth={2.5} />
          {/* Schütttrichter-Kante am Heck. */}
          <line x1={174} y1={46} x2={198} y2={62} strokeWidth={3} />
        </g>
        {/* Heck-Lader-Aussparung (untere Heck-Ecke ausgeschnitten). */}
        <polygon points="192,86 200,86 200,72" fill={BG} />
      </svg>
      {/* dezenter Auf-/Zu-Hinweis + Anzahl. */}
      <div style={{
        fontFamily: 'monospace', fontSize: 8.5, letterSpacing: '0.08em',
        color: isOpen ? '#5f7d9c' : '#3d556f', marginTop: 2, textTransform: 'uppercase',
      }}>
        {isOpen ? '▾' : '▸'} ungenutzt ({count})
      </div>
    </div>
  );
}
