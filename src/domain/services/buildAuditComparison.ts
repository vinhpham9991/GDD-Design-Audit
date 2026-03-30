import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import type { AuditResult, GDDVersion, Project } from "@/domain/models";

export type AuditSectionComparison = {
  sectionKey: string;
  title: string;
  previousHealth?: string;
  currentHealth?: string;
  previousScore?: number;
  currentScore?: number;
  scoreDelta?: number;
  changeType: "improved" | "worsened" | "unchanged" | "introduced" | "removed" | "mixed";
  notes?: string[];
};

export type AuditPenaltyDelta = {
  type: string;
  previousAmount?: number;
  currentAmount?: number;
  delta?: number;
  notes?: string;
};

export type AuditComparisonExport = {
  project: {
    id: string;
    name: string;
  };
  previousAudit: {
    id: string;
    versionId: string;
    versionName?: string;
    score: number;
    createdAt: string;
    confidence?: string;
  };
  currentAudit: {
    id: string;
    versionId: string;
    versionName?: string;
    score: number;
    createdAt: string;
    confidence?: string;
  };
  overallDelta: {
    previousScore: number;
    currentScore: number;
    delta: number;
  };
  parserCoverageDelta: {
    previousCoverage: number;
    currentCoverage: number;
    delta: number;
  };
  confidenceDelta: {
    previous?: string;
    current?: string;
  };
  sectionComparisons: AuditSectionComparison[];
  penaltyDelta: AuditPenaltyDelta[];
  interpretation: string[];
};

function confidenceRank(value?: string): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

export function buildAuditComparisonExport(params: {
  project: Project;
  previousAudit: AuditResult;
  previousVersion?: GDDVersion;
  currentAudit: AuditResult;
  currentVersion?: GDDVersion;
}): AuditComparisonExport {
  const { project, previousAudit, currentAudit, previousVersion, currentVersion } = params;

  const sectionComparisons: AuditSectionComparison[] = GDD_SECTION_TEMPLATES.map((template) => {
    const prev = previousAudit.findings.find((item) => item.sectionKey === template.key);
    const curr = currentAudit.findings.find((item) => item.sectionKey === template.key);

    const previousScore = prev?.score;
    const currentScore = curr?.score;
    const scoreDelta =
      typeof previousScore === "number" && typeof currentScore === "number"
        ? currentScore - previousScore
        : undefined;

    let changeType: AuditSectionComparison["changeType"] = "unchanged";
    if (!prev && curr) changeType = "introduced";
    else if (prev && !curr) changeType = "removed";
    else if (prev && curr) {
      if (prev.health !== curr.health && scoreDelta && scoreDelta > 0) changeType = "improved";
      else if (prev.health !== curr.health && scoreDelta && scoreDelta < 0) changeType = "worsened";
      else if (scoreDelta && Math.abs(scoreDelta) >= 4) changeType = scoreDelta > 0 ? "improved" : "worsened";
      else if (prev.health !== curr.health) changeType = "mixed";
      else changeType = "unchanged";
    }

    const notes: string[] = [];
    if ((prev?.gaps.length ?? 0) < (curr?.gaps.length ?? 0)) notes.push("More gaps detected in current audit.");
    if ((prev?.contradictions.length ?? 0) !== (curr?.contradictions.length ?? 0)) {
      notes.push("Contradiction count changed.");
    }

    return {
      sectionKey: template.key,
      title: template.title,
      previousHealth: prev?.health,
      currentHealth: curr?.health,
      previousScore,
      currentScore,
      scoreDelta,
      changeType,
      notes,
    };
  });

  const penaltyTypes = new Set([
    ...(previousAudit.debugInfo?.penalties.map((penalty) => penalty.type) ?? []),
    ...(currentAudit.debugInfo?.penalties.map((penalty) => penalty.type) ?? []),
  ]);
  const penaltyDelta: AuditPenaltyDelta[] = Array.from(penaltyTypes).map((type) => {
    const prevPenalty = previousAudit.debugInfo?.penalties.find((penalty) => penalty.type === type)?.amount;
    const currPenalty = currentAudit.debugInfo?.penalties.find((penalty) => penalty.type === type)?.amount;
    return {
      type,
      previousAmount: prevPenalty,
      currentAmount: currPenalty,
      delta:
        typeof prevPenalty === "number" && typeof currPenalty === "number"
          ? currPenalty - prevPenalty
          : undefined,
      notes: "Positive delta means stronger penalty pressure in current audit.",
    };
  });

  const parserCoverageDelta = {
    previousCoverage: previousAudit.parserCoverage?.mappedPercent ?? 0,
    currentCoverage: currentAudit.parserCoverage?.mappedPercent ?? 0,
    delta:
      (currentAudit.parserCoverage?.mappedPercent ?? 0) -
      (previousAudit.parserCoverage?.mappedPercent ?? 0),
  };

  const interpretation: string[] = [];
  const scoreDelta = currentAudit.overallScore - previousAudit.overallScore;
  if (scoreDelta > 0) interpretation.push("Overall score improved in current audit.");
  if (scoreDelta < 0) interpretation.push("Overall score declined in current audit.");
  if (Math.abs(parserCoverageDelta.delta) >= 10) {
    interpretation.push("Parser coverage changed materially and may explain part of the score shift.");
  }
  if (confidenceRank(currentAudit.auditConfidence) < confidenceRank(previousAudit.auditConfidence)) {
    interpretation.push("Audit confidence decreased despite score changes; mapping quality should be reviewed.");
  }
  if (interpretation.length === 0) {
    interpretation.push("Current and previous audits are broadly consistent with minor deltas.");
  }

  return {
    project: {
      id: project.id,
      name: project.name,
    },
    previousAudit: {
      id: previousAudit.id,
      versionId: previousAudit.versionId,
      versionName: previousVersion?.name,
      score: previousAudit.overallScore,
      createdAt: previousAudit.createdAt,
      confidence: previousAudit.auditConfidence,
    },
    currentAudit: {
      id: currentAudit.id,
      versionId: currentAudit.versionId,
      versionName: currentVersion?.name,
      score: currentAudit.overallScore,
      createdAt: currentAudit.createdAt,
      confidence: currentAudit.auditConfidence,
    },
    overallDelta: {
      previousScore: previousAudit.overallScore,
      currentScore: currentAudit.overallScore,
      delta: currentAudit.overallScore - previousAudit.overallScore,
    },
    parserCoverageDelta,
    confidenceDelta: {
      previous: previousAudit.auditConfidence,
      current: currentAudit.auditConfidence,
    },
    sectionComparisons,
    penaltyDelta,
    interpretation,
  };
}
