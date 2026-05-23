import type { TabId } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';

interface Props {
  activeTab: TabId;
  result: ScimPipelineResult;
}

const KNOWN_GAPS = [
  {
    id: 'stub_context_types',
    label: 'Stub-Kontext-Typen',
    description: 'ScimContext hat { status: string } Stubs für P05–P12 — alle echten Typen erfordern Laufzeit-Casts.',
    severity: 'acknowledged',
    upgrade_level: 'SML-3',
  },
  {
    id: 'no_runtime_schema_validation',
    label: 'Keine Schema-Validierung',
    description: 'Zod ist installiert aber an Systemgrenzen noch nicht genutzt.',
    severity: 'acknowledged',
    upgrade_level: 'SML-3',
  },
  {
    id: 'no_persistence',
    label: 'Kein persistenter State',
    description: 'Kein State überlebt einen Neustart — alle Berechnungen beginnen von vorne.',
    severity: 'acknowledged',
    upgrade_level: 'SML-4',
  },
  {
    id: 'flat_earth_geo',
    label: 'Ebene-Erde-Geometrie',
    description: 'Cos-korrigierte Ebenenrechnung, keine echte Geodäsie (Haversine / Proj4).',
    severity: 'acknowledged',
    upgrade_level: 'SML-3',
  },
];

const SML_LEVELS = [
  { level: 'SML-0', label: 'Concept',        desc: 'Typen + Mocks' },
  { level: 'SML-1', label: 'Structural',     desc: 'Pipeline orchestriert, Validierung vorhanden' },
  { level: 'SML-2', label: 'Functional Core', desc: 'Echter Compute, echte Tests, echter Output', current: true },
  { level: 'SML-3', label: 'Hardened',       desc: 'Zod-Grenzen, korrekte Typen, Geodäsie' },
  { level: 'SML-4', label: 'Operational',    desc: 'Persistenz, Monitoring, Operator-UI vollständig' },
];

function OverviewTab({ result }: { result: ScimPipelineResult }) {
  const stepCount = result.steps.length;
  const failedAt = result.success ? null : result.failed_at_step;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#ebf8ff', border: '1px solid #bee3f8',
        borderRadius: 6, padding: '14px 18px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2b6cb0', marginBottom: 6 }}>
          ⊙ SCIM v0.2 · SML-2: Functional Core
        </div>
        <div style={{ fontSize: 12, color: '#4a90c4' }}>
          {stepCount} Pipeline-Schritte · {result.success ? '✓ Pipeline OK' : `✗ Fehlgeschlagen bei: ${failedAt}`}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Reifegrad-Stufen
      </div>
      {SML_LEVELS.map((s) => (
        <div key={s.level} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '7px 10px', borderRadius: 5, marginBottom: 3,
          background: s.current ? '#fffbeb' : 'transparent',
          border: s.current ? '1px solid #f6e05e' : '1px solid transparent',
        }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 11,
            color: s.current ? '#975a16' : '#718096', minWidth: 48,
          }}>
            {s.level}
          </span>
          <div>
            <div style={{ fontSize: 12, fontWeight: s.current ? 600 : 400, color: s.current ? '#975a16' : '#4a5568' }}>
              {s.label} {s.current && '← aktuell'}
            </div>
            <div style={{ fontSize: 11, color: '#a0aec0' }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GapsTab() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 16 }}>
        Alle Lücken sind bekannt und dokumentiert (severity: acknowledged).
        Sie blockieren den aktuellen Betrieb nicht.
      </div>
      {KNOWN_GAPS.map((g) => (
        <div key={g.id} style={{
          background: '#fffbeb', border: '1px solid #f6e05e',
          borderRadius: 6, padding: '12px 16px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#975a16' }}>{g.label}</span>
            <span style={{
              fontSize: 10, fontFamily: 'monospace', color: '#dd6b20',
              background: '#feebcb', padding: '2px 6px', borderRadius: 3,
            }}>
              → {g.upgrade_level}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#b7791f' }}>{g.description}</div>
          <div style={{ fontSize: 10, color: '#c5a040', marginTop: 4, fontFamily: 'monospace' }}>
            id: {g.id}
          </div>
        </div>
      ))}
    </div>
  );
}

const MANIFEST_PRINCIPLES = [
  {
    id: 'p1',
    label: 'Lagedarstellung, keine Empfehlung',
    content: 'SCIM bewertet Mobilfunksignale und erzeugt ein farbcodiertes Wegnetz. Die App zeigt Auslastung — sie empfiehlt keine Route. Der Nutzer entscheidet selbst.',
  },
  {
    id: 'p2',
    label: 'Einweg-Architektur',
    content: 'SCIM → Paket → App. Der Nutzer speist SCIM nicht. Kein Rückkanal erforderlich — das Nutzerverhalten ist bereits als aggregiertes Telco-Signal in den Eingabedaten enthalten.',
  },
  {
    id: 'p3',
    label: 'Kein Personenbezug — Transparenz statt Einwilligung',
    content: 'Die App verarbeitet keine personenbezogenen Daten. Slider-Position + grobe Tageszeit + Region-ID sind nicht rückführbar. Keine Einwilligung nötig — eine Einwilligung würde fälschlicherweise Identifikation suggerieren. Stattdessen: sichtbares (i) mit Erklärung.',
  },
  {
    id: 'p4',
    label: 'Heatmap lokal',
    content: 'Die Heatmap wird auf dem Gerät des Nutzers berechnet — nicht im Paket vorberechnet. Das Paket liefert das Wegnetz mit Auslastungswerten; die visuelle Darstellung ist Sache der App.',
  },
  {
    id: 'p5',
    label: 'Paketrhythmus: 5 Minuten + Slider-Event',
    content: 'Die App empfängt alle 5 Minuten unaufgefordert ein neues Paket. Zusätzlich wird bei Slider-Interaktion sofort lokal neu gefiltert. Das Paket ist statisch — die lokale Filterung ist dynamisch.',
  },
];

function ManifestTab({ result }: { result: ScimPipelineResult }) {
  const manifest = {
    engine_version: '0.2.0',
    maturity_level: 'SML-2',
    maturity_label: 'Functional Core',
    pipeline_steps: result.steps.length,
    pipeline_success: result.success,
    known_gaps: KNOWN_GAPS.map((g) => g.id),
    principles: MANIFEST_PRINCIPLES.map((p) => p.id),
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Leitprinzipien
      </div>
      {MANIFEST_PRINCIPLES.map((p) => (
        <div key={p.id} style={{
          background: '#f7fafc', border: '1px solid #e2e8f0',
          borderLeft: '3px solid #4a5568',
          borderRadius: 6, padding: '10px 14px', marginBottom: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3748', marginBottom: 4 }}>
            {p.label}
          </div>
          <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.6 }}>{p.content}</div>
        </div>
      ))}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Manifest JSON
      </div>
      <pre style={{
        background: '#1a202c', color: '#a0aec0', borderRadius: 6,
        padding: 16, fontSize: 11, fontFamily: 'monospace',
        overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0,
      }}>
        {JSON.stringify(manifest, null, 2)}
      </pre>
    </div>
  );
}

export default function SystemPanel({ activeTab, result }: Props) {
  switch (activeTab) {
    case 'input':      return <OverviewTab result={result} />;
    case 'result':     return <GapsTab />;
    case 'validation': return <ManifestTab result={result} />;
    case 'raw':        return <ManifestTab result={result} />;
    default:           return null;
  }
}
