# Next Sprint TODO (MVP Stabilization + V2 Foundation)

## 1. Testing & Reliability

- [ ] Add unit tests for core domain services:
  - [ ] `auditService`
  - [ ] `insightService`
  - [ ] `issueService`
  - [ ] `snapshotService`
- [ ] Add regression test cases for empty/malformed snapshot imports
- [ ] Add UI smoke tests for core route rendering and main workflow buttons

## 2. Performance

- [ ] Introduce route-level lazy loading/code splitting to reduce initial bundle size
- [ ] Review heavy pages for memoization opportunities after code splitting
- [ ] Validate large text entry performance in Sources and GDD editor on low-end devices

## 3. Source Ingestion Improvements

- [ ] Implement real `.docx` parsing in `sourceParserAdapter`
- [ ] Improve source-to-project scoping migration for old local snapshots

## 4. Governance & Reporting

- [ ] Add clearer pass-comparison metrics (trend view, score deltas over time)
- [ ] Improve DOCX report formatting/templates (headers, tables, section spacing)

## 5. Developer Experience

- [ ] Add lightweight CI steps (lint + typecheck + build)
- [ ] Add script for quick local preflight (`npm run check` already available)
- [ ] Add `LICENSE` file before public distribution

## 6. Backend/AI Readiness

- [ ] Define interfaces for backend persistence adapters
- [ ] Add optional service abstraction layer for AI-assisted audit/insight in future phase

## Notes

- Keep product logic separation intact:
  - Audit = document quality
  - Scorecard = design quality
  - Insight = gap between the two
  - Action = issue generation/follow-up
- Avoid moving heuristic business logic into UI components.
