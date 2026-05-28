import { useState } from 'react';
import type { TabId } from '../panelRegistry';
import { PANEL_REGISTRY } from '../panelRegistry';
import { useRole } from '../RoleContext';

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

  // ── 2026-05-24: UMBAUPLAN-Auslagerung (MVP Grünberg) ─────────────────────────

  {
    id: 'ann_035',
    category: 'invariant',
    label: 'Schichten-Laufzeiten der Bundle-Architektur',
    content: `Drei Liefereinheiten mit eigenen Laufzeiten und Aktualisierungsrhythmen. Laufzeit = Gültigkeitsdauer einer Einheit, nicht Ausführungsumgebung — Ausführung läuft immer in der App-Shell.

App-Shell (Körper): Laufzeit Monate, Rhythmus beim Deploy (manuell), Herkunft Cloudflare Pages (diesenpark.com), eine Instanz für alle Representations. Enthält React/Vite PWA, BCK/BAK-Kernel, Service Worker, Manifest, Leaflet-Bibliothek.

Representation (Charakter): Laufzeit Wochen–Monate, Rhythmus bei SCIM-Rebuild (Operator-ausgelöst), Herkunft R2 → cdn.diesenpark.com/rep/{id}/current.json, eine Instanz pro Gebiet (Grünberg, Lichtenberg, …). Enthält POIs, Leaflet-Config, Viewport/Bbox, Systemrouten.

ColourMesh (Atem): Laufzeit 5 Minuten, Rhythmus automatisch (Telco-Zyklus), Herkunft R2 → cdn.diesenpark.com/mesh/{rep_id}/current.json, eine Instanz pro Representation, wird überschrieben. Enthält bewertete Kanten, POI-Anker, Privacy, Timing.

OSM-Tiles (Untergrund): nicht im Bundle, Leaflet lädt sie zur Laufzeit vom Tile-Server gemäß Leaflet-Config der Representation. Cache im Browser/Service Worker.

Das Repository sensus-core-runtime trägt diesen Namen weil es den Körper enthält — die Runtime, in der Charakter und Atem zur Laufzeit laden. Ergänzt ann_034.`,
    date: '2026-05-24',
  },
  {
    id: 'ann_036',
    category: 'adr',
    label: 'Datenschemata ScimRepresentation + ScimColourMesh',
    content: `Die zwei SCIM-Exporte sind vertraglich fixiert. Pipeline P14 schreibt beide.

ScimRepresentation (schema: 'scim3_representation_v1'): representation_id, region? ({id, name}), generated_at, leaflet ({tile_url, attribution, min_zoom, max_zoom}), viewport ({center: [lon,lat], zoom, bbox: [minLon,minLat,maxLon,maxLat]}), pois (FeatureCollection<Point> inkl. image_url, description, category), system_routes (ScimSystemRoute[] mit fertigen Geometrien, Name, Dauer, POI-IDs).

ScimColourMesh (schema: 'scim3_colourmesh_v1'): representation_id, package_id, generated_at, expires_at, edges (FeatureCollection<LineString> inkl. from_node_id, to_node_id), poi_anchors ({poi_id, node_id, coordinate}[]), privacy ({verified, raw_signals_excluded: true, device_ids_excluded: true}).

Der Charakter braucht keinen Graphen — der war nur zur Erzeugung der Systemrouten in SCIM nötig und muss nicht ausgeliefert werden. poi_anchors im ColourMesh sind das Bindeglied für clientseitiges Routing (siehe ann_034). region ist optional gemäß ann_033.`,
    date: '2026-05-24',
  },
  {
    id: 'ann_037',
    category: 'adr',
    label: 'R2-Keys + Worker-Endpoints für Representation + ColourMesh',
    content: `Kontext: Die bestehenden packages-Endpoints (ann_030) behandeln ein Bundle als monolithisches Paket. Die Bundle-Architektur (ann_034) trennt Representation und ColourMesh — sie brauchen eigene Endpoints und R2-Keys mit eigenen Lebenszyklen (ann_035).

R2-Keys:
  rep/{representation_id}/current.json       Charakter — aktuell
  rep/{representation_id}/{version}.json     Charakter — Versionshistorie
  mesh/{representation_id}/current.json      Atem — wird alle 5 min überschrieben

Worker-Endpoints (neu):
  PUT  /api/representations/upload           R2 + D1
  GET  /api/representations/:id              aktueller Charakter
  PUT  /api/colourmesh/upload                R2 + D1
  GET  /api/colourmesh/:rep_id               aktueller Atem

D1-Tabellen (neu):
  representations (rep_id, version, status, cdn_url, generated_at, activated_at)
  colourmesh      (rep_id, version, cdn_url, generated_at, expires_at)

Konsequenz: BundlePublisher.tsx wird in RepresentationPublisher + ColourMeshPublisher aufgeteilt. Die bestehende packages-Tabelle und ihre Endpoints bleiben während der Migration parallel aktiv. Nach Migrationsende lösen diese Endpoints jene aus ann_030 ab.`,
    date: '2026-05-24',
  },
  {
    id: 'ann_038',
    category: 'invariant',
    label: 'Graceful Degradation der Ladephasen',
    content: `Die App lädt zweistufig (Representation, dann ColourMesh). Verhalten je Zustand ist verbindlich:

  Representation da, ColourMesh fehlt    → Karte + POIs sichtbar, kein Overlay, kein Routing
  Representation fehlt                   → App nicht startbar
  ColourMesh abgelaufen (expires_at)     → Overlay ausgegraut, Hinweis

State-Machine-Konsequenz (useAppMachine.ts):
  loadRepresentation(url) → State 'representation_loaded'
  loadColourMesh(url)     → State 'ready'
  5-Minuten-Timer startet nach erstem ColourMesh-Load.
  SensusCorePackage-Typ wird in RepresentationPackage + ColourMeshPackage aufgeteilt.`,
    date: '2026-05-24',
  },
  {
    id: 'ann_039',
    category: 'adr',
    label: 'Deploy-Workflow: Push auf main = live',
    content: `Kontext: Mehrere parallele Deploy-Wege (manueller Workflow-Dispatch, Wrangler-CLI, Cloudflare-Dashboard) waren historisch unklar und führten dazu, dass Änderungen nicht sicher live gingen.

Entscheidung: Ein einziger automatischer Pfad. .github/workflows/deploy.yml triggert bei jedem Push auf main → GitHub Actions baut → Cloudflare Pages deployt nach scim3.diesenpark.com. Manuelles workflow_dispatch bleibt als Notfall-Trigger erhalten.

Konsequenz: "Jetzt ist es fix auf der veröffentlichten Seite" = git push main. Innerhalb von ~1-2 Minuten ist die Änderung live. Kein Wrangler-Aufruf, kein Dashboard-Klick, kein manueller Workflow-Start nötig.

Operator-Workflow:
  Session: feature-branch + npm run dev (lokale Vorschau, niemand sonst sieht es)
  Fertig:  PR oder direkter Merge nach main + push
  Live:    automatisch ~1-2 Min nach push
  Rollback: git revert <commit> + push → wieder ~1-2 Min und der alte Stand ist live

Feature-Branches deployen explizit nicht — kein Branch-Preview konfiguriert. Wer im Browser testen will: lokal mit npm run dev.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_040',
    category: 'adr',
    label: 'Icon Intake Convention — Standard POI-Icon',
    content: `Eingehende POI-Icons werden als einzelne SVG-Dateien geliefert, exportiert aus Adobe Illustrator (oder einem Tool, das dieselben Konventionen erfüllt).

Zeichenfläche (Artboard): 48 × 48 px, viewBox="0 0 48 48".

Aktive Zeichnungsfläche: zentriert, maximal 24 × 24 px. Das Symbol darf kleiner sein, aber nie über diese Box hinausragen. Die umgebenden 12 px Sicherheitszone sind für den system-gerenderten Container reserviert.

Layer-Struktur (von unten nach oben):
  1. Gruppe <g id="…"> — ID = Identität der Zeichnung (siehe Namenskonvention unten).
  2. fill — weiße Innenfläche, kein Stroke (fill="#fff", stroke="none").
  3. stroke — schwarze Konturlinie, kein Fill (fill="none", stroke="#000", stroke-width="1", stroke-linecap="round", stroke-linejoin="round").

Komplexitätsgrenze: ≤ 60 Ankerpunkte über alle Pfade hinweg (Summe der Endpunkt-Kommandos M/L/H/V/C/S/Q/T/A in allen d-Strings). Lesbarkeit vor Detailtreue.

Was NICHT ins Icon gehört (wird vom System ergänzt):
  - Container (Geometrie + Farbe der Subkategorie, siehe ann_042)
  - Hitbox (kreisförmig, vom Renderer berechnet)
  - Hintergrund-, Padding- oder Hilfsflächen
  - Illustrator-Preview-Metadaten am Root-SVG (z.B. id="kbc-…") — beim Import automatisch entfernt

Sonderregel — Icons ohne Gruppe: Wenn das SVG keine <g id="…"> enthält, gilt der vorhandene Layer (alle Pfade auf Root-Ebene) automatisch als Stroke-Layer. Der fill-Layer entfällt in diesem Fall. Die Spec für den Stroke bleibt unverändert: schwarz, 1 px, stroke-linecap="round", stroke-linejoin="round", kein fill (oder fill="none"). Anwendungsfall: einfache strichgrafische Icons (Pfeil, Strich-Symbol), die keine geschlossene Innenfläche brauchen. Konsequenz für die Registry: drawing_id bleibt null (keine wiederverwendbare Drawing-Identität, das Icon ist eigenständig).

Zur Namenskonvention: Es gibt zwei voneinander unabhängige Namen — den Gruppen-Namen im SVG (<g id="fernglas">) und den Dateinamen (Aussichtspunkt.svg). Der Gruppen-Name benennt die Zeichnung selbst (was ist gezeichnet) und ist stabil — eine einmal etablierte Zeichnung wird nicht umbenannt. Der Dateiname benennt, wofür dieses Icon im Katalog steht (welche Rolle es spielt), und ist veränderbar. Dasselbe Drawing kann unter mehreren Bedeutungen auftreten: Aussichtspunkt.svg, Hochstand.svg, Belvedere.svg enthalten alle eine <g id="fernglas">. Die Icon-Suche im SCIM-UI findet ein Icon über beide Namen — wer "fernglas" sucht und wer "aussichtspunkt" sucht, landet beim selben Drawing.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_041',
    category: 'adr',
    label: 'Icon Importer UX',
    content: `Der Importer (geplanter eigener Tab) nimmt einzelne .svg-Dateien oder mehrere .svg-Dateien aus einem Ordner entgegen (Multi-Select, Drag-Drop). Er nimmt keinen Ordner als Ganzes entgegen — nur dessen .svg-Inhalte. Nicht-SVG-Dateien werden ignoriert; Unterordner werden nicht rekursiv durchsucht.

Statusdarstellung pro Datei im Importer-Tab:
  - Eingegangen, noch ungeprüft: Icon mit 50 % Deckkraft (grau), kein Rahmen, Spinner zeigt "Prüfung läuft".
  - Bestanden (PASS): Icon voll deckend, dünner grüner Rahmen, ✓ oben rechts. Hover: "48×48 · Layer ok · Stroke ok · N Ankerpunkte". Per Klick übernehmbar.
  - Mit Warnungen (WARN): Icon voll deckend, dünner gelber Rahmen, ⚠-Symbol. Importierbar mit Hinweis (z.B. "Preview-Metadaten gefunden, beim Import bereinigt" oder "57 Ankerpunkte — knapp am Limit").
  - Nicht bestanden (FAIL): Icon voll deckend, roter Rahmen, ✗-Symbol. Nicht importierbar, bis korrigiert. Klick öffnet das Diagnosesheet.

Diagnosesheet (pro fehlgeschlagenes Icon):
  - Liste aller geprüften Regeln mit ✓ / ✗-Status, z.B.:
      ✓ viewBox="0 0 48 48"
      ✗ Layer-Gruppe ohne id — erwartet <g id="…">
      ✓ Layer fill: Farbe #fff, kein Stroke
      ✗ Layer stroke: stroke-linecap fehlt — erwartet round
      ✓ Ankerpunkte: 42 (≤ 60)
      ✗ Inhalt überschreitet 24×24-Box (gemessen: 26×22)
  - Pro ✗ ein kurzer Korrektur-Hinweis
  - "Erneut prüfen"-Button für extern korrigierte und neu gedraggte Dateien
  - "Verwerfen"-Button

Übernahme in die Bibliothek:
  - Bestandene Icons per Klick (oder Bulk: "Alle PASS übernehmen") nach data/icons/
  - Namenskollision: Dialog "Vorhandenes überschreiben?" mit Vergleichs-Vorschau alt vs. neu

Spec der Eingangsdateien siehe ann_040.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_042',
    category: 'adr',
    label: 'Container, Geometrien & Palette',
    content: `Ein Container besteht aus genau einer geometrischen Form in einer Bounding-Box von max. 44 × 44 px (zentriert in einem 48 × 48-Viewport, 2 px Sicherheitsrand). Stroke und Fill liegen nicht auf getrennten Ebenen wie bei Icons — Container haben nur eine Form.

Konvention:
  - Universell schwarzer Stroke, 1 px
  - Fill wird zur Renderzeit aus der Subkategorie-Farbe übernommen (Cluster-Hexagon: Sonderfall, siehe ann_043)
  - Geometrien werden im Code als Konstanten geführt, nicht als File-Import. Sie erscheinen im SCIM-UI, sind aber nicht UI-editierbar.

Datenform der Geometrien — diskriminierte Union. Vier SVG-native Varianten reichen aus: circle, rect, polygon, path. Der Renderer ist eine einzige Funktion, die nach kind switched und das passende SVG-Primitive emittiert.

  type GeometryShape =
    | { kind: 'circle';  cx: number; cy: number; r: number }
    | { kind: 'rect';    x: number; y: number; width: number; height: number; rx?: number }
    | { kind: 'polygon'; points: [number, number][] }
    | { kind: 'path';    d: string };

  interface Geometry {
    id: string;                       // 'geo_1_circle' …
    name_display: string;             // 'Kreis', 'Tropfen', …
    viewBox: string;                  // meist '0 0 48 48', Hexagon '0 0 46 50'
    fill_role: 'fill' | 'stroke';     // 'stroke' nur beim Hexagon-Ring
    shape: GeometryShape;
  }

Geometrien — Reihenfolge im Namen verankert, Bucket-Zuordnung:
  geo_1_circle              Points       circle (24,24) r=18
  geo_2_rectangle           Squares      rect 32×32 @ (8,8), rx=6
  geo_3_droplet             Regenerate   path "M 24 4 C 20 12, 9 22, 9 29 A 15 15 0 0 0 39 29 C 39 22, 28 12, 24 4 Z"
  geo_4_rectangle_high      Transport    rect 28×40 @ (10,4), rx=6
  geo_5_rectangle_wide      Service      rect 40×28 @ (4,10), rx=6
  geo_6_triangle            Help         polygon [(24,7), (44,41), (4,41)] — Apex 3 px nach unten verschoben gegen optisches "zu hoch" empfinden
  geo_special_hexagon_ring  Cluster      polygon [(23,0), (46,12.5), (46,37.5), (23,50), (0,37.5), (0,12.5)], viewBox 0 0 46 50, fill_role 'stroke' (siehe ann_043)

Render-Regel (eine Funktion):
  - Aus der Subkategorie wird die Farbe geholt
  - fill_role 'fill' → Form mit Subkategorie-Farbe füllen, Stroke schwarz 1 px
  - fill_role 'stroke' → transparenter Fill, Stroke in Subkategorie-Farbe (Stroke-Dicke für Cluster siehe ann_043)
  - SVG-Primitive werden direkt emittiert — keine Konvertierung zu Path-Strings, wo eine Primitive verfügbar ist

Subkategorien — Bucket-Position + sprechender Name + Farbe als 6-stelliger Hex:
  points_1_historical      ffd700
  points_2_others          ccff33
  square_1_rest            718c00
  square_2_move            a4d000
  regenerate_1_substanze   87ceeb
  regenerate_2_water       0066ff
  transport_1_vehicle      c0c0c0
  transport_2_parking      7a7a7a
  service_1_sleep          d4a017
  service_2_others         d4a017
  help_1_order             ff8c00
  help_2_emergency         ff4e00

Service: beide Subkategorien teilen dieselbe goldene Farbe — Unterscheidung allein über das Icon innen (bewusst, weil Service eine Not-Kategorie ist und der Fokus dem Operator zumutbar ist).

Warum keine UI-Slots für Kategorien: Die Reihenfolge der Buckets, die Anzahl der Subkategorien und ihre Farbzuordnung sind bewusst nicht im SCIM-UI editierbar. Diese Kategorien sind das semantische Fundament aller POI-Bedeutung in der Auslieferungs-App — eine Änderung wirkt rückwirkend auf alle existierenden Representations und alle gemerkten Operator-Konventionen. Solche Änderungen gehören in eine bewusste Code-Anpassung mit Review, nicht in einen Klick im Editor. Der Operator pflegt POIs innerhalb dieser Struktur; das Strukturskelett selbst ist Sache der Maintainer.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_043',
    category: 'adr',
    label: 'Cluster-Hexagon & Merging-Verhalten',
    content: `Das Cluster-Hexagon ist der visuelle Sonderfall im Container-System (siehe ann_042) und folgt eigenen Regeln.

Statische Spec:
  - Form: Pointy-Top-Hexagon (Spitze oben + unten)
  - Basis-Größe: 46 × 50 px (kleinstes mögliches Cluster aus 2 gerade berührenden POIs)
  - Stroke: 3 px schwarz, skaliert proportional mit der Hexagon-Größe (linear, kein non-scaling-stroke)
  - Fill: weiß
  - Innen: zentriert das Identity-Icon des Clusters (aus dem POI mit is_cluster_identity: true in der Plan-.md, dort markiert als *(Cluster-Icon)*), mit eigenem 48×48-Viewport. Skaliert proportional mit dem Hexagon.

Dynamisches Verhalten — Merging:
  - Zwei POI-Icons überlappen sich auf der Karte (durch Zoom-Out) → sie verschmelzen zu einem Cluster-Icon
  - Coord des Cluster-Icons = Schwerpunkt der zusammengefassten Mitglieder
  - Überlappt ein dritter POI mit dem Cluster-Icon → auch er verschwindet, Cluster wächst
  - Bei Zoom-In: sobald ein Mitglied die Cluster-Hülle verlässt, fällt es heraus → Cluster schrumpft oder löst sich auf

Größen-Regel:
  Cluster-Hexagon-Größe entspricht der Bounding-Box der enthaltenen POIs (im Bildschirm-Pixelraum bei aktuellem Zoom), zuzüglich eines Sicherheitsrands von etwa einem halben POI-Container. Untergrenze: 46 × 50 px. Stroke skaliert proportional zur Größe. Das Hexagon ist somit nie größer als die Fläche, die es repräsentiert — und nie kleiner als ein 2-POI-Basiscluster.

Damit braucht es keine willkürliche Skalierungs-Schrittweite und keine Obergrenze: das Cluster wächst organisch mit dem Abstand seiner Mitglieder.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_044',
    category: 'adr',
    label: 'Decoration-Layout · Anatomie eines kategorisierten POI-Icons',
    content: `Was im Katalog-Tab als ein POI-Visual erscheint, ist ein Composite aus mehreren uebereinanderliegenden Schichten. Diese Annotation beschreibt die beteiligten Elemente und ihr Zusammenspiel.

Schichten (von hinten nach vorne):

1. Container (siehe ann_042) - die geometrische Traegerform
   - Form aus dem Bucket: Kreis, Quadrat, Tropfen, Rechteck hochkant/quer, Dreieck, Hexagon-Ring
   - Farbe aus der Subkategorie
   - Schwarzer 1 px Stroke (Sonderfall Hexagon: skalierender 3 px in Subkategorie-Farbe, transparenter Innenraum)
   - Lebt im 48 x 48-Viewport (Hexagon: 46 x 50)

2. Icon (siehe ann_040) - die zentrale Bildaussage
   - Aus der Icon-Bibliothek per Namen referenziert (Dateiname = Bedeutung, Gruppen-ID = Zeichnung)
   - Native Groesse, keine Skalierung
   - Native Position, ausser per Container-Eigenschaft icon_offset_y verschoben (Tropfen +5, Dreieck +4)

3. Decoration (optional) - semantische Zusatzinformation
   - Beispiel-Variante: 'elevation' - Hoehenangabe als Ziffernreihe unter dem Icon, fuer POIs die gleichzeitig Gipfel sind (z.B. "Katzenstein 1349 m"). Es wird kein eigenes Icon fuer die Summit-Variante gebraucht - dasselbe Drawing wird nur anders positioniert und mit der Decoration ergaenzt.
   - Datenherkunft: Auto-Extraktion via Regex \\b(\\d{2,5})\\s*m\\b aus dem POI-Textfeld. Keine separate Dateneingabe - die Hoehe lebt im Text, wird nur fuers Rendering extrahiert. "m" wird aus Platzgruenden weggelassen, nur die Ziffern gerendert.
   - Opt-in pro Icon: entweder per ICONS_META[id].decoration_below: 'elevation' oder per Trailing-Plus-Konvention im Icon-Namen (z.B. Fernglas+ -> Basis-Icon Fernglas plus erzwungene Decoration)
   - Konzept generisch: weitere decoration_below-Kinds denkbar (Distanz fuer Wegpunkte, Wassertemperatur fuer Badestellen, Bettenzahl fuer Hotels)

4. Hitbox - die klickbare/tippbare Flaeche
   - Noch nicht implementiert. Im Katalog-Tab als Inspektor braucht es keine Hitbox; relevant wird sie erst, wenn das Composite auf einer Karte als interaktiver Marker liegt (Phase 4/5)
   - Konvention aus ann_040: kreisfoermig, vom Renderer berechnet, groesser als der visuelle Container, damit Touch/Klick komfortabel sind
   - Lebt nicht im SVG selbst, sondern im DOM-Layer drueber (z.B. transparenter <circle pointer-events="all"> oder eine HTML-Huelle um das Composite)

Sonderfall Cluster (siehe ann_043):
Ein Cluster ist selbst ein "kategorisiertes Icon" nach der gleichen Schicht-Logik. Container = Hexagon-Ring; Icon innen = das Identity-Icon des Clusters (z.B. Sendemast fuer den Sender-Cluster). Eine Decoration kann theoretisch auch hier haengen, wenn das Identity-Icon eine traegt (Gruenberg 986 m als Cluster-Identity -> Hoehe darunter). Groessenverhalten, Stroke-Skalierung und Bounding-Box-Wachstum des Hexagons sind in ann_043 geregelt.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_045',
    category: 'business_context',
    label: 'Stand der Icon-Pipeline (Checkpoint nach Phase A+B)',
    content: `Checkpoint-Annotation: was die SCIM seit ann_039 (Deploy-Workflow) tatsächlich an Funktion gewonnen hat, plus offene Nächste-Schritte. Soll künftig schneller Orientierung geben "wo stehen wir heute".

Implementiert und live auf scim3.diesenpark.com:

Editor (Phase 3, vor der Icon-Pipeline):
  - P02 Katalog-Tab mit vollem Operator-Editor
  - Inline-Bearbeitung pro POI (Text, Coord, Cluster, Status, Subkategorie, Icon)
  - Hinzufuegen/Loeschen/Wiederherstellen, Reset einzeln + total
  - Auto-Save in localStorage, Dirty/New/Deleted-Marker
  - Export-Button mit Diff-Vorschau und Plan-md-Download

Container-System (Phase A):
  - 7 Geometrien als Code-Konstanten in diskriminierter Union
    (circle, rect, polygon, path), exakt nach ann_042-Mathematik
  - Subkategorie-Farbtabelle aktualisiert auf neue Palette
  - Ein generischer ContainerGlyph-Renderer ersetzt die alten switch-cases

Icon-Pipeline (Phase B + Erweiterungen):
  - data/icons/ Ordner, 27 SVG-Icons live in der Bibliothek
    (26 Gruenberg-POI-Icons + Aussichtspunkt als Dual-Naming-Demo)
  - Vite-Glob-Loader laedt alle SVGs zur Build-Zeit
  - Dual-Naming-Modell: file_name (Bedeutung) vs. drawing_id
    (gezeichnete Sache), Suche findet ueber beide
  - svgCleaner-Modul: bereinigt Phantom-Attribute, Illustrator-Metadaten,
    Root width/height, stempelt Copyright "(c) YYYY diesenpark.com"
    idempotent rein
  - liteValidate-Funktion: warnt vor strukturellen Spec-Abweichungen
    (akzeptiert path/rect/polygon/circle/g als Layer-Element)
  - Sonderregel fuer Strich-only-Icons (ann_040): SVG ohne Gruppe
    laeuft auch durch
  - Icon-Bibliothek-Sektion im Katalog-Tab: alphabetische Liste mit
    Vorschau, Suche, Cleaning-Badge (klappbar mit Aenderungsliste),
    Warnungen-Badge

Ziffern-Glyphen (vorbereitend fuer ann_044):
  - data/glyphs/ mit Strich-Glyphen: 0-9 (4x5-viewBox), Einheiten (meter, kilometer, anno, grad, prozent), Sterne (star-5, star-6), Operatoren (plus, circa, und), Frame (8x9, weisses Fill, parametrisch breitenskaliert)
  - digitGlyphs.ts mit deutschen Namen-Mappings, glyphsForNumber(n); generischer glyphById(id) und GLYPHS-Registry
  - Ziffern-Glyphen-Sektion im Katalog-Tab mit Demo-Hoehenangaben

Auto-Deploy (ann_039):
  - Jeder push auf main triggert GitHub Actions, Cloudflare Pages
    deployt scim3.diesenpark.com automatisch innerhalb ~1-2 Min

Offene Naechste-Schritte (Phase C + D + E):

  Phase C - Icon-Picker im Katalog-Editor:
    Statt freiem Text-Input fuer das Icon-Feld eines POI ein klickbares
    Modal mit Vorschau-Grid + Suche ueber Dual-Naming.

  Phase D - Composite-Rendering inkl. Decorations:
    Container + Icon uebereinander gerendert wie er auf der Karte
    aussehen wird. Inklusive Elevation-Decoration nach ann_044
    (Ziffern unter dem Icon fuer Gipfel-POIs), inklusive visueller
    Stress-Test-Toggle (z.B. magenta-Container-Vorschau) - Phantom-
    Attribute und Layer-Probleme werden so vor dem Live-Gang sichtbar.

  Phase E - Importer-Tab mit Drag-Drop:
    Neuer Tab, Operator zieht SVGs rein, sieht PASS/WARN/FAIL pro
    Datei, Diagnosesheet bei FAIL, Cleaner laeuft mit Diff-Vorschau,
    bestandene Icons werden in data/icons/ geschrieben.

Phasen-Reihenfolge nicht starr - C kann auch nach D kommen, je nach
Bedarf. Phase E ist der groesste Brocken und kommt zuletzt.

Kontext-Hilfe im Katalog-Tab: Rechts neben dem Region-Dropdown sitzt
ein (i)-Knopf, der ein Modal mit der Pipeline-Uebersicht oeffnet
(5 Schritte mit Status-Badges live/geplant + Verweise zu den
relevanten Annotations). Verschafft schnellen Ueberblick ohne Wechsel
in die KI-Schnittstelle.`,
    date: '2026-05-25',
  },
  {
    id: 'ann_046',
    category: 'next_intent',
    label: 'Naechste Absicht - Katalog-Editor Erweiterungen nach MVP',
    content: `Stand: MVP-Felder (draw-id, Icon, Tagline, Description short, Coord, Cluster, Status, Subkategorie) sind editierbar und persistierbar. Folgende POI-bezogene Erweiterungen sind als naechstes Paket vorgesehen.

Zusaetzliche Per-POI Felder:
  - description_long: mehrere Absaetze, fuer das Expanded-Sheet auf der Ziel-App
  - image_url: optionales Bild pro POI (URL oder spaeter Upload), Header im Expanded-Sheet
  - external_link: optionale URL (offizielle Seite, OSM-Eintrag, etc.), Button im Expanded-Sheet
  - elevation_m + Einheit (m, km, ...): strukturiertes Feld fuer Hoehenangabe statt Regex auf Tagline. Plus Checkbox 'als Decoration unter dem Icon anzeigen'. Loest mittelfristig den +-Suffix-Mechanismus ab.

UI-Ergaenzungen im Katalog-Editor:
  - Zahnrad-Button am Ende jeder POI-Zeile (Edit-Modus) oeffnet ein Detail-Panel mit den Zusatzfeldern, damit die Tabelle nicht zu breit wird
  - Migrations-Helper: beim Aufruf bestehender Plan-md mit Hoehen-Texten ('Katzenstein 1349 m') kann pro POI per Klick die Zahl in elevation_m extrahiert werden, Tagline bleibt 'Katzenstein'
  - Reset einzelner Felder pro POI (heute nur ganze Zeile)
  - Automatische Migration der localStorage-Patches beim Plan-md-Schema-Wechsel (heute muss der Operator manuell 'Alle zuruecksetzen' klicken)

Cluster-spezifisch:
  - Ghost-Cluster-POI: Cluster-Identitaets-POI ohne Coord (z.B. coord_status 'cluster_only'). Wird nicht als eigener Marker auf der Karte gerendert, erscheint nur als Identity-Icon beim Zusammenfalten des Clusters. Erlaubt eine saubere Trennung zwischen physischem Gebaeude und abstrakter Cluster-Identitaet (siehe Diskussion zu Bergbahn/Talstation).
  - Cluster-Vorschlagsystem (System-Automation, mittelfristig): Statt dass der Operator manuell Cluster-Namen vergibt und in jeder Member-Zeile den Cluster-String eintraegt, schlaegt das System Cluster auf Basis raeumlicher Naehe und semantischer Zusammengehoerigkeit vor (z.B. 'diese 5 POIs liegen <30 m beieinander - clustern?'). Operator bestaetigt oder lehnt ab. Implikation fuer heutige Katalog-Arbeit: Cluster-Strukturen und Cluster-Namen sollen so gefuehrt werden, dass sie spaeter durch maschinell vorgeschlagene Cluster ersetzbar sind. Konkret: keine sprechenden Cluster-Namen aufbauen, die spaeter manuell zu pflegen waeren (z.B. nicht 'Lichtenberg-Gipfel mit Sender und Warte', sondern kurze stabile IDs wie 'Lichtenberg'). Der Cluster-Name ist Identifier, nicht Beschreibung - die Beschreibung lebt in Tagline + description_short des Repraesentanten-POI (Ghost oder Identity-Member). Heute manuell gepflegt, spaeter maschinell vorgeschlagen mit gleichem Datenmodell.

Daten-Roundtrip:
  - Plan-md waechst um weitere Spalten (analog zur Description-short-Erweiterung von 5 auf 6 Spalten)
  - Parser akzeptiert weiterhin aeltere Spalten-Anzahl (Vorwaerts-Kompatibilitaet)

Reihenfolge nicht starr. Wann was gebaut wird, haengt vom konkreten Bedarf der Plan-Datenpflege ab.`,
    date: '2026-05-26',
  },
  {
    id: 'ann_047',
    category: 'next_intent',
    label: 'Naechste Absicht - POI-Rendering und Interaktion in der Ziel-App',
    content: `(Historisch seit 2026-05-28 — UX-Spezifikation lebt jetzt in docs/runtime_mvp.md (autoritativ) und ist als Master-Index in ann_067 zusammengefuehrt. Diese Annotation bleibt als Verlaufseintrag erhalten; ihr Inhalt darf nicht mehr als Soll-Quelle gelesen werden.)

---

Die SCIM3-Ziel-App (mobil und tablet, kartenzentriert) zeigt die im Katalog gepflegten POI-Daten gemaess folgender Schicht-Logik. Diese Annotation beschreibt die geplante Darstellung; die App ist noch nicht implementiert (Phase Z, nach Promotion-Pipeline Phase 4).

Sichtbar auf der Karte (ohne Interaktion):
  - POI-Composite (Container + Icon + ggf. Elevation-Decoration) als Marker an der Coord
  - Tagline NICHT permanent eingeblendet (zu unruhig). Erscheint nur als Tooltip beim Hover (Desktop) oder Long-Press (Touch)
  - Cluster-Hexagon falls mehrere POIs zu nah beieinander - individuelle POIs unsichtbar, Hexagon mit Identity-Icon innen

Tap auf einen POI-Marker:
  - Marker pulst kurz (Bestaetigung)
  - Bottom-Sheet slidet von unten ein (Peek-State, ca. 180 px hoch)
  - Peek-Inhalt:
      [POI-Composite] Tagline (fett) . Description short (1 Zeile) . Subkategorie . Cluster (falls vorhanden)
  - Drag-Handle oben am Sheet zum Aufziehen

Swipe nach oben / Klick auf Drag-Handle:
  - Sheet expandiert auf 70-80 % Bildschirmhoehe
  - Expanded-Inhalt:
      [Bild aus image_url, falls vorhanden, header-breit]
      Tagline (gross) + Description short (Untertitel)
      ----
      Description long (mehrere Absaetze)
      ----
      Coord + 'Route hierher' (oeffnet System-Karten-App)
      'Mehr Infos' -> external_link (oeffnet im Browser)
      'Teilen' (native Share-API)
      'Schliessen' (oder Swipe nach unten)

Tap auf ein Cluster-Hexagon:
  - Bottom-Sheet zeigt Cluster-Uebersicht:
      [Identity-Icon] Cluster-Name . Hover-Text . N enthaltene POIs
      ----
      Liste der Mitglieder mit Mini-Composite + Tagline
      Tap auf Mitglied -> wechselt zu dessen POI-Sheet

Tap ausserhalb / Swipe nach unten: Sheet schliesst, Marker verliert Puls-Effekt.

Felder-Mapping fuer den App-Entwickler:
  Tagline              -> Bottom-Sheet-Titel + Map-Tooltip
  Description short    -> Peek-Untertitel (1 Zeile)
  Description long     -> Expanded-Sheet Hauptbeschreibung
  image_url            -> Expanded-Sheet Header-Bild
  external_link        -> 'Mehr Infos'-Button
  Subkategorie/Cluster -> Peek-Untertitel-Zeile + Cluster-Sheet-Header
  elevation_m          -> Decoration unter dem Icon (siehe ann_044), zusaetzlich als Text im Sheet

Cluster-Verhalten siehe ann_043. Composite-Aufbau siehe ann_044.`,
    date: '2026-05-26',
  },
  {
    id: 'ann_048',
    category: 'next_intent',
    label: 'Naechste Absicht - Cluster-Identitaet ueber Ghost-POI mit geerbter Coord',
    content: `Erweitert die Cluster-Identitaets-Logik aus ann_043.

Konzept

Alles bleibt wie heute. Zusaetzlich kann ein Ghost-Cluster-POI angelegt werden, der einen bestehenden Cluster-POI (also einen POI mit is_cluster_identity = true, im Folgenden 'Parent') als seinen Coord-Spender waehlt.

Damit gibt es drei Modi, die alle gueltig sind:

  - Niemand hat cluster.id im Cluster
      Zoom-In:  Mitglieder einzeln sichtbar
      Zoom-Out: Cluster faltet nicht (keine Identitaet)
  - cluster.id ✓ auf einem POI, kein Ghost (heutiges Verhalten)
      Zoom-In:  POI als eigener Marker
      Zoom-Out: POI selbst ist Cluster-Identitaet (eigenes Icon im Hexagon)
  - cluster.id ✓ + Ghost referenziert ihn
      Zoom-In:  POI weiterhin als eigener Marker
      Zoom-Out: Ghost-Icon im Hexagon (POI-Icon in dieser Sicht ersetzt)

Der Ghost ist eine optionale Aufruestung: nur wenn das Cluster-Gesicht visuell abweichen soll von einem existierenden Mitglieds-POI.

Workflow heute

In der Katalog-Tabelle wird die Cluster-Subkategorie-Sektion permanent eingeblendet, direkt nach Help_emergency. In dieser Sektion gilt:
  - Keine Coord-Eingabe (Coord-Felder deaktiviert)
  - Stattdessen ein Parent-Picker: kleine Modal-Liste zeigt alle vorhandenen Cluster-POIs (POIs mit is_cluster_identity = true)
  - Operator waehlt einen Parent - Ghost erbt dessen Coord
  - Magenta-Hexagon-Ring-Container macht Ghosts in der Tabelle sofort visuell erkennbar

Pro Cluster ein Ghost. Bereits vergebene Parents erscheinen im Picker ausgegraut mit Hinweis 'bereits Ghost X zugeordnet'.

Wenn der Parent geloescht wird oder seinen is_cluster_identity-Status verliert, wird der Ghost mit gelber Warnung 'verwaiste Identitaet - Parent neu zuweisen oder Ghost loeschen' markiert. Im Rendering: Cluster zerfaellt in lose Mitglieder, kein vereinigtes Hexagon-Icon mehr.

Workflow zukuenftig - Auto-Detect auf der Karte

Idealbild fuer eine spaetere Phase: rechts neben der Katalog-Tabelle eine Live-Karten-Vorschau. Wenn der Operator alle POIs eingegeben hat oder die Datenlage sich aendert, erkennt das System raeumliche Cluster automatisch - POIs, die bei einem typischen Zoom-Level visuell zu nah beieinanderliegen.

Was passiert:
  - Auf der Karten-Vorschau erscheint um den detektierten Cluster ein grosser transparenter blinkender Hexagon-Ring
  - Hinweis-Text: 'Achtung Cluster! Waehle einen Cluster-POI aus den Mitgliedern. Optional: lege einen Ghost an, damit der Cluster ein eigenes Gesicht bekommt.'
  - Operator markiert per Klick auf dem Karten-Hexagon oder im Katalog einen Mitglieds-POI als cluster.id
  - Optional: erzeugt anschliessend einen Ghost im Cluster-Subkategorie-Bereich und waehlt diesen Mitglieds-POI als Parent

Diese Auto-Erkennung ist eine Komfort-Schicht ueber dem Heute-Workflow; der manuelle Weg bleibt jederzeit moeglich.

Erweiterung - Hierarchisches Clustering

Das Ghost-Modell ist von Anfang an rekursiv-faehig. Ein Ghost kann selbst wieder Parent eines weiteren Super-Ghosts werden, der einen Cluster-von-Clustern auf einer hoeheren Zoom-Stufe repraesentiert. Beispiel:

  Zoom 14: einzelne POIs sichtbar (Talstation, Tisch Seerast, Bar Lounge, ...)
  Zoom 12: zusammengefaltet zum 'Bergbahn'-Ghost-Hexagon (Talstation-Cluster)
  Zoom 10: dieser und andere Region-Cluster zu einem 'Gruenberg'-Super-Ghost
  Zoom 6:  alle Region-Cluster zu einem 'Salzkammergut'-Super-Super-Ghost
  Zoom 4:  alle Region-Cluster Oesterreichs zu einem 'Oesterreich'-Ghost
  Zoom 2:  'Europa'
  Zoom 0:  'Welt'

Lazy Loading: die Ziel-App laedt nur die fuer den aktuellen Zoom relevanten Ebenen. Beim Hineinzoomen werden weitere Cluster-Daten nachgeladen. Spart Bandbreite und Speicher signifikant.

Pflicht-Regeln bei hierarchischem Clustering (Level 2+)

Sobald hierarchisches Clustering aktiv ist:

  1. Jeder POI gehoert zu mindestens einem Cluster - selbst wenn dieser Cluster nur ein einziges Mitglied hat (Singleton-Cluster)
  2. Jeder Cluster auf Level 2+ MUSS einen Ghost als Repraesentation tragen - ohne Ghost gibt es auf der zoomed-out-Stufe nichts zu rendern, der Cluster waere visuell tot

Auf Level 1 (Basis-Cluster, einzelne POIs sichtbar) bleibt der Ghost OPTIONAL (siehe drei Modi oben).

Komfort-Mechanik: das System kann Singleton-Ghosts auf hoeheren Levels automatisch generieren - Default-Icon ist das des Singleton-Mitglieds, Default-Tagline ebenso. Operator kann diese Auto-Ghosts jederzeit manuell ueberschreiben (eigenes Icon, eigene Tagline, Description).

UI-Darstellung im Katalog-Tab (heute)

Ghosts leben in der Cluster-Subkategorie-Sektion der Katalog-Tabelle. Magenta-Hexagon-Ring-Container macht sie auf einen Blick erkennbar.

Coord-Spalte zeigt:
  - '-' wenn nicht zugeordnet (Status: cluster_ghost_unassigned)
  - 'Pfeil-hoch Talstation' wenn von POI 'Talstation' geerbt (Status: cluster_ghost_assigned)

Der Parent-POI zeigt in seiner Cluster-Spalte den Hinweis 'Identitaet: Bergbahn Pfeil-runter' - die Beziehung ist in beide Richtungen sichtbar.

Daten-Roundtrip / Plan-md

Ghost-POIs erscheinen sowohl in Tabelle 1 (POI-Liste, Cluster-Subkategorie) als auch in der Cluster-Sektion der Plan-md (mit Hover-Text und Mitgliederliste). Konkretes Spaltenformat (neuer coord_status oder Verweis-Notation in der Coord-Spalte) wird mit der Implementierung festgelegt; Parser bleibt vorwaertskompatibel.

Beziehung zu ann_043 (Cluster-Hexagon)

Der Render-Mechanismus fuer das vereinigte Cluster-Hexagon bleibt wie in ann_043 beschrieben (Pointy-Top 46x50, 3px skalierender Stroke, weisser Fill, Identity-Icon mittig). Neu sind nur die Herkunft des Identity-Icons (bevorzugt ein extra dafuer angelegter Ghost-POI, sonst Fallback auf reale POI mit is_cluster_identity=true) und die Rekursivitaet auf hoeheren Zoom-Stufen.`,
    date: '2026-05-26',
  },
  {
    id: 'ann_049',
    category: 'next_intent',
    label: 'Naechste Absicht - Ziel-App MVP Tour-Planung (Gruenberg + Lichtenberg)',
    content: `Erstes konkretes Arbeitsziel fuer die Ziel-App. Definiert was ohne Leaflet-Wegbindung bereits funktionieren soll.

Scope (in)

  - Zwei Regionen verfuegbar: Gruenberg und Lichtenberg, jeweils als eigene Representation
  - Region-Switcher im Header der Ziel-App (Dropdown oder Tabs)
  - Alle POIs werden angezeigt mit ihren Composites (Container + Icon + ggf. Decoration aus ann_044)
  - Drei Cluster pro Gruenberg-Region (Sender, Talstation, Badewiese Weyer) reagieren auf Zoom - bei Zoom-Out falten sie wie in ann_043 beschrieben zum Hexagon zusammen
  - POI-Tap oeffnet Bottom-Sheet (gem. ann_047, Peek + Expanded States)
  - Tagline und Description short werden konsumiert (aus Plan-md geladen)

Tour-Planung (neue Funktion)

  - Markierungs-Mechanismus: im Bottom-Sheet eines POI gibt es einen Button '⊕ Zur Tour'
  - Markierte POIs erhalten visuell einen kleinen nummerierten Badge am Container (1, 2, 3, ...) entsprechend ihrer Reihenfolge in der Tour
  - Tour-Liste: als Tab am unteren Bildschirmrand oder Slide-Out-Panel rechts
  - Reihenfolge = Begehungsreihenfolge: Marken passieren in der Reihenfolge, in der der User die POIs hinzufuegt
      Position 1: Start-POI
      Position N: End-POI
  - Permanenter Toggle am Ende der Liste: 'Ist Start-POI = End-POI' (Rundtour-Modus)
      Default: ein (Rundtour, der End-POI wird visuell = Start-POI)
      Aus: linearer Trip mit unterschiedlichem Start und Ziel
  - POI aus Tour entfernen: per Wisch oder Button in der Liste; Nummerierung der nachfolgenden POIs passt sich an
  - Reihenfolge aendern: Drag-and-Drop in der Liste (optional MVP, kann auch spaeter)
  - Persistierung: Tour-Auswahl bleibt im localStorage der App-Instanz, pro Region separat

UX-Flow

Markierung im POI-Modal: Das ist der natuerlichste Ort.
  - User tappt POI auf der Karte - Bottom-Sheet oeffnet sich (Peek-State)
  - Schon im Peek ist ein prominenter Button '⊕ Zur Tour' sichtbar
  - Tap - POI wird hinzugefuegt, Button wechselt zu '✓ In Tour an Position 3'
  - Zweiter Tap - Entfernen
  - Im Expanded-State derselbe Button, plus mehr Kontext
  Begruendung: User entscheidet direkt nach dem Anschauen der Info, ob der POI passt. Klick-Distanz minimal.

POI-Liste im Modal: nur Kontext-Anzeige, nicht die volle Liste (waere Overload). Im POI-Sheet sichtbar:
  - 'In Tour: ja/nein' + Positions-Nummer (klein im Peek)
  - 'Tour: 5 POIs - ca. 2.3 km' Mini-Status (klein im Expanded-Header)
  - Button 'Tour ansehen' oeffnet die volle Liste (im Expanded)

Volle Tour-Liste lebt woanders:
  - Slide-Out-Panel rechts (Tablet/Desktop)
  - Bottom-Tab mit Drag-Handle (Mobil) - kollabiert auf z.B. 'Tour (5)', expandiert auf vollstaendige Liste
  - Persistent zugaenglich, nicht an POI-Sheet gebunden

So bleibt der POI-Fokus klar, die Tour ist orthogonal verwaltbar.

Folge-Stufen (geplant, nicht im MVP)

MVP+1 - Refinement
  - POI Auto-Sort: 'Geographisch sinnvolle Reihenfolge' via Nearest-Neighbor-Heuristik. Button 'Optimieren' in der Tour-Liste, User kann jederzeit zurueck sortieren
  - Mini-Stats in der Liste: geschaetzte Gesamtdistanz (Luftlinie reicht zunaechst), Anzahl POIs pro Cluster

MVP+2 - Time-Budget
  - Kick-out by Timeframe: User setzt verfuegbare Zeit (z.B. '3 h, gemuetliches Tempo'), System schlaegt POIs zum Entfernen vor - basierend auf:
      geschaetzter Wegzeit (braucht spaeter Wegberechnung ueber BCK/BAK-Path)
      geschaetzter Aufenthaltsdauer pro POI (per-Subkategorie-Default oder per-POI editierbar im Katalog)
  - Visualisierung: grau ueberlagerte POIs, die rausfliegen wuerden, mit 'Entfernen?'-Button
  - Setzt Wege voraus - eher MVP+3 oder spaeter

MVP+3 - Manual Line Select
  - User zeichnet eine Linie auf der Karte (Lasso oder Pfad)
  - Alle POIs innerhalb eines Korridors (z.B. plus/minus 200 m) werden automatisch in Reihenfolge der Linie zur Tour hinzugefuegt
  - Konflikt mit bereits gewaehlten POIs: User wird gefragt 'ersetzen oder dazu?'

Scope (out - bewusst nicht im MVP)

  - Keine Wegbindung / Routenberechnung ueber Leaflet (kommt mit BCK/BAK-Path, ann_007)
  - Kein ColourMesh-Overlay (kommt mit Phase E des Bundle-Push-Mechanismus, ann_034)
  - Keine Cross-Region-Touren (eine Tour bleibt innerhalb einer Region)
  - Keine Export-Funktion fuer die Tour (GPX, Share, etc.) - kann spaeter
  - Keine Editier-Funktion fuer POI-Daten in der Ziel-App (das gehoert in den Katalog, ann_046)

Datenherkunft

  - POIs: aus den Plan-md der jeweiligen Region, via Promotion-Pipeline (Phase 4) in die ScimRepresentation transformiert
  - Bis Promotion-Pipeline steht: Direkt-Import der Plan-md zur Build-Zeit (Vite ?raw-Import, analog zum Katalog-Tab)
  - Icon-Bibliothek wird mit der App ausgeliefert (selbe data/icons/)

Implementierungs-Hinweise

  - Karten-Backend: Leaflet mit OSM-Tiles (gem. ScimRepresentation.leaflet, ann_037)
  - POI-Marker: HTML-Overlay mit Composite-SVG, NICHT Leaflet-CircleMarker (wegen Composite-Komplexitaet)
  - Hitbox: kreisfoermige Overlay-Buttons, transparent, etwas groesser als der Container (gem. ann_044)
  - Cluster-Detection: serverseitig vordefinierte Cluster aus Plan-md werden NICHT dynamisch neu berechnet - die in der Representation festgelegten Cluster-Mitgliedschaften gelten. Falls spaeter dynamisches Clustering kommt, ist das eine eigene Phase.`,
    date: '2026-05-26',
  },
  {
    id: 'ann_050',
    category: 'next_intent',
    label: 'Naechste Absicht - Umbauplan Phasen 1-6 zur Erreichung von ann_049',
    content: `Konkrete Phasen-Roadmap, um das Arbeitsziel aus ann_049 (Ziel-App MVP mit Tour-Planung fuer Gruenberg und Lichtenberg) zu erreichen. Reihenfolge so gewaehlt, dass jede Phase fuer sich abgeschlossen und live testbar ist. Schaetzungen sind grob (eine Session = ein produktiver Arbeitsblock, kein fester Zeitwert).

Phase 1 - Ghost-Cluster-POI im Katalog-Editor (~1-2 Sessions)

Implementiert ann_048. Datenmodell CatalogPoi um parent_poi_id und coord_status 'cluster_ghost' erweitert. Parser und Serializer lesen/schreiben Ghosts (Coord-Spalten-Notation z.B. 'Pfeil-hoch poi_017'). Cluster-Subkategorie-Sektion permanent eingeblendet nach Help_emergency mit Parent-Picker. Composite-Renderer beruecksichtigt Ghost-Identitaet beim Cluster-Render. Smoke-Test: Bergbahn-Ghost fuer Talstation-Cluster anlegen.

Phase 2 - plan.md fuer Lichtenberg (User-Recherche + 1 Session Dev)

User-Task: Recherche der Lichtenberger POIs (Coords, Subkategorisierung, Cluster). Dev liefert ein Skeleton im Format von grunberg_pois_plan.md, User fuellt Details. Anschliessend Eintrag im Region-Switcher der Ziel-App (folgt in Phase 3). Diese Phase blockiert NICHTS - kann parallel zu allen anderen laufen, Resultat fliesst ein sobald bereit.

Phase 3 - Ziel-App Grundgeruest (~1-2 Sessions)

Neuer Tab/Panel in SCIM (pragmatisch in den vorhandenen Deploy integriert, eigene Trennung kommt erst mit Phase 4 der Promotion-Pipeline). Leaflet einbinden plus OSM-Tiles. Region-Switcher im Header. Plan-md per Vite ?raw-Import laden. POI-Marker als HTML-Overlay mit Composite-SVG (re-use PoiComposite aus Katalog-Tab). Initial-Viewport aus Bounding-Box aller POIs. Keine Sheets, kein Cluster-Zoom, keine Tour - reines Rendering der Marker.

Phase 4 - POI-Sheet (~1-2 Sessions)

Implementiert ann_047. Bottom-Sheet-Komponente mit Peek- und Expanded-States, Drag-Handle, Swipe-Gesten. Tap auf POI-Marker oeffnet Sheet im Peek-State, Marker pulst kurz. Peek zeigt Composite plus Tagline plus Description short plus Subkategorie/Cluster. Expanded zeigt zusaetzlich Bild-Platzhalter, Description long-Platzhalter, Coord, Buttons fuer Route/Mehr/Teilen (zunaechst nur visuell). Schliessen per Swipe down oder Tap ausserhalb.

Phase 5 - Cluster-Verhalten beim Zoom (~1 Session)

Pre-defined Clusters aus Plan-md, nicht dynamisch berechnet. Bei Zoom-Out unter Threshold X: Mitglieder-Marker ausblenden, Cluster-Hexagon an Identity-Coord einblenden. Identity-Icon-Quelle: Ghost wenn vorhanden (aus Phase 1), sonst is_cluster_identity-POI selbst. Tap auf Cluster-Hexagon oeffnet Cluster-Sheet mit Mitgliederliste. Tap auf Mitglied wechselt zu dessen POI-Sheet. Voraussetzung: Phase 1 sollte gemacht sein fuer eleganten Talstation/Bergbahn-Fall, sonst greift Fallback.

Phase 6 - Tour-Planung (~1-2 Sessions)

Implementiert ann_049. Button '⊕ Zur Tour' im POI-Sheet (Peek + Expanded). Nummerierter Badge am Container fuer markierte POIs. Tour-Liste als Slide-Out rechts (Desktop) bzw. Bottom-Tab mit Drag-Handle (Mobil). Rundtour-Toggle am Ende der Liste, Default on. POI entfernen per Swipe oder Button. Reorder per Drag-and-Drop (MVP optional). Persistierung in localStorage pro Region (Key z.B. 'ziel-app:tour:gruenberg').

Empfohlene Reihenfolge

  Phase 1 (Ghost) - starten
  Phase 3 (Grundgeruest)
  Phase 4 (POI-Sheet)
  Phase 5 (Cluster-Zoom)
  Phase 6 (Tour) - Ziel 1 erreicht (Gruenberg laeuft komplett)
  Phase 2 (Lichtenberg) - Ziel 2 erreicht (zweite Region dazu)

Phase 2 zum Schluss, weil sie die Architektur nicht blockiert (Region-Switcher kommt in Phase 3), keinen Dev-Druck erzeugt (User-Recherche ohne Deadline) und nach Vorliegen der Plan-md nur ein 5-Minuten-Push ist.

Handover-Hinweise fuer neuen Chat

Stand der Pipeline: ann_045 (Status nach Phase A-D), ergaenzt um diese ann_050. Ziel-Definition: ann_049. Cluster-Mechanik: ann_043 (statisch) plus ann_048 (Ghost). Composite-Aufbau: ann_044. POI-Sheet-Spec: ann_047. Katalog-Erweiterungen (parallel zur Ziel-App moeglich): ann_046.

Codebasis liegt unter ~/SCIM3ClaudeMax/scim_source. Deploy bei jedem Push auf main automatisch (ann_039). Plan-md fuer Gruenberg in data/grunberg_pois_plan.md (6-spaltig nach MVP-Abschluss). Icon-Bibliothek in data/icons (26 Dateien, Dual-Naming-Konvention). Glyphs (Ziffern + Einheiten + Sterne + Operatoren + Frame) in data/glyphs.`,
    date: '2026-05-26',
  },

  // ── Session 2026-05-27: Tetraeder-Kosmologie + UX-Spec ─────────────────────
  // Ausfuehrliche Doku im Repo:
  //   docs/represent_build.md  ("Kosmologie-Update Mai 2026")
  //   docs/runtime_mvp.md      (Ziel-App UX-Flow)
  //   HANDOVER.md              (Session-Status, Roadmap)

  {
    id: 'ann_051',
    category: 'vocabulary',
    label: 'Kosmologie-Klick-Karte: alle Navigations-Zuordnungen',
    content: `Master-Index der visuellen Klick-Targets in der Kosmologie. Jedes visuelle Element ist entweder bereits einem Panel zugeordnet (Heimat), ein anderer Wirkungstyp (Toggle, Modal), oder noch ohne Heimat (offen). Diese Annotation ist die *einzige* gepflegte Stelle fuer diese Zuordnungen — Aenderungen hier, nirgendwo verteilt.

==============================================================================
1. Tetraeder (zentrale Bedienstelle einer R)
==============================================================================

Der Tetraeder ist kein zusaetzliches Pipeline-Element, sondern die zentrale Bedienstelle, ueber die alle Bausteine einer Repraesentation erreichbar sind. Er bedient bestehende Panels ueber Convenience-Bruecken (siehe ann_055).

4 Faces (Triangles, Bausteine einer R):
  scb (Top, Apex)  ->  P11 Package (Sensus Core Build)
  org (Center)     ->  Workspace
  cat (Bot-Left)   ->  Katalog
  geo (Bot-Right)  ->  Geometry-Editor

3 Spheres (Boegen, Schwellen-Trilogie):
  sys              ->  P01 SystemAdjust
  rou              ->  P02 RegioContent (heute; spaeter P10)
  loa              ->  P09 Engine

Die Spheres heissen Threshold-Schwellen-Trilogie, weil System (Boundary-Parameter), Route (Scoring-Cutoffs) und Load (POI-Auslastungs-Klassifikation) drei verschiedene Schwellen-Ebenen sind, die einer R Gestalt geben.

Mechanik: die Bogensegmente koennen rotieren (Input vs. Output, siehe ann_066).

==============================================================================
2. Transmissionsfeld (das Mesh-Blatt zwischen Mond und Tetraeder)
==============================================================================

  Mesh-Klick       ->  P06 Transmitter (SignalInterpretation, Pattern-Klassifikation)

Heimat-Analyse und Begruendung der 100-Prozent-Wahl: siehe ann_063.
Wiring-ADR (Verschiebung Simulation nach P06): siehe ann_064.
Vokabular-Triade Feld/Transmitter/Transmission: siehe ann_065.

==============================================================================
3. Mond (App-Shell + R-Bibliothek)
==============================================================================

Zwei Klick-Regionen am Logo, geometrisch sauber definiert:

  Hex-Zentrum (Polygon)        ->  R01 Runtime Shell (App-Grundhuelle + Engine)
  Mondscheibe minus Hex (Ring) ->  V01 Pakete (alle veroeffentlichten R's)

Mechanik:
  - Hex visuell auf Faktor 0.85 verkleinert (CSS-Transform um Hex-Mittelpunkt),
    damit die umgebende Klickflaeche groesser wird.
  - SVG-Overlay mit identischem viewBox wie das Logo (107.5 x 51.122).
  - Mondscheibe-Pfad direkt aus logo-base-naked.svg uebernommen; ein
    Hex-Polygon dient als Loch via fill-rule="evenodd".
  - pointer-events: 'fill' auf den Pfaden — Klicks ausserhalb der Mondscheibe
    (z.B. auf die kleinen Auswuchs-Elemente an den Ecken) treffen kein
    Hitbox-Element und tun nichts.

Damit ist die Verteilung eindeutig: Hex-Klick fuehrt immer zu R01,
Mondscheiben-Klick (ohne Hex) immer zu V01, Restraum inert.

==============================================================================
3b. Tiefen-Tetraeder (Substrat der Bipyramide)
==============================================================================

Der Tiefen-Tetraeder (Punkt-nach-unten, rotierend, ann_060) sitzt im
Navigator direkt unter dem oberen Tetraeder. Seine drei Side-Faces
sind klickbar und fungieren als reine Fokus-Instrumente — sie
toggeln Navigator-Sektionen, navigieren nicht zu Panels:

  Face 0  ->  Sektion "Package Pipeline" (auf/zu)
  Face 1  ->  Sektion "Runtime Builder"  (auf/zu)
  Face 2  ->  Sektion "Versionen"        (auf/zu)

Die obere Flaeche (zwischen den drei Top-Vertices) ist visuelle
Basis ohne Klick. Aktiv-Stand pro Face: Sektion offen (manuell oder
durch activeId) -> Face leuchtet wie eine aktive Tetraeder-Face,
mit Pulse.

Konzeptionell: oben (Tetraeder) wirkt komponiert, ruhend, vertikal;
unten (Tiefen-Tetraeder) wirkt im Werden, rotierend, horizontal —
die Stoffe sind verschieden, die Aktion auch. Sicheln (ann_052)
und Faces (oben) bleiben Panel-Navigation, Tiefen-Faces sind
ausschliesslich Sektion-Toggles.

==============================================================================
6. Kosmologie-Dim (Doppel-Schrei-Vermeidung)
==============================================================================

Panels, die in der Kosmologie schon visuell vertreten sind, werden im
Navigator-Listenteil und im Panel-Header auf 60 % opacity gedimmt — sie
brauchen die textuelle Prominenz nicht mehr, weil die Kosmologie sie
zeigt.

Liste der gedimmten IDs (KOSMOLOGIE_IDS in panelRegistry.ts):

  Tetraeder-Spheres:   P01, P02, P09
  Tetraeder-Apex:      P11
  Tetraeder-Faces:     workspace, catalog, geometry_editor
  Mesh:                P06
  Mond:                R01, V01

Andere Panels (P03, P04, P05, P07, P08, P10, P12, P13, P14, R02-R08,
V02, V03, System, KI-Schnittstelle) bleiben voll sichtbar — sie haben
keine visuelle Heimat in der Kosmologie und sind nur ueber den
Listenteil erreichbar.

Dritte Region — vier Mond-Auswuechse als klickbare Pfade (Stand 2026-05-28):

  Top-Left   ->  V02 Tab "Salzkammergut"   (Gruenberg)
  Top-Right  ->  V02 Tab "Boehmerwald"      (Lichtenberg)
  Bot-Left   ->  V02 (kein Tab-Match)        (Kanton Zuerich, Region noch nicht in REGION_MAP)
  Bot-Right  ->  V02 Tab "Salzburg"          (Gaisberg)

Hitboxen sind die ECHTEN Blob-Pfade direkt aus logo-base-naked.svg —
keine Approximations-Kreise mehr, die Klickflaeche folgt exakt der
sichtbaren Form. Pfade leben als Konstante MOND_AUSWUCHS_CONFIG in
Navigator.tsx, jedes Element mit regionMatch (REGION_MAP-ID) und label.

Region-Sync mit V02 (Auswuchs-Aktiv-Zustand)
----------------------------------------------

V02 hat heute schon einen Region-Tab-Switcher (REGION_MAP, 3 Regionen).
Die Mond-Auswuechse synchronisieren sich darauf via zwei Window-Events:

  scim:v02:region-changed   V02 -> Navigator
                             Bei jedem Tab-Wechsel in V02 (auch Mount)
                             dispatcht V02 die selectedRegionId.
                             Navigator spiegelt das in v02Region-State,
                             der passende Auswuchs wird "schreiend aktiv".

  scim:v02:select-region    Navigator -> V02
                             Auswuchs-Klick dispatcht die regionMatch-ID,
                             V02 hoert darauf und schaltet den Tab um.

Der Aktiv-Zustand pro Auswuchs ist damit:
  isActive = (activeId === 'V02') && (v02Region === regionMatch)
           && (regionMatch !== null)

Kanton Zuerich (regionMatch null) erhaelt nie den Aktiv-Stand, weil
es keinen passenden Tab in REGION_MAP gibt — der Auswuchs bleibt
sichtbar klickbar (Navigation zu V02), aber ohne Schreien. Sobald
'kanton_zuerich' in REGION_MAP eingetragen ist, greift die Symmetrie
automatisch.

Heimat-Analyse fuer die Mond-Klicks (komprimiert):

  Hex
    R01 Runtime Shell        95 %  exakt das Was-um-die-Engine-haengt;
                                    bisher kein visueller Einstieg
    System-Panel             65 %  Konkurrent, hat aber schon Nav-Eintrag
    V03 Aktiv-Monitor        50 %  ueberschneidet mit Region 2

  Mond-Koerper
    V01 Pakete              100 %  die Bibliothek der R's, kein Konkurrent
    V03 Aktiv-Monitor        70 %  zu eng (nur live), unter-greift V01
    R08 Build & Cache        40 %  eher Werkstatt als Bibliothek

==============================================================================
4. Inspector (Pergament-Trapez ueber dem Mond)
==============================================================================

  Klick auf Inspector  ->  ScimMap rechts ein/ausblenden (Toggle, kein Panel)

Konzeptionell: Spiegel der Gesamtheit der Systemwelt (siehe ann_052, Korrektur 2026-05-28).

Mechanik: blitzt bei jedem Layer-Toggle in der ScimMap kurz weiss durch (siehe ann_066, Geste 2).

==============================================================================
5. Manual + Reader (zwei Pole am Transmissionsfeld)
==============================================================================

  Manual-Icon (📄)          ->  stumm, keine Aktion (bewusst)
  Reader-Hitbox (unsichtbar, rechts)  ->  oeffnet Manual-Modal

Konzept: die einzige bewusste Asymmetrie der Kosmologie (Datei sitzt, Akt liest, siehe ann_052).

Visuelle Position (Stand 2026-05-28): Manual+Reader sitzen am Fuss
der Kosmologie — also unter der gesamten Bipyramide (Upper-Tetraeder
+ Tiefen-Tetraeder, siehe ann_060) und unmittelbar vor dem Listenteil
(Represent-Build-Section-Header). Die fruehere Position "zwischen Mond
und Tetraeder" (siehe ann_052 / ann_059, dort als Pole am Transmissions-
feld) wurde aus Layout-Gruenden aufgegeben — der Mesh-Tetraeder-Abstand
bleibt durch einen Spacer erhalten. Konzeptionell darf "Manual+Reader
gehoert zur Kosmologie der Werkbank" weiterhin gelesen werden — sie
sind der ruhige Bodensatz unter dem Geschehen, kein Pol im Feld.

==============================================================================
Pflege-Regel
==============================================================================

Jede neue Klick-Verdrahtung wird in dieser Annotation ergaenzt. Konkurrierende Heimat-Optionen werden hier kurz mit Prozent-Schaetzung aufgenommen, damit kuenftige Diskussionen den Stand kennen. Tiefe Begruendungen (ADR-Charakter) bleiben in ihren eigenen Annotationen (063, 064, 066).

Authoritative Vertiefung: docs/represent_build.md, Abschnitt "Kosmologie-Update Mai 2026".`,
    date: '2026-05-28',
  },

  {
    id: 'ann_052',
    category: 'vocabulary',
    label: 'Kosmologie der Werkbank: Mond, Hex, Atem, Empty Sea',
    content: `Die SCIM-Werkbank ist als kosmologisches Bild mit drei vertikalen Schichten organisiert:

OBEN:    Mond     = App-Shell + Engine + R-Bibliothek
                    (im SVG das nackte SCIM3-Logo; Auswuechse = die einzelnen R's;
                    Hex im Zentrum = die eine geteilte Engine)
MITTE:   Tetraeder = lokale Composition einer R im Bau
                    (Apex zeigt nach oben Richtung Mond - dort feuert scb)
UNTEN:   Empty Sea = der dunkle Hintergrund. Darunter liegen Pipeline (P03-P14)
                    und noch tiefer die Operator-Dimension.

Schluesselbilder:

- Atem: Der Hex-Layer pulsiert im 3.2-Sekunden-Takt (Dim 0.625 bis 1.0). Das ist nicht Dekoration - das ist Load, das durch die Engine stroemt. Wenn das Bild jemand erklaert: "Der Hex atmet, weil die Engine atmet, weil Load durch sie stroemt."

- Sicheln: Die drei sichelfoermigen Raeume zwischen aeusseren Triangles und den darueberliegenden Boegen sind kosmologisch reserviert als Beobachtungs-Fenster in den Prozess. Heute leer, vorbereitet.

- Inspector als Spiegel (Korrektur 2026-05-28): Das Pergament-Trapez ueber dem Mond ist KEINE Wellen-Mesh-Oberflaeche wie die Empty Sea. Es ist ein Spiegel, der die Gesamtheit der kleinen Systemwelt darunter reflektiert - eine Flaechenreflexion, keine Oberflaechenbewegung. Konzeptionell die Firmament-Ebene, technisch kein eigener Baustein. Funktional toggelt der Klick die ScimMap rechts ein/aus. Manual und Reader sind keine Inspector-Elemente; sie gehoeren in eine eigene Schicht (siehe ann_059).

- Manual + Reader: Datei-Glyph (stumm) links zwischen Mond und Tetraeder, Reader-Glyph (klickbar) rechts spiegelbildlich. Die einzige bewusste Asymmetrie - der Leser erzeugt die Symmetrie durch den Akt des Lesens. Konzeptionell sitzen sie als Pole an den Raendern des Transmissionsfelds (siehe ann_059), nicht im Inspector.`,
    date: '2026-05-27',
  },

  {
    id: 'ann_053',
    category: 'vocabulary',
    label: 'R-Lifecycle: Tetraeder-Form ↔ Sphere-Form',
    content: `Eine Representation (R) hat zwei visuelle Aggregatzustaende:

- Tetraeder-Form: roh komponiert, deployed aber noch nicht gelebt
                  (gerade entstandener Auswuchs am Mond)
- Sphere-Form:    mit Colourmesh umhuellt, die Engine hat sie geatmet, sie ist live
                  (gereifter Auswuchs am Mond, rund)

Der Strahl vom Apex zum Mond ist die Kausalitaet zwischen lokaler Composition und globaler Bibliothek. Zweimodig:

- (a) Erstmaliger Deploy: Strahl traegt das fertige Bundle hoch -> ein neuer Mond-Tetraeder entsteht.
- (b) Re-Deploy / Engine-Atmung: Strahl feuert Colourmesh-Pulse -> Mond-Tetraeder werden umhuellt, reifen zur Sphere.

In der Spaetversion (siehe Vision in docs) koennen sich die Sphaeren-Boegen am Tetraeder beim Feuern drehen und geben einen Spalt frei. Heute nur konzeptionell.`,
    date: '2026-05-27',
  },

  {
    id: 'ann_054',
    category: 'adr',
    label: 'Lineare Pipeline wird durch Kosmologie 3D-dimensional',
    content: `Beobachtung aus der Session 2026-05-27:

Die Pipeline (P01-P14) ist deterministisch, sequenziell, linear. Sie produziert ein Sensus-Core-Package fuer genau eine Analyse. Das ist ihre Staerke - aber auch ihre erzaehlerische Grenze. Lineare Strukturen erklaeren sich schwer, wachsen schwer organisch, lassen mehrere parallele Inkarnationen nur muehsam zu.

Mit der Tetraeder-Kosmologie wird derselbe Code-Raum auf eine andere Weise sichtbar gemacht: Statt einer langen Kette gibt es einen zentralen Dienstleister (Tetraeder), der gleichzeitig auf verschiedene Punkte der Pipeline zugreift; statt einer Maschine gibt es einen Mond mit Auswuechsen (die verschiedenen R's), die alle dieselbe Engine teilen.

Dadurch wird die Pipeline in der mentalen Darstellung 3D-dimensional:
- Die Pipeline selbst bleibt als Unterwasser-Schicht erhalten.
- Der Tetraeder hebt drei Pipeline-Bausteine als Schwellen heraus (P01, P02, P09).
- Der scb-Apex feuert ins Package-Output (P11).
- Verschiedene R's koennen denselben Pipeline-Code auf unterschiedliche Konfigurationen anwenden, ohne den Code zu duplizieren - die R-Auswahl bestimmt die Inputs.

Welche Vorteile diese 3D-Sicht bringt, ist noch nicht final bewiesen. Vermutungen (siehe ann_057):
- Erklaerbarkeit ueber Bilder statt ueber Diagramme
- Mehrere parallele R's ohne Code-Duplikation
- Wachstum als Organismus / Kosmos statt als verzweigte If-Else-Pipeline

Konsequenz fuer den Code: keine. Die Kosmologie sitzt als Schicht ueber der Pipeline, beruehrt sie nicht (siehe ann_055).`,
    date: '2026-05-27',
  },

  {
    id: 'ann_055',
    category: 'adr',
    label: 'Kompromisslosigkeit: Pipeline unangetastet, Tetraeder als Schicht darueber',
    content: `Methoden-Prinzip dieser Session (nicht verhandelbar):

1. Die Pipeline (P01-P14) wurde durch keine kosmologische Aenderung beruehrt. useScimPipeline.ts ist unveraendert. Pipeline-Panel-Logik ist unveraendert. Daten-Schemas sind unveraendert.

2. Die Click-Targets der Tetraeder-Spheres (sys -> P01, rou -> P02, loa -> P09, scb -> P11) sind Convenience-Bruecken zu existierenden Panels, kein Endzustand. Sie werden langfristig durch echte Threshold-Editoren ersetzt, die die jeweiligen Werte direkt editieren (und die Pipeline-Panels lesen die dann aus separaten JSON-Files). Bis dahin ist die Bruecke ehrlicherweise eine UX-Hilfe, kein architektonischer Anspruch.

3. Wenn etwas in der UI nicht klar ausdrueckbar ist, dann wird eher das Label geschaerft als der Datenpfad gekruemmt. Beispiel: 'Route Thresholds' fuehrt heute noch zu P02 RegioContent (semantisch inkonsistent), aber das Label ist gewollt-richtig fuer die finale Architektur. Wir leben mit der temporaeren Inkonsistenz, um nicht eine schlechtere Loesung permanent zu machen.

4. Umbauten gehoeren geplant. Diese Session hat 12+ Commits produziert, jeder einzeln rueckrollbar, jeder mit klarem Scope.

5. Git ist Review-Mechanismus. Der Browser kann nicht ins Repo schreiben. Mehr-Personen-Approval kommt - wenn ueberhaupt - ueber Cloudflare-Worker + GitHub-API (eigene Bauphase, nicht heute).

Verweis: docs/represent_build.md, Abschnitt "Architekturregeln".`,
    date: '2026-05-27',
  },

  {
    id: 'ann_056',
    category: 'invariant',
    label: 'Tetraeder darf die Pipeline nie mutieren',
    content: `Hartgezogene Linie: Der Tetraeder, die Kosmologie, der Inspector, der Mond, alle Visualisierungen - sie duerfen die Pipeline-Daten und -Logik nicht aendern. Nur lesend zugreifen. Nur navigieren.

Wenn ein zukuenftiger Code-Pfad die Pipeline aus dem Tetraeder heraus modifizieren wollte, ist das ein Architektur-Fehler. Pipeline-Modifikation passiert ausschliesslich ueber die Panel-Editoren (P01 input form, P02 input form, etc.) und ueber Repo-Dateien (data/geometries, data/representations).

Die Pipeline ist die Maschine. Der Tetraeder ist die Werkbank vor der Maschine. Wer an der Werkbank etwas einstellt, geht zur Maschine und stellt es dort ein - nicht umgekehrt.

Diese Invariante schuetzt die Pipeline davor, durch UI-Convenience kompromittiert zu werden.`,
    date: '2026-05-27',
  },

  {
    id: 'ann_057',
    category: 'business_context',
    label: 'Erwartung an die kosmologische SCIM',
    content: `Was wir uns von der kosmologischen Darstellung des SCIM erhoffen (Vermutungen, nicht Beweise):

1. Bessere Erklaerbarkeit. Wer SCIM heute begreifen soll, kaempft sich durch 14 Pipeline-Panels mit kryptischen Namen (P01 SystemAdjust, P09 Engine 4 Modelle, etc.). Die Kosmologie liefert Bilder: Mond, Tetraeder, Atem, Apex, Strahl, Sicheln. Bilder erinnert man, Diagramme lernt man neu.

2. Modell als wachsender Organismus / Kosmos. Eine lineare Pipeline waechst durch Anbau (mehr Panels) oder Verzweigung (if-else-Pfade). Eine kosmische Struktur waechst durch neue Sphaeren um denselben Kern - jede R ist ein eigener Auswuchs am Mond, ohne dass die Engine im Hex sich aendert.

3. Mehrere R's teilen sich eine Engine. Wie Planeten um einen Stern. Das macht das Hinzufuegen einer neuen Region (Boehmerwald, Salzkammergut, Magnum) zu einem Vorgang am Mond, nicht zu einem Pipeline-Eingriff.

4. Geringerer kognitiver Aufwand beim Einarbeiten neuer Mitwirkender. Wer das Bild "Mond mit Auswuechsen, die alle den Hex teilen" gesehen hat, hat 70 Prozent der Architektur verinnerlicht, bevor er eine Code-Zeile gelesen hat.

5. Roboustness gegen Schiefes. Schiefe Compromisse (Pipeline-Hacks, UI-Quick-Fixes) brechen das kosmische Bild sofort. Das macht es leichter, sie zu erkennen und zu verweigern.

Diese Liste ist eine Wette, kein Beweis. Wir behalten uns vor, die Hypothesen zu pruefen, sobald die kosmologische SCIM mehrere Benutzer trifft.`,
    date: '2026-05-27',
  },

  {
    id: 'ann_058',
    category: 'next_intent',
    label: 'R-Konsument bauen — bis dahin ist Representation Manifest-only',
    content: `(Historisch seit 2026-05-28 — die vier-Stuecke-Liste lebt jetzt in ann_067 (Lichtenberg-MVP-Bauplan, Master-Index) als Teil von Stufe 1. Diese Annotation bleibt als Verlaufseintrag erhalten; aktuelle Reihenfolge bitte aus ann_067 ziehen.)

---

Heute, Stand 2026-05-27: Eine data/representations/*.json-Datei ist ein Manifest ohne Konsument. Sie wird in der Workspace-Liste angezeigt - aber von Map, Pipeline, Mesh nicht gelesen. Eine Versprechungs-Datei.

Vier kleine Code-Stuecke heben sie auf "wirksam":

(1) public/_redirects fuer Cloudflare-SPA-Fallback. Damit /<region>/<r-name> nicht zu 404 wird, sondern an die SPA geht.
(2) URL-Parser: liest location.pathname, matched gegen die Representation-Registry, setzt eine active R.
(3) RepresentationContext (React-Context): haelt die active R global, Komponenten abonnieren.
(4) ScimMap reagiert auf active R: fittet auf rep.geometry-Bounds, holt OSM-Wege fuer diese bbox, laedt POIs aus rep.catalog_id.

Mit diesen vier Stuecken hat scim3.diesenpark.com/boehmerwald/lichtenberg endlich echte Wirkung: Karte fokussiert Lichtenberg, Mesh laeuft auf dessen OSM-Daten, POIs aus dem Lichtenberger Katalog.

Das ist der klar abgegrenzte naechste Schritt. Kein Architektur-Risiko, kein Pipeline-Bruch. Ein Commit pro Stueck waere vernuenftig.

Anschliessend faellt der MVP-UX-Flow (docs/runtime_mvp.md) zur Verfuegung: POI-Tap -> Wishlist -> Route durch Mesh -> Guidance. Plus Bonus BAK-Movement ("out of your comfort" + Alternative-Route bei Time-Switcher-Last-Spitze).

Referenzen:
- HANDOVER.md "Was offen ist" Punkt 1
- docs/represent_build.md "Roadmap" Punkt 1
- docs/runtime_mvp.md "Stufenplan" Stufen 1+2`,
    date: '2026-05-27',
  },

  // ── Session 2026-05-28: Kosmologie-Korrekturen und -Erweiterungen ───────────
  // Aufgenommen im Dialog mit dem Operator. Aenderung gegen ann_052:
  //   - Inspector ist Spiegel, nicht Wellen-Mesh (dort korrigiert).
  //   - Manual + Reader sind keine Inspector-Elemente, sondern Pole des
  //     Transmissionsfelds.
  // Neu eingefuehrt:
  //   - Transmissionsfeld (ann_059)
  //   - Tiefen-Tetraeder + Dreiecks-Bipyramide (ann_060)
  //   - Aggregatzustand-Terminologie: Komposition / Substrat (ann_061)

  {
    id: 'ann_059',
    category: 'vocabulary',
    label: 'Transmissionsfeld zwischen Mond und Tetraeder',
    content: `Das Transmissionsfeld ist die aktive Schicht zwischen Mond (oben) und Tetraeder (Mitte). Es ist kein eigenes Geschoepf, sondern ein triangulaerer Ausschnitt aus der Empty Sea: derjenige Bereich, auf dem der Tetraeder floatet - seine Bodenflaeche. Diese Bodenflaeche ist zugleich die geteilte Mittelflaeche der Dreiecks-Bipyramide (siehe ann_060).

Stofflichkeit:
  - Selbe Materialitaet wie die Empty Sea: ein Wellen-Mesh in Bewegung.
  - Aber: begrenzt (durch die Bodenflaeche des Tetraeders, nicht unendlich) und ohne Tiefe (kein Meer, sondern ein Blatt-im-Wind).
  - "Wo das Meer endet, beginnt das Blatt."

Funktion - bidirektional:
  - Abwaerts: Engine im Mond -> Transmissionsfeld -> Schirme (die Threshold-Bogensegmente, "konvexe Empfangsschirme") fangen Signale -> Sicheln sortieren.
  - Aufwaerts: Tetraeder-Apex buendelt -> Strahl durch das Transmissionsfeld -> Mond (Deploy, siehe ann_053).
  - Beide Wege durchstroemen das Feld, also ist Stillstand falsch - es atmet wie der Hex.

Manual und Reader (siehe ann_052) sitzen als Pole an den Raendern dieses Feldes:
  - 📄 Manual (links): das stumme Dokument, der gespeicherte Cache / die Lookup-Tabelle.
  - 📖 Reader (rechts): der aktive Akt des Lesens, der das Manual zum Sprechen bringt.
  - In der Mitte: das Transmissionsfeld selbst, dargestellt als bewegtes Mesh-Blatt.

Abgrenzung Inspector <-> Transmissionsfeld:
  - Inspector spiegelt von oben (Firmament, Spiegel, ruhend).
  - Transmissionsfeld traegt von unten (Bodenflaeche, Mesh-Blatt, stroemend).
  - Beide sind Membranen, aber verschiedener Natur und Funktion.

Stand 2026-05-28: Begriff entschieden im Dialog mit dem Operator. Visualisierung im Navigator (zwischen Logo-Hex und Tetraeder) in Konzeption. Heute liegen dort nur 📄 und 📖 als rohe Andeutungen ohne das Feld dazwischen.

Herkunft des Begriffs: Verdichtung der "Arbeitsgrundlage Priorisiertes Pattern-Routing-System" auf das, was sie in der SCIM-Kosmologie konkret bedeutet - das Medium, durch das gerichtete Signale zwischen Sender (Mond-Engine) und Empfaenger (Tetraeder-Composition) wandern.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_060',
    category: 'vocabulary',
    label: 'Tiefen-Tetraeder und Dreiecks-Bipyramide',
    content: `Erweiterung der Kosmologie unterhalb der Empty Sea (Stand 2026-05-28).

Bisher: ein Tetraeder floatet auf der Empty Sea, Apex zeigt nach oben zum Mond.

Neu: ein zweiter, spiegelbildlicher Tetraeder dockt am Boden des ersten an. Die gemeinsame Bodenflaeche der beiden ist die Wasserlinie - also genau das Transmissionsfeld aus ann_059. Visuell wie der Schwimmer eines Anglers: oben aus dem Wasser, unten im Wasser.

Geometrische Form:
  Zwei Tetraeder, an einer Dreiecksflaeche miteinander verbunden, bilden eine Dreiecks-Bipyramide (auch: triangulare Bipyramide; bei regulaeren Tetraedern Johnson-Koerper J12). 5 Ecken (2 Apices oben+unten, 3 in der gemeinsamen Mittelebene), 9 Kanten, 6 dreieckige Aussenflaechen. Die gemeinsame Innenflaeche verschwindet geometrisch.
  Nicht zu verwechseln mit dem Sterntetraeder (Stella octangula) - das sind sich durchdringende Tetraeder mit gemeinsamem Zentrum, nicht aneinandergrenzende mit gemeinsamer Flaeche.

Dreifache Lesart der geteilten Flaeche:
  - Geometrisch: gemeinsame Basis zweier Tetraeder.
  - Phaenomenologisch: Wasserlinie, Floatpunkt.
  - Funktional: Transmissionsblatt (siehe ann_059).

Was im Tiefen-Tetraeder sitzt:
  - Compute (die Rechenkraft, die der Operator nutzt).
  - Der Operator selbst (menschliche Intention).
  - Alles, was zur Package-Build-Pipeline gehoert, aber noch nicht ausdefiniert / ausformuliert ist.

Atemrichtung des Operators:
  Der Operator atmet den Raum oberhalb der Empty Sea - seine Quelle liegt unten (im Tiefen-Tetraeder), aber sein Wirken richtet sich nach oben in den ausformulierten Raum hinein.

Asymmetrie der Aggregatzustaende (siehe ann_061):
  - Oben (Mond-zugewandter Tetraeder): Komposition - weich + bestimmt.
  - Unten (Operator-zugewandter Tetraeder): Substrat - hart + unbestimmt.
  - Dieselbe Geometrie, gegensaetzliche Materialitaet.
  - Das Transmissionsfeld trennt und verbindet beide.

Konsequenz fuer den Code: keine. Wie ann_055 - die erweiterte Kosmologie sitzt als Schicht ueber Pipeline und Operator-Realitaet, beruehrt sie nicht.

Visualisierung (Stand 2026-05-28)
================================

Der Tiefen-Tetraeder lebt jetzt im Navigator als eigenes SVG
(NavDepthTetraeder.tsx), platziert direkt unter dem oberen Tetraeder.
Punkt-nach-unten stehend, rotierend um die vertikale Achse (~20 s
pro Umlauf, leichter Tilt von 18 Grad fuer Raeumlichkeit).

  - Strokes in der Farbfamilie des oberen Tetraeders (#2d4a6a inaktiv,
    #63b3ed aktiv). Faces ohne Fill im Ruhestand — das visuelle Gewicht
    haengt am Stroke, passend zum "Substrat ist noch nicht ausgeformt".
  - Drei Side-Faces sind klickbar und fungieren als reine Fokus-
    Instrumente: jeder Klick toggelt eine Navigator-Sektion. Mapping:
        Face 0 (top0 -> top1)  ->  Sektion "Package Pipeline"
        Face 1 (top1 -> top2)  ->  Sektion "Runtime Builder"
        Face 2 (top2 -> top0)  ->  Sektion "Versionen"
  - Die obere Flaeche (3 Top-Vertices, kein Apex) bleibt visuelle
    Basis, kein Klick-Target.
  - Aktiv-Stand pro Face: wenn die zugehoerige Sektion offen ist
    (egal ob manuell oder durch activeId), bekommt der Face Fill
    #2b6cb0, hellen Stroke #63b3ed und den .rb-active-tile-Pulse.

Section-Toggle-Funktion und Auto-Expand-Regel aus ann_068 greifen
unveraendert — der Depth-Tetraeder erweitert die Klickflaeche, ohne
die Sektion-Mechanik anzufassen.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_061',
    category: 'vocabulary',
    label: 'Aggregatzustand: Komposition (oben), Substrat (unten)',
    content: `Klaerung der Begriffe fuer die Materialitaet der beiden Tetraeder (siehe ann_060). Entschieden im Dialog mit dem Operator am 2026-05-28.

Problem: "Stofflichkeit" war als Arbeitsbegriff zu philosophie-schwer und unklar. "Partikel" oder "Energieteilchen" committet vorzeitig auf eine diskrete Substanz-Sprache, die fuer den oberen Tetraeder (weich + bestimmt) nicht passt.

Festgelegt:
  - Oben (Mond-zugewandter Tetraeder): Komposition - das bereits Komponierte, Geformte, die R im Werden. Weich, weil im Fluss; bestimmt, weil bereits in Form gebracht.
  - Unten (Operator-zugewandter Tetraeder): Substrat - das tragende Material, das noch nicht geformt ist. Hart in seiner Praesenz; unbestimmt, weil noch nicht ausgesprochen. Compute, Operator-Intention, ungebauter Pipeline-Stoff.

Oberbegriff: Aggregatzustand.
  Physikalisch klar (fest / fluessig / gas / plasma), traegt die Soft/Hard-Polaritaet ohne Substanz-Commitment. Einsetzbar, wenn beide Tetraeder zugleich angesprochen werden ("die zwei Aggregatzustaende der Bipyramide").

Sprachregelung fuer kommende Texte:
  - "Die Komposition im oberen Tetraeder" - statt "Stoff oben".
  - "Das Substrat im Tiefen-Tetraeder" - statt "Materie unten".
  - "Aggregatzustand" als Sammelbegriff, wenn die Polaritaet selbst thematisiert wird.
  - "Stofflichkeit" nur in narrativen / poetischen Passagen, traegt aber nicht mehr die konzeptionelle Last.

Begruendung der Wahl: Oben und unten sind kategorial verschieden, nicht zwei Pole eines Kontinuums. Zwei eigenstaendige Begriffe (Komposition vs. Substrat) sind deshalb ehrlicher als ein gemeinsames Wort fuer beides. Der Oberbegriff Aggregatzustand verbindet sie, ohne ihre Verschiedenheit zu verwischen.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_062',
    category: 'adr',
    label: 'Repo-Pfad-Diagnose und sicherer Commit-Workflow (Stand 2026-05-28)',
    content: `Kontext und Ausloeser

Bei dem Versuch, eine Aenderung an src/scim/ui/panels/AiInterfacePanel.tsx live zu schalten, ergab git status - aufgerufen aus /Users/dietmarbroda/SCIM3ClaudeMax/ heraus - eine alarmierende Anzeige: 203 Dateien als "deleted". Bevor irgendetwas committet wurde, Diagnose read-only durchgefuehrt.

Fakten (gemessen, nicht gemutmasst)

- Im Home-Verzeichnis /Users/dietmarbroda/ liegt ein .git, dessen HEAD auf einem alten Stand steht (commit 7a88f23, 24. Mai 2026). Dieser .git betrachtet das gesamte Home als sein Working-Tree.
- Lokale main: 17 Commits voraus, 199 hinter origin/main. Origin ist die Wahrheit. Die 17 lokalen Commits sind inhaltlich auf origin bereits enthalten, dort an restrukturierten Pfaden (ohne den scim_source/-Wrapper, den der alte Stand hatte).
- /Users/dietmarbroda/scim_source/ enthaelt nur noch .claude/-Worktree-Metadaten und einen .vite-Cache. Die Quellen wurden physisch nach /Users/dietmarbroda/SCIM3ClaudeMax/scim_source/ verschoben.
- /Users/dietmarbroda/SCIM3ClaudeMax/scim_source/ ist ein eigenstaendiger Git-Clone von github:innerding/scim_source.git. HEAD = letzter origin/main-Commit (z.B. 942d72f). Branch main. Status sauber bis auf gewollte Edits.
- Kein Code ist verloren. Inhalt der "deleted" Dateien lebt parallel in (a) der Git-Historie, (b) den Claude-Worktrees vom Home-Repo, (c) dem aktiven Clone in SCIM3ClaudeMax/scim_source/.

Vorgehen - so vorzugehen ist beim naechsten Mal

1. Bevor irgendein Commit angestrebt wird: den Pfad der zu editierenden Datei feststellen (pwd, ls).
2. Aus dem Verzeichnis der Datei git rev-parse --show-toplevel ausfuehren. Das zeigt, welcher .git zustaendig ist.
3. Wenn der angezeigte Toplevel /Users/dietmarbroda lautet (Home-Repo): STOPP. Das ist der falsche Repo. Stattdessen in /Users/dietmarbroda/SCIM3ClaudeMax/scim_source/ wechseln und von dort erneut pruefen.
4. Erst danach git status, git diff, git commit, git push.
5. Bei jeder Aenderung, die "deleted" zeigt, die nicht beabsichtigt war: nichts stagen. Keine -a- oder -A-Flags. Nicht committen. Erst die Ursache klaeren.

Die drei Pfade auf dieser Maschine - kurz

- /Users/dietmarbroda/SCIM3ClaudeMax/scim_source/  ->  der lebendige Repo. Hier wird gearbeitet, committet und gepusht. Eigenes .git, auf main, synchron mit origin. Der GitHub-Action-Deploy haengt an Pushes auf dieses main (siehe ann_039 fuer den Deploy-Workflow).

- /Users/dietmarbroda/.git + /Users/dietmarbroda/scim_source/  ->  der historische Home-Repo und sein leerer alter Working-Tree-Pfad. Veraltet, desynchronisiert, sieht 203 Phantom-Loeschungen. Nicht anfassen. Wenn jemand hier git add -A oder git commit -a ausfuehrt, werden die Loeschungen gestaged - das ist genau das Risiko, das diese Annotation absichert.

- /Users/dietmarbroda/scim_source/.claude/worktrees/*  ->  Claude-Worktrees, die am Home-Repo haengen. Stehen ebenfalls auf altem Stand (HEAD 7a88f23). Nicht als Commit-Pfad nutzen. Eine SCIM-Session, die hier startet, sieht den alten Code-Stand und nicht den realen.

Konsequenz - die drei Regeln

1. Alle Edits + Commits + Pushes ausschliesslich aus /Users/dietmarbroda/SCIM3ClaudeMax/scim_source/ oder darunter.
2. Niemals git-Kommandos aus /Users/dietmarbroda/, /Users/dietmarbroda/scim_source/ oder /Users/dietmarbroda/SCIM3ClaudeMax/ (ohne nachfolgendes /scim_source/) ausfuehren.
3. Die Phantom-Loeschungen im Home-Repo nicht beruehren. Aufraeumen des Home-Repos und der alten Claude-Worktrees ist ein separates Vorhaben. Solange aus jenen Pfaden keine git-Aktion ausgefuehrt wird, ist nichts in Gefahr.

Diese Annotation existiert, damit eine kuenftige Sitzung - ob Mensch oder Claude - dieselbe Diagnose nicht nochmal durchspielen muss, sondern direkt den richtigen Pfad waehlt.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_063',
    category: 'next_intent',
    label: 'Transmission technisch verorten — Heimat-Analyse und Empfehlung',
    content: `Frage

Wo in der bestehenden SCIM-Konzeption koennte die technische Umsetzung des Transmissions-Konzepts (Arbeitsgrundlage Pattern-Routing + ann_059) untergebracht werden?

Analyse — wo die Transmissions-Funktionen heute stecken

Die Arbeitsgrundlage beschreibt das Transmissions-System als Kette: Receptor Fields -> Feature Extraction -> Pattern Classification -> Confidence Scoring -> Priority Queue -> Cache/Lookup -> Dispatcher -> Target App. Gegen die heutigen Panels gemappt:

  - Receptor Fields / Schirme        konzeptuell: Bogensegmente sys/rou/loa; technisch: P01, P02, P09 (Threshold-Editoren)
  - Feature Extraction               P04 TelcoLoad (Signal-Import + Kalibrierung)
  - Pattern Classification           P06 SignalInterpretation (flow / accumulation / ambiguous - exakter Treffer)
  - Confidence Scoring               P09 Engine (4 Modelle, POI-Bewertung)
  - Threshold-Filter                 P10 Route + Layer (semi_auto, editierbare Score-Schwellen)
  - Priority Queue                   nirgends explizit
  - Cache / Lookup / Templates       nirgends als Panel - implizit in R2/D1 (ann_030, ann_037)
  - Bundling (Apex buendelt)         P11 Package
  - Dispatcher / Router              P14 Release + cloudflare worker, kein eigenes Panel
  - Receive-Side (Target App)        R03 Package Loader, R04 Package Validator

Befund

Die Transmission ist ueber Pipeline und Runtime Builder *verteilt*, hat aber **kein integriertes Panel**, das sie als geschlossenes architektonisches Konzept zeigt. Zwei Funktionen fehlen gaenzlich als eigenstaendige Sicht: **Priority Queue** und **Cache/Lookup-Tabellen**.

Drei Heimat-Optionen

A. P11 Package um einen Transmission-Tab erweitern.
   Sanft, kein neuer Navigations-Pfad. Der Tab traegt die Mapping-Tabelle plus die fehlenden Stuecke Priority Queue + Cache als explizite UI-Elemente.

B. Neue Sektion "Transmission" zwischen Package Pipeline und Runtime Builder.
   Geometrisch konsistent zur Bipyramide (ann_060): Pipeline (Substrat unten) -> **Transmission (Feld in der Mitte)** -> Runtime Builder (Komposition oben). Modulvorschlaege:
     T01 Receptor Fields         (Schirme / Threshold-Edges, bezieht P01/P02/P09)
     T02 Pattern Router          (P06 + P09 + P10 gebuendelt)
     T03 Priority Queue + Cache  (neu - schliesst die heutige Luecke)
     T04 Dispatcher              (P14 + Worker gebuendelt)
   Die Module waeren - wie der Tetraeder zu seinen Pipeline-Panels (ann_055) - **Sicht-Layer ueber bestehender Pipeline**, keine neue Logik.

C. System-Panel um einen Transmission-Tab erweitern.
   Bliebe naeher an Dokumentation als an technischer Implementierung. System ist sowieso die Meta-Sicht; aber das Transmissions-Konzept will eher eine eigene Buehne als einen weiteren System-Tab.

Empfehlung — Option B

Drei Gruende:

  1. Geometrisch konsistent zur Bipyramide (ann_060): das Transmissionsfeld sitzt geometrisch zwischen Tetraeder und Mond. Eine Sektion zwischen Package Pipeline (unten) und Runtime Builder (oben) bildet das in der Navigation 1:1 ab.
  2. Deckt die zwei heutigen Luecken (Priority Queue, Cache) explizit ab, statt sie weiter implizit zu lassen.
  3. Respektiert die Architekturregel aus ann_055: keine Pipeline-Mutation, nur eine Schicht darueber. Die Module sind Sichten, die existierende Pipeline-Bausteine buendeln; die Pipeline-Logik bleibt unberuehrt.

Option A waere der schmalere Einstieg, falls erstmal keine neue Sektion angelegt werden soll.

Stand 2026-05-28: Entscheidung steht aus. Diese Annotation haelt die Analyse fest, damit die Entscheidung beim naechsten Auftakt nicht wieder von vorn beginnt.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_064',
    category: 'adr',
    label: 'Simulation von P04 nach P06 — P06 als Mesh-Klick-Ziel',
    content: `Kontext

Die Szenario-Simulation (off_season / normal / peak / event mit Intensitaets-Slider) lebte bisher unter P04 TelcoLoad als Mode-Switch. P04 hatte damit eine Doppel-Identitaet: einerseits Real-Signal-Eingang, andererseits Synthetik-Generator. Das verwischte, was die SCIM eigentlich tut.

Auch in der Analyse aus ann_063 wurde P06 SignalInterpretation als der einzige 100-Prozent-Kandidat fuer das Transmissionsfeld-Klick-Ziel identifiziert — weil Pattern Classification *die* Transmissions-Kernoperation ist.

Entscheidung

  - P04 TelcoLoad wird zur puren Feature-Extraction-Stelle. Nur noch Real-Signal-Anzeige. Kein Mode-Switch, keine Szenarien.
  - P06 SignalInterpretation bekommt einen neuen Tab "Simulation" (Icon 🎭) zwischen "Eingabe" und "Ergebnis". Dort lebt die Sandbox: Szenario-Karten + Intensitaets-Slider + Signal-Vorschau.
  - Das Mesh im Navigator (NavTransmissionField) wird klickbar. Ein Klick fuehrt zu P06 — auf den Default-Tab (Eingabe), von dort ist die Simulation einen Tab entfernt.

Begruendung

  1. Saubere Schichten: P04 = Ingest. P06 = Routing / Klassifikation. Die Simulation gehoert semantisch zu dem, was sie *testet*, nicht zu dem, was sie *vortaeuscht*.
  2. P06 wird zum echten Transmissions-Hub: Mesh-Klick fuehrt hin, und vor Ort sieht der Operator sowohl die Klassifikator-Schwellen (Eingabe-Tab) als auch die Sandbox (Simulation-Tab) im selben Panel.
  3. Die Arbeitsgrundlage Pattern-Routing stimmt geometrisch: "Multi-Signal Receiver -> Feature Extraction -> Pattern Classification" — der Receiver kann real (P04) oder synthetisch (P06.simulation) sein; sortiert wird in P06.
  4. P06 ist heute noch auto_computed — der bisherige Eingabe-Tab traegt nur Schwellenwert-Sliders. Die Simulation als zweiter Tab macht P06 zu einem ernsthaften Steuer-Panel.

Umsetzung — was sich konkret geaendert hat

  - Neu: src/scim/ui/panels/P06SimulationForm.tsx (extrahiert aus dem alten P04, leichte Header-Anpassung).
  - Aendert: src/scim/ui/panels/P04TelcoLoadForm.tsx — Mode-Switch und Simulations-Logik entfernt, nur Live-Anzeige bleibt. Hinweis-Box verweist auf den neuen Ort.
  - Aendert: src/scim/ui/panelRegistry.ts — neuer TabId 'simulation', neue Tab-Liste P06_TABS, P06.tabs zeigt darauf.
  - Aendert: src/scim/ui/PanelWorkspace.tsx — 'simulation' in TAB_ORDER, neuer Case im Render-Switch (heute nur fuer P06 implementiert).
  - Aendert: src/scim/ui/NavTransmissionField.tsx — onClick-Prop, transparente Polygon-Hitbox in Dreiecksform, cursor: pointer.
  - Aendert: src/scim/ui/Navigator.tsx — uebergibt onClick={() => go('P06')} an das Mesh.

Konsequenzen

  - Bestehende Pipeline-Logik unveraendert. dependsOn von P06 bleibt ['P04', 'P05']. Die Sandbox-Werte werden lokal manipuliert, kein Pipeline-Schreibzugriff (Persistenz folgt in SML-4 — entspricht dem Vor-Verhalten unter P04).
  - Die Prozent-Schaetzung aus ann_063 wird durch diesen Schritt ehrlicher: P06 ist jetzt zu 100 Prozent das Mesh-Klick-Ziel, P04 faellt auf eine reine Feature-Extraction-Rolle zurueck.
  - Der neue TabId 'simulation' ist generisch genug, dass spaeter andere Panels eigene Sandbox-Tabs anlegen koennen, ohne den Tab-Mechanismus zu erweitern.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_065',
    category: 'vocabulary',
    label: 'Transmitter — die Komponente im Transmissionsfeld',
    content: `Die Kosmologie hatte bisher eine Luecke. Benannt waren:

  - Transmissionsfeld (ann_059) — das **Wo**: das Medium, das triangulaere Mesh-Blatt zwischen Mond und Tetraeder.
  - Transmission (Arbeitsgrundlage) — der **Akt**: die bidirektionale Bewegung von Signalen.

Aber kein Wort fuer den **Akteur** — die technische Komponente, die *im* Feld *aktiv* tut. "Transmitter" fuellt diese Luecke.

Die Dreiheit ist damit komplett:

  Transmissionsfeld    Medium     das Mesh-Blatt, sichtbar oben im Navigator
  Transmitter          Akteur     die Komponente unten im Pipeline-Substrat (P06)
  Transmission         Akt        die bidirektionale Bewegung, die geschieht

Geometrische Lesart (siehe ann_060)

Der Transmitter lebt verborgen im **unteren Tetraeder** (Substrat, hart-unbestimmt, vor-formuliert). Das Feld liegt visuell am Floatpunkt der Bipyramide, also auf der Empty-Sea-Oberflaeche. Der Mond (Engine + R-Bibliothek) sitzt am oberen Apex.

Wenn der Operator das Feld im Navigator anklickt, holt er den Transmitter aus dem Substrat herauf — das ist die Verbindung Substrat -> Feld -> Komposition.

Heute zugewiesen

P06 SignalInterpretation traegt jetzt den Panel-Header **Transmitter**, mit der bisherigen technischen Bezeichnung als Untertitel. Das Mesh-Klick-Ziel (siehe ann_064) ist deshalb auch der Transmitter — nicht nur ein "Pattern Classifier", sondern der namensgebende Akteur der Transmission.

Sprachregelung

  - "Transmitter" ist immer P06, immer der Substrat-Akteur. Andere Pipeline-Bausteine sind keine Transmitter.
  - "Transmission" ist der Vorgang, nicht ein Objekt.
  - "Transmissionsfeld" ist das Mesh, nicht der Transmitter.

Damit ist die Verwechslungsgefahr zwischen Feld und Komponente strukturell ausgeschlossen.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_066',
    category: 'adr',
    label: 'Visuelle Gesten der Kosmologie: Mechanik-Specs + Bindungen',
    content: `Sammelannotation aller visuellen Gesten, die die Kosmologie animieren. Jede Geste hat eine Mechanik-Spec (Zustaende, Timing) und mindestens eine konkrete Bindung an einen echten Operator-Akt — sonst waere sie Dekoration. Neue Gesten kommen hier hinzu, nicht in einer eigenen Annotation.

==============================================================================
Geste 1 — Bogensegment-Rotation (Tetraeder, Input/Output-Schwenk)
==============================================================================

Kontext

Die drei Bogensegmente (sys / rou / loa) am Tetraeder sind konkave Schirme — Transmissionseingaenge. Ihr Drehzustand bildet ab, ob der Transmitter gerade sendet (Output) oder empfaengt (Input). Bisher (ann_053) war die Drehung nur als "Spaetversion" notiert: "Sphaeren-Boegen drehen sich beim Feuern und geben einen Spalt frei". Diese Annotation praezisiert die Mechanik und bindet sie an einen ersten konkreten Ausloeser.

Mechanik-Spec (Vorgabe)

Zwei Zustaende:

  default = OUTPUT (Ruhestellung, sichtbarer Default)
    - Bogensegmente in 0°-Rotation
    - Apex-Spalt zeigt nach oben zum Mond
    - Strahl kann austreten (Dispatch / Senden)

  input = INPUT (kurzzeitig, ausgeloest durch Aktion)
    - Bogensegmente rotieren +60° im Uhrzeigersinn (gemeinsame Gruppe, Drehung um Tetraeder-Zentrum)
    - Der Apex-Spalt wandert um 60° aus der Mond-Achse
    - Die konkaven Schirme stehen empfangend, kein Beam austretbar
    - Visuell: kurze, klare Bewegung, kein Animations-Loop

Uebergang: CSS-Transition 480 ms cubic-bezier(0.45, 0, 0.55, 1) (ease-in-out, leicht straff).
Dauer im Input-Modus: 1500 ms (per Default, parametrisierbar via Event-Detail.duration).
Gesamte Choreographie eines Pulses: 480 ms rein + 1500 ms halten + 480 ms zurueck = ~2.5 s.

Bindung (Stufe 1, Sandbox)

Heute ein einziger Ausloeser: der "In Klassifikator schieben"-Button im P06-Simulation-Tab.

Implementierung:
  - P06SimulationForm.tsx dispatcht window.dispatchEvent(new CustomEvent('scim:transmitter:pulse', { detail: { duration: 1500 } })) beim Klick.
  - Navigator.tsx hoert per addEventListener auf 'scim:transmitter:pulse', setzt transmissionMode='input' fuer die Dauer, danach 'default'.
  - RepresentBuildTetrahedron.tsx empfaengt transmissionMode als Prop, wrappt die ARCS in <g style={{ transform: rotate(...), transition: ... }}>.

Damit ist die Mechanik vom Event entkoppelt: jeder beliebige Code-Pfad kann das Event ausloesen — heute nur die Sandbox, spaeter weitere.

Aussage des Pulses

"Der Transmitter hat das Signal angenommen." Der Operator drueckt im Simulation-Tab; die Bogensegmente am Tetraeder im Navigator drehen sichtbar in Empfangsstellung; nach 1.5 s schwenken sie zurueck. Das ist eine ehrliche visuelle Quittung — keine Dekoration, sondern Status.

Geplante weitere Bindungen (heute NICHT implementiert)

Stufe 2 — Pipeline-Phasen-Bindung:
  Waehrend eines Pipeline-Laufs reflektiert die Rotation den aktiven Sphere. Der gerade laufende Schwellen-Layer "schliesst sich" empfangend. Setzt voraus, dass die Pipeline Phasen-Events emittiert.

Stufe 3 — Lifecycle-Bindung (R-Deploy):
  Vollstaendige Choreographie. Bogen oeffnen, Apex feuert Strahl zum Mond, ein neuer Mond-Tetraeder entsteht/wird umhuellt (siehe ann_053). Choreographie noch nicht ausgearbeitet.

Risiko und Abgrenzung

Eine Mechanik ohne Bindung waere Ornament. Stufe 1 bindet an einen wirklichen Operator-Akt (Sandbox-Klick), darum bleibt sie ehrlich. Wenn spaetere Stufen ohne klare Bindung kommen, ist das ein Anlass zur Pruefung, nicht zum Bauen.

Code-Footprint

  - RepresentBuildTetrahedron.tsx: neue transmissionMode-Prop, <g>-Wrapper um die ARCS-Schleife mit CSS-Transition.
  - Navigator.tsx: useState + useEffect mit Window-Event-Listener, transmissionMode an Tetraeder durchgereicht.
  - P06SimulationForm.tsx: window.dispatchEvent auf "In Klassifikator schieben".
  - Keine API-Aenderung, keine Pipeline-Mutation. ann_055 respektiert.

==============================================================================
Geste 2 — Inspector-Blitz (Layer-Toggle-Quittung)
==============================================================================

Kontext

Der Inspector ist Spiegel der gesamten Systemwelt (ann_052, Korrektur). Wenn der Operator ueber das "Layer ▾"-Dropdown in der ScimMap einen Layer aktiviert oder deaktiviert, aendert sich, was der Spiegel reflektiert. Der Blitz ist die ehrliche visuelle Quittung dafuer.

Bild: wie ein Blitz, der Wolken in einem Nachthimmel weiss erstrahlen laesst. Das Pergament-Trapez (12 Prozent Opacity, Beige) zuckt fuer einen Augenblick auf weiss durch und faellt zurueck. Lichtimpuls hinter dem Vorhang der Reflexion.

Mechanik-Spec

Zwei sichtbare Zustaende, asymmetrisch gemischt in einem einzigen Pulse:
  Ruhe        :  fill #e8d4a8, fill-opacity 0.12
  Spitze      :  fill #ffffff, fill-opacity 0.88

Timing (CSS-Keyframes "scim-inspector-flash"):
  0 %     -> Ruhe
  18 %    -> Spitze   (scharfer Anstieg, ~80 ms)
  100 %   -> Ruhe     (langsamer Abklang, ~340 ms)
  Dauer gesamt: 420 ms (cubic-bezier 0.2, 0, 0.4, 1)

Eigener zeitlicher Charakter, damit sich der Blitz nicht mit der Hex-Atmung (3200 ms, periodisch, sinusartig) verwechseln laesst.

Bindung — heute

Heute ein einziger Ausloeser: jedes Klicken einer LayerToggle-Checkbox im "Layer ▾"-Dropdown der ScimMap (Header-Bereich, Boundary / POIs / Colour-Mesh / Routen).

Implementierung:
  - ScimMap.tsx, LayerToggle.onChange dispatcht window.dispatchEvent(new CustomEvent('scim:inspector:flash')).
  - Navigator.tsx hoert per addEventListener auf 'scim:inspector:flash', inkrementiert einen flashId-State.
  - Der Inspector-Polygon erhaelt key={\`flash-\${flashId}\`} — der Remount triggert die CSS-Animation neu.

Damit lassen sich beliebige weitere Trigger ergaenzen, ohne den Inspector zu beruehren.

Aussage des Blitzes

"Die Spiegelung hat sich gerade neu sortiert." Operator klickt eine Layer-Checkbox; der Inspector zuckt; die ScimMap zeigt sofort die neue Layer-Komposition. Der Blitz ist die ehrliche Quittung, nicht Dekoration.

Geplante weitere Bindungen (nicht implementiert)

  - Layer-Set-Wechsel an anderer Stelle (z.B. Workspace-Layer-Manager, sobald es ihn gibt).
  - Wechsel der aktiven Representation (URL-Pfad-Aenderung) — der Spiegel muesste dann ebenfalls "neu sortieren".

Beide warten auf eine konkrete Operator-Aktion, an die sich der Blitz haengen kann. Ohne Bindung gehoeren sie nicht hierher.

==============================================================================
Geste 3 — Aktiv-Atem (Navigations-Quittung "du bist hier")
==============================================================================

Kontext

Die Tetraeder-Triangles und -Bogensegmente haben heute bereits eine eingebaute Aktiv-Sprache: das aktuell offene Panel hebt sich farblich ab und atmet im 3200-ms-Takt (CSS-Klasse .rb-active-tile im Tetraeder-SVG). Die anderen Klickziele der Kosmologie (Mond-Hex, Mond-Body, Mesh, Inspector) hatten diese Quittung NICHT — eine Inkonsistenz. Wer auf den Mond klickt und R01 oeffnet, bekam zwar das Panel, aber kein visuelles "ja, der Mond-Hex ist jetzt der Aktive".

Diese Geste macht die Aktiv-Quittung universell.

Mechanik-Spec

Eine globale CSS-Klasse .scim-active-pulse (definiert in Navigator.tsx) traegt eine Atem-Animation:

  @keyframes scim-active-breath {
    0%, 100% { opacity: 0.78; }
    50%       { opacity: 1.00; }
  }
  .scim-active-pulse {
    animation: scim-active-breath 3200ms ease-in-out infinite;
  }

Periodisch, sinusartig, gleicher Takt wie die Hex-Pulse-Atmung der Engine — kein zweites Tempo, das die Wahrnehmung zerteilt.

Zusaetzlich erhaelt das aktive Element einen SCHREIENDEN Aktiv-Stil, identisch zu den Tetraeder-Faces — Konsistenz schlaegt Subtilitaet. Korrektur einer ersten zu zurueckhaltenden Fassung; Begruendung: die zaghaften Aktiv-Stati waren "fad und individuell", schlechter als gar keiner.

Konstanten (1:1 von Tetraeder-Faces uebernommen):
  fill          #2b6cb0   (solider, gesaettigter Dunkelblau-Block)
  stroke        #63b3ed   (heller, klarer Outline)
  strokeWidth   1.5
  Pulse-Klasse  .scim-active-pulse

Zuordnung:
  - Mond-Hex aktiv (activeId === 'R01'):
      Polygon mit Fill #2b6cb0, Stroke #63b3ed, strokeWidth 1.5, Pulse.
      Deckt den weissen Hex der Logo-Grafik vollstaendig ab — bewusst,
      damit der Aktiv-Stand dominant ist (analog zu Tetraeder-Faces,
      deren Linien beim Aktivwerden ebenfalls vom Fill verdeckt werden).

  - Mond-Body aktiv (activeId === 'V01'):
      Donut-Pfad (fill-rule evenodd) bekommt denselben Fill und Stroke,
      damit die ringfoermige Hitbox als geschlossener blauer Ring mit
      heller Doppelkontur (aussen + Hex-Loch) leuchtet.

  - Mesh aktiv (activeId === 'P06'):
      Stroke-Farbe wechselt von Empty-Sea-Weiss auf Tetraeder-Aktiv-Blau
      (#63b3ed). Alpha-Bereich pro Kante steigt von 0.09..0.72 auf
      0.55..0.95 (Apex bleibt etwas verhaltener, Basis sehr kraeftig).
      Strichstaerke x 2.2. Empty-Sea-Charakteristik bleibt sichtbar
      (Verlauf von Apex zu Basis), nur ist der ganze Faecher jetzt blau
      und schreiend statt weiss und zart.

Ausnahme — der Inspector (Firmament)
====================================

Der Inspector folgt der schreienden Linie bewusst NICHT. Begruendung:
das Firmament ist ein Spiegel, kein Schalter. Es schaltet sich nicht
"an", es leuchtet aus der Ferne, wenn die ScimMap geoeffnet ist —
das ist eine andere Art von Quittung.

Aktiv-Stand des Inspectors (Firmament-Glimmer als Layer-Monitor):
  Konstruktion   zwei Layer.
                 - Layer 1: das eigentliche Pergament-Trapez,
                   konstant auf Basis-Helligkeit, traegt weiterhin
                   den Layer-Toggle-Blitz (Geste 2).
                 - Layer 2: vier Trapez-Slices, je einem Layer in der
                   ScimMap zugeordnet (Boundary | POIs | Colour-Mesh
                   | Routen, von links nach rechts). Ein einzelner
                   Cursor wandert sequentiell durch die *aktiven*
                   Slices und ping-pongt an den Enden zurueck — kein
                   paralleles Phasen-Versatz-Modell mehr, sondern
                   eine echte Sequenz. Die Kopplung an die ScimMap
                   passiert ueber das "scim:layers:state"-Window-Event.
  Slice-Peak     white #ffffff @ fill-opacity 0.50
  Slice-Ruhe     fill-opacity 0 (vollstaendig durchsichtig)
  Keyframe       scim-firmament-glimmer:
                   0 %, 70 %, 100 %  ->  opacity 0 (Pause)
                   85 %              ->  opacity 0.50 (Peak)
                 70 % der Cycle-Zeit liegt der Slice bei 0 — sind
                 die Pausen, die das Dauerblinken aufbrechen.
  Sequenz        Ein JS-getriebener Cursor wandert sequentiell durch
                 die aktiven Layer-Indizes. Pro Slice: 600 ms Glimmer
                 + 400 ms Pause, dann Cursor weiter. CSS-Transition
                 400 ms ease-in-out auf fill-opacity macht das Auf-
                 und Abklingen weich.
  Ping-Pong      Am Ende der aktiven Liste kehrt der Cursor um, statt
                 von vorne zu beginnen. Beispiel mit allen vier Layern
                 aktiv: Boundary, POIs, Colour-Mesh, Routen, Colour-
                 Mesh, POIs, Boundary, POIs, ... — jeder Slice glimmt
                 genau einmal pro Halbzyklus, kein doppelter Endpunkt.
  Inaktive       Werden uebersprungen. Bei nur einem aktiven Layer
                 bleibt der Cursor stehen — der Slice pulst dann
                 einfach an Ort und Stelle (glow/Pause/glow). Bei
                 keinem aktiven Layer: kein Glimmer.
  Naht-Gradient  Jeder Slice ist nicht mit Solid-Weiss gefuellt,
                 sondern mit einem linearGradient, dessen Peaks an
                 den inneren Naehten sitzen. Aussenkanten faden
                 zu 0, die Stoesse sind die hellen Stellen. Wirkung:
                 die Aufhellung sammelt sich um die Stoesse herum,
                 die Slices wirken nicht mehr als Bloecke sondern
                 als Naht-Halos. Drei Gradient-Typen:
                   end-left   (Slice 1)      0  ->  1
                   mid        (Slice 2,3)    1 -> 0 -> 1
                   end-right  (Slice 4)      1  ->  0

Wirkung: das Pergament-Trapez bleibt im Ruhezustand vollstaendig wie
inaktiv. Aktive Layer manifestieren sich als wechselnde, kurze
Aufhellungen ihres Teilbereichs (max. 50 % Weiss), inaktive Layer-
Slices bleiben dunkel. Das Firmament ist damit keine Dekoration mehr,
sondern eine ehrliche Anzeige: was leuchtet, lebt gerade auf der Karte.

Wenn waehrenddessen ein Layer-Toggle den Blitz ausloest, betrifft das
nur Layer 1 (das Trapez selbst), nicht die Slices. Beide Gesten
koexistieren konfliktfrei.

Bindung — heute

Das Aktiv-Signal kommt aus dem React-State des Navigators (activeId) und dem App-Level-State (mapCollapsed). Kein Window-Event noetig.

  Mond-Hex                aktiv wenn  activeId === 'R01'
  Mond-Body               aktiv wenn  activeId === 'V01'
  Mesh                    aktiv wenn  activeId === 'P06'
  Inspector (Trapez)      aktiv wenn  inspectorActive === true (= !mapCollapsed)

Tetraeder-Faces/-Arcs nutzen weiterhin ihre lokale .rb-active-tile (gleiches Atem-Konzept, aelter, separates Style-Block in RepresentBuildTetrahedron — bewusst nicht zusammengelegt, weil sie auch in der Light-Variante im ScimMap-Header verwendet werden, wo das Trapez nicht existiert).

Aussage des Aktiv-Atems

"Du bist gerade hier." Jedes Klickziel der Kosmologie quittiert seinen Aktiv-Stand mit demselben sinusartigen Atemzug. Ob der Operator ueber Tetraeder, Mond, Mesh oder Inspector eintritt — der Weg zurueck sieht ueberall gleich aus.

Damit ist die Kosmologie als Navigationssprache geschlossen: jeder klickbare Ort hat (a) Hover-Cursor, (b) Aktiv-Quittung im selben Takt.

==============================================================================
Regel fuer kuenftige Gesten
==============================================================================

Jede neue Geste (Mond-Glimmen, R-Auswuchs-Pulse, was kommt) erhaelt einen eigenen Geste-Abschnitt in dieser Annotation, mit:
  - Mechanik-Spec (Zustaende, Timing, ggf. Keyframe-Definition)
  - Bindung (welcher Operator-Akt, welches Event)
  - Aussage (was sagt die Geste, ohne sie waere es Dekoration)

Ohne Aussage waechst die Liste nicht.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_067',
    category: 'next_intent',
    label: 'Lichtenberg-MVP-Bauplan (Master-Index)',
    content: `Ziel
====

Lichtenberg als funktionale MVP-App fuer den Reviewer abrufbar machen ueber
scim3.diesenpark.com/boehmerwald/lichtenberg. Geometrie + POIs + Wishlist +
Route + Guidance. Bonus (Time-Switcher / BAK / Alternativ-Routen) bewusst
zurueckgestellt — Stufe 2.

Autoritative Referenzen
=======================

Tiefe Spec immer dort, nicht hier:
- docs/runtime_mvp.md         UX-Flow + drei Stufen, autoritativ
- HANDOVER.md (2026-05-27)    Stand und Vier-Stuecke-Plan
- ann_051                     Klick-Karte aller Verdrahtungen
- ann_064 / ann_065           Mesh / Transmitter
- ann_066                     Gesten der Kosmologie

Was heute steht
===============

- data/geometries/lichtenberg.json              committed
- data/representations/rep-lichtenberg.json     committed (Manifest ohne Konsument)
- Colour-Mesh entlang OSM-Wege (Overpass)        live
- Mond-Auswuchs top-right -> V02                 verdrahtet (generisch, Per-R-Filter offen)
- Kosmologie als Navigationskarte                vollstaendig

Stufe 1 — MVP-Kern (Pflicht fuer Reviewer-Stand)
================================================

Vier R-Konsument-Code-Stuecke (kein Panel, ein Commit pro Stueck):
  1. public/_redirects                           Cloudflare-SPA-Fallback
  2. src/runtime/router.ts                       pathname -> Representation
  3. src/runtime/repContext.ts                   RepresentationContext, active R global
  4. ScimMap reagiert auf active R               Bounds fitten, OSM holen, POIs aus rep.catalog_id

Runtime-Flow-Module (Stufe-1-Logik, siehe runtime_mvp.md):
  - src/runtime/routeSolver.ts                   Dijkstra durch OSM-Edges + POIs
  - src/runtime/wishlist.ts                      POI-Auswahl + Reorder
  - src/runtime/guidance.ts                      Next-Stop, Position-Marker, Tap-basiert
  - src/runtime/positionMarker.tsx               Pfeil-Marker auf der Karte
  - Wishlist-Bottom-Sheet                        neu
  - Next-Stop-Card                               neu
  - Tour-Ende-Sheet                              neu

Operator-Panel-Ausbau (damit Release sichtbar wird):
  - Workspace                                    "Publish to CDN"-Aktion pro R
  - V01 Pakete                                   Liste aller R's mit Status + CDN-URL
  - V02 Region-Detail                            Per-Region-Filter (Auswuchs-Klick)
  - V03 Aktiv-Monitor                            aktive R pro Region + QR
  - P11 Package                                  neuer Tab "Preview" — Bundle vor Release
  - P14 Release                                  echter CDN-Upload (heute teils Mock)

Konsumenten-Panel-Ausbau (heute Stubs, werden Sicht / Konfig / Preview in SCIM):
  - R01 Runtime Shell                            Tab "URL & Routing" — Inspektor
  - R03 Package Loader                           Tab "Cache-Inspektor"
  - R05 Local State                              Tab "Wishlist & Tour-State"
  - R07 Karte & Guidance                         Tab "Preview" — Runtime-Flow inside SCIM
                                                  (das Panel, das dem Reviewer gezeigt wird)

Stufe 2 — Bonus-Demo (Wow-Moment, nach Stufe 1)
===============================================

Time-Switcher in der Toolbar, Fake-Load-Time-Variation, BAK-Banner,
Alternativ-Routen-Berechnung, Vergleich-Card. Vollstaendig in
runtime_mvp.md Bonus-Sektion spezifiziert.

Stufe 3 — Polish
================

Echte Geolocation mit Fallback, persistente Tour-Historie (localStorage),
Share-Link, QR-Code-Tour, PWA-Tuning. Siehe runtime_mvp.md Stufe 3.

Empfohlene Reihenfolge
======================

  1. Die vier Code-Stuecke aus Stufe 1 (Routing + Context + ScimMap-Bindung).
     Je ein Commit. Damit wirkt die Lichtenberg-URL erstmals.
  2. R07 Karte & Guidance "Preview"-Tab — der Reviewer-Stand inside SCIM.
  3. V01 / V02 / V03 als sichtbaren Operator-Workflow ausbauen
     (Workspace -> Publish -> Aktiv-Monitor mit QR).
  4. Runtime-Flow-Module: routeSolver, wishlist, guidance. Erst dann ist
     Stufe 1 zu Ende.
  5. Bonus + Polish zurueckhalten bis Stufe 1 stabil ist.

Konsolidierung — was diese Annotation ersetzt
=============================================

Als Master-Index ersetzt diese Annotation die Plan-Aspekte von:
  - ann_058   "R-Konsument bauen ..."         markiert historisch
              (vier-Stuecke-Liste lebt hier weiter, dort als Verlauf)
  - ann_047   "POI-Rendering ... Ziel-App"    markiert historisch
              (UX-Spec autoritativ in docs/runtime_mvp.md, hier nur Index)

ann_058 und ann_047 bleiben als Verlauf lesbar, sind aber nicht mehr
Soll-Quelle. Andere benachbarte Annotationen (ann_046 Katalog-Editor,
ann_063 Transmission-Heimat-Analyse, ann_066 Gesten) bleiben unangetastet,
weil sie eigenen Scope haben.

Pflege-Regel
============

Wenn der Plan sich aendert: hier eintragen, betroffene Detail-Doku in
runtime_mvp.md aktualisieren, ggf. nachgeordnete Annotationen historisch
markieren. Keine zweite Master-Liste anlegen.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_068',
    category: 'adr',
    label: 'Navigator: vier kollabierbare Sektionen mit Auto-Expand',
    content: `Kontext

Mit der vergroesserten Icon-Glyph-Schrift (1.8x) und der wachsenden Anzahl
von Panels (28 Items + Meta) war der Navigator deutlich laenger als der
Screen. Scrollen reicht, ist aber unruhig — und der Operator hat oft nur
ein bis zwei Sektionen, die er aktuell braucht. Die Kosmologie zeigt die
wichtigsten Panels ohnehin als Klick-Targets; der Listenteil ist dann
Doppelarbeit.

Entscheidung

Vier Sektionen im Listenteil sind kollabierbar:

  Represent Build     workspace, geometry_editor, catalog, P01, P02
  Package Pipeline    P03, P04, P05, P06, P07, P08, P09, P10..P14
  Runtime Builder     R01..R08
  Versionen           V01, V02, V03

Default-Zustand: alle vier zu. System und KI-Schnittstelle (Meta-Block)
bleiben immer sichtbar — sie sind Notausgaenge ohne Kosmologie-Heimat.

Regel — wann ist eine Sektion offen
====================================

Eine Sektion ist offen, wenn EINE der beiden Bedingungen gilt:

  (a) Sie enthaelt das aktive Panel (activeId in section.ids).
      Auto-Expand. Der Operator landet automatisch in der richtigen
      Sektion, wenn er ueber die Kosmologie navigiert oder ein Panel
      direkt selektiert.

  (b) Sie wurde manuell aufgeklappt (Header-Klick).
      Der Stand lebt in localStorage unter "scim3_nav_sections_open"
      als Array von Section-IDs. Bleibt ueber Reloads erhalten.

Folge: eine Sektion mit aktivem Panel kann nicht zugeklappt werden
(der Header-Klick toggelt zwar das manuell-offen-Set, aber das aktive
Panel haelt sie offen — sichtbar erst bei Verlassen wirksam).

Vermiedene Nachteile
====================

  - Aktives Panel unsichtbar: Auto-Expand verhindert das.
  - Discoverability: jeder Header zeigt Titel + Chevron (▸/▾) + Count
    in Klammern, etwa "Package Pipeline (12)". Auch im zugeklappten
    Zustand sieht der Operator was sich dahinter verbirgt.
  - Sprung-Reflow: max-height-Transition (280 ms ease-in-out). Die
    Breite des Navigators bleibt fix (210 px) — nur die Hoehe atmet.
  - Verlorener manueller Stand: localStorage haelt ihn ueber Reloads.
    Auto-Expand erweitert die offen-Menge, Auto-Collapse passiert nie
    automatisch.

Visuelles Verhalten
===================

  - Header: zentriert, monospace, #4a6a8a, fontSize 12.5 — identisch
    zum frueheren statischen "Represent Build"-Label, das ist
    visuell die Familie der Uebertitel.
  - Chevron links vom Titel: ▸ zu, ▾ offen. Wenn die Sektion durch
    activeId gehalten wird (locked), wird der Chevron leicht
    abgedunkelt (opacity 0.5) — Hinweis, dass das Toggle gerade nicht
    sichtbar wirkt.
  - Count rechts: "(N)" in 50 % Opacity, dezent.

Hinweis fuer kuenftige Sektionen

Neue Top-Level-Sektion? Einfach in SECTION_DEFS in Navigator.tsx
ergaenzen mit { id, title, ids }. Auto-Expand und localStorage greifen
automatisch.`,
    date: '2026-05-28',
  },
];

function AnnotationsTab() {
  const [annotations] = useState<Annotation[]>(SEED_ANNOTATIONS);
  const [filterCat, setFilterCat] = useState<AnnotationCategory | 'all'>('all');

  const filtered = (filterCat === 'all' ? annotations : annotations.filter(a => a.category === filterCat))
    .slice()
    .sort((a, b) => {
      // Neueste zuerst: nach date desc, Gleichstand nach id desc.
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });

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
  const role = useRole();
  if (role !== 'operator') return null;
  switch (activeTab) {
    case 'input':      return <AnnotationsTab />;
    case 'result':     return <BriefingTab />;
    case 'validation': return <NoteTab tabKey="validation" />;
    case 'raw':        return <NoteTab tabKey="raw" />;
    default:           return null;
  }
}
