import { isEagleAvailable } from "@/lib/eagleNode";
import {
  LicenseServiceError,
  findLicenseItems,
  readLicenseFromItem,
} from "@/lib/licenseService";
import { buildFolderNodes } from "@/lib/resolveLicense";
import type { EagleLicense } from "@/types/license";
import { useCallback, useEffect, useState } from "react";

export interface LicenseTreeIssue {
  folderId: string;
  folderName: string;
  code:
    | "missing"
    | "schema-invalid"
    | "multiple-license-items"
    | "read-failed"
    | "json-parse";
  message: string;
}

export interface LicenseTreeState {
  status: "idle" | "loading" | "ready" | "error";
  folders: EagleFolder[];
  licensesByFolder: Map<string, EagleLicense>;
  issues: LicenseTreeIssue[];
  error: Error | null;
}

const initial: LicenseTreeState = {
  status: "idle",
  folders: [],
  licensesByFolder: new Map(),
  issues: [],
  error: null,
};

function flattenFolders(list: EagleFolder[], out: EagleFolder[] = []) {
  for (const f of list) {
    out.push(f);
    if (f.children?.length) flattenFolders(f.children, out);
  }
  return out;
}

export function useLicenseTree(rootFolderId: string | undefined) {
  const [state, setState] = useState<LicenseTreeState>(initial);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is intentionally used to retrigger
  useEffect(() => {
    if (!rootFolderId || !isEagleAvailable()) {
      setState(initial);
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    (async () => {
      try {
        const all = await eagle.folder.getAll();
        const flat = flattenFolders(all);
        const rootIndex = flat.findIndex((f) => f.id === rootFolderId);
        if (rootIndex === -1) {
          setState({
            status: "ready",
            folders: [],
            licensesByFolder: new Map(),
            issues: [],
            error: null,
          });
          return;
        }
        const subset = collectSubtree(rootFolderId, all);
        const subsetFlat = flattenFolders(subset);

        const licensesByFolder = new Map<string, EagleLicense>();
        const issues: LicenseTreeIssue[] = [];
        for (const folder of subsetFlat) {
          try {
            const items = await findLicenseItems(folder.id);
            if (items.length === 0) continue;
            if (items.length > 1) {
              issues.push({
                folderId: folder.id,
                folderName: folder.name,
                code: "multiple-license-items",
                message: `ライセンス設定ファイルが ${items.length} 件あります`,
              });
              continue;
            }
            const item = items[0];
            if (!item) continue;
            const license = await readLicenseFromItem(item);
            licensesByFolder.set(folder.id, license);
          } catch (e) {
            const err =
              e instanceof LicenseServiceError
                ? e
                : new LicenseServiceError(
                    "read-failed",
                    (e as Error).message,
                    e,
                  );
            const code =
              err.code === "schema-invalid" ||
              err.code === "json-parse" ||
              err.code === "multiple-license-items" ||
              err.code === "read-failed"
                ? err.code
                : "read-failed";
            issues.push({
              folderId: folder.id,
              folderName: folder.name,
              code,
              message: err.message,
            });
          }
        }

        if (cancelled) return;
        setState({
          status: "ready",
          folders: subsetFlat,
          licensesByFolder,
          issues,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          ...initial,
          status: "error",
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rootFolderId, reloadKey]);

  const folderNodes = buildFolderNodes(state.folders, state.licensesByFolder);

  return { ...state, folderNodes, reload };
}

function collectSubtree(rootId: string, all: EagleFolder[]): EagleFolder[] {
  const find = (list: EagleFolder[]): EagleFolder | null => {
    for (const f of list) {
      if (f.id === rootId) return f;
      if (f.children?.length) {
        const got = find(f.children);
        if (got) return got;
      }
    }
    return null;
  };
  const root = find(all);
  return root ? [root] : [];
}
