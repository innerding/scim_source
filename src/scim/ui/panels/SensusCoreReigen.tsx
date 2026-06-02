// Sensus-Core-Reigen (Erklärschritt, analog RuntimeFlowExplainer) — der Builder-
// Plan: jede Rolle baut ihr Paket (Transmitter→Anthem · High/Deep-Shell→Shell ·
// Origin-Capsuler→Origin), Sensus Core Publishing (P11) schnürt + spielt aus.
// Shell/Origin/Anthem entstehen erst hier. Heimat P11. Reine Doku/Anzeige.
// Einzeilig (nowrap), kein verordneter Umbruch.

import type { OriginPackage } from '../../sensus/originPackage';
import { fmtBytes } from '../../sensus/formatBytes';

type Tone = 'rep' | 'shell' | 'origin' | 'anthem' | 'publish';
const TONES: Record<Tone, [string, string]> = {
  rep: ['#fffaf0', '#dd6b20'],      // committete Representation (Quelle)
  shell: ['#f7fafc', '#718096'],    // Shell — Engines (lang)
  origin: ['#ebf8ff', '#3182ce'],   // Origin — statisch (mittel)
  anthem: ['#f0fff4', '#38a169'],   // Anthem — flüchtig (kurz)
  publish: ['#faf5ff', '#9f7aea'],  // Publishing (P11)
};

function Chip({ label, tone, sub }: { label: string; tone: Tone; sub?: string }) {
  const [bg, bd] = TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0,
      fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
      background: bg, border: `1px solid ${bd}`, color: '#2d3748', whiteSpace: 'nowrap',
    }}>
      {label}
      {sub && <span style={{ fontSize: 9.5, color: '#a0aec0' }}>{sub}</span>}
    </span>
  );
}

const Arrow = () => <span style={{ color: '#cbd5e0', flexShrink: 0 }}>→</span>;

export default function SensusCoreReigen({ origin }: { origin: OriginPackage | null }) {
  const originCount = origin?.particles.length ?? 0;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Reigen — Bauer → Pakete → Publishing</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 10px', lineHeight: 1.45 }}>
        Jede Rolle <strong>baut ihr Paket</strong>. <strong>Sensus Core Publishing</strong> (P11) schnürt
        <strong> Shell · Origin · Anthem</strong> und spielt aus — diese drei Begriffe entstehen erst hier.
      </div>

      {/* Die Kette — einzeilig (nowrap), bei Bedarf horizontal scrollbar. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        <Chip label="Representation" tone="rep" sub={origin ? `„${origin.repName}" v${origin.version}` : 'committet'} />
        <Arrow />
        <Chip label="Origin-Capsuler → Origin" tone="origin" sub={origin ? `P09 · ${originCount} Partikel · Σ ${fmtBytes(origin.totalBytes)}` : 'P09'} />
        <Chip label="High+Deep-Shell → Shell" tone="shell" sub="P07 · P08" />
        <Chip label="Transmitter → Anthem" tone="anthem" sub="P06 · 5-Min" />
        <Arrow />
        <Chip label="Publishing" tone="publish" sub="P11 · schnürt + spielt aus" />
      </div>

      {/* Pakete nach Horizont */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', marginBottom: 4 }}>Pakete nach Horizont</div>
      <div style={{ fontSize: 11.5, color: '#2d3748', lineHeight: 1.6 }}>
        <div><span style={{ color: TONES.shell[1], fontWeight: 700 }}>Shell</span> — die <em>Engines</em> + UI/UX, lang. <strong>High-Shell (P07)</strong> ⊕ <strong>Deep-Shell (P08)</strong>.</div>
        <div><span style={{ color: TONES.origin[1], fontWeight: 700 }}>Origin</span> — die <em>statischen</em> Partikel (Boundary · Netz · POIs · Assets), mittel, erbt die Rep-Version. <strong>Origin-Capsuler (P09)</strong>.</div>
        <div><span style={{ color: TONES.anthem[1], fontWeight: 700 }}>Anthem</span> — die <em>flüchtige</em> Last (5-Min-Snapshot · presence), kurz. <strong>Transmitter (P06)</strong>.</div>
      </div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', margin: '8px 0 0' }}>
        Origin-Zahlen live aus <code>buildOriginPackage</code>; Shell/Anthem im MVP noch Modell.
      </div>
    </div>
  );
}
