// P11 · Globe-Switcher — die Eintritts-Weiche VOR dem Publishing. Liest, WIE der
// User kommt (QR ↔ diesenpark.com), und entscheidet, ob der Launcher gezeigt oder
// übersprungen wird. Hier: Funktionsdarstellung + Operator-On/Off-Schalter.
// shell-run-Schritt 'globe-switcher' (Edge). Konsens 2026-06-04.
import { useState } from 'react';
import { ShellRunBadge } from '../ShellRunInfo';
import { SHELL_FUNCTIONS } from '../../shell-studio/shellStudio';

// Eine Quelle: die Zugangs-Passphrase des Runtime-Gates (sensus-core-runtime/AccessGate).
// Hier sichtbar gemacht; Knopf + Anzeige lesen denselben Wert.
const ACCESS_KEY = 'geh-deinen-weg';

function Branch({ tone, head, sub, body }: { tone: string; head: string; sub: string; body: string }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${tone}40`, borderLeft: `3px solid ${tone}`, borderRadius: 8, padding: '11px 13px', background: `${tone}08` }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: tone }}>{head}</div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'monospace', margin: '2px 0 6px' }}>{sub}</div>
      <div style={{ fontSize: 11.5, color: '#4a5568', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export default function GlobeSwitcherView() {
  const [active, setActive] = useState(true);
  // Was hängt am Eintritt? Der Globe-Switcher liest die entry-markierten Shell-Studio-Blöcke.
  const entryFeatures = SHELL_FUNCTIONS.filter((f) => f.entry);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#c05621', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 4 }}>
          P11 · Globe-Switcher · Eintritts-Weiche
        </div>
        <ShellRunBadge compact />
      </div>

      <p style={{ fontSize: 12.5, color: '#2d3748', lineHeight: 1.6, margin: '0 0 14px' }}>
        Die <strong>Eintritts-Weiche</strong> an der Request-Grenze, <strong>vor</strong> Sensus Core. Sie liest, WIE der User
        kommt, und entscheidet, ob die <strong>globale Auswahl (Launcher)</strong> gezeigt oder übersprungen wird. Kein
        Engine-Stück, sondern ein Dispatcher.
      </p>

      {/* Eintritt: diesenpark.com schon entriegelt öffnen (Schlüssel in der URL) */}
      <a
        href={`https://diesenpark.com/?k=${ACCESS_KEY}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10,
          padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
          textDecoration: 'none', background: '#3182ce', color: '#fff',
        }}
      >
        ↗ diesenpark.com öffnen <span style={{ fontWeight: 400, opacity: 0.85 }}>(entriegelt)</span>
      </a>

      {/* Passphrase sichtbar + kopierbar — der Schlüssel zum Zugangs-Gate der Runtime */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 12 }}>
        <span style={{ color: '#718096' }}>Passphrase:</span>
        <code style={{ padding: '3px 8px', borderRadius: 6, background: '#fffaf0', border: '1px solid #fbd38d', color: '#9c4221', fontWeight: 700, letterSpacing: 0.3 }}>{ACCESS_KEY}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(ACCESS_KEY)}
          title="Passphrase in die Zwischenablage kopieren"
          style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: '1px solid #cbd5e0', background: '#fff', color: '#4a5568' }}
        >kopieren</button>
        <span style={{ fontSize: 10.5, color: '#a0aec0' }}>oder URL <code style={{ fontFamily: 'monospace' }}>?k={ACCESS_KEY}</code></span>
      </div>

      {/* Eintritts-Merkmale — abgeleitet aus den Shell-Studio-Block-Markierungen (entry), eine Quelle */}
      <div style={{ fontSize: 11, color: '#4a5568', background: '#fff', border: '1px dashed #cbd5e0', borderRadius: 8, padding: '8px 11px', marginBottom: 16, lineHeight: 1.5 }}>
        <strong style={{ color: '#2b6cb0' }}>Eintritts-Merkmale</strong> <span style={{ color: '#a0aec0' }}>(aus den Block-Markierungen)</span>: {entryFeatures.map((f) => f.title).join(' · ')}.
        <br />Darunter der <strong>PWA-Shortcut</strong> (<code>install</code>): die App kann sich am Device installieren (Banner nach dem ersten echten Paketladen). Erscheint am Device, nicht im Studio-Monitor.
      </div>

      {/* On/Off */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: active ? '#f0fff4' : '#f7fafc', border: `1px solid ${active ? '#9ae6b4' : '#e2e8f0'}` }}>
        <button
          onClick={() => setActive((a) => !a)}
          style={{
            position: 'relative', width: 44, height: 24, borderRadius: 999, cursor: 'pointer',
            border: 'none', background: active ? '#38a169' : '#cbd5e0', transition: 'background .15s', flexShrink: 0,
          }}
          aria-pressed={active}
        >
          <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
        </button>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? '#276749' : '#718096' }}>
            Globe-Switcher {active ? 'aktiv' : 'aus'}
          </div>
          <div style={{ fontSize: 11, color: '#718096' }}>
            {active
              ? 'Weiche greift: QR und URL werden unterschiedlich behandelt.'
              : 'Aus — solange Inhalte noch nicht öffentlich dastehen müssen.'}
          </div>
        </div>
      </div>

      {/* Zwei Äste */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, opacity: active ? 1 : 0.5 }}>
        <Branch
          tone="#2b6cb0"
          head="QR-Code"
          sub="…/<rep> (Rep steht fest)"
          body="Launcher überspringen → direkt zur festen Representation. Die globale Auswahl wird nicht gebraucht."
        />
        <Branch
          tone="#805ad5"
          head="diesenpark.com (nackt)"
          sub="keine rep-id"
          body="Launcher zeigen → Region → Representation wählen → Bundle-Auslieferung auslösen."
        />
      </div>

      <div style={{ fontSize: 11, color: '#718096', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 12px', lineHeight: 1.55 }}>
        <strong>Verdrahtung:</strong> Der Schalter ist der Operator-Flag (heute lokaler State). Nächster Schritt — den Zustand
        in die Publishing-Config schreiben, damit die Edge-Dispatch-Logik (Worker/CDN) ihn liest. Danach stempelt Sensus Core P
        die globalen Icons. <strong>Nach</strong> der Weiche folgt erst das Publishing.
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: '#276749', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 6, padding: '9px 12px', lineHeight: 1.55 }}>
        <strong>LIVE (2026-06-04): Öffentlichkeit gesperrt.</strong> diesenpark.com hat ein <strong>Zugangs-Gate</strong>
        (Passphrase ODER <code>?k=…</code>) + noindex. Die Öffentlichkeit ist draußen; wir kommen per Schlüssel rein — das
        Shell-Studio-iframe trägt ihn. Das ist die erste, funktionale Stufe der Allowlist (heute eine Passphrase; später
        je-Adresse / hart via Cloudflare Access).
      </div>
    </div>
  );
}
