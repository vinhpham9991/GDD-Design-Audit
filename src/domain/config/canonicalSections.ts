import { GDD_SECTION_TEMPLATES, type GddSectionKey } from "@/domain/models/constants";

export type CanonicalSectionDefinition = {
  key: GddSectionKey;
  title: string;
};

export const CANONICAL_SECTIONS: CanonicalSectionDefinition[] = [...GDD_SECTION_TEMPLATES];
