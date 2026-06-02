// Sichel-Views (P07 Boundary · P08 Wegnetz-Sampling) — machen das bereits
// FUNKTIONALE sichtbar, damit man dem Platzhalter nicht ahnungslos gegenübersteht.
// Reine Anzeige über vorhandene Resolver (buildOriginPackage · resampleNet).
// Heimat: P07 t1 (Boundary), P08 t3 (Mesh-Output). Voll: docs/anthem_snapshot_spec.md.

import type { ReactNode } from 'react';
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

// Boundary-Ring groß als normalisiertes SVG. lat-Flip für Bildschirmkoordinaten
// + Längengrad-Korrektur (1° Länge = cos(Breite) × 1° Breite), sonst stretcht es
// horizontal. Gleicher Maßstab auf beiden Achsen → kein Verzerren.
function RingSvg({ ring, size = 300 }: { ring: [number, number][]; size?: number }) {
  if (ring.length < 3) return null;
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const kx = Math.cos(((minY + maxY) / 2) * Math.PI / 180); // Längengrad stauchen
  const w = ((maxX - minX) * kx) || 1, h = (maxY - minY) || 1;
  const pad = 10;
  const sc = Math.min((size - 2 * pad) / w, (size - 2 * pad) / h);
  const dw = w * sc + 2 * pad, dh = h * sc + 2 * pad;
  const pts = ring.map(([lon, lat]) =>
    `${(pad + (lon - minX) * kx * sc).toFixed(1)},${(pad + (maxY - lat) * sc).toFixed(1)}`).join(' ');
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

// Netz als normalisiertes SVG — lat-Flip + Längengrad-Korrektur (cos Breite),
// optional Knoten-Punkte; geteilte `bounds` für maßstabsgleichen Vergleich.
type NetBounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };
function boundsOf(groups: { points: [number, number][] }[]): NetBounds | null {
  const all = groups.flatMap((g) => g.points);
  if (all.length < 1) return null;
  const lats = all.map((p) => p[0]), lons = all.map((p) => p[1]);
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) };
}
function NetSvg({ stretches, size = 320, nodes = false, bounds }: {
  stretches: { points: [number, number][] }[]; size?: number; nodes?: boolean; bounds?: NetBounds | null;
}) {
  const b = bounds ?? boundsOf(stretches);
  if (!b) return null;
  const { minLat, maxLat, minLon, maxLon } = b;
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const w = ((maxLon - minLon) * kx) || 1, h = (maxLat - minLat) || 1;
  const pad = 8;
  const sc = Math.min((size - 2 * pad) / w, (size - 2 * pad) / h);
  const dw = w * sc + 2 * pad, dh = h * sc + 2 * pad;
  const X = (lon: number) => pad + (lon - minLon) * kx * sc;
  const Y = (lat: number) => pad + (maxLat - lat) * sc;
  return (
    <svg width={dw} height={dh} style={{ display: 'block', maxWidth: '100%' }}>
      {stretches.map((s, i) => (
        <polyline key={i} points={s.points.map(([lat, lon]) => `${X(lon).toFixed(1)},${Y(lat).toFixed(1)}`).join(' ')}
          fill="none" stroke="#4a5568" strokeWidth={0.8} strokeOpacity={0.85}
          strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {nodes && stretches.flatMap((s, si) => s.points.map(([lat, lon], pi) => (
        <circle key={`${si}-${pi}`} cx={X(lon)} cy={Y(lat)} r={1.1} fill="#3182ce" fillOpacity={0.7} />
      )))}
    </svg>
  );
}

// ── P08 Wegnetz-Sampling · Pipeline-Vergleich (ohne Tabs) ────────────────────
export function WegnetzCompareView() {
  const { net } = resolveDemo();
  if (!net) return <div style={{ fontSize: 12, color: '#a0aec0' }}>— kein Netz auflösbar.</div>;
  const edges = net.edges as unknown as { points: [number, number][] }[];
  const r = resampleNet(net.edges, { targetMeters: MVP_RESAMPLE_TARGET_METERS });
  const bounds = boundsOf(edges); // geteilter Maßstab für alle drei Boxen
  const SIZE = 220;
  const exampleId = r.stretches.length > 0 ? `${r.stretches[0].id}#0` : '—';

  const stages: { title: string; svg: ReactNode; lines: string[] }[] = [
    {
      title: '1 · Quell-Netz',
      svg: <NetSvg stretches={edges} bounds={bounds} size={SIZE} nodes />,
      lines: ['Das rohe committete Netz (Quelle, Konvergenz).', `${edges.length} Kanten · unregelmäßige Vertices.`],
    },
    {
      title: `2 · Sampling @${MVP_RESAMPLE_TARGET_METERS} m`,
      svg: <NetSvg stretches={r.stretches} bounds={bounds} size={SIZE} nodes />,
      lines: ['merge → Douglas-Peucker → Bogenlängen-Resampling.', 'Gleichmäßige Sample-Knoten, pro Strecke gleiche Teilung.'],
    },
    {
      title: '3 · Mesh-Output',
      svg: <NetSvg stretches={r.stretches} bounds={bounds} size={SIZE} />,
      lines: [`Produkt: ${r.segmentCount} Segmente · ${r.stretchCount} Strecken.`, 'Geometrie (1×) + Segment-IDs → Origin.'],
    },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Badge text={`P08 · Wegnetz-Sampling (wns) · @${MVP_RESAMPLE_TARGET_METERS} m · live`} />
      <div style={{ fontSize: 11, color: '#718096', margin: '0 0 12px', lineHeight: 1.45, maxWidth: 600 }}>
        Die Sampling-Pipeline im direkten Vergleich: vom rohen committeten Netz über das Abtasten zum
        gesampelten <strong>origin-net</strong> mit stabilen Segment-IDs.
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {stages.map((s) => (
          <div key={s.title} style={{
            flex: '1 1 220px', minWidth: 200, minHeight: 320, display: 'flex', flexDirection: 'column',
            border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#fbfdff',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>{s.title}</div>
            <div style={{ flex: '1 0 auto' }}>{s.svg}</div>
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #edf2f7', fontSize: 11, color: '#718096', lineHeight: 1.5 }}>
              {s.lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 10 }}>
        Knoten-Punkte zeigen den Unterschied: rohe Vertices (links) vs. gleichmäßige Sample-Punkte (Mitte).
        Beispiel-Segment-ID: <code>{exampleId}</code> (Format stretchId#segIndex). Größen-Trade-off (3/10/25 m): siehe <strong>P11</strong>.
      </div>
    </div>
  );
}
