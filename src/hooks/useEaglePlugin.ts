import { useEffect, useState } from "react";

export type EagleTheme = "LIGHT" | "GRAY" | "DARK" | "BLUE" | "PURPLE";

export function useEaglePlugin() {
  const [theme, setTheme] = useState<EagleTheme>("LIGHT");
  const [folder, setFolder] = useState<EagleFolder | null>(null);

  useEffect(() => {
    const handleThemeChange = (theme: unknown) => {
      if (theme === "Auto") {
        setTheme(eagle.app.isDarkColors() ? "GRAY" : "LIGHT");
        return;
      }
      setTheme(theme as EagleTheme);
    };

    const findSelectedFolder = async () => {
      try {
        const folders = await eagle.folder.getSelected();
        setFolder(folders[0] ?? null);
      } catch (e) {
        console.warn("Failed to read selected folder:", e);
        setFolder(null);
      }
    };

    eagle.onPluginCreate(async () => {
      handleThemeChange(eagle.app.theme);
      await findSelectedFolder();
    });

    eagle.onThemeChanged(handleThemeChange);
  }, []);

  return { theme, folder };
}
