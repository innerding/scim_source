# Deploy-Anleitung

GitHub Actions ist auf `workflow_dispatch` (manuell) gestellt — kein automatischer Deploy bei Push.

## Warum

Vite backt `VITE_*` Variablen beim Build ein. GitHub Actions hat keinen Zugriff auf die echten Werte → Login funktioniert nicht.

## Lokaler Deploy (Standard)

Werte liegen in `~/scim_source/.env.local` (nicht im Repo). Build & Deploy:

```bash
set -a; source ../../.env.local; set +a
npm run build && npx wrangler pages deploy dist --project-name=scim3-operator --branch=main
```

Pfad zur `.env.local` ggf. anpassen je nach Working Directory.

## Login-Zugangsdaten

| Name | Code | Rolle |
|------|------|-------|
| dietmar       | siehe `.env.local` (`VITE_CODE_OPERATOR`) | operator |
| michael moser | siehe `.env.local` (`VITE_CODE_ANALYST`)  | analyst  |

Operator-Login zusätzlich per Touch ID (Passkey), wenn auf dem Gerät registriert.

## URLs

- Operator Tool: https://scim3.diesenpark.com
- Runtime: https://diesenpark.com
- Worker: https://scim3-bundle-worker.jkygrbh6md.workers.dev
