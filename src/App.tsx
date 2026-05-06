import { AssetLicensePreview } from "@/components/AssetLicensePreview";
import { ExportPanel } from "@/components/ExportPanel";
import {
  type CreateTarget,
  type EditTarget,
  FolderLicenseTree,
} from "@/components/FolderLicenseTree";
import { HistoryPanel } from "@/components/HistoryPanel";
import {
  type EditorMode,
  LicenseEditorModal,
} from "@/components/LicenseEditorModal";
import { LicenseForm } from "@/components/LicenseForm";
import { MCPSyncPanel } from "@/components/MCPSyncPanel";
import { ValidationReport } from "@/components/ValidationReport";
import { useCurrentLibrary } from "@/hooks/useCurrentLibrary";
import { useEaglePlugin } from "@/hooks/useEaglePlugin";
import { useFolderLicense } from "@/hooks/useFolderLicense";
import { createEmptyLicense } from "@/lib/defaultLicense";
import { isEagleAvailable } from "@/lib/eagleNode";
import {
  type LicenseLookupResult,
  type SaveLicenseOptions,
  saveLicense,
} from "@/lib/licenseService";
import { type TagSyncMode, syncTags } from "@/lib/syncTags";
import type { EagleLicense } from "@/types/license";
import { useEffect, useState } from "react";

type Tab =
  | "overview"
  | "tree"
  | "edit"
  | "preview"
  | "validate"
  | "history"
  | "export"
  | "mcp";

const SYNC_OPTIONS: { value: TagSyncMode; label: string }[] = [
  { value: "none", label: "同期しない" },
  { value: "config-only", label: "ライセンス設定ファイルのみ更新" },
  { value: "folder", label: "フォルダタグのみ同期" },
  { value: "asset", label: "配下アセットへ最小タグを同期" },
  {
    value: "asset-replace",
    label: "配下アセットの既存ライセンスタグを置換して同期",
  },
];

function App() {
  const { theme, folder, items, refresh } = useEaglePlugin();
  const library = useCurrentLibrary();
  const folderLicense = useFolderLicense(folder?.id);

  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<EagleLicense | null>(null);
  const [syncMode, setSyncMode] = useState<TagSyncMode>("folder");
  const [autoBackup, setAutoBackup] = useState(true);
  const [recordHistory, setRecordHistory] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveReport, setSaveReport] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);

  const handleCreateFromTree = (t: CreateTarget) => {
    setEditorMode({ kind: "create", folder: t.folder });
    setEditorOpen(true);
  };
  const handleEditFromTree = (t: EditTarget) => {
    setEditorMode({
      kind: "edit",
      folder: t.folder,
      item: t.item,
      license: t.license,
    });
    setEditorOpen(true);
  };
  const handleEditorClose = () => {
    setEditorOpen(false);
  };
  const handleEditorSaved = () => {
    setEditorOpen(false);
    setEditorMode(null);
    setTreeRefreshKey((n) => n + 1);
    setHistoryKey((n) => n + 1);
    folderLicense.reload();
    refresh();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: folder?.id intentionally resets draft on folder change
  useEffect(() => {
    if (folderLicense.status !== "ready") return;
    setDraft(null);
  }, [folderLicense.status, folder?.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [theme]);

  const startCreate = () => {
    setDraft(createEmptyLicense());
    setTab("edit");
  };

  const startEdit = () => {
    if (!folderLicense.result) return;
    setDraft(folderLicense.result.license);
    setTab("edit");
  };

  const handleSave = async (next: EagleLicense) => {
    if (!folder) return;
    setSaving(true);
    setSaveError(null);
    setSaveReport(null);
    const options: SaveLicenseOptions = {
      backup: autoBackup,
      recordHistory,
    };
    try {
      const saved: LicenseLookupResult = await saveLicense(
        folder.id,
        next,
        folderLicense.result?.item ?? null,
        options,
      );
      const sync = await syncTags(folder, saved.license, syncMode);
      setSaveReport(formatSyncResult(sync, options));
      folderLicense.reload();
      refresh();
      setHistoryKey((n) => n + 1);
      setDraft(null);
      setTab("overview");
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      data-theme={theme}
      className="mx-auto max-w-2xl p-4 text-sm space-y-4 bg-base-100 text-base-content min-h-screen"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-base font-semibold">Asset License Manager</h1>
        <div className="text-right text-xs opacity-60 space-y-0">
          <div>eagle-license/v1</div>
          {library && (
            <div className="truncate max-w-[260px]" title={library.path}>
              ライブラリ: <code>{library.name}</code>
            </div>
          )}
        </div>
      </header>

      {!isEagleAvailable() && (
        <div role="alert" className="alert alert-warning alert-soft text-xs">
          <span>
            Eagle Plugin API が検出できません。`npm run build` で生成した dist/
            を Eagle に読み込ませてください。
          </span>
        </div>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        disabledEdit={!draft && tab !== "edit"}
      />

      {tab === "tree" ? (
        <FolderLicenseTree
          refreshKey={treeRefreshKey}
          onCreate={handleCreateFromTree}
          onEdit={handleEditFromTree}
        />
      ) : !folder ? (
        <p className="opacity-70">フォルダが選択されていません。</p>
      ) : tab === "overview" ? (
        <Overview
          folder={folder}
          state={folderLicense}
          saveReport={saveReport}
          onCreate={startCreate}
          onEdit={startEdit}
        />
      ) : tab === "edit" && draft ? (
        <section className="space-y-4">
          <SaveOptions
            syncMode={syncMode}
            onSyncModeChange={setSyncMode}
            autoBackup={autoBackup}
            onAutoBackupChange={setAutoBackup}
            recordHistory={recordHistory}
            onRecordHistoryChange={setRecordHistory}
          />
          {saveError && (
            <div role="alert" className="alert alert-error alert-soft text-xs">
              <span>保存に失敗しました: {saveError}</span>
            </div>
          )}
          <LicenseForm
            value={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={() => {
              setDraft(null);
              setTab("overview");
            }}
          />
          {saving && <p className="text-xs opacity-70">保存中…</p>}
        </section>
      ) : tab === "preview" ? (
        <AssetLicensePreview rootFolder={folder} items={items} />
      ) : tab === "validate" ? (
        <ValidationReport rootFolder={folder} />
      ) : tab === "history" ? (
        <HistoryPanel folderId={folder.id} refreshKey={historyKey} />
      ) : tab === "export" ? (
        <ExportPanel rootFolder={folder} library={library} />
      ) : tab === "mcp" ? (
        <MCPSyncPanel
          rootFolder={folder}
          library={library}
          onAfterImport={() => {
            folderLicense.reload();
            setHistoryKey((n) => n + 1);
          }}
        />
      ) : (
        <p className="opacity-70">編集対象のライセンスが選択されていません。</p>
      )}

      <LicenseEditorModal
        open={editorOpen}
        mode={editorMode}
        onClose={handleEditorClose}
        onSaved={handleEditorSaved}
      />
    </main>
  );
}

function Tabs({
  value,
  onChange,
  disabledEdit,
}: {
  value: Tab;
  onChange: (next: Tab) => void;
  disabledEdit: boolean;
}) {
  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "overview", label: "概要" },
    { key: "tree", label: "ツリー" },
    { key: "edit", label: "編集", disabled: disabledEdit },
    { key: "preview", label: "資産プレビュー" },
    { key: "validate", label: "検証ツリー" },
    { key: "history", label: "履歴" },
    { key: "export", label: "出力" },
    { key: "mcp", label: "MCP" },
  ];
  return (
    <div role="tablist" className="tabs tabs-border text-xs">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          disabled={t.disabled}
          onClick={() => onChange(t.key)}
          className={`tab ${value === t.key ? "tab-active font-semibold" : ""} ${
            t.disabled ? "tab-disabled" : ""
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Overview({
  folder,
  state,
  saveReport,
  onCreate,
  onEdit,
}: {
  folder: EagleFolder;
  state: ReturnType<typeof useFolderLicense>;
  saveReport: string | null;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const license = state.result?.license ?? null;

  return (
    <section className="space-y-3">
      {saveReport && (
        <div role="alert" className="alert alert-success alert-soft text-xs">
          <span>{saveReport}</span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Item label="対象フォルダ">{folder.name}</Item>
        <Item label="ライセンス設定">
          {state.status === "loading"
            ? "読み込み中…"
            : license
              ? "あり"
              : "なし"}
        </Item>
        {license && (
          <>
            <Item label="license_id">
              <code>{license.license_id}</code>
            </Item>
            <Item label="ステータス">{license.status}</Item>
            <Item label="商用利用">
              {license.permissions.commercial_use ? "可" : "不可"}
            </Item>
            <Item label="クレジット">
              {license.requirements.credit_required ? "必要" : "不要"}
            </Item>
            <Item label="継承">{license.inherit ? "ON" : "OFF"}</Item>
            <Item label="優先度">{license.priority}</Item>
          </>
        )}
      </dl>

      {state.status === "error" && state.error && (
        <div role="alert" className="alert alert-error alert-soft text-xs">
          <span>読み込みエラー: {state.error.message}</span>
        </div>
      )}

      <div className="flex gap-2">
        {license ? (
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-sm btn-outline"
          >
            編集
          </button>
        ) : (
          <button
            type="button"
            onClick={onCreate}
            disabled={state.status === "loading"}
            className="btn btn-sm btn-primary"
          >
            ライセンスを作成
          </button>
        )}
        <button
          type="button"
          onClick={state.reload}
          className="btn btn-sm btn-outline"
        >
          再読込
        </button>
      </div>
    </section>
  );
}

function SaveOptions({
  syncMode,
  onSyncModeChange,
  autoBackup,
  onAutoBackupChange,
  recordHistory,
  onRecordHistoryChange,
}: {
  syncMode: TagSyncMode;
  onSyncModeChange: (next: TagSyncMode) => void;
  autoBackup: boolean;
  onAutoBackupChange: (next: boolean) => void;
  recordHistory: boolean;
  onRecordHistoryChange: (next: boolean) => void;
}) {
  return (
    <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3 space-y-2">
      <legend className="fieldset-legend text-xs">保存オプション</legend>
      <label className="block space-y-1 text-xs">
        <span className="block opacity-70">保存後のタグ同期モード</span>
        <select
          className="select select-sm select-bordered w-full"
          value={syncMode}
          onChange={(e) => onSyncModeChange(e.target.value as TagSyncMode)}
        >
          {SYNC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
          checked={autoBackup}
          onChange={(e) => onAutoBackupChange(e.target.checked)}
        />
        <span>更新前に自動バックアップを作成</span>
      </label>
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
          checked={recordHistory}
          onChange={(e) => onRecordHistoryChange(e.target.checked)}
        />
        <span>変更履歴に追記</span>
      </label>
    </fieldset>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-box bg-base-200 px-2 py-1">
      <dt className="opacity-60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatSyncResult(
  sync: ReturnType<typeof syncTags> extends Promise<infer R> ? R : never,
  options: SaveLicenseOptions,
): string {
  const parts: string[] = ["保存しました"];
  if (options.backup) parts.push("バックアップ作成");
  if (options.recordHistory) parts.push("履歴追記");
  if (sync.folderUpdated) parts.push("フォルダタグ同期");
  if (sync.itemsUpdated > 0) {
    parts.push(`アセットタグ ${sync.itemsUpdated}/${sync.itemsScanned} 件更新`);
  }
  if (sync.failures.length > 0) {
    parts.push(`(失敗 ${sync.failures.length} 件)`);
  }
  return `${parts.join(" / ")}。`;
}

export default App;
