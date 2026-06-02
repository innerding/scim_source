// Sim-Architektur-Ansicht (P06 Transmitter) — macht die sonst unsichtbare
// Simulations-Pipeline + die Engine sichtbar/nachvollziehbar. Reine Doku, kein
// Verhalten. Klärt die Naht Sim ↔ echtes Telco: alles über dem 5-Min-Signal ist
// Sim (später Telco), alles darunter ist die quellen-agnostische Engine, die
// Sensus Core als Engine-Prep in die Shell ordert.

interface Fn { name: string; tut: string; file: string; }

const SIM_FUNCS: Fn[] = [
  { name: 'arrivalCurve(h)', tut: 'Sonntags-Tageskurve (zwei Schwünge + Stundentakt)', file: 'playbook.ts' },
  { name: 'buildFlows(edges, net, pois)', tut: 'Bus→Attraktor routen → OD-Flows', file: 'playbook.ts' },
  { name: 'playbookLoad(net, flows, h)', tut: 'Flows × Kurve → Pers/10 m → load je Segment', file: 'playbook.ts' },
  { name: 'simClock (Turbo)', tut: '5-Min-Snapshots, Zeitraffer', file: 'simClock.ts' },
];

const ENGINE_FUNCS: Fn[] = [
  { name: 'stretchAverages(net, loads)', tut: 'Ø-Last je Strecke (BCK/BAK-Basis)', file: 'anthemSim.ts' },
  { name: 'normalizeLoads(spread, floor)', tut: 'System-Normalisierung (Spreizung + Mindest-Rot)', file: 'anthemSim.ts' },
  { name: 'colorize(palette, spectrum, bias)', tut: 'load → Farbe (= G), durchgehend (§2a)', file: 'loadColour.ts' },
  { name: 'classifyStretches(degradier, ausschluss)', tut: 'degrade / exclude je Strecke (BCK)', file: 'anthemSim.ts' },
  { name: 'netSegments · coveredSegmentIds', tut: 'Pfad↔Segment (BAK/Comfort)', file: 'netRoute.ts' },
];

function Chip({ label, tone }: { label: string; tone: 'sim' | 'sig' | 'engine' | 'out' }) {
  const bg = tone === 'sim' ? '#fffaf0' : tone === 'sig' ? '#ebf8ff' : tone === 'engine' ? '#f0fff4' : '#f7fafc';
  const bd = tone === 'sim' ? '#f6ad55' : tone === 'sig' ? '#63b3ed' : tone === 'engine' ? '#68d391' : '#cbd5e0';
  return (
    <span style={{
      fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
      background: bg, border: `1px solid ${bd}`, color: '#2d3748', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function FnTable({ title, sub, funcs, tone }: { title: string; sub: string; funcs: Fn[]; tone: 'sim' | 'engine' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: tone === 'sim' ? '#9c4221' : '#22543d' }}>{title}</div>
      <div style={{ fontSize: 10.5, color: '#718096', marginBottom: 6 }}>{sub}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {funcs.map((f) => (
          <div key={f.name} style={{ display: 'flex', gap: 8, fontSize: 11.5, lineHeight: 1.4, padding: '3px 0', borderBottom: '1px solid #edf2f7' }}>
            <code style={{ flex: '0 0 220px', color: '#1a365d' }}>{f.name}</code>
            <span style={{ flex: 1, color: '#2d3748' }}>{f.tut}</span>
            <span style={{ flex: '0 0 92px', color: '#a0aec0', fontFamily: 'monospace', fontSize: 10 }}>{f.file}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SimArchitecture() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Sim-Architektur · Transmitter</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 10px', lineHeight: 1.45 }}>
        Die Quelle (links) erzeugt alle 5 Min ein Last-Signal; die Engine (rechts, quellen-agnostisch)
        macht daraus Farbe/Mask/Route. Sensus Core ordert die Engine-Funktionen in die Shell.
      </div>

      {/* Pipeline mit der Naht Sim ↔ Telco */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <Chip label="playbook" tone="sim" />
        <span>→</span><Chip label="flows" tone="sim" />
        <span>→</span><Chip label="5-Min-Snapshot" tone="sig" />
        <span style={{ color: '#e53e3e', fontWeight: 700, padding: '0 4px' }}>┊ Naht ┊</span>
        <Chip label="normalize → colorize → classify" tone="engine" />
        <span>→</span><Chip label="Mesh" tone="out" />
      </div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', marginBottom: 14 }}>
        Naht = das 5-Min-Signal: <strong>links</strong> Sim (später echtes Telco) · <strong>rechts</strong> Engine (bleibt, egal welche Quelle).
      </div>

      <FnTable
        title="Signalquelle (Sim → später echtes Telco)"
        sub="erzeugt das 5-Min-Last-Signal (Pers/10 m je Segment); echtes Telco liefert dasselbe Format"
        funcs={SIM_FUNCS} tone="sim"
      />
      <FnTable
        title="Engine (Shell — quellen-agnostisch, von Sensus Core geordert)"
        sub="arbeitet identisch auf Sim- wie auf echter Telco-Last"
        funcs={ENGINE_FUNCS} tone="engine"
      />
    </div>
  );
}
