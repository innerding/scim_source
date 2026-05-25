import { useMemo, useState } from 'react';
import { useRole } from '../RoleContext';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import { CONTAINER_SYSTEM, containerOf } from '../../poi-catalog/poiCatalog.containerSystem';
import type { Bucket, CatalogPoi, Subcategory } from '../../poi-catalog/poiCatalog.types';

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

// ─── Container-Geometrie als kleines SVG-Glyph (Vor-Test der Visuallogik) ─────

function GeometryGlyph({ subcategory, size = 16 }: { subcategory: Subcategory; size?: number }) {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  const stroke = '#1a202c';
  const fill = spec.color;

  switch (spec.geometry) {
    case 'Kreis':
      return <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={size/2 - 1.5} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>;
    case 'Quadrat':
      return <svg width={size} height={size}><rect x={1.5} y={1.5} width={size-3} height={size-3} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>;
    case 'Tropfen':
      return <svg width={size} height={size} viewBox="0 0 16 16"><path d="M8 2 C5 6 3.5 8.5 3.5 9.5 a4.5 4.5 0 0 0 9 0 C12.5 8.5 11 6 8 2 z" fill={fill} stroke={stroke} strokeWidth={1.2}/></svg>;
    case 'Rechteck hoch':
      return <svg width={size} height={size}><rect x={size*0.22} y={1.5} width={size*0.56} height={size-3} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>;
    case 'Rechteck breit':
      return <svg width={size} height={size}><rect x={1.5} y={size*0.28} width={size-3} height={size*0.44} fill={fill} stroke={stroke} strokeWidth={1.5} rx={1}/></svg>;
    case 'Dreieck':
      return <svg width={size} height={size}><polygon points={`${size/2},2 ${size-1.5},${size-1.5} 1.5,${size-1.5}`} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>;
    case 'Hexagon-Ring':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" fill="none" stroke={fill} strokeWidth={2}/>
        </svg>
      );
    default:
      return null;
  }
}

// ─── Status-Glyph ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: 'exact' | 'estimated' | 'missing' }) {
  const map = {
    exact:     { char: '✓', color: '#2f855a' },
    estimated: { char: '≈', color: '#b7791f' },
    missing:   { char: '❓', color: '#c53030' },
  };
  const m = map[status];
  return <span style={{ color: m.color, fontFamily: 'monospace', fontSize: 12 }}>{m.char}</span>;
}

// ─── POI-Tabelle pro Subkategorie ─────────────────────────────────────────────

function SubcategorySection({ subcategory, pois }: { subcategory: Subcategory; pois: CatalogPoi[] }) {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
      }}>
        <GeometryGlyph subcategory={subcategory} size={18} />
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'system-ui, sans-serif', color: '#1a365d' }}>
          {subcategory}
        </span>
        <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>
          · {spec.geometry} · {spec.color_label} · {pois.length}
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
          </tr>
        </thead>
        <tbody>
          {pois.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
              <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#2d3748' }}>{p.icon}</td>
              <td style={{ padding: '4px 8px' }}>{p.text}</td>
              <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#4a5568' }}>
                {p.coord_status === 'missing' ? '—' : `${p.coord[0].toFixed(5)}, ${p.coord[1].toFixed(5)}`}
              </td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>
                {p.cluster ?? '—'}
                {p.is_cluster_identity && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: '#c8389b', fontStyle: 'italic' }}>(Cluster-Icon)</span>
                )}
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                <StatusChip status={p.coord_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cluster-Übersicht ────────────────────────────────────────────────────────

function ClusterSection({ catalog }: { catalog: ReturnType<typeof parsePoiCatalog> }) {
  if (catalog.clusters.length === 0) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a365d', marginBottom: 12 }}>Cluster</h3>
      {catalog.clusters.map((c) => {
        const members = catalog.pois.filter((p) => p.cluster === c.name);
        return (
          <div key={c.name} style={{
            marginBottom: 14, padding: '8px 12px',
            background: '#faf5ff', borderLeft: '3px solid #c8389b', borderRadius: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a365d' }}>{c.name}</span>
              <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>· {c.member_count} POIs</span>
            </div>
            <div style={{ fontSize: 11, color: '#553c9a', fontStyle: 'italic', marginBottom: 6 }}>
              Hover: „{c.hover_text}"
            </div>
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
              <td style={{ padding: '4px 8px' }}><GeometryGlyph subcategory={c.subcategory} size={18} /></td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{c.bucket}</td>
              <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#2d3748' }}>{c.subcategory}</td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{c.geometry}</td>
              <td style={{ padding: '4px 8px', color: '#4a5568' }}>{c.color_label}</td>
              <td style={{ padding: '4px 8px', color: '#718096', fontSize: 11 }}>{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function CatalogTab() {
  const role = useRole();
  if (role !== 'operator') return null;

  const [regionId, setRegionId] = useState<string>(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId)!;

  const catalog = useMemo(
    () => parsePoiCatalog(region.md, {
      region_id: region.id,
      region_name: region.name,
      source_path: `data/${region.id}_pois_plan.md`,
    }),
    [region],
  );

  // POIs pro Subkategorie in Container-System-Reihenfolge
  const sections = useMemo(() => {
    const map = new Map<Subcategory, CatalogPoi[]>();
    for (const p of catalog.pois) {
      const list = map.get(p.subcategory) ?? [];
      list.push(p);
      map.set(p.subcategory, list);
    }
    return CONTAINER_SYSTEM
      .filter((c) => c.bucket !== 'Cluster')
      .map((c) => ({ subcategory: c.subcategory, pois: map.get(c.subcategory) ?? [] }))
      .filter((s) => s.pois.length > 0);
  }, [catalog]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<Bucket, number>();
    for (const p of catalog.pois) {
      counts.set(p.bucket, (counts.get(p.bucket) ?? 0) + 1);
    }
    return counts;
  }, [catalog]);

  const statusCounts = useMemo(() => {
    const counts = { exact: 0, estimated: 0, missing: 0 };
    for (const p of catalog.pois) counts[p.coord_status]++;
    return counts;
  }, [catalog]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Region-Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
        <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>
          {catalog.pois.length} POIs · ✓ {statusCounts.exact} · ≈ {statusCounts.estimated} · ❓ {statusCounts.missing}
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
      {catalog.warnings.length > 0 && (
        <div style={{
          padding: '8px 12px', background: '#fff8dc', border: '1px solid #f6e05e',
          borderRadius: 4, marginBottom: 20, fontSize: 12, color: '#744210',
        }}>
          <strong>Parser-Warnungen:</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {catalog.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Subcategory-Sections */}
      {sections.map((s) => (
        <SubcategorySection key={s.subcategory} subcategory={s.subcategory} pois={s.pois} />
      ))}

      {/* Cluster */}
      <ClusterSection catalog={catalog} />

      {/* Container-System (klappbar) */}
      <ContainerSystemSection />

      <div style={{ marginTop: 24, fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
        Quelle: {catalog.source.path} · geparsed zur Laufzeit · generiert: {catalog.generated_at}
      </div>
    </div>
  );
}
