import type { EagleLicense, LicenseStatus } from "@/types/license";

export const LICENSE_CONFIG_TAG = "license-config";

function commercialTag(license: EagleLicense): string {
  return license.permissions.commercial_use ? "commercial:ok" : "commercial:ng";
}

function creditTag(license: EagleLicense): string {
  return license.requirements.credit_required
    ? "credit:required"
    : "credit:not-required";
}

function statusTag(status: LicenseStatus): string {
  const normalized = status.replace(/_/g, "-");
  return `license-status:${normalized}`;
}

export function buildLicenseConfigTags(license: EagleLicense): string[] {
  return [
    LICENSE_CONFIG_TAG,
    `scope:${license.scope}`,
    `license:${license.license_id}`,
    commercialTag(license),
    creditTag(license),
    statusTag(license.status),
  ];
}

export function buildFolderTags(license: EagleLicense): string[] {
  return [
    `license:${license.license_id}`,
    commercialTag(license),
    creditTag(license),
    `inherit-license:${license.inherit ? "true" : "false"}`,
  ];
}

export function buildAssetTags(
  license: EagleLicense,
  options: { inherited?: boolean } = {},
): string[] {
  const tags = [
    `license:${license.license_id}`,
    commercialTag(license),
    creditTag(license),
  ];
  if (options.inherited ?? true) {
    tags.unshift("license:inherited");
  }
  return tags;
}

const MANAGED_TAG_PREFIXES = [
  "license:",
  "commercial:",
  "credit:",
  "scope:",
  "license-status:",
  "inherit-license:",
];

export function isManagedLicenseTag(tag: string): boolean {
  if (tag === LICENSE_CONFIG_TAG) return true;
  return MANAGED_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix));
}

export function mergeManagedTags(
  existing: readonly string[],
  managed: readonly string[],
): string[] {
  const kept = existing.filter((tag) => !isManagedLicenseTag(tag));
  const seen = new Set(kept);
  for (const tag of managed) {
    if (!seen.has(tag)) {
      kept.push(tag);
      seen.add(tag);
    }
  }
  return kept;
}
