# Future Roadmap

## Near-Term (MVP Hardening+)

1. strengthen nested import validation and migration tooling
2. add route-level lazy loading/code splitting (bundle reduction)
3. add richer empty/loading states and basic test coverage for core services
4. improve DOCX template formatting and section typography

## V2 Candidate Work

1. real DOCX ingestion parser (replace scaffold adapter)
2. advanced source evidence cards and link tracing to GDD sections
3. richer version diff UX (section-level change visualization)
4. governance rule configuration (custom gates, thresholds)
5. export presets (team-specific report templates)

## V3 / Scale-Up Work

1. backend persistence (projects, versions, audit passes, issue history)
2. authentication and role-based access
3. collaboration features (comments, assignments, activity feed)
4. approval workflow lifecycle with auditable transitions
5. cloud storage and organization-level repositories

## AI Integration Opportunities

1. AI-assisted GDD drafting/refinement from source corpus
2. AI contradiction detection and rewrite proposal generation
3. AI insight narrative summarization beyond deterministic rules
4. AI risk forecasting and issue prioritization suggestions

## Backend/Integration Opportunities

1. API-backed snapshot save/load and import pipelines
2. team/project permission model
3. external benchmark/source connectors
4. async export jobs for heavy report generation

## Recommended Order

1. backend persistence + auth foundation
2. service abstraction for audit/insight hybrid (heuristic + AI)
3. collaboration/governance workflows
4. advanced reporting and integrations
