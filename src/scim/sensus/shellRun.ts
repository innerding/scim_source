// shell-run — die EINE Wahrheitsquelle für die LINEARE Shell-Strecke: welche
// Funktionen die Shell ausmachen, in welcher Reihenfolge und Art sie geschmiedet
// werden, und wie die fertige Shell an Sensus Core P TRANSFERIERT wird.
//
// Pendant zum Anthem-Reigen (sensus/anthemCycle.ts): der Reigen ATMET (zyklisch,
// 5-Min-Last) — shell-run SCHMIEDET & TRANSFERIERT (linear, einmalig je Version).
// Statt verstreuter Notizen (DEPLOY_ORDER, SCS_PACKAGES, Studio-Blöcke, Kommentare)
// verweisen alle beteiligten Panels/Tabs über das ⓘ-Modal (ShellRunInfo) hierher.
// Status NUR hier pflegen.

import { STATION_STATUS_META, type StationStatus } from './anthemCycle';
export { STATION_STATUS_META, type StationStatus };

export type ShellKind = 'engine' | 'surface' | 'edge' | 'feed' | 'transfer';

export const KIND_META: Record<ShellKind, { icon: string; label: string; color: string }> = {
  engine:   { icon: '⚙', label: 'Engine',   color: '#6b46c1' }, // kopflos, rechnet
  surface:  { icon: '▣', label: 'Surface',  color: '#2b6cb0' }, // was der User sieht
  feed:     { icon: '⇊', label: 'Feed',     color: '#2c7a7b' }, // speist die Shell mit Daten
  edge:     { icon: '⤧', label: 'Edge',     color: '#c05621' }, // Weiche an der Request-Grenze
  transfer: { icon: '⏩', label: 'Transfer', color: '#b83280' }, // die fertige Shell raus
};

export interface ShellStep {
  /** Reihenfolge auf der Strecke (1-basiert). */
  n: number;
  /** Funktionswort für die lineare Kette. */
  word: string;
  title: string;
  kind: ShellKind;
  /** Anzeige der Heimat (Panel·Tab) — wo die Funktion gebaut/filetiert wird. */
  home: string;
  /** Sprungziel; fehlt = noch kein Ort (offener Posten, kein Shortcut). */
  panelId?: string;
  tabId?: string;
  status: StationStatus;
  /** Rolle auf der Strecke (ganze Sätze). */
  blurb: string;
}

export const SHELL_RUN_INTRO =
  'shell-run ist die lineare Strecke, auf der eine Shell entsteht und transferiert wird — ' +
  'das Gegenstück zum zyklischen Anthem-Reigen. Funktion um Funktion wird geschmiedet: erst ' +
  'die Surfaces (was der User sieht) und Engines (die kopflos rechnen), dann wird die Shell ' +
  'mit dem Katalog gespeist (Collector-Path), mit dem Lade-Kaskade-Treiber gerüstet und an ' +
  'Sensus Core P transferiert — dort wird sie geschnürt, versioniert und mit der Identität ' +
  'gestempelt. An der Request-Grenze entscheidet der globe-switcher (QR ↔ diesenpark.com). ' +
  'Die Shell ist generisch; alles Rep-/Regions-Spezifische wird erst beim Transfer gestempelt.';

export const SHELL_RUN_STEPS: ShellStep[] = [
  {
    n: 1, word: 'karte', title: 'Karte', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: 'Die Vollbild-Karte (Leaflet/OSM in der Sim, nativ im Ziel) — die Bühne, auf der Netz, Farbe und POIs erscheinen. Fokussiert auf die origin-boundary.',
  },
  {
    n: 2, word: 'colorize', title: 'Colorize', kind: 'engine', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: 'Last [0..1] → Farbe, durchgehender Gradient (Schwellen nur als Marker, nie Schnitt). Läuft app-seitig auf den Anthem-loads; Palette/spectrum/bias kommen aus den Origin-colour-settings. Reine Funktion, nativ 1:1.',
  },
  {
    n: 3, word: 'intro', title: 'Intro / Reveal', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: '„Stilles Einloggen": Boundary-Reveal als additives Overlay. Die Shell liefert NUR die Animation (generisch) — reg-Icon und Boundary sind gestempelter Inhalt (P11/Origin). Zugleich der Vorhang über der Lade-Latenz.',
  },
  {
    n: 4, word: 'comfort', title: 'Comfort · BCK', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: 'Broda Comfort Kernel: zwei Slider (Move/Rest) schränken das Netz crossing-gated ein/erweitern es über die Ø-Last je Strecke. Braucht origin-mesh (Geometrie) + Anthem-Last. Reine Funktionen, nativ 1:1.',
  },
  {
    n: 5, word: 'drossler', title: 'Drossler · Refresh-Gate', kind: 'engine', home: 'P08 · Refresh-Gate', panelId: 'P08', tabId: 't5',
    status: 'done',
    blurb: 'Der Consumer drosselt sich selbst: liest die angekündigte nextAt des Snapshots und fordert erst ab nextAt + Gap neu an. Bündelt viele Interaktionen zu höchstens einer Anforderung pro Fenster. Kein eigener Screen.',
  },
  {
    n: 6, word: 'bak', title: 'Comfort-Kaskade · BAK', kind: 'engine', home: 'Deep-Shell · noch ohne Tab',
    status: 'partial',
    blurb: 'Broda Avoidance Kernel: Vermeidungs-Kaskade (Ausweichroute → Wegpunkte umgehen → Alternativroute mit Comfort-Maximierung). S6-Basis gebaut, Stufe 2+3 offen. Noch kein Shell-Studio-Block.',
  },
  {
    n: 7, word: 'container', title: 'Container-System', kind: 'engine', home: 'poi-catalog · noch nicht filetiert',
    status: 'partial',
    blurb: 'Geometrie + Farbe je POI-Bucket, Cluster-Ghosts (Ring → Heimat-Container, wächst mit Anzahl). Gebaut (clusterOverlay), aber noch nicht als Shell-Funktion filetiert.',
  },
  {
    n: 8, word: 'collector', title: 'Collector-Path', kind: 'feed', home: '— · Quelle: V01/V02-Kaskade',
    status: 'open',
    blurb: 'Sammelt Nation → Region → Representation und stellt es der Deep-Shell bereit (speist die globale-Auswahl-Fassung). Quelle ist die kaskadierende Liste im SCIM-UI (REGION_MAP / V02RegionDetail). Nation-Ebene fehlt noch.',
  },
  {
    n: 9, word: 'lade-treiber', title: 'Lade-Kaskade-Treiber', kind: 'engine', home: 'Deep-Shell · DEPLOY_ORDER',
    status: 'open',
    blurb: 'Fährt die Lade-Kaskade auf dem Gerät: feuert den Bundle-Fetch, sobald die rep-id bekannt ist (eager), und deckt die Latenz mit Intro/Reveal — damit der User im Upload nicht hängt. Die deklarierte Reihenfolge steht in DEPLOY_ORDER.',
  },
  {
    n: 10, word: 'globe-switcher', title: 'globe-switcher', kind: 'edge', home: '— · Edge, vor Sensus Core',
    status: 'open',
    blurb: 'Die Eintritts-Weiche: liest, wie der User kommt. QR-Code → globale-Auswahl raus, direkt in den Lade-Kaskade-Treiber (eine Rep steht fest). diesenpark.com nackt → globale-Auswahl durchreichen (Region → Rep). Kein Engine-Stück, sondern Dispatcher an der Request-Grenze.',
  },
  {
    n: 11, word: 'transfer', title: 'Transfer → Sensus Core P', kind: 'transfer', home: 'P11 · Sensus Core', panelId: 'P11', tabId: 't1',
    status: 'partial',
    blurb: 'Die fertige, generische Shell wird an Sensus Core P transferiert. Dort wird geschnürt (Shell ⊕ Origin ⊕ Anthem), versioniert (V01) und die Identität gestempelt (reg-/rep-Icon, Boundary, globale Icons). Erst HIER wird aus der generischen Shell eine konkrete Auslieferung.',
  },
];

// Die Lade-Kaskade (Lade-Ende) — Spiegel zur DEPLOY_ORDER (Sende-Ende). Was die
// Shell auf dem Gerät der Reihe nach lädt, um das Upload-Erlebnis zu machen.
export interface LadeStufe {
  n: number;
  word: string;
  note: string;
  /** true = im MVP (origin via URL) übersprungen. */
  mvpOut?: boolean;
}

export const LADE_KASKADE: LadeStufe[] = [
  { n: 1, word: 'Shell',           note: 'Engine-Suite (die App lebt)' },
  { n: 2, word: 'presence-origin', note: 'Gate: welche boundary → welches origin', mvpOut: true },
  { n: 3, word: 'origin-wegnetz',  note: 'das Netz (Segmente zum Einfärben)' },
  { n: 4, word: 'load-values',     note: 'Atem aufs Netz', mvpOut: true },
  { n: 5, word: 'origin-rest',     note: 'asset-set → poi-set → pixel-charges (Pixel zuletzt)' },
];

export const LADE_KASKADE_MVP = 'MVP (origin via URL): kein Gate, kein Load → 1 → 3 → 5.';
