import type { EagleLicense } from "@/types/license";

export const LICENSE_CONFIG_TAG = "license-config";

export const COMMERCIAL_TAG = "商用利用可能";
export const CREDIT_TAG = "クレジット不要";
export const MODIFICATION_TAG = "加工・改変自由";
export const LICENSE_NAME_TAG_PREFIX = "ライセンス:";

export function buildSearchTags(license: EagleLicense): string[] {
  const tags: string[] = [];
  if (license.permissions.commercial_use) tags.push(COMMERCIAL_TAG);
  if (!license.requirements.credit_required) tags.push(CREDIT_TAG);
  if (license.permissions.modification) tags.push(MODIFICATION_TAG);
  tags.push(`${LICENSE_NAME_TAG_PREFIX}${license.license_name}`);
  return tags;
}

export function buildLicenseConfigTags(_license: EagleLicense): string[] {
  return [LICENSE_CONFIG_TAG];
}

const MANAGED_TAG_VALUES = new Set<string>([
  COMMERCIAL_TAG,
  CREDIT_TAG,
  MODIFICATION_TAG,
]);

export function isManagedLicenseTag(tag: string): boolean {
  if (tag === LICENSE_CONFIG_TAG) return true;
  if (MANAGED_TAG_VALUES.has(tag)) return true;
  return tag.startsWith(LICENSE_NAME_TAG_PREFIX);
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
