// Usage Manual — verkuerztes Leistungsblatt + Befehlsreferenz fuer die
// Cosmo-Controls. Brutalist-Style: Monospace, Titel bold (gleiche Groesse),
// keine Adjektive, kein Schmuck. Siehe ann_069 fuer die historische
// Urfassung (Render von docs/represent_build.md), die durch dieses
// Manual abgeloest wurde.

interface Props {
  onClose: () => void;
}

const MANUAL_BODY = `    VERSION       2026
    AUTHOR        Dietmar Broda
    CO-AUTHOR     Claude Opus 4.7 / Claude Code

    Die Architektur des digitalen Systems SCIM3 — Sensus Core Integration
    Model — ist ab Juni 2026 ueber das 3D-visualisierte Navigationstool
    Cosmo Control erklaer- und steuerbar. Diese kleine Cosmology ist mit
    ueber einem Dutzend Panels verknuepft und ersetzt ein lineares
    Pipelinemodell. SCIM3 ist mit heutigem Stand in der Lage, eine MVP
    Ziel-App-Repraesentation auszuwerfen und damit ihre Funktionalitaet
    zu beweisen.

────────────────────────────────────────────────────────

INSPECTOR (Pergament-Trapez, oben)
  Klick    : ScimMap rechts ein/ausblenden.
  Glimmer  : ein Slice je aktivem Layer pulst, Cursor wandert.
  Blitz    : pro Layer-Toggle in der ScimMap.

MOND (Logo, Mittelpunkt der Kosmologie)
  Klick Hex            : oeffnet R01 Runtime Shell.
  Klick Mondkoerper    : oeffnet V01 Pakete.
  Klick Auswuchs       : oeffnet V02 Region-Detail im zugehoerigen Tab.
                          Top-Left  = Gruenberg / Salzkammergut
                          Top-Right = Lichtenberg / Boehmerwald
                          Bot-Right = Gaisberg / Salzburg
                          Bot-Left  = Kanton Zuerich (Region offen)

MESH (Transmissionsfeld, zwischen Mond und Tetraeder)
  Klick : oeffnet P06 Transmitter (Pattern-Klassifikator).

TETRAEDER OBEN (Apex oben, statisch)
  Faces : scb -> P11, org -> Workspace, cat -> Katalog, geo -> Geometry-Editor.
  Arcs  : sys -> P01, rou -> P02, loa -> P09.

TETRAEDER UNTEN (Apex unten, rotierend, Substrat-Tetraeder)
  Hover     : bremst auf naechste Face, lockt sie frontal.
  Locked    : drei sichtbare Regionen klickbar.
              Upper       -> toggelt Versionen.
              Lower-Left  -> toggelt Package Pipeline.
              Lower-Right -> toggelt Runtime Builder.

MANUAL / READER (am Fuss der Kosmologie)
  Manual (📄)  : stumm.
  Reader (●)   : oeffnet dieses Dokument.

────────────────────────────────────────────────────────

LEISTUNGEN

  Quellcode                       ~36.000 Zeilen TypeScript/TSX
  Tests                           518 in 33 Test-Dateien
  Pipeline                        14 P-Panels + 7 Compute-Module
  Region-Katalog                  2 Regionen, 60 POIs gesamt
                                    Gruenberg    49 POIs, 12 Subkategorien
                                    Lichtenberg  11 POIs, OSM + Wiki-recherchiert
  Icon-Bibliothek                 49 SVG-Assets (POI-Icons + Glyphs + Frame)
  Annotationen                    53 Eintraege als KI-Briefing-Material
  Kosmologie-Klick-Karte          19 Hitboxen verdrahtet
                                    (Tetraeder oben + unten, Mond, Mesh,
                                     Inspector, Reader)
  R2-Deploy                       Cloudflare R2 + D1 + Worker konfiguriert
  QR-Generierung                  automatisiert je Representation
  Auto-Deploy                     Cloudflare Pages bei jedem main-Push
  Git-Historie                    232 Commits

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
          <div style={{ fontWeight: 700, marginBottom: 14 }}>USAGE MANUAL</div>
          <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap' }}>
            {MANUAL_BODY}
          </pre>
        </div>
      </div>
    </div>
  );
}
