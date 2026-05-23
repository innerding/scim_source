import { useState } from 'react';
import type { SystemAdjustState, RouteExceedanceBehavior, GraphEdgeType } from '../../system-adjust/systemAdjust.types';
import { ALL_GRAPH_EDGE_TYPES } from '../../system-adjust/systemAdjust.types';
import { mockSystemAdjustState } from '../../system-adjust/systemAdjust.mock';
import { P01RepresentationSection } from './P01RepresentationSection';
import type { RepresentationValue } from './P01RepresentationSection';

interface Props {
  state?: SystemAdjustState;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '16px 0 6px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 12, alignItems: 'baseline' }}>
      <span style={{ color: '#718096', minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: '#2d3748',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontSize: mono ? 11 : 12,
      }}>
        {value}
      </span>
    </div>
  );
}

function NumberField({
  label, value, min, max, step, unit, onChange, helpText,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void; helpText?: string;
}) {
  const [inputVal, setInputVal] = useState(String(value));

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= min && n <= max) {
      onChange(n);
      setInputVal(String(n));
    } else {
      setInputVal(String(value)); // revert
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 12, color: '#2d3748', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
          {min}–{max} {unit}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => { onChange(parseFloat(e.target.value)); setInputVal(e.target.value); }}
          style={{ flex: 1, accentColor: '#0074d9' }}
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
          style={{
            width: 68, padding: '3px 6px', fontSize: 12, fontFamily: 'monospace',
            border: '1px solid #cbd5e0', borderRadius: 4, textAlign: 'right',
            color: '#2d3748', background: '#fff',
          }}
        />
        <span style={{ fontSize: 11, color: '#718096', minWidth: 28 }}>{unit}</span>
      </div>
      {helpText && (
        <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3 }}>{helpText}</div>
      )}
    </div>
  );
}

function SelectField({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: '#2d3748', fontWeight: 500, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '5px 8px', fontSize: 12, fontFamily: 'monospace',
          border: '1px solid #cbd5e0', borderRadius: 4, color: '#2d3748',
          background: '#fff', width: '100%', maxWidth: 280,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label, checked, onChange, description,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 10px', borderRadius: 5,
      background: checked ? '#f0fff4' : '#f7fafc',
      border: `1px solid ${checked ? '#9ae6b4' : '#e2e8f0'}`,
      marginBottom: 6, cursor: 'pointer',
    }}
      onClick={() => onChange(!checked)}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginLeft: 12, marginTop: 1,
        background: checked ? '#38a169' : '#cbd5e0',
        position: 'relative', transition: 'background 0.15s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

type Params = SystemAdjustState['default_parameters'];
type Flags = SystemAdjustState['feature_flags'];

export default function P01SystemAdjustForm({ state }: Props) {
  const base = state ?? mockSystemAdjustState;
  const ranges = base.allowed_ranges;

  const [params, setParams] = useState<Params>({ ...base.default_parameters });
  const [flags, setFlags] = useState<Flags>({ ...base.feature_flags });
  const [excludedEdgeTypes, setExcludedEdgeTypes] = useState<GraphEdgeType[]>(
    base.svg_overlay?.excluded_edge_types ?? []
  );
  const [representation, setRepresentation] = useState<RepresentationValue>({ name: 'Lichtenberg', polygon: null });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const setParam = (k: keyof Params, v: number | string) => {
    setParams((p) => ({ ...p, [k]: v }));
    setDirty(true);
    setSaved(false);
  };

  const setFlag = <K extends keyof Flags>(k: K, v: boolean) => {
    setFlags((f) => ({ ...f, [k]: v }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    console.log('P01 gespeichert:', { params, flags, representation });
    setSaved(true);
    setDirty(false);
  };

  const toggleEdgeType = (type: GraphEdgeType) => {
    setExcludedEdgeTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      setDirty(true);
      setSaved(false);
      return next;
    });
  };

  const handleReset = () => {
    setParams({ ...base.default_parameters });
    setFlags({ ...base.feature_flags });
    setExcludedEdgeTypes(base.svg_overlay?.excluded_edge_types ?? []);
    setDirty(false);
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>

      {/* Representation */}
      <SectionTitle>Representation</SectionTitle>
      <P01RepresentationSection onChange={(v) => { setRepresentation(v); setDirty(true); setSaved(false); }} />

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 6, marginBottom: 16,
        background: base.validation.is_valid ? '#f0fff4' : '#fff5f5',
        border: `1px solid ${base.validation.is_valid ? '#9ae6b4' : '#fed7d7'}`,
        fontSize: 12, color: base.validation.is_valid ? '#276749' : '#c53030',
      }}>
        <span style={{ fontSize: 16 }}>{base.validation.is_valid ? '✓' : '✗'}</span>
        <div>
          <strong>Status:</strong> {base.status.replace(/_/g, ' ')}
          <span style={{ marginLeft: 12, color: '#a0aec0', fontSize: 11, fontFamily: 'monospace' }}>
            v{base.system_adjust_version}
          </span>
        </div>
      </div>

      {/* Meta */}
      <SectionTitle>System-Meta</SectionTitle>
      <MetaRow label="Version" value={base.system_adjust_version} mono />
      <MetaRow label="Quelle" value={base.source} mono />
      <MetaRow label="Geladen am" value={new Date(base.loaded_at).toLocaleString('de-AT')} />

      {/* Default Parameters */}
      <SectionTitle>Standard-Parameter</SectionTitle>

      <NumberField
        label="POI-Radius"
        value={params.default_poi_radius_meters}
        min={ranges.poi_radius_meters.min}
        max={ranges.poi_radius_meters.max}
        step={ranges.poi_radius_meters.step ?? 1}
        unit="m"
        helpText="Suchradius um einen POI-Mittelpunkt"
        onChange={(v) => setParam('default_poi_radius_meters', v)}
      />
      <NumberField
        label="Vergleichs-Puffer"
        value={params.default_comparison_margin_meters}
        min={ranges.comparison_margin_meters.min}
        max={ranges.comparison_margin_meters.max}
        step={ranges.comparison_margin_meters.step ?? 1}
        unit="m"
        helpText="Toleranzpuffer beim Vergleich räumlicher Zuordnungen"
        onChange={(v) => setParam('default_comparison_margin_meters', v)}
      />
      <NumberField
        label="Aufenthaltsdichte-Ratio"
        value={params.default_stay_density_ratio}
        min={ranges.stay_density_ratio.min}
        max={ranges.stay_density_ratio.max}
        step={ranges.stay_density_ratio.step ?? 1}
        unit="ratio"
        helpText="Ab diesem Verhältnis gilt ein Bereich als Aufenthaltszone"
        onChange={(v) => setParam('default_stay_density_ratio', v)}
      />
      <NumberField
        label="Bewegungslast-Schwelle"
        value={params.default_movement_load_threshold}
        min={ranges.movement_load_threshold.min}
        max={ranges.movement_load_threshold.max}
        step={ranges.movement_load_threshold.step ?? 1}
        unit="score"
        helpText="Score ab dem eine Kante als 'belastet' gilt"
        onChange={(v) => setParam('default_movement_load_threshold', v)}
      />
      <NumberField
        label="Route Degradier-Schwelle"
        value={params.default_route_degrade_threshold}
        min={ranges.route_degrade_threshold.min}
        max={ranges.route_degrade_threshold.max}
        step={ranges.route_degrade_threshold.step ?? 1}
        unit="score"
        helpText="Score ab dem eine Route degradiert dargestellt wird"
        onChange={(v) => setParam('default_route_degrade_threshold', v)}
      />
      <NumberField
        label="Route Ausschluss-Schwelle"
        value={params.default_route_exclude_threshold}
        min={ranges.route_exclude_threshold.min}
        max={ranges.route_exclude_threshold.max}
        step={ranges.route_exclude_threshold.step ?? 1}
        unit="score"
        helpText="Score ab dem eine Route ausgeblendet wird"
        onChange={(v) => setParam('default_route_exclude_threshold', v)}
      />
      <NumberField
        label="Glättungsstärke"
        value={params.default_smoothing_strength}
        min={ranges.smoothing_strength.min}
        max={ranges.smoothing_strength.max}
        step={ranges.smoothing_strength.step ?? 1}
        unit="score"
        helpText="Räumliche Glättung der Belastungswerte (0 = keine)"
        onChange={(v) => setParam('default_smoothing_strength', v)}
      />

      <SelectField
        label="Überschreitungs-Verhalten"
        value={params.route_exceedance_default_behavior}
        options={[
          { value: 'warn',               label: 'warn — Warnung anzeigen' },
          { value: 'degrade',            label: 'degrade — Route degradieren' },
          { value: 'exclude',            label: 'exclude — Route ausblenden' },
          { value: 'profile_dependent',  label: 'profile_dependent — Profil-abhängig' },
        ]}
        onChange={(v) => setParam('route_exceedance_default_behavior', v as RouteExceedanceBehavior)}
      />

      {/* Feature Flags */}
      <SectionTitle>Feature-Flags</SectionTitle>

      <Toggle
        label="POI-Kandidaten-Vorschläge"
        checked={flags.enable_poi_candidate_suggestions}
        description="Schlägt automatisch POI-Kandidaten aus dem Graph vor"
        onChange={(v) => setFlag('enable_poi_candidate_suggestions', v)}
      />
      <Toggle
        label="Aufenthalts-Klassifizierung"
        checked={flags.enable_stay_classification}
        description="Berechnet Stay-Zonen aus Telco-Signalen"
        onChange={(v) => setFlag('enable_stay_classification', v)}
      />
      <Toggle
        label="Bewegungslast"
        checked={flags.enable_movement_load}
        description="Projiziert Bewegungslast auf Kanten des Graphen"
        onChange={(v) => setFlag('enable_movement_load', v)}
      />
      <Toggle
        label="Routen-Bewertung"
        checked={flags.enable_route_evaluation}
        description="Berechnet Score-Klassen für alle sichtbaren Kanten"
        onChange={(v) => setFlag('enable_route_evaluation', v)}
      />
      <Toggle
        label="Stau-Indikatoren"
        checked={flags.enable_jam_indicators}
        description="Zeigt Überlast-Marker an kritischen Knotenpunkten"
        onChange={(v) => setFlag('enable_jam_indicators', v)}
      />
      <Toggle
        label="Leaflet Debug-Layer"
        checked={flags.enable_leaflet_debug_layers}
        description="Zeigt rohe Geometrie-Layer zur Diagnose"
        onChange={(v) => setFlag('enable_leaflet_debug_layers', v)}
      />
      <Toggle
        label="Sensus Core Export"
        checked={flags.enable_sensus_core_export}
        description="Aktiviert P09–P12 (Package, EffectCheck, Release)"
        onChange={(v) => setFlag('enable_sensus_core_export', v)}
      />

      {/* SVG Overlay Filter */}
      <SectionTitle>SVG-Overlay — Kantentypen</SectionTitle>
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 10 }}>
        Ausgeschlossene Kantentypen erscheinen nicht im SVG-Overlay.
        Mindestens ein Typ muss aktiv bleiben.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {ALL_GRAPH_EDGE_TYPES.map((type) => {
          const excluded = excludedEdgeTypes.includes(type);
          const wouldExcludeAll = !excluded && excludedEdgeTypes.length >= ALL_GRAPH_EDGE_TYPES.length - 1;
          return (
            <label
              key={type}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                fontSize: 12, fontFamily: 'monospace',
                background: excluded ? '#fff5f5' : '#f0fff4',
                border: `1px solid ${excluded ? '#fed7d7' : '#9ae6b4'}`,
                color: excluded ? '#c53030' : '#276749',
                opacity: wouldExcludeAll ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={!excluded}
                disabled={wouldExcludeAll}
                onChange={() => toggleEdgeType(type)}
                style={{ accentColor: '#38a169' }}
              />
              {type}
            </label>
          );
        })}
      </div>
      {excludedEdgeTypes.length > 0 && (
        <div style={{
          fontSize: 11, color: '#c53030', padding: '4px 10px',
          background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 4, marginBottom: 8,
        }}>
          Ausgeschlossen: {excludedEdgeTypes.join(', ')}
        </div>
      )}
      {excludedEdgeTypes.length === 0 && (
        <div style={{
          fontSize: 11, color: '#276749', padding: '4px 10px',
          background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 4, marginBottom: 8,
        }}>
          Alle Kantentypen aktiv
        </div>
      )}

      {/* Button bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={handleSave}
          disabled={!dirty}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: dirty ? '#0074d9' : '#e2e8f0',
            color: dirty ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5, cursor: dirty ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          Speichern
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px', fontSize: 12,
            background: 'transparent', color: '#718096',
            border: '1px solid #cbd5e0', borderRadius: 5, cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>

        {saved && (
          <span style={{ fontSize: 12, color: '#38a169', marginLeft: 4 }}>
            ✓ Gespeichert (SML-2: kein persistenter State)
          </span>
        )}
        {dirty && !saved && (
          <span style={{ fontSize: 11, color: '#dd6b20', marginLeft: 4 }}>● Ungespeicherte Änderungen</span>
        )}
      </div>
    </div>
  );
}
