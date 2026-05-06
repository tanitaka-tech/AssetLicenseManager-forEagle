import { LICENSE_PRESETS, generateLicenseId } from "@/lib/defaultLicense";
import { buildSearchTags } from "@/lib/licenseTags";
import { collectLicenseWarnings } from "@/lib/licenseWarnings";
import { validateLicense } from "@/lib/validateLicense";
import type { EagleLicense } from "@/types/license";
import yaml from "js-yaml";
import { useMemo, useState } from "react";

interface LicenseFormProps {
  value: EagleLicense;
  onChange: (next: EagleLicense) => void;
  onSave?: (license: EagleLicense) => void;
  onCancel?: () => void;
}

export function LicenseForm({
  value,
  onChange,
  onSave,
  onCancel,
}: LicenseFormProps) {
  const [showYamlPreview, setShowYamlPreview] = useState(true);

  const validation = useMemo(() => validateLicense(value), [value]);
  const warnings = useMemo(() => collectLicenseWarnings(value), [value]);
  const yamlText = useMemo(
    () =>
      yaml.dump(value, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
      }),
    [value],
  );

  const searchTags = useMemo(() => buildSearchTags(value), [value]);

  const updateNested = <
    K extends
      | "source"
      | "permissions"
      | "requirements"
      | "restrictions"
      | "evidence",
  >(
    key: K,
    patch: Partial<EagleLicense[K]>,
  ) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  const handlePreset = (presetKey: string) => {
    const preset = LICENSE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    onChange(preset.build());
  };

  const handleNameChange = (nextName: string) => {
    onChange({
      ...value,
      license_name: nextName,
      license_id: generateLicenseId(nextName, value.license_id),
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (validation.valid) onSave?.(value);
      }}
    >
      <section className="space-y-2">
        <label className="block space-y-1 text-xs opacity-70">
          プリセット
          <select
            className="select select-sm select-bordered w-full"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handlePreset(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">プリセットを適用…</option>
            {LICENSE_PRESETS.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">基本情報</legend>
        <div className="grid grid-cols-1 gap-3">
          <Field label="名称">
            <input
              className={inputCls}
              value={value.license_name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </Field>
          <Field label="ID（自動生成: 名称_GUID）">
            <input
              className={`${inputCls} font-mono`}
              value={value.license_id}
              readOnly
            />
          </Field>
          <Field label="配布ページURL (source_url)">
            <input
              className={inputCls}
              value={value.source.url}
              onChange={(e) => updateNested("source", { url: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">作者情報 (author)</legend>
        <div className="grid grid-cols-1 gap-3">
          <Field label="作者名 (author.name)">
            <input
              className={inputCls}
              value={value.source.author ?? ""}
              onChange={(e) =>
                updateNested("source", {
                  author: e.target.value === "" ? null : e.target.value,
                })
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">ライセンス情報 (license)</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ライセンス種別 (license.type)">
            <input
              className={inputCls}
              value={value.source.provider}
              onChange={(e) =>
                updateNested("source", { provider: e.target.value })
              }
            />
          </Field>
          <Field label="ライセンス確認日 (license.checked_at)">
            <input
              type="date"
              className={inputCls}
              value={value.evidence.captured_at}
              onChange={(e) =>
                updateNested("evidence", { captured_at: e.target.value })
              }
            />
          </Field>
          <Field
            label="ライセンス本文URL (license.url)"
            className="col-span-2"
          >
            <input
              className={inputCls}
              value={value.evidence.license_page_url ?? ""}
              onChange={(e) =>
                updateNested("evidence", {
                  license_page_url:
                    e.target.value === "" ? null : e.target.value,
                })
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">利用可否 (permissions)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            label="商用利用 (commercial_use)"
            checked={value.permissions.commercial_use}
            onChange={(v) => updateNested("permissions", { commercial_use: v })}
          />
          <Toggle
            label="加工・改変 (modification)"
            checked={value.permissions.modification}
            onChange={(v) => updateNested("permissions", { modification: v })}
          />
          <Toggle
            label="素材集としての再配布禁止 (redistribution)"
            checked={value.restrictions.redistribution_as_stock}
            onChange={(v) =>
              updateNested("restrictions", { redistribution_as_stock: v })
            }
          />
        </div>
      </fieldset>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">義務 (obligations)</legend>
        <div className="space-y-2">
          <Toggle
            label="クレジット表記が必要 (attribution_required)"
            checked={value.requirements.credit_required}
            onChange={(v) =>
              updateNested("requirements", { credit_required: v })
            }
          />
          <Field label="クレジット表記 (credit_text)">
            <input
              className={inputCls}
              value={value.requirements.credit_text ?? ""}
              onChange={(e) =>
                updateNested("requirements", {
                  credit_text: e.target.value === "" ? null : e.target.value,
                })
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="fieldset bg-base-200 border border-base-300 rounded-box p-3">
        <legend className="fieldset-legend text-xs">メモ (notes)</legend>
        <textarea
          className="textarea textarea-sm textarea-bordered w-full min-h-[64px]"
          value={value.evidence.notes}
          onChange={(e) =>
            updateNested("evidence", { notes: e.target.value })
          }
        />
      </fieldset>

      <ValidationPanel
        valid={validation.valid}
        errors={validation.valid ? [] : validation.errors}
        warnings={warnings}
      />

      <section className="space-y-1">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold opacity-70">
            フォルダ自動タグに設定されるタグ
          </h3>
        </header>
        <TagPreview label="auto-tag" tags={searchTags} />
      </section>

      <section className="space-y-1">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold opacity-70">YAML プレビュー</h3>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => setShowYamlPreview((s) => !s)}
          >
            {showYamlPreview ? "隠す" : "表示"}
          </button>
        </header>
        {showYamlPreview && (
          <pre className="rounded-box bg-base-200 p-2 text-xs overflow-auto max-h-72">
            {yamlText}
          </pre>
        )}
      </section>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onCancel}
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={!validation.valid}
          className="btn btn-sm btn-primary"
        >
          保存
        </button>
      </div>
    </form>
  );
}

const inputCls = "input input-sm input-bordered w-full";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: input is provided via children
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="block text-xs opacity-70">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        className="checkbox checkbox-sm checkbox-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ValidationPanel({
  valid,
  errors,
  warnings,
}: {
  valid: boolean;
  errors: { instancePath: string; message?: string }[];
  warnings: { code: string; message: string }[];
}) {
  if (valid && warnings.length === 0) {
    return (
      <div role="alert" className="alert alert-success text-xs">
        <span>検証 OK</span>
      </div>
    );
  }
  return (
    <div className="space-y-1 text-xs">
      {!valid && (
        <div role="alert" className="alert alert-error">
          <ul className="list-disc pl-5">
            {errors.map((err, i) => (
              <li key={`${err.instancePath}-${i}`}>
                {err.instancePath || "(root)"}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div role="alert" className="alert alert-warning">
          <ul className="list-disc pl-5">
            {warnings.map((w) => (
              <li key={w.code}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TagPreview({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="opacity-60 w-24 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="badge badge-sm badge-ghost font-mono">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
