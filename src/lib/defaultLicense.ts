import { type EagleLicense, LICENSE_SCHEMA_VERSION } from "@/types/license";

export function todayIsoDate(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function newGuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += chars[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) out += "-";
  }
  return out;
}

export function generateLicenseId(name: string, existingId?: string): string {
  let guid: string | null = null;
  if (existingId) {
    const idx = existingId.lastIndexOf("_");
    if (idx !== -1) {
      const candidate = existingId.slice(idx + 1);
      if (UUID_RE.test(candidate)) guid = candidate;
    }
  }
  if (!guid) guid = newGuid();
  return `${name}_${guid}`;
}

export function createEmptyLicense(licenseName?: string): EagleLicense {
  const license_name = licenseName ?? "Unknown / 要確認";
  return {
    schema: LICENSE_SCHEMA_VERSION,
    license_id: generateLicenseId(license_name),
    license_name,
    source: {
      provider: "Unknown",
      url: "",
      author: null,
    },
    permissions: {
      commercial_use: false,
      modification: false,
    },
    requirements: {
      credit_required: false,
      credit_text: null,
    },
    restrictions: {
      redistribution_as_stock: true,
    },
    evidence: {
      captured_at: todayIsoDate(),
      license_page_url: null,
      notes: "",
    },
  };
}

function withName(name: string, patch: Partial<EagleLicense>): EagleLicense {
  return {
    ...createEmptyLicense(),
    license_name: name,
    license_id: generateLicenseId(name),
    ...patch,
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
    build: () =>
      withName("Original / 自作素材", {
        source: { provider: "Self", url: "", author: null },
        permissions: { commercial_use: true, modification: true },
        restrictions: { redistribution_as_stock: false },
      }),
  },
  {
    key: "client-provided",
    label: "Client Provided / クライアント提供素材",
    build: () =>
      withName("Client Provided / クライアント提供素材", {
        source: { provider: "Client", url: "", author: null },
        permissions: { commercial_use: true, modification: true },
        restrictions: { redistribution_as_stock: true },
      }),
  },
  {
    key: "royalty-free",
    label: "Royalty Free / 汎用ロイヤリティフリー",
    build: () =>
      withName("Royalty Free / 汎用ロイヤリティフリー", {
        source: { provider: "Royalty Free", url: "", author: null },
        permissions: { commercial_use: true, modification: true },
        restrictions: { redistribution_as_stock: true },
      }),
  },
  {
    key: "cc0",
    label: "CC0",
    build: () =>
      withName("CC0 1.0", {
        source: {
          provider: "Creative Commons",
          url: "https://creativecommons.org/publicdomain/zero/1.0/",
          author: null,
        },
        permissions: { commercial_use: true, modification: true },
        restrictions: { redistribution_as_stock: false },
      }),
  },
  {
    key: "cc-by-4.0",
    label: "CC BY 4.0",
    build: () =>
      withName("CC BY 4.0", {
        source: {
          provider: "Creative Commons",
          url: "https://creativecommons.org/licenses/by/4.0/",
          author: null,
        },
        permissions: { commercial_use: true, modification: true },
        requirements: { credit_required: true, credit_text: null },
        restrictions: { redistribution_as_stock: true },
      }),
  },
  {
    key: "pixabay-content-license",
    label: "Pixabay Content License",
    build: () =>
      withName("Pixabay Content License", {
        source: {
          provider: "Pixabay",
          url: "https://pixabay.com/service/license-summary/",
          author: null,
        },
        permissions: { commercial_use: true, modification: true },
        restrictions: { redistribution_as_stock: true },
      }),
  },
  {
    key: "custom",
    label: "Custom",
    build: () =>
      withName("Custom", {
        source: { provider: "Custom", url: "", author: null },
      }),
  },
];
