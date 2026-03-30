# Game Design OS

Game Design OS is a frontend MVP for structured game design workflows. It helps teams organize source evidence, build/version GDD content, assess quality, compare design confidence, generate issues, and export shareable artifacts.

## Project Summary

This app is designed for game designers, producers, and cross-functional reviewers who need one place to:

- collect and curate source inputs
- produce and iterate GDD versions
- run document-quality checks
- score design quality manually
- compare the two viewpoints and act on gaps
- maintain governance traces and export outputs

## Core Product Logic

- **Audit = document quality** (structure, detail, contradictions, unsupported claims)
- **Scorecard = design quality** (manual weighted reviewer scoring)
- **Insight = gap between audit and scorecard** (alignment/misalignment signals)
- **Action = issue generation and follow-up** (manual + auto-generated issues)

## Current MVP Features

### Workspace & Navigation

- dashboard shell with summary cards and next-action cues
- project hub for quick project creation
- modular routed pages for each workflow area

### Source Ingestion Hub

- add source from pasted text
- add source from markdown/text file (`.md`, `.txt`)
- add source from DOCX (`.docx`) with client-side parsing
- add source URL
- edit/delete source
- source type, reliability, and tags
- source list + source detail panel
- upload status, accepted file type hints, and parsed text preview before save

### GDD Studio

- create starter GDD from sources (deterministic mapping)
- create/clone GDD versions
- section list + section editor
- compare selected version with previous version
- visual section health/status

### Audit Lab

- run deterministic audit per GDD version
- section health (`strong|medium|weak|missing`)
- section scores + overall score
- unsupported claim heuristics
- contradiction heuristics
- rewrite briefs for weak/missing areas

### Scorecard Board

- weighted category scoring form
- reviewer + comments
- save/edit/delete scorecards per version

### Insight Center

- generate insight from audit + scorecard
- dual radar chart (overlay/split)
- category deltas
- generated strengths/gaps/recommendations summary

### Action Tracker

- create/edit/delete issues
- filter by status/priority
- search
- auto-generate issues from weak sections, contradictions, and large deltas

### Governance & History

- revision log
- decision log (manual entries)
- pass history (audit/scorecard/insight/issues)
- pass comparison summary scaffold
- derived approval gates
- derived confidence/evidence/source-quality/conflict summaries

### Import/Export

- export full snapshot as JSON
- import snapshot JSON with schema validation
- DOCX exports:
  - `GDD_revised.docx`
  - `Audit_Report.docx`

### UX & Stability

- bilingual UI (`EN`/`VI`) with persisted language preference
- help/guide modal
- global toast notifications
- reset-to-seed and clear-all with confirmation
- error boundary with recovery options
- localStorage hydration guards for malformed state

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- React Hook Form
- Zod
- Recharts
- docx
- mammoth

## Project Structure

See: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

## Setup

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Usage Flow

1. Create/select a project in **Project Hub**
2. Add and curate source evidence in **Sources**
3. Build/edit a version in **GDD Studio**
4. Run **Audit Lab** for document quality
5. Fill **Scorecard Board** for design quality
6. Generate **Insight Center** report and review deltas
7. Create/auto-generate and track tasks in **Action Tracker**
8. Review governance traces in **Governance**
9. Export JSON/DOCX artifacts in **Settings**

## MVP Limitations

- audit, insight, and issue generation are deterministic heuristics (not AI-powered yet)
- persistence is browser-local (`localStorage`), not cloud-synced
- no authentication, roles, or multi-user collaboration
- DOCX export content is functional but not enterprise-formatted
- DOCX parsing is plain-text extraction and does not preserve advanced formatting (tables/styles)
- no backend API integration in current MVP

## Extension Points

Primary replacement points for backend/AI integration:

- `src/domain/services/auditService.ts`
- `src/domain/services/insightService.ts`
- `src/domain/services/issueService.ts`
- `src/domain/services/gddBuilderService.ts`
- `src/domain/services/sourceParserAdapter.ts` + `src/domain/services/docxParser.ts` (DOCX parsing pipeline)
- `src/domain/services/snapshotService.ts` (server persistence migration)

## License

No license file is included yet. Add one (for example MIT/Apache-2.0) before public distribution.

## Status

This repository is a **frontend MVP** intended for internal iteration and handoff, not a production SaaS release.
