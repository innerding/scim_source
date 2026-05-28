// Usage Manual — verkuerztes Leistungsblatt + Befehlsreferenz fuer die
// Cosmo-Controls. Brutalist-Style: Monospace, Titel bold (gleiche Groesse),
// keine Adjektive, kein Schmuck. Siehe ann_069 fuer die historische
// Urfassung (Render von docs/represent_build.md), die durch dieses
// Manual abgeloest wurde.

interface Props {
  onClose: () => void;
}

const MANUAL_BODY = `    JAHR                     2026
    SOFTWARE-ARCHITECTURE    Dietmar Broda
    CODE-EXECUTION           Claude Opus 4.7 / Claude Code
    LLM-ASSISTANCE           Chat-GPT 5.5 Thinking

    Die Architektur des digitalen Systems SCIM3 — Sensus Core Integration
    Model — ist ab Juni 2026 ueber das 3D-visualisierte Navigationstool
    Cosmo Control erklaer- und navigierbar. SCIM3 ist mit heutigem Stand
    in der Lage, eine MVP Ziel-App-Repraesentation zu publizieren und
    damit seine Funktionalitaet zu beweisen.

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
  Klick Mondkoerper  : oeffnet V01 Pakete.
  Klick Extension    : oeffnet V02 Region-Detail im zugehoerigen Tab.
                        Top-Left  = Gruenberg / Salzkammergut
                        Top-Right = Lichtenberg / Boehmerwald
                        Bot-Right = Gaisberg / Salzburg (prepared)

TRANSMISSION (Mesh zwischen Mond und Komposit-Tetraeder)
  Klick : oeffnet P06 Transmitter.

  Das Mesh ist die sichtbare Oberflaeche der Pattern-Recognition-
  Kette: Receptor Fields -> Feature Extraction -> Pattern
  Classification -> Confidence Scoring -> Priority Queue ->
  Cache/Lookup -> Dispatcher -> Target App. Der Komposit-Tetraeder
  feuert klassifizierte Pakete in dieses Feld. P06
  SignalInterpretation heisst im Panel-Header Transmitter und
  sortiert eingehende Signale in drei Klassen — flow (fliessendes
  Signal), accumulation (Stau-/Sammel-Signal), ambiguous
  (mehrdeutig).

  Stand: nur ein Bruchteil funktional. Aus der Kette sitzt heute
  P06 als Klassifikator; Priority Queue, Cache/Lookup und
  Dispatcher existieren konzeptuell, aber nicht als eigene Panels.

KOMPOSIT-TETRAEDER (Apex up - fire)
  Klick Face : scb -> P11, org -> Workspace,
               cat -> Katalog, geo -> Editor.
  Klick Arc  : sys -> P01, rou -> P02, loa -> P09.

  Die drei Arcs sind als konkave Signal-Catcher modelliert —
  Schalen-Schirme, die Threshold-Treffer aus dem Transmissionsfeld
  einfangen und an die zustaendigen Engine-Panels (P01/P02/P09)
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
    P01  SystemAdjust    Globale Engine-Schwellen — Confidence,
                         Layer-Gewichte, Routing-Defaults.
    P02  RegioContent    Regions-spezifische Schwellen und
                         Content-Parameter, ueberschreibt P01.
    P09  Engine          Vier Bewertungsmodelle fuer POIs,
                         feinjustierbar pro Achse.

  Stand: architektonisch vorbereitet auf Multi-Editor-Betrieb.
  Die Bauteile sind so geschnitten, dass parallele Schreibzugriffe
  von Operator und Gestalter konfliktfrei werden koennen;
  kuratierte POI-Pflege liesse sich auf regionale Dashboards
  emigrieren — betrieben von regionalen Kuratoren und beauftragten
  Gestaltern direkt vor Ort.

SUBSTRAT-TETRAEDER (Apex down - matter)
  Klick : toggelt eine Navigator-Sektion.
            Upper       -> Versionen
            Lower-Left  -> Package Pipeline
            Lower-Right -> Runtime Builder

  Stand: nur ein Bruchteil funktional. Eine rasche SCIM-Ausrollung
  auf eine Region wie das Salzkammergut braeuchte hier echtes
  Lifecycle- und Workflow-Werkzeug statt reiner Sichtbarmachung
  der spaerlich gefuellten Pipeline-Panels (P03, P04, P05, P07,
  P08, P10, P12, P13, P14).

READER (am Fuss der Kosmologie)
  Klick : oeffnet dieses Dokument.

────────────────────────────────────────────────────────

LEISTUNGEN

  Quellcode                       ~36.000 Zeilen TypeScript/TSX
  Tests                           518 in 33 Test-Dateien
  Pipeline                        14 P-Panels + 7 Compute-Module
  Region-Katalog                  3 Regionen, 60 POIs gesamt
                                    Gruenberg    49 POIs, 12 Subkategorien
                                    Lichtenberg  11 POIs, OSM + Wiki-recherchiert
                                    Gaisberg     prepared
  Icon-Bibliothek                 49 SVG-Assets (POI-Icons + Glyphs + Frame)
  Annotationen                    53 Eintraege als KI-Briefing-Material
  Kosmologie-Klick-Karte          19 Hitboxen verdrahtet
                                    (Tetraeder oben + unten, Mond, Mesh,
                                     Inspector, Reader)
  R2-Deploy                       Cloudflare R2 + D1 + Worker konfiguriert
  QR-Generierung                  automatisiert je Representation
  Auto-Deploy                     Cloudflare Pages bei jedem main-Push
  Git-Historie                    232 Commits

────────────────────────────────────────────────────────

SUMMARY

  Der architektonische Rahmen wirkt stabil; ob er die erwartete
  Codefuelle im Vollausbau tragen kann, gilt es erst zu beweisen.

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
          <div style={{ fontWeight: 700, marginBottom: 14 }}>USAGE MANUAL &amp; SCIM-STATE</div>
          <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap' }}>
            {MANUAL_BODY}
          </pre>
        </div>
      </div>
    </div>
  );
}
