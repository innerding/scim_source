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

  // ── POI-Dompteur — Terminologie der Filter-/Tausch-Pipeline (2026-06-10) ──

  {
    id: 'ann_119',
    category: 'vocabulary',
    label: 'POI-Dompteur / poi-circus / poi-dompteur-energy (eingefroren)',
    content: 'POI-DOMPTEUR — Terminologie der POI-Filter-/Tausch-Pipeline (Operator-Vokabular, eingefroren 2026-06-10; ersetzt die generischen Begriffe „swap/suggest"). METAPHER: ein Dompteur bändigt unruhige (belebte) POIs und führt dem Wanderer einen ruhigeren Ersatz vor. — DREI BEGRIFFE: (1) POI-DOMPTEUR = das Subsystem/die Filter-Pipeline selbst (shell-kit poiDompteur.ts; Hauptfunktion dompteurPick(net, chainIds, pois, bottleneckId, dimmed) → DompteurPick|null; Eingabe-POI = CircusPoi). (2) poi-circus = die FILTER-NUMMERN (die „Manege", wo POIs durch ihre Übungen gehen); jede Dimension ist eine Nummer: poi-circus-KINSHIP (Ähnlichkeit, similarity.ts bucketOf/similarityTier — bewusst deskriptiv gehalten) · poi-circus-ENERGY (Ruhe/Netz-Last — die getauschten Beine müssen im Comfort liegen) · poi-circus-DETOUR (Umweg — kleinster Aufschlag). (3) poi-dompteur-‹thema› = die ANIMATIONEN (der Dompteur führt eine Nummer vor); poi-dompteur-ENERGY = die Energieaustausch-Confrontation (Runtime PoiDompteurEnergy.tsx, CSS pde-*): der belebte POI VERWELKT (schrumpft/kippt/dimmt/entsättigt), der ruhigere ERBLÜHT (wächst/glüht/atmet), ein Funke fließt X→Y. — SYSTEMATIK: ein THEMA spannt sich über Filter + Animation (z. B. „energy" = poi-circus-energy Filter ⊕ poi-dompteur-energy Animation). Erweiterbar: weitere Nummern/Themen andocken. Tiefe = „ausgewogen": Orchestrierung + Animation tragen die Metapher, die reinen Kategorie-Helfer (bucketOf/similarityTier) bleiben deskriptiv (Bibliotheks-Lesbarkeit). shell-kit v0.48.0. — (4) MANEGE = die Vorführungs-FLÄCHE/Bühne (der Ring, in dem die Nummern vorgeführt werden), NICHT Filter/Engine. Reserviert für die B3-SAMMELKARTE bei Überlast (mehrere Engpass-POIs treten auf, verwelkend, Reihenfolge = Vorführungsordnung, EINE Entscheidung für die ganze Manege). Die einzelne Stufe-3-Confrontation (poi-dompteur-energy) = „eine Nummer in der Manege". Einlösen bei B3 (z. B. Komponente PoiManege). NICHT in die P11-Shell-Partikelliste (das sind Engine-Teile). — STAND: P11-Shell-Partikel zeigt POI-Circus + POI-dompteuring (statt „dompteur"). poi-dompteur-energy-Animation poliert: energy- pulsiert (loop, kein Stillstand), kein Durchstreichen, Stufe-3-Box als Last-Verlauf (links jetzt → rechts nach Tausch). Bezug: B1/B2 in guidance_play_bauplan.md, ann_116.',
    related_panel: 'P11',
    date: '2026-06-10',
  },

  // ── Leistungsblatt versionieren + Shell-kB aktualisieren (Todo, 2026-06-10) ──

  {
    id: 'ann_118',
    category: 'next_intent',
    label: 'TODO — Leistungsblatt als Version ablegen + Shell-kB aktualisieren',
    content: 'TODO (2026-06-10, Operator-Notiz). (1) LEISTUNGSBLATT VERSIONIEREN: das Leistungsblatt soll nach der NÄCHSTEN Aktualisierung NICHT mehr fortlaufend weiter-aktualisiert, sondern als VERSION abgelegt/eingefroren werden (Snapshot je Stand statt mitlaufender Wert). (2) SHELL-kB GESTIEGEN: die ausgelieferte Shell-/Paket-Größe ist durch die jüngsten shell-kit-Ausbauten gewachsen — walker (S1), BAK-Kaskade (solveRouteAvoiding/worstBreachingLeg), route digitRaw, cluster onMemberClick, similarity+swap (B1) → aktuell shell-kit v0.46.0. Das gehört in SCIM aktualisiert: im LEISTUNGSBLATT (Shell-Größe) UND in R3 — AKTIVMONITOR (ausgelieferte Shell-/Paket-Größe). Kennzahlen-Quelle = sensus/leistungen.ts (eine Quelle, von Leistungsblatt + Manual gelesen). Beide Punkte noch offen.',
    related_panel: 'R3',
    date: '2026-06-10',
  },

  // ── NetzStrukturTests — BAK-Kaskade auf dem Lichtenberg-Netz (2026-06-10) ──

  {
    id: 'ann_117',
    category: 'invariant',
    label: 'NetzStrukturTests — Lichtenberg ist ein prädestiniertes Netz',
    content: 'NETZSTRUKTUR-TESTS — empirischer Befund zur BAK-Kaskade auf dem Lichtenberg-Origin-Netz (rep-lichtenberg), erhoben 2026-06-10 beim Live-Test der Stufen 1/2. — WAS GETESTET: das Verhalten des Kaskaden-Resolvers (Stufe 0 komfortabel / Stufe 1 Ausweichroute / Stufe 2 Engpass-Frage) in Abhängigkeit von (a) der gewählten POI-Kette und (b) der Netz-Last. — WIE GETESTET: in der laufenden Runtime (diesenpark.com/?rep=rep-lichtenberg, mobil 375×844). POI-Paare/Tripel per Klick zu Ketten gewählt; die Netz-Last über den telco-last-sim-Slider (Sim-Tageszeit 6–20 h) variiert — mittags steigt die Last → mehr ausgedimmte Strecken (Ø-Last > comfort) → Resolver bewertet neu. Kein echtes Anthem nötig (Worker liefert Sim-Last). Pro Konstellation abgelesen: Stufe (status=Stufe 1 / alert=Stufe 2) + Umweg-Kennzahlen (pctMore, extraMin). Stichprobe: ~6 POI-Paare × mehrere Zeiten; nicht erschöpfend. — BEFUNDE: (1) Lichtenberg ist ein DICHTES Maschen-Netz mit vielen GLEICH LANGEN Parallelwegen → Stufe-1-Ausweichrouten sind oft „GRATIS": sehr häufig „+0 % · < 1 Min" (es existiert ein gleich langer komfortabler Parallelweg). (2) Bei mittlerer Last (~9:00–9:35) findet die Ausweichung komfortable Wege, teils mit echtem Umweg: gemessen +9 %, +16 % (ruhig) bis +85 % (Alarm, ≥ 20 %) bei ungünstigen, weit auseinander liegenden Paaren. (3) Bei hoher Last (~12:00) deckt der Andrang ganze Bereiche ab → keine komfortable Ausweichung mehr → Stufe 2 (Frage), oft mit RE-ESKALATION (nach „Auslassen" wandert der Engpass zum nächsten POI). — SCHLUSS / WARUM „PRÄDESTINIERT": die Maschen-/Parallel-Struktur macht Stufe-1-Umleitungen billig und hält den Wanderer fast immer im Comfort, OHNE ihn mit Fragen zu behelligen — ideal für den „Geh deinen Weg"-Comfort-Begleiter. Ein DÜNNES / baum-/kettenartiges Netz (wenige Alternativwege, Sackgassen) hätte das Gegenteil: jede Belebung erzwingt Umweg-Prozente oder gleich Stufe 2/3. → NETZ-TOPOLOGIE IST EINE EIGNUNGS-KENNZAHL einer Representation. — ABLEITUNG (Vorschlag, ungebaut): vor Aufnahme einer neuen Rep ein „NetzStruktur-Check" — Maschendichte / Alternativweg-Quote / Anteil degree-1-Enden (Sackgassen) — als Ampel, wie gut sich das Netz für adaptive Comfort-Führung eignet. — METHODEN-LIMITS: Sim-Last (keine echten Anthem-Daten); pct-Werte hängen an der Sim-Last-Verteilung; manuelle Stichprobe. Bezug: BAK-Kaskade ann_116/ann_115; Bau-Stand guidance_play_bauplan.md.',
    related_panel: 'P08',
    date: '2026-06-10',
  },

  // ── BAK-Kaskade — Verfeinerung, Regeln, Stufe 3, offene Streckenwahl (2026-06-10) ──

  {
    id: 'ann_116',
    category: 'next_intent',
    label: 'BAK-Kaskade — Verfeinerung + Regeln + Stufe 3 + offene Streckenwahl',
    content: 'BAK-KASKADE — VERFEINERUNG, REGELN, STUFE 3, OFFENE STRECKENWAHL (Stand 2026-06-10; zu präzisieren + abzuarbeiten. Basis-Kaskade Stufe 1/2 ist gebaut, siehe ann_115/ann_114; Reihenfolge unten). Manifest-treu „kein Routen-Shop", stille Eskalation. — A) KONKRETE VERFEINERUNGEN (baubar): A1 STUFE-1-HINWEIS QUANTIFIZIERT — immer Prozent UND Mehrzeit zeigen: Prozent = (altLen−baseLen)/baseLen, Mehrzeit = (altLen−baseLen)/WALK_SPEED_MPS. Ruhiger Hinweis bis +20 % Mehrweg; AB +20 % → auffälligere (eskalierte) Mitteilung (Farbe/Gewicht hoch), weil der Umweg spürbar wird. A2 BAK-MODAL-BREITE: auf ≤ halbe Screen-Breite beschränken (heute width min(90vw,360px) → z. B. min(50vw, …)). A3 ZEIT-BOX (Steuerleiste) HINTERGRUND = IMMER Comfort-Farbe (colorAt(scale, comfort)); Kontrast für weiße Uhr/Badges sicherstellen (Textfarbe adaptiv, helle Comfort-Farbe → dunkler Text). A4 BAK-BOX HINTERGRUND = IMMER die Farbe der Lage, in die der Wanderer OHNE BAK geriete (Last-Farbe der ungemilderten Basis-Route = Breach-Schwere). Macht die Dringlichkeit sofort lesbar (je belebter, desto „heißer" das Modal). — B) STUFE 3 (POI-TAUSCH) — Design: B1 VORSCHLAG bevorzugt ÄHNLICHE Kategorie. POI-Buckets (Lichtenberg): Points, Squares, Regenerate, Transport, Service. ÄQUIVALENZ-/ÄHNLICHKEITS-REGELN: (i) 2 Subkategorien EINER Hauptkategorie sind ohnehin ähnlich; (ii) Points ≡ Squares; (iii) Squares ≡ Regenerate; (iv) Transport ≡ Service. (Regelwerk ERWEITERBAR — weitere Äquivalenzen/Gewichte hier ergänzen, gebaut wie geplant.) B2 GEGENÜBERSTELLUNG ist NICHT nur eine Zeitdifferenz, sondern eine POI-CONFRONTATION-ANIMATION = Energieaustausch wie kommunizierende Gefäße: der ABzuwählende verblüht/verwelkt, schrumpft kurz, dimmt ab (von Normal → suboptimal); der ANzuwählende erblüht, wächst, bekommt Glow (von Normal → optimal); simultan, jeweils vom eigenen Normal-Niveau aus — dem einen wird Energie entzogen, das andere bekommt sie. Die Zeitdifferenz (Prozent + Mehr-/Minderzeit) begleitet die Animation, ersetzt sie aber nicht. — C) OFFENE DESIGNFRAGE (NOTIERT, nicht jetzt lösen): Der User soll auch selbst STRECKEN/KREUZUNGSPUNKTE wählen können (nicht nur POIs) — eine Strecke zwischen zwei Kreuzungen, oder mehrere. Mögliche Wege: (a) Auswahl über Strecken, (b) über Kreuzungspunkte, (c) eigenes Werkzeug, (d) Swipe + Trassierung. MANIFEST-LEITPLANKE: die Wahl muss EINDEUTIG treffbar sein (treffsicher an-/abwählen, KEINE Zweideutigkeit — vgl. Ziel-App-UX „Geh deinen Weg", Autofocus/Tooltip), sonst Ärger. Erst Design klären, dann bauen. — D) META: weitere Regeln (gebaut ODER geplant) gehören ebenfalls hierher (dies ist der Regel-/Verfeinerungs-Speicher der Kaskade). ABARBEITUNGS-REIHENFOLGE (Vorschlag): A2/A3/A4 (klein, sichtbar) → A1 (Schwelle + Quantifizierung) → B (Stufe 3 inkl. Confrontation-Animation) → C (Streckenwahl, erst nach Design-Klärung). — STAND: A2/A3/A4/A1 GEBAUT (siehe ann_115). — KARTEN-LEBENSZYKLUS (geklärt 2026-06-10): (1) Stufe-2-Frage = PRO ENGPASS EINMAL (entschieden; „Trotzdem hin"/keptPoiIds = Ruhe für diesen POI; neuer Engpass fragt neu; = aktueller Stand, kein Code-Änderung). (2) SWIPE-TO-DISMISS = OFFEN/GEPARKT (Tendenz Snooze = nur kurz wegblenden, evtl. über eine Nachfrage-Kaskade statt sofort; als global heikle Geste markiert, im Detail zu überlegen — Operator momentan unentschieden; NICHT jetzt bauen). (3) SAMMEL-KARTE bei Karten-Überlast = ENTSCHIEDEN → wandert in Gruppe B (überlappt B2): ab mehreren gleichzeitigen Engpässen kollabieren die Einzelkarten zu EINER Karte mit zwei gegensätzlichen Polen — „Belebte Ziele weglassen" (Comfort: alle Engpass-POIs raus) vs „Alle behalten" (Ziele: nichts opfern, BAK wird STILL = das Mute); diese eine Entscheidung räumt alle Karten ab. Gestaltung (Operator): ROUTE in der Karte darstellen + fragliche POIs VERWELKEND (vgl. B2-Animation) + REIHENFOLGE zeigen → Wanderer sieht WO es klemmt = Orientierung. Spätere 3. Option „ruhigere Ähnliche vorschlagen" = Bulk-Variante von Stufe 3. Schwelle (z. B. ab 3) justierbar. — NETZSTRUKTUR-Bezug: ann_117 (Lichtenberg = dichtes/prädestiniertes Netz). Doku-Heimat: docs/guidance_play_bauplan.md (Abschnitt „Verfeinerung & Erweiterung 2026-06-10").',
    related_panel: 'V03',
    date: '2026-06-10',
  },

  // ── App-System-Adjustments — zentrale Stellschrauben (2026-06-09) ───────────

  {
    id: 'ann_115',
    category: 'invariant',
    label: 'App-System-Adjustments — zentrale Stellschrauben (Tuning)',
    content: 'APP-SYSTEM-ADJUSTMENTS — die zentralen Stellschrauben der ausgelieferten Ziel-App (sensus-core-runtime), damit sie beim Feintuning nicht untergehen. Hier steht WO sie sitzen + Default + Wirkung; ändern = Konstante anpassen, neu bauen (npm run build), Deploy. — GUIDANCE/PLAY (src/target-app/origin/OriginPreview.tsx): • SIM_LAPSE = 6 → Vorführ-Zeitraffer des Sim-Walkers (Marker läuft 6× Gehtempo; die Rest-Dauer-Uhr komprimiert dadurch 6× = zählt schneller runter als die Wanduhr). 1 = Echtzeit. ⚠ HAUPT-HEBEL für „die Uhr läuft eigenwillig/zu schnell": kleiner = ruhiger. • WALK_SPEED_MPS = 1.4 → reales Gehtempo (m/s), speist die Rest-Dauer-Schätzung (Restdistanz/1,4). • Tick-Intervall = 200 ms (setInterval im Play-Loop) → Geschmeidigkeit des Positions-Markers. • Steuerleiste: navy #1b2a6b, bottom-center, EINE Leiste (Play/Pause-Badge + DurationClock + nächster-Halt). — POSITIONS-MARKER: Scheibenfarbe fix #f60 (src/assets/guidance/position.svg); SOLL später = Comfort-Farbe (ann_114). Ganzes 32×32-SVG per bearingDeg gedreht. — REST-DAUER-UHR (src/target-app/ui/DurationClock.tsx): Anzeige HH:MM (Stunden links, Minuten rechts, KEINE Sekunden — ruhiger, Minute wechselt nur alle paar Sek). 4×5-Ziffern-SVGs (#000→currentColor, erbt Themenfarbe). height-Prop (Bar nutzt 28). DIGIT_SCALE=0.85 (Ziffern + Strich proportional schlanker); Doppelpunkt bleibt voll (1.0, sitzt minimal höher = markant), colonW=cellW*0.5 + preserveAspectRatio=slice (sonst skaliert er nach Breite und wirkt zu klein). STEUERLEISTE-Reihenfolge: Play → Uhr → zwei Textzeilen (Label/Detail) NEBEN der Uhr → Box niedrig+breit; Text-Spalte minWidth 128 (Detail einzeilig). — BAK-DEESKALATIONSKASKADE (stille Eskalation, manifest-treu „kein Routen-Shop"): Resolver in OriginPreview, eingefroren waehrend der Begehung. Stufe 1 = solveRouteAvoiding(net,wp,dimmed,penalty=1000) — belebte Strecken 1000× teurer, automatisch uebernommen wenn komfortabel + Hinweis (Uhr folgt der Laenge). Stufe 2 = worstBreachingLeg → EINE Frage [Trotzdem hin (keptPoiIds)]/[Auslassen (POI raus, reroute)]. Stufe 3 (POI-Tausch) NOCH OFFEN (braucht Aehnlichkeits-Heuristik). Kaskaden-Karte mittig (top 42%), nicht hinter der Uhr. POI-Waypoint-Nummern = Custom-Uhr-Ziffern (renderRoute opts.digitRaw + clockDigitSvg). shell-kit v0.44.0. — MESH/COMFORT/SIM: comfort-Default 0.65 (BCK tolerierte Last-Obergrenze); tMin-Start 480 (8:00); telco-Turbo-Sim Schritt +20 min / 250 ms (6→20 h Schleife). — GEPLANT (noch nicht gebaut): S4 Ankunfts-Radius ~25 m (POI-Card + Pause); S5 echtes GPS (watchPosition, gleiche Schnittstelle wie Walker) + magnet. Kompass. — Doku: docs/guidance_play_bauplan.md; Bau-Detail siehe ann_114.',
    related_panel: 'V03',
    date: '2026-06-09',
  },

  // ── Target-App MVP-Lichtenberg — Gesamtbild (2026-06-09) ────────────────────

  {
    id: 'ann_114',
    category: 'next_intent',
    label: 'TARGET-APP MVP-Lichtenberg — Gesamtbild + Bauplan Guidance/Play',
    content: 'TARGET-APP MVP-Lichtenberg — Gesamtbild (Stand 2026-06-09). Die ausgelieferte Ziel-App (sensus-core-runtime, diesenpark.com/?rep=rep-lichtenberg). Doku: docs/guidance_play_bauplan.md (aktuell, shell-kit-konform); docs/runtime_mvp.md + docs/fahrplan_mvp_lichtenberg.md (prä-shell-kit, TEILS STALE). — WAS SIE IST: Comfort-Begleiter, Slogan „Geh deinen Weg". Modell B (App routet SELBST über den Segment-Graph, keine vorgebackenen Routen), edge-lokal, Black-Box (Comfort/Route entstehen am Gerät, verlassen es nie). User stellt nur Comfort + Wanderdauer; POI short-tap=markieren, long-tap=Detail. — ARCHITEKTUR-DOKTRIN: Logik in shell-kit (in Shell-Studio testbar), Runtime = dünner Adapter. shell-kit src/app: bak.ts (solveRoute Dijkstra, routeBreachesComfort, toggleWaypoint), route.ts (renderRoute), RouteComfortBanner, ComfortSliders. — ⚠ ZWEI KARTEN-PFADE (wichtig, ann_114 vorher verwechselt): (A) ?rep=<id> → OriginPreview (src/target-app/origin/OriginPreview.tsx) = der ECHTE Auslieferungspfad, was der QR lädt + live vor Ort läuft. Hat schon Colour-Mesh + POI-Auswahl + Route (bak: solveRoute/Comfort/breach) + Comfort = Karte→POIs→Comfort→Route (Modell B). ABER NOCH KEIN geführtes Gehen/PLAY. (B) ?demo=1 → App.tsx + MapView = DEMO (privat); MapView ist @LEGACY („Löschen mit Demo-Ablösung"). Hier liegt eine separate, reichere Guidance-State-Machine (useAppMachine: proposals/BCK/guidance_active/NEXT_SEGMENT) — auf zu löschendem Code, NICHT der Zielort. — GUIDANCE/PLAY GEHÖRT IN OriginPreview (Pfad A); die bak-Route liegt dort als Polylinie bereit. — STAND BAU: S1 GEBAUT (shell-kit v0.43.0 app/walker.ts PURE: walkAlong(polyline,elapsedSec,speedMps)→{pos,bearing,progress,finished} + nearestWaypoint/distM/bearingDeg, 7/7 Node-Tests). DurationClock GEBAUT (Runtime, MM:SS aus Ziffern-SVGs, currentColor) — wiederverwendbar. S2 wurde VERSEHENTLICH in die DEMO (App.tsx) verdrahtet (bleibt stehen, schadet nicht); der ECHTE S2/S3/S4 kommt in OriginPreview. — BAUPLAN (in OriginPreview): S2 Play/Pause + Walker treibt Position auf der bak-Route + Rest-Dauer-Uhr (erstes Anzeige-Element), EINE Steuerleiste. S3 bewegter Positions-Marker (position.svg, GANZES SVG per bearing rotieren — Scheibe=Kreis invariant, nur Kite dreht; Scheibe-Farbe = Comfort-Farbe, Tuning später). S4 Ankunft (<~25 m → POI-Card, teilt Komponente mit Long-tap; bei Ankunft PAUSIEREN) + Tour-Ende. S5 watchPosition (echtes GPS, gleiche Schnittstelle wie Walker = Tausch) + magnet. Kompass (DeviceOrientation) — GLEICH NACH S4, weil „live vor Ort" = echtes GPS. — UX-ENTSCHEIDUNGEN: (a) REST-DAUER-UHR = Herzstück/erstes Anzeige-Element (zählt runter, persistent sobald Route existiert) — ERSETZT den Fortschrittsbalken-Header (raus); nächster-Halt-Info bleibt. (b) Positions-Marker = Google-Maps-GRAMMATIK (stabile Scheibe + drehendes Kite + weißer Rand) in EIGENER Akzentfarbe, KEIN Unschärfe-Kegel (Walker kennt Richtung exakt). (c) Kompass = Geräte-Sensor → S5, nicht Kern (Pfeil zeigt Richtung schon aus bearingDeg, ohne Sensor). (d) Hand-Icon = Coach-Mark/Onboarding (Long-tap lehren) + Empty-States, NICHT Live-UI/Marker. — ICONS GELIEFERT + EINSORTIERT (sensus-core-runtime/src/assets/): guidance/ = position(32x32, Kite rotierbar), play, pause, check, target-flag, compass, pointer(Hand) — Badge-Stil, feste Farben; clock/ = 0–9 + colon (4x5 monospace, beim Einbau #000→currentColor). Spec: UI-Line 24x24/stroke 1.7/currentColor; Marker 32x32 fest; Ziffern-Zelle 4x5. README in assets/guidance/. — NÄCHSTER EINSTIEG: S2/S3/S4 in OriginPreview (S1-Walker + DurationClock sind fertig & wiederverwendbar). Danach (ann_112): Auth/State-Naht/Editor-entrümpeln. ⚠ Worker ggf. wrangler deploy.',
    date: '2026-06-09',
  },

  // ── Versorgungssicherheit (2026-06-09) ──────────────────────────────────────

  {
    id: 'ann_113',
    category: 'invariant',
    label: 'Versorgungssicherheit durch minimale Last (Skalierungs-Merkmal)',
    content: 'VERSORGUNGSSICHERHEIT DURCH MINIMALE LAST (Skalierungs-Merkmal, 2026-06-09; auch als 7. Satz im Design-Manifest, sensus/designManifest.ts). — KERN: das LAUFENDE Anthem ist extrem klein — am Beispiel Lichtenberg gemessen ~3,3 KB je Representation alle 5 Min (~5 Byte/Segment, 648 Segmente, gzip). Origin (statisch, je Version, OHNE px-Bilder — px stecken NUR im Origin-Bundle, nicht im Anthem) ~49 KB gzip, Shell ~138 KB; Erstlieferung ~190 KB, Bestandsnutzer laufend nur ~3,3 KB/5 Min. Sichtbar im Active-Monitor (V03) + Leistungsblatt + Manuals. — WAS DAS GIBT: (1) Skalierung kennt keine Daten-Wand — die wiederkehrende Last ist zu gering, um über Kosten/Bandbreite/Edge-Kapazität je zum Engpass zu werden; nie gezwungen, wegen Last zu drosseln. Bei 10.000 gleichzeitigen Geräten ~0,4 GB/h Egress (Cent-Bereich). (2) Robust gerade dort, wo Netze unter Menschenmengen einbrechen (Events) — 3,3 KB/5 Min kommen auch durch ein überlastetes Mobilnetz; ein MB-Payload stürbe dort. (3) Kein Single Point of Failure am Gerät: weil Origin LOKAL liegt (kann nicht „ausfallen"), übersteht das System kurze ANTHEM-Aussetzer (Server/Netz kurz weg) — das Gerät rechnet Comfort/Route auf lokalem Origin + letztem Anthem weiter, die Last altert nur, die App bleibt nutzbar. — Folgt aus Edge-lokaler Intelligenz + Black-Box + Modell B. Der Hebel für eine noch kleinere ERSTLIEFERUNG ist NICHT die Datenseite (schon top), sondern die Shell (Code-Splitting, leichtere Karten-Lib statt Leaflet) → realistisch ~80–100 KB; Optimierung am Rahmen, keine Notwendigkeit.',
    related_panel: 'V03',
    date: '2026-06-09',
  },

  // ── Claude Critic (2026-06-09) ──────────────────────────────────────────────

  {
    id: 'ann_112',
    category: 'next_intent',
    label: 'CLAUDE CRITIC — kritisches Urteil zum Pathworks-Dashboard',
    content: 'CLAUDE CRITIC — kritisches Urteil zum Pathworks-Dashboard (Stand 2026-06-09, von Claude auf Bitte des Operators, bewusst unbeschönigt). — VERDIKT in einem Satz: starkes konzeptionelles Rückgrat, aber drei wacklige Beine — unauthentifizierte Governance, halb geteiltes State-Modell, hohe Metapher-/Komplexitätslast, die der eigenen Leitidee „radikal schmal für Editoren" widerspricht; strategisch noch nicht das eigene Produkt, das es sein will. — WAS TRÄGT: (1) Leitidee „es gibt nur Representationen" = saubere Informationsarchitektur (Rep als Einheit, Werkzeuge scopen sich auf die gebundene Rep). (2) Git-artiger Lebenszyklus local→submitted→committed, klare Trennung Editor/Operator. (3) Cross-User ist GEBAUT (Einreichen → Operator committet auf anderem Gerät), nicht nur geplant. — KRITIK NACH GEWICHT: (1) GOVERNANCE IST THEATER, solange Auth fehlt. isOperator-Gating + Provenienz („committet von X") sind client-seitige BEHAUPTUNGEN; Presence-Endpoint ist unauthentifiziert, der Worker glaubt blind {role,name}. Jede Vertrauensaussage = Ehrenwort, bis echte Per-User-Auth (CF Access, ann_105) da ist. GRÖSSTE Lücke, alles baut darauf. (2) STATE-MODELL GESPALTEN: Drafts im localStorage EINES Browsers, Einreichungen am Server → Editor auf zwei Geräten = zwei Draft-Welten; „ansehen" einer Server-Submission nicht in lokalen draftStore verdrahtet; Draft veraltet still nach Commit. Persistenz-Naht halb gebaut. (3) KOMPLEXITÄTSLAST widerspricht der Leitidee: die „radikal schmale" Editor-Fläche sitzt in einer barocken Kosmologie (Tetraeder, Sicheln, Brocken, Müllwagen, Mond, hot/cold, Atem, V01/V02/V03, Shell/Origin/Anthem) = Privatsprache, die man erst lernen muss, bevor man handeln kann. Für Operator okay, für Editor Reibung. (4) OPERATOR = FLASCHENHALS: Editor-Weg zur Auslieferung läuft komplett über ihn (submit→review→commit→release→drossel); die entlastende Cluster-Automatisierung ist NICHT gebaut. (5) VERSIONIERUNG real aber flach + zu viele Zahlen: Quelle- vs. ausgeliefert-Version vs. gestaged — ehrlich, aber UX-Falle; keine Stelle sagt „so steht es gerade" in einem Satz. (6) PATHWORKS IST NOCH KEIN PRODUKT, sondern ein umetikettiertes workspace-Panel in SCIM3; die Ausgliederung nach diesenpark.at (ann_106) ist nicht eingelöst — Wortmarke+Eyebrow kaschieren das. — WAS ZUERST: (1) echte Auth-Entscheidung (CF Access davor), sonst bleibt Governance Fassade — Fundament. (2) State-Naht schließen (Server als Wahrheit ODER sauber lokal-mit-Sync, nicht Halb-Halb). (3) Editor-Eingang entrümpeln: für Editoren konsequent nur „Meine Representations" + die vier Werkzeuge, Kosmologie wegblenden (Visibility-Registry konsequenter nutzen). Claude-Empfehlung als Quick-Win: #3 (sofort sichtbarer Nutzen, keine Auth-Infrastruktur nötig). Cluster-Automatisierung + echte Ausgliederung wichtig, aber nachgelagert.',
    related_panel: 'workspace',
    date: '2026-06-09',
  },

  // ── Welt um Thresholds + Welt der Rollen (2026-06-08) ───────────────────────

  {
    id: 'ann_107',
    category: 'invariant',
    label: 'THRESHOLDS — die Welt um die Farb-/Default-Kaskade',
    content: 'THRESHOLDS — die Welt um die Farb-/Default-Kaskade. KASKADE (5 Säulen, links→rechts): Rep-Editor-Rep · Reg-Editor-Reg · Representation · Region · Global. Zwei STRÄNGE mit Wurzel Global: REP-STRANG (wird AUSGELIEFERT) = rep-editor-rep ← representation ← global; REG-STRANG (nur RICHTSCHNUR/Anzeige, NICHT ausgeliefert) = reg-editor-reg ← region ← global. Jede Ebene ERBT die darüber, solange sie nicht selbst gesetzt ist (customized); „Global" ist nur Saatwert (einmalig von Region geseedet). „↺ auf Default" kopiert den Eltern-Wert. KEINE Kopplung mehr — der Resolver macht die Vererbung zur Lesezeit. RESOLVER effectiveRepColour(slug) = rep-editor-rep → representation → global → Region(Fallback), der erste GESETZTE gewinnt. — WO DIE FARBE HINREIST: in ORIGIN (origin_bundle_v1.colour), STATISCH, via Publish; NICHT im Anthem (der trägt nur loads[] = normalisierte Last je Segment; das Gerät rechnet die Farbe LOKAL/edge mit colorize aus Origin-Settings + Anthem-Last). Live-Farb-Justage-am-Gerät-via-Anthem = bewusst NICHT gebaut. — VERSIONIERUNG: die Farbe steckt im Bundle und ist an die REP-/Bundle-Version gebunden. Sie löst NICHTS selbst aus — sie WARTET auf den nächsten Publish und reist dann unter der dann gültigen Rep-Version mit. — ZWEI WERKSTÄTTEN (nicht verwechseln): Thresholds = Zutat „Farbe" editieren (Entwurf, lokal gespeichert); PATHWORKS HUB = die Representation komponieren + VERSIONIEREN + AUSSPIELEN (fängt die Farbe beim Publish ein). STOLPERFALLE: Re-Publish OHNE Versions-Bump überschreibt still dieselbe Versionsnummer mit neuer Farbe → darum gehört Versionieren an EINE Stelle (Pathworks Hub). — KONSUMENTEN des Resolvers: buildOriginBundle (Ausspielen) · ScimMap (Editor-Vorschau, refresht bei jeder Farb-Änderung) · ShellNewMonitor. — OFFEN/zurückgestellt: Farb-Ansicht + Versions-Diff (neu vs. vorherige Version) im Publishing-Monitor (V03); Säulen/Rollen-Muster auf Katalog/Drawer übertragen; per-Rep-Keying (heute regionSlug, MVP = 1 Rep/Region). Siehe docs/thresholds_umbauplan.md.',
    related_panel: 'P01',
    date: '2026-06-08',
  },
  {
    id: 'ann_108',
    category: 'invariant',
    label: 'ROLLEN — die Welt der Rollen (Diode · Sicht/Wirkung · Editoren)',
    content: 'ROLLEN — die Welt der Rollen (Stand 2026-06-08). FÜNF ROLLEN: SCIM-Operator (grün) · Data-Analyst (blau) · Reg-Editor (lila) · Rep-Editor (orange) · regio_editor = KOMBINIERTER Editor-Modus (NUR Operator-Vorschau, Split-Diode halb lila/halb orange, sieht beide Editor-Säulen). — ZWEI ACHSEN, ENTKOPPELT: (A) SICHT = activeMode/Tab = was du SIEHST (Sicht-Maske je Panel). (B) WIRKUNG = das ECHTE Login (mode.real): live NUR, wenn das echte Login den Tab besitzt UND es nicht Review ist; sonst SANDBOX. → tabLive = (real === activeMode) && activeMode !== analyst. — DREI Element-Zustände: live (interaktiv + speichert) · sandbox (bedienbar, aber FOLGENLOS) · dimmed (abgedimmt + tot = „technischer Ursprung"). — DIODE (Footer) = deine Rolle/dein Zugriff. Ein TAB-Klick schaltet nur die ANSICHT (activeMode), NICHT die Diode — die Diode bewegt sich NUR per Footer-Cycle (eine Stufe abwärts, am Ende zurück). KASKADE der Vorschau: ROLE_ORDER = [operator, analyst, regio_editor], nur ABWÄRTS. Operator sieht 3 Modus-Tabs (Operations/Review/SCIM-Kartography), Analyst 2 (Review + Kartography), echte Editoren KEINE Tabs (terminal). — „ECHTES LOGIN ≠ FOOTER-UMSCHALTEN": Footer-Vorschau auf Editor = nur SICHT (Sandbox, nicht bedienbar); ein echtes Reg-/Rep-Editor-LOGIN = dieselbe Sicht, aber LIVE. Das fällt aus Achse B (real==Tab) heraus — kein Sondermechanismus. — NAVIGATOR: für ALLE Editor-Rollen reduziert auf NUR die Kartography-Drehscheibe (dunkel, an Tetra-Höhe). Tönung: Operator dunkel, Analyst amber, Editoren dunkel. REVIEW = volle Operator-Ansicht, aber IMMER Sandbox (hat keinen eigenen Operator-Tab). isEditorRole() = regio_editor|reg_editor|rep_editor. — ANWENDUNG (Thresholds als Vorlage): EINE Komponente, pro Tab über (Sicht-Maske + Effekt-Gate + dimmed) konfiguriert. Reg-Editor sieht nur die Region-Säule live (+ Operator-Default als Ref), Rep-Editor nur Representation, regio_editor beide Editor-Säulen, operator/analyst alle 5 (Editor-Säulen dimmed). Master = Operator-Ansicht; Editor-Säulen dort abgedimmte Ursprungs-Geister; statisch im Code, KEINE Operator-Sichtbarkeits-Toggles. — LOGINS: Namen dietmar(operator)/michael moser(analyst)/reg editor/rep editor; Code VITE_CODE_* oder Recovery „full visibility" (immer gültig). — Der dynamische Ausbau (Rollen anlegbar, server-Code, Logs) = ACCESS ann_105, kommt später.',
    related_panel: 'workspace',
    date: '2026-06-08',
  },
  {
    id: 'ann_109',
    category: 'next_intent',
    label: 'COMMIT-WORKFLOW — Speichern · Senden zur Review · Committ (+ Auto-Committ)',
    content: 'COMMIT-WORKFLOW (Stand 2026-06-08, Schale gebaut). DREI STUFEN statt zwei: (1) SPEICHERN = Entwurf, Auto-Save des Overlays (localStorage), Editor WIE Operator, folgenlos fürs System. (2) SENDEN ZUR REVIEW = NUR der Editor: seine gespeicherte Arbeit geht an den Operator (Pathworks Hub) — zur PRÜFUNG, CLUSTERBILDUNG und Weiterausarbeitung. Der Editor committet NIE selbst und bildet KEINE Cluster. (3) COMMITT = NUR der Operator friert in die Rep-VERSION ein (heute = „⬇ Committ"/Plan exportieren → commitToRepo auf main). — REIFE-SCHALTER »Auto-Committ« (je Rep, im Katalog-Kopf, Operator-only): neue Representation → anfangs läuft ALLES über den Operator (manueller Review); ist die Rep eingespielt, legt der Operator Auto-Committ um → Editor-Sends übernehmen automatisch, weitere Pflege OHNE System-Committ je Edit. Clusterbildung soll später AUTOMATISIERT ablaufen → Review-Last schrumpft. — LEBENSZYKLUS: neue Rep = manuell/Operator → Auto-Committ an → Editoren pflegen autonom. — KLASSISCHER REDAKTIONS-FLOW (Entwurf → einreichen → prüfen/freigeben → veröffentlichen) mit Vertrauens-Schnellspur. Passt exakt auf die Rollen-Maske (ann_108): Editor darf nicht committen + nicht clusterbilden; beides macht der Operator beim Review. — HEUTE SCHALE (CatalogTab): „Senden" setzt lokal das Flag scim_catalog_review_pending_<rep> → Operator sieht Badge „● Review ausstehend"; Auto-Committ = Flag scim_catalog_autocommit_<rep>. Cluster-Subkategorie (Ghost-Heimat) ist für Editoren ganz ausgeblendet (Cluster nur lesbar via Cluster-Sort). — CROSS-USER-TRANSPORT GEBAUT (2026-06-08, „Phase 3"): die server-seitige Review-QUEUE je Rep steht — Worker /api/pathworks/submit · /submissions · /withdraw (R2 submissions/<uuid>.json), Client src/runtime/pathworksApi.ts (submitToReview/fetchSubmissions/withdrawSubmission, Submission-Typ), Operator-Ansicht SubmissionsQueue.tsx im Operator-Baum. Fluss: Editor (Gerät A) „Senden zur Review" → Server → Operator (Gerät B) sieht die Einreichung + committet (commitDraftToRepo mit Provenienz createdBy=Einreicher/committedBy=Operator). Damit ist der Editor↔Operator-Transport NICHT mehr 1-Browser-lokal. — NOCH OFFEN (Pathworks Hub): „ansehen" einer Server-Submission im Drawer (Import in lokalen draftStore); Cluster-AUTOMATISIERUNG; echte Rep-Versionskette/Rollback wohnt im Hub (Origin-Versions-Bibliothek V01 steht bereits, siehe ann_111). Dokumentiert auch im pathworks-hub-clipboard (Note WORKFLOW). Farbe reist statisch in Origin mit der Version (ann_107), Anthem nur Last.',
    related_panel: 'catalog',
    date: '2026-06-08',
  },
  {
    id: 'ann_110',
    category: 'next_intent',
    label: 'PATHWORKS HUB — Modell & Versionierung (Logik-Schicht zuerst)',
    content: 'PATHWORKS HUB — Modell & Versionierung (Stand 2026-06-08, LOGIK-SCHICHT gebaut, UI-frei). Code: src/scim/pathworks/ (pathworks.types · lifecycle · visibility · store). Doc: docs/pathworks_hub_model.md. — ZWEI ACHSEN: (1) BAUM Nation→Region→Representation; Rep-Bindung regional (geografisch, Anthem wie gehabt) ODER unbound (Regions-Zugehörigkeit OHNE geografische Bindung = privat/Event; KEIN Anthem in dieser Form, Mesh entsteht aus den User-Geräten). (2) ZUSTAND git-artig local→submitted→committed. — LEBENSZYKLUS: local=Speichern (jeder) · submitted=Senden zur Review (jeder AUSSER Operator) · committed=Version N (NUR Operator, direkt ohne Review). „Ab wann Version?" = beim Operator-Commit; Editor-Sends erzeugen NIE eine Version. — RECHTE-MATRIX (visibility.ts): operator sieht committet (sein Reich)+Einreichungen+eigene Drafts, NICHT fremde un-eingereichte Drafts, committet direkt · regio_editor sieht ALLE Reps seiner Region · rep_editor eigene Reps/Drafts/Kataloge · editor (OHNE Bindung) eigener unbound-Kram · analyst = Operator-Sicht read-only (Sandbox). KEINE Crop-Sperre: nicht-committetes Wegnetz ist reversibel, Editor darf beschneiden (gültig wird es erst durch Operator-Commit). — LEITSATZ „ES GIBT NUR REPRESENTATIONEN": nutzerseitige Einheit+Eingang ist immer die Rep; keine freischwebenden Kataloge/Geometrien. Rep-Draft zuerst (zwingt Region regional|unbound), daraus Katalog/Boundary/Wegnetz/Thresholds/Farbe. Bestandteile gehören IMMER einem Rep (PartDraft.repId nicht-null). Committete Rep = nur lesbar (Karte öffnet Katalog/Drawer als Betrachter der Version). UI-Konsequenz Schicht 2: Katalog/Drawer/Thresholds sind keine freistehenden Panels mehr, sondern Werkzeuge im Kontext einer Representation. — VERSIONIERUNG (lifecycle.ts): Version = unveränderliches Manifest {repId,version,regionId,binding,parts:PartRef[],committedBy,committedAt,note}. Granularität = PART-REFS (catalog/geometry/wegnetz/thresholds/colour als {kind,draftId,contentHash} eingefroren). „Einzelteile in einer Version gibt es nicht mehr frei" = isFrozen; Ändern = neuer Draft (Fork) → neue Version (dafür die Notiz). commitRepresentation rein (now als Param). — PERSISTENZ-NAHT (store.ts): Logik spricht nur mit PathworksStore; Drafts heute localStorage (1 Browser). Der echte CROSS-USER-Pfad Editor↔Operator ist GEBAUT (2026-06-08): Einreichungen reisen über Worker/R2 (Submissions-Queue, pathworksApi/SubmissionsQueue — siehe ann_109), der Operator committet auf einem anderen Gerät. D1/voll-server-Store weiter offen; Interface steht. — EDITOR-BLICK (Schicht 2, später): radikal schmal = scoped Liste „mein Kram" (Name·Art·Zustand-Badge·Speichern/Senden), KEIN Baum; die Nation→Region→Rep-Navigation + Einreichungs-Queue ist die Last des OPERATORS. Review = Sandbox-Sicht des Operators. — OFFEN: Rollen-Mapping Login(reg/rep_editor) ↔ Domain(+editor unbound, regio_editor=Aufsicht) = Governance ann_105; Crop für regio_editor?; unbound-Runtime; Region-Pflicht bei Erstanlage. Defaults: Part-Refs · unbound nur Flag · localStorage+Server-Naht.',
    related_panel: 'workspace',
    date: '2026-06-08',
  },
  {
    id: 'ann_111',
    category: 'adr',
    label: 'AUSLIEFERUNG — Versions-Bibliothek + zeitliche Drossel + zwei Versionsnummern',
    content: 'AUSLIEFERUNG / RELEASE-PIPELINE (Stand 2026-06-08, GEBAUT). Der Auslieferungspfad einer committeten Rep läuft jetzt über EINEN Origin-Pfad (nicht mehr den alten ScimBundle/packages-Pfad). — EINE QUELLE: resolveOriginReference(rep) liefert das Bundle; releaseRep(rep, publishedBy?) → publishOriginBundle → Worker PUT /api/origin/:repId/bundle. Worker-R2-Schlüssel: origin/:repId/bundle.json (AKTIV ausgeliefert) · bundle-meta.json (version/uploadedAt/publishedBy) · versions/v{N}.json (Historie) · versions-index.json ({active, versions[]}). — VERSIONS-BIBLIOTHEK (Mond-Scheibe): V01 = Archiv aller veröffentlichten Origin-Versionen je Rep + welche AKTIV ist + Rollback („v3 aktivieren" → POST /api/origin/:repId/activate). V02 (Region-Detail) und V03 t2 (Active-Monitor) lesen denselben Origin-Pfad — usePackagesApi.ts wurde GELÖSCHT. Liest GET /api/origin/:repId/versions (read-only). — ZWEI VERSIONSNUMMERN (nicht verwechseln): (1) QUELLE = rep.version (steigt beim Commit, Pathworks/Hub) vs. (2) AUSGELIEFERT = die aktive R2-Bundle-Version (fetchOriginMeta.version). Drei Zustände je Rep: UNGELIEFERT (Quelle > zuletzt hochgeladen) · GESTAGED (hochgeladen > aktiv, wartet aufs Fenster) · AKTUELL. — ZEITLICHE DROSSEL (release-policy.json {mode:\'manual\'|\'scheduled\', windowHour:UTC}): bei scheduled STAGT ein PUT nur (active bleibt!), ein Worker-CRON (crons=["0 * * * *"]) aktiviert im Fenster die jüngste gestagete Version (activateLatestStaged) — das Geräte-Erlebnis bleibt stabil, Releases sammeln sich und gehen gebündelt live. ReleaseDrosselPanel (V03 t4) = die Schleuse; Operator-only. — KANONISCHE REP-ID: canonicalRepId(idOrShort) → REPRESENTATIONS.id (z.B. \'rep-lichtenberg\'); diese Id ist überall die Wahrheit (R2-Key origin/:id, QR ?rep=:id, V01/V02/V03). — COMMIT ≠ RELEASE: committen friert die Version ein, ausspielen ist ein SEPARATER Operator-Klick (per-Rep im Baum oder Batch in der Drossel). — PROVENIENZ + GATING: wer ausspielt/aktiviert reist als publishedBy mit (?by=); alles operator-only (siehe ann_105). — ⚠ Worker-Änderungen brauchen `wrangler deploy` (USER). OFFEN/zurückgestellt: Farb-Ansicht + Versions-Diff im Publishing-Monitor (ann_107); Nation-Ebene im Collector/Launcher (ann_106).',
    related_panel: 'V01',
    date: '2026-06-08',
  },

  // ── Plan & Stand (2026-06-04) ───────────────────────────────────────────────

  {
    id: 'ann_106',
    category: 'next_intent',
    label: 'Pathworks Hub (Arbeitstitel) — Workspace-/Representation-Umbau',
    content: 'PATHWORKS HUB (Arbeitstitel) — der nächste große Umbau-/Ausbau: Auslagerung der Representations-Bildung in ein eigenes REGIO-DASHBOARD unter diesenpark.at. — KERN: (1) Representation = versioniertes, ZUSAMMENGESETZTES Artefakt (Boundary ⊕ Wegnetz ⊕ Katalog ⊕ Thresholds/Colour ⊕ Icons); Lebenszyklus Entwurf → committen → Version (v1, v2 … unveränderlich) → transfer; „schluckt die Teile" = friert sie beim Commit in die Version ein. (2) Operationen am Artefakt: kopieren/forken (Entwurf aus Version), Teil HERAUSLÖSEN (Boundary/Wegnetz/Katalog aus einer Version in einen Entwurf ziehen, ändern), zurückführen. (3) VERSIONIERUNG ernst nehmen (bisher stiefmütterlich): unveränderliche Versionen + current-Zeiger (Cache-Buster), Historie, Rollback — das FUNDAMENT (Maschinenraum), muss VOR der Bühne stehen; Soll v<n>/bundle.json + current.json, siehe docs/versionierung.md. (ERSTER TEIL GEBAUT 2026-06-08: Origin-Versions-Bibliothek V01 mit Historie/aktiv/Rollback + zeitlicher Release-Drossel auf dem Origin-Pfad — siehe ann_111.) (4) HUB/DREHSCHEIBE = Haupt-Workspace: Baum Nation → Region → Representation; anlegen/öffnen/kopieren/versionieren + Dispatch in die Bau-Panels (Thresholds P01/P02/P04, Workspace, Drawer, Katalog); Regio-Editoren sehen nur ihren Ast — die sichtbar komplexeste Fläche (Bühne), baut auf (1)-(3). (5) PANEL-AUSGLIEDERUNG dieser Bau-Panels nach Pathworks (diesenpark.at). OFFENE KERNFRAGE: neue App neben SCIM3 vs. Re-Org von SCIM3. (6) Auslieferung UNVERÄNDERT: füttert denselben Bundle-Commit → origin/anthem/shell → diesenpark.com (Cloud-only-Doktrin). — TERMINI (Vorschlag, Bahn-/Wege-Metapher passend zur Marke „Geh deinen Weg"/Pathworks): Hub (engl. von Drehscheibe = Turntable/Hub) · Stränge = Regionen · Reps = Fahrzeuge; Verben anlegen · forken · herauslösen · committen · versionieren · transferieren. — Die GOVERNANCE-SCHICHT (Zugang/Rollen/Visibility/Logs) liegt in ACCESS (ann_105) und kommt DANACH. — STAND: geplant, nichts gebaut; muss mit dem Bestand (flache data/-Dateien) versöhnt werden. ZUERST klären: neue App vs. Re-Org, dann das Versions-/Composition-Modell festklopfen. — ANSCHLUSSPUNKTE (Stand 2026-06-07, GEBAUT — hier dockt Pathworks Hub an): Die Cloud-/Eintritts-Schicht steht (Modell B): Wolke (Navigator, zwischen Mond u. Transmission) → Cloud-Panel mit Tabs Übersicht · Launcher · Globe-Switcher · Collector (recycelt aus R02). Launcher = our-side (sensus-core-runtime/src/launcher), nackte diesenpark.com → Launcher, QR → direkt zur Rep. LEICHTER COLLECTOR live: Launcher probt je Rep GET /api/origin/<rep> → published → Status aktiv/abgedimmt. REGIO-ASSETS: Worker GET/PUT /api/regio-assets/:id (R2) + Editor-CTA (Cloud-Übersicht) + Launcher zieht Kachel-Icons per id (Legacy-Fallback). — HIER SCHLIESST PATHWORKS HUB AN: er baut/versioniert Reps und PUBLIZIERT sie (origin-bundle + regio-asset-icon) → speist den VOLLEN Collector-Index (Nation→Region→Rep, current-Zeiger je Rep) und ersetzt die jetzige STATISCHE Launcher-Liste (REPS in src/launcher/Launcher.tsx). Schnittstelle = die publizierten Fakten in R2; Launcher/Runtime KONSUMIEREN nur, Pathworks Hub LIEFERT den Katalog. Offen daran: Nation-Ebene + Versionskette (current.json, docs/versionierung.md) → Collector.',
    related_panel: 'workspace',
    date: '2026-06-07',
  },
  {
    id: 'ann_105',
    category: 'next_intent',
    label: 'ACCESS — Zugang · Rollen · Visibility · Log-Files (Governance-Schicht)',
    content: 'ACCESS = die Zugangs-/Governance-Schicht (Zugang · Rollen · Visibility · Log-Files). Sie ist die GOVERNANCE-SCHICHT des Pathworks Hub (Annotation ann_106) und kommt NACH dessen Umbau. — (1) ZUGANGS-KONTROLLE: Access-Panel mit Name · Auto-/Wahl-Rolle · Code; heute hartkodierte USERS + Env-Codes (VITE_CODE_*) + immer gültiger Recovery-Code „FULL-VISIBILITY" (UX-Gate, client-seitig). Reif für server-seitige Code-Prüfung im Worker und optional Cloudflare Access (Edge, echte Sperre) davor. — (2) ROLLEN: operator/analyst, künftig DYNAMISCH anlegbar (neue Rollen/Namen); Regio-Editoren scope-begrenzt auf ihren Region-Ast. ERSTER SCHRITT GEBAUT (2026-06-08): Identität von Rolle ENTKOPPELT — USERS trägt jetzt ein ROLLEN-SET (roles[]) statt einer festen Rolle; hat eine Person mehrere Rollen, WÄHLT sie beim Login (und nach Touch ID) eine aus (IntroScreen: chooseRole-Schritt). Bsp.: „michael moser" = [analyst, rep_editor]. Wechsel = Re-Login + andere Rolle wählen (Footer bleibt reine Sicht/Sandbox; „echtes Login = echte Berechtigung" gewahrt). Noch client-seitig/hartkodiert = Platzhalter; die echte „eine Person, mehrere Rollen"-Verwaltung gehört server-seitig hierher. — (3) VISIBILITY: die Sperr-Registry im Navigator (was für non-operator gesperrt ist; project_navigator_rollen_lock). — (4) LOG-FILES: geplantes Mehrbenutzer-Drop-down (Schwester von Visibility): wer · wann · wie lange · evtl. Panel-Aktivität (Zeit je Panel). — GEBAUT bereits: Footer-Mehrbenutzer-Presence + Login-Namen + Recovery-Code; „Modul C" = Rollen-Drop-up im Footer (Operator nimmt jede Ansicht-Rolle an, ohne Logout; Presence bleibt echt). — (5) PROVENIENZ + PUBLISH-GATING (GEBAUT 2026-06-08, „ACCESS-light"): die ERSTE echte ACCESS-Wirkung am Auslieferungspfad, OHNE Server-Auth (das UX-Gate/Login-Name genügt; kryptografische Per-User-Auth bleibt hier vertagt). (a) PUBLISH/RELEASE/ACTIVATE = OPERATOR-ONLY: Gate `isOperator = (mode.real ?? role)===\'operator\'` in V01/V02/ReleaseDrosselPanel/TransferView/OperatorRepsHome; Editor/Analyst sehen die Panels READ-ONLY (Information mit ihren Tabs, Buttons inaktiv/aus — „du siehst das nur zur Info"). Der Editor publiziert NICHT mehr. (b) PROVENIENZ-NAMEN: wer hat ausgespielt/aktiviert/committet reist als Name mit. `?by=<name>` fließt durch publishOriginBundle/activateOriginVersion/releaseRep → Worker schreibt bundle-meta.publishedBy + versions[].publishedBy (auch im Cron activateLatestStaged); created_by/committed_by landen beim Commit auf der Rep-Datei, RepView trägt sie. ANZEIGE: V01/V02-Versionszeilen „von X", Operator-Baum committete Karten „erstellt von / committet von". Rückwärtskompatibel (?by= optional). — STAND: Fundament gebaut (Presence, Rollen-Sperre, Visibility, Modul C, Provenienz+Publish-Gating); der dynamische Access-/Log-Ausbau (dynamische Rollen, server-Code, Logs, echte Per-User-Auth) ist geplant und kommt NACH dem Pathworks-Hub-Umbau.',
    date: '2026-06-07',
  },
  {
    id: 'ann_101',
    category: 'next_intent',
    label: 'Fertigstellungsplan + Studio-Test-Stand',
    content: 'Ziel: (1) alles AUSSER Shell-Studio fertigbauen · (2) einen Test-Stand/Workflow finden, der das Studio bauen lässt · (3) das Studio bauen. REFRAME: der Test-Stand kommt ZUERST — er ist die Werkbank und hängt von (1) nicht ab. Test-Stand = zwei Switcher Origin/Anthem im Studio: Origin an → buildOriginPackage(rep) (echte Geometrie/POIs/asset-set, Container-Schlüssel) · Anthem an → produceAnthem / simSegmentLoads (Last-Array). Damit läuft jede Funktion mit realen Daten → man sieht, ob sie funktioniert (besser als iframe oder der aufgegebene Inspector). WO die Drähte hingehen: Origin = buildOriginPackage (per-Rep, tief) · Anthem = produceAnthem — NICHT der Collector. Offene Posten vor dem Studio: (B) Funktionen poi-select · via · guidance · comfort+Dauer (route-solver/reroute existiert, ungetestet); (C) Publishing/Edge: collector-Aggregator · launcher · lade-treiber · globe-switcher-Persistenz; (D) BAK Stufe 2+3 · Reviewer-Turbo-Slider · Live-App diesenpark.com. Werkbank-Voraussetzungen (Origin/Anthem-Taps) sind bereits erfüllt.',
    related_panel: 'P07',
    date: '2026-06-04',
  },
  {
    id: 'ann_102',
    category: 'vocabulary',
    label: 'Collector-Path (Rolle, scharf)',
    content: 'Der Cross-Rep-Fan-in auf dem PUBLISHING-Layer (P11). Sammelt NUR die Verzeichnis-Labels je publizierter Rep (Nation/Region/Name/Icon + Bundle-Zeiger) und reiht sie zum Baum Nation→Region→Rep. Er HOLT KEINE Pakete — das Bundle lädt später der Lade-Kaskade-Treiber, nur für die EINE gewählte Rep (Speisekarte vs. Kochen). Er ERFINDET nichts: Projektion der schon publizierten Fakten (Pakete + per-Rep-Geometrie nation/region) in die Form, die der LAUNCHER für seine Kacheln braucht. Abgrenzung zum Origin-Capsuler (P09): Capsuler = je Rep, TIEF, produziert die Tatsache (inkl. Zugehörigkeit); Collector = über alle Reps, FLACH, reiht nur die Labels. Nicht redundant — der Launcher kann vor der Rep-Auswahl nicht N Capsuler laufen lassen, er braucht den dünnen Index. NICHT die Datenquelle des Studio-Test-Stands (dafür Capsuler + Anthem). Stand: NICHT verdrahtet (Collector-Tab = nur Doku).',
    related_panel: 'P11',
    date: '2026-06-04',
  },
  {
    id: 'ann_103',
    category: 'invariant',
    label: 'SHELL-Paket vs. shell-kit (einzige Quelle der Wahrheit)',
    content: 'GESETZ: Das SHELL-PAKET kommt AUSSCHLIESSLICH aus shell-kit — shell-kit ist die EINZIGE Quelle der Wahrheit für den Shell-Teil. Struktur: shell-kit/app/ = die per-Rep-Shell, die ins Paket reist (Render-Kern, colorize, BCK/BAK, ComfortSliders, intro/reveal, guidance, drossler …) = „das Shell-Paket"; shell-kit/launcher/ = our-side-Flächen (Launcher/Kacheln „powered by diesenpark.com"), laufen auf unserer Seite und reisen NICHT per Rep mit. — (1) „Shell-Paket" = generischer CODE-Teil, NICHT die volle Auslieferung: Origin (per-Rep-Daten: Boundary/Netz/POIs/Icons) und Anthem (Live-Last) sind EIGENE Quellen, nicht aus shell-kit. Volle Auslieferung ans Gerät = Shell ⊕ Origin ⊕ Anthem; shell-kit ist alleinige Quelle nur des Shell-Teils (zwei Takte: Code vs. Daten). — (2) Identität wird GESTEMPELT, liegt nicht in shell-kit: shell-kit ist generisch/identitätsfrei; Rep-Icon/Boundary/Name kommen aus Origin und werden beim Publishing aufgestempelt. — (3) shell-kit ⊇ was per Rep ausgespielt wird: „Alles im Shell-Paket kommt aus shell-kit" ✓ (aus shell-kit/app/); „Alles in shell-kit reist in jedem Paket mit" ✗ — das per-Rep-Paket ist eine Teilmenge (app/), Launcher & Co. (launcher/) bleiben unsere Seite. — Rollen: Shell-Studio = Schaufenster/Prüfstand (Ansicht), shell-kit = Substanz (Quelle); das Studio rendert aus shell-kit → was geprüft wird, IST was ausgespielt wird. Stand: shell-kit noch nicht aufgestellt (geteilte, git-getaggte Bibliothek; Repo-Lift offen). Siehe docs/wege_und_begriffe.md.',
    related_panel: 'P07',
    date: '2026-06-05',
  },
  {
    id: 'ann_104',
    category: 'adr',
    label: 'Container-Kette (Bezug + wer wacht über den Transport)',
    content: 'Die Container-Mechanik gehört zur SHELL, wird aber NICHT über shell-studio GEBILDET — dort nur „beäugt". Kette in 4 Gliedern: (1) MECHANIK (generisch, Shell): GEOMETRIES (Formen) + buildContainerSvg/buildComposite/mergeOverlapping (Render-Kern shellRenderCore.ts, Ziel shell-kit/app/), identitätsfrei. (2) KLASSIFIKATION (Origin/Capsuler, P09): containerOf(subcategory) → {geometry_id,color} je POI, angeheftet als p.container ans origin-poi-set (originPackage.ts). Der „Baum" = Bucket → Subcategory → Geometrie+Farbe (CONTAINER_SYSTEM); der Capsuler ordnet jeden POI ein und legt das ERGEBNIS (nicht die Tabelle) ans poi-set. (3) TRANSPORT: origin-poi-set reist im Origin-PAKET (Daten, nicht Shell) → R2/Worker → Runtime. (4) HONORIEREN (Runtime-Render, Shell): nimmt je POI {geometry_id,color,icon}, schlägt geometry_id in den Shell-GEOMETRIES nach, rendert Container+Icon (+Cluster via mergeOverlapping). — WÄCHTER (Code vs. Daten): Mechanik (Code) — Quelle shell-kit, Linse shell-run/shell-studio (container-Block); Daten/Transport — Capsuler (P09) klassifiziert+legt ans poi-set, Publishing (P11) schnürt, Runtime honoriert. KERNSATZ: Container klassifizieren = Origin · Container-Mechanik = Shell (shell-kit) · beäugen = shell-studio · honorieren = Runtime (spiegelt die Icon-Regel klassifizieren=Origin/honorieren=Shell). — STAND: Mechanik gebaut (Render-Kern, editor-seitig genutzt) · Klassifikation gebaut (Capsuler hängt container ans poi-set) · OFFEN: Transport→Runtime-Honorieren (Runtime rendert POIs noch als schlichte Marker, ohne Container-Composite; nutzt Mocks/altes Paket). VOLL: docs/wege_und_begriffe.md §Container-Kette.',
    related_panel: 'P09',
    date: '2026-06-05',
  },

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

User-Task: Recherche der Lichtenberger POIs (Coords, Subkategorisierung, Cluster). Dev liefert ein Skeleton im Format von gruenberg_pois_plan.md, User fuellt Details. Anschliessend Eintrag im Region-Switcher der Ziel-App (folgt in Phase 3). Diese Phase blockiert NICHTS - kann parallel zu allen anderen laufen, Resultat fliesst ein sobald bereit.

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

Codebasis liegt unter ~/SCIM3ClaudeMax/scim_source. Deploy bei jedem Push auf main automatisch (ann_039). Plan-md fuer Gruenberg in data/gruenberg_pois_plan.md (6-spaltig nach MVP-Abschluss). Icon-Bibliothek in data/icons (26 Dateien, Dual-Naming-Konvention). Glyphs (Ziffern + Einheiten + Sterne + Operatoren + Frame) in data/glyphs.`,
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

  - Wireframe-Strokes in der Farbfamilie des oberen Tetraeders
    (#2d4a6a, strokeWidth 0.8). Faces ohne Fill — das Gewicht haengt
    am Stroke, passend zum "Substrat ist noch nicht ausgeformt".
  - Drei 2D-REGIONEN (statt 3D-Faces) sind klickbar im Lock-Zustand.
    Hintergrund: das Wireframe schliesst beim Lock drei sichtbare
    Regionen ein (Upper, Lower-Left, Lower-Right). Die dem Operator
    sichtbaren Regionen bleiben ueber alle drei Lock-Winkel an
    derselben 2D-Position; nur ihre 3D-Face-Zuordnung rotiert mit.
    Wir mappen daher per POSITION, nicht per 3D-Face-Index:
        Upper-Region        ->  Sektion "Versionen"
        Lower-Left-Region   ->  Sektion "Package Pipeline"
        Lower-Right-Region  ->  Sektion "Runtime Builder"
  - Open-Section-Feedback: die zugehoerige REGION wird translucent
    blau eingefaerbt (rgba(99, 179, 237, 0.28)) mit Pulse-Klasse.
    Sichtbar nur im Lock-Zustand — waehrend der Rotation ist das
    Wireframe neutral (Wahrheits-Quelle fuer offene Sektionen ist
    dann der Listenteil unten).
  - Mehrere offene Regionen gleichzeitig moeglich (entspricht
    mehreren manuell aufgeklappten Sektionen im Listenteil).

Klick-Mechanik (Hover-Bremse + Lock)
-------------------------------------

Direkt-Klick auf eine rotierende Face waere muehsam (bewegliches
Ziel, fill="none" liesse Clicks ausserdem durch). Stattdessen:

  1. Hover auf den Tetraeder -> Bremse setzt ein.
     Rotation interpoliert mit Ease-Out (700 ms) auf den naechsten
     Voll-Frontal-Winkel der naechstliegenden Face. Dort bleibt sie
     stehen, solange Hover anhaelt.
  2. Locked Face (im Voll-Frontal) ist die einzig klickbare Face.
     cursor: pointer, pointer-events: all. Andere Faces: inert.
  3. Klick auf die locked Face toggelt ihre Sektion auf/zu (mehrfach
     klicken oeffnet und schliesst nacheinander).
  4. Hover verlassen -> Rotation resumiert SANFT. Statt abrupter
     Geschwindigkeits-Rueckkehr auf Basis-Tempo waechst die Speed
     kubisch (Ease-In) ueber 2200 ms von 0 zurueck auf 18 deg/s —
     der Tetraeder beschleunigt nicht, er nimmt nur langsam wieder
     Fahrt auf. Damit gibt es keine spuerbare Beschleunigung,
     allein die Deceleration bei Hover bleibt als aktive Geste.

Einschraenkung: ueber den Tetraeder kann pro Hover-Lock genau eine
Sektion getoggelt werden. Mehrere Sektionen gleichzeitig oeffnen geht
nur ueber den Listenteil (Header-Klick). Das ist beabsichtigt — die
Tetraeder-Mechanik ist Fokus, nicht Bulk-Manipulation.

Voll-Frontal-Winkel pro Face (in Grad, gegen die vertikale Drehachse):
  Face 0:  30 deg
  Face 1: 270 deg
  Face 2: 150 deg`,
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
  Fill           Solid #ffffff. Gradient-Experimente (Block-Gradient
                 in der Slice-Flaeche; fette Naht-Stroke mit
                 vertikalem Fade) wurden ausprobiert und wieder
                 verworfen — "ein stoerriges Firmament". Die Mirror-
                 Reflex-Qualitaet bleibt allein durch die zwei
                 vorhandenen Gesten getragen: Geste 2 (Blitz bei
                 Layer-Toggle) als diskreter Reflex, Geste 3 (Layer-
                 Monitor-Sequenz) als kontinuierlicher Reflex.
                 Ein Spiegel braucht keine zusaetzliche Animation
                 auf sich selbst — alles, was er ausdrueckt, kommt
                 aus dem, was er reflektiert.

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

  {
    id: 'ann_069',
    category: 'business_context',
    label: 'HISTORISCHE URFASSUNG — Manual (vor Usage-Manual-Umbau)',
    content: `==============================================================================
HARTE MARKIERUNG: HISTORISCHE URFASSUNG
==============================================================================

Die Urfassung des Manuals (geoeffnet via Reader-Glyph im Navigator) war
bis zum 2026-05-28 ein direkter pre-formatierter Render der Datei

  docs/represent_build.md

(401 Zeilen, Stand 2026-05-27, Titel "Represent Build — Architektur der
Operator-Werkbank"). Inhalt: ausfuehrliche Doku der Tetraeder-Kosmologie,
Mond/Hex/Atem-Bilder, Manual+Reader-Konzeption, Lifecycle einer R,
Sicheln als Beobachtungsfenster, Architektur-Regeln, Roadmap. Verfasst
nach dem Architektur-Konsens Operator + KI vom Mai 2026.

Diese ausfuehrliche Doku-Fassung wurde am 2026-05-28 zugunsten eines
verkuerzten "USAGE MANUAL" (Brutalist-Style, Monospace, Befehlston)
abgeloest. Begruendung: das alte Manual fungierte als Erklaer-Text,
die Cosmo-Controls erklaeren sich inzwischen selbst — siehe ann_051
(Klick-Karte) und ann_066 (Gesten). Was im Manual bleiben muss, ist
nur eine knappe Befehlsreferenz plus eine knappe Leistungsschau, kein
narrativer Architektur-Text mehr.

Die Quelldatei docs/represent_build.md selbst bleibt im Repo erhalten
als autoritative Architektur-Doku — nicht als Manual. Wer den
historischen Render lesen will, kann die Datei direkt im Repo
einsehen.

Stand vor Umbau: Modal "Represent Build — Manual" mit Pre-Tag-Render
des markdown-Files, system-ui-Schrift, weisser Hintergrund, einfache
Schliessen-Funktion.

Diese Annotation existiert als Sucheinstieg fuer kuenftige Sitzungen:
"Wo war die Urfassung?" -> hier, mit Verweis auf die Quelldatei.`,
    date: '2026-05-28',
  },

  {
    id: 'ann_072',
    category: 'next_intent',
    label: 'Wanderwegnetz-Filter + Drawer-Panel (Konsolidierte Soll-Spec)',
    content: `Operator-Spec 2026-05-29 spaet: ausfuehrliches Konzept fuer
ein konfigurierbares Wanderwegnetz aus OSM-Daten. Soll-Quelle der
naechsten Session.

Grundidee
=========

Je Gebiet ein Wanderwegnetz aus OSM ableiten. OSM bleibt objektive
Datenbasis — die Entscheidung, welche Elemente fuer dieses Gebiet
als Wanderwegnetz gelten, liegt in der eigenen Gebietskonfiguration.
Kein Eingriff in OSM, keine Re-Klassifikation. Sauberes Ableitungs-
Layer "darueber".

Primaere Wegklassen
===================

Grundsaetzlich aufgenommen:

  highway=track            Forst-/Wirtschaftsweg
  highway=footway          Fussweg
  highway=path             Pfad
  highway=steps            Treppe
  highway=pedestrian       Fussgaengerbereich
  highway=bridleway        Reitweg — nur wenn Fussverkehr erlaubt
                           oder plausibel zulaessig

Konnektor-Klassen
=================

Strassen sind keine Wanderwege, koennen aber als kurze Konnektoren
ins Wegnetz, wenn topologisch sinnvoll. Strasse bleibt in OSM
Strasse, wird im eigenen Wegnetz als Konnektor gefuehrt.

  Nebenstrassen
    OSM: service, residential, living_street, unclassified
    Default: aktiv, max_laenge_meter 80
    Bedingung: verbindet zwei primaere Wegsegmente oder primaer ↔
    Zugangspunkt

  Landstrassen
    OSM: tertiary, secondary, primary
    Default: aktiv, max_laenge_meter 20
    Bedingung: nur kurze Querung / unvermeidbare Verbindung
    Zusatz: Fussverkehr nicht verboten, moeglichst Gehweg/Querung

Ausschluss-Regeln
=================

Abschnitte raus, wenn fuer Fussgaenger nicht nutzbar oder nicht
oeffentlich:

  foot=no
  access=private
  access=no

Pro Region erweiterbar.

Topologie-Gate
==============

Konnektor nur, wenn echte gemeinsame OSM-Knoten zwischen Pfad und
Strasse existieren — keine geometrische Naehe-Heuristik. Pfade
muessen am Strassenstueck wirklich aufsetzen, sonst kein Mit-Nutzen.

  Pfad ---- Node A ==== Strassenabschnitt ==== Node B ---- Pfad

Strasse bleibt OSM-Strasse, A-B-Stueck wird im eigenen Netz als
Konnektor gefuehrt.

Gebietskonfiguration (Format)
=============================

  {
    "gebiet": "lichtenberg",
    "primaere_wege": {
      "track": true,
      "footway": true,
      "path": true,
      "steps": true,
      "pedestrian": true,
      "bridleway": "nur_wenn_foot_erlaubt"
    },
    "konnektoren": {
      "nebenstrasse": { "aktiv": true, "max_laenge_meter": 80 },
      "landstrasse":  { "aktiv": true, "max_laenge_meter": 20 }
    },
    "ausschluesse": {
      "foot_no": true,
      "access_private": true,
      "access_no": true
    },
    "diagnose": {
      "luecken_markieren": true,
      "sackgassen_ausblenden": true,
      "sackgasse_poi_ausnahme_meter": 30,
      "sackgasse_keep_list": []
    }
  }

Persistenz: zuerst localStorage pro Region, dann committed nach
data/regio_paths/<region>.json via Bridge. Worker-Pfad-Whitelist
ergaenzen.

Ableitungs-Pipeline
===================

Reihenfolge der Filter-/Komposer-Schritte:

  1. OSM-Fetch (Overpass) fuer Region-Boundary-bbox
  2. Primaer-Filter (highway in primaere_wege-Whitelist)
  3. Ausschluss-Filter (foot/access)
  4. Konnektor-Filter:
       a) Strasse?
       b) Topologisch zwischen primaeren Segmenten?
       c) Laenge unter Klassen-Schwelle?
       Alle drei ja => Konnektor aufnehmen
  5. Boundary-Crop: Edges ausserhalb fallen, Edges am Schnitt
     splitten am Boundary-Polygon
  6. Graph-Komposition: shared-Coord -> shared Node-ID,
     Union-Find fuer Komponenten
  7. Gap-Detection: mehrere Komponenten => kandidat-Luecken
       Heuristik: zwei Endpunkte verschiedener Komponenten naeher
       als 2 * max_laenge_meter (groesster Konnektor-Wert)
       => Luecken-Marker rot, klickbar fuer Operator-Entscheid
  8. Dead-end-Filter: Leaf-Nodes (degree 1) identifizieren,
       default ausblenden
       Ausnahme: letzte Y m fuehren zu POI im Catalog
         (Distanz Knoten ↔ POI <= sackgasse_poi_ausnahme_meter)
       Ausnahme: Knoten in sackgasse_keep_list
  9. Heatmap-Ready-Output:
       { nodes: [{id, coord}], edges: [{id, from, to, geom, source: 'primary' | 'konnektor:nebenstr' | 'konnektor:landstr'}] }

Drawer-Panel (heute Geometry-Editor) wird zu "Drawer"
=====================================================

Konsolidierung: Geometry-Editor wird umbenannt + erweitert.

Zwei Tabs:
  Boundary — heutige Funktion 1:1 (Polygon zeichnen, exportieren,
             commit via Bridge)
  Path     — neuer Tab, gleiche Leaflet-Sicht, anderes Werkzeug-Set

Beide teilen das grosse Leaflet-Canvas — Maps-Init und View-State
sind shared, nur die aktiven Layer / Werkzeuge wechseln.

Path-Tab-Layout:

  +-----------+-----------------------------+
  | Filter-   |                             |
  | Menue     |    Leaflet-Canvas           |
  | (links,   |                             |
  | ausklapp- |                             |
  | bar via   |                             |
  | schmalem  |                             |
  | Rand)     |                             |
  +-----------+-----------------------------+

Filter-Menue-Sektionen (alle ausklappbar):

  - Region (vorgeladen aus Inspector)
  - Primaere Wegklassen (Checkboxen)
  - Konnektoren
      Nebenstrasse: on/off + Slider max_m
      Landstrasse:  on/off + Slider max_m
  - Ausschluesse (Checkboxen)
  - Diagnose
      Luecken markieren (on/off)
      Sackgassen ausblenden (on/off)
      POI-Ausnahme-Distanz (Slider)
  - Aktionen
      [Anwenden] — Pipeline neu rechnen, Karte aktualisieren
      [Commit zu Repo] — Config nach data/regio_paths/<region>.json

Visualisierung im Path-Tab
==========================

  Primaere Wege          gruen-blau, weight 2, opacity 0.85
  Konnektor-Nebenstrasse blau, weight 2, opacity 0.85, dashed
  Konnektor-Landstrasse  rot-orange, weight 2, opacity 0.85, dashed
  Boundary               heller Outline (wie heute)
  Luecken-Marker         rote Kreise an verdaechtigen Endpunkten,
                         klickbar fuer Erlauben/Verweigern
  Sackgassen             gelb gestrichelt wenn aktiv im Output,
                         grau wenn ausgeblendet
  POIs                   wie heute, orientierend

Manuelles Zeichnen von Wegen ist NICHT Teil des MVP. Die Pipeline
filtert das Wanderwegnetz aus OSM, der Operator konfiguriert die
Regeln. Wenn jemals noetig fuer Ausreisser-Faelle, kann manuelles
Zeichnen spaeter als eigene Erweiterung dazu (eigener Layer im
Konfig-Format), ist aber kein Teil dieser Spec.

Werkzeuge
=========

  - Haversine inline fuer Edge-Laengen
  - Eigene Union-Find fuer Komponenten-Analyse (~30 Z. Code)
  - Spatial-Index fuer Nearest-Neighbor (zwei Endpunkte-Naehe,
    POI ↔ Knoten) — z. B. simples Grid-Hashing oder kdbush
  - Boundary-Crop: Polygon-LineString-Intersection — Turf.js
    bietet booleanIntersects, lineSplit; eigener Code waere
    aufwendig. Turf.js-Sub-Modul (turf/line-split) als Dependency
    rechtfertigt sich hier.

Turf.js-Entscheid: erst beim Bauen pragmatisch; Tendenz zu Sub-Modul
fuer Crop, Rest selbst.

Build-Phasen
============

  Phase 1  Drawer-Panel-Shell (Boundary/Path-Tabs mit shared Leaflet,
           Tab-Wechsel ohne Karten-Reinit)
  Phase 2  Path-Tab Filter-Menue: alle Sektionen ohne Wirkung,
           nur UI + localStorage-Persistenz
  Phase 3  Filter-Engine: OSM-Filter (Primaer + Ausschluss) +
           Visualisierung
  Phase 4  Konnektor-Filter (Klassen + Laengen-Schwelle + Topologie-
           Gate)
  Phase 5  Graph-Composer + Boundary-Crop
  Phase 6  Gap-Detection + Luecken-Marker
  Phase 7  Dead-end-Filter + POI-Ausnahme + Keep-List
  Phase 8  Heatmap-Ready-Output (nodes/edges-Struktur)
  Phase 9  Commit-Bridge fuer data/regio_paths/<region>.json
           (Worker-Whitelist erweitern: data/regio_paths/[a-z0-9_-]+\\.json)
  Phase 10 P02-Migration (Highway-Typ-Filter raus aus P02, ist
           jetzt im Drawer/Path-Tab)

Phasen 1-10 ist Spannweite Drawer+Wegnetz-MVP. Geschaetzt ~10-12 h,
verteilbar auf 3-4 Sessions.

POI-Anker als anschliessende Phase 11
=====================================

Sobald Heatmap-Ready-Output steht (Phase 8), faellt POI-Anker
trivial: pro POI nearest Node im Graph, Distanz speichern,
Plausibilitaets-Schwelle (z. B. ≤ 30 m gruen, > 30 m orange).
Visualisierung als duenne Linie POI ↔ Anker.

Operator hatte am selben Abend angemerkt: "Anker-Code schreiben".
Damit ist auch das adressiert.

Stopp-Linien (UI / Pixel / Wording)
====================================

Beim Bauen mit Operator abstimmen:
  - Tabs vs. Modus-Switch im Drawer (eher Tabs, schlicht)
  - Filter-Menue: kollabierbares Side-Panel vs. modaler Dialog
  - Schmaler Rand-Streifen zum Ein-/Ausklappen: Pixel-Detail
  - Exakte Farbpalette der Wegklassen (Skizze oben, fein abstimmen)
  - Wording "Konnektor" / "Nebenstrasse" / "Landstrasse" — sind die
    Begriffe operator-tauglich, oder besser deutsch-laien-verstaendlich?
  - Default-Schwellen 80 / 20 m: am Lichtenberg pruefen
  - Sackgassen-Visualisierung: gelb ist Vorschlag, evt. anders

Aufraeumen vor dem Bauen
========================

Vor Phase 1 lohnt sich eine Aufraeum-Runde:
  - HANDOVER.md auf aktuellen Stand
  - panelRegistry: Geometry-Editor ggf. schon als "Drawer"
    umbenennen
  - ann_067 Master-Index aktualisieren (Drawer + Wegnetz als
    Stufe-1-relevante Operator-Werkzeuge?)
  - alte Annotationen, die nicht mehr Soll-Quelle sind, als
    historisch markieren`,
    date: '2026-05-29',
  },
  {
    id: 'ann_073',
    category: 'adr',
    label: 'Deploy: Direct-Upload via GH Actions — kein CF-Git-Build, kein Race',
    content: `Verifiziert im Cloudflare-Dashboard (2026-05-29).

scim3-operator ist ein DIRECT-UPLOAD-Pages-Projekt — KEINE Git-Integration.
In Settings/General fehlt deshalb der "Builds & deployments"-Abschnitt;
unter Deployments steht pro Commit GENAU EIN Production-Deploy.

→ Es gibt genau EINEN Build-Pfad: GitHub Actions
  (.github/workflows/deploy.yml, Node 24, VITE_* aus GH-Secrets/Variables)
  baut bei Push nach main und schiebt dist/ per
  "wrangler pages deploy --project-name=scim3-operator". ~60 s bis live.

Die alte HANDOVER-Behauptung eines "zweiten, leise kaputten CF-Git-Builds
mit Deploy-Race" war FALSCH und wurde im Dashboard widerlegt. Nichts
abzuschalten.

White Screen direkt nach Deploy = Stale-Asset/Edge-Propagation (neue
gehashte Chunks + alte gecachte index.html/Service-Worker), KEIN Code-Bug.
Fix: 60–90 s warten + Cmd-Shift-R.

Worker (R2 diesenpark-packages / D1 / Pakete) ist getrennt:
"cd worker && npx wrangler deploy". git push deployt den Worker NICHT.

Ehrliche Quelle ist seit 2026-05-29 DEPLOY.md im Repo.

— Verbesserungsvorschläge (offen) —
1. White Screen dauerhaft entschärfen: index.html mit
   Cache-Control: no-cache ausliefern (gehashte Assets bleiben langlebig
   cachebar), damit der Browser nie eine alte index.html mit toten
   Chunk-Referenzen hält. Dann entfällt das manuelle Cmd-Shift-R.
2. Falls ein Service-Worker aktiv ist: skipWaiting/clientsClaim +
   Network-First für die Navigation, sonst serviert der SW alte Shells.
3. VITE_UPLOAD_API_KEY rotieren — lag in einem Screenshot im Klartext
   sichtbar vor. Neuen Key in GH-Secret + Worker-Secret nachziehen.`,
    date: '2026-05-29',
  },
  {
    id: 'ann_074',
    category: 'invariant',
    label: 'Geschlossenes Netz — jeder Endknoten ist ein POI (Soll-Quelle Phase 5/7)',
    related_panel: 'geometry_editor',
    content: `Konsolidierte System-Erklärung 2026-05-29. Soll-Quelle für die
Wegnetz-Phasen 5 (Crop) und 7 (Endknoten-Klassifikation).

LEITPRINZIP: GESCHLOSSENES NETZ
Unser Netz ist im Normalfall geschlossen — das unterscheidet es von anderen
Routing-Systemen. Daraus folgt: JEDER Endknoten (degree 1) ist ein POI.
Kein unbegründetes loses Ende.

JEDER POI ERZEUGT EINEN STICH
Ein POI liegt nie exakt auf einem Pfad → das System legt für jeden POI eine
Sackgasse (Connector) an. Der Anker ist damit nicht QA, sondern der
Baumechanismus selbst ("Anker zuerst", vor den Konnektoren).

  Snap-Schwelle (Gelände-Schieber 0,5–6 m, Default ~2 m):
    Abstand POI↔Pfad < Schwelle  → POI gilt als AUF dem Pfad, kein Stich,
                                    nur Knoten.
    Abstand POI↔Pfad ≥ Schwelle  → echter connected-POI-Stich.
  Gelände-abhängig: im Steilgelände kann ein gerader 2-m-Connector über eine
  Absturzkante laufen — kleine Toleranz; im Flachen größere zulässig.

ZWEI ENTSTEHUNGS-MECHANISMEN (jeder Endknoten = POI)
  1. connected-POI — Normalfall Ziel. POI erzeugt von sich aus den Stich auf
     Overpass. Universell (s. o.).
  2. translate-/gate-POI — entsteht durch MASKIERUNG: eine durchgehende
     Verbindung wird am Rand gekappt. Die Maskierung schneidet NICHT am
     willkürlichen Polygon-Schnittpunkt, sondern am nächsten echten OSM-Knoten
     INNEN und AUSSEN → es entstehen zwei Knoten:
       inner-gate-Knoten  — nächster OSM-Knoten innerhalb der Boundary
       outer-gate-Knoten  — nächster OSM-Knoten außerhalb der Boundary
     Weil beide auf realen, stabilen OSM-Knoten sitzen, referenzieren zwei
     Nachbar-Representations dieselben Knoten → deterministische Translation
     statt Fuzzy-Match. Der inner-gate ist der user-facing Eintritts-/
     Austrittspunkt; das Paar (inner/outer) dient dem späteren Representations-
     Verbund. Das ist exakt der frühere "Boundary-Port/amputierte Knoten".

FEHLERREGEL (dritte Sorte)
Eine BEREITS VORHANDENE OSM-Sackgasse, die weder connected- noch gate-POI ist:
  - manuell mit POI versehen, ODER
  - in OSM neutralisieren, ODER
  - das System wirft sie raus.
Kein stilles Behalten.

VERWORFEN
"Umgebende Straße mitnehmen" (Reststück bis Maximallänge fürs Routing) war ein
missglückter Ansatz und ist gestrichen. Ein Boundary-Schnitt ist der Schnitt.

IST-STAND-KORREKTUR
Phase 3 schneidet noch NICHT zu — bbox-Fetch zeigt alles bis es irgendwo endet.
Das Beschneiden auf die Boundary ist Phase 5 (Crop) und erzeugt überhaupt erst
die gate-Knoten — nicht durch Splitten am Polygon, sondern durch Schnitt am
nächsten OSM-Knoten innen/außen (inner-gate + outer-gate).

BEGRIFFLICHE UMBENENNUNG
Der "Dead-End-Filter" (Phase 7) ist in Wahrheit ein ENDKNOTEN-KLASSIFIKATOR /
Netz-Schließer: jeder Leaf → {connected-POI | gate-POI | Fehler→fix/drop}.

GEPARKT
Representationswechselknoten (Verbund zweier Representations am selben Gate) —
eigene Überlegung, hier bewusst nicht ausgeführt.`,
    date: '2026-05-29',
  },
  {
    id: 'ann_075',
    category: 'next_intent',
    label: 'Represent-Build: Workflow (Schritte + System-Soll) & Umbauplan (Session-Konsens 2026-05-29)',
    related_panel: 'geometry_editor',
    content: `Session-Konsens 2026-05-29. Zwei Teile: (1) beschreibender Workflow mit
System-Soll pro Schritt (✓ = leistet das System schon, ☐ = offen), (2) Umbauplan
in technischer Realisierungsreihenfolge mit den Schwierigkeiten.

GRUND DES WORKFLOWS
Der Operator verlor bei den vielen Wegnetz-Auto-Regeln den Faden. Der Workflow
ordnet die Schritte, trennt Zuständigkeiten (Drawer = eine Boundary + ihr
Wegnetz; Workspace = Komposition; Inspector = fertige R als Referenz) und legt
fest, WO committet wird: Catalog committet eigenständig; der Workspace committet
den Representation-Verbund (Boundary + Katalog-Bindung + Wegnetz) atomar.

================ TEIL 1 — WORKFLOW (was wird WO der Reihe nach getan) ============

SCHRITT 1 — BOUNDARY-DRAFT (Drawer · Umriss-Tab)
Operator zeichnet den groben Umriss. Als Vorlage darf eine im Inspector gewählte
fertige R (lila, read-only) eingeblendet werden. Der fertige Draft geht als
Draft-Boundary an den Workspace (dort löschbar oder zurück in den Drawer).
  ✓ Umriss zeichnen/editieren (Geoman) im Umriss-Tab.
  ✓ Draft wird lokal gehalten (scim3_geometry_draft) + „Im Editor öffnen" lädt
    eine committete Boundary aus dem Workspace in den Drawer.
  ☐ Inspector-R als lila read-only Vorlage-Layer im Drawer einblendbar.
  ☐ Draft-Boundary explizit an den Workspace übergeben (Lifecycle Draft↔WS).

SCHRITT 2 — POI-KATALOG (Katalog-Panel)
POIs der Region erfassen/pflegen. Liefert die Platzhalter für das Wegnetz.
  ✓ Katalog-Panel mit POI-Erfassung/Pflege (P01/P02, operator-only).
  ✓ Catalog behält seinen EIGENEN Commit (eigenständig, nicht im WS-Verbund).
  ☐ Katalog-Draft-Platzhalter sauber an den Workspace weiterreichen.

SCHRITT 3 — DRAFT-REPRESENTATION + WEGNETZBILDUNG (Workspace → Drawer · Wegnetz-Tab)
Workspace fügt Draft-Boundary + Referenz zur Draft-Representation und schickt sie
zum Wegnetzbau in den Drawer. Im Wegnetz-Tab: Boundary dimm-/abschaltbar; OSM-
Hintergrund dimm-/abschaltbar; Inspector-R-Boundary einblendbar/dimmbar, deren
read-only Punkte als Snap-Quelle nutzbar. Im Umriss-Tab bleibt die Boundary
korrigierbar.
  ✓ Wegnetz aus Overpass mit POI-Platzhaltern ableiten/filtern (pathEngine).
  ✓ Boundary im Wegnetz-Tab read-only sichtbar (kein Editier-Toolbar, kein Crash).
  ✓ Filter-Menü (Konnektoren, Anschluss-Toleranz, Snap-Schwelle).
  ☐ Dimmer + On/Off für OSM-Tiles.
  ☐ Dimmer + On/Off für die editierbare Boundary.
  ☐ Inspector-R-Boundary als dimm-/abschaltbarer Layer, Punkte als Snap-Quelle.

SCHRITT 4 — NEUE BOUNDARY DARÜBERZEICHNEN & MASKIEREN + COMMIT (Drawer → Workspace)
Im Umriss-Tab eine NEUE Draft-Boundary über das bestehende Netz legen; mit ihr
das Wegnetz maskieren (Crop → gate-Knoten, s. ann_074). On/Off genügt, muss nicht
dimmbar sein. Wird die erste Draft-Umriss-Boundary gelöscht, rückt die zweite in
ihren Slot. Anschließend committet der Workspace den Verbund atomar.
  ✓ Maskierungs-Konzept dokumentiert (gate-Knoten, inner/outer-gate; ann_074).
  ☐ Zweiter Boundary-Slot (Masken-Boundary) zusätzlich zur editierbaren.
  ☐ Crop/Maskierung: Netz an der Masken-Boundary kappen → gate-Knoten erzeugen.
  ☐ Slot-Nachrücken, wenn Slot 1 gelöscht wird.
  ☐ Workspace als atomares Commit-Gate für den Verbund (Boundary+Katalog-Bindung
    +Wegnetz). Drawer-Button wird „Zurück an Workspace" statt eigenem Repo-Commit.

OFFENE GRUNDFRAGE (geklärt)
Alles bleibt uncommittet AUSSER den gefetchten committeten Artefakten (read-only).
Mindestens das Wegnetz MUSS committet werden — das geschieht im Workspace als
atomarer Verbund-Commit. Catalog committet getrennt (Operator-Entscheid).

================ TEIL 2 — UMBAUPLAN (technische Realisierungsreihenfolge) =========

A. LAYER-STEUERLEISTE (Dimmer + On/Off, beide Tabs)
   Gemeinsame Leiste über beide Tabs: je Layer Opacity-Slider + Sichtbarkeits-
   Toggle für (1) OSM-Tiles, (2) editierbare Boundary, (3) Inspector-R-Vorlage.
   Schwierigkeit: State über Tabwechsel/Remount erhalten; Opacity auf TileLayer
   vs. Path-Style sauber anwenden.

B. ZWEI-SLOT-BOUNDARY-MODELL
   Editierbare Boundary von der Masken-Boundary trennen (zwei Slots). Slot-
   Nachrücken bei Löschen. Schwierigkeit: Geoman-Layer-Identität, klare Trennung
   welcher Layer editierbar/maskierend ist, Persistenz beider Drafts.

C. SNAP-QUELLE AUS INSPECTOR-R-BOUNDARY
   Read-only Punkte der eingeblendeten Inspector-R als Snap-Ziele. Schwierigkeit:
   Snap gegen Fremd-Layer in Geoman; Punkte read-only halten.

D. MASKIERUNG / CROP-ENGINE  (SCHWIERIGSTER TEIL)
   Wegnetz an der Masken-Boundary kappen, gate-Knoten an Schnittpunkten erzeugen
   (inner/outer-gate, ann_074). Schwierigkeit: robuste Polygon-Linien-Verschneidung,
   stabile Knoten-IDs, Wiederholbarkeit, Performance bei großen Netzen.

E. DRAFT-LIFECYCLE DRAWER ↔ WORKSPACE
   Draft-Boundary an WS übergeben, dort löschen/zurückschicken; Draft-Representation
   vom WS in den Drawer zum Wegnetzbau. Schwierigkeit: ein konsistentes Draft-Modell
   statt mehrerer localStorage-Schlüssel; Remount-Sicherheit.

F. WORKSPACE = ATOMARES COMMIT-GATE
   WS committet Boundary + Katalog-Bindung + Wegnetz in EINEM Schritt. Drawer-Button
   wird „Zurück an Workspace". Schwierigkeit: Verbund-Schema definieren; Teil-Commits
   verhindern.

G. CATALOG EIGENER COMMIT + AUSSERHALB-POI-SEMANTIK
   Catalog committet getrennt; klären, wie „außerhalb der Boundary" liegende POIs
   behandelt werden. Schwierigkeit: Konsistenz zwischen separat committetem Katalog
   und dem WS-Verbund.

H. KATEGORIE-ABDECKUNG
   Sicherstellen, dass alle POI-Kategorien/Container im Flow getragen werden.
   Schwierigkeit: Vollständigkeit gegen das Plan-Soll (Plan ist Quelle).

QUERSCHNITTS-RISIKEN
  - Geoman global disable* iteriert ALLE Layer und greift auf layer.pm zu →
    programmatisch gezeichnete Polygone (ohne .pm) crashen (war der Weiße-Screen-
    Bug). Nur removeControls + gezielt layer.pm.disable() verwenden.
  - DrawerPanel remountet pro Navigation → jeder Layer-/Draft-State muss das
    überleben.
  - Eine geteilte Karte für beide Tabs: Layer-Sichtbarkeit/Opacity konsistent
    halten.

ZUSTÄNDIGKEITEN (unverändert)
Drawer = eine Boundary + ihr Wegnetz bauen. Workspace = Komposition + atomarer
Verbund-Commit. Inspector = fertige R als Referenz zeigen. Nicht vermischen.`,
    date: '2026-05-29',
  },
  {
    id: 'ann_076',
    category: 'adr',
    label: 'ZWISCHENSTAND — Tiefenschichtung & Workspace-Rolle',
    related_panel: 'workspace',
    content: `ZWISCHENSTAND (2026-05-30) — Validierung der Grundsatzgedanken gegen den realen Code-/Vertragsstand. Erfindet die SCIM nicht neu; ordnet das Gefühlte dem Vorhandenen zu und zieht EINE Konsequenz.

KERNBEFUND — gefühlte Begriffe haben reale Gegenstücke:
  Depth-Thetr            → NavDepthTetraeder (Tiefen-Tetraeder, ann_060); Faces: Package Pipeline / Runtime Builder / Versionen.
  Control Sensus Core    → Sensus-Core-Paket + Vertrag: Panel 9 (Builder) → 10 (lokal) → 11 (Wirkungsprüfung) → 12 (Freigabe).
  Package-Versionierung  → Vertrags-Leitsatz: "sichere, reduzierte und versionierte Übergabe an das Endgerät".
  Cosmo Controls         → Navigator-Oberfläche (real).
  Packages               → vertraglich definierte Sensus-Core-Pakete.
Der benannte Architekturbruch ist real: Tiefen-Tetraeder und Sensus-Core-Kette existieren, aber die Übergabe Depth → Sensus-Core → Cosmo-Controls ist noch nicht durchgezogen.

TRAGENDE WAHRHEITEN (bestätigt):
  - "Im Workspace passiert mehr, als er zeigt" — Commit-Logik/Handoff/Katalog-Bindung hinter Listen.
  - Umriss = semantischer Gatekeeper — pathEngine.anchorPois (in/out-Test), Crop kappt am Umriss.
  - "Workflow-Ergebnis gehört zu einem Package-Zustand, nicht absolut zum Workspace" — Geist des Paketvertrags.
  - Boundary = gemeinsamer Anker/Hitfeld, auf den Katalog und Wegnetz zeigen.

BEGRIFFSHYGIENE: gefühlte Begriffe als Erklärung behalten, im Code bei existierenden Namen bleiben. Vermutungen nicht in Code härten. Colourmesh/Hitfeld/Package-Versionierung sind bisher Vertrag/Absicht (Runtime/BAK, Panel 9–12), nicht laufender Code.

DIE EINE KONSEQUENZ (Workspace-Ausrichtung): Der Workspace ist das Kompositions- und Commit-Gate für Pakete, verankert auf der Boundary. Er ist NICHT die Sichtbarkeits-, Auswahl- oder Versionierungsinstanz — das ist der Versionen-Face/Sensus-Core-Layer. F1/F2/F3 sind damit richtig ausgerichtet; Versionsauswahl/Sichtbarkeits-Toggles gehören NICHT in den Workspace.

GEHÖREN REPRESENTATIONEN IN DEN WORKSPACE? Gespalten: GEBOREN im Workspace (Komposition Boundary + Katalog + Wegnetz → data/representations/); REGIERT nicht vom Workspace (aktiv/sichtbar/historisch/experimentell entscheidet die Versionen-Face/Sensus-Core-Kette). Representationen liegen im Workspace, ihre Sichtbarkeit/Version gehört ihm nicht.

WOZU DIE BOUNDARY (Engine-Regel, Vorform): (1) Anker/Identität — einzige Stelle mit exakten Koordinaten; Katalog & Wegnetz referenzieren per geometry_id (Mitgliedschaft = zeigt auf denselben Kopf). (2) Gatekeeper — trennt POIs innen/außen, kappt Wegnetz (Crop), erzeugt Gates. (3) Hitfeld/Darstellung — Repräsentationsfläche zur Laufzeit (Umriss zeichnen, Refresh, Geofencing).

VERORTUNG MVP-LICHTENBERG: klärt Workspace-Ausrichtung + Vorform der Boundary-Engine-Regeln. Offene Leitfragen (Panel-Inventur, Sensus-Core-Verdrahtung) bleiben für den späteren Bauplan markiert.`,
    date: '2026-05-30',
  },
  {
    id: 'ann_077',
    category: 'next_intent',
    label: 'F7-Bauplan — Drawer-Lifecycle & Verbund-Commit',
    related_panel: 'geometry_editor',
    content: `F7-BAUPLAN NEUFASSUNG (2026-05-30) — Drawer-Zwei-Schichten, Speichern & Workspace-Commit. Volltext: docs/f7_bauplan_drawer_lifecycle.md. Ersetzt die Erstfassung.

PRINZIP: Die finale Boundary entsteht aus dem Netz, nicht umgekehrt. B1/unmaskiertes Netz = OSM-Stufe (roh); B2/maskiertes Netz = unsere Stufe (künftiges Colour-Mesh). Der Commit behält die verfeinerte Stufe und wirft die rohe weg. Der Draft hält den Rohzustand; der Commit friert ein (Backend).

MODELL — ZWEI SCHICHTEN je Draft:
  Arbeit:  B1 (Referenz) + net_unmasked (OSM-roh) → gelb/orange → STIRBT am Commit.
  Final:   B2 (=Maske)   + net_masked (zugeschnitten) → ROT → wird committet.
Farben: gelb = net_unmasked da, kein Katalog; orange = + Katalog; ROT = net_masked existiert → committbar (NUR rot ist im Workspace committbar).

DREI GETRENNTE AKTIONEN:
  Beschneiden-Toggle (Drawer/Wegnetz): an → net_masked erzeugen (Crop von net_unmasked mit B2) + anzeigen; zurück → net_masked löschen, net_unmasked anzeigen. Reversibel, lokal, persistiert nichts.
  Speichern (Drawer): friert den AKTUELLEN Zustand → maskiert gespeichert = rot (beide Netze), sonst gelb/orange. Draft bleibt editierbar.
  Commit (Workspace): nur bei ROT → behält B2 + net_masked + Representation; tötet B1 + net_unmasked. Backend-Crop ist im net_masked bereits enthalten. Überschreibbar.

FARB-ZUSTÄNDE B2 (Start-Styling, am Bildschirm feingetunt, nicht in Worten festgenagelt): aktiv maskiert (am Arbeiten) = dashed-blau (Umriss) / rot-schraffiert (Wegnetz); gespeichert (roter Draft in Ruhe) = solid blau; committet = solid blau (Workspace-Frame). Öffnen eines roten Drafts → aktiv; Speichern → solid blau.

DATEN-MODELL draftStore: Draft { reference(B1), boundary(B2), net_unmasked, net_masked, catalog_id }. Reife-Farbe leitet sich daraus ab.

BAU-SCHRITTE: 1) Fundament draftStore (Daten, null Optik): net → net_unmasked + net_masked; 3-Farben-Logik. 2) Drawer: Beschneiden-Toggle (erzeugt/löscht net_masked), echter Speichern-Button (persistiert Zustand inkl. Netze), redundante Buttons raus. 3) Workspace: Pipeline 3 Farben; Commit nur bei rot → B2 + net_masked + Representation, B1 + net_unmasked fallen weg, Kartenframe rot→blau; alte Übergabe-Karte + F1/F2/F3 + Handoff raus.

WEGFALL: Auto-Speichern → explizites Speichern; alte Übergabe-Karte + Handoff (scim3:represent_handoff); Einzel-F1/F2/F3 → ein Commit; "Ready for Commit"-Morph (Irrweg); destruktiver Crop-Button (Crop ist Backend am Commit).

ZUKUNFTS-BEREIT (nicht jetzt): Löcher/Inseln = Ausschlusszone fürs Netz (GeoJSON innere Ringe, schon darstellbar); mehrere getrennte Boundaries = MultiPolygon (später); Crop mit Löchern = spätere Verfeinerung.`,
    date: '2026-05-30',
  },
  {
    id: 'ann_078',
    category: 'next_intent',
    label: 'Zeichentools-Theorie aus v0.3-Prototyp',
    related_panel: 'geometry_editor',
    content: `ZEICHENTOOLS-THEORIE (2026-05-30) — destilliert aus dem v0.3-Prototyp (/Users/dietmarbroda/open, canvas-basierte Geometry Asset Workbench, NICHT Leaflet/Geoman). Volltext: docs/zeichentools_theorie_aus_v03_prototyp.md. Übernahme der ALGORITHMEN in den bestehenden Leaflet/React-Drawer; Geoman bleibt, dies sind Ergänzungen, kein Ersatz. Stabilität = oberste Regel → kleine Schritte.

1) SNAP — Regel: nächster Kandidat innerhalb Radius gewinnt, sonst Rohpunkt. (a) Snap-zum-Schließen: Punkt näher als MERGE_RADIUS am Start → Ring schließen statt neuer Punkt. (b) Snap-auf-vorhandene-Punkte (Toggle): Kandidaten = Vertices anderer/unlocked Layer + Vorlage (eigene ausgenommen), nächster < SNAP_RADIUS → exakt dessen Koordinate (Borgen/Ausrichten). In Leaflet als Pixel-Distanz (~12px); Prototyp-Werte 0.035/0.045 sind workbench-normiert, nicht übertragbar.

2) PUNKTREDUKTION — Keep-%-Slider (10–100%, 10er). keepEvery=round(100/keep%); behalte Index 0, letzten, jeden keepEvery-ten. Endpunkte immer. KEIN Douglas-Peucker — bewusst simpel/vorhersehbar. Reversibel. = reine Array-Op auf dem Ring.

3) PUNKT/SEGMENT LÖSCHEN — Knoten löschen (Ring öffnet wenn <3) ODER Segment löschen (break_segments, optional stretch = verbundene) = Kante statt Knoten, bricht Ring in offene Pfade. Delete-Modifier + Hover-Ziel zeigt was gelöscht wird. Reversibel. Segment/Break-Konzept = wertvoll fürs spätere Netz (Kanten erstklassig).

4) FADENKREUZ + WORKFLOW — beim Vertex-Ziehen zartes Kreuz (4 Arme, Lücke Mitte, alpha~0.5), Präzisions-Feedback. Klick hängt Punkt an, Ziehen verschiebt + live Snap-zum-Schließen, reiche Hover-Zustände zeigen vorab was passiert, Schließen per Klick-nahe-Start oder explizit.

META (fast wichtigste): Undo-Snapshot pro Operation (Stack); Preview/Save wird NUR bei echter Geometrie-Änderung ungültig (add/move/reduce/delete), NICHT bei Metadaten (Anker). Hält Speichern gültig bei reiner Beiwerk-Änderung — fürs Draft-Modell adoptieren.

ÜBERNAHME-REIHENFOLGE (stabil): 1) Punktreduktion (kleinster/sicherster Gewinn, reine Array-Op). 2) Snap-auf-Vorlage/Nachbarn (Toggle, Pixel-Radius). 3) Fadenkreuz beim Ziehen. 4) Segment/Break → zum Netz-Editor (neu, auf src/scim/graph/).

EINORDNUNG: Prototyp hat KEINEN Netz/Graph-Editor (boundary-zentriert). Netz-Editor ist so oder so neu. Substrat-Wechsel (Canvas statt Leaflet) erwogen, verworfen (zu riskant gegenüber funktionierendem Leaflet-Drawer + Draft/Commit/Budget). Konzepte portieren, nicht Substrat.`,
    date: '2026-05-30',
  },
  {
    id: 'ann_079',
    category: 'next_intent',
    label: 'Drawer-Werkzeugleiste — Spec (Umriss + Wegnetz)',
    related_panel: 'geometry_editor',
    content: `DRAWER-WERKZEUGLEISTE SPEC (2026-05-30). Volltext: docs/drawer_werkzeugleiste_spec.md. Ergänzt ann_078.

KONZEPT: eine Leiste unter der EBENEN-Leiste, tab-gefiltert (Umriss blendet Wegnetz-Tools aus, umgekehrt). Anordnung = Workflow: Maschine → Mensch → Maschine (links auto herstellen · Mitte manuell · rechts auto festziehen).

INTERAKTION (Direktmanipulation, wenige Buttons): Vertex-Drag = direkt ziehen (kein Knopf). Löschen = sehr Long-Press, Feedback grün→rot (kein Knopf). Snap-an-Startpunkt = immer an (Schließen = Snap letzter→erster). Snap-an-Vorlage/Nachbarn = TOGGLE in beiden Tabs. Undo: Umriss NEIN, Wegnetz JA.

UMRISS-TAB: Leiste nur Snap-Toggle. Setzen=Klick, Drag=direkt, Löschen=Long-Press, Schließen=Auto-Snap. Kein Rechteck. B1/B2-Sperre in der EBENEN-Leiste: "nicht bearbeitbar, aber Punkte als Snap-Quelle". Farben wie F7 (B1 gelb/orange, B2 rot/maskiert, committet blau).

WEGNETZ-TAB (3 Zonen): LINKS Maschine: Anwenden (OSM holen) · Lückenschließ-Automat (EINE Toleranz) · Verschweißen-Anfang (auto/unsichtbar = graphCompose). MITTE Mensch: Snap-Toggle · Linien-setzen-Modus (sperrt Overpass, gibt OSM-Netz frei) · Sackgassen-Tools · Coord→Katalog-POI (Komfort, später) · Koord-Reduktion 0,3m · Undo · Linienlöschen (Long-Press/Doppelklick, kein Knopf). RECHTS Maschine: Verschweiß-Automat (final).

PRINZIPIEN: (1) Verschweißen am Anfang (graphCompose: nahe Koords → gemeinsamer Knoten, Grad, Komponenten via Union-Find) UND am Schluss (Re-Verschweißen nach Hand-Korrektur). (2) Lückenschließen braucht den verschweißten Graphen → eine Toleranz bridged Komponenten; per-Klasse-Schieber = Überbau. (3) Manuelles Editieren friert die Maschinen-Quelle ein (Linien-setzen sperrt Overpass) → daher Undo im Wegnetz. (4) Engine-Regel Sackgassen: jeder degree-1-Knoten ist POI ODER vom Routing ausgeschlossen; Sackgassen-Tools = ausschließen (Auto) oder zu Start/End-POI befördern. (5) Koord-Reduktion distanzbasiert 0,3m, KEINE %-Dezimierung. (6) Coord→Katalog: Round-Trip, heikel (Draft/Katalog-Konsistenz), später.

REIHENFOLGE: Anwenden → auto Verschweißen → auto Lückenschließen → Mensch korrigiert → auto Re-Verschweißen → zusammengeschweißt + sackgassenfrei + nur POIs als Endknoten. ERSTER SCHRITT: graphCompose (reine Funktion, kein UI, auf src/scim/graph/).

OFFEN/GEPARKT: Linienlöschen-Detail (Long-Press verlängert / Doppelklick bis Gabelung, unsicher); "Hochstellen" (Operator-Option, geparkt); Coord→Katalog-Round-Trip; %-Dezimierung verworfen.`,
    date: '2026-05-30',
  },
  {
    id: 'ann_080',
    category: 'next_intent',
    label: 'Um-/Ausbauplan — Drawer-Werkzeug + Netz-Engine',
    related_panel: 'geometry_editor',
    content: `UM-/AUSBAUPLAN (2026-05-30). Volltext: docs/umbauplan_drawer_netz_engine.md. Baut auf ann_078 (Theorie) + ann_079 (Werkzeugleiste-Spec).

GEOMAN-ENTSCHEIDUNG: (A) zähmen + Custom-Gesten aufsatteln — für Stabilität. Geoman behalten (Drag/Vertex-Edit/Schließen/Snapping), Rechteck aus, Toolbar verstecken, Snap-Toggle treibt Geoman-Snapping, Long-Press-Löschen grün→rot custom (ersetzt removalMode). (B) ersetzen bleibt offen.

REIHENFOLGE: erst Engine-Rückgrat (ohne zusammengeschweißtes/sackgassenfreies Netz macht alles keinen Sinn), dann Werkzeuge. Jede Stufe einzeln deploybar.

ENGINE-RÜCKGRAT: E1 graphCompose (rein, kein UI): Kanten → Knoten (verschweißt per ε) + Kanten from/to + Grad + Komponenten (Union-Find), mit Tests. ✓ GEBAUT (netGraph.ts). E2 3-KLASSEN-KONNEKTIVITÄTSFÄRBUNG (revidiert, statt „gelb"): Komponenten nach LÄNGE klassifizieren → SCHWARZ (Netz, Länge≥Längenschieber-Schwelle, mehrere möglich) / GRÜN (Rest, kleinere Komponenten/Äste); Sackgassen = degree-1, tragen DEFAULT die Grundfarbe ihrer Komponente (schwarz am Netz, grün am Rest), Toggle legt ROT über ALLE degree-1. E3 Lückenfüller-Automat: Komponenten per EINER Toleranz verbinden → neu klassifizieren (rot/grün verschmilzt ins schwarze Netz). E4 Sackgassen-Tools (Mensch): ausschließen / zu Start-End-POI. E5 Verschweiß-Automat (final). SORTIER-WORKFLOW: Netze (schwarz) identifizieren → mehrere Netze manuell verbinden („Was ist das Netz?" abgehakt) → grünen Rest manuell anschließen (Gesamtbild) → Sackgassen-Toggle → Lückenfüller verschmilzt.

WERKZEUGLEISTE/GESTEN (danach): U1 Umriss-Interaktion (Geoman zähmen, Snap-Toggle, Long-Press-Löschen, Klick-Setzen, Vertex-Drag). U2 Wegnetz-Leiste 3 Zonen (Filtermenü→Leiste; Neben-/Landstraße+m-Schieber nach links, TEMPORÄR/Test; Anschluss-Toleranz behalten). T1 Koord-Reduktion 0,3m (distanzbasiert). T2 Linien-setzen-Modus (sperrt Overpass) + Undo (Wegnetz) + Linienlöschen-Geste. T3 Coord→Katalog (Komfort, zuletzt).

ZIEL: Anwenden → auto Verschweißen → auto Lückenschließen → Mensch korrigiert → auto Re-Verschweißen → zusammengeschweißt + sackgassenfrei + nur POIs als Endknoten. Regel: degree-1-Knoten = POI oder ausgeschlossen.`,
    date: '2026-05-30',
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
