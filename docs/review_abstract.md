# Review-Abstract — SCIM3 & MVP-Lichtenberg

**Titelvorschlag:** *SCIM3 — eine Autoren- und Auslieferungsplattform für ortsbezogene,
lastadaptive Ziel-Apps, am Beispiel der MVP-Lichtenberg*

*Stand: Juni 2026.*

## Abstract

SCIM3 ist eine **Autoren- und Auslieferungsplattform** (Authoring & Delivery Platform), die
ortsbezogene, lastadaptive Endnutzer-Apps erzeugt, versioniert und ausliefert. Sie trennt
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
von SCIM für **FFG, TVB und AWS** allgemeinverständlich skizziert — insbesondere die
Fähigkeit, Representationen **sehr rasch zu erzeugen und zu skalieren** — und zugleich
**ausdrücklich benennt, was noch fehlt**: die Anbindung realer Mobilfunk-Auslastung als
Ground Truth (derzeit simuliert), eine server-seitige Authentifizierung und vertiefte
Governance (Rollen und Provenienz wirken heute als UX-Gate), die Feld-Verifikation der
GPS-gestützten Vor-Ort-Führung sowie die Automatisierung des Operator-Schritts für die
Skalierung auf viele Regionen.

---

<p style="font-size: 0.8em; color: #888;">
<strong>Herkunft dieses Dokuments.</strong> Die vorstehende Beschreibung entstand im Dialog
mit dem KI-Assistenten Claude (Opus 4.8) auf folgende Fragestellung des Autors: „Hilf mir,
für einen universitären Review der MVP-Lichtenberg sowie der SCIM3 — als eine <em>Kategorie</em>,
welche die Funktionen eines Einpflege-Dashboards für eine Ziel-App wie die MVP-Lichtenberg
erfüllt — eine Beschreibung zu definieren." Die offene Kategorie wurde dabei zu „Autoren- und
Auslieferungsplattform" präzisiert; die Kennzahlen sind über die drei Auslieferungs-Repositorys
(Werkbank, Runtime, <em>shell-kit</em>) gemessen, die Paketgrößen am Lichtenberg-Beispiel
(gzip, Stand Juni 2026).
</p>
