// i-Pills — Builder-Info-Pills, segmentiert nach Audience (Operator · Analyst · Editor).
// Erreichbar über das (freigewordene) Lower-Left-Feld des Substrat-Tetraeders; das
// Panel selbst ist operator-only (Substrat-Sperre) — die Audience-Tabs sind also die
// Operator-Vorschau dessen, was jede Rolle bekommt (Pendant zum Pathworks-Infoblatt).
import { ShellRunBadge } from '../ShellRunInfo';
import { AnthemCycleBadge } from '../AnthemCycleInfo';
import { BuilderClipboardBadge } from '../BuilderClipboardInfo';
import { AppManifestBadge } from '../AppManifestInfo';
import { PathworksHubBadge } from '../PathworksHubInfo';
import type { TabId } from '../panelRegistry';

type Audience = 'operator' | 'analyst' | 'editor';

const PILLS: { badge: React.ReactNode; name: string; desc: string; audiences: Audience[] }[] = [
  { badge: <ShellRunBadge />,          name: 'shell-run',       desc: 'Die lineare Shell-Strecke — Funktionen, Reihenfolge, Art & Status (transfer am Ende).', audiences: ['operator'] },
  { badge: <AnthemCycleBadge />,       name: 'anthem-run',      desc: 'Der zyklische Anthem-Pulse: 5-Min-Takt, Last-Mathematik und Refresh-Takt der Ziel-App.', audiences: ['operator'] },
  { badge: <BuilderClipboardBadge />,  name: 'build-clipboard', desc: 'Ziel-App-UX-Details fürs Bauen — Manifest, POI-Interaktion, BAK-Kaskade, Guidance.', audiences: ['operator'] },
  { badge: <AppManifestBadge />,       name: 'i-manifest',      desc: 'Das App-Manifest der Ziel-App — Marke & UX (Slogan „Geh deinen Weg", Leitsätze).', audiences: ['operator'] },
  { badge: <PathworksHubBadge />,      name: 'pathworks-hub-clipboard', desc: 'Arbeitstisch der Drehscheibe Pathworks Hub — tote Knöpfe, Default-Verhalten, Umbau-Anschlüsse.', audiences: ['operator', 'editor'] },
];

const AUDIENCE_BY_TAB: Record<string, Audience> = {
  input: 'operator', result: 'analyst', validation: 'editor',
};

const AUDIENCE_INFO: Record<Audience, { label: string; color: string; intro: string }> = {
  operator: { label: 'Operator', color: '#b7791f', intro: 'Alle Builder-Werkzeuge: Du baust, misst und spielst aus. Jede Pill öffnet ihr Modal.' },
  analyst:  { label: 'Analyst',  color: '#2b6cb0', intro: 'Read-only-Perspektive: Du prüfst und verstehst. Relevant ist v. a. das App-Manifest (Marke & UX).' },
  editor:   { label: 'Editor',   color: '#2f855a', intro: 'Regio-Editor (künftig): Du pflegst den Inhalt einer Region. Basis-Infos zu Marke und Pathworks-Drehscheibe.' },
};

export default function IPillsPanel({ activeTab }: { activeTab?: TabId }) {
  const audience: Audience = AUDIENCE_BY_TAB[activeTab ?? 'input'] ?? 'operator';
  const info = AUDIENCE_INFO[audience];
  const pills = PILLS.filter((p) => p.audiences.includes(audience));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#fff', background: info.color, borderRadius: 4,
        }}>
          i-Pills · {info.label}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 16px' }}>
        {info.intro}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pills.map((p) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 13px', background: '#fff',
          }}>
            <div style={{ flexShrink: 0, paddingTop: 1 }}>{p.badge}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748', fontFamily: 'ui-monospace, Menlo, monospace' }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, marginTop: 2 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic' }}>
        Operator-Werkzeug. Die Tabs zeigen, was jede Rolle bekommt; non-operator sehen das Panel gar nicht (Substrat-Sperre).
      </div>
    </div>
  );
}
