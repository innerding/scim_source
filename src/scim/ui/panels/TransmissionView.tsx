// P06 · Transmission Schwellen — die Heimat des Anthem-Atems: Transmitter +
// Thresholds + Anthem-Encoder. Erklär-/Ordnungs-Ansicht (zum „bei der Hand haben").
// Konsens 2026-06-02: in der Praxis spielt Anthem ALLE Thresholds aus, auch wenn
// System/Region thematisch zu Shell/Origin gehören → Kapitel „Transmission Schwellen".

import type { ReactNode } from 'react';

function Tone({ c, children }: { c: string; children: ReactNode }) {
  return <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
}

export default function TransmissionView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 620 }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10, fontSize: 10, fontFamily: 'monospace',
        color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        P06 · Transmission Schwellen · Atem (Anthem)
      </div>

      <div style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, marginBottom: 12 }}>
        Der <strong>Transmitter</strong> baut <strong>Anthem</strong> (den Atem). In der Praxis ist es
        <strong> Anthem, der alle Schwellen ausspielt</strong> — auch wenn System/Region thematisch zu
        Shell/Origin gehören. Darum hier zusammengefasst.
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Was zur Transmission gehört</div>
      <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12, color: '#2d3748', lineHeight: 1.6 }}>
        <li><strong>Transmitter (P06)</strong> — Atem-Macher, baut Anthem.</li>
        <li><strong>Anthem-Encoder</strong> (neu) — serialisiert Last → segId-Snapshot. Wohnt bei P06.</li>
        <li><strong>presence-origin-Intake</strong> — Einatmen/Gate (Uplink „ich bin in origin-boundary X").</li>
        <li><strong>5-Min-Sim-Clock / Time-Turbo</strong> — der Takt der Snapshots.</li>
        <li><em>später:</em> <strong>Anthem-Auslieferung / Scheduling</strong> (Worker <code>/api/anthem/:repId</code>).</li>
      </ul>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Die drei Schwellen ↔ drei Horizonte</div>
      <div style={{ fontSize: 11.5, color: '#2d3748', lineHeight: 1.7, marginBottom: 10, fontFamily: 'ui-monospace, Menlo, monospace' }}>
        <div><Tone c="#38a169">Load (P04)</Tone> · kurz → <strong>Anthem</strong> (Telco-Quelle, die der Transmitter liest)</div>
        <div><Tone c="#3182ce">Region (P02)</Tone> · mittel → <strong>Origin</strong></div>
        <div><Tone c="#718096">System (P01)</Tone> · lang → <strong>Shell</strong></div>
      </div>
      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.55 }}>
        Schnitt gewählt: <strong>weit</strong> — alle Thresholds unter dem Anthem-Dach (Empfangsschirme + Sender),
        weil Anthem sie ausspielt. Die Horizont-Zuordnung bleibt als innere Logik erhalten.
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', margin: '14px 0 4px' }}>Row-Ordnung — noch anzudenken (nicht gebaut)</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#a0aec0', lineHeight: 1.6 }}>
        <li>Eigenes Navigator-Kapitel „Transmission Schwellen": Transmitter · Thresholds (P01/P02/P04) · Anthem-Encoder.</li>
        <li><strong>TargetAppUI (P03)</strong> gehört wohl zu <strong>P07 High-Shell</strong> — Inhalts-Bewertung später.</li>
        <li><strong>Route + Layer (P10)</strong> → vermutlich in Thresholds / geht in Engine-Prep auf — offen.</li>
      </ul>
    </div>
  );
}
