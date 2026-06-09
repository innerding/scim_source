// Usage Manual — verkuerztes Leistungsblatt + Befehlsreferenz fuer die
// Cosmo-Controls. Brutalist-Style: Monospace, Titel bold (gleiche Groesse),
// keine Adjektive, kein Schmuck. Siehe ann_069 fuer die historische
// Urfassung (Render von docs/represent_build.md), die durch dieses
// Manual abgeloest wurde.

import { TrygonLoopEmblem } from './TrygonLoopEmblem';
import { LEISTUNGEN_STAND, leistungenManualBlock } from '../sensus/leistungen';

interface Props {
  onClose: () => void;
}

const TRYGON_SPEC = `TRYGON-LOOP (TL) — KERNFUNKTION (Systemmerkmal)

  Der fortlaufende Loop aus drei Funktionen — das, was uns von
  gaengigen Systemen unterscheidet.

    AP  Anthem-Pulse      misst die Last (5-Min-Puls) - Voraussetzung
    CK  Comfort Kernel    beobachtet den Comfort
    AK  Avoidance Kernel  handelt: Deeskalations-Kaskade

  Loop : AP -> CK -> AK -> veraendert das Aufkommen -> AP misst neu.
  Oeffentlich: Anthem-Pulse. Innovations-Label: TL.
  designed by Dietmar Broda 2025/2026`;

const MANUAL_BODY = `    JAHR                     2026
    SOFTWARE-ARCHITECTURE    Dietmar Broda
    CODE-EXECUTION           Claude Opus 4.8 / Claude Code
    LLM-ASSISTANCE           Chat-GPT 5.5 Thinking

    Die Architektur des digitalen Systems SCIM3 — Sensus Core Integration
    Model — ist ab Juni 2026 ueber das 3D-visualisierte Navigationstool
    Cosmo Control erklaer- und navigierbar. SCIM3 publiziert mit heutigem
    Stand die Ziel-App MVP-Lichtenberg: per QR auf ein Endgeraet ladbar
    (diesenpark.com/?rep=rep-lichtenberg), edge-lokal und datensparsam.
    Damit ist die Funktionalitaet der Kette Werkbank -> Paket -> Geraet
    am laufenden Beispiel bewiesen.

────────────────────────────────────────────────────────

Sektionen ohne 'Stand:'-Hinweis gelten als arbeitsbereit.

INSPECTOR (Rep-Build-Observer)
  Der Inspector wirkt wie ein Spiegel der Representation: er
  errechnet ihren Build-Status fortlaufend selbsttaetig; die
  ScimMap rechts macht das Ergebnis sichtbar.

  Klick : ScimMap rechts ein/ausblenden.
  Layer : Boundary, Routes, POIs, Colourmesh (vier zur Auswahl).

MOON (Release Artifacts: App-Shell, Packages, Breath-Colour-Mesh)
  Hex                = Sechseck im Mond-Zentrum.
  Mondkoerper        = die volle Mondscheibe.
  Extension          = die seitlichen Auswuechse.
  Breath-Colour-Mesh = der atmende, eingefaerbte Karten-Layer
                       der aktiven Region.

  Klick Hex          : oeffnet R01 Runtime Shell.
  Klick Mondkoerper  : oeffnet V01 Versions-Bibliothek.
  Klick Extension    : oeffnet V02 Region-Detail im zugehoerigen Tab.
                        Top-Left  = Gruenberg / Salzkammergut
                        Top-Right = Lichtenberg / Boehmerwald
                        Bot-Right = Gaisberg / Salzburg (prepared)

TRANSMISSION (Mesh zwischen Mond und Komposit-Tetraeder)
  Klick : oeffnet P06 Transmitter.

  Das Feld visualisiert die Uebergabe klassifizierter Signale vom
  Komposit-Tetraeder Richtung Ziel-App. P06 (Header: Transmitter)
  ist heute der einzige real gebaute Teil der Kette: er sortiert
  eingehende Signale in drei Klassen — flow (fliessend),
  accumulation (Stau/Sammel), ambiguous (mehrdeutig).

  Stand: eine groessere Verarbeitungskette (Priority Queue,
  Cache/Lookup, Dispatcher) ist konzeptuell gedacht, aber nicht
  gebaut. Das Mesh ist hier Darstellung, nicht Funktion.

KOMPOSIT-TETRAEDER (Apex up - fire)
  Klick Face   : scb -> P11, org -> Workspace,
                 cat -> Katalog, geo -> Editor.
  Klick Arc    : sys -> P01 Thresholds, regio -> P04 Telco,
                 load -> P02 Coder.
  Klick Sichel : bou -> P07 High-Shell, eng -> P08 Deep-Shell,
                 smp -> P09 Origin-Capsuler.

  Die drei Arcs sind als konkave Signal-Catcher modelliert —
  Schalen-Schirme, die Threshold-Treffer aus dem Transmissionsfeld
  einfangen und an die zustaendigen Engine-Panels (P01/P04/P02)
  weiterreichen.

  Panels im Komposit:
    P11  Package         Bundling der Representation aus Layern,
                         Geometrien und Katalog-POIs zu einem
                         versionierten Artefakt.
    Workspace            Rahmen der Repraesentation: Region,
                         Bezeichner, Zielgruppe.
    Katalog              POI-Bestand der Region, kuratiert nach
                         Buckets und Subkategorien.
    Editor               Polygone, Linien und Punkte direkt auf
                         der Karte zeichnen.
    P01  Thresholds      Globale Last-Schwellen der Farbskala
                         (Felder/Grenzen) — System-Ebene.
    P04  Telco           Regionales Lastbild / Telco-Parameter
                         der Representation.
    P02  Coder           Regions-spezifische Schwellen, die das
                         System-Default ueberschreiben.

  Stand: erste Stufe gebaut (Pathworks Hub: Cross-User-Review,
  Provenienz-Namen, Rollen-Gating - siehe STAND JUNI 2026). Darueber
  hinaus architektonisch vorbereitet auf Mehrbenutzer-Betrieb; die
  Bauteile tragen mehrere Anwendungsfaelle ueber dem heutigen MVP:

    Multi-Editor      Operator und Gestalter schreiben parallel
                      am selben Komposit, konfliktfrei.
    Regional-Pflege   POI-Kuratierung emigriert in regionale
                      Dashboards (Kuratoren und Gestalter vor Ort).
    Governance        Schreib- und Freigaberechte, Audit der
                      Aenderungen.
    Authority-Cohort  System schlaegt Kohorten vor, eine Authority
                      bestaetigt die Empfehlung und gibt sie frei.
    Event-Reps        Veranstalter koennen Representationen fuer
                      Events bauen — eigenes Sicherheitsprofil,
                      zeitlich und scope-begrenzt.

SUBSTRAT-TETRAEDER (Apex down - matter)
  Klick : toggelt eine Navigator-Sektion.
            Upper       -> Versionen
            Lower-Left  -> Package Pipeline
            Lower-Right -> Runtime Builder

  Stand: der Versionen-Ast ist jetzt funktional — V01/V02 Versions-
  Bibliothek (Historie je Rep, aktiv ausgeliefert, Rollback) plus
  zeitliche Release-Drossel, alles auf dem Origin-Pfad. Package-
  Pipeline und Runtime-Builder bleiben duenn. Die heute weitgehend
  ungenutzten Panels (P03, P10, P12-P14, R02-R08) sind im
  Navigator im Muellwagen gesammelt — Klick klappt sie aus.

READER (am Fuss der Kosmologie)
  Klick : oeffnet dieses Dokument.

────────────────────────────────────────────────────────

${TRYGON_SPEC}

────────────────────────────────────────────────────────

LEISTUNGEN  (Stand ${LEISTUNGEN_STAND} · eine Quelle mit dem Leistungsblatt)

${leistungenManualBlock()}
  Kosmologie-Klick-Karte          21 Hitboxen verdrahtet
                                  (Mond 6 · Transmissionsfeld 1 ·
                                   Komposit 10 · Substrat 3 · Grund 1)
  R2-Deploy                       Cloudflare R2 + D1 + Worker
  QR-Generierung                  automatisiert je Representation

────────────────────────────────────────────────────────

STAND JUNI 2026 (neu)

  bak-test       Im Ziel-App-Test POIs zu einer Route waehlbar
                 (Dijkstra ueber den Segment-Graph). Faellt die
                 Route-Last ueber das Comfort-Level, meldet die
                 Shell "ausserhalb der Comfort-Zone". Logik in
                 shell-kit, das Geraet bleibt duenner Konsument.
  App-QR         V03 und P11 erzeugen je Representation einen QR
                 auf die echte Origin-URL (?rep=). Scannen laedt
                 die MVP-Lichtenberg aufs Geraet (Gate reist mit).
  Auslieferung   Doktrin im Design-Manifest: Pakete cloud-only,
                 ohne Desktop-Nabel, ohne Umwege, die der Voll-
                 ausbau nicht nutzt. Nicht-Auslieferungs-Pfade
                 sind im Code als @LEGACY ausgewiesen.
  Pathworks Hub  Leitsatz "es gibt nur Representationen". Editor-
                 und Operator-Gesicht; die gewaehlte Rep steuert
                 Drawer, Katalog und Thresholds (Rep-Bindung).
                 Logik-Schicht gebaut.
  Versions-Bib   V01/V02: Historie je Rep, aktiv ausgeliefert,
                 Rollback - alles auf dem Origin-Pfad. Zwei
                 Versionsnummern: Quelle (Commit) vs. ausgeliefert
                 (aktives Bundle). Commit != Release.
  Release-Drossel Zeitliches Fenster (manual/scheduled): ein
                 Worker-Cron staged neue Bundles und aktiviert sie
                 erst im Fenster - das Geraet-Erlebnis bleibt stabil.
  Cross-User     Editor (Geraet A) sendet zur Review -> Server-
                 Queue (Worker/R2) -> Operator (Geraet B) sieht und
                 committet. Kein 1-Browser-Limit mehr.
  ACCESS-light   Provenienz-Namen reisen mit (Ersteller, Committer,
                 Publisher). Publish/Release/Activate = operator-
                 only; Editor sieht die Panels read-only. Echte
                 Per-User-Auth (Server/Edge) folgt spaeter.
  Rollen/Presence Navigator fuer non-operator gesperrt; Footer mit
                 Mehrbenutzer-Presence und Login-Namen.

────────────────────────────────────────────────────────

SUMMARY

  Der architektonische Rahmen ist vielversprechend und in Teilen
  bereits am laufenden Beispiel bewiesen — die Kette Werkbank ->
  Paket -> Geraet traegt (MVP-Lichtenberg). Vom Vollausbau steht die
  erste Stufe: Mehrbenutzer-Betrieb und regionale Pflege haben mit
  dem Pathworks Hub (Cross-User-Review, Versionierung, Rollen-Gating)
  ein Fundament. Der Rest — Governance-Tiefe, reale Telco-Last — folgt
  und wird die erwartete Codefuelle erst beweisen muessen.

  released for review
`;

export default function RepresentBuildManualModal({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fafafa', borderRadius: 4, width: 'min(720px, 92vw)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Minimaler Header — nur Schliessen-Button. Der Titel lebt im Body. */}
        <div style={{
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            fontSize: 11, padding: '4px 10px', cursor: 'pointer',
            border: '1px solid #cbd5e0', background: '#fff', borderRadius: 3,
            fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
          }}>schliessen</button>
        </div>
        {/* Body — Monospace, Titel bold (gleiche Groesse), Rest regular. */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '4px 22px 22px',
          fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
          fontSize: 13, lineHeight: 1.55, color: '#1a202c',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
            <TrygonLoopEmblem size={104} withLegend={false} animated />
            <div style={{ fontWeight: 700 }}>USAGE MANUAL &amp; SCIM-STATE</div>
          </div>
          <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap' }}>
            {MANUAL_BODY}
          </pre>
        </div>
      </div>
    </div>
  );
}
