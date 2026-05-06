import { useLicenseTree } from "@/hooks/useLicenseTree";
import { collectLicenseWarnings } from "@/lib/licenseWarnings";
import { useMemo } from "react";

interface ValidationReportProps {
  rootFolder: EagleFolder;
}

interface FolderEntry {
  id: string;
  name: string;
  has_license: boolean;
  status?: string;
  warnings: string[];
  issues: string[];
}

export function ValidationReport({ rootFolder }: ValidationReportProps) {
  const tree = useLicenseTree(rootFolder.id);

  const entries = useMemo<FolderEntry[]>(() => {
    if (tree.status !== "ready") return [];
    return tree.folders.map((folder) => {
      const license = tree.licensesByFolder.get(folder.id);
      const issues = tree.issues
        .filter((i) => i.folderId === folder.id)
        .map((i) => i.message);
      const warnings = license
        ? collectLicenseWarnings(license).map((w) => w.message)
        : [];
      return {
        id: folder.id,
        name: folder.name,
        has_license: Boolean(license),
        status: license?.status,
        warnings,
        issues,
      };
    });
  }, [tree.status, tree.folders, tree.licensesByFolder, tree.issues]);

  if (tree.status === "loading" || tree.status === "idle") {
    return <p className="opacity-70 text-xs">検証中…</p>;
  }
  if (tree.status === "error") {
    return (
      <div role="alert" className="alert alert-error alert-soft text-xs">
        <span>検証に失敗しました: {tree.error?.message}</span>
      </div>
    );
  }

  const totals = {
    total: entries.length,
    withLicense: entries.filter((e) => e.has_license).length,
    issues: entries.reduce((n, e) => n + e.issues.length, 0),
    warnings: entries.reduce((n, e) => n + e.warnings.length, 0),
  };

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-1">
          <span className="badge badge-sm badge-ghost">
            フォルダ {totals.total}
          </span>
          <span className="badge badge-sm badge-info">
            ライセンスあり {totals.withLicense}
          </span>
          <span className="badge badge-sm badge-error">
            エラー {totals.issues}
          </span>
          <span className="badge badge-sm badge-warning">
            警告 {totals.warnings}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-xs btn-outline"
          onClick={tree.reload}
        >
          再検証
        </button>
      </header>
      <ul className="space-y-1">
        {entries.map((e) => (
          <li
            key={e.id}
            className="card card-compact bg-base-200 border border-base-300"
          >
            <div className="card-body p-2 text-xs">
              <header className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{e.name}</span>
                <span
                  className={`badge badge-sm ${
                    e.has_license
                      ? e.status === "active"
                        ? "badge-success"
                        : "badge-warning"
                      : "badge-neutral"
                  }`}
                >
                  {e.has_license ? (e.status ?? "—") : "ライセンスなし"}
                </span>
              </header>
              {(e.issues.length > 0 || e.warnings.length > 0) && (
                <ul className="mt-1 space-y-0.5 text-[11px]">
                  {e.issues.map((m) => (
                    <li key={`${e.id}-i-${m}`} className="text-error">
                      ⚠ {m}
                    </li>
                  ))}
                  {e.warnings.map((m) => (
                    <li key={`${e.id}-w-${m}`} className="text-warning">
                      • {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
