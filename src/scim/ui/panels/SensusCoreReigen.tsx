// Sensus-Core-Reigen (Erklärschritt, analog RuntimeFlowExplainer/SimArchitecture)
// — macht den dramaturgischen Vorgang sichtbar: sobald eine Representation
// committet ist, legt Sensus Core den Bezug zur Origin an und löst über die
// Sicheln (Boundary · Wegnetz-Sampling · Engine-Prep) die atomaren Partikel auf,
// die in Shell · Origin · Anthem gekapselt werden. Heimat P11. Reine Doku/Anzeige.

import type { OriginPackage } from '../../sensus/originPackage';

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} kB` : `${(n / 1048576).toFixed(2)} MB`;

type Tone = 'rep' | 'sichel' | 'particle' | 'shell' | 'origin' | 'anthem';
const TONES: Record<Tone, [string, string]> = {
  rep: ['#fffaf0', '#dd6b20'],      // committete Representation (Quelle)
  sichel: ['#faf5ff', '#9f7aea'],   // die drei Build-Sicheln (bou/wns/epb)
  particle: ['#f7fafc', '#a0aec0'], // atomare Partikel
  shell: ['#f7fafc', '#718096'],    // Shell — Engines (lang)
  origin: ['#ebf8ff', '#3182ce'],   // Origin — statisch (mittel)
  anthem: ['#f0fff4', '#38a169'],   // Anthem — flüchtig (kurz)
};

function Chip({ label, tone, sub }: { label: string; tone: Tone; sub?: string }) {
  const [bg, bd] = TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
      fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
      background: bg, border: `1px solid ${bd}`, color: '#2d3748', whiteSpace: 'nowrap',
    }}>
      {label}
      {sub && <span style={{ fontSize: 9.5, color: '#a0aec0' }}>{sub}</span>}
    </span>
  );
}

const Arrow = () => <span style={{ color: '#cbd5e0' }}>→</span>;

export default function SensusCoreReigen({ origin }: { origin: OriginPackage | null }) {
  // Live-Zahlen je Sichel-Beitrag aus der aufgelösten Origin (falls vorhanden).
  const byId = new Map((origin?.particles ?? []).map((p) => [p.id, p]));
  const boundary = byId.get('origin-boundary');
  const net = byId.get('origin-net');
  const originCount = origin?.particles.length ?? 0;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 620, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Reigen — von der Representation zu den Kapseln</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 10px', lineHeight: 1.45 }}>
        Ist eine Representation committet, legt Sensus Core den <strong>Bezug zur Origin</strong> an
        und löst über die <strong>Sicheln</strong> die <strong>atomaren Partikel</strong> auf —
        gekapselt nach Horizont in <strong>Shell · Origin · Anthem</strong>.
      </div>

      {/* Die Kette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <Chip label="Representation" tone="rep" sub={origin ? `„${origin.repName}" v${origin.version}` : 'committet'} />
        <Arrow />
        <Chip label="Boundary" tone="sichel" sub={boundary ? boundary.detail : 'bou'} />
        <Arrow />
        <Chip label="Wegnetz-Sampling" tone="sichel" sub={net ? net.detail : 'wns'} />
        <Arrow />
        <Chip label="Engine-Prep" tone="sichel" sub="epb" />
        <Arrow />
        <Chip label="atomare Partikel" tone="particle" sub={originCount ? `${originCount} Origin-Partikel` : undefined} />
        <Arrow />
        <Chip label="Shell" tone="shell" sub="Engines · lang" />
        <Chip label="Origin" tone="origin" sub={origin ? `Σ ${fmtBytes(origin.totalBytes)} · mittel` : 'statisch · mittel'} />
        <Chip label="Anthem" tone="anthem" sub="Last · kurz" />
      </div>

      {/* Kapselung nach Horizont */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', marginBottom: 4 }}>Kapselung nach Horizont</div>
      <div style={{ fontSize: 11.5, color: '#2d3748', lineHeight: 1.6 }}>
        <div><span style={{ color: TONES.shell[1], fontWeight: 700 }}>Shell</span> — die generischen <em>Engines</em> (colorize · BCK · BAK), lange Lebensdauer (App-Version).</div>
        <div><span style={{ color: TONES.origin[1], fontWeight: 700 }}>Origin</span> — die <em>statischen</em> Partikel der Representation (Boundary · Netz · POIs · Assets), mittlere Lebensdauer, erbt die Rep-Version.</div>
        <div><span style={{ color: TONES.anthem[1], fontWeight: 700 }}>Anthem</span> — die <em>flüchtige</em> Last (5-Min-Snapshot · presence · user-exclusion), kurze Lebensdauer.</div>
      </div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', margin: '8px 0 0' }}>
        Sicheln = die drei Build-Schritte P07 <em>bou</em> · P08 <em>wns</em> · P09 <em>epb</em>. Origin-Zahlen
        live aus <code>buildOriginPackage</code>; Shell/Anthem im MVP noch Modell.
      </div>
    </div>
  );
}
