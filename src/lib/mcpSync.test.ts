import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import {
  MCP_SCHEMA,
  buildSnapshot,
  isMcpInbox,
  isMcpPatch,
} from "@/lib/mcpSync";
import type { EagleLicense } from "@/types/license";
import { describe, expect, it } from "vitest";

function preset(key: string): EagleLicense {
  const p = LICENSE_PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`preset ${key} missing`);
  return p.build();
}

const cc0 = preset("cc0");
const ccBy = preset("cc-by-4.0");

describe("buildSnapshot", () => {
  it("emits schema and resolved entries", () => {
    const snapshot = buildSnapshot({
      rootFolder: { id: "root", name: "Root" },
      folders: [
        { id: "root", name: "Root" },
        { id: "child", name: "Child", parent: "root" },
      ],
      licensesByFolder: new Map([["root", cc0]]),
      assets: [
        { id: "a1", name: "asset.png", folders: ["child"] },
        { id: "a2", folders: ["root"] },
      ],
      library: { name: "Lib", path: "/path/to/lib" },
    });
    expect(snapshot.schema).toBe(MCP_SCHEMA);
    expect(snapshot.folders).toHaveLength(2);
    expect(snapshot.resolved).toHaveLength(2);
    const a1 = snapshot.resolved.find((r) => r.asset_id === "a1");
    expect(a1?.status).toBe("resolved");
    expect(a1?.resolved_from).toBe("parent_folder");
    expect(a1?.license?.license_id).toBe(cc0.license_id);
  });
});

describe("isMcpPatch", () => {
  it("accepts upsert-license with valid license", () => {
    expect(
      isMcpPatch({ type: "upsert-license", folder_id: "f1", license: cc0 }),
    ).toBe(true);
  });

  it("rejects upsert-license with invalid license", () => {
    expect(
      isMcpPatch({
        type: "upsert-license",
        folder_id: "f1",
        license: { ...cc0, license_id: "" },
      }),
    ).toBe(false);
  });

  it("accepts set-tags with string tags", () => {
    expect(
      isMcpPatch({ type: "set-tags", item_id: "i1", tags: ["a", "b"] }),
    ).toBe(true);
  });

  it("rejects unknown patch type", () => {
    expect(isMcpPatch({ type: "bogus", folder_id: "f1" })).toBe(false);
  });
});

describe("isMcpInbox", () => {
  it("accepts a well-formed inbox", () => {
    expect(
      isMcpInbox({
        schema: MCP_SCHEMA,
        patches: [
          { type: "upsert-license", folder_id: "f1", license: ccBy },
          { type: "delete-license", folder_id: "f2" },
        ],
      }),
    ).toBe(true);
  });

  it("rejects bad schema", () => {
    expect(isMcpInbox({ schema: "wrong", patches: [] })).toBe(false);
  });

  it("rejects when any patch is invalid", () => {
    expect(
      isMcpInbox({
        schema: MCP_SCHEMA,
        patches: [
          { type: "upsert-license", folder_id: "f1", license: ccBy },
          { type: "garbage" },
        ],
      }),
    ).toBe(false);
  });
});
