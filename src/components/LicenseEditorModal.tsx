import { LicenseForm } from "@/components/LicenseForm";
import { createEmptyLicense } from "@/lib/defaultLicense";
import {
  type LicenseLookupResult,
  type SaveLicenseOptions,
  saveLicense,
} from "@/lib/licenseService";
import { syncTags } from "@/lib/syncTags";
import type { EagleLicense } from "@/types/license";
import { useEffect, useRef, useState } from "react";

export type EditorMode =
  | { kind: "create"; folder: EagleFolder }
  | { kind: "edit"; folder: EagleFolder; item: EagleItem; license: EagleLicense };

interface LicenseEditorModalProps {
  open: boolean;
  mode: EditorMode | null;
  onClose: () => void;
  onSaved: (saved: LicenseLookupResult) => void;
}

export function LicenseEditorModal({
  open,
  mode,
  onClose,
  onSaved,
}: LicenseEditorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<EagleLicense | null>(null);
  const [autoBackup, setAutoBackup] = useState(true);
  const [recordHistory, setRecordHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (mode?.kind === "create") setDraft(createEmptyLicense(mode.folder.name));
    else if (mode?.kind === "edit") setDraft(mode.license);
    else setDraft(null);
  }, [open, mode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!mode) return null;

  const title =
    mode.kind === "create"
      ? `ライセンスを作成 — ${mode.folder.name}`
      : `ライセンスを編集 — ${mode.folder.name}`;

  const handleSave = async (next: EagleLicense) => {
    setSaving(true);
    setError(null);
    const options: SaveLicenseOptions = {
      backup: autoBackup,
      recordHistory,
    };
    try {
      const existingItem = mode.kind === "edit" ? mode.item : null;
      const saved = await saveLicense(
        mode.folder.id,
        next,
        existingItem,
        options,
      );
      try {
        await syncTags(mode.folder, saved.license);
      } catch (e) {
        console.warn("Tag sync failed:", e);
      }
      onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-3xl w-[90vw]">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3 space-y-2 mb-3">
          <legend className="fieldset-legend text-xs">保存オプション</legend>
          <p className="text-xs opacity-70">
            保存時、ライセンスファイルを置いたフォルダの自動タグ設定にライセンスタグを反映します。
          </p>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
            />
            <span>更新前に自動バックアップを作成</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={recordHistory}
              onChange={(e) => setRecordHistory(e.target.checked)}
            />
            <span>変更履歴に追記</span>
          </label>
        </fieldset>

        {error && (
          <div role="alert" className="alert alert-error alert-soft text-xs mb-3">
            <span>保存に失敗しました: {error}</span>
          </div>
        )}

        {draft && (
          <LicenseForm
            value={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}

        {saving && <p className="text-xs opacity-70 mt-2">保存中…</p>}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="閉じる">
          close
        </button>
      </form>
    </dialog>
  );
}
