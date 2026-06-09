// Usage Manual — verkuerztes Leistungsblatt + Befehlsreferenz fuer die
// Cosmo-Controls. Brutalist-Style: Monospace, Titel bold (gleiche Groesse),
// keine Adjektive, kein Schmuck. Siehe ann_069 fuer die historische
// Urfassung (Render von docs/represent_build.md), die durch dieses
// Manual abgeloest wurde.

import { Fragment } from 'react';
import { TrygonLoopEmblem } from './TrygonLoopEmblem';
import { LEISTUNGEN_STAND, LEISTUNGEN } from '../sensus/leistungen';

interface Props {
  onClose: () => void;
}

// Leistungen + cosmos-spezifische Zusatzzeilen, EINE Tabelle. Label links, Wert +
// (umbrechender) Detail rechts → lange Detail-Zeilen hängen ein, fangen NICHT links an.
const LEISTUNGEN_ROWS: { label: string; wert: string; detail: string }[] = [
  ...LEISTUNGEN,
  { label: 'Kosmologie-Klick-Karte', wert: '21 Hitboxen', detail: 'Mond 6 · Transmissionsfeld 1 · Komposit 10 · Substrat 3 · Grund 1' },
  { label: 'R2-Deploy', wert: 'Cloudflare R2 + D1 + Worker', detail: '' },
  { label: 'QR-Generierung', wert: 'automatisiert je Representation', detail: '' },
];

function LeistungenTable() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '170px 1fr', columnGap: 14, rowGap: 9,
      fontFamily: 'inherit', fontSize: 'inherit', margin: '2px 0 6px',
    }}>
      {LEISTUNGEN_ROWS.map((r) => (
        <Fragment key={r.label}>
          <div style={{ color: '#1a202c' }}>{r.label}</div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontWeight: 700 }}>{r.wert}</span>
            {r.detail && (
              <div style={{ color: '#718096', fontSize: 11.5, lineHeight: 1.5, marginTop: 1 }}>{r.detail}</div>
            )}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

const TRYGON_SPEC = `TRYGON-LOOP (TL) — KERNFUNKTION (Systemmerkmal · HOT PATH)

  Der fortlaufende Loop aus drei Funktionen — das, was uns von
  gaengigen Systemen unterscheidet. Die Hochfrequenz-Maschine
  (5-Min-Takt) — Gegenpol zum cold path (Substrat / Versionierung).

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
    Cosmo Controls erklaer- und navigierbar. SCIM3 publiziert mit heutigem
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

  Stand: zur Zeit funktionsgestoert - die Build-Status-Anzeige
         ist nicht verlaesslich.

MOON (Release Artifacts: Shell, Origin, Anthem)
  Hex          = Sechseck im Mond-Zentrum.
  Mondkoerper  = die volle Mondscheibe.
  Extension    = die seitlichen Auswuechse.

  Klick Hex          : oeffnet R01 Runtime Shell.
  Klick Mondkoerper  : oeffnet V01 Versions-Bibliothek.
  Klick Extension    : oeffnet V02 Region-Detail im zugehoerigen Tab.
                        Top-Left  = Gruenberg / Salzkammergut
                        Top-Right = Lichtenberg / Boehmerwald
                        Bot-Right = Gaisberg / Salzburg (prepared)

CLOUD (im Spalt zwischen Mond und Transmissionsfeld)
  Klick : oeffnet das Cloud-Panel.

  Die our-side Eintritts- und Auslieferungs-Flaeche - kein Teil
  des reisenden Pakets. Drei Werkzeuge:
    Launcher        nackte diesenpark.com -> Kachel-Auswahl der
                    Representationen. QR umgeht den Launcher und
                    laedt direkt die Rep.
    Globe-Switcher  Eintritts-Weiche am Edge, vor Sensus Core.
    Collector       Cross-Rep-Fan-in: aggregiert Nation -> Region
                    -> Rep aus den publizierten Fakten in R2.

TRANSMISSION (Mesh zwischen Mond und Komposit-Tetraeder)
  Klick : oeffnet P06 Transmitter (Atem).

  Das Feld visualisiert den ATEM — die 5-Min-Auslieferung des
  Anthem vom Komposit-Tetraeder zur Ziel-App. Das Anthem IST das
  Breath-Colour-Mesh: der atmende, eingefaerbte Karten-Layer der
  aktiven Region (Lastbild je Segment). P06 ist die Ausatem-
  Station einer real gebauten Kette:

    Telco (P04)        einatmen - presence-Intake · Sim-Telco ·
                       Normalisierung (Rohlast -> [0..1]).
    Thresholds (P01)   deuten - System -> Region -> Load (Schwellen).
    Coder (P02)        packen - Anthem-Encoder: Last -> segId-Snapshot.
    Transmitter (P06)  ausatmen - Anthem-Auslieferung (alle 5 Min)
                       an die Runtime. Scheduling lebt hier.

  Den laufenden Puls dieses Atems zeigt V03 · Puls (hot path).

  Stand: die Atem-Kette ist gebaut (Snapshot-Erzeugung im Worker,
  presence-gegated, 5-Min-Raster). Offen: echtes Scheduling /
  Priority und reale Telco-Last statt Sim. (Die fruehere P06-Rolle
  - Signal-Klassifikation flow/accumulation/ambiguous - lebt als
  eigener Tab weiter.)

KOMPOSIT-TETRAEDER (Apex up - fire)
  Klick Face   : Sensus Core Publishing (P11) · Pathworks Hub ·
                 Katalog · Drawer.
  Klick Arc    : P01 Thresholds · P04 Telco · P02 Coder.
  Klick Sichel : P07 High-Shell · P08 Deep-Shell ·
                 P09 Origin-Capsuler.

  Die drei Arcs sind als konkave Signal-Catcher modelliert —
  Schalen-Schirme, die quantifizierte Micro-Impacts aus dem
  Transmissionsfeld einfangen und an die zustaendigen Engine-
  Panels (P01/P04/P02) weiterreichen.

  Die drei Sicheln sind die Publishing-Bauer: P07 High-Shell +
  P08 Deep-Shell bilden die SHELL (App-UI/UX + Engine-Prep),
  P09 das ORIGIN (Atomic Particles). Zusammen mit dem ANTHEM
  (P06, Transmissionsfeld) ergeben sie die drei Release-Artefakte
  Shell/Origin/Anthem (siehe MOON).

  Panels im Komposit:
    P11  Sensus Core     Bundling der Representation aus Layern,
         Publishing      Geometrien und Katalog-POIs zu einem
                         versionierten Artefakt.
    Pathworks Hub        Rahmen der Repraesentation: Region,
                         Bezeichner, Zielgruppe.
    Katalog              POI-Bestand der Region, kuratiert nach
                         Buckets und Subkategorien.
    Drawer               Polygone, Linien und Punkte direkt auf
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

SUBSTRAT-TETRAEDER (Apex down - matter · COLD PATH)
  Klick : toggelt eine Navigator-Sektion.
            Upper       -> SCIM-Dev-Notes
            Lower-Left  -> Package-Build-Pipelines
            Lower-Right -> SCIM-Capabilities & Development

  COLD PATH: Substrat-Tetraeder, Brocken und Muellwagen stehen
  ausserhalb der Hochfrequenz-Maschine (Anthem-Puls / Trygon-Loop,
  5-Min-Takt = HOT PATH). Brocken und Muellwagen sind fragmentiert
  von Natur aus; der Substrat-Tetraeder ist kein Fragment, sondern
  der bewusste, versionierte Takt (Versionierung, Lifecycle). Die
  heute weitgehend ungenutzten Panels (P03, P10, P12-P14, R02-R08)
  sind im Navigator im Muellwagen gesammelt.

READER (am Fuss der Kosmologie)
  Klick : oeffnet dieses Dokument.

────────────────────────────────────────────────────────

ROLLEN & RECHTE (Mehrbenutzer-Betrieb)

  Fuenf Rollen mit getrennten Sicht- und Benutzungsrechten:
    Operator      baut, kuratiert, committet, liefert aus - als
                  einziger publish / release / activate.
    Data-Analyst  Operator-Sicht, aber read-only (Sandbox).
    Reg-Editor    pflegt seine Region (alle Reps der Region).
    Rep-Editor    pflegt seine eigenen Representations.
    Editor        ungebundener Kram (privat / Event), ohne Region.

  Zwei entkoppelte Achsen: SICHT (welcher Tab/Modus - was du
  siehst) und WIRKUNG (das echte Login - ob es zaehlt). Live nur,
  wenn das echte Login den Tab besitzt; sonst Sandbox (bedienbar,
  aber folgenlos) oder abgedimmt. Editoren senden zur Review und
  committen nie selbst; der Operator committet und liefert aus.
  Provenienz-Namen (Ersteller / Committer / Publisher) reisen mit.

  Stand: erste Stufe gebaut - Pathworks Hub (Cross-User-Review,
  Provenienz, Rollen-Gating), Navigator fuer non-operator gesperrt,
  Footer-Presence. Dynamische Rollen + echte Per-User-Auth folgen.

────────────────────────────────────────────────────────

${TRYGON_SPEC}

────────────────────────────────────────────────────────

LEISTUNGEN  (Stand ${LEISTUNGEN_STAND} · eine Quelle mit dem Leistungsblatt)

«LEISTUNGEN_TABLE»
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
  Cloud -> Geraet traegt (MVP-Lichtenberg, per QR ladbar). Vom
  Vollausbau steht die erste Stufe: Mehrbenutzer-Betrieb (fuenf
  Rollen mit getrennten Sicht-/Benutzungsrechten), regionale Pflege
  und versionierte Auslieferung haben mit dem Pathworks Hub
  (Cross-User-Review, Versions-Bibliothek, Release-Drossel, Rollen-
  Gating, Provenienz) ein Fundament. Der Rest — Governance-Tiefe,
  dynamische Rollen, reale Telco-Last — folgt und wird die erwartete
  Codefuelle erst beweisen muessen.

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
          <div style={{ fontWeight: 700, marginBottom: 16 }}>USAGE MANUAL &amp; SCIM-STATE</div>
          {(() => {
            // TL-Animation lebt jetzt UNTEN am TRYGON-LOOP-Abschnitt (nicht mehr im
            // Kopf — sie stünde sonst neben der Panel-Animation). Body am Spec splitten.
            const preStyle = { margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap' as const };
            const [before, after] = MANUAL_BODY.split(TRYGON_SPEC);
            const [afterTop, afterBottom] = after.split('«LEISTUNGEN_TABLE»');
            return (
              <>
                <pre style={preStyle}>{before}</pre>
                <div style={{ margin: '4px 0 8px' }}>
                  <TrygonLoopEmblem size={104} withLegend={false} animated />
                </div>
                <pre style={preStyle}>{TRYGON_SPEC}{afterTop}</pre>
                <LeistungenTable />
                <pre style={preStyle}>{afterBottom}</pre>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
