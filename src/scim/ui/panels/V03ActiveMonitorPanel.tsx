import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { REGION_MAP } from './V01PackagesPanel';
import packageOpenIcon from '../../../assets/Package-open.svg';
import packageIcon     from '../../../assets/Package.svg';
import type { PackageEntry } from './usePackagesApi';

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

function useActiveForRepresentation(representationId: string) {
  const [pkg, setPkg]         = useState<PackageEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!WORKER_URL) return;
    setLoading(true);
    setPkg(null);
    fetch(`${WORKER_URL}/api/packages?representation_id=${encodeURIComponent(representationId)}&status=active`)
      .then((r) => r.ok ? r.json() as Promise<PackageEntry[]> : Promise.resolve([]))
      .then((rows) => setPkg(rows[0] ?? null))
      .catch(() => setPkg(null))
      .finally(() => setLoading(false));
  }, [representationId]);

  return { pkg, loading };
}

function QrCell({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 120, margin: 1,
      color: { dark: '#000', light: '#fff' } }).then(setDataUrl);
  }, [url]);

  const copy = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {dataUrl
        ? <img src={dataUrl} alt="QR" width={80} height={80}
            style={{ border: '1px solid #e2e8f0', borderRadius: 4, flexShrink: 0 }} />
        : <div style={{ width: 80, height: 80, background: '#f7fafc', borderRadius: 4, flexShrink: 0 }} />
      }
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5568',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 220, marginBottom: 6 }}>
          {url}
        </div>
        <button onClick={copy} style={{
          padding: '3px 10px', fontSize: 10,
          background: copied ? '#38a169' : '#fff',
          color: copied ? '#fff' : '#4a5568',
          border: `1px solid ${copied ? '#38a169' : '#e2e8f0'}`,
          borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}

function RepresentationRow({
  region, rep,
}: {
  region: typeof REGION_MAP[number];
  rep: typeof REGION_MAP[number]['representations'][number];
}) {
  const { pkg, loading } = useActiveForRepresentation(rep.id);

  return (
    <div style={{
      border: `1px solid ${pkg ? '#9ae6b4' : '#e2e8f0'}`,
      borderRadius: 8,
      background: pkg ? '#f0fff4' : '#f7fafc',
      padding: '14px 18px',
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: 16,
      alignItems: 'center',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <img src={region.icon} alt="" width={16} height={16} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 10, color: '#718096' }}>{region.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={rep.icon} alt="" width={22} height={22} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a365d' }}>{rep.label}</div>
            {pkg && (
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#276749' }}>
                {pkg.version}
              </div>
            )}
          </div>
          <img
            src={pkg ? packageOpenIcon : packageIcon}
            alt="" width={18} height={18}
            style={{ marginLeft: 'auto', opacity: pkg ? 1 : 0.25 }}
          />
        </div>
      </div>

      {loading && <div style={{ fontSize: 12, color: '#a0aec0' }}>…</div>}
      {!loading && !pkg && <div style={{ fontSize: 12, color: '#a0aec0' }}>Kein aktives Paket</div>}
      {!loading && pkg && <QrCell url={pkg.cdn_url} />}
    </div>
  );
}

export default function V03ActiveMonitorPanel() {
  if (!WORKER_URL) {
    return (
      <div style={{ padding: 24, color: '#718096', fontSize: 13, fontFamily: 'system-ui' }}>
        Worker nicht konfiguriert — VITE_WORKER_URL setzen.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <img src={packageOpenIcon} alt="" width={28} height={28} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Aktiv-Monitor</div>
          <div style={{ fontSize: 11, color: '#718096' }}>
            Aktive Pakete je Representation — CDN-URL und QR-Code
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {REGION_MAP.flatMap((region) =>
          region.representations.map((rep) => (
            <RepresentationRow key={rep.id} region={region} rep={rep} />
          ))
        )}
      </div>
    </div>
  );
}
