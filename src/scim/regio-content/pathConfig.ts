// Wanderwegnetz-Gebietskonfiguration (ann_072).
//
// Pro Gebiet eine Konfiguration, welche OSM-Elemente als Wanderwegnetz
// gelten. OSM bleibt unangetastet — dies ist ein Ableitungs-Layer "darueber".
//
// Persistenz: zuerst localStorage pro Gebiet (scim3_path_config_<gebiet>),
// spaeter committed nach data/regio_paths/<gebiet>.json via Bridge (Phase 9).
//
// In Phase 2 wird die Config nur erfasst und persistiert — die Ableitungs-
// Pipeline (Phase 3+) konsumiert sie noch nicht.

export type BridlewayMode = boolean | 'nur_wenn_foot_erlaubt';

export interface PathConfig {
  gebiet: string;
  primaere_wege: {
    track: boolean;
    footway: boolean;
    path: boolean;
    steps: boolean;
    pedestrian: boolean;
    bridleway: BridlewayMode;
  };
  konnektoren: {
    nebenstrasse: { aktiv: boolean; max_laenge_meter: number };
    landstrasse: { aktiv: boolean; max_laenge_meter: number };
    // Toleranz, ab der ein gruener Weg-Endpunkt als auf dem Konnektor liegend
    // gilt (faktisch der Verschweiss-Regler). Gelaende-/Daten-abhaengig.
    anschluss_toleranz_meter: number;
  };
  ausschluesse: {
    foot_no: boolean;
    access_private: boolean;
    access_no: boolean;
  };
  diagnose: {
    luecken_markieren: boolean;
    sackgassen_ausblenden: boolean;
    sackgasse_poi_ausnahme_meter: number;
    sackgasse_keep_list: string[];
  };
  // Anker (ann_074): Schwelle, ab der ein POI einen connected-POI-Stich bekommt.
  // Darunter gilt er als auf dem Pfad liegend. Gelaende-abhaengig.
  anker: {
    snap_schwelle_meter: number;
  };
}

export function defaultPathConfig(gebiet: string): PathConfig {
  return {
    gebiet,
    primaere_wege: {
      track: true,
      footway: true,
      path: true,
      steps: true,
      pedestrian: true,
      bridleway: 'nur_wenn_foot_erlaubt',
    },
    konnektoren: {
      nebenstrasse: { aktiv: true, max_laenge_meter: 500 },
      landstrasse: { aktiv: true, max_laenge_meter: 250 },
      anschluss_toleranz_meter: 10,
    },
    ausschluesse: {
      foot_no: true,
      access_private: true,
      access_no: true,
    },
    diagnose: {
      luecken_markieren: true,
      sackgassen_ausblenden: true,
      sackgasse_poi_ausnahme_meter: 30,
      sackgasse_keep_list: [],
    },
    anker: {
      snap_schwelle_meter: 2,
    },
  };
}

const KEY_PREFIX = 'scim3_path_config_';

export function loadPathConfig(gebiet: string): PathConfig {
  const fallback = defaultPathConfig(gebiet);
  if (!gebiet) return fallback;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + gebiet);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PathConfig>;
    // Defensiv mergen, damit neue Felder mit Defaults gefuellt werden.
    return {
      gebiet,
      primaere_wege: { ...fallback.primaere_wege, ...parsed.primaere_wege },
      konnektoren: {
        nebenstrasse: { ...fallback.konnektoren.nebenstrasse, ...parsed.konnektoren?.nebenstrasse },
        landstrasse: { ...fallback.konnektoren.landstrasse, ...parsed.konnektoren?.landstrasse },
        anschluss_toleranz_meter: parsed.konnektoren?.anschluss_toleranz_meter ?? fallback.konnektoren.anschluss_toleranz_meter,
      },
      ausschluesse: { ...fallback.ausschluesse, ...parsed.ausschluesse },
      diagnose: { ...fallback.diagnose, ...parsed.diagnose },
      anker: { ...fallback.anker, ...parsed.anker },
    };
  } catch {
    return fallback;
  }
}

export function savePathConfig(cfg: PathConfig): void {
  if (!cfg.gebiet) return;
  try {
    localStorage.setItem(KEY_PREFIX + cfg.gebiet, JSON.stringify(cfg));
  } catch { /* ignore */ }
}
