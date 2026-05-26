# Backlog · UX-Schulden + strukturelle TODOs

Sammlung, was später passieren soll, ohne dass es jetzt jeder Chat neu
ausgraben muss. Reihenfolge ist grob nach Dringlichkeit, kein Auftrag.

---

## UX — Katalog-Editor

### Cluster-Ansicht pro Cluster
Es fehlt eine eigene Sicht „Cluster XYZ", in der ausschliesslich die
Mitglieder dieses einen Clusters sichtbar sind. Heute muss man durch
die Subkategorien-Sektionen blättern und manuell die Cluster-Spalte
abscannen.

### Cluster-Name ist verwirrend
Warum braucht es einen Cluster-Namen (String) als Verknüpfung? Der
Operator-Flow ist nicht intuitiv: man muss in der Cluster-Spalte einen
String setzen, dieser String muss exakt zwischen Member-POIs und
Ghost-POI matchen, und im Cluster-Section-Block am Plan-md-Ende
nochmal auftauchen. Drei Stellen, die manuell synchron bleiben muessen.

Spaeter: Cluster als first-class Objekt (z.B. Cluster-Picker mit
Dropdown statt Freitext-Feld), oder visuelle Cluster-Bildung im
Karten-Tab durch Klick-Auswahl.

### System-Vorschlag fuer Cluster
Zukuenftig soll das System Cluster-Bildung selbst vorschlagen:
"diese 5 POIs liegen <30 m beieinander, willst du sie clustern?".
Heute legt der Operator Cluster manuell an.

---

## Struktur — Bugs / Inkonsistenzen

### Serializer blendet Ghosts aus Tabelle 1 aus
`poiCatalog.serializer.ts:65` ueberspringt POIs mit
`subcategory='Cluster'` aus der POI-Liste. Kommentar darueber sagt
das Gegenteil ("Cluster-Subkategorie wird mit ausgegeben").

Folge: Ghost-POIs erscheinen nur in der Cluster-Section am md-Ende,
nicht in der Hauptliste. Operator sieht sie nicht beim Durchscrollen.

Fix: eigene `### Cluster`-Sektion in Tabelle 1 ausgeben.

### Multi-Identity in einem Cluster wird nicht gemeldet
Wenn zwei Member-POIs `is_cluster_identity=true` im selben Cluster
tragen, faellt das beim Parsen nicht auf. Der Parent-Lookup fuer
Ghosts (`.find()`) liefert den ersten Treffer — funktioniert, ist
aber undefiniert.

Fix: Parser-Warning, wenn `is_cluster_identity` mehr als einmal pro
Cluster gesetzt ist.

### Merged-State-Warnungen fehlen in der UI
Die gelbe Warnungen-Box im Katalog-Tab zeigt nur `baseCatalog.warnings`
(Parser-Output der md). Editor-Edits im localStorage werden nicht
gegen die Cluster-Regeln validiert. Ein Ghost ohne `cluster` oder
ohne Parent erscheint heute ohne Warnung im UI.

Fix: Re-Validation auf dem gemergten Stand, Warnungen-Box zeigt
beides.

---

## Bekannte md-Inkonsistenzen (Stand 2026-05-26)

Grünberg-Plan, vom User zu beheben:
- Sender-Cluster hat zwei Identity-POIs: `sender Grünberg Sender`
  und `aussichtspunkt+ Grünberg 986 m`. Nur einer darf die ID-
  Checkbox tragen.
- `strand-buffet Strandbuffet` hat cluster=`Badewiese Weyer`,
  alle anderen Mitglieder haben cluster=`Freibad Weyer`. Auf einen
  Namen vereinheitlichen.

---

## Backlog-Pflege

- Eintraege beim Erledigen nicht loeschen, sondern als
  `**erledigt:** <datum>` markieren — bleibt nachvollziehbar.
- Neue Eintraege bekommen Tag + kurze Begruendung.
- Diese Datei ist Soll-Quelle fuer „was kommt noch", nicht die
  HANDOVER (die ist Tagesnotiz).
