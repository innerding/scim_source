// Drei Degrade-Buttons fürs Colour-Mesh (Gradient · DP · Atmen). Schwebt über der
// Karte; schaltet Effekte bei mangelnder Performance ab. Liest/schreibt meshRenderSettings.
import { useMeshSettings, setMeshSetting, type MeshSettings } from './meshRenderSettings';

const ITEMS: { k: keyof MeshSettings; label: string; title: string }[] = [
  { k: 'gradients', label: 'Gradient', title: 'Glatter Farbverlauf je Kante (aus = flach, billiger)' },
  { k: 'dpZoom',    label: 'DP',       title: 'Mesh vereinfachen: Glow weg + gröbere Kurve — entlastet beim Rauszoomen' },
  { k: 'atmen',     label: 'Atmen',    title: 'Sanftes Pulsieren des Overlays (aus = statisch)' },
];

export default function MeshToggles() {
  const s = useMeshSettings();
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 500, display: 'flex', gap: 4,
      background: 'rgba(13,21,32,0.80)', padding: '4px 6px', borderRadius: 8,
      fontFamily: 'system-ui, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <span style={{ fontSize: 9, color: '#718096', alignSelf: 'center', padding: '0 2px', letterSpacing: 0.5 }}>MESH</span>
      {ITEMS.map((it) => {
        const on = s[it.k];
        return (
          <button
            key={it.k}
            title={it.title}
            onClick={() => setMeshSetting(it.k, !on)}
            style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
              border: `1px solid ${on ? '#3182ce' : '#2d3748'}`,
              background: on ? '#2b6cb0' : 'transparent',
              color: on ? '#fff' : '#718096',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
