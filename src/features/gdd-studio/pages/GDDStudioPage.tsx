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
  
  // Trạng thái đồng bộ từ Store
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  
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
    if (!currentVersion) return selectedSectionKey;
    const exists = currentVersion.sections.some((section) => section.key === selectedSectionKey);
    return exists ? selectedSectionKey : (currentVersion.sections[0]?.key ?? GDD_SECTION_TEMPLATES[0].key);
  }, [currentVersion, selectedSectionKey]);

  const currentSection =
    currentVersion?.sections.find((section) => section.key === resolvedSectionKey) ??
    currentVersion?.sections[0];

  const compareRows = compareGddVersions(currentVersion, previousVersion);
  const currentCompare = compareRows.find((item) => item.key === currentSection?.key);

  // Logic tạo phiên bản mới
  const createStarter = () => {
    if (!activeProject) return;
    const starter = buildStarterGddFromSources(activeProject.id, newVersionName, scopedSources, buildMode);
    addGddVersion(starter);
    addRevisionLog({
      id: `revision_${Math.random().toString(36).substr(2, 9)}`,
      projectId: activeProject.id,
      versionId: starter.id,
      changeSummary: `Created starter GDD version ${starter.name} from sources.`,
      createdAt: new Date().toISOString(),
      author: "System",
    });
    pushToast("Starter GDD version created.", "success");
    setSelectedVersionId(starter.id);
    updateProject(activeProject.id, { currentVersionId: starter.id });
  };

  // Logic xuất file DOCX (Giả định hàm này được import hoặc định nghĩa)
  const handleExportDocx = () => {
    if (!currentVersion) return;
    // Gọi hàm export logic tại đây (Sử dụng thư viện docx đã hướng dẫn)
    pushToast("Exporting GDD to DOCX...", "success");
    console.log("Exporting version:", currentVersion.name);
  };

  // Nếu Store chưa sẵn sàng, render trạng thái loading để tránh lỗi nút bấm
  if (!hasHydrated) {
    return (
      <PageContainer title={t.pages.gddStudio} description="Loading Studio...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t.pages.gddStudio}
      description="Build the active GDD from structured source blocks instead of raw text only."
    >
      {!activeProject ? (
        <EmptyState title="No project" description="Create a project first in Project Hub." />
      ) : (
        <div className="space-y-6">
          <Card title="Version Controls">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Project</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  value={activeProject.id}
                  onChange={(event) => setActiveProject(event.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Active Version</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  value={currentVersion?.id ?? ""}
                  onChange={(event) => {
                    setSelectedVersionId(event.target.value);
                    updateProject(activeProject.id, { currentVersionId: event.target.value });
                  }}
                >
                  {versionList.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">New Name</label>
                <Input value={newVersionName} onChange={(e) => setNewVersionName(e.target.value)} />
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase text-slate-500">Build Mode</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  value={buildMode}
                  onChange={(e) => setBuildMode(e.target.value as StarterBuildMode)}
                >
                  <option value="auto">Auto (Smart Mapping)</option>
                  <option value="structured_gdd">From Uploaded GDD</option>
                  <option value="all_sources">All Sources</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={createStarter} className="flex-1">Build</Button>
                <Button variant="ghost" onClick={handleExportDocx} disabled={!currentVersion}>
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {!currentVersion ? (
            <EmptyState title="No GDD versions" description="Click 'Build' to create your first GDD version." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-12">
              {/* Sections List */}
              <Card title="Sections" className="xl:col-span-3 h-fit">
                <div className="space-y-1">
                  {currentVersion.sections.map((section) => (
                    <button
                      key={section.key}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        resolvedSectionKey === section.key ? "border-teal-400 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedSectionKey(section.key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{section.title}</span>
                        <Badge tone={section.status === "strong" ? "good" : section.status === "missing" ? "danger" : "warn"}>
                          {section.status}
                        </Badge>
                      </div>
                      {currentVersion.sectionBuildMeta?.[section.key] && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {currentVersion.sectionBuildMeta[section.key].blockCount} blocks | {currentVersion.sectionBuildMeta[section.key].confidenceSummary}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Editor Area */}
              <Card title={currentSection?.title ?? "Editor"} className="xl:col-span-6">
                {!currentSection ? (
                  <EmptyState title="Select a section" description="Choose a section from the left to edit." />
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      className="min-h-[500px] font-mono text-sm leading-relaxed"
                      placeholder={`Drafting ${currentSection.title}...`}
                      value={currentSection.content}
                      onChange={(e) =>
                        updateGddSection(currentVersion.id, currentSection.key, {
                          content: e.target.value,
                          status: deriveSectionStatus(e.target.value),
                        })
                      }
                    />
                    <p className="text-[10px] text-slate-400 italic">
                      Status is updated automatically based on content density.
                    </p>
                  </div>
                )}
              </Card>

              {/* Comparison & Meta */}
              <Card title="Insight & Compare" className="xl:col-span-3 h-fit">
                {!currentCompare ? (
                  <EmptyState title="No baseline" description="Changes appear here once you have multiple versions." />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">Change Status</span>
                      <Badge tone={currentCompare.changed ? "warn" : "good"}>
                        {currentCompare.changed ? "Modified" : "Original"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Previous Content Snippet</label>
                      <div className="max-h-32 overflow-y-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                        {currentCompare.before || "No previous version found."}
                      </div>
                    </div>

                    {currentVersion.parserCoverage && (
                      <div className="rounded-lg bg-teal-50 p-3 border border-teal-100">
                        <p className="text-xs font-semibold text-teal-800">Source Coverage</p>
                        <p className="text-lg font-bold text-teal-600">{currentVersion.parserCoverage.mappedPercent}%</p>
                        <p className="text-[10px] text-teal-700">
                          {currentVersion.parserCoverage.mappedBlocks} / {currentVersion.parserCoverage.totalBlocks} source blocks mapped.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMaterializationDebug(!showMaterializationDebug)}
            >
              {showMaterializationDebug ? "Hide Debug Panel" : "View Section Materialization"}
            </Button>
          </div>

          {showMaterializationDebug && currentVersion && (
            <SectionMaterializationDebugPanel version={currentVersion} />
          )}
        </div>
      )}
    </PageContainer>
  );
}