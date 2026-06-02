# AGENTS.md

## Project overview

**Marka Köprüsü** is a Turkish multi-brand portal: a static HTML/CSS/JS frontend with a minimal Node.js static file server (`server.js`). There are no npm runtime dependencies and no build step.

## Cursor Cloud specific instructions

### Where to run the app

The complete deployable frontend lives in **`Marka-Kopru-YAYIN/`** (portal, Kocaeli, Market, password-reset pages).

The **repo root** is not the same as the portal bundle: root `index.html` is GitHub Pages deployment notes, and root `404.html` is empty. Running `npm start` from the repo root serves those root files, not the portal UI.

For local portal development, start the server from the bundle directory:

```bash
cd Marka-Kopru-YAYIN
npx serve -l 3000 .
```

Alternatively, copy `/workspace/server.js` into `Marka-Kopru-YAYIN/` (documented in `YAYINA-AT-Oku.txt` but missing from this checkout) and run `npm start` there.

### Services

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| Static portal (recommended) | 3000 | `cd Marka-Kopru-YAYIN && npx serve -l 3000 .` | Serves the full portal UI |
| Root Node server | 3000 | `npm start` (repo root) | Serves root files only; not the portal bundle |

Optional `PORT` env var is supported by `server.js` (default `3000`).

### Backend API (external)

Interactive features call same-origin `/api/v1/*` (Kocaeli feed, Market products, password reset, health check). **That API is not in this repo.** Without the separate backend from the parent project, API routes return 404 and Kocaeli shows a static “no API” message on GitHub Pages-style hosting.

### Lint / test / build

This repo has **no** ESLint, Prettier, Jest, or other lint/test scripts in `package.json`. Verification is manual: start the server and load pages in a browser, or use `curl` against `http://localhost:3000/`.

### Node version

Requires **Node.js ≥ 18** (see `engines` in `package.json`). No `npm install` packages beyond the empty lockfile metadata, but `npm install` at repo root is safe and idempotent.
