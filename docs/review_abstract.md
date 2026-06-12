# Review-Abstract — SCIM3 & MVP-Lichtenberg

**Titelvorschlag:** *SCIM3 — eine Autoren- und Auslieferungsplattform für ortsbezogene,
lastadaptive Ziel-Apps, am Beispiel der MVP-Lichtenberg*

*Stand: Juni 2026.*

## Abstract

SCIM3 ist der **funktionsfähige MVP** einer **Autoren- und Auslieferungsplattform** (Authoring
& Delivery Platform), die ortsbezogene, lastadaptive Endnutzer-Apps erzeugt, versioniert und
ausliefert. Der Kern trägt bereits produktiv; die eigentliche Wertschöpfung liegt in mehreren
noch ausstehenden, forschungsnahen Ausbaustufen (siehe unten). Die Plattform trennt
strikt zwischen Produzent und Konsument: In der Werkbank (SCIM3) wird ein realer Ort als
*Representation* modelliert — Gebietsgrenze, Wegnetz als Segment-Graph, POI-Katalog, Icons
sowie ein Farb-/Schwellenmodell der Auslastung. Das Einpflegen erfolgt rollengetrennt über
den **Pathworks Hub**, die Autoren-Drehscheibe der Werkbank: Editoren legen Representations
an, bauen und kuratieren (Gebietsgrenze, Wegnetz, POI-Katalog) und reichen ihre Arbeit zur
Prüfung ein, ein Operator committet sie in versionierte Representations und liefert aus —
ein git-artiger Lebenszyklus aus Entwurf, Review und Commit mit nachvollziehbarer Provenienz.
Aus dieser Representation schnürt eine
Publish-Pipeline drei unabhängig versionierte Pakete: **shell** (das generische,
geräteseitige App-Verhalten samt UI), **origin** (die ortsspezifischen Daten je
Representation) und **anthem** (das lebende Lastsignal im Fünf-Minuten-Takt). Die
Auslieferung erfolgt ausschließlich über Cloud-Infrastruktur (Object Storage, Worker, CDN);
ein QR-Code lädt die App direkt auf ein Endgerät.

Die so erzeugte Ziel-App — exemplarisch die **MVP-Lichtenberg** — ist edge-lokal und
datensparsam: Das Gerät bleibt eine „Black Box", die nur das aktuelle Lastbild ihrer
Representation abruft und Comfort-Einstellung wie Wegfindung vollständig lokal berechnet
(*Modell B*: die App routet selbst über den Segment-Graphen, statt vorberechnete Routen zu
empfangen). Auch die Vor-Ort-Führung ist geräteseitig: reale GPS-Position und Kompass-Kurs
werden auf den Segment-Graphen projiziert und Abweichungen vom Weg erkannt — eine leise,
ambiente Begleitung ohne Turn-by-Turn-Anweisungen. Ein Regelkreis im Fünf-Minuten-Takt
(Signalimpuls → Comfort → Route) passt die angezeigte und gewählte Route fortlaufend an die
jeweils anliegende Auslastung an: belebten Abschnitten weicht die App still aus und fragt nur
dann nach, wenn sie dafür ein Ziel opfern müsste (eine Deeskalations-Kaskade).

Diese Auslastung ist im aktuellen MVP **simuliert**: eine deterministische
Telco-Last-Simulation mit Tageskurve, deren Verlauf sich über einen Zeit-Regler („Turbo")
im Schnelldurchlauf demonstrieren lässt. Die Architektur ist auf **reale
Mobilfunk-Auslastung als Ground Truth** ausgelegt; deren Anbindung erfordert keine Änderung
an Auslieferungsweg oder Gerät, das das Lastbild unverändert konsumiert. Die übrigen Pfade —
Representation/origin-Daten, Paketierung, Auslieferung sowie die edge-lokale Comfort- und
Wegberechnung — arbeiten bereits auf dem produktiven Weg.

Aus Software-Engineering-Sicht kennzeichnen den Ansatz: eine konsequente
Producer/Consumer-Trennung, drei separat versionierte Auslieferungsartefakte, eine geteilte,
unabhängig unit-getestete Single-Source-of-Truth-Bibliothek (*shell-kit*) sowie edge-lokale
Berechnung bei minimaler Datenhaltung (Erstlieferung ~199 KB gzip, im laufenden Betrieb nur
das Lastsignal mit ~2 KB je Fünf-Minuten-Takt — robust auch unter überlasteten Mobilnetzen).

## Reifegrad und Ausbaustufen

SCIM3 ist ein **funktionsfähiger MVP**: Der vollständige Weg von der Modellierung einer
Representation über die Paketierung bis zur ausgelieferten, edge-lokal rechnenden Ziel-App ist
durchgängig erprobt — die Machbarkeit ist am Beispiel Lichtenberg belegt. Auf diesem
tragfähigen Kern setzen mehrere **Ausbaustufen** auf, die den eigentlichen Forschungs- und
Entwicklungsgehalt ausmachen und Gegenstand der weiteren Arbeit sind:

- **Reale Last als Ground Truth.** Ablösung der Simulation durch reale Mobilfunk-Auslastung,
  perspektivisch die **datenschutzfreundliche Fusion** mehrerer Signalquellen (anonymisiert,
  differenziell privat) — Datenschutz als Forschungsgegenstand, nicht als Nachgedanke.
- **Vorausschauende Lenkung (ML-Forecast).** Ein Vorhersagemodell, das die Auslastung nicht
  nur abbildet, sondern **prognostiziert**; die Wegführung wird damit proaktiv statt reaktiv.
- **Anomalie-Erkennung.** Automatisches Erkennen ungewöhnlicher Lastmuster — Andrangsspitzen,
  Events, Störungen — als Auslöser für Sonderverhalten und Frühwarnung.
- **Event-Modus.** Dedizierte Behandlung von Großveranstaltungen und Massenandrang mit
  temporären Kapazitäts- und Komfortregimen.
- **Eingangsseitige Ausspielung & Zugangssteuerung.** Die Eintritts-Weiche bestimmt, welche
  Representation ein Gerät erhält; sicherheitsrelevantes Gating, geofenced Zugang und **Sperren**
  einzelner Bereiche oder Wege (bei Gefahr, Überlast oder Sperrgebieten).
- **Sicherheits- und Governance-Schicht.** Server-seitige Authentifizierung, rollenbasierte
  Berechtigungen und Sperren, nachvollziehbare Provenienz und Audit — heute als UX-Gate
  angelegt, künftig serverseitig durchgesetzt.
- **Skalierung und Wirkungsnachweis.** Automatisierung des Operator-Schritts für die rasche
  Ausbringung vieler Regionen sowie ein Wirkungsnachweis der Lenkung (misst, ob die Empfehlung
  Andrang real entzerrt — der Regelkreis als überprüfbare Hypothese).

Der MVP ist damit zugleich Machbarkeitsbeleg und Ausgangspunkt einer substanziellen
Weiterentwicklung.

## Vorschlag zur Begutachtung

Um die Beurteilung auf unmittelbare Anschauung statt auf Beschreibung allein zu stützen,
werden zwei praktische Demonstrationen vorgeschlagen — je eine aus Konsumenten- und aus
Produzentensicht:

1. **Konsumentensicht — die MVP-Lichtenberg selbst erproben.** Per QR-Code lädt die
   Gutachterin/der Gutachter die ausgelieferte Ziel-App auf das eigene Gerät und durchläuft
   sie auf der simulierten Tageslast: Comfort-Einstellung, adaptive Wegführung und geführte
   Begehung — der gesamte Endnutzer-Pfad ohne Installation, allein über den QR-Code.

2. **Produzentensicht — den *Pathworks Hub* live erleben.** In einem **Workshop** erläutert
   der Autor (Dietmar Broda) den Autorenweg im Pathworks Hub. Die Gutachterin/der Gutachter
   spezifiziert dabei eine eigene **Representation**, die binnen kurzer Zeit über die
   SCIM3-Werkbank veröffentlicht wird und unmittelbar als lauffähige App (QR) erscheint — der
   vollständige Erzeugungszyklus von der Modellierung bis zur Auslieferung, am eigenen
   Beispiel nachvollzogen.

Als Ergebnis dieser Vorgänge wird ein **Schreiben des Instituts** angestrebt, das den Stand
von SCIM für **FFG, TVB und AWS** allgemeinverständlich skizziert — insbesondere die Fähigkeit,
Representationen **sehr rasch zu erzeugen und zu skalieren** — und zugleich den **MVP-Charakter
samt der oben genannten Ausbaustufen ausdrücklich benennt** (von der Anbindung realer Last über
ML-Forecast und Anomalie-Erkennung bis zu Event-Modus, eingangsseitiger Zugangssteuerung mit
Sperren und der Sicherheits-/Governance-Schicht). Gerade dieses Zusammenspiel aus erprobtem
Kern und ausgewiesenem Entwicklungspotenzial bildet die Grundlage für die angestrebte Förderung.

---

<p style="font-size: 0.8em; color: #888;">
Entstanden im Dialog mit dem KI-Assistenten Claude (Opus 4.8); Kennzahlen über die drei
Auslieferungs-Repositorys gemessen, Paketgrößen am Lichtenberg-Beispiel (gzip, Stand Juni 2026).
</p>
