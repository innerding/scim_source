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
