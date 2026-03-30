import { Card } from "@/components/shared/Card";
import { getAuditScoreBreakdown } from "@/domain/services/auditScoreBreakdown";
import type { AuditResult } from "@/domain/models";

type Props = {
  audit: AuditResult;
};

function confidenceBadgeClass(confidence: "high" | "medium" | "low") {
  if (confidence === "high") return "bg-emerald-100 text-emerald-700";
  if (confidence === "medium") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export function ScoreBreakdownPanel({ audit }: Props) {
  const breakdown = getAuditScoreBreakdown(audit);

  return (
    <Card
      title="Score Breakdown"
      subtitle="Calibrated to a production-oriented rubric. Score and confidence are separate signals."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Overall</p>
          <p className="text-2xl font-semibold text-slate-900">{breakdown.overallScore}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Section Health</p>
          <p className="text-sm text-slate-700">
            S {breakdown.strongCount} | M {breakdown.mediumCount} | W {breakdown.weakCount} | X{" "}
            {breakdown.missingCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Parser Coverage</p>
          <p className="text-2xl font-semibold text-slate-900">{breakdown.parserCoveragePercent}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Penalty Signals</p>
          <p className="text-sm text-slate-700">
            Contradictions {breakdown.contradictionCount}
            <br />
            Unsupported claims {breakdown.unsupportedClaimCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Audit Confidence</p>
          <span
            className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${confidenceBadgeClass(
              breakdown.auditConfidence,
            )}`}
          >
            {breakdown.auditConfidence}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        A low score may reflect weak source-to-section mapping, not only weak document quality.
      </p>
    </Card>
  );
}
