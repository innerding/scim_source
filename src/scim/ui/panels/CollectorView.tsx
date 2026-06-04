// P11 · Collector-Path — der Cross-Rep-Fan-in auf dem Publishing-Layer. Aggregiert
// den Katalog Nation → Region → Representation aus den per-Rep-Fakten, die jeder
// Origin-Capsuler deklariert, und speist damit den Launcher. NICHT Deep-Shell,
// NICHT der Capsuler selbst — Publishing. shell-run-Schritt 'collector'.
import { ShellRunBadge } from '../ShellRunInfo';

function Row({ tone, head, body }: { tone: string; head: string; body: string }) {
  return (
    <div style={{ border: `1px solid ${tone}40`, borderLeft: `3px solid ${tone}`, borderRadius: 8, padding: '9px 12px', background: `${tone}08`, marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: tone }}>{head}</div>
      <div style={{ fontSize: 11.5, color: '#4a5568', lineHeight: 1.5, marginTop: 2 }}>{body}</div>
    </div>
  );
}

export default function CollectorView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#2c7a7b', background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: 4 }}>
          P11 · Collector-Path · Publishing-Aggregat
        </div>
        <ShellRunBadge compact />
      </div>

      <p style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, margin: '0 0 14px' }}>
        Der <strong>Cross-Rep-Fan-in</strong>: aggregiert den Katalog <strong>Nation → Region → Representation</strong>
        aus den <strong>per-Rep-Fakten</strong>, die jeder Origin-Capsuler deklariert (Nation/Region/Icon). Wohnt auf dem
        <strong> Publishing-Layer</strong> — NICHT in der Deep-Shell (deren Animationen sind generisch) und NICHT im
        Capsuler (der ist per-Rep, kann nicht über-Rep aggregieren). Konsument: der <strong>Launcher</strong>.
      </p>

      <Row tone="#3182ce" head="Origin-Capsuler (je Rep)" body="deklariert die per-Rep-Tatsache: zu welcher Nation/Region die Rep gehört, welches reg-/rep-Icon." />
      <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: 16, margin: '-2px 0 6px' }}>⇊ fan-in</div>
      <Row tone="#2c7a7b" head="Collector-Path (Publishing, P11/V01-V02)" body="aggregiert die Einzeltatsachen zum Katalog Nation→Region→Rep. Quelle: REGION_MAP / V02. Nation-Ebene = Minimal-Pfad (geometry.nation)." />
      <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: 16, margin: '-2px 0 6px' }}>⇊ feed</div>
      <Row tone="#805ad5" head="Launcher (globale Auswahl)" body="rendert die Kacheln und löst die Bundle-Auslieferung aus — der eigentliche Konsument." />

      <div style={{ fontSize: 11, color: '#718096', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 12px', lineHeight: 1.55, marginTop: 8 }}>
        <strong>Stand:</strong> offener Posten. Nation-Minimal-Pfad gebaut (`geometry.nation` → Workspace-Registry). Aggregat + Launcher noch zu bauen.
      </div>
    </div>
  );
}
