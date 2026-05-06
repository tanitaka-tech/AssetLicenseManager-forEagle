import { getFs, getPath, isEagleAvailable } from "@/lib/eagleNode";

export const PLUGIN_DATA_DIR = ".eagle-license-manager";

export class PluginPathError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function libraryPath(): string {
  if (!isEagleAvailable()) {
    throw new PluginPathError(
      "eagle-unavailable",
      "Eagle Plugin API が利用できません",
    );
  }
  const path = eagle.library.path;
  if (!path) {
    throw new PluginPathError(
      "library-path-missing",
      "現在のライブラリパスが取得できません",
    );
  }
  return path;
}

function joinAndEnsureSync(...parts: string[]): string {
  const path = getPath();
  if (!path) {
    throw new PluginPathError(
      "fs-unavailable",
      "Node.js path API が利用できません",
    );
  }
  return path.join(...parts);
}

export function pluginRoot(): string {
  return joinAndEnsureSync(libraryPath(), PLUGIN_DATA_DIR);
}

export function backupsDir(folderId: string): string {
  return joinAndEnsureSync(pluginRoot(), "backups", folderId);
}

export function historyFile(folderId: string): string {
  return joinAndEnsureSync(pluginRoot(), "history", `${folderId}.jsonl`);
}

export function mcpDir(): string {
  return joinAndEnsureSync(pluginRoot(), "mcp");
}

export function exportsDir(): string {
  return joinAndEnsureSync(pluginRoot(), "exports");
}

export async function ensureDir(dir: string): Promise<void> {
  const fs = getFs();
  if (!fs) {
    throw new PluginPathError(
      "fs-unavailable",
      "Node.js fs API が利用できません",
    );
  }
  await fs.mkdir(dir, { recursive: true });
}

export interface CurrentLibrary {
  name: string;
  path: string;
}

export async function getCurrentLibrary(): Promise<CurrentLibrary | null> {
  if (!isEagleAvailable()) return null;
  const lib = eagle.library;
  let name = lib.name;
  let p = lib.path;
  if (typeof lib.info === "function") {
    try {
      const info = await lib.info();
      name = info.name;
      p = info.path;
    } catch {
      // fall back to direct fields
    }
  }
  if (!p) return null;
  if (!name) {
    const path = getPath();
    name = path ? path.basename(p) : p;
  }
  return { name, path: p };
}
