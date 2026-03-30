import { useMemo, useState } from "react";

type Identifiable = { id: string };

export function useSyncedVersionSelection<T extends Identifiable>(
  versions: T[],
  preferredVersionId?: string,
) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(
    preferredVersionId ?? versions[0]?.id,
  );

  const resolvedVersionId = useMemo(() => {
    const fallback = preferredVersionId ?? versions[0]?.id;
    const stillExists = versions.some((version) => version.id === selectedVersionId);
    return stillExists ? selectedVersionId : fallback;
  }, [preferredVersionId, selectedVersionId, versions]);

  return [resolvedVersionId, setSelectedVersionId] as const;
}
