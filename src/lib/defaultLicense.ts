import { type EagleLicense, LICENSE_SCHEMA_VERSION } from "@/types/license";

export function todayIsoDate(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function createEmptyLicense(): EagleLicense {
  return {
    schema: LICENSE_SCHEMA_VERSION,
    scope: "folder",
    license_id: "unknown",
    license_name: "Unknown / 要確認",
    source: {
      provider: "Unknown",
      url: "",
      author: null,
    },
    permissions: {
      commercial_use: false,
      modification: false,
      youtube: false,
      client_work: false,
    },
    requirements: {
      credit_required: false,
      credit_text: null,
    },
    restrictions: {
      redistribution_as_stock: true,
      ai_training: "unknown",
    },
    evidence: {
      captured_at: todayIsoDate(),
      license_page_url: null,
      snapshot_item_id: null,
      notes: "",
    },
    inherit: true,
    priority: 100,
    status: "unknown",
  };
}

export interface LicensePreset {
  key: string;
  label: string;
  build: () => EagleLicense;
}

export const LICENSE_PRESETS: LicensePreset[] = [
  {
    key: "unknown",
    label: "Unknown / 要確認",
    build: () => createEmptyLicense(),
  },
  {
    key: "original",
    label: "Original / 自作素材",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "original",
      license_name: "Original / 自作素材",
      source: { provider: "Self", url: "", author: null },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      restrictions: {
        redistribution_as_stock: false,
        ai_training: "allowed",
      },
      status: "active",
    }),
  },
  {
    key: "client-provided",
    label: "Client Provided / クライアント提供素材",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "client-provided",
      license_name: "Client Provided / クライアント提供素材",
      source: { provider: "Client", url: "", author: null },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      restrictions: {
        redistribution_as_stock: true,
        ai_training: "prohibited",
      },
      status: "review_required",
    }),
  },
  {
    key: "royalty-free",
    label: "Royalty Free / 汎用ロイヤリティフリー",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "royalty-free",
      license_name: "Royalty Free / 汎用ロイヤリティフリー",
      source: { provider: "Royalty Free", url: "", author: null },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      restrictions: {
        redistribution_as_stock: true,
        ai_training: "unknown",
      },
      status: "active",
    }),
  },
  {
    key: "cc0",
    label: "CC0",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "cc0-1.0",
      license_name: "CC0 1.0",
      source: {
        provider: "Creative Commons",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
        author: null,
      },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      restrictions: {
        redistribution_as_stock: false,
        ai_training: "allowed",
      },
      status: "active",
    }),
  },
  {
    key: "cc-by-4.0",
    label: "CC BY 4.0",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "cc-by-4.0",
      license_name: "CC BY 4.0",
      source: {
        provider: "Creative Commons",
        url: "https://creativecommons.org/licenses/by/4.0/",
        author: null,
      },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      requirements: {
        credit_required: true,
        credit_text: null,
      },
      restrictions: {
        redistribution_as_stock: true,
        ai_training: "allowed",
      },
      status: "active",
    }),
  },
  {
    key: "pixabay-content-license",
    label: "Pixabay Content License",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "pixabay-content-license",
      license_name: "Pixabay Content License",
      source: {
        provider: "Pixabay",
        url: "https://pixabay.com/service/license-summary/",
        author: null,
      },
      permissions: {
        commercial_use: true,
        modification: true,
        youtube: true,
        client_work: true,
      },
      restrictions: {
        redistribution_as_stock: true,
        ai_training: "unknown",
      },
      status: "active",
    }),
  },
  {
    key: "custom",
    label: "Custom",
    build: () => ({
      ...createEmptyLicense(),
      license_id: "custom",
      license_name: "Custom",
      source: { provider: "Custom", url: "", author: null },
      status: "review_required",
    }),
  },
];
