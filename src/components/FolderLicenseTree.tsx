import { isEagleAvailable } from "@/lib/eagleNode";
import {
  findLicenseItems,
  readLicenseFromItem,
} from "@/lib/licenseService";
import type { EagleLicense } from "@/types/license";
import { useCallback, useEffect, useState } from "react";

export interface CreateTarget {
  folder: EagleFolder;
}

export interface EditTarget {
  folder: EagleFolder;
  item: EagleItem;
  license: EagleLicense;
}

interface FolderLicenseTreeProps {
  refreshKey?: number;
  onCreate: (target: CreateTarget) => void;
  onEdit: (target: EditTarget) => void;
}

interface LicenseEntry {
  item: EagleItem;
  license: EagleLicense | null;
}

interface TreeState {
  status: "idle" | "loading" | "ready" | "error";
  roots: EagleFolder[];
  licensesByFolder: Map<string, LicenseEntry>;
  error: Error | null;
}

const initialState: TreeState = {
  status: "idle",
  roots: [],
  licensesByFolder: new Map(),
  error: null,
};

function flatten(list: EagleFolder[], out: EagleFolder[] = []): EagleFolder[] {
  for (const f of list) {
    out.push(f);
    if (f.children?.length) flatten(f.children, out);
  }
  return out;
}

export function FolderLicenseTree({
  refreshKey,
  onCreate,
  onEdit,
}: FolderLicenseTreeProps) {
  const [state, setState] = useState<TreeState>(initialState);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    if (!isEagleAvailable()) {
      setState({ ...initialState, status: "ready" });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    (async () => {
      try {
        const roots = await eagle.folder.getAll();
        const allFolders = flatten(roots);
        const licensesByFolder = new Map<string, LicenseEntry>();
        for (const folder of allFolders) {
          let items: EagleItem[] = [];
          try {
            items = await findLicenseItems(folder.id);
          } catch {
            continue;
          }
          if (items.length === 0) continue;
          const item = items[0];
          if (!item) continue;
          let license: EagleLicense | null = null;
          try {
            license = await readLicenseFromItem(item);
          } catch {
            license = null;
          }
          licensesByFolder.set(folder.id, { item, license });
        }
        if (cancelled) return;
        setState({
          status: "ready",
          roots,
          licensesByFolder,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          ...initialState,
          status: "error",
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, refreshKey]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (state.status === "loading" || state.status === "idle") {
    return <p className="opacity-70 text-xs">フォルダツリーを読み込み中…</p>;
  }
  if (state.status === "error") {
    return (
      <div role="alert" className="alert alert-error alert-soft text-xs">
        <span>読み込みエラー: {state.error?.message}</span>
      </div>
    );
  }
  if (state.roots.length === 0) {
    return <p className="opacity-70 text-xs">フォルダがありません。</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs opacity-70">
        <span>ルートからツリー表示</span>
        <button
          type="button"
          className="btn btn-xs btn-outline"
          onClick={reload}
        >
          再読込
        </button>
      </div>

      <ul className="space-y-0.5 text-xs">
        {state.roots.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            depth={0}
            licensesByFolder={state.licensesByFolder}
            expanded={expanded}
            onToggle={toggle}
            onCreate={onCreate}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </div>
  );
}

interface FolderRowProps {
  folder: EagleFolder;
  depth: number;
  licensesByFolder: Map<string, LicenseEntry>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onCreate: (t: CreateTarget) => void;
  onEdit: (t: EditTarget) => void;
}

function FolderRow({
  folder,
  depth,
  licensesByFolder,
  expanded,
  onToggle,
  onCreate,
  onEdit,
}: FolderRowProps) {
  const entry = licensesByFolder.get(folder.id) ?? null;
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isOpen = expanded.has(folder.id);

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-base-200"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1 min-h-0 h-5"
          onClick={() => hasChildren && onToggle(folder.id)}
          disabled={!hasChildren}
          aria-label={isOpen ? "閉じる" : "開く"}
        >
          {hasChildren ? (isOpen ? "▾" : "▸") : "·"}
        </button>
        <span aria-hidden>📁</span>
        <span className="truncate flex-1">{folder.name}</span>
        {entry?.license && (
          <code className="opacity-60 truncate max-w-[120px]">
            {entry.license.license_id}
          </code>
        )}
        {entry ? (
          <button
            type="button"
            className="btn btn-xs btn-outline"
            disabled={!entry.license}
            onClick={() => {
              if (entry.license) {
                onEdit({ folder, item: entry.item, license: entry.license });
              }
            }}
          >
            ライセンスを編集
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-xs btn-primary"
            onClick={() => onCreate({ folder })}
          >
            ライセンスを作成
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <ul className="space-y-0.5">
          {folder.children?.map((child) => (
            <FolderRow
              key={child.id}
              folder={child}
              depth={depth + 1}
              licensesByFolder={licensesByFolder}
              expanded={expanded}
              onToggle={onToggle}
              onCreate={onCreate}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
