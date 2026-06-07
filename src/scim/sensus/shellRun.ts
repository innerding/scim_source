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
    n: 3, word: 'intro', title: 'Intro / Reveal', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'done',
    blurb: '„Stilles Einloggen": Boundary-Reveal als additives Overlay. Die Shell liefert NUR die Animation (generisch) — reg-Icon und Boundary sind gestempelter Inhalt (P11/Origin). Zugleich der Vorhang über der Lade-Latenz. Der Slogan ist herausgelöst → eigener Schritt „slogan".',
  },
  {
    n: 4, word: 'slogan', title: 'Slogan · Erstkonsumat', kind: 'surface', home: 'Quelle: appManifest.ts (APP_SLOGAN) · Auftritt im Intro', panelId: 'P07', tabId: 't5',
    status: 'partial',
    blurb: 'Das Erste, was der User konsumiert: der Slogan „Geh deinen Weg" — das Manifest in drei Worten. Schließt Fixrouten aus (wir sind kein Routen-Shop). Erscheint im Intro über der Lade-Latenz. QUELLE / Geburtsort = das App-Manifest (appManifest.ts, APP_SLOGAN); hier nur sein Auftritt auf der Strecke, kein zweiter String (eine Quelle je Begriff). Text steht; finale Platzierung/Anordnung in-app noch TBD.',
  },
  {
    n: 5, word: 'container', title: 'Container-System', kind: 'engine', home: 'origin-poi-set · Container-Pfad (Katalog der akt. Rep)',
    status: 'partial',
    blurb: 'Geometrie + Farbe je POI-Bucket, Cluster-Ghosts (Ring → Heimat-Container, wächst mit Anzahl). Die Engine ist GENERISCH und muss NICHT aus dem Capsulator kommen — die Deep-Shell BENUTZT den Origin-Capsulator aber als VEHIKEL: so bekommt sie Container, die mit den Origin-POIs schon ABGEGLICHEN sind (Container-Schlüssel im poi-set vorab aufgelöst), und spart sich den Abgleich-Weg. Die POIs kommen live (Lade-Kaskade, origin-rest) in die schon vorhandenen Container. Render-Kern editor-frei herausgeschält (sensus/shellRenderCore.ts — EINE Quelle, Assets via Dependency-Inversion); im Shell-Studio filetiert. Offen: in eigenes git-getaggtes Repo heben (docs/shell_katalog_zwei_takte.md).',
  },
  {
    n: 6, word: 'poi-select', title: 'POI-Auswahl', kind: 'surface', home: '— · Surface, noch nicht filetiert',
    status: 'open',
    blurb: 'Treffsichere An-/Abwahl, keine Zweideutigkeit. tap = markieren (kein Modal). long-tap = Detail-Modal (Tagline · Short-Description · Auswahl-Check · Dropdown für Long-Description/Foto). KEINE eigene Wishlist-Fläche; die markierten POIs sind die Auswahl. Idee: Tooltip/Autofocus statt Mehrdeutigkeit.',
  },
  {
    n: 7, word: 'comfort', title: 'Comfort + Dauer · BCK', kind: 'surface', home: 'P07 · Shell-Studio', panelId: 'P07', tabId: 't5',
    status: 'partial',
    blurb: 'Die PRIMÄRSTEUERUNG (kein Routenmenü): der User wird aufgefordert, seinen Comfort UND seine Wanderdauer einzustellen. Broda Comfort Kernel beobachtet, zwei Slider (Move/Rest) schränken das Netz crossing-gated ein über die Ø-Last je Strecke. BCK-Slider gebaut; die Dauer-Aufforderung als Entry-Prompt ist neu.',
  },
  {
    n: 8, word: 'route-solver', title: 'Route-Solver', kind: 'engine', home: 'Deep-Shell · playbook.ts (ungetestet)',
    status: 'partial',
    blurb: 'Modell B: die App rechnet SELBST EINE adaptive Linie durch die markierten POIs auf dem Mesh-Graph (Kreuzungen=Knoten, Segmente=Kanten), comfort-beschränkt. Kein „wähle aus 3 Routen". Konzeptionell da (playbook.ts), technisch noch ungetestet.',
  },
  {
    n: 9, word: 'via', title: 'Via / Trassierung (User)', kind: 'engine', home: '— · Trassier-Snap (Longpress-Via)',
    status: 'open',
    blurb: 'Die Operator-Trassierung für die User-Routenbildung: long-press pinnt einen Wunschpunkt, die App snappt ihn aufs Netz (gleiche Auto-Noding-Mechanik wie beim Netz-Bau). = Longpress-Via aus der Komfort-Kaskade. Comfort-Rahmen bleibt hart.',
  },
  {
    n: 10, word: 'bak', title: 'Deeskalations-Kaskade · BAK', kind: 'engine', home: 'Deep-Shell · komfort_kaskade_spec.md',
    status: 'partial',
    blurb: 'Broda Avoidance Kernel: handelt, wenn der Comfort kippt — eine monotone Deeskalations-Leiter (je Stufe genau eine Sache lockern). 1 Ausweichroute (Pfad) → 2 Wegpunkte umgehen (mit Rückfrage!) → 3 Alternativroute (Ziel-POI tauschen, Comfort-Max). Stufe 1 gebaut, S2+S3 offen.',
  },
  {
    n: 11, word: 'guidance', title: 'Guidance', kind: 'surface', home: '— · Surface (R07), Recherche ausstehend',
    status: 'open',
    blurb: 'Die Führung unterwegs: super einfach, treffsicher, „besser als das Beste". Next-Stop/Ankunft/Tour-Ende. Recherche („besser als das Beste") steht noch aus (später, Abgleich mit ChatGPT). Im MVP vernachlässigbar — das meiste Arbeit.',
  },
  {
    n: 12, word: 'drossler', title: 'Drossler · Refresh-Gate', kind: 'engine', home: 'P08 · Refresh-Gate', panelId: 'P08', tabId: 't5',
    status: 'done',
    blurb: 'Der Consumer drosselt sich selbst: liest die angekündigte nextAt des Snapshots und fordert erst ab nextAt + Gap neu an. Bündelt viele Interaktionen zu höchstens einer Anforderung pro Fenster. Kein eigener Screen.',
  },
  {
    n: 13, word: 'globe-switcher', title: 'globe-switcher', kind: 'edge', home: 'Cloud · Globe-Switcher', panelId: 'cloud', tabId: 'globe_switcher',
    status: 'partial',
    blurb: 'Die Eintritts-Weiche an der Request-Grenze: liest, WIE der User kommt. QR-Code → Launcher überspringen, direkt zur festen Rep (Liste nicht nötig). diesenpark.com nackt → den Launcher zeigen. Kein Engine-Stück, sondern Dispatcher; braucht höchstens eine rep-id-Auflösung, nicht den ganzen Katalog.',
  },
  {
    n: 14, word: 'collector', title: 'Collector-Path', kind: 'feed', home: 'Cloud · Collector', panelId: 'cloud', tabId: 'collector',
    status: 'open',
    blurb: 'Cross-Rep-Fan-in: aggregiert den Katalog Nation → Region → Representation aus den per-Rep-Fakten, die jeder Origin-Capsuler deklariert (Nation/Region/Icon). Wohnt auf dem Publishing-Layer (Sensus Core P / V01-V02-Kaskade), NICHT in der Deep-Shell (deren Animationen sind generisch). Speist den Launcher. Nation-Ebene nur als Minimal-Pfad anlegen.',
  },
  {
    n: 15, word: 'launcher', title: 'Launcher · globale Auswahl', kind: 'surface', home: 'Cloud · Launcher', panelId: 'cloud', tabId: 'launcher',
    status: 'partial',
    blurb: 'Die globale-Auswahl-Fassung: rendert die Kacheln (Nation →) Region → Representation und lädt die gewählte Rep. Der EIGENTLICHE Konsument des Collector-Path. our-side Eintritts-Surface, publishing-gespeist, lebt AUSSERHALB des Rep-Bundles. Vom globe-switcher gezeigt (nackte URL) oder übersprungen (QR). GEBAUT (Runtime src/launcher, minimal/statisch: Lichtenberg aktiv · Grünberg abgedimmt · Gaisberg prepared); kosmologische Heimat = neue Cloud-Schicht zwischen Transmission und Mond (Modell B, geplant); Collector/Pathworks-Hub speisen den Inhalt künftig.',
  },
  {
    n: 16, word: 'lade-treiber', title: 'Lade-Kaskade-Treiber', kind: 'engine', home: 'Deep-Shell · DEPLOY_ORDER',
    status: 'open',
    blurb: 'Fährt die Lade-Kaskade auf dem Gerät: feuert den Bundle-Fetch, sobald die rep-id bekannt ist (eager), und deckt die Latenz mit Intro/Reveal — damit der User im Upload nicht hängt. Die deklarierte Reihenfolge steht in DEPLOY_ORDER.',
  },
  {
    n: 17, word: 'transfer', title: 'Transfer → Sensus Core P', kind: 'transfer', home: 'P11 · Transfer', panelId: 'P11', tabId: 'transfer',
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
