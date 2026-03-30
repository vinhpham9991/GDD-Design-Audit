import { useMemo, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/shared/Input";
import { Textarea } from "@/components/shared/Textarea";
import type { ParsedBlock, ParsedDocument, ParsedElement } from "@/domain/models";
import { NON_CANONICAL_BUCKETS } from "@/domain/config/nonCanonicalBuckets";
import { SOURCE_TYPES } from "@/domain/models/constants";
import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import { formatDate } from "@/domain/utils/date";
import { buildParserDiagnostics } from "@/domain/services/parserDiagnostics";
import { applyCrossSectionSupport } from "@/domain/services/applyCrossSectionSupport";
import { parseSourceFile, normalizeSource } from "@/domain/services/sourceService";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const sourceSchema = z.object({
  title: z.string().min(2),
  type: z.enum(SOURCE_TYPES),
  reliability: z.enum(["high", "medium", "low", "fragile"]).optional(),
  tags: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
});

type SourceFormValues = z.infer<typeof sourceSchema>;

function elementPreviewText(element: ParsedElement): string {
  if (element.type === "paragraph") return element.text;
  if (element.type === "heading") return element.text;
  if (element.type === "table") return element.flattenedText;
  if (element.type === "bullet_list") return element.flattenedText;
  if (element.type === "numbered_list") return element.flattenedText;
  if (element.type === "appendix") return element.text;
  return element.text;
}

function blockPreview(block: ParsedBlock): string {
  const content = block.content.trim();
  if (content) {
    return content;
  }
  const fromParts = block.contentParts?.map(elementPreviewText).join("\n").trim();
  return fromParts || "(No content)";
}

function blockMappingLabel(block: ParsedBlock): string {
  if (block.primaryBucket) return block.primaryBucket;
  if (block.mappedBucket) return block.mappedBucket;
  if (block.mappedSectionKey) return block.mappedSectionKey;
  return "unknown_unmapped";
}

export function SourcesPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const sources = useAppStore((state) => state.sourceItems);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const addSourceItem = useAppStore((state) => state.addSourceItem);
  const updateSourceItem = useAppStore((state) => state.updateSourceItem);
  const deleteSourceItem = useAppStore((state) => state.deleteSourceItem);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const pushToast = useAppStore((state) => state.pushToast);

  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(sources[0]?.id);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
  const [parsedSnippet, setParsedSnippet] = useState<string | undefined>();
  const [parsedFileName, setParsedFileName] = useState<string | undefined>();
  const [parsedDocumentDraft, setParsedDocumentDraft] = useState<ParsedDocument | undefined>();
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({});

  const scopedSources = useMemo(
    () => sources.filter((source) => !source.projectId || source.projectId === activeProjectId),
    [activeProjectId, sources],
  );

  const resolvedSourceId = useMemo(() => {
    const exists = scopedSources.some((source) => source.id === selectedSourceId);
    return exists ? selectedSourceId : scopedSources[0]?.id;
  }, [scopedSources, selectedSourceId]);

  const selectedSource = useMemo(
    () => scopedSources.find((source) => source.id === resolvedSourceId),
    [resolvedSourceId, scopedSources],
  );

  const form = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      title: "",
      type: "other",
      reliability: "medium",
      tags: "",
      content: "",
      url: "",
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      type: "other",
      reliability: "medium",
      tags: "",
      content: "",
      url: "",
    });
    setEditingId(undefined);
    setFileError(undefined);
    setUploadStatus("idle");
    setParsedSnippet(undefined);
    setParsedFileName(undefined);
    setParsedDocumentDraft(undefined);
    setExpandedBlockIds({});
  };

  const startEdit = (sourceId: string) => {
    const source = scopedSources.find((item) => item.id === sourceId);
    if (!source) return;

    setEditingId(source.id);
    setSelectedSourceId(source.id);
    form.reset({
      title: source.title,
      type: source.type,
      reliability: source.reliability ?? "medium",
      tags: source.tags?.join(", ") ?? "",
      content: source.content ?? "",
      url: source.url ?? "",
    });
    setParsedDocumentDraft(source.parsedDocument);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (editingId) {
      const existing = scopedSources.find((item) => item.id === editingId);
      if (!existing) return;
      const updated = normalizeSource({ ...values, projectId: activeProjectId, parsedDocument: parsedDocumentDraft }, existing);
      updateSourceItem(existing.id, updated);
      if (activeProjectId) {
        addRevisionLog({
          id: `revision_${crypto.randomUUID()}`,
          projectId: activeProjectId,
          versionId: "",
          changeSummary: `Updated source: ${updated.title}`,
          createdAt: new Date().toISOString(),
          author: "User",
        });
      }
      pushToast("Source updated.", "success");
      setSelectedSourceId(existing.id);
    } else {
      const created = normalizeSource({ ...values, projectId: activeProjectId, parsedDocument: parsedDocumentDraft });
      addSourceItem(created);
      if (activeProjectId) {
        addRevisionLog({
          id: `revision_${crypto.randomUUID()}`,
          projectId: activeProjectId,
          versionId: "",
          changeSummary: `Added source: ${created.title}`,
          createdAt: new Date().toISOString(),
          author: "User",
        });
      }
      pushToast("Source added.", "success");
      setSelectedSourceId(created.id);
    }

    resetForm();
  });

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setFileError(undefined);
      setUploadStatus("parsing");
      setParsedSnippet(undefined);
      setParsedFileName(file.name);
      const parsed = await parseSourceFile(file);
      form.setValue("title", parsed.title);
      form.setValue("content", parsed.content);
      if (parsed.type) {
        form.setValue("type", parsed.type);
      }
      setParsedDocumentDraft(parsed.parsedDocument);
      setParsedSnippet(parsed.content.slice(0, 240));
      setUploadStatus("success");
      pushToast("File parsed into source form.", "success");
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Could not parse file.");
      setUploadStatus("error");
      pushToast("Unable to parse selected file.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const updateDraftBlockSection = (blockId: string, selectedBucket: string) => {
    setParsedDocumentDraft((prev) => {
      if (!prev) return prev;
      const isCanonical = GDD_SECTION_TEMPLATES.some((section) => section.key === selectedBucket);
      const nextBlocks = prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              mappedSectionKey: isCanonical ? selectedBucket : undefined,
              mappedBucket: selectedBucket || "unknown_unmapped",
              primaryBucket: selectedBucket || "unknown_unmapped",
              primaryCanonicalSection: isCanonical ? selectedBucket : undefined,
              supportCanonicalSections: applyCrossSectionSupport({
                ...block,
                mappedSectionKey: isCanonical ? selectedBucket : undefined,
                mappedBucket: selectedBucket || "unknown_unmapped",
                primaryBucket: selectedBucket || "unknown_unmapped",
                primaryCanonicalSection: isCanonical ? selectedBucket : undefined,
                mappingConfidence: selectedBucket ? "medium" : "unmapped",
              }).supportCanonicalSections,
              bucketCategory: !selectedBucket
                ? ("unknown" as const)
                : isCanonical
                  ? ("canonical" as const)
                  : selectedBucket === "unknown_unmapped"
                    ? ("unknown" as const)
                    : ("non_canonical" as const),
              manualMapping: Boolean(selectedBucket),
              mappingConfidence: selectedBucket ? ("medium" as const) : ("unmapped" as const),
            }
          : block,
      );
      return {
        ...prev,
        blocks: nextBlocks,
        appendixBlocks: nextBlocks.filter((block) => block.isAppendix),
        unmappedBlocks: nextBlocks.filter(
          (block) =>
            block.bucketCategory === "unknown" ||
            (!block.mappedSectionKey && !block.mappedBucket) ||
            block.mappedBucket === "unknown_unmapped",
        ),
        diagnostics: buildParserDiagnostics(prev.elements ?? [], nextBlocks),
      };
    });
  };

  const updateSavedBlockSection = (sourceId: string, blockId: string, selectedBucket: string) => {
    const source = scopedSources.find((item) => item.id === sourceId);
    if (!source?.parsedDocument) return;
    const isCanonical = GDD_SECTION_TEMPLATES.some((section) => section.key === selectedBucket);
    const nextBlocks = source.parsedDocument.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            mappedSectionKey: isCanonical ? selectedBucket : undefined,
            mappedBucket: selectedBucket || "unknown_unmapped",
            primaryBucket: selectedBucket || "unknown_unmapped",
            primaryCanonicalSection: isCanonical ? selectedBucket : undefined,
            supportCanonicalSections: applyCrossSectionSupport({
              ...block,
              mappedSectionKey: isCanonical ? selectedBucket : undefined,
              mappedBucket: selectedBucket || "unknown_unmapped",
              primaryBucket: selectedBucket || "unknown_unmapped",
              primaryCanonicalSection: isCanonical ? selectedBucket : undefined,
              mappingConfidence: selectedBucket ? "medium" : "unmapped",
            }).supportCanonicalSections,
            bucketCategory: !selectedBucket
              ? ("unknown" as const)
              : isCanonical
                ? ("canonical" as const)
                : selectedBucket === "unknown_unmapped"
                  ? ("unknown" as const)
                  : ("non_canonical" as const),
            manualMapping: Boolean(selectedBucket),
            mappingConfidence: selectedBucket ? ("medium" as const) : ("unmapped" as const),
          }
        : block,
    );
    const parsedDocument = {
      ...source.parsedDocument,
      blocks: nextBlocks,
      appendixBlocks: nextBlocks.filter((block) => block.isAppendix),
      unmappedBlocks: nextBlocks.filter(
        (block) =>
          block.bucketCategory === "unknown" ||
          (!block.mappedSectionKey && !block.mappedBucket) ||
          block.mappedBucket === "unknown_unmapped",
      ),
      diagnostics: buildParserDiagnostics(source.parsedDocument.elements ?? [], nextBlocks),
    };
    updateSourceItem(sourceId, { parsedDocument });
  };

  const toggleBlockExpand = (blockId: string) => {
    setExpandedBlockIds((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  return (
    <PageContainer
      title={t.pages.sources}
      description={help.pageDescriptions.sources}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title={editingId ? "Edit Source" : "Add Source"}
          subtitle="Add a source, review parsed blocks, then save."
          className="lg:col-span-2"
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Title" {...form.register("title")} />
              <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm" {...form.register("type")}>
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm" {...form.register("reliability")}>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
                <option value="fragile">fragile</option>
              </select>
              <Input placeholder="Tags (comma separated)" {...form.register("tags")} />
            </div>

            <Input placeholder="URL (optional)" {...form.register("url")} />
            <Textarea placeholder="Paste source text here" {...form.register("content")} />

            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input type="file" accept=".txt,.md,.markdown,.docx" onChange={onFileUpload} />
                  <HelpTooltip text={help.tooltips.docxUpload} />
                </div>
                <p className="text-xs text-slate-500">Accepted: .txt, .md, .markdown, .docx</p>
              </div>
              <Button type="submit" disabled={uploadStatus === "parsing"}>
                {editingId ? "Update Source" : "Add Source"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  {t.common.cancel}
                </Button>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {uploadStatus === "parsing" && <p className="text-slate-600">Reading and parsing file...</p>}
              {uploadStatus === "success" && parsedFileName && (
                <p className="text-emerald-700">Imported from {parsedFileName}. You can edit the title before saving.</p>
              )}
              {fileError && <p className="text-rose-600">{fileError}</p>}
            </div>
            {parsedSnippet && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-slate-700">
                <p className="mb-1 font-semibold text-slate-900">Parsed preview</p>
                <p className="whitespace-pre-wrap">{parsedSnippet}...</p>
              </div>
            )}

            {parsedDocumentDraft?.blocks?.length ? (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">Parsed Blocks ({parsedDocumentDraft.blocks.length})</p>
                {parsedDocumentDraft.diagnostics && (
                  <p className="text-xs text-slate-500">
                    headings {parsedDocumentDraft.diagnostics.headingCount} | tables {parsedDocumentDraft.diagnostics.tableCount} | bullets {parsedDocumentDraft.diagnostics.bulletListCount} | numbered {parsedDocumentDraft.diagnostics.numberedListCount} | canonical {parsedDocumentDraft.diagnostics.canonicalMappedCount} | supporting {parsedDocumentDraft.diagnostics.nonCanonicalMappedCount} | unknown {parsedDocumentDraft.diagnostics.unknownUnmappedCount}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Review inferred headings and mappings before final save.
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {parsedDocumentDraft.blocks.map((block) => (
                    <div key={block.id} className="rounded-md border border-slate-200 p-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {block.heading || "Untitled block"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{blockPreview(block)}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <select
                          className="h-8 rounded-md border border-slate-300 px-2 text-xs"
                          value={blockMappingLabel(block)}
                          onChange={(event) => updateDraftBlockSection(block.id, event.target.value)}
                        >
                          <option value="unknown_unmapped">Unknown / Unmapped</option>
                          {GDD_SECTION_TEMPLATES.map((section) => (
                            <option key={section.key} value={section.key}>
                              {section.title}
                            </option>
                          ))}
                          {NON_CANONICAL_BUCKETS.filter((bucket) => bucket !== "unknown_unmapped").map((bucket) => (
                            <option key={bucket} value={bucket}>
                              {bucket}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500">
                          {blockMappingLabel(block)} |{" "}
                          {block.mappingConfidence ?? "unmapped"}
                        </p>
                      </div>
                      {(block.primaryCanonicalSection || block.supportCanonicalSections?.length) && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          primary section: {block.primaryCanonicalSection ?? "-"} | supports:{" "}
                          {block.supportCanonicalSections?.join(", ") || "-"}
                        </p>
                      )}
                      {block.ownershipReason && (
                        <p className="mt-1 text-[11px] text-slate-500">ownership: {block.ownershipReason}</p>
                      )}
                      {block.mappingReasons?.[0] && (
                        <p className="text-[11px] text-slate-500">mapping: {block.mappingReasons.join(", ")}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {block.sourceTypeHints?.includes("table") && <Badge tone="neutral">table</Badge>}
                        {block.sourceTypeHints?.includes("bullet_list") && <Badge tone="neutral">bullet</Badge>}
                        {block.sourceTypeHints?.includes("numbered_list") && <Badge tone="neutral">numbered</Badge>}
                        {block.isAppendix && <Badge tone="warn">appendix</Badge>}
                        {block.isDocumentFraming && <Badge tone="neutral">document framing</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        </Card>

        <Card
          title="Source Details"
          subtitle="Review parsed document blocks, mapping targets, and section confidence before building the working GDD."
        >
          {!selectedSource ? (
            <EmptyState title={t.common.emptyState} description="Select a source to inspect details." />
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-base font-semibold text-slate-900">{selectedSource.title}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{selectedSource.type}</Badge>
                <HelpTooltip text={help.tooltips.sourceReliability} />
                <Badge tone={selectedSource.reliability === "high" ? "good" : "warn"}>
                  {selectedSource.reliability}
                </Badge>
              </div>
              {selectedSource.parsedDocument?.diagnostics && (
                <p className="text-xs text-slate-500">
                  Parsed diagnostics: headings {selectedSource.parsedDocument.diagnostics.headingCount}, tables {selectedSource.parsedDocument.diagnostics.tableCount}, bullets {selectedSource.parsedDocument.diagnostics.bulletListCount}, numbered {selectedSource.parsedDocument.diagnostics.numberedListCount}, canonical {selectedSource.parsedDocument.diagnostics.canonicalMappedCount}, supporting {selectedSource.parsedDocument.diagnostics.nonCanonicalMappedCount}, unknown {selectedSource.parsedDocument.diagnostics.unknownUnmappedCount}
                </p>
              )}
              {selectedSource.parsedDocument?.blocks?.length ? (
                <div className="space-y-2">
                  {selectedSource.parsedDocument.blocks.map((block) => (
                    <div key={block.id} className="rounded-md border border-slate-200 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{block.heading || "Untitled block"}</p>
                        <p className="text-[11px] text-slate-500">
                          {blockMappingLabel(block)} |{" "}
                          {block.mappingConfidence ?? "unmapped"}
                        </p>
                      </div>
                      <div className="mt-2 grid gap-2">
                        <select
                          className="h-8 rounded-md border border-slate-300 px-2 text-xs"
                          value={blockMappingLabel(block)}
                          onChange={(event) =>
                            updateSavedBlockSection(selectedSource.id, block.id, event.target.value)
                          }
                        >
                          <option value="unknown_unmapped">Unknown / Unmapped</option>
                          {GDD_SECTION_TEMPLATES.map((section) => (
                            <option key={section.key} value={section.key}>
                              {section.title}
                            </option>
                          ))}
                          {NON_CANONICAL_BUCKETS.filter((bucket) => bucket !== "unknown_unmapped").map((bucket) => (
                            <option key={bucket} value={bucket}>
                              {bucket}
                            </option>
                          ))}
                        </select>
                        <p className="line-clamp-2 text-xs text-slate-600">{blockPreview(block)}</p>
                        <div className="flex flex-wrap gap-1">
                          {block.sourceTypeHints?.includes("table") && <Badge tone="neutral">table</Badge>}
                          {block.sourceTypeHints?.includes("bullet_list") && <Badge tone="neutral">bullet</Badge>}
                          {block.sourceTypeHints?.includes("numbered_list") && <Badge tone="neutral">numbered</Badge>}
                          {block.isAppendix && <Badge tone="warn">appendix</Badge>}
                          {block.isDocumentFraming && <Badge tone="neutral">document framing</Badge>}
                        </div>
                        {block.ownershipReason && (
                          <p className="text-[11px] text-slate-500">ownership: {block.ownershipReason}</p>
                        )}
                        {block.mappingReasons?.[0] && (
                          <p className="text-[11px] text-slate-500">mapping: {block.mappingReasons.join(", ")}</p>
                        )}
                        <Button
                          variant="ghost"
                          className="justify-start px-0 text-xs"
                          onClick={() => toggleBlockExpand(block.id)}
                        >
                          {expandedBlockIds[block.id] ? "Hide full text" : "Show full text"}
                        </Button>
                        {expandedBlockIds[block.id] && (
                          <p className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">
                            {blockPreview(block)}
                          </p>
                        )}
                      </div>
                      {(block.primaryCanonicalSection || block.supportCanonicalSections?.length) && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          primary section: {block.primaryCanonicalSection ?? "-"} | supports:{" "}
                          {block.supportCanonicalSections?.join(", ") || "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">{selectedSource.content || selectedSource.url || "No content."}</p>
              )}
              <p className="text-xs text-slate-500">Updated {formatDate(selectedSource.updatedAt)}</p>
            </div>
          )}
        </Card>
      </div>

      <Card title="Source List" subtitle="Manage source records before building or updating GDD versions.">
        {scopedSources.length === 0 ? (
          <EmptyState title={t.common.emptyState} description={t.common.noData} />
        ) : (
          <div className="space-y-2">
            {scopedSources.map((source) => (
              <div
                key={source.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center"
              >
                <button
                  className="text-left"
                  type="button"
                  onClick={() => setSelectedSourceId(source.id)}
                >
                  <p className="font-medium text-slate-900">{source.title}</p>
                  <p className="text-xs text-slate-500">
                    {source.type} | {source.tags?.join(", ") || "no tags"}
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => startEdit(source.id)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (resolvedSourceId === source.id) {
                        setSelectedSourceId(undefined);
                      }
                      deleteSourceItem(source.id);
                      if (activeProjectId) {
                        addRevisionLog({
                          id: `revision_${crypto.randomUUID()}`,
                          projectId: activeProjectId,
                          versionId: "",
                          changeSummary: `Deleted source: ${source.title}`,
                          createdAt: new Date().toISOString(),
                          author: "User",
                        });
                      }
                      pushToast("Source deleted.", "success");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
