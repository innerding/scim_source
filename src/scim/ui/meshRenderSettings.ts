// Mesh-Render-Einstellungen — drei abschaltbare Effekte, damit man bei mangelnder
// Performance degradieren und rasch zu einem MVP-Ergebnis kommen kann. REINE
// Render-Schicht: berührt NIE das Segment-id-↔-Last-Modell. Konsens 2026-06-04.
//   gradients — glatter Farbverlauf je Kante (aus = flach, K=1, billiger)
//   dpZoom    — Mesh vereinfachen (Glow weg + gröbere Kurve) — entlastet beim Rauszoomen
//   atmen     — sanftes Pulsieren des Overlays (CSS-Deckkraft, GPU-billig)
import { useEffect, useState } from 'react';

export interface MeshSettings { gradients: boolean; dpZoom: boolean; atmen: boolean; }

const KEY = 'scim_mesh_render_v1';
// Default = beste Qualität; der User degradiert bei Bedarf (atmen ist Opt-in).
const DEFAULT: MeshSettings = { gradients: true, dpZoom: false, atmen: false };

function load(): MeshSettings {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return DEFAULT; }
}

let state: MeshSettings = load();
const subs = new Set<() => void>();

export function getMeshSettings(): MeshSettings { return state; }

export function setMeshSetting(k: keyof MeshSettings, v: boolean): void {
  state = { ...state, [k]: v };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function useMeshSettings(): MeshSettings {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);
  return state;
}
