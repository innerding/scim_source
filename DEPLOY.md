# Deploy-Anleitung

**Standardweg: lokaler wrangler-Deploy nach jedem Push.**

Cloudflare Pages baut zwar automatisch bei jedem Push auf `main`, aber der
Auto-Build erzeugt aktuell ein Bundle, das im Browser einen white screen
verursacht (Ursache unklar — vermutlich Build-Env-Differenz wie Node-Version
oder transitive Dependency-Resolutions zwischen CF-Runner und lokal). Bis
das geklaert ist, ist der lokale Deploy der zuverlaessige Weg.

## Standard-Flow

Aus `/Users/dietmarbroda/SCIM3ClaudeMax/scim_source`:

```bash
set -a; source .env.local; set +a
npm run build && npx wrangler pages deploy dist --project-name=scim3-operator --branch=main
```

Beides nacheinander: erst `git push` (treibt Git-Historie nach), dann der
wrangler-Deploy (haengt den Production-Build live). Reihenfolge wichtig
gegen Race-Conditions mit dem Auto-Build — der wird nach dem Push trotzdem
laufen, aber unser wrangler-Deploy wird danach ausgefuehrt und ueberholt
ihn.

## Cloudflare Pages Auto-Build (Hintergrund)

Laeuft bei jedem Push, ist aber nicht der live-Pfad. `VITE_*`-Vars sind in
CF Pages → `scim3-operator` → Settings → Variables (Production) hinterlegt
und korrekt — daran liegt es nicht. Build endet auf `success`, alle vier
Files (index.html, JS, CSS, _redirects) landen im Deployment, aber das
ausgelieferte Bundle crasht im Browser. Tiefer-Diagnose vertagt.

## GitHub Actions

Auf `workflow_dispatch` (manuell). Wird heute nicht benutzt. Bleibt als
Notnagel im Repo.

## Login-Zugangsdaten

| Name | Code | Rolle |
|------|------|-------|
| dietmar       | siehe `.env.local` (`VITE_CODE_OPERATOR`) | operator |
| michael moser | siehe `.env.local` (`VITE_CODE_ANALYST`)  | analyst  |

Operator-Login zusaetzlich per Touch ID (Passkey), wenn auf dem Geraet
registriert. Passkey ist origin-gebunden — auf `*.pages.dev`-Preview-URLs
greift er nicht, nur auf `scim3.diesenpark.com`.

## URLs

- Operator Tool:  https://scim3.diesenpark.com
- Runtime:        https://diesenpark.com
- Worker:         https://scim3-bundle-worker.jkygrbh6md.workers.dev
- Pages-Project:  Cloudflare Dashboard → Workers & Pages → scim3-operator
