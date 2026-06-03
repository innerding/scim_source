// P06 · Transmitter — der Atem (Plan T · T5). Der Transmitter spielt das Anthem
// aus (Ausatmen); die drei Bögen sind die Stationen des Atems. Erklär-/Übersichts-
// Ansicht. Siehe docs/zielbild_ausbauplan.md (Plan T) · docs/begriffs_karte.md.

import { AnthemCycleBadge } from '../AnthemCycleInfo';

type Tone = 'ein' | 'deuten' | 'packen' | 'aus';
const TONES: Record<Tone, [string, string]> = {
  ein: ['#f0fff4', '#38a169'],     // Telco — einatmen
  deuten: ['#fffaf0', '#dd6b20'],  // Thresholds — deuten
  packen: ['#faf5ff', '#9f7aea'],  // Coder — packen
  aus: ['#ebf8ff', '#3182ce'],     // Transmitter — ausatmen
};

function Chip({ label, sub, tone }: { label: string; sub: string; tone: Tone }) {
  const [bg, bd] = TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0,
      fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
      background: bg, border: `1px solid ${bd}`, color: '#2d3748', whiteSpace: 'nowrap',
    }}>
      {label}<span style={{ fontSize: 9.5, color: '#a0aec0' }}>{sub}</span>
    </span>
  );
}
const Arrow = () => <span style={{ color: '#cbd5e0', flexShrink: 0 }}>→</span>;

export default function TransmissionView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          P06 · Transmitter · der Atem
        </div>
        <AnthemCycleBadge />
      </div>
      <div style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, marginBottom: 12 }}>
        Der Transmitter <strong>atmet</strong> — er spielt das <strong>Anthem</strong> aus. Die drei Bögen sind die
        Stationen des Atems.
      </div>

      {/* Atem-Kette — einzeilig (nowrap), bei Bedarf horizontal scrollbar. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
        <Chip label="Telco" sub="einatmen · P04" tone="ein" />
        <Arrow />
        <Chip label="Thresholds" sub="deuten · P01" tone="deuten" />
        <Arrow />
        <Chip label="Coder" sub="packen · P02" tone="packen" />
        <Arrow />
        <Chip label="Transmitter" sub="ausatmen · P06" tone="aus" />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Die Stationen</div>
      <div style={{ fontSize: 11.5, color: '#2d3748', lineHeight: 1.7, marginBottom: 12 }}>
        <div><span style={{ color: TONES.ein[1], fontWeight: 700 }}>Telco (P04)</span> · einatmen — presence-Intake (Gate) · Sim-Telco · Normalization (Rohlast → [0..1]).</div>
        <div><span style={{ color: TONES.deuten[1], fontWeight: 700 }}>Thresholds (P01)</span> · deuten — System → Region → Load (Schwellen).</div>
        <div><span style={{ color: TONES.packen[1], fontWeight: 700 }}>Coder (P02)</span> · packen — Anthem-Encoder: Last → <strong>segId-Snapshot</strong>.</div>
        <div><span style={{ color: TONES.aus[1], fontWeight: 700 }}>Transmitter (P06)</span> · ausatmen — <strong>Anthem-Auslieferung</strong> (alle 5 Min) an die Runtime. Scheduling lebt hier.</div>
      </div>

      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.55 }}>
        Nach dem Atem: <strong>Runtime</strong> dekodiert + lebt · <strong>Bibliothek</strong> erinnert (Versionen).
        Shell/Origin/Anthem sind Publishing-Begriffe — der Atem trägt das <em>Anthem</em> hinaus.
      </div>
    </div>
  );
}
