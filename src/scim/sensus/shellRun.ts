// shell-run — die EINE Wahrheitsquelle für die LINEARE Shell-Strecke: welche
// Funktionen die Shell ausmachen, in welcher Reihenfolge und Art sie geschmiedet
// werden, und wie die fertige Shell an Sensus Core P TRANSFERIERT wird.
//
// Pendant zum Anthem-Pulse (sensus/anthemCycle.ts): der Pulse ATMET (zyklisch,
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
  'das Gegenstück zum zyklischen Anthem-Pulse. Funktion um Funktion wird geschmiedet: erst ' +
  'die Surfaces (was der User sieht) und Engines (die kopflos rechnen) — inklusive der User-' +
  'Schleife: POIs antippen, EINE adaptive Linie rechnen (Route-Solver), Comfort + Dauer ' +
  'einstellen, der BAK deeskaliert bei Andrang, Guidance führt. Leitsatz „Geh deinen Weg" — ' +
  'KEINE Fixrouten (wir sind kein Routen-Shop). Dann die Eintritts-' +
  'Funktionen: der globe-switcher (QR ↔ diesenpark.com) entscheidet, ob der Launcher (globale ' +
  'Auswahl) gezeigt wird; der Collector-Path speist den Launcher mit dem Katalog (Nation → ' +
  'Region → Representation); der Lade-Kaskade-Treiber fährt den Download. Zuletzt wird die ' +
  'generische Shell an Sensus Core P transferiert — dort wird sie geschnürt, versioniert und ' +
  'mit der Identität gestempelt. Die Shell ist generisch; alles Rep-/Regions-Spezifische wird ' +
  'erst beim Transfer gestempelt.';

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
    n: 3, word: 'intro', title: 'Intro / Reveal + Slogan', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: '„Stilles Einloggen": Boundary-Reveal als additives Overlay. Die Shell liefert NUR die Animation (generisch) — reg-Icon und Boundary sind gestempelter Inhalt (P11/Origin). Zugleich der Vorhang über der Lade-Latenz. HIER erscheint als ERSTES der Slogan „Geh deinen Weg" — das Manifest in drei Worten, das Erste, was der User konsumiert. Schließt Fixrouten aus.',
  },
  {
    n: 4, word: 'container', title: 'Container-System', kind: 'engine', home: 'origin-poi-set · Container-Pfad (Katalog der akt. Rep)',
    status: 'partial',
    blurb: 'Geometrie + Farbe je POI-Bucket, Cluster-Ghosts (Ring → Heimat-Container, wächst mit Anzahl). Braucht einen Pfad aus dem Katalog der AKTUELLEN Representation (origin-poi-set → Container). Gebaut (clusterOverlay), aber noch nicht als Shell-Funktion filetiert.',
  },
  {
    n: 5, word: 'poi-select', title: 'POI-Auswahl', kind: 'surface', home: '— · Surface, noch nicht filetiert',
    status: 'open',
    blurb: 'Treffsichere An-/Abwahl, keine Zweideutigkeit. tap = markieren (kein Modal). long-tap = Detail-Modal (Tagline · Short-Description · Auswahl-Check · Dropdown für Long-Description/Foto). KEINE eigene Wishlist-Fläche; die markierten POIs sind die Auswahl. Idee: Tooltip/Autofocus statt Mehrdeutigkeit.',
  },
  {
    n: 6, word: 'comfort', title: 'Comfort + Dauer · BCK', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'partial',
    blurb: 'Die PRIMÄRSTEUERUNG (kein Routenmenü): der User wird aufgefordert, seinen Comfort UND seine Wanderdauer einzustellen. Broda Comfort Kernel beobachtet, zwei Slider (Move/Rest) schränken das Netz crossing-gated ein über die Ø-Last je Strecke. BCK-Slider gebaut; die Dauer-Aufforderung als Entry-Prompt ist neu.',
  },
  {
    n: 7, word: 'route-solver', title: 'Route-Solver', kind: 'engine', home: 'Deep-Shell · playbook.ts (ungetestet)',
    status: 'partial',
    blurb: 'Modell B: die App rechnet SELBST EINE adaptive Linie durch die markierten POIs auf dem Mesh-Graph (Kreuzungen=Knoten, Segmente=Kanten), comfort-beschränkt. Kein „wähle aus 3 Routen". Konzeptionell da (playbook.ts), technisch noch ungetestet.',
  },
  {
    n: 8, word: 'via', title: 'Via / Trassierung (User)', kind: 'engine', home: '— · Trassier-Snap (Longpress-Via)',
    status: 'open',
    blurb: 'Die Operator-Trassierung für die User-Routenbildung: long-press pinnt einen Wunschpunkt, die App snappt ihn aufs Netz (gleiche Auto-Noding-Mechanik wie beim Netz-Bau). = Longpress-Via aus der Komfort-Kaskade. Comfort-Rahmen bleibt hart.',
  },
  {
    n: 9, word: 'bak', title: 'Deeskalations-Kaskade · BAK', kind: 'engine', home: 'Deep-Shell · komfort_kaskade_spec.md',
    status: 'partial',
    blurb: 'Broda Avoidance Kernel: handelt, wenn der Comfort kippt — eine monotone Deeskalations-Leiter (je Stufe genau eine Sache lockern). 1 Ausweichroute (Pfad) → 2 Wegpunkte umgehen (mit Rückfrage!) → 3 Alternativroute (Ziel-POI tauschen, Comfort-Max). Stufe 1 gebaut, S2+S3 offen.',
  },
  {
    n: 10, word: 'guidance', title: 'Guidance', kind: 'surface', home: '— · Surface (R07), Recherche ausstehend',
    status: 'open',
    blurb: 'Die Führung unterwegs: super einfach, treffsicher, „besser als das Beste". Next-Stop/Ankunft/Tour-Ende. Recherche („besser als das Beste") steht noch aus (später, Abgleich mit ChatGPT). Im MVP vernachlässigbar — das meiste Arbeit.',
  },
  {
    n: 11, word: 'drossler', title: 'Drossler · Refresh-Gate', kind: 'engine', home: 'P08 · Refresh-Gate', panelId: 'P08', tabId: 't5',
    status: 'done',
    blurb: 'Der Consumer drosselt sich selbst: liest die angekündigte nextAt des Snapshots und fordert erst ab nextAt + Gap neu an. Bündelt viele Interaktionen zu höchstens einer Anforderung pro Fenster. Kein eigener Screen.',
  },
  {
    n: 12, word: 'globe-switcher', title: 'globe-switcher', kind: 'edge', home: '— · Edge, vor Sensus Core',
    status: 'open',
    blurb: 'Die Eintritts-Weiche an der Request-Grenze: liest, WIE der User kommt. QR-Code → Launcher überspringen, direkt zur festen Rep (Liste nicht nötig). diesenpark.com nackt → den Launcher zeigen. Kein Engine-Stück, sondern Dispatcher; braucht höchstens eine rep-id-Auflösung, nicht den ganzen Katalog.',
  },
  {
    n: 13, word: 'collector', title: 'Collector-Path', kind: 'feed', home: 'P11/V01-V02 · Publishing-Aggregat',
    status: 'open',
    blurb: 'Cross-Rep-Fan-in: aggregiert den Katalog Nation → Region → Representation aus den per-Rep-Fakten, die jeder Origin-Capsuler deklariert (Nation/Region/Icon). Wohnt auf dem Publishing-Layer (Sensus Core P / V01-V02-Kaskade), NICHT in der Deep-Shell (deren Animationen sind generisch). Speist den Launcher. Nation-Ebene nur als Minimal-Pfad anlegen.',
  },
  {
    n: 14, word: 'launcher', title: 'Launcher · globale Auswahl', kind: 'surface', home: '— · High-Shell-Surface, noch nicht filetiert',
    status: 'open',
    blurb: 'Die globale-Auswahl-Fassung: rendert die Kacheln Nation → Region → Representation und löst die Bundle-Auslieferung aus. Der EIGENTLICHE Konsument des Collector-Path. Generische High-Shell-Surface, publishing-gespeist, lebt AUSSERHALB des Rep-Bundles. Wird vom globe-switcher gezeigt (URL) oder übersprungen (QR).',
  },
  {
    n: 15, word: 'lade-treiber', title: 'Lade-Kaskade-Treiber', kind: 'engine', home: 'Deep-Shell · DEPLOY_ORDER',
    status: 'open',
    blurb: 'Fährt die Lade-Kaskade auf dem Gerät: feuert den Bundle-Fetch, sobald die rep-id bekannt ist (eager), und deckt die Latenz mit Intro/Reveal — damit der User im Upload nicht hängt. Die deklarierte Reihenfolge steht in DEPLOY_ORDER.',
  },
  {
    n: 16, word: 'transfer', title: 'Transfer → Sensus Core P', kind: 'transfer', home: 'P11 · Sensus Core', panelId: 'P11', tabId: 't1',
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
