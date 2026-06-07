// Cloud — Kosmologie-Element (System-Icon) im Spalt zwischen Mond und Transmissionsfeld.
// Heimat der our-side Eintritts-/Auslieferungs-Flächen (Launcher · globe-switcher · collector).
// Inline-SVG aus src/assets/system (currentColor-färbbar); die fill-/body-Fläche ist die
// Klickfläche. Größe ~ Breite des Substrats. D1 — Probe-Platzierung (Klick provisorisch).
import { useState } from 'react';
import cloudRaw from '../../assets/system/cosmo-cloud.svg?raw';

export default function NavCloud({ onClick, active = false }: { onClick?: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  const color = active ? '#7aa0c6' : hover ? '#6f93b8' : '#52708f';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Cloud — Auslieferung & Eintritt (Launcher · globe-switcher · collector)"
      style={{
        display: 'flex', justifyContent: 'center', flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default', color, margin: '-24px 0 6px 0',
        transition: 'color 0.15s', userSelect: 'none',
      }}
    >
      <style>{`.nav-cloud svg { display: block; width: 100%; height: auto; }`}</style>
      <div
        className="nav-cloud"
        style={{
          width: 114, lineHeight: 0,   /* f0.6 von 190 */
          filter: (active || hover) ? 'drop-shadow(0 0 7px rgba(99,179,237,0.40))' : undefined,
          transition: 'filter 0.15s',
        }}
        dangerouslySetInnerHTML={{ __html: cloudRaw }}
      />
    </div>
  );
}
