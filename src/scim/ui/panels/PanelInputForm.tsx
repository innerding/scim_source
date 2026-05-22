import type { PanelDescriptor } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';
import type { SystemAdjustState } from '../../system-adjust/systemAdjust.types';
import type { RegioContentState } from '../../regio-content/regioContent.types';
import type { TargetAppUiState } from '../../target-app-ui/targetAppUi.types';
import P01SystemAdjustForm from './P01SystemAdjustForm';
import P02RegioContentForm from './P02RegioContentForm';
import P03TargetAppUiForm from './P03TargetAppUiForm';
import P04TelcoLoadForm from './P04TelcoLoadForm';
import P08RouteLayerForm from './P08RouteLayerForm';
import P10LocalForm from './P10LocalForm';
import type { RouteModelState } from '../../route-model/routeModel.types';
import type { RouteLayerModelState } from '../../route-layer-model/routeLayerModel.types';
import type { SensusCoreLocalState } from '../../sensus-core-local/sensusCoreLocal.types';

interface Props {
  panel: PanelDescriptor;
  result: ScimPipelineResult;
}

export default function PanelInputForm({ panel, result }: Props) {
  const ctx = result.success ? result.context as unknown as Record<string, unknown> : null;

  if (panel.id === 'P01') {
    return <P01SystemAdjustForm state={ctx?.system_adjust as SystemAdjustState | undefined} />;
  }
  if (panel.id === 'P02') {
    return <P02RegioContentForm state={ctx?.regio_content as RegioContentState | undefined} />;
  }
  if (panel.id === 'P03') {
    return <P03TargetAppUiForm state={ctx?.target_app_ui as TargetAppUiState | undefined} />;
  }
  if (panel.id === 'P04') {
    return <P04TelcoLoadForm state={ctx?.telco_load as import('../../telco-load/telcoLoad.types').TelcoLoadState | undefined} />;
  }
  if (panel.id === 'P08') {
    return <P08RouteLayerForm
      routeModel={ctx?.route_model as RouteModelState | undefined}
      routeLayerModel={ctx?.route_layer_model as RouteLayerModelState | undefined}
    />;
  }
  if (panel.id === 'P10') {
    const local = ctx?.sensus_core_local as SensusCoreLocalState | undefined;
    return <P10LocalForm
      enabled={local != null && local.status !== 'not_loaded'}
      tolerances={local?.tolerances}
    />;
  }

  return (
    <div style={{ fontSize: 12, color: '#a0aec0', fontFamily: 'monospace' }}>
      Eingabe: {panel.inputMode}
    </div>
  );
}
