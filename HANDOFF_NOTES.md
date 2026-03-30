# Handoff Notes

## What Is Stable

- all routed pages render without startup crash
- source CRUD flow
- GDD version creation/edit/compare flow
- audit run and result rendering
- scorecard save/edit/delete with weighted total
- insight generation and dual radar rendering
- issue CRUD/filter/search and auto-generation
- governance panels with derived summaries
- JSON snapshot import/export
- DOCX export generation
- local persistence restore with sanitization fallback

## What Is Partial / Scaffolded

- DOCX parser adapter exists but throws intentionally (not implemented)
- governance summaries are deterministic derivations (not policy-engine backed)
- heuristics are deterministic and local, not AI or backend services

## Brittle Areas To Handle Carefully

1. shared type changes across models/store/services
2. snapshot schema evolution and backward compatibility
3. large bundle impact from `docx` + chart libs
4. cross-feature assumptions around `activeProjectId` and `currentVersionId`

## Where To Start for New Feature Work

1. define/adjust types in `src/domain/models/*`
2. add/adjust business logic in `src/domain/services/*`
3. expose minimal store actions in `src/store/slices/*`
4. wire UI changes in `src/features/*/pages/*`

## Backend Integration Entry Points

- replace local snapshot persistence with API in `snapshotService.ts`
- introduce server-backed repository in store actions
- keep current service interfaces and swap implementations behind them

## AI Integration Entry Points

- `auditService.ts` (document quality engine)
- `insightService.ts` (gap analysis narratives)
- `issueService.ts` (issue suggestion generation)
- `gddBuilderService.ts` (source-to-section mapping/generation)

## Main Current Risks

- no multi-user concurrency handling
- no auth/permissions
- local-only persistence loss risk (if browser storage cleared)
- deterministic heuristics may produce noisy outputs on edge documents

## Recommended Next Implementation Order

1. add lightweight service tests (audit/insight/issue/snapshot)
2. implement backend persistence + auth
3. introduce AI-assisted optional mode while keeping deterministic fallback
4. add collaboration and review assignment workflows
5. improve export templates and governance customization
