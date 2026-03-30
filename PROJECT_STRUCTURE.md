# Project Structure

## Top Level

- `src/` - application source code
- `public/` - static assets
- `README.md` - repository overview
- `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js` - build/tooling config

## `src/` Layout

- `src/app/`
  - app bootstrap, router, and error boundary
- `src/components/`
  - shared UI and layout building blocks
  - `layout/` app shell components
  - `shared/` primitives (`Button`, `Card`, `Input`, `Modal`, `ToastViewport`, etc.)
  - `charts/` visualization components
  - `forms/` reusable form components
- `src/features/`
  - route-level feature pages grouped by domain:
    - `project-core/`
    - `sources/`
    - `gdd-studio/`
    - `audit-lab/`
    - `scorecard-board/`
    - `insight-center/`
    - `action-tracker/`
    - `governance-history/`
    - `export-import/`
    - `i18n/`
- `src/domain/`
  - non-UI domain logic
  - `models/` shared types and constants
  - `services/` business logic, heuristics, exports/imports, storage utilities
  - `utils/` small helpers
- `src/store/`
  - Zustand store composition and slices
  - modular per-domain slices + seed/persistence integration
- `src/hooks/`
  - reusable custom hooks (`useI18n`, selection sync helper)
- `src/data/`
  - seed/demo data for local initialization
- `src/lib/`
  - small generic helpers (`cn`, deep clone)
- `src/styles/`
  - global styles

## Where To Extend Safely

### UI-only changes

- add/adjust components in `src/components/*`
- keep logic out of chart/presentational components

### Workflow/business rules

- extend `src/domain/services/*`
- keep feature pages thin and orchestration-focused

### Data model changes

- update `src/domain/models/index.ts` and `src/domain/models/constants.ts`
- align corresponding store slice types/actions

### Persistence/import-export

- `src/domain/services/storage.ts`
- `src/domain/services/snapshotService.ts`
- `src/domain/services/docxExportService.ts`

### State additions

- add domain action/state in relevant slice under `src/store/slices`
- update `src/store/types.ts` and merge in `src/store/index.ts`

## Fast Orientation for New Developers

1. start at `src/app/router.tsx` for route map
2. inspect feature page under `src/features/<feature>/pages/*`
3. inspect corresponding domain services under `src/domain/services/*`
4. inspect store slices under `src/store/slices/*`
