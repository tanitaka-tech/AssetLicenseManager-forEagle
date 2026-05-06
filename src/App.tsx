import { LicenseForm } from "@/components/LicenseForm";
import { useEaglePlugin } from "@/hooks/useEaglePlugin";
import { createEmptyLicense } from "@/lib/defaultLicense";
import type { EagleLicense } from "@/types/license";
import { useState } from "react";

type Mode = "overview" | "edit";

function App() {
  const { theme, folder } = useEaglePlugin();
  const [mode, setMode] = useState<Mode>("overview");
  const [license, setLicense] = useState<EagleLicense | null>(null);

  const startCreate = () => {
    setLicense(createEmptyLicense());
    setMode("edit");
  };

  const startEdit = () => {
    if (!license) return;
    setMode("edit");
  };

  const handleSave = (next: EagleLicense) => {
    setLicense(next);
    setMode("overview");
  };

  return (
    <main
      data-theme={theme}
      className="mx-auto max-w-2xl p-4 text-sm space-y-4"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-base font-semibold">Asset License Manager</h1>
        <span className="text-xs opacity-60">eagle-license/v1</span>
      </header>

      {!folder ? (
        <p className="opacity-70">フォルダが選択されていません。</p>
      ) : mode === "edit" && license ? (
        <LicenseForm
          value={license}
          onChange={setLicense}
          onSave={handleSave}
          onCancel={() => setMode("overview")}
        />
      ) : (
        <Overview
          folderName={folder.name}
          license={license}
          onCreate={startCreate}
          onEdit={startEdit}
        />
      )}
    </main>
  );
}

function Overview({
  folderName,
  license,
  onCreate,
  onEdit,
}: {
  folderName: string;
  license: EagleLicense | null;
  onCreate: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Item label="対象フォルダ">{folderName}</Item>
        <Item label="ライセンス設定">{license ? "あり" : "なし"}</Item>
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
          </>
        )}
      </dl>

      <div className="flex gap-2">
        {license ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded border border-current/20 px-3 py-1"
          >
            編集
          </button>
        ) : (
          <button
            type="button"
            onClick={onCreate}
            className="rounded bg-current px-3 py-1 text-[var(--color-bg-dark)]"
          >
            ライセンスを作成
          </button>
        )}
      </div>
    </section>
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
    <div className="flex flex-col gap-0.5 rounded bg-current/5 px-2 py-1">
      <dt className="opacity-60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default App;
