# Contributing

## Branch Naming

Use short topic branches, for example:

- `feat/source-import-validation`
- `fix/insight-empty-state`
- `docs/handoff-refresh`

## Commit Style

Use conventional-style prefixes where practical:

- `feat:` new behavior
- `fix:` bug fixes
- `refactor:` structural cleanup without behavior change
- `docs:` documentation updates
- `chore:` tooling/config/non-feature maintenance

## Code Organization Rules

- keep domain logic in `src/domain/services/*`
- keep route orchestration in `src/features/*/pages/*`
- keep UI primitives in `src/components/shared/*`
- avoid putting business rules directly in chart or presentational components

## Safe Extension Workflow

1. update types (`src/domain/models/*`)
2. update service logic (`src/domain/services/*`)
3. update store slice/action (`src/store/slices/*` + `src/store/types.ts`)
4. update feature UI
5. run `npm run lint` and `npm run build`

## Pull Request Checklist

- [ ] behavior change is typed and aligned with store model
- [ ] empty/missing data paths are handled safely
- [ ] docs updated if behavior changed
- [ ] lint/build pass locally
