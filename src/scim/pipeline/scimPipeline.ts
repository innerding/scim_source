import { makeEmptyContext } from '../context/scimContext.types';
import type { ScimContext } from '../context/scimContext.types';
import type {
  ScimPipelineInputs,
  ScimPipelineResult,
  ScimPipelineStepId,
  ScimPipelineStepResult,
  ScimPipelineError,
} from './scimPipeline.types';

// Validators
import { validateSystemAdjust } from '../system-adjust/systemAdjust.validation';
import { validateRegioContent } from '../regio-content/regioContent.validation';
import { validateTargetAppUi } from '../target-app-ui/targetAppUi.validation';
import { validateTelcoLoad } from '../telco-load/telcoLoad.validation';
import { validateBoundary } from '../boundary/boundary.validation';
import { validateExtraction } from '../extraction/extraction.validation';
import { validateGraph } from '../graph/graph.validation';
import { validateBasisLayer } from '../basis-layer/basisLayer.validation';
import { validateLeafletBasisCheck } from '../leaflet-basis-check/leafletBasisCheck.validation';
import { validatePoiModel } from '../poi-model/poiModel.validation';
import { validateLoadProjection } from '../load-projection/loadProjection.validation';
import { validateMovementModel } from '../movement-model/movementModel.validation';
import { validateMaskingModel } from '../masking-model/maskingModel.validation';
import { validateRouteModel } from '../route-model/routeModel.validation';
import { validateRouteLayerModel } from '../route-layer-model/routeLayerModel.validation';
import { validateLayerModel } from '../layer-model/layerModel.validation';
import { validateSensusCorePackage } from '../sensus-core-package/sensusCorePackage.validation';
import { validateSensusCoreLocal } from '../sensus-core-local/sensusCoreLocal.validation';
import { validateSensusCoreView } from '../sensus-core-view/sensusCoreView.validation';
import { validateLeafletEffectCheck } from '../leaflet-effect-check/leafletEffectCheck.validation';
import { validateReleaseExport } from '../release-export/releaseExport.validation';
import { validateScimRuntimeContext } from '../scim-runtime-context/scimRuntimeContext.validation';

// Context appliers
import { applySystemAdjustToContext } from '../system-adjust/systemAdjust.context';
import { applyRegioContentToContext } from '../regio-content/regioContent.context';
import { applyTargetAppUiToContext } from '../target-app-ui/targetAppUi.context';
import { applyTelcoLoadToContext } from '../telco-load/telcoLoad.context';
import { applyBoundaryToContext } from '../boundary/boundary.context';
import { applyExtractionToContext } from '../extraction/extraction.context';
import { applyGraphToContext } from '../graph/graph.context';
import { applyBasisLayerToContext } from '../basis-layer/basisLayer.context';
import { applyLeafletBasisCheckToContext } from '../leaflet-basis-check/leafletBasisCheck.context';
import { applyPoiModelToContext } from '../poi-model/poiModel.context';
import { applyLoadProjectionToContext } from '../load-projection/loadProjection.context';
import { applyMovementModelToContext } from '../movement-model/movementModel.context';
import { applyMaskingModelToContext } from '../masking-model/maskingModel.context';
import { applyRouteModelToContext } from '../route-model/routeModel.context';
import { applyRouteLayerModelToContext } from '../route-layer-model/routeLayerModel.context';
import { applyLayerModelToContext } from '../layer-model/layerModel.context';
import { applySensusCorePackageToContext } from '../sensus-core-package/sensusCorePackage.context';
import { applySensusCoreLocalToContext } from '../sensus-core-local/sensusCoreLocal.context';
import { applySensusCoreViewToContext } from '../sensus-core-view/sensusCoreView.context';
import { applyLeafletEffectCheckToContext } from '../leaflet-effect-check/leafletEffectCheck.context';
import { applyReleaseExportToContext } from '../release-export/releaseExport.context';
import { applyScimRuntimeContextToContext } from '../scim-runtime-context/scimRuntimeContext.context';

// Compute functions — all panels real (Steps B–E)
import {
  computeSystemAdjust,
  computeRegioContent,
  computeTargetAppUi,
  computeTelcoLoad,
  computeBoundary,
  computeExtraction,
  computeGraph,
  computeBasisLayer,
  computeLeafletBasisCheck,
  computePoiModel,
  computeLoadProjection,
  computeMovementModel,
  computeMaskingModel,
  computeRouteModel,
  computeRouteLayerModel,
  computeLayerModel,
  computeSensusCorePackage,
  computeSensusCoreLocal,
  computeSensusCoreView,
  computeLeafletEffectCheck,
  computeReleaseExport,
  computeScimRuntimeContext,
} from './scimPipeline.compute';

// ── Internal helpers ──────────────────────────────────────────────────────────

function makeId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Derive panel status from the validation result. */
function stampStatus(
  isValid: boolean,
  hasWarnings: boolean,
  valid: string,
  warning: string,
  invalid: string,
): string {
  if (!isValid) return invalid;
  return hasWarnings ? warning : valid;
}

interface StepTracker {
  steps: ScimPipelineStepResult[];
  errors: ScimPipelineError[];
  warnings: ScimPipelineError[];
}

function recordStep(
  tracker: StepTracker,
  stepId: ScimPipelineStepId,
  validationErrors: number,
  validationWarnings: number,
  durationMs: number,
): void {
  tracker.steps.push({
    step_id: stepId,
    success: validationErrors === 0,
    duration_ms: durationMs,
    validation_errors: validationErrors,
    validation_warnings: validationWarnings,
  });
  if (validationErrors > 0) {
    tracker.errors.push({
      step_id: stepId,
      code: 'VALIDATION_FAILED',
      message: `${validationErrors} validation error(s) in ${stepId}`,
    });
  }
}

function failResult(
  run_id: string,
  started_at: string,
  ctx: ScimContext,
  tracker: StepTracker,
  failedAt: ScimPipelineStepId,
): ScimPipelineResult {
  const completed_at = new Date().toISOString();
  return {
    run_id,
    success: false,
    context: ctx,
    failed_at_step: failedAt,
    steps: tracker.steps,
    errors: tracker.errors,
    warnings: tracker.warnings,
    started_at,
    completed_at,
    duration_ms: Date.now() - new Date(started_at).getTime(),
  };
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export function runScimPipeline(inputs: ScimPipelineInputs): ScimPipelineResult {
  const run_id = inputs.run_id ?? makeId();
  const started_at = inputs.requested_at ?? new Date().toISOString();
  const tracker: StepTracker = { steps: [], errors: [], warnings: [] };

  let ctx = makeEmptyContext('production');

  // ── Panel 1: SystemAdjust ─────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeSystemAdjust(ctx, inputs);
    const v = validateSystemAdjust(raw);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'system_adjust_valid', 'system_adjust_warning', 'system_adjust_invalid'),
    };
    recordStep(tracker, 'panel_1_system_adjust', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_1_system_adjust');
    ctx = applySystemAdjustToContext(ctx, state as any);
  }

  // ── Panel 2: RegioContent ─────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeRegioContent(ctx, inputs);
    const v = validateRegioContent(raw, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'regio_content_valid', 'regio_content_warning', 'regio_content_invalid'),
    };
    recordStep(tracker, 'panel_2_regio_content', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_2_regio_content');
    ctx = applyRegioContentToContext(ctx, state as any);
  }

  // ── Panel 3: TargetAppUi ──────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeTargetAppUi(ctx, inputs);
    const v = validateTargetAppUi(raw, ctx.system_adjust as any, ctx.regio_content as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'target_app_ui_valid', 'target_app_ui_warning', 'target_app_ui_invalid'),
    };
    recordStep(tracker, 'panel_3_target_app_ui', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_3_target_app_ui');
    ctx = applyTargetAppUiToContext(ctx, state as any);
  }

  // ── Panel 4: TelcoLoad ────────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeTelcoLoad(ctx, inputs);
    const v = validateTelcoLoad(raw, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'telco_load_valid', 'telco_load_warning', 'telco_load_invalid'),
    };
    recordStep(tracker, 'panel_4_telco_load', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_4_telco_load');
    ctx = applyTelcoLoadToContext(ctx, state as any);
  }

  // ── Panel 5: Boundary ─────────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeBoundary(ctx, inputs);
    const v = validateBoundary(raw, ctx.system_adjust as any, ctx.regio_content as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'boundary_valid', 'boundary_warning', 'boundary_invalid'),
    };
    recordStep(tracker, 'panel_5_boundary', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_5_boundary');
    ctx = applyBoundaryToContext(ctx, state as any);
  }

  // ── Panel 5: Extraction ───────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeExtraction(ctx, inputs);
    const v = validateExtraction(raw, ctx.boundary as any, ctx.regio_content as any, ctx.telco_load as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'extraction_valid', 'extraction_warning', 'extraction_invalid'),
    };
    recordStep(tracker, 'panel_5_extraction', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_5_extraction');
    ctx = applyExtractionToContext(ctx, state as any);
  }

  // ── Panel 6: Graph ────────────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeGraph(ctx, inputs);
    const v = validateGraph(raw, ctx.boundary as any, ctx.extracted_data as any, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'graph_valid', 'graph_warning', 'graph_invalid'),
    };
    recordStep(tracker, 'panel_6_graph', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_6_graph');
    ctx = applyGraphToContext(ctx, state as any);
  }

  // ── Panel 6: BasisLayer ───────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeBasisLayer(ctx, inputs);
    const v = validateBasisLayer(raw, ctx.boundary as any, ctx.graph as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'basis_layer_valid', 'basis_layer_warning', 'basis_layer_invalid'),
    };
    recordStep(tracker, 'panel_6_basis_layer', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_6_basis_layer');
    ctx = applyBasisLayerToContext(ctx, state as any);
  }

  // ── LeafletBasisCheck (non-blocking) ──────────────────────────────────────
  {
    const raw = computeLeafletBasisCheck(ctx, inputs);
    const v = validateLeafletBasisCheck(raw, ctx.basis_layer as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'leaflet_basis_ok', 'leaflet_basis_warning', 'leaflet_basis_failed'),
    };
    for (const w of v.warnings) {
      tracker.warnings.push({ step_id: 'panel_6_basis_layer', code: w.code, message: w.message });
    }
    ctx = applyLeafletBasisCheckToContext(ctx, state as any);
  }

  // ── Panel 7: PoiModel ─────────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computePoiModel(ctx, inputs);
    const v = validatePoiModel(raw, ctx.extracted_data as any, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'poi_model_valid', 'poi_model_warning', 'poi_model_invalid'),
    };
    recordStep(tracker, 'panel_7_poi_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_7_poi_model');
    ctx = applyPoiModelToContext(ctx, state as any);
  }

  // ── Panel 7: LoadProjection ───────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeLoadProjection(ctx, inputs);
    const v = validateLoadProjection(raw, ctx.graph as any, ctx.extracted_data as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'load_projection_valid', 'load_projection_warning', 'load_projection_invalid'),
    };
    recordStep(tracker, 'panel_7_load_projection', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_7_load_projection');
    ctx = applyLoadProjectionToContext(ctx, state as any);
  }

  // ── Panel 7: MovementModel ────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeMovementModel(ctx, inputs);
    const v = validateMovementModel(raw, ctx.graph as any, ctx.load_model as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'movement_model_valid', 'movement_model_warning', 'movement_model_invalid'),
    };
    recordStep(tracker, 'panel_7_movement_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_7_movement_model');
    ctx = applyMovementModelToContext(ctx, state as any);
  }

  // ── Panel 7: MaskingModel ─────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeMaskingModel(ctx, inputs);
    const v = validateMaskingModel(raw, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'masking_model_valid', 'masking_model_warning', 'masking_model_invalid'),
    };
    recordStep(tracker, 'panel_7_masking_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_7_masking_model');
    ctx = applyMaskingModelToContext(ctx, state as any);
  }

  // ── Panel 8: RouteModel ───────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeRouteModel(ctx, inputs);
    const v = validateRouteModel(raw, ctx.movement_model as any, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'route_model_valid', 'route_model_warning', 'route_model_invalid'),
    };
    recordStep(tracker, 'panel_8_route_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_8_route_model');
    ctx = applyRouteModelToContext(ctx, state as any);
  }

  // ── Panel 8: RouteLayerModel ──────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeRouteLayerModel(ctx, inputs);
    const v = validateRouteLayerModel(raw, ctx.route_model as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'route_layer_model_valid', 'route_layer_model_warning', 'route_layer_model_invalid'),
    };
    recordStep(tracker, 'panel_8_route_layer_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_8_route_layer_model');
    ctx = applyRouteLayerModelToContext(ctx, state as any);
  }

  // ── Panel 8: LayerModel ───────────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeLayerModel(ctx, inputs);
    const v = validateLayerModel(raw, ctx.route_layer_model as any, ctx.basis_layer as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'layer_model_valid', 'layer_model_warning', 'layer_model_invalid'),
    };
    recordStep(tracker, 'panel_8_layer_model', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_8_layer_model');
    ctx = applyLayerModelToContext(ctx, state as any);
  }

  // ── Panel 9: SensusCorePackage ────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeSensusCorePackage(ctx, inputs);
    const v = validateSensusCorePackage(raw, ctx.layer_model as any, ctx.system_adjust as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'package_valid', 'package_warning', 'package_invalid'),
    };
    recordStep(tracker, 'panel_9_sensus_core_package', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_9_sensus_core_package');
    ctx = applySensusCorePackageToContext(ctx, state as any);
  }

  // ── Panel 10: SensusCoreLocal (optional) ──────────────────────────────────
  if (inputs.user_tolerances) {
    const t0 = Date.now();
    const raw = computeSensusCoreLocal(ctx, inputs);
    if (raw) {
      const v = validateSensusCoreLocal(raw, ctx.system_adjust as any);
      const state = {
        ...raw,
        validation: v,
        status: stampStatus(v.is_valid, false,
          'local_context_valid', 'local_context_valid', 'local_context_invalid'),
      };
      recordStep(tracker, 'panel_10_sensus_core_local', v.errors.length, v.warnings.length, Date.now() - t0);
      if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_10_sensus_core_local');
      ctx = applySensusCoreLocalToContext(ctx, state as any);
    }
  }

  // ── SensusCoreView (non-blocking) ─────────────────────────────────────────
  {
    const raw = computeSensusCoreView(ctx, inputs);
    const v = validateSensusCoreView(raw, ctx.sensus_core_package as any);
    const state = {
      ...raw,
      validation: v,
      status: v.is_valid ? 'view_active' : 'view_error',
    };
    for (const w of v.warnings) {
      tracker.warnings.push({ step_id: 'panel_9_sensus_core_package', code: w.code, message: w.message });
    }
    ctx = applySensusCoreViewToContext(ctx, state as any);
  }

  // ── Panel 11: LeafletEffectCheck ──────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeLeafletEffectCheck(ctx, inputs);
    const v = validateLeafletEffectCheck(raw, ctx.sensus_core_package as any);
    const state = {
      ...raw,
      validation: v,
      status: stampStatus(v.is_valid, v.warnings.length > 0,
        'effect_check_ok', 'effect_check_warning', 'effect_check_failed'),
    };
    recordStep(tracker, 'panel_11_leaflet_effect_check', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_11_leaflet_effect_check');
    ctx = applyLeafletEffectCheckToContext(ctx, state as any);
  }

  // ── Panel 12: ReleaseExport ───────────────────────────────────────────────
  {
    const t0 = Date.now();
    const raw = computeReleaseExport(ctx, inputs);
    const v = validateReleaseExport(raw, ctx.sensus_core_package as any, ctx.leaflet_effect_check as any);
    const state = {
      ...raw,
      validation: v,
      status: v.is_valid ? 'released' : 'release_failed',
    };
    recordStep(tracker, 'panel_12_release_export', v.errors.length, v.warnings.length, Date.now() - t0);
    if (!v.is_valid) return failResult(run_id, started_at, ctx, tracker, 'panel_12_release_export');
    ctx = applyReleaseExportToContext(ctx, state as any);
  }

  // ── Runtime context manifest (non-blocking) ───────────────────────────────
  {
    const raw = computeScimRuntimeContext(ctx, inputs);
    const v = validateScimRuntimeContext(raw);
    const state = { ...raw, validation: v };
    for (const w of v.warnings) {
      tracker.warnings.push({ step_id: 'panel_12_release_export', code: w.code, message: w.message });
    }
    ctx = applyScimRuntimeContextToContext(ctx, state as any);
  }

  const completed_at = new Date().toISOString();
  return {
    run_id,
    success: true,
    context: ctx,
    release: ctx.release as any,
    steps: tracker.steps,
    errors: tracker.errors,
    warnings: tracker.warnings,
    started_at,
    completed_at,
    duration_ms: Date.now() - new Date(started_at).getTime(),
  };
}
