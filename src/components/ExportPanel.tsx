import { useLicenseTree } from "@/hooks/useLicenseTree";
import { isEagleAvailable } from "@/lib/eagleNode";
import {
  type ExportFormat,
  buildReportRows,
  rowsToCsv,
  rowsToMarkdown,
  writeReport,
} from "@/lib/exportReport";
import type { CurrentLibrary } from "@/lib/pluginPaths";
import { useState } from "react";

interface ExportPanelProps {
  rootFolder: EagleFolder;
  library: CurrentLibrary | null;
}

export function ExportPanel({ rootFolder, library }: ExportPanelProps) {
  const tree = useLicenseTree(rootFolder.id);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (tree.status !== "ready") return;
    setExporting(format);
    setError(null);
    try {
      const rows = buildReportRows({
        folders: tree.folders.map((f) => ({
          id: f.id,
          name: f.name,
          parent: f.parent,
        })),
        licensesByFolder: tree.licensesByFolder,
      });
      const content =
        format === "csv"
          ? rowsToCsv(rows)
          : rowsToMarkdown(rows, {
              libraryName: library?.name,
              rootFolderName: rootFolder.name,
            });
      const filePath = await writeReport(format, content);
      setLastPath(filePath);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  const openContaining = () => {
    if (!lastPath || !isEagleAvailable()) return;
    eagle.shell.openPath(lastPath);
  };

  return (
    <section className="space-y-3">
      <p className="text-xs opacity-70">
        フォルダツリーと各フォルダのライセンスを書き出します。出力先は
        <code className="ml-1">.eagle-license-manager/exports/</code>。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={tree.status !== "ready" || exporting !== null}
          onClick={() => handleExport("csv")}
          className="rounded border border-current/20 px-3 py-1 text-xs disabled:opacity-40"
        >
          {exporting === "csv" ? "書き出し中…" : "CSV を出力"}
        </button>
        <button
          type="button"
          disabled={tree.status !== "ready" || exporting !== null}
          onClick={() => handleExport("md")}
          className="rounded border border-current/20 px-3 py-1 text-xs disabled:opacity-40"
        >
          {exporting === "md" ? "書き出し中…" : "Markdown を出力"}
        </button>
        <button
          type="button"
          disabled={!lastPath}
          onClick={openContaining}
          className="rounded border border-current/20 px-3 py-1 text-xs disabled:opacity-40"
        >
          ファイルを開く
        </button>
      </div>
      {lastPath && (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 break-all">
          書き出し成功: <code>{lastPath}</code>
        </p>
      )}
      {error && (
        <p className="text-xs text-red-700 dark:text-red-300">
          エラー: {error}
        </p>
      )}
      {tree.status === "error" && tree.error && (
        <p className="text-xs text-red-700 dark:text-red-300">
          ツリー読み込みエラー: {tree.error.message}
        </p>
      )}
    </section>
  );
}
