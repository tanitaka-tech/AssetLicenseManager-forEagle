import {
  LICENSE_PRESETS,
  coerceToLicense,
  createEmptyLicense,
  todayIsoDate,
} from "@/lib/defaultLicense";
import { validateLicense } from "@/lib/validateLicense";
import { describe, expect, it } from "vitest";

describe("todayIsoDate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(todayIsoDate(new Date("2026-05-06T12:00:00Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});

describe("createEmptyLicense", () => {
  it("returns a JSON-Schema-valid object", () => {
    const result = validateLicense(createEmptyLicense());
    expect(result.valid).toBe(true);
  });
});

describe("LICENSE_PRESETS", () => {
  it("every preset produces a JSON-Schema-valid license", () => {
    for (const preset of LICENSE_PRESETS) {
      const license = preset.build();
      const result = validateLicense(license);
      expect(
        result.valid,
        `${preset.key}: ${JSON.stringify(result.errors)}`,
      ).toBe(true);
    }
  });
});

describe("coerceToLicense", () => {
  it("returns full defaults when input is null or non-object", () => {
    expect(validateLicense(coerceToLicense(null)).valid).toBe(true);
    expect(validateLicense(coerceToLicense(undefined)).valid).toBe(true);
    expect(validateLicense(coerceToLicense("nope")).valid).toBe(true);
    expect(validateLicense(coerceToLicense([])).valid).toBe(true);
  });

  it("fills in missing fields with defaults", () => {
    const partial = {
      license_name: "My License",
      permissions: { commercial_use: true },
    };
    const result = coerceToLicense(partial);
    expect(validateLicense(result).valid).toBe(true);
    expect(result.license_name).toBe("My License");
    expect(result.permissions.commercial_use).toBe(true);
    expect(typeof result.permissions.modification).toBe("boolean");
    expect(typeof result.requirements.credit_required).toBe("boolean");
    expect(typeof result.evidence.captured_at).toBe("string");
  });

  it("auto-derives license_id from license_name when missing", () => {
    const result = coerceToLicense({ license_name: "Foo" });
    expect(result.license_id.startsWith("Foo_")).toBe(true);
  });

  it("preserves valid fields and ignores wrong-typed fields", () => {
    const partial = {
      license_name: "Keep Me",
      license_id: "explicit-id",
      permissions: { commercial_use: "yes", modification: false },
      evidence: { notes: 123 },
    };
    const result = coerceToLicense(partial);
    expect(result.license_id).toBe("explicit-id");
    expect(result.permissions.commercial_use).toBe(false);
    expect(result.permissions.modification).toBe(false);
    expect(result.evidence.notes).toBe("");
    expect(validateLicense(result).valid).toBe(true);
  });
});
