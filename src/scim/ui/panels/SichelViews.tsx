// Sichel-Views (P07 Boundary · P08 Wegnetz-Sampling) — machen das bereits
// FUNKTIONALE sichtbar, damit man dem Platzhalter nicht ahnungslos gegenübersteht.
// Reine Anzeige über vorhandene Resolver (buildOriginPackage · resampleNet).
// Heimat: P07 t1 (Boundary), P08 t3 (Mesh-Output). Voll: docs/anthem_snapshot_spec.md.

import { REPRESENTATIONS, wegnetzById, geometryById } from '../../workspace/workspace.registry';
import { buildOriginPackage, MVP_RESAMPLE_TARGET_METERS } from '../../sensus/originPackage';
import { resampleNet } from '../../wegnetz/netResample';
import { fmtBytes } from '../../sensus/formatBytes';
import { playReveal } from '../../sensus/revealPrep';

// Demo-Auflösung: dieselbe Quelle wie P11 (Lichtenberg bzw. erste Representation).
function resolveDemo() {
  const rep = REPRESENTATIONS.find((r) => /lichtenberg/i.test(r.id) || /lichtenberg/i.test(r.name)) ?? REPRESENTATIONS[0];
  const origin = rep ? buildOriginPackage(rep) : null;
  const net = rep?.wegnetz_id ? wegnetzById(rep.wegnetz_id) : undefined;
  const geo = rep?.geometry_id ? geometryById(rep.geometry_id) : undefined;
  const ring = (geo?.polygon ?? null) as [number, number][] | null;
  return { rep, origin, net, ring };
}

// Boundary-Ring groß als normalisiertes SVG (lat-Flip für Bildschirmkoordinaten).
function RingSvg({ ring, size = 300 }: { ring: [number, number][]; size?: number }) {
  if (ring.length < 3) return null;
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = (maxX - minX) || 1, h = (maxY - minY) || 1;
  const pad = 10;
  const sc = Math.min((size - 2 * pad) / w, (size - 2 * pad) / h);
  const dw = w * sc + 2 * pad, dh = h * sc + 2 * pad;
  const pts = ring.map(([lon, lat]) =>
    `${(pad + (lon - minX) * sc).toFixed(1)},${(pad + (maxY - lat) * sc).toFixed(1)}`).join(' ');
  return (
    <svg width={dw} height={dh} style={{ display: 'block', maxWidth: '100%' }}>
      <polygon points={pts} fill="#0074d9" fillOpacity={0.06} stroke="#0074d9" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5, padding: '3px 0' }}>
      <strong style={{ color: '#2d3748', flex: '0 0 150px' }}>{label}</strong>
      <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#1a365d' }}>{value}</span>
      {hint && <span style={{ color: '#a0aec0', fontSize: 11 }}>{hint}</span>}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div style={{
      display: 'inline-block', padding: '2px 8px', marginBottom: 8, fontSize: 10,
      fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff',
      border: '1px solid #bee3f8', borderRadius: 4,
    }}>{text}</div>
  );
}

// ── P07 Boundary ────────────────────────────────────────────────────────────
export function BoundaryView() {
  const { origin, ring } = resolveDemo();
  const boundary = origin?.particles.find((p) => p.id === 'origin-boundary') ?? null;
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <Badge text="P07 · Boundary (bou) · live aufgelöst" />
      <div style={{ fontSize: 11, color: '#718096', margin: '0 0 8px', lineHeight: 1.45 }}>
        Die <strong>Boundary</strong> der committeten Representation — im Origin-Paket das
        <strong> Manifest (L0)</strong>: unsichtbar, rahmt die OSM-Kamera und verlinkt den Rest.
      </div>
      {ring && (
        <div style={{ margin: '8px 0 12px', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, display: 'inline-block', background: '#fbfdff' }}>
          <RingSvg ring={ring} size={320} />
        </div>
      )}
      {origin ? (
        <>
          <Stat label="Representation" value={`„${origin.repName}" · v${origin.version}`} />
          {boundary
            ? <Stat label="origin-boundary" value={boundary.detail} hint={fmtBytes(boundary.bytes)} />
            : <div style={{ fontSize: 12, color: '#a0aec0' }}>— kein Boundary-Ring aufgelöst</div>}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => playReveal()} style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
              border: '1px solid #2b6cb0', background: '#ebf8ff', color: '#1a365d', fontWeight: 600,
            }}>▶ Reveal-Vorschau abspielen</button>
            <span style={{ fontSize: 10.5, color: '#a0aec0', marginLeft: 8 }}>
              spielt im <strong>Inspector</strong> (rechte Karte) — Karte muss offen sein.
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 8 }}>
            Prep des „stillen Einloggens": das Boundary-Fenster wächst (langsam) und legt die OSM frei,
            der weiße Fill dimmt aus, dann wird die Boundary nachgezeichnet und bleibt stehen. Live aus
            <code>buildOriginPackage</code> — reale UTF-8-Größe. Als L0-Manifest trägt sie später bbox +
            Verweise (<code>OriginManifest</code>).
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#a0aec0' }}>— keine Representation auflösbar.</div>
      )}
    </div>
  );
}

// ── P08 Wegnetz-Sampling ─────────────────────────────────────────────────────
export function WegnetzSamplingView() {
  const { net } = resolveDemo();
  const r = net ? resampleNet(net.edges, { targetMeters: MVP_RESAMPLE_TARGET_METERS }) : null;
  const exampleId = r && r.stretches.length > 0 ? `${r.stretches[0].id}#0` : null;
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <Badge text={`P08 · Wegnetz-Sampling (wns) · @${MVP_RESAMPLE_TARGET_METERS} m · live`} />
      <div style={{ fontSize: 11, color: '#718096', margin: '0 0 8px', lineHeight: 1.45 }}>
        Das committete Netz, resampelt auf die MVP-Zielsegmentlänge. Ergebnis = <strong>origin-net</strong>:
        Geometrie (1×) + stabile <strong>Segment-IDs</strong>, adressiert vom Anthem-Last-Array.
      </div>
      {r ? (
        <>
          <Stat label="Segmente" value={`${r.segmentCount}`} hint={`über ${r.stretchCount} Strecken`} />
          <Stat label="Netzlänge" value={`${Math.round(r.totalMeters)} m`} />
          <Stat label="Geometrie (statisch, 1×)" value={fmtBytes(r.geometryBytes)} />
          <Stat label="Load-Array (alle 5 Min)" value={fmtBytes(r.loadArrayBytes)} hint="1 Byte/Segment" />
          {exampleId && <Stat label="Segment-ID (Beispiel)" value={exampleId} hint="Format stretchId#segIndex" />}
          <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 8 }}>
            Live aus <code>resampleNet</code>. Größen-Trade-off der Zielsegmentlänge (3 / 10 / 25 m)
            steht in <strong>P11</strong> (Sensus Core, Verpackungs-Sicht) — hier nicht doppelt.
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#a0aec0' }}>— kein Netz auflösbar.</div>
      )}
    </div>
  );
}
