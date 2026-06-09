// EditorControlGrid — die Editor-Navigations-Fläche (ersetzt das Mini-Tetraeder).
// Direkt unter „Pathworks" in der Editor-Spalte:
//   Info-Reihe (Vorschau · Transfer · Versionen)  — flach/outline, sekundär
//   Hub-Button (breit, per Default aktiv)          — die Heim-Drehscheibe
//   Werkzeug-Reihe (Drawer · Katalog · Schwellen)  — an die gebundene Rep gekoppelt
// KEINE Button-Beschriftung: nur zentrierte Icons + Tooltips; der Erklär-Bereich
// darunter beschreibt den aktiven/gehoverten Eintrag. Icons = ein homogenes, selbst
// gezeichnetes Line-Set (24×24, currentColor, gleiche Strichstärke/Rundungen).
import { useState } from 'react';

interface Item { id: string; label: string; icon: IconName; desc: string }
type IconName = 'hub' | 'vorschau' | 'transfer' | 'versionen' | 'drawer' | 'katalog' | 'schwellen';

const HUB: Item = {
  id: 'workspace', label: 'Meine Representations', icon: 'hub',
  desc: 'Jede Representation ist die Einheit — über sie öffnest du ihre Werkzeuge (Drawer · Katalog · Schwellen). Speichern bleibt lokal; mit »Senden zur Review« geht sie an den Operator zum Committen.',
};
const INFO: Item[] = [
  { id: 'V03', label: 'Vorschau', icon: 'vorschau', desc: 'Monitor & QR — wie die Rep am Gerät ausgeliefert läuft.' },
  { id: 'P11', label: 'Transfer', icon: 'transfer', desc: 'Ausspielen nach R2 — der Operator-Schritt. Für dich: zur Info.' },
  { id: 'V01', label: 'Versionen', icon: 'versionen', desc: 'Versions-Bibliothek & Rollback der ausgespielten Origin-Versionen.' },
];
const TOOLS: Item[] = [
  { id: 'geometry_editor', label: 'Drawer', icon: 'drawer', desc: 'Boundary, Wegnetz und POIs der Rep auf der Karte zeichnen.' },
  { id: 'catalog', label: 'Katalog', icon: 'katalog', desc: 'POI-Bestand der Rep kuratieren (Buckets, Subkategorien).' },
  { id: 'P01', label: 'Schwellen', icon: 'schwellen', desc: 'Thresholds — Farb-/Last-Schwellen der Rep.' },
];
const ALL = [HUB, ...INFO, ...TOOLS];

const AMBER = 'rgba(251,191,36,0.95)';

// ── Homogenes Line-Icon-Set (24×24, stroke=currentColor) ────────────────────
function Icon({ name, size }: { name: IconName; size: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, style: { display: 'block' as const },
  };
  switch (name) {
    case 'hub':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="4.6" r="1.7" />
          <circle cx="5" cy="17.2" r="1.7" /><circle cx="19" cy="17.2" r="1.7" />
          <line x1="12" y1="9.6" x2="12" y2="6.3" />
          <line x1="10" y1="13.4" x2="6.4" y2="15.8" />
          <line x1="14" y1="13.4" x2="17.6" y2="15.8" />
        </svg>
      );
    case 'vorschau':
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="2.2" />
          <line x1="10.5" y1="18.3" x2="13.5" y2="18.3" />
        </svg>
      );
    case 'transfer':
      return (
        <svg {...common}>
          <line x1="12" y1="15.5" x2="12" y2="5.5" />
          <polyline points="8 9 12 5 16 9" />
          <line x1="6" y1="18.5" x2="18" y2="18.5" />
        </svg>
      );
    case 'versionen':
      return (
        <svg {...common}>
          <polygon points="12 3.5 20 7.5 12 11.5 4 7.5" />
          <polyline points="4 11.5 12 15.5 20 11.5" />
          <polyline points="4 15.5 12 19.5 20 15.5" />
        </svg>
      );
    case 'drawer':
      return (
        <svg {...common}>
          <path d="M17 3 a2.83 2.83 0 0 1 4 4 L7.5 20.5 L2 22 L3.5 16.5 Z" />
          <line x1="14.5" y1="5.5" x2="18.5" y2="9.5" />
        </svg>
      );
    case 'katalog':
      return (
        <svg {...common}>
          <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.6" cy="6" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.6" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.6" cy="18" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'schwellen':
      return (
        <svg {...common}>
          <line x1="4" y1="7" x2="20" y2="7" /><circle cx="9" cy="7" r="2.1" />
          <line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2.1" />
          <line x1="4" y1="17" x2="20" y2="17" /><circle cx="7" cy="17" r="2.1" />
        </svg>
      );
  }
}

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
        <Icon name={it.icon} size={iconSize} />
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
