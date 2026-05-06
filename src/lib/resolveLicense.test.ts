import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import { resolveLicenseForAsset } from "@/lib/resolveLicense";
import type { EagleLicense } from "@/types/license";
import { describe, expect, it } from "vitest";

function buildPreset(key: string): EagleLicense {
  const preset = LICENSE_PRESETS.find((p) => p.key === key);
  if (!preset) throw new Error(`Preset ${key} must exist`);
  return preset.build();
}

const cc0 = buildPreset("cc0");
const ccBy = buildPreset("cc-by-4.0");
const pixabay = buildPreset("pixabay-content-license");

function nodes(
  input: Array<{
    id: string;
    parent?: string;
    license?: EagleLicense | null;
  }>,
) {
  return new Map(
    input.map((n) => [
      n.id,
      { id: n.id, name: n.id, parent: n.parent, license: n.license ?? null },
    ]),
  );
}

describe("resolveLicenseForAsset", () => {
  it("returns unknown when no license is found", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["f1"] },
      { folders: nodes([{ id: "f1" }]) },
    );
    expect(result.status).toBe("unknown");
  });

  it("resolves from the asset's folder", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["f1"] },
      { folders: nodes([{ id: "f1", license: cc0 }]) },
    );
    expect(result.status).toBe("resolved");
    expect(result.resolved_from).toBe("folder");
    expect(result.license?.license_id).toBe(cc0.license_id);
  });

  it("climbs to parent folders when child folder has no license", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["child"] },
      {
        folders: nodes([
          { id: "child", parent: "parent" },
          { id: "parent", license: ccBy },
        ]),
      },
    );
    expect(result.status).toBe("resolved");
    expect(result.resolved_from).toBe("parent_folder");
    expect(result.license?.license_id).toBe(ccBy.license_id);
  });

  it("treats different license_ids in multiple folders as conflict", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["f1", "f2"] },
      {
        folders: nodes([
          { id: "f1", license: cc0 },
          { id: "f2", license: pixabay },
        ]),
      },
    );
    expect(result.status).toBe("conflict");
    expect(result.conflicts).toHaveLength(2);
  });

  it("does not flag conflict when multiple folders share the same license_id", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["f1", "f2"] },
      {
        folders: nodes([
          { id: "f1", license: cc0 },
          { id: "f2", license: cc0 },
        ]),
      },
    );
    expect(result.status).toBe("resolved");
  });

  it("inherits license from parent folder when child has none", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["child"] },
      {
        folders: nodes([
          { id: "child", parent: "parent" },
          { id: "parent", license: ccBy },
        ]),
      },
    );
    expect(result.status).toBe("resolved");
    expect(result.resolved_from).toBe("parent_folder");
  });

  it("prefers asset-level license over folder license", () => {
    const result = resolveLicenseForAsset(
      { id: "a1", folders: ["f1"] },
      {
        folders: nodes([{ id: "f1", license: cc0 }]),
        assetLicense: () => ccBy,
      },
    );
    expect(result.status).toBe("resolved");
    expect(result.resolved_from).toBe("asset");
    expect(result.license?.license_id).toBe(ccBy.license_id);
  });
});
