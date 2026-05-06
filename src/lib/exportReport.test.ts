import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import { buildReportRows, rowsToCsv, rowsToMarkdown } from "@/lib/exportReport";
import type { EagleLicense } from "@/types/license";
import { describe, expect, it } from "vitest";

function preset(key: string): EagleLicense {
  const p = LICENSE_PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`preset ${key} missing`);
  return p.build();
}

const cc0 = preset("cc0");

describe("buildReportRows", () => {
  it("includes one row per folder", () => {
    const rows = buildReportRows({
      folders: [
        { id: "a", name: "A" },
        { id: "b", name: "B", parent: "a" },
      ],
      licensesByFolder: new Map([["a", cc0]]),
    });
    expect(rows).toHaveLength(2);
    const aRow = rows.find((r) => r.folder_id === "a");
    expect(aRow?.has_license).toBe(true);
    expect(aRow?.license_id).toBe(cc0.license_id);
    const bRow = rows.find((r) => r.folder_id === "b");
    expect(bRow?.has_license).toBe(false);
    expect(bRow?.parent_id).toBe("a");
  });
});

describe("rowsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = rowsToCsv([
      {
        folder_id: "a",
        folder_name: 'A, with "quotes"',
        parent_id: null,
        has_license: true,
        license_id: "cc0",
        license_name: "CC0",
        commercial_use: true,
        modification: true,
        credit_required: false,
        credit_text: null,
        source_url: null,
        evidence_url: null,
        notes: "line1\nline2",
      },
    ]);
    expect(csv.split("\n")[0]).toContain("folder_id,folder_name");
    expect(csv).toContain('"A, with ""quotes"""');
    expect(csv).toContain('"line1\nline2"');
  });
});

describe("rowsToMarkdown", () => {
  it("produces a markdown table", () => {
    const md = rowsToMarkdown(
      [
        {
          folder_id: "a",
          folder_name: "A",
          parent_id: null,
          has_license: true,
          license_id: "cc0-1.0",
          license_name: "CC0",
          commercial_use: true,
          modification: true,
          credit_required: false,
          credit_text: null,
          source_url: "https://example.com",
          evidence_url: null,
          notes: null,
        },
      ],
      { libraryName: "MyLib", rootFolderName: "Root" },
    );
    expect(md).toContain("# Eagle License Report");
    expect(md).toContain("**MyLib**");
    expect(md).toContain("| Folder | License ID");
    expect(md).toContain("`cc0-1.0`");
  });
});
