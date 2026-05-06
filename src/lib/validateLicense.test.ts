import { validateLicense } from "@/lib/validateLicense";
import { describe, expect, it } from "vitest";

const baseLicense = {
  schema: "eagle-license/v1",
  license_id: "pixabay-content-license",
  license_name: "Pixabay Content License",
  source: {
    provider: "Pixabay",
    url: "https://example.com/source",
    author: "Example Artist",
  },
  permissions: {
    commercial_use: true,
    modification: true,
  },
  requirements: {
    credit_required: false,
    credit_text: null,
  },
  restrictions: {
    redistribution_as_stock: true,
  },
  evidence: {
    captured_at: "2026-05-06",
    license_page_url: "https://example.com/license",
    notes: "",
  },
};

describe("validateLicense", () => {
  it("accepts a valid license", () => {
    const result = validateLicense(baseLicense);
    expect(result.valid).toBe(true);
  });

  it("rejects an unknown schema version", () => {
    const result = validateLicense({
      ...baseLicense,
      schema: "eagle-license/v999",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { license_id: _omit, ...missing } = baseLicense;
    const result = validateLicense(missing);
    expect(result.valid).toBe(false);
  });
});
