// Representation-Wizard — Wave 2b.
//
// Modal-Komponente, die eine neue Representation als JSON erzeugt.
// 3-Felder-Form: Name, Geometry-Pick (Pflicht), Catalog-Pick (optional).
// Resultat ist ein JSON-Inhalt, den der Operator nach data/representations/
// pasted und committed.

import { useMemo, useState } from 'react';
import { GEOMETRIES } from '../../workspace/workspace.registry';
import type { RepresentationFile } from '../../workspace/workspace.types';
import { DRAFT_KEY } from './GeometryEditorPanel';

const CATALOGS = [
  { id: 'gruenberg', name: 'Grünberg' },
  { id: 'lichtenberg', name: 'Lichtenberg' },
];

// Draft aus localStorage (gleiches Schema wie WorkspacePanel).
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

// Slug aus einem Namen, gleich wie GeometryEditor proposedFileName.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Props {
  onClose: () => void;
}

export default function RepresentationWizard({ onClose }: Props) {
  const [name, setName] = useState('');
  const [geometryId, setGeometryId] = useState<string>('');
  const [catalogId, setCatalogId] = useState<string>('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Draft aus dem Editor (localStorage) — selektierbar mit Warnung.
  const draft = useMemo(() => loadGeometryDraft(), []);
  const draftId = draft ? `draft:${slugify(draft.name || 'unbenannt')}` : null;
  const isDraftSelected = !!draftId && geometryId === draftId;

  // Vorschlag: wenn Geometry gewaehlt + Name leer → uebernehme Geometry-Namen
  const onChangeGeometry = (id: string) => {
    setGeometryId(id);
    if (!name.trim() && id) {
      if (id === draftId && draft) {
        setName(draft.name || '');
      } else {
        const g = GEOMETRIES.find((x) => x.id === id);
        if (g) setName(g.name);
      }
    }
  };

  // Effektive geometry_id im JSON: ohne 'draft:'-Praefix (so wuerde die
  // Datei nach dem Commit heissen)
  const effectiveGeometryId = isDraftSelected && draft
    ? slugify(draft.name || 'unbenannt')
    : geometryId;

  // Auto-ID aus dem Namen
  const proposedId = useMemo(() => {
    const slug = (name || 'representation')
      .toLowerCase()
      .replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `rep-${slug}`;
  }, [name]);

  const valid = name.trim().length > 0 && geometryId.length > 0;

  const json = useMemo<string | null>(() => {
    if (!valid) return null;
    const obj: RepresentationFile = {
      schema: 'scim3_representation_v1',
      id: proposedId,
      name: name.trim(),
      geometry_id: effectiveGeometryId,
      catalog_id: catalogId || undefined,
      created_at: new Date().toISOString().slice(0, 10),
      note: note.trim() || undefined,
    };
    return JSON.stringify(obj, null, 2);
  }, [valid, proposedId, name, effectiveGeometryId, catalogId, note]);

  const onCopy = () => {
    if (!json) return;
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 6, width: 'min(640px, 92vw)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Neue Representation</div>
            <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
              Geometry + (optional) Katalog → deployable Bündel
            </div>
          </div>
          <button onClick={onClose} style={{
            fontSize: 11, padding: '4px 12px', cursor: 'pointer',
            border: '1px solid #cbd5e0', background: 'white', borderRadius: 4,
          }}>Schließen</button>
        </div>

        {/* Form */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>Name <span style={{ color: '#c53030' }}>*</span></label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Grünberg-Sommer-2026"
              style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', fontSize: 12, border: '1px solid #cbd5e0', borderRadius: 4 }}
            />
            {name && (
              <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 3 }}>
                Datei wird: data/representations/{proposedId}.json
              </div>
            )}
          </div>

          {/* Geometry-Pick */}
          <div>
            <label style={{ display: 'block', color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>Boundary-Geometry <span style={{ color: '#c53030' }}>*</span></label>
            <select
              value={geometryId} onChange={(e) => onChangeGeometry(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '5px 8px', fontSize: 12, borderRadius: 4,
                border: isDraftSelected ? '1px solid #ed8936' : '1px solid #cbd5e0',
                background: isDraftSelected ? '#fffaf0' : 'white',
              }}
            >
              <option value="">— wähle —</option>
              {draft && draftId && (
                <option value={draftId}>
                  ⚠ {draft.name || 'Unbenannt'} (DRAFT — noch nicht im Repo)
                </option>
              )}
              {GEOMETRIES.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
              ))}
            </select>
            {isDraftSelected && (
              <div style={{
                fontSize: 11, color: '#7c2d12', marginTop: 6,
                background: '#fffaf0', border: '1px solid #ed8936',
                borderRadius: 4, padding: '6px 8px', lineHeight: 1.45,
              }}>
                <strong>Achtung:</strong> Du verwendest eine DRAFT-Geometry. Für ein
                funktionierendes Deploy musst du <em>zwei</em> Dateien committen:<br />
                1) <code>data/geometries/{effectiveGeometryId}.json</code> (Geometry-Export)<br />
                2) <code>data/representations/{proposedId}.json</code> (diese Representation)
              </div>
            )}
            {GEOMETRIES.length === 0 && !draft && (
              <div style={{ fontSize: 11, color: '#7c2d12', marginTop: 4 }}>
                Keine Geometrien im Repo und kein Draft. Erst eine im Geometry-Editor anlegen.
              </div>
            )}
          </div>

          {/* Catalog-Pick */}
          <div>
            <label style={{ display: 'block', color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>Katalog (optional)</label>
            <select
              value={catalogId} onChange={(e) => setCatalogId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', fontSize: 12, border: '1px solid #cbd5e0', borderRadius: 4 }}
            >
              <option value="">— keiner —</option>
              {CATALOGS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label style={{ display: 'block', color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>Notiz (optional)</label>
            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Sommer-Variante mit erweiterten Wegen"
              style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', fontSize: 12, border: '1px solid #cbd5e0', borderRadius: 4 }}
            />
          </div>
        </div>

        {/* JSON-Vorschau */}
        {json && (
          <pre style={{
            margin: '0 18px 12px', padding: '10px 14px',
            background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 4,
            fontSize: 11, fontFamily: 'monospace', color: '#2d3748',
            maxHeight: 180, overflow: 'auto',
          }}>{json}</pre>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f7fafc',
        }}>
          <div style={{ flex: 1, fontSize: 11, color: '#718096' }}>
            {valid
              ? <>Kopiere und committe nach <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 2 }}>data/representations/{proposedId}.json</code></>
              : 'Name und Geometry sind Pflicht.'}
          </div>
          <button
            onClick={onCopy}
            disabled={!valid}
            style={{
              fontSize: 12, padding: '5px 14px',
              cursor: valid ? 'pointer' : 'not-allowed',
              border: '1px solid #2b6cb0', borderRadius: 4, fontWeight: 600,
              background: valid ? (copied ? '#2b6cb0' : 'white') : '#cbd5e0',
              color: valid ? (copied ? 'white' : '#2b6cb0') : '#a0aec0',
            }}
          >
            {copied ? '✓ JSON kopiert' : 'JSON in Zwischenablage'}
          </button>
        </div>
      </div>
    </div>
  );
}
