// Workspace Panel — Phase 1 (Gate / Entry-Point).
//
// Listet die drei Primaer-Objekte des SCIM:
//   - Boundary-Geometrien (heute: nur die eine im P01-localStorage, falls vorhanden)
//   - Kataloge (heute: Gruenberg + Lichtenberg aus data/*_pois_plan.md)
//   - Representations (heute: noch keine — Phase 2/3 baut den Wizard)
//
// NICHT-DESTRUKTIV: liest nur, schreibt nichts. Bestehende Panels und State
// bleiben unveraendert. Klicks auf 'oeffnen' wechseln den activeId — also den
// nav-Tab — und springen so zu den existierenden Editoren.
//
// Phase 2 wird ergaenzen: data/geometries/*.json, data/representations/*.json,
// Wizard zur Repreasentation-Erstellung, Vollbild-Geometry-Editor.

import { useMemo } from 'react';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite ?raw-Import liefert string
import gruenbergMd from '../../../../data/grunberg_pois_plan.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

interface Props {
  onJumpTo: (panelId: string) => void;
}

// ─── localStorage-Lookup fuer die einzige bestehende Geometrie ──────────────
//
// Phase 1 liest aus dem P01-Schluessel direkt. Phase 2 ersetzt das durch
// data/geometries/*.json + State-Layer.
interface StoredRepresentation {
  name: string;
  polygon: [number, number][] | null;
}

function readP01Polygon(): StoredRepresentation | null {
  try {
    const raw = localStorage.getItem('scim3_representation');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRepresentation;
    if (!parsed || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Sub-Sections ───────────────────────────────────────────────────────────

function Section({
  title, count, action, children,
}: {
  title: string;
  count: number;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8,
        paddingBottom: 6, borderBottom: '1px solid #e2e8f0',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a365d', margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>
          {count} Eintrag{count === 1 ? '' : '"e'}
        </span>
        <span style={{ flex: 1 }} />
        {action && (
          <button
            onClick={action.onClick}
            style={{
              fontSize: 11, padding: '3px 10px', cursor: 'pointer',
              border: '1px solid #cbd5e0', borderRadius: 4,
              background: 'white', color: '#a0aec0',  // Phase 1: grau (nicht funktional)
              fontFamily: 'system-ui, sans-serif',
            }}
            title="Phase 2 — kommt noch"
            disabled
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 12, color: '#a0aec0', fontStyle: 'italic',
      padding: '12px 16px', background: '#f7fafc', borderRadius: 4,
    }}>
      {text}
    </div>
  );
}

function ListItem({
  icon, primary, secondary, action,
}: {
  icon: string;
  primary: string;
  secondary?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 12px', borderRadius: 4,
      background: '#f7fafc', border: '1px solid #e2e8f0',
      marginBottom: 6,
    }}>
      <span style={{ fontSize: 16, width: 24, textAlign: 'center', color: '#4a5568' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{primary}</div>
        {secondary && (
          <div style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace', marginTop: 1 }}>
            {secondary}
          </div>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: 11, padding: '4px 12px', cursor: 'pointer',
            border: '1px solid #cbd5e0', borderRadius: 4,
            background: 'white', color: '#2b6cb0', fontWeight: 500,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

export default function WorkspacePanel({ onJumpTo }: Props) {
  const geometry = useMemo(() => readP01Polygon(), []);

  const catalogs = useMemo(() => {
    const grunberg = parsePoiCatalog(gruenbergMd as string, {
      region_id: 'gruenberg',
      region_name: 'Grünberg',
      source_path: 'data/grunberg_pois_plan.md',
    });
    const lichtenberg = parsePoiCatalog(lichtenbergMd as string, {
      region_id: 'lichtenberg',
      region_name: 'Lichtenberg',
      source_path: 'data/lichtenberg_pois_plan.md',
    });
    return [grunberg, lichtenberg];
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760 }}>
      {/* Intro */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 6, padding: '14px 18px', marginBottom: 22, color: '#fff',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
          SCIM Workspace
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
          Drei Primär-Objekte: <strong>Boundary-Geometrien</strong>, <strong>Kataloge</strong>, <strong>Representations</strong>.
          Geometry + Katalog werden gemeinsam zu einer Representation kombiniert — das ist die Einheit, die als Bundle in der Ziel-App landet.
        </div>
        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 6, fontFamily: 'monospace' }}>
          Phase 1 · Read-only Gate · Editoren werden über die Panels nebenan bedient
        </div>
      </div>

      {/* Geometrien */}
      <Section
        title="Boundary-Geometrien"
        count={geometry ? 1 : 0}
        action={{ label: '+ neue Geometry', onClick: () => { /* Phase 2 */ } }}
      >
        {geometry ? (
          <ListItem
            icon="🗺"
            primary={geometry.name}
            secondary={
              geometry.polygon
                ? `Polygon mit ${geometry.polygon.length} Punkten`
                : 'kein Polygon gezeichnet'
            }
            action={{ label: 'In P01 öffnen', onClick: () => onJumpTo('P01') }}
          />
        ) : (
          <EmptyHint text="Noch keine Geometry angelegt. Phase 2 bringt einen Vollbild-Editor mit POI-Overlay." />
        )}
      </Section>

      {/* Kataloge */}
      <Section
        title="Kataloge"
        count={catalogs.length}
        action={{ label: '+ neuer Katalog', onClick: () => { /* Phase 2 */ } }}
      >
        {catalogs.map((c) => (
          <ListItem
            key={c.region_id}
            icon="📋"
            primary={c.region_name}
            secondary={`${c.pois.length} POIs · ${c.clusters.length} Cluster · ${c.warnings.length} Warnungen`}
            action={{ label: 'Im Katalog-Tab öffnen', onClick: () => onJumpTo('P02') }}
          />
        ))}
      </Section>

      {/* Representations */}
      <Section
        title="Representations"
        count={0}
        action={{ label: '+ neue Representation', onClick: () => { /* Phase 2 */ } }}
      >
        <EmptyHint text="Noch keine Representations. Phase 2 baut den Wizard: Geometry + Katalog + Name → Representation. Erst dann werden SystemAdjust-Settings, Regio-Content und QR-Code aktiv (Phase 3)." />
      </Section>

      {/* Footer-Info */}
      <div style={{
        marginTop: 24, padding: '10px 14px',
        background: '#fff5f0', border: '1px solid #fed7aa', borderRadius: 4,
        fontSize: 11, color: '#7c2d12',
      }}>
        <strong>Phase 1 — was geht:</strong> Übersicht aller existierenden Objekte. Klick auf „öffnen" springt zum jeweiligen Editor.
        <br />
        <strong>Was noch nicht geht:</strong> Anlegen via [+]-Buttons, Vollbild-Geometry-Editor, Representation-Wizard, Tab-Disabling bei fehlendem Representation-Kontext.
        Folgt in Phasen 2–4.
      </div>
    </div>
  );
}
