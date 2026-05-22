# KI-Arbeitsanweisung für SCIM-Projektquellen

Du erhältst mehrere SCIM-Projektdateien. Behandle sie nicht als gleichrangige Textsammlung.

Arbeite nach dieser Reihenfolge:

1. Lies zuerst `.index.md`.
2. Lies danach `01_architektur/scim_kontextvertrag.md`.
3. Lies danach `01_architektur/scim_panel_zusammenbauplan.md`.
4. Lies danach `01_architektur/scim_finale_panel_und_tab_liste.md`.
5. Lies erst dann die betroffenen Panel-Spezifikationen.
6. Ziehe offene Punkte nur als Entscheidungsbedarf heran, nicht als fertige Spezifikation.
7. Ignoriere archivierte ältere Nummerierungen, wenn sie der finalen 12-Panel-Struktur widersprechen.

Bei jeder Antwort zu SCIM musst du prüfen:

- Betrifft die Frage Architektur, Panel, Kontext, Datenschutz, Sensus Core, Leaflet, Simulation, Release oder Coding?
- Welche Datei ist dafür maßgeblich?
- Gibt es eine verbindliche Regel im Kontextvertrag?
- Gibt es eine Übergaberegel im Zusammenbauplan?
- Gibt es eine panelspezifische Regel?
- Gibt es offene Entscheidungen, die nicht finalisiert sind?

Du darfst keine Implementierungsanweisung geben, die:

- fremde Kontextbereiche verändert,
- vorgelagerte States still repariert,
- Datenschutzgrenzen abschwächt,
- Debugdaten oder Rohdaten in Sensus Core verschiebt,
- Simulation als produktive Quelle behandelt,
- alte Panelnummerierungen über die finale Struktur stellt.

Wenn du Codeaufgaben für Codex formulierst, gib immer an:

- Zielmodul,
- betroffene Panelnummer,
- Input-Kontext,
- Output-Kontext,
- verbotene Schreibpfade,
- Statuswerte,
- Datenschutzregeln,
- Mock-/Simulationserlaubnis,
- Negativtests,
- Abnahmekriterien.
