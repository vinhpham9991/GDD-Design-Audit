import { useState } from "react";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import type { SectionMaterializationDebug } from "@/domain/models";

type Props = {
  section: SectionMaterializationDebug;
};

function contributorTone(type: "direct" | "support" | "descendant") {
  if (type === "direct") return "good" as const;
  if (type === "support") return "warn" as const;
  return "neutral" as const;
}

export function MaterializationDebugSectionCard({ section }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <button type="button" className="w-full text-left" onClick={() => setOpen((prev) => !prev)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-slate-900">
            {section.title} ({section.sectionKey})
          </p>
          <div className="flex items-center gap-2">
            <Badge
              tone={
                section.confidence === "high"
                  ? "good"
                  : section.confidence === "medium"
                    ? "warn"
                    : section.confidence === "low"
                      ? "neutral"
                      : "danger"
              }
            >
              {section.confidence}
            </Badge>
            <span className="text-sm text-slate-600">
              {section.totalBlocks} blocks | {section.totalChars} chars
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-xs text-slate-500">{section.notes.join(" ")}</p>

          <ContributionGroup title="Direct" items={section.directContributors} />
          <ContributionGroup title="Support-promoted" items={section.supportContributors} />
          <ContributionGroup title="Descendant-derived" items={section.descendantContributors} />

          <Card title="Rejected candidates">
            {section.rejectedCandidates.length === 0 ? (
              <p className="text-xs text-slate-500">No rejected candidates.</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-700">
                {section.rejectedCandidates.map((item) => (
                  <li key={item.blockId}>
                    {item.heading || "Untitled"} ({item.bucket || "unknown"}): {item.reason}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function ContributionGroup({
  title,
  items,
}: {
  title: string;
  items: SectionMaterializationDebug["directContributors"];
}) {
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">No contributors.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.blockId} className="rounded border border-slate-200 p-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{item.heading || "Untitled block"}</p>
                <Badge tone={contributorTone(item.contributionType)}>{item.contributionType}</Badge>
              </div>
              <p className="text-slate-600">bucket {item.bucket || "unknown"} | chars {item.charCount}</p>
              <p className="mt-1 text-slate-700">{item.contentPreview || "(No content preview)"}</p>
              {item.reason && <p className="mt-1 text-[11px] text-slate-500">{item.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
