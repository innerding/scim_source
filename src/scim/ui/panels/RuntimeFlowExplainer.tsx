// Runtime-Flow & Legende (Erklärschritt, analog SimArchitecture) — macht den
// Route→Comfort→Ausweich-Flow + die Karten-Farben sichtbar erklärbar. Heimat
// P09 Move (BAK), über der Test-Route. Reine Doku.

function Chip({ label, tone }: { label: string; tone: 'load' | 'route' | 'check' | 'alt' }) {
  const c = {
    load: ['#f0fff4', '#68d391'], route: ['#ebf8ff', '#63b3ed'],
    check: ['#fff5f5', '#fc8181'], alt: ['#f0fff4', '#38a169'],
  }[tone];
  return (
    <span style={{
      fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
      background: c[0], border: `1px solid ${c[1]}`, color: '#2d3748', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function Swatch({ color, dashed, label, hint }: { color: string; dashed?: boolean; label: string; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, padding: '3px 0' }}>
      <span style={{
        width: 26, height: 0, flexShrink: 0,
        borderTop: `4px ${dashed ? 'dashed' : 'solid'} ${color}`,
      }} />
      <strong style={{ color: '#2d3748', flex: '0 0 130px' }}>{label}</strong>
      <span style={{ color: '#718096' }}>{hint}</span>
    </div>
  );
}

export default function RuntimeFlowExplainer() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Runtime-Flow &amp; Legende</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 8px', lineHeight: 1.45 }}>
        Wie aus der simulierten Last eine Routen-Empfehlung wird — und was die Farben auf der Karte bedeuten.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <Chip label="5-Min-Last" tone="load" />
        <span>→</span><Chip label="Colour-Mesh" tone="load" />
        <span>→</span><Chip label="Route wählen" tone="route" />
        <span>→</span><Chip label="Comfort-Check" tone="check" />
        <span>→</span><Chip label="Ausweichroute" tone="alt" />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', marginBottom: 2 }}>Zwei Sichten</div>
      <div style={{ fontSize: 11.5, color: '#2d3748', lineHeight: 1.5, marginBottom: 10 }}>
        <strong>Operator</strong> sieht die <em>Auslastung</em> als volle Skala (grün = ruhig … rot = voll) — „wo ist wie viel los".<br />
        <strong>User</strong> sieht seine <em>Route</em>: akzeptabel oder über seiner Comfort-Schwelle (= zu voll).
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', marginBottom: 2 }}>Karten-Legende</div>
      <div>
        <Swatch color="#38a169" label="Mesh-Gradient" hint="Segment-Auslastung (Operator-Sicht, grün→rot)" />
        <Swatch color="#3182ce" dashed label="blau gestrichelt" hint="die gewählte Test-Route" />
        <Swatch color="#e53e3e" label="rot" hint="Strecken über deiner Comfort-Schwelle (für den User: ausgeschlossen)" />
        <Swatch color="#2f855a" label="grün" hint="Ausweichroute — meidet die roten Strecken" />
      </div>
    </div>
  );
}
