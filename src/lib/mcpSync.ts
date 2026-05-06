import { getFs, getPath, isEagleAvailable } from "@/lib/eagleNode";
import { saveLicense } from "@/lib/licenseService";
import { ensureDir, mcpDir } from "@/lib/pluginPaths";
import {
  type ResolvedLicense,
  resolveLicenseForAsset,
} from "@/lib/resolveLicense";
import { validateLicense } from "@/lib/validateLicense";
import type { EagleLicense } from "@/types/license";

export const MCP_SCHEMA = "eagle-license-mcp/v1";

export interface McpSnapshot {
  schema: typeof MCP_SCHEMA;
  exported_at: string;
  library: { name: string; path: string } | null;
  root_folder: { id: string; name: string };
  folders: Array<{
    id: string;
    name: string;
    parent: string | null;
    license: EagleLicense | null;
  }>;
  resolved: ResolvedLicense[];
}

export type McpPatch =
  | {
      type: "upsert-license";
      folder_id: string;
      license: EagleLicense;
    }
  | { type: "delete-license"; folder_id: string }
  | { type: "set-tags"; item_id: string; tags: string[] };

export interface McpInbox {
  schema: typeof MCP_SCHEMA;
  patches: McpPatch[];
}

export interface McpApplyReport {
  applied: number;
  skipped: number;
  failed: Array<{ index: number; error: string; patch: McpPatch }>;
}

export function isMcpInbox(value: unknown): value is McpInbox {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.schema !== MCP_SCHEMA) return false;
  if (!Array.isArray(v.patches)) return false;
  return v.patches.every(isMcpPatch);
}

export function isMcpPatch(value: unknown): value is McpPatch {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type === "upsert-license") {
    return (
      typeof v.folder_id === "string" &&
      validateLicense(v.license).valid === true
    );
  }
  if (v.type === "delete-license") {
    return typeof v.folder_id === "string";
  }
  if (v.type === "set-tags") {
    return (
      typeof v.item_id === "string" &&
      Array.isArray(v.tags) &&
      v.tags.every((t) => typeof t === "string")
    );
  }
  return false;
}

export interface SnapshotInput {
  rootFolder: { id: string; name: string };
  folders: Array<{ id: string; name: string; parent?: string }>;
  licensesByFolder: Map<string, EagleLicense>;
  assets: Array<{ id: string; name?: string; folders: string[] }>;
  library?: { name: string; path: string } | null;
}

export function buildSnapshot(input: SnapshotInput): McpSnapshot {
  const folderNodes = new Map(
    input.folders.map((f) => [
      f.id,
      {
        id: f.id,
        name: f.name,
        parent: f.parent,
        license: input.licensesByFolder.get(f.id) ?? null,
      },
    ]),
  );
  const resolved = input.assets.map((asset) =>
    resolveLicenseForAsset(asset, { folders: folderNodes }),
  );
  return {
    schema: MCP_SCHEMA,
    exported_at: new Date().toISOString(),
    library: input.library ?? null,
    root_folder: input.rootFolder,
    folders: input.folders.map((f) => ({
      id: f.id,
      name: f.name,
      parent: f.parent ?? null,
      license: input.licensesByFolder.get(f.id) ?? null,
    })),
    resolved,
  };
}

export async function writeSnapshot(snapshot: McpSnapshot): Promise<string> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) {
    throw new Error("Node.js fs/path API が利用できません");
  }
  const dir = mcpDir();
  await ensureDir(dir);
  const target = path.join(dir, "snapshot.json");
  await fs.writeFile(target, JSON.stringify(snapshot, null, 2), "utf-8");
  return target;
}

export async function readInbox(): Promise<McpInbox | null> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return null;
  const dir = mcpDir();
  const inboxPath = path.join(dir, "inbox.json");
  let raw: string;
  try {
    raw = await fs.readFile(inboxPath, "utf-8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isMcpInbox(parsed)) return null;
  return parsed;
}

export async function archiveInbox(): Promise<void> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return;
  const dir = mcpDir();
  const inboxPath = path.join(dir, "inbox.json");
  const stamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const archivePath = path.join(dir, `processed-${stamp}.json`);
  try {
    await fs.rename(inboxPath, archivePath);
  } catch {
    // ignore
  }
}

export async function applyInboxPatches(
  inbox: McpInbox,
): Promise<McpApplyReport> {
  const report: McpApplyReport = { applied: 0, skipped: 0, failed: [] };
  if (!isEagleAvailable()) {
    return {
      applied: 0,
      skipped: inbox.patches.length,
      failed: inbox.patches.map((patch, index) => ({
        index,
        patch,
        error: "Eagle Plugin API が利用できません",
      })),
    };
  }
  for (let i = 0; i < inbox.patches.length; i += 1) {
    const patch = inbox.patches[i];
    if (!patch) continue;
    try {
      await applyPatch(patch);
      report.applied += 1;
    } catch (e) {
      report.failed.push({
        index: i,
        patch,
        error: (e as Error).message,
      });
    }
  }
  return report;
}

async function applyPatch(patch: McpPatch): Promise<void> {
  if (patch.type === "upsert-license") {
    const items = await eagle.item.get({ folders: [patch.folder_id] });
    const existing =
      items.find((it) => it.tags?.includes("license-config")) ?? null;
    await saveLicense(patch.folder_id, patch.license, existing);
    return;
  }
  if (patch.type === "delete-license") {
    throw new Error(
      "delete-license は未実装です（Eagle item の削除 API が確認できないため）",
    );
  }
  if (patch.type === "set-tags") {
    const items = await eagle.item.get({ ids: [patch.item_id] });
    const item = items[0];
    if (!item) {
      throw new Error(`item ${patch.item_id} が見つかりません`);
    }
    item.tags = patch.tags;
    if (typeof item.save !== "function") {
      throw new Error("Eagle item.save() が利用できません");
    }
    await item.save();
    return;
  }
}
