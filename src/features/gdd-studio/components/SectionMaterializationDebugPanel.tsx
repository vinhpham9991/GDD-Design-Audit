import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { GDDVersion } from "@/domain/models";
import { MaterializationDebugSectionCard } from "@/features/gdd-studio/components/MaterializationDebugSectionCard";

type Props = {
  version?: GDDVersion;
};

export function SectionMaterializationDebugPanel({ version }: Props) {
  const debug = version?.materializationDebug;

  return (
    <Card
      title="Section Materialization Debug"
      subtitle="Inspect how canonical sections were assembled from direct, support-promoted, and descendant contributors."
    >
      {!debug ? (
        <EmptyState
          title="No materialization debug"
          description="Build a starter GDD from sources to generate section materialization diagnostics."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Populated {debug.populatedSections}/{debug.totalCanonicalSections} sections. Empty sections: {debug.emptySections}.
          </p>
          {debug.notes.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
              {debug.notes.map((note) => (
                <p key={note}>- {note}</p>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {debug.sections.map((section) => (
              <MaterializationDebugSectionCard key={section.sectionKey} section={section} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
