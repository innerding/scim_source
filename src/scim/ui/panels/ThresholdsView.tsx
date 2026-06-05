// P01 · Thresholds (Plan T · T1) — die drei Schwellen vereint, gestaffelt
// untereinander: System → Region → Load. Jeder Abschnitt nutzt den bestehenden
// ColourAdjust (die echten Schwellen-Regler) der jeweiligen Threshold-ID.
// Horizont-Logik bleibt: System→Shell · Region→Origin · Load→Anthem.

import ColourAdjust from './ColourAdjust';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const SECTIONS = [
  { id: 'P01', title: 'System', sub: 'langfristig → Shell' },
  { id: 'P02', title: 'Region', sub: 'mittelfristig → Origin' },
  { id: 'P04', title: 'Load', sub: 'kurzfristig → Anthem' },
];

export default function ThresholdsView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          P01 · Thresholds · System · Region · Load (gestaffelt)
        </div>
        <AnthemCycleBadge />
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
      <div style={{
        marginTop: 14, padding: '8px 10px', fontSize: 10.5, lineHeight: 1.5,
        color: '#744210', background: '#fffaf0', border: '1px solid #feebc8', borderRadius: 6,
      }}>
        <strong>Hinweis · Sichtbarkeit am Gerät:</strong> Anthem deutet und packt die Last im
        <strong> 5-Minuten-Takt</strong> (anthem_snapshot_v1, je Segment, ohne Koordinaten). Eine
        geänderte Schwelle wird am Ziel-Device daher erst mit dem <strong>nächsten Snapshot</strong>
        {' '}sichtbar — nicht sofort. Das ist korrekt so. <strong>Geplant:</strong> ein
        <strong> Testmodus</strong>, der den Effekt sofort sichtbar macht (im MVP zeigt der
        Turbo-Slider der Runtime das vorab).
      </div>
    </div>
  );
}
