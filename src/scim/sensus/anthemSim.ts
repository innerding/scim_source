// Anthem-Sim (Sim-Telco) — die Last-Mathematik lebt jetzt in shell-kit (app/anthem.ts),
// EINE Quelle für Editor (Coder/Studio/Worker) und Runtime. Diese Datei ist nur noch ein
// Re-Export-Shim, damit die bestehenden Importeure unverändert laufen.
export {
  simSegmentLoads,
  stretchAverages,
  normalizeLoads,
  classifyStretches,
  loadColour,
} from 'shell-kit';
export type {
  LatLng,
  SegmentedNet,
  StretchLoad,
  NormalizeParams,
  StretchState,
  ClassifiedStretch,
  ClassifyParams,
} from 'shell-kit';
