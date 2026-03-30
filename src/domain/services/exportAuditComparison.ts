import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import type { AuditResult, GDDVersion, Project } from "@/domain/models";
import type { AuditComparisonExport } from "@/domain/services/buildAuditComparison";
import { buildAuditComparisonExport } from "@/domain/services/buildAuditComparison";
import { saveBlob } from "@/domain/services/exportHelpers";

export function createAuditComparisonExport(params: {
  project: Project;
  previousAudit: AuditResult;
  previousVersion?: GDDVersion;
  currentAudit: AuditResult;
  currentVersion?: GDDVersion;
}): AuditComparisonExport {
  return buildAuditComparisonExport(params);
}

export async function exportAuditComparisonDocx(params: {
  comparison: AuditComparisonExport;
  filename: string;
}) {
  const { comparison, filename } = params;
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Audit Comparison Report", heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Project: ${comparison.project.name}` }),
          new Paragraph({
            text: `Current: ${comparison.currentAudit.versionName ?? comparison.currentAudit.versionId} | Score ${comparison.currentAudit.score}`,
          }),
          new Paragraph({
            text: `Previous: ${comparison.previousAudit.versionName ?? comparison.previousAudit.versionId} | Score ${comparison.previousAudit.score}`,
          }),
          new Paragraph({ text: "Overall Score Delta", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Delta: ${comparison.overallDelta.delta >= 0 ? "+" : ""}${comparison.overallDelta.delta}` }),
          new Paragraph({ text: "Parser Coverage Comparison", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            text: `Previous ${comparison.parserCoverageDelta.previousCoverage}% -> Current ${comparison.parserCoverageDelta.currentCoverage}% (delta ${comparison.parserCoverageDelta.delta >= 0 ? "+" : ""}${comparison.parserCoverageDelta.delta})`,
          }),
          new Paragraph({ text: "Confidence Comparison", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            text: `${comparison.confidenceDelta.previous ?? "unknown"} -> ${comparison.confidenceDelta.current ?? "unknown"}`,
          }),
          new Paragraph({ text: "Section-by-Section Comparison", heading: HeadingLevel.HEADING_2 }),
          ...comparison.sectionComparisons.map(
            (section) =>
              new Paragraph({
                text: `${section.title}: ${section.previousScore ?? "-"} -> ${section.currentScore ?? "-"} (${section.changeType})`,
              }),
          ),
          new Paragraph({ text: "Penalty Delta", heading: HeadingLevel.HEADING_2 }),
          ...comparison.penaltyDelta.map(
            (penalty) =>
              new Paragraph({
                text: `${penalty.type}: ${penalty.previousAmount ?? 0} -> ${penalty.currentAmount ?? 0} (${penalty.delta ?? 0})`,
              }),
          ),
          new Paragraph({ text: "Interpretation", heading: HeadingLevel.HEADING_2 }),
          ...comparison.interpretation.map((note) => new Paragraph({ text: `- ${note}` })),
          new Paragraph({ text: "Recommended Next Actions", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "- Review sections marked worsened or mixed." }),
          new Paragraph({ text: "- Validate parser coverage and low-confidence mappings." }),
          new Paragraph({ text: "- Re-run audit after section rewrites or mapping corrections." }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(filename, blob);
}
