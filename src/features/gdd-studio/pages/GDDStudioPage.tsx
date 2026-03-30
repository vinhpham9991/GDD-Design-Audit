import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/shared/Input";
import { Textarea } from "@/components/shared/Textarea";
import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import { SectionMaterializationDebugPanel } from "@/features/gdd-studio/components/SectionMaterializationDebugPanel";
import {
  buildStarterGddFromSources,
  compareGddVersions,
  type StarterBuildMode,
} from "@/domain/services/gddBuilderService";
import { deriveSectionStatus } from "@/domain/services/gddStatusService";
import { useSyncedVersionSelection } from "@/hooks/useSyncedVersionSelection";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function GDDStudioPage() {
  const { t } = useI18n();
  const projects = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const gddVersions = useAppStore((state) => state.gddVersions);
  const sources = useAppStore((state) => state.sourceItems);
  const addGddVersion = useAppStore((state) => state.addGddVersion);
  const updateGddSection = useAppStore((state) => state.updateGddSection);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const pushToast = useAppStore((state) => state.pushToast);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const versionList = useMemo(
    () => gddVersions.filter((version) => version.projectId === activeProject?.id),
    [activeProject?.id, gddVersions],
  );
  const scopedSources = useMemo(
    () => sources.filter((source) => !source.projectId || source.projectId === activeProject?.id),
    [activeProject?.id, sources],
  );

  const [selectedVersionId, setSelectedVersionId] = useSyncedVersionSelection(
    versionList,
    activeProject?.currentVersionId,
  );
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(GDD_SECTION_TEMPLATES[0].key);
  const [newVersionName, setNewVersionName] = useState("Version 2");
  const [buildMode, setBuildMode] = useState<StarterBuildMode>("auto");
  const [showMaterializationDebug, setShowMaterializationDebug] = useState(false);

  const currentVersion = versionList.find((version) => version.id === selectedVersionId) ?? versionList[0];
  const previousVersion = versionList.find((version) => version.id !== currentVersion?.id);

  const resolvedSectionKey = useMemo(() => {
    if (!currentVersion) {
      return selectedSectionKey;
    }

    const exists = currentVersion.sections.some((section) => section.key === selectedSectionKey);
    return exists ? selectedSectionKey : (currentVersion.sections[0]?.key ?? GDD_SECTION_TEMPLATES[0].key);
  }, [currentVersion, selectedSectionKey]);

  const currentSection =
    currentVersion?.sections.find((section) => section.key === resolvedSectionKey) ??
    currentVersion?.sections[0];

  const compareRows = compareGddVersions(currentVersion, previousVersion);
  const currentCompare = compareRows.find((item) => item.key === currentSection?.key);

  const createStarter = () => {
    if (!activeProject) return;
    const starter = buildStarterGddFromSources(activeProject.id, newVersionName, scopedSources, buildMode);
    addGddVersion(starter);
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: activeProject.id,
      versionId: starter.id,
      changeSummary: `Created starter GDD version ${starter.name} from sources.`,
      createdAt: new Date().toISOString(),
      author: "System",
    });
    pushToast("Starter GDD version created.", "success");
    setSelectedVersionId(starter.id);
    setSelectedSectionKey(starter.sections[0]?.key ?? GDD_SECTION_TEMPLATES[0].key);
    updateProject(activeProject.id, { currentVersionId: starter.id });
  };

  const cloneCurrent = () => {
    if (!activeProject || !currentVersion) return;

    const cloned = {
      ...currentVersion,
      id: `gdd_${crypto.randomUUID()}`,
      name: newVersionName,
      createdAt: new Date().toISOString(),
      sections: currentVersion.sections.map((section) => ({ ...section, id: `sec_${crypto.randomUUID()}` })),
      summary: `Cloned from ${currentVersion.name}`,
    };

    addGddVersion(cloned);
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: activeProject.id,
      versionId: cloned.id,
      changeSummary: `Cloned GDD version ${currentVersion.name} into ${cloned.name}.`,
      createdAt: new Date().toISOString(),
      author: "User",
    });
    pushToast("GDD version cloned.", "success");
    setSelectedVersionId(cloned.id);
    setSelectedSectionKey(cloned.sections[0]?.key ?? GDD_SECTION_TEMPLATES[0].key);
    updateProject(activeProject.id, { currentVersionId: cloned.id });
  };

  return (
    <PageContainer
      title={t.pages.gddStudio}
      description="Build the active GDD from structured source blocks instead of raw text only."
    >
      {!activeProject ? (
        <EmptyState title="No project" description="Create a project first in Project Hub." />
      ) : (
        <>
          <Card title="Version Controls">
            <div className="grid gap-3 md:grid-cols-5">
              <select
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                value={activeProject.id}
                onChange={(event) => setActiveProject(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                value={currentVersion?.id ?? ""}
                onChange={(event) => {
                  setSelectedVersionId(event.target.value);
                  updateProject(activeProject.id, { currentVersionId: event.target.value });
                }}
              >
                {versionList.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </select>
              <Input value={newVersionName} onChange={(event) => setNewVersionName(event.target.value)} />
              <select
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                value={buildMode}
                onChange={(event) => setBuildMode(event.target.value as StarterBuildMode)}
              >
                <option value="auto">Auto (prefer structured GDD)</option>
                <option value="structured_gdd">Build from Uploaded GDD Structure</option>
                <option value="all_sources">Build from All Sources</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={createStarter}>Build Starter from Sources</Button>
                <Button variant="ghost" onClick={cloneCurrent}>
                  Clone Version
                </Button>
              </div>
            </div>
          </Card>

          {!currentVersion ? (
            <EmptyState title={t.common.emptyState} description="No GDD versions available for this project." />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-12">
                <Card title="Sections" className="xl:col-span-3">
                  <div className="space-y-1">
                    {currentVersion.sections.map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                          resolvedSectionKey === section.key
                            ? "border-teal-400 bg-teal-50"
                            : "border-slate-200 bg-white"
                        }`}
                        onClick={() => setSelectedSectionKey(section.key)}
                      >
                      <div className="flex items-center justify-between gap-2">
                        <span>{section.title}</span>
                          <Badge
                            tone={
                              section.status === "strong"
                                ? "good"
                                : section.status === "weak" || section.status === "missing"
                                  ? "danger"
                                  : "warn"
                            }
                          >
                            {section.status}
                          </Badge>
                        </div>
                      {currentVersion.sectionBuildMeta?.[section.key] && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {currentVersion.sectionBuildMeta[section.key].blockCount} blocks |{" "}
                          {currentVersion.sectionBuildMeta[section.key].mappedContentLength} chars |{" "}
                          {currentVersion.sectionBuildMeta[section.key].confidenceSummary}
                        </p>
                      )}
                      {currentVersion.sectionBuildMeta?.[section.key] && (
                        <p className="text-[11px] text-slate-500">
                          direct {currentVersion.sectionBuildMeta[section.key].directContributorCount ?? 0} | support{" "}
                          {currentVersion.sectionBuildMeta[section.key].supportContributorCount ?? 0} | descendant{" "}
                          {currentVersion.sectionBuildMeta[section.key].descendantContributorCount ?? 0}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </Card>

                <Card title={currentSection?.title ?? "Section"} className="xl:col-span-6">
                  {!currentSection ? (
                    <EmptyState title={t.common.emptyState} description={t.common.noData} />
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        className="min-h-80"
                        placeholder={`Define ${currentSection.title.toLowerCase()} using validated source evidence.`}
                        value={currentSection.content}
                        onChange={(event) =>
                          updateGddSection(currentVersion.id, currentSection.key, {
                            content: event.target.value,
                            status: deriveSectionStatus(event.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-slate-500">
                        Section status updates automatically based on content detail length.
                      </p>
                    </div>
                  )}
                </Card>

                <Card
                  title="Compare with Previous"
                  subtitle={
                    currentVersion?.parserCoverage
                      ? `Mapped ${currentVersion.parserCoverage.mappedBlocks}/${currentVersion.parserCoverage.totalBlocks} blocks (${currentVersion.parserCoverage.mappedPercent}%).`
                      : "No parser coverage data for this version."
                  }
                  className="xl:col-span-3"
                >
                  {!currentCompare ? (
                    <EmptyState title="No comparison" description="Create another version to compare changes." />
                  ) : (
                    <div className="space-y-2 text-sm">
                      <Badge tone={currentCompare.changed ? "warn" : "good"}>
                        {currentCompare.changed ? "Changed" : "Unchanged"}
                      </Badge>
                      <p className="text-xs font-semibold uppercase text-slate-500">Previous</p>
                      <p className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-600">
                        {currentCompare.before || "No previous content"}
                      </p>
                      <p className="text-xs font-semibold uppercase text-slate-500">Current</p>
                      <p className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-600">
                        {currentCompare.after || "No current content"}
                      </p>
                      {currentSection && currentVersion.sectionBuildMeta?.[currentSection.key] && (
                        <p className="text-xs text-slate-500">
                          Section mapping: {currentVersion.sectionBuildMeta[currentSection.key].blockCount} blocks,{" "}
                          {currentVersion.sectionBuildMeta[currentSection.key].mappedContentLength} chars, confidence{" "}
                          {currentVersion.sectionBuildMeta[currentSection.key].confidenceSummary}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {currentVersion.unmappedBlocks && currentVersion.unmappedBlocks.length > 0 && (
                <Card
                  title="Unmapped Source Blocks"
                  subtitle="Review blocks that could not be mapped confidently to canonical sections."
                >
                  <div className="space-y-2">
                    {currentVersion.unmappedBlocks.slice(0, 8).map((block) => (
                      <div key={block.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                        <p className="font-medium text-slate-900">{block.heading || "Untitled block"}</p>
                        <p className="line-clamp-2 text-xs text-slate-600">{block.content}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowMaterializationDebug((prev) => !prev)}
                >
                  {showMaterializationDebug ? "Hide Materialization Debug" : "Show Materialization Debug"}
                </Button>
              </div>

              {showMaterializationDebug && <SectionMaterializationDebugPanel version={currentVersion} />}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
