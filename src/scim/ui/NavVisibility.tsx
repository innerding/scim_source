// Visibility — operator-only Sperr-Registry. Listet, was für non-operator gesperrt ist
// (alles unter dem Komposit-Tetraeder). Selbst-dokumentierend: Visibility steht mit drin.
// Einziges Element, das für non-operator KOMPLETT verschwindet (Mount-Gate im Navigator).
// Sitzt unter dem Müllwagen.

const LOCKED: { name: string; note: string }[] = [
  { name: 'Substrat',        note: 'AI-Interface · i-Pills · System — Faces stille Deko, Panels gesperrt' },
  { name: 'Brocken (Grund)', note: 'P05 Operator-Zonen (R01 ist in V03 aufgegangen)' },
  { name: 'Müllwagen',       note: 'ungenutzte Panels (P03 · P10 · P12–P14 · R03–R08)' },
  { name: 'Drawer · Icon-Tab', note: 'Icon-Build-Tab nur für Operator (Katalog dagegen offen)' },
  { name: 'Visibility',      note: 'diese Liste selbst — nur für Operator sichtbar' },
];

function EyeIcon() {
  return (
    <svg width={19} height={13} viewBox="0 0 24 16" style={{ display: 'block', flexShrink: 0 }} aria-hidden>
      <path d="M2 8 Q12 1 22 8 Q12 15 2 8 Z" fill="none" stroke="#52677f" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={12} cy={8} r={3} fill="#5f7d9c" />
    </svg>
  );
}

export default function NavVisibility({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <div style={{ flexShrink: 0, padding: '4px 0 2px' }}>
      <div
        onClick={onClick}
        title="Visibility — was für non-operator gesperrt ist (operator-only)"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', cursor: 'pointer', userSelect: 'none' }}
      >
        <EyeIcon />
        <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontSize: 11, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.55)' }}>Visibility</span>
        <span style={{ fontSize: 9, color: '#4a6a8a', opacity: 0.5, fontFamily: 'monospace' }}>({LOCKED.length})</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#4a6a8a' }}>{isOpen ? '▾' : '▸'}</span>
      </div>
      {isOpen && (
        <div style={{ padding: '2px 12px 4px 30px' }}>
          {LOCKED.map((l) => (
            <div key={l.name} style={{ padding: '3px 0' }}>
              <div style={{ fontSize: 10.5, color: '#8b97a8', fontFamily: 'monospace', fontWeight: 700 }}>🔒 {l.name}</div>
              <div style={{ fontSize: 9, color: '#5a6b80', lineHeight: 1.4 }}>{l.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
