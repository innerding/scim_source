// i-Pills — die zentrale Übersicht der Builder-Info-Pills (shell-run · anthem-run ·
// build-clipboard). Erreichbar über das (freigewordene) Lower-Left-Feld des Substrat-
// Tetraeders. Die Pills sind „von hier verteilt": dieselben Badges sitzen zusätzlich an
// ihren Heimat-Orten (Shell-Studio, Thresholds, V03 …). Operator-only via Substrat-Sperre.
import { ShellRunBadge } from '../ShellRunInfo';
import { AnthemCycleBadge } from '../AnthemCycleInfo';
import { BuilderClipboardBadge } from '../BuilderClipboardInfo';
import { AppManifestBadge } from '../AppManifestInfo';
import { PathworksHubBadge } from '../PathworksHubInfo';

const PILLS: { badge: React.ReactNode; name: string; desc: string }[] = [
  { badge: <ShellRunBadge />,          name: 'shell-run',       desc: 'Die lineare Shell-Strecke — Funktionen, Reihenfolge, Art & Status (transfer am Ende).' },
  { badge: <AnthemCycleBadge />,       name: 'anthem-run',      desc: 'Der zyklische Anthem-Pulse: 5-Min-Takt, Last-Mathematik und Refresh-Takt der Ziel-App.' },
  { badge: <BuilderClipboardBadge />,  name: 'build-clipboard', desc: 'Ziel-App-UX-Details fürs Bauen — Manifest, POI-Interaktion, BAK-Kaskade, Guidance.' },
  { badge: <AppManifestBadge />,       name: 'i-manifest',      desc: 'Das App-Manifest der Ziel-App — Marke & UX (Slogan „Geh deinen Weg", Leitsätze).' },
  { badge: <PathworksHubBadge />,      name: 'pathworks-hub-clipboard', desc: 'Arbeitstisch der Drehscheibe Pathworks (Hub) — tote Knöpfe, Default-Verhalten, Umbau-Anschlüsse.' },
];

export default function IPillsPanel() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          i-Pills · Builder-Infos (zentrale Übersicht)
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 16px' }}>
        Die Info-Pills an einem Ort. Jede Pill öffnet ihr Modal; dieselben Pills sitzen
        „von hier verteilt" zusätzlich an ihren Heimat-Orten (Shell-Studio, Thresholds, V03 …).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PILLS.map((p) => (
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
        Operator-Werkzeug. Über das Substrat-Feld erreichbar; für non-operator gesperrt.
      </div>
    </div>
  );
}
