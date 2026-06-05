// P11 · Transfer — der Publishing-Handoff: die fertige, GENERISCHE Shell wird an
// Sensus Core P transferiert → geschnürt (Shell ⊕ Origin ⊕ Anthem), versioniert
// (V01), Identität gestempelt. Erst HIER wird aus generisch eine konkrete
// Auslieferung. Verb 'transfer' (statt 'ausspielen'). shell-run-Schritt 'transfer'.
import { useState } from 'react';
import { ShellRunBadge } from '../ShellRunInfo';
import { useWorkspaceNav } from '../workspaceNav';
import { useAuftraggeberRep } from '../../../runtime/useAuftraggeberRep';
import { buildOriginBundle } from '../../sensus/originPackage';
import { publishOriginBundle, anthemPublishConfigured } from '../../../runtime/anthemApi';

const STEPS: { n: number; head: string; body: string }[] = [
  { n: 1, head: 'schnüren', body: 'Shell ⊕ Origin ⊕ Anthem zu EINEM Bundle bündeln.' },
  { n: 2, head: 'versionieren', body: 'als Version in die V01-Bibliothek (Mond-Scheibe) legen.' },
  { n: 3, head: 'stempeln (Shell-ID)', body: 'Identität an die generische Shell: reg-/rep-Icon + Boundary + globale Icons.' },
  { n: 4, head: 'ausliefern', body: 'an CDN/R2; der globe-switcher dispatcht je QR/URL.' },
];

export default function TransferView() {
  const { goStation } = useWorkspaceNav();
  const rep = useAuftraggeberRep();
  const [phase, setPhase] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const configured = anthemPublishConfigured();

  const publish = async () => {
    setPhase('publishing'); setMsg('');
    try {
      const res = await publishOriginBundle(rep.id, buildOriginBundle(rep));
      const kb = (res.bytes / 1024).toFixed(1);
      setMsg(`✓ veröffentlicht: origin/${res.repId}/bundle.json · ${kb} kB · ${new Date(res.uploadedAt).toLocaleString('de')}`);
      setPhase('done');
    } catch (e) {
      setMsg(`✗ ${(e as Error).message}`);
      setPhase('error');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#b83280', background: '#fff5f7', border: '1px solid #fbb6ce', borderRadius: 4 }}>
          P11 · Transfer → Sensus Core P
        </div>
        <ShellRunBadge compact />
      </div>

      <p style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, margin: '0 0 14px' }}>
        Die fertige, <strong>generische</strong> Shell wird an Sensus Core P <strong>transferiert</strong>. Erst HIER wird
        aus der generischen Shell eine <strong>konkrete Auslieferung</strong> — die Shell selbst bleibt rep-neutral, alles
        Spezifische kommt beim Transfer dazu. (Verb <strong>transfer</strong> statt „ausspielen".)
      </p>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        {STEPS.map((s) => (
          <div key={s.n} style={{ display: 'flex', gap: 10, padding: '9px 12px', borderTop: s.n === 1 ? 'none' : '1px solid #edf2f7', alignItems: 'flex-start' }}>
            <span style={{ color: '#b83280', fontWeight: 800, width: 16, textAlign: 'center', flexShrink: 0 }}>{s.n}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>{s.head}</div>
              <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, marginTop: 1 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA: Origin-Bundle ausspielen — schnürt buildOriginBundle(rep) → R2 (PUT /api/origin/:repId/bundle).
          Shell steckt im App-Build (shell-kit), Anthem ist Sim → für MVP reicht das Origin-Bundle. */}
      <div style={{ border: '1px solid #fbb6ce', borderRadius: 8, padding: 12, marginBottom: 14, background: '#fff5f7' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#b83280', marginBottom: 6 }}>Ausspielen → R2: {rep.name}</div>
        <button
          onClick={publish}
          disabled={!configured || phase === 'publishing'}
          title={configured ? 'PUT /api/origin/:repId/bundle' : 'VITE_WORKER_URL + VITE_UPLOAD_API_KEY setzen'}
          style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, cursor: configured && phase !== 'publishing' ? 'pointer' : 'not-allowed', border: 'none', background: configured ? '#b83280' : '#cbd5e0', color: '#fff' }}
        >
          {phase === 'publishing' ? '⏳ lädt…' : '⊕ Origin-Bundle veröffentlichen'}
        </button>
        {!configured && <span style={{ fontSize: 10.5, color: '#a0aec0', marginLeft: 10 }}>Worker nicht konfiguriert</span>}
        {msg && <div style={{ fontSize: 11, color: phase === 'error' ? '#c53030' : '#276749', marginTop: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>{msg}</div>}
        <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 6, lineHeight: 1.5 }}>Schnürt boundary + net + poi-set (Container) + asset-set zu EINEM JSON → R2. Die Runtime holt es über <code>?rep={rep.id}</code>.</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => goStation('P11', 'input')} style={{ fontSize: 11, padding: '4px 11px', borderRadius: 6, cursor: 'pointer', border: '1px solid #fbb6ce', background: '#fff5f7', color: '#b83280', fontWeight: 600 }}>→ Publishing (schnüren)</button>
        <button onClick={() => goStation('P11', 't1')} style={{ fontSize: 11, padding: '4px 11px', borderRadius: 6, cursor: 'pointer', border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontWeight: 600 }}>→ Shell-ID (stempeln)</button>
      </div>

      <div style={{ fontSize: 11, color: '#718096', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 12px', lineHeight: 1.55, marginTop: 12 }}>
        <strong>Stand:</strong> teilweise — P11 existiert (Publishing + Shell-ID). Dieses Tab macht den Transfer-Handoff als eigenen Schritt sichtbar.
      </div>
    </div>
  );
}
