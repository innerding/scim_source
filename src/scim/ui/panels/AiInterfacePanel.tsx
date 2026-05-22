import { useState } from 'react';
import type { TabId } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';
import { PANEL_REGISTRY } from '../panelRegistry';

interface Props {
  activeTab: TabId;
  result: ScimPipelineResult;
}

type AnnotationCategory = 'vocabulary' | 'adr' | 'business_context' | 'invariant' | 'next_intent';

interface Annotation {
  id: string;
  category: AnnotationCategory;
  label: string;
  content: string;
  related_panel?: string;
  date: string;
}

const CATEGORY_META: Record<AnnotationCategory, { label: string; color: string; bg: string; icon: string }> = {
  vocabulary:       { label: 'Glossar',               color: '#2b6cb0', bg: '#ebf8ff', icon: '📖' },
  adr:              { label: 'Architekturentscheid',   color: '#276749', bg: '#f0fff4', icon: '🏛' },
  business_context: { label: 'Geschäftskontext',       color: '#744210', bg: '#fffbeb', icon: '🏢' },
  invariant:        { label: 'Invariante',             color: '#822727', bg: '#fff5f5', icon: '🔒' },
  next_intent:      { label: 'Nächste Absicht',        color: '#553c9a', bg: '#faf5ff', icon: '🎯' },
};

// Initial seed annotations — operator extends these in the UI
const SEED_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann_001',
    category: 'vocabulary',
    label: 'Sensus Core',
    content: 'Das standardisierte Ausgabeformat der SCIM-Pipeline. Enthält das vollständige bewertete Wegenetz + POIs in einem signierten JSON-Bundle das von der Ziel-App konsumiert wird.',
    date: '2026-05-21',
  },
  {
    id: 'ann_002',
    category: 'vocabulary',
    label: 'Signal Group',
    content: 'Eine Gruppe von Telco-Belastungssignalen die thematisch zusammengehören (z.B. alle Signale eines Betreibers für eine Region). Definiert in RegioContent, referenziert in TelcoLoad.',
    date: '2026-05-21',
  },
  {
    id: 'ann_003',
    category: 'invariant',
    label: 'Privacy-Kette darf nicht gebrochen werden',
    content: 'Die Kette privacy_masked → MaskingModel → ReleaseExport ist kritisch für Datenschutz-Compliance. Kein Code darf ungemaskierte Rohdaten nach ReleaseExport durchlassen. Bei Refactoring des Masking-Modells immer alle Nachfolger-Panels prüfen.',
    related_panel: 'P07',
    date: '2026-05-21',
  },
  {
    id: 'ann_004',
    category: 'adr',
    label: 'Pipeline ist zustandslos',
    content: 'Kontext: Persistenz wurde als SML-4-Feature klassifiziert. Entscheidung: Jeder Pipeline-Lauf ist vollständig in sich — kein State überlebt Neustart. Konsequenz: Schnell und deterministisch; keine Migrations-Probleme; kein Offline-Modus ohne SML-4.',
    date: '2026-05-21',
  },
  {
    id: 'ann_005',
    category: 'next_intent',
    label: 'P01–P04 Eingabe-Formulare',
    content: 'Die vier user_form-Panels sollen echte Eingabe-Formulare erhalten. Reihenfolge: P01 (SystemAdjust) zuerst, dann P02 RegioContent. P03 TargetAppUi hat die reichste Konfigurationstiefe — additiv, kein Umbau der Pipeline.',
    related_panel: 'P01',
    date: '2026-05-21',
  },
];

function AnnotationsTab() {
  const [annotations] = useState<Annotation[]>(SEED_ANNOTATIONS);
  const [filterCat, setFilterCat] = useState<AnnotationCategory | 'all'>('all');

  const filtered = filterCat === 'all' ? annotations : annotations.filter(a => a.category === filterCat);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setFilterCat('all')}
          style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            border: '1px solid #cbd5e0',
            background: filterCat === 'all' ? '#2d3748' : '#f7fafc',
            color: filterCat === 'all' ? '#fff' : '#4a5568',
          }}
        >
          Alle ({annotations.length})
        </button>
        {(Object.keys(CATEGORY_META) as AnnotationCategory[]).map(cat => {
          const m = CATEGORY_META[cat];
          const count = annotations.filter(a => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${m.color}40`,
                background: filterCat === cat ? m.bg : '#f7fafc',
                color: filterCat === cat ? m.color : '#718096',
              }}
            >
              {m.icon} {m.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.map(a => {
        const m = CATEGORY_META[a.category];
        return (
          <div key={a.id} style={{
            background: m.bg, border: `1px solid ${m.color}30`,
            borderLeft: `3px solid ${m.color}`,
            borderRadius: 6, padding: '12px 16px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.color }}>
                {m.icon} {a.label}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                {a.related_panel && (
                  <span style={{
                    fontSize: 10, fontFamily: 'monospace', color: '#718096',
                    background: '#edf2f7', padding: '2px 5px', borderRadius: 3,
                  }}>
                    {a.related_panel}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>{a.date}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>{a.content}</div>
          </div>
        );
      })}

      <div style={{
        background: '#f7fafc', border: '1px dashed #cbd5e0',
        borderRadius: 6, padding: '12px 16px', fontSize: 12, color: '#a0aec0',
        textAlign: 'center', marginTop: 8,
      }}>
        + Neue Annotation hinzufügen (in späterer Session)
      </div>
    </div>
  );
}

function BriefingTab({ result }: { result: ScimPipelineResult }) {
  const panels = PANEL_REGISTRY.map(p => `${p.id}: ${p.label} [${p.inputMode}]`).join('\n');

  const briefing = `# SCIM Session Briefing
Generiert: ${new Date().toISOString()}

## System-Übersicht
Engine: SCIM v0.2 | Reifegrad: SML-2 (Functional Core)
Pipeline: ${result.steps.length} Schritte | Status: ${result.success ? 'OK' : 'FEHLER'}

## Panels
${panels}

## Architektur-Prinzip
"Konfigurationstiefe ist eine Frage des Formulars, nicht der Pipeline."
Neue Einstellmöglichkeiten = neue Felder in bestehenden Input-Typen (additiv).
Neue Panel-Logik = neue Compute-Funktion die sich einfügt.

## Invarianten
🔒 Privacy-Kette darf nicht gebrochen werden
   privacy_masked → MaskingModel → ReleaseExport ist kritisch.
   Bei Refactoring des Masking-Modells immer alle Nachfolger-Panels prüfen.

## Bekannte Lücken (SML-2)
- stub_context_types: ScimContext { status: string } Stubs → SML-3
- no_runtime_schema_validation: Zod installiert aber ungenutzt → SML-3
- no_persistence: kein State überlebt Neustart → SML-4
- flat_earth_geo: cos-korrigierte Ebenenrechnung, keine Geodäsie → SML-3

## Glossar
- Sensus Core: Standardisiertes Ausgabeformat (signiertes JSON-Bundle)
- Signal Group: Gruppe zusammengehöriger Telco-Belastungssignale

## Nächste Absicht
P01–P04 Eingabe-Formulare implementieren.
Reihenfolge: P01 (SystemAdjust) → P02 (RegioContent) → P03 (TargetAppUi).
P03 hat die reichste Konfigurationstiefe — additiv, kein Pipeline-Umbau.
`;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#f0fff4', border: '1px solid #9ae6b4',
        borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#276749',
        marginBottom: 16,
      }}>
        Diesen Text in eine neue KI-Session kopieren → AI-Coder startet mit vollständigem Kontext.
      </div>
      <pre style={{
        background: '#1a202c', color: '#e2e8f0', borderRadius: 6,
        padding: 16, fontSize: 11, fontFamily: 'monospace',
        overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0,
        lineHeight: 1.6,
      }}>
        {briefing}
      </pre>
    </div>
  );
}

export default function AiInterfacePanel({ activeTab, result }: Props) {
  switch (activeTab) {
    case 'input':      return <AnnotationsTab />;
    case 'result':     return <BriefingTab result={result} />;
    case 'validation': return <BriefingTab result={result} />;
    case 'raw':        return <BriefingTab result={result} />;
    default:           return null;
  }
}
