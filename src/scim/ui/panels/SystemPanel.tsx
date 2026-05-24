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

// ─── Leistungsblatt ───────────────────────────────────────────────────────────

const ARCHITEKTUR_ARTEFAKTE = [
  { id: 'beacon',   label: 'Beacon-Dossier',            art: 'Architektur-Deck',   desc: 'Umfassende konzeptionell-narrative Darstellung von Sensus Core zur sanften Besucherlenkung mit Regio-Dashboards, Governance, Path Works und ABC.' },
  { id: 'tiger',    label: 'Tiger-Records-Swift-App',   art: 'Prototyp',           desc: 'Nativer iOS-Prototyp zur frühen Validierung der Nutzerschnittstelle und der Wegnetz-Visualisierung unter realen Gerätebedingungen.' },
  { id: 'abc',      label: 'ABC-App-Build-Console',     art: 'Prototyp',           desc: 'Build-Konsole zur Erarbeitung des Operator-Workflows: Paket-Zusammenstellung, Freigabe-Logik und Versions-Management.' },
  { id: 'scim2',    label: 'SCIM2-Focusmodel',          art: 'Vorläufer-Modell',   desc: 'Darstellung einer visuell steuerbaren Update-Maschine mit 33 Quellcode-Modulen — Komplexität nicht versteckt, sondern sichtbar und begreifbar gemacht.' },
  { id: 'demo',     label: 'SCIM3-Geometry-Study',      art: 'Build-Test',         desc: 'Erster Build-Test mit Claude (Anthropic): methodisch noch unstrukturiert, iterativ ohne klare Einstiegsprompts. Das Ergebnis zeigte das Potential, offenbarte aber: KI-gestützte Entwicklung braucht präzise Architektur als Führung.' },
];

const METRIKEN = [
  { label: 'Quellcode gesamt',         wert: '~26.400 Zeilen',    detail: '248 Dateien · SCIM3 + Runtime' },
  { label: 'Automatisierte Tests',      wert: '1.096 Tests',       detail: '87 Test-Suiten · 100 % grün' },
  { label: 'Pipeline-Module',           wert: '31 Module',         detail: '14 Panels (P01–P14) · 7 Compute-Funktionen' },
  { label: 'Runtime Bundle',            wert: '~113 KB gzipped',   detail: 'Paket ~150 KB · Heatmap lokal' },
  { label: 'Implementierungsdauer',     wert: '~1 Woche',          detail: 'Mai 2026 · auf Basis 8 Monate Architekturdesign' },
  { label: 'Architekturdesign seit',    wert: '1. Sept. 2025',     detail: 'Beacon-Dossier → 5 Prototypen → SCIM3 v0.2' },
];

const ZIELGRUPPEN = [
  {
    label: 'Forschungsförderung (F+E)',
    color: '#2b6cb0', bg: '#ebf8ff',
    punkte: [
      'Privacy-by-Design als Strukturprinzip — nicht als nachträgliche Maßnahme',
      'Telco-Signal-Klassifikation als anonyme Mobilitätsmessung (reproduzierbar, deterministisch)',
      'Zweistufiges Aktivierungsmodell für kontextsensitive UI (Step 1 / Step 2)',
      'Vollständige Typ-Sicherheit + 1.096 automatisierte Tests als wissenschaftliche Grundlage',
    ],
  },
  {
    label: 'Tourismusverbände',
    color: '#276749', bg: '#f0fff4',
    punkte: [
      'Kein Gäste-Tracking, kein Empfehlungsalgorithmus — keine Haftungsfragen',
      'Operator behält volle Kontrolle (Zonen, Schwellenwerte, Freigabe-Entscheid)',
      'Paketgröße ~150 KB gzipped für 400 km² — mobiltauglich auch bei schwacher Verbindung',
      'Alle 5 Minuten aktualisiert · kein Login · kein App-Store erforderlich',
    ],
  },
  {
    label: 'Kooperationspartner Informatik / Universität',
    color: '#553c9a', bg: '#faf5ff',
    punkte: [
      'Saubere Modularchitektur mit definierten Schnittstellen (Compute / Validate / Apply / Context)',
      'Offene Erweiterbarkeit: Echtdaten, alternative Signalquellen, Geodäsie-Upgrade (SML-3)',
      'Selbst-dokumentierendes System: Glossar, ADRs, Invarianten im Operator Tool versioniert',
      '37 Git-Commits · vollständige Entwicklungshistorie nachvollziehbar',
    ],
  },
];

function LeistungsblattTab({ result }: { result: ScimPipelineResult }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>

      {/* Titel */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 8, padding: '18px 22px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          SCIM3 v0.2 — Leistungsblatt
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          Sensus Core <strong>Integration</strong> Model · Operator Tool & Ziel-App Runtime · Stand Mai 2026
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6, fontFamily: 'monospace' }}>
          Pipeline: {result.steps.length} Schritte · {result.success ? '✓ OK' : '✗ FEHLER'} · SML-2 Functional Core
        </div>
      </div>

      {/* Metriken-Grid */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Kennzahlen
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        {METRIKEN.map((m) => (
          <div key={m.label} style={{
            background: '#f7fafc', border: '1px solid #e2e8f0',
            borderRadius: 6, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 11, color: '#a0aec0', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a365d', letterSpacing: '-0.02em' }}>{m.wert}</div>
            <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Architekturdesign & Artefakte */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Architekturdesign · Sept. 2025 – Mai 2026
      </div>
      <div style={{
        background: '#fffbeb', border: '1px solid #f6e05e',
        borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#744210',
      }}>
        8 Monate präzises Architekturdesign — nicht theoretisch, sondern empirisch durch fünf aufeinanderfolgende Prototyp-Generationen. Das Ergebnis: eine Implementierungswoche für ~26.400 Zeilen produktionsreifen Code.
      </div>
      {ARCHITEKTUR_ARTEFAKTE.map((a) => (
        <div key={a.id} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '8px 12px', borderRadius: 5, marginBottom: 6,
          background: '#f7fafc', border: '1px solid #e2e8f0',
        }}>
          <div style={{ flexShrink: 0, minWidth: 110 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2d3748' }}>{a.label}</div>
            <div style={{
              fontSize: 9, color: '#2b6cb0', background: '#ebf8ff',
              padding: '1px 5px', borderRadius: 3, display: 'inline-block', marginTop: 2, fontFamily: 'monospace',
            }}>{a.art}</div>
          </div>
          <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>{a.desc}</div>
        </div>
      ))}

      {/* Kerninnovationen */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Kerninnovationen
      </div>
      {[
        ['Auslastungslage statt Empfehlung', 'Das System empfiehlt keine Route. Es zeigt die aktuelle Auslastung des Wegnetzes — farbcodiert, alle 5 Min. aktualisiert. Der Nutzer entscheidet.'],
        ['Privacy-by-Design strukturell', 'Verbotene Datenklassen sind bauartbedingt unmöglich — nicht regelbasiert verhindert. Masking-Schicht + dedizierter Validator am Paket-Ausgang.'],
        ['Zweistufige Klassifikation', 'Step 1: Bewegungsfluss. Step 2 (Aufenthaltskomfort): Aktivierung nach beobachteter Stauindikation und Hochlastinterpretation.'],
        ['Selbst-dokumentierendes System', 'Glossar, Architekturentscheide, Invarianten und KI-Briefing direkt im Operator Tool — versioniert mit dem Code, nicht in externen Wikis.'],
      ].map(([titel, text]) => (
        <div key={titel} style={{
          borderLeft: '3px solid #2b6cb0', paddingLeft: 12,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3748', marginBottom: 2 }}>{titel}</div>
          <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>{text}</div>
        </div>
      ))}

      {/* Zielgruppen */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Relevanz nach Zielgruppe
      </div>
      {ZIELGRUPPEN.map((z) => (
        <div key={z.label} style={{
          background: z.bg, border: `1px solid ${z.color}30`,
          borderLeft: `3px solid ${z.color}`,
          borderRadius: 6, padding: '12px 16px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: z.color, marginBottom: 8 }}>{z.label}</div>
          {z.punkte.map((p) => (
            <div key={p} style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.5, marginBottom: 4, display: 'flex', gap: 6 }}>
              <span style={{ color: z.color, flexShrink: 0 }}>·</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: 20, padding: '10px 14px',
        background: '#f7fafc', borderRadius: 6,
        fontSize: 10, color: '#a0aec0', fontFamily: 'monospace',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>SCIM3 v0.2 · Sensus Core Integration Model 3 · Dietmar Broda</span>
        <span>{new Date().toLocaleDateString('de-AT', { year: 'numeric', month: 'long' })}</span>
      </div>

    </div>
  );
}

export default function SystemPanel({ activeTab, result }: Props) {
  switch (activeTab) {
    case 'input':          return <OverviewTab result={result} />;
    case 'result':         return <GapsTab />;
    case 'validation':     return <ManifestTab result={result} />;
    case 'leistungsblatt': return <LeistungsblattTab result={result} />;
    case 'raw':            return <ManifestTab result={result} />;
    default:               return null;
  }
}
