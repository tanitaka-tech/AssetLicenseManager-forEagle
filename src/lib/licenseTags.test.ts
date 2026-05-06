import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import {
  buildAssetTags,
  buildFolderTags,
  buildLicenseConfigTags,
  isManagedLicenseTag,
  mergeManagedTags,
} from "@/lib/licenseTags";
import { describe, expect, it } from "vitest";

const pixabayPreset = LICENSE_PRESETS.find(
  (p) => p.key === "pixabay-content-license",
);
if (!pixabayPreset) throw new Error("pixabay preset must exist");
const pixabay = pixabayPreset.build();

describe("buildLicenseConfigTags", () => {
  it("includes the required tag set per spec §8.1", () => {
    const tags = buildLicenseConfigTags(pixabay);
    expect(tags).toContain("license-config");
    expect(tags).toContain("scope:folder");
    expect(tags).toContain("license:pixabay-content-license");
    expect(tags).toContain("commercial:ok");
    expect(tags).toContain("credit:not-required");
    expect(tags).toContain("license-status:active");
  });
});

describe("buildFolderTags", () => {
  it("includes inherit-license tag", () => {
    const tags = buildFolderTags(pixabay);
    expect(tags).toContain("inherit-license:true");
    expect(tags).toContain("license:pixabay-content-license");
  });
});

describe("buildAssetTags", () => {
  it("prepends license:inherited when inherited", () => {
    const tags = buildAssetTags(pixabay);
    expect(tags[0]).toBe("license:inherited");
  });

  it("omits license:inherited when not inherited", () => {
    const tags = buildAssetTags(pixabay, { inherited: false });
    expect(tags).not.toContain("license:inherited");
  });
});

describe("mergeManagedTags", () => {
  it("replaces managed tags but keeps user tags", () => {
    const existing = ["favorite", "license:old", "commercial:ng", "my-tag"];
    const managed = buildAssetTags(pixabay);
    const result = mergeManagedTags(existing, managed);
    expect(result).toContain("favorite");
    expect(result).toContain("my-tag");
    expect(result).not.toContain("license:old");
    expect(result).not.toContain("commercial:ng");
    expect(result).toContain("commercial:ok");
  });

  it("does not duplicate identical managed tags", () => {
    const result = mergeManagedTags(
      ["license:pixabay-content-license"],
      ["license:pixabay-content-license", "commercial:ok"],
    );
    expect(
      result.filter((t) => t === "license:pixabay-content-license"),
    ).toHaveLength(1);
  });
});

describe("isManagedLicenseTag", () => {
  it("recognizes managed tag prefixes", () => {
    expect(isManagedLicenseTag("license-config")).toBe(true);
    expect(isManagedLicenseTag("license:foo")).toBe(true);
    expect(isManagedLicenseTag("commercial:ok")).toBe(true);
    expect(isManagedLicenseTag("credit:required")).toBe(true);
    expect(isManagedLicenseTag("scope:folder")).toBe(true);
    expect(isManagedLicenseTag("license-status:active")).toBe(true);
    expect(isManagedLicenseTag("inherit-license:true")).toBe(true);
    expect(isManagedLicenseTag("favorite")).toBe(false);
  });
});
