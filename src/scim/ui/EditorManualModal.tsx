// EditorManualModal — das auf den Editor zugeschnittene Handbuch (Gegenstück zum
// vollen Usage-Manual/Kosmologie-Atlas der Operator/Analyst-Sicht). Scoped auf das,
// was der Editor wirklich sieht und tut: Editor-Controls, Workflow, Rep-Bindung,
// Rechte. KEINE Kosmologie (Mond/Tetraeder/Anthem) — die ist Operator-Sache.

interface Props {
  onClose: () => void;
}

const BODY = `PATHWORKS — EDITOR-HANDBUCH

  Pathworks ist deine Werkbank: hier baust du Representations.
  Leitsatz — es gibt nur Representationen. Eine Representation ist
  die Einheit; ueber sie oeffnest du ihre Werkzeuge.

────────────────────────────────────────────────────────

EDITOR-CONTROLS

  REGISTRY
    Pathworks Hub   Deine Representations: anlegen, oeffnen,
                    einreichen. Hier waehlst du, welche Rep die
                    Werkzeuge bearbeiten (Rep-Bindung).

  TOOLS  (oeffnen sich an der gewaehlten Rep)
    Drawer          Boundary, Wegnetz und POIs auf der Karte
                    zeichnen.
    Katalog         POI-Bestand kuratieren (Buckets, Subkategorien).
    Schwellen       Farb-/Last-Schwellen der Rep.

  STATUS  (Auslieferungs-Seite — fuer dich zur Info)
    Vorschau        Monitor & QR: wie die Rep am Geraet laeuft.
    Transfer        Ausspielen nach R2 — der Operator-Schritt.
    Versionen       Versions-Bibliothek & Rollback.

────────────────────────────────────────────────────────

WORKFLOW

  1  Speichern        Dein Entwurf, lokal im Browser. Folgenlos
                      fuers System.
  2  Senden zur       Deine gespeicherte Arbeit geht an den Operator
     Review           (zur Pruefung). Du committest NIE selbst.
  3  Operator         Prueft, committet in eine Rep-Version und
                      liefert aus.

  Rep-Bindung: die im Hub gewaehlte Rep steuert Drawer, Katalog und
  Schwellen. Committete Reps sind nur lesbar — du betrachtest die
  Version, ein Aendern beginnt einen neuen Entwurf.

────────────────────────────────────────────────────────

DEINE RECHTE

  Du darfst         bauen, speichern, zur Review senden.
  Operator-only     committen, ausspielen (Transfer / Release /
                    Activate).
  Read-only         die Publishing-Panels siehst du zur Info,
                    nicht zum Tun.

  Die System-Kosmologie (Mond, Tetraeder, Anthem) ist Operator-
  Sache — du brauchst sie fuer deine Arbeit nicht.

────────────────────────────────────────────────────────

PAKET-GRÖSSEN  (Beispiel Lichtenberg · gzip)

  Shell           147 KB   einkompiliert · einmalig (JS 139 + CSS 8)
  Origin           49 KB   Bundle (648 Seg.) · ohne px-Bilder
  Anthem          3,3 KB   Snapshot · alle 5 Min
  ─────────────────────
  Erstlieferung  ~200 KB   (Shell + Origin + Anthem)
  laufend         3,3 KB   Bestandsnutzer · nur Anthem / 5 Min

  Versorgungssicherheit: die winzige laufende Last bleibt auch
  unter ueberlasteten Netzen (Events) robust; und weil Origin
  lokal liegt, laeuft die App durch kurze Anthem-Aussetzer weiter.

────────────────────────────────────────────────────────

  Systemarchitektur ab 09.2025 · Implementierung ~1 Monat
  Dietmar Broda

  Geh deinen Weg.
`;

export default function EditorManualModal({ onClose }: Props) {
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
          background: '#fafafa', borderRadius: 4, width: 'min(640px, 92vw)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            fontSize: 11, padding: '4px 10px', cursor: 'pointer',
            border: '1px solid #cbd5e0', background: '#fff', borderRadius: 3,
            fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
          }}>schliessen</button>
        </div>
        <div style={{
          flex: 1, overflow: 'auto', padding: '4px 22px 22px',
          fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
          fontSize: 13, lineHeight: 1.55, color: '#1a202c',
        }}>
          <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap' }}>{BODY}</pre>
        </div>
      </div>
    </div>
  );
}
