# Smart Green ENSIT - Frontend

React + TypeScript + Vite client for the Smart Green ENSIT platform.

## Local development

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:3000` and proxies API calls to `http://localhost:8000`.

## Docker (compose)

The root `docker-compose.yml` starts the frontend in dev mode via `frontend/Dockerfile.dev` and exposes:

- UI: `http://localhost`
- API: `http://localhost/api`

The API is routed by Nginx to the backend container.

## Build

```bash
npm run build
```

The production bundle is emitted to `dist/`.
