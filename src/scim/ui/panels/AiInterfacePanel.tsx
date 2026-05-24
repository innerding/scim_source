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

  // ── 2026-05-23: Ziel-App Schnittstelle und Systemcharakter ─────────────────

  {
    id: 'ann_006',
    category: 'vocabulary',
    label: 'SVG-Wegnetz (Sensus Core Overlay)',
    content: 'Das Paket enthält kein klassisches Routensystem — es liefert ein Wegnetz aus farbcodierten Kanten, gewichtet nach Telco-Auslastung. Die kürzesten Kanten je Auslastungsklasse sind farblich markiert (grün → rot). Die App rendert dieses Netz als SVG-Overlay auf der Karte. Der Nutzer wählt seinen Weg selbst — die App macht keine Empfehlung.',
    date: '2026-05-23',
  },
  {
    id: 'ann_007',
    category: 'vocabulary',
    label: 'BCK / BAK (Broda Comfort Kernel / Avoidance Kernel)',
    content: 'BCK: Lokaler Filteralgorithmus in der App. Filtert Routen nach movement_comfort_score und (wenn Step 2 aktiv) stay_comfort_score. Bei classification_mode=movement_only wird der Stay-Filter übersprungen. BAK: Sortiert und bewertet Treffer nach Wunschdauer und POI-Präferenzen. Beide Kernel laufen vollständig lokal auf dem Gerät — kein Server-Call.',
    date: '2026-05-23',
  },
  {
    id: 'ann_008',
    category: 'adr',
    label: 'Paketrhythmus: 5-Minuten-Push + Slider-Event',
    content: 'Kontext: Die Auslastungslage ändert sich kontinuierlich. Entscheidung: Die App empfängt alle 5 Minuten automatisch ein neues Paket (Push). Bei Slider-Interaktion wird sofort lokal neu gefiltert — kein Server-Call. Konsequenz: Darstellung ist maximal 5 Minuten alt; Slider reagiert verzögerungsfrei.',
    date: '2026-05-23',
  },
  {
    id: 'ann_009',
    category: 'adr',
    label: 'Anonymer Feedback-Endpoint — separat von SCIM',
    content: 'Kontext: SCIM kann aus Nutzungsmustern (Slider-Position, Tageszeit, Region) lernen. Entscheidung: Separater Aggregations-Endpoint empfängt gebündelte Datenpunkte (max. 1 pro 5-Min-Zyklus). Datenpunkte: Slider-Wert + grobe Tageszeit + Region-ID — kein Standort, kein Gerät. SCIM selbst bleibt ein deterministischer Batch-Prozess ohne Live-Daten. Konsequenz: Saubere Trennung; SCIM-Pipeline ändert sich nicht.',
    date: '2026-05-23',
  },
  {
    id: 'ann_010',
    category: 'adr',
    label: 'Schnittstellen-Lücken Paket → App (Stand 2026-05-23)',
    content: 'A: route_comfort_metrics vorhanden, App zeigt simulierten Load statt echter Werte. B: public_warnings ignoriert, nie angezeigt. C: display_contract / allowed_local_controls min/max/defaults nicht durchgesetzt. D: expires_at nicht geprüft — abgelaufenes Paket bleibt nutzbar. E: public_layers GeoJSON nicht gerendert, Map nutzt direkt route_options. Priorität: A und D zuerst.',
    date: '2026-05-23',
  },
  {
    id: 'ann_011',
    category: 'business_context',
    label: 'Größenordnungen: Paket und Runtime',
    content: 'Paket (~400 km², ohne Heatmap): ~150 KB gzipped. Mit vollständigem Layer-Overlay bis ~400 KB. Runtime-Bundle: 368 KB JS + 24 KB CSS roh; ~121 KB gzipped gesamt. Heatmap wird lokal berechnet — kein Einfluss auf Paketgröße.',
    date: '2026-05-23',
  },
  {
    id: 'ann_012',
    category: 'invariant',
    label: 'Heatmap immer lokal — nie im Paket',
    content: 'Die Heatmap-Darstellung der Auslastung wird auf dem Gerät des Nutzers berechnet. Das Paket liefert Wegnetz-Kanten mit Auslastungswerten — nicht eine fertige Heatmap. Diese Trennung ist bewusst: Paketgröße bleibt kontrollierbar, Darstellung bleibt flexibel für verschiedene App-Versionen.',
    date: '2026-05-23',
  },
  {
    id: 'ann_013',
    category: 'next_intent',
    label: 'Schnittstelle Paket → App schließen',
    content: 'Nächste Schritte in sensus-core-runtime: (A) route_comfort_metrics aus Paket für Slider-Load nutzen statt simulierter Werte. (B) public_warnings anzeigen (Footer oder Overlay). (D) expires_at prüfen und Paket nach Ablauf neu laden. Parallel: SVG-Overlay-Rendering klären — Format (fertiges SVG vs. GeoJSON-Segmente) und Leaflet-Integration.',
    related_panel: 'P11',
    date: '2026-05-23',
  },

  // ── 2026-05-24: SKG-App Architektur — Startseite, Branding, Einstieg ────────

  {
    id: 'ann_014',
    category: 'vocabulary',
    label: 'Representation',
    content: 'Eine Representation ist das Ausgabepaket für eine spezifische Region — enthält bewertetes Wegnetz + POIs als signiertes JSON-Bundle. Jede App-Instanz ist an eine Region gebunden. Die erste Instanz ist Salzkammergut (SKG). "Representation" und "Paket" werden synonym verwendet; "Representation" betont den Bezug zur Region, "Paket" die technische Einheit.',
    date: '2026-05-24',
  },
  {
    id: 'ann_015',
    category: 'vocabulary',
    label: 'Bundle (App + Representation)',
    content: 'Ein Bundle ist das kombinierte Angebot für Neunutzer: die installierbare Runtime-App und eine Representation als gemeinsames Download-Paket. Grafisch dargestellt als großes Paket (App) + kleines Paket (Representation). Relevant für QR-Code-Einstieg ohne vorinstallierte App. Bestandsnutzer mit installierter App erhalten stattdessen nur die Representation als Einzelpaket.',
    date: '2026-05-24',
  },
  {
    id: 'ann_016',
    category: 'adr',
    label: 'App ist eine Region-Instanz, kein generischer Container',
    content: 'Kontext: Ein generischer App-Name ("Path Works") wurde erwogen. Entscheidung: Jede App-Instanz trägt den Regionsnamen — erste Instanz: Salzkammergut (SKG). App-Name, Icon und Branding sind regionsspezifisch. Die Marke "Diesenpark" (Herstellerfirma) erscheint ausschließlich als dezenter Herkunftshinweis ("powered by diesenpark.com") — keine sichtbare Marke für Endnutzer. Konsequenz: Nutzer identifizieren sich mit der Region, nicht mit einer Plattform.',
    date: '2026-05-24',
  },
  {
    id: 'ann_017',
    category: 'adr',
    label: 'Einstiegs-URL-Schema: ?pkg= als primärer Kontextträger',
    content: 'Kontext: Nutzer kommen via QR-Code, Link, Direktaufruf oder PWA. Entscheidung: QR-Codes und Links tragen ?pkg=URL als Parameter — die App zeigt sofort das richtige Paket ohne Standort- oder Nutzerabfrage. Reihenfolge ohne Parameter: (1) localStorage prüfen → letzte Region vorschlagen, (2) Geolocation anfragen → Region ableiten. Konsequenz: Minimale Interaktion für den häufigsten Fall (QR-Scan). QR-Code und Link sind technisch gleichwertig.',
    date: '2026-05-24',
  },
  {
    id: 'ann_018',
    category: 'adr',
    label: 'Geolocation: spät und kontextgebunden',
    content: 'Kontext: Standort-Permission früh zu fragen erzeugt Widerstand und ist ohne Kontext unverständlich. Entscheidung: Bei QR/Link-Einstieg (?pkg= vorhanden) keine Standortabfrage. Ohne Kontext: Standort anfragen für Regionsvorschlag. Bei Navigationsstart: Standort mit klarem Nutzerkontext (Nutzer versteht den Zweck). Browser-Geolocation API nutzt intern GPS + WLAN + Zellmasten — für Regionsebene ist Zelldaten-Genauigkeit ausreichend. Konsequenz: Permission wird genau dann beantragt, wenn der Nutzer den Zweck versteht.',
    date: '2026-05-24',
  },
  {
    id: 'ann_019',
    category: 'adr',
    label: 'localStorage: letzte Region persistieren',
    content: 'Kontext: PWA-Nutzer und Bookmark-Rückkehrer öffnen die App ohne URL-Parameter. Entscheidung: Letzte geladene Paket-URL wird in localStorage gespeichert und bei erneutem Öffnen als Vorschlag angeboten. Konsequenz: Kein erneutes QR-Scannen für Stammnutzer. Datenschutz: localStorage ist gerätlokal, kein Server-Call.',
    date: '2026-05-24',
  },
  {
    id: 'ann_020',
    category: 'adr',
    label: 'PWA: installierbar ab sofort, Offline-Tiles später',
    content: 'Kontext: Wanderapp muss am Homescreen installierbar sein; vollständige Offline-Fähigkeit ist langfristig nötig. Entscheidung: Service Worker macht die App installierbar (PWA-Manifest: Name = Salzkammergut, Icon = SKG-Logo). Install-Prompt erscheint nach erstem Paketladen — nicht beim ersten Öffnen (kein Kontext). Offline-Vollsupport (Leaflet-Tile-Cache, Paket-Cache) kommt in SML-4. Konsequenz: Nutzer können die App am Homescreen installieren; Tile-Offline ist noch nicht verfügbar.',
    date: '2026-05-24',
  },
  {
    id: 'ann_021',
    category: 'business_context',
    label: 'Diesenpark als stille Herkunftsmarke',
    content: 'Diesenpark bezeichnet die Herstellerfirma — nicht die App, nicht die Plattform. Die App trägt den Regionsnamen (Salzkammergut). Diesenpark erscheint ausschließlich als "powered by diesenpark.com" rechts unten — dezent, nicht navigierbar. Endnutzer sehen keine Diesenpark-Marke im eigentlichen Sinne. Diese Trennung ist bewusst: Regionsidentität steht im Vordergrund.',
    date: '2026-05-24',
  },
  {
    id: 'ann_022',
    category: 'next_intent',
    label: 'SKG-App Umbau (sensus-core-runtime) — bereit zum Bauen',
    content: 'Voraussetzungen: Icons (Bundle, Paket, Geöffnetes Paket, SKG-Salzfass) werden als SVG geliefert. Umbau-Reihenfolge: (1) IntroScreen entfernen. (2) Package-Screen durch SKG-Startseite ersetzen: Off-White #f8f8f6, Bundle/Paket/Geöffnetes-Paket Icons, minimale Beschriftung (Region · Representation · Version), "powered by diesenpark.com" rechts unten. (3) ?pkg= URL-Handling absichern. (4) localStorage für letzte Region. (5) Geolocation-Logik. (6) PWA Manifest + Service Worker. (7) Install-Prompt nach erstem Paketladen. Detailspezifikation im BACKLOG Abschnitt 6.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_023',
    category: 'adr',
    label: 'Multi-Representation: Region-Index als Datenbasis',
    content: 'Kontext: Jede Region hat mehrere Representations (Pakete). Entscheidung: Ein Region-Index (JSON) listet alle verfügbaren Representations mit label, pkg_url, available, version. Einstieg via ?region=URL (lädt Index) oder ?pkg=URL (Direkteinstieg, kein Index). QR-Code und Link können beides tragen. Konsequenz: Der Index entkoppelt die App von fixen Paket-URLs — neue Representations erscheinen automatisch.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_024',
    category: 'adr',
    label: 'Multi-Representation: State Machine hält packages[]',
    content: 'Kontext: App soll mehrere Representations gleichzeitig halten und zwischen ihnen wechseln. Entscheidung: AppState erhält packages: SensusCorePackage[] + activePackageIndex: number. Alle Compute-Funktionen (BCK, BAK, Guidance) referenzieren immer packages[activePackageIndex]. setActivePackage(index) wechselt das aktive Paket — kein Reload nötig. Konsequenz: Saubere Trennung zwischen geladen und aktiv.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_025',
    category: 'adr',
    label: 'Multi-Representation: Header-Dropdown als primärer Switcher',
    content: 'Kontext: User soll in der laufenden App zwischen Representations wechseln können. Entscheidung: TopBar zeigt Region-Icon + Regionsname + Subline mit aktiver Representation + Chevron. Chevron öffnet Dropdown-Sheet mit allen geladenen Representations inkl. Auslastungsindikator. Unavailable (saisonal): abgedimmt, nicht wählbar. Tap → setActivePackage → Map/Routen/POIs wechseln sofort. Konsequenz: Kein Screen-Wechsel für Representation-Switch — bleibt in der Karten-Ansicht.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_026',
    category: 'next_intent',
    label: 'Multi-Representation Ausbau — Phase A→E',
    content: 'Reihenfolge: A) Region-Index-Typ + Mock für SKG. B) State Machine: packages[] + activePackageIndex + loadRegionIndex() + setActivePackage(). C) StartScreen: Representationsname + Chevron + Multi-Select-Liste + sequenzielles Laden. D) TopBar: Region-Icon + Name + Subline + Dropdown-Switcher + Auslastungsindikator. E) Regionen-Wechsel via Dropdown-Eintrag oder separaten Screen. A+B sind Voraussetzung für C, D, E. C und D parallel baubar. Details: BACKLOG Abschnitt 7.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_027',
    category: 'adr',
    label: 'Global-Index: Mock jetzt, CDN-URL später',
    content: 'Der Haupt-Index aller Regionen (GlobalIndex) wird zunächst als hardcodierter Mock geführt (mock:global → mock.global-index.ts). Dieses Muster ist konsistent mit mock:valid und mock:skg. Sobald Cloudflare R2 / CDN eingerichtet ist, wird mock:global durch eine echte URL ersetzt (z.B. https://cdn.diesenpark.com/index.json). Die App-Logik ändert sich dabei nicht — nur der Ref-String. GlobalIndex-Schema: { schema_version, regions: [{ id, name, icon, index_url, available }], generated_at }.',
    related_panel: 'P03',
    date: '2026-05-24',
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

  const vocabEntries = SEED_ANNOTATIONS.filter(a => a.category === 'vocabulary');
  const adrEntries = SEED_ANNOTATIONS.filter(a => a.category === 'adr');
  const invariantEntries = SEED_ANNOTATIONS.filter(a => a.category === 'invariant');
  const nextEntries = SEED_ANNOTATIONS.filter(a => a.category === 'next_intent');
  const contextEntries = SEED_ANNOTATIONS.filter(a => a.category === 'business_context');

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

## Leitprinzipien (Manifest)
- Lagedarstellung, keine Empfehlung: SCIM erzeugt ein farbcodiertes Wegnetz — keine Routenempfehlung.
- Einweg-Architektur: SCIM → Paket → App. Kein Rückkanal erforderlich.
- Kein Personenbezug: Transparenz statt Einwilligung. Kein Consent-Dialog.
- Heatmap lokal: Wird auf dem Gerät berechnet, nie im Paket vorberechnet.
- Paketrhythmus: 5-Minuten-Push + sofortige lokale Filterung bei Slider-Event.

## Invarianten
${invariantEntries.map(a => `🔒 ${a.label}\n   ${a.content}`).join('\n\n')}

## Bekannte Lücken (SML-2)
- stub_context_types: ScimContext { status: string } Stubs → SML-3
- no_runtime_schema_validation: Zod installiert aber ungenutzt → SML-3
- no_persistence: kein State überlebt Neustart → SML-4
- flat_earth_geo: cos-korrigierte Ebenenrechnung, keine Geodäsie → SML-3

## Glossar
${vocabEntries.map(a => `- ${a.label}: ${a.content}`).join('\n')}

## Architekturentscheide
${adrEntries.map(a => `• ${a.label} (${a.date})\n  ${a.content}`).join('\n\n')}

## Geschäftskontext
${contextEntries.map(a => `• ${a.label}: ${a.content}`).join('\n')}

## Nächste Absichten
${nextEntries.map(a => `→ ${a.label}${a.related_panel ? ` [${a.related_panel}]` : ''}\n  ${a.content}`).join('\n\n')}
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
