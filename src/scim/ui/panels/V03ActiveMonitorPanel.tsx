import { useState, useEffect, type CSSProperties } from 'react';
import QrCell from '../QrCell';
import { REGION_MAP, canonicalRepId } from './V01PackagesPanel';
import packageOpenIcon from '../../../assets/Package-open.svg';
import packageIcon     from '../../../assets/Package.svg';
import { fetchOriginMeta, fetchPresence, fetchAnthem, type OriginMeta, type PresenceStatus } from '../../../runtime/anthemApi';
import { mvpUrl } from '../../../runtime/appUrl';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

// Shell = die generische Runtime-App (shell-kit einkompiliert), für alle Reps gleich.
// Auslieferungsgröße = der gzippte App-Build (JS+CSS). Gemessen am dist 2026-06-07;
// bei größeren Runtime-Änderungen nachmessen.
const SHELL_KB = 138;
const SHELL_BYTES = SHELL_KB * 1024;

// Echte gzip-Größe eines Strings (Transfer-Größe), via CompressionStream. null,
// wenn die API fehlt (älterer Browser) oder etwas schiefgeht.
async function gzipLen(text: string): Promise<number | null> {
  try {
    const CS = (globalThis as { CompressionStream?: typeof CompressionStream }).CompressionStream;
    if (!CS) return null;
    const stream = new Blob([text]).stream().pipeThrough(new CS('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return buf.byteLength;
  } catch { return null; }
}

const QR_LABEL: CSSProperties = { fontSize: 10, fontWeight: 700, color: '#4a5568', marginBottom: 4 };

const fmtKB = (b: number | null) => (b == null ? '' : `${(b / 1024).toFixed(1)} KB`);
const fmtUploaded = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Die ANTHEM-/ORIGIN-SCHICHT (presentational) — aus der schon geholten OriginMeta + presence.
function AnthemLayerLine({ origin, presence, errored }: { origin: OriginMeta | null; presence: PresenceStatus | null; errored: boolean }) {
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
            ? <>Origin-Mesh veröffentlicht{origin?.stretches != null ? ` · ${origin.stretches} Strecken` : ''}{origin?.bytes != null ? ` · ${fmtKB(origin.bytes)}` : ''}{origin?.uploadedAt ? ` · ${fmtUploaded(origin.uploadedAt)}` : ''}</>
            : <span style={{ color: '#a0aec0' }}>Origin-Mesh nicht veröffentlicht</span>}
          {' · '}
          <span style={{ color: present ? '#2f855a' : '#a0aec0' }}>{present ? '● presence' : '○ kalt'}</span>
          {origin?.anthemEndpoint && <span style={{ color: '#a0aec0' }}> · {origin.anthemEndpoint}</span>}
        </>
      )}
    </div>
  );
}

// Erwartete Anthem-gzip-Größe aus der Segmentzahl, wenn die Rep kalt ist (kein
// Live-Snapshot). Grobe Schätzung: ~120 B Metadaten + ~2 B/Segment (2-Dezimal-
// Loads, gzip-komprimiert). Nur ungefähr — daher in Klammern mit „~".
function anthemEstBytes(stretches: number | null): number | null {
  return stretches != null ? Math.round(120 + stretches * 2.2) : null;
}

// Eine Größen-Zeile im Paket-Breakdown. estBytes = ungefährer Erwartungswert,
// gezeigt in Klammern, wenn der echte Wert fehlt (kalt).
function SizeRow({ label, bytes, estBytes, note, bold, est }: {
  label: string; bytes: number | null; estBytes?: number | null; note?: string; bold?: boolean; est?: boolean;
}) {
  const valColor = bytes != null ? (bold ? '#1a202c' : '#2d3748') : (estBytes != null ? '#a0aec0' : '#cbd5e0');
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ width: 86, color: bold ? '#2d3748' : '#718096', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ width: 76, textAlign: 'right', color: valColor, fontWeight: bold ? 700 : 400 }}>
        {bytes != null ? `${est ? '~' : ''}${fmtKB(bytes)}`
          : estBytes != null ? `(~${fmtKB(estBytes)})`
          : '— kalt'}
      </span>
      {note && <span style={{ color: '#a0aec0' }}>{note}</span>}
    </div>
  );
}

// Paket-Größen je Rep — ALLES gzip (echte Transfer-Größe): Shell (geteilt) +
// Origin (Bundle) + Anthem (Snapshot). Bei kalter Rep: erwartete Anthem-Größe
// (aus Segmentzahl) in Klammern, und ins Erstlieferungs-/laufend-Total eingerechnet.
function SizeBreakdown({ originGzip, anthemGzip, stretches }: {
  originGzip: number | null; anthemGzip: number | null; stretches: number | null;
}) {
  const anthemEst = anthemEstBytes(stretches);
  const anthemForTotal = anthemGzip ?? anthemEst ?? 0;
  const approx = anthemGzip == null && anthemEst != null;   // Total enthält Schätzung
  const firstDelivery = (originGzip != null) ? SHELL_BYTES + originGzip + anthemForTotal : null;
  return (
    <div style={{
      borderTop: '1px dashed #e2e8f0', paddingTop: 6, marginTop: 2,
      fontSize: 10.5, fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.7,
    }}>
      <div style={{ color: '#a0aec0', marginBottom: 2 }}>Paket-Größen <span style={{ fontSize: 9, color: '#cbd5e0' }}>· gzip (Transfer)</span></div>
      <SizeRow label="Shell" bytes={SHELL_BYTES} note="einkompiliert · einmalig" est />
      <SizeRow label="Origin" bytes={originGzip} note="Bundle · je Version" />
      <SizeRow label="Anthem" bytes={anthemGzip} estBytes={anthemEst} note="Snapshot · alle 5 Min" />
      <div style={{ borderTop: '1px solid #edf2f7', margin: '3px 0', width: 156 }} />
      <SizeRow label="Erstlieferung" bytes={firstDelivery} bold est={approx} />
      <SizeRow label="laufend" bytes={anthemGzip} estBytes={anthemEst} note="Bestandsnutzer · 5 Min" />
    </div>
  );
}

function RepresentationRow({
  region, rep,
}: {
  region: typeof REGION_MAP[number];
  rep: typeof REGION_MAP[number]['representations'][number];
}) {
  // EINE Origin-Meta-Quelle (Phase 1): bundlePublished/version = das aktive Bundle
  // in R2 (was die Ziel-App via ?rep= lädt) + Mesh-/presence-Status. Kein /api/packages mehr.
  // Kanonische Rep-Id (= REPRESENTATIONS.id) — dort liegt das Bundle, darauf zeigt die QR.
  const repId = canonicalRepId(rep.id);
  const [origin, setOrigin] = useState<OriginMeta | null>(null);
  const [presence, setPresence] = useState<PresenceStatus | null>(null);
  const [anthemGzip, setAnthemGzip] = useState<number | null>(null);
  const [originGzip, setOriginGzip] = useState<number | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      Promise.allSettled([fetchOriginMeta(repId), fetchPresence(repId), fetchAnthem(repId)]).then(async ([o, p, a]) => {
        if (!alive) return;
        if (o.status === 'fulfilled') { setOrigin(o.value); setErrored(false); } else setErrored(true);
        if (p.status === 'fulfilled') setPresence(p.value);
        // Anthem-Snapshot → echte gzip-Größe (presence-gegated; kalt = 425 → null).
        const ag = a.status === 'fulfilled' ? await gzipLen(JSON.stringify(a.value)) : null;
        if (alive) setAnthemGzip(ag);
      });
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [repId]);

  // Origin-Bundle EINMAL holen (statisch je Version) und gzippen → Transfer-Größe.
  useEffect(() => {
    let alive = true;
    fetch(`${WORKER_URL}/api/origin/${repId}/bundle`)
      .then((r) => (r.ok ? r.text() : null))
      .then(async (txt) => { if (alive) setOriginGzip(txt ? await gzipLen(txt) : null); })
      .catch(() => { if (alive) setOriginGzip(null); });
    return () => { alive = false; };
  }, [repId]);

  const live = origin?.bundlePublished ?? false;
  const version = origin?.version ?? null;

  return (
    <div style={{
      border: `1px solid ${live ? '#9ae6b4' : '#e2e8f0'}`,
      borderRadius: 8, background: live ? '#f0fff4' : '#f7fafc',
      padding: '14px 18px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center',
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
            {live && version != null && (
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#276749' }}>aktiv v{version}</div>
            )}
          </div>
          <img src={live ? packageOpenIcon : packageIcon} alt="" width={18} height={18} style={{ marginLeft: 'auto', opacity: live ? 1 : 0.25 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {/* Ziel-App · QR — die ECHTE publizierte Origin-App (?rep=, QR → direkt zur Rep). */}
        <div>
          <div style={QR_LABEL}>Ziel-App · QR <span style={{ color: '#a0aec0', fontWeight: 400 }}>(scannen → lädt die Rep aufs Gerät)</span></div>
          <QrCell url={mvpUrl(repId)} />
        </div>
        <div style={{ fontSize: 11, color: live ? '#276749' : '#a0aec0', fontFamily: 'ui-monospace, Menlo, monospace' }}>
          {live ? `● aktives Origin-Bundle v${version ?? '?'}${origin?.bundleUploadedAt ? ` · ${fmtUploaded(origin.bundleUploadedAt)}` : ''}` : '○ kein aktives Origin-Bundle'}
        </div>
        <AnthemLayerLine origin={origin} presence={presence} errored={errored} />
        <SizeBreakdown originGzip={originGzip} anthemGzip={anthemGzip} stretches={origin?.stretches ?? null} />
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
            Je Representation: aktives <strong>Origin-Bundle</strong> (R2/QR) <strong>+ Anthem-Schicht</strong> (Mesh + presence)
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 620 }}>
        <strong>Publishing-Monitor · Beobachter</strong> der ausgelieferten Maschine. Zeigt, <strong>was live ausgespielt
        wird</strong>: das aktive Origin-Bundle in R2 (was die Ziel-App via <code>?rep=</code> lädt) + die Anthem-Schicht
        (Origin-Mesh + presence). Das Anthem-<em>Snapshot</em> selbst ist ein flüchtiger 5-Min-Stream — seine
        Lebendigkeit zeigt presence (auch im Footer · Tab t1). <em>Liest den Origin-Pfad — kein /api/packages mehr.</em>
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
