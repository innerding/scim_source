import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { REGION_MAP } from './V01PackagesPanel';
import packageOpenIcon from '../../../assets/Package-open.svg';
import packageIcon     from '../../../assets/Package.svg';
import type { PackageEntry } from './usePackagesApi';
import { fetchOriginMeta, fetchPresence, type OriginMeta, type PresenceStatus } from '../../../runtime/anthemApi';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

const fmtKB = (b: number | null) => (b == null ? '' : `${(b / 1024).toFixed(1)} KB`);
const fmtUploaded = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Die ANTHEM-/ORIGIN-SCHICHT je Rep: was live ausgespielt wird (≠ Bundle-Paket).
// Origin-Netz veröffentlicht? · presence (live). Read-only Worker-Poll.
function AnthemLayerLine({ repId }: { repId: string }) {
  const [origin, setOrigin] = useState<OriginMeta | null>(null);
  const [presence, setPresence] = useState<PresenceStatus | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      Promise.allSettled([fetchOriginMeta(repId), fetchPresence(repId)]).then(([o, p]) => {
        if (!alive) return;
        if (o.status === 'fulfilled') { setOrigin(o.value); setErrored(false); } else setErrored(true);
        if (p.status === 'fulfilled') setPresence(p.value);
      });
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [repId]);

  const published = origin?.published ?? false;
  const present = presence?.present ?? false;

  return (
    <div style={{
      fontSize: 10.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568',
      borderTop: '1px dashed #e2e8f0', paddingTop: 6, marginTop: 2, lineHeight: 1.7,
    }}>
      <span style={{ color: '#a0aec0' }}>Anthem-Schicht: </span>
      {errored && !origin ? (
        <span style={{ color: '#a0aec0' }}>Worker nicht erreichbar</span>
      ) : (
        <>
          <span style={{ color: published ? '#2f855a' : '#a0aec0', fontWeight: 700 }}>{published ? '●' : '○'}</span>{' '}
          {published
            ? <>Origin veröffentlicht{origin?.stretches != null ? ` · ${origin.stretches} Strecken` : ''}{origin?.bytes != null ? ` · ${fmtKB(origin.bytes)}` : ''}{origin?.uploadedAt ? ` · ${fmtUploaded(origin.uploadedAt)}` : ''}</>
            : <span style={{ color: '#a0aec0' }}>Origin nicht veröffentlicht</span>}
          {' · '}
          <span style={{ color: present ? '#2f855a' : '#a0aec0' }}>{present ? '● presence' : '○ kalt'}</span>
          {origin?.anthemEndpoint && <span style={{ color: '#a0aec0' }}> · {origin.anthemEndpoint}</span>}
        </>
      )}
    </div>
  );
}

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {loading && <div style={{ fontSize: 12, color: '#a0aec0' }}>…</div>}
        {!loading && !pkg && <div style={{ fontSize: 12, color: '#a0aec0' }}>Kein aktives Paket</div>}
        {!loading && pkg && <QrCell url={pkg.cdn_url} />}
        <AnthemLayerLine repId={rep.id} />
      </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <img src={packageOpenIcon} alt="" width={28} height={28} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Active-Monitor</span>
            <AnthemCycleBadge />
          </div>
          <div style={{ fontSize: 11, color: '#718096' }}>
            Je Representation: aktives Bundle-Paket (CDN/QR) <strong>+ Anthem-Schicht</strong> (live ausgespielt: Origin + presence)
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 620 }}>
        <strong>Publishing-Monitor · Beobachter</strong> der ausgelieferten Maschine. Zeigt zweierlei: <strong>was
        installiert ist</strong> (versioniertes Bundle-Paket, D1/CDN) und <strong>was live ausgespielt wird</strong>
        (Origin-Schicht in R2 + presence). Das Anthem-<em>Snapshot</em> selbst ist ein flüchtiger 5-Min-Stream —
        nicht als Paket gelistet; seine Lebendigkeit zeigt die presence-Anzeige (auch im Footer · Tab t1).
      </p>

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
