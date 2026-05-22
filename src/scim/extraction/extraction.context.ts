import type { ScimContext } from '../context/scimContext.types';
import type { ExtractionState } from './extraction.types';

export function applyExtractionToContext(
  context: ScimContext,
  extraction: ExtractionState,
): ScimContext {
  if (extraction.status !== 'extraction_valid' && extraction.status !== 'extraction_warning') {
    throw new Error('Cannot apply invalid or unextracted Extraction state to SCIM context.');
  }
  return { ...context, extracted_data: extraction };
}
