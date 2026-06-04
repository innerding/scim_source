// Shell-Studio — die Funktions-Registry. Jede Funktion = EIN Block, in zwei Lanes:
//   · SIM (High): die Oberfläche (Sim-Vorschau im Device-Frame) + der SIM-Code, der
//     sie in SCIM rendert + Design-Notizen. „Was wir simulieren."
//   · PRODUKTION (Deep): der Ziel-App-Code, der wirklich ausgespielt wird — NICHT live
//     mitcodiert, sondern auf Anforderung GENERIERT (Plattform wählen → SCIM rechnet →
//     Code je Block + Summe → von Sensus Core Publishing anforderbar/packbar).
// SIM-Code ≠ Produktions-Code (nativer App-Store-Code kann ganz anders aussehen).
// EINE Liste, zwei Lanes → die Frames stehen gegenüber. Inhalt wächst je Funktion.
//
// Reihenfolge = shell-run (sensus/shellRun.ts). Stubs (simCode 'folgt') sind noch zu
// filetieren: Funktion für Funktion, live an diesenpark.com (neuer Workflow 2026-06-04).

export type TargetPlatform = 'web' | 'android' | 'ios';

export const TARGET_PLATFORMS: { id: TargetPlatform; label: string }[] = [
  { id: 'web', label: 'Web' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
];

export interface ShellFunction {
  id: string;
  title: string;
  subtitle?: string;
  /** Sim-Vorschau (Device-Frame) = echter App-Screen. 'engine' = kein eigener Screen → leer. */
  surface: 'map' | 'intro' | 'comfort' | 'engine' | 'placeholder';
  /** Funktions-Visualisierung (rahmenlos) = analytische Sicht der Funktion. 'none' = keine. */
  viz: 'colorize' | 'reveal' | 'gate' | 'comfort' | 'none';
  /** High · Design-Notizen zur Oberfläche: so kann es sein · bewährt · Fallback · Ausbau. */
  highNotes: string[];
  /** Deep · Notizen zum Produktions-Code: was er tun muss · schneller weil · Budget · erneuert weil. */
  deepNotes: string[];
  /** High · der SIM-Code, der die Oberfläche in SCIM rendert (Auszug). */
  simCode: string;
}

const STUB = '// folgt — noch zu filetieren (live an diesenpark.com). Heimat/Reihenfolge: ⓘ shell-run.';

export const SHELL_FUNCTIONS: ShellFunction[] = [
  {
    id: 'map',
    title: 'Karte',
    subtitle: 'Leaflet + OSM',
    surface: 'map',
    viz: 'none',
    highNotes: [
      'Vollbild-Karte; endet vor der Home-Indicator-Zone (iOS-Geste durchlassen).',
      'Fallback: keine Tiles erreichbar → heller Hintergrund + Boundary-Umriss.',
      'Ausbau: Dark-Tiles als Stil-Variante (Mesh-Look) umschaltbar.',
    ],
    deepNotes: [
      'Produktion kann nativ rendern (Android/iOS Map-SDK) — SIM-Leaflet ist nur Vorschau.',
      'preferCanvas/invalidateSize sind SIM-Belange; nativ entfallen sie.',
      'fitBounds auf die Origin-Boundary bleibt plattformübergreifend gleich gemeint.',
    ],
    simCode: `const map = L.map(el, { zoomControl: true, preferCanvas: true });

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap', maxZoom: 19,
}).addTo(map);

// auf die Origin-Boundary fokussieren
const ring = origin.boundary;            // [lon, lat][]
const poly = L.polygon(
  ring.map(([lon, lat]) => [lat, lon]),
).addTo(map);
map.fitBounds(poly.getBounds(), { padding: [24, 24] });

// im Device-Frame: bei Größenwechsel neu vermessen
new ResizeObserver(() => map.invalidateSize()).observe(el);`,
  },
  {
    id: 'colorize',
    title: 'Colorize',
    subtitle: 'Last → Farbe (Engine)',
    surface: 'engine',
    viz: 'colorize',
    highNotes: [
      'Durchgehender Gradient ruhig → busy; Schwellen NUR als Marker, nie geschnitten (§2a).',
      'Default-Palette green_violet (stetig); umschaltbar heat / calm.',
      'Stellschrauben: spectrum (0 langsam heiß … 1 aggressiv) · bias (regional kühler/heißer).',
    ],
    deepNotes: [
      'Läuft APP-seitig auf den [0..1]-loads des Anthem — die App färbt selbst (Anthem trägt KEINE Farbe).',
      'Palette/spectrum/bias kommen aus den Origin-colour-settings (mit der Rep ausgeliefert).',
      'Reine Funktion, kein State → nativ 1:1 portierbar (gleiche Mathematik je Segment).',
    ],
    simCode: `// Last [0..1] → Farbe. Durchgehender Gradient (Schwellen als Marker, nie Schnitt).
const lerp = (a, b, t) => a + (b - a) * t;

function rampColor(stops, t) {            // lin. Interpolation zwischen Farb-Stops
  const u = clamp01(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (u <= b.at) {
      const f = (u - a.at) / (b.at - a.at || 1);
      return \`rgb(\${lerp(a.color[0], b.color[0], f)|0}, …)\`;
    }
  }
}

// Last STETIG beugen (spectrum/bias), dann auf die Palette mappen
function shapeLoad(load, { spectrum = 0.5, bias = 0 } = {}) {
  const gamma = Math.pow(2, 1 - 2 * clamp01(spectrum));
  return clamp01(Math.pow(clamp01(load), gamma) + bias * 0.5);
}

export function colorize(load, { palette = 'green_violet', spectrum, bias } = {}) {
  const stops = PALETTES[palette].stops;  // ruhig → busy
  return rampColor(stops, shapeLoad(load, { spectrum, bias }));
}

// app-seitig je Segment:
seg.color = colorize(anthem.loads[i], origin.colourSettings);`,
  },
  {
    id: 'intro',
    title: 'Intro',
    subtitle: 'reveal-engine · Animation (generisch)',
    surface: 'intro',
    viz: 'reveal',
    highNotes: [
      'Stilles Einloggen: weißer Screen, reg-Icon links oben (luftig), dann Boundary-Reveal.',
      'Die Shell liefert NUR die Animation (generisch) — reg-Icon UND boundary sind Inhalt, gestempelt (P11/Origin).',
      'Fenster wächst (f0.5, kein Dim) → Fill aus + Boundary bleibt. Ausbau: Region-Name/Logo.',
    ],
    deepNotes: [
      'Reine DOM/SVG-Maske als additives Overlay — rührt die Karten-Layer nicht an.',
      'Inhalt wohnt NICHT in der Shell: origin-boundary (L0) + reg-Icon (Shell-ID) werden in Sensus Core Publishing (P11) bzw. aus dem Origin gestempelt. Die Deep-Shell hat nur die Animations-Funktionen.',
      'Nativ: gleiche zwei Phasen mit Plattform-Masking (CALayer-Mask / Canvas-Clip).',
    ],
    simCode: `// reveal-engine — Boundary-Reveal („stilles Einloggen"). Additives SVG-Overlay
// über der Karte; rührt die Leaflet-Layer NICHT an.
export function playBoundaryReveal(container, map, ringLatLng) {
  const pts = ringLatLng.map(([lat, lon]) =>
    map.latLngToContainerPoint(L.latLng(lat, lon)));   // Ring → Container-Pixel

  // Maske: weiß = sichtbarer Fill, schwarz = Loch (Boundary-Fenster).
  // 1) weißer Invert-Fill über der Karte; im Zentrum wächst die Boundary als
  //    Fenster und legt die OSM frei (f0.5, ~3000 ms · KEIN Ausdimmen dabei).
  animate(GROW_MS, t => maskScale(easeOutCubic(t)));

  // 2) danach: Fill aus + Boundary blendet ein und bleibt (~1400 ms).
  then(DIM_MS, t => { fillOpacity(1 - t); strokeOpacity(t); });
}`,
  },
  {
    id: 'container',
    title: 'Container-System',
    subtitle: 'POI-Buckets · Cluster-Ghosts (Engine)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Geometrie + Farbe je POI-Bucket; Cluster-Ghosts (Ring → Heimat-Container).'],
    deepNotes: ['Generische Engine; der Origin-Capsulator liefert ABGEGLICHENE Container (Schlüssel {geometry_id,color} im poi-set) — Vehikel, spart den Abgleich.'],
    simCode: STUB,
  },
  {
    id: 'poi-select',
    title: 'POI-Auswahl',
    subtitle: 'tap = markieren · long-tap = Modal',
    surface: 'placeholder',
    viz: 'none',
    highNotes: ['Treffsicher an-/abwählen, keine Zweideutigkeit. short-tap markiert, long-tap öffnet Detail-Modal. Keine eigene Wishlist-Fläche.'],
    deepNotes: ['Die markierten POIs SIND die Auswahl; speist den Route-Solver.'],
    simCode: STUB,
  },
  {
    id: 'bck',
    title: 'Comfort',
    subtitle: 'BCK · Move + Rest (+ Dauer)',
    surface: 'comfort',
    viz: 'comfort',
    highNotes: [
      'Zwei Slider: Move (Bewegung) schränkt das Netz ein/erweitert es · Rest (Aufenthalt) wählt ruhige POIs.',
      'Move hoch → stark belastete Strecken gedämpft/ausgeschlossen; runter → mehr Netz.',
      'Crossing-gated: ganze Strecken (Kreuzung→Kreuzung), nie einzelne Segmente.',
    ],
    deepNotes: [
      'Braucht origin-mesh (Geometrie, Origin) + Anthem-Last (Colour-Mesh-Daten) → Ø-Last je Strecke.',
      'classifyStretches: User-Comfort (Move) = ausschluss-Schwelle · Operator = degradier.',
      'Reine Funktionen (stretchAverages/classifyStretches) → nativ 1:1 portierbar.',
    ],
    simCode: `// BCK — Broda Comfort Kernel. Crossing-gated: klassifiziert je STRECKE
// (Kreuzung→Kreuzung) über die Ø-Last — nie einzelne Segmente.
export function stretchAverages(mesh, loads) {        // Ø-Last je Strecke
  let i = 0;
  return mesh.stretches.map(s => {
    const segs = s.points.length - 1;
    let sum = 0; for (let k = 0; k < segs; k++) sum += loads[i++];
    return { id: s.id, average: segs ? sum / segs : 0 };
  });
}

export function classifyStretches(stretches, { degradier, ausschluss }) {
  return stretches.map(s => {
    let state = 'normal';
    if (ausschluss != null && s.average >= ausschluss) state = 'excluded'; // User (Move)
    else if (degradier != null && s.average >= degradier) state = 'degraded'; // Operator
    return { ...s, state };
  });
}

// Comfort-Slider Move → ausschluss = 1 - movementComfort:
//   hoch → mehr Strecken raus (Netz EINGESCHRÄNKT) · runter → mehr drin (ERWEITERT).`,
  },
  {
    id: 'route-solver',
    title: 'Route-Solver',
    subtitle: 'Modell B · eine adaptive Linie (Engine)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Kein „wähle aus 3 Routen": die App zieht EINE adaptive Linie durch die markierten POIs.'],
    deepNotes: ['Auf dem Mesh-Graph (Kreuzungen=Knoten, Segmente=Kanten), comfort-beschränkt. Konzeptionell da (playbook.ts), technisch ungetestet.'],
    simCode: STUB,
  },
  {
    id: 'via',
    title: 'Via / Trassierung',
    subtitle: 'Longpress-Via · Trassier-Snap (Engine)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Long-press pinnt einen Wunschpunkt; die App snappt ihn aufs Netz (Operator-Trassierung für die User-Route).'],
    deepNotes: ['Gleiche Auto-Noding-Mechanik wie beim Netz-Bau. Comfort-Rahmen bleibt hart.'],
    simCode: STUB,
  },
  {
    id: 'bak',
    title: 'BAK · Deeskalations-Kaskade',
    subtitle: 'Broda Avoidance Kernel (Engine)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Handelt, wenn der Comfort kippt: 1 Ausweichroute → 2 Wegpunkte umgehen (Rückfrage) → 3 Alternativroute (Comfort-Max).'],
    deepNotes: ['Monotone Leiter, je Stufe genau eine Sache lockern. Spec: docs/komfort_kaskade_spec.md. S1 gebaut, S2+S3 offen.'],
    simCode: STUB,
  },
  {
    id: 'guidance',
    title: 'Guidance',
    subtitle: 'Führung unterwegs (ZULETZT)',
    surface: 'placeholder',
    viz: 'none',
    highNotes: ['Super einfach, treffsicher. Decision-Point statt Meter-für-Meter, Landmarken statt Distanz, calm/eyes-free.'],
    deepNotes: ['Fehlweg-Warnung braucht OSM-Kreuzungen (nicht im gepruneten Mesh). Destillat liegt bereit; ZULETZT bauen, minimale Iteration.'],
    simCode: STUB,
  },
  {
    id: 'drossler',
    title: 'Drossler',
    subtitle: 'Refresh-Gate (Engine)',
    surface: 'engine',
    viz: 'gate',
    highNotes: [
      'Kein eigener Screen — wirkt unsichtbar: weniger Netz-Anfragen, ruhigeres Verhalten.',
      'Schützt vor Anfrage-Fluten bei vielen User-Interaktionen.',
    ],
    deepNotes: [
      'App-seitig: nicht jede Interaktion fordert an — gebündelt pro nextAt-Fenster.',
      'Liest die ANGEKÜNDIGTE nextAt (rät keine verstrichene Zeit) → trifft jedes Fenster genau einmal.',
      'Reine Funktion (state, nowMin) → Verdikt; nativ 1:1 portierbar.',
    ],
    simCode: `// Refresh-Gate — der Consumer drosselt sich SELBST: liest die angekündigte
// nextAt des gehaltenen Snapshots und fordert erst ab nextAt + Gap neu an.
// Bündelt viele Interaktionen zu höchstens EINER Anforderung pro Fenster.
export function evaluateGate(state, nowMin) {
  if (!state.held) return { allowed: true, reason: 'no-snapshot', dueInMin: 0 };

  const dueAt = state.held.nextAtMin + REFRESH_GAP_MIN;   // kleiner Gap (Publish-Rennen)
  if (nowMin >= dueAt)
    return { allowed: true,  reason: 'expired', dueInMin: 0 };          // neu anfordern

  return { allowed: false, reason: 'valid', dueInMin: dueAt - nowMin };  // halten
}
// jede User-Interaktion fragt das Gate; nur 'expired' → echte Anforderung.`,
  },
  {
    id: 'globe-switcher',
    title: 'globe-switcher',
    subtitle: 'Eintritts-Weiche QR↔URL (Edge)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['QR → Launcher überspringen, direkt zur festen Rep. diesenpark.com nackt → Launcher zeigen.'],
    deepNotes: ['Dispatcher an der Request-Grenze, vor Sensus Core. On/Off + Allowlist (P11-Tab). Kein Engine-Stück im engeren Sinn.'],
    simCode: STUB,
  },
  {
    id: 'collector',
    title: 'Collector-Path',
    subtitle: 'Nation→Region→Rep · Cross-Rep-Fan-in (Feed)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Aggregiert den Katalog Nation → Region → Representation; speist den Launcher.'],
    deepNotes: ['Wohnt auf dem Publishing-Layer (P11/V01-V02), NICHT Deep-Shell, NICHT Capsuler. Nation-Ebene = Minimal-Pfad.'],
    simCode: STUB,
  },
  {
    id: 'launcher',
    title: 'Launcher · globale Auswahl',
    subtitle: 'Kacheln Nation→Region→Rep',
    surface: 'placeholder',
    viz: 'none',
    highNotes: ['Rendert die Kacheln und löst die Bundle-Auslieferung aus. Generische High-Shell-Surface, außerhalb des Rep-Bundles.'],
    deepNotes: ['Der eigentliche Konsument des Collector-Path. Wird vom globe-switcher gezeigt (URL) oder übersprungen (QR).'],
    simCode: STUB,
  },
  {
    id: 'lade-treiber',
    title: 'Lade-Kaskade-Treiber',
    subtitle: 'eager fetch + Intro-Vorhang (Engine)',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Fährt die Lade-Kaskade auf dem Gerät — der User hängt nie im Upload.'],
    deepNotes: ['Feuert den Bundle-Fetch, sobald rep-id bekannt; deckt die Latenz mit Intro/Reveal. Reihenfolge: DEPLOY_ORDER.'],
    simCode: STUB,
  },
  {
    id: 'transfer',
    title: 'Transfer → Sensus Core P',
    subtitle: 'geschnürt · versioniert · gestempelt',
    surface: 'placeholder',
    viz: 'none',
    highNotes: ['Die fertige, generische Shell wird an Sensus Core P transferiert.'],
    deepNotes: ['Dort geschnürt (Shell ⊕ Origin ⊕ Anthem), versioniert (V01), Identität gestempelt. Erst HIER wird aus generisch eine konkrete Auslieferung.'],
    simCode: STUB,
  },
  {
    id: 'render-features',
    title: 'Colour-Mesh-Render-Features',
    subtitle: 'High-Shell Render-Adjustments: Gradient · DP · Atmen',
    surface: 'engine',
    viz: 'none',
    highNotes: ['Abschaltbare Darstellungs-Effekte zum Degradieren bei mangelnder Performance. Reine Render-Schicht.'],
    deepNotes: ['Getrennt von der colorize-ENGINE (Deep-Shell). Gradient (Vertex-Blending, Kreuzungen hart) · DP (vereinfachen) · Atmen (geparkt — saubere Fassung später).'],
    simCode: STUB,
  },
];
