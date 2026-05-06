import { type CurrentLibrary, getCurrentLibrary } from "@/lib/pluginPaths";
import { useEffect, useState } from "react";

export function useCurrentLibrary() {
  const [library, setLibrary] = useState<CurrentLibrary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentLibrary()
      .then((value) => {
        if (!cancelled) setLibrary(value);
      })
      .catch(() => {
        if (!cancelled) setLibrary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return library;
}
