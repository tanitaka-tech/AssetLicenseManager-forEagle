import { backupFileName, backupTimestamp } from "@/lib/backup";
import { describe, expect, it } from "vitest";

describe("backupTimestamp", () => {
  it("formats as YYYYMMDD-HHmmss", () => {
    const ts = backupTimestamp(new Date("2026-05-06T07:08:09Z"));
    expect(ts).toMatch(/^\d{8}-\d{6}$/);
  });
});

describe("backupFileName", () => {
  it("produces .eagle-license.backup.<ts>.json", () => {
    expect(backupFileName("20260506-153000")).toBe(
      ".eagle-license.backup.20260506-153000.json",
    );
  });
});
