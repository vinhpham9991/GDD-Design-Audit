import {
  type GddSectionKey,
} from "@/domain/models/constants";
import type { GDDVersion, SourceItem } from "@/domain/models";
import { buildGddFromStructuredSources } from "@/domain/services/buildStructuredGdd";
import { mapHeadingToSection } from "@/domain/services/mapSections";

export function extractHeadingsFromText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#") || /^[A-Z][\w\s]{3,40}:$/.test(line))
    .map((line) => line.replace(/^#+\s*/, "").replace(/:$/, "").trim())
    .filter(Boolean);
}

export function mapTextToSectionKey(text: string, fallbackTitle = ""): GddSectionKey {
  const mapped = mapHeadingToSection(fallbackTitle, text).sectionKey;
  return mapped ?? "risks_assumptions";
}

export type StarterBuildMode = "auto" | "structured_gdd" | "all_sources";

export function buildStarterGddFromSources(
  projectId: string,
  versionName: string,
  sources: SourceItem[],
  mode: StarterBuildMode = "auto",
): GDDVersion {
  const gddStructuredSources = sources.filter(
    (source) => source.type === "gdd" && source.parsedDocument?.blocks?.length,
  );

  const selectedSources =
    mode === "structured_gdd"
      ? gddStructuredSources
      : mode === "all_sources"
        ? sources
        : gddStructuredSources.length > 0
          ? gddStructuredSources
          : sources;

  const built = buildGddFromStructuredSources(projectId, versionName, selectedSources);
  return {
    ...built,
    summary:
      mode === "structured_gdd" || (mode === "auto" && gddStructuredSources.length > 0)
        ? "Starter GDD reconstructed from uploaded GDD structure."
        : "Starter GDD generated from structured source mapping.",
  };
}

export function compareGddVersions(current?: GDDVersion, previous?: GDDVersion) {
  if (!current || !previous) {
    return [];
  }

  return current.sections.map((section) => {
    const prev = previous.sections.find((item) => item.key === section.key);
    const before = prev?.content ?? "";
    const after = section.content;

    return {
      key: section.key,
      title: section.title,
      changed: before.trim() !== after.trim(),
      before,
      after,
    };
  });
}
