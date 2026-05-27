import { useMemo } from 'react';
import { runScimPipeline } from '../pipeline/scimPipeline';
import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { mockTargetAppUiState } from '../target-app-ui/targetAppUi.mock';
import { mockTelcoLoadState } from '../telco-load/telcoLoad.mock';
import { mockGraphState } from '../graph/graph.mock';

const mockRoadNetwork = {
  source: 'mock' as const,
  nodes: mockGraphState.nodes.map((n) => ({
    node_id: n.node_id,
    geometry: n.geometry,
    node_type: n.node_type,
    elevation_meters: n.elevation_meters,
  })),
  edges: mockGraphState.edges.map((e) => ({
    edge_id: e.edge_id,
    from_node_id: e.from_node_id,
    to_node_id: e.to_node_id,
    geometry: e.geometry,
    length_meters: e.length_meters,
    edge_type: e.edge_type,
    surface_type: e.surface_type,
    difficulty_class: e.difficulty_class,
    bidirectional: e.bidirectional,
  })),
  // Bbox passt zur Lichtenberg-Region (siehe regio-content.mock + graph.mock).
  bbox: [14.22, 48.36, 14.29, 48.42] as [number, number, number, number],
};

export function useScimPipeline(): ScimPipelineResult {
  return useMemo(
    () =>
      runScimPipeline({
        system_adjust: mockSystemAdjustState,
        regio_content: mockRegioContentState,
        target_app_ui: mockTargetAppUiState,
        telco_load: mockTelcoLoadState,
        road_network: mockRoadNetwork,
        run_id: 'ui_demo_run',
      }),
    [],
  );
}
