// V03 · t5 · Puls (Wahrheitskreislauf) — das GESICHT des hot path. Die TL-Animation
// als funktionale Anzeige: die drei Kernel an den Trygon-Ecken tragen Live-Zahlen.
//   AP (Anthem-Pulse)   = das real gemessene Lastbild (5-Min-Snapshot vom Worker).
//   CK (Comfort Kernel)  = system-seitige Lesart: wieviel Netz liegt im Comfort.
//   AK (Avoidance Kernel)= system-seitiger Vermeidungs-DRUCK: Segmente über Schwelle.
// Comfort & Route entstehen am GERÄT (Black Box) und verlassen es nie — hier steht
// die system-seitige Lesart aus dem gemessenen Lastbild, KEIN Geräte-Zustand.
import { useEffect, useState } from 'react';
import { REPRESENTATIONS } from '../../workspace/workspace.registry';
import { useRepresentationContext } from '../../../runtime/repContext';
import { useAuftraggeberRep } from '../../../runtime/useAuftraggeberRep';
import { fetchAnthem, anthemReadConfigured } from '../../../runtime/anthemApi';
import { TrygonLoopEmblem } from '../TrygonLoopEmblem';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const POLL_MS = 15000;
// Referenz-Schwelle: ab hier liest das System „außerhalb der Comfort-Zone". Der
// echte, pro-Nutzer eingestellte Comfort lebt am Gerät — dies ist die Lesart.
const COMFORT_CUTOFF = 0.66;

interface Snap { t: string; tMin: number; nextAtMin: number; loads: number[] }
interface Metrics { n: number; peak: number; avg: number; over: number; comfortShare: number }

function deriveMetrics(loads: number[]): Metrics | null {
  const n = loads.length;
  if (!n) return null;
  let peak = 0, sum = 0, over = 0;
  for (const l of loads) { if (l > peak) peak = l; sum += l; if (l > COMFORT_CUTOFF) over++; }
  return { n, peak, avg: sum / n, over, comfortShare: (n - over) / n };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function KernelCard({ tag, name, role, color, lines, dim }: {
  tag: string; name: string; role: string; color: string;
  lines: { k: string; v: string }[]; dim: boolean;
}) {
  return (
    <div style={{
      width: 156, border: `1px solid ${dim ? '#e2e8f0' : color}`, borderRadius: 8,
      background: dim ? '#f7fafc' : '#fff', padding: '7px 9px',
      boxShadow: dim ? 'none' : `0 1px 4px ${color}22`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: dim ? '#a0aec0' : color }}>{tag}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: dim ? '#a0aec0' : '#2d3748' }}>{name}</span>
      </div>
      <div style={{ fontSize: 9, color: '#a0aec0', marginBottom: 5 }}>{role}</div>
      {lines.map((l) => (
        <div key={l.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.7 }}>
          <span style={{ color: '#718096' }}>{l.k}</span>
          <span style={{ color: dim ? '#cbd5e0' : '#1a202c', fontWeight: 700 }}>{l.v}</span>
        </div>
      ))}
    </div>
  );
}

export default function V03PulsePanel() {
  const rep = useAuftraggeberRep();
  const { setInspectorAsset } = useRepresentationContext();
  const [snap, setSnap] = useState<Snap | null>(null);
  const [cold, setCold] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anthemReadConfigured()) return;
    let alive = true;
    const tick = () => {
      setLoading(true);
      fetchAnthem(rep.id)
        .then((s) => { if (!alive) return; setSnap(s as Snap); setCold(false); setErr(null); })
        .catch((e) => {
          if (!alive) return;
          const msg = (e as Error).message;
          if (msg.startsWith('425')) { setCold(true); setSnap(null); setErr(null); }
          else { setErr(msg); setSnap(null); setCold(false); }
        })
        .finally(() => { if (alive) setLoading(false); });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [rep.id]);

  const m = snap ? deriveMetrics(snap.loads) : null;
  const live = !!m;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          V03 · t1 · Puls (Wahrheitskreislauf)
        </div>
        <AnthemCycleBadge />
      </div>
      <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.55, margin: '2px 0 12px' }}>
        Das <strong>Gesicht des hot path</strong>: der Trygon-Loop als <em>laufende Anzeige</em>. Die drei Kernel
        an den Ecken tragen Live-Zahlen aus dem 5-Min-Lastbild. <strong>AP</strong> misst (real gemessen),
        <strong> CK</strong> liest den Comfort, <strong>AK</strong> zeigt den Vermeidungs-Druck.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>Representation:</span>
        <select
          value={rep.id}
          onChange={(e) => setInspectorAsset({ kind: 'representation', id: e.target.value })}
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', color: '#1a365d' }}
        >
          {REPRESENTATIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {loading && <span style={{ fontSize: 10.5, color: '#a0aec0' }}>… poll</span>}
        <span style={{
          fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 999,
          color: live ? '#22543d' : '#718096', background: live ? '#f0fff4' : '#f7fafc',
          border: `1px solid ${live ? '#9ae6b4' : '#e2e8f0'}`,
        }}>
          {live ? '● Loop läuft' : cold ? '○ kalt — kein Gerät präsent' : '○ —'}
        </span>
      </div>

      {!anthemReadConfigured() ? (
        <div style={{ fontSize: 11.5, color: '#a0aec0', fontStyle: 'italic' }}>
          Worker nicht konfiguriert — VITE_WORKER_URL setzen. (Nach Worker-Deploy pulst hier der Loop.)
        </div>
      ) : err ? (
        <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#c05621' }}>✗ {err}</div>
      ) : (
        <>
          {/* Das Instrument: TL-Animation mittig, die drei Kernel an den Trygon-Ecken.
              Genug Höhe + Emblem-Offset, damit die obere AP-Karte (4 Zeilen) die
              Animation NICHT mehr überdeckt. */}
          <div style={{ position: 'relative', width: 380, height: 392, margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: 134, left: '50%', transform: 'translateX(-50%)' }}>
              <TrygonLoopEmblem size={150} withLegend={false} animated />
            </div>

            {/* AP — oben (Apex) */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <KernelCard
                tag="AP" name="Anthem-Pulse" role="misst die Last" color="#2b6cb0" dim={!live}
                lines={live && m ? [
                  { k: 'peak', v: pct(m.peak) },
                  { k: 'ø last', v: pct(m.avg) },
                  { k: 'segmente', v: String(m.n) },
                  { k: 'puls t', v: snap?.t ?? '—' },
                ] : [{ k: 'last', v: '—' }, { k: 'segmente', v: '—' }]}
              />
            </div>

            {/* CK — unten links */}
            <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
              <KernelCard
                tag="CK" name="Comfort Kernel" role="beobachtet Comfort" color="#2f855a" dim={!live}
                lines={live && m ? [
                  { k: 'im comfort', v: pct(m.comfortShare) },
                  { k: 'schwelle', v: pct(COMFORT_CUTOFF) },
                ] : [{ k: 'im comfort', v: '—' }]}
              />
            </div>

            {/* AK — unten rechts */}
            <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
              <KernelCard
                tag="AK" name="Avoidance Kernel" role="handelt: Deeskalation" color="#c05621" dim={!live}
                lines={live && m ? [
                  { k: 'über schwelle', v: String(m.over) },
                  { k: 'druck', v: pct(m.n ? m.over / m.n : 0) },
                ] : [{ k: 'über schwelle', v: '—' }]}
              />
            </div>
          </div>

          {cold && (
            <div style={{ fontSize: 11, color: '#718096', textAlign: 'center', marginTop: 4 }}>
              Kein Gerät präsent — der Worker liefert erst ein Lastbild, sobald eine Ziel-App klopft.
              Die Anzeige steht bereit und pulst, sobald der Loop warm wird.
            </div>
          )}
        </>
      )}

      <div style={{
        fontSize: 10.5, color: '#744210', background: '#fffbeb', border: '1px solid #faf0d2',
        borderRadius: 6, padding: '7px 10px', marginTop: 14, lineHeight: 1.5,
      }}>
        <strong>Black Box.</strong> Comfort und Route entstehen am Gerät und verlassen es nie. <strong>AP</strong> ist
        real gemessen (das ausgestrahlte Lastbild). <strong>CK</strong> und <strong>AK</strong> sind die
        <em> system-seitige Lesart</em> dieses Lastbilds gegen eine Referenz-Schwelle ({pct(COMFORT_CUTOFF)}) —
        kein Geräte-Zustand, sondern was der Loop von hier aus sieht.
      </div>
    </div>
  );
}
