import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';
import type { ReleaseExportState } from '../release-export/releaseExport.types';
import type { ScimRuntimeContextState } from '../scim-runtime-context/scimRuntimeContext.types';

interface Props {
  result: ScimPipelineResult;
}

const STATUS_COLOR: Record<string, string> = {
  ok: '#3d9970',
  warn: '#ff851b',
  fail: '#ff4136',
};

function stepColor(errors: number, warnings: number): string {
  if (errors > 0) return STATUS_COLOR.fail;
  if (warnings > 0) return STATUS_COLOR.warn;
  return STATUS_COLOR.ok;
}

function stepIcon(errors: number, warnings: number): string {
  if (errors > 0) return '✗';
  if (warnings > 0) return '△';
  return '✓';
}

const LABEL: Record<string, string> = {
  panel_1_system_adjust:       'P01 SystemAdjust',
  panel_2_regio_content:       'P02 RegioContent',
  panel_3_target_app_ui:       'P03 TargetAppUi',
  panel_4_telco_load:          'P04 TelcoLoad',
  panel_5_boundary:            'P05 Boundary',
  panel_5_extraction:          'P05 Extraction',
  panel_6_graph:               'P06 Graph',
  panel_6_basis_layer:         'P06 BasisLayer',
  panel_7_poi_model:           'P07 PoiModel',
  panel_7_load_projection:     'P07 LoadProjection',
  panel_7_movement_model:      'P07 MovementModel',
  panel_7_masking_model:       'P07 MaskingModel',
  panel_8_route_model:         'P08 RouteModel',
  panel_8_route_layer_model:   'P08 RouteLayerModel',
  panel_8_layer_model:         'P08 LayerModel',
  panel_9_sensus_core_package: 'P09 SensusCorePackage',
  panel_10_sensus_core_local:  'P10 SensusCoreLocal',
  panel_11_leaflet_effect_check: 'P11 LeafletEffectCheck',
  panel_12_release_export:     'P12 ReleaseExport',
};

export default function PipelineLog({ result }: Props) {
  const release = result.context.release as unknown as ReleaseExportState | undefined;
  const runtime = result.context.scim_context as unknown as ScimRuntimeContextState | undefined;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      fontSize: '12px',
      background: '#111',
      color: '#e0e0e0',
      borderLeft: '1px solid #333',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #333' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
          SCIM Pipeline
        </div>
        <div style={{ color: result.success ? STATUS_COLOR.ok : STATUS_COLOR.fail, fontSize: '11px' }}>
          {result.success ? '● Released' : `● Failed at ${result.failed_at_step}`}
        </div>
        <div style={{ color: '#666', fontSize: '10px', marginTop: 2 }}>
          {result.run_id} · {result.duration_ms}ms
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {result.steps.map((step) => (
          <div
            key={step.step_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3px 14px',
              gap: 8,
            }}
          >
            <span style={{
              color: stepColor(step.validation_errors, step.validation_warnings),
              width: 12,
              flexShrink: 0,
            }}>
              {stepIcon(step.validation_errors, step.validation_warnings)}
            </span>
            <span style={{ flex: 1, color: '#ccc' }}>
              {LABEL[step.step_id] ?? step.step_id}
            </span>
            <span style={{ color: '#555', fontSize: '10px' }}>
              {step.duration_ms}ms
            </span>
          </div>
        ))}
      </div>

      {/* Metrics */}
      {runtime && (
        <div style={{ borderTop: '1px solid #333', padding: '8px 14px' }}>
          <div style={{ color: '#888', marginBottom: 4 }}>Completeness</div>
          <div style={{ background: '#222', borderRadius: 3, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${(runtime.pipeline_completeness * 100).toFixed(0)}%`,
              height: '100%',
              background: STATUS_COLOR.ok,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ color: '#555', marginTop: 2, fontSize: '10px' }}>
            {(runtime.pipeline_completeness * 100).toFixed(0)}% · {runtime.assembled_panels.length}/{runtime.assembled_panels.length + runtime.missing_panels.length} panels
          </div>
        </div>
      )}

      {/* Release info */}
      {release && (
        <div style={{ borderTop: '1px solid #333', padding: '8px 14px 12px' }}>
          <div style={{ color: STATUS_COLOR.ok, marginBottom: 2 }}>
            ↑ {release.release_id}
          </div>
          <div style={{ color: '#555', fontSize: '10px' }}>
            schema {release.metadata.schema_version} · {release.metadata.target_format}
          </div>
          {release.expires_at && (
            <div style={{ color: '#444', fontSize: '10px', marginTop: 1 }}>
              expires {new Date(release.expires_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
