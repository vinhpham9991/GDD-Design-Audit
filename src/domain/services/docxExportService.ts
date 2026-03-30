import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type {
  AuditResult,
  GDDVersion,
  InsightReport,
  IssueItem,
  Project,
  RevisionLogEntry,
  DecisionLogEntry,
  Scorecard,
  ApprovalGate,
  ConfidenceItem,
  EvidenceCoverageItem,
  SourceQualityItem,
  ConflictItem,
} from "@/domain/models";

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function heading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2,
) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function line(text: string) {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 80 } });
}

export async function exportGddDocx(params: {
  project: Project;
  gdd?: GDDVersion;
  audit?: AuditResult;
  insight?: InsightReport;
  issues: IssueItem[];
  filename?: string;
}) {
  const { project, gdd, audit, insight, issues, filename = "GDD_revised.docx" } = params;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "GDD Revised",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          line(`Project: ${project.name}`),
          line(`Genre: ${project.genre ?? "N/A"}`),
          line(`Platform: ${project.platform ?? "N/A"}`),
          line(`Updated: ${new Date().toLocaleString()}`),
          heading("Current Direction Summary"),
          line(insight?.summary ?? audit?.readinessSummary ?? "No insight summary available yet."),
          heading("Open Risks and Assumptions"),
          ...(gdd?.sections
            .filter((section) => section.key === "risks_assumptions" || section.status === "weak" || section.status === "missing")
            .map((section) => line(`${section.title}: ${section.content || "No detail provided."}`)) ??
            [line("No explicit risk section available.")]),
          heading("Main GDD Body"),
          ...(gdd?.sections.flatMap((section) => [heading(section.title), line(section.content || "")]) ?? [
            line("No GDD version selected."),
          ]),
          heading("Issue Summary"),
          ...(issues.length > 0
            ? issues.slice(0, 20).map((issue) =>
                line(`[${issue.priority}] ${issue.title} (${issue.status}) - ${issue.recommendation ?? "No recommendation"}`),
              )
            : [line("No issues found.")]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(filename, blob);
}

export async function exportAuditDocx(params: {
  project: Project;
  gdd?: GDDVersion;
  audit?: AuditResult;
  scorecard?: Scorecard;
  insight?: InsightReport;
  issues: IssueItem[];
  revisions: RevisionLogEntry[];
  decisions: DecisionLogEntry[];
  approvalGates: ApprovalGate[];
  confidenceItems: ConfidenceItem[];
  evidenceCoverageItems: EvidenceCoverageItem[];
  sourceQualityItems: SourceQualityItem[];
  conflictItems: ConflictItem[];
  filename?: string;
}) {
  const {
    project,
    gdd,
    audit,
    scorecard,
    insight,
    issues,
    revisions,
    decisions,
    approvalGates,
    confidenceItems,
    evidenceCoverageItems,
    sourceQualityItems,
    conflictItems,
    filename = "Audit_Report.docx",
  } = params;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Audit Report", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          line(`Project: ${project.name}`),
          line(`Version: ${gdd?.name ?? "N/A"}`),
          heading("Stakeholder Review Summary"),
          line(scorecard ? `Reviewer: ${scorecard.reviewer} | Weighted Score: ${scorecard.weightedTotal}` : "No scorecard available."),
          heading("Pass Comparison Summary"),
          line(insight?.summary ?? "No pass comparison data yet."),
          heading("Executive Audit Summary"),
          line(audit?.readinessSummary ?? "Audit not run for this version."),
          line(`Overall Audit Score: ${audit?.overallScore ?? "N/A"}`),
          heading("Revision Index"),
          ...(revisions.slice(0, 20).map((item) => line(`${item.createdAt}: ${item.changeSummary}`)) || [line("No revisions")]),
          heading("Decision Index"),
          ...(decisions.slice(0, 20).map((item) => line(`${item.createdAt}: ${item.title} - ${item.decision}`)) || [line("No decisions")]),
          heading("Section Health Summary"),
          ...(audit?.findings.flatMap((finding) => [
            line(`${finding.sectionKey}: ${finding.health} (${finding.score})`),
          ]) ?? [line("No section findings")]),
          heading("Rewrite Briefs"),
          ...(audit?.findings
            .filter((finding) => finding.rewriteBrief)
            .map((finding) => line(`${finding.sectionKey}: ${finding.rewriteBrief}`)) ?? [line("No rewrite briefs")]),
          heading("Action Next Steps"),
          ...(issues.slice(0, 20).map((issue) => line(`${issue.title} (${issue.status}) - ${issue.recommendation ?? "No recommendation"}`)) || [line("No issues")]),
          heading("Approval Gates"),
          ...(approvalGates.map((gate) => line(`${gate.gateName}: ${gate.status}`)) || [line("No gates")]),
          heading("Confidence Map Summary"),
          ...(confidenceItems.map((item) => line(`${item.label}: ${item.score} - ${item.reason}`)) || [line("No confidence items")]),
          heading("Evidence Coverage Summary"),
          ...(evidenceCoverageItems.map((item) => line(`${item.sectionKey}: ${item.coverage} - ${item.note}`)) || [line("No coverage items")]),
          heading("Source Quality Summary"),
          ...(sourceQualityItems.map((item) => line(`${item.sourceId}: ${item.qualityScore} - ${item.issues.join("; ") || "No issues"}`)) || [line("No source quality items")]),
          heading("Conflict Summary"),
          ...(conflictItems.map((item) => line(`${item.statementA} vs ${item.statementB}`)) || [line("No conflicts")]),
          heading("Issue Summary"),
          ...(issues.map((issue) => line(`${issue.priority} ${issue.title} (${issue.status})`)) || [line("No issues")]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(filename, blob);
}
