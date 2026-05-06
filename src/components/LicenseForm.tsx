import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import {
  buildAssetTags,
  buildFolderTags,
  buildLicenseConfigTags,
} from "@/lib/licenseTags";
import { collectLicenseWarnings } from "@/lib/licenseWarnings";
import { validateLicense } from "@/lib/validateLicense";
import type {
  AiTrainingPolicy,
  EagleLicense,
  LicenseStatus,
} from "@/types/license";
import { useMemo, useState } from "react";

const STATUS_OPTIONS: LicenseStatus[] = [
  "active",
  "deprecated",
  "review_required",
  "unknown",
];

const AI_TRAINING_OPTIONS: AiTrainingPolicy[] = [
  "allowed",
  "prohibited",
  "unknown",
];

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
  const [showJsonPreview, setShowJsonPreview] = useState(true);

  const validation = useMemo(() => validateLicense(value), [value]);
  const warnings = useMemo(() => collectLicenseWarnings(value), [value]);
  const json = useMemo(() => JSON.stringify(value, null, 2), [value]);

  const tags = useMemo(
    () => ({
      config: buildLicenseConfigTags(value),
      folder: buildFolderTags(value),
      asset: buildAssetTags(value),
    }),
    [value],
  );

  const update = <K extends keyof EagleLicense>(
    key: K,
    next: EagleLicense[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

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
            className="w-full rounded border border-current/20 bg-transparent px-2 py-1"
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

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="col-span-2 text-xs font-semibold opacity-70">
          ライセンス基本情報
        </legend>
        <Field label="ライセンスID">
          <input
            className={inputCls}
            value={value.license_id}
            onChange={(e) => update("license_id", e.target.value)}
          />
        </Field>
        <Field label="ライセンス名">
          <input
            className={inputCls}
            value={value.license_name}
            onChange={(e) => update("license_name", e.target.value)}
          />
        </Field>
        <Field label="提供元">
          <input
            className={inputCls}
            value={value.source.provider}
            onChange={(e) =>
              updateNested("source", { provider: e.target.value })
            }
          />
        </Field>
        <Field label="元URL">
          <input
            className={inputCls}
            value={value.source.url}
            onChange={(e) => updateNested("source", { url: e.target.value })}
          />
        </Field>
        <Field label="作者名">
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
        <Field label="ステータス">
          <select
            className={inputCls}
            value={value.status}
            onChange={(e) => update("status", e.target.value as LicenseStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="col-span-2 text-xs font-semibold opacity-70">
          利用可否
        </legend>
        <Toggle
          label="商用利用"
          checked={value.permissions.commercial_use}
          onChange={(v) => updateNested("permissions", { commercial_use: v })}
        />
        <Toggle
          label="改変"
          checked={value.permissions.modification}
          onChange={(v) => updateNested("permissions", { modification: v })}
        />
        <Toggle
          label="YouTube利用"
          checked={value.permissions.youtube}
          onChange={(v) => updateNested("permissions", { youtube: v })}
        />
        <Toggle
          label="クライアントワーク"
          checked={value.permissions.client_work}
          onChange={(v) => updateNested("permissions", { client_work: v })}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold opacity-70">クレジット</legend>
        <Toggle
          label="クレジット表記が必要"
          checked={value.requirements.credit_required}
          onChange={(v) => updateNested("requirements", { credit_required: v })}
        />
        <Field label="クレジット表記">
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
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="col-span-2 text-xs font-semibold opacity-70">
          制限
        </legend>
        <Toggle
          label="素材集としての再配布禁止"
          checked={value.restrictions.redistribution_as_stock}
          onChange={(v) =>
            updateNested("restrictions", { redistribution_as_stock: v })
          }
        />
        <Field label="AI学習利用">
          <select
            className={inputCls}
            value={value.restrictions.ai_training}
            onChange={(e) =>
              updateNested("restrictions", {
                ai_training: e.target.value as AiTrainingPolicy,
              })
            }
          >
            {AI_TRAINING_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="col-span-2 text-xs font-semibold opacity-70">
          証跡
        </legend>
        <Field label="ライセンス確認日">
          <input
            type="date"
            className={inputCls}
            value={value.evidence.captured_at}
            onChange={(e) =>
              updateNested("evidence", { captured_at: e.target.value })
            }
          />
        </Field>
        <Field label="ライセンスページURL">
          <input
            className={inputCls}
            value={value.evidence.license_page_url ?? ""}
            onChange={(e) =>
              updateNested("evidence", {
                license_page_url: e.target.value === "" ? null : e.target.value,
              })
            }
          />
        </Field>
        <Field label="証跡アイテムID">
          <input
            className={inputCls}
            value={value.evidence.snapshot_item_id ?? ""}
            onChange={(e) =>
              updateNested("evidence", {
                snapshot_item_id: e.target.value === "" ? null : e.target.value,
              })
            }
          />
        </Field>
        <Field label="メモ" className="col-span-2">
          <textarea
            className={`${inputCls} min-h-[64px]`}
            value={value.evidence.notes}
            onChange={(e) =>
              updateNested("evidence", { notes: e.target.value })
            }
          />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-3 gap-3">
        <legend className="col-span-3 text-xs font-semibold opacity-70">
          継承と優先度
        </legend>
        <Toggle
          label="継承"
          checked={value.inherit}
          onChange={(v) => update("inherit", v)}
        />
        <Field label="優先度 (0-1000)">
          <input
            type="number"
            min={0}
            max={1000}
            className={inputCls}
            value={value.priority}
            onChange={(e) =>
              update("priority", Number.parseInt(e.target.value, 10) || 0)
            }
          />
        </Field>
        <Field label="スコープ">
          <select
            className={inputCls}
            value={value.scope}
            onChange={(e) =>
              update("scope", e.target.value as EagleLicense["scope"])
            }
          >
            <option value="folder">folder</option>
            <option value="asset">asset</option>
          </select>
        </Field>
      </fieldset>

      <ValidationPanel
        valid={validation.valid}
        errors={validation.valid ? [] : validation.errors}
        warnings={warnings}
      />

      <section className="space-y-1">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold opacity-70">
            生成される検索用タグ
          </h3>
        </header>
        <TagPreview label="license-config" tags={tags.config} />
        <TagPreview label="folder" tags={tags.folder} />
        <TagPreview label="asset" tags={tags.asset} />
      </section>

      <section className="space-y-1">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold opacity-70">JSON プレビュー</h3>
          <button
            type="button"
            className="text-xs opacity-70 hover:opacity-100"
            onClick={() => setShowJsonPreview((s) => !s)}
          >
            {showJsonPreview ? "隠す" : "表示"}
          </button>
        </header>
        {showJsonPreview && (
          <pre className="rounded bg-current/5 p-2 text-xs overflow-auto max-h-72">
            {json}
          </pre>
        )}
      </section>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            className="rounded border border-current/20 px-3 py-1"
            onClick={onCancel}
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={!validation.valid}
          className="rounded bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-1 disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded border border-current/20 bg-transparent px-2 py-1";

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
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
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
      <p className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
        検証 OK
      </p>
    );
  }
  return (
    <div className="space-y-1 text-xs">
      {!valid && (
        <ul className="rounded bg-red-500/10 px-2 py-1 text-red-700 dark:text-red-300">
          {errors.map((err, i) => (
            <li key={`${err.instancePath}-${i}`}>
              {err.instancePath || "(root)"}: {err.message}
            </li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="rounded bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
          {warnings.map((w) => (
            <li key={w.code}>{w.message}</li>
          ))}
        </ul>
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
          <code
            key={tag}
            className="rounded bg-current/10 px-1.5 py-0.5 text-[11px]"
          >
            {tag}
          </code>
        ))}
      </div>
    </div>
  );
}
