import type { EagleLicense } from "@/types/license";

export interface LicenseWarning {
  code: string;
  message: string;
}

export function collectLicenseWarnings(
  license: EagleLicense,
): LicenseWarning[] {
  const warnings: LicenseWarning[] = [];

  if (!license.source.url || license.source.url.trim() === "") {
    warnings.push({
      code: "source-url-missing",
      message: "元URL が未入力です。",
    });
  }

  if (
    license.requirements.credit_required &&
    (license.requirements.credit_text == null ||
      license.requirements.credit_text.trim() === "")
  ) {
    warnings.push({
      code: "credit-text-missing",
      message: "クレジット必須なのにクレジット表記が未入力です。",
    });
  }

  if (
    !license.evidence.license_page_url ||
    license.evidence.license_page_url.trim() === ""
  ) {
    warnings.push({
      code: "license-page-url-missing",
      message: "ライセンスページURL が未入力です。証跡として推奨されます。",
    });
  }

  return warnings;
}
