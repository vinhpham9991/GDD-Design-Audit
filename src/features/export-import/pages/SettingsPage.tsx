import { useRef, useState, type ChangeEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Modal } from "@/components/shared/Modal";
import {
  createEmptySnapshot,
  createSnapshotFromStore,
  downloadJsonFile,
  parseSnapshotJson,
  serializeSnapshot,
} from "@/domain/services/snapshotService";
import { exportAuditDocx, exportGddDocx } from "@/domain/services/docxExportService";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const help = getHelpContent(language);
  const resetToSeed = useAppStore((state) => state.resetToSeed);
  const replaceFromSnapshot = useAppStore((state) => state.replaceFromSnapshot);
  const pushToast = useAppStore((state) => state.pushToast);

  const projects = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const gddVersions = useAppStore((state) => state.gddVersions);
  const audits = useAppStore((state) => state.auditResults);
  const scorecards = useAppStore((state) => state.scorecards);
  const insights = useAppStore((state) => state.insightReports);
  const issues = useAppStore((state) => state.issues);
  const revisionLogs = useAppStore((state) => state.revisionLogs);
  const decisionLogs = useAppStore((state) => state.decisionLogs);
  const approvalGates = useAppStore((state) => state.approvalGates);
  const confidenceItems = useAppStore((state) => state.confidenceItems);
  const evidenceCoverageItems = useAppStore((state) => state.evidenceCoverageItems);
  const sourceQualityItems = useAppStore((state) => state.sourceQualityItems);
  const conflictItems = useAppStore((state) => state.conflictItems);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const version = gddVersions.find((item) => item.id === project?.currentVersionId);
  const audit = audits.find((item) => item.versionId === version?.id);
  const scorecard = scorecards.find((item) => item.versionId === version?.id);
  const insight = insights.find((item) => item.versionId === version?.id);
  const scopedIssues = issues.filter((item) => item.projectId === project?.id);

  const handleExportJson = () => {
    const snapshot = createSnapshotFromStore(useAppStore.getState());
    downloadJsonFile(
      `game-design-os_snapshot_${new Date().toISOString().slice(0, 10)}.json`,
      serializeSnapshot(snapshot),
    );
    pushToast("Snapshot exported.", "success");
  };

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      const raw = await file.text();
      const snapshot = parseSnapshotJson(raw);
      replaceFromSnapshot(snapshot);
      pushToast("Snapshot imported successfully.", "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Import failed.", "error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportGddDocx = async () => {
    if (!project) {
      pushToast("No active project.", "error");
      return;
    }

    try {
      setBusy(true);
      await exportGddDocx({
        project,
        gdd: version,
        audit,
        insight,
        issues: scopedIssues,
      });
      pushToast("GDD_revised.docx generated.", "success");
    } catch {
      pushToast("Failed to generate GDD DOCX.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleExportAuditDocx = async () => {
    if (!project) {
      pushToast("No active project.", "error");
      return;
    }

    try {
      setBusy(true);
      await exportAuditDocx({
        project,
        gdd: version,
        audit,
        scorecard,
        insight,
        issues: scopedIssues,
        revisions: revisionLogs,
        decisions: decisionLogs,
        approvalGates,
        confidenceItems,
        evidenceCoverageItems,
        sourceQualityItems,
        conflictItems,
      });
      pushToast("Audit_Report.docx generated.", "success");
    } catch {
      pushToast("Failed to generate Audit DOCX.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer title={t.pages.settings} description={help.pageDescriptions.settings}>
      <Card title={t.common.language}>
        <div className="flex gap-2">
          <Button variant={language === "en" ? "primary" : "ghost"} onClick={() => setLanguage("en")}>EN</Button>
          <Button variant={language === "vi" ? "primary" : "ghost"} onClick={() => setLanguage("vi")}>VI</Button>
        </div>
      </Card>

      <Card
        title={(
          <span className="inline-flex items-center gap-2">
            Import / Export JSON <HelpTooltip text={help.tooltips.jsonImportExport} />
          </span>
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportJson} disabled={busy}>{t.common.export} JSON</Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            {t.common.import} JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/json,.json"
            onChange={handleImportJson}
          />
        </div>
      </Card>

      <Card title="DOCX Exports">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportGddDocx} disabled={busy}>Download GDD_revised.docx</Button>
          <Button variant="ghost" onClick={handleExportAuditDocx} disabled={busy}>
            Download Audit_Report.docx
          </Button>
        </div>
      </Card>

      <Card title="Data Controls">
        <p className="text-sm text-slate-600">Use reset for demo reload, or clear all data for a clean project state.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setConfirmResetOpen(true)} disabled={busy}>
            {t.common.reset}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmClearOpen(true)} disabled={busy}>
            Clear All Data
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmResetOpen}
        title="Reset to demo seed?"
        description="This restores seeded data for all modules."
        onClose={() => setConfirmResetOpen(false)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmResetOpen(false)}>{t.common.cancel}</Button>
          <Button
            variant="danger"
            onClick={() => {
              resetToSeed();
              setConfirmResetOpen(false);
              pushToast("Seed data restored.", "success");
            }}
          >
            {t.common.reset}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmClearOpen}
        title="Clear all data?"
        description="This removes projects, sources, versions, passes, and governance records."
        onClose={() => setConfirmClearOpen(false)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClearOpen(false)}>{t.common.cancel}</Button>
          <Button
            variant="danger"
            onClick={() => {
              replaceFromSnapshot(createEmptySnapshot());
              setConfirmClearOpen(false);
              pushToast("All data cleared.", "success");
            }}
          >
            Clear
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
