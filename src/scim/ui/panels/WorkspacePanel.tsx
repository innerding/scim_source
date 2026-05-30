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

import React, { useMemo, useState } from 'react';
import RepresentationWizard from './RepresentationWizard';
import RepresentBuildTetrahedron from '../RepresentBuildTetrahedron';
import type { RepresentBuildFace } from '../RepresentBuildTetrahedron';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import { GEOMETRIES, REPRESENTATIONS } from '../../workspace/workspace.registry';
import type { CatalogRef } from '../../workspace/workspace.types';
import { DRAFT_KEY } from './DrawerPanel';
import { loadHandoff, clearHandoff, type RepresentHandoff } from '../../workspace/draftHandoff';
import { commitToRepo, type CommitResult } from '../../../runtime/commitBridge';
import type { BoundaryGeometryFile } from '../../workspace/workspace.types';
import type { Position } from 'geojson';

// Stabiler slug aus einem freien Namen — passt zur Worker-Whitelist
// /^data\/geometries\/[a-z0-9][a-z0-9_-]*\.json$/.
function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // Diakritika entfernen
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'boundary';
}

// Boundary-Polygon (Position[] = [lon,lat][]) → geschlossener GeoJSON-Ring.
function closedRing(polygon: Position[]): Position[] {
  if (polygon.length < 3) return polygon;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return polygon;
  return [...polygon, first];
}

// Im Browser gezeichnete Geometry — sitzt in localStorage, noch nicht im Repo.
interface GeometryDraft {
  geometryId: string | 'new';
  name: string;
  region: string;
  polygon: [number, number][] | null;
}

function loadGeometryDraft(): GeometryDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as GeometryDraft;
    if (!d.polygon || d.polygon.length < 3) return null;
    return d;
  } catch { return null; }
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite ?raw-Import liefert string
import gruenbergMd from '../../../../data/gruenberg_pois_plan.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

interface Props {
  onJumpTo: (panelId: string, geometryId?: string) => void;
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
  icon, primary, secondary, badge, action, trailing,
}: {
  icon: string;
  primary: string;
  secondary?: string;
  badge?: string;
  action?: { label: string; onClick: () => void };
  trailing?: React.ReactNode;
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
      {trailing}
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
  // Draft aus dem Editor (localStorage) — wird hier sichtbar, bevor er ins Repo geht.
  const draft = useMemo(() => loadGeometryDraft(), []);
  const [showWizard, setShowWizard] = useState(false);
  // Uebergabe-Snapshot aus dem Drawer (Umbauplan E) — separater localStorage-Key.
  const [handoff, setHandoff] = useState<RepresentHandoff | null>(() => loadHandoff());
  const onDiscardHandoff = () => { clearHandoff(); setHandoff(null); };

  // F1 — Boundary aus der Übergabe als eigenes Artefakt nach data/geometries/ committen.
  const [boundaryBusy, setBoundaryBusy] = useState(false);
  const [boundaryResult, setBoundaryResult] = useState<CommitResult | null>(null);

  const onCommitBoundary = async () => {
    if (!handoff || handoff.boundaryPolygon.length < 3) return;
    setBoundaryBusy(true);
    setBoundaryResult(null);
    const slug = slugify(handoff.name || handoff.region || 'boundary');
    const file: BoundaryGeometryFile = {
      type: 'Feature',
      properties: {
        name: handoff.name || slug,
        region: handoff.region || undefined,
        source: 'Drawer-Übergabe (Workspace F1)',
        drawn_at: new Date().toISOString().slice(0, 10),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [closedRing(handoff.boundaryPolygon)],
      },
    };
    const result = await commitToRepo({
      path: `data/geometries/${slug}.json`,
      content: JSON.stringify(file, null, 2) + '\n',
      message: `boundary: ${slug} via Workspace-Übergabe (F1)`,
    });
    setBoundaryResult(result);
    setBoundaryBusy(false);
  };

  const catalogs: CatalogRef[] = useMemo(() => {
    const grunberg = parsePoiCatalog(gruenbergMd as string, {
      region_id: 'gruenberg',
      region_name: 'Grünberg',
      source_path: 'data/gruenberg_pois_plan.md',
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
    else if (f === 'sensus_core_build') onJumpTo('P11');
  };
  const onTetraArc = (a: string) => {
    if (a === 'system_adjust') onJumpTo('P01');
    else if (a === 'regio_content') onJumpTo('P02');
    else if (a === 'load_thresholds') onJumpTo('P09');
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

      {/* Uebergabe aus dem Drawer (Umbauplan E) — der atomare Verbund-Commit
          (Boundary + Katalog-Bindung + Wegnetz) folgt in Umbauplan F. */}
      {handoff && (
        <div style={{
          background: '#ebf8ff', border: '1px solid #2b6cb0', borderRadius: 6,
          padding: '14px 18px', marginBottom: 22,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>↩</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>
                Übergabe aus dem Drawer
                <span style={{
                  marginLeft: 8, fontSize: 10, fontFamily: 'monospace',
                  background: '#2b6cb0', color: '#fff', padding: '1px 6px', borderRadius: 3,
                }}>
                  VERBUND
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#2c5282', marginTop: 1 }}>
                {handoff.name || 'Unbenannt'}{handoff.region ? ` · ${handoff.region}` : ''}
              </div>
            </div>
          </div>

          <ul style={{ margin: '0 0 10px 0', padding: '0 0 0 18px', fontSize: 11, color: '#2c5282', lineHeight: 1.7 }}>
            <li><strong>Boundary</strong> · Polygon mit {handoff.boundaryPolygon.length} Punkten</li>
            <li>
              <strong>Maske</strong> ·{' '}
              {handoff.maskPolygon
                ? `Slot-2-Polygon mit ${handoff.maskPolygon.length} Punkten`
                : 'keine'}
            </li>
            <li>
              <strong>Wegnetz</strong> ·{' '}
              {handoff.net
                ? `${handoff.net.edges.length} Kanten (${handoff.net.primaryCount} primär / ${handoff.net.connectorCount} Connector)`
                  + (handoff.net.cropped ? `, maskiert · ${handoff.net.gates.length} Gates` : ', roh (nicht maskiert)')
                : 'kein Netz übergeben'}
            </li>
          </ul>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onCommitBoundary}
              disabled={boundaryBusy || handoff.boundaryPolygon.length < 3}
              title="Schreibt die Boundary als eigenes Artefakt nach data/geometries/ — der Anker, auf den Katalog und Wegnetz zeigen (F1)."
              style={{
                fontSize: 12, padding: '7px 12px', fontWeight: 600,
                border: '1px solid #2b6cb0', borderRadius: 5,
                background: boundaryBusy ? '#bee3f8' : '#2b6cb0',
                color: boundaryBusy ? '#2c5282' : '#fff',
                cursor: boundaryBusy ? 'wait' : 'pointer',
              }}
            >
              {boundaryBusy ? 'Committe Boundary …' : 'Boundary committen (F1)'}
            </button>
            <button
              onClick={() => onJumpTo('geometry_editor')}
              style={{
                fontSize: 12, padding: '7px 12px', cursor: 'pointer',
                border: '1px solid #2b6cb0', borderRadius: 5,
                background: 'white', color: '#2b6cb0', fontWeight: 500,
              }}
            >
              Im Editor öffnen
            </button>
            <button
              onClick={onDiscardHandoff}
              style={{
                fontSize: 12, padding: '7px 12px', cursor: 'pointer',
                border: '1px solid #e2e8f0', borderRadius: 5,
                background: 'white', color: '#718096', fontWeight: 500,
              }}
            >
              Verwerfen
            </button>
          </div>

          {boundaryResult && (
            <div style={{
              marginTop: 10, fontSize: 11, lineHeight: 1.5,
              padding: '8px 10px', borderRadius: 4,
              background: boundaryResult.ok ? '#f0fff4' : '#fff5f5',
              border: `1px solid ${boundaryResult.ok ? '#9ae6b4' : '#feb2b2'}`,
              color: boundaryResult.ok ? '#22543d' : '#742a2a',
            }}>
              {boundaryResult.ok ? (
                <>
                  ✓ Boundary {boundaryResult.was_update ? 'aktualisiert' : 'committet'} ·{' '}
                  <code>{boundaryResult.path}</code>
                  {boundaryResult.commit_url && (
                    <>
                      {' · '}
                      <a href={boundaryResult.commit_url} target="_blank" rel="noreferrer"
                        style={{ color: '#2b6cb0' }}>Commit ansehen</a>
                    </>
                  )}
                </>
              ) : (
                <>✗ Commit fehlgeschlagen: {boundaryResult.error}</>
              )}
            </div>
          )}
        </div>
      )}

      {/* Geometrien */}
      <Section
        title="Boundary-Geometrien"
        count={GEOMETRIES.length + (draft ? 1 : 0)}
        action={{
          label: '+ neue Geometry',
          onClick: () => onJumpTo('geometry_editor'),
        }}
      >
        {/* Draft (localStorage) zuerst — sichtbar gemacht fuer Review,
            noch nicht im Repo. */}
        {draft && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px', borderRadius: 4, marginBottom: 6,
            background: '#fffaf0', border: '1px dashed #ed8936',
          }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>🗺</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7c2d12' }}>
                {draft.name || 'Unbenannt'}
                <span style={{
                  marginLeft: 8, fontSize: 10, fontFamily: 'monospace',
                  background: '#ed8936', color: '#fff', padding: '1px 6px', borderRadius: 3,
                }}>
                  DRAFT
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9c4221', fontFamily: 'monospace', marginTop: 1 }}>
                Polygon mit {draft.polygon!.length} Punkten
                {draft.region ? ` · ${draft.region}` : ''}
                {' · localStorage, noch nicht ins Repo committed'}
              </div>
            </div>
            <button
              onClick={() => onJumpTo('geometry_editor')}
              style={{
                fontSize: 11, padding: '4px 12px', cursor: 'pointer',
                border: '1px solid #ed8936', borderRadius: 4,
                background: 'white', color: '#9c4221', fontWeight: 500,
              }}
            >
              Im Editor öffnen
            </button>
          </div>
        )}

        {GEOMETRIES.length === 0 && !draft ? (
          <EmptyHint text="Noch keine Geometry im Repo. Wave 2b bringt einen Vollbild-Editor mit POI-Overlay." />
        ) : (
          GEOMETRIES.map((g) => (
            <ListItem
              key={g.id}
              icon="🗺"
              primary={g.name}
              badge={g.id}
              secondary={`Polygon mit ${g.polygon.length} Punkten${g.region ? ` · ${g.region}` : ''}${g.drawn_at ? ` · gezeichnet ${g.drawn_at}` : ''}`}
              action={{ label: 'Im Editor öffnen', onClick: () => onJumpTo('geometry_editor', g.id) }}
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
          REPRESENTATIONS.map((r) => {
            const geo = GEOMETRIES.find((g) => g.id === r.geometry_id);
            const cat = r.catalog_id ? catalogs.find((c) => c.id === r.catalog_id) : null;
            return (
              <ListItem
                key={r.id}
                icon="◇"
                primary={r.name}
                badge={r.id}
                secondary={`Geometry: ${r.geometry_id}${r.catalog_id ? ` · Katalog: ${r.catalog_id}` : ' · kein Katalog'}`}
                trailing={(
                  <StatusRow
                    geometry={{
                      label: 'G',
                      title: geo ? `Geometry "${r.geometry_id}" vorhanden` : `Geometry "${r.geometry_id}" fehlt — Editor öffnen`,
                      state: geo ? 'ok' : 'missing',
                      onClick: () => onJumpTo('geometry_editor'),
                    }}
                    catalog={{
                      label: 'C',
                      title: r.catalog_id
                        ? (cat ? `Catalog "${r.catalog_id}" vorhanden` : `Catalog "${r.catalog_id}" fehlt — Katalog öffnen`)
                        : 'Kein Catalog referenziert',
                      state: !r.catalog_id ? 'none' : (cat ? 'ok' : 'missing'),
                      onClick: () => onJumpTo('catalog'),
                    }}
                    rep={{
                      label: 'R',
                      title: 'Representation committed',
                      state: 'ok',
                      onClick: () => onJumpTo('workspace'),
                    }}
                  />
                )}
              />
            );
          })
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

// ─── Status-Pills ───────────────────────────────────────────────────────────
//
// Drei kleine Indikatoren pro Representation: Geometry / Catalog / Rep selbst.
// State-Farben:
//   ok        gruen — Wahrheit ist im Repo
//   missing   orange — referenziert aber nicht gefunden (Lotse hin zum Panel)
//   none      grau — nichts referenziert (z. B. Rep ohne Catalog)
//
// Klick lotst ins jeweilige Panel. Spaeter (Task #11/#12) zeigen die Pills
// auch DRAFT-Stati aus Wizard-/Katalog-localStorage an.

type PillState = 'ok' | 'missing' | 'none';

interface PillProps {
  label: string;
  title: string;
  state: PillState;
  onClick: () => void;
}

function StatusPill({ label, title, state, onClick }: PillProps) {
  const palette = {
    ok:      { bg: '#c6f6d5', fg: '#22543d', border: '#9ae6b4' },
    missing: { bg: '#feebc8', fg: '#7c2d12', border: '#fbd38d' },
    none:    { bg: '#edf2f7', fg: '#718096', border: '#e2e8f0' },
  }[state];
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
        padding: '2px 7px', cursor: 'pointer',
        background: palette.bg, color: palette.fg,
        border: `1px solid ${palette.border}`, borderRadius: 3,
        minWidth: 22, textAlign: 'center',
      }}
    >
      {label}
    </button>
  );
}

function StatusRow({ geometry, catalog, rep }: { geometry: PillProps; catalog: PillProps; rep: PillProps }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      <StatusPill {...geometry} />
      <StatusPill {...catalog} />
      <StatusPill {...rep} />
    </div>
  );
}
