// EditorControlGrid — die neue Editor-Navigations-Fläche (ersetzt das kleine
// Tetraeder-Control). Direkt unter „Pathworks" in der Editor-Spalte:
//   Info-Reihe (Vorschau · Transfer · Versionen)  — flach/outline, sekundär
//   Hub-Button (breit, per Default aktiv)          — die Heim-Drehscheibe
//   Werkzeug-Reihe (Drawer · Katalog · Schwellen)  — an die gebundene Rep gekoppelt
// Darunter ein Erklär-Bereich, der den aktiven/gehoverten Eintrag beschreibt.
import { useState } from 'react';

interface Item { id: string; label: string; glyph: string; desc: string }

const HUB: Item = {
  id: 'workspace', label: 'Meine Representations', glyph: '◎',
  desc: 'Jede Representation ist die Einheit — über sie öffnest du ihre Werkzeuge (Drawer · Katalog · Schwellen). Speichern bleibt lokal; mit »Senden zur Review« geht sie an den Operator zum Committen.',
};
const INFO: Item[] = [
  { id: 'V03', label: 'Vorschau', glyph: '◉', desc: 'Monitor & QR — wie die Rep am Gerät ausgeliefert läuft.' },
  { id: 'P11', label: 'Transfer', glyph: '⏩', desc: 'Ausspielen nach R2 — der Operator-Schritt. Für dich: zur Info.' },
  { id: 'V01', label: 'Versionen', glyph: '⬡', desc: 'Versions-Bibliothek & Rollback der ausgespielten Origin-Versionen.' },
];
const TOOLS: Item[] = [
  { id: 'geometry_editor', label: 'Drawer', glyph: '▦', desc: 'Boundary, Wegnetz und POIs der Rep auf der Karte zeichnen.' },
  { id: 'catalog', label: 'Katalog', glyph: '☰', desc: 'POI-Bestand der Rep kuratieren (Buckets, Subkategorien).' },
  { id: 'P01', label: 'Schwellen', glyph: '≋', desc: 'Thresholds — Farb-/Last-Schwellen der Rep.' },
];
const ALL = [HUB, ...INFO, ...TOOLS];

const AMBER = 'rgba(251,191,36,0.95)';

export default function EditorControlGrid({ activeId, onJumpTo, toolsEnabled }: {
  activeId: string; onJumpTo: (id: string) => void; toolsEnabled: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const explainId = hover ?? (ALL.some((i) => i.id === activeId) ? activeId : HUB.id);
  const explain = ALL.find((i) => i.id === explainId) ?? HUB;

  // Einheitlicher Button. kind: 'info' (flach), 'hub' (breit), 'tool' (quadratisch).
  const cell = (it: Item, kind: 'info' | 'hub' | 'tool') => {
    const active = it.id === activeId;
    const disabled = kind === 'tool' && !toolsEnabled;
    const onClick = () => {
      if (disabled) { onJumpTo('workspace'); return; }   // erst Rep binden
      onJumpTo(it.id);
    };
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer', borderRadius: 8,
      fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
      opacity: disabled ? 0.4 : 1,
    };
    // Farbwelt je Zustand
    const activeStyle: React.CSSProperties = {
      background: AMBER, color: '#1a202c', border: `1px solid ${AMBER}`,
      boxShadow: '0 0 8px rgba(251,191,36,0.5)',
    };
    const infoIdle: React.CSSProperties = {
      background: 'transparent', color: 'rgba(190,210,235,0.75)', border: '1px solid rgba(140,170,210,0.30)',
    };
    const solidIdle: React.CSSProperties = {
      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.16)',
    };
    const tone = active ? activeStyle : kind === 'info' ? infoIdle : solidIdle;

    if (kind === 'hub') {
      return (
        <button
          onClick={onClick}
          onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
          style={{ ...base, ...tone, flexDirection: 'row', gap: 8, height: 48, width: '100%', font: 'inherit' }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{it.glyph}</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '0.01em' }}>{it.label}</span>
        </button>
      );
    }
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
        style={{ ...base, ...tone, flexDirection: 'column', gap: 3, aspectRatio: '1 / 1', width: '100%', font: 'inherit' }}
      >
        <span style={{ fontSize: kind === 'info' ? 15 : 19, lineHeight: 1 }}>{it.glyph}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700 }}>{it.label}</span>
      </button>
    );
  };

  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 16px', flexShrink: 0 }}>
      <div style={{ ...row3, marginBottom: 6 }}>{INFO.map((it) => <div key={it.id}>{cell(it, 'info')}</div>)}</div>
      <div style={{ marginBottom: 6 }}>{cell(HUB, 'hub')}</div>
      <div style={row3}>{TOOLS.map((it) => <div key={it.id}>{cell(it, 'tool')}</div>)}</div>

      {/* Erklär-Bereich: aktiver bzw. gehoverter Eintrag. */}
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.10)',
        fontFamily: 'system-ui, sans-serif', minHeight: 78,
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(251,191,36,0.92)', marginBottom: 3 }}>{explain.label}</div>
        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>{explain.desc}</div>
        {!toolsEnabled && (explain === HUB || TOOLS.includes(explain)) && (
          <div style={{ fontSize: 10, color: 'rgba(251,191,36,0.7)', marginTop: 6, fontStyle: 'italic' }}>
            Noch keine Rep gewählt — die Werkzeuge öffnen sich über den Hub.
          </div>
        )}
      </div>
    </div>
  );
}
