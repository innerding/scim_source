// build-clipboard — die i-Pill (Badge ⓘ + Modal) der Ziel-App-UX-Details. Pendant zu
// ShellRunBadge / AnthemCycleBadge. Inhalt = die bestehende BuilderClipboard-Komponente
// (P07·t6 war früher ein Tab → jetzt Pill). Zentral einsehbar im i-Pills-Panel, verteilt
// im High-Shell (Shell-Studio). Operator-only-Gating passiert in der Pill selbst (A-Schicht
// liefert sie rollenneutral; das Gating setzt die B-Schicht).
import { useEffect, useState } from 'react';
import BuilderClipboard from './panels/BuilderClipboard';
import { useRole } from './RoleContext';

export function BuilderClipboardBadge({ compact = false }: { compact?: boolean }) {
  const role = useRole();
  const [open, setOpen] = useState(false);
  if (role !== 'operator') return null;   // i-Pill operator-only (Sub-Komposit gesperrt)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="build-clipboard — Ziel-App-UX-Details fürs Bauen"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: compact ? 10.5 : 11, fontFamily: 'system-ui, sans-serif',
          padding: compact ? '1px 7px' : '2px 9px', borderRadius: 999,
          border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0',
        }}
      >
        <span aria-hidden>ⓘ</span> build-clipboard
      </button>
      {open && <BuilderClipboardModal onClose={() => setOpen(false)} />}
    </>
  );
}

function BuilderClipboardModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,35,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, maxWidth: 820, width: '100%', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)', padding: '14px 18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{
            cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6,
            fontSize: 12, padding: '3px 9px', color: '#4a5568', fontFamily: 'system-ui, sans-serif',
          }}>schließen ✕</button>
        </div>
        <BuilderClipboard />
      </div>
    </div>
  );
}
