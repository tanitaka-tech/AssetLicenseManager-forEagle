import { getFs, getPath } from "@/lib/eagleNode";
import { backupsDir, ensureDir } from "@/lib/pluginPaths";

export function backupTimestamp(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const SS = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
}

export function backupFileName(timestamp = backupTimestamp()): string {
  return `.eagle-license.backup.${timestamp}.json`;
}

export interface BackupResult {
  path: string;
  timestamp: string;
}

export async function backupItemFile(
  folderId: string,
  sourcePath: string,
): Promise<BackupResult> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) {
    throw new Error("Node.js fs/path API が利用できません");
  }
  const dir = backupsDir(folderId);
  await ensureDir(dir);
  const timestamp = backupTimestamp();
  const target = path.join(dir, backupFileName(timestamp));
  const content = await fs.readFile(sourcePath, "utf-8");
  await fs.writeFile(target, content, "utf-8");
  return { path: target, timestamp };
}

export interface BackupEntry {
  filename: string;
  fullPath: string;
  timestamp: string;
}

export async function listBackups(folderId: string): Promise<BackupEntry[]> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return [];
  const dir = backupsDir(folderId);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const result: BackupEntry[] = [];
  for (const filename of entries) {
    const m = filename.match(/^\.eagle-license\.backup\.(.+)\.json$/);
    if (!m) continue;
    const timestamp = m[1];
    if (!timestamp) continue;
    result.push({
      filename,
      fullPath: path.join(dir, filename),
      timestamp,
    });
  }
  result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return result;
}
