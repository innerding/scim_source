# Deploy-Anleitung

## Quelle der Wahrheit: GitHub Actions

**Push auf `main` deployt automatisch ueber GitHub Actions.** Der Workflow
`.github/workflows/deploy.yml` baut mit Node 24, zieht die `VITE_*`-Variablen
aus den GitHub-Secrets/-Variables und schiebt `dist/` per
`wrangler pages deploy` auf das Pages-Projekt `scim3-operator`
(`scim3.diesenpark.com`). Nach Push ~60 Sekunden auf Edge-Propagation warten,
dann mit Cmd-Shift-R hart reloaden.

## ⚠ Zweiter, kaputter Build-Pfad: CF-Pages-Git-Integration

Im Cloudflare-Dashboard ist am Projekt `scim3-operator` **zusaetzlich** eine
Git-Integration aktiv, die bei jedem Push **selbst** baut. Dieser Build ist
derzeit leise kaputt (crasht → White Screen) und konkurriert mit dem
GitHub-Actions-Deploy auf demselben Pages-Projekt:

> Bei jedem Push laufen beide Builds. Wer zuletzt fertig wird, gewinnt das
> Deployment. Gewinnt der CF-Pages-Git-Build → White Screen, bis man
> 60–90 s wartet und hart reloadet (dann hat meist GH Actions ueberholt).

**Empfehlung: CF-Pages-Git-Integration deaktivieren**, damit GitHub Actions
der einzige Frontend-Deploy ist. Im Dashboard:
`Workers & Pages → scim3-operator → Settings → Builds & deployments →
automatische Git-Deployments trennen/deaktivieren`.

Das beruehrt **nicht** den Worker und damit **nicht** R2/D1/Pakete — die
laufen ueber einen voellig getrennten `wrangler deploy` (siehe unten).

## Bedingung (Secrets/Variables)

Die `VITE_*`-Werte werden **vom GitHub-Actions-Build** injiziert, nicht mehr
aus der CF-Pages-Environment. In GitHub → Repo → Settings → Secrets and
variables → Actions muessen gesetzt sein:

  - `VITE_CODE_OPERATOR` (Variable)
  - `VITE_CODE_ANALYST` (Variable)
  - `VITE_WORKER_URL` (Secret)
  - `VITE_UPLOAD_API_KEY` (Secret)
  - `CLOUDFLARE_API_TOKEN` (Secret)

Werte stehen in `.env.local` (lokal, nicht im Repo). Bei Aenderung von z. B.
`VITE_WORKER_URL` daran denken, das GitHub-Secret nachzuziehen — ein falscher
Wert dort hat schon den falschen Worker-Namen ins Live-Bundle gebracht.

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

## Worker-Deploy (R2 / D1 / Pakete) — getrennt vom Frontend

Der Worker `scim3-package-worker` (Verzeichnis `worker/`) ist ein **eigener**
Deploy und hat mit Pages nichts zu tun. Er bedient `/api/packages/*`
(Upload nach R2-Bucket `diesenpark-packages` + D1 `scim3-packages-db`) und
`/api/commit` (GitHub-Bridge).

```bash
cd worker && npx wrangler deploy
```

Secrets des Workers (einmalig per `wrangler secret put` gesetzt, nie im Repo):
`UPLOAD_API_KEY`, `GITHUB_TOKEN`.

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
- Worker:         https://scim3-package-worker.jkygrbh6md.workers.dev
- Pages-Project:  Cloudflare Dashboard → Workers & Pages → scim3-operator
