import { useEffect, useMemo, useState } from 'react';
import { useRole } from '../RoleContext';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import { CONTAINER_SYSTEM, containerOf, geometryOf } from '../../poi-catalog/poiCatalog.containerSystem';
import {
  addNewPoi, clearEditState, deletePoi, hasEdits, loadEditState,
  mergeEdits, patchPoi, resetPoi, saveEditState, undeletePoi,
} from '../../poi-catalog/poiCatalog.editor';
import { compactDiff, diffLines, serializeCatalogToMd } from '../../poi-catalog/poiCatalog.serializer';
import type {
  Bucket, CatalogPoi, CoordStatus, MergedPoi, PoiCatalogEditState, Subcategory,
} from '../../poi-catalog/poiCatalog.types';

// Vite bundlet die .md als String — keine Netzwerk-Anfrage zur Laufzeit.
// Änderungen in der .md werden mit dem nächsten Build wirksam.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite ?raw-Import liefert string
import gruenbergMd from '../../../../data/grunberg_pois_plan.md?raw';

// ─── Region-Index (Phase 1: nur Grünberg) ─────────────────────────────────────

interface RegionEntry {
  id: string;
  name: string;
  md: string;
}

const REGIONS: RegionEntry[] = [
  { id: 'gruenberg', name: 'Grünberg', md: gruenbergMd as string },
];

const SUBCATEGORIES_NON_CLUSTER: Subcategory[] = CONTAINER_SYSTEM
  .filter((c) => c.bucket !== 'Cluster')
  .map((c) => c.subcategory);

const STATUS_OPTIONS: CoordStatus[] = ['exact', 'estimated', 'missing'];

// ─── Container-Glyph: generischer Renderer für alle Geometrien (ann_042) ─────
// Liest die Form aus GEOMETRIES (diskriminierte Union) und emittiert das
// passende native SVG-Primitive. Eine Funktion ersetzt die alten switch-cases.

function ContainerGlyph({ subcategory, size = 16 }: { subcategory: Subcategory; size?: number }) {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  const geo = geometryOf(spec.geometry_id);
  if (!geo) return null;

  const isStroke = geo.fill_role === 'stroke';
  const fill = isStroke ? 'none' : spec.color;
  const stroke = isStroke ? spec.color : '#000';
  // Stroke-Dicke: Cluster (skaliert) bekommt sichtbarere Linie auch im kleinen Glyph,
  // sonst universell 1 px. Für die Vorschau bei size=16 leicht hochgezogen für Lesbarkeit.
  const strokeWidth = isStroke ? 2 : 1.2;
  const common = { fill, stroke, strokeWidth, strokeLinejoin: 'round' as const };

  const shape = geo.shape;
  let element: JSX.Element | null = null;
  switch (shape.kind) {
    case 'circle':
      element = <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
      break;
    case 'rect':
      element = <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...common} />;
      break;
    case 'polygon':
      element = <polygon points={shape.points.map((p) => p.join(',')).join(' ')} {...common} />;
      break;
    case 'path':
      element = <path d={shape.d} {...common} />;
      break;
  }

  return <svg width={size} height={size} viewBox={geo.viewBox}>{element}</svg>;
}

// ─── Status-Glyph ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: CoordStatus }) {
  const map = {
    exact:     { char: '✓', color: '#2f855a' },
    estimated: { char: '≈', color: '#b7791f' },
    missing:   { char: '❓', color: '#c53030' },
  };
  const m = map[status];
  return <span style={{ color: m.color, fontFamily: 'monospace', fontSize: 12 }}>{m.char}</span>;
}

// ─── Inline-Edit-Inputs ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 12, padding: '2px 4px',
  border: '1px solid #cbd5e0', borderRadius: 3,
  fontFamily: 'system-ui, sans-serif', background: 'white',
};

const inputStyleMono: React.CSSProperties = { ...inputStyle, fontFamily: 'monospace' };

function TextEdit({ value, onChange, mono = false }: {
  value: string; onChange: (v: string) => void; mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={mono ? inputStyleMono : inputStyle}
    />
  );
}

function CoordEdit({ poi, onChange }: {
  poi: MergedPoi;
  onChange: (changes: Partial<Omit<CatalogPoi, 'id'>>) => void;
}) {
  const [lonStr, setLonStr] = useState(String(poi.coord[0]));
  const [latStr, setLatStr] = useState(String(poi.coord[1]));

  useEffect(() => {
    setLonStr(String(poi.coord[0]));
    setLatStr(String(poi.coord[1]));
  }, [poi.coord[0], poi.coord[1]]);

  const commit = (newLon: string, newLat: string) => {
    const lon = parseFloat(newLon);
    const lat = parseFloat(newLat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    onChange({ coord: [lon, lat], coord_status: poi.coord_status === 'missing' ? 'estimated' : poi.coord_status });
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input
        type="text"
        value={lonStr}
        onChange={(e) => setLonStr(e.target.value)}
        onBlur={() => commit(lonStr, latStr)}
        style={{ ...inputStyleMono, width: 80 }}
        placeholder="lon"
      />
      <input
        type="text"
        value={latStr}
        onChange={(e) => setLatStr(e.target.value)}
        onBlur={() => commit(lonStr, latStr)}
        style={{ ...inputStyleMono, width: 80 }}
        placeholder="lat"
      />
    </div>
  );
}

function StatusEdit({ value, onChange }: { value: CoordStatus; onChange: (v: CoordStatus) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as CoordStatus)} style={{ ...inputStyle, width: 70 }}>
      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'exact' ? '✓ exact' : s === 'estimated' ? '≈ est' : '❓ miss'}</option>)}
    </select>
  );
}

function SubcategoryEdit({ value, onChange }: { value: Subcategory; onChange: (v: Subcategory) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Subcategory)} style={{ ...inputStyle, width: 180 }}>
      {SUBCATEGORIES_NON_CLUSTER.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

// ─── POI-Tabelle pro Subkategorie ─────────────────────────────────────────────

interface RowProps {
  poi: MergedPoi;
  editMode: boolean;
  onPatch: (changes: Partial<Omit<CatalogPoi, 'id'>>) => void;
  onDelete: () => void;
  onUndelete: () => void;
  onReset: () => void;
}

function PoiRow({ poi, editMode, onPatch, onDelete, onUndelete, onReset }: RowProps) {
  const borderColor = poi._isDeleted ? '#fc8181'
    : poi._isNew ? '#68d391'
    : poi._isDirty ? '#f6e05e'
    : 'transparent';
  const rowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f0f4f8',
    borderLeft: `3px solid ${borderColor}`,
    textDecoration: poi._isDeleted ? 'line-through' : undefined,
    opacity: poi._isDeleted ? 0.55 : 1,
  };
  const cellStyle: React.CSSProperties = { padding: '4px 8px', verticalAlign: 'middle' };

  if (!editMode) {
    return (
      <tr style={rowStyle}>
        <td style={{ ...cellStyle, fontFamily: 'monospace', color: '#2d3748' }}>{poi.icon}</td>
        <td style={cellStyle}>{poi.text}</td>
        <td style={{ ...cellStyle, fontFamily: 'monospace', color: '#4a5568' }}>
          {poi.coord_status === 'missing' ? '—' : `${poi.coord[0].toFixed(5)}, ${poi.coord[1].toFixed(5)}`}
        </td>
        <td style={{ ...cellStyle, color: '#4a5568' }}>
          {poi.cluster ?? '—'}
          {poi.is_cluster_identity && (
            <span style={{ marginLeft: 6, fontSize: 10, color: '#c8389b', fontStyle: 'italic' }}>(Cluster-Icon)</span>
          )}
        </td>
        <td style={{ ...cellStyle, textAlign: 'center' }}>
          <StatusChip status={poi.coord_status} />
        </td>
      </tr>
    );
  }

  return (
    <tr style={rowStyle}>
      <td style={cellStyle}>
        <TextEdit value={poi.icon} onChange={(v) => onPatch({ icon: v })} mono />
      </td>
      <td style={cellStyle}>
        <TextEdit value={poi.text} onChange={(v) => onPatch({ text: v })} />
      </td>
      <td style={cellStyle}>
        <CoordEdit poi={poi} onChange={onPatch} />
      </td>
      <td style={cellStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TextEdit
            value={poi.cluster ?? ''}
            onChange={(v) => onPatch({ cluster: v.trim() === '' ? undefined : v })}
          />
          <label title="Cluster-Icon" style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: '#c8389b' }}>
            <input
              type="checkbox"
              checked={!!poi.is_cluster_identity}
              onChange={(e) => onPatch({ is_cluster_identity: e.target.checked || undefined })}
              style={{ marginRight: 2 }}
            />
            ID
          </label>
        </div>
      </td>
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        <StatusEdit value={poi.coord_status} onChange={(v) => onPatch({ coord_status: v })} />
      </td>
      <td style={cellStyle}>
        <SubcategoryEdit value={poi.subcategory} onChange={(v) => onPatch({ subcategory: v })} />
      </td>
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        {poi._isDeleted ? (
          <button onClick={onUndelete} style={btnStyleSmall} title="Wiederherstellen">↺</button>
        ) : (
          <>
            <button onClick={onDelete} style={{ ...btnStyleSmall, color: '#c53030' }} title="POI löschen">×</button>
            {(poi._isDirty || poi._isNew) && (
              <button onClick={onReset} style={{ ...btnStyleSmall, marginLeft: 4 }} title="Änderungen verwerfen">↶</button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

const btnStyleSmall: React.CSSProperties = {
  fontSize: 14, padding: '2px 6px', cursor: 'pointer',
  border: '1px solid #cbd5e0', background: 'white', borderRadius: 3,
  lineHeight: 1, color: '#4a5568',
};

const btnStyle: React.CSSProperties = {
  fontSize: 12, padding: '4px 10px', cursor: 'pointer',
  border: '1px solid #cbd5e0', background: 'white', borderRadius: 4,
  color: '#2d3748', fontFamily: 'system-ui, sans-serif',
};

function SubcategorySection({
  subcategory, pois, editMode, onPatchPoi, onDeletePoi, onUndeletePoi, onResetPoi, onAddPoi,
}: {
  subcategory: Subcategory;
  pois: MergedPoi[];
  editMode: boolean;
  onPatchPoi: (id: string, changes: Partial<Omit<CatalogPoi, 'id'>>) => void;
  onDeletePoi: (id: string) => void;
  onUndeletePoi: (id: string) => void;
  onResetPoi: (id: string) => void;
  onAddPoi: (sub: Subcategory) => void;
}) {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
      }}>
        <ContainerGlyph subcategory={subcategory} size={18} />
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'system-ui, sans-serif', color: '#1a365d' }}>
          {subcategory}
        </span>
        <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>
          · {geometryOf(spec.geometry_id)?.name_display ?? spec.geometry_id} · {spec.color_label} · {pois.filter((p) => !p._isDeleted).length}
        </span>
      </div>
      <table style={{ width: '100%', fontSize: 12, fontFamily: 'system-ui, sans-serif', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Icon</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Text</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Coord (lon, lat)</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Cluster</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568', width: 30 }}></th>
            {editMode && <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Subkat.</th>}
            {editMode && <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}></th>}
          </tr>
        </thead>
        <tbody>
          {pois.map((p) => (
            <PoiRow
              key={p.id}
              poi={p}
              editMode={editMode}
              onPatch={(c) => onPatchPoi(p.id, c)}
              onDelete={() => onDeletePoi(p.id)}
              onUndelete={() => onUndeletePoi(p.id)}
              onReset={() => onResetPoi(p.id)}
            />
          ))}
        </tbody>
      </table>
      {editMode && (
        <button onClick={() => onAddPoi(subcategory)} style={{ ...btnStyle, marginTop: 6, fontSize: 11 }}>
          + POI hinzufügen
        </button>
      )}
    </div>
  );
}

// ─── Cluster-Übersicht ────────────────────────────────────────────────────────

function ClusterSection({ catalog }: { catalog: ReturnType<typeof mergeEdits> }) {
  if (catalog.clusters.length === 0) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a365d', marginBottom: 12 }}>Cluster</h3>
      {catalog.clusters.map((c) => {
        const members = catalog.pois.filter((p) => !p._isDeleted && p.cluster === c.name);
        if (members.length === 0) return null;
        return (
          <div key={c.name} style={{
            marginBottom: 14, padding: '8px 12px',
            background: '#faf5ff', borderLeft: '3px solid #c8389b', borderRadius: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a365d' }}>{c.name}</span>
              <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>· {members.length} POIs</span>
            </div>
            {c.hover_text && (
              <div style={{ fontSize: 11, color: '#553c9a', fontStyle: 'italic', marginBottom: 6 }}>
                Hover: „{c.hover_text}"
              </div>
            )}
            <div style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.6 }}>
              {members.map((p) => p.text).join(' · ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Container-System-Übersicht ───────────────────────────────────────────────

function ContainerSystemSection() {
  return (
    <details style={{ marginTop: 32, fontFamily: 'system-ui, sans-serif' }}>
      <summary style={{ fontSize: 13, fontWeight: 600, color: '#1a365d', cursor: 'pointer', marginBottom: 8 }}>
        Container-System (Geometrie · Farbe pro Subkategorie)
      </summary>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}></th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Bucket</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Subkategorie</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Geometrie</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Farbe</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          {CONTAINER_SYSTEM.map((c) => (
            <tr key={c.subcategory} style={{ borderBottom: '1px solid #f0f4f8' }}>
              <td style={{ padding: '4px 8px' }}><ContainerGlyph subcategory={c.subcategory} size={18} /></td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{c.bucket}</td>
              <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#2d3748' }}>{c.subcategory}</td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{geometryOf(c.geometry_id)?.name_display ?? c.geometry_id}</td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{c.color_label}</td>
              <td style={{ padding: '4px 8px', color: '#718096', fontSize: 11 }}>{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// ─── Diff-/Export-Modal ──────────────────────────────────────────────────────

function ExportModal({ originalMd, newMd, fileName, onClose }: {
  originalMd: string; newMd: string; fileName: string; onClose: () => void;
}) {
  const diff = useMemo(() => compactDiff(diffLines(originalMd, newMd), 3), [originalMd, newMd]);
  const isUnchanged = diff.length === 0;

  const download = () => {
    const blob = new Blob([newMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 6, width: 'min(900px, 90vw)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>
            Plan-Export: <code style={{ fontFamily: 'monospace' }}>{fileName}</code>
          </div>
          <button onClick={onClose} style={btnStyle}>Schließen</button>
        </div>
        <div style={{ padding: '12px 16px', overflow: 'auto', flex: 1, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5 }}>
          {isUnchanged ? (
            <div style={{ color: '#718096', fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
              Keine Änderungen — exportierte Datei wäre identisch mit der aktuellen.
            </div>
          ) : (
            diff.map((line, i) => {
              const bg = line.kind === 'add' ? '#d4edda' : line.kind === 'del' ? '#f8d7da' : 'transparent';
              const color = line.kind === 'add' ? '#155724' : line.kind === 'del' ? '#721c24' : '#4a5568';
              const prefix = line.kind === 'add' ? '+ ' : line.kind === 'del' ? '- ' : '  ';
              return (
                <div key={i} style={{ background: bg, color, padding: '0 6px', whiteSpace: 'pre-wrap' }}>
                  {prefix}{line.text}
                </div>
              );
            })
          )}
        </div>
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#718096', fontFamily: 'system-ui, sans-serif' }}>
            Lege die Datei nach Download in <code style={{ fontFamily: 'monospace' }}>data/</code> und commite.
          </div>
          <button
            onClick={download}
            disabled={isUnchanged}
            style={{
              ...btnStyle,
              background: isUnchanged ? '#edf2f7' : '#2b6cb0',
              color: isUnchanged ? '#a0aec0' : 'white',
              borderColor: isUnchanged ? '#cbd5e0' : '#2b6cb0',
              cursor: isUnchanged ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            ⬇ Plan-md herunterladen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function CatalogTab() {
  const role = useRole();
  if (role !== 'operator') return null;

  const [regionId, setRegionId] = useState<string>(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId)!;

  const baseCatalog = useMemo(
    () => parsePoiCatalog(region.md, {
      region_id: region.id,
      region_name: region.name,
      source_path: `data/${region.id}_pois_plan.md`,
    }),
    [region],
  );

  const [editState, setEditState] = useState<PoiCatalogEditState>(() => loadEditState(region.id));
  const [editMode, setEditMode] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Region-Wechsel: passenden Edit-State laden
  useEffect(() => {
    setEditState(loadEditState(region.id));
    setEditMode(false);
  }, [region.id]);

  // Auto-save bei jeder State-Änderung (nur wenn Edits vorhanden, sonst Storage leerräumen)
  useEffect(() => {
    if (hasEdits(editState)) saveEditState(editState);
    else clearEditState(region.id);
  }, [editState, region.id]);

  const merged = useMemo(() => mergeEdits(baseCatalog, editState), [baseCatalog, editState]);

  // POIs pro Subkategorie in Container-System-Reihenfolge
  const sections = useMemo(() => {
    const map = new Map<Subcategory, MergedPoi[]>();
    for (const p of merged.pois) {
      const list = map.get(p.subcategory) ?? [];
      list.push(p);
      map.set(p.subcategory, list);
    }
    return CONTAINER_SYSTEM
      .filter((c) => c.bucket !== 'Cluster')
      .map((c) => ({ subcategory: c.subcategory, pois: map.get(c.subcategory) ?? [] }))
      .filter((s) => s.pois.length > 0 || editMode);
  }, [merged, editMode]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<Bucket, number>();
    for (const p of merged.pois) {
      if (p._isDeleted) continue;
      counts.set(p.bucket, (counts.get(p.bucket) ?? 0) + 1);
    }
    return counts;
  }, [merged]);

  const statusCounts = useMemo(() => {
    const counts = { exact: 0, estimated: 0, missing: 0 };
    for (const p of merged.pois) {
      if (p._isDeleted) continue;
      counts[p.coord_status]++;
    }
    return counts;
  }, [merged]);

  // ─── Handler ────────────────────────────────────────────────────────────────

  const handlePatch = (id: string, changes: Partial<Omit<CatalogPoi, 'id'>>) =>
    setEditState((s) => patchPoi(s, id, changes));
  const handleDelete = (id: string) => setEditState((s) => deletePoi(s, id));
  const handleUndelete = (id: string) => setEditState((s) => undeletePoi(s, id));
  const handleReset = (id: string) => setEditState((s) => resetPoi(s, id));

  const handleAdd = (sub: Subcategory) => {
    const spec = containerOf(sub);
    if (!spec) return;
    const template: Omit<CatalogPoi, 'id'> = {
      bucket: spec.bucket,
      subcategory: sub,
      icon: '',
      text: 'Neuer POI',
      coord: [0, 0],
      coord_status: 'missing',
    };
    setEditState((s) => addNewPoi(s, template).state);
  };

  const handleResetAll = () => {
    if (!confirm('Alle Editor-Änderungen verwerfen?')) return;
    setEditState({ ...editState, patches: {}, next_new_id: 1 });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const fileName = `${region.id}_pois_plan.md`;
  const newMd = useMemo(
    () => (showExport ? serializeCatalogToMd(region.md, merged) : ''),
    [showExport, region.md, merged],
  );

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Top-Bar: Region + Modus + Aktionen */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: 12, color: '#4a5568' }}>Region:</label>
        <select
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          style={{ fontSize: 13, padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e0' }}
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <button
          onClick={() => setEditMode((m) => !m)}
          style={{
            ...btnStyle,
            background: editMode ? '#2b6cb0' : 'white',
            color: editMode ? 'white' : '#2d3748',
            borderColor: editMode ? '#2b6cb0' : '#cbd5e0',
            fontWeight: 600,
          }}
        >
          {editMode ? '✓ Bearbeiten an' : '✎ Bearbeiten'}
        </button>

        {(merged.dirty_count + merged.new_count + merged.deleted_count > 0) && (
          <>
            <span style={{ fontSize: 11, color: '#4a5568', fontFamily: 'monospace' }}>
              {merged.new_count > 0 && <span style={{ color: '#2f855a' }}>+{merged.new_count} neu </span>}
              {merged.dirty_count > 0 && <span style={{ color: '#b7791f' }}>~{merged.dirty_count} geändert </span>}
              {merged.deleted_count > 0 && <span style={{ color: '#c53030' }}>−{merged.deleted_count} gelöscht</span>}
            </span>
            <button onClick={handleResetAll} style={btnStyle}>↺ Alle zurücksetzen</button>
            <button
              onClick={() => setShowExport(true)}
              style={{ ...btnStyle, background: '#2f855a', color: 'white', borderColor: '#2f855a', fontWeight: 600 }}
            >
              ⬇ Plan exportieren
            </button>
          </>
        )}

        <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace', marginLeft: 'auto' }}>
          {merged.pois.filter((p) => !p._isDeleted).length} POIs · ✓ {statusCounts.exact} · ≈ {statusCounts.estimated} · ❓ {statusCounts.missing}
        </span>
      </div>

      {/* Bucket-Zähler */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, fontSize: 11, color: '#4a5568',
      }}>
        {Array.from(bucketCounts.entries()).map(([b, n]) => (
          <span key={b} style={{
            padding: '2px 8px', background: '#edf2f7', borderRadius: 3, fontFamily: 'monospace',
          }}>
            {b}: {n}
          </span>
        ))}
      </div>

      {/* Warnings */}
      {baseCatalog.warnings.length > 0 && (
        <div style={{
          padding: '8px 12px', background: '#fff8dc', border: '1px solid #f6e05e',
          borderRadius: 4, marginBottom: 20, fontSize: 12, color: '#744210',
        }}>
          <strong>Parser-Warnungen:</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {baseCatalog.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Subcategory-Sections */}
      {sections.map((s) => (
        <SubcategorySection
          key={s.subcategory}
          subcategory={s.subcategory}
          pois={s.pois}
          editMode={editMode}
          onPatchPoi={handlePatch}
          onDeletePoi={handleDelete}
          onUndeletePoi={handleUndelete}
          onResetPoi={handleReset}
          onAddPoi={handleAdd}
        />
      ))}

      {/* Cluster */}
      <ClusterSection catalog={merged} />

      {/* Container-System (klappbar) */}
      <ContainerSystemSection />

      <div style={{ marginTop: 24, fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
        Quelle: {baseCatalog.source.path} · geparsed zur Laufzeit · generiert: {baseCatalog.generated_at}
        {hasEdits(editState) && (
          <> · <span style={{ color: '#b7791f' }}>Editor-State in localStorage ({editState.updated_at.slice(0, 19)})</span></>
        )}
      </div>

      {showExport && (
        <ExportModal
          originalMd={region.md}
          newMd={newMd}
          fileName={fileName}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
