// Representation-Wizard — Wave 2b.
//
// Modal-Komponente, die eine neue Representation als JSON erzeugt.
// 3-Felder-Form: Name, Geometry-Pick (Pflicht), Catalog-Pick (optional).
// Resultat ist ein JSON-Inhalt, den der Operator nach data/representations/
// pasted und committed.

import { useEffect, useMemo, useState } from 'react';
import { GEOMETRIES } from '../../workspace/workspace.registry';
import type { RepresentationFile } from '../../workspace/workspace.types';
import { commitToRepo, type CommitResult } from '../../../runtime/commitBridge';

const CATALOGS = [
  { id: 'gruenberg', name: 'Grünberg' },
  { id: 'lichtenberg', name: 'Lichtenberg' },
];

// Wizard-DRAFT in localStorage: ueberlebt Reloads und Bauunterbrechungen,
// erzeugt aber keinen Commit, bis der Operator den Commit-Knopf drueckt.
// Per Konsens-Entscheidung: Wizard akzeptiert nur committete Geometrien
// (Variante 1 / sequenziell). Geometry-DRAFTs muessen erst ueber den
// Geometry-Editor committed werden, dann sind sie hier auswaehlbar.
const WIZARD_DRAFT_KEY = 'scim3_wizard_draft';

interface WizardDraft {
  name: string;
  geometryId: string;
  catalogId: string;
  note: string;
}

function loadWizardDraft(): WizardDraft {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (raw) return JSON.parse(raw) as WizardDraft;
  } catch { /* ignore */ }
  return { name: '', geometryId: '', catalogId: '', note: '' };
}

function saveWizardDraft(d: WizardDraft): void {
  try { localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

function clearWizardDraft(): void {
  try { localStorage.removeItem(WIZARD_DRAFT_KEY); } catch { /* ignore */ }
}

interface Props {
  onClose: () => void;
}

export default function RepresentationWizard({ onClose }: Props) {
  const initial = useMemo(loadWizardDraft, []);
  const [name, setName] = useState(initial.name);
  const [geometryId, setGeometryId] = useState<string>(initial.geometryId);
  const [catalogId, setCatalogId] = useState<string>(initial.catalogId);
  const [note, setNote] = useState(initial.note);
  const [copied, setCopied] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  // DRAFT-Auto-Save bei jedem Feld-Tipp — ueberlebt Reloads.
  useEffect(() => {
    saveWizardDraft({ name, geometryId, catalogId, note });
  }, [name, geometryId, catalogId, note]);

  // Vorschlag: wenn Geometry gewaehlt + Name leer → uebernehme Geometry-Namen
  const onChangeGeometry = (id: string) => {
    setGeometryId(id);
    if (!name.trim() && id) {
      const g = GEOMETRIES.find((x) => x.id === id);
      if (g) setName(g.name);
    }
  };

  // effectiveGeometryId = geometryId (kein DRAFT-Fall mehr).
  const effectiveGeometryId = geometryId;

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

  const onCommit = async () => {
    if (!json) return;
    setCommitting(true);
    setCommitResult(null);
    const path = `data/representations/${proposedId}.json`;
    const result = await commitToRepo({
      path,
      content: json,
      message: `representation: ${proposedId} via Wizard-Bridge`,
    });
    setCommitResult(result);
    setCommitting(false);
    if (result.ok) clearWizardDraft();
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
                border: '1px solid #cbd5e0', background: 'white',
              }}
            >
              <option value="">— wähle —</option>
              {GEOMETRIES.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 4 }}>
              Nur committete Geometrien wählbar. DRAFTs aus dem Editor erst
              dort „Commit zu main", dann erscheinen sie hier.
            </div>
            {GEOMETRIES.length === 0 && (
              <div style={{ fontSize: 11, color: '#7c2d12', marginTop: 4 }}>
                Keine Geometrien im Repo. Erst eine im Geometry-Editor anlegen
                und committen.
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

        {/* Commit-Result-Banner */}
        {commitResult?.ok && (
          <div style={{
            margin: '0 18px 10px', padding: '8px 12px', fontSize: 11,
            color: '#22543d', background: '#f0fff4',
            border: '1px solid #9ae6b4', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span>✓ Commit auf main:</span>
            <a href={commitResult.commit_url} target="_blank" rel="noreferrer"
               style={{ color: '#2f855a', fontFamily: 'monospace' }}>
              {commitResult.commit_sha.slice(0, 7)}
            </a>
            <span style={{ color: '#718096' }}>· ~60 s bis live.</span>
          </div>
        )}
        {commitResult && !commitResult.ok && (
          <div style={{
            margin: '0 18px 10px', padding: '8px 12px', fontSize: 11,
            color: '#9b2c2c', background: '#fff5f5',
            border: '1px solid #feb2b2', borderRadius: 4,
          }}>
            ✗ Commit fehlgeschlagen ({commitResult.status}): {commitResult.error}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f7fafc',
        }}>
          <div style={{ flex: 1, fontSize: 11, color: '#718096' }}>
            {valid
              ? <>Ziel: <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 2 }}>data/representations/{proposedId}.json</code></>
              : 'Name und Geometry sind Pflicht.'}
          </div>
          <button
            onClick={onCommit}
            disabled={!valid || committing || commitResult?.ok === true}
            style={{
              fontSize: 12, padding: '5px 14px',
              cursor: committing ? 'wait' : ((valid && !commitResult?.ok) ? 'pointer' : 'not-allowed'),
              border: '1px solid #2f855a', borderRadius: 4, fontWeight: 600,
              background: !valid ? '#cbd5e0' : (commitResult?.ok ? '#9ae6b4' : '#2f855a'),
              color: !valid ? '#a0aec0' : (commitResult?.ok ? '#22543d' : 'white'),
              opacity: committing ? 0.7 : 1,
            }}
          >
            {committing ? '… committe' : (commitResult?.ok ? '✓ committed' : 'Commit zu main')}
          </button>
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
            {copied ? '✓ kopiert' : 'In Zwischenablage'}
          </button>
        </div>
      </div>
    </div>
  );
}
