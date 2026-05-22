import { useState } from 'react';
import type {
  TargetAppUiState, VisibleLayerConfig, RouteModeConfig,
  WarningRuleConfig, TargetAppProfile,
} from '../../target-app-ui/targetAppUi.types';
import { mockTargetAppUiState } from '../../target-app-ui/targetAppUi.mock';

interface Props {
  state?: TargetAppUiState;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

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

function Toggle({
  label, checked, onChange, sub,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; sub?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '7px 10px', borderRadius: 5, marginBottom: 5, cursor: 'pointer',
        background: checked ? '#f0fff4' : '#f7fafc',
        border: `1px solid ${checked ? '#9ae6b4' : '#e2e8f0'}`,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{
        width: 34, height: 18, borderRadius: 9, flexShrink: 0, marginLeft: 12, marginTop: 2,
        background: checked ? '#38a169' : '#cbd5e0', position: 'relative', transition: 'background 0.12s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          transition: 'left 0.12s', boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
        }} />
      </div>
    </div>
  );
}

function SelectCell<T extends string>({
  value, options, onChange,
}: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        padding: '2px 6px', fontSize: 11, fontFamily: 'monospace',
        border: '1px solid #cbd5e0', borderRadius: 3, color: '#2d3748', background: '#fff',
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── App-Profil section ───────────────────────────────────────────────────────

function AppProfileSection({
  profile, onChange,
}: {
  profile: TargetAppProfile;
  onChange: (p: TargetAppProfile) => void;
}) {
  return (
    <>
      <MetaRow label="Profil-ID" value={profile.profile_id} mono />
      <MetaRow label="Profil-Name" value={profile.profile_name} />

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: '#718096', display: 'block', marginBottom: 3 }}>App-Familie</label>
            <SelectCell
              value={profile.app_family}
              options={[
                { value: 'sensus_core',       label: 'sensus_core' },
                { value: 'sensus_core_child', label: 'sensus_core_child' },
                { value: 'custom_target_app', label: 'custom_target_app' },
              ]}
              onChange={(v) => onChange({ ...profile, app_family: v })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: '#718096', display: 'block', marginBottom: 3 }}>Zielgruppe</label>
            <SelectCell
              value={profile.audience}
              options={[
                { value: 'public_user',         label: 'public_user' },
                { value: 'guided_user',         label: 'guided_user' },
                { value: 'operator_preview',    label: 'operator_preview' },
                { value: 'restricted_test_user', label: 'restricted_test_user' },
              ]}
              onChange={(v) => onChange({ ...profile, audience: v })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: '#718096', display: 'block', marginBottom: 3 }}>Karten-Modus</label>
            <SelectCell
              value={profile.map_mode}
              options={[
                { value: 'leaflet_view',    label: 'leaflet_view' },
                { value: 'native_map_view', label: 'native_map_view' },
                { value: 'hybrid',          label: 'hybrid' },
              ]}
              onChange={(v) => onChange({ ...profile, map_mode: v })}
            />
          </div>
        </div>

        <Toggle
          label="Offline-Modus unterstützt"
          checked={profile.offline_supported}
          sub="Paket-Download für lokale Nutzung aktivieren"
          onChange={(v) => onChange({ ...profile, offline_supported: v })}
        />
        <Toggle
          label="Erfordert freigegebenen RegioContent"
          checked={profile.requires_released_regio_content}
          sub="P02-Release muss status: released haben"
          onChange={(v) => onChange({ ...profile, requires_released_regio_content: v })}
        />
        <Toggle
          label="Erfordert freigegebenes SystemAdjust"
          checked={profile.requires_released_system_adjust}
          sub="P01-Release muss status: released haben"
          onChange={(v) => onChange({ ...profile, requires_released_system_adjust: v })}
        />
      </div>
    </>
  );
}

// ─── Layer table ──────────────────────────────────────────────────────────────

const VISIBILITY_BADGE: Record<string, { color: string; bg: string }> = {
  sensus_core_visible:   { color: '#276749', bg: '#f0fff4' },
  operator_preview_only: { color: '#744210', bg: '#fffbeb' },
  debug_only:            { color: '#553c9a', bg: '#faf5ff' },
  hidden:                { color: '#718096', bg: '#f7fafc' },
};

function LayerRow({
  layer, onChange,
}: {
  layer: VisibleLayerConfig;
  onChange: (l: VisibleLayerConfig) => void;
}) {
  const vb = VISIBILITY_BADGE[layer.visibility] ?? VISIBILITY_BADGE['hidden'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      borderBottom: '1px solid #edf2f7', fontSize: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: '#2d3748' }}>{layer.label}</div>
        <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>{layer.layer_type}</div>
      </div>
      <span style={{
        fontSize: 10, padding: '2px 5px', borderRadius: 3,
        color: vb.color, background: vb.bg, flexShrink: 0,
      }}>
        {layer.visibility.replace(/_/g, ' ')}
      </span>
      <div
        onClick={() => onChange({ ...layer, enabled_by_default: !layer.enabled_by_default })}
        title="Standard aktiv"
        style={{
          width: 28, height: 16, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          background: layer.enabled_by_default ? '#38a169' : '#cbd5e0', position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: layer.enabled_by_default ? 12 : 2,
          width: 12, height: 12, borderRadius: '50%', background: '#fff',
          transition: 'left 0.1s',
        }} />
      </div>
    </div>
  );
}

// ─── Route mode row ───────────────────────────────────────────────────────────

function RouteModeRow({
  mode, onChange,
}: {
  mode: RouteModeConfig;
  onChange: (m: RouteModeConfig) => void;
}) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 5, marginBottom: 5,
      background: mode.enabled ? '#f0fff4' : '#f7fafc',
      border: `1px solid ${mode.enabled ? '#9ae6b4' : '#e2e8f0'}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{mode.label}</div>
        {mode.description && (
          <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>{mode.description}</div>
        )}
        <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 2 }}>
          {mode.route_priority} · {mode.allowed_exceedance_behavior.join(', ')}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
        <div
          onClick={() => onChange({ ...mode, enabled: !mode.enabled })}
          title="Aktiviert"
          style={{
            width: 34, height: 18, borderRadius: 9, cursor: 'pointer',
            background: mode.enabled ? '#38a169' : '#cbd5e0', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', top: 2, left: mode.enabled ? 16 : 2,
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            transition: 'left 0.1s',
          }} />
        </div>
        {mode.enabled && (
          <label style={{ fontSize: 10, color: '#718096', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={mode.default_selected}
              onChange={(e) => onChange({ ...mode, default_selected: e.target.checked })}
              style={{ accentColor: '#0074d9' }}
            />
            Standard
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Warning rule row ─────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  info: '#2b6cb0', warning: '#dd6b20', critical: '#e53e3e',
};

function WarningRuleRow({
  rule, onChange,
}: {
  rule: WarningRuleConfig;
  onChange: (r: WarningRuleConfig) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      borderBottom: '1px solid #edf2f7', fontSize: 12,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 500, color: '#2d3748' }}>
          {rule.warning_type.replace(/_/g, ' ')}
        </span>
        <span style={{
          marginLeft: 8, fontSize: 10, fontFamily: 'monospace',
          color: SEVERITY_COLOR[rule.severity] ?? '#718096',
        }}>
          {rule.severity}
        </span>
      </div>
      <span style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', flexShrink: 0 }}>
        {rule.display_mode.replace(/_/g, ' ')}
      </span>
      <div
        onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
        style={{
          width: 28, height: 16, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          background: rule.enabled ? '#38a169' : '#cbd5e0', position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: rule.enabled ? 12 : 2,
          width: 12, height: 12, borderRadius: '50%', background: '#fff',
          transition: 'left 0.1s',
        }} />
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function P03TargetAppUiForm({ state }: Props) {
  const base = state ?? mockTargetAppUiState;

  const [profile, setProfile] = useState<TargetAppProfile>({ ...base.app_profile });
  const [layers, setLayers] = useState<VisibleLayerConfig[]>([...base.visible_layers]);
  const [routeModes, setRouteModes] = useState<RouteModeConfig[]>([...base.available_route_modes]);
  const [warnings, setWarnings] = useState<WarningRuleConfig[]>([...base.warning_rules]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const mark = () => { setDirty(true); setSaved(false); };

  const updateLayer = (idx: number, l: VisibleLayerConfig) => {
    setLayers((prev) => prev.map((x, i) => i === idx ? l : x));
    mark();
  };
  const updateMode = (idx: number, m: RouteModeConfig) => {
    setRouteModes((prev) => prev.map((x, i) => i === idx ? m : x));
    mark();
  };
  const updateWarning = (idx: number, r: WarningRuleConfig) => {
    setWarnings((prev) => prev.map((x, i) => i === idx ? r : x));
    mark();
  };

  const handleReset = () => {
    setProfile({ ...base.app_profile });
    setLayers([...base.visible_layers]);
    setRouteModes([...base.available_route_modes]);
    setWarnings([...base.warning_rules]);
    setDirty(false);
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>

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
            {base.target_app_ui_version}
          </span>
        </div>
      </div>

      {/* App-Profil */}
      <SectionTitle>App-Profil</SectionTitle>
      <AppProfileSection
        profile={profile}
        onChange={(p) => { setProfile(p); mark(); }}
      />

      {/* Layer-Konfiguration */}
      <SectionTitle>Layer-Konfiguration ({layers.length})</SectionTitle>
      <div style={{ fontSize: 11, color: '#a0aec0', marginBottom: 8 }}>
        Toggle: Standard aktiv (rechts). Sichtbarkeit und Typ sind systemdefiniert.
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
        {layers.map((l, i) => (
          <LayerRow key={l.layer_id} layer={l} onChange={(nl) => updateLayer(i, nl)} />
        ))}
      </div>

      {/* Routen-Modi */}
      <SectionTitle>Routen-Modi ({routeModes.length})</SectionTitle>
      {routeModes.map((m, i) => (
        <RouteModeRow key={m.route_mode_id} mode={m} onChange={(nm) => updateMode(i, nm)} />
      ))}

      {/* Warn-Regeln */}
      <SectionTitle>Warn-Regeln ({warnings.length})</SectionTitle>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
        {warnings.map((w, i) => (
          <WarningRuleRow key={w.warning_rule_id} rule={w} onChange={(nw) => updateWarning(i, nw)} />
        ))}
      </div>

      {/* Reduktions-Profil (read-only summary) */}
      <SectionTitle>Reduktions-Profil</SectionTitle>
      <div style={{
        background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 6, padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#4a5568',
      }}>
        {base.reduction_profile.profile_id}
        <span style={{ color: '#a0aec0', marginLeft: 10 }}>
          Koordinaten-Präzision: {base.reduction_profile.coordinate_precision ?? '—'} Stellen ·
          Score-Klassen: {base.reduction_profile.score_class_count ?? '—'} ·
          Geometrie: {base.reduction_profile.max_geometry_detail ?? '—'}
        </span>
        <div style={{ marginTop: 4, color: '#718096' }}>
          Erlaubte Datenklassen: {base.reduction_profile.allowed_output_data_classes.join(', ')}
        </div>
      </div>

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
          onClick={handleReset}
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
