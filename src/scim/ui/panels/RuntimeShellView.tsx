// R01 · Runtime Shell — die App-Grundhülle auf dem Gerät. Erklär-/Aussichts-Ansicht
// (analog RuntimeFlowExplainer). Maßgeblich: docs/begriffs_karte.md (Shell-Paket vs.
// Runtime Shell) · docs/anthem_snapshot_spec.md (presence-origin · Reveal).

function Chip({ label, sub, tone }: { label: string; sub?: string; tone: 'app' | 'scim' }) {
  const c = tone === 'app' ? ['#ebf8ff', '#3182ce'] : ['#f0fff4', '#38a169'];
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', fontSize: 11, fontFamily: 'monospace',
      padding: '4px 9px', borderRadius: 4, background: c[0], border: `1px solid ${c[1]}`, color: '#2d3748',
    }}>
      {label}{sub && <span style={{ fontSize: 9.5, color: '#a0aec0' }}>{sub}</span>}
    </span>
  );
}

export default function RuntimeShellView() {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{
        display: 'inline-block', padding: '3px 8px', marginBottom: 14, fontSize: 10, fontFamily: 'monospace',
        color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
      }}>
        R01 · Runtime Shell · App-Grundhülle
      </div>

      <div style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, marginBottom: 14 }}>
        <strong>Shell (Paket) ≠ Runtime Shell.</strong> Das <em>Shell-Paket</em> (High-Shell/P07 + Deep-Shell/P08,
        bei Sensus Core Publishing geschnürt) ist der <em>ausgespielte Code</em>. Die <strong>Runtime Shell</strong>{' '}
        ist die <em>Grundhülle auf dem Gerät</em>, die diesen Code <strong>lädt und ausführt</strong>.
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Was sie ist</div>
      <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12, color: '#2d3748', lineHeight: 1.6 }}>
        <li>Bootet die App, lädt die Pakete <strong>gestaffelt</strong> (Shell → Origin), routet, fängt Fehler, hält den Lebenszyklus.</li>
        <li><strong>Wirt</strong> der lokal laufenden Engines (BCK · BAK · colorize · reveal-engine) — sie laufen <em>auf dem Gerät</em>, nicht in SCIM.</li>
        <li><strong>Uplink-/Downlink-Endpunkt</strong> der App: sendet <code>presence-origin</code>, empfängt das <code>Anthem</code>.</li>
      </ul>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Was sie NICHT ist</div>
      <div style={{ fontSize: 12, color: '#2d3748', lineHeight: 1.6, marginBottom: 14 }}>
        <strong>Kein Analyse-Tool.</strong> Die Analyse (presence → Last → Anthem) sitzt auf der SCIM-Seite beim
        <strong> Transmitter (P06)</strong>. Die Runtime Shell <em>konsumiert</em> nur das Ergebnis.
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 6 }}>Atem · zwei Enden von presence-origin</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <Chip label="Runtime Shell" sub="App · Gerät" tone="app" />
        <span style={{ color: '#3182ce', fontFamily: 'monospace', fontSize: 11 }}>—— presence-origin (Einatmen) ——▶</span>
        <Chip label="Transmitter" sub="P06 · SCIM" tone="scim" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Chip label="Runtime Shell" sub="App · Gerät" tone="app" />
        <span style={{ color: '#38a169', fontFamily: 'monospace', fontSize: 11 }}>◀—— Anthem-Snapshot (Ausatmen, 5 Min) ——</span>
        <Chip label="Transmitter" sub="P06 · SCIM" tone="scim" />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Aussicht — was hier passiert</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>
        <li>Beim <strong>1. Upload nach Shell-Install</strong> sendet sie das <code>presence-origin</code>-Signal (echt, kein Sim-Shortcut).</li>
        <li>Sie spielt den <strong>Boundary-Reveal</strong> (stilles Einloggen) und zieht Origin gestaffelt nach.</li>
        <li>Sie holt alle 5 Min das Anthem und lässt die Komfort-Kaskade (BAK) lokal über den Segment-Graph laufen.</li>
      </ul>
    </div>
  );
}
