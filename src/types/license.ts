export const LICENSE_SCHEMA_VERSION = "eagle-license/v1" as const;

export type LicenseSchemaVersion = typeof LICENSE_SCHEMA_VERSION;

export interface LicenseSource {
  provider: string;
  url: string;
  author?: string | null;
}

export interface LicensePermissions {
  commercial_use: boolean;
  modification: boolean;
}

export interface LicenseRequirements {
  credit_required: boolean;
  credit_text: string | null;
}

export interface LicenseRestrictions {
  redistribution_as_stock: boolean;
}

export interface LicenseEvidence {
  captured_at: string;
  license_page_url: string | null;
  notes: string;
}

export interface EagleLicense {
  schema: LicenseSchemaVersion;
  license_id: string;
  license_name: string;
  source: LicenseSource;
  permissions: LicensePermissions;
  requirements: LicenseRequirements;
  restrictions: LicenseRestrictions;
  evidence: LicenseEvidence;
}
