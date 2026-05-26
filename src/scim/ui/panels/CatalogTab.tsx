import { useEffect, useMemo, useState } from 'react';
import { useRole } from '../RoleContext';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import { CONTAINER_SYSTEM, containerOf, geometryOf } from '../../poi-catalog/poiCatalog.containerSystem';
import { ICON_REGISTRY, findIcons, iconById } from '../../poi-catalog/iconRegistry';
import type { IconRegistryEntry } from '../../poi-catalog/iconRegistry';
import { DIGIT_GLYPHS, digitGlyph, glyphsForNumber } from '../../poi-catalog/digitGlyphs';
import { extractElevation, iconMeta } from '../../poi-catalog/decorations';
import type { Geometry } from '../../poi-catalog/poiCatalog.types';
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

// ─── Region-Index (Phase 1: nur Grünberg) ─────────────────────────────────────

interface RegionEntry {
  id: string;
  name: string;
  md: string;
}

const REGIONS: RegionEntry[] = [
  { id: 'gruenberg', name: 'Grünberg', md: gruenbergMd as string },
  { id: 'lichtenberg', name: 'Lichtenberg', md: lichtenbergMd as string },
];

const SUBCATEGORIES_NON_CLUSTER: Subcategory[] = CONTAINER_SYSTEM
  .filter((c) => c.bucket !== 'Cluster')
  .map((c) => c.subcategory);

const STATUS_OPTIONS: CoordStatus[] = ['exact', 'estimated', 'missing'];

// ─── Composite-Renderer: Container + Icon + optionale Decoration (Phase D) ───
// Erzeugt ein einziges SVG-String über verschachtelte <svg>-Elemente, das
// im umgebenden Container der Subkategorie das Icon mittig zeigt — und bei
// Summit-Icons (ann_044) zusätzlich die Höhe als Ziffernreihe darunter.
// Wird per dangerouslySetInnerHTML in einen div eingehängt.

function extractIconInner(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
}

function buildContainerSvgString(geo: Geometry, color: string): string {
  const isStroke = geo.fill_role === 'stroke';
  const fill = isStroke ? 'none' : color;
  const stroke = isStroke ? color : '#000';
  const strokeWidth = isStroke ? 3 : 1;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`;
  const s = geo.shape;
  switch (s.kind) {
    case 'circle':
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${common}/>`;
    case 'rect':
      return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"${s.rx != null ? ` rx="${s.rx}"` : ''} ${common}/>`;
    case 'polygon':
      return `<polygon points="${s.points.map((p) => p.join(',')).join(' ')}" ${common}/>`;
    case 'path':
      return `<path d="${s.d}" ${common}/>`;
  }
}

function buildDigitsSvgString(value: number): string {
  const digits = String(value).split('').map((d) => parseInt(d, 10));
  // Jede Ziffer ist in einem 4×5-viewBox; horizontal aneinanderreihen, ohne Lücke.
  const parts: string[] = [];
  digits.forEach((d, i) => {
    const g = digitGlyph(d);
    if (!g) return;
    const inner = extractIconInner(g.svg_raw);
    parts.push(`<svg x="${i * 4}" y="0" width="4" height="5" viewBox="0 0 4 5">${inner}</svg>`);
  });
  return parts.join('');
}

// Auflösung des Icon-Referenz-Strings aus dem Plan:
//   - Exakter Treffer in der Registry → unverändert verwenden, Meta optional
//   - Trailing "+" (z.B. "Fernglas+") → fallback auf Basis-Icon ("Fernglas"),
//     Elevation-Decoration wird erzwungen (Konvention: "+" = Summit-Variante)
function resolveIcon(name: string): { iconId: string; forceElevation: boolean } {
  if (iconById(name)) return { iconId: name, forceElevation: false };
  if (name.endsWith('+')) {
    const base = name.slice(0, -1);
    if (iconById(base)) return { iconId: base, forceElevation: true };
  }
  return { iconId: name, forceElevation: false };  // nichts gefunden — Composite zeichnet nur Container
}

function buildPoiComposite(
  iconId: string,
  text: string,
  containerColor: string,
  geo: Geometry,
  size: number,
): string {
  const container = buildContainerSvgString(geo, containerColor);
  const { iconId: resolvedId, forceElevation } = resolveIcon(iconId);
  const iconEntry = iconById(resolvedId);
  const iconInner = iconEntry ? extractIconInner(iconEntry.svg_cleaned) : '';

  const meta = iconMeta(resolvedId);
  const showElevation = (forceElevation || meta.decoration_below === 'elevation') && iconEntry;
  const elevation = showElevation ? extractElevation(text) : null;

  if (elevation == null) {
    // Standard-Composite: Container füllt 48×48, Icon liegt darüber.
    // icon_offset_y verschiebt das Icon im Container nach unten (Droplet, Triangle).
    const offsetY = geo.icon_offset_y ?? 0;
    const iconPart = !iconInner
      ? ''
      : offsetY === 0
        ? iconInner
        : `<g transform="translate(0,${offsetY})">${iconInner}</g>`;
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${container}${iconPart}</svg>`;
  }

  // Summit-Composite (Variante B):
  // - Icon bleibt in nativer Größe und nativer Position (kein Scale, kein Shift)
  // - Ziffernreihe sitzt INNERHALB des Containers an dessen unterem Rand,
  //   nicht am Viewport-Rand. summit_digits_y_max gibt die maximale Y-Position
  //   der Reihen-Unterkante pro Geometrie an.
  // - Reihen-Breite richtet sich nach der logischen Icon-Box (24, ann_040).
  //   4-Ziffern-Annahme: jede Ziffer 6×7.5 (Glyph-Aspect 4:5). Bei 3 Ziffern
  //   gleiche Glyph-Größe, Reihe wird schmaler (18), horizontal zentriert.
  const digitCount = String(elevation).length;
  const glyphSize = 6;
  const digitsH   = 7.5;
  const rowW      = digitCount * glyphSize;
  const rowX      = 24 - rowW / 2;
  // Im Summit-Modus: Icon um 6 px nach oben, Ziffernreihe um 4 px nach oben
  // verschoben (gegenüber der Container-Boden-Referenz). Ergibt mehr Luft
  // zwischen Icon und Ziffern bzw. zieht beides aus der Container-Unterkante.
  const summitIconShift = 6;
  const summitDigitsShift = 4;
  const rowYBottom = (geo.summit_digits_y_max ?? 47) - summitDigitsShift;
  const rowY      = rowYBottom - digitsH;
  const iconPart  = `<g transform="translate(0,${-summitIconShift})">${iconInner}</g>`;
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">` +
    container +
    iconPart +
    `<svg x="${rowX}" y="${rowY}" width="${rowW}" height="${digitsH}" viewBox="0 0 ${digitCount * 4} 5">${buildDigitsSvgString(elevation)}</svg>` +
    `</svg>`;
}

function PoiComposite({
  iconId, text, subcategory, size = 32, onClick, title,
}: {
  iconId: string;
  text: string;
  subcategory: Subcategory;
  size?: number;
  onClick?: () => void;
  title?: string;
}) {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  const geo = geometryOf(spec.geometry_id);
  if (!geo) return null;
  const html = buildPoiComposite(iconId, text, spec.color, geo, size);
  return (
    <div
      style={{
        width: size, height: size, display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        verticalAlign: 'middle',
      }}
      onClick={onClick}
      title={title}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Icon-Picker-Modal (Phase C) ──────────────────────────────────────────────

function IconPickerModal({
  currentIcon, subcategory, text, onPick, onClose,
}: {
  currentIcon: string;
  subcategory: Subcategory;
  text: string;
  onPick: (iconId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => findIcons(query), [query]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 6, width: 'min(720px, 90vw)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Icon wählen</div>
          <input
            type="text"
            placeholder="Suche file_name oder drawing_id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              fontSize: 12, padding: '4px 8px', borderRadius: 4,
              border: '1px solid #cbd5e0', flex: 1, maxWidth: 320,
            }}
          />
          <button onClick={onClose} style={btnStyle}>Schließen</button>
        </div>
        <div style={{ padding: '12px 16px', overflow: 'auto', flex: 1 }}>
          <div style={{
            display: 'grid', gap: 10,
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          }}>
            {filtered.map((entry) => {
              const isCurrent = entry.id === currentIcon;
              return (
                <button
                  key={entry.id}
                  onClick={() => { onPick(entry.id); onClose(); }}
                  style={{
                    padding: 6, border: `2px solid ${isCurrent ? '#2b6cb0' : '#e2e8f0'}`,
                    borderRadius: 6, background: isCurrent ? '#ebf8ff' : 'white',
                    cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                  title={`${displayName(entry.file_name)}${entry.drawing_id ? ` · zeichnet "${entry.drawing_id}"` : ''}`}
                >
                  <PoiComposite
                    iconId={entry.id} text={text} subcategory={subcategory} size={40}
                  />
                  <div style={{ fontSize: 10, color: '#2d3748', fontWeight: 600, wordBreak: 'break-word' }}>
                    {displayName(entry.file_name)}
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: '#a0aec0', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
              Keine Treffer.
            </div>
          )}
        </div>
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #e2e8f0',
          fontSize: 11, color: '#718096', fontFamily: 'system-ui, sans-serif',
        }}>
          Vorschau zeigt das Icon im aktuellen Subkategorie-Container „{subcategory}".
          {DIGIT_GLYPHS.length === 10 && extractElevation(text) != null && ' · Höhe automatisch erkannt'}
        </div>
      </div>
    </div>
  );
}

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

function TextEdit({ value, onChange, mono = false, placeholder }: {
  value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
  const [pickerOpen, setPickerOpen] = useState(false);
  // Draw-ID des aktuell zugewiesenen Icons ermitteln (inkl. Plus-Suffix-Resolution).
  const resolvedIcon = resolveIcon(poi.icon);
  const iconEntry = iconById(resolvedIcon.iconId);
  const drawId = iconEntry?.drawing_id ?? null;
  const drawIdLabelStyle: React.CSSProperties = {
    fontSize: 9, color: '#a0aec0', fontFamily: 'monospace',
    marginBottom: 2, lineHeight: 1,
  };
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
        <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
          <div style={drawIdLabelStyle}>{drawId ?? '—'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PoiComposite
              iconId={poi.icon} text={poi.text} subcategory={poi.subcategory} size={28}
              title={poi.icon}
            />
            <span style={{ fontFamily: 'monospace', color: '#2d3748', fontSize: 11 }}>{poi.icon}</span>
          </div>
        </td>
        <td style={cellStyle}>{poi.text}</td>
        <td style={{ ...cellStyle, color: '#4a5568', fontSize: 11 }}>
          {poi.description_short ?? <span style={{ color: '#cbd5e0', fontStyle: 'italic' }}>—</span>}
        </td>
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
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        <div style={drawIdLabelStyle}>{drawId ?? '—'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PoiComposite
            iconId={poi.icon} text={poi.text} subcategory={poi.subcategory} size={28}
            onClick={() => setPickerOpen(true)}
            title="Klicken zum Icon-Wechseln"
          />
          <TextEdit value={poi.icon} onChange={(v) => onPatch({ icon: v })} mono />
        </div>
        {pickerOpen && (
          <IconPickerModal
            currentIcon={poi.icon}
            subcategory={poi.subcategory}
            text={poi.text}
            onPick={(id) => onPatch({ icon: id })}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </td>
      <td style={cellStyle}>
        <TextEdit value={poi.text} onChange={(v) => onPatch({ text: v })} placeholder="lapidar" />
      </td>
      <td style={cellStyle}>
        <TextEdit
          value={poi.description_short ?? ''}
          onChange={(v) => onPatch({ description_short: v.trim() === '' ? undefined : v })}
          placeholder="one sentence only"
        />
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
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Tagline</th>
            <th style={{ padding: '4px 8px', fontWeight: 500, color: '#4a5568' }}>Description short</th>
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

// ─── Icon-Bibliothek (Phase B) ────────────────────────────────────────────────
// Rendert die zur Build-Zeit geladene ICON_REGISTRY. SVG-Vorschau wird per
// dangerouslySetInnerHTML inline eingefügt; Größe wird auf 32×32 normiert,
// indem width/height-Attribute des Root-SVGs entfernt werden (die SVGs haben
// ihre eigene viewBox, die im umgebenden <div> respektiert wird).

function makeResponsive(svg: string): string {
  return svg
    .replace(/(<svg[^>]*?)\s+width="[^"]*"/, '$1')
    .replace(/(<svg[^>]*?)\s+height="[^"]*"/, '$1');
}

// kebab-case lowercase → Title Case Display-Name
// 'aussichtspunkt' → 'Aussichtspunkt'
// 'bogen-parcour'  → 'Bogen Parcour'
// 'seilbahn-up'    → 'Seilbahn Up'
function displayName(fileName: string): string {
  return fileName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function IconPreview({ entry, size = 32 }: { entry: IconRegistryEntry; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, display: 'inline-block' }}
      title={`${displayName(entry.file_name)}${entry.drawing_id ? ` · zeichnet "${entry.drawing_id}"` : ''}`}
      dangerouslySetInnerHTML={{ __html: makeResponsive(entry.svg_cleaned) }}
    />
  );
}

function IconLibrarySection() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => findIcons(query), [query]);

  return (
    <details style={{ marginTop: 32, fontFamily: 'system-ui, sans-serif' }}>
      <summary style={{ fontSize: 13, fontWeight: 600, color: '#1a365d', cursor: 'pointer', marginBottom: 8 }}>
        Icon-Bibliothek ({ICON_REGISTRY.length})
      </summary>
      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="Suche über file_name oder drawing_id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            fontSize: 12, padding: '4px 8px', borderRadius: 4,
            border: '1px solid #cbd5e0', width: 320, marginBottom: 12,
          }}
        />
        <span style={{ fontSize: 11, color: '#718096', marginLeft: 12, fontFamily: 'monospace' }}>
          {filtered.length} / {ICON_REGISTRY.length} Treffer
        </span>
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontSize: 12, color: '#a0aec0', fontStyle: 'italic', padding: '8px 0' }}>
          Keine Icons gefunden — entweder Suche zu eng oder <code style={{ fontFamily: 'monospace' }}>data/icons/</code> ist leer.
        </div>
      ) : (
        <div style={{
          display: 'grid', gap: 12, marginTop: 4,
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}>
          {filtered.map((entry) => {
            const hasWarnings = entry.warnings.length > 0;
            return (
              <div
                key={entry.id}
                style={{
                  border: hasWarnings ? '1px solid #f6e05e' : '1px solid #e2e8f0',
                  borderRadius: 4, padding: '8px 10px',
                  background: hasWarnings ? '#fffbeb' : '#fff',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <IconPreview entry={entry} size={36} />
                <div style={{ fontSize: 11, lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1a365d' }}>{displayName(entry.file_name)}</div>
                  <div style={{ color: '#718096', fontFamily: 'monospace', fontSize: 10 }}>
                    {entry.drawing_id ?? <span style={{ color: '#a0aec0' }}>—</span>}
                    {entry.is_stroke_only && (
                      <span style={{ color: '#a0aec0', marginLeft: 6, fontStyle: 'italic' }}>· strich-only</span>
                    )}
                  </div>
                  {hasWarnings && (
                    <div style={{ color: '#744210', fontSize: 10, marginTop: 4 }}>
                      ⚠ {entry.warnings.join(' · ')}
                    </div>
                  )}
                  {entry.cleaning_changes.length > 0 && (
                    <details style={{ marginTop: 4 }}>
                      <summary style={{ color: '#22543d', fontSize: 10, cursor: 'pointer', listStyle: 'none' }}>
                        🧹 bereinigt: {entry.cleaning_changes.length} ›
                      </summary>
                      <ul style={{
                        margin: '4px 0 0 14px', padding: 0, fontSize: 10,
                        color: '#2f855a', lineHeight: 1.5,
                      }}>
                        {entry.cleaning_changes.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
        Quelle: data/icons/*.svg · zur Build-Zeit geladen · siehe ann_040/041
      </div>
    </details>
  );
}

// ─── Digit-Glyphs Preview (vorbereitend für ann_044 / Phase D) ────────────────

function DigitGlyphsSection() {
  return (
    <details style={{ marginTop: 32, fontFamily: 'system-ui, sans-serif' }}>
      <summary style={{ fontSize: 13, fontWeight: 600, color: '#1a365d', cursor: 'pointer', marginBottom: 8 }}>
        Ziffern-Glyphen ({DIGIT_GLYPHS.length} / 10)
      </summary>
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 12 }}>
        Eigene Strich-Glyphen für Höhenangaben unter Summit-Icons (siehe ann_044).
        Quelle: data/digits/*.svg · viewBox 0 0 4 5 · Stroke 0.75
      </div>
      {/* Einzelne Glyphen */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
        {DIGIT_GLYPHS.map((g) => (
          <div key={g.digit} style={{ textAlign: 'center' }}>
            <div
              style={{ width: 24, height: 30 }}
              title={`${g.digit} · ${g.name}`}
              dangerouslySetInnerHTML={{ __html: makeResponsive(g.svg_raw) }}
            />
            <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 2 }}>
              {g.digit} · {g.name}
            </div>
          </div>
        ))}
      </div>
      {/* Demo: ein paar Beispielzahlen */}
      <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>Beispiel-Höhenangaben:</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        {[1349, 986, 649, 789].map((n) => (
          <div key={n} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              {glyphsForNumber(n).map((g, i) => (
                <div
                  key={i}
                  style={{ width: 16, height: 20 }}
                  dangerouslySetInnerHTML={{ __html: makeResponsive(g.svg_raw) }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 2 }}>
              {n}
            </div>
          </div>
        ))}
      </div>
    </details>
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

// ─── Flow-Info-Modal (Kontext-Hilfe im Katalog) ──────────────────────────────

interface FlowStep {
  n: number;
  title: string;
  status: 'live' | 'planned';
  body: string;
  refs?: string[];
}

const FLOW_STEPS: FlowStep[] = [
  {
    n: 1, title: 'Import ins System', status: 'live',
    body: 'SVG-Dateien landen in data/icons/. Heute manuell, mit Phase E per Drag-Drop im Importer-Tab.',
    refs: ['ann_040', 'ann_041'],
  },
  {
    n: 2, title: 'Validierung + Cleaning', status: 'live',
    body: 'liteValidate warnt vor Spec-Abweichungen, svgCleaner entfernt Phantom-Attribute und Illustrator-Metadaten, setzt Copyright-Stempel.',
    refs: ['ann_040'],
  },
  {
    n: 3, title: 'Kategorisch aufwerten im Katalog', status: 'live',
    body: 'Operator pflegt POIs: weist Subkategorie zu (= Container-Geometrie + Farbe), referenziert Icon per Namen, setzt Cluster und Coord. Icons selbst sind kategorielos — die Bedeutung entsteht erst hier.',
    refs: ['ann_042', 'ann_043'],
  },
  {
    n: 4, title: 'Promotion zur Representation', status: 'planned',
    body: 'Phase 4: kuratierte Plan-POIs werden in die ScimRepresentation übersetzt. Icon-Referenzen bleiben Strings (keine Bildkopie pro POI, nur Verweis auf die Bibliothek).',
    refs: ['ann_034'],
  },
  {
    n: 5, title: 'Package-Pipeline + Auslieferung', status: 'planned',
    body: 'Representation wird als ScimBundle verpackt (Charakter + Atem), per R2/Worker hochgeladen. Die Ziel-App lädt das Bundle und rendert Icons über die mitgelieferte Bibliothek.',
    refs: ['ann_034', 'ann_037'],
  },
];

function FlowInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 6, width: 'min(720px, 90vw)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>
            Icon-Flow im SCIM
          </div>
          <button onClick={onClose} style={btnStyle}>Schließen</button>
        </div>
        <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
          <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 18, lineHeight: 1.5 }}>
            Was passiert mit einem POI-Icon vom Illustrator-Export bis zur Darstellung in der Ziel-App.
            Vollständige Diskussion in der KI-Schnittstelle unter ann_045 (Stand der Pipeline).
          </div>
          {FLOW_STEPS.map((s) => {
            const isLive = s.status === 'live';
            return (
              <div key={s.n} style={{
                display: 'flex', gap: 14, marginBottom: 16,
                paddingBottom: 14, borderBottom: '1px solid #f0f4f8',
              }}>
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  borderRadius: '50%',
                  background: isLive ? '#c6f6d5' : '#e2e8f0',
                  color: isLive ? '#22543d' : '#4a5568',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                }}>
                  {s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a365d' }}>{s.title}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 8px', borderRadius: 10,
                      background: isLive ? '#c6f6d5' : '#edf2f7',
                      color: isLive ? '#22543d' : '#718096',
                      fontFamily: 'monospace',
                    }}>
                      {isLive ? '✓ live' : '⏳ geplant'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>{s.body}</div>
                  {s.refs && (
                    <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 4 }}>
                      → {s.refs.join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{
            marginTop: 4, padding: '10px 12px',
            background: '#ebf8ff', borderLeft: '3px solid #2b6cb0',
            borderRadius: 4, fontSize: 11, color: '#2c5282', lineHeight: 1.5,
          }}>
            <strong>Wichtig:</strong> Icons durchlaufen die Pipeline nicht einzeln — sie sind eine stabile Bibliothek, auf die der Katalog per Namen verweist. Ein Icon-Update wirkt automatisch überall, ohne POI-by-POI-Migration. Bundle bleibt klein (Bibliothek einmal, Referenzen vielfach).
          </div>
          <div style={{
            marginTop: 12, padding: '10px 12px',
            background: '#f0fff4', borderLeft: '3px solid #22543d',
            borderRadius: 4, fontSize: 11, color: '#1c4532', lineHeight: 1.5,
          }}>
            <strong>📖 Neue Region anlegen?</strong>{' '}
            <a
              href="https://github.com/innerding/scim_source/blob/main/docs/howto_region_catalog.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22543d', textDecoration: 'underline' }}
            >
              Howto „Region anlegen am Beispiel Grünberg" öffnen
            </a>{' '}
            — Schritt-für-Schritt-Anleitung mit MVP-Variante und Voll-Playbook.
          </div>
        </div>
      </div>
    </div>
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
  const [showFlowInfo, setShowFlowInfo] = useState(false);

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
          onClick={() => setShowFlowInfo(true)}
          title="Icon-Flow im SCIM (Hilfe)"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '1px solid #cbd5e0', background: 'white',
            color: '#718096', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', padding: 0, lineHeight: 1,
            fontFamily: 'serif', fontStyle: 'italic',
          }}
        >
          i
        </button>

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

      {/* Icon-Bibliothek (klappbar) */}
      <IconLibrarySection />

      {/* Ziffern-Glyphen (klappbar) */}
      <DigitGlyphsSection />

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

      {showFlowInfo && <FlowInfoModal onClose={() => setShowFlowInfo(false)} />}
    </div>
  );
}
