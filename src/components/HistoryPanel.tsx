import { type HistoryEntry, readHistory } from "@/lib/history";
import { useCallback, useEffect, useState } from "react";

interface HistoryPanelProps {
  folderId: string | undefined;
  refreshKey?: number;
}

export function HistoryPanel({ folderId, refreshKey = 0 }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const triggerReload = useCallback(() => setReload((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload/refreshKey are intentional retrigger keys
  useEffect(() => {
    if (!folderId) {
      setEntries(null);
      return;
    }
    let cancelled = false;
    setEntries(null);
    setError(null);
    readHistory(folderId)
      .then((value) => {
        if (!cancelled) setEntries(value);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setEntries([]);
          setError((e as Error).message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [folderId, reload, refreshKey]);

  if (!folderId) {
    return <p className="opacity-70 text-xs">フォルダ未選択</p>;
  }
  if (entries === null) {
    return <p className="opacity-70 text-xs">読み込み中…</p>;
  }
  if (entries.length === 0) {
    return (
      <div className="text-xs opacity-70 space-y-1">
        <p>履歴はまだありません。保存すると追記されます。</p>
        {error && (
          <p className="text-red-700 dark:text-red-300">エラー: {error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <header className="flex items-center justify-between text-xs">
        <span className="opacity-70">{entries.length} 件</span>
        <button
          type="button"
          className="rounded border border-current/20 px-2 py-0.5"
          onClick={triggerReload}
        >
          再読込
        </button>
      </header>
      <ul className="space-y-1 text-[11px]">
        {entries.map((e) => (
          <li
            key={`${e.at}-${e.folder_id}`}
            className="rounded border border-current/10 px-2 py-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono">{e.at}</span>
              <span
                className={`rounded px-1.5 py-0.5 ${
                  e.action === "create"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : e.action === "update"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "bg-red-500/10 text-red-700 dark:text-red-300"
                }`}
              >
                {e.action}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 mt-0.5">
              <span>
                <span className="opacity-60">license_id: </span>
                <code>{e.license_id}</code>
              </span>
              <span>
                <span className="opacity-60">status: </span>
                {e.status}
              </span>
              <span>
                <span className="opacity-60">商用: </span>
                {e.commercial_use ? "可" : "不可"}
              </span>
              <span>
                <span className="opacity-60">クレジット: </span>
                {e.credit_required ? "必要" : "不要"}
              </span>
              {e.backup_path && (
                <span className="col-span-2 truncate opacity-60">
                  backup: <code>{e.backup_path}</code>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
