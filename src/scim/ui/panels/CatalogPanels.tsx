// Katalog-Panels (BA1 · Phase 4a) — READ-ONLY Browse-Sichten auf die vorhandenen
// Asset-Quellen. Kein neuer Speicher; die Sternbild-Kataloge zeigen nur, was es
// schon gibt. Verwaltung/Vererbung/Bäume kommen in BA2.
//
//   Draco · Geo     → ICON_REGISTRY (data/icons), gruppiert Region/Rep/Inhalt
//   Cepheus · System→ PANEL_GLYPHS (SCIM-/Panel-Icons)
//   Cassiopeia·Typo → Polarstern-Versalien (Stroke-Font)

import { ICON_REGISTRY } from '../../poi-catalog/iconRegistry';
import type { IconRegistryEntry } from '../../poi-catalog/iconRegistry';
import { PANEL_GLYPHS } from '../../../assets/system/panelGlyphs';
import { DEFAULT_FONT, renderText } from '../../typeface';

interface BrowseItem { key: string; svg: string; name: string; meta?: string }
interface BrowseGroup { label: string; items: BrowseItem[] }

function titleCase(s: string): string {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function CatalogBrowse({ badge, title, note, color = '#2d3748', groups }: {
  badge: string; title: string; note?: string; color?: string; groups: BrowseGroup[];
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <div style={{ padding: '20px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        display: 'inline-block', padding: '3px 9px', marginBottom: 12, fontSize: 10,
        fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff',
        border: '1px solid #bee3f8', borderRadius: 4,
      }}>{badge} · read-only · {total}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a365d', marginBottom: note ? 6 : 14 }}>{title}</div>
      {note && <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.55, margin: '0 0 14px' }}>{note}</p>}

      {groups.filter((g) => g.items.length).map((g) => (
        <div key={g.label} style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: '#4a5568', margin: '0 0 8px',
          }}>{g.label} <span style={{ color: '#a0aec0' }}>({g.items.length})</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
            {g.items.map((it) => (
              <div key={it.key} style={{
                border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div className="cat-icon" style={{ width: 40, height: 40, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  dangerouslySetInnerHTML={{ __html: it.svg }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1a365d', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{it.name}</div>
                {it.meta && <div style={{ fontSize: 9.5, color: '#718096', fontFamily: 'monospace' }}>{it.meta}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <style>{`.cat-icon > svg { width: 100%; height: 100%; display: block; }`}</style>
    </div>
  );
}

// ── Draco · Geo-Katalog ──────────────────────────────────────────────────────
export function DracoPanel() {
  const region: BrowseItem[] = [], rep: BrowseItem[] = [], inhalt: BrowseItem[] = [];
  const toItem = (e: IconRegistryEntry, stripPrefix?: string): BrowseItem => ({
    key: e.id,
    svg: e.svg_cleaned,
    name: titleCase(stripPrefix ? e.file_name.replace(stripPrefix, '') : e.file_name),
    meta: e.drawing_id ?? (e.is_stroke_only ? 'strich' : undefined),
  });
  for (const e of ICON_REGISTRY) {
    if (e.file_name.startsWith('reg-')) region.push(toItem(e, 'reg-'));
    else if (e.file_name.startsWith('rep-')) rep.push(toItem(e, 'rep-'));
    else inhalt.push(toItem(e));
  }
  return (
    <CatalogBrowse
      badge="Draco · Geo · data/icons"
      title="Geo-Katalog — Nation → Region → Representation"
      note="Read-only Browse-Sicht auf data/icons. Die echte vererbende Nation→Region→Representation-Baumstruktur kommt in BA2; hier vorerst nach Präfix gruppiert."
      groups={[
        { label: 'Nation / Region (reg-)', items: region },
        { label: 'Representation (rep-)', items: rep },
        { label: 'Inhalt · POI-Icons', items: inhalt },
      ]}
    />
  );
}

// ── Cepheus · System-Katalog ─────────────────────────────────────────────────
export function CepheusPanel() {
  const items: BrowseItem[] = Object.entries(PANEL_GLYPHS).map(([key, svg]) => ({ key, svg, name: key }));
  return (
    <CatalogBrowse
      badge="Cepheus · System · panelGlyphs"
      title="System-Katalog — SCIM-/Panel-Icons"
      note="Read-only: die editor-eigenen System-Glyphen (currentColor-Stroke), inkl. Package-Icons. Künftig data/icons-scim."
      groups={[{ label: 'SCIM-/Panel-Icons', items }]}
    />
  );
}

// ── Cassiopeia · Typo-Bibliothek ─────────────────────────────────────────────
export function CassiopeiaPanel() {
  const items: BrowseItem[] = Object.keys(DEFAULT_FONT.glyphs)
    .filter((k) => DEFAULT_FONT.glyphs[k].d || DEFAULT_FONT.glyphs[k].strokes?.length)
    .map((k) => ({ key: k, name: k === ' ' ? '␣' : k, svg: renderText(DEFAULT_FONT, k, { size: 40, weight: 8 }).svg }));
  return (
    <CatalogBrowse
      badge="Cassiopeia · Typo"
      title={`Typo-Bibliothek — ${DEFAULT_FONT.name}`}
      note="Read-only Vorschau der gespeicherten Schrift (eine Familie: Polarstern-Versalien). Bearbeitet wird sie im Kleinen Bären."
      color="#1a365d"
      groups={[{ label: 'Polarstern · Versalien', items }]}
    />
  );
}
