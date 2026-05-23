import type { ScimContext } from '../context/scimContext.types';
import type { SvgOverlayState } from './svgOverlay.types';

export function applySvgOverlayToContext(
  ctx: ScimContext,
  state: SvgOverlayState,
): ScimContext {
  return { ...ctx, svg_overlay: state as any };
}
