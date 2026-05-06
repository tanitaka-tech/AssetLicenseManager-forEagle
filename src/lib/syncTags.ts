import { LicenseServiceError } from "@/lib/licenseService";
import {
  buildAssetTags,
  buildFolderTags,
  mergeManagedTags,
} from "@/lib/licenseTags";
import type { EagleLicense } from "@/types/license";

export type TagSyncMode =
  | "none"
  | "config-only"
  | "folder"
  | "asset"
  | "asset-replace";

export interface TagSyncResult {
  mode: TagSyncMode;
  folderUpdated: boolean;
  itemsScanned: number;
  itemsUpdated: number;
  failures: Array<{ id: string; error: string }>;
}

async function saveItem(item: EagleItem): Promise<void> {
  if (typeof item.save !== "function") {
    throw new LicenseServiceError(
      "item-save-unavailable",
      "Eagle item.save() が利用できません",
    );
  }
  await item.save();
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

export async function syncFolderTags(
  folder: EagleFolder,
  license: EagleLicense,
): Promise<boolean> {
  const managed = buildFolderTags(license);
  const next = mergeManagedTags(folder.tags ?? [], managed);
  folder.tags = next;
  await saveFolder(folder);
  return true;
}

async function getDirectAssets(folderId: string): Promise<EagleItem[]> {
  const items = await eagle.item.get({ folders: [folderId] });
  return items.filter((item) => !item.tags.includes("license-config"));
}

export async function syncAssetTags(
  folderId: string,
  license: EagleLicense,
  options: { replace?: boolean } = {},
): Promise<{
  itemsScanned: number;
  itemsUpdated: number;
  failures: Array<{ id: string; error: string }>;
}> {
  const items = await getDirectAssets(folderId);
  const managed = buildAssetTags(license);
  let updated = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const item of items) {
    try {
      const baseTags = options.replace ? [] : item.tags;
      const next = mergeManagedTags(baseTags, managed);
      const changed =
        next.length !== item.tags.length ||
        next.some((t, i) => t !== item.tags[i]);
      if (!changed) continue;
      item.tags = next;
      await saveItem(item);
      updated += 1;
    } catch (e) {
      failures.push({ id: item.id, error: (e as Error).message });
    }
  }
  return { itemsScanned: items.length, itemsUpdated: updated, failures };
}

export async function syncTags(
  folder: EagleFolder,
  license: EagleLicense,
  mode: TagSyncMode,
): Promise<TagSyncResult> {
  const result: TagSyncResult = {
    mode,
    folderUpdated: false,
    itemsScanned: 0,
    itemsUpdated: 0,
    failures: [],
  };
  if (mode === "none" || mode === "config-only") {
    return result;
  }
  result.folderUpdated = await syncFolderTags(folder, license);
  if (mode === "folder") {
    return result;
  }
  const assetResult = await syncAssetTags(folder.id, license, {
    replace: mode === "asset-replace",
  });
  result.itemsScanned = assetResult.itemsScanned;
  result.itemsUpdated = assetResult.itemsUpdated;
  result.failures = assetResult.failures;
  return result;
}
