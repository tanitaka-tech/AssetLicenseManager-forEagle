export const LICENSE_SCHEMA_VERSION = "eagle-license/v1" as const;

export type LicenseSchemaVersion = typeof LICENSE_SCHEMA_VERSION;

export type LicenseScope = "folder" | "asset";

export type LicenseStatus =
  | "active"
  | "deprecated"
  | "review_required"
  | "unknown";

export type AiTrainingPolicy = "allowed" | "prohibited" | "unknown";

export interface LicenseSource {
  provider: string;
  url: string;
  author?: string | null;
}

export interface LicensePermissions {
  commercial_use: boolean;
  modification: boolean;
  youtube: boolean;
  client_work: boolean;
}

export interface LicenseRequirements {
  credit_required: boolean;
  credit_text: string | null;
}

export interface LicenseRestrictions {
  redistribution_as_stock: boolean;
  ai_training: AiTrainingPolicy;
}

export interface LicenseEvidence {
  captured_at: string;
  license_page_url: string | null;
  snapshot_item_id: string | null;
  notes: string;
}

export interface EagleLicense {
  schema: LicenseSchemaVersion;
  scope: LicenseScope;
  license_id: string;
  license_name: string;
  source: LicenseSource;
  permissions: LicensePermissions;
  requirements: LicenseRequirements;
  restrictions: LicenseRestrictions;
  evidence: LicenseEvidence;
  inherit: boolean;
  priority: number;
  status: LicenseStatus;
}
