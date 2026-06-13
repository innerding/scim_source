// Icon-Schmiede — die Baukonzept-Spec des Icon-/Node-Editors.
//
// Aus dem Drawer-Tab „Icon" herausgezogen: Icons sind global (representation-
// unabhängig), gehören also nicht in den Repr-Bauplatz Drawer, sondern in die
// Schmiede „Großer Bär". Hier nur die Spec (Vorbereitung); der echte Node-Editor
// entsteht in BA2.

export default function IconForgeSpec() {
  const H: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#7a4d00', margin: '12px 0 4px' };
  const P: React.CSSProperties = { fontSize: 12.5, color: '#4a5568', lineHeight: 1.55, margin: '2px 0' };
  const LI: React.CSSProperties = { fontSize: 12.5, color: '#4a5568', lineHeight: 1.5 };
  return (
    <div style={{ padding: '4px 2px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        display: 'inline-block', padding: '2px 8px', marginBottom: 10,
        fontSize: 10, fontFamily: 'monospace', color: '#9c6a00',
        background: '#fff0d6', border: '1px solid #f6c177', borderRadius: 4,
      }}>
        Baukonzeptnotiz · Großer Bär · Icon-Schmiede (Node-Editor) — Vorbereitung (BA2)
      </div>
      <p style={P}><strong>Zweck:</strong> regelbasierter, reduzierter Schwarz-Weiß-Icon-Editor mit optionaler Fill-/Stroke-Trennung. Erzeugt tabfähige Icons. <em>Braucht keine Karte.</em></p>

      <div style={H}>Ausgabegröße</div>
      <p style={P}>Viewport 48×48 px · Zeichenfläche 24×24 px (zentriert/skaliert im Viewport).</p>

      <div style={H}>Raster &amp; Snap</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}>Raster wählbar: 1×1 px oder 0.5×0.5 px, sichtbar als amber dots.</li>
        <li style={LI}>Snap: to grid · to nodes · optional both.</li>
      </ul>

      <div style={H}>Layer (zwei, sperrbar)</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}><strong>fill</strong> (unten): verbundene weiße Flächen, initial aus einer Kopie der Stroke-Ebene abgeleitet → Flächenkörper.</li>
        <li style={LI}><strong>stroke</strong> (oben): schwarzer Stroke, 1 px, ggf. mehrere verbundene Elemente → konstruktive Linienstruktur.</li>
        <li style={LI}>Robust: kommt auch mit einem <strong>einzelnen Stroke ohne Gruppenlayer</strong> zurecht (bare &lt;path&gt;, kein &lt;g&gt;).</li>
      </ul>

      <div style={H}>Layer-Gruppe</div>
      <p style={P}>Eigener, sprechender Name (editorisch, darf vom Dateinamen abweichen). Bsp.: „umriss mit knotenstruktur", „verzweigtes wegnetz", „fläche mit schnittlinie".</p>

      <div style={H}>Viewportname = Dateiname</div>
      <p style={P}>alles klein · keine Umlaute · keine Leerzeichen · Wörter mit Bindestrich. Vermittelt den symbolischen Gehalt. Bsp.: outline · path-network · mesh-resample · closed-shape · node-grid · split-area · stroke-fill · connected-paths.</p>

      <div style={H}>Werkzeug-Repertoire (Profi)</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}>variable Stroke-Breiten in <strong>0.20er-Schritten</strong>.</li>
        <li style={LI}><strong>Stroke → Fill</strong> umwandeln (Linie zu Fläche outlinen).</li>
        <li style={LI}><strong>Boolean</strong>: Form aus Form ausschneiden (Subtract) · zwei Fills verschmelzen (Union) · u.ä.</li>
        <li style={LI}><em>Achtung Node-Explosion:</em> v.a. Stroke→Fill und Boolean erzeugen schnell Hunderte Nodes → danach der Node-Begrenzer (s.u.).</li>
      </ul>

      <div style={H}>Import (drag+drop)</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}><strong>Rasterbild</strong>: gedimmte Referenz-/Pausschicht (kein Auto-Vektor — würde das Budget sprengen); Stroke manuell drüberziehen.</li>
        <li style={LI}><strong>.svg</strong>: Pfade in fill/stroke parsen; <strong>prominente, live Node-Zahl</strong> (farbcodiert grün&lt;36 · amber&lt;60 · rot&gt;60).</li>
      </ul>

      <div style={H}>Cleaner (Fremd-SVGs)</div>
      <p style={P}>Erweitert den bestehenden Registry-Cleaner (svg_cleaned). Illustrator: defs/ids/data-name raus, Transforms einbacken, Stellen runden, auf 48/24 + fill #fff / stroke #000 normalisieren. Tabler (auch verändert): currentColor→#000, stroke-basiert auf die Konvention heben.</p>
      <p style={P}><strong>Ausnahme „Logo (verbatim)"</strong>: Kunden-/Logo-Icons (z.B. <code>rep-gruenberg</code>) tragen die <strong>Punkt-Begrenzung hart</strong> (48/24, Node-Budget), folgen aber <strong>nicht</strong> zwingend unserer Layer-Konvention (<code>fill</code>/<code>stroke</code>, Layerzahl). Der Cleaner normalisiert sie <strong>nicht</strong> auf die Konvention, die „Layer fehlt"-Warnung ist erwartet. <strong>Klassifizieren</strong> (ist es ein Logo?) = Origin/Sensus-Core-Metadatum · <strong>Honorieren</strong> (Recolor überspringen) = Deep-Shell.</p>

      <div style={H}>Node-Budget &amp; Begrenzer</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}>max. <strong>60 Nodes</strong> pro Einzel-Icon (hart) · Ø pro Set ~<strong>40</strong>.</li>
        <li style={LI}><strong>Node-Begrenzer = DP-Vereinfachung</strong> (gleiche Technik wie der Netz-Resampler), v.a. NACH Stroke→Fill/Boolean; auch als „Kopieren + auf ≤ N reduzieren".</li>
        <li style={LI}><em>Ist-Stand Katalog (37 Icons): Ø ~38, max 96 — 4 über 60.</em></li>
      </ul>

      <div style={H}>Export &amp; Provenienz</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}>robust per <strong>Download / Commit nach data/icons</strong> (Datei-Drag-out ist auf Safari unzuverlässig).</li>
        <li style={LI}>Provenienz (Ersteller · Rechte-Hinweis · Datum · SCIM3 · diesenpark.com), einmal in Settings befüllt, auto in die <strong>Quell-SVG</strong> (&lt;metadata&gt;).</li>
        <li style={LI}>Build-Cleaner <strong>streift die Metadaten fürs Runtime-Glyph wieder ab</strong> (Quelle = mit Provenienz, ausgeliefert = winzig).</li>
      </ul>

      <div style={H}>Speicher (drei getrennte Plätze, derselbe Cleaner)</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={LI}><strong><code>data/icons/</code></strong> → Katalog/POI/Rep-Icons. <em>Konsument:</em> der <strong>Katalog</strong> (Draco · Geo).</li>
        <li style={LI}><strong><code>data/icons-shell/</code></strong> → <strong>High-Shell-Assets</strong> (Ziel-App-Buttons). Representation-<strong>un</strong>abhängig, <strong>NICHT</strong> über den origin-capsuler. <em>Konsument:</em> <strong>High-Shell</strong> (P07).</li>
        <li style={LI}><strong><code>data/icons-scim/custom/(packages/)</code></strong> → <strong>SCIM-Editor-eigene Icons</strong> inkl. Package-Icons. <em>Konsument:</em> Cepheus · System.</li>
      </ul>
      <p style={P}>System-/in-Verwendung-Icons (z.B. Package-Icons) als <strong>unlöschbar / „in Verwendung"</strong> markieren — Schutz-Konzept noch zu bauen.</p>
    </div>
  );
}
