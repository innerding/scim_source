import { useState } from 'react';
import type {
  RegioContentState, RegionalParameters, RegioPoi,
  RegionalRestriction, FallbackRoutePolicy, RouteExceedanceBehavior,
} from '../../regio-content/regioContent.types';
import { grunbergRegioContentState } from '../../regio-content/regioContent.grunberg';

interface Props {
  state?: RegioContentState;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '16px 0 6px', borderBottom: '1px solid #e2e8f0', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 12, alignItems: 'baseline' }}>
      <span style={{ color: '#718096', minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#2d3748', fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 11 : 12 }}>
        {value}
      </span>
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace', color, background: bg,
      padding: '2px 6px', borderRadius: 3, flexShrink: 0,
    }}>
      {text}
    </span>
  );
}

function NumberSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <label style={{ fontSize: 12, color: '#2d3748', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4a5568' }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#0074d9' }}
      />
    </div>
  );
}

function SelectRow<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{ fontSize: 12, color: '#2d3748', fontWeight: 500, minWidth: 180, flexShrink: 0 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          padding: '4px 8px', fontSize: 12, fontFamily: 'monospace',
          border: '1px solid #cbd5e0', borderRadius: 4, color: '#2d3748', background: '#fff',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── POI list ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  approved:       { text: 'freigegeben', color: '#276749', bg: '#f0fff4' },
  candidate:      { text: 'kandidat',    color: '#744210', bg: '#fffbeb' },
  pending_review: { text: 'prüfung',     color: '#2b6cb0', bg: '#ebf8ff' },
  rejected:       { text: 'abgelehnt',   color: '#822727', bg: '#fff5f5' },
  disabled:       { text: 'deaktiviert', color: '#718096', bg: '#f7fafc' },
};

function PoiRow({ poi }: { poi: RegioPoi }) {
  const b = STATUS_BADGE[poi.status] ?? STATUS_BADGE['disabled'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      borderBottom: '1px solid #edf2f7', fontSize: 12,
    }}>
      <span style={{ flex: 1, color: '#2d3748' }}>{poi.name ?? poi.poi_id}</span>
      <span style={{ color: '#a0aec0', fontSize: 11, fontFamily: 'monospace' }}>{poi.category}</span>
      <span style={{ color: '#718096', fontSize: 11 }}>{poi.radius_meters}m</span>
      <Badge text={b.text} color={b.color} bg={b.bg} />
    </div>
  );
}

// ─── Restriction row ──────────────────────────────────────────────────────────

const EFFECT_COLOR: Record<string, string> = {
  none: '#718096', warn: '#dd6b20', degrade: '#d69e2e', exclude: '#e53e3e',
};

function RestrictionRow({ r }: { r: RegionalRestriction }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 5, marginBottom: 6,
      background: '#fffbeb', border: '1px solid #f6e05e',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#744210' }}>
          {r.label ?? r.restriction_id}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge text={r.type.replace(/_/g, ' ')} color="#744210" bg="#feebcb" />
          <span style={{ fontSize: 11, color: EFFECT_COLOR[r.route_effect] ?? '#718096' }}>
            → {r.route_effect}
          </span>
        </div>
      </div>
      {(r.valid_from || r.valid_until) && (
        <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3, fontFamily: 'monospace' }}>
          {r.valid_from?.slice(0, 10)} – {r.valid_until?.slice(0, 10)}
        </div>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

type EditableParams = Pick<RegionalParameters,
  | 'movement_load_threshold'
  | 'stay_load_threshold'
  | 'route_degrade_threshold'
  | 'route_exclude_threshold'
  | 'route_exceedance_behavior'
  | 'fallback_route_policy'
> & { smoothing_strength: number };

export default function P02RegioContentForm({ state }: Props) {
  const base = state ?? grunbergRegioContentState;
  const p = base.regional_parameters;

  const [params, setParams] = useState<EditableParams>({
    movement_load_threshold: p.movement_load_threshold,
    stay_load_threshold: p.stay_load_threshold,
    route_degrade_threshold: p.route_degrade_threshold,
    route_exclude_threshold: p.route_exclude_threshold,
    route_exceedance_behavior: p.route_exceedance_behavior,
    fallback_route_policy: p.fallback_route_policy,
    smoothing_strength: p.smoothing_strength ?? 0.35,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof EditableParams>(k: K, v: EditableParams[K]) => {
    setParams((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
    setSaved(false);
  };

  const allPois = base.approved_pois;
  const pendingCount = base.pending_pois.length;
  const rejectedCount = base.rejected_pois.length;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 580 }}>

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        borderRadius: 6, marginBottom: 16,
        background: base.validation.is_valid ? '#f0fff4' : '#fff5f5',
        border: `1px solid ${base.validation.is_valid ? '#9ae6b4' : '#fed7d7'}`,
        fontSize: 12, color: base.validation.is_valid ? '#276749' : '#c53030',
      }}>
        <span style={{ fontSize: 16 }}>{base.validation.is_valid ? '✓' : '✗'}</span>
        <div>
          <strong>Status:</strong> {base.status.replace(/_/g, ' ')}
          <span style={{ marginLeft: 10, color: '#a0aec0', fontSize: 11, fontFamily: 'monospace' }}>
            {base.regio_content_version}
          </span>
          <span style={{ marginLeft: 10, fontSize: 11 }}>
            Release: <Badge
              text={base.release.release_status}
              color={base.release.release_status === 'released' ? '#276749' : '#744210'}
              bg={base.release.release_status === 'released' ? '#f0fff4' : '#fffbeb'}
            />
          </span>
        </div>
      </div>

      {/* Region */}
      <SectionTitle>Region</SectionTitle>
      <MetaRow label="Region" value={base.region.region_name} />
      <MetaRow label="Typ" value={base.region.region_type.replace(/_/g, ' ')} />
      <MetaRow label="Land" value={base.region.country_code ?? '—'} mono />
      <MetaRow label="Zeitzone" value={base.region.timezone ?? '—'} mono />
      {base.region.bbox && (
        <MetaRow
          label="Bounding Box"
          value={`[${base.region.bbox.map(n => n.toFixed(3)).join(', ')}]`}
          mono
        />
      )}

      {/* POI-Übersicht */}
      <SectionTitle>
        POIs — {allPois.length} freigegeben · {pendingCount} ausstehend · {rejectedCount} abgelehnt
      </SectionTitle>

      {allPois.length === 0 ? (
        <div style={{ fontSize: 12, color: '#a0aec0', padding: '8px 0' }}>Keine freigegebenen POIs.</div>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          {allPois.map((poi) => <PoiRow key={poi.poi_id} poi={poi} />)}
        </div>
      )}

      {pendingCount > 0 && (
        <div style={{
          background: '#ebf8ff', border: '1px solid #bee3f8',
          borderRadius: 5, padding: '7px 12px', fontSize: 12, color: '#2b6cb0', marginBottom: 8,
        }}>
          ℹ {pendingCount} POI{pendingCount > 1 ? 's' : ''} warten auf Freigabe
        </div>
      )}

      {/* Regional-Parameter */}
      <SectionTitle>Regionale Parameter</SectionTitle>
      <div style={{ fontSize: 11, color: '#a0aec0', marginBottom: 10 }}>
        Überschreibt System-Defaults aus P01 für diese Region.
      </div>

      <NumberSlider
        label="Bewegungslast-Schwelle"
        value={params.movement_load_threshold}
        min={0} max={1} step={0.01} unit="score"
        onChange={(v) => set('movement_load_threshold', v)}
      />
      <NumberSlider
        label="Aufenthalts-Schwelle"
        value={params.stay_load_threshold}
        min={0} max={1} step={0.01} unit="score"
        onChange={(v) => set('stay_load_threshold', v)}
      />
      <NumberSlider
        label="Route Degradier-Schwelle"
        value={params.route_degrade_threshold}
        min={0} max={1} step={0.01} unit="score"
        onChange={(v) => set('route_degrade_threshold', v)}
      />
      <NumberSlider
        label="Route Ausschluss-Schwelle"
        value={params.route_exclude_threshold}
        min={0} max={1} step={0.01} unit="score"
        onChange={(v) => set('route_exclude_threshold', v)}
      />
      <NumberSlider
        label="Glättungsstärke"
        value={params.smoothing_strength ?? 0.35}
        min={0} max={1} step={0.05} unit="score"
        onChange={(v) => set('smoothing_strength', v)}
      />

      <SelectRow
        label="Überschreitungs-Verhalten"
        value={params.route_exceedance_behavior}
        options={[
          { value: 'warn',              label: 'warn' },
          { value: 'degrade',           label: 'degrade' },
          { value: 'exclude',           label: 'exclude' },
          { value: 'profile_dependent', label: 'profile_dependent' },
        ] as { value: RouteExceedanceBehavior; label: string }[]}
        onChange={(v) => set('route_exceedance_behavior', v)}
      />
      <SelectRow
        label="Fallback-Routen-Policy"
        value={params.fallback_route_policy}
        options={[
          { value: 'allow_degraded_if_no_alternative', label: 'allow_degraded_if_no_alternative' },
          { value: 'block_if_threshold_exceeded',      label: 'block_if_threshold_exceeded' },
          { value: 'warn_and_allow',                   label: 'warn_and_allow' },
          { value: 'profile_dependent',                label: 'profile_dependent' },
        ] as { value: FallbackRoutePolicy; label: string }[]}
        onChange={(v) => set('fallback_route_policy', v)}
      />

      {/* Sperren */}
      {base.regional_restrictions.length > 0 && (
        <>
          <SectionTitle>Regionale Sperren ({base.regional_restrictions.length})</SectionTitle>
          {base.regional_restrictions.map((r) => <RestrictionRow key={r.restriction_id} r={r} />)}
        </>
      )}

      {/* Button bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={() => { setSaved(true); setDirty(false); }}
          disabled={!dirty}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: dirty ? '#0074d9' : '#e2e8f0',
            color: dirty ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5, cursor: dirty ? 'pointer' : 'default',
          }}
        >
          Speichern
        </button>
        <button
          onClick={() => {
            setParams({
              movement_load_threshold: p.movement_load_threshold,
              stay_load_threshold: p.stay_load_threshold,
              route_degrade_threshold: p.route_degrade_threshold,
              route_exclude_threshold: p.route_exclude_threshold,
              route_exceedance_behavior: p.route_exceedance_behavior,
              fallback_route_policy: p.fallback_route_policy,
              smoothing_strength: p.smoothing_strength ?? 0.35,
            });
            setDirty(false); setSaved(false);
          }}
          style={{
            padding: '8px 16px', fontSize: 12, background: 'transparent',
            color: '#718096', border: '1px solid #cbd5e0', borderRadius: 5, cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>
        {saved && <span style={{ fontSize: 12, color: '#38a169' }}>✓ Gespeichert (SML-2: kein persistenter State)</span>}
        {dirty && !saved && <span style={{ fontSize: 11, color: '#dd6b20' }}>● Ungespeicherte Änderungen</span>}
      </div>
    </div>
  );
}
