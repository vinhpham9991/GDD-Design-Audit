# Architecture Overview

## 1) Application Shell and Routing

- React Router drives route-level feature pages.
- `AppLayout` provides shared shell: sidebar, top bar, help modal, toast viewport.
- `ErrorBoundary` wraps the app to prevent white-screen failure and provides recovery actions.

Route map is defined in `src/app/router.tsx`.

## 2) State Management Strategy

- Zustand with modular slices (`project`, `sources`, `gdd`, `audit`, `scorecard`, `insight`, `issues`, `governance`, `ui`).
- Persistence via `zustand/persist` with custom safe storage wrapper.
- Hydration guards sanitize malformed persisted payloads and fallback to seed defaults.

Key files:

- `src/store/index.ts`
- `src/store/types.ts`
- `src/store/slices/*`
- `src/domain/services/storage.ts`

## 3) Domain Model Strategy

- Shared interfaces and constants are centralized in `src/domain/models/*`.
- Feature pages consume typed domain entities from store state.
- Domain services encapsulate non-UI behavior.

## 4) Separation of Concerns

### UI Layer

- route pages: `src/features/*/pages`
- reusable components: `src/components/*`

### Business Logic Layer

- heuristics and workflow logic in `src/domain/services/*`

### Persistence / Serialization Layer

- local storage + state restore hardening in `storage.ts`
- import/export snapshot schema in `snapshotService.ts`
- document export in `docxExportService.ts`

### Export Layer

- JSON snapshot export/import
- DOCX generation for revised GDD and audit report

## 5) Primary Data Flow

`Sources -> GDD -> Audit -> Scorecard -> Insight -> Issues -> Governance -> Export`

- Sources are curated inputs and evidence references.
- GDD versions are generated/edited from sources.
- Audit evaluates documentation quality.
- Scorecard captures reviewer design quality scoring.
- Insight compares audit and scorecard for mismatch detection.
- Issues are generated/managed from weak points and mismatches.
- Governance derives traceability and status summaries.
- Export creates JSON snapshot and DOCX artifacts.

## 6) Key Product Decisions

### Why audit and scorecard are separate

They represent different quality dimensions:

- Audit: how well the document is structured, supported, and coherent.
- Scorecard: how reviewers judge design quality/fit.

### Why insight is derived from both

Gap analysis requires side-by-side interpretation of document quality and design confidence.

### Why snapshot import/export exists

A full app snapshot is the portable MVP source-of-truth for handoff, backup, and migration.

### Why heuristic logic lives in services

All deterministic logic is isolated for future replacement by backend or AI services without rewriting UI.

## 7) AI/Backend Integration Points

Suggested replacement-ready modules:

- `auditService.ts`
- `insightService.ts`
- `issueService.ts`
- `gddBuilderService.ts`
- `sourceParserAdapter.ts` (DOCX parsing)
- `snapshotService.ts` (server persistence pipeline)
