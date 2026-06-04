// Anthem-Pulse — die EINE Wahrheitsquelle (Beschreibung + Status) für den
// „Atem" der Last-Ausspielung. Statt dass jeder Panel/Tab eine ähnliche Notiz trägt,
// verweisen alle Stationen über das ⓘ-Modal (AnthemCycleInfo) hierher.
//
// Konvergenz-Prinzip (Leitplanke „eine Quelle je Begriff"): Status NUR hier pflegen.
// Maßgeblich: docs/anthem_snapshot_spec.md.

export type StationStatus = 'done' | 'partial' | 'open';

export interface AnthemStation {
  /** Reihenfolge im Kreis (1-basiert). */
  n: number;
  /** Funktionswort für die lineare Kette. */
  word: string;
  title: string;
  /** Anzeige der Heimat (Panel·Tab oder extern). */
  home: string;
  /** Sprungziel; fehlt = noch kein Ort (offene Lücke, kein Shortcut). */
  panelId?: string;
  tabId?: string;
  status: StationStatus;
  /** Erklärung der Rolle im Anthem-Pulse (ganze Sätze). */
  blurb: string;
  /** Optionaler Beobachter-Sprung (Monitor-Sicht, kein Transformations-Ort). */
  observeId?: string;
  observeTab?: string;
  observeLabel?: string;
}

export const STATION_STATUS_META: Record<StationStatus, { icon: string; label: string; color: string }> = {
  done: { icon: '✓', label: 'fertig', color: '#2f855a' },
  partial: { icon: '◑', label: 'teilweise / in Arbeit', color: '#c05621' },
  open: { icon: '✗', label: 'offen', color: '#c53030' },
};

export const ANTHEM_INTRO =
  'Der Anthem-Pulse ist der „Atem" der Last-Ausspielung: SCIM nimmt (sobald eine ' +
  'App präsent ist) im 5-Min-Takt die Auslastung ab, deutet und packt sie zu einem ' +
  'koordinatenlosen Snapshot und sendet ihn auf Anfrage. Die App liest die angekündigte ' +
  'Nachfolge-Zeit, drosselt sich selbst und färbt/routet damit. Ein geschlossener Kreis: ' +
  'einatmen → deuten → packen → ausatmen → senden → drosseln → konsumieren → (nächste Anforderung).';

export const ANTHEM_STATIONS: AnthemStation[] = [
  {
    n: 1, word: 'klopfen', title: 'Presence', home: 'P04 · Presence', panelId: 'P04', tabId: 't1',
    status: 'partial',
    blurb: 'Die App meldet beim ersten Upload nach Shell-Install ihren Aufenthalt (presence-origin: „ich bin in Boundary X"). Das startet den 5-Min-Zyklus (2 h-Hysterese). P04 t1 ist das Intake/Gate (Producer-Seite); V03 t1 ist das Call-Log (Auslieferungs-Seite, beobachtet date/time/duration).',
    observeId: 'V03', observeTab: 't1', observeLabel: 'V03 · Presence-Origin',
  },
  {
    n: 2, word: 'einatmen', title: 'Telco-Quelle', home: 'P04 · Sim-Telco', panelId: 'P04', tabId: 't2',
    status: 'partial',
    blurb: 'Die Last-Quelle. Heute eine Sim-Telco, vom Time-Turbo getaktet; eine echte Telco käme später über denselben Vertrag. Liefert die Rohlast je Wegabschnitt.',
  },
  {
    n: 3, word: 'deuten', title: 'Normalization', home: 'P04 · Normalization', panelId: 'P04', tabId: 't3',
    status: 'done',
    blurb: 'Die Rohlast wird auf die Boundary normalisiert → Last [0..1] je Segment (normalizeLoads: Spreizung + Mindest-Wert). Passiert SCIM-seitig, bevor der Coder packt — die App bekommt fertige [0..1] und färbt nur.',
  },
  {
    n: 4, word: 'schwellen', title: 'Thresholds', home: 'P01', panelId: 'P01',
    status: 'done',
    blurb: 'System/Region/Load-Schwellen bestimmen, wie die Last gespreizt und ab wann sie „rot" wird. Jetzt im Snapshot-Pfad verdrahtet: die Load-Threshold-Parameter (spread/floor der Rep-Region) gehen in produceAnthem ein — im Coder-Preview UND mit dem Origin veröffentlicht, sodass der Worker bit-gleich normalisiert. (Threshold geändert → Origin neu veröffentlichen.)',
  },
  {
    n: 5, word: 'packen', title: 'Coder', home: 'P02', panelId: 'P02',
    status: 'done',
    blurb: 'Der echte Encoder (buildAnthemSnapshot): packt die normalisierte Last [0..1] je Segment in den AnthemSnapshot — ohne Koordinaten, plus tMin und die angekündigte nextAtMin. Läuft client-seitig presence-getaktet im 5-Min-Atem.',
  },
  {
    n: 6, word: 'ausatmen', title: 'Transmitter', home: 'P06 · Atem', panelId: 'P06', tabId: 't1',
    status: 'done',
    blurb: 'Spielt den Snapshot aus — auf Anfrage der Ziel-App, nicht von sich aus. Die Ausspielung erfüllt der deployte Worker-GET (presence-gegated, siehe „senden"); P06 ist die Atem-Anatomie/Erklärung dazu. Funktional erfüllt.',
  },
  {
    n: 7, word: 'adressieren', title: 'Adresse (anthemEndpoint)', home: 'P09 · cap origin-mesh', panelId: 'P09', tabId: 't2',
    status: 'done',
    blurb: 'Das Origin-Manifest schreibt die Adresse, an der die App den Snapshot zieht (anthemEndpoint = /api/anthem/:repId), und bindet sie an die repId. Der „cap origin-mesh veröffentlichen"-Button (P09 · t2) PUTet das resampelte Netz nach R2 — der Worker liest es und rechnet daraus. Round-Trip live verifiziert.',
  },
  {
    n: 8, word: 'senden', title: 'Auslieferung (Worker)', home: 'Worker /api/anthem/:repId',
    status: 'done',
    blurb: 'Der Übertragungsweg: der Worker rechnet den Snapshot SELBST aus dem veröffentlichten Origin-Mesh + (Sim-)Zeit (geteilte produceAnthem-Engine, keine Dopplung) und liefert ihn presence-gegated aus (GET /api/anthem/:repId + POST .../presence). Deployed und end-to-end verifiziert: Daten verlassen den Editor-RAM, reisen durch R2/Worker und kommen zurück.',
  },
  {
    n: 9, word: 'drosseln', title: 'Refresh-Gate', home: 'P08 · t5', panelId: 'P08', tabId: 't5',
    status: 'done',
    blurb: 'Die app-seitige Selbst-Drosselung: der Consumer liest die angekündigte nextAt und fordert erst ab nextAt + Gap einen neuen Snapshot an — nicht jede Interaktion löst eine Anforderung aus. Client-seitig funktional.',
  },
  {
    n: 10, word: 'konsumieren', title: 'Konsum (färben & routen)', home: 'Ziel-App R06/R07',
    status: 'open',
    blurb: 'Die App mappt segId → Geometrie übers Origin-Mesh, färbt (colorize) und routet die Komfort-Kaskade (BCK/BAK) mit der Live-Last. Dann beginnt der Kreis von vorn (nächste Anforderung). App-Konsum ist noch Gerüst (Phase 3/4). STAND (2026-06-04): Der Live-Pfad in der Runtime (useAnthemOverlay, Phase 3b) ist GEBAUT, aber bewusst GEPARKT — bis echtes, nicht simuliertes Origin/Anthem steht. Grund: sonst würde ein vorgebackenes Overlay als „live" maskiert und eine falsche presence-origin eingetragen. Bis dahin nutzt die App das vorgebackene svg_overlay als Fallback, und der Anthem im Shell-Studio bleibt simuliert (Werkzeug zum visuellen Testen). AUSBAU: useAnthemOverlay entparken, sobald echter Anthem live ist.',
  },
];
