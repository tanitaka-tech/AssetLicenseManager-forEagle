import type { EagleTheme } from "@/hooks/useEaglePlugin";
import { coerceToLicense } from "@/lib/defaultLicense";
import { getFs, isEagleAvailable } from "@/lib/eagleNode";
import type { EagleLicense } from "@/types/license";
import { LICENSE_SCHEMA_VERSION } from "@/types/license";
import yaml from "js-yaml";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type InspectorState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "license"; item: EagleItem; license: EagleLicense }
  | { kind: "raw"; item: EagleItem; text: string }
  | { kind: "error"; message: string };

function isLicenseLike(parsed: unknown): boolean {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as { schema?: unknown }).schema === LICENSE_SCHEMA_VERSION
  );
}

async function loadInspectorState(): Promise<InspectorState> {
  if (!isEagleAvailable()) return { kind: "empty" };
  const items = await eagle.item.getSelected();
  const item = items[0];
  if (!item) return { kind: "empty" };

  const fs = getFs();
  if (!fs || !item.filePath) {
    return {
      kind: "error",
      message: "ファイルパスを取得できませんでした",
    };
  }

  let text: string;
  try {
    text = await fs.readFile(item.filePath, "utf-8");
  } catch (e) {
    return {
      kind: "error",
      message: `読み込みに失敗しました: ${(e as Error).message}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch {
    return { kind: "raw", item, text };
  }

  if (isLicenseLike(parsed)) {
    return { kind: "license", item, license: coerceToLicense(parsed) };
  }
  return { kind: "raw", item, text };
}

function openExternal(url: string): void {
  if (!url) return;
  if (typeof eagle !== "undefined" && eagle.shell?.openExternal) {
    eagle.shell.openExternal(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-0.5 py-1 border-b border-base-300 last:border-b-0">
      <div className="text-xs text-base-content/60 pt-0.5">{label}</div>
      <div className="text-sm break-words min-w-0">{children}</div>
    </div>
  );
}

interface UrlValueProps {
  value: string | null | undefined;
}

function UrlValue({ value }: UrlValueProps) {
  if (!value) return <span className="text-base-content/40">—</span>;
  if (!isHttpUrl(value)) return <span>{value}</span>;
  return (
    <button
      type="button"
      onClick={() => openExternal(value)}
      className="link link-primary inline-flex items-center gap-1 text-left break-all"
      title={value}
    >
      <span className="break-all">{value}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </button>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`badge badge-sm ${value ? "badge-success" : "badge-ghost"}`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

interface LicenseViewProps {
  license: EagleLicense;
}

function LicenseView({ license }: LicenseViewProps) {
  return (
    <div className="space-y-3 p-3">
      <div>
        <div className="text-xs text-base-content/60">License</div>
        <div className="text-base font-semibold break-words">
          {license.license_name}
        </div>
        <div className="text-[10px] text-base-content/50 break-all font-mono mt-0.5">
          {license.license_id}
        </div>
      </div>

      <section>
        <div className="text-xs font-medium text-base-content/70 mb-1">
          Source
        </div>
        <FieldRow label="Provider">{license.source.provider}</FieldRow>
        <FieldRow label="URL">
          <UrlValue value={license.source.url} />
        </FieldRow>
        <FieldRow label="Author">
          {license.source.author ?? (
            <span className="text-base-content/40">—</span>
          )}
        </FieldRow>
      </section>

      <section>
        <div className="text-xs font-medium text-base-content/70 mb-1">
          Permissions
        </div>
        <FieldRow label="Commercial">
          <BoolBadge value={license.permissions.commercial_use} />
        </FieldRow>
        <FieldRow label="Modification">
          <BoolBadge value={license.permissions.modification} />
        </FieldRow>
      </section>

      <section>
        <div className="text-xs font-medium text-base-content/70 mb-1">
          Requirements
        </div>
        <FieldRow label="Credit">
          <BoolBadge value={license.requirements.credit_required} />
        </FieldRow>
        {license.requirements.credit_text && (
          <FieldRow label="Credit text">
            {license.requirements.credit_text}
          </FieldRow>
        )}
      </section>

      <section>
        <div className="text-xs font-medium text-base-content/70 mb-1">
          Restrictions
        </div>
        <FieldRow label="Stock redist.">
          <BoolBadge value={license.restrictions.redistribution_as_stock} />
        </FieldRow>
      </section>

      <section>
        <div className="text-xs font-medium text-base-content/70 mb-1">
          Evidence
        </div>
        <FieldRow label="Captured">{license.evidence.captured_at}</FieldRow>
        <FieldRow label="Page URL">
          <UrlValue value={license.evidence.license_page_url} />
        </FieldRow>
        {license.evidence.notes && (
          <FieldRow label="Notes">
            <span className="whitespace-pre-wrap">
              {license.evidence.notes}
            </span>
          </FieldRow>
        )}
      </section>
    </div>
  );
}

function RawYamlView({ text }: { text: string }) {
  return (
    <div className="p-3">
      <div className="text-xs text-base-content/60 mb-1">YAML</div>
      <pre className="text-xs bg-base-200 rounded p-2 whitespace-pre-wrap break-words font-mono">
        {text}
      </pre>
    </div>
  );
}

export default function LicenseInspector() {
  const [state, setState] = useState<InspectorState>({ kind: "loading" });
  const [theme, setTheme] = useState<EagleTheme>("LIGHT");

  const reload = useCallback(async () => {
    try {
      const next = await loadInspectorState();
      setState(next);
    } catch (e) {
      setState({
        kind: "error",
        message: (e as Error).message ?? String(e),
      });
    }
  }, []);

  useEffect(() => {
    if (!isEagleAvailable()) {
      setState({ kind: "empty" });
      return;
    }
    const handleThemeChange = (next: unknown) => {
      if (next === "Auto") {
        setTheme(eagle.app.isDarkColors() ? "GRAY" : "LIGHT");
        return;
      }
      setTheme(next as EagleTheme);
    };
    eagle.onPluginCreate(async () => {
      handleThemeChange(eagle.app.theme);
      await reload();
    });
    eagle.onThemeChanged(handleThemeChange);
    void reload();
  }, [reload]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-base-100 text-base-content"
    >
      {state.kind === "loading" && (
        <div className="p-3 text-sm text-base-content/60">読み込み中…</div>
      )}
      {state.kind === "empty" && (
        <div className="p-3 text-sm text-base-content/60">
          選択中のアイテムがありません
        </div>
      )}
      {state.kind === "error" && (
        <div className="p-3 text-sm text-error">{state.message}</div>
      )}
      {state.kind === "license" && <LicenseView license={state.license} />}
      {state.kind === "raw" && <RawYamlView text={state.text} />}
    </div>
  );
}
