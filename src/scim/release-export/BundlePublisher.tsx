import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { ScimBundle } from './scimBundle.types';

interface UploadResult {
  url: string;
  id: string;
  expires_at: string;
}

type Phase = 'idle' | 'uploading' | 'published' | 'error';

const WORKER_URL    = import.meta.env.VITE_WORKER_URL    as string | undefined;
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

async function uploadBundle(bundle: ScimBundle): Promise<UploadResult> {
  if (!WORKER_URL)    throw new Error('VITE_WORKER_URL nicht konfiguriert');
  if (!UPLOAD_API_KEY) throw new Error('VITE_UPLOAD_API_KEY nicht konfiguriert');

  const res = await fetch(`${WORKER_URL}/bundle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Scim-Key':   UPLOAD_API_KEY,
    },
    body: JSON.stringify(bundle),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Worker ${res.status}: ${msg}`);
  }

  return res.json() as Promise<UploadResult>;
}

interface Props {
  bundle: ScimBundle;
}

export default function BundlePublisher({ bundle }: Props) {
  const [phase, setPhase]   = useState<Phase>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);

  // QR-Code generieren wenn URL vorliegt
  useEffect(() => {
    if (!result?.url) return;
    QRCode.toDataURL(result.url, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [result?.url]);

  const handlePublish = async () => {
    setPhase('uploading');
    setError(null);
    try {
      const r = await uploadBundle(bundle);
      setResult(r);
      setPhase('published');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  };

  const handleCopy = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleQrDownload = () => {
    if (!qrDataUrl || !result) return;
    const a = document.createElement('a');
    a.href     = qrDataUrl;
    a.download = `scim3_qr_${bundle.region.id}_${result.id.slice(0, 8)}.png`;
    a.click();
  };

  const notConfigured = !WORKER_URL || !UPLOAD_API_KEY;

  // ── idle / error ─────────────────────────────────────────────────────────────
  if (phase === 'idle' || phase === 'error') {
    return (
      <div style={{
        background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748', marginBottom: 3 }}>
            Bundle veröffentlichen
          </div>
          <div style={{ fontSize: 11, color: '#718096' }}>
            {notConfigured
              ? 'Worker nicht konfiguriert — VITE_WORKER_URL + VITE_UPLOAD_API_KEY setzen'
              : 'Hochladen zum Cloudflare Worker → URL + QR-Code für Ziel-App'}
          </div>
          {phase === 'error' && error && (
            <div style={{ fontSize: 11, color: '#c53030', marginTop: 6 }}>{error}</div>
          )}
        </div>
        <button
          onClick={handlePublish}
          disabled={notConfigured}
          style={{
            padding: '9px 18px', fontSize: 12, fontWeight: 600, flexShrink: 0,
            background: notConfigured ? '#e2e8f0' : '#0074d9',
            color: notConfigured ? '#a0aec0' : '#fff',
            border: 'none', borderRadius: 6,
            cursor: notConfigured ? 'default' : 'pointer',
          }}
        >
          ↑ Veröffentlichen
        </button>
      </div>
    );
  }

  // ── uploading ─────────────────────────────────────────────────────────────────
  if (phase === 'uploading') {
    return (
      <div style={{
        background: '#ebf8ff', border: '1px solid #bee3f8',
        borderRadius: 8, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: '2px solid #0074d9', borderTopColor: 'transparent',
          animation: 'scim-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes scim-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: '#2b6cb0' }}>Bundle wird hochgeladen…</div>
      </div>
    );
  }

  // ── published ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#f0fff4', border: '1px solid #9ae6b4',
      borderRadius: 8, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#276749', marginBottom: 14 }}>
        ✓ Bundle veröffentlicht
      </div>

      {/* URL + Copy */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16,
      }}>
        <input
          readOnly
          value={result!.url}
          style={{
            flex: 1, padding: '7px 10px', fontSize: 11, fontFamily: 'monospace',
            background: '#fff', border: '1px solid #c6f6d5', borderRadius: 5,
            color: '#2d3748', outline: 'none',
          }}
        />
        <button
          onClick={handleCopy}
          style={{
            padding: '7px 14px', fontSize: 12, flexShrink: 0,
            background: copied ? '#38a169' : '#fff',
            color: copied ? '#fff' : '#4a5568',
            border: '1px solid #c6f6d5', borderRadius: 5, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>

      {/* QR-Code */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{
          background: '#fff', border: '1px solid #c6f6d5', borderRadius: 8,
          padding: 10, flexShrink: 0,
        }}>
          {qrDataUrl
            ? <img ref={qrRef} src={qrDataUrl} alt="QR-Code" width={160} height={160} />
            : <div style={{ width: 160, height: 160, background: '#f7fafc', borderRadius: 4 }} />
          }
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#276749', marginBottom: 8, lineHeight: 1.5 }}>
            Ziel-App scannt diesen Code und lädt das Bundle direkt.
          </div>
          <div style={{ fontSize: 10, color: '#718096', fontFamily: 'monospace', marginBottom: 12 }}>
            Gültig bis: {new Date(result!.expires_at).toLocaleDateString('de-AT')}
          </div>
          <button
            onClick={handleQrDownload}
            disabled={!qrDataUrl}
            style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 600,
              background: '#fff', color: '#276749',
              border: '1px solid #9ae6b4', borderRadius: 5,
              cursor: qrDataUrl ? 'pointer' : 'default',
              marginRight: 8,
            }}
          >
            ↓ QR-Code als PNG
          </button>
          <button
            onClick={() => { setPhase('idle'); setResult(null); setQrDataUrl(null); }}
            style={{
              padding: '7px 14px', fontSize: 12,
              background: 'transparent', color: '#718096',
              border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer',
            }}
          >
            Erneut hochladen
          </button>
        </div>
      </div>
    </div>
  );
}
