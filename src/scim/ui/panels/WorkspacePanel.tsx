// Workspace Panel — Phase 2a (Gate / Entry-Point mit echten Datenquellen).
//
// Listet die drei Primaer-Objekte des SCIM aus den gitbaren data/-Verzeichnissen:
//   - Boundary-Geometrien  → data/geometries/*.json (GeoJSON Feature)
//   - Kataloge             → data/*_pois_plan.md
//   - Representations      → data/representations/*.json
//
// NICHT-DESTRUKTIV: liest nur, schreibt nichts. Wave 2b ergaenzt den
// Representation-Wizard und den Vollbild-Geometry-Editor.
//
// Loest Phase 1 ab — der heutige P01-localStorage-Polygon wird nicht mehr
// gezeigt (steht jetzt unter "noch nicht in Repo" als Migrations-Hinweis).

import { useMemo } from 'react';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import { GEOMETRIES, REPRESENTATIONS } from '../../workspace/workspace.registry';
import type { CatalogRef } from '../../workspace/workspace.types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite ?raw-Import liefert string
import gruenbergMd from '../../../../data/grunberg_pois_plan.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

interface Props {
  onJumpTo: (panelId: string) => void;
}

// ─── localStorage-Lookup fuer den alten P01-Polygon (Migrations-Hinweis) ───
interface StoredP01Rep {
  name: string;
  polygon: [number, number][] | null;
}

function readP01Polygon(): StoredP01Rep | null {
  try {
    const raw = localStorage.getItem('scim3_representation');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredP01Rep;
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
  action?: { label: string; onClick: () => void; disabled?: boolean };
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
          {count} Eintr{count === 1 ? 'ag' : 'äge'}
        </span>
        <span style={{ flex: 1 }} />
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              fontSize: 11, padding: '3px 10px',
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              border: '1px solid #cbd5e0', borderRadius: 4,
              background: 'white', color: action.disabled ? '#a0aec0' : '#2b6cb0',
              fontFamily: 'system-ui, sans-serif',
            }}
            title={action.disabled ? 'Wave 2b — kommt noch' : ''}
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
  icon, primary, secondary, badge, action,
}: {
  icon: string;
  primary: string;
  secondary?: string;
  badge?: string;
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
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>
          {primary}
          {badge && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontFamily: 'monospace',
              background: '#ebf8ff', color: '#2b6cb0', padding: '1px 5px', borderRadius: 3,
            }}>
              {badge}
            </span>
          )}
        </div>
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
  const localPolygon = useMemo(() => readP01Polygon(), []);

  const catalogs: CatalogRef[] = useMemo(() => {
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
    return [grunberg, lichtenberg].map((c) => ({
      id: c.region_id,
      name: c.region_name,
      poi_count: c.pois.length,
      cluster_count: c.clusters.length,
      warning_count: c.warnings.length,
    }));
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
          Phase 2a · Read-only · Editoren via Panels nebenan
        </div>
      </div>

      {/* Geometrien */}
      <Section
        title="Boundary-Geometrien"
        count={GEOMETRIES.length}
        action={{ label: '+ neue Geometry', onClick: () => { /* Wave 2b */ }, disabled: true }}
      >
        {GEOMETRIES.length === 0 ? (
          <EmptyHint text="Noch keine Geometry im Repo. Wave 2b bringt einen Vollbild-Editor mit POI-Overlay." />
        ) : (
          GEOMETRIES.map((g) => (
            <ListItem
              key={g.id}
              icon="🗺"
              primary={g.name}
              badge={g.id}
              secondary={`Polygon mit ${g.polygon.length} Punkten${g.region ? ` · ${g.region}` : ''}${g.drawn_at ? ` · gezeichnet ${g.drawn_at}` : ''}`}
              action={{ label: 'Im Editor öffnen', onClick: () => onJumpTo('geometry_editor') }}
            />
          ))
        )}
        {localPolygon && (
          <div style={{
            marginTop: 8, padding: '8px 12px', fontSize: 11,
            background: '#fff5f0', border: '1px solid #fed7aa', borderRadius: 4,
            color: '#7c2d12',
          }}>
            <strong>Migrations-Hinweis:</strong> dein P01-Polygon „{localPolygon.name}"
            {localPolygon.polygon ? ` (${localPolygon.polygon.length} Punkte)` : ' (noch nicht gezeichnet)'} liegt nur im Browser-localStorage. Wave 2b bekommt einen „Übernehmen"-Knopf, der daraus ein gitbares data/geometries/*.json macht.
          </div>
        )}
      </Section>

      {/* Kataloge */}
      <Section
        title="Kataloge"
        count={catalogs.length}
        action={{ label: '+ neuer Katalog', onClick: () => { /* Wave 2b */ }, disabled: true }}
      >
        {catalogs.map((c) => (
          <ListItem
            key={c.id}
            icon="📋"
            primary={c.name}
            badge={c.id}
            secondary={`${c.poi_count} POIs · ${c.cluster_count} Cluster · ${c.warning_count} Warnungen`}
            action={{ label: 'Im Katalog-Tab öffnen', onClick: () => onJumpTo('P02') }}
          />
        ))}
      </Section>

      {/* Representations */}
      <Section
        title="Representations"
        count={REPRESENTATIONS.length}
        action={{ label: '+ neue Representation', onClick: () => { /* Wave 2b */ }, disabled: true }}
      >
        {REPRESENTATIONS.length === 0 ? (
          <EmptyHint text="Noch keine Representations. Wave 2b baut den Wizard: Geometry + Katalog + Name → Representation. Erst dann werden SystemAdjust-Settings, Regio-Content und QR-Code für diese Representation aktiv." />
        ) : (
          REPRESENTATIONS.map((r) => (
            <ListItem
              key={r.id}
              icon="◇"
              primary={r.name}
              badge={r.id}
              secondary={`Geometry: ${r.geometry_id}${r.catalog_id ? ` · Katalog: ${r.catalog_id}` : ' · kein Katalog'}`}
            />
          ))
        )}
      </Section>

      {/* Footer-Info */}
      <div style={{
        marginTop: 24, padding: '10px 14px',
        background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 4,
        fontSize: 11, color: '#0c4a6e',
      }}>
        <strong>Wave 2a — was geht:</strong> Geometrien und Representations werden aus den gitbaren data/-Verzeichnissen gelesen. Kataloge wie bisher.
        <br />
        <strong>Wave 2b — kommt:</strong> Vollbild-Geometry-Editor mit POI-Overlay, Representation-Wizard, P01-Polygon-Migration und P01-Entrümpelung (Polygon zieht aus P01 raus).
      </div>
    </div>
  );
}
