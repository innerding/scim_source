// Sichel-Views (P07 Boundary · P08 Wegnetz-Sampling) — machen das bereits
// FUNKTIONALE sichtbar, damit man dem Platzhalter nicht ahnungslos gegenübersteht.
// Reine Anzeige über vorhandene Resolver (buildOriginPackage liefert den mesh-output).
// Heimat: P07 t1 (Boundary), P08 t3 (Mesh-Output). Voll: docs/anthem_snapshot_spec.md.

import type { ReactNode } from 'react';
import { REPRESENTATIONS, wegnetzById, geometryById } from '../../workspace/workspace.registry';
import { buildOriginPackage, MVP_RESAMPLE_TARGET_METERS, ORIGIN_STAGE_COUNT } from '../../sensus/originPackage';
import { fmtBytes } from '../../sensus/formatBytes';
import { playReveal } from '../../sensus/revealPrep';
import { effectiveRepColour } from '../../sensus/colourSettings';
import { slugify } from '../../../runtime/router';
import { resampleScale, colorAt, type ScaleSpec } from 'shell-kit';

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
export function RingSvg({ ring, size = 300 }: { ring: [number, number][]; size?: number }) {
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
      <Badge text="P07 · High-Shell · Boundary · live aufgelöst" />
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
          <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 8 }}>
            Live aus <code>buildOriginPackage</code> — reale UTF-8-Größe. Als L0-Manifest trägt sie später bbox +
            Verweise (<code>OriginManifest</code>). Die Reveal-Animation liegt im Tab <strong>Intro</strong>.
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#a0aec0' }}>— keine Representation auflösbar.</div>
      )}
    </div>
  );
}

// ── P07 · Intro (reveal-engine, High-Shell) ─────────────────────────────────
export function IntroView() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <Badge text="P07 · High-Shell · Intro (reveal-engine)" />
      <div style={{ fontSize: 12, color: '#2d3748', lineHeight: 1.6, margin: '0 0 10px' }}>
        Das <strong>stille Einloggen</strong> in die Representation: die <strong>reveal-engine</strong> ist die
        High-Shell-Engine, die den Boundary-Reveal spielt. Sie <em>produziert</em> die reveal-engine → <strong>Shell</strong> (high)
        und <em>verbraucht</em> <code>origin-boundary</code> (Origin · L0).
      </div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => playReveal()} style={{
          fontSize: 12, padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
          border: '1px solid #2b6cb0', background: '#ebf8ff', color: '#1a365d', fontWeight: 600,
        }}>▶ Reveal-Vorschau abspielen</button>
        <span style={{ fontSize: 10.5, color: '#a0aec0', marginLeft: 8 }}>
          spielt im <strong>Inspector</strong> (rechte Karte) — Karte muss offen sein.
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.55 }}>
        Ablauf: weißer Screen vor der schon fokussierten Karte → das Boundary-Fenster wächst (langsam) und legt
        die OSM frei → der weiße Invert-Fill dimmt aus → die Boundary blendet ein und bleibt stehen.
        Volle Spec: <code>docs/anthem_snapshot_spec.md</code> (Boundary-Reveal).
      </div>
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
function NetSvg({ stretches, nodes = false, bounds }: {
  stretches: { points: [number, number][] }[]; nodes?: boolean; bounds?: NetBounds | null;
}) {
  const b = bounds ?? boundsOf(stretches);
  if (!b) return null;
  const { minLat, maxLat, minLon, maxLon } = b;
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const w = ((maxLon - minLon) * kx) || 1, h = (maxLat - minLat) || 1;
  // Normalisierte viewBox; das SVG skaliert per CSS responsiv in seinen Container.
  const NOM = 300;
  const k = NOM / Math.max(w, h);
  const vbW = w * k, vbH = h * k;
  const r = Math.max(vbW, vbH) * 0.006;
  const X = (lon: number) => (lon - minLon) * kx * k;
  const Y = (lat: number) => (maxLat - lat) * k;
  return (
    <svg viewBox={`0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}`} preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}>
      {stretches.map((s, i) => (
        <polyline key={i} points={s.points.map(([lat, lon]) => `${X(lon).toFixed(1)},${Y(lat).toFixed(1)}`).join(' ')}
          fill="none" stroke="#4a5568" strokeWidth={1} strokeOpacity={0.85}
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
      {nodes && stretches.flatMap((s, si) => s.points.map(([lat, lon], pi) => (
        <circle key={`${si}-${pi}`} cx={X(lon)} cy={Y(lat)} r={r} fill="#3182ce" fillOpacity={0.7} />
      )))}
    </svg>
  );
}

// ── P09 Colour-Sampling (Coloursample) · Schauglas ──────────────────────────
// Das Farb-Pendant zum Wegnetz-Sampling: der autorierte (stetige) Gradient wird
// beim Publish in ORIGIN_STAGE_COUNT gleiche Stufen-Felder zerschnitten
// (shell-kit resampleScale). Macht sichtbar, was auf der Karte unsichtbar bleibt:
// der gelieferte Verlauf ist FAST identisch (colorAtBorders interpoliert durch die
// Feld-Mitten) — die Diskretisierung steckt in den 6 STUFEN, nicht im Pixel.
function resolveDemoColour() {
  const rep = REPRESENTATIONS.find((r) => /lichtenberg/i.test(r.id) || /lichtenberg/i.test(r.name)) ?? REPRESENTATIONS[0];
  const geo = rep?.geometry_id ? geometryById(rep.geometry_id) : undefined;
  const regionSlug = slugify(geo?.region ?? '') || 'default';
  const c = effectiveRepColour(regionSlug);
  const authored: ScaleSpec = { stops: c.stops, borders: c.borders, spreizung: c.spreizung, verjuengung: c.verjuengung };
  const sampled = resampleScale(authored, ORIGIN_STAGE_COUNT);
  return { rep, regionSlug, authored, sampled };
}

// Stetiger Verlauf einer Skala als CSS-linear-gradient (colorAt an N Stützstellen).
function gradientCss(scale: ScaleSpec, n = 48): string {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); parts.push(`${colorAt(t, scale)} ${(t * 100).toFixed(1)}%`); }
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

function GradientBar({ scale, label, note }: { scale: ScaleSpec; label: string; note: string }) {
  return (
    <div style={{ margin: '0 0 14px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2d3748', marginBottom: 3 }}>{label}</div>
      <div style={{ height: 26, borderRadius: 5, background: gradientCss(scale), border: '1px solid #e2e8f0' }} />
      <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 3 }}>{note}</div>
    </div>
  );
}

export function ColoursampleView() {
  const { rep, authored, sampled } = resolveDemoColour();
  const n = sampled.stops.length;
  const borders = sampled.borders ?? [];
  // Feld-Last-Bereiche [unten, oben) je Stufe.
  const range = (i: number) => {
    const lo = i === 0 ? 0 : borders[i - 1];
    const hi = i === n - 1 ? 1 : borders[i];
    return `${lo.toFixed(2)}–${hi.toFixed(2)}`;
  };
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>
      <Badge text={`P09 · Origin-Capsuler · Colour-Sampling → ${n} Stufen · live`} />
      <div style={{ fontSize: 11, color: '#718096', margin: '0 0 14px', lineHeight: 1.5 }}>
        Das Farb-Pendant zum Wegnetz-Sampling: der autorierte (stetige) Gradient von
        „{rep?.name ?? '—'}" wird beim Publish in <strong>{n} gleich große Stufen-Felder</strong> zerschnitten
        (<code>resampleScale</code>) — jedes bekommt die treffendste Farbe an seiner Feld-Mitte. Darum sieht
        das Mesh fast gleich aus: die Diskretisierung steckt in den <strong>Stufen</strong>, die <code>stageOf</code>
        liest, nicht in der gemalten Farbe.
      </div>

      <GradientBar scale={authored} label="① Autoriert (stetig)" note={`Editor-Gradient · ${authored.stops.length} Farben + Spreizung — die feine Vorlage.`} />
      <GradientBar scale={sampled} label="② Geliefert (Mesh)" note="Was die Karte zeigt: colorAt interpoliert durch die Feld-Mitten → fast identisch zu ①." />

      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2d3748', marginBottom: 4 }}>③ {n} Stufen <span style={{ fontWeight: 400, color: '#a0aec0' }}>· was stageOf sieht (unsichtbar auf der Karte)</span></div>
      <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {sampled.stops.map((col, i) => (
          <div key={i} style={{ flex: 1, height: 46, background: col, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{i + 1}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 2 }}>
        {sampled.stops.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#a0aec0' }}>{range(i)}</div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 10, lineHeight: 1.5 }}>
        Gleichmäßige Grenzen <code>[{borders.map((b) => b.toFixed(2)).join(', ')}]</code> · neutrale Spreizung.
        Ein Knopf: <code>ORIGIN_STAGE_COUNT = {ORIGIN_STAGE_COUNT}</code>. Wirkt im Bundle erst nach Republish.
      </div>
    </div>
  );
}

// ── P08 Wegnetz-Sampling · Pipeline-Vergleich (ohne Tabs) ────────────────────
export function WegnetzCompareView() {
  const { net, origin } = resolveDemo();
  const r = origin?.originNet;
  if (!net || !r) return <div style={{ fontSize: 12, color: '#a0aec0' }}>— kein Netz auflösbar.</div>;
  const edges = net.edges as unknown as { points: [number, number][] }[];
  const bounds = boundsOf(edges); // geteilter Maßstab für alle drei Boxen
  const exampleId = r.stretches.length > 0 ? `${r.stretches[0].id}#0` : '—';

  const stages: { title: string; svg: ReactNode; lines: string[] }[] = [
    {
      title: '1 · Quell-Netz',
      svg: <NetSvg stretches={edges} bounds={bounds} nodes />,
      lines: ['Das rohe committete Netz (Quelle, Konvergenz).', `${edges.length} Kanten · unregelmäßige Vertices.`],
    },
    {
      title: `2 · Sampling @${MVP_RESAMPLE_TARGET_METERS} m`,
      svg: <NetSvg stretches={r.stretches} bounds={bounds} nodes />,
      lines: ['merge → Douglas-Peucker → Bogenlängen-Resampling.', 'Gleichmäßige Sample-Knoten, pro Strecke gleiche Teilung.'],
    },
    {
      title: '3 · Mesh-Output',
      svg: <NetSvg stretches={r.stretches} bounds={bounds} />,
      lines: [`Produkt: ${r.segmentCount} Segmente · ${r.stretchCount} Strecken.`, 'Geometrie (1×) + Segment-IDs → Origin.'],
    },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto' }}>
        <Badge text={`P09 · Origin-Capsuler · Wegnetz-Sampling @${MVP_RESAMPLE_TARGET_METERS} m · live`} />
        <div style={{ fontSize: 11, color: '#718096', margin: '0 0 12px', lineHeight: 1.45, maxWidth: 600 }}>
          Die Sampling-Pipeline im direkten Vergleich: vom rohen committeten Netz über das Abtasten zum
          gesampelten <strong>origin-net</strong> mit stabilen Segment-IDs.
        </div>
      </div>
      {/* Höhe füllt den Content dynamisch; Spalten brechen NICHT um (nowrap + minWidth:0). */}
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', gap: 14, flexWrap: 'nowrap', alignItems: 'stretch' }}>
        {stages.map((s) => (
          <div key={s.title} style={{
            flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column',
            border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#fbfdff',
          }}>
            <div style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>{s.title}</div>
            <div style={{ flex: '1 1 auto', minHeight: 0 }}>{s.svg}</div>
            <div style={{ flex: '0 0 auto', marginTop: 10, paddingTop: 8, borderTop: '1px solid #edf2f7', fontSize: 11, color: '#718096', lineHeight: 1.5 }}>
              {s.lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: '0 0 auto', fontSize: 10.5, color: '#a0aec0', marginTop: 10 }}>
        Knoten-Punkte zeigen den Unterschied: rohe Vertices (links) vs. gleichmäßige Sample-Punkte (Mitte).
        Beispiel-Segment-ID: <code>{exampleId}</code> (Format stretchId#segIndex). Größen-Trade-off (3/10/25 m): siehe <strong>P11</strong>.
      </div>
    </div>
  );
}
