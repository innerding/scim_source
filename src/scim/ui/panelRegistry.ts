// Central registry for all SCIM panels, System entry, and AI Interface entry.
// Each descriptor drives: Navigator rendering, tab configuration, and input mode behaviour.

export type InputMode = 'user_form' | 'auto_computed' | 'semi_auto' | 'optional';

export type TabId = 'catalog' | 'input' | 'result' | 'validation' | 'raw' | 'leistungsblatt' | 'simulation';

export interface TabDescriptor {
  id: TabId;
  label: string;
  icon: string;
}

export interface PanelDescriptor {
  id: string;
  label: string;
  group: 1 | 2 | 3 | 4;  // navigator group (dividers between groups)
  order: number;
  icon: string;
  shortDescription: string;
  helpText: string;
  dependsOn: string[];
  inputMode: InputMode;
  isBlocking: boolean;
  contextKey: string;
  tabs: TabDescriptor[];
  editableFields?: string[];  // for semi_auto
}

export interface SystemDescriptor {
  kind: 'system';
  id: 'system';
  label: string;
  icon: string;
  tabs: TabDescriptor[];
}

export interface AiInterfaceDescriptor {
  kind: 'ai_interface';
  id: 'ai_interface';
  label: string;
  icon: string;
  tabs: TabDescriptor[];
}

const STANDARD_TABS: TabDescriptor[] = [
  { id: 'input',      label: 'Eingabe',    icon: '✎' },
  { id: 'result',     label: 'Ergebnis',   icon: '◎' },
  { id: 'validation', label: 'Validierung', icon: '⚑' },
  { id: 'raw',        label: 'Rohdaten',   icon: '{}' },
];

// P06 SignalInterpretation hat zusaetzlich einen Simulation-Tab — Sandbox fuer
// die Pattern-Klassifikation, frueher unter P04 TelcoLoad. Siehe ann_064.
const P06_TABS: TabDescriptor[] = [
  { id: 'input',      label: 'Eingabe',     icon: '✎' },
  { id: 'simulation', label: 'Simulation',  icon: '🎭' },
  { id: 'result',     label: 'Ergebnis',    icon: '◎' },
  { id: 'validation', label: 'Validierung', icon: '⚑' },
  { id: 'raw',        label: 'Rohdaten',    icon: '{}' },
];

// (Katalog ist seit Umbau ein eigenes Panel — siehe CATALOG_DESCRIPTOR.)

export const PANEL_REGISTRY: PanelDescriptor[] = [
  // ── Gruppe 1: Benutzereingaben ─────────────────────────────────────────────
  {
    id: 'P01',
    label: 'SystemAdjust',
    group: 1,
    order: 1,
    icon: '⚙',
    shortDescription: 'Grundparameter der SCIM-Instanz',
    helpText: 'Definiert Zentrum, Radius, Buffer und Schema-Versionierung für diese Analyse-Session.',
    dependsOn: [],
    inputMode: 'user_form',
    isBlocking: true,
    contextKey: 'system_adjust',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P02',
    label: 'RegioContent',
    group: 1,
    order: 2,
    icon: '▦',
    shortDescription: 'Regionale Inhalte und Quellen',
    helpText: 'Konfiguriert Datenquellen, Signal Groups und Telematik-Typen für die Region.',
    dependsOn: ['P01'],
    inputMode: 'user_form',
    isBlocking: true,
    contextKey: 'regio_content',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P03',
    label: 'TargetAppUi',
    group: 1,
    order: 3,
    icon: '▯',
    shortDescription: 'Ziel-App Konfiguration',
    helpText: 'Legt das App-Profil, POI-Typen, Radien und Darstellungsregeln für die Zielanwendung fest.',
    dependsOn: ['P01'],
    inputMode: 'user_form',
    isBlocking: true,
    contextKey: 'target_app_ui',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P04',
    label: 'TelcoLoad',
    group: 1,
    order: 4,
    icon: '≋',
    shortDescription: 'Telco-Belastungsdaten',
    helpText: 'Importiert und kalibriert Mobilfunk-Belastungssignale als Proxy für Besucheraufkommen.',
    dependsOn: ['P01', 'P02'],
    inputMode: 'user_form',
    isBlocking: true,
    contextKey: 'telco_load',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P05',
    label: 'OperatorZones',
    group: 1,
    order: 5,
    icon: '⊙',
    shortDescription: 'Operator-definierte Zonen',
    helpText: 'Definiert semantische Zonen (Rastplätze, Aussichtspunkte, Events) mit zeitlichem Gültigkeitsbereich und Routing-Ausschluss.',
    dependsOn: ['P01'],
    inputMode: 'user_form',
    isBlocking: false,
    contextKey: 'operator_zones',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P06',
    label: 'Transmitter',
    group: 1,
    order: 6,
    icon: '〜',
    shortDescription: 'SignalInterpretation — Pattern-Klassifikation',
    helpText: 'Klassifiziert jeden Telco-Signalpunkt als flow, accumulation oder ambiguous. Operator-Zonen können Punkte direkt als Aufenthaltsbereich erzwingen. Kosmologisch: der Transmitter im Pipeline-Substrat — animiert das Transmissionsfeld zwischen Mond und Tetraeder (ann_065).',
    dependsOn: ['P04', 'P05'],
    inputMode: 'auto_computed',
    isBlocking: false,
    contextKey: 'signal_interpretation',
    tabs: P06_TABS,
  },

  // ── Gruppe 2: Räumliche Grundlage ─────────────────────────────────────────
  {
    id: 'P07',
    label: 'Boundary + Extraction',
    group: 2,
    order: 7,
    icon: '⬡',
    shortDescription: 'Analysegebiet und POI-Extraktion',
    helpText: 'Berechnet den Analyse-Boundary aus den Grundparametern und extrahiert relevante POIs.',
    dependsOn: ['P01', 'P02', 'P03'],
    inputMode: 'auto_computed',
    isBlocking: true,
    contextKey: 'boundary',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P08',
    label: 'Graph + BasisLayer',
    group: 2,
    order: 8,
    icon: '⌗',
    shortDescription: 'Wegenetz und Basisschicht',
    helpText: 'Baut den topologischen Graphen des Wegenetzes und berechnet die räumliche Basisschicht.',
    dependsOn: ['P07'],
    inputMode: 'auto_computed',
    isBlocking: true,
    contextKey: 'graph',
    tabs: STANDARD_TABS,
  },

  // ── Gruppe 3: Engine (4 Modelle) ───────────────────────────────────────────
  {
    id: 'P09',
    label: 'Engine (4 Modelle)',
    group: 3,
    order: 9,
    icon: '↯',
    shortDescription: 'POI-Modell · Last · Bewegung · Maskierung',
    helpText: 'Führt die vier Kern-Modelle aus: POI-Bewertung, Lastprojektion, Bewegungsmodell, Datenschutz-Maskierung.',
    dependsOn: ['P08', 'P06'],
    inputMode: 'auto_computed',
    isBlocking: true,
    contextKey: 'poi_model',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P10',
    label: 'Route + Layer',
    group: 3,
    order: 10,
    icon: '⊕',
    shortDescription: 'Routenmodell und Layer-Aufbau',
    helpText: 'Berechnet Routenbewertungen und baut den visuellen Layer. Schwellenwerte sind anpassbar.',
    dependsOn: ['P09'],
    inputMode: 'semi_auto',
    isBlocking: true,
    contextKey: 'route_model',
    editableFields: ['score_thresholds', 'layer_opacity'],
    tabs: STANDARD_TABS,
  },

  // ── Gruppe 4: Paketierung und Release ──────────────────────────────────────
  {
    id: 'P11',
    label: 'Package',
    group: 4,
    order: 11,
    icon: '▣',
    shortDescription: 'Sensus Core Paket',
    helpText: 'Bündelt alle berechneten Daten in das standardisierte Sensus Core Format.',
    dependsOn: ['P10'],
    inputMode: 'auto_computed',
    isBlocking: true,
    contextKey: 'sensus_core_package',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P12',
    label: 'Local (optional)',
    group: 4,
    order: 12,
    icon: '⊠',
    shortDescription: 'Lokale Kopie (optional)',
    helpText: 'Erstellt optional eine lokale Kopie des Pakets für Offline-Nutzung oder Archivierung.',
    dependsOn: ['P11'],
    inputMode: 'optional',
    isBlocking: false,
    contextKey: 'sensus_core_local',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P13',
    label: 'EffectCheck',
    group: 4,
    order: 13,
    icon: '⊚',
    shortDescription: 'Wirkungsprüfung',
    helpText: 'Prüft die Visualisierungseffekte auf der Leaflet-Karte und validiert Darstellungsqualität.',
    dependsOn: ['P11'],
    inputMode: 'auto_computed',
    isBlocking: false,
    contextKey: 'leaflet_effect_check',
    tabs: STANDARD_TABS,
  },
  {
    id: 'P14',
    label: 'Release',
    group: 4,
    order: 14,
    icon: '↥',
    shortDescription: 'Freigabe und Export',
    helpText: 'Erstellt den signierten Release-Export mit vollständiger Versions- und Prüfsummen-Dokumentation.',
    dependsOn: ['P13'],
    inputMode: 'auto_computed',
    isBlocking: true,
    contextKey: 'release',
    tabs: STANDARD_TABS,
  },
];

// ─── Runtime Builder modules ───────────────────────────────────────────────────

export interface RuntimeModuleDescriptor {
  kind: 'runtime_module';
  id: string;
  label: string;
  icon: string;
  shortDescription: string;
  tabs: TabDescriptor[];
}

export const RUNTIME_BUILDER_REGISTRY: RuntimeModuleDescriptor[] = [
  {
    kind: 'runtime_module', id: 'R01', icon: '◻',
    label: 'Runtime Shell',
    shortDescription: 'App-Grundhülle, Routing und Fehlerzustände',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R02', icon: '⊞',
    label: 'Link & QR',
    shortDescription: 'Paketlink- und QR-Code-Startfall',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R03', icon: '↓',
    label: 'Package Loader',
    shortDescription: 'Paket laden, Cache und Integrität',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R04', icon: '⚑',
    label: 'Package Validator',
    shortDescription: 'Paket prüfen, blockieren, freigeben',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R05', icon: '⊡',
    label: 'Local State',
    shortDescription: 'Lokale User-Zustände und Eingaben',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R06', icon: '⌁',
    label: 'BCK / BAK',
    shortDescription: 'Comfort-Kernel und Routenvorschläge',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R07', icon: '◉',
    label: 'Karte & Guidance',
    shortDescription: 'Öffentliche Layer, Routen, Begleitung',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'runtime_module', id: 'R08', icon: '▤',
    label: 'Build & Cache',
    shortDescription: 'PWA-Build, Service Worker, Versionierung',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
];

// ─── Versionen registry ────────────────────────────────────────────────────────

export interface VersionenDescriptor {
  kind: 'versionen';
  id: string;
  label: string;
  icon: string;
  shortDescription: string;
  tabs: TabDescriptor[];
}

export const VERSIONEN_REGISTRY: VersionenDescriptor[] = [
  {
    kind: 'versionen', id: 'V01', icon: '⬡',
    label: 'Pakete',
    shortDescription: 'Alle veröffentlichten Pakete — Status, Version, Region',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'versionen', id: 'V02', icon: '◫',
    label: 'Region-Detail',
    shortDescription: 'Versionshistorie und Aktivierung je Region',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
  {
    kind: 'versionen', id: 'V03', icon: '◈',
    label: 'Aktiv-Monitor',
    shortDescription: 'Aktive Pakete je Region — CDN-URL und QR-Code',
    tabs: [{ id: 'input', label: 'Übersicht', icon: 'ℹ' }],
  },
];

// ─── System ───────────────────────────────────────────────────────────────────

// ─── Workspace (Gate / Entry-Point fuer Geometrien, Kataloge, Representations) ──

export interface WorkspaceDescriptor {
  kind: 'workspace';
  id: string;  // 'workspace' | 'geometry_editor' | ...
  label: string;
  icon: string;
  tabs: TabDescriptor[];
}

export const WORKSPACE_DESCRIPTOR: WorkspaceDescriptor = {
  kind: 'workspace',
  id: 'workspace',
  label: 'Workspace',
  icon: '⌂',
  tabs: [
    { id: 'input', label: 'Übersicht', icon: '⌂' },
  ],
};

// ─── Drawer (ann_072, frueher Geometry-Editor) ─────────────────────────────
// Interne Tabs Umriss/Wegnetz leben im Panel selbst (shared Leaflet-Canvas),
// daher hier nur ein Descriptor-Tab. ID bleibt 'geometry_editor' (Routing,
// Tetraeder-Faces, Kosmologie haengen daran).

export const DRAWER_DESCRIPTOR: WorkspaceDescriptor = {
  kind: 'workspace',
  id: 'geometry_editor',
  label: 'Drawer',
  icon: '◇',
  tabs: [
    { id: 'input', label: 'Karte', icon: '◇' },
  ],
};

// ─── Katalog (Erstklass-Panel ab Umbau) ──────────────────────────────────────
// Operator-only. Visibility-Filter passiert in PanelWorkspace via useRole().
export const CATALOG_DESCRIPTOR: WorkspaceDescriptor = {
  kind: 'workspace',
  id: 'catalog',
  label: 'Katalog',
  icon: '☰',
  tabs: [
    { id: 'catalog', label: 'Katalog', icon: '☰' },
  ],
};

export const SYSTEM_DESCRIPTOR: SystemDescriptor = {
  kind: 'system',
  id: 'system',
  label: 'System',
  icon: '⊙',
  tabs: [
    { id: 'input',          label: 'Übersicht',      icon: 'ℹ' },
    { id: 'result',         label: 'Bekannte Lücken', icon: '⚑' },
    { id: 'validation',     label: 'Manifest',        icon: '{}' },
    { id: 'leistungsblatt', label: 'Leistungsblatt',  icon: '◈' },
    { id: 'raw',            label: 'Rohdaten',        icon: '{}' },
  ],
};

export const AI_INTERFACE_DESCRIPTOR: AiInterfaceDescriptor = {
  kind: 'ai_interface',
  id: 'ai_interface',
  label: 'KI-Schnittstelle',
  icon: '⌬',
  tabs: [
    { id: 'input',      label: 'Annotationen', icon: '✎' },
    { id: 'result',     label: 'Briefing',     icon: '📋' },
    { id: 'validation', label: 'Export',       icon: '{}' },
    { id: 'raw',        label: 'Rohdaten',     icon: '{}' },
  ],
};

export type NavigatorEntry =
  | { kind: 'panel'; descriptor: PanelDescriptor }
  | { kind: 'runtime_module'; descriptor: RuntimeModuleDescriptor }
  | { kind: 'versionen'; descriptor: VersionenDescriptor }
  | { kind: 'system'; descriptor: SystemDescriptor }
  | { kind: 'workspace'; descriptor: WorkspaceDescriptor }
  | { kind: 'ai_interface'; descriptor: AiInterfaceDescriptor };

export type StatusColor = 'green' | 'orange' | 'red' | 'grey' | 'blue';

// IDs der Panels, die in der Kosmologie schon visuell vertreten sind
// (Tetraeder-Faces/-Arcs, Mesh, Mond-Klickregionen). Ihre Navigator-Eintraege
// und Panel-Titel werden auf 60 % opacity gedimmt, weil die Kosmologie sie
// schon prominent zeigt — kein Doppel-Schrei. Siehe ann_051.
export const KOSMOLOGIE_IDS: ReadonlySet<string> = new Set([
  // Tetraeder-Spheres (Schwellen-Arcs)
  'P01', 'P02', 'P09',
  // Tetraeder-Apex
  'P11',
  // Tetraeder-Faces
  'workspace', 'catalog', 'geometry_editor',
  // Mesh
  'P06',
  // Mond
  'R01', 'V01',
]);
