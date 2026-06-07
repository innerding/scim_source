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
import { formatBytes } from '../../regio-content/pathEngine';

// Datengröße eines Objekts als JSON (UTF-8-Bytes) — fürs Auslieferungs-Budget.
const bytesOf = (obj: unknown): number => new TextEncoder().encode(JSON.stringify(obj)).length;
import { commitToRepo } from '../../../runtime/commitBridge';
import { useRepresentationContext } from '../../../runtime/repContext';
import { useRole } from '../RoleContext';
import { PathworksHubFloating, PathworksInfoClipboard } from '../PathworksHubInfo';
import type { BoundaryGeometryFile, WegnetzFile, RepresentationFile } from '../../workspace/workspace.types';
import type { Position } from 'geojson';
import {
  listDrafts, createDraft, updateDraft, removeDraft, draftColor,
  type Draft, type DraftColor,
} from '../../workspace/draftStore';

// Farb-Token der Draft-Reife (gelb ohne Katalog, orange mit, neutral als Slot).
const DRAFT_COLORS: Record<DraftColor, { stroke: string; bg: string; text: string; label: string }> = {
  neutral: { stroke: '#cbd5e0', bg: '#f7fafc', text: '#718096', label: 'Slot' },
  gelb:    { stroke: '#ecc94b', bg: '#fffff0', text: '#975a16', label: 'ohne Katalog' },
  orange:  { stroke: '#ed8936', bg: '#fffaf0', text: '#9c4221', label: 'mit Katalog' },
  rot:     { stroke: '#e53e3e', bg: '#fff5f5', text: '#9b2c2c', label: 'maskiert · committbar' },
};

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
            title={action.disabled ? 'noch nicht gebaut' : ''}
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

// 👁-Knopf: schaltet das Asset im Inspector (ScimMap) an/aus.
function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={shown ? 'Inspector zeigt dieses Objekt — Klick: aus' : 'Dieses Objekt im Inspector zeigen'}
      style={{
        fontSize: 15, lineHeight: 1, cursor: 'pointer', padding: '4px 8px',
        borderRadius: 4, border: `1px solid ${shown ? '#2b6cb0' : '#cbd5e0'}`,
        background: shown ? '#ebf8ff' : '#fff',
        filter: shown ? 'none' : 'grayscale(1) opacity(0.55)',
      }}
    >
      👁
    </button>
  );
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

export default function WorkspacePanel({ onJumpTo }: Props) {
  const [showWizard, setShowWizard] = useState(false);
  const [showClip, setShowClip] = useState(false);   // schwebendes Arbeitsblatt (Notizen)
  const [showInfo, setShowInfo] = useState(false);   // schwebendes Infoblatt-Klemmbrett (3 Versionen)
  const role = useRole();
  // 👁 Inspector-Sicht: welches Workspace-Objekt der rechte Inspector zeigt
  // (Katalog → nur POIs, Boundary → nur Umriss, Representation → alles).
  const { inspectorAsset, setInspectorAsset } = useRepresentationContext();
  const assetShown = (kind: 'representation' | 'geometry' | 'catalog', id: string) =>
    inspectorAsset?.kind === kind && inspectorAsset.id === id;
  const toggleAsset = (kind: 'representation' | 'geometry' | 'catalog', id: string) =>
    setInspectorAsset(assetShown(kind, id) ? null : { kind, id });

  // F4 — Draft-Pipeline: benannte Workspace-Objekte (ersetzt den stillen Autospeicher).
  const [drafts, setDrafts] = useState<Draft[]>(() => listDrafts());
  const [newDraftName, setNewDraftName] = useState('');
  const refreshDrafts = () => setDrafts(listDrafts());

  const onCreateDraft = () => {
    const name = newDraftName.trim();
    if (!name) return;
    createDraft(name);
    setNewDraftName('');
    refreshDrafts();
  };
  const onRenameDraft = (id: string, name: string) => { updateDraft(id, { name }); refreshDrafts(); };
  const onBindCatalog = (id: string, catalog_id: string) => {
    updateDraft(id, { catalog_id: catalog_id || null });
    refreshDrafts();
  };
  const onRemoveDraft = (id: string) => { removeDraft(id); refreshDrafts(); };

  // F7 Schritt 3 — Commit aus der roten Draft-Zeile: schreibt Boundary (B2) +
  // maskiertes Netz + Representation in EINEM Akt, versiegelt (Draft raus). Nur
  // rote Drafts (masked + B2 + maskiertes Netz) sind committbar.
  const [commitBusyId, setCommitBusyId] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);

  const draftCommittable = (d: Draft): boolean =>
    !!d.boundary && d.boundary.length >= 3 && !!d.net_masked;

  const onCommitDraft = async (d: Draft) => {
    if (!draftCommittable(d) || !d.boundary || !d.net_masked) return;
    setCommitBusyId(d.id);
    setCommitMsg(null);
    const slug = slugify(d.name || 'representation');
    const today = new Date().toISOString().slice(0, 10);
    const net = d.net_masked;
    const geom: BoundaryGeometryFile = {
      type: 'Feature',
      properties: { name: d.name || slug, source: 'Workspace-Commit (F7)', drawn_at: today },
      geometry: { type: 'Polygon', coordinates: [closedRing(d.boundary)] },
    };
    const weg: WegnetzFile = {
      schema: 'scim3_wegnetz_v1', id: slug, geometry_id: slug,
      edges: net.edges, gates: net.gates, cropped: net.cropped,
      primary_count: net.primaryCount, connector_count: net.connectorCount,
      created_at: today,
    };
    // Version: bei Re-Commit derselben id hochzaehlen (Basis: zuletzt deployter
    // Stand). Das Origin-Paket erbt diese Version.
    const repId = `rep-${slug}`;
    const nextVersion = (REPRESENTATIONS.find((r) => r.id === repId)?.version ?? 0) + 1;
    const rep: RepresentationFile = {
      schema: 'scim3_representation_v1', id: repId, name: d.name || slug,
      geometry_id: slug, catalog_id: d.catalog_id || undefined, wegnetz_id: slug,
      version: nextVersion,
      created_at: today, note: 'via Workspace-Commit (F7)',
    };
    // Reihenfolge: Boundary → Wegnetz → Representation (Keystone zuletzt).
    const steps: [string, string, string][] = [
      [`data/geometries/${slug}.json`, JSON.stringify(geom, null, 2) + '\n', 'boundary'],
      [`data/wegnetze/${slug}.json`, JSON.stringify(weg, null, 2) + '\n', 'wegnetz'],
      [`data/representations/rep-${slug}.json`, JSON.stringify(rep, null, 2) + '\n', 'representation'],
    ];
    let lastUrl: string | undefined;
    for (const [path, content, label] of steps) {
      const res = await commitToRepo({ path, content, message: `${label}: ${slug} via Workspace-Commit (F7)` });
      if (!res.ok) {
        setCommitMsg({ ok: false, text: `${label} fehlgeschlagen: ${res.error}` });
        setCommitBusyId(null);
        return;
      }
      lastUrl = res.commit_url;
    }
    // Versiegelt: Draft verlässt die Pipeline (ist jetzt committete Representation).
    removeDraft(d.id);
    refreshDrafts();
    setCommitBusyId(null);
    setCommitMsg({ ok: true, text: `Representation rep-${slug} committet — Draft versiegelt.`, url: lastUrl });
  };

  const catalogs: CatalogRef[] = useMemo(() => {
    const sources = [
      { md: gruenbergMd as string, region_id: 'gruenberg', region_name: 'Grünberg', source_path: 'data/gruenberg_pois_plan.md' },
      { md: lichtenbergMd as string, region_id: 'lichtenberg', region_name: 'Lichtenberg', source_path: 'data/lichtenberg_pois_plan.md' },
    ];
    return sources.map((s) => {
      const c = parsePoiCatalog(s.md, { region_id: s.region_id, region_name: s.region_name, source_path: s.source_path });
      return {
        id: c.region_id,
        name: c.region_name,
        poi_count: c.pois.length,
        cluster_count: c.clusters.length,
        warning_count: c.warnings.length,
        bytes: new TextEncoder().encode(s.md).length,
      };
    });
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
            Arbeitstitel · Representations-Drehscheibe
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 2 }}>
            Pathworks (Hub)
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
            Empfangshalle der drei Produktions-Seiten. Hier laufen alle Geometrien, Kataloge und Representations zusammen. Komposition neuer Representations passiert ausschließlich hier.
          </div>
        </div>
        {role === 'operator' && (
          <div style={{ flexShrink: 0, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setShowClip((v) => !v)}
              title="Arbeitsblatt — offene Notizen, als schwebendes Panel (Hintergrund bleibt bedienbar)"
              style={{
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)',
                color: '#fff', borderRadius: 999, fontSize: 10.5, padding: '3px 10px',
                fontFamily: 'system-ui, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <span aria-hidden>✎</span> Arbeitsblatt
            </button>
            <button
              onClick={() => setShowInfo((v) => !v)}
              title="Infoblatt — Erklärung des Pathworks Hubs (Operator · Analyst · Regio-Editor), schwebendes Klemmbrett"
              style={{
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)',
                color: '#fff', borderRadius: 999, fontSize: 10.5, padding: '3px 10px',
                fontFamily: 'system-ui, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <span aria-hidden>ⓘ</span> Infoblatt
            </button>
          </div>
        )}
      </div>
      {showClip && <PathworksHubFloating onClose={() => setShowClip(false)} />}
      {showInfo && <PathworksInfoClipboard onClose={() => setShowInfo(false)} />}


      {/* Package-Pipeline (F4) — Intake → Draft → gespeicherter Draft (+Katalog) */}
      <Section title="Package-Pipeline" count={drafts.length}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', marginBottom: 12 }}>
          {/* ① Intake (leer bis Regio-Dashboard existiert) */}
          <div style={{
            width: 180, flexShrink: 0, padding: '10px 12px', borderRadius: 6,
            border: '1px dashed #cbd5e0', background: '#f7fafc',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ① Intake
            </div>
            <div style={{ fontSize: 11, color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.4 }}>
              kein Regio-Dashboard verbunden
            </div>
          </div>

          {/* ② Anlegen */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              ② Neuen Draft anlegen
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onCreateDraft(); }}
                placeholder="Name eingeben …"
                style={{
                  flex: 1, fontSize: 12, padding: '7px 10px', borderRadius: 5,
                  border: '1px solid #cbd5e0',
                }}
              />
              <button
                onClick={onCreateDraft}
                disabled={!newDraftName.trim()}
                style={{
                  fontSize: 12, padding: '7px 12px', fontWeight: 600, borderRadius: 5,
                  border: '1px solid #ed8936',
                  background: newDraftName.trim() ? '#ed8936' : '#edf2f7',
                  color: newDraftName.trim() ? '#fff' : '#a0aec0',
                  cursor: newDraftName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                + Draft
              </button>
            </div>
          </div>
        </div>

        {/* ③ Draft-Liste */}
        {drafts.length === 0 ? (
          <EmptyHint text="Noch kein Draft. Lege oben einen an — er bekommt erst eine Boundary, sobald du ihn im Drawer öffnest." />
        ) : (
          drafts.map((d) => {
            const c = DRAFT_COLORS[draftColor(d)];
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 4, marginBottom: 6,
                background: c.bg, border: `1px solid ${c.stroke}`, borderLeft: `4px solid ${c.stroke}`,
              }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    value={d.name}
                    onChange={(e) => onRenameDraft(d.id, e.target.value)}
                    style={{
                      fontSize: 13, fontWeight: 600, color: '#2d3748',
                      border: 'none', background: 'transparent', padding: '2px 0',
                    }}
                  />
                  {/* F7-Diagnose: was ist wirklich gespeichert? */}
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a0aec0' }}>
                    B1 {d.reference && d.reference.length >= 3 ? '✓' : '–'} ·{' '}
                    B2 {d.boundary && d.boundary.length >= 3 ? '✓' : '–'} ·{' '}
                    Netz {d.net_unmasked ? '✓' : '–'}{d.net_masked ? '+M' : ''} ·{' '}
                    {d.updated_at ? d.updated_at.slice(11, 19) : '—'}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: c.text, whiteSpace: 'nowrap' }}>
                  {c.label}
                </span>
                <select
                  value={d.catalog_id ?? ''}
                  onChange={(e) => onBindCatalog(d.id, e.target.value)}
                  title="Katalog binden — schaltet später die POI-Platzhalter im Drawer scharf."
                  style={{
                    fontSize: 11, padding: '4px 6px', borderRadius: 4,
                    border: '1px solid #cbd5e0', background: 'white', color: '#2d3748',
                  }}
                >
                  <option value="">Katalog: keiner</option>
                  {catalogs.map((cat) => (
                    <option key={cat.id} value={cat.id}>Katalog: {cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => onJumpTo('geometry_editor', d.id)}
                  style={{
                    fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                    border: '1px solid #cbd5e0', borderRadius: 4,
                    background: 'white', color: '#2b6cb0', fontWeight: 500,
                  }}
                >
                  Im Drawer öffnen
                </button>
                <button
                  onClick={() => onCommitDraft(d)}
                  disabled={!draftCommittable(d) || commitBusyId === d.id}
                  title={draftCommittable(d)
                    ? 'Committen + versiegeln: Boundary + maskiertes Netz + Representation'
                    : 'Nur rote (maskiert gespeicherte) Drafts sind committbar'}
                  style={{
                    fontSize: 11, padding: '4px 10px', fontWeight: 700,
                    border: `1px solid ${draftCommittable(d) ? '#276749' : '#cbd5e0'}`, borderRadius: 4,
                    background: !draftCommittable(d) ? '#edf2f7' : commitBusyId === d.id ? '#c6f6d5' : '#276749',
                    color: !draftCommittable(d) ? '#a0aec0' : commitBusyId === d.id ? '#22543d' : '#fff',
                    cursor: draftCommittable(d) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {commitBusyId === d.id ? 'Committe …' : '⬛ Commit'}
                </button>
                <button
                  onClick={() => onRemoveDraft(d.id)}
                  title="Draft verwerfen"
                  style={{
                    fontSize: 11, padding: '4px 8px', cursor: 'pointer',
                    border: '1px solid #e2e8f0', borderRadius: 4,
                    background: 'white', color: '#a0aec0',
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
        {commitMsg && (
          <div style={{
            marginTop: 8, fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 4,
            background: commitMsg.ok ? '#f0fff4' : '#fff5f5',
            border: `1px solid ${commitMsg.ok ? '#9ae6b4' : '#feb2b2'}`,
            color: commitMsg.ok ? '#22543d' : '#742a2a',
          }}>
            {commitMsg.ok ? '✓ ' : '✗ '}{commitMsg.text}
            {commitMsg.url && (
              <>{' · '}<a href={commitMsg.url} target="_blank" rel="noreferrer" style={{ color: '#276749' }}>Commit ansehen</a></>
            )}
          </div>
        )}
      </Section>

      {/* Geometrien (committet) — Drafts leben jetzt in der Package-Pipeline (F4/F5) */}
      <Section
        title={`Boundary-Geometrien · Σ ${formatBytes(GEOMETRIES.reduce((s, g) => s + bytesOf(g.raw), 0))}`}
        count={GEOMETRIES.length}
        action={{
          label: '+ neue Geometry',
          onClick: () => onJumpTo('geometry_editor'),
        }}
      >
        {GEOMETRIES.length === 0 ? (
          <EmptyHint text="Noch keine committete Geometry. Drafts entstehen in der Package-Pipeline oben und werden von dort committet." />
        ) : (
          GEOMETRIES.map((g) => (
            <ListItem
              key={g.id}
              icon="🗺"
              primary={g.name}
              badge={g.id}
              secondary={`Polygon mit ${g.polygon.length} Punkten${g.region ? ` · ${g.region}` : ''}${g.drawn_at ? ` · gezeichnet ${g.drawn_at}` : ''} · ${formatBytes(bytesOf(g.raw))}`}
              trailing={<EyeButton shown={assetShown('geometry', g.id)} onClick={() => toggleAsset('geometry', g.id)} />}
              action={{ label: 'Im Editor öffnen', onClick: () => onJumpTo('geometry_editor', g.id) }}
            />
          ))
        )}
      </Section>

      {/* Kataloge */}
      <Section
        title={`Kataloge · Σ ${formatBytes(catalogs.reduce((s, c) => s + c.bytes, 0))}`}
        count={catalogs.length}
        action={{ label: '+ neuer Katalog', onClick: () => { /* Wave 2b */ }, disabled: true }}
      >
        {catalogs.map((c) => {
          // „Roter Brief": Summe der POIs in allen Draft-Posteingängen für diesen Katalog.
          const inbox = drafts.reduce((s, d) => s + (d.poi_inbox?.catalogId === c.id ? (d.poi_inbox?.pois.length ?? 0) : 0), 0);
          return (
            <ListItem
              key={c.id}
              icon="📋"
              primary={c.name}
              badge={c.id}
              secondary={`${c.poi_count} POIs · ${c.cluster_count} Cluster · ${c.warning_count} Warnungen · ${formatBytes(c.bytes)}`}
              trailing={(
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {inbox > 0 && (
                    <button
                      onClick={() => onJumpTo('catalog', c.id)}
                      title={`${inbox} neue(r) POI(s) vom Drawer — im Katalog öffnen & importieren`}
                      style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, border: '1px solid #e53e3e', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}
                    >
                      ✉ {inbox}
                    </button>
                  )}
                  <EyeButton shown={assetShown('catalog', c.id)} onClick={() => toggleAsset('catalog', c.id)} />
                </span>
              )}
              action={{ label: 'Im Katalog öffnen', onClick: () => onJumpTo('catalog', c.id) }}
            />
          );
        })}
      </Section>

      {/* Representations */}
      <Section
        title={`Representations · Σ ${formatBytes(REPRESENTATIONS.reduce((s, r) => s + bytesOf(r), 0))}`}
        count={REPRESENTATIONS.length}
        action={{
          label: '+ neue Representation',
          onClick: () => setShowWizard(true),
          disabled: GEOMETRIES.length === 0,
        }}
      >
        {REPRESENTATIONS.length === 0 ? (
          <EmptyHint text="Noch keine Representations. Der Wizard (Knopf »+ neue Representation«) baut: Geometry + Katalog + Name → Representation. Erst dann werden Thresholds-Settings, Regio-Content und QR-Code für diese Representation aktiv." />
        ) : (
          REPRESENTATIONS.map((r) => (
            <ListItem
              key={r.id}
              icon="◇"
              primary={r.name}
              badge={r.id}
              secondary={`Geometry: ${r.geometry_id}${r.catalog_id ? ` · Katalog: ${r.catalog_id}` : ' · kein Katalog'}${r.wegnetz_id ? ` · Wegnetz: ${r.wegnetz_id}` : ''} · ${formatBytes(bytesOf(r))}`}
              trailing={<EyeButton shown={assetShown('representation', r.id)} onClick={() => toggleAsset('representation', r.id)} />}
            />
          ))
        )}
      </Section>

      {showWizard && <RepresentationWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}

