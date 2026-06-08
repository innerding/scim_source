// Pathworks (Hub) — die Drehscheibe der Representations.
//
// GRUNDSATZ: Der OPERATOR produziert keine Representation. Will jemand eine Rep
// von 0 auf bauen, tut er das in der EDITOR-Rolle. Darum handelt dieses Panel je
// Rolle nur das Passende:
//   • Editor  → EditorRepsHome   („meine Reps" produzieren/senden)
//   • Operator/Analyst → OperatorRepsHome (Einreichungen + committete Reps)
//
// Das frühere Bau-Werkzeug (Package-Pipeline, Draft anlegen, Geometry/Katalog/
// Representation-Wizard) ist bewusst entfernt — Produktion lebt im Editor-Home.

import { useState } from 'react';
import { useRole, useModeSwitch, isEditorRole } from '../RoleContext';
import EditorRepsHome from './EditorRepsHome';
import OperatorRepsHome from './OperatorRepsHome';
import { PathworksHubFloating, PathworksInfoClipboard } from '../PathworksHubInfo';

interface Props {
  onJumpTo: (panelId: string, geometryId?: string) => void;
  activeTab?: string;
}

export default function WorkspacePanel({ onJumpTo }: Props) {
  const [showClip, setShowClip] = useState(false);   // schwebendes Arbeitsblatt (Notizen)
  const [showInfo, setShowInfo] = useState(false);   // schwebendes Infoblatt-Klemmbrett
  const role = useRole();
  const mode = useModeSwitch();
  // Editor-Sicht (Footer-Diode): das schmale „meine Reps"-Home. Operator/Analyst:
  // die Kurations-Sicht (Einreichungen + committete Reps).
  const editorView = isEditorRole(mode?.activeMode ?? role);
  if (editorView) return <EditorRepsHome onJumpTo={onJumpTo} />;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760 }}>
      {/* Intro */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 6, padding: '14px 18px', marginBottom: 22, color: '#fff',
        display: 'flex', gap: 18, alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, opacity: 0.65, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Representations-Drehscheibe
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 2 }}>
            Pathworks (Hub)
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
            Hier prüft und committet der Operator eingereichte Representations und sieht die committeten.
            Produziert (Boundary · Wegnetz · Katalog · Farbe) wird in der Editor-Rolle.
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

      <OperatorRepsHome onJumpTo={onJumpTo} />
    </div>
  );
}
