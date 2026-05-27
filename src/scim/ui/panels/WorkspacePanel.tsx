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

import { useMemo, useState } from 'react';
import RepresentationWizard from './RepresentationWizard';
import RepresentBuildTetrahedron from '../RepresentBuildTetrahedron';
import type { RepresentBuildFace } from '../RepresentBuildTetrahedron';
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
  const [showWizard, setShowWizard] = useState(false);

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

  const onTetraFace = (f: RepresentBuildFace) => {
    if (f === 'geometry_draw') onJumpTo('geometry_editor');
    else if (f === 'catalog_magazination') onJumpTo('catalog');
    else if (f === 'represent_organisation') onJumpTo('workspace');
  };
  const onTetraArc = (a: string) => {
    if (a === 'system_adjust') onJumpTo('P01');
    else if (a === 'regio_content') onJumpTo('P02');
    // 'manual' wird vom Navigator-Tetraeder gehandhabt (Modal)
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760 }}>
      {/* Intro mit Tetraeder */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 6, padding: '14px 18px', marginBottom: 22, color: '#fff',
        display: 'flex', gap: 18, alignItems: 'center',
      }}>
        <div style={{ flexShrink: 0, background: '#fff', padding: 8, borderRadius: 4 }}>
          <RepresentBuildTetrahedron
            activeFace="represent_organisation"
            variant="light"
            onFaceClick={onTetraFace}
            onArcClick={onTetraArc}
            size={80}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, opacity: 0.65, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Represent Build · Seite 4
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 2 }}>
            Represent Organisation
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
            Empfangshalle der drei Produktions-Seiten. Hier laufen alle Geometrien, Kataloge und Representations zusammen. Komposition neuer Representations passiert ausschließlich hier.
          </div>
        </div>
      </div>

      {/* Geometrien */}
      <Section
        title="Boundary-Geometrien"
        count={GEOMETRIES.length}
        action={{
          label: '+ neue Geometry',
          onClick: () => onJumpTo('geometry_editor'),
        }}
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
            action={{ label: 'Im Katalog öffnen', onClick: () => onJumpTo('catalog') }}
          />
        ))}
      </Section>

      {/* Representations */}
      <Section
        title="Representations"
        count={REPRESENTATIONS.length}
        action={{
          label: '+ neue Representation',
          onClick: () => setShowWizard(true),
          disabled: GEOMETRIES.length === 0,
        }}
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
        <strong>Wave 2b — was geht:</strong> Geometry-Editor mit POI-Overlay (Tab nebenan), Representation-Wizard (Knopf oben), P01-Polygon-Migration (Knopf im Editor wenn Legacy-Daten gefunden).
        <br />
        <strong>Was noch fehlt:</strong> P01-Entrümpelung (Polygon-Section aus P01 raus). Wartet, bis dein Lichtenberg-Polygon migriert ist — sonst Datenverlust.
      </div>

      {showWizard && <RepresentationWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
