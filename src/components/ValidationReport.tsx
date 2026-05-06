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
      <p className="text-xs text-red-700 dark:text-red-300">
        検証に失敗しました: {tree.error?.message}
      </p>
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
        <span>
          フォルダ {totals.total} / ライセンスあり {totals.withLicense} / エラー{" "}
          {totals.issues} / 警告 {totals.warnings}
        </span>
        <button
          type="button"
          className="rounded border border-current/20 px-2 py-0.5"
          onClick={tree.reload}
        >
          再検証
        </button>
      </header>
      <ul className="space-y-1">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded border border-current/10 px-2 py-1 text-xs"
          >
            <header className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{e.name}</span>
              <span
                className={`rounded px-2 py-0.5 text-[11px] ${
                  e.has_license
                    ? e.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {e.has_license ? (e.status ?? "—") : "ライセンスなし"}
              </span>
            </header>
            {(e.issues.length > 0 || e.warnings.length > 0) && (
              <ul className="mt-1 space-y-0.5 text-[11px] opacity-80">
                {e.issues.map((m) => (
                  <li
                    key={`${e.id}-i-${m}`}
                    className="text-red-700 dark:text-red-300"
                  >
                    ⚠ {m}
                  </li>
                ))}
                {e.warnings.map((m) => (
                  <li
                    key={`${e.id}-w-${m}`}
                    className="text-amber-700 dark:text-amber-300"
                  >
                    • {m}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
