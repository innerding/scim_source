# Deploy-Anleitung

**Push auf `main` deployt automatisch.** Cloudflare Pages baut bei jedem
Push, zieht die `VITE_*`-Variablen aus seiner Environment-Config und schiebt
das Ergebnis auf `scim3.diesenpark.com`. Nach Push ~60 Sekunden auf
Edge-Propagation warten, dann reloaden.

## Bedingung

In Cloudflare → Workers & Pages → `scim3-operator` → Settings → Variables
muessen folgende Vars fuer **Production** gesetzt sein:

  - `VITE_CODE_OPERATOR`
  - `VITE_CODE_ANALYST`
  - `VITE_WORKER_URL`
  - `VITE_UPLOAD_API_KEY`

Werte stehen in `.env.local` (lokal, nicht im Repo). Sind aktuell gesetzt.

## Lokaler Build (Fallback)

Nur bei CI-Ausfall oder wenn etwas getestet werden soll, ohne committen
zu muessen:

```bash
set -a; source .env.local; set +a
npm run build && npx wrangler pages deploy dist --project-name=scim3-operator --branch=main
```

Achtung: nicht im Normalbetrieb mit dem Auto-Build mischen — sonst gewinnt
der juengste Deploy das Race, und die Build-Outputs koennen leicht
divergieren (Node-Version, transitive Deps), was Cache-Inkonsistenzen
beguenstigt.

## GitHub Actions

Auf `workflow_dispatch` (manuell). Wird heute nicht benutzt — CF Pages
Git-Integration uebernimmt.

## Login-Zugangsdaten

| Name | Code | Rolle |
|------|------|-------|
| dietmar       | siehe `.env.local` (`VITE_CODE_OPERATOR`) | operator |
| michael moser | siehe `.env.local` (`VITE_CODE_ANALYST`)  | analyst  |

Operator-Login zusaetzlich per Touch ID (Passkey). Passkey ist
origin-gebunden — auf `*.pages.dev`-Preview-URLs greift er nicht, nur auf
`scim3.diesenpark.com`.

## URLs

- Operator Tool:  https://scim3.diesenpark.com
- Runtime:        https://diesenpark.com
- Worker:         https://scim3-bundle-worker.jkygrbh6md.workers.dev
- Pages-Project:  Cloudflare Dashboard → Workers & Pages → scim3-operator
