import type { EagleLicense } from "@/types/license";

export type ResolvedFrom = "asset" | "folder" | "parent_folder";

export type ResolutionStatus =
  | "resolved"
  | "review_required"
  | "unknown"
  | "conflict";

export interface ResolvedLicense {
  status: ResolutionStatus;
  asset_id: string;
  asset_name?: string;
  folder_id?: string;
  resolved_from?: ResolvedFrom;
  license?: EagleLicense;
  warnings: string[];
  conflicts?: EagleLicense[];
}

export interface FolderNode {
  id: string;
  name: string;
  parent?: string;
  license?: EagleLicense | null;
}

export interface ResolveContext {
  folders: Map<string, FolderNode>;
  assetLicense?: (assetId: string) => EagleLicense | null | undefined;
}

function pickInheritable(license: EagleLicense | null | undefined) {
  if (!license) return null;
  if (license.inherit === false) return null;
  return license;
}

function chainFromFolder(
  folderId: string,
  folders: Map<string, FolderNode>,
  collected: EagleLicense[],
  fromKind: "folder" | "parent_folder",
  source: { kind: "folder" | "parent_folder"; folderId?: string },
  visited: Set<string>,
): { kind: "folder" | "parent_folder"; folderId?: string } {
  if (visited.has(folderId)) return source;
  visited.add(folderId);
  const node = folders.get(folderId);
  if (!node) return source;
  const usable = pickInheritable(node.license);
  if (usable) {
    if (collected.length === 0) {
      collected.push(usable);
      return { kind: fromKind, folderId };
    }
    const existing = collected[0];
    if (existing && existing.license_id !== usable.license_id) {
      collected.push(usable);
    }
  }
  if (node.parent) {
    return chainFromFolder(
      node.parent,
      folders,
      collected,
      "parent_folder",
      source,
      visited,
    );
  }
  return source;
}

export function resolveLicenseForAsset(
  asset: { id: string; name?: string; folders: string[] },
  ctx: ResolveContext,
): ResolvedLicense {
  const warnings: string[] = [];

  const direct = ctx.assetLicense?.(asset.id);
  if (direct) {
    return finalize({
      status: deriveStatus(direct, []),
      asset_id: asset.id,
      asset_name: asset.name,
      resolved_from: "asset",
      license: direct,
      warnings,
    });
  }

  const collected: EagleLicense[] = [];
  let resolvedFrom: { kind: "folder" | "parent_folder"; folderId?: string } = {
    kind: "folder",
  };

  for (const folderId of asset.folders) {
    const visited = new Set<string>();
    const before = collected.length;
    const result = chainFromFolder(
      folderId,
      ctx.folders,
      collected,
      "folder",
      resolvedFrom,
      visited,
    );
    if (collected.length > before && resolvedFrom.folderId === undefined) {
      resolvedFrom = result;
    }
  }

  if (collected.length === 0) {
    return finalize({
      status: "unknown",
      asset_id: asset.id,
      asset_name: asset.name,
      warnings: [...warnings, "license-not-found"],
    });
  }

  if (collected.length > 1) {
    return finalize({
      status: "conflict",
      asset_id: asset.id,
      asset_name: asset.name,
      warnings: [...warnings, "multiple-folder-licenses"],
      conflicts: collected,
      folder_id: resolvedFrom.folderId,
    });
  }

  const license = collected[0];
  if (!license) {
    return finalize({
      status: "unknown",
      asset_id: asset.id,
      asset_name: asset.name,
      warnings,
    });
  }
  return finalize({
    status: deriveStatus(license, warnings),
    asset_id: asset.id,
    asset_name: asset.name,
    resolved_from: resolvedFrom.kind,
    folder_id: resolvedFrom.folderId,
    license,
    warnings,
  });
}

function deriveStatus(
  license: EagleLicense,
  warnings: string[],
): ResolutionStatus {
  if (license.status === "review_required") {
    warnings.push("status-review-required");
    return "review_required";
  }
  if (license.status === "unknown") {
    warnings.push("status-unknown");
    return "unknown";
  }
  return "resolved";
}

function finalize(input: ResolvedLicense): ResolvedLicense {
  return input;
}

export function buildFolderNodes(
  folders: readonly EagleFolder[],
  licensesByFolder: Map<string, EagleLicense>,
): Map<string, FolderNode> {
  const map = new Map<string, FolderNode>();
  const flatten = (list: readonly EagleFolder[]) => {
    for (const f of list) {
      map.set(f.id, {
        id: f.id,
        name: f.name,
        parent: f.parent,
        license: licensesByFolder.get(f.id) ?? null,
      });
      if (f.children?.length) flatten(f.children);
    }
  };
  flatten(folders);
  // Eagle may not always set `parent`; reconstruct from children traversal.
  const reconstructParent = (
    list: readonly EagleFolder[],
    parentId?: string,
  ) => {
    for (const f of list) {
      const node = map.get(f.id);
      if (node && parentId && !node.parent) {
        node.parent = parentId;
      }
      if (f.children?.length) reconstructParent(f.children, f.id);
    }
  };
  reconstructParent(folders);
  return map;
}
