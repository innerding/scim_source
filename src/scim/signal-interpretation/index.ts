export type {
  SignalCategory,
  SignalClassificationReason,
  ClassifiedSignalPoint,
  SignalCategorySummary,
  SignalInterpretationStatus,
  SignalInterpretationIssue,
  SignalInterpretationValidationResult,
  SignalInterpretationState,
} from './signalInterpretation.types';
export { validateSignalInterpretation } from './signalInterpretation.validation';
export { applySignalInterpretationToContext } from './signalInterpretation.context';
export { computeSignalInterpretation } from './signalInterpretation.compute';
export {
  mockPointFlow,
  mockPointAccumulation,
  mockPointForcedByZone,
  mockPointAmbiguous,
  mockSignalInterpretationState,
  mockSignalInterpretationEmpty,
} from './signalInterpretation.mock';
