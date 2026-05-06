import {
  type LicenseLookupResult,
  type LicenseServiceError,
  loadLicense,
} from "@/lib/licenseService";
import { useCallback, useEffect, useState } from "react";

export type FolderLicenseStatus = "idle" | "loading" | "ready" | "error";

export interface FolderLicenseState {
  status: FolderLicenseStatus;
  result: LicenseLookupResult | null;
  error: LicenseServiceError | Error | null;
}

export function useFolderLicense(folderId: string | undefined) {
  const [state, setState] = useState<FolderLicenseState>({
    status: "idle",
    result: null,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is intentionally used to retrigger
  useEffect(() => {
    if (!folderId) {
      setState({ status: "idle", result: null, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    loadLicense(folderId)
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", result, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          result: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [folderId, reloadKey]);

  return { ...state, reload };
}
