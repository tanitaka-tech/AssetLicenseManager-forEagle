import { useLicenseTree } from "@/hooks/useLicenseTree";
import {
  type ResolvedLicense,
  resolveLicenseForAsset,
} from "@/lib/resolveLicense";
import { useMemo } from "react";

interface AssetLicensePreviewProps {
  rootFolder: EagleFolder;
  items: EagleItem[];
}

const STATUS_LABEL: Record<ResolvedLicense["status"], string> = {
  resolved: "解決済み",
  review_required: "要確認",
  unknown: "不明",
  conflict: "競合",
};

const STATUS_BADGE: Record<ResolvedLicense["status"], string> = {
  resolved: "badge-success",
  review_required: "badge-warning",
  unknown: "badge-neutral",
  conflict: "badge-error",
};

export function AssetLicensePreview({
  rootFolder,
  items,
}: AssetLicensePreviewProps) {
  const tree = useLicenseTree(rootFolder.id);

  const resolved = useMemo(() => {
    if (tree.status !== "ready") return [];
    return items.map((item) =>
      resolveLicenseForAsset(
        { id: item.id, name: item.name, folders: item.folders },
        { folders: tree.folderNodes },
      ),
    );
  }, [items, tree.folderNodes, tree.status]);

  if (items.length === 0) {
    return (
      <p className="opacity-70 text-xs">
        Eagle 上で 1 件以上のアセットを選択するとプレビューが表示されます。
      </p>
    );
  }

  if (tree.status === "loading" || tree.status === "idle") {
    return <p className="opacity-70 text-xs">ライセンスツリーを読み込み中…</p>;
  }

  if (tree.status === "error") {
    return (
      <div role="alert" className="alert alert-error alert-soft text-xs">
        <span>
          ライセンスツリーの読み込みに失敗しました: {tree.error?.message}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs opacity-70">
        <span>選択中アセット {items.length} 件</span>
        <button
          type="button"
          className="btn btn-xs btn-outline"
          onClick={tree.reload}
        >
          再読込
        </button>
      </div>
      <ul className="space-y-2">
        {resolved.map((r) => (
          <li
            key={r.asset_id}
            className="card card-compact bg-base-200 border border-base-300"
          >
            <div className="card-body p-2 space-y-1">
              <header className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">
                  {r.asset_name ?? r.asset_id}
                </span>
                <span
                  className={`badge badge-sm ${STATUS_BADGE[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </header>
              <Body resolved={r} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Body({ resolved }: { resolved: ResolvedLicense }) {
  if (resolved.status === "conflict" && resolved.conflicts) {
    return (
      <div className="text-[11px] space-y-1">
        <p className="opacity-70">複数のライセンスが見つかりました:</p>
        <ul className="list-disc pl-5">
          {resolved.conflicts.map((c) => (
            <li key={c.license_id}>
              <code>{c.license_id}</code> — {c.license_name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (resolved.license) {
    const l = resolved.license;
    return (
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        <Pair label="license_id">
          <code>{l.license_id}</code>
        </Pair>
        <Pair label="解決元">
          {resolved.resolved_from === "asset"
            ? "asset"
            : resolved.resolved_from === "folder"
              ? "folder"
              : "parent_folder"}
        </Pair>
        <Pair label="商用利用">
          {l.permissions.commercial_use ? "可" : "不可"}
        </Pair>
        <Pair label="クレジット">
          {l.requirements.credit_required ? "必要" : "不要"}
        </Pair>
        <Pair label="ステータス">{l.status}</Pair>
        <Pair label="改変">{l.permissions.modification ? "可" : "不可"}</Pair>
      </dl>
    );
  }

  return (
    <p className="text-[11px] opacity-70">
      ライセンスが解決できませんでした（フォルダに `.eagle-license.json`
      が無い、または継承無効）。
    </p>
  );
}

function Pair({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="opacity-60">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}
