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
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={tree.status !== "ready" || exporting !== null}
          onClick={() => handleExport("csv")}
          className="btn btn-sm btn-outline"
        >
          {exporting === "csv" ? "書き出し中…" : "CSV を出力"}
        </button>
        <button
          type="button"
          disabled={tree.status !== "ready" || exporting !== null}
          onClick={() => handleExport("md")}
          className="btn btn-sm btn-outline"
        >
          {exporting === "md" ? "書き出し中…" : "Markdown を出力"}
        </button>
        <button
          type="button"
          disabled={!lastPath}
          onClick={openContaining}
          className="btn btn-sm btn-outline"
        >
          ファイルを開く
        </button>
      </div>
      {lastPath && (
        <div role="alert" className="alert alert-success alert-soft text-xs">
          <span className="break-all">
            書き出し成功: <code>{lastPath}</code>
          </span>
        </div>
      )}
      {error && (
        <div role="alert" className="alert alert-error alert-soft text-xs">
          <span>エラー: {error}</span>
        </div>
      )}
      {tree.status === "error" && tree.error && (
        <div role="alert" className="alert alert-error alert-soft text-xs">
          <span>ツリー読み込みエラー: {tree.error.message}</span>
        </div>
      )}
    </section>
  );
}
