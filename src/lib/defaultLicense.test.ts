import {
  LICENSE_PRESETS,
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
