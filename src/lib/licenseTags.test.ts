import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import {
  COMMERCIAL_TAG,
  CREDIT_TAG,
  LICENSE_CONFIG_TAG,
  LICENSE_NAME_TAG_PREFIX,
  MODIFICATION_TAG,
  buildLicenseConfigTags,
  buildSearchTags,
  isManagedLicenseTag,
  mergeManagedTags,
} from "@/lib/licenseTags";
import { describe, expect, it } from "vitest";

const pixabayPreset = LICENSE_PRESETS.find(
  (p) => p.key === "pixabay-content-license",
);
if (!pixabayPreset) throw new Error("pixabay preset must exist");
const pixabay = pixabayPreset.build();

describe("buildSearchTags", () => {
  it("emits the 4 fixed search tags when conditions are met", () => {
    const tags = buildSearchTags(pixabay);
    expect(tags).toContain(COMMERCIAL_TAG);
    expect(tags).toContain(CREDIT_TAG);
    expect(tags).toContain(MODIFICATION_TAG);
    expect(tags).toContain(`${LICENSE_NAME_TAG_PREFIX}${pixabay.license_name}`);
  });

  it("omits 商用利用可能 when commercial_use is false", () => {
    const license = {
      ...pixabay,
      permissions: { ...pixabay.permissions, commercial_use: false },
    };
    expect(buildSearchTags(license)).not.toContain(COMMERCIAL_TAG);
  });

  it("omits クレジット不要 when credit_required is true", () => {
    const license = {
      ...pixabay,
      requirements: { ...pixabay.requirements, credit_required: true },
    };
    expect(buildSearchTags(license)).not.toContain(CREDIT_TAG);
  });

  it("omits 加工・改変自由 when modification is false", () => {
    const license = {
      ...pixabay,
      permissions: { ...pixabay.permissions, modification: false },
    };
    expect(buildSearchTags(license)).not.toContain(MODIFICATION_TAG);
  });
});

describe("buildLicenseConfigTags", () => {
  it("contains only the license-config marker", () => {
    const tags = buildLicenseConfigTags(pixabay);
    expect(tags).toEqual([LICENSE_CONFIG_TAG]);
  });
});

describe("isManagedLicenseTag", () => {
  it("recognizes managed tags", () => {
    expect(isManagedLicenseTag(LICENSE_CONFIG_TAG)).toBe(true);
    expect(isManagedLicenseTag(COMMERCIAL_TAG)).toBe(true);
    expect(isManagedLicenseTag(CREDIT_TAG)).toBe(true);
    expect(isManagedLicenseTag(MODIFICATION_TAG)).toBe(true);
    expect(isManagedLicenseTag(`${LICENSE_NAME_TAG_PREFIX}foo`)).toBe(true);
    expect(isManagedLicenseTag("favorite")).toBe(false);
  });
});

describe("mergeManagedTags", () => {
  it("replaces managed tags but keeps user tags", () => {
    const existing = ["favorite", `${LICENSE_NAME_TAG_PREFIX}old`, "my-tag"];
    const managed = buildSearchTags(pixabay);
    const result = mergeManagedTags(existing, managed);
    expect(result).toContain("favorite");
    expect(result).toContain("my-tag");
    expect(result).not.toContain(`${LICENSE_NAME_TAG_PREFIX}old`);
    expect(result).toContain(
      `${LICENSE_NAME_TAG_PREFIX}${pixabay.license_name}`,
    );
  });

  it("does not duplicate identical managed tags", () => {
    const result = mergeManagedTags(
      [`${LICENSE_NAME_TAG_PREFIX}${pixabay.license_name}`],
      [`${LICENSE_NAME_TAG_PREFIX}${pixabay.license_name}`, COMMERCIAL_TAG],
    );
    expect(
      result.filter(
        (t) => t === `${LICENSE_NAME_TAG_PREFIX}${pixabay.license_name}`,
      ),
    ).toHaveLength(1);
  });
});
