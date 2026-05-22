# Kurzkonzept SCIM-Leaflet-Routenlogik

## 1. Zielbild

Ziel ist eine Leaflet-basierte Kartenanwendung, in der ein räumlich begrenzter Bereich definiert wird. Das darin relevante Wegenetz wird extrahiert, bei Bedarf mit einem Pufferbereich abgefragt und in eine Graphstruktur aus Knoten und Kanten überführt.

Die Bearbeitung, Analyse und Routenlogik erfolgt nicht in Leaflet selbst, sondern in der SCIM-Graphengine. Dort werden Knoten und Kanten regelbasiert bewertet, transformiert, ergänzt, maskiert oder für Routenvorschläge gewichtet.

Das Ergebnis wird anschließend als eigenes, angepasstes Wegenetz wieder in Leaflet dargestellt – zum Beispiel als GeoJSON-, Vektor- oder Tile-Layer. Leaflet übernimmt Auswahl, Darstellung und Ausgabe; das ursprüngliche Karten- oder Wegelayer kann im definierten Bereich ausgeblendet oder durch das eigene Overlay ersetzt werden.

## 2. SCIM-Ebenenmodell

SCIM wird als mehrstufiges System verstanden. Die einzelnen Ebenen unterscheiden sich danach, ob dort das System konzipiert, technisch justiert, regional befüllt, zentral repräsentiert oder für Ziel-App-User dargestellt wird.

### 2.1 System-Build

**System-Build** bezeichnet die Konzept-, Regel- und Modellaufbau-Ebene. Hier werden die fachlichen und technischen Grundlagen von SCIM definiert.

Dazu gehören:

- Zielbild
- Begriffe
- Regelwerke
- Graphlogik
- Aufenthalts-/Bewegungslogik
- Routenlogik
- Datenmodell
- Architekturentscheidungen

Diese Ebene entspricht der Entwurfs- und Spezifikationsarbeit, also auch der hier geführten Konzeptarbeit.

### 2.2 System-Adjust – SCIM3 Atlas Console

**System-Adjust** bezeichnet die systemweite technische Kalibrierungs- und Einstellungsebene in der **SCIM3 Atlas Console**.

Dazu gehören:

- globale Systemparameter
- technische Grenzwerte
- Datenschutz- und Mindestaggregationsgrenzen
- Defaultwerte
- Vorschlagslogiken für POI-Kandidaten
- Systemprofile
- Modell- und Regelversionierung

Diese Ebene legt fest, welche Parameterbereiche, Vorschlagslogiken und Sicherheitsgrenzen für nachgelagerte Ebenen gelten.

### 2.3 Regio-Content – Path-Works Regio-Dashboard

**Regio-Content** bezeichnet die regionale Inhalts-, POI- und Parameterpflege im **Path-Works Regio-Dashboard**.

Dazu gehören:

- POI-Kandidaten prüfen
- POIs freigeben oder ablehnen
- Aufenthaltsradien setzen
- regionale Vergleichsparameter anpassen
- lokale Staustellen prüfen
- regionale Routenvorschlagsparameter einstellen
- Parameterstände freigeben

Diese Ebene ist die regionale Operator-Ebene. Sie arbeitet innerhalb der Grenzen, die durch System-Adjust vorgegeben werden.

### 2.4 Mother-Representation – Sensus-Core App

**Mother-Representation** bezeichnet die zentrale SCIM-Repräsentation in der **Sensus-Core App**. Sie führt freigegebene SCIM-Zustände, Runtime-Load-Signale und Graphbewertungen zusammen.

Dazu gehören:

- Laufzeitbewertung
- aktuelle SCIM-Zustände
- Bewegungs- und Aufenthaltslayer
- routenrelevante Abschnittsbewertungen
- zentrale Darstellung des freigegebenen SCIM-Zustands
- Übergabe oder Reduktion für Child-Repräsentationen

Diese Ebene bildet die primäre Runtime- und Darstellungsebene.

### 2.5 Representation – Sensus-Core App-Child

**Representation** bezeichnet die abgeleitete oder reduzierte Darstellung in der **Sensus-Core App-Child**.

Dazu gehören:

- nutzerbezogene Darstellung
- reduzierte oder gefilterte SCIM-Ergebnisse
- konkrete Routenvorschläge
- freigegebene Overlays
- keine oder nur eingeschränkte Systemparameter
- keine Operator- oder Build-Funktion

Diese Ebene ist die konsumierende Endnutzer- oder Child-Darstellungsebene.

## 3. System-Build-Logik

Die **System-Build-Logik** beschreibt, wie die SCIM-Grundlogik fachlich und technisch aufgebaut wird, bevor sie in System-Adjust, Regio-Content, Mother-Representation und Representation angewendet wird.

System-Build ist keine Laufzeitkomponente und keine Operator-Oberfläche. System-Build ist die Ebene, auf der die Begriffe, Regeln, Datenmodelle, Systemgrenzen und Übergabelogiken von SCIM definiert werden.

### 3.1 Zweck von System-Build

System-Build legt fest:

- welche Objekte SCIM kennt,
- welche Begriffe verbindlich verwendet werden,
- welche Regeln nicht veränderbar sind,
- welche Parameter später einstellbar sind,
- welche Datenstrukturen zwischen den SCIM-Ebenen übergeben werden,
- welche Logik in System-Adjust, Regio-Content, Mother-Representation und Representation ausgeführt wird.

### 3.2 Build-Artefakte

System-Build erzeugt mindestens folgende Artefakte:

**Begriffsmodell**  
Definitionen für Knoten, Kanten, Shape-Knoten, topologische Knoten, POIs, Aufenthaltsbereiche, Bewegungskanten, routenrelevante Abschnitte und Repräsentationsebenen.

**Regelmodell**  
Verbindliche Regeln für Aufenthalt, Bewegung, Darstellung, Routenberechnung, User-Einstellungen, Datenschutz und Parameterfreigabe.

**Graphmodell**  
Festlegung, wie das Wegenetz in Knoten, Kanten, Shape-Punkte, POI-Bezüge, Aufenthaltsmasken und routenrelevante Abschnitte überführt wird.

**Parametermodell**  
Trennung zwischen festen Systemregeln, systemweit justierbaren Parametern, regional einstellbaren Parametern und nutzerbezogenen Einstellungen.

**Ebenenmodell**  
Festlegung, welche Verantwortung System-Adjust, Regio-Content, Mother-Representation und Representation jeweils übernehmen.

**Übergabemodell**  
Definition, welche Daten und Parameter zwischen den Ebenen weitergegeben werden, zum Beispiel von System-Adjust an Regio-Content oder von Regio-Content an Mother-Representation.

### 3.3 System-Build-Ablauf

Der System-Build folgt einem mehrstufigen Ablauf:

1. **Zielbild definieren**  
   Festlegen, welches SCIM-Problem gelöst werden soll und welche Rolle Leaflet, Graphengine, Regio-Dashboard und Sensus-Core übernehmen.

2. **Begriffe normalisieren**  
   Einheitliche Terminologie für Graphobjekte, POIs, Aufenthalte, Bewegung, Routenbewertung und Repräsentationsebenen festlegen.

3. **Grundregeln formulieren**  
   Nicht veränderbare Systemregeln definieren, zum Beispiel: Aufenthalt nur innerhalb operator-bestätigter POI-Radien, Aufenthalt maskiert Bewegung, keine Doppelverwertung derselben Signale.

4. **Parameterbereiche bestimmen**  
   Festlegen, welche Werte systemweit, regional oder nutzerbezogen einstellbar sind und welche Mindest- oder Höchstgrenzen gelten.

5. **Berechnungsebenen trennen**  
   Unterscheiden, welche Logik in System-Adjust, welche im Regio-Dashboard, welche in der Mother-Representation und welche in der Representation ausgeführt wird.

6. **Darstellungs- und Entscheidungsebenen trennen**  
   Festlegen, welche Werte nur sichtbar gemacht werden und welche Werte tatsächlich Routenvorschläge beeinflussen.

7. **Offene Punkte als Parameterrahmen ausweisen**  
   Fragen, die regional oder praktisch variieren, nicht als feste Vorabentscheidung behandeln, sondern als konfigurierbare Parameter mit Systemgrenzen definieren.

8. **Übergabe an System-Adjust vorbereiten**  
   System-Build liefert die Modell-, Regel- und Parametergrundlage, die in der SCIM3 Atlas Console technisch kalibriert und versioniert wird.

### 3.4 Abgrenzung zu anderen SCIM-Ebenen

**System-Build** definiert die Logik.  
**System-Adjust** kalibriert die Logik systemweit.  
**Regio-Content** befüllt und justiert die Logik regional.  
**Mother-Representation** verarbeitet freigegebene Zustände in der Laufzeit.  
**Representation** zeigt reduzierte, nutzergeeignete Ergebnisse.

System-Build verändert keine Live-Daten und verarbeitet keine Runtime-Load-Signale. Es legt fest, wie diese später verarbeitet werden dürfen.

### 3.5 Leitsatz System-Build

> System-Build erzeugt die verbindliche SCIM-Grundlogik. Es definiert Begriffe, Regeln, Datenmodelle, Parameterrahmen und Zuständigkeiten, bevor diese in System-Adjust technisch kalibriert, in Regio-Content regional befüllt und in den Representation-Ebenen laufzeitbezogen genutzt werden.

## 4. Systemarchitektur Leaflet / SCIM / Overlay

**Leaflet**  
Bereichsauswahl, Kartendarstellung und Ausgabe des bearbeiteten Overlay-Netzes.

**SCIM-Graphengine**  
Extraktion, Klassifikation, Graphbearbeitung, Aufenthaltslogik, Bewegungsauswertung, Routenbewertung und regelbasierte Vorschlagslogik.

**Leaflet-Overlay**  
Visualisierung des bearbeiteten Graphen als angepasstes Netz, zum Beispiel als GeoJSON-, Vektor- oder Tile-Layer.

**Architektur in Kurzform:**

> System-Build → Definition der SCIM-Logik  
> System-Adjust / SCIM3 Atlas Console → systemweite Kalibrierung  
> Regio-Content / Path-Works Regio-Dashboard → regionale POI-, Radius- und Parameterpflege  
> Mother-Representation / Sensus-Core App → zentrale Runtime-Repräsentation  
> Representation / Sensus-Core App-Child → reduzierte Ziel-App-Darstellung und Routennutzung

## 5. Grundbegriffe

**Topologischer Knoten**  
Ein routingrelevanter Netzknoten, zum Beispiel Kreuzung, Abzweigung, Wegende, Verbindungspunkt oder anderer Entscheidungspunkt im Wegenetz.

**Shape-Knoten / geometrischer Stützpunkt**  
Ein Punkt, der primär den geometrischen Verlauf einer Linie beschreibt. Shape-Knoten haben ohne zusätzliche Bedeutung keine eigene Routing- oder Entscheidungsfunktion.

**POI-Knoten**  
Ein Knoten mit Bezug zu einem Point of Interest, zum Beispiel Rastplatz, Hütte, Aussichtspunkt, Parkplatz oder anderer relevanter Ort.

**POI-topologischer Knoten**  
Ein topologischer Knoten mit zusätzlichem POI-Bezug.

**Operator-bestätigter / freigegebener POI**  
Ein POI, der im Path-Works Regio-Dashboard durch einen Operator geprüft, bestätigt und mit einem gültigen Aufenthaltsradius versehen wurde.

**Aufenthaltsbereich**  
Ein Bereich um einen operator-bestätigten POI, in dem eine Funknetz-Kumulation als Aufenthalt klassifiziert werden darf. Aufenthaltsbereiche werden durch bestätigte POI-Radien und erkannte Kumulationen bestimmt.

**Bewegungskante**  
Eine Kante oder ein Kantenabschnitt des Graphen, der nicht als Aufenthaltsbereich maskiert ist und deshalb für Bewegungsauslastung ausgewertet werden kann.

**Routenrelevanter Abschnitt**  
Ein für die Routenberechnung zusammengefasster Abschnitt zwischen topologischen Kreuzungspunkten. Er kann aus mehreren Bewegungskanten bestehen.

## 6. Grundprinzipien der SCIM-Logik

### 6.1 Extraktionsreihenfolge

Die Extraktion der SCIM-Arbeitsdaten folgt einer festen Reihenfolge:

1. **Representation-Boundary definieren**  
   Zunächst wird die räumliche Grenze der jeweiligen Representation bestimmt. Diese Grenze kann durch eine geometrische Fläche, einen Kartenausschnitt oder eine definierte Region beschrieben werden.

2. **POIs innerhalb der Boundary extrahieren**  
   Innerhalb dieser Boundary werden relevante POI-Kandidaten und bereits operator-bestätigte POIs ermittelt.

3. **Wanderrelevante Segmente extrahieren**  
   Danach werden die wanderrelevanten OSM-Wegsegmente innerhalb der Boundary und eines definierten Puffers extrahiert. Diese Segmente bilden die zentrale Arbeitsgrundlage für SCIM.

4. **Graphstruktur erzeugen**  
   Die wanderrelevanten Segmente werden in eine Graphstruktur aus topologischen Knoten, Shape-Knoten, Kanten und routenrelevanten Abschnitten überführt.

5. **SCIM-Auslastung und Routenkorrelation anwenden**  
   Erst auf dieser Graphstruktur werden Aufenthaltsbereiche, Bewegungsauslastungen, Maskierungen und routenbezogene Auslastungswerte berechnet.

Festlegung:

> Wanderrelevante Segmente sind für SCIM essenziell. Sie müssen unmittelbar nach der Definition der Representation-Boundary und der Extraktion der enthaltenen POIs ermittelt werden, weil auf ihnen sowohl die Auslastungsdarstellung als auch die Alternativroutenbewertung aufbauen.

### 6.2 Verhältnis zu bestehenden Routingberechnungen

SCIM ersetzt keine etablierten Routingberechnungen für Basiswerte wie Länge, Zeit, Höhenprofil oder Wegführung. Diese Werte sollen aus bestehenden Routing- oder Kartenangeboten übernommen oder angebunden werden.

SCIM ergänzt diese bestehenden Routendaten um eine zusätzliche Bewertungsdimension: die Auslastung.

Festlegung:

> Routen werden nicht primär durch SCIM neu erfunden. Bestehende Berechnungen und Angebote für Länge, Zeit, Wegverlauf, Höhenprofil und ähnliche Routeneigenschaften können übernommen werden. SCIM korreliert diese Routenoptionen zusätzlich mit Bewegungsauslastung, Aufenthaltsbereichen und userseitiger Auslastungstoleranz.

Konsequenz:

> Die User-Einstellung zur verträglichen Auslastung beeinflusst vor allem die Sortierung, Gewichtung, Abwertung oder den Ausschluss von Routenoptionen. Sie ersetzt nicht die klassischen Routingmetriken, sondern ergänzt sie.

### 6.3 Allgemeine SCIM-Grundlogik

Die SCIM-Engine bildet eine räumlich-topologische Zuordnung zwischen Funknetz-Kumulationen, POIs, Knoten, Kanten und Graphsegmenten des Wegenetzes. Auf Basis dieser Zuordnung werden Knoten und Kanten bewertet und regelbasiert transformiert.

Die SCIM-Engine arbeitet nicht primär auf rein geometrischen Stützpunkten des Linienverlaufs, sondern auf topologisch relevanten Netzknoten und den dazwischenliegenden Graphsegmenten. Geometrische Stützpunkte beschreiben nur die Form eines Weges; topologische Knoten beschreiben die tatsächliche Verzweigungs-, Verbindungs- und Entscheidungsstruktur des Wegenetzes.

Zentrales Prinzip:

> Aufenthalt maskiert Bewegung.  
> Bewegung wird nur dort ausgewertet, wo Kanten oder Kantenabschnitte nicht einem Aufenthaltsbereich zugeordnet sind.

## 7. Regeln A – Aufenthalt

**A1 – POI-Radius als Gültigkeitsbereich**  
Jeder operator-bestätigte POI erhält einen definierten Aufenthaltsradius. Eine Funknetz-Kumulation darf nur dann als Aufenthalt klassifiziert werden, wenn sie innerhalb dieses Radius liegt. Kumulationen außerhalb des POI-Radius sind von der Aufenthaltsklassifizierung ausgeschlossen.

**A2 – Aufenthaltsklassifizierung nur bei POI-Bezug**  
Erkennt die SCIM-Engine eine Funknetz-Kumulation, wird diese nur dann als Aufenthalt diagnostiziert, wenn sie einem POI oder einem POI-bezogenen Knoten innerhalb des gültigen POI-Radius räumlich zugeordnet werden kann.

**A3 – Isolierung des Aufenthaltsbereichs**  
Wird eine Kumulation als Aufenthalt klassifiziert, markiert die SCIM-Engine die betroffenen Kanten oder Kantenabschnitte im Umfeld des POI als Aufenthaltsbereich. Die Isolierung kann vom POI bis zum nächsten Shape-Knoten, topologischen Knoten oder einem definierten Grenzknoten im Umfeld der Kumulation reichen.

**A4 – Ausschluss von Bewegungsauslastung**  
Kanten oder Kantenabschnitte, die einem Aufenthaltsbereich zugeordnet sind, werden von der Aggregation der Bewegungsauslastung ausgeschlossen. Signale, die einem Aufenthalt zugeordnet wurden, dürfen nicht zusätzlich als Bewegung entlang derselben Kanten gewertet werden.

**A5 – Darstellung von Aufenthalt**  
POI-bezogene Aufenthalte werden punkt- oder flächenbezogen um POIs dargestellt. Die Darstellung kann abhängig von Signalanzahl, Dichte oder Intensität über Radius, Farbe, Transparenz oder andere visuelle Merkmale erfolgen.

**Leitsatz Aufenthalt:**

> POI-Kumulationen innerhalb definierter POI-Radien erzeugen Aufenthaltsbereiche. Diese Aufenthaltsbereiche maskieren betroffene Kanten gegen Bewegungsauslastung.

## 8. Regeln B – Bewegung und Darstellung

**B1 – Definition von Bewegungskanten**  
Als Bewegungskanten gelten alle Kanten oder Kantenabschnitte des Graphen, die nicht einem POI-bezogenen Aufenthaltsbereich zugeordnet und nicht durch die Aufenthaltslogik maskiert wurden.

**B2 – Kantenbezogene Auslastungsberechnung**  
Die SCIM-Engine ordnet Funknetz-Kumulationen außerhalb gültiger Aufenthaltsbereiche den jeweils betroffenen Bewegungskanten zu. Für jede Bewegungskante wird daraus ein eigener Auslastungswert berechnet.

**B3 – Übersetzung in Farbwerte**  
Jeder kantenbezogene Auslastungswert wird in einen Farbwert oder eine Intensitätsstufe übersetzt. Dadurch entsteht zunächst eine kantenweise Visualisierung der Bewegungsauslastung.

**B4 – Aggregation zu Farbverläufen**  
Benachbarte Bewegungskanten mit ihren jeweiligen Farbwerten können für die Darstellung zu kontinuierlichen Farbverläufen aggregiert, geglättet oder interpoliert werden. Die zugrunde liegende Bewertung bleibt jedoch kantenbezogen erhalten.

**B5 – Keine Vermischung mit Aufenthalt**  
Signale, die bereits einem Aufenthaltsbereich zugeordnet wurden, dürfen nicht zusätzlich in die Auslastungsberechnung von Bewegungskanten einfließen. Aufenthaltslogik und Bewegungsauslastung bleiben rechnerisch getrennt.

**Leitsatz Bewegung und Darstellung:**

> Nicht maskierte Kanten werden als Bewegungskanten visualisiert. Jede Bewegungskante erhält einen eigenen Auslastungswert, der in einen Farbwert übersetzt wird. Benachbarte Kantenwerte können darstellerisch zu Farbverläufen verdichtet werden, ohne die kantenbezogene Bewertung aufzugeben.

## 9. Regeln R – Routenberechnung

**R1 – Trennung von Darstellung und Routenberechnung**  
Die farbliche Darstellung der Bewegungsauslastung erfolgt kantenbezogen und dient der Visualisierung. Die Routenberechnung arbeitet zusätzlich mit routenrelevanten Abschnitten zwischen topologischen Kreuzungspunkten. Eine Kante oder ein Abschnitt kann sichtbar dargestellt bleiben, obwohl er für bestimmte Routenoptionen abgewertet oder ausgeschlossen wird.

**R2 – Abschnittsbildung zwischen Kreuzungspunkten**  
Für die Routenberechnung fasst die SCIM-Engine zusammenhängende, nicht maskierte Bewegungskanten zwischen zwei topologischen Kreuzungspunkten zu einem routenrelevanten Abschnitt zusammen.

**R3 – Durchschnittliche Bewegungsauslastung je Abschnitt**  
Für jeden routenrelevanten Abschnitt berechnet die SCIM-Engine eine durchschnittliche Bewegungsauslastung aus den zugeordneten Bewegungskanten. Dieser Wert dient als Bewertungsgröße für die Auswahl oder Gewichtung von Routenoptionen.

**R4 – Prüfung auf berührte Aufenthaltsbereiche**  
Die SCIM-Engine prüft zusätzlich, ob ein routenrelevanter Abschnitt maskierte Aufenthaltsbereiche berührt, schneidet oder an diese angrenzt. Wird ein Aufenthaltsbereich berührt, wird dessen Aufenthaltsbelastung als eigener, vom Bewegungswert getrennter Kontextwert am Abschnitt gespeichert.

**R5 – Getrennte Bewertungswerte**  
Die durchschnittliche Bewegungsauslastung eines Abschnitts und die Aufenthaltsbelastung berührter oder angrenzender Aufenthaltsbereiche werden getrennt berechnet und gespeichert. Dadurch kann die Routenberechnung zwischen Bewegungsauslastung auf dem Weg und Belastung durch nahegelegene Aufenthaltsbereiche unterscheiden.

**R6 – Abwertung oder Ausschluss aus dem Routenangebot**  
Erreicht oder überschreitet ein routenrelevanter Abschnitt den eingestellten Grenzwert für Bewegungsauslastung, kann er in der Routenberechnung abgewertet oder aus dem Routenangebot ausgeschlossen werden. Berührt der Abschnitt zusätzlich einen Aufenthaltsbereich, dessen Aufenthaltsbelastung den eingestellten Grenzwert erreicht oder überschreitet, kann dies ebenfalls zu einer Abwertung oder zum Ausschluss führen.

**R7 – Keine Rückwirkung auf die Darstellung**  
Die Entscheidung, einen Abschnitt für die Routenberechnung abzuwerten oder auszuschließen, verändert nicht zwingend seine Darstellung in Leaflet. Die Darstellung kann weiterhin die tatsächliche Auslastung zeigen, während die Routenlogik denselben Abschnitt aufgrund der Bewertungsregeln anders behandelt.

**Leitsatz Routenberechnung:**

> Die Darstellung zeigt Auslastung. Die Routenberechnung bewertet Zumutbarkeit. Ein Abschnitt kann visuell sichtbar bleiben, aber für Routenvorschläge abgewertet oder ausgeschlossen werden.

## 10. Regeln U – User-Einstellungen

**U1 – Einstellbare Schwellenwerte**  
Der Ziel-App-User kann mindestens zwei Schwellenwerte einstellen: einen Grenzwert für die zulässige durchschnittliche Bewegungsauslastung eines routenrelevanten Abschnitts und einen Grenzwert für die zulässige Aufenthaltsbelastung berührter oder angrenzender Aufenthaltsbereiche.

**U2 – Wirkung auf Routenvorschläge**  
Die User-Einstellungen bestimmen nicht zwingend die Darstellung, sondern vor allem die Bewertung, Abwertung oder den Ausschluss von Routenabschnitten in der Vorschlagslogik.

**U3 – Trennung von Visualisierung und Vorschlagslogik**  
Eine Kante oder ein Abschnitt kann weiterhin mit seiner tatsächlichen Auslastung in Leaflet dargestellt werden, auch wenn er aufgrund der User-Einstellungen für Routenvorschläge ausgeschlossen oder nachrangig behandelt wird.

**Leitsatz User-Einstellungen:**

> User-Einstellungen steuern die Zumutbarkeit und Auswahl von Routenoptionen, nicht zwingend die sichtbare Kartenvisualisierung.

## 11. Laufzeit- und Repräsentationsarchitektur

Die SCIM-Logik wird in der Laufzeit nicht mehr nur als einfache Ziel-App-Komponente verstanden, sondern entlang des SCIM-Ebenenmodells ausgeführt.

Die **Mother-Representation** in der Sensus-Core App kann freigegebene SCIM-Zustände aus System-Adjust und Regio-Content übernehmen, Runtime-Load-Signale verarbeiten und daraus aktuelle Bewegungsauslastungen, Aufenthaltsklassifizierungen und Routenvorschläge bilden.

Die **Representation** in der Sensus-Core App-Child konsumiert daraus eine reduzierte, freigegebene und nutzergeeignete Darstellung. Sie zeigt nicht zwingend alle technischen SCIM-Werte, sondern nur die für Ziel-App-User vorgesehenen Overlays, Hinweise und Routenvorschläge.

Optional kann ein Backend aggregierte SCIM-Zustände bereitstellen oder konsolidieren, während die Mother-Representation lokale oder laufzeitnahe Bewertungen vornimmt.

**Architektur in Kurzform:**

> System-Adjust → liefert systemweite Parameter und Grenzen  
> Regio-Content → liefert freigegebene regionale POIs, Radien und Parameter  
> Mother-Representation → verarbeitet Runtime-Load-Signale und bildet den aktuellen SCIM-Zustand  
> Representation → zeigt freigegebene SCIM-Ergebnisse und Routenvorschläge für Ziel-App-User

## 12. Festlegungen und Arbeitsannahmen

### 12.1 Relevante POIs, OSM-Vorschläge und Aufenthaltsradien

SCIM benötigt zunächst keine vollständige OSM-POI-Klassifizierung als alleinige Regelgrundlage. Relevant für die Aufenthaltslogik sind nur POIs, denen durch einen Operator im Path-Works Regio-Dashboard ein Aufenthaltsradius zugewiesen wurde.

OSM-POIs können als Ausgangsdaten oder Kandidaten dienen. SCIM soll auf Basis von OSM-Tags automatisiert POI-Kandidaten erkennen und optionale Standardradien vorschlagen. Diese Vorschläge sind jedoch nicht verbindlich und erzeugen noch keinen aktiven Aufenthaltsbereich.

Erst die manuelle Markierung durch einen Operator im Regio-Dashboard und die Bestätigung oder Anpassung eines POI-Radius macht einen POI für SCIM aufenthaltsrelevant.

Technische Anforderungen:

> SCIM muss POI-Kandidaten aus OSM oder anderen Quelldaten vorerkennen und dem Regio-Dashboard zur Prüfung bereitstellen können.

> Das Regio-Dashboard muss es einem Operator ermöglichen, einen POI als aufenthaltsrelevant zu aktivieren und ausgehend vom Zentrum dieses POI einen Aufenthaltsradius zu definieren, zu übernehmen oder anzupassen.

> Der bestätigte POI-Radius bildet den gültigen räumlichen Bereich, innerhalb dessen Funknetz-Kumulationen als Aufenthalt klassifiziert werden dürfen.

Konsequenz:

> Nicht der OSM-POI-Typ entscheidet abschließend über Aufenthaltsrelevanz, sondern die explizite Bestätigung des POI durch einen Operator im Regio-Dashboard und das Vorhandensein eines bestätigten POI-Aufenthaltsradius.

Festlegung:

> SCIM soll auf Basis von OSM-Tags oder anderen Quelldaten POI-Kandidaten automatisiert vorbereiten und dazu optionale Standardradien vorschlagen. Dabei sollen sowohl sicher relevante als auch möglicherweise relevante POIs als Kandidaten berücksichtigt werden. Diese Vorschläge werden im Regio-Dashboard durch einen Operator geprüft, übernommen oder angepasst. Erst nach dieser Bestätigung wird der POI für die Aufenthaltslogik freigegeben.

**Sicher relevante OSM-POI-Kandidaten für Aufenthaltsbereiche:**

- `tourism=alpine_hut`
- `tourism=wilderness_hut`
- `tourism=picnic_site`
- `tourism=viewpoint`
- `amenity=shelter`
- `amenity=restaurant`
- `amenity=cafe`
- `amenity=drinking_water`
- `amenity=toilets`
- `natural=peak`
- `natural=waterfall`
- `leisure=picnic_table`, sofern im Datensatz vorhanden

**Möglicherweise relevante OSM-POI-Kandidaten für Aufenthaltsbereiche:**

- `amenity=parking`
- `highway=bus_stop`
- `public_transport=platform`
- `railway=station`
- `aerialway=station`
- `tourism=information`
- `information=guidepost`
- `information=board`
- `information=map`
- `shop=convenience`
- `shop=bakery`
- `historic=wayside_cross`
- `man_made=cross`
- `man_made=tower`
- `natural=spring`
- `natural=cave_entrance`

**Nicht automatisch aufenthaltsrelevant:**

- Gefahren-, Sperr- und Barrierehinweise, zum Beispiel `hazard=*`, `barrier=*`, `ford=*`
- rein technische Objekte ohne Aufenthaltsbezug
- reine Wegmarkierungen ohne Aufenthaltsfunktion

Diese Tags dienen nur der Kandidatenbildung. Die Aufenthaltsrelevanz entsteht erst durch Operator-Bestätigung im Regio-Dashboard.

### 12.2 Aufenthaltsbelastungswert

Der Aufenthaltsbelastungswert wird zunächst über Anzahl und Dichte der Runtime-Load-Signale innerhalb eines bestätigten POI-Radius bestimmt. Die Dauer einer Kumulation wird vorerst nicht als eigene Bewertungsgröße berücksichtigt.

Eine Kumulation innerhalb eines POI-Radius wird nicht automatisch als Aufenthalt klassifiziert. Sie wird nur dann als Aufenthalt gewertet, wenn ihre Dichte die Dichte der angrenzenden Bewegungskanten innerhalb eines definierten Vergleichsradius im Verhältnis von mindestens **1 : 1,6** überschreitet. Das bedeutet: Die POI-Kumulationsdichte muss mindestens 1,6-mal so hoch sein wie die Vergleichsdichte angrenzender Bewegungskanten.

Technische Ergänzung:

> SCIM soll bei hoher Gesamtlast eine Bewegungsanalyse auslösen. Dabei werden kurz getaktete Standortabfragen genutzt, um zu erkennen, welche Geräte sich bewegen und welche Geräte nur schwache oder keine Bewegung zeigen.

> Schwache oder keine Bewegung im Umfeld operator-bestätigter POIs dient zur Plausibilisierung und Definition des Aufenthaltsbereichs bzw. des wirksamen POI-Radius.

> Stillstände ohne POI-Bezug werden nicht als Aufenthalt klassifiziert, sondern zunächst als vorläufige Staustellen oder Stauindikatoren markiert.

Arbeitsannahme:

> Der Vergleichsradius soll zunächst als dynamischer Radius definiert werden: Er entspricht dem bestätigten POI-Aufenthaltsradius zuzüglich eines äußeren Vergleichssaums von 25 Metern. Innerhalb dieses Saums wird die Dichte der angrenzenden Bewegungskanten als Vergleichswert berechnet.

> Eine Kumulation gilt als Aufenthalt, wenn die POI-Kumulationsdichte mindestens das Verhältnis **1 : 1,6** gegenüber der Dichte angrenzender Bewegungskanten erreicht. Die POI-Dichte muss also mindestens 60 Prozent höher sein als die Bewegungsdichte im Vergleichsbereich.

### 12.3 SCIM-Ebenen, Backend und Zuständigkeiten

SCIM wird entlang des SCIM-Ebenenmodells organisiert.

**System-Build** definiert Begriffe, Regeln, Datenmodell, Graphlogik und Systemarchitektur.

**System-Adjust / SCIM3 Atlas Console** definiert systemweite Parameter, Modellgrenzen, Defaultwerte, Datenschutzgrenzen, Vorschlagslogiken und Regelversionen.

**Regio-Content / Path-Works Regio-Dashboard** pflegt regionale Inhalte und Parameter innerhalb der durch System-Adjust gesetzten Grenzen. Dazu gehören POI-Freigaben, Radien, Vergleichsparameter, Staustellenprüfung und regionale Routenvorgaben.

**Mother-Representation / Sensus-Core App** bildet den zentralen Runtime-Zustand aus freigegebenen Parametern, regionalem Content und Runtime-Load-Signalen.

**Representation / Sensus-Core App-Child** stellt die reduzierte, nutzergeeignete Ausgabe für Ziel-App-User bereit.

**Backend-SCIM / zentrale Konsolidierung** kann optional übergreifende Auslastungs- und Aufenthaltswerte konsolidieren, Plausibilisierung durchführen, Missbrauchsschutz bereitstellen und längerfristige Aggregationen speichern.

Konsequenz:

> Parameter, zu denen fachliche, regionale oder situative Unterschiede zu erwarten sind, müssen nicht final im Konzept festgelegt werden. Sie können als konfigurierbare Parameter in System-Adjust oder Regio-Content geführt werden.

Nicht beliebig konfigurierbar sind die Grundprinzipien der SCIM-Logik:

- Aufenthalt darf nur innerhalb operator-bestätigter POI-Radien klassifiziert werden.
- Aufenthalt maskiert Bewegung.
- Aufenthaltslogik und Bewegungsauslastung bleiben rechnerisch getrennt.
- Representation nutzt nur freigegebene Parameter- und Contentstände.
- Datenschutz-, Mindestaggregations- und Sicherheitsgrenzen dürfen nicht durch Operatoren unterschritten werden.

## 13. Path-Works Regio-Dashboard – UI-Spezifikation für Regio-Content

Die UI-Spezifikation beschreibt, welche Einstellungen im Regio-Dashboard möglich sein müssen, welche Werte vorgeschlagen werden und welche Systemgrenzen nicht unterschritten werden dürfen.

### 13.1 Modul: POI-Kandidaten und Freigabe

**Zweck**  
Operatoren prüfen von SCIM vorgeschlagene POI-Kandidaten und geben relevante POIs für die Aufenthaltslogik frei.

**UI-Funktionen:**

- Liste vorgeschlagener POI-Kandidaten aus OSM oder anderen Quelldaten
- Filter nach sicher relevanten und möglicherweise relevanten POI-Kandidaten
- Kartenansicht mit POI-Zentrum, vorgeschlagenem Radius und umliegenden Kanten
- Status je POI: `Vorschlag`, `freigegeben`, `abgelehnt`, `zur Prüfung`
- manuelle Freigabe eines POI als operator-bestätigter POI
- Ablehnung eines POI mit optionaler Begründung
- manuelles Hinzufügen eines POI, falls kein geeigneter OSM-POI vorhanden ist

**Einstellbare Parameter:**

- POI-Zentrum prüfen oder korrigieren
- Aufenthaltsradius setzen, übernehmen oder anpassen
- POI-Kategorie im Regio-Dashboard setzen
- Sichtbarkeit des POI für SCIM aktivieren/deaktivieren

**Feste Systemregel:**

> Ein POI wird erst durch Operator-Freigabe und bestätigten Aufenthaltsradius für die SCIM-Aufenthaltslogik wirksam.

### 13.2 Modul: Radius- und Vergleichsparameter

**Zweck**  
Operatoren konfigurieren die räumlichen Parameter, mit denen SCIM Aufenthaltsbereiche und Vergleichsbereiche berechnet.

**UI-Funktionen:**

- Anzeige des bestätigten POI-Radius
- Anzeige des äußeren Vergleichssaums
- Vorschau des resultierenden Vergleichsbereichs auf der Karte
- Warnung, wenn der Radius ungewöhnlich groß oder klein ist
- Vergleich mit angrenzenden Bewegungskanten

**Einstellbare Parameter:**

- Aufenthaltsradius je POI
- Standardradius je POI-Kandidatentyp als Vorschlagswert
- Vergleichssaum um den POI-Radius, Arbeitsannahme: `+25 m`
- Mindest- und Höchstwerte für zulässige Radien

**Feste Systemregel:**

> Kumulationen außerhalb des bestätigten POI-Radius dürfen nicht als Aufenthalt klassifiziert werden.

### 13.3 Modul: Aufenthaltsklassifizierung

**Zweck**  
Operatoren legen fest, unter welchen Bedingungen eine Kumulation innerhalb eines bestätigten POI-Radius als Aufenthalt gilt.

**UI-Funktionen:**

- Anzeige der POI-Kumulationsdichte
- Anzeige der Dichte angrenzender Bewegungskanten im Vergleichsbereich
- Anzeige des resultierenden Dichteverhältnisses
- Simulation, ob eine Kumulation nach aktuellen Parametern als Aufenthalt klassifiziert würde
- Markierung von Stillständen ohne POI-Bezug als vorläufige Staustellen oder Stauindikatoren

**Einstellbare Parameter:**

- Dichteverhältnis für Aufenthaltsklassifizierung, Arbeitswert: `1 : 1,6`
- Mindestanzahl von Signalen für eine gültige Kumulation
- Mindestdichte für Aufenthaltsklassifizierung
- Vergleichszeitfenster für die Auswertung

**Feste Systemregel:**

> Eine Kumulation innerhalb eines POI-Radius ist nicht automatisch Aufenthalt. Sie muss die Dichte angrenzender Bewegungskanten im definierten Vergleichsbereich mindestens im festgelegten Verhältnis überschreiten.

### 13.4 Modul: Bewegungsauslastung

**Zweck**  
Operatoren konfigurieren, wie Bewegungskanten bewertet und visualisiert werden.

**UI-Funktionen:**

- Anzeige nicht maskierter Bewegungskanten
- Anzeige der aktuellen Auslastungswerte je Kante
- Vorschau der Farbskala auf Bewegungskanten
- Option zur Glättung oder Interpolation benachbarter Kantenwerte
- Prüfung, welche Kanten durch Aufenthaltsbereiche maskiert sind

**Einstellbare Parameter:**

- Berechnungsart der Bewegungsauslastung: absolut, relativ oder normalisiert
- Aggregationszeitfenster für Bewegungssignale
- Verfallslogik für alte Signale
- Gewichtung kurzer und langer Kanten
- Farbskala und Intensitätsstufen für Darstellung
- Glättungsgrad für Farbverläufe

**Feste Systemregel:**

> Signale, die einem Aufenthaltsbereich zugeordnet wurden, dürfen nicht zusätzlich in die Bewegungsauslastung derselben Kanten einfließen.

### 13.5 Modul: Routenbewertung

**Zweck**  
Operatoren konfigurieren, wie SCIM routenrelevante Abschnitte bewertet und wie diese Bewertung in Routenvorschläge einfließt.

**UI-Funktionen:**

- Anzeige routenrelevanter Abschnitte zwischen topologischen Kreuzungspunkten
- Anzeige der durchschnittlichen Bewegungsauslastung je Abschnitt
- Anzeige berührter oder angrenzender Aufenthaltsbereiche
- Markierung von Abschnitten als geeignet, abgewertet oder ausgeschlossen
- Simulation von Routenvorschlägen anhand aktueller Parameter

**Einstellbare Parameter:**

- Grenzwert für durchschnittliche Bewegungsauslastung
- Grenzwert für Aufenthaltsbelastung angrenzender oder berührter Aufenthaltsbereiche
- Behandlung bei Grenzwertüberschreitung: Warnung, Abwertung oder Ausschluss
- Notfall- oder Fallback-Regel, wenn keine Alternative verfügbar ist
- Routentyp-Profile, zum Beispiel ruhige Route, schnelle Route oder auslastungsarme Route

**Feste Systemregel:**

> Darstellung und Routenbewertung bleiben getrennt. Ein Abschnitt kann sichtbar bleiben, obwohl er für Routenvorschläge abgewertet oder ausgeschlossen wird.

### 13.6 Modul: Runtime-Load- und Standortsignale

**Zweck**  
Operatoren definieren Rahmenbedingungen für die Verarbeitung von Runtime-Load-Signalen und ergänzenden Standortsignalen.

**UI-Funktionen:**

- Anzeige aktueller Signalqualität und Signalmenge
- Anzeige veralteter oder widersprüchlicher Signale
- Auslösung oder Konfiguration kurz getakteter Bewegungsanalyse bei hoher Gesamtlast
- Sichtprüfung, welche Signale auf Kanten, POIs oder Staustellen projiziert werden

**Einstellbare Parameter:**

- Gültigkeitsdauer von Runtime-Load-Signalen
- Aggregationszeitfenster
- Schwelle für hohe Gesamtlast
- Taktung der Standortabfrage bei Bewegungsanalyse
- Gewichtung von Standortsignalen gegenüber Load-Signalen
- Umgang mit fehlenden oder veralteten Signalen

**Feste Systemregel:**

> Standortsignale dürfen die SCIM-Bewertung nur innerhalb der Datenschutz- und Mindestaggregationsgrenzen beeinflussen.

### 13.7 Modul: Datenschutz- und Mindestaggregation

**Zweck**  
Das Regio-Dashboard muss technische Grenzen sichtbar machen, die Operatoren nicht unterschreiten dürfen.

**UI-Funktionen:**

- Anzeige aktiver Datenschutzgrenzen
- Warnung bei Parametern, die zu kleinteiliger Sichtbarkeit führen würden
- Sperre für unzulässige Mindestwerte
- Protokollierung von Parameteränderungen

**Einstellbare Parameter innerhalb Systemgrenzen:**

- Mindestanzahl von Signalen vor Darstellung einer Kumulation
- räumliche Rundung oder Projektion von Signalen
- zeitliche Glättung oder Aggregation
- maximale Speicherdauer aggregierter Signale

**Nicht unterschreitbare Systemgrenzen:**

- keine sichtbare Auslastung durch ein einzelnes Gerät
- keine dauerhafte Speicherung individueller Bewegungsprofile
- keine Operator-Einstellung, die Mindestaggregation oder Anonymisierung unterläuft

### 13.8 Modul: Leaflet-Darstellung und Debug-Ansicht

**Zweck**  
Operatoren konfigurieren, welche SCIM-Ebenen in der Karte sichtbar sind und welche nur intern verwendet werden.

**UI-Funktionen:**

- Layer-Schaltung für POI-Kandidaten, freigegebene POIs, Aufenthaltsbereiche, Bewegungskanten, Routenabschnitte und Staustellen
- Debug-Ansicht mit Knoten, Kanten, Maskierungen und Rohwerten
- Vorschau der Ziel-App-Darstellung
- getrennte Ansicht für Operator-Diagnose und Ziel-App-User-Darstellung

**Einstellbare Parameter:**

- Sichtbarkeit einzelner Layer
- Farbskalen für Aufenthalt und Bewegung
- Transparenz und Radiusdarstellung
- Darstellung ausgeschlossener oder abgewerteter Routenabschnitte
- Aktivierung eines Expert-/Debug-Modus

**Feste Systemregel:**

> Die Operator-Darstellung darf mehr technische Details zeigen als die Ziel-App. Die Ziel-App zeigt nur die für Nutzer geeigneten und freigegebenen SCIM-Ergebnisse.

### 13.9 Modul: Parameterfreigabe und Versionierung

**Zweck**  
Parameteränderungen im Regio-Dashboard müssen nachvollziehbar, prüfbar und kontrolliert in die Ziel-App überführt werden.

**UI-Funktionen:**

- Speichern von Parameterständen
- Vorschau vor Freigabe
- Freigabeprozess für regionale Parameter
- Versionierung von POI-Radien, Schwellenwerten und Regelparametern
- Rollback auf frühere Parameterstände
- Protokollierung von Operator, Zeitpunkt und Änderung

**Feste Systemregel:**

> Die Ziel-App nutzt nur freigegebene Parameterstände. Entwürfe oder ungeprüfte Operator-Änderungen dürfen die Runtime-SCIM nicht beeinflussen.

### 13.10 Zusammenfassung der Einstellkategorien

**Frei einstellbar im Regio-Dashboard:**

- POI-Freigabe oder Ablehnung
- POI-Radius innerhalb zulässiger Grenzen
- POI-Kategorie im Regio-Dashboard
- Layer-Sichtbarkeit in Operator-Ansichten
- Farbskalen und Darstellungsoptionen

**Einstellbar innerhalb Systemgrenzen:**

- Mindestanzahl von Signalen
- Dichteschwellen und Dichteverhältnis
- Vergleichssaum
- Aggregationszeitfenster
- Signal-Gültigkeitsdauer
- Grenzwerte für Routenabwertung oder Routenausschluss
- Glättung von Farbverläufen

**Nicht konfigurierbare Grundregeln:**

- Aufenthalt nur innerhalb operator-bestätigter POI-Radien
- Aufenthalt maskiert Bewegung
- keine Doppelverwertung derselben Signale als Aufenthalt und Bewegung
- Trennung von Darstellung und Routenbewertung
- Ziel-App nutzt nur freigegebene Parameterstände
- Datenschutz- und Mindestaggregationsgrenzen dürfen nicht unterschritten werden

## 14. Gesamtkern

> Leaflet definiert und visualisiert den Raum.  
> Die SCIM-Graphengine klassifiziert Knoten, Kanten, Aufenthalte und Bewegungen.  
> Aufenthaltsbereiche maskieren Bewegungsauslastung.  
> Bewegung wird kantenbezogen dargestellt.  
> Routen werden abschnittsbezogen zwischen Kreuzungspunkten bewertet.  
> User-Einstellungen bestimmen, welche Abschnitte für Routenvorschläge geeignet, nachrangig oder ausgeschlossen sind.  
> System-Adjust setzt systemweite Grenzen.  
> Regio-Content pflegt regionale Parameter und POI-Freigaben.  
> Mother-Representation bildet den zentralen Runtime-Zustand.  
> Representation stellt die reduzierte, nutzergeeignete Ausgabe bereit.

