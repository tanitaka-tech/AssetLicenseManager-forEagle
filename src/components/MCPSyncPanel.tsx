import { useLicenseTree } from "@/hooks/useLicenseTree";
import { isEagleAvailable } from "@/lib/eagleNode";
import {
  type McpApplyReport,
  applyInboxPatches,
  archiveInbox,
  buildSnapshot,
  readInbox,
  writeSnapshot,
} from "@/lib/mcpSync";
import type { CurrentLibrary } from "@/lib/pluginPaths";
import { useState } from "react";

interface MCPSyncPanelProps {
  rootFolder: EagleFolder;
  library: CurrentLibrary | null;
  onAfterImport?: () => void;
}

export function MCPSyncPanel({
  rootFolder,
  library,
  onAfterImport,
}: MCPSyncPanelProps) {
  const tree = useLicenseTree(rootFolder.id);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snapshotPath, setSnapshotPath] = useState<string | null>(null);
  const [report, setReport] = useState<McpApplyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (tree.status !== "ready") return;
    setExporting(true);
    setError(null);
    try {
      if (!isEagleAvailable()) {
        throw new Error("Eagle Plugin API が利用できません");
      }
      const items = await eagle.item.get({ folders: [rootFolder.id] });
      const assets = items
        .filter((it) => !it.tags?.includes("license-config"))
        .map((it) => ({ id: it.id, name: it.name, folders: it.folders }));
      const snapshot = buildSnapshot({
        rootFolder: { id: rootFolder.id, name: rootFolder.name },
        folders: tree.folders.map((f) => ({
          id: f.id,
          name: f.name,
          parent: f.parent,
        })),
        licensesByFolder: tree.licensesByFolder,
        assets,
        library,
      });
      const path = await writeSnapshot(snapshot);
      setSnapshotPath(path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setReport(null);
    try {
      const inbox = await readInbox();
      if (!inbox) {
        setError("inbox.json が見つからない、または形式が不正です。");
        return;
      }
      const result = await applyInboxPatches(inbox);
      setReport(result);
      if (result.applied > 0) {
        await archiveInbox();
        tree.reload();
        onAfterImport?.();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="space-y-3 text-xs">
      <p className="opacity-70">
        MCP サーバーとの双方向同期は、ライブラリ配下の
        <code className="mx-1">.eagle-license-manager/mcp/</code>
        ディレクトリ経由で行います。
      </p>
      <ul className="list-disc pl-5 opacity-70 space-y-0.5">
        <li>
          エクスポート → <code>snapshot.json</code> を生成
        </li>
        <li>
          インポート → <code>inbox.json</code>{" "}
          のパッチを適用し、処理済みファイルへリネーム
        </li>
      </ul>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={tree.status !== "ready" || exporting}
          onClick={handleExport}
          className="btn btn-sm btn-outline"
        >
          {exporting ? "書き出し中…" : "snapshot.json を書き出し"}
        </button>
        <button
          type="button"
          disabled={importing}
          onClick={handleImport}
          className="btn btn-sm btn-outline"
        >
          {importing ? "適用中…" : "inbox.json を適用"}
        </button>
      </div>
      {snapshotPath && (
        <div role="alert" className="alert alert-success alert-soft">
          <span className="break-all">
            snapshot 書き出し: <code>{snapshotPath}</code>
          </span>
        </div>
      )}
      {report && <ApplyReportView report={report} />}
      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>エラー: {error}</span>
        </div>
      )}
    </section>
  );
}

function ApplyReportView({ report }: { report: McpApplyReport }) {
  return (
    <div className="card card-compact bg-base-200 border border-base-300">
      <div className="card-body p-2 space-y-1">
        <div className="flex flex-wrap gap-1">
          <span className="badge badge-sm badge-success">
            適用 {report.applied}
          </span>
          <span className="badge badge-sm badge-ghost">
            スキップ {report.skipped}
          </span>
          <span className="badge badge-sm badge-error">
            失敗 {report.failed.length}
          </span>
        </div>
        {report.failed.length > 0 && (
          <ul className="text-error space-y-0.5">
            {report.failed.map((f) => (
              <li key={`${f.index}-${f.patch.type}`}>
                [{f.index}] {f.patch.type}: {f.error}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
