// App-Manifest — geteiltes Info-Modal (eine Quelle) + ⓘ-Badge. Pendant zu
// AnthemCycleInfo / ShellRunInfo: der dritte App-Spec (Marke/UX). Inhalt aus
// sensus/appManifest.ts. Beheimatet in V01 (Mond-Scheibe).
import { useEffect, useState } from 'react';
import {
  APP_SLOGAN, APP_MANIFEST_INTRO, MANIFEST_CONTRAST, MANIFEST_PRINCIPLES,
} from '../sensus/appManifest';

export function AppManifestBadge({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="App-Manifest — die App-Spec für Marke & UX"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: compact ? 10.5 : 11, fontFamily: 'system-ui, sans-serif',
          padding: compact ? '1px 7px' : '2px 9px', borderRadius: 999,
          border: '1px solid #fbd38d', background: '#fffaf0', color: '#b7791f',
        }}
      >
        <span aria-hidden>ⓘ</span> Manifest · „{APP_SLOGAN}"
      </button>
      {open && <AppManifestModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AppManifestModal({ onClose }: { onClose: () => void }) {
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
          background: '#fff', borderRadius: 12, maxWidth: 640, width: '100%', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
          fontFamily: 'system-ui, sans-serif', padding: '20px 22px',
        }}
      >
        {/* Kopf */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#975a16' }}>ⓘ App-Manifest</div>
          <button onClick={onClose} style={{
            cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6,
            fontSize: 12, padding: '3px 9px', color: '#4a5568',
          }}>schließen ✕</button>
        </div>

        {/* Slogan-Held */}
        <div style={{
          textAlign: 'center', padding: '16px 12px', marginBottom: 14, borderRadius: 10,
          background: 'linear-gradient(135deg,#fffaf0,#fefcbf)', border: '1px solid #fbd38d',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#975a16', letterSpacing: 0.3 }}>„{APP_SLOGAN}"</div>
          <div style={{ fontSize: 10.5, color: '#b7791f', marginTop: 3 }}>das Erste, was der User beim Laden konsumiert</div>
        </div>

        {/* Was ist das Manifest */}
        <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 14px' }}>{APP_MANIFEST_INTRO}</p>

        {/* Kontrast */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: '9px 11px', borderRadius: 8, background: '#f7fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a0aec0', marginBottom: 3 }}>ANDERE</div>
            <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5 }}>{MANIFEST_CONTRAST.others}</div>
          </div>
          <div style={{ flex: 1, padding: '9px 11px', borderRadius: 8, background: '#fffaf0', border: '1px solid #fbd38d' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b7791f', marginBottom: 3 }}>WIR</div>
            <div style={{ fontSize: 11.5, color: '#744210', lineHeight: 1.5 }}>{MANIFEST_CONTRAST.us}</div>
          </div>
        </div>

        {/* Leitsätze */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MANIFEST_PRINCIPLES.map((p) => (
            <div key={p.n} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#b7791f', fontWeight: 800, width: 16, textAlign: 'center', flexShrink: 0 }}>{p.n}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>{p.title}</div>
                <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, marginTop: 1 }}>{p.line}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic' }}>
          App-Spec · Entwurf v1 — Wortlaut jederzeit feilbar (sensus/appManifest.ts)
        </div>
      </div>
    </div>
  );
}
