// P04 TelcoLoad — pure Feature-Extraction-Stelle (Real-Signal-Eingang).
//
// Vorher: enthielt zusaetzlich einen Simulations-Switch mit Szenario-Presets.
// Seit Mai 2026 (siehe ann_064) ist die Simulation als Tab nach P06 gewandert,
// weil sie konzeptuell den Klassifikator testet, nicht den Real-Eingang.
// Hier bleibt nur die Live-Anzeige der Anbieter-, Zeit- und Scope-Daten.

import type { TelcoLoadState } from '../../telco-load/telcoLoad.types';
import { mockTelcoLoadState } from '../../telco-load/telcoLoad.mock';

interface Props {
  state?: TelcoLoadState;
}

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

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

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function P04TelcoLoadForm({ state }: Props) {
  const base = state ?? mockTelcoLoadState;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 580 }}>

      {/* Hinweis auf Simulations-Tab in P06 */}
      <div style={{
        padding: '8px 12px', borderRadius: 6, marginBottom: 14,
        background: '#ebf8ff', border: '1px solid #bee3f8',
        fontSize: 12, color: '#2b6cb0',
      }}>
        Pure Feature-Extraction-Stelle: reale Telco-Signale rein, kalibriert, weiter.
        Synthetik-Generator (Szenarien zur Klassifikator-Erprobung) lebt jetzt
        im <strong>Simulation-Tab von P06 SignalInterpretation</strong> (siehe ann_064).
      </div>

      <SectionTitle>Telco-Anbieter</SectionTitle>
      {base.provider ? (
        <>
          <MetaRow label="Anbieter" value={base.provider.provider_name ?? base.provider.provider_id} />
          <MetaRow label="Anonymisierung" value={base.provider.anonymization_method?.replace(/_/g, ' ') ?? '—'} />
          <MetaRow label="Vertragsversion" value={base.provider.data_contract_version ?? '—'} mono />
          <MetaRow label="Rohdaten-Zugriff" value="Nein (vertraglich ausgeschlossen)" />
          <MetaRow label="Geräte-Zugriff" value="Nein (vertraglich ausgeschlossen)" />
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#a0aec0', padding: '8px 0' }}>Kein Anbieter konfiguriert.</div>
      )}

      <SectionTitle>Zeitfenster</SectionTitle>
      <MetaRow label="Start" value={new Date(base.time_window.start_at).toLocaleString('de-AT')} />
      <MetaRow label="Ende" value={new Date(base.time_window.end_at).toLocaleString('de-AT')} />
      <MetaRow label="Dauer" value={`${base.time_window.duration_seconds}s`} mono />
      <MetaRow label="Aggregations-Fenster" value={`${base.time_window.aggregation_window_seconds}s`} mono />

      <SectionTitle>Räumlicher Scope</SectionTitle>
      <MetaRow label="Scope-Typ" value={base.spatial_scope.scope_type.replace(/_/g, ' ')} />
      <MetaRow label="Auflösung" value={`${base.spatial_scope.spatial_resolution_meters}m`} mono />
      <MetaRow label="Projektion" value={base.spatial_scope.projection_method.replace(/_/g, ' ')} />

      <SectionTitle>Qualität & Datenschutz</SectionTitle>
      <MetaRow label="Gesamt-Qualität" value={base.signal_quality.overall_quality} />
      <MetaRow label="Gültige Gruppen" value={String(base.signal_quality.valid_group_count)} />
      <MetaRow label="Privacy-Check" value={base.privacy_check.is_privacy_valid ? '✓ Bestanden' : '✗ Blockiert'} />

      <div style={{
        marginTop: 16, padding: '10px 14px', borderRadius: 5,
        background: '#ebf8ff', border: '1px solid #bee3f8',
        fontSize: 12, color: '#2b6cb0',
      }}>
        ℹ Live-Verbindung zur Telco-API: SML-3 (Zod-validierte API-Grenzen + Authentifizierung)
      </div>
    </div>
  );
}
