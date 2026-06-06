// @LEGACY (2026-06-06): Koords-Segmentformat (SvgSegment) — Modell B liefert segId-only,
// kein Koords-Overlay. NICHT im Auslieferungspfad (Design-Manifest · Auslieferung).
// Löschen mit der Demo-Ablösung (Operator-Commit). Siehe docs/aufraeum_inventar.md (K3.2).
export type {
  SvgSegment,
  SvgOverlayState,
  SvgOverlayStatus,
  SvgOverlayIssue,
  SvgOverlayValidationResult,
} from './svgOverlay.types';

export { computeSvgOverlay } from './svgOverlay.compute';
export { validateSvgOverlay } from './svgOverlay.validation';
export { applySvgOverlayToContext } from './svgOverlay.context';
