# Scripts Reference

Quick command reference for Game Design OS.

## Development

- `npm run dev`
  - Starts Vite dev server for local development.

## Quality Checks

- `npm run typecheck`
  - Runs TypeScript project build check (`tsc -b`) without emitting app bundles.

- `npm run lint`
  - Runs ESLint across the repository.

- `npm run check`
  - Runs `typecheck` then `lint` (recommended pre-commit sanity check).

## Build & Preview

- `npm run build`
  - Produces a production build (`tsc -b && vite build`).

- `npm run preview`
  - Serves the production build locally for quick verification.

## Suggested Local Workflow

1. `npm install`
2. `npm run dev`
3. `npm run check`
4. `npm run build`
5. `npm run preview` (optional final smoke test)
