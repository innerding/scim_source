// EditorControlGrid — die Editor-Navigations-Fläche (ersetzt das Mini-Tetraeder).
// Direkt unter „Pathworks" in der Editor-Spalte:
//   Info-Reihe (Vorschau · Transfer · Versionen)  — flach/outline, sekundär
//   Hub-Button (breit, per Default aktiv)          — die Heim-Drehscheibe
//   Werkzeug-Reihe (Drawer · Katalog · Schwellen)  — an die gebundene Rep gekoppelt
// KEINE Button-Beschriftung: nur zentrierte Icons + Tooltips; der Erklär-Bereich
// darunter beschreibt den aktiven/gehoverten Eintrag. Die Icons kommen aus DERSELBEN
// Quelle wie die Panel-Header (PanelIcon / PANEL_GLYPHS, keyed nach Panel-ID) →
// Button-Icon und Header-Icon sind je Panel garantiert identisch.
import { useState } from 'react';
import PanelIcon from './PanelIcon';

interface Item { id: string; label: string; desc: string }

const HUB: Item = {
  id: 'workspace', label: 'Meine Representations',
  desc: 'Jede Representation ist die Einheit — über sie öffnest du ihre Werkzeuge (Drawer · Katalog · Schwellen). Speichern bleibt lokal; mit »Senden zur Review« geht sie an den Operator zum Committen.',
};
const INFO: Item[] = [
  { id: 'V03', label: 'Vorschau', desc: 'Monitor & QR — wie die Rep am Gerät ausgeliefert läuft.' },
  { id: 'P11', label: 'Transfer', desc: 'Ausspielen nach R2 — der Operator-Schritt. Für dich: zur Info.' },
  { id: 'V01', label: 'Versionen', desc: 'Versions-Bibliothek & Rollback der ausgespielten Origin-Versionen.' },
];
const TOOLS: Item[] = [
  { id: 'geometry_editor', label: 'Drawer', desc: 'Boundary, Wegnetz und POIs der Rep auf der Karte zeichnen.' },
  { id: 'catalog', label: 'Katalog', desc: 'POI-Bestand der Rep kuratieren (Buckets, Subkategorien).' },
  { id: 'P01', label: 'Schwellen', desc: 'Thresholds — Farb-/Last-Schwellen der Rep.' },
];
const ALL = [HUB, ...INFO, ...TOOLS];

const AMBER = 'rgba(251,191,36,0.95)';

export default function EditorControlGrid({ activeId, onJumpTo, toolsEnabled }: {
  activeId: string; onJumpTo: (id: string) => void; toolsEnabled: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const explainId = hover ?? (ALL.some((i) => i.id === activeId) ? activeId : HUB.id);
  const explain = ALL.find((i) => i.id === explainId) ?? HUB;

  const cell = (it: Item, kind: 'info' | 'hub' | 'tool') => {
    const active = it.id === activeId;
    const disabled = kind === 'tool' && !toolsEnabled;
    const onClick = () => { onJumpTo(disabled ? 'workspace' : it.id); };
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer', borderRadius: 8, padding: 0,
      boxSizing: 'border-box', font: 'inherit',
      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
      opacity: disabled ? 0.4 : 1,
    };
    const activeStyle: React.CSSProperties = {
      background: AMBER, color: '#1a202c', border: `1px solid ${AMBER}`,
      boxShadow: '0 0 8px rgba(251,191,36,0.5)',
    };
    const infoIdle: React.CSSProperties = {
      background: 'transparent', color: 'rgba(190,210,235,0.78)', border: '1px solid rgba(140,170,210,0.30)',
    };
    const solidIdle: React.CSSProperties = {
      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.86)', border: '1px solid rgba(255,255,255,0.16)',
    };
    const tone = active ? activeStyle : kind === 'info' ? infoIdle : solidIdle;
    const dims = kind === 'hub'
      ? { height: 48, width: '100%' as const }
      : { aspectRatio: '1 / 1' as const, width: '100%' as const };
    const iconSize = kind === 'hub' ? 26 : kind === 'info' ? 21 : 24;
    return (
      <button
        title={it.label}
        onClick={onClick}
        onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
        style={{ ...base, ...tone, ...dims }}
      >
        <PanelIcon id={it.id} size={iconSize} />
      </button>
    );
  };

  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 16px', flexShrink: 0 }}>
      <div style={{ ...row3, marginBottom: 6 }}>{INFO.map((it) => <div key={it.id}>{cell(it, 'info')}</div>)}</div>
      <div style={{ marginBottom: 6 }}>{cell(HUB, 'hub')}</div>
      <div style={row3}>{TOOLS.map((it) => <div key={it.id}>{cell(it, 'tool')}</div>)}</div>

      {/* Erklär-Bereich: aktiver bzw. gehoverter Eintrag (ersetzt die Button-Texte). */}
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
