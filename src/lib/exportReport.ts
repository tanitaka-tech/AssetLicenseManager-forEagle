import { getFs, getPath } from "@/lib/eagleNode";
import { ensureDir, exportsDir } from "@/lib/pluginPaths";
import type { EagleLicense } from "@/types/license";

export interface ReportRow {
  folder_id: string;
  folder_name: string;
  parent_id: string | null;
  has_license: boolean;
  license_id: string | null;
  license_name: string | null;
  commercial_use: boolean | null;
  modification: boolean | null;
  credit_required: boolean | null;
  credit_text: string | null;
  source_url: string | null;
  evidence_url: string | null;
  notes: string | null;
}

export interface ReportSource {
  folders: Array<{
    id: string;
    name: string;
    parent?: string;
  }>;
  licensesByFolder: Map<string, EagleLicense>;
}

export function buildReportRows(source: ReportSource): ReportRow[] {
  return source.folders.map((folder) => {
    const license = source.licensesByFolder.get(folder.id);
    if (!license) {
      return {
        folder_id: folder.id,
        folder_name: folder.name,
        parent_id: folder.parent ?? null,
        has_license: false,
        license_id: null,
        license_name: null,
        commercial_use: null,
        modification: null,
        credit_required: null,
        credit_text: null,
        source_url: null,
        evidence_url: null,
        notes: null,
      };
    }
    return {
      folder_id: folder.id,
      folder_name: folder.name,
      parent_id: folder.parent ?? null,
      has_license: true,
      license_id: license.license_id,
      license_name: license.license_name,
      commercial_use: license.permissions.commercial_use,
      modification: license.permissions.modification,
      credit_required: license.requirements.credit_required,
      credit_text: license.requirements.credit_text,
      source_url: license.source.url,
      evidence_url: license.evidence.license_page_url,
      notes: license.evidence.notes || null,
    };
  });
}

const CSV_HEADERS: Array<keyof ReportRow> = [
  "folder_id",
  "folder_name",
  "parent_id",
  "has_license",
  "license_id",
  "license_name",
  "commercial_use",
  "modification",
  "credit_required",
  "credit_text",
  "source_url",
  "evidence_url",
  "notes",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: ReportRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    const cells = CSV_HEADERS.map((key) => csvEscape(row[key]));
    lines.push(cells.join(","));
  }
  return `${lines.join("\n")}\n`;
}

function mdEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br/>");
}

export function rowsToMarkdown(
  rows: ReportRow[],
  options: { libraryName?: string; rootFolderName?: string } = {},
): string {
  const lines: string[] = [];
  lines.push("# Eagle License Report");
  lines.push("");
  if (options.libraryName) {
    lines.push(`- Library: **${mdEscape(options.libraryName)}**`);
  }
  if (options.rootFolderName) {
    lines.push(`- Root folder: **${mdEscape(options.rootFolderName)}**`);
  }
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    "| Folder | License ID | Name | Commercial | Credit | Source |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of rows) {
    const cells = [
      mdEscape(row.folder_name),
      row.license_id ? `\`${mdEscape(row.license_id)}\`` : "—",
      mdEscape(row.license_name) || "—",
      row.commercial_use === null ? "—" : row.commercial_use ? "可" : "不可",
      row.credit_required === null
        ? "—"
        : row.credit_required
          ? "必要"
          : "不要",
      row.source_url ? `[link](${mdEscape(row.source_url)})` : "—",
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return `${lines.join("\n")}\n`;
}

export type ExportFormat = "csv" | "md";

export async function writeReport(
  format: ExportFormat,
  content: string,
  basename = "eagle-license-report",
): Promise<string> {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) {
    throw new Error("Node.js fs/path API が利用できません");
  }
  const dir = exportsDir();
  await ensureDir(dir);
  const stamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const filename = `${basename}-${stamp}.${format}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, content, "utf-8");
  return fullPath;
}
