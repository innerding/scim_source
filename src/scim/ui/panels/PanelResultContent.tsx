// Specific result views for all auto_computed panels (P05–P12).
// Each view reads the real pipeline context and renders meaningful data.
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';
import type { BoundaryState } from '../../boundary/boundary.types';
import type { ExtractionState } from '../../extraction/extraction.types';
import type { GraphState } from '../../graph/graph.types';
import type { BasisLayerState } from '../../basis-layer/basisLayer.types';
import type { PoiModelState } from '../../poi-model/poiModel.types';
import type { LoadProjectionState } from '../../load-projection/loadProjection.types';
import type { MovementModelState } from '../../movement-model/movementModel.types';
import type { MaskingModelState } from '../../masking-model/maskingModel.types';
import type { RouteModelState } from '../../route-model/routeModel.types';
import type { RouteLayerModelState } from '../../route-layer-model/routeLayerModel.types';
import type { LayerModelState } from '../../layer-model/layerModel.types';
import type { SensusCorePackageState } from '../../sensus-core-package/sensusCorePackage.types';
import type { LeafletEffectCheckState } from '../../leaflet-effect-check/leafletEffectCheck.types';
import type { ReleaseExportState } from '../../release-export/releaseExport.types';
import type { ScimRuntimeContextState } from '../../scim-runtime-context/scimRuntimeContext.types';
import { generateScimBundle, downloadScimBundle } from '../../release-export/scimBundle';
import BundlePublisher from '../../release-export/BundlePublisher';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Row({ label, value, mono = false, right }: {
  label: string; value: React.ReactNode; mono?: boolean; right?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '5px 0',
      borderBottom: '1px solid #edf2f7', fontSize: 12, alignItems: 'baseline',
    }}>
      <span style={{ color: '#718096', minWidth: 200, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: '#2d3748', fontFamily: mono ? 'monospace' : 'inherit',
        fontSize: mono ? 11 : 12, marginLeft: right ? 'auto' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#4a5568',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        padding: '12px 0 5px', borderBottom: '1px solid #e2e8f0', marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace', color, background: bg,
      padding: '2px 6px', borderRadius: 3, marginRight: 4, display: 'inline-block',
    }}>
      {text}
    </span>
  );
}

function MiniBar({ value, color = '#4299e1', max = 1 }: { value: number; color?: string; max?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        display: 'inline-block', height: 6, borderRadius: 3,
        width: 80, background: '#edf2f7', position: 'relative', overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color, borderRadius: 3,
        }} />
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#2d3748' }}>
        {typeof value === 'number' && value < 10 && !Number.isInteger(value)
          ? value.toFixed(2)
          : value}
      </span>
    </span>
  );
}

function noData() {
  return (
    <div style={{
      fontSize: 12, color: '#a0aec0', padding: '16px 0',
      fontStyle: 'italic', textAlign: 'center',
    }}>
      Noch kein Ergebnis — Pipeline ausführen.
    </div>
  );
}

function scoreColor(v: number): string {
  if (v < 0.4) return '#2ecc40';
  if (v < 0.65) return '#ffdc00';
  if (v < 0.80) return '#ff851b';
  return '#ff4136';
}

// ─── P05: Boundary + Extraction ──────────────────────────────────────────────

export function P05Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const boundary = ctx.boundary as BoundaryState | undefined;
  const extraction = ctx.extracted_data as ExtractionState | undefined;

  if (!boundary && !extraction) return noData();

  const bb = boundary?.computed_boundary.bbox;
  const bboxStr = bb ? `[${bb.map((n) => n.toFixed(3)).join(', ')}]` : '—';
  const bboxDimLon = bb ? `${((bb[2] - bb[0]) * 111).toFixed(1)} km` : '—';
  const bboxDimLat = bb ? `${((bb[3] - bb[1]) * 111).toFixed(1)} km` : '—';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {boundary && (
        <Section title="Boundary">
          <Row label="Boundary-ID" value={boundary.boundary_id} mono />
          <Row label="Bounding Box" value={bboxStr} mono />
          <Row label="Ausdehnung (lon × lat)" value={`${bboxDimLon} × ${bboxDimLat}`} />
          <Row label="Fläche" value={boundary.computed_boundary.area_sqkm != null
            ? `${boundary.computed_boundary.area_sqkm.toFixed(1)} km²`
            : '—'} />
          <Row label="Buffer" value={`${boundary.buffer_spec.computed_buffer_meters} m`} mono />
          <Row label="POIs im Boundary" value={boundary.poi_count_within} />
          <Row label="Status" value={boundary.status} mono />
        </Section>
      )}

      {extraction && (
        <Section title={`Extraktion — ${extraction.extracted_pois.length} POIs · ${extraction.extracted_signal_groups.length} Signal-Gruppen`}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            {extraction.extracted_pois.slice(0, 10).map((poi) => (
              <div key={poi.poi_id} style={{
                display: 'flex', gap: 10, padding: '5px 10px',
                borderBottom: '1px solid #edf2f7', fontSize: 11,
              }}>
                <span style={{ color: '#2d3748', flex: 1 }}>{poi.name ?? poi.poi_id}</span>
                <span style={{ color: '#a0aec0', fontFamily: 'monospace' }}>{poi.category}</span>
                <span style={{ color: '#718096' }}>{poi.radius_meters}m</span>
                <span style={{
                  fontFamily: 'monospace', fontSize: 10,
                  color: '#4a5568',
                }}>
                  [{poi.center.coordinates[1].toFixed(3)}, {poi.center.coordinates[0].toFixed(3)}]
                </span>
              </div>
            ))}
            {extraction.extracted_pois.length > 10 && (
              <div style={{ padding: '4px 10px', fontSize: 11, color: '#a0aec0', fontStyle: 'italic' }}>
                … {extraction.extracted_pois.length - 10} weitere
              </div>
            )}
          </div>
          <Row label="Signal-Gruppen extrahiert" value={extraction.extracted_signal_groups.length} />
          <Row label="Status" value={extraction.status} mono />
        </Section>
      )}
    </div>
  );
}

// ─── P06: Graph + BasisLayer ──────────────────────────────────────────────────

export function P06Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const graph = ctx.graph as GraphState | undefined;
  const basisLayer = ctx.basis_layer as BasisLayerState | undefined;

  if (!graph && !basisLayer) return noData();

  const totalKm = graph ? (graph.metrics.total_length_meters / 1000).toFixed(2) : '—';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {graph && (
        <Section title="Graph">
          <Row label="Graph-ID" value={graph.graph_id} mono />
          <Row label="Knoten" value={graph.metrics.node_count} />
          <Row label="Kanten" value={graph.metrics.edge_count} />
          <Row label="Gesamtlänge" value={`${totalKm} km`} />
          <Row label="Status" value={graph.status} mono />

          {graph.edges.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: '#718096', margin: '10px 0 5px' }}>
                Kanten (erste 8):
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                {graph.edges.slice(0, 8).map((edge) => (
                  <div key={edge.edge_id} style={{
                    display: 'flex', gap: 8, padding: '4px 10px',
                    borderBottom: '1px solid #edf2f7', fontSize: 11,
                  }}>
                    <span style={{ fontFamily: 'monospace', color: '#2d3748', minWidth: 80 }}>
                      {edge.edge_id}
                    </span>
                    <span style={{ color: '#a0aec0' }}>{edge.edge_type}</span>
                    <span style={{ color: '#718096', marginLeft: 'auto' }}>
                      {edge.length_meters != null ? `${edge.length_meters.toFixed(0)} m` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      {basisLayer && (
        <Section title="Basis-Layer">
          <Row label="BasisLayer-ID" value={basisLayer.basis_layer_id} mono />
          <Row label="Layer-Typen" value={basisLayer.tile_layers.map((l) => l.layer_type).join(', ')} mono />
          <Row label="Viewport Zoom" value={`${basisLayer.viewport.min_zoom}–${basisLayer.viewport.max_zoom}`} />
          <Row label="Status" value={basisLayer.status} mono />
        </Section>
      )}
    </div>
  );
}

// ─── P07: Engine (4 Modelle) ─────────────────────────────────────────────────

const LOAD_CLASS_STYLE: Record<string, { color: string; bg: string }> = {
  quiet:     { color: '#276749', bg: '#f0fff4' },
  moderate:  { color: '#975a16', bg: '#fffbeb' },
  busy:      { color: '#c05621', bg: '#fff8f0' },
  very_busy: { color: '#c53030', bg: '#fff5f5' },
  unknown:   { color: '#718096', bg: '#f7fafc' },
};

export function P07Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const poiModel = ctx.poi_model as PoiModelState | undefined;
  const loadProj = ctx.load_model as LoadProjectionState | undefined;
  const movement = ctx.movement_model as MovementModelState | undefined;
  const masking = ctx.masking_model as MaskingModelState | undefined;

  if (!poiModel && !loadProj && !movement && !masking) return noData();

  // POI load class distribution
  const poiClassCounts: Record<string, number> = {};
  poiModel?.evaluated_pois.forEach((p) => {
    poiClassCounts[p.load_class] = (poiClassCounts[p.load_class] ?? 0) + 1;
  });

  // Edge load class distribution
  const edgeClassCounts: Record<string, number> = {};
  loadProj?.edge_load_scores.forEach((e) => {
    edgeClassCounts[e.load_class] = (edgeClassCounts[e.load_class] ?? 0) + 1;
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {poiModel && (
        <Section title={`POI-Modell — ${poiModel.evaluated_pois.length} POIs bewertet`}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.entries(poiClassCounts).map(([cls, count]) => {
              const s = LOAD_CLASS_STYLE[cls] ?? LOAD_CLASS_STYLE['unknown'];
              return (
                <div key={cls} style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: s.bg, border: `1px solid ${s.color}30`,
                  fontSize: 12, color: s.color, textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{count}</div>
                  <div>{cls.replace(/_/g, ' ')}</div>
                </div>
              );
            })}
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
            {poiModel.evaluated_pois.map((poi) => {
              const s = LOAD_CLASS_STYLE[poi.load_class] ?? LOAD_CLASS_STYLE['unknown'];
              return (
                <div key={poi.poi_id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
                  borderBottom: '1px solid #edf2f7', fontSize: 11,
                }}>
                  <span style={{ flex: 1, color: '#2d3748' }}>{poi.name ?? poi.poi_id}</span>
                  <MiniBar value={poi.normalized_load_score} color={scoreColor(poi.normalized_load_score)} />
                  <Badge text={poi.load_class} color={s.color} bg={s.bg} />
                </div>
              );
            })}
          </div>
          <Row label="Bewertet" value={poiModel.metrics.evaluated_poi_count} />
          <Row label="Ruhig / Belastet / Unbekannt" value={`${poiModel.metrics.quiet_poi_count} / ${poiModel.metrics.busy_poi_count} / ${poiModel.metrics.unknown_poi_count}`} />
        </Section>
      )}

      {loadProj && (
        <Section title={`Last-Projektion — ${loadProj.metrics.projected_edge_count} Kanten`}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(edgeClassCounts).map(([cls, count]) => {
              const s = LOAD_CLASS_STYLE[cls] ?? LOAD_CLASS_STYLE['unknown'];
              return (
                <div key={cls} style={{
                  padding: '5px 10px', borderRadius: 5,
                  background: s.bg, border: `1px solid ${s.color}30`,
                  fontSize: 11, color: s.color,
                }}>
                  <strong>{count}</strong> {cls.replace(/_/g, ' ')}
                </div>
              );
            })}
          </div>
          <Row label="Projizierte Kanten" value={loadProj.metrics.projected_edge_count} />
          <Row label="Ø Last-Score" value={loadProj.metrics.avg_load_score.toFixed(3)} mono />
          <Row label="Max Last-Score" value={loadProj.metrics.max_load_score.toFixed(3)} mono />
          <Row label="Maskierte Kanten" value={loadProj.metrics.masked_edge_count} />
        </Section>
      )}

      {movement && (
        <Section title={`Bewegungsmodell — ${movement.metrics.evaluated_edge_count} Kanten`}>
          <Row label="Hoch-Fluss Kanten" value={movement.metrics.high_flow_edge_count} />
          <Row label="Statische Kanten" value={movement.metrics.static_edge_count} />
          <Row label="Maskierte Kanten" value={movement.metrics.masked_edge_count} />
          <Row label="Ø Bewegungs-Score" value={
            <MiniBar value={movement.metrics.avg_movement_score} color="#4299e1" />
          } />
        </Section>
      )}

      {masking && (
        <Section title="Maskierungs-Modell (Privacy)">
          <Row label="Gesamte Elemente" value={masking.metrics.total_evaluated} />
          <Row label="Maskierte Elemente" value={masking.metrics.total_masked} />
          <Row label="Maskierungs-Ratio" value={
            <MiniBar value={masking.metrics.masking_ratio} color="#9f7aea" />
          } />
          <Row label="Maskierte POIs" value={masking.metrics.masked_pois} />
          <Row label="Maskierte Kanten" value={masking.metrics.masked_edges} />
          <Row label="Status" value={masking.status} mono />
        </Section>
      )}
    </div>
  );
}

// ─── P08: Route + Layer ───────────────────────────────────────────────────────

const ROUTE_SCORE_STYLE: Record<string, { color: string; bg: string }> = {
  green:   { color: '#276749', bg: '#f0fff4' },
  yellow:  { color: '#975a16', bg: '#fffbeb' },
  orange:  { color: '#c05621', bg: '#fff8f0' },
  red:     { color: '#c53030', bg: '#fff5f5' },
  blocked: { color: '#553c9a', bg: '#faf5ff' },
  unknown: { color: '#718096', bg: '#f7fafc' },
};

export function P08Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const routeModel = ctx.route_model as RouteModelState | undefined;
  const routeLayerModel = ctx.route_layer_model as RouteLayerModelState | undefined;
  const layerModel = ctx.layer_model as LayerModelState | undefined;

  if (!routeModel && !routeLayerModel && !layerModel) return noData();

  const scoreClassCounts: Record<string, number> = {};
  routeModel?.edge_evaluations.forEach((e) => {
    scoreClassCounts[e.score_class] = (scoreClassCounts[e.score_class] ?? 0) + 1;
  });

  const visibleCount = routeLayerModel?.segments.filter((s) => s.visible).length ?? 0;
  const hiddenCount = (routeLayerModel?.segments.length ?? 0) - visibleCount;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {routeModel && (
        <Section title={`Routen-Modell — ${routeModel.metrics.evaluated_edge_count} Kanten`}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.entries(scoreClassCounts).map(([cls, count]) => {
              const s = ROUTE_SCORE_STYLE[cls] ?? ROUTE_SCORE_STYLE['unknown'];
              return (
                <div key={cls} style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: s.bg, border: `1px solid ${s.color}30`,
                  fontSize: 12, color: s.color, textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{count}</div>
                  <div>{cls}</div>
                </div>
              );
            })}
          </div>
          <Row label="Einbezogene Kanten" value={routeModel.metrics.included_edge_count} />
          <Row label="Degradierte Kanten" value={routeModel.metrics.degraded_edge_count} />
          <Row label="Ausgeschlossene Kanten" value={routeModel.metrics.excluded_edge_count} />
          <Row label="Degrad-Schwelle" value={routeModel.route_degrade_threshold.toFixed(2)} mono />
          <Row label="Ausschluss-Schwelle" value={routeModel.route_exclude_threshold.toFixed(2)} mono />
        </Section>
      )}

      {routeLayerModel && (
        <Section title={`Route-Layer — ${routeLayerModel.segments.length} Segmente`}>
          <Row label="Sichtbar" value={visibleCount} />
          <Row label="Ausgeblendet" value={hiddenCount} />
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
            {routeLayerModel.segments.slice(0, 10).map((seg) => {
              const s = ROUTE_SCORE_STYLE[seg.score_class] ?? ROUTE_SCORE_STYLE['unknown'];
              return (
                <div key={seg.segment_id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 10px', borderBottom: '1px solid #edf2f7', fontSize: 11,
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10,
                    borderRadius: '50%', background: seg.style.color, flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: 'monospace', color: '#2d3748', minWidth: 64 }}>{seg.edge_id}</span>
                  <Badge text={seg.score_class} color={s.color} bg={s.bg} />
                  <span style={{ color: '#a0aec0', marginLeft: 'auto' }}>
                    {seg.visible ? '● sichtbar' : '○ ausgeblendet'}
                  </span>
                </div>
              );
            })}
            {routeLayerModel.segments.length > 10 && (
              <div style={{ padding: '4px 10px', fontSize: 11, color: '#a0aec0', fontStyle: 'italic' }}>
                … {routeLayerModel.segments.length - 10} weitere
              </div>
            )}
          </div>
        </Section>
      )}

      {layerModel && (
        <Section title={`Layer-Modell — ${layerModel.layers.length} Layer`}>
          {layerModel.layers.map((l) => (
            <Row key={l.layer_id} label={l.layer_id} value={
              <span>
                <Badge text={l.layer_type} color="#2b6cb0" bg="#ebf8ff" />
                <Badge text={l.data_class} color="#553c9a" bg="#faf5ff" />
              </span>
            } />
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── P09: Package ─────────────────────────────────────────────────────────────

export function P09Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const pkg = ctx.sensus_core_package as SensusCorePackageState | undefined;
  if (!pkg) return noData();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Section title="Sensus Core Paket">
        <Row label="Package-ID" value={pkg.package_id} mono />
        <Row label="Schema-Version" value={pkg.schema_version} mono />
        <Row label="Export-Format" value={pkg.export_format} mono />
        <Row label="Routen-Segmente" value={pkg.content.route_segments_count} />
        <Row label="POI-Zustände" value={pkg.content.poi_states_count} />
        <Row label="Layer" value={pkg.content.layer_count} />
        <Row label="Datenklassen" value={pkg.content.data_classes_included.join(', ')} mono />
      </Section>
      <Section title="Privacy-Status">
        <Row label="Rohdaten enthalten" value={pkg.content.raw_signals_present ? '⚠ JA' : '✓ Nein'} />
        <Row label="Geräte-IDs enthalten" value={pkg.content.device_ids_present ? '⚠ JA' : '✓ Nein'} />
        <Row label="Paket-Status" value={pkg.status} mono />
      </Section>
    </div>
  );
}

// ─── P10: Local ───────────────────────────────────────────────────────────────

export function P10Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const local = ctx.sensus_core_local as { status: string; [k: string]: unknown } | undefined;
  if (!local || local.status === 'not_computed') {
    return (
      <div style={{
        padding: '16px', background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 6, fontSize: 12, color: '#718096', fontStyle: 'italic',
      }}>
        Optionales Panel — nicht ausgeführt (status: {local?.status ?? 'nicht vorhanden'})
      </div>
    );
  }
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Section title="Sensus Core Local">
        <Row label="Status" value={String(local.status)} mono />
        {Object.entries(local)
          .filter(([k]) => k !== 'status')
          .slice(0, 12)
          .map(([k, v]) => (
            <Row key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v).slice(0, 60) : String(v ?? '—')} mono />
          ))
        }
      </Section>
    </div>
  );
}

// ─── P11: EffectCheck ─────────────────────────────────────────────────────────

export function P11Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const check = ctx.leaflet_effect_check as LeafletEffectCheckState | undefined;
  if (!check) return noData();

  const r = check.render_result;
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Section title="Leaflet Render-Ergebnis">
        <Row label="Layer-Fehler" value={
          <Badge
            text={r.any_layer_error ? '⚠ Fehler' : '✓ OK'}
            color={r.any_layer_error ? '#c53030' : '#276749'}
            bg={r.any_layer_error ? '#fff5f5' : '#f0fff4'}
          />
        } />
        <Row label="Route-Layer gerendert" value={r.route_layer_rendered ? '✓ Ja' : '✗ Nein'} />
        <Row label="POI-Layer gerendert" value={r.poi_layer_rendered ? '✓ Ja' : '✗ Nein'} />
        <Row label="Sichtbare Segmente" value={r.visible_segment_count} />
        <Row label="Sichtbare POIs" value={r.visible_poi_count} />
        {r.render_duration_ms != null && (
          <Row label="Render-Dauer" value={`${r.render_duration_ms} ms`} mono />
        )}
      </Section>
      <Section title="Check-Status">
        <Row label="Check-ID" value={check.check_id} mono />
        <Row label="Status" value={check.status} mono />
      </Section>
    </div>
  );
}

// ─── P12: Release ─────────────────────────────────────────────────────────────

export function P12Result({ result }: { result: ScimPipelineResult }) {
  if (!result.success) return noData();
  const ctx = result.context as unknown as Record<string, unknown>;
  const release = ctx.release as ReleaseExportState | undefined;
  const runtime = ctx.scim_context as ScimRuntimeContextState | undefined;
  if (!release) return noData();

  const canDownload = release.status === 'released' && release.metadata.privacy_verified;

  const bundle = canDownload ? generateScimBundle(result.context, release) : null;

  const handleDownload = () => {
    if (bundle) downloadScimBundle(bundle);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Download block */}
      <div style={{
        background: canDownload ? '#f0fff4' : '#f7fafc',
        border: `1px solid ${canDownload ? '#9ae6b4' : '#e2e8f0'}`,
        borderRadius: 8, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: canDownload ? '#276749' : '#718096', marginBottom: 3 }}>
            {canDownload ? 'Ziel-App Bundle bereit' : 'Bundle nicht verfügbar'}
          </div>
          <div style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>
            scim3_{(ctx.regio_content as { region?: { region_id?: string } } | undefined)?.region?.region_id ?? 'region'}_{release.package_id}.json
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!canDownload}
          style={{
            padding: '9px 20px', fontSize: 13, fontWeight: 600, flexShrink: 0,
            background: canDownload ? '#38a169' : '#e2e8f0',
            color: canDownload ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 6,
            cursor: canDownload ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          ↓ Bundle herunterladen
        </button>
      </div>

      {bundle && (
        <div style={{ marginBottom: 20 }}>
          <BundlePublisher bundle={bundle} />
        </div>
      )}

      <Section title="Release">
        <Row label="Release-ID" value={release.release_id} mono />
        <Row label="Package-ID" value={release.package_id} mono />
        <Row label="Freigegeben von" value={release.metadata.released_by} />
        <Row label="Freigegeben am" value={new Date(release.released_at).toLocaleString('de-AT')} />
        <Row label="Ziel-Format" value={release.metadata.target_format} mono />
        <Row label="Schema-Version" value={release.metadata.schema_version} mono />
        {release.expires_at && (
          <Row label="Gültig bis" value={new Date(release.expires_at).toLocaleString('de-AT')} />
        )}
      </Section>

      <Section title="Privacy-Zertifizierung">
        <Row label="Privacy verifiziert" value={
          <Badge text={release.metadata.privacy_verified ? '✓ Ja' : '✗ Nein'}
            color={release.metadata.privacy_verified ? '#276749' : '#c53030'}
            bg={release.metadata.privacy_verified ? '#f0fff4' : '#fff5f5'} />
        } />
        <Row label="Sensus Core sicher" value={
          <Badge text={release.metadata.sensus_core_safe ? '✓ Ja' : '✗ Nein'}
            color={release.metadata.sensus_core_safe ? '#276749' : '#c53030'}
            bg={release.metadata.sensus_core_safe ? '#f0fff4' : '#fff5f5'} />
        } />
        <Row label="Rohdaten ausgeschlossen" value="✓ Ja (vertraglich)" />
        <Row label="Geräte-IDs ausgeschlossen" value="✓ Ja (vertraglich)" />
      </Section>

      {runtime && (
        <Section title={`Pipeline-Vollständigkeit — ${(runtime.pipeline_completeness * 100).toFixed(0)}%`}>
          <div style={{
            height: 8, borderRadius: 4, background: '#edf2f7', overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{
              height: '100%',
              width: `${(runtime.pipeline_completeness * 100).toFixed(0)}%`,
              background: runtime.pipeline_completeness >= 1 ? '#38a169' : '#0074d9',
              borderRadius: 4, transition: 'width 0.4s ease',
            }} />
          </div>
          <Row label="System-Adjust-Version" value={runtime.versions.system_adjust_version} mono />
          {runtime.versions.regio_content_version && (
            <Row label="RegioContent-Version" value={runtime.versions.regio_content_version} mono />
          )}
          {runtime.versions.telco_load_batch_id && (
            <Row label="TelcoLoad-Batch" value={runtime.versions.telco_load_batch_id} mono />
          )}
          <Row label="Status" value={release.status} mono />
        </Section>
      )}
    </div>
  );
}
