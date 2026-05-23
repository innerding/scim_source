import { useState } from 'react';
import type {
  OperatorDefinedZone,
  OperatorZoneState,
  ZoneSemanticType,
  ZoneTemporalScope,
  ZoneClassificationBasis,
} from '../../operator-zone/operatorZone.types';
import { mockOperatorZoneState } from '../../operator-zone/operatorZone.mock';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '14px 0 6px', borderBottom: '1px solid #e2e8f0', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function FieldRow({ label, children, required }: {
  label: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: '#4a5568' }}>
        {label}{required && <span style={{ color: '#c53030' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '5px 9px', fontSize: 12,
  border: '1px solid #cbd5e0', borderRadius: 4, fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, background: '#fff' };

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function semanticLabel(t: ZoneSemanticType): string {
  const m: Record<ZoneSemanticType, string> = {
    rest_area: 'Rastplatz',
    viewpoint: 'Aussichtspunkt',
    gathering_point: 'Treffpunkt',
    event_area: 'Veranstaltungsbereich',
    custom: 'Benutzerdefiniert',
  };
  return m[t];
}

function semanticIcon(t: ZoneSemanticType): string {
  const m: Record<ZoneSemanticType, string> = {
    rest_area: '🏚',
    viewpoint: '🔭',
    gathering_point: '👥',
    event_area: '🎌',
    custom: '⊙',
  };
  return m[t];
}

function temporalLabel(s: ZoneTemporalScope): string {
  const m: Record<ZoneTemporalScope, string> = {
    permanent: 'Dauerhaft',
    seasonal: 'Saisonal',
    event: 'Event',
  };
  return m[s];
}

function temporalColor(s: ZoneTemporalScope): string {
  return s === 'permanent' ? '#2b6cb0' : s === 'seasonal' ? '#276749' : '#975a16';
}

function zoneStatus(zone: OperatorDefinedZone, now: string): 'active' | 'pending' | 'expired' {
  const t = new Date(now);
  if (zone.valid_until && new Date(zone.valid_until) < t) return 'expired';
  if (zone.valid_from && new Date(zone.valid_from) > t) return 'pending';
  return 'active';
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: '#276749', bg: '#f0fff4', label: '● aktiv' },
  pending: { color: '#975a16', bg: '#fffbeb', label: '◌ ausstehend' },
  expired: { color: '#718096', bg: '#f7fafc', label: '○ abgelaufen' },
};

// ─── Leerzone für "Neue Zone" ─────────────────────────────────────────────────

function emptyZone(): Omit<OperatorDefinedZone, 'zone_id' | 'created_at'> {
  return {
    label: '',
    center: { type: 'Point', coordinates: [0, 0] },
    radius_meters: 200,
    semantic_type: 'rest_area',
    temporal_scope: 'permanent',
    classification_basis: 'operator_defined',
    exclude_from_routing: true,
  };
}

// ─── Zone-Formular ────────────────────────────────────────────────────────────

function ZoneForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: OperatorDefinedZone;
  onSave: (zone: OperatorDefinedZone) => void;
  onCancel: () => void;
}) {
  const isNew = !initial;
  const [form, setForm] = useState<Omit<OperatorDefinedZone, 'zone_id' | 'created_at'>>(
    initial ?? emptyZone()
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const needsDates = form.temporal_scope === 'seasonal' || form.temporal_scope === 'event';

  const handleSave = () => {
    const zone: OperatorDefinedZone = {
      zone_id: initial?.zone_id ?? `oz_${Date.now()}`,
      created_at: initial?.created_at ?? new Date().toISOString(),
      ...form,
    };
    onSave(zone);
  };

  return (
    <div style={{
      background: '#f7fafc', border: '1px solid #cbd5e0',
      borderRadius: 8, padding: '16px 20px', marginBottom: 12,
    }}>
      <SectionTitle>{isNew ? 'Neue Zone anlegen' : `Zone bearbeiten: ${initial?.label}`}</SectionTitle>

      <FieldRow label="Bezeichnung" required>
        <input
          style={INPUT_STYLE} value={form.label} placeholder="z. B. Rastplatz Hochwab"
          onChange={(e) => set('label', e.target.value)}
        />
      </FieldRow>

      <FieldRow label="Semantischer Typ" required>
        <select
          style={SELECT_STYLE} value={form.semantic_type}
          onChange={(e) => set('semantic_type', e.target.value as ZoneSemanticType)}
        >
          <option value="rest_area">🏚 Rastplatz</option>
          <option value="viewpoint">🔭 Aussichtspunkt</option>
          <option value="gathering_point">👥 Treffpunkt</option>
          <option value="event_area">🎌 Veranstaltungsbereich</option>
          <option value="custom">⊙ Benutzerdefiniert</option>
        </select>
      </FieldRow>

      <FieldRow label="Latitude (WGS84)" required>
        <input
          style={INPUT_STYLE} type="number" step="0.0001"
          value={form.center.coordinates[1]}
          onChange={(e) => set('center', {
            type: 'Point',
            coordinates: [form.center.coordinates[0], parseFloat(e.target.value) || 0],
          })}
        />
      </FieldRow>

      <FieldRow label="Longitude (WGS84)" required>
        <input
          style={INPUT_STYLE} type="number" step="0.0001"
          value={form.center.coordinates[0]}
          onChange={(e) => set('center', {
            type: 'Point',
            coordinates: [parseFloat(e.target.value) || 0, form.center.coordinates[1]],
          })}
        />
      </FieldRow>

      <FieldRow label="Radius (Meter)" required>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            style={{ ...INPUT_STYLE, maxWidth: 100 }}
            type="number" min={10} max={5000} value={form.radius_meters}
            onChange={(e) => set('radius_meters', parseInt(e.target.value) || 0)}
          />
          <input
            type="range" min={10} max={2000} step={10} value={form.radius_meters}
            style={{ flex: 1, accentColor: '#0074d9' }}
            onChange={(e) => set('radius_meters', parseInt(e.target.value))}
          />
        </div>
      </FieldRow>

      <FieldRow label="Zeitlicher Scope" required>
        <select
          style={SELECT_STYLE} value={form.temporal_scope}
          onChange={(e) => set('temporal_scope', e.target.value as ZoneTemporalScope)}
        >
          <option value="permanent">Dauerhaft</option>
          <option value="seasonal">Saisonal (mit Datum)</option>
          <option value="event">Event (mit Datum)</option>
        </select>
      </FieldRow>

      {needsDates && (
        <>
          <FieldRow label="Gültig ab" required>
            <input
              style={INPUT_STYLE} type="datetime-local"
              value={(form.valid_from ?? '').replace('Z', '').slice(0, 16)}
              onChange={(e) => set('valid_from', e.target.value ? e.target.value + ':00.000Z' : undefined)}
            />
          </FieldRow>
          <FieldRow label="Gültig bis" required>
            <input
              style={INPUT_STYLE} type="datetime-local"
              value={(form.valid_until ?? '').replace('Z', '').slice(0, 16)}
              onChange={(e) => set('valid_until', e.target.value ? e.target.value + ':00.000Z' : undefined)}
            />
          </FieldRow>
        </>
      )}

      <FieldRow label="Klassifizierungsbasis">
        <select
          style={SELECT_STYLE} value={form.classification_basis}
          onChange={(e) => set('classification_basis', e.target.value as ZoneClassificationBasis)}
        >
          <option value="operator_defined">Operator-definiert</option>
          <option value="signal_pattern">Signal-Muster</option>
          <option value="dwell_time">Aufenthaltsdauer</option>
        </select>
      </FieldRow>

      <FieldRow label="Routing-Ausschluss">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={form.exclude_from_routing}
            onChange={(e) => set('exclude_from_routing', e.target.checked)}
          />
          Zone aus Routenberechnung ausschließen
        </label>
      </FieldRow>

      <FieldRow label="Beschreibung">
        <input
          style={INPUT_STYLE} value={form.custom_description ?? ''} placeholder="Optional"
          onChange={(e) => set('custom_description', e.target.value || undefined)}
        />
      </FieldRow>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 16px', fontSize: 12, background: '#fff',
            border: '1px solid #cbd5e0', borderRadius: 5, cursor: 'pointer', color: '#4a5568',
          }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={!form.label.trim()}
          style={{
            padding: '6px 16px', fontSize: 12, fontWeight: 600,
            background: form.label.trim() ? '#0074d9' : '#e2e8f0',
            color: form.label.trim() ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5,
            cursor: form.label.trim() ? 'pointer' : 'default',
          }}
        >
          {isNew ? 'Zone anlegen' : 'Änderungen speichern'}
        </button>
      </div>
    </div>
  );
}

// ─── Zonen-Liste ──────────────────────────────────────────────────────────────

function ZoneCard({
  zone, now, onEdit, onDelete,
}: {
  zone: OperatorDefinedZone;
  now: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = zoneStatus(zone, now);
  const st = STATUS_STYLE[status];
  const tc = temporalColor(zone.temporal_scope);

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 7,
      borderLeft: `4px solid ${zone.map_style?.color ?? '#4299e1'}`,
      padding: '10px 14px', marginBottom: 8,
      background: status === 'expired' ? '#f7fafc' : '#fff',
      opacity: status === 'expired' ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{semanticIcon(zone.semantic_type)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{zone.label}</span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3,
              background: st.bg, color: st.color, fontFamily: 'monospace',
            }}>
              {st.label}
            </span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3,
              background: '#ebf8ff', color: tc,
            }}>
              {temporalLabel(zone.temporal_scope)}
            </span>
            {zone.exclude_from_routing && (
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 3,
                background: '#fff5f5', color: '#c53030',
              }}>
                kein Routing
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#718096', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{semanticLabel(zone.semantic_type)}</span>
            <span style={{ fontFamily: 'monospace' }}>
              {zone.center.coordinates[1].toFixed(4)}, {zone.center.coordinates[0].toFixed(4)}
            </span>
            <span>{zone.radius_meters} m Radius</span>
            {zone.valid_from && (
              <span>
                {zone.valid_from.slice(0, 10)}
                {zone.valid_until && ` → ${zone.valid_until.slice(0, 10)}`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onEdit}
            style={{
              padding: '4px 10px', fontSize: 11, background: '#ebf8ff',
              color: '#2b6cb0', border: '1px solid #bee3f8', borderRadius: 4, cursor: 'pointer',
            }}
          >
            Bearbeiten
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '4px 10px', fontSize: 11, background: '#fff5f5',
              color: '#c53030', border: '1px solid #fed7d7', borderRadius: 4, cursor: 'pointer',
            }}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

interface Props {
  state?: OperatorZoneState;
}

type FormMode = 'none' | 'new' | { editing: OperatorDefinedZone };

export default function P05OperatorZonesForm({ state }: Props) {
  const base = state ?? mockOperatorZoneState;
  const now = new Date().toISOString();

  const [zones, setZones] = useState<OperatorDefinedZone[]>(base.zones);
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [saved, setSaved] = useState(false);

  const active  = zones.filter((z) => zoneStatus(z, now) === 'active').length;
  const pending = zones.filter((z) => zoneStatus(z, now) === 'pending').length;
  const expired = zones.filter((z) => zoneStatus(z, now) === 'expired').length;

  const handleSave = (zone: OperatorDefinedZone) => {
    if (formMode === 'new') {
      setZones((zs) => [...zs, zone]);
    } else if (typeof formMode === 'object') {
      setZones((zs) => zs.map((z) => (z.zone_id === zone.zone_id ? zone : z)));
    }
    setFormMode('none');
    setSaved(false);
  };

  const handleDelete = (zone_id: string) => {
    setZones((zs) => zs.filter((z) => z.zone_id !== zone_id));
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 620 }}>

      {/* Zusammenfassung */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'aktiv', count: active, color: '#276749', bg: '#f0fff4' },
          { label: 'ausstehend', count: pending, color: '#975a16', bg: '#fffbeb' },
          { label: 'abgelaufen', count: expired, color: '#718096', bg: '#f7fafc' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '10px 8px',
            borderRadius: 6, background: bg, border: `1px solid ${color}20`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 11, color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Formular */}
      {formMode === 'new' && (
        <ZoneForm
          onSave={handleSave}
          onCancel={() => setFormMode('none')}
        />
      )}
      {typeof formMode === 'object' && (
        <ZoneForm
          initial={formMode.editing}
          onSave={handleSave}
          onCancel={() => setFormMode('none')}
        />
      )}

      {/* Zonen-Liste */}
      <SectionTitle>
        Definierte Zonen ({zones.length})
      </SectionTitle>

      {zones.length === 0 && (
        <div style={{
          padding: '20px', textAlign: 'center', fontSize: 12,
          color: '#a0aec0', fontStyle: 'italic',
          border: '1px dashed #e2e8f0', borderRadius: 6, marginBottom: 12,
        }}>
          Keine Zonen definiert. Füge die erste Zone hinzu.
        </div>
      )}

      {zones.map((zone) => (
        <ZoneCard
          key={zone.zone_id}
          zone={zone}
          now={now}
          onEdit={() => setFormMode({ editing: zone })}
          onDelete={() => handleDelete(zone.zone_id)}
        />
      ))}

      {/* Button-Leiste */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0',
      }}>
        {formMode === 'none' && (
          <button
            onClick={() => { setFormMode('new'); setSaved(false); }}
            style={{
              padding: '7px 18px', fontSize: 13, fontWeight: 600,
              background: '#0074d9', color: '#fff',
              border: 'none', borderRadius: 5, cursor: 'pointer',
            }}
          >
            + Neue Zone
          </button>
        )}
        <button
          onClick={() => setSaved(true)}
          style={{
            padding: '7px 18px', fontSize: 13, fontWeight: 600,
            background: '#38a169', color: '#fff',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}
        >
          Übernehmen
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#38a169' }}>
            ✓ Gespeichert (Pipeline-Neustart erforderlich)
          </span>
        )}
      </div>

      <div style={{
        marginTop: 12, padding: '8px 12px', borderRadius: 5,
        background: '#fffbeb', border: '1px solid #f6e05e',
        fontSize: 11, color: '#975a16',
      }}>
        Zonen fließen in P06 SignalInterpretation ein — accumulation-Punkte in Zone-Radius
        werden automatisch als Aufenthalt klassifiziert.
      </div>
    </div>
  );
}
