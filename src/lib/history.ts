import { getFs, getPath } from "@/lib/eagleNode";
import { ensureDir, historyFile } from "@/lib/pluginPaths";
import type { EagleLicense } from "@/types/license";

export type HistoryAction = "create" | "update" | "delete";

export interface HistoryEntry {
  at: string;
  action: HistoryAction;
  folder_id: string;
  license_id: string;
  license_name: string;
  status: string;
  commercial_use: boolean;
  credit_required: boolean;
  inherit: boolean;
  priority: number;
  backup_path?: string;
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.at === "string" &&
    typeof v.action === "string" &&
    typeof v.folder_id === "string" &&
    typeof v.license_id === "string"
  );
}

function summarize(
  folderId: string,
  license: EagleLicense,
  action: HistoryAction,
  backupPath?: string,
): HistoryEntry {
  return {
    at: new Date().toISOString(),
    action,
    folder_id: folderId,
    license_id: license.license_id,
    license_name: license.license_name,
    status: license.status,
    commercial_use: license.permissions.commercial_use,
    credit_required: license.requirements.credit_required,
    inherit: license.inherit,
    priority: license.priority,
    backup_path: backupPath,
  };
}

export async function appendHistory(
  folderId: string,
  license: EagleLicense,
  action: HistoryAction,
  backupPath?: string,
): Promise<HistoryEntry> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) {
    throw new Error("Node.js fs/path API が利用できません");
  }
  const file = historyFile(folderId);
  await ensureDir(path.dirname(file));
  const entry = summarize(folderId, license, action, backupPath);
  await fs.appendFile(file, `${JSON.stringify(entry)}\n`, "utf-8");
  return entry;
}

export async function readHistory(folderId: string): Promise<HistoryEntry[]> {
  const fs = getFs();
  if (!fs) return [];
  const file = historyFile(folderId);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return [];
  }
  const entries: HistoryEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (isHistoryEntry(parsed)) entries.push(parsed);
    } catch {
      // ignore malformed
    }
  }
  entries.sort((a, b) => b.at.localeCompare(a.at));
  return entries;
}
