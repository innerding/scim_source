// P07 · High-Shell · Tab „Icon-Assets" — das EIGENE Icon-Asset-Set der High-Shell
// (Ziel-App-Buttons u.ä.). Läuft NICHT über den origin-capsuler (representation-
// unabhängig); im Vollausbau aus eigenem Speicher data/icons-shell/, dessen Inhalt
// durch den (Drawer-icon-)Cleaner gegangen sein muss, beziehbar. Zugang: Button →
// Modal (wie die Icon-Suchmaschine im Katalog).
import { useState } from 'react';
import { SHELL_ICONS } from '../../shell-assets/shellIconRegistry';

const H: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#7a4d00', margin: '12px 0 4px' };
const P: React.CSSProperties = { fontSize: 12.5, color: '#4a5568', lineHeight: 1.55, margin: '2px 0' };

function ShellIconModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,35,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, maxWidth: 640, width: '100%', maxHeight: '82vh',
        overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)', padding: '18px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a365d' }}>High-Shell · Icon-Assets</div>
          <button onClick={onClose} style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6, fontSize: 12, padding: '3px 9px', color: '#4a5568' }}>schließen ✕</button>
        </div>
        <div style={{ fontSize: 11.5, color: '#718096', marginBottom: 12 }}>
          Speicher <code>data/icons-shell/</code> · {SHELL_ICONS.length} Icons (durch den Cleaner gelaufen)
        </div>
        {SHELL_ICONS.length === 0 ? (
          <div style={{ fontSize: 12, color: '#a0aec0', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
            Speicher ist definiert, aber noch leer — die Buttons kommen (heute manuell, später via Drawer-Icon).
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {SHELL_ICONS.map((ic) => (
              <div key={ic.id} title={ic.id} style={{ width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: ic.svg }} />
                <span style={{ fontSize: 9, color: '#718096', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', whiteSpace: 'nowrap' }}>{ic.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HighShellIconAssets() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10, fontSize: 10, fontFamily: 'monospace',
        color: '#9c6a00', background: '#fff0d6', border: '1px solid #f6c177', borderRadius: 4,
      }}>
        Baukonzeptnotiz · High-Shell-Tab „Icon-Assets"
      </div>

      <p style={P}>
        <strong>High-Shell hat ein eigenes Icon-Asset-Set</strong> (Ziel-App-Buttons u.ä.). Es läuft
        <strong> NICHT über den origin-capsuler</strong> — der ist pro Representation; das hier ist
        Shell-Ebene, <strong>representation-unabhängig</strong>.
      </p>

      <div style={H}>Speicher &amp; Bezug</div>
      <p style={P}>
        Im Vollausbau aus einem <strong>eigenen Speicherplatz</strong> <code>data/icons-shell/</code> beziehbar,
        dessen Inhalt <strong>ebenfalls durch den Cleaner</strong> gegangen sein muss. <strong>Heute</strong>:
        manuell befüllt; Befüllung über den <strong>Drawer-Icon</strong> = Zukunft.
      </p>

      <div style={H}>Geschwister-Speicher (Abgrenzung)</div>
      <p style={P}>
        <code>data/icons</code> = Katalog/POI/Rep-Icons · <code>data/icons-shell</code> = <em>hier</em> (High-Shell) ·
        <code> data/icons-scim/custom</code> = SCIM-Editor-eigene Icons (inkl. packages) — alle durch denselben Cleaner.
      </p>

      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12, fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
          border: '1px solid #4299e1', background: '#ebf8ff', color: '#2b6cb0', fontWeight: 600,
        }}
      >⊞ Icon-Assets öffnen ({SHELL_ICONS.length})</button>

      {open && <ShellIconModal onClose={() => setOpen(false)} />}

      <div style={{ ...H, marginTop: 20 }}>Shell-Identität (erste Gedanken — nicht gebaut)</div>
      <p style={P}>
        Die Shell ist generisch, trägt aber für den <strong>Intro</strong> eine <strong>Identität</strong>. Vereinfacht
        (Konsens): die Shell trägt <strong>EIN Icon</strong> (nicht zwei) — und zwar das der <strong>größten vorhandenen
        Geometry</strong>, die die Shell tragen kann (Region &gt; Rep). Das reg-Icon wird in der Shell <em>gespart</em>,
        wenn keine Region da ist → das vereinfacht das Ganze.
      </p>
      <p style={P}>
        Perspektive: die Shell wird vermutlich die <strong>Instanz zur Koordination von Regionen &amp; Representationen</strong>.
        Erste Gedanken, nicht weiter ausgearbeitet.
      </p>
      <p style={{ ...P, color: '#a0aec0', fontStyle: 'italic' }}>
        Offene Intro-Fragen (notiert, ungelöst): Bezieht das Intro die Icons aus dem <em>Origin</em> (origin-asset-set
        via Capsuler) oder trägt die Shell sie selbst? Hat <em>jedes Origin</em> seine eigene Intro? Was beim
        Origin-Wechsel auf dem Gerät? Und: zeigt die Shell zunächst die <em>Region</em> (die hier noch keine Boundary hat)?
      </p>
    </div>
  );
}
