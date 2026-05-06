import { isEagleAvailable } from "@/lib/eagleNode";
import { useCallback, useEffect, useState } from "react";

export type EagleTheme = "LIGHT" | "GRAY" | "DARK" | "BLUE" | "PURPLE";

export interface EagleSelection {
  folder: EagleFolder | null;
  items: EagleItem[];
}

export function useEaglePlugin() {
  const [theme, setTheme] = useState<EagleTheme>("LIGHT");
  const [selection, setSelection] = useState<EagleSelection>({
    folder: null,
    items: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is intentionally used to retrigger
  useEffect(() => {
    if (!isEagleAvailable()) return;

    const handleThemeChange = (next: unknown) => {
      if (next === "Auto") {
        setTheme(eagle.app.isDarkColors() ? "GRAY" : "LIGHT");
        return;
      }
      setTheme(next as EagleTheme);
    };

    const refreshSelection = async () => {
      try {
        const [folders, items] = await Promise.all([
          eagle.folder.getSelected(),
          eagle.item.getSelected(),
        ]);
        setSelection({
          folder: folders[0] ?? null,
          items,
        });
      } catch (e) {
        console.warn("Failed to read Eagle selection:", e);
        setSelection({ folder: null, items: [] });
      }
    };

    eagle.onPluginCreate(async () => {
      handleThemeChange(eagle.app.theme);
      await refreshSelection();
    });

    if (typeof eagle.onPluginShow === "function") {
      eagle.onPluginShow(() => {
        void refreshSelection();
      });
    }

    eagle.onThemeChanged(handleThemeChange);

    void refreshSelection();
  }, [refreshKey]);

  return {
    theme,
    folder: selection.folder,
    items: selection.items,
    refresh,
  };
}
