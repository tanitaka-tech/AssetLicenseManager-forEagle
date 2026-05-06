import schema from "@/schemas/eagle-license-v1.schema.json";
import addFormats from "ajv-formats";
import Ajv2020, { type ErrorObject } from "ajv/dist/2020";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validator = ajv.compile(schema);

export type LicenseValidationResult =
  | { valid: true; errors: null }
  | { valid: false; errors: ErrorObject[] };

export function validateLicense(input: unknown): LicenseValidationResult {
  const valid = validator(input);
  if (valid) return { valid: true, errors: null };
  return { valid: false, errors: validator.errors ?? [] };
}
