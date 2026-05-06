import { LicenseServiceError } from "@/lib/licenseService";
import { buildSearchTags, mergeManagedTags } from "@/lib/licenseTags";
import type { EagleLicense } from "@/types/license";

export interface TagSyncResult {
  folderUpdated: boolean;
  failures: Array<{ id: string; error: string }>;
}

async function saveFolder(folder: EagleFolder): Promise<void> {
  if (typeof folder.save !== "function") {
    throw new LicenseServiceError(
      "folder-save-unavailable",
      "Eagle folder.save() が利用できません",
    );
  }
  await folder.save();
}

function tagsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export async function syncTags(
  folder: EagleFolder,
  license: EagleLicense,
): Promise<TagSyncResult> {
  const result: TagSyncResult = { folderUpdated: false, failures: [] };
  const managed = buildSearchTags(license);
  try {
    const current = folder.extendTags ?? [];
    const next = mergeManagedTags(current, managed);
    if (!tagsEqual(current, next)) {
      folder.extendTags = next;
      await saveFolder(folder);
      result.folderUpdated = true;
    }
  } catch (e) {
    result.failures.push({ id: folder.id, error: (e as Error).message });
  }
  return result;
}
