import { useState } from 'react';
import type { TabId } from '../panelRegistry';
import { PANEL_REGISTRY } from '../panelRegistry';

interface Props {
  activeTab: TabId;
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

  // ── Kernbegriffe ──────────────────────────────────────────────────────────────

  {
    id: 'ann_001',
    category: 'vocabulary',
    label: 'Sensus Core',
    content: 'Sensus Core ist der Rechenkern der App. Er besteht aus BCK (Broda Comfort Kernel), BAK-Path und BAK-Rest (Broda Avoidance Kernel — Path/Rest) und setzt direkt auf dem ColourMesh auf — dem bei Bedarf oder in kurzen Intervallen aktualisierten Netz mit Telco-Auslastungsdaten.',
    date: '2026-05-21',
  },
  {
    id: 'ann_006',
    category: 'vocabulary',
    label: 'ColourMesh (Sensus Core Overlay)',
    content: 'Der ColourMesh ist das farbcodierte Comfort-Netz das die App auf Leaflet rendert. Er wird alle 5 Minuten aus aktuellen Telco-Auslastungsdaten neu erzeugt. Jede Kante trägt edge_id, from_node_id, to_node_id, Geometrie, score_class, color, weight, opacity. POI-Anker (poi_id, node_id, coordinate) verknüpfen die Representation-POIs mit konkreten Mesh-Knoten für clientseitiges Routing. Der Nutzer sieht das Netz als Overlay auf der Karte — keine Routenempfehlung, eigene Wegwahl.',
    date: '2026-05-23',
  },
  {
    id: 'ann_007',
    category: 'vocabulary',
    label: 'BCK · BAK-Path · BAK-Rest',
    content: 'BCK (Broda Comfort Kernel): Filtert das ColourMesh nach movement_comfort_score und (bei classification_mode=movement_and_stay) stay_comfort_score. Ergebnis: das dem Nutzer verfügbare Restnetz. BAK-Path (Broda Avoidance Kernel — Path): Berechnet clientseitig Routen durch das Restnetz auf Basis von Zeiteinstellung und gewählten POIs. BAK-Rest (Broda Avoidance Kernel — Rest): Bewertet Raststellen und POIs nach Auslastung und Nutzerpräferenz. Alle drei Kernel laufen vollständig lokal auf dem Gerät — kein Server-Call.',
    date: '2026-05-23',
  },
  {
    id: 'ann_008',
    category: 'adr',
    label: 'Paketrhythmus: 5-Minuten-Push + Slider-Event',
    content: 'Kontext: Die Auslastungslage ändert sich kontinuierlich. Entscheidung: Die App empfängt alle 5 Minuten automatisch einen neuen ColourMesh (Push). Bei Slider-Interaktion wird sofort lokal neu gefiltert — kein Server-Call. Konsequenz: Darstellung ist maximal 5 Minuten alt; Slider reagiert verzögerungsfrei.',
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
    id: 'ann_012',
    category: 'invariant',
    label: 'Heatmap immer lokal — nie im Paket',
    content: 'Die Heatmap-Darstellung der Auslastung wird auf dem Gerät des Nutzers berechnet. Der ColourMesh liefert Kanten mit Auslastungswerten — nicht eine fertige Heatmap. Diese Trennung ist bewusst: Paketgröße bleibt kontrollierbar, Darstellung bleibt flexibel für verschiedene App-Versionen.',
    date: '2026-05-23',
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

  // ── Offene Schnittstellen ─────────────────────────────────────────────────────

  {
    id: 'ann_010',
    category: 'adr',
    label: 'Schnittstellen-Lücken Paket → App — offen',
    content: 'C: display_contract / allowed_local_controls — min/max/defaults aus dem Paket werden nicht durchgesetzt, App nutzt eigene Defaults. E: public_layers GeoJSON nicht gerendert — Map-Rendering läuft noch über route_options statt über das ColourMesh-Overlay. Erledigt: A (route_comfort_metrics → computeLoadFromMetrics), B (public_warnings → WarningBanner), D (expires_at → package.loader.ts).',
    date: '2026-05-23',
  },
  {
    id: 'ann_013',
    category: 'next_intent',
    label: 'ColourMesh-Rendering in Leaflet',
    content: 'Offen: ColourMesh-Kanten als SVG/Canvas-Overlay in Leaflet rendern statt über route_options. Format klären (fertiges SVG vs. GeoJSON-Segmente mit Leaflet-Polylines) und Leaflet-Integration implementieren. Schließt Schnittstellen-Lücke E aus ann_010.',
    related_panel: 'P11',
    date: '2026-05-23',
  },

  // ── SKG-App Architektur ───────────────────────────────────────────────────────

  {
    id: 'ann_015',
    category: 'vocabulary',
    label: 'Bundle (Erstnutzer-Paket)',
    content: 'Ein Bundle ist das vollständige Auslieferungspaket für Erstnutzer: App-Shell + Representation + ColourMesh. Bestandsnutzer erhalten nur den ColourMesh alle 5 Minuten; Representation nur bei Neuaufbau durch SCIM. Vollständige Architektur: siehe ann_034.',
    date: '2026-05-24',
  },
  {
    id: 'ann_017',
    category: 'adr',
    label: 'App-Einstieg: URL-Schema + Geolocation',
    content: 'Einstiegswege: (1) ?pkg=URL — direkter Paket-Einstieg via QR-Code oder Link, keine Standortabfrage. (2) ?region=URL — lädt Region-Index, Nutzer wählt Representation. (3) Kein Parameter: localStorage prüfen → letzte Representation vorschlagen; sonst Geolocation anfragen. Geolocation wird bewusst spät eingeholt — nie beim ersten Öffnen, nur wenn kein Kontext vorhanden oder beim Navigationsstart (Nutzer versteht den Zweck). Browser-Geolocation (GPS + WLAN + Zellmasten) ist für Regionsebene ausreichend genau. QR-Code und Link sind technisch gleichwertig.',
    date: '2026-05-24',
  },
  {
    id: 'ann_022',
    category: 'next_intent',
    label: 'SKG-App: Geolocation noch offen',
    content: 'Erledigt: IntroScreen entfernt, SKG-Startseite gebaut, ?pkg= URL-Handling, localStorage (saveLastPkg), PWA Manifest + Service Worker, Install-Prompt nach erstem Paketladen. Noch offen: Geolocation-Logik — Standortabfrage für Regionsvorschlag wenn kein URL-Parameter vorhanden.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_023',
    category: 'adr',
    label: 'Multi-Representation: Region-Index als Datenbasis',
    content: 'Kontext: Eine Region (als organisatorischer Zusammenschluss) oder ein Gebiet kann mehrere Representations anbieten. Entscheidung: Ein Region-Index (JSON) listet alle verfügbaren Representations mit label, pkg_url, available, version. Einstieg via ?region=URL (lädt Index) oder ?pkg=URL (Direkteinstieg, kein Index). QR-Code und Link können beides tragen. Konsequenz: Der Index entkoppelt die App von fixen Paket-URLs — neue Representations erscheinen automatisch.',
    related_panel: 'P03',
    date: '2026-05-24',
  },
  {
    id: 'ann_027',
    category: 'next_intent',
    label: 'Global-Index: CDN-URL noch nicht eingetragen',
    content: 'GlobalIndex-Schema: { schema_version, regions: [{ id, name, icon, index_url, available }], generated_at }. Mock läuft (mock:global → mock.global-index.ts). CDN (cdn.diesenpark.com) ist eingerichtet — mock:global muss noch durch echte URL ersetzt werden. App-Logik ändert sich dabei nicht.',
    related_panel: 'P03',
    date: '2026-05-24',
  },

  // ── 2026-05-24: Paket-Infrastruktur ──────────────────────────────────────────

  {
    id: 'ann_030',
    category: 'adr',
    label: 'Paket-Infrastruktur: R2 + D1 + Worker',
    content: 'Cloudflare R2 Bucket "diesenpark-packages", Custom Domain cdn.diesenpark.com. Cloudflare D1 Datenbank "scim3-packages-db" verwaltet Versionshistorie: packages-Tabelle mit region_id, representation_id, version, status (draft/active/archived), cdn_url, created_at, activated_at. Worker "scim3-package-worker" Endpoints: PUT /api/packages/upload (R2+D1), GET /api/packages (filter: region_id, representation_id, status), POST /api/packages/:id/activate, DELETE /api/packages/:id (archivieren), GET /api/packages/active/:region_id. SCIM-Konsole: V01 Pakete (Übersicht), V02 Region-Detail (Versionen je Region), V03 Aktiv-Monitor (CDN-URL + QR je Representation). VITE_WORKER_URL + VITE_UPLOAD_API_KEY als Env-Vars in .env.local.',
    date: '2026-05-24',
  },
  // ── 2026-05-24: Region-Definition ────────────────────────────────────────────

  {
    id: 'ann_032',
    category: 'vocabulary',
    label: 'Region (verbindliche Definition)',
    content: 'Eine Region ist ein optionaler organisatorischer Zusammenschluss mehrerer Representations — kein geografischer Parent. Metapher: der "Schweif" einer Representation, über den mehrere Representations zusammengeknotet werden. Keine Representation braucht zwingend eine Region. Eine Authority (z.B. ein Tourismusverband) entscheidet nach dem Bau einer Representation, ob sie diese unter ihrer Region führen möchte. Representations können saisonal auf Ghost gesetzt werden. Eine Authority muss nicht auf regionalem Boden liegen — sie könnte theoretisch von überall führen. Region ist also ein Gruppenname / Ordnungsprinzip, keine geografische Hierarchieebene. Ersetzt die historische Definition in ann_028.',
    date: '2026-05-24',
  },
  {
    id: 'ann_033',
    category: 'adr',
    label: 'Region: Code-Implikationen der neuen Definition',
    content: 'Weil keine Representation zwingend eine Region braucht, muss das region-Feld in ScimBundle und SensusCorePackage optional werden: region?: { id: string; name: string }. Aktuell ist region Pflichtfeld — das führt zu Problemen sobald Representations ohne Region exportiert werden. Betroffene Stellen: (1) ScimBundle-Schema: region → region? (2) SensusCorePackage-Typ: region → region? (3) AppHeader: pkg.region.name schlägt fehl wenn region undefined — Fallback auf pkg.representation.name nötig. (4) REPRESENTATION_TO_REGION Lookup-Tabelle in scimBundle.ts ist konzeptuell falsch — eine Representation kennt ihre Region nicht von sich aus, die Region wird von einer Authority zugewiesen. Lookup ersatzlos entfernen sobald region optional ist. (5) ann_029-ADR: region als Pflichtfeld-Annahme ist historisch. Technische Schuld — kein Breaking Change, aber vor dem nächsten echten Paket-Export zu klären.',
    date: '2026-05-24',
  },

  // ── 2026-05-24: Bundle-Architektur ───────────────────────────────────────────

  {
    id: 'ann_034',
    category: 'adr',
    label: 'Bundle-Architektur: App-Shell + Representation + ColourMesh',
    content: `Ein Bundle ist das vollständige Auslieferungspaket für Erstnutzer. Es besteht aus drei unabhängig versionierten Teilen:

APP-SHELL (einmal installiert, selten aktualisiert): React/Vite PWA, UI, State Machine, BCK/BAK-Kernel, Service Worker, Manifest. Leaflet als Bibliothek ist Teil der App-Shell.

REPRESENTATION (stabil, nur bei SCIM-Neuaufbau): (1) Leaflet-Konfiguration — Tile-Provider-URL, Attribution, Zoom-Grenzen; definiert welche OSM-Tiles geladen werden. (2) Viewport — center, zoom, bbox. (3) POIs — poi_id, name, category, coordinate, Pixelbilder, Beschreibung, Metadaten — der schwergewichtige Teil. (4) Systemrouten — vorberechnete Routen: Geometrie, Name, Dauer, enthaltene POIs — Basis für nutzerseitige Veränderung.

COLOURMESH (alle 5 Minuten, erzeugt aus Telco-Auslastungsdaten): (1) Kanten — edge_id, from_node_id, to_node_id, Geometrie LineString, score_class, color, weight, opacity, decision, visible. (2) POI-Anker — poi_id, node_id, coordinate — verknüpft Representation-POIs mit konkreten Mesh-Knoten für clientseitiges Routing. (3) Referenz — representation_id. (4) Privacy — verified, raw_signals_excluded, device_ids_excluded. (5) Timing — generated_at, expires_at.

OSM-TILES (vom Tile-Server, nicht im Bundle): Leaflet lädt sie zur Laufzeit auf Basis der Leaflet-Konfiguration der Representation. Cache liegt im Browser/Service Worker.

TELCO-LOAD ist keine App-Einheit sondern die SCIM-interne Datenquelle die alle 5 Minuten verarbeitet wird um den ColourMesh zu erzeugen.

Ladereihenfolge: Representation zuerst (Karte + POIs), ColourMesh danach (Overlay). Bestandsnutzer erhalten nur den ColourMesh alle 5 Minuten; Representation nur bei Neuaufbau. Der ColourMesh trägt poi_anchors damit die App zur Laufzeit einen vollständigen Graphen aufbauen und clientseitiges Routing betreiben kann — Kernfeature.`,
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

function BriefingTab() {
  const panels = PANEL_REGISTRY.map(p => `${p.id}: ${p.label} [${p.inputMode}]`).join('\n');

  const vocabEntries     = SEED_ANNOTATIONS.filter(a => a.category === 'vocabulary');
  const adrEntries       = SEED_ANNOTATIONS.filter(a => a.category === 'adr');
  const invariantEntries = SEED_ANNOTATIONS.filter(a => a.category === 'invariant');
  const nextEntries      = SEED_ANNOTATIONS.filter(a => a.category === 'next_intent');
  const contextEntries   = SEED_ANNOTATIONS.filter(a => a.category === 'business_context');

  const briefing = `# SCIM Session Briefing
Generiert: ${new Date().toISOString()}

## System-Übersicht
Engine: SCIM v0.2 | Reifegrad: SML-2 (Functional Core)

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

function NoteTab({ tabKey }: { tabKey: string }) {
  const storageKey = `scim_note_${tabKey}`;
  const [note, setNote]   = useState(() => localStorage.getItem(storageKey) ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(storageKey, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#718096',
        marginBottom: 14,
      }}>
        Dieser Tab ist für Notizen reserviert — kein Pipeline-Output.
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Notiz eingeben…"
        style={{
          width: '100%', minHeight: 180, resize: 'vertical',
          padding: '10px 12px', fontSize: 12, fontFamily: 'system-ui, sans-serif',
          border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff',
          color: '#2d3748', outline: 'none', boxSizing: 'border-box',
          lineHeight: 1.6,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            background: saved ? '#38a169' : '#2d3748',
            color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

export default function AiInterfacePanel({ activeTab }: Props) {
  switch (activeTab) {
    case 'input':      return <AnnotationsTab />;
    case 'result':     return <BriefingTab />;
    case 'validation': return <NoteTab tabKey="validation" />;
    case 'raw':        return <NoteTab tabKey="raw" />;
    default:           return null;
  }
}
