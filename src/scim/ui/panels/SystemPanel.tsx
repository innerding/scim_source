import { useState } from 'react';
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

// ─── v0.2 (archiviert, Mai 2026) ─────────────────────────────────────────────
// Eingefroren als historisches Dokument. Inhalte nicht mehr aendern; bei
// Bedarf neue Version (LeistungsblattV03Tab) ergaenzen.
function LeistungsblattV02Tab({ result }: { result: ScimPipelineResult }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>

      {/* Archiv-Hinweis */}
      <div style={{
        background: '#fef5e7', border: '1px solid #f6ad55',
        borderRadius: 6, padding: '8px 14px', marginBottom: 14,
        fontSize: 11, color: '#7b341e',
      }}>
        <strong>📜 Archiviert · Stand Mai 2026 · v0.2</strong><br/>
        Dieses Leistungsblatt ist als Dokument-Snapshot eingefroren. Aktuelle Kennzahlen siehe v0.3.
      </div>

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
        <span>Mai 2026 · archiviert</span>
      </div>

    </div>
  );
}

// ─── v0.3 (aktuell, Mai 2026) ────────────────────────────────────────────────

const METRIKEN_V03 = [
  { label: 'Quellcode gesamt',         wert: '~31.000 Zeilen',    detail: '251 Dateien · SCIM3 + Runtime + Worker' },
  { label: 'Automatisierte Tests',     wert: '518 Tests',         detail: '33 Test-Dateien · verifiziert 2026-05-26' },
  { label: 'Pipeline-Module',          wert: '14 P-Panels + 7 Compute', detail: 'Unverändert seit v0.2 · stabile Architektur' },
  { label: 'Region-Katalog',           wert: '2 Regionen',        detail: 'Grünberg (49 POIs) · Lichtenberg (11 POIs)' },
  { label: 'Icon- + Glyph-Bibliothek', wert: '49 SVG-Assets',     detail: '~38 POI-Icons · 11 Decoration-Glyphs · Frame' },
  { label: 'Git-Historie',             wert: '130 Commits',       detail: 'Auto-Deploy bei jedem Push (GitHub Actions → Cloudflare Pages)' },
];

const NEUERUNGEN_V03 = [
  { id: 'catalog', label: 'Region-Katalog-System', desc: 'Plan-md als deklarative Datenquelle pro Region. Parser, Serializer, Editor mit Diff-Patches im localStorage. Round-Trip-sicher: Export → md → Re-Import ohne Datenverlust.' },
  { id: 'lichtenberg', label: 'Lichtenberg als zweite Region', desc: 'Voller MVP-Datensatz: 11 POIs, 1 Cluster, recherchiert über OSM + Wikipedia. Beweis dass die Region-Architektur generisch ist, nicht Grünberg-spezifisch.' },
  { id: 'container', label: 'Container-System (ann_042)', desc: '6 Geometrien × 2 Farbvarianten = 12 Subkategorien. Geometrie + Farbe = visueller Container; Innensymbol = Differenzierung. Hexagon-Ring für Cluster, magenta.' },
  { id: 'decoration', label: 'Decoration-System (ann_044+)', desc: 'Frame-basierter Zifferncontainer mit parametrischer Breite. Erkennt automatisch 6 Decoration-Arten in der Tagline: m, km, A° (Anno), °, %, Sterne. Multi-Anker für Anno: A°, A., seit JJJJ.' },
  { id: 'ghost', label: 'Ghost-Cluster-POI (ann_048)', desc: 'Cluster-Identität als eigenständiger POI ohne eigene Coord — erbt vom Identity-Member. Trennt physisches Wahrzeichen (z.B. Giselawarte) von semantischer Cluster-Identität (z.B. „Gis").' },
  { id: 'editor-ux', label: 'Editor-UX-Verbesserungen', desc: 'Cluster-Sort-Modus (Gruppen sortiert nach Größe, Ghost → Identity → Rest). Änderungs-Popover mit Einzel-Verwerfen. Commit-on-Blur. Multi-Identity-Warning. Safari-Klick-Fixes.' },
];

const ZIELGRUPPEN_V03 = [
  {
    label: 'Forschungsförderung (F+E)',
    color: '#2b6cb0', bg: '#ebf8ff',
    punkte: [
      'Privacy-by-Design als Strukturprinzip — nicht als nachträgliche Maßnahme',
      'Telco-Signal-Klassifikation als anonyme Mobilitätsmessung (reproduzierbar, deterministisch)',
      'Zweistufiges Aktivierungsmodell für kontextsensitive UI (Step 1 / Step 2)',
      'Region-Katalog mit verlustfreiem Round-Trip Export ↔ Re-Import als Forschungs-Datenbasis',
    ],
  },
  {
    label: 'Tourismusverbände',
    color: '#276749', bg: '#f0fff4',
    punkte: [
      'Kein Gäste-Tracking, kein Empfehlungsalgorithmus — keine Haftungsfragen',
      'Operator behält volle Kontrolle (Zonen, Schwellenwerte, Freigabe-Entscheid)',
      'POI-Katalog editierbar im Browser, ohne lokale Installation, ohne Datenbank',
      'Cluster-Logik bündelt benachbarte POIs visuell — Karte bleibt auch bei vielen POIs lesbar',
    ],
  },
  {
    label: 'Kooperationspartner Informatik / Universität',
    color: '#553c9a', bg: '#faf5ff',
    punkte: [
      'Saubere Modularchitektur mit definierten Schnittstellen (Compute / Validate / Apply / Context)',
      'Region-Katalog-Format als md (textbasiert, gitbar, manuell editierbar) statt opaker DB',
      'Hand-gezeichnete SVG-Glyphs in Code-Pipeline integriert (Tabler-Adapter, svgCleaner)',
      '130 Git-Commits · vollständige Entwicklungshistorie · Backlog + Annotations versioniert mit Code',
    ],
  },
];

function LeistungsblattV03Tab({ result }: { result: ScimPipelineResult }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>

      {/* Titel */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 8, padding: '18px 22px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          SCIM3 v0.3 — Leistungsblatt
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          Sensus Core <strong>Integration</strong> Model · Region-Katalog · Operator Tool & Ziel-App Runtime · Stand 26. Mai 2026
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6, fontFamily: 'monospace' }}>
          Pipeline: {result.steps.length} Schritte · {result.success ? '✓ OK' : '✗ FEHLER'} · SML-2 Functional Core · 2 Regionen aktiv
        </div>
      </div>

      {/* Metriken-Grid */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Kennzahlen (aktuell, verifiziert)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        {METRIKEN_V03.map((m) => (
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

      {/* Neuerungen seit v0.2 */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Neu seit v0.2 (Mai 2026)
      </div>
      <div style={{
        background: '#e6fffa', border: '1px solid #38b2ac',
        borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#234e52',
      }}>
        Drei Wochen Weiterentwicklung nach dem v0.2-Implementierungssprint. Schwerpunkt: Operator-Datenpflege (Katalog, Cluster, Decorations) und zweite Region als Generizitäts-Beweis.
      </div>
      {NEUERUNGEN_V03.map((n) => (
        <div key={n.id} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '8px 12px', borderRadius: 5, marginBottom: 6,
          background: '#f7fafc', border: '1px solid #e2e8f0',
        }}>
          <div style={{ flexShrink: 0, minWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2d3748' }}>{n.label}</div>
          </div>
          <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>{n.desc}</div>
        </div>
      ))}

      {/* Kerninnovationen (unverändert aus v0.2 + 1 neu) */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Kerninnovationen
      </div>
      {[
        ['Auslastungslage statt Empfehlung', 'Das System empfiehlt keine Route. Es zeigt die aktuelle Auslastung des Wegnetzes — farbcodiert, alle 5 Min. aktualisiert. Der Nutzer entscheidet.'],
        ['Privacy-by-Design strukturell', 'Verbotene Datenklassen sind bauartbedingt unmöglich — nicht regelbasiert verhindert. Masking-Schicht + dedizierter Validator am Paket-Ausgang.'],
        ['Zweistufige Klassifikation', 'Step 1: Bewegungsfluss. Step 2 (Aufenthaltskomfort): Aktivierung nach beobachteter Stauindikation und Hochlastinterpretation.'],
        ['Region-Katalog als md', 'Plan-Daten in markdown, textbasiert, gitbar, mit deklarativem Container-System. Operator editiert im Browser, Export regeneriert die md verlustfrei.'],
        ['Selbst-dokumentierendes System', 'Glossar, Architekturentscheide, Invarianten, Annotations und Backlog direkt im Operator Tool versioniert.'],
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
      {ZIELGRUPPEN_V03.map((z) => (
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
        <span>SCIM3 v0.3 · Sensus Core Integration Model 3 · Dietmar Broda</span>
        <span>{new Date().toLocaleDateString('de-AT', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

    </div>
  );
}

// ─── Leistungsmessung (Konzept, bei Bedarf zu bauen) ─────────────────────────
// Einleitung/Gedanken zur LIVE-Leistungsmessung (im Gegensatz zum statischen
// Datenblatt oben). Muster: Hub + Messer. Konsens 2026-06-04.

const MESSER = [
  { label: 'Anthem-Pulse', heimat: 'P06 · Transmitter', metrik: 'Egress KB/h + Origin KB/h je Wanderer-Zahl', status: 'erster Messer' },
  { label: 'Bundle / Codezeilen', heimat: 'P07 · Shell-Studio', metrik: 'ausgespielte Shell, mit/ohne Icon-Assets (Switcher)', status: 'geplant' },
  { label: 'Origin-Datengröße', heimat: 'P09 · Origin-Capsuler', metrik: 'origin-mesh + poi-set Bytes (einmaliger Bundle-Anteil)', status: 'geplant' },
  { label: 'Presence / Nutzung', heimat: 'V03 · Presence-Origin', metrik: 'real präsente Wanderer → speist die „100"-Annahme', status: 'geplant' },
  { label: 'Inventar', heimat: 'div.', metrik: 'Segment-, POI-, Versions-Zahl', status: 'geplant' },
];

function LeistungsmessungKonzeptTab() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <div style={{ background: 'linear-gradient(135deg,#975a16,#b7791f)', borderRadius: 8, padding: '16px 20px', marginBottom: 16, color: '#fff' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Leistungsmessung — Konzept</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Live-Messung (nicht das statische Datenblatt) · bei Bedarf zu bauen</div>
      </div>

      <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 14px' }}>
        Muster <strong>Hub + Messer</strong>: Das <strong>Leistungsblatt</strong> (System ◈) ist der Hub, der alle
        Zahlen sammelt. Jeder <strong>Leistungsmesser</strong> ist ein Tab in der Heimat seines Werts (z.B. Transmitter),
        misst <em>dort</em>, wo die Daten leben, und schickt seine Zahl ans Blatt. Technisch wie unsere Info-Modale:
        <strong> eine Quelle je Kennzahl</strong> (Registry mit reinen Rechen-Funktionen), zwei Sichten — Messer in der
        Heimat, Aggregat im Blatt.
      </p>

      <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, padding: '9px 11px', marginBottom: 16 }}>
        Messer (in den Heimat-Panels) ⇊ ⇊ ⇊ → Leistungsblatt (Hub · System ◈)
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#975a16', marginBottom: 8 }}>Kandidaten (Messer → Blatt)</div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
        {MESSER.map((m, i) => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderTop: i === 0 ? 'none' : '1px solid #edf2f7' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2d3748', minWidth: 150 }}>{m.label}</span>
            <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'monospace', minWidth: 150 }}>{m.heimat}</span>
            <span style={{ fontSize: 11, color: '#4a5568', flex: 1 }}>{m.metrik}</span>
            <span style={{ fontSize: 9.5, color: m.status === 'erster Messer' ? '#975a16' : '#a0aec0', background: m.status === 'erster Messer' ? '#fffaf0' : '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '1px 7px' }}>{m.status}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#975a16', marginBottom: 8 }}>Anthem-Pulse — Kostenmodell (erster Messer)</div>
      <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 11.5, color: '#4a5568', lineHeight: 1.6 }}>
        Last-Array = N Segmente × ~1 Byte · 12 Snapshots/h · Wanderer. Die Geometrie reist <strong>nur einmal</strong> im Bundle, nicht pro Snapshot.
        <div style={{ marginTop: 8 }}>
          <strong>Egress</strong> (Bytes an die Geräte, skaliert mit Wanderern): bei ~800 Segmenten ≈ 9,6 KB/h pro Wanderer → <strong>~1 MB/h für 100</strong>.<br/>
          <strong>Origin/Compute</strong> (1 Snapshot/5 min, CDN fächert auf): ≈ 9,6 KB/h — <strong>fast wanderer-unabhängig</strong>. Genau das ist die Pointe.
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#975a16', marginBottom: 8 }}>Schalter / Parameter im Blatt</div>
      <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 11.5, color: '#4a5568', lineHeight: 1.55 }}>
        <li><strong>Wanderer-Zahl</strong> (Default 100) — skaliert den Egress.</li>
        <li><strong>mit/ohne Icon-Assets</strong> — für Bundle-Größe / Codezeilen.</li>
        <li><strong>Bytes/Segment + Refresh-Intervall</strong> — die Stellschrauben des Datengröße-Hebels.</li>
      </ul>

      <div style={{ background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: 6, padding: '10px 14px', fontSize: 11.5, color: '#744210', lineHeight: 1.55 }}>
        So wird das Leistungsblatt zugleich das <strong>Schaufenster des Datengröße-Hebels</strong>: am mit/ohne-Assets- oder
        Bytes/Segment-Schalter drehen → die KB/h fallen live. <strong>Bei Bedarf zu bauen</strong>; erster Messer = Anthem-Pulse im Transmitter (P06).
      </div>
    </div>
  );
}

// ─── Wrapper mit Versions-Switcher ───────────────────────────────────────────

function LeistungsblattTab({ result }: { result: ScimPipelineResult }) {
  const [version, setVersion] = useState<'v03' | 'v02' | 'konzept'>('v03');
  const btn = (v: 'v03' | 'v02' | 'konzept', label: string) => (
    <button
      onClick={() => setVersion(v)}
      style={{
        fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 4,
        border: '1px solid #cbd5e0',
        background: version === v ? '#2b6cb0' : 'white',
        color: version === v ? 'white' : '#2d3748',
        fontFamily: 'system-ui, sans-serif',
        marginLeft: 4,
      }}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        gap: 4, marginBottom: 10, maxWidth: 720,
      }}>
        <span style={{ fontSize: 11, color: '#718096' }}>Ansicht:</span>
        {btn('v03', 'v0.3 (aktuell)')}
        {btn('v02', 'v0.2 (archiviert)')}
        {btn('konzept', 'Leistungsmessung (Konzept)')}
      </div>
      {version === 'v03' ? <LeistungsblattV03Tab result={result} />
        : version === 'v02' ? <LeistungsblattV02Tab result={result} />
        : <LeistungsmessungKonzeptTab />}
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
