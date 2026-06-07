// Cloud — our-side Auslieferungs-/Eintritts-Schicht (die Wolke). Recycelt aus R02
// „Link & QR". Tabs: Übersicht (hier) · Launcher (Live) · Globe-Switcher · Collector
// (die letzten beiden sind aus P11 hierher gewandert).
import { useState, type CSSProperties } from 'react';
import { APP_URL } from '../../../runtime/appUrl';
import { ICON_REGISTRY } from '../../poi-catalog/iconRegistry';
import { publishRegioAsset, anthemPublishConfigured } from '../../../runtime/anthemApi';
import { useRole } from '../RoleContext';

const chip: CSSProperties = {
  display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
  color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
};

// regio-assets = die gepflegten reg-*/rep-*-Icons (data/icons via ICON_REGISTRY),
// die der Operator in die Cloud (R2) publiziert; Launcher/Collector ziehen sie per id.
const REGIO_ASSETS = ICON_REGISTRY.filter((e) => /^(reg|rep)-/.test(e.id));

export function CloudOverview() {
  const role = useRole();
  const configured = anthemPublishConfigured();
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const publishAssets = async () => {
    setPhase('running'); setMsg('');
    try {
      let n = 0;
      for (const a of REGIO_ASSETS) { await publishRegioAsset(a.id, a.svg_cleaned); n++; }
      setMsg(`✓ ${n} regio-assets publiziert`); setPhase('done');
    } catch (e) { setMsg(`✗ ${(e as Error).message}`); setPhase('error'); }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ marginBottom: 8 }}><span style={chip}>Cloud · our-side Auslieferung & Eintritt</span></div>
      <p style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, margin: '0 0 12px' }}>
        Die <strong>Cloud-Schicht</strong> liegt zwischen <strong>Transmission</strong> (Publizieren) und
        <strong> Mond</strong> (das Gerät, das die Rep läuft). Sie ist <strong>our-side</strong> — kein Teil
        des ausgelieferten Rep-Bundles (shell ⊕ origin ⊕ anthem). Recycelt aus dem ungenutzten
        <code> R02 „Link & QR"</code> (Link/QR = Eintritt).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Launcher', 'Die globale Auswahlfläche (nackte diesenpark.com → Kacheln Nation→Region→Rep). Lädt die gewählte Rep.'],
          ['Globe-Switcher', 'Die Eintritts-Weiche: QR → direkt zur Rep · nackte URL → Launcher.'],
          ['Collector', 'Der Cross-Rep-Index (welche Reps publiziert sind) — speist die Launcher-Kacheln. Künftig von Pathworks Hub gespeist.'],
        ].map(([t, d]) => (
          <div key={t} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', background: '#fff' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>{t}</div>
            <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
      {/* regio-assets: Operator publiziert die reg-/rep-Icons in die Cloud (R2). */}
      {role === 'operator' && (
        <div style={{ borderTop: '1px solid #edf2f7', marginTop: 14, paddingTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2d3748', marginBottom: 4 }}>regio-assets · Cloud-Icons</div>
          <p style={{ fontSize: 11, color: '#718096', lineHeight: 1.5, margin: '0 0 8px' }}>
            Die {REGIO_ASSETS.length} Region-/Rep-Icons (reg-*/rep-*) in die Cloud (R2) publizieren →
            Launcher/Collector ziehen sie per id (statt Legacy-Fallback).
          </p>
          <button
            onClick={publishAssets}
            disabled={!configured || phase === 'running'}
            title={configured ? 'PUT /api/regio-assets/:id' : 'VITE_WORKER_URL + VITE_UPLOAD_API_KEY setzen'}
            style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, cursor: configured && phase !== 'running' ? 'pointer' : 'not-allowed', border: 'none', background: configured ? '#2b6cb0' : '#cbd5e0', color: '#fff' }}
          >
            {phase === 'running' ? '⏳ publiziert…' : '⊕ regio-assets publizieren'}
          </button>
          {!configured && <span style={{ fontSize: 10.5, color: '#a0aec0', marginLeft: 10 }}>Worker nicht konfiguriert</span>}
          {msg && <div style={{ fontSize: 11, color: phase === 'error' ? '#c53030' : '#276749', marginTop: 8, fontFamily: 'monospace' }}>{msg}</div>}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic' }}>
        Der Launcher-Code lebt im Runtime (sensus-core-runtime/src/launcher); hier nur Beobachtung/Vorschau.
      </div>
    </div>
  );
}

export function CloudLauncherView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 8 }}><span style={chip}>Launcher · Live (nackte diesenpark.com)</span></div>
      <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.55, margin: '0 0 10px', maxWidth: 600 }}>
        Die our-side Auswahlfläche, wie sie ein Besucher sieht: nackte URL → Launcher; QR → direkt zur Rep.
      </p>
      <iframe
        title="Launcher (live)"
        src={APP_URL}
        style={{ width: 300, height: 540, border: '1px solid #e2e8f0', borderRadius: 12, background: '#0f1722' }}
      />
    </div>
  );
}
