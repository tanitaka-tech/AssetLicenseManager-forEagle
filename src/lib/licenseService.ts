import { backupItemFile } from "@/lib/backup";
import { getFs, getOs, getPath, isEagleAvailable } from "@/lib/eagleNode";
import { appendHistory } from "@/lib/history";
import { LICENSE_CONFIG_TAG, buildLicenseConfigTags } from "@/lib/licenseTags";
import { validateLicense } from "@/lib/validateLicense";
import type { EagleLicense } from "@/types/license";

export interface SaveLicenseOptions {
  /** Create a `.eagle-license.backup.YYYYMMDD-HHmmss.json` before overwriting (update only). */
  backup?: boolean;
  /** Append an entry to the history JSONL after a successful save. */
  recordHistory?: boolean;
}

export const LICENSE_FILENAME = ".eagle-license.json";
export const LICENSE_ITEM_NAME = ".eagle-license";

export class LicenseServiceError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export interface LicenseLookupResult {
  license: EagleLicense;
  item: EagleItem;
}

function looksLikeLicenseItem(item: EagleItem): boolean {
  if (item.tags?.includes(LICENSE_CONFIG_TAG)) return true;
  if (item.ext.toLowerCase() === "json") {
    return item.name === LICENSE_ITEM_NAME || item.name === LICENSE_FILENAME;
  }
  return false;
}

export async function findLicenseItems(folderId: string): Promise<EagleItem[]> {
  if (!isEagleAvailable()) return [];
  const items = await eagle.item.get({ folders: [folderId] });
  return items.filter(looksLikeLicenseItem);
}

export async function findPrimaryLicenseItem(
  folderId: string,
): Promise<EagleItem | null> {
  const candidates = await findLicenseItems(folderId);
  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    throw new LicenseServiceError(
      "multiple-license-items",
      `ライセンス設定ファイルが複数見つかりました（${candidates.length}件）`,
      candidates.map((i) => i.id),
    );
  }
  return candidates[0] ?? null;
}

export async function readLicenseFromItem(
  item: EagleItem,
): Promise<EagleLicense> {
  const fs = getFs();
  if (!fs) {
    throw new LicenseServiceError(
      "fs-unavailable",
      "Node.js fs API が利用できません（Eagle 上で実行してください）",
    );
  }
  if (!item.filePath) {
    throw new LicenseServiceError(
      "filepath-missing",
      "ライセンス設定アイテムのファイルパスが取得できません",
    );
  }
  let text: string;
  try {
    text = await fs.readFile(item.filePath, "utf-8");
  } catch (e) {
    throw new LicenseServiceError(
      "read-failed",
      `ライセンスファイルの読み込みに失敗しました: ${(e as Error).message}`,
      e,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new LicenseServiceError(
      "json-parse",
      "ライセンスファイルの JSON が不正です",
      e,
    );
  }
  const validation = validateLicense(parsed);
  if (!validation.valid) {
    throw new LicenseServiceError(
      "schema-invalid",
      "ライセンスファイルが JSON Schema に違反しています",
      validation.errors,
    );
  }
  return parsed as EagleLicense;
}

export async function loadLicense(
  folderId: string,
): Promise<LicenseLookupResult | null> {
  const item = await findPrimaryLicenseItem(folderId);
  if (!item) return null;
  const license = await readLicenseFromItem(item);
  return { license, item };
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const fs = getFs();
  if (!fs) {
    throw new LicenseServiceError(
      "fs-unavailable",
      "Node.js fs API が利用できません",
    );
  }
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf-8");
}

async function tempLicenseFilePath(): Promise<string> {
  const path = getPath();
  const os = getOs();
  const fs = getFs();
  if (!path || !fs) {
    throw new LicenseServiceError(
      "fs-unavailable",
      "Node.js fs / path API が利用できません",
    );
  }
  const base =
    (eagle.os?.tmpdir?.() as string | undefined) ?? os?.tmpdir?.() ?? ".";
  const dir = path.join(base, `eagle-license-${Date.now()}`);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, LICENSE_FILENAME);
}

async function setItemTags(item: EagleItem, tags: string[]): Promise<void> {
  item.tags = tags;
  if (typeof item.save !== "function") {
    throw new LicenseServiceError(
      "item-save-unavailable",
      "Eagle item.save() が利用できません",
    );
  }
  await item.save();
}

export async function createLicense(
  folderId: string,
  license: EagleLicense,
  options: SaveLicenseOptions = {},
): Promise<LicenseLookupResult> {
  const validation = validateLicense(license);
  if (!validation.valid) {
    throw new LicenseServiceError(
      "schema-invalid",
      "ライセンスが JSON Schema に違反しています",
      validation.errors,
    );
  }
  if (!isEagleAvailable()) {
    throw new LicenseServiceError(
      "eagle-unavailable",
      "Eagle Plugin API が利用できません",
    );
  }
  const tempPath = await tempLicenseFilePath();
  await writeJsonFile(tempPath, license);
  const tags = buildLicenseConfigTags(license);
  const newItemId = await eagle.item.addFromPath(tempPath, {
    name: LICENSE_ITEM_NAME,
    folders: [folderId],
    tags,
    annotation: `Eagle Folder License (${license.license_id})`,
  });
  const [created] = await eagle.item.get({ ids: [newItemId] });
  if (!created) {
    throw new LicenseServiceError(
      "item-create-failed",
      "ライセンス設定アイテムの作成後に取得できませんでした",
    );
  }
  if (options.recordHistory ?? true) {
    try {
      await appendHistory(folderId, license, "create");
    } catch (e) {
      console.warn("Failed to append history:", e);
    }
  }
  return { license, item: created };
}

export async function updateLicense(
  folderId: string,
  item: EagleItem,
  license: EagleLicense,
  options: SaveLicenseOptions = {},
): Promise<LicenseLookupResult> {
  const validation = validateLicense(license);
  if (!validation.valid) {
    throw new LicenseServiceError(
      "schema-invalid",
      "ライセンスが JSON Schema に違反しています",
      validation.errors,
    );
  }
  if (!item.filePath) {
    throw new LicenseServiceError(
      "filepath-missing",
      "ライセンス設定アイテムのファイルパスが取得できません",
    );
  }
  let backupPath: string | undefined;
  if (options.backup ?? true) {
    try {
      const result = await backupItemFile(folderId, item.filePath);
      backupPath = result.path;
    } catch (e) {
      console.warn("Failed to create backup:", e);
    }
  }
  await writeJsonFile(item.filePath, license);
  const tags = buildLicenseConfigTags(license);
  await setItemTags(item, tags);
  if (options.recordHistory ?? true) {
    try {
      await appendHistory(folderId, license, "update", backupPath);
    } catch (e) {
      console.warn("Failed to append history:", e);
    }
  }
  return { license, item };
}

export async function saveLicense(
  folderId: string,
  license: EagleLicense,
  existingItem: EagleItem | null,
  options: SaveLicenseOptions = {},
): Promise<LicenseLookupResult> {
  if (existingItem) {
    return updateLicense(folderId, existingItem, license, options);
  }
  return createLicense(folderId, license, options);
}
