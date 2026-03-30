import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { AuditResult } from "@/domain/models";

type Props = {
  audit: AuditResult;
};

export function AuditDebugPanel({ audit }: Props) {
  const [openSectionKey, setOpenSectionKey] = useState<string | undefined>(
    audit.debugInfo?.canonicalSections[0]?.sectionKey,
  );

  const debug = audit.debugInfo;

  const exportDebug = () => {
    if (!debug) return;
    const blob = new Blob([JSON.stringify(debug, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_debug_${audit.versionId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Audit Debug"
      subtitle="Audit Debug helps explain how the current score was derived."
    >
      {!debug ? (
        <EmptyState title="No debug data" description="Run audit to generate explainability diagnostics." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Use this view to compare structure, mapping, and scoring logic across tools.
            </p>
            <Button variant="ghost" onClick={exportDebug}>
              Export Debug JSON
            </Button>
          </div>
          {debug.notes.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
              {debug.notes.map((note) => (
                <p key={note}>- {note}</p>
              ))}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Metric label="Total parsed blocks" value={debug.parserCoverage.totalBlocks} />
            <Metric label="Mapped blocks" value={debug.parserCoverage.mappedBlocks} />
            <Metric label="Unmapped blocks" value={debug.parserCoverage.unmappedBlocks} />
            <Metric label="Coverage %" value={debug.parserCoverage.coveragePercent} />
            <Metric label="Source-backed sections" value={debug.parserCoverage.sectionsWithMappedContent} />
            <Metric label="Empty sections" value={debug.parserCoverage.emptySections} />
          </div>

          <Card title="Penalty / Adjustment Breakdown">
            <div className="space-y-2 text-sm">
              {debug.penalties.map((penalty) => (
                <div key={penalty.type} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{penalty.label}</p>
                    <p className="font-semibold text-slate-900">-{penalty.amount}</p>
                  </div>
                  <p className="text-xs text-slate-600">{penalty.reason}</p>
                  {penalty.affectedSections && penalty.affectedSections.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Sections: {penalty.affectedSections.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Final Aggregation">
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Method:</span> {debug.aggregation.method}
              </p>
              <p>
                <span className="font-medium text-slate-900">Explanation:</span>{" "}
                {debug.aggregation.explanation}
              </p>
              <p>
                <span className="font-medium text-slate-900">Raw average:</span>{" "}
                {debug.aggregation.rawAverage ?? "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Final score:</span> {debug.aggregation.finalScore}
              </p>
            </div>
          </Card>

          <Card title="Canonical Sections">
            <div className="space-y-2">
              {debug.canonicalSections.map((section) => (
                <div key={section.sectionKey} className="rounded-lg border border-slate-200 p-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                      setOpenSectionKey((prev) =>
                        prev === section.sectionKey ? undefined : section.sectionKey,
                      )
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">
                        {section.title} ({section.sectionKey})
                      </p>
                      <p className="text-sm text-slate-600">
                        score {section.adjustedScore ?? section.rawScore} | {section.health}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      mapped {section.mappedBlockCount} blocks (direct {section.directBlockCount ?? 0}, support{" "}
                      {section.supportBlockCount ?? 0}) | {section.contentLength} chars | confidence{" "}
                      {section.mappingConfidence}
                    </p>
                    {section.supportBuckets && section.supportBuckets.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        support buckets: {section.supportBuckets.join(", ")}
                      </p>
                    )}
                  </button>

                  {openSectionKey === section.sectionKey && (
                    <div className="mt-3 space-y-2">
                      <div className="rounded bg-slate-50 p-2 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">Why this section scored this way</p>
                        <ul className="mt-1 space-y-1">
                          {section.reasons.map((reason) => (
                            <li key={reason}>- {reason}</li>
                          ))}
                        </ul>
                      </div>

                      {section.mappedBlocks.length === 0 ? (
                        <p className="text-xs text-slate-500">No contributing mapped blocks.</p>
                      ) : (
                        <div className="space-y-2">
                          {section.mappedBlocks.map((block) => (
                            <div key={block.blockId} className="rounded border border-slate-200 p-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium text-slate-900">{block.sourceTitle}</p>
                                <p className="text-slate-500">
                                  {block.mappingConfidence} | {block.mappingMode ?? "automatic"} |{" "}
                                  {block.contributionMode ?? "direct"}
                                </p>
                              </div>
                              <p className="text-slate-600">{block.heading || "Untitled heading"}</p>
                              <p className="text-[11px] text-slate-500">
                                primary bucket: {block.primaryBucket ?? "-"} | supports:{" "}
                                {block.supportCanonicalSections?.join(", ") || "-"}
                              </p>
                              <p className="mt-1 text-slate-700">{block.snippet || "(No snippet)"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Mapping Diagnostics">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Low confidence blocks</p>
                {debug.lowConfidenceBlocks.length === 0 ? (
                  <p className="text-xs text-slate-500">None</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {debug.lowConfidenceBlocks.slice(0, 20).map((block) => (
                      <li key={block.blockId}>
                        {block.sourceTitle}: {block.heading || "Untitled"} ({block.mappingConfidence})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Unmapped blocks</p>
                {debug.unmappedBlocks.length === 0 ? (
                  <p className="text-xs text-slate-500">None</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {debug.unmappedBlocks.slice(0, 20).map((block) => (
                      <li key={block.blockId}>
                        {block.sourceTitle}: {block.heading || "Untitled"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
