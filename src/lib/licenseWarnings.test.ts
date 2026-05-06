import { createEmptyLicense } from "@/lib/defaultLicense";
import { collectLicenseWarnings } from "@/lib/licenseWarnings";
import { describe, expect, it } from "vitest";

describe("collectLicenseWarnings", () => {
  it("warns about missing source url and license page url", () => {
    const warnings = collectLicenseWarnings(createEmptyLicense());
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("source-url-missing");
    expect(codes).toContain("license-page-url-missing");
  });

  it("warns when credit is required but text is empty", () => {
    const license = createEmptyLicense();
    license.requirements.credit_required = true;
    license.requirements.credit_text = null;
    const warnings = collectLicenseWarnings(license);
    expect(warnings.map((w) => w.code)).toContain("credit-text-missing");
  });

  it("does not warn about credit when text is provided", () => {
    const license = createEmptyLicense();
    license.requirements.credit_required = true;
    license.requirements.credit_text = "Author / Title / License";
    const warnings = collectLicenseWarnings(license);
    expect(warnings.map((w) => w.code)).not.toContain("credit-text-missing");
  });
});
