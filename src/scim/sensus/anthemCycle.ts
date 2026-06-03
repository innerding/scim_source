// Anthem-Kreislauf — die EINE Wahrheitsquelle (Beschreibung + Status) für den
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
  /** Erklärung der Rolle im Kreislauf (ganze Sätze). */
  blurb: string;
}

export const STATION_STATUS_META: Record<StationStatus, { icon: string; label: string; color: string }> = {
  done: { icon: '✓', label: 'fertig', color: '#2f855a' },
  partial: { icon: '◑', label: 'teilweise / in Arbeit', color: '#c05621' },
  open: { icon: '✗', label: 'offen', color: '#c53030' },
};

export const ANTHEM_INTRO =
  'Der Anthem-Kreislauf ist der „Atem" der Last-Ausspielung: SCIM nimmt (sobald eine ' +
  'App präsent ist) im 5-Min-Takt die Auslastung ab, deutet und packt sie zu einem ' +
  'koordinatenlosen Snapshot und sendet ihn auf Anfrage. Die App liest die angekündigte ' +
  'Nachfolge-Zeit, drosselt sich selbst und färbt/routet damit. Ein geschlossener Kreis: ' +
  'einatmen → deuten → packen → ausatmen → senden → drosseln → konsumieren → (nächste Anforderung).';

export const ANTHEM_STATIONS: AnthemStation[] = [
  {
    n: 1, word: 'klopfen', title: 'Presence', home: 'P04 · Presence', panelId: 'P04', tabId: 't1',
    status: 'partial',
    blurb: 'Die App meldet beim ersten Upload nach Shell-Install ihren Aufenthalt (presence-origin: „ich bin in Boundary X"). Das startet den 5-Min-Zyklus (2 h-Hysterese). Gate/Konzept sind editor-seitig gebaut; das echte presence-Signal aus der App fehlt (Phase 2b).',
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
    status: 'partial',
    blurb: 'System/Region/Load-Schwellen bestimmen, wie die Last gespreizt und ab wann sie „rot" wird. Greifen heute im Karten-Render; in den Snapshot-Pfad des Coders sind sie noch nicht verdrahtet (nimmt Default-Parameter).',
  },
  {
    n: 5, word: 'packen', title: 'Coder', home: 'P02', panelId: 'P02',
    status: 'done',
    blurb: 'Der echte Encoder (buildAnthemSnapshot): packt die normalisierte Last [0..1] je Segment in den AnthemSnapshot — ohne Koordinaten, plus tMin und die angekündigte nextAtMin. Läuft client-seitig presence-getaktet im 5-Min-Atem.',
  },
  {
    n: 6, word: 'ausatmen', title: 'Transmitter', home: 'P06 · Atem', panelId: 'P06', tabId: 't1',
    status: 'partial',
    blurb: 'Spielt den Snapshot aus — auf Anfrage der Ziel-App, nicht von sich aus. Die Atem-Anatomie/UI ist gebaut; die echte Auslieferung übers Netz hängt am Worker (offen).',
  },
  {
    n: 7, word: 'adressieren', title: 'Adresse (anthemEndpoint)', home: 'P09 · Origin-Manifest', panelId: 'P09',
    status: 'partial',
    blurb: 'Das Origin-Manifest schreibt die Adresse, an der die App den Snapshot zieht (anthemEndpoint = /api/anthem/:repId), und bindet sie an die repId. Neu: ein „Origin-Netz veröffentlichen"-Button (P09) PUTet das resampelte Netz nach R2, damit der Worker daraus rechnen kann. Offen bleibt der Operator-seitige wrangler deploy.',
  },
  {
    n: 8, word: 'senden', title: 'Auslieferung (Worker)', home: 'Worker /api/anthem/:repId',
    status: 'partial',
    blurb: 'Der Übertragungsweg: der Worker rechnet den Snapshot SELBST aus dem veröffentlichten Origin-Netz + (Sim-)Zeit (geteilte produceAnthem-Engine, keine Dopplung) und liefert ihn presence-gegated aus. Endpoints GET /api/anthem/:repId + POST .../presence sind gebaut, typgeprüft und bundeln — aber noch nicht per wrangler deployed (Phase 2b-Abschluss).',
  },
  {
    n: 9, word: 'drosseln', title: 'Refresh-Gate', home: 'P08 · t5', panelId: 'P08', tabId: 't5',
    status: 'done',
    blurb: 'Die app-seitige Selbst-Drosselung: der Consumer liest die angekündigte nextAt und fordert erst ab nextAt + Gap einen neuen Snapshot an — nicht jede Interaktion löst eine Anforderung aus. Client-seitig funktional.',
  },
  {
    n: 10, word: 'konsumieren', title: 'Konsum (färben & routen)', home: 'Ziel-App R06/R07',
    status: 'open',
    blurb: 'Die App mappt segId → Geometrie übers Origin-Netz, färbt (colorize) und routet die Komfort-Kaskade (BCK/BAK) mit der Live-Last. Dann beginnt der Kreis von vorn (nächste Anforderung). App-Konsum ist noch Gerüst (Phase 3/4).',
  },
];
