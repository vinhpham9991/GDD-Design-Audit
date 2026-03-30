# Release Notes

## v0.1.0-mvp (Internal)

### Summary

This release delivers a complete frontend MVP for Game Design OS with end-to-end workflow support and governance/export capabilities.

### Included Modules

- App shell + routing + bilingual navigation
- Project hub and local persisted workspace
- Source ingestion and management
- GDD version studio with compare mode
- Audit lab (deterministic document-quality checks)
- Scorecard board (weighted design-quality scoring)
- Insight center with dual radar + delta summary
- Action tracker with auto-generation from findings
- Governance & history panels
- JSON snapshot import/export
- DOCX exports (`GDD_revised.docx`, `Audit_Report.docx`)

### Notable UX/Platform Improvements

- guide/help modal (EN/VI)
- toast notifications for major actions
- reset/clear controls with confirmation
- hardened localStorage restore and error boundary recovery paths

### Known Limitations

- heuristic engines are local deterministic logic (no AI/backend)
- no auth/collaboration/cloud persistence
- DOCX parser adapter exists, real DOCX ingestion parser is not implemented
- DOCX formatting is practical rather than enterprise layout

### Next Priorities

1. backend persistence + auth layer
2. optional AI-assisted audit/insight rewrite workflows
3. richer governance approvals and multi-review workflows
4. improved export template formatting and artifacts
