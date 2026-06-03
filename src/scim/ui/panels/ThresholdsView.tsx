// P01 · Thresholds (Plan T · T1) — die drei Schwellen vereint, gestaffelt
// untereinander: System → Region → Load. Jeder Abschnitt nutzt den bestehenden
// ColourAdjust (die echten Schwellen-Regler) der jeweiligen Threshold-ID.
// Horizont-Logik bleibt: System→Shell · Region→Origin · Load→Anthem.

import ColourAdjust from './ColourAdjust';

const SECTIONS = [
  { id: 'P01', title: 'System', sub: 'langfristig → Shell' },
  { id: 'P02', title: 'Region', sub: 'mittelfristig → Origin' },
  { id: 'P04', title: 'Load', sub: 'kurzfristig → Anthem' },
];

export default function ThresholdsView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10, fontSize: 10, fontFamily: 'monospace',
        color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        P01 · Thresholds · System · Region · Load (gestaffelt)
      </div>
      {SECTIONS.map((s, i) => (
        <div key={s.id} style={{
          marginBottom: i < SECTIONS.length - 1 ? 16 : 0,
          paddingBottom: i < SECTIONS.length - 1 ? 14 : 0,
          borderBottom: i < SECTIONS.length - 1 ? '1px solid #edf2f7' : 'none',
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>
            {s.title} <span style={{ fontSize: 10.5, fontWeight: 400, color: '#a0aec0' }}>· {s.sub}</span>
          </div>
          <ColourAdjust panelId={s.id} />
        </div>
      ))}
    </div>
  );
}
