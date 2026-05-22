# Deploy-Anleitung

GitHub Actions ist auf `workflow_dispatch` (manuell) gestellt — kein automatischer Deploy bei Push.

## Warum

Vite backt `VITE_*` Variablen beim Build ein. GitHub Actions hat keinen Zugriff auf die echten Werte → Login funktioniert nicht.

## Lokaler Deploy (Standard)

```bash
VITE_CODE_OPERATOR=OPERATOR \
VITE_CODE_ANALYST=ANALYST \
VITE_WORKER_URL=https://scim3-bundle-worker.jkygrbh6md.workers.dev \
VITE_UPLOAD_API_KEY=eb65a7ec526b222f6baf4c407a8d69ced02e69be \
npm run build && npx wrangler pages deploy dist --project-name=scim3-operator --branch=main
```

## Login-Zugangsdaten

| Name | Code | Rolle |
|------|------|-------|
| dietmar broda | OPERATOR | operator |
| michael moser | ANALYST | analyst |

## URLs

- Operator Tool: https://scim3.diesenpark.com
- Runtime: https://diesenpark.com
- Worker: https://scim3-bundle-worker.jkygrbh6md.workers.dev
